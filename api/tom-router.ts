import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";

export const tomRouter = createRouter({
  appelEntrant: authedQuery
    .input(z.object({
      numero: z.string(),
      heure: z.string().datetime(),
      duree: z.number().int().min(0),
      transcription: z.string().optional(),
      optIn: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      if (!input.optIn) {
        return {
          action: "refus_polie",
          transfert: false,
          notes: "Client sans opt-in — appel refuse conformement a la loi",
          message: "Je suis desole, nous ne pouvons pas poursuivre sans votre consentement ecrit. Souhaitez-vous etre rappelé via notre formulaire en ligne ?",
        };
      }

      // Analyse simple de la transcription
      const texte = (input.transcription || "").toLowerCase();
      let action = "qualification";
      let transfert = false;
      let transfertVers = null;

      if (texte.includes("entreprise") || texte.includes("sarl") || texte.includes("societe")) {
        action = "transfert_b2b";
        transfert = true;
        transfertVers = "marouane";
      } else if (texte.includes("mutuelle") || texte.includes("sante")) {
        action = "transfert_b2c";
        transfert = true;
        transfertVers = "recrue_dispo";
      } else if (texte.includes("reclamation") || texte.includes("plainte")) {
        action = "transfert_gestionnaire";
        transfert = true;
        transfertVers = "gestionnaire";
      }

      return {
        action,
        transfert,
        transfertVers,
        notes: `Appel analyse — action: ${action}`,
        scoreConfiance: 85,
        contexte: { besoin: "a_qualifier", urgence: "standard" },
      };
    }),

  transfert: authedQuery
    .input(z.object({
      appelId: z.string(),
      televendeurId: z.string(),
      contexte: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        appelId: input.appelId,
        televendeurId: input.televendeurId,
        statut: "transfere",
        delaiTransfert: "4s",
        contexteTransmis: input.contexte || "Aucun contexte",
        timestamp: new Date().toISOString(),
      };
    }),

  statsJour: authedQuery
    .input(z.object({ date: z.string().datetime().optional() }))
    .query(async ({ input }) => {
      return {
        date: input.date || new Date().toISOString(),
        appelsTotal: 45,
        decroches: 38,
        tauxDecroche: 84,
        transferts: 12,
        tauxTransfert: 32,
        dureeMoyenne: 145,
        satisfaction: 4.2,
      };
    }),
});
