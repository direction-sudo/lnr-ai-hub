import { useState, useCallback, useEffect, useRef } from 'react';
import { sendMessageToAI, hasApiKey } from '@/lib/ai-service';
import { MOCK_AGENTS } from '@/providers/mockData';
import { trpc } from '@/providers/trpc';

export interface ChatMessage {
  id: number;
  agentId: number;
  role: "user" | "agent";
  content: string;
  createdAt: Date;
}

export interface Agent {
  id: number;
  slug: string;
  name: string;
  role: string;
  description: string | null;
  avatar: string | null;
  systemPrompt: string | null;
  capabilities: string[];
  tools: string[];
  personality: string | null;
  aiModel: string | null;
  isDefault: string;
  status: string;
  createdAt: Date;
}

// ─── Persistent nextId ───
function getNextId(): number {
  const stored = localStorage.getItem('lnr_next_msg_id');
  const id = stored ? parseInt(stored, 10) : 1000;
  const next = id + 1;
  localStorage.setItem('lnr_next_msg_id', next.toString());
  return next;
}

// ─── Load agents from localStorage or use defaults ───
function loadAgents(): Agent[] {
  const stored = localStorage.getItem('lnr_agents');
  if (stored) {
    return JSON.parse(stored, (key, value) => {
      if (key === 'createdAt') return new Date(value);
      return value;
    });
  }
  return MOCK_AGENTS.map(a => ({ ...a, status: 'active' as string }));
}

// ─── Load messages from localStorage ───
function loadMessages(): Record<number, ChatMessage[]> {
  const stored = localStorage.getItem('lnr_messages');
  if (stored) {
    const parsed = JSON.parse(stored, (key, value) => {
      if (key === 'createdAt') return new Date(value);
      return value;
    });
    return parsed;
  }
  return {
    1: [{
      id: 1,
      agentId: 1,
      role: "agent" as const,
      content: "Bonjour ! Je suis Nora, votre agent de communication. Comment puis-je vous aider aujourd'hui ?",
      createdAt: new Date(),
    }],
    2: [{
      id: 2,
      agentId: 2,
      role: "agent" as const,
      content: "Bonjour ! Je suis Leo, votre agent RH. Prêt à optimiser vos processus recrutement ?",
      createdAt: new Date(),
    }],
  };
}

// ─── Save to localStorage ───
function saveAgents(agents: Agent[]) {
  localStorage.setItem('lnr_agents', JSON.stringify(agents));
}

function saveMessages(messages: Record<number, ChatMessage[]>) {
  localStorage.setItem('lnr_messages', JSON.stringify(messages));
}

export function useRealChat() {
  const [agents, setAgents] = useState<Agent[]>(loadAgents);
  const [messages, setMessages] = useState<Record<number, ChatMessage[]>>(loadMessages);
  const [isSending, setIsSending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [apiKeyConfigured] = useState(hasApiKey);
  const [isPublishing, setIsPublishing] = useState(false);

  // ─── Refs for stable access (no stale closure) ───
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const agentsRef = useRef(agents);
  agentsRef.current = agents;
  const isSendingRef = useRef(false);

  // tRPC mutation for IFTTT publishing
  const publishMutation = trpc.ifttt.publish.useMutation();

  // Persist whenever state changes
  useEffect(() => { saveAgents(agents); }, [agents]);
  useEffect(() => { saveMessages(messages); }, [messages]);

  // ─── Get history for an agent ───
  const getHistory = useCallback((agentId: number | null): ChatMessage[] => {
    if (!agentId) return [];
    return messagesRef.current[agentId] ?? [];
  }, []);

  // ─── Send message (stable: uses refs, no deps) ───
  const sendMessage = useCallback(async (agentId: number, content: string) => {
    const agent = agentsRef.current.find(a => a.id === agentId);
    if (!agent) return;

    // Prevent double-send using ref (not state)
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    setIsSending(true);

    // Build user message
    const userMsg: ChatMessage = {
      id: getNextId(),
      agentId,
      role: "user",
      content,
      createdAt: new Date(),
    };

    // Get previous history BEFORE updating state
    const prevHistory = messagesRef.current[agentId] ?? [];
    const fullHistory = [...prevHistory, userMsg];

    // Add user message to state
    setMessages(prev => {
      const updated = { ...prev, [agentId]: [...(prev[agentId] ?? []), userMsg] };
      return updated;
    });

    try {
      // Call AI with full history (including user message)
      const aiResponse = await sendMessageToAI(
        agent.slug,
        fullHistory.map(m => ({ role: m.role, content: m.content })),
        content
      );

      const agentMsg: ChatMessage = {
        id: getNextId(),
        agentId,
        role: "agent",
        content: aiResponse,
        createdAt: new Date(),
      };

      setMessages(prev => {
        const updated = { ...prev, [agentId]: [...(prev[agentId] ?? []), agentMsg] };
        return updated;
      });
    } catch (err) {
      console.error("[sendMessage] Error:", err);
      const errorMsg: ChatMessage = {
        id: getNextId(),
        agentId,
        role: "agent",
        content: "❌ Une erreur s'est produite. Veuillez réessayer.",
        createdAt: new Date(),
      };
      setMessages(prev => {
        const updated = { ...prev, [agentId]: [...(prev[agentId] ?? []), errorMsg] };
        return updated;
      });
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  }, []);

  // ─── Publish content to social media ───
  const publishContent = useCallback(async (content: string, platforms: string[]) => {
    setIsPublishing(true);
    try {
      const result = await publishMutation.mutateAsync({
        content,
        platforms: platforms as ("facebook" | "linkedin" | "instagram" | "twitter")[],
      });
      return result;
    } catch (err) {
      console.error("[Publish] Error:", err);
      throw err;
    } finally {
      setIsPublishing(false);
    }
  }, [publishMutation]);

  // ─── Create agent ───
  const createAgent = useCallback((data: {
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
    setIsCreating(true);
    const nextId = agentsRef.current.length > 0
      ? Math.max(...agentsRef.current.map(a => a.id)) + 1
      : 1;
    const newAgent: Agent = {
      id: nextId,
      slug: data.slug,
      name: data.name,
      role: data.role,
      description: data.description ?? null,
      avatar: data.avatar ?? null,
      systemPrompt: data.systemPrompt,
      capabilities: data.capabilities ?? [],
      tools: data.tools ?? [],
      personality: data.personality ?? 'balanced',
      aiModel: 'kimi-latest',
      isDefault: 'false',
      status: 'active',
      createdAt: new Date(),
    };
    setAgents(prev => [...prev, newAgent]);
    setIsCreating(false);
  }, []);

  // ─── Delete agent ───
  const deleteAgent = useCallback((id: number) => {
    setAgents(prev => prev.filter(a => a.id !== id));
    setMessages(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  }, []);

  // ─── Update agent ───
  const updateAgent = useCallback((id: number, data: Partial<Agent>) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, []);

  // ─── Get analytics (mock) ───
  const getAnalytics = useCallback((agentId: number) => {
    const agentMessages = messagesRef.current[agentId] ?? [];
    return {
      totals: {
        messages: agentMessages.length,
        calls: 0,
        callDuration: 0,
        knowledgeDocs: 0,
      },
      daily: [],
    };
  }, []);

  return {
    agents,
    isLoading: false,
    sendMessage,
    isSending,
    createAgent,
    isCreating,
    deleteAgent,
    getHistory,
    updateAgent,
    getAnalytics,
    apiKeyConfigured,
    publishContent,
    isPublishing,
  };
}
