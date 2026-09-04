import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Users, Route, Clock, RotateCcw, BarChart3, ChevronLeft,
  Loader2, CheckCircle, MapPin, Zap, Target, TrendingUp,
  Activity, Building2
} from 'lucide-react';
import { trpc } from '@/providers/trpc';

type Tab = 'distribuer' | 'file' | 'stats';

const TABS: { id: Tab; label: string; icon: typeof Route }[] = [
  { id: 'distribuer', label: 'Distribuer un lead', icon: Route },
  { id: 'file', label: "File d'attente", icon: Clock },
  { id: 'stats', label: 'Statistiques', icon: BarChart3 },
];

export default function SamPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('distribuer');

  return (
    <div className="h-screen flex flex-col" style={{ background: 'rgba(10,10,11,0.92)' }}>
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04]"
        style={{ background: 'rgba(13,13,15,0.95)' }}>
        <button onClick={() => navigate('/dashboard/agents')}
          className="flex items-center gap-2 text-[#71717A] hover:text-[#FAFAFA] transition-colors text-sm">
          <ChevronLeft size={16} /> Retour
        </button>
        <div className="h-6 w-px bg-white/[0.06]" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A853]/20 to-[#D4A853]/5 border border-[#D4A853]/20 flex items-center justify-center">
            <Route size={20} className="text-[#D4A853]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#FAFAFA]">Sam</h1>
            <p className="text-xs text-[#52525B]">Agent Distribution de leads</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 px-6 py-3 border-b border-white/[0.04]"
        style={{ background: 'rgba(13,13,15,0.9)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const activeClass = 'bg-[rgba(212,168,83,0.08)] text-[#D4A853] border border-[rgba(212,168,83,0.12)]';
          const inactiveClass = 'text-[#52525B] hover:text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.02)]';
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 " + (isActive ? activeClass : inactiveClass)}>
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'distribuer' && <DistribuerTab />}
        {activeTab === 'file' && <FileAttenteTab />}
        {activeTab === 'stats' && <StatsTab />}
      </div>
    </div>
  );
}

function DistribuerTab() {
  const [leadId, setLeadId] = useState('');
  const [score, setScore] = useState(50);
  const [type, setType] = useState<'B2B' | 'B2C'>('B2C');
  const [marche, setMarche] = useState<'FR' | 'TN'>('TN');
  const [besoins, setBesoins] = useState('');

  const distribuer = trpc.sam.distribuer.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) return;
    distribuer.mutate({
      leadId,
      score,
      type,
      marche,
      besoins: besoins.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  const activeBtn = 'bg-[rgba(212,168,83,0.08)] text-[#D4A853] border border-[rgba(212,168,83,0.2)]';
  const inactiveBtn = 'bg-[#0d0d0f] text-[#52525B] border border-white/[0.06] hover:text-[#A1A1AA]';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] mb-1 flex items-center gap-2">
          <Zap size={18} className="text-[#D4A853]" /> Distribuer un lead
        </h2>
        <p className="text-sm text-[#52525B] mb-6">
          Sam analyse le lead et le route vers le télévendeur le plus adapté.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#A1A1AA] mb-1.5 block">ID Lead *</label>
              <input required type="text" value={leadId}
                onChange={e => setLeadId(e.target.value)}
                placeholder="lead-uuid-123"
                className="w-full h-11 bg-[#0d0d0f] border border-white/[0.06] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#A1A1AA] mb-1.5 block">Score (0-100)</label>
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={100} value={score}
                  onChange={e => setScore(Number(e.target.value))}
                  className="flex-1 accent-[#D4A853]" />
                <span className={"text-sm font-bold w-10 text-right " + (
                  score >= 75 ? 'text-[#22C55E]' : score >= 40 ? 'text-[#D4A853]' : 'text-[#e74c3c]'
                )}>{score}</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#A1A1AA] mb-1.5 block">Type</label>
              <div className="flex gap-2">
                {(['B2C', 'B2B'] as const).map(opt => (
                  <button key={opt} type="button" onClick={() => setType(opt)}
                    className={"flex-1 h-10 rounded-xl text-xs font-medium transition-all " + (type === opt ? activeBtn : inactiveBtn)}>
                    {opt === 'B2C' ? 'Particulier' : 'Entreprise'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#A1A1AA] mb-1.5 block">Marché</label>
              <div className="flex gap-2">
                {(['TN', 'FR'] as const).map(opt => (
                  <button key={opt} type="button" onClick={() => setMarche(opt)}
                    className={"flex-1 h-10 rounded-xl text-xs font-medium transition-all " + (marche === opt ? activeBtn : inactiveBtn)}>
                    <MapPin size={12} className="inline mr-1" />
                    {opt === 'TN' ? 'Tunisie' : 'France'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#A1A1AA] mb-1.5 block">Besoins (séparés par des virgules)</label>
            <input type="text" value={besoins}
              onChange={e => setBesoins(e.target.value)}
              placeholder="mutuelle, prévoyance, retraite..."
              className="w-full h-10 bg-[#0d0d0f] border border-white/[0.06] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
          </div>

          <button type="submit" disabled={distribuer.isPending || !leadId}
            className="btn-gold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50">
            {distribuer.isPending ? <><Loader2 size={15} className="animate-spin" /> Distribution...</>
              : <><Zap size={15} /> Distribuer le lead</>}
          </button>
        </form>
      </div>

      {distribuer.data && (
        <div className="glass-card p-6 border-glow">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle size={20} className="text-[#22C55E]" />
            <div>
              <h3 className="text-sm font-bold text-[#FAFAFA]">Lead distribué avec succès</h3>
              <p className="text-xs text-[#52525B]">ID: {distribuer.data.leadId}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04]">
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Télévendeur</p>
              <p className="text-lg font-bold text-[#FAFAFA]">{distribuer.data.televendeurId || 'Aucun'}</p>
            </div>
            <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04]">
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Priorité</p>
              <p className={"text-lg font-bold capitalize " + (
                distribuer.data.priorite === 'haute' ? 'text-[#e74c3c]' :
                distribuer.data.priorite === 'moyenne' ? 'text-[#D4A853]' : 'text-[#3498db]'
              )}>{distribuer.data.priorite}</p>
            </div>
            <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04]">
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Action</p>
              <p className="text-lg font-bold text-[#FAFAFA] capitalize">{distribuer.data.action.replace('_', ' ')}</p>
            </div>
            <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04]">
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Délai</p>
              <p className="text-lg font-bold text-[#FAFAFA]">{distribuer.data.delai}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileAttenteTab() {
  const fileAttente = trpc.sam.fileAttente.useQuery();
  const reprendre = trpc.sam.reprendre.useMutation();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] mb-1 flex items-center gap-2">
          <Clock size={18} className="text-[#D4A853]" /> File d'attente
        </h2>
        <p className="text-sm text-[#52525B] mb-6">Leads en attente de distribution ou de recontact.</p>

        {fileAttente.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-[#D4A853]" />
          </div>
        ) : fileAttente.data && fileAttente.data.length > 0 ? (
          <div className="space-y-2">
            {fileAttente.data.map((lead, i) => (
              <div key={i} className="flex items-center justify-between bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04]">
                <div className="flex items-center gap-4">
                  <div className={"w-10 h-10 rounded-xl flex items-center justify-center " + (
                    lead.priorite === 'haute' ? 'bg-[rgba(231,76,60,0.08)] border border-[rgba(231,76,60,0.15)]' :
                    lead.priorite === 'moyenne' ? 'bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.15)]' :
                    'bg-[rgba(52,152,219,0.08)] border border-[rgba(52,152,219,0.15)]'
                  )}>
                    <Target size={16} className={
                      lead.priorite === 'haute' ? 'text-[#e74c3c]' :
                      lead.priorite === 'moyenne' ? 'text-[#D4A853]' : 'text-[#3498db]'
                    } />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#FAFAFA]">{lead.nom}</p>
                    <p className="text-xs text-[#52525B]">ID: {lead.leadId} · Attente: {lead.attenteDepuis}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#D4A853]">{lead.score}/100</p>
                    <p className="text-[10px] text-[#52525B] capitalize">{lead.priorite}</p>
                  </div>
                  <button
                    onClick={() => reprendre.mutate({ leadId: lead.leadId })}
                    disabled={reprendre.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.1)] text-xs text-[#D4A853] hover:bg-[rgba(212,168,83,0.1)] transition-all disabled:opacity-50">
                    <RotateCcw size={12} /> Redistribuer
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <CheckCircle size={32} className="text-[#22C55E] mx-auto mb-3" />
            <p className="text-sm text-[#52525B]">Aucun lead en attente. Tout est à jour !</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatsTab() {
  const [periode, setPeriode] = useState<'7j' | '30j' | '90j'>('30j');
  const stats = trpc.sam.stats.useQuery({ periode });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#FAFAFA] flex items-center gap-2">
            <BarChart3 size={18} className="text-[#D4A853]" /> Statistiques de distribution
          </h2>
          <p className="text-sm text-[#52525B]">Performance du routage des leads.</p>
        </div>
        <div className="flex gap-2">
          {(['7j', '30j', '90j'] as const).map(p => (
            <button key={p} onClick={() => setPeriode(p)}
              className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-all " + (
                periode === p
                  ? 'bg-[rgba(212,168,83,0.08)] text-[#D4A853] border border-[rgba(212,168,83,0.2)]'
                  : 'bg-[#0d0d0f] text-[#52525B] border border-white/[0.06] hover:text-[#A1A1AA]'
              )}>
              {p === '7j' ? '7 jours' : p === '30j' ? '30 jours' : '90 jours'}
            </button>
          ))}
        </div>
      </div>

      {stats.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#D4A853]" />
        </div>
      ) : stats.data ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 border-glow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.1)] flex items-center justify-center">
                  <Route size={16} className="text-[#D4A853]" />
                </div>
                <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Distribués</p>
              </div>
              <p className="text-3xl font-bold text-[#FAFAFA]">{stats.data.totalDistribues}</p>
              <p className="text-xs text-[#52525B] mt-1">Sur {stats.data.periode}</p>
            </div>

            <div className="glass-card p-5 border-glow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[rgba(52,152,219,0.08)] border border-[rgba(52,152,219,0.1)] flex items-center justify-center">
                  <Clock size={16} className="text-[#3498db]" />
                </div>
                <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Attente moyenne</p>
              </div>
              <p className="text-3xl font-bold text-[#FAFAFA]">{stats.data.tauxAttenteMoyen}</p>
              <p className="text-xs text-[#52525B] mt-1">Depuis distribution</p>
            </div>

            <div className="glass-card p-5 border-glow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[rgba(231,76,60,0.08)] border border-[rgba(231,76,60,0.1)] flex items-center justify-center">
                  <RotateCcw size={16} className="text-[#e74c3c]" />
                </div>
                <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Redistribution</p>
              </div>
              <p className="text-3xl font-bold text-[#FAFAFA]">{stats.data.tauxRedistribution}%</p>
              <p className="text-xs text-[#52525B] mt-1">Leads re-routés</p>
            </div>

            <div className="glass-card p-5 border-glow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.1)] flex items-center justify-center">
                  <TrendingUp size={16} className="text-[#22C55E]" />
                </div>
                <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Conversion</p>
              </div>
              <p className="text-3xl font-bold text-[#FAFAFA]">{stats.data.tauxConversionPostDistrib}%</p>
              <p className="text-xs text-[#52525B] mt-1">Post-distribution</p>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-[#FAFAFA] mb-4 flex items-center gap-2">
              <Activity size={15} className="text-[#D4A853]" /> Répartition par marché
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#A1A1AA] flex items-center gap-1.5">
                    <MapPin size={12} className="text-[#D4A853]" /> France (B2B)
                  </span>
                  <span className="text-xs text-[#FAFAFA] font-medium">Marouane (Senior)</span>
                </div>
                <div className="h-2 bg-[#0d0d0f] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#D4A853] to-[#E8C87A] rounded-full" style={{ width: '35%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#A1A1AA] flex items-center gap-1.5">
                    <MapPin size={12} className="text-[#3498db]" /> Tunisie (B2C)
                  </span>
                  <span className="text-xs text-[#FAFAFA] font-medium">Recrues (Rotation)</span>
                </div>
                <div className="h-2 bg-[#0d0d0f] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#3498db] to-[#5dade2] rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
