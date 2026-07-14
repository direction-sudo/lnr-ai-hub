// ─── Mock data for static/offline mode ───

export const MOCK_AGENTS = [
  {
    id: 1,
    slug: "nora",
    name: "Nora",
    role: "Agent de Communication",
    description:
      "Gérez vos réseaux sociaux, planifiez vos publications, analysez les performances et interagissez avec votre audience — le tout sur pilotage automatique.",
    avatar: "N",
    systemPrompt:
      "Tu es Nora, une experte en communication digitale et community management.",
    capabilities: [
      "publication",
      "analytics",
      "engagement",
      "calendrier",
    ],
    tools: ["linkedin", "instagram", "facebook", "twitter"],
    personality: "Professionnelle, créative, proactive",
    aiModel: "kimi-latest",
    isDefault: "true",
    status: "active",
    createdAt: new Date("2025-01-15"),
  },
  {
    id: 2,
    slug: "leo",
    name: "Leo",
    role: "Agent RH",
    description:
      "Automatisez le screening des CV, planifiez des entretiens, gérez le onboarding et gardez un œil sur la satisfaction de vos équipes.",
    avatar: "L",
    systemPrompt:
      "Tu es Leo, un expert en ressources humaines et recrutement.",
    capabilities: ["recrutement", "onboarding", "analytics", "planification"],
    tools: ["calendrier", "email", "notion", "slack"],
    personality: "Organisé, empathique, stratégique",
    aiModel: "kimi-latest",
    isDefault: "true",
    status: "active",
    createdAt: new Date("2025-01-20"),
  },
];

export const MOCK_MESSAGES: Record<number, Array<{ id: number; agentId: number; role: "user" | "agent"; content: string; createdAt: Date }>> = {
  1: [
    {
      id: 1,
      agentId: 1,
      role: "agent",
      content:
        "Bonjour ! Je suis Nora, votre agent de communication. Comment puis-je vous aider aujourd'hui ?",
      createdAt: new Date(),
    },
  ],
  2: [
    {
      id: 2,
      agentId: 2,
      role: "agent",
      content:
        "Bonjour ! Je suis Leo, votre agent RH. Prêt à optimiser vos processus recrutement ?",
      createdAt: new Date(),
    },
  ],
};

export const MOCK_ANALYTICS = {
  totalConversations: 156,
  totalMessages: 423,
  avgResponseTime: "2.3s",
  satisfactionScore: 94,
  weeklyGrowth: 12,
  topTopics: ["Publication", "Recrutement", "Analytics", "Engagement"],
};

export const MOCK_CALLS = [
  {
    id: 1,
    agentId: 1,
    type: "interview",
    title: "Entretien - Marie Dubois",
    status: "completed",
    duration: 1800,
    scheduledAt: new Date(),
    notes: "Candidature pour le poste de Community Manager",
  },
  {
    id: 2,
    agentId: 2,
    type: "follow_up",
    title: "Suivi onboarding - Jean Martin",
    status: "scheduled",
    duration: 900,
    scheduledAt: new Date(Date.now() + 86400000),
    notes: "Premier bilan après 1 mois",
  },
];

export const MOCK_KNOWLEDGE = [
  {
    id: 1,
    agentId: 1,
    title: "Guide de publication LinkedIn",
    content: "Les meilleures pratiques pour les publications LinkedIn...",
    type: "document",
    createdAt: new Date(),
  },
  {
    id: 2,
    agentId: 1,
    title: "Calendrier éditorial Q1",
    content: "Planification des contenus pour le premier trimestre...",
    type: "calendar",
    createdAt: new Date(),
  },
];
