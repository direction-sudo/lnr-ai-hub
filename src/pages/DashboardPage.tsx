import { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router';
import {
  Home, Bot, MessageSquare, Plus, Search,
  Sparkles, Star, Wand2,
  Users, Instagram, PenTool, Target, BarChart3,
  Menu, ChevronRight, Link2
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import AgentDetailPage from './AgentDetailPage';
import IntegrationsPage from './IntegrationsPage';

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
  const { agents, isLoading } = useChat();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: 'Accueil', icon: Home },
    { path: '/dashboard/agents', label: 'Mes Agents', icon: Bot },
    { path: '/dashboard/integrations', label: 'Intégrations', icon: Link2 },
    { path: '/dashboard/create', label: 'Créer un agent', icon: Plus },
  ];

  const defaultAgents = agents.filter(a => a.isDefault === 'true');
  const customAgents = agents.filter(a => a.isDefault === 'false');

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-[260px] flex-shrink-0 z-50 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ background: 'rgba(13,13,15,0.97)', borderRight: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="p-4">
          <Link to="/" className="flex items-center gap-2 mb-5 group">
            <span className="text-lg font-extrabold text-[#D4A853] group-hover:gold-glow-text transition-all" style={{ fontFamily: 'var(--font-heading)' }}>LNR</span>
            <span className="text-sm font-medium text-[#FAFAFA]">AI HUB</span>
          </Link>

          <button
            onClick={() => { navigate('/dashboard/create'); onClose(); }}
            className="w-full btn-gold h-10 rounded-xl flex items-center justify-center gap-2 text-sm mb-5"
          >
            <span className="relative z-10 flex items-center gap-2"><Plus size={15} /> Créer un agent</span>
          </button>

          <nav className="space-y-0.5">
            {navItems.map(item => {
              const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path} onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[rgba(212,168,83,0.08)] text-[#D4A853] border border-[rgba(212,168,83,0.12)]'
                      : 'text-[#52525B] hover:text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.02)]'
                  }`}
                >
                  <Icon size={17} /> {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-white/[0.04]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3F3F46] mb-2.5">Agents par défaut</p>
          <div className="space-y-0.5 mb-3">
            {defaultAgents.map(agent => (
              <button key={agent.id}
                onClick={() => { navigate(`/dashboard/agent/${agent.id}`); onClose(); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-200 text-left ${
                  location.pathname.includes(`/agent/${agent.id}`) ? 'bg-[rgba(212,168,83,0.06)]' : 'hover:bg-[rgba(255,255,255,0.02)]'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img src={agent.avatar || '/images/avatar-placeholder-1.png'} alt={agent.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-white/5" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#22C55E] rounded-full ring-2 ring-[#0D0D0F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] text-[#FAFAFA] block truncate font-medium">{agent.name}</span>
                  <span className="text-[10px] text-[#3F3F46] truncate block">{agent.role}</span>
                </div>
              </button>
            ))}
          </div>

          {customAgents.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3F3F46] mb-2">Vos agents</p>
              <div className="space-y-0.5">
                {customAgents.map(agent => (
                  <button key={agent.id}
                    onClick={() => { navigate(`/dashboard/agent/${agent.id}`); onClose(); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[rgba(255,255,255,0.02)] transition-all text-left"
                  >
                    <img src={agent.avatar || '/images/avatar-placeholder-1.png'} alt={agent.name} className="w-7 h-7 rounded-full object-cover" />
                    <span className="text-[13px] text-[#A1A1AA] truncate">{agent.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-white/[0.04]">
            <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-[#0A0A0B] text-xs font-bold">RY</div>
            <div>
              <p className="text-[13px] font-semibold text-[#FAFAFA]">Raad Yassir</p>
              <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider">Admin</p>
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

  if (isLoading) {
    return (
      <div className="p-10">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="skeleton h-4 w-64 mb-8" />
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#FAFAFA] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Mes Agents</h1>
        <p className="text-[#52525B] text-sm">Nora pour la communication, Leo pour le RH. Créez vos propres agents sur mesure.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3F3F46]" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl pl-9 pr-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
        </div>
        <button onClick={() => navigate('/dashboard/create')}
          className="btn-gold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2">
          <span className="relative z-10 flex items-center gap-2"><Plus size={15} /> Créer un agent</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-8">
        {defaults.map(agent => (
          <div key={agent.id} className="glass-card p-6 border-glow relative">
            <div className="absolute top-0 right-0 w-28 h-28 bg-[rgba(212,168,83,0.02)] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <img src={agent.avatar || ''} alt={agent.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-[#D4A853]/20" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#22C55E] rounded-full ring-2 ring-[#0D0D0F]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>{agent.name}</h3>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#D4A853]">{agent.role}</p>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-semibold bg-[rgba(34,197,94,0.08)] text-[#22C55E] rounded-full border border-[rgba(34,197,94,0.15)]">
                  Principal
                </span>
              </div>
              <p className="text-sm text-[#52525B] mb-4 leading-relaxed">{agent.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {(agent.capabilities as string[] || []).slice(0, 4).map(cap => (
                  <span key={cap} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[rgba(212,168,83,0.06)] text-[#D4A853]/80 border border-[rgba(212,168,83,0.1)]">{cap}</span>
                ))}
              </div>
              <button onClick={() => navigate(`/dashboard/agent/${agent.id}`)}
                className="w-full btn-gold text-sm py-2.5 rounded-xl">
                <span className="relative z-10">Discuter avec {agent.name}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {customs.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#3F3F46] mb-3">Vos agents personnalisés</p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {customs.map(agent => (
              <div key={agent.id} className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <img src={agent.avatar || '/images/avatar-placeholder-1.png'} alt={agent.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h3 className="text-sm font-bold text-[#FAFAFA]">{agent.name}</h3>
                    <p className="text-[10px] text-[#D4A853]">{agent.role}</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/dashboard/agent/${agent.id}`)}
                  className="w-full text-sm font-medium text-[#D4A853] border border-[#D4A853]/20 py-2 rounded-xl hover:bg-[rgba(212,168,83,0.06)] transition-all">
                  Discuter
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <button onClick={() => navigate('/dashboard/create')}
        className="w-full border-2 border-dashed border-[rgba(212,168,83,0.2)] rounded-2xl flex flex-col items-center justify-center gap-2 p-8 hover:border-[#D4A853]/60 hover:bg-[rgba(212,168,83,0.02)] transition-all group">
        <div className="w-10 h-10 rounded-full bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.1)] flex items-center justify-center group-hover:bg-[rgba(212,168,83,0.12)] transition-all">
          <Plus size={20} className="text-[#D4A853]" />
        </div>
        <span className="text-sm font-medium text-[#D4A853]">Créer un nouvel agent</span>
      </button>
    </div>
  );
}

