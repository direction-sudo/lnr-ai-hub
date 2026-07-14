// ─── AI Service — calls Kimi API directly from the browser ───

const KIMI_API_URL = "https://api.moonshot.ai/v1/chat/completions";

// System prompts (same as backend)
const SYSTEM_PROMPTS: Record<string, string> = {
  nora: `Tu es Nora, une experte en communication digitale et réseaux sociaux travaillant pour LNR Finance. Tu maîtrises parfaitement les codes de chaque plateforme (LinkedIn, Instagram, Facebook, TikTok) et tu crées du contenu engageant et performant.

Ce que tu sais faire :
- Rédiger des posts LinkedIn/Instagram/Facebook/TikTok prêts à publier
- Créer des calendriers éditoriaux complets avec thèmes et horaires optimaux
- Analyser les performances (engagement, reach, impressions) et donner des recommandations
- Rédiger des newsletters avec des sujets accrocheurs et des CTAs efficaces
- Proposer des visuels/concept designs (description détaillée pour un designer)
- Faire de la veille hashtag et identifier les tendances du moment
- Adapter le ton selon la plateforme et l'audience

Règles :
- Réponds TOUJOURS en français
- Sois concise et directe — donne le contenu prêt à l'emploi
- Utilise des émojis pertinents pour les réseaux sociaux
- Structure tes réponses avec des titres clairs
- Propose 2-3 alternatives quand c'est pertinent`,

  leo: `Tu es Leo, un expert en Ressources Humaines et recrutement travaillant pour LNR Finance. Tu as une connaissance approfondie du marché de l'emploi, des techniques de sourcing, et des meilleures pratiques RH.

Ce que tu sais faire :
- Rédiger des fiches de poste attractives et optimisées SEO
- Publier et diffuser des offres sur les bons canaux (LinkedIn, Indeed, Welcome to the Jungle)
- Analyser et scorer des CV selon des critères précis
- Préparer des grilles d'entretien avec questions techniques et comportementales
- Créer des parcours d'onboarding complets et personnalisés
- Générer des rapports RH avec KPIs (time-to-hire, cost-per-hire, satisfaction)
- Conseiller sur la stratégie salariale et les avantages
- Rédiger des documents RH (contrats, avenants, attestations)

Règles :
- Réponds TOUJOURS en français
- Sois structuré et professionnel — utilise des tableaux et listes
- Cite les références légales quand c'est pertinent (Code du travail)
- Donne des exemples concrets et chiffrés
- Propose un format prêt à l'emploi (copier-coller)`,

  default: `Tu es un assistant IA professionnel travaillant pour LNR Finance. Tu aides l'utilisateur dans ses tâches quotidiennes avec expertise et réactivité. Tu réponds en français de manière claire, structurée et actionnable.`,
};

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ─── Get API Key from localStorage ───
export function getApiKey(): string | null {
  return localStorage.getItem("lnr_api_key");
}

export function setApiKey(key: string): void {
  localStorage.setItem("lnr_api_key", key);
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

// ─── Chat completion ───
export async function sendMessageToAI(
  agentSlug: string,
  messages: Array<{ role: "user" | "agent"; content: string }>,
  newMessage: string
): Promise<string> {
  const apiKey = getApiKey();

  // If no API key, return simulated response
  if (!apiKey) {
    return getSimulatedResponse(agentSlug, newMessage);
  }

  const systemPrompt = SYSTEM_PROMPTS[agentSlug] || SYSTEM_PROMPTS.default;

  const apiMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    { role: "user", content: newMessage },
  ];

  try {
    const res = await fetch(KIMI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("[AI] API error:", error);
      // Fallback to simulated if API fails
      return getSimulatedResponse(agentSlug, newMessage);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Je n'ai pas pu générer de réponse.";
  } catch (err) {
    console.error("[AI] Network error:", err);
    return getSimulatedResponse(agentSlug, newMessage);
  }
}

// ─── Simulated responses (when no API key) ───
function getSimulatedResponse(agentSlug: string, message: string): string {
  const responses: Record<string, string[]> = {
    nora: [
      `Je vais vous aider avec votre communication ! Pour : "${message}", voici ce que je propose :

**Option 1** — Tone professionnel
"${message}" 🚀

**Option 2** — Tone storytelling  
"Vous savez, ${message}... C'est exactement ce qui passionne notre communauté." ✨

**Option 3** — Tone impact
"STOP. ${message} ? Voilà pourquoi ça change tout." 💥

Quelle version préférez-vous ?`,

      `Excellente idée pour "${message}" ! Voici un post LinkedIn prêt à publier :

📝 **Version LinkedIn (pro)** :
"${message}. Chez LNR Finance, on croit que l'excellence opérationnelle fait la différence. C'est pourquoi nos équipes travaillent chaque jour à optimiser nos processus pour mieux servir nos clients."

📊 **Hashtags** : #Finance #Excellence #Innovation

Voulez-vous une version Instagram ou Facebook ?`,

      `Pour votre calendrier éditorial sur "${message}" :

📅 **Planning semaine type** :
- **Lundi 9h** : Post motivation (tone inspirant)
- **Mercredi 14h** : Carrousel tips (tone éducatif)
- **Vendredi 17h** : Post bilan (tone communautaire)

🎯 **Thèmes de la semaine** : ${message}

Voulez-vous que je développe chaque post ?`,
    ],
    leo: [
      `Je vais analyser "${message}" du point de vue RH !

📋 **Analyse** :
- Compétences clés identifiées
- Expérience requise : 3-5 ans
- Culture fit : Aligné avec les valeurs LNR

🎯 **Recommandation** :
Préparer une grille d'entretien avec 3 questions comportementales et 2 questions techniques.

Voulez-vous que je rédige l'offre complète ?`,

      `Pour votre process de recrutement sur "${message}" :

📝 **Fiche de poste** (prêt à publier) :
**Poste** : ${message}
**Mission** : Piloter et optimiser les processus opérationnels
**Profil** : Bac+5, 3-5 ans d'expérience, esprit d'analyse

📍 **Canaux de diffusion** :
1. LinkedIn (principal)
2. Welcome to the Jungle
3. Indeed

Voulez-vous la version complète ?`,

      `Voici un rapport RH sur "${message}" :

📊 **KPIs Recrutement** :
| Métrique | Valeur |
|----------|--------|
| Time-to-hire | 28 jours |
| Cost-per-hire | 2 500€ |
| Taux de rétention | 94% |

💡 **Recommandation** :
Mettre en place un programme de cooptation pour réduire le cost-per-hire de 20%.

Besoin d'un rapport plus détaillé ?`,
    ],
  };

  const agentResponses = responses[agentSlug] || responses.default;
  // Deterministic selection based on message content
  const index = message.length % agentResponses.length;
  return agentResponses[index];
}
