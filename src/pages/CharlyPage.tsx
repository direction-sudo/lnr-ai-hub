import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Crown, Activity, FileText, Bell, Users, ChevronLeft,
  Loader2, Phone, Target, CalendarCheck, TrendingUp,
  AlertTriangle, Clock, CheckCircle, RefreshCw,
} from 'lucide-react';
import { trpc } from '@/providers/trpc';

type Tab = 'cockpit' | 'rapport' | 'alertes' | 'agents';

const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: 'cockpit', label: 'Cockpit temps réel', icon: Activity },
  { id: 'rapport', label: 'Rapport 8h00', icon: FileText },
  { id: 'alertes', label: 'Alertes', icon: Bell },
  { id: 'agents', label: 'Agents 9/9', icon: Users },
];

export default function CharlyPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('cockpit');

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
            <Crown size={20} className="text-[#D4A853]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#FAFAFA]">Charly</h1>
            <p className="text-xs text-[#52525B]">Orchestrateur de Direction</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 px-6 py-3 border-b border-white/[0.04] overflow-x-auto"
        style={{ background: 'rgba(13,13,15,0.9)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap " + (
                isActive
                  ? 'bg-[rgba(212,168,83,0.08)] text-[#D4A853] border border-[rgba(212,168,83,0.12)]'
                  : 'text-[#52525B] hover:text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.02)]'
              )}>
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'cockpit' && <CockpitTab />}
        {activeTab === 'rapport' && <RapportTab />}
        {activeTab === 'alertes' && <AlertesTab />}
        {activeTab === 'agents' && <AgentsTab />}
      </div>
    </div>
  );
}

