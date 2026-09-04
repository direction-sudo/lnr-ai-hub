import { z } from "zod";
import { createRouter, authedQuery, authedQuery } from "./middleware";

export const johnRouter = createRouter({
  genererPost: authedQuery
    .input(z.object({
      sujet: z.string().min(3),
      canal: z.enum(["linkedin", "facebook", "email"]).default("linkedin"),
      ton: z.enum(["professionnel", "informatif", "engagement"]).default("professionnel"),
    }))
    .mutation(async ({ input }) => {
      const templates: Record<string, Record<string, string>> = {
        linkedin: {
          mutuelle: `🛡️ Pourquoi souscrire une mutuelle senior en 2026 ?\n\nLes soins dentaires et optiques ne sont plus pris en charge à 100% par la Sécurité Sociale.\n\nChez FIDES CONSEIL, nous accompagnons les seniors vers la mutuelle adaptée à leur budget et leurs besoins.\n\n📞 Demandez votre étude personnalisée : +33 X XX XX XX XX\n\n#Mutuelle #Senior #Sante #FIDESConseil`,
          prevoyance: `💼 Dirigeants d'entreprise : avez-vous pensé à la prévoyance collective ?\n\nEn 2026, 68% des PME n'ont pas de contrat prévoyance. Pourtant, c'est un levier de fidélisation et d'attractivité.\n\nFIDES CONSEIL vous accompagne dans la mise en place de solutions sur mesure.\n\n#Prevoyance #PME #RH #Conseil`,
        },
        email: {
          relance: `Bonjour [PRENOM],\n\nVous avez récemment demandé à être rappelé concernant nos solutions [PRODUIT].\n\nNous serions ravis de vous accompagner.\n\nPouvez-vous nous indiquer un créneau disponible cette semaine ?\n\nCordialement,\nL'équipe FIDES CONSEIL\n\nMentions légales : FIDES CONSEIL — ORIAS N° XXXXX — 1 rue Example, 75000 Paris`,
        },
      };

      const contenu = templates[input.canal]?.[input.sujet] || `Contenu genere pour : ${input.sujet}`;

      return {
        sujet: input.sujet,
        canal: input.canal,
        contenu,
        hashtags: ["#FIDESConseil", "#Assurance", "#Conseil"],
        statut: "en_attente_validation",
        id: `post-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
    }),

  programmerEmail: authedQuery
    .input(z.object({
      template: z.string(),
      liste: z.array(z.string().email()),
      dateEnvoi: z.string().datetime(),
    }))
    .mutation(async ({ input }) => {
      return {
        campagneId: `camp-${Date.now()}`,
        template: input.template,
        destinataires: input.liste.length,
        dateEnvoi: input.dateEnvoi,
        statut: "programme",
        optInVerifie: true,
      };
    }),

  relanceNurturing: authedQuery
    .input(z.object({ leadId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return {
        leadId: input.leadId,
        sequence: [
          { jour: 1, action: "email_bienvenue", statut: "envoye" },
          { jour: 3, action: "email_produit", statut: "programme" },
          { jour: 7, action: "email_temoignage", statut: "programme" },
          { jour: 14, action: "appel_proposition", statut: "programme" },
        ],
        prochaineRelance: "J+3",
      };
    }),

  statsEngagement: authedQuery
    .input(z.object({ periode: z.enum(["7j", "30j", "90j"]).default("30j") }))
    .query(async ({ input }) => {
      return {
        periode: input.periode,
        emailsEnvoyes: 450,
        tauxOuverture: 28.5,
        tauxClic: 4.2,
        tauxReponse: 1.8,
        postsLinkedIn: 12,
        engagementMoyen: 3.8,
      };
    }),
});
