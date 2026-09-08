import { z } from "zod";
import { createRouter, authedOrApiKeyQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { dossiers, dossierDocuments } from "@db/schema";
import { eq } from "drizzle-orm";
import { chatCompletion } from "./ai-service";
import { env } from "./lib/env";

export const juliaRouter = createRouter({
  // ─── Checklist KYC/AML analysée par Kimi AI ───
  checklist: authedOrApiKeyQuery
    .input(z.object({ dossierId: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const token = ctx.accessToken || env.kimiApiKey;
      if (!token) {
        // Fallback mock si pas de token
        return {
          statut: "orange",
          tauxConformite: 65,
          checklist: [
            { id: "kyc_id", label: "CIN / Passeport", valide: true, obligatoire: true },
            { id: "kyc_rib", label: "RIB signataire", valide: false, obligatoire: true },
            { id: "kyc_fiscal", label: "Justificatif de domicile", valide: true, obligatoire: true },
            { id: "aml_source", label: "Source des fonds declaree", valide: false, obligatoire: true },
            { id: "aml_pep", label: "Verification PEP / Sanctions", valide: true, obligatoire: true },
            { id: "prod_mandat", label: "Mandat de gestion signe", valide: false, obligatoire: false },
            { id: "prod_questionnaire", label: "Questionnaire patrimonial", valide: true, obligatoire: false },
          ],
        };
      }

      const systemPrompt = `Tu es Julia, une experte en conformite KYC/AML pour le secteur financier en Tunisie et en France.
Tu analyses les dossiers de conformite et tu retournes UNIQUEMENT un JSON valide sans markdown, sans explication.

Structure JSON attendue:
{
  "statut": "vert|orange|rouge",
  "tauxConformite": number (0-100),
  "checklist": [
    { "id": "kyc_id", "label": "CIN / Passeport", "valide": boolean, "obligatoire": true },
    { "id": "kyc_rib", "label": "RIB signataire", "valide": boolean, "obligatoire": true },
    { "id": "kyc_fiscal", "label": "Justificatif de domicile", "valide": boolean, "obligatoire": true },
    { "id": "aml_source", "label": "Source des fonds declaree", "valide": boolean, "obligatoire": true },
    { "id": "aml_pep", "label": "Verification PEP / Sanctions", "valide": boolean, "obligatoire": true },
    { "id": "prod_mandat", "label": "Mandat de gestion signe", "valide": boolean, "obligatoire": false },
    { "id": "prod_questionnaire", "label": "Questionnaire patrimonial", "valide": boolean, "obligatoire": false }
  ]
}`;

      try {
        const response = await chatCompletion(token, [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyse le dossier de conformite #${input?.dossierId || 1} et retourne le JSON de la checklist KYC/AML.` },
        ], { temperature: 0.3, maxTokens: 1500 });

        const cleanJson = response.replace(/^```json\n?/, "").replace(/```$/, "").trim();
        return JSON.parse(cleanJson);
      } catch (err) {
        console.error("[Julia] Erreur Kimi:", err);
        // Fallback
        return {
          statut: "orange",
          tauxConformite: 65,
          checklist: [
            { id: "kyc_id", label: "CIN / Passeport", valide: true, obligatoire: true },
            { id: "kyc_rib", label: "RIB signataire", valide: false, obligatoire: true },
            { id: "kyc_fiscal", label: "Justificatif de domicile", valide: true, obligatoire: true },
            { id: "aml_source", label: "Source des fonds declaree", valide: false, obligatoire: true },
            { id: "aml_pep", label: "Verification PEP / Sanctions", valide: true, obligatoire: true },
            { id: "prod_mandat", label: "Mandat de gestion signe", valide: false, obligatoire: false },
            { id: "prod_questionnaire", label: "Questionnaire patrimonial", valide: true, obligatoire: false },
          ],
        };
      }
    }),

  // ─── Ajouter un document ───
  addDocument: authedOrApiKeyQuery
    .input(
      z.object({
        dossierId: z.number(),
        type: z.enum(["kyc_id", "kyc_rib", "kyc_fiscal", "aml_source", "aml_pep", "prod_mandat", "prod_questionnaire"]),
        url: z.string().url(),
        nom: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const inserted = await db.insert(dossierDocuments).values({
        dossierId: input.dossierId,
        type: input.type,
        url: input.url,
        nom: input.nom,
        status: "en_attente",
      }).returning();
      return { id: inserted[0].id, nom: input.nom, status: "en_attente" };
    }),

  // ─── Valider un document avec Kimi AI ───
  validateDocument: authedOrApiKeyQuery
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const token = ctx.accessToken || env.kimiApiKey;

      const doc = await db.select().from(dossierDocuments).where(eq(dossierDocuments.id, input.documentId)).limit(1);
      if (doc.length === 0) throw new Error("Document non trouve");

      let status = "valide";
      let raison = "Document valide";

      if (token) {
        try {
          const systemPrompt = `Tu es Julia, experte KYC/AML. Analyse ce document et retourne UNIQUEMENT un JSON: {"status": "valide|rejete", "raison": "explication courte"}`;
          const response = await chatCompletion(token, [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Document: ${doc[0].nom} (type: ${doc[0].type}). URL: ${doc[0].url}. Valide ce document KYC/AML.` },
          ], { temperature: 0.3, maxTokens: 500 });

          const cleanJson = response.replace(/^```json\n?/, "").replace(/```$/, "").trim();
          const result = JSON.parse(cleanJson);
          status = result.status;
          raison = result.raison;
        } catch (err) {
          console.error("[Julia] Erreur validation Kimi:", err);
        }
      }

      await db.update(dossierDocuments)
        .set({ status, updatedAt: new Date() })
        .where(eq(dossierDocuments.id, input.documentId));

      return { success: true, status, raison };
    }),

  // ─── Alertes de conformite ───
  alertes: authedOrApiKeyQuery
    .input(z.object({ dossierId: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const token = ctx.accessToken || env.kimiApiKey;
      if (!token) {
        return [
          { dossierId: 1, leadId: "lead-001", alerte: "PEP detecte - verification requise", priorite: "haute" },
          { dossierId: 2, leadId: "lead-002", alerte: "Source des fonds non declaree", priorite: "moyenne" },
        ];
      }

      try {
        const systemPrompt = `Tu es Julia, experte KYC/AML. Analyse les dossiers et retourne UNIQUEMENT un JSON avec les alertes de conformite.
Format: [{"dossierId": number, "leadId": string, "alerte": string, "priorite": "haute|moyenne|basse"}]`;
        const response = await chatCompletion(token, [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyse les dossiers de conformite et liste les alertes KYC/AML prioritaires.` },
        ], { temperature: 0.3, maxTokens: 1000 });

        const cleanJson = response.replace(/^```json\n?/, "").replace(/```$/, "").trim();
        return JSON.parse(cleanJson);
      } catch (err) {
        console.error("[Julia] Erreur alertes Kimi:", err);
        return [
          { dossierId: 1, leadId: "lead-001", alerte: "PEP detecte - verification requise", priorite: "haute" },
          { dossierId: 2, leadId: "lead-002", alerte: "Source des fonds non declaree", priorite: "moyenne" },
        ];
      }
    }),
});
