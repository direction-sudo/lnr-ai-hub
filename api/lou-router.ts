import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";

export const louRouter = createRouter({
  genererPage: publicQuery
    .input(z.object({
      motCle: z.string().min(3),
      cible: z.enum(["B2C", "B2B", "mixte"]).default("B2C"),
      localisation: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const motCle = input.motCle.toLowerCase();
      const localisation = input.localisation || "Tunisie";

      const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${input.motCle} — FIDES CONSEIL</title>
  <meta name="description" content="${input.motCle} avec FIDES CONSEIL. Expertise et accompagnement personnalisé.">
</head>
<body>
  <h1>${input.motCle} — Votre expert à ${localisation}</h1>
  <p>FIDES CONSEIL vous accompagne dans votre démarche <strong>${input.motCle}</strong>.</p>
  <h2>Pourquoi choisir FIDES CONSEIL ?</h2>
  <ul>
    <li>Expertise reconnue depuis 2010</li>
    <li>Conseil personnalisé et indépendant</li>
    <li>Devis gratuit sous 24h</li>
  </ul>
  <h2>Contactez-nous</h2>
  <p>📞 ${localisation === "Tunisie" ? "+216 XX XXX XXX" : "+33 X XX XX XX XX"}</p>
  <p>Mentions légales : FIDES CONSEIL — ORIAS N° XXXXX</p>
</body>
</html>`;

      return {
        motCle: input.motCle,
        html,
        meta: {
          title: `${input.motCle} — FIDES CONSEIL`,
          description: `${input.motCle} avec FIDES CONSEIL. Expertise et accompagnement personnalisé.`,
          h1: `${input.motCle} — Votre expert à ${localisation}`,
        },
        scoreSeo: 82,
        mots: 450,
        densiteMotCle: 1.8,
        statut: "en_attente_validation",
        id: `page-${Date.now()}`,
      };
    }),

  auditerSite: publicQuery
    .input(z.object({ url: z.string().url() }))
    .query(async ({ input }) => {
      return {
        url: input.url,
        scoreGlobal: 72,
        erreurs: [
          { gravite: "haute", type: "vitesse", message: "Temps de chargement 4.2s — objectif < 2s" },
          { gravite: "moyenne", type: "meta", message: "3 pages sans description meta" },
          { gravite: "faible", type: "images", message: "5 images sans attribut alt" },
        ],
        recommandations: [
          "Compresser les images (économie 1.8s)",
          "Activer le cache navigateur",
          "Ajouter les descriptions meta manquantes",
        ],
      };
    }),

  positionnement: publicQuery
    .input(z.object({ motCle: z.string() }))
    .query(async ({ input }) => {
      return {
        motCle: input.motCle,
        position: 12,
        evolution: "+3",
        volumeRecherches: 1200,
        concurrence: "moyenne",
        urlClasse: "https://fides-conseil.tn/mutuelle-senior",
      };
    }),

  batchGenerate: publicQuery
    .input(z.object({ motsCles: z.array(z.string()).min(1).max(10) }))
    .mutation(async ({ input }) => {
      const pages = input.motsCles.map((mot, i) => ({
        id: `page-batch-${i}`,
        motCle: mot,
        scoreSeo: 75 + Math.floor(Math.random() * 15),
        statut: "en_attente_validation",
      }));

      return {
        pages,
        total: pages.length,
        validationRequise: true,
        message: `${pages.length} pages generees — en attente de validation par Yassir`,
      };
    }),
});
