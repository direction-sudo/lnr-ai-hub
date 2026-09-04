import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, Globe, FileText, BarChart3, TrendingUp, ChevronLeft,
  Loader2, CheckCircle, AlertTriangle, Zap, Copy, Download,
  Target, MapPin, Users, ArrowUpRight, Layers, Sparkles
} from 'lucide-react';
import { trpc } from '@/providers/trpc';

type Tab = 'generateur' | 'audit' | 'positionnement' | 'batch';

const TABS: { id: Tab; label: string; icon: typeof Search }[] = [
  { id: 'generateur', label: 'Générateur de pages', icon: FileText },
  { id: 'audit', label: 'Audit de site', icon: Search },
  { id: 'positionnement', label: 'Positionnement', icon: TrendingUp },
  { id: 'batch', label: 'Génération batch', icon: Layers },
];

export default function LouPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('generateur');

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
            <Search size={20} className="text-[#D4A853]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#FAFAFA]">Lou</h1>
            <p className="text-xs text-[#52525B]">Agent SEO & Génération de contenu</p>
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
        {activeTab === 'generateur' && <GenerateurTab />}
        {activeTab === 'audit' && <AuditTab />}
        {activeTab === 'positionnement' && <PositionnementTab />}
        {activeTab === 'batch' && <BatchTab />}
      </div>
    </div>
  );
}

