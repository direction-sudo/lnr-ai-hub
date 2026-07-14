import { useState } from 'react';
import { Link } from 'react-router';
import {
  ChevronLeft, Plus, Send, Calendar, Clock, Trash2, Edit3, Check, X,
  Sparkles, AlertCircle, Loader2, ChevronRight, Megaphone, BarChart3
} from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import type { Campaign, CampaignPost } from '@/hooks/useCampaigns';

// ─── Status badge ───
function StatusBadge({ status }: { status: Campaign['status'] }) {
  const styles: Record<string, string> = {
    draft: 'bg-[rgba(161,161,170,0.1)] text-[#A1A1AA] border-[rgba(161,161,170,0.2)]',
    generating: 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border-[rgba(245,158,11,0.2)]',
    review: 'bg-[rgba(59,130,246,0.1)] text-[#3B82F6] border-[rgba(59,130,246,0.2)]',
    publishing: 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border-[rgba(245,158,11,0.2)]',
    published: 'bg-[rgba(34,197,94,0.1)] text-[#22C55E] border-[rgba(34,197,94,0.2)]',
    scheduled: 'bg-[rgba(168,85,247,0.1)] text-[#A855F7] border-[rgba(168,85,247,0.2)]',
  };
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    generating: 'Génération...',
    review: 'En révision',
    publishing: 'Publication...',
    published: 'Publié',
    scheduled: 'Planifié',
  };
  return (
    <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
}

// ─── Platform icon ───
function PlatformIcon({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    linkedin: '#0A66C2',
    facebook: '#1877F2',
    instagram: '#E4405F',
  };
  const names: Record<string, string> = {
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    instagram: 'Instagram',
  };
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border"
      style={{
        background: `${colors[platform]}15`,
        borderColor: `${colors[platform]}30`,
        color: colors[platform],
      }}>
      {names[platform] || platform}
    </span>
  );
}

// ─── Post status icon ───
function PostStatusIcon({ status }: { status: CampaignPost['status'] }) {
  if (status === 'published') return <Check size={13} className="text-[#22C55E]" />;
  if (status === 'approved') return <Check size={13} className="text-[#3B82F6]" />;
  if (status === 'scheduled') return <Clock size={13} className="text-[#A855F7]" />;
  return <AlertCircle size={13} className="text-[#52525B]" />;
}

