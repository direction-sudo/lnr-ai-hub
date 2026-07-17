import { relations } from "drizzle-orm";
import { candidates, jobOffers, interviews, onboardingSteps, hrMetrics } from "./schema";

// ─── Job Offer Relations ───
export const jobOffersRelations = relations(jobOffers, ({ many }) => ({
  candidates: many(candidates),
  interviews: many(interviews),
}));

// ─── Candidate Relations ───
export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  jobOffer: one(jobOffers, {
    fields: [candidates.jobOfferId],
    references: [jobOffers.id],
  }),
  interviews: many(interviews),
  onboardingSteps: many(onboardingSteps),
}));

// ─── Interview Relations ───
export const interviewsRelations = relations(interviews, ({ one }) => ({
  candidate: one(candidates, {
    fields: [interviews.candidateId],
    references: [candidates.id],
  }),
  jobOffer: one(jobOffers, {
    fields: [interviews.jobOfferId],
    references: [jobOffers.id],
  }),
}));

// ─── Onboarding Steps Relations ───
export const onboardingStepsRelations = relations(onboardingSteps, ({ one }) => ({
  candidate: one(candidates, {
    fields: [onboardingSteps.candidateId],
    references: [candidates.id],
  }),
}));

// ─── HR Metrics Relations ───
export const hrMetricsRelations = relations(hrMetrics, ({ one }) => ({
  jobOffer: one(jobOffers, {
    fields: [hrMetrics.jobOfferId],
    references: [jobOffers.id],
  }),
}));
