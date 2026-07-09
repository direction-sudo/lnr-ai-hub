import { trpc } from '@/providers/trpc';

export function useAgent() {
  const utils = trpc.useUtils();

  // ─── Get agent by ID ───
  const getById = (id: number) =>
    trpc.agent.getById.useQuery({ id }, { enabled: id > 0 });

  // ─── Update agent ───
  const updateMutation = trpc.agent.update.useMutation({
    onSuccess: () => {
      utils.agent.getById.invalidate();
      utils.chat.listAgents.invalidate();
    },
  });

  // ─── Knowledge ───
  const listKnowledge = (agentId: number) =>
    trpc.agent.listKnowledge.useQuery({ agentId }, { enabled: agentId > 0 });

  const addKnowledgeMutation = trpc.agent.addKnowledge.useMutation({
    onSuccess: () => utils.agent.listKnowledge.invalidate(),
  });

  const deleteKnowledgeMutation = trpc.agent.deleteKnowledge.useMutation({
    onSuccess: () => utils.agent.listKnowledge.invalidate(),
  });

  // ─── Analytics ───
  const getAnalytics = (agentId: number) =>
    trpc.agent.getAnalytics.useQuery({ agentId }, { enabled: agentId > 0 });

  // ─── Calls ───
  const listCalls = (agentId: number) =>
    trpc.agent.listCalls.useQuery({ agentId }, { enabled: agentId > 0 });

  const createCallMutation = trpc.agent.createCall.useMutation({
    onSuccess: () => utils.agent.listCalls.invalidate(),
  });

  return {
    getById,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,

    listKnowledge,
    addKnowledge: addKnowledgeMutation.mutate,
    deleteKnowledge: deleteKnowledgeMutation.mutate,
    isAddingKnowledge: addKnowledgeMutation.isPending,

    getAnalytics,

    listCalls,
    createCall: createCallMutation.mutate,
    isCreatingCall: createCallMutation.isPending,
  };
}