/* ═══════════ CREATE AGENT ═══════════ */
function CreateAgentView() {
  const navigate = useNavigate();
  const { createAgent, isCreating } = useChat();
  const [form, setForm] = useState({
    name: '', role: '', description: '', avatar: ALL_AVATARS[2],
    capabilities: [] as string[], tools: [] as string[],
    systemPrompt: '',
  });

  const toggleCap = (c: string) => setForm(p => ({ ...p, capabilities: p.capabilities.includes(c) ? p.capabilities.filter(x => x !== c) : [...p.capabilities, c] }));

  const applyTemplate = (type: 'com' | 'rh') => {
    if (type === 'com') {
      setForm(p => ({ ...p, name: p.name || 'CM Expert', role: 'Agent Communication', capabilities: ['Rédaction', 'Visuels', 'Analytics', 'Community Mgmt'], systemPrompt: p.systemPrompt || `Tu es un expert en communication digitale. Tu rédiges des posts engageants pour LinkedIn et Instagram, crées des calendriers éditoriaux et analyses les performances des réseaux sociaux. Tu réponds en français avec un ton professionnel mais engageant.` }));
    } else {
      setForm(p => ({ ...p, name: p.name || 'RH Pro', role: 'Agent RH', capabilities: ['Recrutement', 'Screening', 'Entretiens', 'Onboarding'], systemPrompt: p.systemPrompt || `Tu es un expert en Ressources Humaines. Tu rédiges des offres d'emploi attractives, analyses des CV, prépares des entretiens et gères l'onboarding. Tu réponds en français avec un ton structuré et professionnel.` }));
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
    <div className="p-6 lg:p-10 overflow-y-auto h-screen" style={{ background: 'rgba(10,10,11,0.88)' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#FAFAFA] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Créer un agent</h1>
        <p className="text-[#52525B] text-sm mb-6">Personnalisez votre agent ou partez d'un template.</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => applyTemplate('com')} className="glass-card p-4 text-left hover:border-[#D4A853]/30 transition-all group">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.1)] flex items-center justify-center">
                <Instagram size={14} className="text-[#D4A853]" />
              </div>
              <span className="text-sm font-bold text-[#FAFAFA]">Template Com</span>
            </div>
            <p className="text-[11px] text-[#3F3F46]">Réseaux sociaux, rédaction, visuels</p>
          </button>
          <button onClick={() => applyTemplate('rh')} className="glass-card p-4 text-left hover:border-[#D4A853]/30 transition-all group">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.1)] flex items-center justify-center">
                <Users size={14} className="text-[#D4A853]" />
              </div>
              <span className="text-sm font-bold text-[#FAFAFA]">Template RH</span>
            </div>
            <p className="text-[11px] text-[#3F3F46]">Recrutement, screening, entretiens</p>
          </button>
        </div>

        <div className="space-y-5">
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-[#FAFAFA] mb-4 flex items-center gap-2"><Sparkles size={15} className="text-[#D4A853]" /> Identité</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#52525B] mb-1.5 block font-medium">Nom de l'agent *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Maxime"
                  className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
              </div>
              <div>
                <label className="text-xs text-[#52525B] mb-1.5 block font-medium">Rôle</label>
                <input type="text" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} placeholder="Ex: Agent Marketing"
                  className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
              </div>
              <div>
                <label className="text-xs text-[#52525B] mb-2 block font-medium">Avatar</label>
                <div className="flex gap-2.5">
                  {ALL_AVATARS.map(src => (
                    <button key={src} onClick={() => setForm(p => ({ ...p, avatar: src }))}
                      className={`w-12 h-12 rounded-full overflow-hidden ring-2 transition-all duration-200 ${form.avatar === src ? 'ring-[#D4A853] scale-105' : 'ring-transparent hover:ring-[#D4A853]/40'}`}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-[#FAFAFA] mb-4 flex items-center gap-2"><Wand2 size={15} className="text-[#D4A853]" /> Personnalité IA</h3>
            <div>
              <label className="text-xs text-[#52525B] mb-1.5 block font-medium">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Décrivez ce que l'agent fait..." rows={2}
                className="w-full bg-[#18181B] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 resize-none transition-all" />
            </div>
            <div className="mt-3">
              <label className="text-xs text-[#52525B] mb-1.5 block font-medium">Instructions système (prompt IA) *</label>
              <textarea value={form.systemPrompt} onChange={e => setForm(p => ({ ...p, systemPrompt: e.target.value }))}
                placeholder="Définissez le comportement de l'IA. Ex: 'Tu es un expert en...'" rows={4}
                className="w-full bg-[#18181B] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 resize-none transition-all" />
              <p className="text-[11px] text-[#3F3F46] mt-1.5">Ce prompt guide les réponses de l'IA. Soyez précis pour de meilleurs résultats.</p>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-[#FAFAFA] mb-4 flex items-center gap-2"><Star size={15} className="text-[#D4A853]" /> Compétences</h3>
            <div className="flex flex-wrap gap-2">
              {CAP_OPTIONS.map(c => (
                <button key={c} onClick={() => toggleCap(c)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${
                    form.capabilities.includes(c) ? 'bg-[rgba(212,168,83,0.12)] text-[#D4A853] border-[rgba(212,168,83,0.2)]' : 'bg-transparent text-[#52525B] border-white/[0.06] hover:border-white/10'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pb-8">
            <button onClick={handleCreate} disabled={!form.name.trim() || isCreating}
              className="btn-gold px-8 py-3 rounded-xl disabled:opacity-30">
              <span className="relative z-10">{isCreating ? 'Création...' : 'Créer l\'agent'}</span>
            </button>
            <button onClick={() => navigate('/dashboard/agents')} className="text-[#3F3F46] hover:text-[#A1A1AA] text-sm font-medium transition-colors">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ DASHBOARD HOME ═══════════ */
function DashboardHome() {
  const { agents, isLoading } = useChat();
  const navigate = useNavigate();
  const defaults = agents.filter(a => a.isDefault === 'true');

  if (isLoading) {
    return (
      <div className="p-10">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="skeleton h-4 w-64 mb-8" />
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="skeleton h-28" /><div className="skeleton h-28" />
        </div>
        <div className="skeleton h-40" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 overflow-y-auto h-screen" style={{ background: 'rgba(10,10,11,0.88)' }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#FAFAFA] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Tableau de bord</h1>
        <p className="text-[#52525B] text-sm">Vos agents IA Communication et RH.</p>
      </div>

      {/* Agent cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {defaults.map(agent => (
          <button key={agent.id} onClick={() => navigate(`/dashboard/agent/${agent.id}`)}
            className="glass-card p-5 text-left border-glow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[rgba(212,168,83,0.02)] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <img src={agent.avatar || ''} alt={agent.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-[#D4A853]/15 group-hover:ring-[#D4A853]/40 transition-all" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#22C55E] rounded-full ring-2 ring-[#0D0D0F]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>{agent.name}</p>
                <p className="text-xs text-[#D4A853] mb-1">{agent.role}</p>
                <p className="text-xs text-[#3F3F46] truncate">{(agent.capabilities as string[]).slice(0, 3).join(' · ')}</p>
              </div>
              <ChevronRight size={18} className="text-[#3F3F46] group-hover:text-[#D4A853] transition-colors flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Messages', value: '—', icon: MessageSquare, color: '#D4A853' },
          { label: 'Agents', value: String(agents.length), icon: Bot, color: '#22C55E' },
          { label: 'Posts', value: '340+', icon: PenTool, color: '#3B82F6' },
          { label: 'CV screenés', value: '210+', icon: Target, color: '#A855F7' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <s.icon size={16} style={{ color: s.color }} />
              <span className="text-xl font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>{s.value}</span>
            </div>
            <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="glass-card p-6">
        <h3 className="text-base font-bold text-[#FAFAFA] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Conseils rapides</h3>
        <div className="space-y-3">
          {[
            { icon: Sparkles, text: "Demandez à Nora 3 versions d'un post pour tester différents tons" },
            { icon: Target, text: "Leo peut préparer une grille d'évaluation avant chaque entretien" },
            { icon: BarChart3, text: "Demandez un rapport hebdomadaire de vos KPIs com et RH" },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.1)] flex items-center justify-center flex-shrink-0">
                <tip.icon size={13} className="text-[#D4A853]" />
              </div>
              <p className="text-sm text-[#52525B] leading-relaxed">{tip.text}</p>
            </div>
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
  const isAgent = location.pathname.includes('/agent/');

  return (
    <div className="relative min-h-screen">
      <div className="lg:grid lg:grid-cols-[260px_1fr] min-h-screen">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <div className="lg:hidden h-14 flex items-center px-4 border-b border-white/[0.04]"
          style={{ background: 'rgba(13,13,15,0.95)', backdropFilter: 'blur(20px)' }}>
          <button onClick={() => setMobileOpen(true)} className="w-10 h-10 flex items-center justify-center text-[#52525B]"><Menu size={20} /></button>
          <span className="ml-3 text-sm font-bold text-[#FAFAFA]">LNR AI HUB</span>
        </div>

        <main className={isAgent ? 'fixed inset-0 lg:relative lg:inset-auto z-30 bg-[#0A0A0B]' : ''}>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/agents" element={<AgentListView />} />
            <Route path="/agent/:agentId" element={<AgentDetailPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/create" element={<CreateAgentView />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
