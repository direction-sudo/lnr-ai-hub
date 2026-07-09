import { useState, useCallback } from 'react';
import type { Agent, Message, Conversation } from '@/types';

const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'nora',
    name: 'Nora',
    role: 'Agent Communication & Réseaux Sociaux',
    description: 'Votre community manager IA. Nora rédige vos posts, crée vos visuels, planifie votre calendrier éditorial et analyse vos performances sur LinkedIn, Instagram, Facebook et TikTok.',
    avatar: '/images/avatar-nora.png',
    capabilities: ['Rédaction de posts', 'Création de visuels', 'Calendrier éditorial', 'Analytics & KPIs', 'Community management', 'Stories & Reels', 'Newsletters', 'SEO social'],
    status: 'online',
    tools: ['LinkedIn', 'Instagram', 'Facebook', 'TikTok', 'Gmail', 'WordPress', 'Canva'],
    conversations: 342,
    responseTime: '1.5s',
    satisfaction: '4.9/5',
  },
  {
    id: 'leo',
    name: 'Leo',
    role: 'Agent Ressources Humaines',
    description: 'Votre responsable RH IA. Leo gère vos recrutements de A à Z : rédaction d\'offres, screening de CV, planification d\'entretiens, onboarding des nouveaux et suivi des collaborateurs.',
    avatar: '/images/avatar-leo.png',
    capabilities: ['Rédaction d\'offres', 'Screening CV', 'Entretiens', 'Onboarding', 'Planning RH', 'Reporting', 'Gestion des congés', 'Formation'],
    status: 'online',
    tools: ['LinkedIn', 'Google Calendar', 'Slack', 'Notion'],
    conversations: 218,
    responseTime: '2s',
    satisfaction: '4.8/5',
  },
];

const NORA_RESPONSES = [
  "Super idée ! Voici 3 versions de posts LinkedIn pour votre lancement :\n\n**Version corporate :** 🚀 Nous sommes fiers de vous annoncer le lancement de LNR AI Hub, notre plateforme d'agents IA autonomes. Conçue pour révolutionner la productivité des entreprises modernes. #Innovation #IA\n\n**Version storytelling :** Il y a 6 mois, je passais encore des nuits blanches à gérer mes réseaux sociaux... Aujourd'hui, Nora le fait pour moi. Découvrez LNR AI Hub. ✨\n\n**Version choc :** Votre community manager coûte 3 500€/mois. Nora fait le même travail pour 99€. Vous faites le calcul ? 😏\n\nQuel ton préférez-vous ?",
  "Voici votre calendrier éditorial pour la semaine prochaine :\n\n📅 **Lundi** : Post motivation + tip produit\n📅 **Mardi** : Carrousel '3 erreurs à éviter'\n📅 **Mercredi** : Témoignage client\n📅 **Jeudi** : Reel/Vidéo courte\n📅 **Vendredi** : Post d'équipe / coulisses\n\nJe peux rédiger chaque post et préparer les visuels associés. Par lequel on commence ?",
  "Analyse de vos performances cette semaine sur LinkedIn :\n\n📊 **Impressions** : +34% vs semaine dernière\n📊 **Engagement** : 4.2% (vs 2.8% moyenne secteur)\n📊 **Clics profil** : +56%\n📊 **Followers** : +127 nouveaux\n\nVotre post sur l'IA générative a fait 3x plus de vues que la moyenne. Je vous suggère de créer une série sur ce thème. Ça vous dit ?",
  "Votre newsletter mensuelle est prête ! Voici les stats prévues :\n\n📬 **Sujet** : 'L'IA qui transforme votre quotidien'\n📬 **Preview** : Découvrez comment 3 PME ont doublé leur productivité en 30 jours...\n📬 **Taux d'ouverture estimé** : 42% (vs 28% moyenne)\n\nJe l'ai structurée avec un CTA clair vers votre démo. Voulez-vous que je la programme pour demain 9h ?",
  "J'ai préparé 5 visuels Instagram pour votre semaine :\n\n🎨 **Lundi** : Quote motivation + branding doré\n🎨 **Mardi** : Avant/Après chiffres clients\n🎨 **Mercredi** : Tips '3 min pour...'\n🎨 **Jeudi** : Reel concept 'Day in the life'\n🎨 **Vendredi** : CTA weekend 'On se retrouve lundi'\n\nChaque visuel respecte votre charte graphique LNR (noir/doré). Vous validez ?",
  "Tendance repérée 🔥 : le hashtag #AgentIA génère +400% d'engagement ce mois-ci. Je vous propose un carrousel '5 mythes sur les agents IA débunkés' pour surfer sur la vague. Ça peut vous rapporter 2-3k vues organiques. On le fait ?",
  "Votre post sur l'externalisation vient de dépasser 10 000 vues ! 🎉 Les commentaires sont très positifs. Je vous suggère de répondre aux 12 questions posées pour maximiser l'engagement. Je peux préparer les réponses ?",
  "J'ai audité vos 3 comptes (LinkedIn, Instagram, Facebook). Voici mes recommandations :\n\n✅ LinkedIn : Votre meilleur canal (8.5% engagement)\n⚠️ Instagram : Manque de Reels (ajouter 2/semaine)\n❌ Facebook : Trop peu actif → rediriger vers LinkedIn\n\nBudget conseillé : 70% LinkedIn, 30% Instagram. Vous êtes d'accord ?",
];

