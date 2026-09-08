import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Headphones, Users, TrendingUp, AlertTriangle, MessageSquare,
  ChevronLeft, Loader2, CheckCircle, Clock, Phone, Target,
  BarChart3, Activity, Zap, UserCheck, Timer
} from 'lucide-react';
import { trpc } from '@/providers/trpc';

type Tab = 'plateau' | 'performance' | 'alertes' | 'coaching';

const TABS: { id: Tab; label: string; icon: typeof Headphones }[] = [
  { id: 'plateau', label: 'Plateau temps reel', icon: Activity },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'alertes', label: 'Alertes', icon: AlertTriangle },
  { id: 'coaching', label: 'Coaching', icon: MessageSquare },
];

const STATUS_COLORS: Record<string, string> = {
  online: 'text-[#22C55E] bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.15)]',
  offline: 'text-[#52525B] bg-[rgba(82,82,91,0.08)] border-[rgba(82,82,91,0.15)]',
  en_appel: 'text-[#D4A853] bg-[rgba(212,168,83,0.08)] border-[rgba(212,168,83,0.15)]',
  pause: 'text-[#3498db] bg-[rgba(52,152,219,0.08)] border-[rgba(52,152,219,0.15)]',
};

const STATUS_LABELS: Record<string, string> = {
  online: 'En ligne',
  offline: 'Hors ligne',
  en_appel: 'En appel',
  pause: 'Pause',
};

export default function ManuePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('plateau');

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
            <Headphones size={20} className="text-[#D4A853]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#FAFAFA]">Manue</h1>
            <p className="text-xs text-[#52525B]">Superviseuse Plateau Telephonique</p>
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
        {activeTab === 'plateau' && <PlateauTab />}
        {activeTab === 'performance' && <PerformanceTab />}
        {activeTab === 'alertes' && <AlertesTab />}
        {activeTab === 'coaching' && <CoachingTab />}
      </div>
    </div>
  );
}

