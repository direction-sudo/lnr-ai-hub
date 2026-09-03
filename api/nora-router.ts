import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";

export const noraRouter = createRouter({
  parcours: publicQuery
    .query(async () => {
      return {
        recrueId: "demo-recrue",
        modules: [
          { id: 1, nom: "Produits FIDES", statut: "complete", score: 85 },
          { id: 2, nom: "Script de vente", statut: "en_cours", score: null },
          { id: 3, nom: "Outils CRM & Telephonie", statut: "bloque", score: null, prerequis: "Module 2" },
          { id: 4, nom: "Conformite & KYC", statut: "bloque", score: null, prerequis: "Module 2" },
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
          { id: 2, question: "Quel est le delai de carence standard ?", options: ["0 mois", "3 mois", "6 mois"], reponse: 1 },
        ],
        2: [
          { id: 3, question: "Quelle est la premiere question a poser a un lead ?", options: ["Votre budget ?", "Votre nom et votre age ?", "Votre adresse ?"], reponse: 1 },
        ],
      };

      return {
        module: input.module,
        questions: banques[input.module] || [],
        tempsLimite: 15,
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
      const bonnesReponses = input.reponses.length;
      const score = Math.round((bonnesReponses / Math.max(input.reponses.length, 1)) * 100);
      const resultat = score >= 80 ? "reussi" : "echec";

      return {
        recrueId: input.recrueId,
        module: input.module,
        score,
        resultat,
        message: resultat === "reussi"
          ? `Félicitations ! Vous avez obtenu ${score}%. Module debloque.`
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
          scriptAttendu: ["Bonjour Mme Dupont", "Je vous appelle suite a votre demande", "Pouvez-vous me confirmer votre age et votre situation ?"],
          pieges: ["Ne pas mentionner le prix trop tot", "Ne pas oublier le consentement opt-in"],
          dureeMax: 300,
        },
        lead_froid: {
          contexte: "M. Martin a clique sur une pub mais n'a pas rempli le formulaire.",
          scriptAttendu: ["Bonjour, je vous appelle de la part de FIDES CONSEIL", "Vous avez montre de l'interet pour..."],
          pieges: ["Ne pas etre trop pressant", "Proposer un rendez-vous plutot qu'une vente directe"],
          dureeMax: 180,
        },
        reclamation: {
          contexte: "Un client insatisfait se plaint d'avoir ete appele 3 fois.",
          scriptAttendu: ["Je suis desole pour ce desagrement", "Je note immediatement votre demande", "Vous ne serez plus contacte"],
          pieges: ["Ne jamais contredire le client", "Toujours s'excuser avant d'expliquer"],
          dureeMax: 120,
        },
        objection_prix: {
          contexte: "Le client trouve la mutuelle trop chere (150€/mois).",
          scriptAttendu: ["Je comprends votre preoccupation", "Permettez-moi de vous expliquer les garanties", "Il existe des formules adaptees a votre budget"],
          pieges: ["Ne pas baisser le prix immediatement", "Valoriser les garanties avant le prix"],
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
        message: `Mise a jour "${input.titre}" publiee. Accuse de lecture requis pour : ${input.obligatoirePour.join(", ")}`,
      };
    }),
});