const LEO_RESPONSES = [
  "J'ai rédigé votre offre d'emploi pour le poste de Développeur Full Stack. Voici un aperçu :\n\n**LNR Finance recrute : Développeur Full Stack H/F**\n\n📍 Nice (hybride)\n💼 CDI - 45-55K selon expérience\n🚀 Startup en forte croissance dans l'IA\n\n**Missions :**\n• Développement de nouvelles features sur notre plateforme\n• Architecture microservices Node.js/React\n• CI/CD, testing, code review\n\n**Profil recherché :** 3+ ans d'expérience, passionné par l'IA\n\nJe la publie sur LinkedIn et Welcome to the Jungle ?",
  "Screening terminé pour le poste de Commercial B2B ! Voici les résultats :\n\n📥 **CV reçus** : 34\n✅ **Qualifiés** : 12 (expérience + secteur OK)\n⚠️ **À creuser** : 8 (compétences OK mais manque d'expérience)\n❌ **Écartés** : 14 (profil hors scope)\n\n**Top 3 candidats :**\n1. Marc D. - 5 ans B2B SaaS - Bac+5\n2. Sarah L. - 4 ans Fintech - Excellent LinkedIn\n3. Karim B. - 6 ans Consulting - Bilingue\n\nJe programme les entretiens pour cette semaine ?",
  "Votre process d'onboarding pour la nouvelle recrue est prêt :\n\n📋 **Jour 1** : Welcome, setup technique, présentation équipe\n📋 **Jour 2** : Formation produit + première mission guidée\n📋 **Jour 3** : Shadowing avec mentor assigné\n📋 **Semaine 2** : Objectifs du premier mois définis\n📋 **Mois 1** : Bilan + plan de formation personnalisé\n\nJ'ai préparé tous les documents : fiche de poste détaillée, organigramme, guide interne. Vous validez ?",
  "Rapport RH mensuel prêt :\n\n📊 **Recrutement** : 3 offres actives, 47 candidatures, 5 entretiens réalisés\n📊 **Taux de conversion** : 12% (candidature → entretien)\n📊 **Délai moyen de recrutement** : 18 jours (vs 35j secteur)\n📊 **Satisfaction collaborateurs** : 4.6/5\n\n💡 **Alerte** : 2 collaborateurs ont des entretiens annuels en retard. Je les programme ?",
  "J'ai préparé votre planning RH pour la semaine prochaine :\n\n📅 **Lundi** : Entretien Marc D. (10h) + Sarah L. (14h)\n📅 **Mardi** : Bilan onboarding nouvelle recrue\n📅 **Mercredi** : Formation équipe sur les nouveaux outils\n📅 **Jeudi** : Entretien annuel Karim B. (11h)\n📅 **Vendredi** : Revue des objectifs trimestriels\n\nTout est synchronisé avec Google Calendar. Des ajustements ?",
  "Offre publiée avec succès ! 🎯\n\n✅ LinkedIn : 847 vues en 2h, 12 candidatures déjà\n✅ Welcome to the Jungle : En ligne, 5 matchs qualifiés\n✅ Indeed : Diffusion active\n\nMessage d'approche LinkedIn envoyé à 23 profils ciblés (Commercial B2B +3 ans, région PACA). 8 ont déjà consulté votre profil entreprise. Le marché est chaud ! 🔥",
  "Concernant la fiche de poste Chargé de Communication :\n\nJe recommande de mettre en avant ces 3 atouts pour attirer les bons profils :\n\n1. **Flexibilité** : 3j télétravail (très demandé)\n2. **Impact direct** : Autonomie sur la stratégie com\n3. **Croissance** : Évolution possible vers Chef de projet marketing\n\nSalaire conseillé : 32-38K selon expérience (aligné marché PACA +5%). On part là-dessus ?",
  "Votre entretien avec M. Dupont est confirmé demain à 14h. J'ai préparé :\n\n📋 **Dossier candidat** : CV, lettre, profil LinkedIn analysé\n📋 **Questions suggérées** : 10 questions techniques + comportementales\n📋 **Grille d'évaluation** : Compétences, culture fit, motivation\n📋 **Rappel automatique** : Envoyé au candidat ce matin\n\nBon point : il a 4 recommandations LinkedIn vérifiées. Profil prometteur !",
];

