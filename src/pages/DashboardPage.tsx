import { useState } from 'react';
import { Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Bot, MessageSquare, Plus, Search,
  MoreVertical, Send, Paperclip, ChevronLeft,
  ChevronRight, Menu, Sparkles, Star, Wand2,
  Users, Instagram,
  PenTool, Target, BarChart3
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';

const ALL_AVATARS = [
  '/images/avatar-nora.png',
  '/images/avatar-leo.png',
  '/images/avatar-placeholder-1.png',
  '/images/avatar-placeholder-2.png',
  '/images/avatar-placeholder-3.png',
];

const CAP_OPTIONS = ['Rédaction', 'Visuels', 'Analytics', 'Community Mgmt', 'Recrutement', 'Screening', 'Entretiens', 'Onboarding', 'Planning RH', 'Reporting'];

/* ═══════════ SIDEBAR ═══════════ */
function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const location = useLocation();
  const { agents } = useChat();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: 'Accueil', icon: Home },
    { path: '/dashboard/agents', label: 'Mes Agents', icon: Bot },
    { path: '/dashboard/create', label: 'Créer un agent', icon: Plus },
  ];

  const defaultAgents = agents.filter(a => a.isDefault === 'true');

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-[260px] flex-shrink-0 z-50 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ background: 'rgba(17,17,19,0.95)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="p-4">
          <Link to="/" className="flex items-center gap-2 mb-5">
            <span className="text-lg font-extrabold text-[#D4A853]" style={{ fontFamily: 'var(--font-heading)' }}>LNR</span>
            <span className="text-sm font-medium text-[#FAFAFA]">AI HUB</span>
          </Link>

          <button
            onClick={() => { navigate('/dashboard/create'); onClose(); }}
            className="w-full gold-gradient text-[#0A0A0B] font-semibold h-10 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all mb-5 text-sm"
          >
            <Plus size={15} /> Créer un agent
          </button>

          <nav className="space-y-0.5">
            {navItems.map(item => {
              const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path} onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'bg-[rgba(212,168,83,0.1)] text-[#D4A853] border-l-[3px] border-l-[#D4A853]' : 'text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#FAFAFA]'
                  }`}
                >
                  <Icon size={17} /> {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-white/5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#52525B] mb-2">Agents</p>
          <div className="space-y-0.5">
            {defaultAgents.map(agent => (
              <button key={agent.id}
                onClick={() => { navigate(`/dashboard/chat/${agent.id}`); onClose(); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors text-left ${
                  location.pathname.includes(`/chat/${agent.id}`) ? 'bg-[rgba(212,168,83,0.08)]' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img src={agent.avatar || '/images/avatar-placeholder-1.png'} alt={agent.name} className="w-7 h-7 rounded-full object-cover" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#22C55E] rounded-full ring-2 ring-[#111113]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-[#FAFAFA] block truncate">{agent.name}</span>
                  <span className="text-[10px] text-[#52525B] truncate block">{agent.role}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-white/5">
            <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-[#0A0A0B] text-xs font-bold">RY</div>
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

/* ═══════════ AGENT LIST ═══════════ */
function AgentListView() {
  const { agents, isLoading } = useChat();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = agents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.role.toLowerCase().includes(search.toLowerCase())
  );
  const defaults = filtered.filter(a => a.isDefault === 'true');
  const customs = filtered.filter(a => a.isDefault === 'false');

  if (isLoading) return <div className="p-10 text-[#52525B]">Chargement...</div>;

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#FAFAFA] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Mes Agents</h1>
        <p className="text-[#A1A1AA] text-sm">Nora pour la communication, Leo pour le RH. Créez vos propres agents sur mesure.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 bg-[#18181B] border border-white/5 rounded-lg pl-9 pr-4 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none focus:border-[#D4A853]/30" />
        </div>
        <button onClick={() => navigate('/dashboard/create')}
          className="gold-gradient text-[#0A0A0B] font-semibold px-5 py-2.5 rounded-lg hover:brightness-110 transition-all flex items-center gap-2 text-sm">
          <Plus size={15} /> Créer un agent
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-8">
        {defaults.map(agent => (
          <div key={agent.id} className="glass-card p-6 transition-all hover:-translate-y-1 hover:border-[#D4A853]/30 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-[rgba(212,168,83,0.03)] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <img src={agent.avatar || ''} alt={agent.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-[#D4A853]/30 group-hover:ring-[#D4A853]/60 transition-all" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#22C55E] rounded-full ring-2 ring-[#111113]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>{agent.name}</h3>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#D4A853]">{agent.role}</p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-[rgba(34,197,94,0.1)] text-[#22C55E] rounded-full border border-[rgba(34,197,94,0.2)]">Principal</span>
              </div>
              <p className="text-sm text-[#A1A1AA] mb-4">{agent.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(agent.capabilities as string[] || []).slice(0, 4).map(cap => (
                  <span key={cap} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[rgba(212,168,83,0.08)] text-[#D4A853] border border-[rgba(212,168,83,0.15)]">{cap}</span>
                ))}
              </div>
              <button onClick={() => navigate(`/dashboard/chat/${agent.id}`)}
                className="w-full gold-gradient text-[#0A0A0B] text-sm font-semibold py-2.5 rounded-lg hover:brightness-110 transition-all">
                Discuter avec {agent.name}
              </button>
            </div>
          </div>
        ))}
      </div>

      {customs.length > 0 && (
        <>
          <p className="text-xs font-medium uppercase tracking-wider text-[#52525B] mb-3">Vos agents personnalisés</p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {customs.map(agent => (
              <div key={agent.id} className="glass-card p-5 transition-all hover:-translate-y-1 hover:border-[#D4A853]/30 group">
                <div className="flex items-center gap-3 mb-3">
                  <img src={agent.avatar || '/images/avatar-placeholder-1.png'} alt={agent.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h3 className="text-sm font-bold text-[#FAFAFA]">{agent.name}</h3>
                    <p className="text-[10px] text-[#D4A853]">{agent.role}</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/dashboard/chat/${agent.id}`)}
                  className="w-full text-sm font-medium text-[#D4A853] border border-[#D4A853]/30 py-2 rounded-lg hover:bg-[rgba(212,168,83,0.1)] transition-all">
                  Discuter
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <button onClick={() => navigate('/dashboard/create')}
        className="w-full border-2 border-dashed border-[rgba(212,168,83,0.3)] rounded-2xl flex flex-col items-center justify-center gap-2 p-8 hover:border-[#D4A853] hover:bg-[rgba(212,168,83,0.03)] transition-all group">
        <div className="w-10 h-10 rounded-full bg-[rgba(212,168,83,0.1)] flex items-center justify-center group-hover:bg-[rgba(212,168,83,0.2)] transition-all">
          <Plus size={20} className="text-[#D4A853]" />
        </div>
        <span className="text-sm font-medium text-[#D4A853]">Créer un nouvel agent</span>
      </button>
    </div>
  );
}

