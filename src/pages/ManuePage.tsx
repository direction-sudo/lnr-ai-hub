import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Headphones, Users, BarChart3, AlertTriangle, MessageSquare,
  ChevronLeft, Loader2, CheckCircle, Clock, TrendingUp,
  Phone, PhoneOff, Target, Zap, Activity, UserCheck
} from 'lucide-react';
import { trpc } from '@/providers/trpc';

type Tab = 'plateau' | 'performance' | 'alertes' | 'coaching';

const TABS: { id: Tab; label: string; icon: typeof Headphones }[] = [
  { id: 'plateau', label: 'Plateau', icon: Users },
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
            <p className="text-xs text-[#52525B]">Agent Supervision des televendeurs</p>
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

/* ─── PLATEAU ─── */
function PlateauTab() {
  const team = trpc.manue.teamStatus.useQuery();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] mb-1 flex items-center gap-2">
          <Users size={18} className="text-[#D4A853]" /> Etat du plateau
        </h2>
        <p className="text-sm text-[#52525B] mb-6">Supervision temps reel des televendeurs.</p>

        {team.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-[#D4A853]" />
          </div>
        ) : team.data && team.data.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.data.map((t: any) => (
              <div key={t.id} className="bg-[#0d0d0f] rounded-xl p-5 border border-white/[0.04]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={"w-3 h-3 rounded-full " + (
                      t.statut === 'online' ? 'bg-[#22C55E]' :
                      t.statut === 'en_appel' ? 'bg-[#D4A853]' :
                      t.statut === 'pause' ? 'bg-[#3498db]' : 'bg-[#52525B]'
                    )} />
                    <span className="text-sm font-bold text-[#FAFAFA]">{t.nom}</span>
                  </div>
                  <span className={"text-[10px] px-2 py-0.5 rounded-full border " + (STATUS_COLORS[t.statut] || STATUS_COLORS.offline)}>
                    {STATUS_LABELS[t.statut] || t.statut}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Appels/jour</p>
                    <p className="text-lg font-bold text-[#FAFAFA]">{t.appelsAujourdhui}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Duree moy.</p>
                    <p className="text-lg font-bold text-[#FAFAFA]">{t.dureeMoyenne}s</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Conversion</p>
                    <p className="text-lg font-bold text-[#D4A853]">{t.tauxConversion}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Derniere act.</p>
                    <p className="text-xs text-[#A1A1AA]">{t.derniereActivite ? new Date(t.derniereActivite).toLocaleTimeString('fr-FR') : '-'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Users size={32} className="text-[#52525B] mx-auto mb-3" />
            <p className="text-sm text-[#52525B]">Aucun televendeur actif.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── PERFORMANCE ─── */
function PerformanceTab() {
  const [teleId, setTeleId] = useState('');
  const perf = trpc.manue.performance.useQuery(
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
          <button onClick={() => perf.refetch()} disabled={!teleId || perf.isFetching}
            className="btn-gold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50">
            {perf.isFetching ? <><Loader2 size={15} className="animate-spin" /> Analyse...</>
              : <><Target size={15} /> Analyser</>}
          </button>
        </div>

        {perf.data && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04] text-center">
                <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Total appels</p>
                <p className="text-3xl font-bold text-[#FAFAFA]">{perf.data.kpi.totalAppels}</p>
              </div>
              <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04] text-center">
                <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Decroche</p>
                <p className="text-3xl font-bold text-[#22C55E]">{perf.data.kpi.tauxDecroche}%</p>
              </div>
              <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04] text-center">
                <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Duree moy.</p>
                <p className="text-3xl font-bold text-[#D4A853]">{perf.data.kpi.dureeMoyenne}s</p>
              </div>
              <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04] text-center">
                <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">RDV pris</p>
                <p className="text-3xl font-bold text-[#FAFAFA]">{perf.data.kpi.rdvPris}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-2">Historique des appels</p>
              <div className="space-y-2">
                {perf.data.historique.map((call: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-[#0d0d0f] rounded-xl p-3 border border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      {call.status === 'answered' ? (
                        <Phone size={14} className="text-[#22C55E]" />
                      ) : (
                        <PhoneOff size={14} className="text-[#e74c3c]" />
                      )}
                      <span className="text-xs text-[#A1A1AA]">{call.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#52525B]">{call.duration}s</span>
                      {call.rdvBooked && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.08)] text-[#22C55E] border border-[rgba(34,197,94,0.15)]">RDV</span>
                      )}
                    </div>
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
  const [seuil, setSeuil] = useState(10);
  const alerte = trpc.manue.alerte.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alerte.mutate({ type, seuil });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] mb-1 flex items-center gap-2">
          <AlertTriangle size={18} className="text-[#D4A853]" /> Creer une alerte
        </h2>
        <p className="text-sm text-[#52525B] mb-6">Declenchez une alerte de supervision automatique.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#A1A1AA] mb-1.5 block">Type d alerte</label>
            <div className="grid grid-cols-2 gap-2">
              {(['appels_bas', 'conversion_bas', 'absence', 'file_attente'] as const).map(opt => (
                <button key={opt} type="button" onClick={() => setType(opt)}
                  className={"h-10 rounded-xl text-xs font-medium transition-all " + (
                    type === opt
                      ? 'bg-[rgba(212,168,83,0.08)] text-[#D4A853] border border-[rgba(212,168,83,0.2)]'
                      : 'bg-[#0d0d0f] text-[#52525B] border border-white/[0.06] hover:text-[#A1A1AA]'
                  )}>
                  {opt === 'appels_bas' ? 'Appels bas' :
                   opt === 'conversion_bas' ? 'Conversion basse' :
                   opt === 'absence' ? 'Absence' : 'File d attente'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#A1A1AA] mb-1.5 block">Seuil</label>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={50} value={seuil}
                onChange={e => setSeuil(Number(e.target.value))}
                className="flex-1 accent-[#D4A853]" />
              <span className="text-sm font-bold text-[#FAFAFA] w-10 text-right">{seuil}</span>
            </div>
          </div>

          <button type="submit" disabled={alerte.isPending}
            className="btn-gold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50">
            {alerte.isPending ? <><Loader2 size={15} className="animate-spin" /> Envoi...</>
              : <><Zap size={15} /> Declencher l alerte</>}
          </button>
        </form>

        {alerte.data && (
          <div className="mt-4 flex items-center gap-3 bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04]">
            <AlertTriangle size={18} className={"flex-shrink-0 " + (
              alerte.data.priorite === 'critique' ? 'text-[#e74c3c]' : 'text-[#D4A853]'
            )} />
            <div>
              <p className="text-sm font-medium text-[#FAFAFA]">{alerte.data.message}</p>
              <p className="text-xs text-[#52525B]">Priorite: {alerte.data.priorite} — {alerte.data.status}</p>
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
    <div className="max-w-3xl mx-auto space-y-6">
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
              : <><UserCheck size={15} /> Generer le coaching</>}
          </button>
        </div>

        {coaching.data && coaching.data.recommandations.length > 0 ? (
          <div className="space-y-3">
            {coaching.data.recommandations.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-3 bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04]">
                <TrendingUp size={16} className="text-[#D4A853] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#A1A1AA]">{rec}</p>
              </div>
            ))}
          </div>
        ) : coaching.data ? (
          <div className="text-center py-10">
            <CheckCircle size={32} className="text-[#22C55E] mx-auto mb-3" />
            <p className="text-sm text-[#52525B]">Aucune recommandation — performance optimale !</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
