import { useCallback } from 'react';
import { useRealChat } from './useRealChat';

export interface Call {
  id: number;
  agentId: number;
  type: 'audio' | 'video';
  status: 'completed' | 'missed' | 'ongoing';
  duration: number;
  createdAt: Date;
}

export interface KnowledgeDoc {
  id: number;
  agentId: number;
  filename: string;
  content: string | null;
  size: number | null;
  createdAt: Date;
}

export interface AnalyticsData {
  totals: {
    messages: number;
    calls: number;
    callDuration: number;
    knowledgeDocs: number;
  };
  daily: Array<{
    date: string;
    messagesSent: number | null;
    messagesReceived: number | null;
  }>;
}

export function useAgent() {
  const { agents, updateAgent, getAnalytics } = useRealChat();

  const getById = (id: number) => {
    const agent = agents.find(a => a.id === id);
    return { data: agent ?? null, isLoading: false };
  };

  const update = useCallback((data: { id: number; [key: string]: unknown }) => {
    const { id, ...rest } = data;
    updateAgent(id, rest as Parameters<typeof updateAgent>[1]);
  }, [updateAgent]);

  const listKnowledge = (_agentId: number) => {
    return { data: [] as KnowledgeDoc[], isLoading: false };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addKnowledge = useCallback((_data: any) => {}, []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deleteKnowledge = useCallback((_data: any) => {}, []);

  const getAnalyticsQuery = (_agentId: number) => {
    return { data: getAnalytics(_agentId) as AnalyticsData, isLoading: false };
  };

  const listCalls = (_agentId: number) => {
    return { data: [] as Call[], isLoading: false };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createCall = useCallback((_data: any) => {}, []);

  return {
    getById,
    update,
    isUpdating: false,
    listKnowledge,
    addKnowledge,
    deleteKnowledge,
    isAddingKnowledge: false,
    getAnalytics: getAnalyticsQuery,
    listCalls,
    createCall,
    isCreatingCall: false,
  };
}
