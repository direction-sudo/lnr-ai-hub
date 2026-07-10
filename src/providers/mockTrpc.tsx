import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  MOCK_AGENTS,
  MOCK_MESSAGES,
  MOCK_ANALYTICS,
  MOCK_CALLS,
  MOCK_KNOWLEDGE,
} from "./mockData";

// ─── Types ───
type Agent = (typeof MOCK_AGENTS)[number];
type Message = (typeof MOCK_MESSAGES)[1][number];
type Analytics = typeof MOCK_ANALYTICS;
type Call = (typeof MOCK_CALLS)[number];
type Knowledge = (typeof MOCK_KNOWLEDGE)[number];

interface MockChatContextType {
  // Auth
  user: null;
  isAuthenticated: false;
  isLoading: false;
  logout: () => void;
  // Agents
  agents: Agent[];
  listAgents: { data: Agent[]; isLoading: boolean };
  getHistory: (agentId: number | null) => {
    data: Message[] | undefined;
    isLoading: boolean;
  };
  sendMessage: { mutate: (vars: { agentId: number; content: string }) => void; isPending: boolean };
  createAgent: { mutate: (vars: Omit<Agent, "id" | "createdAt" | "status">) => void; isPending: boolean };
  deleteAgent: { mutate: (vars: { id: number }) => void };
  // Agent detail
  getAgent: (id: number) => { data: Agent | undefined; isLoading: boolean };
  updateAgent: { mutate: (vars: { id: number; data: Partial<Agent> }) => void; isPending: boolean };
  getAnalytics: (agentId: number) => { data: Analytics; isLoading: boolean };
  getCalls: (agentId: number) => { data: Call[]; isLoading: boolean };
  getKnowledge: (agentId: number) => { data: Knowledge[]; isLoading: boolean };
  addKnowledge: { mutate: (vars: { agentId: number; title: string; content: string; type?: string }) => void; isPending: boolean };
  deleteKnowledge: { mutate: (vars: { id: number }) => void };
  createCall: { mutate: (vars: { agentId: number; type: string; title: string; scheduledAt: Date; duration?: number; notes?: string }) => void; isPending: boolean };
  utils: {
    invalidate: () => void;
  };
}

const MockChatContext = createContext<MockChatContextType | null>(null);

function useMockChatContext() {
  const ctx = useContext(MockChatContext);
  if (!ctx) throw new Error("useMockChatContext must be used within MockTRPCProvider");
  return ctx;
}

// ─── Mock hooks ───
export function useMockAuth() {
  const ctx = useMockChatContext();
  return {
    user: ctx.user,
    isAuthenticated: ctx.isAuthenticated,
    isLoading: ctx.isLoading,
    error: null,
    logout: ctx.logout,
    refresh: () => {},
  };
}

export function useMockChat() {
  const ctx = useMockChatContext();
  return {
    agents: ctx.agents,
    isLoading: ctx.listAgents.isLoading,
    sendMessage: ctx.sendMessage.mutate,
    isSending: ctx.sendMessage.isPending,
    createAgent: ctx.createAgent.mutate,
    isCreating: ctx.createAgent.isPending,
    deleteAgent: ctx.deleteAgent.mutate,
    getHistoryQuery: ctx.getHistory,
  };
}

export function useMockAgent() {
  const ctx = useMockChatContext();
  return {
    getAgent: ctx.getAgent,
    updateAgent: ctx.updateAgent,
    getAnalytics: ctx.getAnalytics,
    getCalls: ctx.getCalls,
    createCall: ctx.createCall,
    getKnowledge: ctx.getKnowledge,
    addKnowledge: ctx.addKnowledge,
    deleteKnowledge: ctx.deleteKnowledge,
  };
}

