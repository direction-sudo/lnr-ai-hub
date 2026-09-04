import { z } from "zod";
import { createRouter, authedQuery, authedQuery } from "./middleware";

export const charlyRouter = createRouter({
  rapportQuotidien: authedQuery
    .query(async () => {
      const today = new Date();
      return {
        date: today.toISOString(),
        presence: { presents: 7, absents: 0, retards: 1 },
        leads: { nouveaux: 12, qualifies: 8, rdvPris: 5, convertis: 2 },
        appels: { total: 145, decroches: 89, tauxDecroche: 61, dureeMoyenne: 185 },
        incidents: [],
        kpi: { tauxConversion: 8.2, tauxTransfert: 12, fileAttenteMax: 3 },
        message: `Rapport du ${today.toLocaleDateString("fr-FR")} — 7/7 presents, 12 leads, 5 RDV, 2 ventes.`,
      };
    }),

  alertesActives: authedQuery
    .query(async () => {
      return [
        { id: 1, type: "transfert", agent: "Tom", message: "Taux de transfert 18% — seuil 15%", priorite: "moyenne", heure: "09:15" },
        { id: 2, type: "file_attente", agent: "Plateau", message: "File d'attente 4 appels", priorite: "faible", heure: "10:30" },
      ];
    }),

  tableauAgents: authedQuery
    .query(async () => {
      return [
        { id: "charly", nom: "Charly", statut: "online", taches: "Rapport 8h", derniereActivite: "08:00" },
        { id: "sam", nom: "Sam", statut: "online", taches: "Distribution leads", derniereActivite: "08:05" },
        { id: "tom", nom: "Tom", statut: "online", taches: "Appels entrants", derniereActivite: "08:02" },
        { id: "rony", nom: "Rony", statut: "online", taches: "Pointage", derniereActivite: "08:00" },
        { id: "john", nom: "John", statut: "online", taches: "Posts LinkedIn", derniereActivite: "07:45" },
        { id: "lou", nom: "Lou", statut: "online", taches: "Audit SEO", derniereActivite: "07:30" },
        { id: "patrimoine", nom: "FIDES Patrimoine", statut: "online", taches: "Qualification leads", derniereActivite: "08:10" },
        { id: "julia", nom: "Julia", statut: "online", taches: "Conformite KYC", derniereActivite: "08:08" },
        { id: "manue", nom: "Manue", statut: "online", taches: "Supervision plateau", derniereActivite: "08:00" },
        { id: "nora", nom: "Nora", statut: "online", taches: "Formation recrues", derniereActivite: "07:50" },
      ];
    }),

  kpiTempsReel: authedQuery
    .query(async () => {
      return {
        timestamp: new Date().toISOString(),
        agentsActifs: 10,
        appelsEnCours: 3,
        leadsAujourdhui: 12,
        rdvAujourdhui: 5,
        tauxConversionGlobal: 8.2,
        alertesActives: 2,
      };
    }),
});
