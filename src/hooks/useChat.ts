import { useCallback } from 'react';
import { trpc } from '@/providers/trpc';

export function useChat() {
  const utils = trpc.useUtils();

  // ─── Queries ───
  const agentsQuery = trpc.chat.listAgents.useQuery();
  const agents = agentsQuery.data ?? [];

  const getHistoryQuery = (agentId: number | null) =>
    trpc.chat.getHistory.useQuery(
      { agentId: agentId! },
      { enabled: !!agentId }
    );

  // ─── Send message ───
  const sendMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      // Invalidate history to refresh messages
      utils.chat.getHistory.invalidate();
    },
  });

  const sendMessage = useCallback(
    (agentId: number, content: string) => {
      sendMutation.mutate({ agentId, content });
    },
    [sendMutation]
  );

  // ─── Create agent ───
  const createMutation = trpc.chat.createAgent.useMutation({
    onSuccess: () => {
      utils.chat.listAgents.invalidate();
    },
  });

  const createAgent = useCallback(
    (data: {
      slug: string;
      name: string;
      role: string;
      description?: string;
      avatar?: string;
      systemPrompt: string;
      capabilities?: string[];
      tools?: string[];
      personality?: string;
    }) => {
      createMutation.mutate(data);
    },
    [createMutation]
  );

  // ─── Delete agent ───
  const deleteMutation = trpc.chat.deleteAgent.useMutation({
    onSuccess: () => {
      utils.chat.listAgents.invalidate();
    },
  });

  return {
    agents,
    isLoading: agentsQuery.isLoading,
    sendMessage,
    isSending: sendMutation.isPending,
    createAgent,
    isCreating: createMutation.isPending,
    deleteAgent: deleteMutation.mutate,
    getHistoryQuery,
  };
}