/* ─── PLATEAU TEMPS RÉEL ─── */
function PlateauTab() {
  const team = trpc.manue.teamStatus.useQuery();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] mb-1 flex items-center gap-2">
          <Activity size={18} className="text-[#D4A853]" /> Etat du plateau
        </h2>
        <p className="text-sm text-[#52525B] mb-6">Vue temps reel de l equipe de televendeurs.</p>

        {team.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-[#D4A853]" />
          </div>
        ) : team.data ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {team.data.map((member: any) => (
              <div key={member.id} className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={"w-9 h-9 rounded-lg flex items-center justify-center border " + (STATUS_COLORS[member.statut] || STATUS_COLORS.offline)}>
                      <UserCheck size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#FAFAFA]">{member.nom}</p>
                      <p className="text-[10px] text-[#52525B]">{STATUS_LABELS[member.statut] || member.statut}</p>
                    </div>
                  </div>
                  <span className={"text-[10px] px-2 py-0.5 rounded-full border " + (STATUS_COLORS[member.statut] || STATUS_COLORS.offline)}>
                    {member.appelsAujourdhui} appels
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs font-bold text-[#FAFAFA]">{member.dureeMoyenne}s</p>
                    <p className="text-[10px] text-[#52525B]">Duree moy.</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#D4A853]">{member.tauxConversion}%</p>
                    <p className="text-[10px] text-[#52525B]">Conversion</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#FAFAFA]">{member.derniereActivite ? new Date(member.derniereActivite).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                    <p className="text-[10px] text-[#52525B]">Dern. act.</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ─── PERFORMANCE ─── */
function PerformanceTab() {
  const [teleId, setTeleId] = useState('');
  const performance = trpc.manue.performance.useQuery(
    { televendeurId: teleId },
    { enabled: !!teleId }
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] mb-1 flex items-center gap-2">
          <BarChart3 size={18} className="text-[#D4A853]" /> Performance individuelle
        </h2>
        <p className="text-sm text-[#52525B] mb-6">Analysez les KPIs d un televendeur.</p>

        <div className="flex gap-3 mb-6">
          <input type="text" value={teleId}
            onChange={e => setTeleId(e.target.value)}
            placeholder="ID televendeur (UUID)"
            className="flex-1 h-11 bg-[#0d0d0f] border border-white/[0.06] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
          <button onClick={() => performance.refetch()} disabled={!teleId || performance.isFetching}
            className="btn-gold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50">
            {performance.isFetching ? <><Loader2 size={15} className="animate-spin" /> Analyse...</>
              : <><Target size={15} /> Analyser</>}
          </button>
        </div>

        {performance.data && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04] text-center">
                <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Total appels</p>
                <p className="text-3xl font-bold text-[#FAFAFA]">{performance.data.kpi.totalAppels}</p>
              </div>
              <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04] text-center">
                <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Taux decroche</p>
                <p className="text-3xl font-bold text-[#D4A853]">{performance.data.kpi.tauxDecroche}%</p>
              </div>
              <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04] text-center">
                <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Duree moy.</p>
                <p className="text-3xl font-bold text-[#FAFAFA]">{performance.data.kpi.dureeMoyenne}s</p>
              </div>
              <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04] text-center">
                <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Conversion</p>
                <p className="text-3xl font-bold text-[#22C55E]">{performance.data.kpi.tauxConversion}%</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-2">Historique recent</p>
              <div className="space-y-2">
                {performance.data.historique.map((call: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-[#0d0d0f] rounded-xl p-3 border border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <Phone size={14} className={call.status === 'answered' ? 'text-[#22C55E]' : 'text-[#e74c3c]'} />
                      <span className="text-sm text-[#FAFAFA]">{call.duration ?? 0}s</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(212,168,83,0.08)] text-[#D4A853] border border-[rgba(212,168,83,0.15)]">
                      {call.rdvBooked ? 'RDV pris' : call.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── ALERTES ─── */
function AlertesTab() {
  const [type, setType] = useState<'appels_bas' | 'conversion_bas' | 'absence' | 'file_attente'>('appels_bas');
  const alerte = trpc.manue.alerte.useMutation();

  const handleAlerte = () => {
    alerte.mutate({ type });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] mb-1 flex items-center gap-2">
          <AlertTriangle size={18} className="text-[#D4A853]" /> Declencher une alerte
        </h2>
        <p className="text-sm text-[#52525B] mb-6">Signalez un probleme sur le plateau.</p>

        <div className="flex gap-3 mb-4">
          <select value={type} onChange={e => setType(e.target.value as any)}
            className="flex-1 h-11 bg-[#0d0d0f] border border-white/[0.06] rounded-xl px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30 transition-all">
            <option value="appels_bas">Taux d appels bas</option>
            <option value="conversion_bas">Conversion faible</option>
            <option value="absence">Absence prolongee</option>
            <option value="file_attente">File d attente</option>
          </select>
          <button onClick={handleAlerte} disabled={alerte.isPending}
            className="btn-gold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50">
            {alerte.isPending ? <><Loader2 size={15} className="animate-spin" /> Envoi...</>
              : <><Zap size={15} /> Declencher</>}
          </button>
        </div>

        {alerte.data && (
          <div className={"flex items-center gap-3 rounded-xl p-4 border " + (
            alerte.data.priorite === 'critique' ? 'bg-[rgba(231,76,60,0.08)] border-[rgba(231,76,60,0.15)]' :
            alerte.data.priorite === 'haute' ? 'bg-[rgba(212,168,83,0.08)] border-[rgba(212,168,83,0.15)]' :
            'bg-[rgba(52,152,219,0.08)] border-[rgba(52,152,219,0.15)]'
          )}>
            <AlertTriangle size={20} className={
              alerte.data.priorite === 'critique' ? 'text-[#e74c3c]' :
              alerte.data.priorite === 'haute' ? 'text-[#D4A853]' : 'text-[#3498db]'
            } />
            <div>
              <p className="text-sm font-bold text-[#FAFAFA]">{alerte.data.message}</p>
              <p className="text-xs text-[#52525B] capitalize">Priorite: {alerte.data.priorite}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── COACHING ─── */
function CoachingTab() {
  const [teleId, setTeleId] = useState('');
  const coaching = trpc.manue.coaching.useQuery(
    { televendeurId: teleId },
    { enabled: !!teleId }
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] mb-1 flex items-center gap-2">
          <MessageSquare size={18} className="text-[#D4A853]" /> Coaching automatise
        </h2>
        <p className="text-sm text-[#52525B] mb-6">Recommandations personnalisees pour chaque televendeur.</p>

        <div className="flex gap-3 mb-6">
          <input type="text" value={teleId}
            onChange={e => setTeleId(e.target.value)}
            placeholder="ID televendeur (UUID)"
            className="flex-1 h-11 bg-[#0d0d0f] border border-white/[0.06] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
          <button onClick={() => coaching.refetch()} disabled={!teleId || coaching.isFetching}
            className="btn-gold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50">
            {coaching.isFetching ? <><Loader2 size={15} className="animate-spin" /> Analyse...</>
              : <><Zap size={15} /> Generer</>}
          </button>
        </div>

        {coaching.data && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={20} className="text-[#22C55E]" />
              <div>
                <h3 className="text-sm font-bold text-[#FAFAFA]">Recommandations de coaching</h3>
                <p className="text-xs text-[#52525B]">Televendeur: {coaching.data.televendeurId}</p>
              </div>
            </div>
            {coaching.data.recommandations.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-3 bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04]">
                <Target size={16} className="text-[#D4A853] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#A1A1AA]">{rec}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