/* ═══════════ COCKPIT TEMPS RÉEL ═══════════ */
function CockpitTab() {
  const kpi = trpc.charly.kpiTempsReel.useQuery();

  if (kpi.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#D4A853]" />
      </div>
    );
  }

  if (!kpi.data) {
    return (
      <div className="text-center py-20">
        <AlertTriangle size={32} className="text-[#D4A853] mx-auto mb-3" />
        <p className="text-sm text-[#52525B]">KPIs indisponibles pour le moment.</p>
      </div>
    );
  }

  const d = kpi.data;
  const cards = [
    { label: 'Agents actifs', value: String(d.agentsActifs), icon: Users, color: '#22C55E' },
    { label: 'Appels en cours', value: String(d.appelsEnCours), icon: Phone, color: '#3498db' },
    { label: "Leads aujourd'hui", value: String(d.leadsAujourdhui), icon: Target, color: '#D4A853' },
    { label: "RDV aujourd'hui", value: String(d.rdvAujourdhui), icon: CalendarCheck, color: '#A855F7' },
    { label: 'Conversion globale', value: d.tauxConversionGlobal + '%', icon: TrendingUp, color: '#22C55E' },
    { label: 'Alertes actives', value: String(d.alertesActives), icon: Bell, color: d.alertesActives > 0 ? '#e74c3c' : '#22C55E' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#FAFAFA] flex items-center gap-2">
            <Activity size={18} className="text-[#D4A853]" /> Vue d'ensemble
          </h2>
          <p className="text-sm text-[#52525B]">
            Snapshot global — mis à jour à {new Date(d.timestamp).toLocaleTimeString('fr-FR')}
          </p>
        </div>
        <button onClick={() => kpi.refetch()} disabled={kpi.isRefetching}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.1)] text-xs text-[#D4A853] hover:bg-[rgba(212,168,83,0.1)] transition-all disabled:opacity-50">
          <RefreshCw size={13} className={kpi.isRefetching ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className="glass-card p-5 border-glow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: c.color + '14', border: '1px solid ' + c.color + '26' }}>
                <c.icon size={16} style={{ color: c.color }} />
              </div>
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider">{c.label}</p>
            </div>
            <p className="text-3xl font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ RAPPORT 8H00 ═══════════ */
function RapportTab() {
  const rapport = trpc.charly.rapportQuotidien.useQuery();

  if (rapport.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#D4A853]" />
      </div>
    );
  }

  if (!rapport.data) {
    return (
      <div className="text-center py-20">
        <FileText size={32} className="text-[#D4A853] mx-auto mb-3" />
        <p className="text-sm text-[#52525B]">Rapport indisponible.</p>
      </div>
    );
  }

  const r = rapport.data;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="glass-card p-6 border-glow">
        <div className="flex items-center gap-3 mb-6">
          <FileText size={20} className="text-[#D4A853]" />
          <div>
            <h3 className="text-sm font-bold text-[#FAFAFA]">Rapport quotidien de direction</h3>
            <p className="text-xs text-[#52525B]">{new Date(r.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
        <p className="text-sm text-[#A1A1AA] leading-relaxed bg-[#0d0d0f] border border-white/[0.04] rounded-xl p-4">{r.message}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-3">Présences</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#A1A1AA]">Présents</span><span className="font-bold text-[#22C55E]">{r.presence.presents}</span></div>
            <div className="flex justify-between"><span className="text-[#A1A1AA]">Retards</span><span className="font-bold text-[#D4A853]">{r.presence.retards}</span></div>
            <div className="flex justify-between"><span className="text-[#A1A1AA]">Absents</span><span className="font-bold text-[#e74c3c]">{r.presence.absents}</span></div>
          </div>
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-3">Leads</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#A1A1AA]">Nouveaux</span><span className="font-bold text-[#FAFAFA]">{r.leads.nouveaux}</span></div>
            <div className="flex justify-between"><span className="text-[#A1A1AA]">Qualifiés</span><span className="font-bold text-[#FAFAFA]">{r.leads.qualifies}</span></div>
            <div className="flex justify-between"><span className="text-[#A1A1AA]">RDV pris</span><span className="font-bold text-[#FAFAFA]">{r.leads.rdvPris}</span></div>
            <div className="flex justify-between"><span className="text-[#A1A1AA]">Convertis</span><span className="font-bold text-[#22C55E]">{r.leads.convertis}</span></div>
          </div>
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-3">Appels</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#A1A1AA]">Total</span><span className="font-bold text-[#FAFAFA]">{r.appels.total}</span></div>
            <div className="flex justify-between"><span className="text-[#A1A1AA]">Décrochés</span><span className="font-bold text-[#FAFAFA]">{r.appels.decroches}</span></div>
            <div className="flex justify-between"><span className="text-[#A1A1AA]">Taux décroché</span><span className="font-bold text-[#D4A853]">{r.appels.tauxDecroche}%</span></div>
            <div className="flex justify-between"><span className="text-[#A1A1AA]">Durée moy.</span><span className="font-bold text-[#FAFAFA]">{Math.round(r.appels.dureeMoyenne / 60)} min</span></div>
          </div>
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-3">KPIs critiques</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#A1A1AA]">Conversion</span><span className="font-bold text-[#22C55E]">{r.kpi.tauxConversion}%</span></div>
            <div className="flex justify-between"><span className="text-[#A1A1AA]">Transfert</span><span className={"font-bold " + (r.kpi.tauxTransfert > 15 ? 'text-[#e74c3c]' : 'text-[#FAFAFA]')}>{r.kpi.tauxTransfert}%</span></div>
            <div className="flex justify-between"><span className="text-[#A1A1AA]">File max</span><span className="font-bold text-[#FAFAFA]">{r.kpi.fileAttenteMax}</span></div>
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-3">Incidents</p>
        {r.incidents.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-[#22C55E]">
            <CheckCircle size={15} /> Aucun incident signalé aujourd'hui.
          </div>
        ) : (
          <ul className="space-y-2">
            {r.incidents.map((inc: { id: number; message: string }, i: number) => (
              <li key={inc.id ?? i} className="text-sm text-[#A1A1AA]">— {inc.message}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ═══════════ ALERTES ═══════════ */
function AlertesTab() {
  const alertes = trpc.charly.alertesActives.useQuery();

  const prioriteColor = (p: string) =>
    p === 'haute' ? 'text-[#e74c3c]' : p === 'moyenne' ? 'text-[#D4A853]' : 'text-[#3498db]';
  const prioriteBg = (p: string) =>
    p === 'haute' ? 'bg-[rgba(231,76,60,0.08)] border-[rgba(231,76,60,0.15)]' :
    p === 'moyenne' ? 'bg-[rgba(212,168,83,0.08)] border-[rgba(212,168,83,0.15)]' :
    'bg-[rgba(52,152,219,0.08)] border-[rgba(52,152,219,0.15)]';

  if (alertes.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#D4A853]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] mb-1 flex items-center gap-2">
          <Bell size={18} className="text-[#D4A853]" /> Alertes actives
        </h2>
        <p className="text-sm text-[#52525B] mb-6">Seuils critiques dépassés — notification WhatsApp à Yassir en temps réel.</p>

        {alertes.data && alertes.data.length > 0 ? (
          <div className="space-y-2">
            {alertes.data.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04]">
                <div className="flex items-center gap-4">
                  <div className={"w-10 h-10 rounded-xl border flex items-center justify-center " + prioriteBg(a.priorite)}>
                    <AlertTriangle size={16} className={prioriteColor(a.priorite)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#FAFAFA]">{a.message}</p>
                    <p className="text-xs text-[#52525B]">Agent : {a.agent} · Type : {a.type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={"px-2.5 py-1 text-[10px] font-semibold rounded-full border capitalize " + prioriteBg(a.priorite) + ' ' + prioriteColor(a.priorite)}>
                    {a.priorite}
                  </span>
                  <span className="text-xs text-[#3F3F46] flex items-center gap-1"><Clock size={11} /> {a.heure}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <CheckCircle size={32} className="text-[#22C55E] mx-auto mb-3" />
            <p className="text-sm text-[#52525B]">Aucune alerte active. Tout est sous contrôle.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════ TABLEAU AGENTS 9/9 ═══════════ */
function AgentsTab() {
  const tableau = trpc.charly.tableauAgents.useQuery();

  if (tableau.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#D4A853]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] mb-1 flex items-center gap-2">
          <Users size={18} className="text-[#D4A853]" /> Statut de la flotte
        </h2>
        <p className="text-sm text-[#52525B] mb-6">Tableau de bord 9/9 — état de chaque agent en temps réel.</p>

        <div className="space-y-2">
          {(tableau.data ?? []).map(a => (
            <div key={a.id} className="flex items-center justify-between bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04]">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.15)] flex items-center justify-center text-[#D4A853] text-xs font-bold">
                    {a.nom.charAt(0)}
                  </div>
                  <span className={"absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#0D0D0F] " + (a.statut === 'online' ? 'bg-[#22C55E]' : 'bg-[#e74c3c]')} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#FAFAFA]">{a.nom}</p>
                  <p className="text-xs text-[#52525B]">{a.taches}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-[#3F3F46] flex items-center gap-1"><Clock size={11} /> {a.derniereActivite}</span>
                <span className={"px-2.5 py-1 text-[10px] font-semibold rounded-full border capitalize " + (
                  a.statut === 'online'
                    ? 'bg-[rgba(34,197,94,0.08)] text-[#22C55E] border-[rgba(34,197,94,0.15)]'
                    : 'bg-[rgba(231,76,60,0.08)] text-[#e74c3c] border-[rgba(231,76,60,0.15)]'
                )}>{a.statut}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
