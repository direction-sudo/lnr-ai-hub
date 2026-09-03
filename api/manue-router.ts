import { z } from "zod";
import { createRouter, publicQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { televendeurs, callRecords } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const manueRouter = createRouter({
  // ─── État du plateau temps réel ───
  teamStatus: publicQuery
    .query(async () => {
      const db = getDb();
      const team = await db.select().from(televendeurs).orderBy(desc(televendeurs.lastActivityAt));
      return team.map(t => ({
        id: t.id,
        nom: t.name,
        statut: t.status,
        appelsAujourdhui: t.callsToday ?? 0,
        dureeMoyenne: t.avgCallDuration ?? 0,
        tauxConversion: t.conversionRate ?? 0,
        derniereActivite: t.lastActivityAt,
      }));
    }),

  // ─── Performance individuelle ───
  performance: publicQuery
    .input(z.object({ televendeurId: z.string().uuid() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [tele] = await db.select().from(televendeurs).where(eq(televendeurs.id, input.televendeurId));
      const calls = await db.select().from(callRecords)
        .where(eq(callRecords.televendeurId, input.televendeurId))
        .orderBy(desc(callRecords.startedAt))
        .limit(50);
      const totalCalls = calls.length;
      const answeredCalls = calls.filter(c => c.status === "answered").length;
      const avgDuration = totalCalls > 0
        ? Math.round(calls.reduce((s, c) => s + (c.duration ?? 0), 0) / totalCalls)
        : 0;
      return {
        televendeur: tele ?? null,
        kpi: {
          totalAppels: totalCalls,
          tauxDecroche: totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0,
          dureeMoyenne: avgDuration,
          rdvPris: calls.filter(c => c.rdvBooked).length,
          tauxConversion: tele?.conversionRate ?? 0,
        },
        historique: calls.slice(0, 10),
      };
    }),

  // ─── Alerte automatique ───
  alerte: publicQuery
    .input(z.object({
      type: z.enum(["appels_bas", "conversion_bas", "absence", "file_attente"]),
      televendeurId: z.string().uuid().optional(),
      seuil: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      let message = "";
      let priorite = "moyenne";
      if (input.type === "appels_bas") {
        message = `Taux d'appels inférieur au seuil (${input.seuil ?? 10}/heure)`;
        priorite = "haute";
      } else if (input.type === "conversion_bas") {
        message = `Taux de conversion < ${input.seuil ?? 5}% — coaching recommandé`;
        priorite = "haute";
      } else if (input.type === "absence") {
        message = "Télévendeur non connecté depuis > 15 min";
        priorite = "critique";
      } else if (input.type === "file_attente") {
        message = "File d'attente > 5 appels en attente";
        priorite = "critique";
      }
      return { type: input.type, message, priorite, createdAt: new Date().toISOString(), status: "actif" };
    }),

  // ─── Coaching automatisé ───
  coaching: publicQuery
    .input(z.object({ televendeurId: z.string().uuid() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [tele] = await db.select().from(televendeurs).where(eq(televendeurs.id, input.televendeurId));
      const recommandations = [];
      if ((tele?.conversionRate ?? 0) < 5) recommandations.push("Revoir le script de closing — taux de conversion faible");
      if ((tele?.avgCallDuration ?? 0) < 120) recommandations.push("Allonger la durée d'appel — qualification insuffisante");
      if ((tele?.callsToday ?? 0) < 20) recommandations.push("Augmenter le volume d'appels — objectif 30/jour");
      return { televendeurId: input.televendeurId, recommandations, date: new Date().toISOString() };
    }),
});
