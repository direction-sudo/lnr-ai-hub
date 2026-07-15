import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  MessageSquare, Phone, Video, BookOpen, BarChart3, Settings,
  Send, Paperclip, ChevronLeft, Upload, Trash2, Clock,
  FileText, TrendingUp, MessageCircle, PhoneOff,
  Loader2, Check
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAgent } from '@/hooks/useAgent';
import type { ChatMessage as Message } from '@/hooks/useRealChat';

type Tab = 'conversation' | 'calls' | 'knowledge' | 'analytics' | 'settings';

const TABS: { id: Tab; label: string; icon: typeof MessageSquare }[] = [
  { id: 'conversation', label: 'Conversation', icon: MessageSquare },
  { id: 'calls', label: 'Appels', icon: Phone },
  { id: 'knowledge', label: 'Connaissances', icon: BookOpen },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

/* ═══════════════════════════ MAIN PAGE ═══════════════════════════ */
export default function AgentDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('conversation');
  const id = Number(agentId) || 0;

  const { agents, getHistory } = useChat();
  const { getById } = useAgent();
  const { data: agentDetail } = getById(id);
  const agent = agents.find(a => a.id === id) || agentDetail;

  if (!agent) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'rgba(10,10,11,0.9)' }}>
        <div className="text-center">
          <p className="text-[#52525B] mb-4">Agent non trouvé</p>
          <button onClick={() => navigate('/dashboard/agents')}
            className="btn-gold text-sm px-5 py-2 rounded-full">
            <span className="relative z-10">Retour aux agents</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex" style={{ background: 'rgba(10,10,11,0.92)' }}>
      {/* Left sidebar */}
      <div className="w-[240px] flex-shrink-0 flex flex-col border-r border-white/[0.04]"
        style={{ background: 'rgba(13,13,15,0.95)' }}>
        {/* Agent header */}
        <div className="p-4 border-b border-white/[0.04]">
          <button onClick={() => navigate('/dashboard/agents')}
            className="flex items-center gap-2 text-[#52525B] hover:text-[#FAFAFA] transition-colors mb-4 text-sm">
            <ChevronLeft size={16} /> Retour
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={agent.avatar || ''} alt={agent.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[#D4A853]/20" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#22C55E] rounded-full ring-2 ring-[#0D0D0F]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#FAFAFA]">{agent.name}</p>
              <p className="text-[10px] text-[#D4A853]">{agent.role}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[rgba(212,168,83,0.08)] text-[#D4A853] border border-[rgba(212,168,83,0.12)]'
                    : 'text-[#52525B] hover:text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.02)]'
                }`}>
                <Icon size={17} /> {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'conversation' && <ConversationTab agent={agent} />}
        {activeTab === 'calls' && <CallsTab agent={agent} />}
        {activeTab === 'knowledge' && <KnowledgeTab agent={agent} />}
        {activeTab === 'analytics' && <AnalyticsTab agent={agent} />}
        {activeTab === 'settings' && <SettingsTab agent={agent} />}
      </div>
    </div>
  );
}

/* ═════════════════ CONVERSATION TAB ═════════════════ */
function ConversationTab({ agent }: { agent: { id: number; name: string; avatar: string | null; role: string; slug: string } }) {
  const [input, setInput] = useState('');
  const [publishPlatforms, setPublishPlatforms] = useState<string[]>(['facebook']);
  const [publishedMsg, setPublishedMsg] = useState<string | null>(null);
  const { sendMessage, isSending, getHistory, publishContent, isPublishing } = useChat();
  const messages: Message[] = getHistory(agent.id);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = (text?: string) => {
    const content = text || input;
    if (!content.trim()) return;
    sendMessage(agent.id, content.trim());
    setInput('');
    setPublishedMsg(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handlePublish = async (msgContent: string) => {
    try {
      await publishContent(msgContent, publishPlatforms);
      setPublishedMsg(msgContent);
    } catch (err) {
      console.error("[Publish] Failed:", err);
    }
  };

  const quickPrompts = agent.slug === 'nora'
    ? ['Rédige 3 posts LinkedIn', 'Calendrier éditorial', 'Analyse mes performances', 'Rédige une newsletter']
    : agent.slug === 'leo'
    ? ['Rédige une offre', 'Screening CV', 'Process onboarding', 'Rapport RH']
    : [];

  const formatTime = (d: Date) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Check if a message contains publishable content (has hashtags or looks like a post)
  const isPublishable = (content: string) => {
    return content.includes('#') || content.includes('📝') || content.includes('🚀') || content.length > 200;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 flex items-center gap-3 px-5 border-b border-white/[0.04] flex-shrink-0">
        <img src={agent.avatar || ''} alt={agent.name} className="w-8 h-8 rounded-full object-cover" />
        <div>
          <p className="text-sm font-semibold text-[#FAFAFA]">{agent.name}</p>
          <p className="text-[10px] text-[#22C55E]">En ligne</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.1)] flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-[#D4A853]" />
            </div>
            <h3 className="text-base font-bold text-[#FAFAFA] mb-1">Nouvelle conversation</h3>
            <p className="text-xs text-[#52525B] mb-5 max-w-sm">Envoyez un message pour commencer à discuter avec {agent.name}.</p>
            {quickPrompts.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {quickPrompts.map(p => (
                  <button key={p} onClick={() => handleSend(p)}
                    className="px-3 py-2 text-xs font-medium rounded-full bg-[rgba(212,168,83,0.06)] text-[#D4A853] border border-[rgba(212,168,83,0.1)] hover:bg-[rgba(212,168,83,0.1)] transition-all">
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((msg: Message, idx: number) => (
            <div key={msg.id}>
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                {msg.role === 'agent' && (
                  <img src={agent.avatar || ''} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                )}
                <div className={`max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'gold-gradient text-[#0A0A0B] font-semibold rounded-tr-sm'
                    : 'bg-[#18181B] border border-white/[0.04] text-[#FAFAFA] rounded-tl-sm'
                }`}>
                  {msg.content}
                  <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-[#0A0A0B]/50' : 'text-[#3F3F46]'}`}>{formatTime(msg.createdAt)}</div>
                </div>
              </div>
              {/* Publish button for agent messages with publishable content */}
              {msg.role === 'agent' && idx === messages.length - 1 && !isSending && isPublishable(msg.content) && (
                <div className="flex justify-start gap-2 mt-2 ml-9">
                  <div className="bg-[#18181B] border border-white/[0.04] rounded-xl px-3 py-2">
                    <p className="text-[10px] text-[#3F3F46] mb-1.5">Publier sur :</p>
                    <div className="flex gap-1.5 mb-2">
                      {['facebook', 'linkedin', 'instagram'].map(p => (
                        <button
                          key={p}
                          onClick={() => setPublishPlatforms(prev =>
                            prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
                          )}
                          className={`px-2 py-1 text-[10px] font-medium rounded-full capitalize transition-all ${
                            publishPlatforms.includes(p)
                              ? 'bg-[#D4A853]/20 text-[#D4A853] border border-[#D4A853]/40'
                              : 'bg-white/[0.03] text-[#3F3F46] border border-white/[0.04]'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handlePublish(msg.content)}
                      disabled={isPublishing || publishPlatforms.length === 0}
                      className="w-full px-3 py-1.5 text-xs font-medium rounded-lg bg-[#D4A853] text-[#0A0A0B] hover:bg-[#C49A4F] disabled:opacity-30 transition-all flex items-center justify-center gap-1.5"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Publication...
                        </>
                      ) : publishedMsg === msg.content ? (
                        <>
                          <Check size={12} />
                          Publié !
                        </>
                      ) : (
                        <>
                          <Send size={12} />
                          Publier
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        {isSending && (
          <div className="flex items-start gap-2">
            <img src={agent.avatar || ''} alt="" className="w-7 h-7 rounded-full object-cover" />
            <div className="bg-[#18181B] border border-white/[0.04] rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#D4A853]/40 rounded-full typing-dot" />
              <span className="w-1.5 h-1.5 bg-[#D4A853]/40 rounded-full typing-dot" />
              <span className="w-1.5 h-1.5 bg-[#D4A853]/40 rounded-full typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-white/[0.04] px-5 py-3">
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 flex items-center justify-center rounded-full text-[#3F3F46] hover:text-[#A1A1AA] hover:bg-white/[0.03] transition-all flex-shrink-0">
            <Paperclip size={16} />
          </button>
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={`Message à ${agent.name}...`}
            className="flex-1 h-10 bg-[#18181B] border border-white/[0.05] rounded-full px-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
          <button onClick={() => handleSend()} disabled={!input.trim() || isSending}
            className="w-9 h-9 btn-gold rounded-full flex items-center justify-center disabled:opacity-30 flex-shrink-0">
            <span className="relative z-10"><Send size={14} className="text-[#0A0A0B]" /></span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════ CALLS TAB ═════════════════ */
function CallsTab({ agent }: { agent: { id: number; name: string; avatar: string | null } }) {
  const { listCalls, createCall } = useAgent();
  const { data: calls = [] } = listCalls(agent.id);
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCall = (type: 'audio' | 'video') => {
    setCallType(type);
    setInCall(true);
    setCallDuration(0);
    createCall({ agentId: agent.id, type, status: 'ongoing' });
    timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
  };

  const endCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setInCall(false);
    createCall({ agentId: agent.id, type: callType, duration: callDuration, status: 'completed' });
    setCallDuration(0);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (inCall) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.15)] flex items-center justify-center mb-6 animate-pulse">
          <img src={agent.avatar || ''} alt={agent.name} className="w-20 h-20 rounded-full object-cover" />
        </div>
        <h3 className="text-xl font-bold text-[#FAFAFA] mb-1">{agent.name}</h3>
        <p className="text-sm text-[#D4A853] mb-2">{callType === 'video' ? 'Visioconférence' : 'Appel vocal'} en cours</p>
        <p className="text-3xl font-mono text-[#FAFAFA] mb-8">{formatDuration(callDuration)}</p>
        <div className="flex items-center gap-4">
          <button onClick={endCall}
            className="w-14 h-14 rounded-full bg-[#EF4444] flex items-center justify-center hover:bg-[#DC2626] transition-all shadow-lg shadow-[rgba(239,68,68,0.3)]">
            <PhoneOff size={22} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-xl font-bold text-[#FAFAFA] mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Appels</h2>

      {/* Start call buttons */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button onClick={() => startCall('audio')}
          className="glass-card p-5 text-center hover:border-[#D4A853]/30 transition-all group">
          <div className="w-12 h-12 rounded-full bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.12)] flex items-center justify-center mx-auto mb-3 group-hover:bg-[rgba(212,168,83,0.15)] transition-all">
            <Phone size={20} className="text-[#D4A853]" />
          </div>
          <p className="text-sm font-semibold text-[#FAFAFA]">Appel vocal</p>
          <p className="text-xs text-[#52525B]">Discuter avec {agent.name}</p>
        </button>
        <button onClick={() => startCall('video')}
          className="glass-card p-5 text-center hover:border-[#D4A853]/30 transition-all group">
          <div className="w-12 h-12 rounded-full bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.12)] flex items-center justify-center mx-auto mb-3 group-hover:bg-[rgba(212,168,83,0.15)] transition-all">
            <Video size={20} className="text-[#D4A853]" />
          </div>
          <p className="text-sm font-semibold text-[#FAFAFA]">Visioconférence</p>
          <p className="text-xs text-[#52525B]">Appel vidéo avec {agent.name}</p>
        </button>
      </div>

      {/* Call history */}
      <h3 className="text-sm font-semibold text-[#FAFAFA] mb-3">Historique</h3>
      {calls.length === 0 ? (
        <div className="text-center py-10">
          <Clock size={24} className="text-[#3F3F46] mx-auto mb-3" />
          <p className="text-sm text-[#52525B]">Aucun appel encore</p>
          <p className="text-xs text-[#3F3F46] mt-1">Lancez votre premier appel ci-dessus</p>
        </div>
      ) : (
        <div className="space-y-2">
          {calls.map(call => (
            <div key={call.id} className="glass-card p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[rgba(212,168,83,0.06)] flex items-center justify-center flex-shrink-0">
                {call.type === 'video' ? <Video size={14} className="text-[#D4A853]" /> : <Phone size={14} className="text-[#D4A853]" />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-[#FAFAFA]">{call.type === 'video' ? 'Visioconférence' : 'Appel vocal'}</p>
                <p className="text-xs text-[#52525B]">{new Date(call.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              <span className="text-xs font-mono text-[#D4A853]">{formatDuration(call.duration)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═════════════════ KNOWLEDGE TAB ═════════════════ */
function KnowledgeTab({ agent }: { agent: { id: number; name: string } }) {
  const { listKnowledge, addKnowledge, deleteKnowledge } = useAgent();
  const { data: docs = [] } = listKnowledge(agent.id);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      addKnowledge({
        agentId: agent.id,
        filename: file.name,
        content: (ev.target?.result as string) || '',
        size: file.size,
      });
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>Base de connaissances</h2>
          <p className="text-xs text-[#52525B] mt-1">Documents que {agent.name} utilise pour répondre</p>
        </div>
        <button onClick={() => fileInputRef.current?.click()}
          className="btn-gold text-sm px-4 py-2 rounded-xl flex items-center gap-2">
          <span className="relative z-10 flex items-center gap-2"><Upload size={14} /> Ajouter</span>
        </button>
        <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />
      </div>

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[rgba(212,168,83,0.2)] rounded-2xl p-8 text-center mb-6 hover:border-[#D4A853]/50 hover:bg-[rgba(212,168,83,0.02)] transition-all cursor-pointer"
      >
        <div className="w-12 h-12 rounded-full bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.1)] flex items-center justify-center mx-auto mb-3">
          <Upload size={20} className="text-[#D4A853]" />
        </div>
        <p className="text-sm text-[#A1A1AA] mb-1">Glissez-déposez un fichier ou cliquez pour parcourir</p>
        <p className="text-xs text-[#3F3F46]">TXT, MD, PDF, DOC jusqu'à 10MB</p>
      </div>

      {/* Documents list */}
      {docs.length === 0 ? (
        <div className="text-center py-10">
          <BookOpen size={24} className="text-[#3F3F46] mx-auto mb-3" />
          <p className="text-sm text-[#52525B]">Aucun document</p>
          <p className="text-xs text-[#3F3F46] mt-1">Ajoutez des documents pour enrichir les réponses de {agent.name}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.id} className="glass-card p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.1)] flex items-center justify-center flex-shrink-0">
                <FileText size={14} className="text-[#D4A853]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#FAFAFA] truncate">{doc.filename}</p>
                <p className="text-xs text-[#52525B]">{formatSize(doc.size)}</p>
              </div>
              <button onClick={() => deleteKnowledge({ id: doc.id })}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#3F3F46] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.06)] transition-all flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═════════════════ ANALYTICS TAB ═════════════════ */
function AnalyticsTab({ agent }: { agent: { id: number; name: string } }) {
  const { getAnalytics } = useAgent();
  const { data } = getAnalytics(agent.id);

  const stats = data?.totals ?? { messages: 0, calls: 0, callDuration: 0, knowledgeDocs: 0 };
  const daily = data?.daily ?? [];

  const statCards = [
    { label: 'Messages totaux', value: stats.messages, icon: MessageCircle, color: '#D4A853' },
    { label: 'Appels', value: stats.calls, icon: Phone, color: '#22C55E' },
    { label: 'Durée d\'appel', value: `${Math.floor(stats.callDuration / 60)}m`, icon: Clock, color: '#3B82F6' },
    { label: 'Documents', value: stats.knowledgeDocs, icon: BookOpen, color: '#A855F7' },
  ];

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-xl font-bold text-[#FAFAFA] mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Analytics</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <s.icon size={16} style={{ color: s.color }} />
              <span className="text-xl font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>{s.value}</span>
            </div>
            <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div className="glass-card p-5 mb-6">
        <h3 className="text-sm font-bold text-[#FAFAFA] mb-4 flex items-center gap-2">
          <TrendingUp size={15} className="text-[#D4A853]" /> Activité quotidienne
        </h3>
        {daily.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3Icon size={24} className="text-[#3F3F46] mx-auto mb-3" />
            <p className="text-sm text-[#52525B]">Pas encore de données</p>
            <p className="text-xs text-[#3F3F46] mt-1">Les statistiques apparaîtront après utilisation</p>
          </div>
        ) : (
          <div className="flex items-end gap-1.5 h-32">
            {daily.map((d, i) => {
              const max = Math.max(...daily.map(x => (x.messagesSent ?? 0) + (x.messagesReceived ?? 0)), 1);
              const val = (d.messagesSent ?? 0) + (d.messagesReceived ?? 0);
              const h = max > 0 ? (val / max) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-[#18181B] rounded-t-sm relative" style={{ height: `${Math.max(h, 4)}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#D4A853]/30 to-[#D4A853]/60 rounded-t-sm" />
                  </div>
                  <span className="text-[8px] text-[#3F3F46]">{d.date?.slice(5)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Usage tips */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-[#FAFAFA] mb-3">Conseils d'utilisation</h3>
        <div className="space-y-2">
          {[
            'Plus vous conversez, plus l\'agent apprend votre style',
            'Ajoutez des documents dans Connaissances pour des réponses précises',
            'Utilisez les appels pour des échanges rapides et directs',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.1)] flex items-center justify-center flex-shrink-0 text-[10px] text-[#D4A853] font-bold">{i + 1}</span>
              <p className="text-xs text-[#52525B] leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═════════════════ SETTINGS TAB ═════════════════ */
function SettingsTab({ agent }: { agent: { id: number; name: string; role: string; description: string | null; systemPrompt: string | null; avatar: string | null; aiModel: string | null; capabilities: unknown; personality: string | null } }) {
  const { update, isUpdating } = useAgent();
  const [form, setForm] = useState({
    name: agent.name,
    role: agent.role,
    description: agent.description || '',
    systemPrompt: agent.systemPrompt || '',
    aiModel: agent.aiModel || 'kimi-latest',
    personality: agent.personality || 'balanced',
  });

  const handleSave = () => {
    update({
      id: agent.id,
      name: form.name,
      role: form.role,
      description: form.description,
      systemPrompt: form.systemPrompt,
      aiModel: form.aiModel,
      personality: form.personality,
    });
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-xl font-bold text-[#FAFAFA] mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Paramètres</h2>

      <div className="max-w-xl space-y-5">
        {/* Identity */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-[#FAFAFA] mb-4">Identité</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#52525B] mb-1.5 block font-medium">Nom</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
            </div>
            <div>
              <label className="text-xs text-[#52525B] mb-1.5 block font-medium">Rôle</label>
              <input type="text" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
            </div>
            <div>
              <label className="text-xs text-[#52525B] mb-1.5 block font-medium">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                className="w-full bg-[#18181B] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30 resize-none transition-all" />
            </div>
          </div>
        </div>

        {/* AI Config */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-[#FAFAFA] mb-4">Configuration IA</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#52525B] mb-1.5 block font-medium">Prompt système</label>
              <textarea value={form.systemPrompt} onChange={e => setForm(p => ({ ...p, systemPrompt: e.target.value }))} rows={5}
                className="w-full bg-[#18181B] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30 resize-none transition-all" />
              <p className="text-[11px] text-[#3F3F46] mt-1">Ce prompt définit le comportement et la personnalité de l'agent.</p>
            </div>
            <div>
              <label className="text-xs text-[#52525B] mb-1.5 block font-medium">Modèle IA</label>
              <select value={form.aiModel} onChange={e => setForm(p => ({ ...p, aiModel: e.target.value }))}
                className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30 transition-all">
                <option value="kimi-latest">Kimi Latest</option>
                <option value="kimi-k2">Kimi K2</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#52525B] mb-1.5 block font-medium">Personnalité</label>
              <select value={form.personality} onChange={e => setForm(p => ({ ...p, personality: e.target.value }))}
                className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30 transition-all">
                <option value="professional">Professionnelle</option>
                <option value="friendly">Amicale</option>
                <option value="creative">Créative</option>
                <option value="balanced">Équilibrée</option>
              </select>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={isUpdating}
          className="btn-gold text-sm px-6 py-2.5 rounded-xl disabled:opacity-30">
          <span className="relative z-10">{isUpdating ? 'Sauvegarde...' : 'Sauvegarder'}</span>
        </button>
      </div>
    </div>
  );
}

// Simple bar chart icon for analytics
function BarChart3Icon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
    </svg>
  );
}
