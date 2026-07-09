export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  capabilities: string[];
  status: 'online' | 'offline' | 'busy';
  tools: string[];
  conversations: number;
  responseTime: string;
  satisfaction: string;
  personality?: string;
  proactivity?: string;
  systemInstructions?: string;
}

export interface Message {
  id: string;
  agentId: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

export interface Conversation {
  id: string;
  agentId: string;
  messages: Message[];
  lastMessage: string;
  timestamp: Date;
  unread: number;
}

export interface AgentCreationData {
  name: string;
  role: string;
  description: string;
  avatar: string;
  personality: string;
  proactivity: string;
  capabilities: string[];
  tools: string[];
  systemInstructions: string;
}