/* ═══════════ CHAT PAGE ═══════════ */
function ChatPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { agents, sendMessage, isSending } = useChat();
  const [input, setInput] = useState('');

  const agent = agents.find(a => a.id === Number(agentId));
  const agentIdNum = agent?.id ?? null;

  const { data: messages = [] } = useChat().getHistoryQuery(agentIdNum);

  const handleSend = (text?: string) => {
    const content = text || input;
    if (!content.trim() || !agentIdNum) return;
    sendMessage(agentIdNum, content.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const quickPrompts = agent?.slug === 'nora'
    ? ['Rédige 3 posts LinkedIn pour notre lancement', 'Crée mon calendrier éditorial de la semaine', 'Analyse mes performances réseaux sociaux', 'Rédige une newsletter engageante']
    : agent?.slug === 'leo'
    ? ['Rédige une offre d\'emploi Développeur Full Stack', 'Screening de 34 CV pour Commercial B2B', 'Prépare un process d\'onboarding', 'Rapport RH mensuel']
    : [];

  const formatTime = (d: Date) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-[calc(100vh-0px)] lg:h-screen flex flex-col" style={{ background: 'rgba(10,10,11,0.85)' }}>
      {/* Header */}
      <div className="h-16 flex items-center gap-4 px-6 border-b border-white/5 flex-shrink-0">
        <button onClick={() => navigate('/dashboard/agents')} className="lg:hidden text-[#A1A1AA]"><ChevronLeft size={20} /></button>
        <div className="relative">
          <img src={agent?.avatar || ''} alt={agent?.name} className="w-10 h-10 rounded-full object-cover" />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#22C55E] rounded-full ring-2 ring-[#0A0A0B]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#FAFAFA]">{agent?.name}</p>
          <p className="text-xs text-[#22C55E]">{agent?.role}</p>
        </div>
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/5 transition-all"><MoreVertical size={16} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-full bg-[rgba(212,168,83,0.1)] flex items-center justify-center mb-6">
              <img src={agent?.avatar || ''} alt={agent?.name} className="w-14 h-14 rounded-full object-cover" />
            </div>
            <h3 className="text-lg font-semibold text-[#FAFAFA] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{agent?.name} est prêt(e)</h3>
            <p className="text-sm text-[#A1A1AA] max-w-sm mb-6">{agent?.description}</p>
            {quickPrompts.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {quickPrompts.map(prompt => (
                  <button key={prompt} onClick={() => handleSend(prompt)}
                    className="px-3 py-2 text-xs font-medium rounded-full bg-[rgba(212,168,83,0.08)] text-[#D4A853] border border-[rgba(212,168,83,0.15)] hover:bg-[rgba(212,168,83,0.15)] transition-all text-left">
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
              {msg.sender === 'agent' && (
                <img src={agent?.avatar || ''} alt={agent?.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" />
              )}
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user' ? 'gold-gradient text-[#0A0A0B] font-medium rounded-tr-sm' : 'bg-[#18181B] border border-white/5 text-[#FAFAFA] rounded-tl-sm'
              }`}>
                {msg.content}
                <div className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-[#0A0A0B]/60' : 'text-[#52525B]'}`}>{formatTime(msg.createdAt)}</div>
              </div>
            </div>
          ))
        )}

        {isSending && (
          <div className="flex items-start gap-2">
            <img src={agent?.avatar || ''} alt="" className="w-8 h-8 rounded-full object-cover" />
            <div className="bg-[#18181B] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#52525B] rounded-full typing-dot" />
              <span className="w-2 h-2 bg-[#52525B] rounded-full typing-dot" />
              <span className="w-2 h-2 bg-[#52525B] rounded-full typing-dot" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-white/5 px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-[#52525B] hover:text-[#A1A1AA] hover:bg-white/5 transition-all flex-shrink-0"><Paperclip size={18} /></button>
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={`Message à ${agent?.name}...`}
            className="flex-1 h-12 bg-[#18181B] border border-white/5 rounded-full px-5 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none focus:border-[#D4A853]/30 transition-colors" />
          <button onClick={() => handleSend()} disabled={!input.trim() || isSending}
            className="w-11 h-11 gold-gradient rounded-full flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
            <Send size={16} className="text-[#0A0A0B]" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ CREATE AGENT ═══════════ */
function CreateAgentView() {
  const navigate = useNavigate();
  const { createAgent, isCreating } = useChat();
  const [form, setForm] = useState({
    name: '', role: '', description: '', avatar: ALL_AVATARS[2],
    personality: '50', capabilities: [] as string[], tools: [] as string[],
    systemPrompt: '',
  });

  const toggleCap = (c: string) => setForm(p => ({ ...p, capabilities: p.capabilities.includes(c) ? p.capabilities.filter(x => x !== c) : [...p.capabilities, c] }));

  const applyTemplate = (type: 'com' | 'rh') => {
    if (type === 'com') {
      setForm(p => ({ ...p, name: p.name || 'CM Expert', role: 'Agent Communication', capabilities: ['Rédaction', 'Visuels', 'Analytics', 'Community Mgmt'], tools: ['LinkedIn', 'Instagram', 'Gmail'], systemPrompt: p.systemPrompt || `Tu es un expert en communication digitale et réseaux sociaux. Tu rédiges des posts engageants, crées des calendriers éditoriaux et analyses les performances.` }));
    } else {
      setForm(p => ({ ...p, name: p.name || 'RH Pro', role: 'Agent RH', capabilities: ['Recrutement', 'Screening', 'Entretiens', 'Onboarding'], tools: ['LinkedIn', 'Google Calendar', 'Slack'], systemPrompt: p.systemPrompt || `Tu es un expert en Ressources Humaines. Tu rédiges des offres d'emploi, screenes des CV, prépares des entretiens et gères l'onboarding.` }));
    }
  };

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createAgent({
      slug: form.name.toLowerCase().replace(/\s+/g, '-'),
      name: form.name, role: form.role, description: form.description,
      avatar: form.avatar, systemPrompt: form.systemPrompt || 'Tu es un assistant IA professionnel.',
      capabilities: form.capabilities, tools: form.tools, personality: 'balanced',
    });
    navigate('/dashboard/agents');
  };

  return (
    <div className="p-6 lg:p-10 overflow-y-auto h-screen" style={{ background: 'rgba(10,10,11,0.85)' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#FAFAFA] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Créer un agent</h1>
        <p className="text-[#A1A1AA] text-sm mb-6">Personnalisez votre agent ou partez d'un template.</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => applyTemplate('com')} className="glass-card p-4 text-left hover:border-[#D4A853]/30 transition-all">
            <div className="flex items-center gap-2 mb-1"><Instagram size={14} className="text-[#D4A853]" /><span className="text-sm font-semibold text-[#FAFAFA]">Template Com</span></div>
            <p className="text-[11px] text-[#52525B]">Réseaux sociaux, rédaction, visuels</p>
          </button>
          <button onClick={() => applyTemplate('rh')} className="glass-card p-4 text-left hover:border-[#D4A853]/30 transition-all">
            <div className="flex items-center gap-2 mb-1"><Users size={14} className="text-[#D4A853]" /><span className="text-sm font-semibold text-[#FAFAFA]">Template RH</span></div>
            <p className="text-[11px] text-[#52525B]">Recrutement, screening, entretiens</p>
          </button>
        </div>

        <div className="space-y-5">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[#FAFAFA] mb-3 flex items-center gap-2"><Sparkles size={15} className="text-[#D4A853]" /> Identité</h3>
            <div className="space-y-3">
              <div><label className="text-xs text-[#A1A1AA] mb-1 block">Nom *</label><input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Maxime" className="w-full h-10 bg-[#18181B] border border-white/5 rounded-lg px-4 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none focus:border-[#D4A853]/30" /></div>
              <div><label className="text-xs text-[#A1A1AA] mb-1 block">Rôle</label><input type="text" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} placeholder="Ex: Agent Marketing" className="w-full h-10 bg-[#18181B] border border-white/5 rounded-lg px-4 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none focus:border-[#D4A853]/30" /></div>
              <div><label className="text-xs text-[#A1A1AA] mb-2 block">Avatar</label><div className="flex gap-2">{ALL_AVATARS.map(src => <button key={src} onClick={() => setForm(p => ({ ...p, avatar: src }))} className={`w-11 h-11 rounded-full overflow-hidden ring-2 transition-all ${form.avatar === src ? 'ring-[#D4A853]' : 'ring-transparent'}`}><img src={src} alt="" className="w-full h-full object-cover" /></button>)}</div></div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[#FAFAFA] mb-3 flex items-center gap-2"><Wand2 size={15} className="text-[#D4A853]" /> Personnalité</h3>
            <div><label className="text-xs text-[#A1A1AA] mb-1 block">Description</label><textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Décrivez l'agent..." rows={2} className="w-full bg-[#18181B] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none focus:border-[#D4A853]/30 resize-none" /></div>
            <div className="mt-3"><label className="text-xs text-[#A1A1AA] mb-1 block">Instructions système (prompt IA)</label><textarea value={form.systemPrompt} onChange={e => setForm(p => ({ ...p, systemPrompt: e.target.value }))} placeholder="Définissez comment l'IA doit se compacter..." rows={4} className="w-full bg-[#18181B] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-[#FAFAFA] placeholder-[#52525B] focus:outline-none focus:border-[#D4A853]/30 resize-none" /></div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[#FAFAFA] mb-3 flex items-center gap-2"><Star size={15} className="text-[#D4A853]" /> Compétences</h3>
            <div className="flex flex-wrap gap-2">{CAP_OPTIONS.map(c => <button key={c} onClick={() => toggleCap(c)} className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${form.capabilities.includes(c) ? 'bg-[rgba(212,168,83,0.2)] text-[#D4A853] border-[rgba(212,168,83,0.3)]' : 'bg-transparent text-[#A1A1AA] border-white/10'}`}>{c}</button>)}</div>
          </div>

          <div className="flex items-center gap-4 pb-8">
            <button onClick={handleCreate} disabled={!form.name.trim() || isCreating} className="gold-gradient text-[#0A0A0B] font-semibold px-8 py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-30">{isCreating ? 'Création...' : 'Créer l\'agent'}</button>
            <button onClick={() => navigate('/dashboard/agents')} className="text-[#52525B] hover:text-[#A1A1AA] text-sm font-medium transition-colors">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ DASHBOARD HOME ═══════════ */
function DashboardHome() {
  const { agents } = useChat();
  const navigate = useNavigate();
  const defaults = agents.filter(a => a.isDefault === 'true');

  return (
    <div className="p-6 lg:p-10 overflow-y-auto h-screen" style={{ background: 'rgba(10,10,11,0.85)' }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#FAFAFA] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Tableau de bord</h1>
        <p className="text-[#A1A1AA] text-sm">Vos agents IA Communication et RH.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {defaults.map(agent => (
          <button key={agent.id} onClick={() => navigate(`/dashboard/chat/${agent.id}`)}
            className="glass-card p-5 text-left transition-all hover:-translate-y-1 hover:border-[#D4A853]/30 group">
            <div className="flex items-center gap-4">
              <div className="relative"><img src={agent.avatar || ''} alt={agent.name} className="w-14 h-14 rounded-full object-cover" /><span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#22C55E] rounded-full ring-2 ring-[#111113]" /></div>
              <div className="flex-1">
                <p className="text-base font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>{agent.name}</p>
                <p className="text-xs text-[#D4A853] mb-1">{agent.role}</p>
                <p className="text-xs text-[#52525B]">{(agent.capabilities as string[]).slice(0, 3).join(' · ')}</p>
              </div>
              <ChevronRight size={18} className="text-[#52525B] group-hover:text-[#D4A853] transition-colors" />
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Messages', value: '—', icon: MessageSquare, color: '#D4A853' },
          { label: 'Agents', value: String(agents.length), icon: Bot, color: '#22C55E' },
          { label: 'Posts rédigés', value: '340+', icon: PenTool, color: '#3B82F6' },
          { label: 'CV screenés', value: '210+', icon: Target, color: '#A855F7' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2"><s.icon size={16} style={{ color: s.color }} /><span className="text-xl font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>{s.value}</span></div>
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-[#FAFAFA] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Conseils rapides</h3>
        <div className="space-y-3">
          {[
            { icon: Sparkles, text: 'Demandez à Nora de rédiger 3 versions d\'un post pour tester différents tons' },
            { icon: Target, text: 'Leo peut préparer une grille d\'évaluation avant chaque entretien' },
            { icon: BarChart3, text: 'Demandez un rapport hebdomadaire de vos KPIs com et RH' },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-3"><tip.icon size={16} className="text-[#D4A853] mt-0.5 flex-shrink-0" /><p className="text-sm text-[#A1A1AA]">{tip.text}</p></div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ MAIN LAYOUT ═══════════ */
export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isChat = location.pathname.includes('/chat/');

  return (
    <div className="relative min-h-screen">
      <div className="lg:grid lg:grid-cols-[260px_1fr] min-h-screen">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <div className="lg:hidden h-14 flex items-center px-4 border-b border-white/5" style={{ background: 'rgba(17,17,19,0.95)' }}>
          <button onClick={() => setMobileOpen(true)} className="w-10 h-10 flex items-center justify-center text-[#A1A1AA]"><Menu size={20} /></button>
          <span className="ml-3 text-sm font-semibold text-[#FAFAFA]">LNR AI HUB</span>
        </div>

        <main className={isChat ? 'fixed inset-0 lg:relative lg:inset-auto z-30 bg-[#0A0A0B]' : ''}>
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
