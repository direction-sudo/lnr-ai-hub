import { z } from "zod";
import { createRouter, authedQuery, authedQuery } from "./middleware";

const TELEVENDEURS = [
  { id: "marouane", nom: "Marouane", type: "senior", marche: "FR", actif: true, charge: 0 },
  { id: "recrue-1", nom: "Recrue 1", type: "junior", marche: "TN", actif: true, charge: 2 },
  { id: "recrue-2", nom: "Recrue 2", type: "junior", marche: "TN", actif: true, charge: 1 },
  { id: "recrue-3", nom: "Recrue 3", type: "junior", marche: "TN", actif: true, charge: 3 },
  { id: "recrue-4", nom: "Recrue 4", type: "junior", marche: "TN", actif: true, charge: 0 },
  { id: "recrue-5", nom: "Recrue 5", type: "junior", marche: "TN", actif: true, charge: 1 },
  { id: "recrue-6", nom: "Recrue 6", type: "junior", marche: "TN", actif: true, charge: 2 },
  { id: "recrue-7", nom: "Recrue 7", type: "junior", marche: "TN", actif: true, charge: 1 },
];

export const samRouter = createRouter({
  distribuer: authedQuery
    .input(z.object({
      leadId: z.string().uuid(),
      score: z.number().int().min(0).max(100),
      type: z.enum(["B2B", "B2C"]),
      marche: z.enum(["FR", "TN"]),
      besoins: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      let televendeurId: string | null = null;
      let priorite: string = "moyenne";
      let action: string = "rdv";

      if (input.score < 40) {
        action = "email_nurturing";
        priorite = "basse";
      } else if (input.type === "B2B" && input.marche === "FR") {
        televendeurId = "marouane";
        priorite = input.score >= 75 ? "haute" : "moyenne";
      } else if (input.type === "B2C" && input.marche === "TN") {
        // Rotation : télévendeur le moins chargé
        const dispo = TELEVENDEURS.filter(t => t.type === "junior" && t.actif);
        const moinsCharge = dispo.sort((a, b) => a.charge - b.charge)[0];
        televendeurId = moinsCharge?.id ?? null;
        priorite = input.score >= 75 ? "haute" : "moyenne";
      }

      return {
        leadId: input.leadId,
        televendeurId,
        priorite,
        action,
        delai: input.score >= 75 ? "2h" : input.score >= 60 ? "24h" : "7j",
        assignedAt: new Date().toISOString(),
      };
    }),

  fileAttente: authedQuery
    .query(async () => {
      return [
        { leadId: "lead-001", nom: "Mme Dupont", score: 72, attenteDepuis: "08:30", priorite: "moyenne" },
        { leadId: "lead-002", nom: "M. Martin", score: 85, attenteDepuis: "08:15", priorite: "haute" },
      ];
    }),

  reprendre: authedQuery
    .input(z.object({ leadId: z.string().uuid(), raison: z.string().optional() }))
    .mutation(async ({ input }) => {
      return {
        leadId: input.leadId,
        nouveauTelevendeurId: "recrue-4",
        raison: input.raison || "Redistribution automatique — delai depasse",
        repriisAt: new Date().toISOString(),
      };
    }),

  stats: authedQuery
    .input(z.object({ periode: z.enum(["7j", "30j", "90j"]).default("30j") }))
    .query(async ({ input }) => {
      return {
        periode: input.periode,
        totalDistribues: 145,
        tauxAttenteMoyen: "3h12",
        tauxRedistribution: 8.5,
        tauxConversionPostDistrib: 12.3,
      };
    }),
});
