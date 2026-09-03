import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { dossiers, dossierDocuments } from "@db/schema";
import { eq, desc } from "drizzle-orm";

const ChecklistItem = z.object({
  id: z.string(),
  label: z.string(),
  obligatoire: z.boolean(),
  valide: z.boolean().default(false),
  dateValidation: z.string().datetime().optional(),
  validateur: z.string().optional(),
});

export const juliaRouter = createRouter({
  // ─── Checklist conformité d'un dossier ───
  checklist: publicQuery
    .input(z.object({ dossierId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const docs = await db.select().from(dossierDocuments).where(eq(dossierDocuments.dossierId, input.dossierId));
      const checklist = [
        { id: "kyc_id", label: "Pièce d'identité valide", obligatoire: true },
        { id: "kyc_rib", label: "RIB signataire", obligatoire: true },
        { id: "kyc_fiscal", label: "Justificatif domicile < 3 mois", obligatoire: true },
        { id: "aml_source", label: "Source des fonds déclarée", obligatoire: true },
        { id: "aml_pep", label: "Vérification PEP / sanctions", obligatoire: true },
        { id: "prod_mandat", label: "Mandat de gestion signé", obligatoire: false },
        { id: "prod_questionnaire", label: "Questionnaire patrimonial complet", obligatoire: true },
      ].map(item => ({
        ...item,
        valide: docs.some(d => d.type === item.id && d.status === "valide"),
      }));
      const obligatoires = checklist.filter(i => i.obligatoire);
      const tauxConformite = obligatoires.length > 0
        ? Math.round((checklist.filter(i => i.valide && i.obligatoire).length / obligatoires.length) * 100)
        : 0;
      return {
        dossierId: input.dossierId,
        checklist,
        tauxConformite,
        statut: tauxConformite === 100 ? "vert" : tauxConformite >= 80 ? "orange" : "rouge",
      };
    }),

  // ─── Ajouter un document ───
  addDocument: authedQuery
    .input(z.object({
      dossierId: z.number().int().positive(),
      type: z.string(),
      url: z.string().url(),
      nom: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [row] = await db.insert(dossierDocuments).values({
        dossierId: input.dossierId,
        type: input.type,
        url: input.url,
        nom: input.nom,
        status: "en_attente",
        uploadedAt: new Date(),
      }).returning();
      return row;
    }),

  // ─── Valider un document ───
  validateDocument: authedQuery
    .input(z.object({
      documentId: z.number().int().positive(),
      status: z.enum(["valide", "rejete", "en_attente"]),
      commentaire: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [row] = await db.update(dossierDocuments)
        .set({ status: input.status, commentaire: input.commentaire, validatedAt: new Date() })
        .where(eq(dossierDocuments.id, input.documentId))
        .returning();
      return row;
    }),

  // ─── Alertes dossiers incomplets ───
  alertes: publicQuery
    .query(async () => {
      const db = getDb();
      const allDossiers = await db.select().from(dossiers).where(eq(dossiers.status, "en_cours"));
      return allDossiers.filter(d => !d.completedAt).map(d => ({
        dossierId: d.id,
        leadId: d.leadId,
        alerte: "Dossier incomplet — KYC/AML en attente",
        priorite: "haute",
      }));
    }),
});
