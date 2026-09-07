import { z } from "zod";
import { authedOrApiKeyQuery, publicQuery } from "./middleware";
import { createRouter } from "./middleware";
import { getDb } from "./queries/connection";
import { televendeurs, leadsDistribues } from "@db/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";

const router = createRouter({
  distribuer: publicQuery
    .input(
      z.object({
        leadId: z.string().min(1, "ID lead requis"),
        score: z.number().min(0).max(100).default(50),
        type: z.enum(["B2B", "B2C"]).default("B2C"),
        marche: z.enum(["FR", "TN"]).default("TN"),
        besoins: z.array(z.string()).optional().default([]),
      }),
    )
    .mutation(async ({ input }) => {
      const { leadId, score, type, marche, besoins } = input;
      const db = getDb();

      const allTelevendeurs = await db.select()
        .from(televendeurs)
        .where(and(eq(televendeurs.actif, true), eq(televendeurs.marche, marche)));

      let assignedTelevendeur: typeof allTelevendeurs[0] | null = null;
      let priorite: "haute" | "moyenne" | "basse" = "moyenne";
      let action: "appel_immediat" | "appel_journee" | "email_nurturing" | "rappel_7j" = "appel_journee";
      let delai = "24h";

      if (score < 40) {
        action = "email_nurturing";
        delai = "7j";
        priorite = "basse";
      } else if (type === "B2B" && marche === "FR") {
        const senior = allTelevendeurs.find(t => t.type === "senior" && t.specialite === "B2B");
        assignedTelevendeur = senior || allTelevendeurs[0] || null;
        action = score >= 75 ? "appel_immediat" : "appel_journee";
        delai = score >= 75 ? "2h" : "24h";
        priorite = score >= 75 ? "haute" : "moyenne";
      } else if (type === "B2C" && marche === "TN") {
        const juniors = allTelevendeurs.filter(t => t.type === "junior");
        if (juniors.length > 0) {
          const loads = await Promise.all(
            juniors.map(async t => {
              const c = await db.select({ count: count() })
                .from(leadsDistribues)
                .where(and(eq(leadsDistribues.televendeurId, t.id), eq(leadsDistribues.statut, "assigne")));
              return { ...t, load: c[0]?.count || 0 };
            })
          );
          loads.sort((a, b) => a.load - b.load);
          assignedTelevendeur = loads[0];
        } else {
          assignedTelevendeur = allTelevendeurs[0] || null;
        }
        action = score >= 75 ? "appel_immediat" : "appel_journee";
        delai = score >= 75 ? "2h" : "24h";
        priorite = score >= 75 ? "haute" : "moyenne";
      } else {
        assignedTelevendeur = allTelevendeurs[0] || null;
        action = score >= 75 ? "appel_immediat" : "appel_journee";
        delai = score >= 75 ? "2h" : "24h";
        priorite = score >= 75 ? "haute" : score >= 40 ? "moyenne" : "basse";
      }

      await db.insert(leadsDistribues).values({
        leadId,
        score,
        type,
        marche,
        besoins: besoins.join(", "),
        televendeurId: assignedTelevendeur?.id || null,
        priorite,
        action,
        delai,
        statut: assignedTelevendeur ? "assigne" : "en_attente",
        assignedAt: assignedTelevendeur ? new Date() : null,
      });

      return {
        leadId,
        televendeurId: assignedTelevendeur?.nom || null,
        priorite,
        action,
        delai,
        message: assignedTelevendeur
          ? `Lead assigné à ${assignedTelevendeur.nom} (${assignedTelevendeur.type})`
          : "Lead en attente de télévendeur disponible",
      };
    }),

  fileAttente: publicQuery.query(async () => {
    const db = getDb();
    const leads = await db.select()
      .from(leadsDistribues)
      .where(eq(leadsDistribues.statut, "en_attente"))
      .orderBy(desc(leadsDistribues.score));

    return leads.map(lead => {
      const attenteMs = lead.createdAt ? Date.now() - new Date(lead.createdAt).getTime() : 0;
      const heures = Math.floor(attenteMs / (1000 * 60 * 60));
      const jours = Math.floor(heures / 24);
      const attenteStr = jours > 0 ? `${jours}j ${heures % 24}h` : `${heures}h`;
      return {
        leadId: lead.leadId,
        nom: lead.nom || "Lead " + lead.leadId.slice(-6),
        score: lead.score || 0,
        priorite: lead.priorite || "moyenne",
        attenteDepuis: attenteStr,
      };
    });
  }),

  reprendre: publicQuery
    .input(z.object({ leadId: z.string().min(1, "ID lead requis"), raison: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { leadId, raison } = input;
      const db = getDb();

      const existing = await db.select().from(leadsDistribues).where(eq(leadsDistribues.leadId, leadId)).limit(1);
      if (existing.length === 0) throw new Error("Lead non trouvé");

      const lead = existing[0];
      const marche = lead.marche || "TN";

      const allTelevendeurs = await db.select()
        .from(televendeurs)
        .where(and(eq(televendeurs.actif, true), eq(televendeurs.marche, marche)));

      const autres = allTelevendeurs.filter(t => t.id !== lead.televendeurId);
      const nouveau = autres.length > 0 ? autres[0] : allTelevendeurs[0];

      if (!nouveau) throw new Error("Aucun télévendeur disponible");

      await db.update(leadsDistribues)
        .set({
          televendeurId: nouveau.id,
          statut: "assigne",
          assignedAt: new Date(),
          notes: (lead.notes || "") + "\n[Redistribution] " + (raison || "Réassignation automatique") + "\n",
          updatedAt: new Date(),
        })
        .where(eq(leadsDistribues.leadId, leadId));

      return {
        leadId,
        televendeurId: nouveau.nom,
        priorite: lead.priorite || "moyenne",
        action: lead.action || "appel_journee",
        delai: lead.delai || "24h",
        message: `Lead réassigné à ${nouveau.nom}`,
      };
    }),

  stats: publicQuery
    .input(z.object({ periode: z.enum(["7j", "30j", "90j"]).default("30j") }))
    .query(async ({ input }) => {
      const { periode } = input;
      const db = getDb();
      const jours = periode === "7j" ? 7 : periode === "30j" ? 30 : 90;
      const depuis = new Date(Date.now() - jours * 24 * 60 * 60 * 1000);

      const totalResult = await db.select({ count: count() })
        .from(leadsDistribues)
        .where(sql`${leadsDistribues.createdAt} >= ${depuis}`);
      const totalDistribues = totalResult[0]?.count || 0;

      const attenteResult = await db.select({
        avgDiff: sql`AVG(CASE WHEN ${leadsDistribues.assignedAt} IS NOT NULL THEN (julianday(${leadsDistribues.assignedAt}) - julianday(${leadsDistribues.createdAt})) * 24 ELSE NULL END)`
      }).from(leadsDistribues)
        .where(sql`${leadsDistribues.createdAt} >= ${depuis} AND ${leadsDistribues.assignedAt} IS NOT NULL`);
      const tauxAttenteMoyen = attenteResult[0]?.avgDiff
        ? Math.round(Number(attenteResult[0].avgDiff)) + "h"
        : "0h";

      const redistResult = await db.select({ count: count() })
        .from(leadsDistribues)
        .where(and(sql`${leadsDistribues.createdAt} >= ${depuis}`, sql`${leadsDistribues.notes} LIKE '%Redistribution%'`));
      const tauxRedistribution = totalDistribues > 0
        ? Math.round((redistResult[0]?.count || 0) / totalDistribues * 100)
        : 0;

      const convResult = await db.select({ count: count() })
        .from(leadsDistribues)
        .where(and(sql`${leadsDistribues.createdAt} >= ${depuis}`, eq(leadsDistribues.statut, "converti")));
      const tauxConversionPostDistrib = totalDistribues > 0
        ? Math.round((convResult[0]?.count || 0) / totalDistribues * 100)
        : 0;

      return { periode, totalDistribues, tauxAttenteMoyen, tauxRedistribution, tauxConversionPostDistrib };
    }),

  listerTelevendeurs: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(televendeurs).orderBy(televendeurs.nom);
  }),

  ajouterTelevendeur: publicQuery
    .input(z.object({
      nom: z.string().min(1),
      email: z.string().email().optional(),
      type: z.enum(["senior", "junior"]).default("junior"),
      marche: z.enum(["FR", "TN"]).default("TN"),
      specialite: z.enum(["B2B", "B2C", "mixte"]).default("mixte"),
      chargeMax: z.number().default(20),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const inserted = await db.insert(televendeurs).values(input).returning();
      return { success: true, televendeur: inserted[0] };
    }),

  supprimerTelevendeur: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(televendeurs).set({ actif: false }).where(eq(televendeurs.id, input.id));
      return { success: true };
    }),
});

export type SamRouter = typeof router;
export { router as samRouter };
