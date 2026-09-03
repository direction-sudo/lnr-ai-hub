import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { televendeurs } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const ronyRouter = createRouter({
  pointage: publicQuery
    .input(z.object({
      televendeurId: z.string().uuid(),
      type: z.enum(["arrivee", "depart", "pause", "retour"]),
    }))
    .mutation(async ({ input }) => {
      const now = new Date();
      const heure = now.getHours() * 60 + now.getMinutes();
      const limite = 9 * 60 + 15; // 9h15

      let statut = "ok";
      let alerte = false;

      if (input.type === "arrivee" && heure > limite) {
        statut = "retard";
        alerte = true;
      }

      return {
        televendeurId: input.televendeurId,
        type: input.type,
        heure: now.toISOString(),
        statut,
        alerte,
        message: alerte ? "Retard detecte — gestionnaire notifiee" : "Pointage OK",
      };
    }),

  alertesRetard: publicQuery
    .query(async () => {
      return [
        { televendeurId: "recrue-3", nom: "Recrue 3", heure: "09:22", retard: "7 min", statut: "retard" },
      ];
    }),

  planning: publicQuery
    .input(z.object({ semaine: z.string().optional() }))
    .query(async ({ input }) => {
      return {
        semaine: input.semaine || "S36",
        lundi: [{ nom: "Marouane", creneau: "9h-18h" }, { nom: "Recrue 1", creneau: "9h-18h" }],
        mardi: [{ nom: "Marouane", creneau: "9h-18h" }, { nom: "Recrue 2", creneau: "9h-18h" }],
        mercredi: [{ nom: "Marouane", creneau: "9h-18h" }, { nom: "Recrue 3", creneau: "9h-18h" }],
        jeudi: [{ nom: "Marouane", creneau: "9h-18h" }, { nom: "Recrue 4", creneau: "9h-18h" }],
        vendredi: [{ nom: "Marouane", creneau: "9h-18h" }, { nom: "Recrue 5", creneau: "9h-18h" }],
      };
    }),

  statsPresence: publicQuery
    .input(z.object({ mois: z.string().optional() }))
    .query(async ({ input }) => {
      return {
        mois: input.mois || "2026-09",
        tauxPresence: 96.5,
        retards: 3,
        absences: 0,
        heuresSup: 12,
      };
    }),
});
