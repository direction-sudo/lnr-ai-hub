import { z } from "zod";
import { createRouter, publicQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { appointments, dossiers, dossierDocuments } from "@db/schema";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

// ─── Schemas Zod ───
const QualificationInput = z.object({
  leadId: z.string().uuid(),
  source: z.enum(["landing_page", "appel_entrant", "webhook_pipedrive", "prospection_bastien"]),
  revenusAnnuels: z.number().min(0).optional(),
  patrimoineEstime: z.number().min(0).optional(),
  besoins: z.array(z.enum(["retraite", "prevoyance", "mutuelle", "epargne", "immobilier", "succession"])),
  urgence: z.enum(["immediate", "3_mois", "6_mois", "1_an", "non_defini"]),
  situationFamiliale: z.enum(["celibataire", "marie", "pacse", "divorce", "veuf"]).optional(),
  age: z.number().int().min(18).max(120).optional(),
  notesAgent: z.string().max(2000).optional(),
});

const RdvInput = z.object({
  leadId: z.string().uuid(),
  qualificationId: z.string().uuid(),
  date: z.string().datetime(),
  dureeMinutes: z.number().int().min(15).max(120).default(30),
  type: z.enum(["visio", "telephone", "physique"]),
  agentTelevendeurId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// ─── Helper scoring ───
function calculateScore(input: z.infer<typeof QualificationInput>) {
  let score = 0;
  // Revenus (25 pts)
  const rev = input.revenusAnnuels ?? 0;
  if (rev > 80000) score += 25;
  else if (rev > 50000) score += 18;
  else if (rev > 30000) score += 12;
  else score += 5;
  // Patrimoine (25 pts)
  const pat = input.patrimoineEstime ?? 0;
  if (pat > 500000) score += 25;
  else if (pat > 200000) score += 18;
  else if (pat > 50000) score += 10;
  else score += 5;
  // Besoins (25 pts)
  const besoinsCount = input.besoins.length;
  if (besoinsCount >= 3) score += 25;
  else if (besoinsCount === 2) score += 16;
  else if (besoinsCount === 1) score += 8;
  // Urgence (25 pts)
  const urgenceMap: Record<string, number> = {
    immediate: 25,
    "3_mois": 18,
    "6_mois": 10,
    "1_an": 5,
    non_defini: 0,
  };
  score += urgenceMap[input.urgence] ?? 0;

  let segment: string;
  if (score >= 75) segment = "premium";
  else if (score >= 60) segment = "standard";
  else if (score >= 40) segment = "nurturing";
  else segment = "non_qualifie";

  const actionMap: Record<string, string> = {
    premium: "rdv_prioritaire",
    standard: "rdv_standard",
    nurturing: "email_nurturing",
    non_qualifie: "disqualifier",
  };

  return {
    scoreGlobal: score,
    segment,
    prochaineAction: actionMap[segment],
    breakdown: {
      revenus: Math.min(25, rev > 80000 ? 25 : rev > 50000 ? 18 : rev > 30000 ? 12 : 5),
      patrimoine: Math.min(25, pat > 500000 ? 25 : pat > 200000 ? 18 : pat > 50000 ? 10 : 5),
      besoinsAdéquation: besoinsCount >= 3 ? 25 : besoinsCount === 2 ? 16 : besoinsCount === 1 ? 8 : 0,
      urgence: urgenceMap[input.urgence] ?? 0,
    },
  };
}

export const patrimoineRouter = createRouter({
  // ─── Qualifier un lead ───
  qualifier: publicQuery
    .input(QualificationInput)
    .mutation(async ({ input }) => {
      const scoring = calculateScore(input);
      return {
        leadId: input.leadId,
        ...scoring,
        recommandation: `Segment ${scoring.segment} — action: ${scoring.prochaineAction}`,
        createdAt: new Date().toISOString(),
      };
    }),

  // ─── Recalculer scoring ───
  scoring: publicQuery
    .input(z.object({ leadId: z.string().uuid() }))
    .query(async ({ input }) => {
      // En production : récupérer les données du lead en DB
      return { leadId: input.leadId, scoreGlobal: 0, segment: "inconnu", message: "Recalcul à implémenter avec données DB" };
    }),

  // ─── Liste créneaux disponibles ───
  calendrierList: publicQuery
    .input(z.object({ dateFrom: z.string().datetime(), dateTo: z.string().datetime(), agentId: z.string().uuid().optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(appointments)
        .where(and(gte(appointments.date, new Date(input.dateFrom)), lte(appointments.date, new Date(input.dateTo))))
        .orderBy(desc(appointments.date));
      return rows;
    }),

  // ─── Créer un RDV ───
  rdvCreate: publicQuery
    .input(RdvInput)
    .mutation(async ({ input }) => {
      const db = getDb();
      const [row] = await db.insert(appointments).values({
        leadId: input.leadId,
        date: new Date(input.date),
        duration: input.dureeMinutes,
        type: input.type,
        agentId: input.agentTelevendeurId,
        notes: input.notes,
        status: "planifie",
      }).returning();
      return row;
    }),

  // ─── Mettre à jour un RDV ───
  rdvUpdate: publicQuery
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["planifie", "confirme", "annule", "reporte", "realise"]), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [row] = await db.update(appointments)
        .set({ status: input.status, notes: input.notes, updatedAt: new Date() })
        .where(eq(appointments.id, input.id))
        .returning();
      return row;
    }),

  // ─── Créer un dossier ───
  dossierCreate: publicQuery
    .input(z.object({ leadId: z.string().uuid(), appointmentId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [row] = await db.insert(dossiers).values({
        leadId: input.leadId,
        appointmentId: input.appointmentId,
        status: "en_cours",
        createdAt: new Date(),
      }).returning();
      return row;
    }),

  // ─── Récupérer un dossier ───
  dossierGet: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const dossier = await db.select().from(dossiers).where(eq(dossiers.id, input.id));
      const docs = await db.select().from(dossierDocuments).where(eq(dossierDocuments.dossierId, input.id));
      return { dossier: dossier[0] ?? null, documents: docs };
    }),

  // ─── Stats patrimoine ───
  stats: publicQuery
    .input(z.object({ periode: z.enum(["7j", "30j", "90j"]).default("30j") }))
    .query(async ({ input }) => {
      // En production : agrégation réelle depuis la DB
      return {
        periode: input.periode,
        tauxConversion: 12.5,
        scoreMoyen: 68,
        rdvParJour: 4.2,
        premiumCount: 15,
        standardCount: 32,
        nurturingCount: 48,
      };
    }),
});
