import { useState } from 'react';
import { Link } from 'react-router';
import {
  Users, Instagram, MessageSquare, Calendar, FileText,
  Check, X, ChevronLeft, Plus, AlertCircle, Key,
  Send, Trash2, ExternalLink
} from 'lucide-react';
import { useSocial } from '@/hooks/useSocial';
import ConnectLinkedInModal from '@/components/ConnectLinkedInModal';
import ConnectFacebookModal from '@/components/ConnectFacebookModal';
import FacebookPageFinder from '@/components/FacebookPageFinder';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: typeof Users;
  color: string;
  agent: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Publiez des posts, analysez vos performances et gérez votre présence professionnelle.',
    icon: Users,
    color: '#0A66C2',
    agent: 'Nora',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Créez des stories, des reels et planifiez votre contenu visuel.',
    icon: Instagram,
    color: '#E4405F',
    agent: 'Nora',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Gérez votre page Facebook et publiez du contenu automatiquement.',
    icon: MessageSquare,
    color: '#1877F2',
    agent: 'Nora',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Planifiez les entretiens et synchronisez les événements RH.',
    icon: Calendar,
    color: '#4285F4',
    agent: 'Leo',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Recevez les notifications et alertes de vos agents directement dans Slack.',
    icon: MessageSquare,
    color: '#4A154B',
    agent: 'Les deux',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Exportez les rapports, les fiches de poste et les documentations.',
    icon: FileText,
    color: '#000000',
    agent: 'Leo',
  },
];

