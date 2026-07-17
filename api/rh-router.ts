import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { candidates, jobOffers, interviews, onboardingSteps, hrMetrics } from "@db/schema";
import { eq, desc, sql, gte } from "drizzle-orm";
import { chatCompletion } from "./ai-service";
import { env } from "./lib/env";

// ═══════════════════════════════════════════════
// LEO RH ROUTER — Recrutement & Gestion RH
// ═══════════════════════════════════════════════

export const rhRouter = createRouter({

  // ═══════════════════════════════════════════
  // JOB OFFERS
  // ═══════════════════════════════════════════

  listJobOffers: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(jobOffers).orderBy(desc(jobOffers.createdAt));
  }),

  getJobOffer: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db.select().from(jobOffers).where(eq(jobOffers.id, input.id));
      return rows[0] ?? null;
    }),

  createJobOffer: publicQuery
    .input(z.object({
      title: z.string().min(1).max(200),
      department: z.string().max(100).optional(),
      location: z.string().max(200).optional(),
      contractType: z.enum(["cdi", "cdd", "stage", "alternance", "freelance"]).default("cdi"),
      description: z.string().max(10000).optional(),
      requirements: z.string().max(5000).optional(),
      salaryMin: z.number().int().min(0).optional(),
      salaryMax: z.number().int().min(0).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(jobOffers).values(input).returning({ id: jobOffers.id });
      return { id: result[0].id };
    }),

  updateJobOffer: publicQuery
    .input(z.object({
      id: z.number().int().positive(),
      title: z.string().max(200).optional(),
      department: z.string().max(100).optional(),
      location: z.string().max(200).optional(),
      contractType: z.enum(["cdi", "cdd", "stage", "alternance", "freelance"]).optional(),
      description: z.string().max(10000).optional(),
      requirements: z.string().max(5000).optional(),
      salaryMin: z.number().int().min(0).optional(),
      salaryMax: z.number().int().min(0).optional(),
      status: z.enum(["draft", "published", "archived", "filled"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(jobOffers).set(data).where(eq(jobOffers.id, id));
      return { ok: true };
    }),

  deleteJobOffer: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(jobOffers).where(eq(jobOffers.id, input.id));
      return { ok: true };
    }),

  // ═══════════════════════════════════════════
  // CANDIDATES
  // ═══════════════════════════════════════════

  listCandidates: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(candidates).orderBy(desc(candidates.createdAt));
  }),

  getCandidate: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db.select().from(candidates).where(eq(candidates.id, input.id));
      return rows[0] ?? null;
    }),

  createCandidate: publicQuery
    .input(z.object({
      firstName: z.string().min(1).max(100),
      lastName: z.string().min(1).max(100),
      email: z.string().email().optional(),
      phone: z.string().max(50).optional(),
      linkedinUrl: z.string().max(500).optional(),
      source: z.enum(["linkedin", "indeed", "welcometothejungle", "site_web", "recommandation", "candidature_spontanee", "autre"]).default("autre"),
      currentPosition: z.string().max(200).optional(),
      experienceYears: z.number().int().min(0).max(50).optional(),
      skills: z.array(z.string()).optional(),
      education: z.string().max(500).optional(),
      summary: z.string().max(2000).optional(),
      cvContent: z.string().max(50000).optional(),
      cvFileName: z.string().max(255).optional(),
      score: z.number().int().min(0).max(100).optional(),
      jobOfferId: z.number().int().positive().optional(),
      status: z.enum(["new", "screening", "interview", "offer", "hired", "rejected", "onboarding"]).default("new"),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(candidates).values(input).returning({ id: candidates.id });
      return { id: result[0].id };
    }),

  updateCandidate: publicQuery
    .input(z.object({
      id: z.number().int().positive(),
      firstName: z.string().max(100).optional(),
      lastName: z.string().max(100).optional(),
      email: z.string().email().optional(),
      phone: z.string().max(50).optional(),
      linkedinUrl: z.string().max(500).optional(),
      source: z.enum(["linkedin", "indeed", "welcometothejungle", "site_web", "recommandation", "candidature_spontanee", "autre"]).optional(),
      currentPosition: z.string().max(200).optional(),
      experienceYears: z.number().int().min(0).max(50).optional(),
      skills: z.array(z.string()).optional(),
      education: z.string().max(500).optional(),
      summary: z.string().max(2000).optional(),
      cvContent: z.string().max(50000).optional(),
      cvFileName: z.string().max(255).optional(),
      score: z.number().int().min(0).max(100).optional(),
      jobOfferId: z.number().int().positive().optional(),
      status: z.enum(["new", "screening", "interview", "offer", "hired", "rejected", "onboarding"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(candidates).set(data).where(eq(candidates.id, id));
      return { ok: true };
    }),

  deleteCandidate: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      // Delete related records first
      await db.delete(onboardingSteps).where(eq(onboardingSteps.candidateId, input.id));
      await db.delete(interviews).where(eq(interviews.candidateId, input.id));
      await db.delete(candidates).where(eq(candidates.id, input.id));
      return { ok: true };
    }),

  // ═══════════════════════════════════════════════════
  // Parse CV via API Kimi — Analyse sémantique intelligente
  // ═══════════════════════════════════════════════════
  parseCv: publicQuery
    .input(z.object({ content: z.string().min(10) }))
    .mutation(async ({ input }) => {
      const apiKey = env.kimiApiKey;
      if (!apiKey) {
        throw new Error("KIMI_API_KEY non configurée. Impossible d'analyser le CV.");
      }

      const systemPrompt = `Tu es Leo, un expert RH et analyste de CV pour LNR Finance. Ta mission est d'analyser un CV de manière sémantique et contextuelle — tu ne dois PAS te fier à des libellés fixes comme "Nom:", "Prénom:", "Email:".

Tu dois comprendre le CONTENU et le CONTEXTE du CV pour en extraire les informations, quels que soient :
- La langue (français, anglais, ou mixte)
- Le format (avec ou sans sections clairement nommées)
- L'ordre des informations
- La mise en page (une ou plusieurs colonnes)

Règles d'extraction :
1. NOM et PRÉNOM : identifie la personne par son nom complet, généralement en début de CV. Ex: "Amine Dridi" → prénom: Amine, nom: Dridi. Ex: "John Smith" → prénom: John, nom: Smith.
2. EMAIL : cherche un format email valide (xxx@yyy.zzz)
3. TÉLÉPHONE : cherche un numéro avec indicatif (+216, +33, +1...) ou format local
4. ADRESSE : ville, pays, ou adresse complète si présente
5. TITRE / POSTE : le titre professionnel (ex: "Software Engineer", "Développeur Full Stack")
6. RÉSUMÉ / PROFIL : paragraphe de description du candidat (2-3 phrases max)
7. HARD SKILLS : compétences techniques (langages, frameworks, outils, méthodologies)
8. SOFT SKILLS : compétences comportementales (leadership, communication, travail d'équipe...)
9. LANGUES : langues parlées avec niveau si indiqué
10. DIPLÔMES : formations académiques (Bachelor, Master, Licence, Ingénieur...)
11. CERTIFICATIONS : certifications professionnelles
12. EXPÉRIENCES : tableau d'objets {title, company, duration, description, technologies}
13. ENTREPRISES : liste des entreprises où le candidat a travaillé
14. PROJETS : projets significatifs mentionnés
15. OUTILS : outils et logiciels maîtrisés
16. ANNÉES D'EXPÉRIENCE : calcule le total d'années d'expérience professionnelle

TU DOIS RÉPONDRE UNIQUEMENT avec un objet JSON valide, sans texte avant ou après. Format :
{
  "firstName": "",
  "lastName": "",
  "email": "",
  "phone": "",
  "address": "",
  "title": "",
  "summary": "",
  "hardSkills": [],
  "softSkills": [],
  "languages": [],
  "education": "",
  "certifications": [],
  "experiences": [{"title":"","company":"","duration":"","description":"","technologies":[]}],
  "companies": [],
  "projects": [],
  "tools": [],
  "yearsOfExperience": 0,
  "linkedinUrl": "",
  "score": 0,
  "aiConfidence": 0
}

Le score (0-100) évalue la qualité globale du candidat.
L'aiConfidence (0-100) indique ton niveau de confiance dans l'extraction.`;

      try {
        const aiResponse = await chatCompletion(apiKey, [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyse ce CV et extrais toutes les informations pertinentes :\n\n${input.content}` },
        ], { temperature: 0.3, maxTokens: 4000 });

        // Extraire le JSON de la réponse
        let jsonStr = aiResponse;
        // Chercher un bloc JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }

        const parsed = JSON.parse(jsonStr);

        // Validation et valeurs par défaut
        return {
          firstName: parsed.firstName || "",
          lastName: parsed.lastName || "",
          email: parsed.email || "",
          phone: parsed.phone || "",
          address: parsed.address || "",
          title: parsed.title || "",
          summary: parsed.summary || "",
          hardSkills: Array.isArray(parsed.hardSkills) ? parsed.hardSkills : [],
          softSkills: Array.isArray(parsed.softSkills) ? parsed.softSkills : [],
          languages: Array.isArray(parsed.languages) ? parsed.languages : [],
          education: parsed.education || "",
          certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
          experiences: Array.isArray(parsed.experiences) ? parsed.experiences : [],
          companies: Array.isArray(parsed.companies) ? parsed.companies : [],
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
          tools: Array.isArray(parsed.tools) ? parsed.tools : [],
          yearsOfExperience: parsed.yearsOfExperience || 0,
          linkedinUrl: parsed.linkedinUrl || "",
          score: parsed.score || 0,
          aiConfidence: parsed.aiConfidence || 0,
          skills: [
            ...(Array.isArray(parsed.hardSkills) ? parsed.hardSkills : []),
            ...(Array.isArray(parsed.tools) ? parsed.tools : []),
          ],
        };
      } catch (err: any) {
        console.error("[parseCv] AI parsing error:", err.message);
        // Fallback : retourner une structure vide avec l'erreur
        return {
          firstName: "", lastName: "", email: "", phone: "", address: "",
          title: "", summary: "", hardSkills: [], softSkills: [], languages: [],
          education: "", certifications: [], experiences: [], companies: [],
          projects: [], tools: [], yearsOfExperience: 0, linkedinUrl: "",
          score: 0, aiConfidence: 0, skills: [],
          error: `Erreur d'analyse IA: ${err.message}`,
        };
      }
    }),

  // ═══════════════════════════════════════════
  // INTERVIEWS
  // ═══════════════════════════════════════════

  listInterviews: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(interviews).orderBy(desc(interviews.scheduledAt));
  }),

  getInterview: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db.select().from(interviews).where(eq(interviews.id, input.id));
      return rows[0] ?? null;
    }),

  createInterview: publicQuery
    .input(z.object({
      candidateId: z.number().int().positive(),
      jobOfferId: z.number().int().positive().optional(),
      title: z.string().min(1).max(200),
      type: z.enum(["phone", "video", "onsite", "technical", "final"]).default("phone"),
      scheduledAt: z.string(), // ISO string
      duration: z.number().int().min(15).max(480).default(60),
      interviewer: z.string().max(200).optional(),
      location: z.string().max(500).optional(),
      notes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(interviews).values({
        ...input,
        scheduledAt: new Date(input.scheduledAt),
      }).returning({ id: interviews.id });
      return { id: result[0].id };
    }),

  updateInterview: publicQuery
    .input(z.object({
      id: z.number().int().positive(),
      title: z.string().max(200).optional(),
      type: z.enum(["phone", "video", "onsite", "technical", "final"]).optional(),
      scheduledAt: z.string().optional(),
      duration: z.number().int().min(15).max(480).optional(),
      interviewer: z.string().max(200).optional(),
      location: z.string().max(500).optional(),
      notes: z.string().max(2000).optional(),
      rating: z.number().int().min(1).max(5).optional(),
      feedback: z.string().max(5000).optional(),
      status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, scheduledAt, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
      await db.update(interviews).set(updateData).where(eq(interviews.id, id));
      return { ok: true };
    }),

  deleteInterview: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(interviews).where(eq(interviews.id, input.id));
      return { ok: true };
    }),

  // ═══════════════════════════════════════════
  // ONBOARDING STEPS
  // ═══════════════════════════════════════════

  listOnboardingSteps: publicQuery
    .input(z.object({ candidateId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(onboardingSteps)
        .where(eq(onboardingSteps.candidateId, input.candidateId))
        .orderBy(onboardingSteps.order);
    }),

  createOnboardingStep: publicQuery
    .input(z.object({
      candidateId: z.number().int().positive(),
      title: z.string().min(1).max(200),
      description: z.string().max(1000).optional(),
      category: z.enum(["admin", "technique", "formation", "integration", "evaluation"]).default("admin"),
      dueDate: z.string().optional(),
      assignedTo: z.string().max(200).optional(),
      order: z.number().int().min(0).default(0),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(onboardingSteps).values({
        ...input,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      }).returning({ id: onboardingSteps.id });
      return { id: result[0].id };
    }),

  toggleOnboardingStep: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const rows = await db.select().from(onboardingSteps).where(eq(onboardingSteps.id, input.id));
      const step = rows[0];
      if (!step) throw new Error("Step not found");
      await db.update(onboardingSteps)
        .set({
          isCompleted: !step.isCompleted,
          completedAt: !step.isCompleted ? new Date() : null,
        })
        .where(eq(onboardingSteps.id, input.id));
      return { ok: true, isCompleted: !step.isCompleted };
    }),

  deleteOnboardingStep: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(onboardingSteps).where(eq(onboardingSteps.id, input.id));
      return { ok: true };
    }),

  // ═══════════════════════════════════════════
  // HR METRICS / KPIs
  // ═══════════════════════════════════════════

  getKpis: publicQuery.query(async () => {
    const db = getDb();

    // Total candidates
    const totalCandidates = await db.select({ count: sql<number>`count(*)` }).from(candidates);
    const totalCandidatesByStatus = await db
      .select({
        status: candidates.status,
        count: sql<number>`count(*)`,
      })
      .from(candidates)
      .groupBy(candidates.status);

    // Total job offers
    const totalJobOffers = await db.select({ count: sql<number>`count(*)` }).from(jobOffers);
    const activeJobOffers = await db.select({ count: sql<number>`count(*)` })
      .from(jobOffers)
      .where(eq(jobOffers.status, "published"));

    // Total interviews
    const totalInterviews = await db.select({ count: sql<number>`count(*)` }).from(interviews);
    const upcomingInterviews = await db.select({ count: sql<number>`count(*)` })
      .from(interviews)
      .where(eq(interviews.status, "scheduled"));

    // Hired count
    const hiredCount = await db.select({ count: sql<number>`count(*)` })
      .from(candidates)
      .where(eq(candidates.status, "hired"));

    // Average score
    const avgScore = await db.select({ avg: sql<number>`coalesce(avg(${candidates.score}), 0)` }).from(candidates);

    // Source breakdown
    const sourceBreakdown = await db
      .select({
        source: candidates.source,
        count: sql<number>`count(*)`,
      })
      .from(candidates)
      .groupBy(candidates.source);

    // This month's activity
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCandidates = await db.select({ count: sql<number>`count(*)` })
      .from(candidates)
      .where(gte(candidates.createdAt, startOfMonth));
    const thisMonthInterviews = await db.select({ count: sql<number>`count(*)` })
      .from(interviews)
      .where(gte(interviews.scheduledAt, startOfMonth));

    // Conversion rates
    const screeningCount = await db.select({ count: sql<number>`count(*)` })
      .from(candidates)
      .where(eq(candidates.status, "screening"));
    const interviewCount = await db.select({ count: sql<number>`count(*)` })
      .from(candidates)
      .where(eq(candidates.status, "interview"));
    const offerCount = await db.select({ count: sql<number>`count(*)` })
      .from(candidates)
      .where(eq(candidates.status, "offer"));

    const total = totalCandidates[0]?.count || 1;

    return {
      overview: {
        totalCandidates: totalCandidates[0]?.count ?? 0,
        activeJobOffers: activeJobOffers[0]?.count ?? 0,
        totalJobOffers: totalJobOffers[0]?.count ?? 0,
        totalInterviews: totalInterviews[0]?.count ?? 0,
        upcomingInterviews: upcomingInterviews[0]?.count ?? 0,
        hiredCount: hiredCount[0]?.count ?? 0,
        averageScore: Math.round(avgScore[0]?.avg ?? 0),
        thisMonthCandidates: thisMonthCandidates[0]?.count ?? 0,
        thisMonthInterviews: thisMonthInterviews[0]?.count ?? 0,
      },
      candidatesByStatus: totalCandidatesByStatus,
      sourceBreakdown,
      conversionFunnel: {
        new: totalCandidatesByStatus.find(s => s.status === "new")?.count ?? 0,
        screening: screeningCount[0]?.count ?? 0,
        interview: interviewCount[0]?.count ?? 0,
        offer: offerCount[0]?.count ?? 0,
        hired: hiredCount[0]?.count ?? 0,
      },
      rates: {
        screeningRate: Math.round(((screeningCount[0]?.count ?? 0) / total) * 100),
        interviewRate: Math.round(((interviewCount[0]?.count ?? 0) / total) * 100),
        offerRate: Math.round(((offerCount[0]?.count ?? 0) / total) * 100),
        hireRate: Math.round(((hiredCount[0]?.count ?? 0) / total) * 100),
      },
    };
  }),

  // ═══════════════════════════════════════════
  // CANDIDATE COMPARISON
  // ═══════════════════════════════════════════

  compareCandidates: publicQuery
    .input(z.object({ ids: z.array(z.number().int().positive()).min(2).max(5) }))
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db.select().from(candidates)
        .where(sql`${candidates.id} IN (${input.ids.join(",")})`);

      // Get interviews for these candidates
      const interviewData = await db.select().from(interviews)
        .where(sql`${interviews.candidateId} IN (${input.ids.join(",")})`);

      return results.map(c => ({
        ...c,
        interviewCount: interviewData.filter(i => i.candidateId === c.id).length,
        avgInterviewRating: interviewData
          .filter(i => i.candidateId === c.id && i.rating)
          .reduce((acc, i) => acc + (i.rating || 0), 0) /
          (interviewData.filter(i => i.candidateId === c.id && i.rating).length || 1),
      }));
    }),

  // ═══════════════════════════════════════════
  // GENERATE DOCUMENT (PDF content)
  // ═══════════════════════════════════════════

  generateDocument: publicQuery
    .input(z.object({
      type: z.enum(["job_offer", "interview_grid", "onboarding_plan", "contract_template", "evaluation_report"]),
      candidateId: z.number().int().positive().optional(),
      jobOfferId: z.number().int().positive().optional(),
      customData: z.record(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { type, candidateId, jobOfferId, customData } = input;

      let candidate = null;
      let jobOffer = null;

      if (candidateId) {
        const rows = await db.select().from(candidates).where(eq(candidates.id, candidateId));
        candidate = rows[0] ?? null;
      }
      if (jobOfferId) {
        const rows = await db.select().from(jobOffers).where(eq(jobOffers.id, jobOfferId));
        jobOffer = rows[0] ?? null;
      }

      const now = new Date().toLocaleDateString('fr-FR');

      // Generate document content based on type
      const documents: Record<string, () => string> = {
        job_offer: () => `FICHE DE POSTE — ${jobOffer?.title || customData?.title || 'Poste à pourvoir'}

Généré le ${now} par LEO — LNR AI Hub

═══════════════════════════════════════════════════════

POSTE
  Titre : ${jobOffer?.title || customData?.title || '—'}
  Département : ${jobOffer?.department || customData?.department || '—'}
  Localisation : ${jobOffer?.location || customData?.location || '—'}
  Type de contrat : ${jobOffer?.contractType?.toUpperCase() || customData?.contractType?.toUpperCase() || 'CDI'}

MISSIONS
${jobOffer?.description || customData?.description || 'À définir'}

PRÉ-REQUIS
${jobOffer?.requirements || customData?.requirements || 'À définir'}

RÉMUNÉRATION
  Fourchette : ${jobOffer?.salaryMin || customData?.salaryMin || '—'} — ${jobOffer?.salaryMax || customData?.salaryMax || '—'} € brut annuel

CONTACT RH
  LEO — LNR Finance
  Email : rh@lnr-finance.com
`,

        interview_grid: () => `GRILLE D'ENTRETIEN — ${candidate?.firstName || ''} ${candidate?.lastName || ''}

Généré le ${now} par LEO — LNR AI Hub

═══════════════════════════════════════════════════════

CANDIDAT
  Nom : ${candidate?.lastName || '—'}
  Prénom : ${candidate?.firstName || '—'}
  Poste visé : ${jobOffer?.title || customData?.position || '—'}
  Expérience : ${candidate?.experienceYears || '—'} ans

COMPÉTENCES IDENTIFIÉES
${(candidate?.skills as string[] || []).map(s => `  □ ${s}`).join('\n') || '  —'}

QUESTIONS TECHNIQUES (à adapter selon le poste)
  1. Décrivez votre expérience la plus significative sur ce poste.
  2. Quels outils/technologies maîtrisez-vous ?
  3. Comment abordez-vous la résolution de problèmes complexes ?
  4. Donnez un exemple de projet dont vous êtes fier.

QUESTIONS COMPORTEMENTALES
  1. Décrivez une situation de conflit et comment vous l'avez gérée.
  2. Comment travaillez-vous en équipe ?
  3. Où vous voyez-vous dans 3 ans ?
  4. Qu'est-ce qui vous motive au quotidien ?

BARÈME D'ÉVALUATION
  □ 1 — Insuffisant    □ 2 — En dessous    □ 3 — Satisfaisant
  □ 4 — Bon           □ 5 — Excellent

NOTES
_______________________________________________________
_______________________________________________________
_______________________________________________________

DÉCISION
  □ À retenir    □ À rejeter    □ Second entretien
  
Évaluateur : _______________    Date : _______________
`,

        onboarding_plan: () => `PLAN D'INTEGRATION — ${candidate?.firstName || ''} ${candidate?.lastName || ''}

Généré le ${now} par LEO — LNR AI Hub

═══════════════════════════════════════════════════════

INFORMATIONS
  Candidat : ${candidate?.firstName || '—'} ${candidate?.lastName || '—'}
  Poste : ${jobOffer?.title || customData?.position || '—'}
  Département : ${jobOffer?.department || customData?.department || '—'}

PHASE 1 — AVANT L'ARRIVÉE (J-7 à J-1)
  □ Préparation du poste de travail (matériel, accès)
  □ Création des comptes (email, logiciels, réseau)
  □ Envoi du contrat et documents administratifs
  □ Préparation du kit de bienvenue

PHASE 2 — PREMIER JOUR (J)
  □ Accueil et présentation de l'équipe
  □ Tour des locaux
  □ Formation sécurité et règlement intérieur
  □ Configuration des outils de travail
  □ Déjeuner d'intégration

PHASE 3 — PREMIÈRE SEMAINE (J+1 à J+5)
  □ Formation aux processus métiers
  □ Rencontre avec les collaborateurs clés
  □ Attribution du parrain/marraine
  □ Premiers objectifs de la semaine

PHASE 4 — PREMIER MOIS (J+6 à J+30)
  □ Suivi hebdomadaire avec le manager
  □ Formation complémentaire
  □ Première contribution au projet
  □ Bilan à 1 mois

PHASE 5 — PÉRENISATION (J+30 à J+90)
  □ Objectifs trimestriels
  □ Feedback 360°
  □ Plan de développement
  □ Bilan de période d'essai
`,

        contract_template: () => `CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE

LNR Finance — Généré le ${now} par LEO

═══════════════════════════════════════════════════════

ENTRE LES SOUSSIGNÉS :
  L'employeur : LNR Finance, société par actions simplifiée
  Siège social : [ADRESSE]
  Représentée par : [NOM DU DIRIGEANT]

ET :
  L'employé(e) : ${candidate?.firstName || '__________'} ${candidate?.lastName || '__________'}
  Né(e) le : [DATE DE NAISSANCE]
  Domicilié(e) : [ADRESSE]

IL EST CONVENU CE QUI SUIT :

ARTICLE 1 — ENGAGEMENT
L'employeur engage l'employé(e) en qualité de ${jobOffer?.title || '[POSTE]'}
à compter du [DATE DE DÉBUT].

ARTICLE 2 — FONCTIONS
L'employé(e) exercera les fonctions suivantes :
${jobOffer?.description || '[DESCRIPTION DES MISSIONS]'}

ARTICLE 3 — RÉMUNÉRATION
La rémunération mensuelle brute est fixée à ${customData?.salary || '[MONTANT]'} €.

ARTICLE 4 — DURÉE DU TRAVAIL
La durée du travail est de 35 heures par semaine.

ARTICLE 5 — LIEU DE TRAVAIL
Le lieu de travail est situé à ${jobOffer?.location || '[LIEU]'}. 

ARTICLE 6 — CONGÉS PAYÉS
L'employé(e) bénéficiera de 25 jours ouvrés de congés payés par an.

ARTICLE 7 — PÉRIODE D'ESSAI
Une période d'essai de [DURÉE] est prévue, conformément au Code du travail.

Fait à [LIEU], le [DATE], en deux exemplaires.

Signature de l'employeur :                    Signature de l'employé(e) :
_____________________                         _____________________
`,

        evaluation_report: () => `RAPPORT D'ÉVALUATION RH — ${now}

Généré par LEO — LNR AI Hub

═══════════════════════════════════════════════════════

1. VUE D'ENSEMBLE

  Candidats en base : ${candidate ? 1 : '—'}
  Poste : ${jobOffer?.title || customData?.position || '—'}
  Score global : ${candidate?.score || '—'}/100

2. PROFIL DU CANDIDAT

  Nom : ${candidate?.lastName || '—'}
  Prénom : ${candidate?.firstName || '—'}
  Expérience : ${candidate?.experienceYears || '—'} ans
  Formation : ${candidate?.education || '—'}

3. COMPÉTENCES

${(candidate?.skills as string[] || []).map(s => `  ✓ ${s}`).join('\n') || '  —'}

4. ANALYSE DU CV

${candidate?.summary || customData?.analysis || '—'}

5. RECOMMANDATIONS

  □ Profil correspondant au poste
  □ Points à creuser en entretien : [À compléter]
  □ Niveau de recommandation : [Faible / Moyen / Fort]

6. PROCHAINES ÉTAPES

  □ Validation du screening
  □ Planification de l'entretien
  □ Vérification des références

═══════════════════════════════════════════════════════
LEO — Agent RH IA — LNR Finance
Ce rapport est généré automatiquement et doit être validé par un responsable RH.
`,
      };

      const content = (documents[type] || documents.evaluation_report)();

      return {
        content,
        type,
        generatedAt: new Date().toISOString(),
      };
    }),
});