// ─── Create Campaign Modal ───
function CreateModal({ isOpen, onClose, onCreate }: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; topic: string; tone: Campaign['tone']; networks: Campaign['networks'] }) => void;
}) {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Campaign['tone']>('professional');
  const [networks, setNetworks] = useState<Campaign['networks']>(['linkedin']);

  if (!isOpen) return null;

  const toggleNetwork = (n: Campaign['networks'][0]) => {
    setNetworks(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  };

  const handleSubmit = () => {
    if (!name.trim() || !topic.trim() || networks.length === 0) return;
    onCreate({ name: name.trim(), topic: topic.trim(), tone, networks });
    setName('');
    setTopic('');
    setTone('professional');
    setNetworks(['linkedin']);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)] flex items-center justify-center">
              <Megaphone size={18} className="text-[#D4A853]" />
            </div>
            <h3 className="text-base font-bold text-[#FAFAFA]">Nouvelle campagne</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#3F3F46] hover:text-[#FAFAFA]">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#52525B] font-medium mb-1.5 block">Nom de la campagne</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Lancement produit IA Q3"
              className="w-full h-10 bg-[#18181B] border border-white/[0.06] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/40 transition-all" />
          </div>

          <div>
            <label className="text-xs text-[#52525B] font-medium mb-1.5 block">Sujet / Thème</label>
            <textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="Le lancement de notre nouvelle plateforme d'IA pour la gestion financière..."
              rows={3}
              className="w-full bg-[#18181B] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/40 transition-all resize-none" />
          </div>

          <div>
            <label className="text-xs text-[#52525B] font-medium mb-1.5 block">Ton de la campagne</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'professional' as const, label: 'Professionnel' },
                { value: 'casual' as const, label: 'Décontracté' },
                { value: 'inspirational' as const, label: 'Inspirant' },
                { value: 'humorous' as const, label: 'Humoristique' },
                { value: 'promotional' as const, label: 'Promotionnel' },
              ]).map(t => (
                <button key={t.value} onClick={() => setTone(t.value)}
                  className={`h-9 rounded-xl text-xs font-medium border transition-all ${
                    tone === t.value
                      ? 'bg-[rgba(212,168,83,0.1)] border-[rgba(212,168,83,0.3)] text-[#D4A853]'
                      : 'bg-transparent border-white/[0.06] text-[#52525B] hover:text-[#A1A1AA]'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#52525B] font-medium mb-1.5 block">Réseaux sociaux</label>
            <div className="flex flex-wrap gap-2">
              {([
                { id: 'linkedin' as const, label: 'LinkedIn', color: '#0A66C2' },
                { id: 'facebook' as const, label: 'Facebook', color: '#1877F2' },
                { id: 'instagram' as const, label: 'Instagram', color: '#E4405F' },
              ]).map(n => (
                <button key={n.id} onClick={() => toggleNetwork(n.id)}
                  className={`h-9 px-4 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 ${
                    networks.includes(n.id)
                      ? 'text-[#FAFAFA] border-[rgba(255,255,255,0.15)]'
                      : 'text-[#52525B] border-white/[0.06] hover:text-[#A1A1AA]'
                  }`}
                  style={networks.includes(n.id) ? { background: `${n.color}15`, borderColor: `${n.color}40` } : {}}>
                  <span className="w-2 h-2 rounded-full" style={{ background: n.color }} />
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={!name.trim() || !topic.trim() || networks.length === 0}
          className="w-full btn-gold h-11 rounded-xl text-sm font-semibold mt-6 disabled:opacity-40">
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Sparkles size={15} /> Créer et générer les posts
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Schedule Modal ───
function ScheduleModal({ isOpen, onClose, onSchedule }: {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: Date) => void;
}) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  if (!isOpen) return null;

  const handleSchedule = () => {
    if (!date || !time) return;
    const scheduledDate = new Date(`${date}T${time}`);
    if (scheduledDate <= new Date()) return;
    onSchedule(scheduledDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm glass-card p-6 animate-scale-in">
        <h3 className="text-base font-bold text-[#FAFAFA] mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-[#D4A853]" /> Planifier la publication
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[#52525B] font-medium mb-1.5 block">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full h-10 bg-[#18181B] border border-white/[0.06] rounded-xl px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/40 transition-all" />
          </div>
          <div>
            <label className="text-xs text-[#52525B] font-medium mb-1.5 block">Heure</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full h-10 bg-[#18181B] border border-white/[0.06] rounded-xl px-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#D4A853]/40 transition-all" />
          </div>
        </div>
        <button onClick={handleSchedule} disabled={!date || !time}
          className="w-full btn-gold h-10 rounded-xl text-sm font-semibold mt-4 disabled:opacity-40">
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Clock size={14} /> Planifier
          </span>
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════
export default function CampaignsPage() {
  const {
    campaigns, generating, publishing,
    createCampaign, generatePosts, updatePost,
    approvePost, rejectPost, publishCampaign, scheduleCampaign, deleteCampaign,
    isConnected,
  } = useCampaigns();

  const [createOpen, setCreateOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [activeCampId, setActiveCampId] = useState<string | null>(null);
  const [expandedCamp, setExpandedCamp] = useState<string | null>(null);
  const [pubResult, setPubResult] = useState<{ success: number; failed: number } | null>(null);

  const activeCampaign = activeCampId ? campaigns.find(c => c.id === activeCampId) ?? null : null;

  const handleCreate = (data: Parameters<typeof createCampaign>[0]) => {
    const id = createCampaign(data);
    setActiveCampId(id);
    // Auto-generate after creation
    setTimeout(() => generatePosts(id), 100);
  };

  const handlePublish = async (campId: string) => {
    const result = await publishCampaign(campId);
    setPubResult(result);
    setTimeout(() => setPubResult(null), 5000);
  };

  const approvedCount = (c: Campaign) => c.posts.filter(p => p.status === 'approved').length;
  const publishedCount = (c: Campaign) => c.posts.filter(p => p.status === 'published').length;

  return (
    <div className="p-6 lg:p-10 min-h-screen" style={{ background: 'rgba(10,10,11,0.92)' }}>
      <CreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      <ScheduleModal isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)}
        onSchedule={(date) => { if (activeCampId) scheduleCampaign(activeCampId, date); }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-[#52525B] hover:text-[#FAFAFA] transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>
              Campagnes
            </h1>
            <p className="text-sm text-[#52525B] mt-1">
              Générez et publiez du contenu sur vos réseaux sociaux en quelques clics
            </p>
          </div>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="btn-gold h-10 px-5 rounded-xl text-sm font-semibold">
          <span className="relative z-10 flex items-center gap-2">
            <Plus size={15} /> Nouvelle campagne
          </span>
        </button>
      </div>

      {/* Publish result */}
      {pubResult && (
        <div className={`p-4 rounded-xl mb-6 border ${pubResult.failed === 0
          ? 'bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.15)]'
          : 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.15)]'
          }`}>
          <p className={`text-sm font-medium ${pubResult.failed === 0 ? 'text-[#22C55E]' : 'text-[#F59E0B]'}`}>
            {pubResult.success} post(s) publié(s) avec succès
            {pubResult.failed > 0 && ` — ${pubResult.failed} échec(s) (vérifiez vos connexions)`}
          </p>
        </div>
      )}

      {/* Campaigns list */}
      {campaigns.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.15)] flex items-center justify-center mx-auto mb-4">
            <Megaphone size={28} className="text-[#D4A853]" />
          </div>
          <h3 className="text-lg font-bold text-[#FAFAFA] mb-2">Aucune campagne</h3>
          <p className="text-sm text-[#52525B] mb-6 max-w-md mx-auto">
            Créez votre première campagne pour générer automatiquement des posts pour LinkedIn, Facebook et Instagram.
          </p>
          <button onClick={() => setCreateOpen(true)} className="btn-gold h-10 px-6 rounded-xl text-sm font-semibold">
            <span className="relative z-10 flex items-center gap-2">
              <Plus size={15} /> Créer une campagne
            </span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map(camp => (
            <div key={camp.id} className="glass-card overflow-hidden">
              {/* Campaign header */}
              <div className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.15)] flex items-center justify-center flex-shrink-0">
                  <Megaphone size={16} className="text-[#D4A853]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-bold text-[#FAFAFA]">{camp.name}</h3>
                    <StatusBadge status={camp.status} />
                  </div>
                  <p className="text-xs text-[#52525B] truncate">{camp.topic}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {camp.networks.map(n => <PlatformIcon key={n} platform={n} />)}
                    <span className="text-[10px] text-[#3F3F46] mx-1">•</span>
                    <span className="text-[10px] text-[#3F3F46]">{camp.posts.length} posts</span>
                    {approvedCount(camp) > 0 && (
                      <>
                        <span className="text-[10px] text-[#3F3F46]">•</span>
                        <span className="text-[10px] text-[#3B82F6]">{approvedCount(camp)} approuvé(s)</span>
                      </>
                    )}
                    {publishedCount(camp) > 0 && (
                      <>
                        <span className="text-[10px] text-[#3F3F46]">•</span>
                        <span className="text-[10px] text-[#22C55E]">{publishedCount(camp)} publié(s)</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {camp.status === 'draft' && (
                    <button onClick={() => generatePosts(camp.id)}
                      disabled={generating}
                      className="h-9 px-4 rounded-xl text-xs font-medium text-[#D4A853] border border-[rgba(212,168,83,0.2)] hover:bg-[rgba(212,168,83,0.06)] transition-all disabled:opacity-40 flex items-center gap-2">
                      {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Générer
                    </button>
                  )}

                  {camp.status === 'review' && approvedCount(camp) > 0 && (
                    <>
                      <button onClick={() => { setActiveCampId(camp.id); setScheduleOpen(true); }}
                        className="h-9 px-3 rounded-xl text-xs font-medium text-[#A855F7] border border-[rgba(168,85,247,0.2)] hover:bg-[rgba(168,85,247,0.06)] transition-all flex items-center gap-1.5">
                        <Clock size={12} /> Planifier
                      </button>
                      <button onClick={() => handlePublish(camp.id)}
                        disabled={publishing}
                        className="h-9 px-4 rounded-xl text-xs font-medium text-[#0A0A0B] bg-[#D4A853] hover:bg-[#C49A4E] transition-all disabled:opacity-40 flex items-center gap-1.5">
                        {publishing ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        Publier
                      </button>
                    </>
                  )}

                  <button onClick={() => setExpandedCamp(expandedCamp === camp.id ? null : camp.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-[#52525B] hover:text-[#FAFAFA] hover:bg-white/[0.03] transition-all">
                    <ChevronRight size={16} className={`transition-transform ${expandedCamp === camp.id ? 'rotate-90' : ''}`} />
                  </button>

                  <button onClick={() => { if (confirm('Supprimer cette campagne ?')) deleteCampaign(camp.id); }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-[#3F3F46] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.06)] transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Posts detail (expanded) */}
              {expandedCamp === camp.id && camp.posts.length > 0 && (
                <div className="border-t border-white/[0.04] p-5">
                  <h4 className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-3">Posts générés</h4>
                  <div className="space-y-3">
                    {camp.posts.map(post => (
                      <div key={post.id} className={`p-4 rounded-xl border ${
                        post.status === 'published'
                          ? 'bg-[rgba(34,197,94,0.04)] border-[rgba(34,197,94,0.1)]'
                          : post.status === 'approved'
                          ? 'bg-[rgba(59,130,246,0.04)] border-[rgba(59,130,246,0.1)]'
                          : 'bg-[rgba(255,255,255,0.02)] border-white/[0.04]'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <PostStatusIcon status={post.status} />
                            <PlatformIcon platform={post.platform} />
                          </div>
                          {post.status !== 'published' && (
                            <div className="flex items-center gap-1">
                              {post.status !== 'approved' && (
                                <button onClick={() => approvePost(camp.id, post.id)}
                                  className="h-7 px-2.5 rounded-lg text-[10px] font-medium text-[#22C55E] border border-[rgba(34,197,94,0.2)] hover:bg-[rgba(34,197,94,0.06)] transition-all flex items-center gap-1">
                                  <Check size={10} /> Approuver
                                </button>
                              )}
                              {post.status === 'approved' && (
                                <button onClick={() => rejectPost(camp.id, post.id)}
                                  className="h-7 px-2.5 rounded-lg text-[10px] font-medium text-[#52525B] border border-white/[0.06] hover:text-[#FAFAFA] transition-all">
                                  Réviser
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <textarea
                          value={post.content}
                          onChange={e => updatePost(camp.id, post.id, e.target.value)}
                          rows={4}
                          disabled={post.status === 'published'}
                          className="w-full bg-transparent border-none text-xs text-[#A1A1AA] leading-relaxed resize-none focus:outline-none focus:text-[#FAFAFA] transition-all disabled:opacity-60 font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty posts state */}
              {expandedCamp === camp.id && camp.posts.length === 0 && (
                <div className="border-t border-white/[0.04] p-8 text-center">
                  <p className="text-sm text-[#52525B]">Aucun post généré. Cliquez sur "Générer" pour créer les posts.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
