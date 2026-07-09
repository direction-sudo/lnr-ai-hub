import { useState, useRef, useEffect } from 'react';
import { Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Bot, MessageSquare, Plus, Search, Phone,
  MoreVertical, Send, Paperclip, ChevronLeft, Check, Wand2,
  Mail, Users, Calendar, FileText, Instagram, Sparkles,
  ChevronRight, Menu, LayoutDashboard, Star, PenTool,
  Target, Clock
} from 'lucide-react';
import { useAgentStore } from '@/hooks/useStore';
import type { Message } from '@/types';

const ALL_AVATARS = [
  '/images/avatar-nora.png',
  '/images/avatar-leo.png',
  '/images/avatar-siya.png',
  '/images/avatar-placeholder-1.png',
  '/images/avatar-placeholder-2.png',
  '/images/avatar-placeholder-3.png',
];

const TOOLS_LIST = [
  { name: 'LinkedIn', icon: Users },
  { name: 'Instagram', icon: Instagram },
  { name: 'Gmail', icon: Mail },
  { name: 'Google Calendar', icon: Calendar },
  { name: 'Slack', icon: MessageSquare },
  { name: 'Notion', icon: FileText },
  { name: 'WordPress', icon: LayoutDashboard },
];

const CAPABILITY_OPTIONS = ['Rédaction', 'Visuels', 'Analytics', 'Community Mgmt', 'Recrutement', 'Screening', 'Entretiens', 'Onboarding', 'Planning RH', 'Reporting'];

const NORA_QUICK_PROMPTS = [
  'Rédige 3 posts LinkedIn pour notre lancement',
  'Crée mon calendrier éditorial de la semaine',
  'Analyse mes performances LinkedIn',
  'Rédige une newsletter sur notre nouvelle offre',
  'Quels sont les hashtags tendants dans mon secteur ?',
  'Prépare 5 visuels Instagram pour la semaine',
];

const LEO_QUICK_PROMPTS = [
  'Rédige une offre d\'emploi Développeur Full Stack',
  'Screening des 34 CV pour Commercial B2B',
  'Prépare un process d\'onboarding',
  'Rapport RH mensuel',
  'Planifie mes entretiens de la semaine',
  'Publie mon offre sur LinkedIn',
];