// ─── Provider ───
export function MockTRPCProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [messages, setMessages] = useState<Record<number, Message[]>>(MOCK_MESSAGES);
  const [isSending, setIsSending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [knowledgeStore, setKnowledgeStore] = useState<Knowledge[]>(MOCK_KNOWLEDGE);
  const [callsStore, setCallsStore] = useState<Call[]>(MOCK_CALLS);

  // Auth
  const user = null;
  const isAuthenticated = false;
  const isLoading = false;
  const logout = useCallback(() => {}, []);

  // Agents
  const listAgents = { data: agents, isLoading: false };

  const getHistory = useCallback(
    (agentId: number | null) => {
      if (!agentId) return { data: undefined, isLoading: false };
      return {
        data: messages[agentId] ?? [],
        isLoading: false,
      };
    },
    [messages]
  );

  const sendMessage = {
    mutate: useCallback(
      ({ agentId, content }: { agentId: number; content: string }) => {
        setIsSending(true);
        const userMsg: Message = {
          id: Date.now(),
          agentId,
          role: "user",
          content,
          createdAt: new Date(),
        };
        setMessages((prev) => ({
          ...prev,
          [agentId]: [...(prev[agentId] ?? []), userMsg],
        }));

        // Simulated AI response after delay
        setTimeout(() => {
          const agent = agents.find((a) => a.id === agentId);
          const responses: Record<number, string> = {
            1: `Je vais vous aider avec votre communication. ${content.length > 20 ? "Excellente stratégie !" : "Pouvez-vous m'en dire plus ?"}`,
            2: `Pour le volet RH, ${content.length > 20 ? "je vais analyser cela pour vous." : "précisez votre besoin."}`,
          };
          const agentMsg: Message = {
            id: Date.now() + 1,
            agentId,
            role: "agent",
            content:
              responses[agentId] ??
              `En tant qu'agent ${agent?.name ?? ""}, je traite votre demande : "${content}"`,
            createdAt: new Date(),
          };
          setMessages((prev) => ({
            ...prev,
            [agentId]: [...(prev[agentId] ?? []), agentMsg],
          }));
          setIsSending(false);
        }, 1200);
      },
      [agents]
    ),
    isPending: isSending,
  };

  const createAgent = {
    mutate: useCallback(
      (vars: Omit<Agent, "id" | "createdAt" | "status">) => {
        setIsCreating(true);
        const newAgent: Agent = {
          ...vars,
          id: agents.length + 1,
          status: "active",
          createdAt: new Date(),
        };
        setAgents((prev) => [...prev, newAgent]);
        setIsCreating(false);
      },
      [agents]
    ),
    isPending: isCreating,
  };

  const deleteAgent = {
    mutate: useCallback(({ id }: { id: number }) => {
      setAgents((prev) => prev.filter((a) => a.id !== id));
    }, []),
  };

  // Agent detail
  const getAgent = useCallback(
    (id: number) => {
      return { data: agents.find((a) => a.id === id), isLoading: false };
    },
    [agents]
  );

  const updateAgent = {
    mutate: useCallback(
      ({ id, data }: { id: number; data: Partial<Agent> }) => {
        setIsUpdating(true);
        setAgents((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...data } : a))
        );
        setIsUpdating(false);
      },
      []
    ),
    isPending: isUpdating,
  };

  const getAnalytics = useCallback(
    (_agentId: number) => {
      return { data: MOCK_ANALYTICS, isLoading: false };
    },
    []
  );

  const getCalls = useCallback(
    (agentId: number) => {
      return { data: callsStore.filter((c) => c.agentId === agentId), isLoading: false };
    },
    [callsStore]
  );

  const createCall = {
    mutate: useCallback(
      (vars: { agentId: number; type: string; title: string; scheduledAt: Date; duration?: number; notes?: string }) => {
        const newCall: Call = {
          id: callsStore.length + 1,
          agentId: vars.agentId,
          type: vars.type,
          title: vars.title,
          status: "scheduled",
          duration: vars.duration ?? 1800,
          scheduledAt: vars.scheduledAt,
          notes: vars.notes ?? "",
        };
        setCallsStore((prev) => [...prev, newCall]);
      },
      [callsStore]
    ),
    isPending: false,
  };

  const getKnowledge = useCallback(
    (agentId: number) => {
      return { data: knowledgeStore.filter((k) => k.agentId === agentId), isLoading: false };
    },
    [knowledgeStore]
  );

  const addKnowledge = {
    mutate: useCallback(
      (vars: { agentId: number; title: string; content: string; type?: string }) => {
        const newKnowledge: Knowledge = {
          id: knowledgeStore.length + 1,
          agentId: vars.agentId,
          title: vars.title,
          content: vars.content,
          type: vars.type ?? "document",
          createdAt: new Date(),
        };
        setKnowledgeStore((prev) => [...prev, newKnowledge]);
      },
      [knowledgeStore]
    ),
    isPending: false,
  };

  const deleteKnowledge = {
    mutate: useCallback(({ id }: { id: number }) => {
      setKnowledgeStore((prev) => prev.filter((k) => k.id !== id));
    }, []),
  };

  const utils = { invalidate: () => {} };

  const value: MockChatContextType = {
    user,
    isAuthenticated,
    isLoading,
    logout,
    agents,
    listAgents,
    getHistory,
    sendMessage,
    createAgent,
    deleteAgent,
    getAgent,
    updateAgent,
    getAnalytics,
    getCalls,
    createCall,
    getKnowledge,
    addKnowledge,
    deleteKnowledge,
    utils,
  };

  return (
    <MockChatContext.Provider value={value}>
      {children}
    </MockChatContext.Provider>
  );
}