export default function IntegrationsPage() {
  const {
    connections,
    isConnected,
    disconnect,
    manualConnect,
    publishPost,
    isPublishing,
  } = useSocial();

  const [linkedinOpen, setLinkedinOpen] = useState(false);
  const [facebookOpen, setFacebookOpen] = useState(false);
  const [pageFinderOpen, setPageFinderOpen] = useState(false);
  const [publishModal, setPublishModal] = useState<{ platform: string; name: string } | null>(null);
  const [postContent, setPostContent] = useState('');
  const [publishSuccess, setPublishSuccess] = useState(false);

  const connected = connections.filter((i) => i.connected);
  const disconnected = INTEGRATIONS.filter(
    (i) => !connections.some((c) => c.platform === i.id && c.connected)
  );

  const handleConnectLinkedIn = (token: string) => {
    manualConnect('linkedin', token, 'LinkedIn');
  };

  const handleConnectFacebook = (token: string, pageId: string, pageName: string) => {
    manualConnect('facebook', token, pageName, pageId);
    // Instagram uses the same connection as Facebook
    manualConnect('instagram', token, pageName, pageId);
  };

  const handlePublish = async () => {
    if (!publishModal || !postContent.trim()) return;
    const success = await publishPost(publishModal.platform, postContent.trim());
    if (success) {
      setPublishSuccess(true);
      setPostContent('');
      setTimeout(() => {
        setPublishSuccess(false);
        setPublishModal(null);
      }, 2000);
    }
  };

  const openConnectModal = (id: string) => {
    if (id === 'linkedin') setLinkedinOpen(true);
    else if (id === 'facebook' || id === 'instagram') setFacebookOpen(true);
  };

  return (
    <div className="p-6 lg:p-10 min-h-screen" style={{ background: 'rgba(10,10,11,0.92)' }}>
      {/* Modals */}
      <ConnectLinkedInModal
        isOpen={linkedinOpen}
        onClose={() => setLinkedinOpen(false)}
        onConnect={handleConnectLinkedIn}
      />
      <ConnectFacebookModal
        isOpen={facebookOpen}
        onClose={() => setFacebookOpen(false)}
        onConnect={handleConnectFacebook}
      />
      <FacebookPageFinder
        isOpen={pageFinderOpen}
        onClose={() => setPageFinderOpen(false)}
        onSelectPage={handleConnectFacebook}
      />

      {/* Publish Modal */}
      {publishModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPublishModal(null)} />
          <div className="relative w-full max-w-lg glass-card p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#FAFAFA]">Publier sur {publishModal.name}</h3>
              <button onClick={() => setPublishModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#3F3F46] hover:text-[#FAFAFA]">
                <X size={16} />
              </button>
            </div>

            {publishSuccess ? (
              <div className="p-4 rounded-xl bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.15)] text-center">
                <Check size={24} className="text-[#22C55E] mx-auto mb-2" />
                <p className="text-sm text-[#22C55E] font-medium">Publié avec succès !</p>
              </div>
            ) : (
              <>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder={`Rédigez votre post pour ${publishModal.name}...`}
                  rows={6}
                  className="w-full bg-[#18181B] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/40 transition-all resize-none mb-4"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#3F3F46]">{postContent.length} caractères</span>
                  <button
                    onClick={handlePublish}
                    disabled={!postContent.trim() || isPublishing}
                    className="btn-gold px-6 h-10 rounded-xl text-sm font-semibold disabled:opacity-40"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isPublishing ? 'Publication...' : <><Send size={14} /> Publier</>}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/dashboard" className="text-[#52525B] hover:text-[#FAFAFA] transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>
            Intégrations
          </h1>
          <p className="text-sm text-[#52525B] mt-1">
            Connectez vos réseaux sociaux pour publier directement depuis LNR AI Hub
          </p>
        </div>
      </div>

      {/* Status bar */}
      <div className="glass-card p-4 mb-8 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.15)] flex items-center justify-center">
            <Check size={18} className="text-[#22C55E]" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#FAFAFA]">{connected.length}</p>
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Connectées</p>
          </div>
        </div>
        <div className="w-px h-8 bg-white/[0.06]" />
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.06] flex items-center justify-center">
            <X size={18} className="text-[#52525B]" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#FAFAFA]">{6 - connected.length}</p>
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Déconnectées</p>
          </div>
        </div>
      </div>

      {/* Connected accounts */}
      {connected.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider mb-4">
            Comptes connectés
          </h2>
          <div className="space-y-3">
            {connected.map((conn) => (
              <div
                key={conn.platform}
                className="glass-card p-4 flex items-center gap-4 border-[rgba(34,197,94,0.15)]"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${INTEGRATIONS.find((i) => i.id === conn.platform)?.color}15`,
                    border: `1px solid ${INTEGRATIONS.find((i) => i.id === conn.platform)?.color}30`,
                  }}
                >
                  {(() => {
                    const Icon = INTEGRATIONS.find((i) => i.id === conn.platform)?.icon ?? Users;
                    return (
                      <Icon
                        size={18}
                        style={{ color: INTEGRATIONS.find((i) => i.id === conn.platform)?.color }}
                      />
                    );
                  })()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#FAFAFA]">
                    {conn.pageName || INTEGRATIONS.find((i) => i.id === conn.platform)?.name}
                  </p>
                  <p className="text-xs text-[#22C55E]">
                    {conn.platform === 'instagram' ? 'via Facebook' : 'Connecté'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPublishModal({ platform: conn.platform, name: conn.pageName || conn.platform })}
                    className="h-9 px-4 rounded-xl text-xs font-medium text-[#D4A853] border border-[rgba(212,168,83,0.2)] hover:bg-[rgba(212,168,83,0.06)] transition-all flex items-center gap-2"
                  >
                    <Send size={12} /> Publier
                  </button>
                  <button
                    onClick={() => disconnect(conn.platform)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-[#3F3F46] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.06)] transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available integrations */}
      <h2 className="text-sm font-semibold text-[#52525B] uppercase tracking-wider mb-4">
        Plateformes disponibles
      </h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {INTEGRATIONS.map((integration) => {
          const Icon = integration.icon;
          const connected_ = isConnected(integration.id);
          const isActionable = integration.id === 'linkedin' || integration.id === 'facebook' || integration.id === 'instagram';

          return (
            <div
              key={integration.id}
              className={`glass-card p-5 transition-all hover:-translate-y-1 ${
                connected_ ? 'border-[rgba(34,197,94,0.2)]' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{
                      background: connected_ ? `${integration.color}15` : 'rgba(255,255,255,0.03)',
                      border: connected_
                        ? `1px solid ${integration.color}30`
                        : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <Icon size={20} style={{ color: connected_ ? integration.color : '#52525B' }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#FAFAFA]">{integration.name}</h3>
                    <span className="text-[10px] text-[#52525B]">Agent : {integration.agent}</span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                    connected_
                      ? 'bg-[rgba(34,197,94,0.1)] text-[#22C55E] border border-[rgba(34,197,94,0.2)]'
                      : 'bg-[rgba(255,255,255,0.03)] text-[#52525B] border border-white/[0.06]'
                  }`}
                >
                  {connected_ ? 'Connecté' : 'Déconnecté'}
                </span>
              </div>
              <p className="text-xs text-[#52525B] leading-relaxed mb-4">{integration.description}</p>

              {isActionable ? (
                connected_ ? (
                  <button
                    onClick={() => setPublishModal({ platform: integration.id, name: integration.name })}
                    className="w-full text-xs font-semibold py-2.5 rounded-xl btn-gold"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Send size={13} /> Publier un post
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => openConnectModal(integration.id)}
                    className="w-full text-xs font-semibold py-2.5 rounded-xl btn-gold"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Plus size={13} /> Connecter
                    </span>
                  </button>
                )
              ) : (
                <div className="w-full text-xs font-medium py-2.5 rounded-xl text-center text-[#3F3F46] border border-white/[0.04] bg-[rgba(255,255,255,0.02)]">
                  Bientôt disponible
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Guide section */}
      <div className="glass-card p-5 mt-8">
        <div className="flex items-start gap-3">
          <Key size={16} className="text-[#D4A853] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#FAFAFA] mb-2">Comment connecter vos comptes ?</p>
            <p className="text-xs text-[#52525B] leading-relaxed mb-3">
              Pour des raisons de sécurité, LNR AI Hub utilise une connexion manuelle avec token d'accès. 
              Cliquez sur "Connecter" sur chaque plateforme pour obtenir un guide étape par étape.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <a
                href="https://www.linkedin.com/developers/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(10,102,194,0.08)] border border-[rgba(10,102,194,0.15)] text-xs text-[#0A66C2] hover:bg-[rgba(10,102,194,0.12)] transition-all"
              >
                <ExternalLink size={12} /> LinkedIn Developers
              </a>
              <a
                href="https://developers.facebook.com/apps/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(24,119,242,0.08)] border border-[rgba(24,119,242,0.15)] text-xs text-[#1877F2] hover:bg-[rgba(24,119,242,0.12)] transition-all"
              >
                <ExternalLink size={12} /> Meta Developers
              </a>
              <a
                href="https://developers.facebook.com/tools/explorer/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(228,64,95,0.08)] border border-[rgba(228,64,95,0.15)] text-xs text-[#E4405F] hover:bg-[rgba(228,64,95,0.12)] transition-all"
              >
                <ExternalLink size={12} /> Graph API Explorer
              </a>
            </div>

            {/* Quick Page ID Finder */}
            <button
              onClick={() => setPageFinderOpen(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[rgba(24,119,242,0.08)] border border-[rgba(24,119,242,0.2)] text-sm text-[#1877F2] hover:bg-[rgba(24,119,242,0.12)] transition-all font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              🔍 Trouver automatiquement mon Page ID Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