const DEFAULT_RESPONSES = [
  "C'est noté ! Je m'en occupe immédiatement. Vous aurez le résultat dans quelques secondes.",
  "Excellente idée. Voici ma proposition optimisée pour votre cas d'usage...",
  "Je peux vous aider avec ça. Quel niveau de détail souhaitez-vous ?",
  "C'est compris. Je travaille dessus et reviens vers vous avec une solution complète.",
  "Pas de souci, considérez c'est fait ! Souhaitez-vous un récapitulatif ?",
];

export function useAgentStore() {
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);

  const addAgent = useCallback((agent: Agent) => {
    setAgents(prev => [...prev, agent]);
  }, []);

  const removeAgent = useCallback((agentId: string) => {
    setAgents(prev => prev.filter(a => a.id !== agentId));
  }, []);

  const getAgent = useCallback((agentId: string) => {
    return agents.find(a => a.id === agentId) || null;
  }, [agents]);

  const getConversation = useCallback((agentId: string) => {
    return conversations.find(c => c.agentId === agentId) || null;
  }, [conversations]);

  const sendMessage = useCallback((agentId: string, content: string) => {
    const userMsg: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      agentId,
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    setConversations(prev => {
      const existing = prev.find(c => c.agentId === agentId);
      if (existing) {
        return prev.map(c =>
          c.agentId === agentId
            ? {
                ...c,
                messages: [...c.messages, userMsg],
                lastMessage: content,
                timestamp: new Date(),
              }
            : c
        );
      }
      return [
        ...prev,
        {
          id: `conv-${Date.now()}`,
          agentId,
          messages: [userMsg],
          lastMessage: content,
          timestamp: new Date(),
          unread: 0,
        },
      ];
    });

    // Simulate agent response after delay
    setTimeout(() => {
      let responses: string[];
      if (agentId === 'nora') responses = NORA_RESPONSES;
      else if (agentId === 'leo') responses = LEO_RESPONSES;
      else responses = DEFAULT_RESPONSES;
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const agentMsg: Message = {
        id: `msg-${Date.now()}-${Math.random()}`,
        agentId,
        content: randomResponse,
        sender: 'agent',
        timestamp: new Date(),
      };

      setConversations(prev => {
        const existing = prev.find(c => c.agentId === agentId);
        if (existing) {
          return prev.map(c =>
            c.agentId === agentId
              ? {
                  ...c,
                  messages: [...c.messages, agentMsg],
                  lastMessage: randomResponse,
                  timestamp: new Date(),
                  unread: c.unread + 1,
                }
              : c
          );
        }
        return [
          ...prev,
          {
            id: `conv-${Date.now()}`,
            agentId,
            messages: [agentMsg],
            lastMessage: randomResponse,
            timestamp: new Date(),
            unread: 1,
          },
        ];
      });
    }, 1500 + Math.random() * 1500);
  }, [agents]);

  const getMessages = useCallback((agentId: string): Message[] => {
    const conv = conversations.find(c => c.agentId === agentId);
    return conv?.messages || [];
  }, [conversations]);

  const markAsRead = useCallback((agentId: string) => {
    setConversations(prev =>
      prev.map(c =>
        c.agentId === agentId ? { ...c, unread: 0 } : c
      )
    );
  }, []);

  return {
    agents,
    conversations,
    activeAgentId,
    setActiveAgentId,
    addAgent,
    removeAgent,
    getAgent,
    getConversation,
    sendMessage,
    getMessages,
    markAsRead,
  };
}
