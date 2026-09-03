import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";

export const noraRouter = createRouter({
  parcours: publicQuery
    .input(z.object({ recrueId: z.string().uuid() }))
    .query(async ({ input }) => {
      return {
        recrueId: input.recrueId,
        modules: [
          { id: 1, nom: "Produits FIDES", statut: "complete", score: 85 },
          { id: 2, nom: "Script de vente", statut: "en_cours", score: null },
          { id: 3, nom: "Outils CRM & Téléphonie", statut: "bloque", score: null, prerequis: "Module 2" },
          { id: 4, nom: "Conformité & KYC", statut: "bloque", score: null, prerequis: "Module 2" },
          { id: 5, nom: "Simulation d'appel", statut: "bloque", score: null, prerequis: "Modules 1-4" },
        ],
        progressionGlobale: 20,
        certification: false,
      };
    }),

  quiz: publicQuery
    .input(z.object({ module: z.number().int().min(1).max(5) }))
    .query(async ({ input }) => {
      const banques: Record<number, any[]> = {
        1: [
          { id: 1, question: "Quelle est la mutuelle phare FIDES pour les seniors ?", options: ["Mutuelle Or", "Mutuelle Argent", "Mutuelle Bronze"], reponse: 0 },
          { id: 2, question: "Quel est le délai de carence standard ?", options: ["0 mois", "3 mois", "6 mois"], reponse: 1 },
        ],
        2: [
          { id: 3, question: "Quelle est la première question à poser à un lead ?", options: ["Votre budget ?", "Votre nom et votre âge ?", "Votre adresse ?"], reponse: 1 },
        ],
      };

      return {
        module: input.module,
        questions: banques[input.module] || [],
        tempsLimite: 15, // minutes
        tentativesMax: 3,
      };
    }),

  soumettreQuiz: publicQuery
    .input(z.object({
      recrueId: z.string().uuid(),
      module: z.number().int(),
      reponses: z.array(z.object({ questionId: z.number(), reponse: z.number() })),
    }))
    .mutation(async ({ input }) => {
      // Correction simplifiée
      const bonnesReponses = input.reponses.length; // Mock : tout juste
      const score = Math.round((bonnesReponses / Math.max(input.reponses.length, 1)) * 100);
      const resultat = score >= 80 ? "reussi" : "echec";

      return {
        recrueId: input.recrueId,
        module: input.module,
        score,
        resultat,
        message: resultat === "reussi"
          ? `Félicitations ! Vous avez obtenu ${score}%. Module débloqué.`
          : `Score : ${score}%. Il faut 80% pour valider. Revoir le module et retenter.`,
        prochainModule: resultat === "reussi" ? input.module + 1 : null,
      };
    }),

  simulation: publicQuery
    .input(z.object({
      recrueId: z.string().uuid(),
      scenario: z.enum(["lead_chaud", "lead_froid", "reclamation", "objection_prix"]),
    }))
    .mutation(async ({ input }) => {
      const scenarios: Record<string, any> = {
        lead_chaud: {
          contexte: "Mme Dupont, 67 ans, a rempli le formulaire mutuelle. Elle attend votre appel.",
          scriptAttendu: ["Bonjour Mme Dupont", "Je vous appelle suite à votre demande", "Pouvez-vous me confirmer votre âge et votre situation ?"],
          pieges: ["Ne pas mentionner le prix trop tôt", "Ne pas oublier le consentement opt-in"],
          dureeMax: 300, // 5 min
        },
        lead_froid: {
          contexte: "M. Martin a cliqué sur une pub mais n'a pas rempli le formulaire.",
          scriptAttendu: ["Bonjour, je vous appelle de la part de FIDES CONSEIL", "Vous avez montré de l'intérêt pour..."],
          pieges: ["Ne pas être trop pressant", "Proposer un rendez-vous plutôt qu'une vente directe"],
          dureeMax: 180,
        },
        reclamation: {
          contexte: "Un client insatisfait se plaint d'avoir été appelé 3 fois.",
          scriptAttendu: ["Je suis désolé pour ce désagrément", "Je note immédiatement votre demande", "Vous ne serez plus contacté"],
          pieges: ["Ne jamais contredire le client", "Toujours s'excuser avant d'expliquer"],
          dureeMax: 120,
        },
        objection_prix: {
          contexte: "Le client trouve la mutuelle trop chère (150€/mois).",
          scriptAttendu: ["Je comprends votre préoccupation", "Permettez-moi de vous expliquer les garanties", "Il existe des formules adaptées à votre budget"],
          pieges: ["Ne pas baisser le prix immédiatement", "Valoriser les garanties avant le prix"],
          dureeMax: 240,
        },
      };

      return {
        recrueId: input.recrueId,
        scenario: input.scenario,
        ...scenarios[input.scenario],
        grilleNotation: [
          { critere: "Accueil", points: 5 },
          { critere: "Qualification", points: 5 },
          { critere: "Argumentation", points: 5 },
          { critere: "Gestion objection", points: 5 },
          { critere: "Conclusion/RDV", points: 5 },
        ],
        scoreMin: 20,
      };
    }),

  majReglementaire: publicQuery
    .input(z.object({
      titre: z.string(),
      contenu: z.string(),
      obligatoirePour: z.array(z.string()).default(["tous"]),
    }))
    .mutation(async ({ input }) => {
      return {
        id: `maj-${Date.now()}`,
        titre: input.titre,
        contenu: input.contenu,
        datePublication: new Date().toISOString(),
        obligatoirePour: input.obligatoirePour,
        accusesLecture: [],
        statut: "publie",
        message: `Mise à jour "${input.titre}" publiée. Accusé de lecture requis pour : ${input.obligatoirePour.join(", ")}`,
      };
    }),
});
