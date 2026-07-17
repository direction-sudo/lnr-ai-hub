import { useCallback } from 'react';
import { trpc } from '@/providers/trpc';

// ═══════════════════════════════════════════════
// LEO RH HOOK — Frontend API for Recruitment
// ═══════════════════════════════════════════════

export function useRH() {
  // ─── Job Offers ───
  const listJobOffers = () => trpc.rh.listJobOffers.useQuery();
  const getJobOffer = (id: number) => trpc.rh.getJobOffer.useQuery({ id }, { enabled: id > 0 });
  const createJobOffer = trpc.rh.createJobOffer.useMutation();
  const updateJobOffer = trpc.rh.updateJobOffer.useMutation();
  const deleteJobOffer = trpc.rh.deleteJobOffer.useMutation();

  // ─── Candidates ───
  const listCandidates = () => trpc.rh.listCandidates.useQuery();
  const getCandidate = (id: number) => trpc.rh.getCandidate.useQuery({ id }, { enabled: id > 0 });
  const createCandidate = trpc.rh.createCandidate.useMutation();
  const updateCandidate = trpc.rh.updateCandidate.useMutation();
  const deleteCandidate = trpc.rh.deleteCandidate.useMutation();

  // ─── CV Parsing ───
  const parseCv = trpc.rh.parseCv.useMutation();

  // ─── Interviews ───
  const listInterviews = () => trpc.rh.listInterviews.useQuery();
  const createInterview = trpc.rh.createInterview.useMutation();
  const updateInterview = trpc.rh.updateInterview.useMutation();
  const deleteInterview = trpc.rh.deleteInterview.useMutation();

  // ─── Onboarding ───
  const listOnboardingSteps = (candidateId: number) =>
    trpc.rh.listOnboardingSteps.useQuery({ candidateId }, { enabled: candidateId > 0 });
  const createOnboardingStep = trpc.rh.createOnboardingStep.useMutation();
  const toggleOnboardingStep = trpc.rh.toggleOnboardingStep.useMutation();
  const deleteOnboardingStep = trpc.rh.deleteOnboardingStep.useMutation();

  // ─── KPIs ───
  const getKpis = () => trpc.rh.getKpis.useQuery();

  // ─── Candidate Comparison ───
  const compareCandidates = (ids: number[]) =>
    trpc.rh.compareCandidates.useQuery({ ids }, { enabled: ids.length >= 2 });

  // ─── Document Generation ───
  const generateDocument = trpc.rh.generateDocument.useMutation();

  return {
    // Job Offers
    listJobOffers,
    getJobOffer,
    createJobOffer,
    updateJobOffer,
    deleteJobOffer,
    // Candidates
    listCandidates,
    getCandidate,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    // CV Parsing
    parseCv,
    // Interviews
    listInterviews,
    createInterview,
    updateInterview,
    deleteInterview,
    // Onboarding
    listOnboardingSteps,
    createOnboardingStep,
    toggleOnboardingStep,
    deleteOnboardingStep,
    // KPIs
    getKpis,
    // Comparison
    compareCandidates,
    // Documents
    generateDocument,
  };
}
