import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield, CheckCircle, AlertTriangle, FileText, Upload,
  ChevronLeft, Loader2, Clock, XCircle, AlertOctagon,
  FolderOpen, Eye, ThumbsUp, ThumbsDown, MessageSquare
} from 'lucide-react';
import { trpc } from '@/providers/trpc';

type Tab = 'checklist' | 'documents' | 'alertes';

const TABS: { id: Tab; label: string; icon: typeof Shield }[] = [
  { id: 'checklist', label: 'Checklist KYC/AML', icon: Shield },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'alertes', label: 'Alertes', icon: AlertOctagon },
];

const STATUS_COLORS: Record<string, string> = {
  valide: 'text-[#22C55E] bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.15)]',
  en_attente: 'text-[#D4A853] bg-[rgba(212,168,83,0.08)] border-[rgba(212,168,83,0.15)]',
  rejete: 'text-[#e74c3c] bg-[rgba(231,76,60,0.08)] border-[rgba(231,76,60,0.15)]',
};

const STATUS_LABELS: Record<string, string> = {
  valide: 'Validé',
  en_attente: 'En attente',
  rejete: 'Rejeté',
};

export default function JuliaPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('checklist');

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
            <Shield size={20} className="text-[#D4A853]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#FAFAFA]">Julia</h1>
            <p className="text-xs text-[#52525B]">Agent Conformité KYC / AML</p>
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
        {activeTab === 'checklist' && <ChecklistTab />}
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'alertes' && <AlertesTab />}
      </div>
    </div>
  );
}

/* ─── CHECKLIST KYC/AML ─── */
function ChecklistTab() {
  const checklist = trpc.julia.checklist.useQuery();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] mb-1 flex items-center gap-2">
          <Shield size={18} className="text-[#D4A853]" /> Checklist de conformité
        </h2>
        <p className="text-sm text-[#52525B] mb-6">Verification KYC / AML du dossier patrimonial.</p>

        {checklist.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-[#D4A853]" />
          </div>
        ) : checklist.data ? (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className={"w-16 h-16 rounded-2xl flex items-center justify-center border " + (
                checklist.data.statut === 'vert' ? 'bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.2)]' :
                checklist.data.statut === 'orange' ? 'bg-[rgba(212,168,83,0.08)] border-[rgba(212,168,83,0.2)]' :
                'bg-[rgba(231,76,60,0.08)] border-[rgba(231,76,60,0.2)]'
              )}>
                <span className="text-2xl font-bold text-[#FAFAFA]">{checklist.data.tauxConformite}%</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#FAFAFA]">Conformite globale</h3>
                <p className="text-xs text-[#52525B] capitalize">Statut: {checklist.data.statut}</p>
              </div>
            </div>

            <div className="space-y-2">
              {checklist.data.checklist.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    {item.valide ? (
                      <CheckCircle size={18} className="text-[#22C55E]" />
                    ) : (
                      <XCircle size={18} className="text-[#e74c3c]" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-[#FAFAFA]">{item.label}</p>
                      {item.obligatoire && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(231,76,60,0.08)] text-[#e74c3c] border border-[rgba(231,76,60,0.15)]">Obligatoire</span>
                      )}
                    </div>
                  </div>
                  <span className={"text-xs px-2 py-1 rounded-full border " + (item.valide ? STATUS_COLORS.valide : STATUS_COLORS.en_attente)}>
                    {item.valide ? 'Valide' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

/* ─── DOCUMENTS ─── */
function DocumentsTab() {
  const [dossierId, setDossierId] = useState(1);
  const [type, setType] = useState('kyc_id');
  const [url, setUrl] = useState('');
  const [nom, setNom] = useState('');

  const addDoc = trpc.julia.addDocument.useMutation();
  const validateDoc = trpc.julia.validateDocument.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !nom) return;
    addDoc.mutate({ dossierId, type, url, nom });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] mb-1 flex items-center gap-2">
          <Upload size={18} className="text-[#D4A853]" /> Ajouter un document
        </h2>
        <p className="text-sm text-[#52525B] mb-6">Deposer un document pour verification KYC/AML.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#A1A1AA] mb-1.5 block">Type de document</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full h-11 bg-[#0d0d0f] border border-white/[0.06] rounded-xl px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30 transition-all">
                <option value="kyc_id">Piece d identite</option>
                <option value="kyc_rib">RIB signataire</option>
                <option value="kyc_fiscal">Justificatif domicile</option>
                <option value="aml_source">Source des fonds</option>
                <option value="aml_pep">Verification PEP</option>
                <option value="prod_mandat">Mandat de gestion</option>
                <option value="prod_questionnaire">Questionnaire patrimonial</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#A1A1AA] mb-1.5 block">Nom du fichier</label>
              <input type="text" value={nom} onChange={e => setNom(e.target.value)}
                placeholder="Ex: CIN_Front.pdf"
                className="w-full h-11 bg-[#0d0d0f] border border-white/[0.06] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#A1A1AA] mb-1.5 block">URL du document</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://storage.lnr-finance.com/doc.pdf"
              className="w-full h-11 bg-[#0d0d0f] border border-white/[0.06] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
          </div>
          <button type="submit" disabled={addDoc.isPending || !url || !nom}
            className="btn-gold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50">
            {addDoc.isPending ? <><Loader2 size={15} className="animate-spin" /> Envoi...</>
              : <><Upload size={15} /> Ajouter le document</>}
          </button>
        </form>

        {addDoc.data && (
          <div className="mt-4 flex items-center gap-3 bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04]">
            <CheckCircle size={18} className="text-[#22C55E]" />
            <div>
              <p className="text-sm font-medium text-[#FAFAFA]">Document ajoute</p>
              <p className="text-xs text-[#52525B]">{addDoc.data.nom} — {STATUS_LABELS[addDoc.data.status]}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── ALERTES ─── */
function AlertesTab() {
  const alertes = trpc.julia.alertes.useQuery();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] mb-1 flex items-center gap-2">
          <AlertOctagon size={18} className="text-[#D4A853]" /> Alertes de conformite
        </h2>
        <p className="text-sm text-[#52525B] mb-6">Dossiers necessitant une attention immediate.</p>

        {alertes.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-[#D4A853]" />
          </div>
        ) : alertes.data && alertes.data.length > 0 ? (
          <div className="space-y-2">
            {alertes.data.map((alerte: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(231,76,60,0.08)] border border-[rgba(231,76,60,0.15)] flex items-center justify-center">
                    <AlertTriangle size={16} className="text-[#e74c3c]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#FAFAFA]">{alerte.alerte}</p>
                    <p className="text-xs text-[#52525B]">Dossier #{alerte.dossierId} — Lead: {alerte.leadId}</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-[rgba(231,76,60,0.08)] text-[#e74c3c] border border-[rgba(231,76,60,0.15)] uppercase">
                  {alerte.priorite}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <CheckCircle size={32} className="text-[#22C55E] mx-auto mb-3" />
            <p className="text-sm text-[#52525B]">Aucune alerte. Tous les dossiers sont conformes !</p>
          </div>
        )}
      </div>
    </div>
  );
}
