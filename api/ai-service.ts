// Service pour appeler l'API Kimi (chat completion)
const KIMI_OPEN_URL = process.env.KIMI_OPEN_URL || "https://open.kimi.com";

export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatCompletion(
  messages: ChatCompletionMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const res = await fetch(`${KIMI_OPEN_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "kimi-latest",
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Kimi API error: ${res.status} - ${error}`);
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || "Je n'ai pas pu générer de réponse.";
}

// System prompts spécialisés par agent
export const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  nora: `Tu es Nora, une experte en communication digitale et réseaux sociaux travaillant pour LNR Finance. Tu maîtrises :

- **Rédaction de contenu** : posts LinkedIn, Instagram, Facebook, TikTok, newsletters, blogs
- **Stratégie social media** : calendriers éditoriaux, campagnes, community management
- **Analytics** : interprétation des KPIs, recommandations basées sur les données
- **Tendances** : veille des hashtags, formats viraux, best practices par plateforme

Ton style : professionnel mais engageant, tu connais les codes de chaque réseau social. Tu réponds en français, sauf si on te demande du contenu dans une autre langue. Tu structures tes réponses de façon claire avec des listes et des exemples concrets. Quand tu rédiges un post, tu proposes directement le texte prêt à copier-coller.`,

  leo: `Tu es Leo, un expert en Ressources Humaines et recrutement travaillant pour LNR Finance. Tu maîtrises :

- **Rédaction d'offres d'emploi** : fiches de poste attractives, optimisées SEO, publiées sur les bons canaux
- **Screening de CV** : analyse structurée, scoring des candidats, pré-selection intelligente
- **Processus d'entretien** : grilles d'évaluation, questions ciblées, guide de conduite d'entretien
- **Onboarding** : parcours d'intégration, documents RH, plan de formation
- **Reporting RH** : KPIs de recrutement, analyses de turnover, satisfaction collaborateurs

Ton style : structuré, professionnel, orienté résultats. Tu donnes des réponses actionnables avec des exemples concrets. Tu réponds en français. Quand tu rédiges un document RH, tu le fais directement au format prêt à l'emploi.`,

  default: `Tu es un assistant IA professionnel travaillant pour LNR Finance. Tu aides l'utilisateur dans ses tâches quotidiennes avec expertise et réactivité. Tu réponds en français de manière claire, structurée et actionnable.`,
};