/* ─────────── SIDEBAR ─────────── */
function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const location = useLocation();
  const { agents } = useAgentStore();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: 'Accueil', icon: Home },
    { path: '/dashboard/agents', label: 'Mes Agents', icon: Bot },
    { path: '/dashboard/chat/nora', label: 'Communication', icon: MessageSquare },
    { path: '/dashboard/chat/leo', label: 'RH', icon: Users },
    { path: '/dashboard/create', label: 'Créer un agent', icon: Plus },
  ];

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-[280px] flex-shrink-0 z-50 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          background: 'rgba(17, 17, 19, 0.95)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="p-5">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <span className="text-lg font-extrabold text-[#D4A853]" style={{ fontFamily: 'var(--font-heading)' }}>
              LNR
            </span>
            <span className="text-sm font-medium text-[#FAFAFA]">AI HUB</span>
          </Link>

          <button
            onClick={() => { navigate('/dashboard/create'); onClose(); }}
            className="w-full gold-gradient text-[#0A0A0B] font-semibold h-11 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all mb-6"
          >
            <Plus size={16} />
            Créer un agent
          </button>

          <nav className="space-y-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[rgba(212,168,83,0.1)] text-[#D4A853] border-l-[3px] border-l-[#D4A853]'
                      : 'text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#FAFAFA]'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-5 border-t border-white/5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#52525B] mb-3">Agents actifs</p>
          <div className="space-y-1">
            {agents.filter(a => ['nora', 'leo'].includes(a.id)).map(agent => (
              <button
                key={agent.id}
                onClick={() => { navigate(`/dashboard/chat/${agent.id}`); onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors text-left ${
                  location.pathname.includes(`/chat/${agent.id}`) ? 'bg-[rgba(212,168,83,0.08)]' : ''
                }`}
              >
                <div className="relative">
                  <img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-full object-cover" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#22C55E] rounded-full ring-2 ring-[#111113]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-[#FAFAFA] block truncate">{agent.name}</span>
                  <span className="text-[10px] text-[#52525B] truncate block">{agent.role}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
            <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center text-[#0A0A0B] text-sm font-bold">
              RY
            </div>
            <div>
              <p className="text-sm font-semibold text-[#FAFAFA]">Raad Yassir</p>
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Admin</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ─────────── AGENT LIST ─────────── */
function AgentListView() {
  const { agents } = useAgentStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = agents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#FAFAFA] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Mes Agents
        </h1>
        <p className="text-[#A1A1AA] text-sm">Nora pour votre communication, Leo pour vos RH. Créez-en d'autres si besoin.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" />
          <input
            type="text"
            placeholder="Rechercher un agent..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 bg-[#18181B] border border-white/5 rounded-lg pl-10 pr-4 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none focus:border-[#D4A853]/30 transition-colors"
          />
        </div>
        <button
          onClick={() => navigate('/dashboard/create')}
          className="gold-gradient text-[#0A0A0B] font-semibold px-5 py-2.5 rounded-lg hover:brightness-110 transition-all flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          Créer un agent
        </button>
      </div>

      {/* Featured agents - Nora & Leo */}
      <div className="grid lg:grid-cols-2 gap-5 mb-8">
        {filtered.filter(a => ['nora', 'leo'].includes(a.id)).map(agent => (
          <div key={agent.id} className="glass-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#D4A853]/30 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(212,168,83,0.03)] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <img src={agent.avatar} alt={agent.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-[#D4A853]/30 group-hover:ring-[#D4A853]/60 transition-all" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#22C55E] rounded-full ring-2 ring-[#111113]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>{agent.name}</h3>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#D4A853]">{agent.role}</p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-[rgba(34,197,94,0.1)] text-[#22C55E] rounded-full border border-[rgba(34,197,94,0.2)]">
                  Principal
                </span>
              </div>

              <p className="text-sm text-[#A1A1AA] mb-4">{agent.description}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {agent.capabilities.slice(0, 4).map(cap => (
                  <span key={cap} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[rgba(212,168,83,0.08)] text-[#D4A853] border border-[rgba(212,168,83,0.15)]">
                    {cap}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 mb-4 text-[10px] text-[#52525B]">
                <span className="flex items-center gap-1"><MessageSquare size={11} />{agent.conversations} conversations</span>
                <span className="flex items-center gap-1"><Clock size={11} />{agent.responseTime}</span>
                <span className="flex items-center gap-1"><Star size={11} />{agent.satisfaction}</span>
              </div>

              <button
                onClick={() => navigate(`/dashboard/chat/${agent.id}`)}
                className="w-full gold-gradient text-[#0A0A0B] text-sm font-semibold py-2.5 rounded-lg hover:brightness-110 transition-all"
              >
                Discuter avec {agent.name}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom agents */}
      {filtered.filter(a => !['nora', 'leo'].includes(a.id)).length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[#52525B] mb-3">Vos agents personnalisés</p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.filter(a => !['nora', 'leo'].includes(a.id)).map(agent => (
              <div key={agent.id} className="glass-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#D4A853]/30 group">
                <div className="flex items-center gap-3 mb-3">
                  <img src={agent.avatar} alt={agent.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h3 className="text-sm font-bold text-[#FAFAFA]">{agent.name}</h3>
                    <p className="text-[10px] text-[#D4A853]">{agent.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/dashboard/chat/${agent.id}`)}
                  className="w-full text-sm font-medium text-[#D4A853] border border-[#D4A853]/30 py-2 rounded-lg hover:bg-[rgba(212,168,83,0.1)] transition-all"
                >
                  Discuter
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create card */}
      <button
        onClick={() => navigate('/dashboard/create')}
        className="w-full border-2 border-dashed border-[rgba(212,168,83,0.3)] rounded-2xl flex flex-col items-center justify-center gap-3 p-8 min-h-[140px] hover:border-[#D4A853] hover:bg-[rgba(212,168,83,0.03)] transition-all group"
      >
        <div className="w-10 h-10 rounded-full bg-[rgba(212,168,83,0.1)] flex items-center justify-center group-hover:bg-[rgba(212,168,83,0.2)] transition-all">
          <Plus size={20} className="text-[#D4A853]" />
        </div>
        <span className="text-sm font-medium text-[#D4A853]">Créer un nouvel agent</span>
      </button>
    </div>
  );
}

