import { useState, useRef } from 'react';
import {
  Users, Briefcase, CalendarDays, ClipboardCheck, BarChart3,
  Plus, Search, Upload, Trash2, Star,
  FileText, Check, X, TrendingUp, Target, Award,
  Filter, Eye, FileUp, CheckCircle,
  AlertCircle, Loader2, FileDown
} from 'lucide-react';
import { useRH } from '@/hooks/useRH';

// ═══════════════════════════════════════════════
// LEO RH PAGE — Full Recruitment Dashboard
// ═══════════════════════════════════════════════

type Tab = 'overview' | 'candidates' | 'jobs' | 'interviews' | 'onboarding';

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
  { id: 'candidates', label: 'Candidats', icon: Users },
  { id: 'jobs', label: 'Offres', icon: Briefcase },
  { id: 'interviews', label: 'Entretiens', icon: CalendarDays },
  { id: 'onboarding', label: 'Onboarding', icon: ClipboardCheck },
];

export default function RHPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'rgba(10,10,11,0.92)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 lg:px-10 py-5 border-b border-white/[0.04]"
        style={{ background: 'rgba(10,10,11,0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.12)] flex items-center justify-center">
              <Users size={20} className="text-[#D4A853]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>Espace RH — Leo</h1>
              <p className="text-xs text-[#52525B]">Recrutement, candidats, entretiens et onboarding</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[rgba(212,168,83,0.08)] text-[#D4A853] border border-[rgba(212,168,83,0.12)]'
                    : 'text-[#52525B] hover:text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.02)]'
                }`}>
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 lg:p-10">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'candidates' && <CandidatesTab />}
        {activeTab === 'jobs' && <JobsTab />}
        {activeTab === 'interviews' && <InterviewsTab />}
        {activeTab === 'onboarding' && <OnboardingTab />}
      </div>
    </div>
  );
}

// ═════════════════ OVERVIEW / KPIs ═════════════════
function OverviewTab() {
  const { getKpis } = useRH();
  const { data, isLoading } = getKpis();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-24" />)}
        </div>
      </div>
    );
  }

  const kpi = data?.overview;

  const cards = [
    { label: 'Candidats total', value: kpi?.totalCandidates ?? 0, icon: Users, color: '#D4A853' },
    { label: 'Offres actives', value: kpi?.activeJobOffers ?? 0, icon: Briefcase, color: '#22C55E' },
    { label: 'Entretiens planifiés', value: kpi?.upcomingInterviews ?? 0, icon: CalendarDays, color: '#3B82F6' },
    { label: 'Recrutements', value: kpi?.hiredCount ?? 0, icon: Award, color: '#A855F7' },
    { label: 'Score moyen', value: `${kpi?.averageScore ?? 0}/100`, icon: Star, color: '#F59E0B' },
    { label: 'Ce mois', value: kpi?.thisMonthCandidates ?? 0, icon: TrendingUp, color: '#14B8A6' },
    { label: 'Entretiens ce mois', value: kpi?.thisMonthInterviews ?? 0, icon: Target, color: '#EF4444' },
    { label: 'Total offres', value: kpi?.totalJobOffers ?? 0, icon: FileText, color: '#6366F1' },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <c.icon size={16} style={{ color: c.color }} />
              <span className="text-lg font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>{c.value}</span>
            </div>
            <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider font-medium">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-[#FAFAFA] mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-[#D4A853]" /> Tunnel de conversion
          </h3>
          <div className="space-y-3">
            {data?.conversionFunnel && [
              { label: 'Nouveaux', value: data.conversionFunnel.new, color: '#3B82F6' },
              { label: 'Screening', value: data.conversionFunnel.screening, color: '#14B8A6' },
              { label: 'Entretien', value: data.conversionFunnel.interview, color: '#D4A853' },
              { label: 'Offre', value: data.conversionFunnel.offer, color: '#F59E0B' },
              { label: 'Embauché', value: data.conversionFunnel.hired, color: '#22C55E' },
            ].map(step => {
              const max = Math.max(...Object.values(data.conversionFunnel), 1);
              const pct = Math.round((step.value / max) * 100);
              return (
                <div key={step.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#A1A1AA]">{step.label}</span>
                    <span className="text-[#FAFAFA] font-semibold">{step.value}</span>
                  </div>
                  <div className="h-2 bg-[#18181B] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 4)}%`, background: step.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rates */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-[#FAFAFA] mb-4 flex items-center gap-2">
            <Target size={15} className="text-[#D4A853]" /> Taux de conversion
          </h3>
          <div className="space-y-4">
            {data?.rates && [
              { label: 'Taux screening', value: data.rates.screeningRate, icon: Filter },
              { label: 'Taux entretien', value: data.rates.interviewRate, icon: CalendarDays },
              { label: 'Taux offre', value: data.rates.offerRate, icon: FileText },
              { label: 'Taux embauche', value: data.rates.hireRate, icon: Award },
            ].map(rate => (
              <div key={rate.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.1)] flex items-center justify-center">
                  <rate.icon size={16} className="text-[#D4A853]" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#A1A1AA]">{rate.label}</span>
                    <span className="text-[#FAFAFA] font-semibold">{rate.value}%</span>
                  </div>
                  <div className="h-1.5 bg-[#18181B] rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4A853] rounded-full transition-all duration-500" style={{ width: `${Math.max(rate.value, 3)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Source Breakdown */}
      {data?.sourceBreakdown && data.sourceBreakdown.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-[#FAFAFA] mb-4 flex items-center gap-2">
            <Eye size={15} className="text-[#D4A853]" /> Sources de candidatures
          </h3>
          <div className="flex flex-wrap gap-3">
            {data.sourceBreakdown.map(s => (
              <div key={s.source} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#18181B] border border-white/[0.04]">
                <span className="w-2 h-2 rounded-full bg-[#D4A853]" />
                <span className="text-xs text-[#A1A1AA] capitalize">{s.source?.replace('_', ' ')}</span>
                <span className="text-xs font-semibold text-[#FAFAFA]">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════ CANDIDATES ═════════════════
function CandidatesTab() {
  const { listCandidates, deleteCandidate, parseCv, createCandidate, generateDocument } = useRH();
  const { data: candidatesList = [], isLoading } = listCandidates();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<number | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [parsedCv, setParsedCv] = useState<any>(null);
  const [uploadContent, setUploadContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = candidatesList.filter(c => {
    const matchesSearch = `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      (c.currentPosition || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsedCv(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      let content = (ev.target?.result as string) || '';
      // Pour les PDF binaires, readAsText donne du garbage — on nettoie
      if (file.name.toLowerCase().endsWith('.pdf')) {
        // Extraire le texte visible du PDF (texte brut entre les balises binaires)
        const textMatches = content.match(/[\x20-\x7E\xC0-\xFF\s]{10,}/g);
        if (textMatches) {
          content = textMatches.join('\n');
        }
        // Si le contenu est toujours vide/garbage, on prévient
        if (content.length < 50 || content.includes('%PDF')) {
          content = content.replace(/[%\\]/g, ' ').replace(/\s+/g, ' ').trim();
        }
      }
      setUploadContent(content);
      if (content.length < 10) {
        setParsedCv({ error: 'Impossible d\'extraire le texte de ce fichier. Essayez un fichier .txt ou copiez-collez le contenu du CV.' });
        return;
      }
      parseCv.mutate({ content }, {
        onSuccess: (data) => {
          setParsedCv(data);
        },
        onError: (err) => {
          console.error('[ParseCV] Error:', err);
          setParsedCv({ error: 'Erreur lors de l\'analyse. Le fichier semble vide ou illisible.' });
        },
      });
    };
    reader.onerror = () => {
      setParsedCv({ error: 'Erreur de lecture du fichier.' });
    };
    reader.readAsText(file);
  };

  const handleSaveParsed = () => {
    if (!parsedCv) return;
    createCandidate.mutate({
      firstName: parsedCv.firstName || 'Inconnu',
      lastName: parsedCv.lastName || 'Inconnu',
      email: parsedCv.email || '',
      phone: parsedCv.phone || '',
      linkedinUrl: parsedCv.linkedinUrl || '',
      experienceYears: parsedCv.yearsOfExperience || parsedCv.experienceYears || 0,
      skills: parsedCv.skills || parsedCv.hardSkills || [],
      education: parsedCv.education || '',
      summary: parsedCv.summary || '',
      cvContent: uploadContent,
      score: parsedCv.score || 0,
      status: 'new',
      // Nouveaux champs IA
      title: parsedCv.title || '',
      address: parsedCv.address || '',
      hardSkills: parsedCv.hardSkills || [],
      softSkills: parsedCv.softSkills || [],
      languages: parsedCv.languages || [],
      certifications: parsedCv.certifications || [],
      experiences: parsedCv.experiences || [],
      companies: parsedCv.companies || [],
      projects: parsedCv.projects || [],
      tools: parsedCv.tools || [],
      yearsOfExperience: parsedCv.yearsOfExperience || 0,
      aiConfidence: parsedCv.aiConfidence || 0,
      rawAnalysis: JSON.stringify(parsedCv),
    }, {
      onSuccess: () => {
        setShowUpload(false);
        setParsedCv(null);
        setUploadContent('');
      },
    });
  };

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    new: { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6', label: 'Nouveau' },
    screening: { bg: 'rgba(20,184,166,0.1)', text: '#14B8A6', label: 'Screening' },
    interview: { bg: 'rgba(212,168,83,0.1)', text: '#D4A853', label: 'Entretien' },
    offer: { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B', label: 'Offre' },
    hired: { bg: 'rgba(34,197,94,0.1)', text: '#22C55E', label: 'Embauché' },
    rejected: { bg: 'rgba(239,68,68,0.1)', text: '#EF4444', label: 'Rejeté' },
    onboarding: { bg: 'rgba(168,85,247,0.1)', text: '#A855F7', label: 'Onboarding' },
  };

  const candidateDetail = candidatesList.find(c => c.id === showDetail);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3F3F46]" />
            <input type="text" placeholder="Rechercher un candidat..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl pl-9 pr-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-3 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30">
            <option value="all">Tous les statuts</option>
            <option value="new">Nouveau</option>
            <option value="screening">Screening</option>
            <option value="interview">Entretien</option>
            <option value="offer">Offre</option>
            <option value="hired">Embauché</option>
            <option value="rejected">Rejeté</option>
            <option value="onboarding">Onboarding</option>
          </select>
        </div>
        <div className="flex gap-2">
          {compareIds.length >= 2 && (
            <button onClick={() => setShowCompare(true)}
              className="px-4 py-2 rounded-xl bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.12)] text-[#D4A853] text-sm font-medium hover:bg-[rgba(212,168,83,0.12)] transition-all flex items-center gap-2">
              <Eye size={14} /> Comparer ({compareIds.length})
            </button>
          )}
          <button onClick={() => setShowUpload(true)}
            className="px-4 py-2 rounded-xl bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.12)] text-[#3B82F6] text-sm font-medium hover:bg-[rgba(59,130,246,0.12)] transition-all flex items-center gap-2">
            <Upload size={14} /> Importer CV
          </button>
          <button onClick={() => setShowAdd(true)}
            className="btn-gold text-sm px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="relative z-10 flex items-center gap-2"><Plus size={14} /> Ajouter</span>
          </button>
        </div>
      </div>

      {/* Upload CV Modal */}
      {showUpload && (
        <div className="glass-card p-6 border border-[#D4A853]/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
              <FileUp size={15} className="text-[#D4A853]" /> Analyse de CV
            </h3>
            <button onClick={() => { setShowUpload(false); setParsedCv(null); }} className="text-[#3F3F46] hover:text-[#FAFAFA]"><X size={16} /></button>
          </div>

          {parsedCv && 'error' in parsedCv ? (
            <div className="text-center py-6">
              <AlertCircle size={32} className="text-[#EF4444] mx-auto mb-3" />
              <p className="text-sm text-[#FAFAFA] mb-2">{(parsedCv as any).error}</p>
              <button onClick={() => { setParsedCv(null); fileInputRef.current?.click(); }}
                className="text-xs text-[#D4A853] hover:underline">Réessayer avec un autre fichier</button>
            </div>
          ) : !parsedCv ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[rgba(212,168,83,0.2)] rounded-2xl p-10 text-center hover:border-[#D4A853]/50 hover:bg-[rgba(212,168,83,0.02)] transition-all cursor-pointer"
            >
              <Upload size={28} className="text-[#D4A853] mx-auto mb-3" />
              <p className="text-sm text-[#A1A1AA] mb-1">Cliquez pour importer un CV (TXT, PDF)</p>
              <p className="text-xs text-[#3F3F46]">Leo analysera et extraira les informations clés</p>
              <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf" className="hidden" onChange={handleFileUpload} />
              {parseCv.isPending && (
                <div className="mt-4 flex items-center justify-center gap-2 text-[#D4A853]">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs">Analyse en cours...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* En-tête : Nom + Score + Confiance IA */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-[#FAFAFA]">{parsedCv.firstName || '—'} {parsedCv.lastName || '—'}</p>
                  {parsedCv.title && <p className="text-xs text-[#D4A853]">{parsedCv.title}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#D4A853]">{parsedCv.score || 0}</p>
                    <p className="text-[9px] text-[#3F3F46] uppercase">Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#22C55E]">{parsedCv.aiConfidence || 0}%</p>
                    <p className="text-[9px] text-[#3F3F46] uppercase">Confiance IA</p>
                  </div>
                </div>
              </div>

              {/* Informations de contact */}
              <div className="grid sm:grid-cols-2 gap-3">
                {parsedCv.email && (
                  <div className="glass-card p-3">
                    <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-1">Email</p>
                    <p className="text-xs text-[#FAFAFA]">{parsedCv.email}</p>
                  </div>
                )}
                {parsedCv.phone && (
                  <div className="glass-card p-3">
                    <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-1">Téléphone</p>
                    <p className="text-xs text-[#FAFAFA]">{parsedCv.phone}</p>
                  </div>
                )}
                {parsedCv.address && (
                  <div className="glass-card p-3">
                    <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-1">Adresse</p>
                    <p className="text-xs text-[#FAFAFA]">{parsedCv.address}</p>
                  </div>
                )}
                {parsedCv.yearsOfExperience > 0 && (
                  <div className="glass-card p-3">
                    <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-1">Expérience</p>
                    <p className="text-xs text-[#FAFAFA]">{parsedCv.yearsOfExperience} ans</p>
                  </div>
                )}
                {parsedCv.linkedinUrl && (
                  <div className="glass-card p-3">
                    <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-1">LinkedIn</p>
                    <p className="text-xs text-[#A1A1AA] truncate">{parsedCv.linkedinUrl}</p>
                  </div>
                )}
              </div>

              {/* Résumé / Profil */}
              {parsedCv.summary && (
                <div className="glass-card p-4">
                  <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-2">Profil</p>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">{parsedCv.summary}</p>
                </div>
              )}

              {/* Hard Skills */}
              {parsedCv.hardSkills && parsedCv.hardSkills.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-2">Hard Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedCv.hardSkills.map((s: string) => (
                      <span key={s} className="px-2 py-1 text-[10px] font-medium rounded-full bg-[rgba(212,168,83,0.08)] text-[#D4A853] border border-[rgba(212,168,83,0.12)]">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Soft Skills */}
              {parsedCv.softSkills && parsedCv.softSkills.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-2">Soft Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedCv.softSkills.map((s: string) => (
                      <span key={s} className="px-2 py-1 text-[10px] font-medium rounded-full bg-[rgba(34,197,94,0.08)] text-[#22C55E] border border-[rgba(34,197,94,0.12)]">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Langues */}
              {parsedCv.languages && parsedCv.languages.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-2">Langues</p>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedCv.languages.map((s: string) => (
                      <span key={s} className="px-2 py-1 text-[10px] font-medium rounded-full bg-[rgba(59,130,246,0.08)] text-[#3B82F6] border border-[rgba(59,130,246,0.12)]">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Diplômes */}
              {parsedCv.education && (
                <div className="glass-card p-4">
                  <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-2">Formation</p>
                  <p className="text-xs text-[#FAFAFA]">
                    {typeof parsedCv.education === 'string' ? parsedCv.education : JSON.stringify(parsedCv.education)}
                  </p>
                </div>
              )}

              {/* Certifications */}
              {parsedCv.certifications && parsedCv.certifications.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-2">Certifications</p>
                  <div className="space-y-1">
                    {parsedCv.certifications.map((s: string) => (
                      <p key={s} className="text-xs text-[#A1A1AA]">• {s}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Outils */}
              {parsedCv.tools && parsedCv.tools.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-2">Outils</p>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedCv.tools.map((s: string) => (
                      <span key={s} className="px-2 py-1 text-[10px] font-medium rounded-full bg-[#18181B] text-[#52525B] border border-white/[0.04]">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Expériences professionnelles */}
              {parsedCv.experiences && parsedCv.experiences.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-2">Expériences professionnelles</p>
                  <div className="space-y-2">
                    {parsedCv.experiences.map((exp: any, i: number) => (
                      <div key={i} className="glass-card p-3">
                        <p className="text-xs font-semibold text-[#FAFAFA]">{exp.title || '—'}</p>
                        <p className="text-[10px] text-[#D4A853]">{exp.company || '—'} {exp.duration && `· ${exp.duration}`}</p>
                        {exp.description && <p className="text-[10px] text-[#52525B] mt-1">{exp.description}</p>}
                        {exp.technologies && exp.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {exp.technologies.map((t: string) => (
                              <span key={t} className="px-1.5 py-0.5 text-[9px] rounded-full bg-[rgba(212,168,83,0.06)] text-[#D4A853]">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projets */}
              {parsedCv.projects && parsedCv.projects.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-2">Projets</p>
                  <div className="space-y-1">
                    {parsedCv.projects.map((s: string) => (
                      <p key={s} className="text-xs text-[#A1A1AA]">• {s}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton Enregistrer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-[#D4A853]" />
                  <span className="text-sm text-[#FAFAFA] font-semibold">Score LEO : {parsedCv.score}/100</span>
                </div>
                <button onClick={handleSaveParsed}
                  className="btn-gold text-sm px-5 py-2 rounded-xl"
                  disabled={createCandidate.isPending}>
                  <span className="relative z-10 flex items-center gap-2">
                    {createCandidate.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Enregistrer le candidat
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Candidates List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users size={32} className="text-[#3F3F46] mx-auto mb-3" />
          <p className="text-sm text-[#52525B]">Aucun candidat trouvé</p>
          <p className="text-xs text-[#3F3F46] mt-1">Importez un CV ou ajoutez un candidat manuellement</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const status = statusColors[c.status || 'new'] || statusColors.new;
            const isSelected = compareIds.includes(c.id);
            return (
              <div key={c.id}
                className={`glass-card p-4 flex items-center gap-4 group transition-all cursor-pointer ${isSelected ? 'border-[#D4A853]/30' : ''}`}
                onClick={() => setShowDetail(c.id)}>
                {/* Compare checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCompareIds(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id]);
                  }}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                    isSelected ? 'bg-[#D4A853] border-[#D4A853]' : 'border-[#3F3F46] hover:border-[#D4A853]'
                  }`}>
                  {isSelected && <Check size={12} className="text-[#0A0A0B]" />}
                </button>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.12)] flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-[#D4A853]">{c.firstName?.[0]}{c.lastName?.[0]}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#FAFAFA]">{c.firstName} {c.lastName}</p>
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full" style={{ background: status.bg, color: status.text }}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#52525B] truncate">{c.currentPosition || '—'} · {c.experienceYears || 0} ans</p>
                </div>

                {/* Score */}
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-[#D4A853]" />
                  <span className="text-sm font-semibold text-[#FAFAFA]">{c.score || 0}</span>
                </div>

                {/* Skills */}
                <div className="hidden lg:flex gap-1 flex-wrap max-w-[200px]">
                  {(c.skills as string[] || []).slice(0, 3).map(s => (
                    <span key={s} className="px-2 py-0.5 text-[10px] rounded-full bg-[#18181B] text-[#A1A1AA]">{s}</span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); setShowDetail(c.id); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#3F3F46] hover:text-[#D4A853] hover:bg-[rgba(212,168,83,0.06)] transition-all">
                    <Eye size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteCandidate.mutate(c.id); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#3F3F46] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.06)] transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Detail Modal */}
      {showDetail && candidateDetail && (
        <CandidateDetailModal
          candidate={candidateDetail}
          onClose={() => setShowDetail(null)}
          statusColors={statusColors}
        />
      )}

      {/* Comparison Modal */}
      {showCompare && compareIds.length >= 2 && (
        <ComparisonModal
          ids={compareIds}
          onClose={() => { setShowCompare(false); setCompareIds([]); }}
        />
      )}
    </div>
  );
}

// ═════════════════ CANDIDATE DETAIL ═════════════════
function CandidateDetailModal({ candidate, onClose, statusColors }: {
  candidate: any;
  onClose: () => void;
  statusColors: Record<string, { bg: string; text: string; label: string }>;
}) {
  const { listInterviews, updateCandidate, listOnboardingSteps, generateDocument } = useRH();
  const { data: allInterviews = [] } = listInterviews();
  const { data: onboardingSteps = [] } = listOnboardingSteps(candidate.id);
  const [activeSection, setActiveSection] = useState<'profile' | 'interviews' | 'docs'>('profile');

  const candidateInterviews = allInterviews.filter(i => i.candidateId === candidate.id);
  const status = statusColors[candidate.status || 'new'] || statusColors.new;

  const handleStatusChange = (newStatus: string) => {
    updateCandidate.mutate({ id: candidate.id, status: newStatus });
  };

  const handleGenerateDoc = (type: "interview_grid" | "onboarding_plan" | "evaluation_report") => {
    generateDocument.mutate({ type, candidateId: candidate.id });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="glass-card w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 p-6 border-b border-white/[0.04] flex items-center justify-between"
          style={{ background: 'rgba(13,13,15,0.98)' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.12)] flex items-center justify-center">
              <span className="text-lg font-bold text-[#D4A853]">{candidate.firstName?.[0]}{candidate.lastName?.[0]}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#FAFAFA]">{candidate.firstName} {candidate.lastName}</h2>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full" style={{ background: status.bg, color: status.text }}>
                  {status.label}
                </span>
              </div>
              <p className="text-xs text-[#52525B]">{candidate.currentPosition || '—'} · {candidate.experienceYears || 0} ans d'expérience</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#3F3F46] hover:text-[#FAFAFA] hover:bg-white/[0.03] transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Score & Actions */}
        <div className="p-6 border-b border-white/[0.04]">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-[#D4A853]" />
              <span className="text-2xl font-bold text-[#FAFAFA]">{candidate.score || 0}</span>
              <span className="text-xs text-[#3F3F46]">/100</span>
            </div>
            <div className="h-8 w-px bg-white/[0.04]" />
            <div className="flex gap-2">
              {['new', 'screening', 'interview', 'offer', 'hired', 'rejected', 'onboarding'].map(s => {
                const sc = statusColors[s];
                return (
                  <button key={s} onClick={() => handleStatusChange(s)}
                    className={`px-2 py-1 text-[10px] font-medium rounded-full border transition-all ${
                      candidate.status === s
                        ? 'bg-[rgba(212,168,83,0.12)] text-[#D4A853] border-[rgba(212,168,83,0.2)]'
                        : 'bg-transparent text-[#3F3F46] border-white/[0.04] hover:border-white/10'
                    }`}>
                    {sc.label}
                  </button>
                );
              })}
            </div>
            <div className="ml-auto flex gap-2">
              <button onClick={() => handleGenerateDoc('interview_grid')}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#18181B] text-[#A1A1AA] hover:text-[#FAFAFA] border border-white/[0.04] hover:border-[#D4A853]/20 transition-all flex items-center gap-1.5">
                <FileText size={12} /> Grille
              </button>
              <button onClick={() => handleGenerateDoc('onboarding_plan')}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#18181B] text-[#A1A1AA] hover:text-[#FAFAFA] border border-white/[0.04] hover:border-[#D4A853]/20 transition-all flex items-center gap-1.5">
                <ClipboardCheck size={12} /> Onboarding
              </button>
              <button onClick={() => handleGenerateDoc('evaluation_report')}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#18181B] text-[#A1A1AA] hover:text-[#FAFAFA] border border-white/[0.04] hover:border-[#D4A853]/20 transition-all flex items-center gap-1.5">
                <FileDown size={12} /> Rapport
              </button>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="flex border-b border-white/[0.04]">
          {[
            { id: 'profile', label: 'Profil', icon: Users },
            { id: 'interviews', label: `Entretiens (${candidateInterviews.length})`, icon: CalendarDays },
            { id: 'docs', label: `Onboarding (${onboardingSteps.length})`, icon: ClipboardCheck },
          ].map(sec => (
            <button key={sec.id} onClick={() => setActiveSection(sec.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                activeSection === sec.id
                  ? 'text-[#D4A853] border-[#D4A853]'
                  : 'text-[#52525B] border-transparent hover:text-[#A1A1AA]'
              }`}>
              <sec.icon size={14} /> {sec.label}
            </button>
          ))}
        </div>

        {/* Profile */}
        {activeSection === 'profile' && (
          <div className="p-6 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm text-[#FAFAFA]">{candidate.email || '—'}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-1">Téléphone</p>
                <p className="text-sm text-[#FAFAFA]">{candidate.phone || '—'}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-1">LinkedIn</p>
                <p className="text-sm text-[#A1A1AA] truncate">{candidate.linkedinUrl || '—'}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-1">Source</p>
                <p className="text-sm text-[#FAFAFA] capitalize">{(candidate.source || 'autre').replace('_', ' ')}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-1">Formation</p>
                <p className="text-sm text-[#FAFAFA]">{candidate.education || '—'}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-[10px] text-[#3F3F46] uppercase tracking-wider mb-1">Poste actuel</p>
                <p className="text-sm text-[#FAFAFA]">{candidate.currentPosition || '—'}</p>
              </div>
            </div>

            {candidate.skills && (candidate.skills as string[]).length > 0 && (
              <div>
                <p className="text-xs font-medium text-[#A1A1AA] mb-2">Compétences</p>
                <div className="flex flex-wrap gap-1.5">
                  {(candidate.skills as string[]).map((s: string) => (
                    <span key={s} className="px-2.5 py-1 text-xs font-medium rounded-full bg-[rgba(212,168,83,0.08)] text-[#D4A853] border border-[rgba(212,168,83,0.12)]">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {candidate.summary && (
              <div>
                <p className="text-xs font-medium text-[#A1A1AA] mb-2">Résumé</p>
                <p className="text-sm text-[#52525B] leading-relaxed">{candidate.summary}</p>
              </div>
            )}

            {candidate.cvContent && (
              <div>
                <p className="text-xs font-medium text-[#A1A1AA] mb-2">Contenu du CV</p>
                <div className="glass-card p-4 max-h-64 overflow-y-auto">
                  <pre className="text-xs text-[#52525B] whitespace-pre-wrap">{candidate.cvContent.slice(0, 2000)}{candidate.cvContent.length > 2000 ? '...' : ''}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Interviews */}
        {activeSection === 'interviews' && (
          <div className="p-6">
            {candidateInterviews.length === 0 ? (
              <div className="text-center py-10">
                <CalendarDays size={24} className="text-[#3F3F46] mx-auto mb-3" />
                <p className="text-sm text-[#52525B]">Aucun entretien planifié</p>
              </div>
            ) : (
              <div className="space-y-2">
                {candidateInterviews.map(interview => (
                  <div key={interview.id} className="glass-card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.1)] flex items-center justify-center flex-shrink-0">
                      <CalendarDays size={16} className="text-[#D4A853]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#FAFAFA]">{interview.title}</p>
                      <p className="text-xs text-[#52525B]">{interview.type} · {interview.interviewer || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#A1A1AA]">{new Date(interview.scheduledAt).toLocaleDateString('fr-FR')}</p>
                      <p className="text-xs text-[#3F3F46]">{interview.duration} min</p>
                    </div>
                    {interview.rating && (
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-[#D4A853]" />
                        <span className="text-sm text-[#FAFAFA]">{interview.rating}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Onboarding */}
        {activeSection === 'docs' && (
          <div className="p-6">
            {onboardingSteps.length === 0 ? (
              <div className="text-center py-10">
                <ClipboardCheck size={24} className="text-[#3F3F46] mx-auto mb-3" />
                <p className="text-sm text-[#52525B]">Aucune étape d'onboarding</p>
              </div>
            ) : (
              <div className="space-y-2">
                {onboardingSteps.map(step => (
                  <div key={step.id} className="glass-card p-4 flex items-center gap-3">
                    {step.isCompleted ? (
                      <CheckCircle size={18} className="text-[#22C55E] flex-shrink-0" />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-[#3F3F46] flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm ${step.isCompleted ? 'text-[#52525B] line-through' : 'text-[#FAFAFA]'}`}>{step.title}</p>
                      {step.description && <p className="text-xs text-[#3F3F46]">{step.description}</p>}
                    </div>
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#18181B] text-[#A1A1AA] capitalize">{step.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════ COMPARISON MODAL ═════════════════
function ComparisonModal({ ids, onClose }: { ids: number[]; onClose: () => void }) {
  const { compareCandidates } = useRH();
  const { data: comparison, isLoading } = compareCandidates(ids);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="glass-card w-full max-w-5xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 p-6 border-b border-white/[0.04] flex items-center justify-between"
          style={{ background: 'rgba(13,13,15,0.98)' }}>
          <h2 className="text-lg font-bold text-[#FAFAFA] flex items-center gap-2">
            <Eye size={18} className="text-[#D4A853]" /> Comparaison de candidats
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#3F3F46] hover:text-[#FAFAFA]"><X size={18} /></button>
        </div>

        {isLoading ? (
          <div className="p-10 text-center"><Loader2 size={24} className="animate-spin text-[#D4A853] mx-auto" /></div>
        ) : !comparison || comparison.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#52525B]">Aucune donnée</div>
        ) : (
          <div className="p-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left text-xs font-medium text-[#3F3F46] uppercase tracking-wider py-3 pr-4">Critère</th>
                  {comparison.map(c => (
                    <th key={c.id} className="text-left py-3 px-4 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.12)] flex items-center justify-center">
                          <span className="text-xs font-bold text-[#D4A853]">{c.firstName?.[0]}{c.lastName?.[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#FAFAFA]">{c.firstName} {c.lastName}</p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {[
                  { label: 'Score', key: 'score', render: (v: number) => (
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-[#D4A853]" />
                      <span className="text-sm font-semibold text-[#FAFAFA]">{v || 0}/100</span>
                    </div>
                  )},
                  { label: 'Expérience', key: 'experienceYears', render: (v: number) => <span className="text-sm text-[#FAFAFA]">{v || 0} ans</span> },
                  { label: 'Poste actuel', key: 'currentPosition', render: (v: string) => <span className="text-sm text-[#A1A1AA]">{v || '—'}</span> },
                  { label: 'Formation', key: 'education', render: (v: string) => <span className="text-sm text-[#A1A1AA]">{v || '—'}</span> },
                  { label: 'Compétences', key: 'skills', render: (v: string[]) => (
                    <div className="flex flex-wrap gap-1">
                      {(v || []).slice(0, 5).map((s: string) => (
                        <span key={s} className="px-1.5 py-0.5 text-[10px] rounded-full bg-[rgba(212,168,83,0.08)] text-[#D4A853]">{s}</span>
                      ))}
                    </div>
                  )},
                  { label: 'Entretiens', key: 'interviewCount', render: (v: number) => <span className="text-sm text-[#FAFAFA]">{v || 0}</span> },
                  { label: 'Note moyenne', key: 'avgInterviewRating', render: (v: number) => (
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-[#D4A853]" />
                      <span className="text-sm text-[#FAFAFA]">{v ? v.toFixed(1) : '—'}</span>
                    </div>
                  )},
                  { label: 'Source', key: 'source', render: (v: string) => <span className="text-sm text-[#A1A1AA] capitalize">{(v || '').replace('_', ' ')}</span> },
                ].map(row => (
                  <tr key={row.label}>
                    <td className="text-xs font-medium text-[#52525B] py-3 pr-4">{row.label}</td>
                    {comparison.map(c => (
                      <td key={c.id} className="py-3 px-4">{row.render(c[row.key])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════ JOBS ═════════════════
function JobsTab() {
  const { listJobOffers, createJobOffer, deleteJobOffer, updateJobOffer } = useRH();
  const { data: jobs = [], isLoading } = listJobOffers();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    (j.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: 'Brouillon', color: '#52525B' },
    published: { label: 'Publiée', color: '#22C55E' },
    archived: { label: 'Archivée', color: '#EF4444' },
    filled: { label: 'Pourvue', color: '#3B82F6' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3F3F46]" />
          <input type="text" placeholder="Rechercher une offre..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl pl-9 pr-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
        </div>
        <button onClick={() => setShowAdd(true)}
          className="btn-gold text-sm px-4 py-2 rounded-xl flex items-center gap-2">
          <span className="relative z-10 flex items-center gap-2"><Plus size={14} /> Nouvelle offre</span>
        </button>
      </div>

      {showAdd && <JobForm onClose={() => setShowAdd(false)} onSubmit={(data) => {
        createJobOffer.mutate(data, { onSuccess: () => setShowAdd(false) });
      }} isSubmitting={createJobOffer.isPending} />}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase size={32} className="text-[#3F3F46] mx-auto mb-3" />
          <p className="text-sm text-[#52525B]">Aucune offre d'emploi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => {
            const st = statusLabels[job.status || 'draft'] || statusLabels.draft;
            return (
              <div key={job.id} className="glass-card p-5 group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-[#FAFAFA]">{job.title}</h3>
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full" style={{ background: `${st.color}15`, color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#52525B] mb-2">{job.department || '—'} · {job.location || '—'} · {job.contractType?.toUpperCase()}</p>
                    {job.description && (
                      <p className="text-xs text-[#3F3F46] line-clamp-2 mb-3">{job.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-[#3F3F46]">
                      {(job.salaryMin || job.salaryMax) && (
                        <span>{job.salaryMin || '—'} — {job.salaryMax || '—'} €</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    {job.status === 'draft' && (
                      <button onClick={() => updateJobOffer.mutate({ id: job.id, status: 'published' })}
                        className="px-3 py-1 text-xs rounded-lg bg-[rgba(34,197,94,0.08)] text-[#22C55E] hover:bg-[rgba(34,197,94,0.12)] transition-all">
                        Publier
                      </button>
                    )}
                    <button onClick={() => deleteJobOffer.mutate(job.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#3F3F46] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.06)] transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function JobForm({ onClose, onSubmit, isSubmitting }: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState({
    title: '', department: '', location: '', contractType: 'cdi' as const,
    description: '', requirements: '', salaryMin: '', salaryMax: '',
  });

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#FAFAFA]">Nouvelle offre d'emploi</h3>
        <button onClick={onClose} className="text-[#3F3F46] hover:text-[#FAFAFA]"><X size={16} /></button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-[#52525B] mb-1.5 block">Titre du poste *</label>
          <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" placeholder="Ex: Développeur Full Stack" />
        </div>
        <div>
          <label className="text-xs text-[#52525B] mb-1.5 block">Département</label>
          <input type="text" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" placeholder="Ex: Tech" />
        </div>
        <div>
          <label className="text-xs text-[#52525B] mb-1.5 block">Localisation</label>
          <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" placeholder="Ex: Paris" />
        </div>
        <div>
          <label className="text-xs text-[#52525B] mb-1.5 block">Type de contrat</label>
          <select value={form.contractType} onChange={e => setForm(p => ({ ...p, contractType: e.target.value as any }))}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30 transition-all">
            <option value="cdi">CDI</option>
            <option value="cdd">CDD</option>
            <option value="stage">Stage</option>
            <option value="alternance">Alternance</option>
            <option value="freelance">Freelance</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-[#52525B] mb-1.5 block">Salaire min (€)</label>
          <input type="number" value={form.salaryMin} onChange={e => setForm(p => ({ ...p, salaryMin: e.target.value }))}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" placeholder="45000" />
        </div>
        <div>
          <label className="text-xs text-[#52525B] mb-1.5 block">Salaire max (€)</label>
          <input type="number" value={form.salaryMax} onChange={e => setForm(p => ({ ...p, salaryMax: e.target.value }))}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" placeholder="65000" />
        </div>
      </div>
      <div className="mb-4">
        <label className="text-xs text-[#52525B] mb-1.5 block">Description</label>
        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
          className="w-full bg-[#18181B] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 resize-none transition-all" placeholder="Description du poste..." />
      </div>
      <div className="mb-4">
        <label className="text-xs text-[#52525B] mb-1.5 block">Pré-requis</label>
        <textarea value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} rows={2}
          className="w-full bg-[#18181B] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 resize-none transition-all" placeholder="Compétences requises..." />
      </div>
      <div className="flex gap-3">
        <button onClick={() => onSubmit({ ...form, salaryMin: form.salaryMin ? parseInt(form.salaryMin) : undefined, salaryMax: form.salaryMax ? parseInt(form.salaryMax) : undefined })}
          disabled={!form.title || isSubmitting}
          className="btn-gold text-sm px-6 py-2 rounded-xl disabled:opacity-30">
          <span className="relative z-10 flex items-center gap-2">
            {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Créer l'offre
          </span>
        </button>
        <button onClick={onClose} className="text-sm text-[#3F3F46] hover:text-[#A1A1AA] transition-colors">Annuler</button>
      </div>
    </div>
  );
}

// ═════════════════ INTERVIEWS ═════════════════
function InterviewsTab() {
  const { listInterviews, listCandidates, createInterview, updateInterview, deleteInterview } = useRH();
  const { data: interviews = [], isLoading } = listInterviews();
  const { data: candidatesList = [] } = listCandidates();
  const [showAdd, setShowAdd] = useState(false);

  const upcoming = interviews.filter(i => i.status === 'scheduled').sort((a, b) =>
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
  const past = interviews.filter(i => i.status !== 'scheduled').sort((a, b) =>
    new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#FAFAFA]">Planning des entretiens</h2>
        <button onClick={() => setShowAdd(true)}
          className="btn-gold text-sm px-4 py-2 rounded-xl flex items-center gap-2">
          <span className="relative z-10 flex items-center gap-2"><Plus size={14} /> Planifier</span>
        </button>
      </div>

      {showAdd && (
        <InterviewForm
          candidates={candidatesList}
          onClose={() => setShowAdd(false)}
          onSubmit={(data) => createInterview.mutate(data, { onSuccess: () => setShowAdd(false) })}
          isSubmitting={createInterview.isPending}
        />
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20" />)}
        </div>
      ) : (
        <>
          {/* Upcoming */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#3F3F46] mb-3">À venir</h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-[#52525B] py-4">Aucun entretien planifié</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(interview => {
                  const candidate = candidatesList.find(c => c.id === interview.candidateId);
                  return (
                    <div key={interview.id} className="glass-card p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.12)] flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#D4A853]">{new Date(interview.scheduledAt).getDate()}</span>
                        <span className="text-[8px] text-[#D4A853]/60 uppercase">{new Date(interview.scheduledAt).toLocaleString('fr-FR', { month: 'short' })}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#FAFAFA]">{interview.title}</p>
                        <p className="text-xs text-[#52525B]">
                          {candidate ? `${candidate.firstName} ${candidate.lastName}` : '—'} · {interview.type} · {interview.duration} min
                        </p>
                      </div>
                      <div className="text-right mr-2">
                        <p className="text-xs text-[#A1A1AA]">{interview.interviewer || '—'}</p>
                        <p className="text-xs text-[#3F3F46]">{interview.location || '—'}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => updateInterview.mutate({ id: interview.id, status: 'completed' })}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#3F3F46] hover:text-[#22C55E] hover:bg-[rgba(34,197,94,0.06)] transition-all" title="Marquer comme terminé">
                          <Check size={14} />
                        </button>
                        <button onClick={() => deleteInterview.mutate(interview.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#3F3F46] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.06)] transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#3F3F46] mb-3">Passés</h3>
              <div className="space-y-2">
                {past.map(interview => {
                  const candidate = candidatesList.find(c => c.id === interview.candidateId);
                  return (
                    <div key={interview.id} className="glass-card p-4 flex items-center gap-4 opacity-60">
                      <div className="w-12 h-12 rounded-xl bg-[#18181B] flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#52525B]">{new Date(interview.scheduledAt).getDate()}</span>
                        <span className="text-[8px] text-[#3F3F46] uppercase">{new Date(interview.scheduledAt).toLocaleString('fr-FR', { month: 'short' })}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#FAFAFA]">{interview.title}</p>
                        <p className="text-xs text-[#52525B]">
                          {candidate ? `${candidate.firstName} ${candidate.lastName}` : '—'} · {interview.status}
                        </p>
                      </div>
                      {interview.rating && (
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-[#D4A853]" />
                          <span className="text-sm text-[#FAFAFA]">{interview.rating}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function InterviewForm({ candidates, onClose, onSubmit, isSubmitting }: {
  candidates: any[];
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState({
    candidateId: 0,
    title: '',
    type: 'phone' as const,
    scheduledAt: '',
    duration: 60,
    interviewer: '',
    location: '',
    notes: '',
  });

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#FAFAFA]">Planifier un entretien</h3>
        <button onClick={onClose} className="text-[#3F3F46] hover:text-[#FAFAFA]"><X size={16} /></button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-[#52525B] mb-1.5 block">Candidat *</label>
          <select value={form.candidateId} onChange={e => setForm(p => ({ ...p, candidateId: parseInt(e.target.value) }))}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30 transition-all">
            <option value={0}>Sélectionner...</option>
            {candidates.map(c => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#52525B] mb-1.5 block">Titre *</label>
          <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" placeholder="Ex: Entretien technique" />
        </div>
        <div>
          <label className="text-xs text-[#52525B] mb-1.5 block">Type</label>
          <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30 transition-all">
            <option value="phone">Téléphonique</option>
            <option value="video">Vidéo</option>
            <option value="onsite">Sur site</option>
            <option value="technical">Technique</option>
            <option value="final">Final</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-[#52525B] mb-1.5 block">Date & Heure *</label>
          <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30 transition-all [color-scheme:dark]" />
        </div>
        <div>
          <label className="text-xs text-[#52525B] mb-1.5 block">Durée (min)</label>
          <input type="number" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: parseInt(e.target.value) }))}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
        </div>
        <div>
          <label className="text-xs text-[#52525B] mb-1.5 block">Intervieweur</label>
          <input type="text" value={form.interviewer} onChange={e => setForm(p => ({ ...p, interviewer: e.target.value }))}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" placeholder="Ex: Jean Dupont" />
        </div>
      </div>
      <div className="mb-4">
        <label className="text-xs text-[#52525B] mb-1.5 block">Lieu / Lien</label>
        <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
          className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" placeholder="Ex: Salle A1 ou lien Zoom" />
      </div>
      <div className="flex gap-3">
        <button onClick={() => onSubmit(form)}
          disabled={!form.candidateId || !form.title || !form.scheduledAt || isSubmitting}
          className="btn-gold text-sm px-6 py-2 rounded-xl disabled:opacity-30">
          <span className="relative z-10 flex items-center gap-2">
            {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Planifier
          </span>
        </button>
        <button onClick={onClose} className="text-sm text-[#3F3F46] hover:text-[#A1A1AA] transition-colors">Annuler</button>
      </div>
    </div>
  );
}

// ═════════════════ ONBOARDING ═════════════════
function OnboardingTab() {
  const { listCandidates, listOnboardingSteps, createOnboardingStep, toggleOnboardingStep } = useRH();
  const { data: candidatesList = [] } = listCandidates();
  const hiredCandidates = candidatesList.filter(c => c.status === 'hired' || c.status === 'onboarding');
  const [selectedCandidate, setSelectedCandidate] = useState<number>(0);
  const [showAdd, setShowAdd] = useState(false);

  const { data: steps = [] } = listOnboardingSteps(selectedCandidate);

  const completedCount = steps.filter(s => s.isCompleted).length;
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <select value={selectedCandidate} onChange={e => setSelectedCandidate(parseInt(e.target.value))}
          className="h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30 transition-all">
          <option value={0}>Sélectionner un candidat...</option>
          {hiredCandidates.map(c => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.currentPosition || '—'}</option>
          ))}
        </select>
        {selectedCandidate > 0 && (
          <button onClick={() => setShowAdd(true)}
            className="btn-gold text-sm px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="relative z-10 flex items-center gap-2"><Plus size={14} /> Ajouter une étape</span>
          </button>
        )}
      </div>

      {selectedCandidate === 0 ? (
        <div className="text-center py-16">
          <ClipboardCheck size={32} className="text-[#3F3F46] mx-auto mb-3" />
          <p className="text-sm text-[#52525B]">Sélectionnez un candidat pour voir son onboarding</p>
        </div>
      ) : (
        <>
          {/* Progress */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#FAFAFA]">Progression</h3>
              <span className="text-sm font-semibold text-[#D4A853]">{progress}%</span>
            </div>
            <div className="h-3 bg-[#18181B] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#D4A853] to-[#22C55E] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-[#52525B] mt-2">{completedCount} sur {steps.length} étapes complétées</p>
          </div>

          {showAdd && (
            <OnboardingStepForm
              candidateId={selectedCandidate}
              onClose={() => setShowAdd(false)}
              onSubmit={(data) => createOnboardingStep.mutate(data, { onSuccess: () => setShowAdd(false) })}
              isSubmitting={createOnboardingStep.isPending}
            />
          )}

          {/* Steps */}
          {steps.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-[#52525B]">Aucune étape d'onboarding</p>
            </div>
          ) : (
            <div className="space-y-2">
              {steps.map(step => (
                <div key={step.id}
                  className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:border-[#D4A853]/20 transition-all"
                  onClick={() => toggleOnboardingStep.mutate(step.id)}>
                  {step.isCompleted ? (
                    <CheckCircle size={20} className="text-[#22C55E] flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-[#3F3F46] flex-shrink-0 hover:border-[#D4A853] transition-all" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${step.isCompleted ? 'text-[#52525B] line-through' : 'text-[#FAFAFA]'}`}>{step.title}</p>
                    {step.description && <p className="text-xs text-[#3F3F46]">{step.description}</p>}
                  </div>
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#18181B] text-[#A1A1AA] capitalize">{step.category}</span>
                  {step.assignedTo && <span className="text-xs text-[#3F3F46]">{step.assignedTo}</span>}
                  {step.dueDate && (
                    <span className={`text-xs ${new Date(step.dueDate) < new Date() && !step.isCompleted ? 'text-[#EF4444]' : 'text-[#3F3F46]'}`}>
                      {new Date(step.dueDate).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OnboardingStepForm({ candidateId, onClose, onSubmit, isSubmitting }: {
  candidateId: number;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState({
    candidateId,
    title: '',
    description: '',
    category: 'admin' as const,
    dueDate: '',
    assignedTo: '',
    order: 0,
  });

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#FAFAFA]">Nouvelle étape</h3>
        <button onClick={onClose} className="text-[#3F3F46] hover:text-[#FAFAFA]"><X size={16} /></button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div className="sm:col-span-2">
          <label className="text-xs text-[#52525B] mb-1.5 block">Titre *</label>
          <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" placeholder="Ex: Configuration du poste de travail" />
        </div>
        <div>
          <label className="text-xs text-[#52525B] mb-1.5 block">Catégorie</label>
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as any }))}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30 transition-all">
            <option value="admin">Administratif</option>
            <option value="technique">Technique</option>
            <option value="formation">Formation</option>
            <option value="integration">Intégration</option>
            <option value="evaluation">Évaluation</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-[#52525B] mb-1.5 block">Date d'échéance</label>
          <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30 transition-all [color-scheme:dark]" />
        </div>
        <div>
          <label className="text-xs text-[#52525B] mb-1.5 block">Assigné à</label>
          <input type="text" value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" placeholder="Ex: RH / Manager" />
        </div>
        <div>
          <label className="text-xs text-[#52525B] mb-1.5 block">Ordre</label>
          <input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) }))}
            className="w-full h-10 bg-[#18181B] border border-white/[0.05] rounded-xl px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
        </div>
      </div>
      <div className="mb-4">
        <label className="text-xs text-[#52525B] mb-1.5 block">Description</label>
        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
          className="w-full bg-[#18181B] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 resize-none transition-all" />
      </div>
      <div className="flex gap-3">
        <button onClick={() => onSubmit(form)}
          disabled={!form.title || isSubmitting}
          className="btn-gold text-sm px-6 py-2 rounded-xl disabled:opacity-30">
          <span className="relative z-10 flex items-center gap-2">
            {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Ajouter
          </span>
        </button>
        <button onClick={onClose} className="text-sm text-[#3F3F46] hover:text-[#A1A1AA] transition-colors">Annuler</button>
      </div>
    </div>
  );
}
