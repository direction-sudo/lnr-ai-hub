import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Instagram, MessageSquare, Calendar, FileText,
  Check, X, ChevronLeft, Plus, Globe, Lock, AlertCircle
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: typeof Users;
  status: 'connected' | 'disconnected' | 'pending';
  agent: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Publiez des posts, analysez vos performances et gérez votre présence professionnelle.',
    icon: Users,
    status: 'disconnected',
    agent: 'Nora',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Créez des stories, des reels et planifiez votre contenu visuel.',
    icon: Instagram,
    status: 'disconnected',
    agent: 'Nora',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Gérez votre page Facebook et publiez du contenu automatiquement.',
    icon: MessageSquare,
    status: 'disconnected',
    agent: 'Nora',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Planifiez les entretiens et synchronisez les événements RH.',
    icon: Calendar,
    status: 'disconnected',
    agent: 'Leo',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Recevez les notifications et alertes de vos agents directement dans Slack.',
    icon: MessageSquare,
    status: 'disconnected',
    agent: 'Les deux',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Exportez les rapports, les fiches de poste et les documentations.',
    icon: FileText,
    status: 'disconnected',
    agent: 'Leo',
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [selected, setSelected] = useState<Integration | null>(null);

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(int =>
      int.id === id
        ? { ...int, status: int.status === 'connected' ? 'disconnected' : 'connected' as const }
        : int
    ));
    if (selected?.id === id) {
      setSelected(prev => prev ? { ...prev, status: prev.status === 'connected' ? 'disconnected' : 'connected' as const } : null);
    }
  };

  const connected = integrations.filter(i => i.status === 'connected');
  const disconnected = integrations.filter(i => i.status === 'disconnected');

  return (
    <div className="p-6 lg:p-10 min-h-screen" style={{ background: 'rgba(10,10,11,0.92)' }}>
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
            Connectez vos outils pour des agents plus puissants
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
            <p className="text-lg font-bold text-[#FAFAFA]">{disconnected.length}</p>
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Déconnectées</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {integrations.map(integration => {
          const Icon = integration.icon;
          const isConnected = integration.status === 'connected';

          return (
            <div
              key={integration.id}
              onClick={() => setSelected(integration)}
              className={`glass-card p-5 cursor-pointer transition-all hover:-translate-y-1 ${
                isConnected ? 'border-[rgba(34,197,94,0.2)]' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    isConnected
                      ? 'bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)]'
                      : 'bg-[rgba(255,255,255,0.03)] border border-white/[0.06]'
                  }`}>
                    <Icon size={20} className={isConnected ? 'text-[#D4A853]' : 'text-[#52525B]'} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#FAFAFA]">{integration.name}</h3>
                    <span className="text-[10px] text-[#52525B]">Agent : {integration.agent}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                  isConnected
                    ? 'bg-[rgba(34,197,94,0.1)] text-[#22C55E] border border-[rgba(34,197,94,0.2)]'
                    : 'bg-[rgba(255,255,255,0.03)] text-[#52525B] border border-white/[0.06]'
                }`}>
                  {isConnected ? 'Connecté' : 'Déconnecté'}
                </span>
              </div>
              <p className="text-xs text-[#52525B] leading-relaxed mb-4">{integration.description}</p>
              <button
                onClick={(e) => { e.stopPropagation(); toggleIntegration(integration.id); }}
                className={`w-full text-xs font-semibold py-2 rounded-xl transition-all ${
                  isConnected
                    ? 'text-[#EF4444] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.06)]'
                    : 'btn-gold'
                }`}
              >
                {isConnected ? (
                  <span className={isConnected ? '' : 'relative z-10'}>Déconnecter</span>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    <Plus size={13} /> Connecter
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="glass-card p-5 mt-8">
        <div className="flex items-start gap-3">
          <AlertCircle size={16} className="text-[#D4A853] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#FAFAFA] mb-1">Comment connecter vos comptes ?</p>
            <p className="text-xs text-[#52525B] leading-relaxed mb-2">
              Pour connecter une plateforme sociale (LinkedIn, Facebook, Instagram), vous devez créer une application développeur sur leur portail respectif. Voici les étapes :
            </p>
            <ol className="space-y-1.5 text-xs text-[#52525B]">
              <li className="flex items-start gap-2">
                <span className="text-[#D4A853] font-bold">1.</span>
                <span>Créez une app sur le portail développeur de la plateforme (LinkedIn, Facebook, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D4A853] font-bold">2.</span>
                <span>Obtenez votre Client ID et Client Secret</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D4A853] font-bold">3.</span>
                <span>Contactez-nous à contact@lnr-finance.com pour l'intégration</span>
              </li>
            </ol>
            <p className="text-xs text-[#52525B] mt-2">
              En attendant, vos agents utilisent l'IA Kimi pour générer le contenu — vous le copiez-collez manuellement sur vos réseaux.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
