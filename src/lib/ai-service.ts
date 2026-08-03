// ─── AI Service — calls Kimi API directly from the browser ───

const KIMI_API_URL = "https://api.moonshot.ai/v1/chat/completions";

// System prompts (same as backend)
const SYSTEM_PROMPTS: Record<string, string> = {
  nora: `Tu es Nora, une experte en communication digitale et réseaux sociaux travaillant pour LNR Finance. Tu maîtrises parfaitement les codes de chaque plateforme (LinkedIn, Instagram, Facebook, TikTok) et tu crées du contenu engageant et performant.

=== RÈGLES ABSOLUES DE GÉNÉRATION DE CONTENU ===

Quand tu génères un post destiné à être publié sur Facebook, LinkedIn, Instagram ou tout autre réseau social, tu dois produire UNIQUEMENT le contenu final du post, prêt à être publié.

INTERDICTIONS STRICTES :
- Ne JAMAIS inclure de texte destiné à l'utilisateur ou au chat
- Ne JAMAIS afficher d'introduction comme : "Voici un post prêt à publier :", "📝 Post Facebook :", "📢 Publication :", "Hashtags :", "Légende :", "Proposition :", "Version 1 :", "Version plus courte pour Instagram ?", "Souhaitez-vous une autre version ?" ou toute phrase similaire
- Ne JAMAIS expliquer ce que tu fais
- Ne JAMAIS demander une validation
- Ne JAMAIS proposer plusieurs versions
- Ne JAMAIS ajouter de commentaires, d'instructions ou de notes
- Ne JAMAIS utiliser de mise en forme Markdown (**, #, ##, listes à puces, etc.)

FORMAT DE SORTIE OBLIGATOIRE :
- Retourne UNIQUEMENT le texte exact qui sera publié
- Un titre ou une accroche si pertinent
- Le corps du message
- Les emojis quand ils apportent de la valeur
- Un appel à l'action (CTA) si adapté
- Les hashtags directement à la fin du post
- Aucun texte avant le post
- Aucun texte après le post
- Aucune explication

Le résultat doit être identique à ce qu'un community manager professionnel publierait manuellement : professionnel, fluide, naturel, engageant, adapté au ton de LNR Finance, optimisé pour la plateforme, et prêt à être publié sans aucune modification.

=== AUTRES CAPACITÉS ===
- Créer des calendriers éditoriaux complets avec thèmes et horaires optimaux
- Analyser les performances (engagement, reach, impressions) et donner des recommandations
- Rédiger des newsletters avec des sujets accrocheurs et des CTAs efficaces
- Proposer des visuels/concept designs (description détaillée pour un designer)
- Faire de la veille hashtag et identifier les tendances du moment
- Adapter le ton selon la plateforme et l'audience

Règles générales :
- Réponds TOUJOURS en français
- Sois concise et directe
- Utilise des émojis pertinents pour les réseaux sociaux
- Quand tu génères du contenu pour réseaux sociaux ET que l'utilisateur te demande de publier, confirme-lui que tu vas publier et que des boutons de publication apparaîtront sous ta réponse`,

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
// Uses keyword detection + random selection + anti-repetition history

let lastNoraIndex = -1;
let lastLeoIndex = -1;

function pickRandomIndex(total: number, lastIndex: number): number {
  if (total <= 1) return 0;
  let idx = Math.floor(Math.random() * total);
  // Avoid same response twice in a row
  while (idx === lastIndex) {
    idx = Math.floor(Math.random() * total);
  }
  return idx;
}

function getSimulatedResponse(agentSlug: string, message: string): string {
  const lowerMsg = message.toLowerCase().trim();

  // ─── NORA (Communication) ───
  if (agentSlug === 'nora') {
    // Keyword-based responses
    if (lowerMsg.includes('courage') || lowerMsg.includes('motivation') || lowerMsg.includes('inspir')) {
      return `Le courage ne consiste pas à avoir peur. Le courage, c'est avancer malgré la peur.

Chez LNR Finance, on rencontre chaque jour des défis qui nous poussent hors de notre zone de confort. C'est précisément là que la magie opère.

La capacité de prendre des décisions difficiles, la résilience face aux obstacles, l'innovation qui naît du risque calculé — voilà ce que le courage vous apporte au quotidien.

Quel est le dernier acte courageux que vous avez posé dans votre carrière ? Partagez en commentaires 👇

#Courage #Leadership #Motivation #LNRFinance #Mindset`;
    }

    if (lowerMsg.includes('calendrier') || lowerMsg.includes('planning') || lowerMsg.includes('editorial')) {
      return `Voici votre calendrier éditorial pour la semaine prochaine :

📅 **Planning LNR Finance** :

**Lundi 9h** — Post motivation
💬 "Le succès appartient à ceux qui se lèvent tôt... et qui persistent."

**Mardi 14h** — Carrousel "3 erreurs à éviter en 2026"
💡 Contenu éducatif + visuel accrocheur

**Mercredi 11h** — Témoignage client
🎤 Interview avec un client satisfait

**Jeudi 16h** — Reel/Vidéo courte
🎬 "1 minute pour comprendre..."

**Vendredi 10h** — Post coulisses
🏢 Photo de l'équipe + moment convivial

**Samedi 11h** — Quiz/Interaction
❓ "Devinez lequel de ces 3 conseils est le plus efficace"

Voulez-vous que je rédige chaque post en détail ?`;
    }

    if (lowerMsg.includes('post') && (lowerMsg.includes('linkedin') || lowerMsg.includes('réseau'))) {
      return `Nous sommes fiers d'accompagner plus de 500 familles dans leur gestion de patrimoine. Chaque chiffre cache une histoire, chaque client est une relation de confiance.

Depuis 10 ans, LNR Finance met l'humain au coeur de la finance. Parce que votre patrimoine n'est pas qu'une question de chiffres, c'est votre avenir.

Prêt à écrire la prochaine page de votre histoire ? Contactez-nous pour un premier rendez-vous sans engagement.

#LNRFinance #GestionDePatrimoine #Confiance #Excellence #Finance`;
    }

    if (lowerMsg.includes('idee') || lowerMsg.includes('idée') || lowerMsg.includes('suggestion')) {
      return `Voici 10 idées de posts pour LNR Finance :

1. 📊 **Infographie** : "Les chiffres clés du marché immobilier 2026"
2. 🎤 **Témoignage** : Interview d'un client sur son parcours
3. 💡 **Tips** : "3 erreurs fiscales à éviter cette année"
4. 🏆 **Behind the scenes** : Journée type d'un conseiller LNR
5. ❓ **Quiz** : "Testez vos connaissances en gestion de patrimoine"
6. 📅 **Actualité** : Comment réagir à la dernière réforme fiscale
7. 🎯 **Mythbuster** : "5 idées reçues sur l'investissement locatif"
8. 📈 **Résultats** : Bilan trimestriel avec chiffres réels
9. 👥 **Équipe** : Portrait d'un collaborateur
10. 🎁 **Giveaway** : "Gagnez un audit patrimonial gratuit"

Voulez-vous que je développe l'une de ces idées ?`;
    }

    if (lowerMsg.includes('bonjour') || lowerMsg.includes('salut') || lowerMsg.includes('hello') || lowerMsg === 'bonjour' || lowerMsg === 'salut') {
      return `Bonjour ! 👋 Je suis Nora, votre community manager IA.

Comment puis-je vous aider aujourd'hui ?

Voici ce que je peux faire pour vous :

📝 **Rédiger des posts** LinkedIn, Instagram, Facebook
📅 **Créer un calendrier éditorial** complet
📊 **Analyser vos performances** réseaux sociaux
🎨 **Proposer des visuels** et concepts créatifs
📬 **Rédiger des newsletters** engageantes

Quel est votre besoin du jour ?`;
    }

    // Generic Nora responses (randomized, anti-repetition)
    const genericNora = [
      `Chez LNR Finance, ${message} fait partie de notre expertise au quotidien.

Depuis plus de 10 ans, nous accompagnons nos clients avec la même exigence : l'excellence personnalisée. Un conseiller dédié, une stratégie sur mesure, des résultats mesurables.

Vous souhaitez en savoir plus ? Contactez-nous pour un premier rendez-vous sans engagement.

#LNRFinance #GestionDePatrimoine #Excellence #Conseil`,

      `${message} — un sujet qui nous tient particulièrement à coeur chez LNR Finance.

Parce que chaque parcours est unique, nous mettons notre expertise au service de vos ambitions. Patrimoine, immobilier, fiscalité : nous construisons votre stratégie sur mesure.

Découvrez comment nous pouvons vous accompagner. Le premier rendez-vous est sans engagement.

#LNRFinance #Patrimoine #SurMesure #ConseilFinance`,

      `"La meilleure décision que j'ai prise ? Contacter LNR Finance pour ma gestion de patrimoine."

Cette phrase, nous l'entendons chaque jour de la part de nos clients. Et si ${message} était le début de votre nouvelle histoire ?

Notre promesse : un accompagnement humain, transparent et performant.

Prenez rendez-vous dès maintenant 👇

#LNRFinance #TémoignageClient #GestionDePatrimoine`,
    ];
    const idx = pickRandomIndex(genericNora.length, lastNoraIndex);
    lastNoraIndex = idx;
    return genericNora[idx];
  }

  // ─── LEO (RH) ───
  if (agentSlug === 'leo') {
    if (lowerMsg.includes('offre') || lowerMsg.includes('poste') || lowerMsg.includes('emploi') || lowerMsg.includes('recrut')) {
      return `Voici une fiche de poste attractive pour LNR Finance :

📝 **LNR Finance recrute : Conseiller en Gestion de Patrimoine H/F**

📍 **Localisation** : Nice (06) — hybride
💼 **Type** : CDI
💰 **Rémunération** : 35-50K + commissions

🎯 **Missions** :
• Accueillir et conseiller une clientèle de particuliers
• Élaborer des stratégies patrimoniales personnalisées
• Développer votre portefeuille client ( prospection + fidélisation)
• Participer aux événements de l'entreprise

💡 **Profil recherché** :
• Bac+3 minimum (finance, éco, commerce)
• 2+ ans d'expérience en conseil patrimonial
• Excellent relationnel et sens du service
• Esprit d'équipe et ambition

Intéressé ? Postulez directement !`;
    }

    if (lowerMsg.includes('cv') || lowerMsg.includes('screening') || lowerMsg.includes('candidat')) {
      return `Process de screening CV activé ! Voici la méthode LNR :

📋 **Grille d'évaluation** (score /100) :

| Critère | Pondération |
|---------|------------|
| Formation | 15 pts |
| Expérience pertinente | 25 pts |
| Compétences techniques | 20 pts |
| Soft skills / Culture fit | 20 pts |
| Motivation / Lettre | 10 pts |
| Recommandations | 10 pts |

✅ **Seuil de qualification** : 70/100
✅ **Seuil 'Top candidat'** : 85/100

Envoyez-moi un CV à analyser, je vous donne le score détaillé !`;
    }

    if (lowerMsg.includes('entretien') || lowerMsg.includes('interview')) {
      return `Voici une grille d'entretien type pour LNR Finance :

📋 **Questions comportementales** (STAR method) :
1. "Décrivez une situation où vous avez dû gérer un client difficile"
2. "Racontez un échec professionnel et ce que vous en avez appris"
3. "Comment priorisez-vous vos tâches quand tout est urgent ?"

📋 **Questions techniques** :
4. "Expliquez la différence entre SCPI et OPCI en 2 minutes"
5. "Comment évaluez-vous la tolérance au risque d'un client ?"
6. "Quels sont les 3 produits d'assurance-vie les plus adaptés à un profil senior ?"

📋 **Questions LNR Culture** :
7. "Pourquoi LNR Finance et pas un autre ?"
8. "Où vous voyez-vous dans 3 ans ?"

Voulez-vous que j'ajoute des questions spécifiques à un poste ?`;
    }

    if (lowerMsg.includes('onboarding') || lowerMsg.includes('intégration') || lowerMsg.includes('nouveau')) {
      return `Parcours d'onboarding LNR Finance — Semaine 1 :

📅 **Jour 1 — Welcome Day**
• 9h : Accueil + badge + matériel
• 10h : Présentation équipe + café d'intégration
• 11h : Formation CRM + outils internes
• 14h : Shadowing avec mentor assigné
• 16h : Quiz ludique sur l'histoire LNR

📅 **Jour 2 — Produit**
• Formation produits et services LNR
• Étude de cas réel avec correction

📅 **Jour 3 — Terrain**
• Observation de rendez-vous client
• Premier contact (supervisé)

📅 **Jour 4 — Autonomie**
• Premier rendez-vous en solo (feedback après)

📅 **Jour 5 — Bilan**
• Retour avec manager
• Objectifs mois 1 définis

Voulez-vous le programme complet du mois 1 ?`;
    }

    if (lowerMsg.includes('bonjour') || lowerMsg.includes('salut') || lowerMsg === 'bonjour' || lowerMsg === 'salut') {
      return `Bonjour ! 👔 Je suis Leo, votre responsable RH IA.

Comment puis-je vous aider aujourd'hui ?

Voici mes domaines d'expertise :

📝 **Rédiger des offres d'emploi** attractives
📋 **Screening de CV** avec scoring
🎤 **Grilles d'entretien** personnalisées
📅 **Planning RH** et organisation
📊 **Rapports et KPIs** recrutement
📚 **Onboarding** nouveaux collaborateurs

Quel est votre besoin ?`;
    }

    // Generic Leo responses (randomized)
    const genericLeo = [
      `Je vais analyser "${message}" du point de vue RH !

📋 **Analyse rapide** :
• Profil recherché : Expérimenté avec expertise en ${message}
• Niveau : Confirmé (3-5 ans)
• Salaire marché : 40-55K selon expérience
• Difficulté de recrutement : Modérée

🎯 **Stratégie de sourcing** :
1. LinkedIn (principale)
2. Cooptation interne
3. Welcome to the Jungle

Voulez-vous que je rédige l'offre complète ?`,

      `Pour "${message}", voici mon recommandation RH :

📊 **Benchmark marché** :
| Poste | Salaire min | Salaire max | Délai moyen |
|-------|-------------|-------------|-------------|
| Junior | 32K | 38K | 21 jours |
| Confirmé | 40K | 50K | 35 jours |
| Senior | 55K | 70K | 45 jours |

💡 **Conseil** : Mettez en avant la flexibilité (télétravail) et la culture d'entreprise dans l'offre. C'est ce qui fait la différence en 2026.

Besoin d'un rapport plus détaillé ?`,

      `Action plan pour "${message}" :

✅ **Étape 1** : Définir le profil idéal (compétences + culture fit)
✅ **Étape 2** : Rédiger l'offre avec mots-clés SEO
✅ **Étape 3** : Diffuser sur 3 canaux minimum
✅ **Étape 4** : Grille de screening + scoring
✅ **Étape 5** : Entretiens structurés (45 min)
✅ **Étape 6** : Offre + négociation
✅ **Étape 7** : Onboarding sur 30 jours

Temps estimé : 4-6 semaines. On commence par quelle étape ?`,
    ];
    const idx = pickRandomIndex(genericLeo.length, lastLeoIndex);
    lastLeoIndex = idx;
    return genericLeo[idx];
  }

  // Fallback
  return `C'est noté ! Je travaille sur "${message}" et je reviens vers vous avec une solution complète. Souhaitez-vous des précisions sur un point particulier ?`;
}
// FORCE REBUILD 1785750108