function GenerateurTab() {
  const [motCle, setMotCle] = useState('');
  const [cible, setCible] = useState<'B2C' | 'B2B' | 'mixte'>('B2C');
  const [localisation, setLocalisation] = useState('Tunisie');
  const [copied, setCopied] = useState(false);

  const generer = trpc.lou.genererPage.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (motCle.length < 3) return;
    generer.mutate({ motCle, cible, localisation });
  };

  const copyHtml = () => {
    if (generer.data?.html) {
      navigator.clipboard.writeText(generer.data.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeBtn = 'bg-[rgba(212,168,83,0.08)] text-[#D4A853] border border-[rgba(212,168,83,0.2)]';
  const inactiveBtn = 'bg-[#0d0d0f] text-[#52525B] border border-white/[0.06] hover:text-[#A1A1AA]';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] mb-1 flex items-center gap-2">
          <Sparkles size={18} className="text-[#D4A853]" /> Générer une page SEO
        </h2>
        <p className="text-sm text-[#52525B] mb-6">Lou crée une page HTML optimisée pour un mot-clé donné.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#A1A1AA] mb-1.5 block">Mot-clé principal *</label>
            <div className="relative">
              <Target size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" />
              <input required minLength={3} type="text" value={motCle}
                onChange={e => setMotCle(e.target.value)}
                placeholder="Ex: mutuelle santé senior"
                className="w-full h-11 bg-[#0d0d0f] border border-white/[0.06] rounded-xl pl-10 pr-4 text-sm text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#A1A1AA] mb-1.5 block">Cible</label>
              <div className="flex gap-2">
                {(['B2C', 'B2B', 'mixte'] as const).map(opt => (
                  <button key={opt} type="button" onClick={() => setCible(opt)}
                    className={"flex-1 h-10 rounded-xl text-xs font-medium transition-all " + (cible === opt ? activeBtn : inactiveBtn)}>
                    <Users size={13} className="inline mr-1" />{opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#A1A1AA] mb-1.5 block">Localisation</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" />
                <input type="text" value={localisation}
                  onChange={e => setLocalisation(e.target.value)}
                  placeholder="Ex: Tunisie"
                  className="w-full h-10 bg-[#0d0d0f] border border-white/[0.06] rounded-xl pl-10 pr-4 text-sm text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={generer.isPending || motCle.length < 3}
            className="btn-gold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50">
            {generer.isPending ? <><Loader2 size={15} className="animate-spin" /> Génération...</>
              : <><Zap size={15} /> Générer la page</>}
          </button>
        </form>
      </div>

      {generer.data && (
        <div className="glass-card p-6 border-glow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-[#22C55E]" />
              <div>
                <h3 className="text-sm font-bold text-[#FAFAFA]">Page générée — {generer.data.motCle}</h3>
                <p className="text-xs text-[#52525B]">ID: {generer.data.id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={copyHtml}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.1)] text-xs text-[#D4A853] hover:bg-[rgba(212,168,83,0.1)] transition-all">
                {copied ? <><CheckCircle size={12} /> Copié</> : <><Copy size={12} /> Copier HTML</>}
              </button>
              <button onClick={() => {
                const blob = new Blob([generer.data.html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = generer.data.motCle.replace(/\s+/g, '-') + '.html';
                a.click();
              }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.1)] text-xs text-[#D4A853] hover:bg-[rgba(212,168,83,0.1)] transition-all">
                <Download size={12} /> Télécharger
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-[#0d0d0f] rounded-xl p-3 border border-white/[0.04]">
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Score SEO</p>
              <p className="text-xl font-bold text-[#D4A853]">{generer.data.scoreSeo}/100</p>
            </div>
            <div className="bg-[#0d0d0f] rounded-xl p-3 border border-white/[0.04]">
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Mots</p>
              <p className="text-xl font-bold text-[#FAFAFA]">{generer.data.mots}</p>
            </div>
            <div className="bg-[#0d0d0f] rounded-xl p-3 border border-white/[0.04]">
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Densité</p>
              <p className="text-xl font-bold text-[#FAFAFA]">{generer.data.densiteMotCle}%</p>
            </div>
          </div>

          <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04]">
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-2">Méta-tags</p>
            <div className="space-y-1.5 text-xs">
              <p className="text-[#A1A1AA]"><span className="text-[#52525B]">Title:</span> {generer.data.meta.title}</p>
              <p className="text-[#A1A1AA]"><span className="text-[#52525B]">Description:</span> {generer.data.meta.description}</p>
              <p className="text-[#A1A1AA]"><span className="text-[#52525B]">H1:</span> {generer.data.meta.h1}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-2">Aperçu HTML</p>
            <pre className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04] text-[11px] text-[#A1A1AA] overflow-x-auto max-h-64 overflow-y-auto font-mono leading-relaxed">
              {generer.data.html}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditTab() {
  const [url, setUrl] = useState('');
  const audit = trpc.lou.auditerSite.useQuery({ url }, { enabled: false });

  const handleAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    audit.refetch();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] mb-1 flex items-center gap-2">
          <Search size={18} className="text-[#D4A853]" /> Auditer un site
        </h2>
        <p className="text-sm text-[#52525B] mb-6">Analysez les performances SEO et les erreurs d'un site web.</p>

        <form onSubmit={handleAudit} className="flex gap-3">
          <div className="relative flex-1">
            <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" />
            <input required type="url" value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://exemple.com"
              className="w-full h-11 bg-[#0d0d0f] border border-white/[0.06] rounded-xl pl-10 pr-4 text-sm text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
          </div>
          <button type="submit" disabled={audit.isFetching}
            className="btn-gold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50">
            {audit.isFetching ? <><Loader2 size={15} className="animate-spin" /> Analyse...</>
              : <><Search size={15} /> Lancer l'audit</>}
          </button>
        </form>
      </div>

      {audit.data && (
        <div className="glass-card p-6 border-glow">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4A853]/20 to-[#D4A853]/5 border border-[#D4A853]/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-[#D4A853]">{audit.data.scoreGlobal}</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#FAFAFA]">{audit.data.url}</h3>
              <p className="text-xs text-[#52525B]">Score global SEO</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Erreurs détectées ({audit.data.erreurs.length})</p>
            {audit.data.erreurs.map((err, i) => (
              <div key={i} className="flex items-start gap-3 bg-[#0d0d0f] rounded-xl p-3 border border-white/[0.04]">
                <AlertTriangle size={16} className={"flex-shrink-0 mt-0.5 " + (
                  err.gravite === 'haute' ? 'text-[#e74c3c]' :
                  err.gravite === 'moyenne' ? 'text-[#f39c12]' : 'text-[#3498db]'
                )} />
                <div>
                  <p className="text-xs font-medium text-[#FAFAFA] capitalize">{err.type}</p>
                  <p className="text-xs text-[#71717A]">{err.message}</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-2">Recommandations</p>
            <div className="space-y-2">
              {audit.data.recommandations.map((rec, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                  <ArrowUpRight size={12} className="text-[#D4A853]" /> {rec}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PositionnementTab() {
  const [motCle, setMotCle] = useState('');
  const position = trpc.lou.positionnement.useQuery({ motCle }, { enabled: false });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motCle) return;
    position.refetch();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] mb-1 flex items-center gap-2">
          <TrendingUp size={18} className="text-[#D4A853]" /> Suivi de positionnement
        </h2>
        <p className="text-sm text-[#52525B] mb-6">Vérifiez votre position Google pour un mot-clé donné.</p>

        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" />
            <input required type="text" value={motCle}
              onChange={e => setMotCle(e.target.value)}
              placeholder="Ex: mutuelle santé senior"
              className="w-full h-11 bg-[#0d0d0f] border border-white/[0.06] rounded-xl pl-10 pr-4 text-sm text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all" />
          </div>
          <button type="submit" disabled={position.isFetching}
            className="btn-gold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50">
            {position.isFetching ? <><Loader2 size={15} className="animate-spin" /> Recherche...</>
              : <><TrendingUp size={15} /> Vérifier</>}
          </button>
        </form>
      </div>

      {position.data && (
        <div className="glass-card p-6 border-glow">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04] text-center">
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Position</p>
              <p className="text-3xl font-bold text-[#D4A853]">#{position.data.position}</p>
            </div>
            <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04] text-center">
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Évolution</p>
              <p className="text-3xl font-bold text-[#22C55E]">{position.data.evolution}</p>
            </div>
            <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04] text-center">
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Volume/mois</p>
              <p className="text-3xl font-bold text-[#FAFAFA]">{position.data.volumeRecherches}</p>
            </div>
            <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04] text-center">
              <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Concurrence</p>
              <p className="text-3xl font-bold text-[#FAFAFA] capitalize">{position.data.concurrence}</p>
            </div>
          </div>

          <div className="bg-[#0d0d0f] rounded-xl p-4 border border-white/[0.04]">
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-2">URL classée</p>
            <a href={position.data.urlClasse} target="_blank" rel="noopener noreferrer"
              className="text-sm text-[#D4A853] hover:underline flex items-center gap-1">
              {position.data.urlClasse} <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function BatchTab() {
  const [motsCles, setMotsCles] = useState('');
  const batch = trpc.lou.batchGenerate.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const liste = motsCles.split('\n').map(s => s.trim()).filter(Boolean);
    if (liste.length === 0) return;
    batch.mutate({ motsCles: liste });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-[#FAFAFA] mb-1 flex items-center gap-2">
          <Layers size={18} className="text-[#D4A853]" /> Génération batch
        </h2>
        <p className="text-sm text-[#52525B] mb-6">Générez jusqu'à 10 pages SEO en une seule fois.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#A1A1AA] mb-1.5 block">
              Mots-clés (un par ligne, max 10)
            </label>
            <textarea value={motsCles}
              onChange={e => setMotsCles(e.target.value)}
              placeholder="mutuelle santé senior\nassurance vie\nprêt immobilier\n..."
              rows={6}
              className="w-full bg-[#0d0d0f] border border-white/[0.06] rounded-xl p-4 text-sm text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#D4A853]/30 transition-all resize-none font-mono" />
            <p className="text-[10px] text-[#3F3F46] mt-1">
              {motsCles.split('\n').filter(Boolean).length}/10 mots-clés
            </p>
          </div>

          <button type="submit" disabled={batch.isPending || motsCles.split('\n').filter(Boolean).length === 0}
            className="btn-gold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50">
            {batch.isPending ? <><Loader2 size={15} className="animate-spin" /> Génération...</>
              : <><Zap size={15} /> Générer {motsCles.split('\n').filter(Boolean).length} page(s)</>}
          </button>
        </form>
      </div>

      {batch.data && (
        <div className="glass-card p-6 border-glow">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle size={20} className="text-[#22C55E]" />
            <div>
              <h3 className="text-sm font-bold text-[#FAFAFA]">{batch.data.message}</h3>
              <p className="text-xs text-[#52525B]">{batch.data.total} pages générées</p>
            </div>
          </div>

          <div className="space-y-2">
            {batch.data.pages.map((page, i) => (
              <div key={i} className="flex items-center justify-between bg-[#0d0d0f] rounded-xl p-3 border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#52525B] w-6">{i + 1}</span>
                  <span className="text-sm text-[#FAFAFA]">{page.motCle}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#D4A853] font-medium">{page.scoreSeo}/100</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.08)] text-[#22C55E] border border-[rgba(34,197,94,0.15)]">
                    {page.statut === 'en_attente_validation' ? 'En attente' : page.statut}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