/* ─────────── CHAT PAGE ─────────── */
function ChatPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { agents, sendMessage, getMessages, markAsRead } = useAgentStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const agent = agents.find(a => a.id === agentId) || agents[0];
  const messages = getMessages(agent?.id || 'nora');

  const quickPrompts = agent?.id === 'nora' ? NORA_QUICK_PROMPTS : agent?.id === 'leo' ? LEO_QUICK_PROMPTS : [];

  useEffect(() => {
    if (agentId) markAsRead(agentId);
  }, [agentId, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    setIsTyping(false);
  }, [messages.length]);

  const handleSend = (text?: string) => {
    const content = text || input;
    if (!content.trim() || !agent) return;
    sendMessage(agent.id, content.trim());
    setInput('');
    setIsTyping(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-0px)] lg:h-screen flex flex-col" style={{ background: 'rgba(10, 10, 11, 0.85)' }}>
      {/* Chat Header */}
      <div className="h-16 flex items-center gap-4 px-6 border-b border-white/5 flex-shrink-0">
        <button onClick={() => navigate('/dashboard/agents')} className="lg:hidden text-[#A1A1AA] hover:text-[#FAFAFA]">
          <ChevronLeft size={20} />
        </button>
        <div className="relative">
          <img src={agent?.avatar} alt={agent?.name} className="w-10 h-10 rounded-full object-cover" />
          {agent?.status === 'online' && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#22C55E] rounded-full ring-2 ring-[#0A0A0B]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#FAFAFA]">{agent?.name}</p>
          <p className="text-xs text-[#22C55E]">{agent?.role}</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-9 h-9 flex items-center justify-center rounded-lg text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/5 transition-all">
            <Phone size={16} />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/5 transition-all">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-full bg-[rgba(212,168,83,0.1)] flex items-center justify-center mb-6">
              <img src={agent?.avatar} alt={agent?.name} className="w-14 h-14 rounded-full object-cover" />
            </div>
            <h3 className="text-lg font-semibold text-[#FAFAFA] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              {agent?.name} est prêt
            </h3>
            <p className="text-sm text-[#A1A1AA] max-w-sm mb-6">
              {agent?.description}
            </p>
            {quickPrompts.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {quickPrompts.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="px-3 py-2 text-xs font-medium rounded-full bg-[rgba(212,168,83,0.08)] text-[#D4A853] border border-[rgba(212,168,83,0.15)] hover:bg-[rgba(212,168,83,0.15)] transition-all text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((msg: Message) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
              {msg.sender === 'agent' && (
                <img src={agent?.avatar} alt={agent?.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" />
              )}
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'gold-gradient text-[#0A0A0B] font-medium rounded-tr-sm'
                    : 'bg-[#18181B] border border-white/5 text-[#FAFAFA] rounded-tl-sm'
                }`}
              >
                {msg.content}
                <div className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-[#0A0A0B]/60' : 'text-[#52525B]'}`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex items-start gap-2">
            <img src={agent?.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            <div className="bg-[#18181B] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#52525B] rounded-full typing-dot" />
              <span className="w-2 h-2 bg-[#52525B] rounded-full typing-dot" />
              <span className="w-2 h-2 bg-[#52525B] rounded-full typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-white/5 px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/5 transition-all flex-shrink-0">
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message à ${agent?.name}...`}
            className="flex-1 h-12 bg-[#18181B] border border-white/5 rounded-full px-5 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none focus:border-[#D4A853]/30 transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="w-11 h-11 gold-gradient rounded-full flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send size={16} className="text-[#0A0A0B]" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── CREATE AGENT ─────────── */
function CreateAgentView() {
  const navigate = useNavigate();
  const { addAgent } = useAgentStore();
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: '',
    description: '',
    avatar: ALL_AVATARS[3],
    personality: '50',
    proactivity: '50',
    capabilities: [] as string[],
    tools: [] as string[],
    systemInstructions: '',
  });

  const toggleCapability = (cap: string) => {
    setForm(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter(c => c !== cap)
        : [...prev.capabilities, cap],
    }));
  };

  const toggleTool = (tool: string) => {
    setForm(prev => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool],
    }));
  };

  const applyTemplate = (type: 'com' | 'rh') => {
    if (type === 'com') {
      setForm(prev => ({
        ...prev,
        name: prev.name || 'Assistant Com',
        role: 'Agent Communication',
        capabilities: ['Rédaction', 'Visuels', 'Analytics', 'Community Mgmt'],
        tools: ['LinkedIn', 'Instagram', 'Gmail'],
      }));
    } else {
      setForm(prev => ({
        ...prev,
        name: prev.name || 'Assistant RH',
        role: 'Agent RH',
        capabilities: ['Recrutement', 'Screening', 'Entretiens', 'Onboarding'],
        tools: ['LinkedIn', 'Google Calendar', 'Slack'],
      }));
    }
  };

  const handleCreate = () => {
    if (!form.name.trim()) return;
    const newAgent = {
      id: `agent-${Date.now()}`,
      name: form.name,
      role: form.role || 'Agent personnalisé',
      description: form.description || `Agent IA personnalisé créé par vous.`,
      avatar: form.avatar,
      capabilities: form.capabilities.length > 0 ? form.capabilities : ['Généraliste'],
      status: 'online' as const,
      tools: form.tools,
      conversations: 0,
      responseTime: '2s',
      satisfaction: '5.0/5',
      personality: form.personality,
      proactivity: form.proactivity,
      systemInstructions: form.systemInstructions,
    };
    addAgent(newAgent);
    setShowSuccess(true);
    setTimeout(() => navigate(`/dashboard/chat/${newAgent.id}`), 2000);
  };

  return (
    <div className="p-6 lg:p-10 overflow-y-auto h-screen" style={{ background: 'rgba(10, 10, 11, 0.85)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#FAFAFA] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Créer un nouvel agent
          </h1>
          <p className="text-[#A1A1AA] text-sm">
            Personnalisez votre agent ou partez d'un template prêt à l'emploi.
          </p>
        </div>

        {/* Templates */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => applyTemplate('com')}
            className="glass-card p-4 text-left transition-all hover:border-[#D4A853]/30 hover:-translate-y-0.5 group"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[rgba(212,168,83,0.1)] flex items-center justify-center">
                <Instagram size={14} className="text-[#D4A853]" />
              </div>
              <span className="text-sm font-semibold text-[#FAFAFA]">Template Com</span>
            </div>
            <p className="text-[11px] text-[#52525B]">Réseaux sociaux, rédaction, visuels, analytics</p>
          </button>
          <button
            onClick={() => applyTemplate('rh')}
            className="glass-card p-4 text-left transition-all hover:border-[#D4A853]/30 hover:-translate-y-0.5 group"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[rgba(212,168,83,0.1)] flex items-center justify-center">
                <Users size={14} className="text-[#D4A853]" />
              </div>
              <span className="text-sm font-semibold text-[#FAFAFA]">Template RH</span>
            </div>
            <p className="text-[11px] text-[#52525B]">Recrutement, screening, entretiens, onboarding</p>
          </button>
        </div>

        <div className="space-y-6">
          {/* Identité */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-[#FAFAFA] mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-[#D4A853]" />
              Identité
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#A1A1AA] mb-1.5 block">Nom de l'agent *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Maxime"
                  className="w-full h-10 bg-[#18181B] border border-white/5 rounded-lg px-4 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none focus:border-[#D4A853]/30"
                />
              </div>
              <div>
                <label className="text-xs text-[#A1A1AA] mb-1.5 block">Rôle / Titre</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="Ex: Agent Comptable"
                  className="w-full h-10 bg-[#18181B] border border-white/5 rounded-lg px-4 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none focus:border-[#D4A853]/30"
                />
              </div>
              <div>
                <label className="text-xs text-[#A1A1AA] mb-2 block">Avatar</label>
                <div className="flex gap-3">
                  {ALL_AVATARS.map(src => (
                    <button
                      key={src}
                      onClick={() => setForm(prev => ({ ...prev, avatar: src }))}
                      className={`w-14 h-14 rounded-full overflow-hidden ring-2 transition-all ${
                        form.avatar === src ? 'ring-[#D4A853] scale-110' : 'ring-transparent hover:ring-[#D4A853]/50'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Personnalité */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-[#FAFAFA] mb-4 flex items-center gap-2">
              <Wand2 size={16} className="text-[#D4A853]" />
              Personnalité
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#A1A1AA] mb-1.5 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez ce que cet agent fait..."
                  rows={3}
                  className="w-full bg-[#18181B] border border-white/5 rounded-lg px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none focus:border-[#D4A853]/30 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#A1A1AA] mb-2 block">Ton de communication</label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#52525B]">Professionnel</span>
                  <input type="range" min="0" max="100" value={form.personality}
                    onChange={e => setForm(prev => ({ ...prev, personality: e.target.value }))}
                    className="flex-1 h-1.5 bg-[#18181B] rounded-full appearance-none cursor-pointer accent-[#D4A853]" />
                  <span className="text-xs text-[#52525B]">Créatif</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compétences */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-[#FAFAFA] mb-4 flex items-center gap-2">
              <Star size={16} className="text-[#D4A853]" />
              Compétences clés
            </h3>
            <div className="flex flex-wrap gap-2">
              {CAPABILITY_OPTIONS.map(cap => (
                <button
                  key={cap}
                  onClick={() => toggleCapability(cap)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    form.capabilities.includes(cap)
                      ? 'bg-[rgba(212,168,83,0.2)] text-[#D4A853] border-[rgba(212,168,83,0.3)]'
                      : 'bg-transparent text-[#A1A1AA] border-white/10 hover:border-white/20'
                  }`}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>

          {/* Outils */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-[#FAFAFA] mb-4 flex items-center gap-2">
              <Link2Icon size={16} className="text-[#D4A853]" />
              Outils connectés
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TOOLS_LIST.map(tool => {
                const Icon = tool.icon;
                const isActive = form.tools.includes(tool.name);
                return (
                  <button
                    key={tool.name}
                    onClick={() => toggleTool(tool.name)}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all text-left ${
                      isActive ? 'bg-[rgba(212,168,83,0.1)] border-[rgba(212,168,83,0.3)]' : 'bg-[#18181B] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-[#D4A853]' : 'text-[#52525B]'} />
                    <span className={`text-xs ${isActive ? 'text-[#D4A853]' : 'text-[#A1A1AA]'}`}>{tool.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pb-10">
            <button
              onClick={handleCreate}
              disabled={!form.name.trim()}
              className="gold-gradient text-[#0A0A0B] font-semibold px-8 py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Créer l'agent
            </button>
            <button onClick={() => navigate('/dashboard/agents')} className="text-[#52525B] hover:text-[#A1A1AA] text-sm font-medium transition-colors">
              Annuler
            </button>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="glass-card p-8 text-center max-w-sm mx-4 animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-[rgba(34,197,94,0.2)] flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-[#22C55E]" />
            </div>
            <h3 className="text-xl font-bold text-[#FAFAFA] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Agent créé avec succès !
            </h3>
            <p className="text-sm text-[#A1A1AA] mb-4">
              Votre agent <span className="text-[#D4A853] font-semibold">{form.name}</span> est prêt.
            </p>
            <p className="text-xs text-[#52525B]">Redirection en cours...</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────── DASHBOARD HOME ─────────── */
function DashboardHome() {
  const { agents, conversations } = useAgentStore();
  const navigate = useNavigate();

  const totalConversations = conversations.reduce((sum, c) => sum + c.messages.length, 0);
  const recentConvos = [...conversations]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 lg:p-10 overflow-y-auto h-screen" style={{ background: 'rgba(10, 10, 11, 0.85)' }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#FAFAFA] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Tableau de bord
        </h1>
        <p className="text-[#A1A1AA] text-sm">Vue d'ensemble de votre communication et RH.</p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {agents.filter(a => ['nora', 'leo'].includes(a.id)).map(agent => (
          <button
            key={agent.id}
            onClick={() => navigate(`/dashboard/chat/${agent.id}`)}
            className="glass-card p-5 text-left transition-all hover:-translate-y-1 hover:border-[#D4A853]/30 group"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={agent.avatar} alt={agent.name} className="w-14 h-14 rounded-full object-cover" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#22C55E] rounded-full ring-2 ring-[#111113]" />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>{agent.name}</p>
                <p className="text-xs text-[#D4A853] mb-1">{agent.role}</p>
                <p className="text-xs text-[#52525B]">{agent.conversations} conversations · {agent.satisfaction}</p>
              </div>
              <ChevronRight size={18} className="text-[#52525B] group-hover:text-[#D4A853] transition-colors" />
            </div>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Messages échangés', value: totalConversations, icon: MessageSquare, color: '#D4A853' },
          { label: 'Agents actifs', value: agents.length, icon: Bot, color: '#22C55E' },
          { label: 'Posts rédigés', value: 342, icon: PenTool, color: '#3B82F6' },
          { label: 'CV screenés', value: 218, icon: Target, color: '#A855F7' },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={16} style={{ color: stat.color }} />
              <span className="text-xl font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>{stat.value}</span>
            </div>
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent conversations */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-[#FAFAFA] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
          Conversations récentes
        </h3>
        {recentConvos.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={24} className="text-[#52525B] mx-auto mb-3" />
            <p className="text-sm text-[#52525B]">Aucune conversation récente</p>
            <p className="text-xs text-[#52525B] mt-1">Commencez par discuter avec Nora ou Leo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentConvos.map(conv => {
              const agent = agents.find(a => a.id === conv.agentId);
              if (!agent) return null;
              return (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/dashboard/chat/${conv.agentId}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <img src={agent.avatar} alt={agent.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[#FAFAFA]">{agent.name}</p>
                      <span className="text-[10px] text-[#52525B]">
                        {new Date(conv.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-[#52525B] truncate">{conv.lastMessage.slice(0, 80)}...</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 gold-gradient rounded-full flex items-center justify-center text-[10px] font-bold text-[#0A0A0B] flex-shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────── MAIN LAYOUT ─────────── */
export default function DashboardPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const isChatRoute = location.pathname.includes('/chat/');

  return (
    <div className="relative min-h-screen">
      <div className="lg:grid lg:grid-cols-[280px_1fr] min-h-screen">
        <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

        <div className="lg:hidden h-14 flex items-center px-4 border-b border-white/5" style={{ background: 'rgba(17, 17, 19, 0.95)' }}>
          <button onClick={() => setMobileSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center text-[#A1A1AA]">
            <Menu size={20} />
          </button>
          <span className="ml-3 text-sm font-semibold text-[#FAFAFA]">LNR AI HUB</span>
        </div>

        <main className={`${isChatRoute ? 'fixed inset-0 lg:relative lg:inset-auto z-30 bg-[#0A0A0B]' : ''}`}>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/agents" element={<AgentListView />} />
            <Route path="/chat/:agentId" element={<ChatPage />} />
            <Route path="/create" element={<CreateAgentView />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function Link2Icon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 17H7A5 5 0 0 1 7 7h2" /><path d="M15 7h2a5 5 0 1 1 0 10h-2" /><line x1="8" x2="16" y1="12" y2="12" />
    </svg>
  );
}
