import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import { useState, type ReactNode } from "react";
import type { AppRouter } from "../../api/router";
import {
  MOCK_AGENTS,
  MOCK_MESSAGES,
  MOCK_ANALYTICS,
  MOCK_CALLS,
  MOCK_KNOWLEDGE,
} from "./mockData";

export const trpc = createTRPCReact<AppRouter>();

// ─── Backend URL ───
// Use Cloudflare tunnel backend when available, fallback to localhost
// ═══ URL BACKEND RENDER ═══
// Remplacer par votre URL Render après le premier déploiement
// Exemple: "https://lnr-ai-hub-backend.onrender.com"
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://lnr-ai-hub.onrender.com";

function getBaseUrl() {
  if (typeof window !== "undefined") return BACKEND_URL;
  return BACKEND_URL;
}

// ─── Offline mock store for mutations ───
let mockAgents = [...MOCK_AGENTS];
let mockMessages: Record<number, Array<{ id: number; agentId: number; role: "user" | "agent"; content: string; createdAt: Date }>> = {
  1: [{ id: 1, agentId: 1, role: "agent" as const, content: "Bonjour ! Je suis Nora, votre agent de communication. Comment puis-je vous aider aujourd'hui ?", createdAt: new Date() }],
  2: [{ id: 2, agentId: 2, role: "agent" as const, content: "Bonjour ! Je suis Leo, votre agent RH. Prêt à optimiser vos processus recrutement ?", createdAt: new Date() }],
};
let mockKnowledge = [...MOCK_KNOWLEDGE];
let mockCalls = [...MOCK_CALLS];
let nextId = 100;

// ─── Mock response generator ───
function getMockResponse(reqBody: unknown): Response {
  const body = JSON.stringify({
    result: {
      data: {
        json: null,
      },
    },
  });
  return new Response(body, { status: 200, headers: { "Content-Type": "application/json" } });
}

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error: unknown) => {
              if (error && typeof error === "object") {
                const err = error as { data?: { code?: string } };
                if (err.data?.code === "UNAUTHORIZED" || err.data?.code === "FORBIDDEN") {
                  return false;
                }
              }
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          transformer: superjson,
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            return {
              "x-trpc-source": "react",
            };
          },
          async fetch(url, options) {
            try {
              const res = await fetch(url, {
                ...options,
                credentials: "omit", // CORS with different origin
                mode: "cors",
              });
              if (!res.ok) {
                console.warn("[tRPC] Backend error:", res.status, await res.text().catch(() => ""));
              }
              return res;
            } catch (err) {
              console.warn("[tRPC] Backend unreachable, using mock:", err);
              // ─── Backend unreachable → return mock data ───
              const bodyStr = options?.body?.toString() ?? "";
              const requests = JSON.parse(bodyStr || "[]");
              const results = requests.map((req: { path: string; input: { json: Record<string, unknown> } }) => {
                const { path, input } = req;
                const json = input?.json ?? {};
                let data: unknown = null;

                // ─── Auth ───
                if (path === "auth.me") {
                  data = null; // Not authenticated in static mode
                } else if (path === "auth.logout") {
                  data = { success: true };
                }
                // ─── Chat ───
                else if (path === "chat.listAgents") {
                  data = mockAgents;
                } else if (path === "chat.getHistory") {
                  const agentId = Number(json.agentId);
                  data = mockMessages[agentId] ?? [];
                } else if (path === "chat.sendMessage") {
                  const agentId = Number(json.agentId);
                  const content = String(json.content ?? "").toLowerCase();
                  const userMsg = {
                    id: ++nextId,
                    agentId,
                    role: "user" as const,
                    content: String(json.content ?? ""),
                    createdAt: new Date(),
                  };
                  mockMessages[agentId] = [...(mockMessages[agentId] ?? []), userMsg];

                  // ─── Smart mock responses based on keywords ───
                  let responseText = "";
                  const originalContent = String(json.content ?? "");

                  if (agentId === 1) {
                    // ─── NORA: Communication Agent ───
                    if (content.includes("post") && content.includes("linkedin")) {
                      responseText = `Voici un post LinkedIn prêt à publier pour LNR Finance :

🚀 **L'IA transforme le secteur financier — et LNR Finance est à la pointe !**

Chez LNR Finance, nous croyons que l'intelligence artificielle n'est pas une menace, mais une opportunité. Nos équipes utilisent l'IA pour :

📊 **Analyser les tendances marché** en temps réel
🤖 **Automatiser les tâches répétitives** pour se concentrer sur la stratégie
💡 **Personnaliser l'expérience client** à l'échelle

L'avenir de la finance est hybride : l'humain apporte le jugement, l'IA apporte la puissance. Ensemble, on va plus loin.

💬 Et vous, comment utilisez-vous l'IA dans votre métier ?

#LNRFinance #IA #Innovation #Finance #IntelligenceArtificielle #TransformationDigitale`;
                    } else if (content.includes("post") && (content.includes("facebook") || content.includes("insta"))) {
                      responseText = `Voici une version pour Facebook & Instagram :

📱 **Facebook**
L'IA révolutionne la finance ! 🚀 Chez LNR Finance, on embrasse cette révolution pour mieux vous servir. Analyses prédictives, automatisation intelligente, expérience client personnalisée... L'avenir s'écrit maintenant ! 💡

#IA #Finance #Innovation #LNRFinance

📸 **Instagram**
Swipe pour découvrir comment LNR Finance utilise l'IA au quotidien ➡️

L'intelligence artificielle ne remplace pas l'humain — elle le renforce. 🤝✨

Chez LNR Finance, on utilise l'IA pour :
→ Analyser les marchés en temps réel 📊
→ Personnaliser chaque conseil 💬
→ Anticiper vos besoins 🔮

L'avenir est maintenant. Et il est brilliant. 🌟

#LNRFinance #IA #Fintech #Innovation #Finance`;
                    } else if (content.includes("call center") || content.includes("callcenter") || content.includes("centre d'appel")) {
                      responseText = `Voici un post sur l'IA dans les centres d'appel :

🤖 **L'IA ne remplace pas l'agent — elle le surpasse !**

Les centres d'appel vivent une révolution. L'IA ne vient pas pour supprimer des emplois, mais pour **les transformer**.

✅ **Ce que l'IA apporte :**
- Réponses instantanées 24/7 aux questions fréquentes
- Analyse d'émotion pour prioriser les appels complexes
- Transcription automatique et synthèse des conversations
- Coaching temps réel pour les nouveaux agents

👨‍💼 **Ce que l'humain apporte :**
- Empathie et jugement sur les cas complexes
- Créativité et esprit critique
- Relation client premium

📈 **Résultat :** Les agents gagnent en productivité, les clients en satisfaction, et les entreprises en rentabilité.

💬 **Notre conviction chez LNR Finance :** L'IA développe ce métier. Ne craignez pas le changement, embrassez-le !

#IA #CallCenter #Innovation #RelationClient #LNRFinance #TransformationDigitale`;
                    } else if (content.includes("post") || content.includes("créer") || content.includes("redige") || content.includes("rédige")) {
                      responseText = `Voici un post LinkedIn prêt à publier :

🚀 **L'IA au service de votre stratégie — LNR Finance innove !**

Dans un monde en constante évolution, LNR Finance mise sur l'intelligence artificielle pour offrir des services financiers toujours plus performants.

🔍 **Analyse prédictive** pour anticiper les tendances
⚡ **Automatisation intelligente** pour plus de réactivité
🎯 **Personnalisation poussée** pour une expérience sur mesure

On ne remplace pas l'humain. On le amplifie. 💪

Qu'en pensez-vous ? Partagez votre vision de l'IA dans la finance ! 👇

#LNRFinance #IntelligenceArtificielle #Innovation #Finance #Tech`;
                    } else if (content.includes("calendrier") || content.includes("planning") || content.includes("éditorial")) {
                      responseText = `📅 **Calendrier éditorial LNR Finance — Semaine type**

**Lundi 9h** — Post motivationnel 💪
*"Bien commencer la semaine avec LNR Finance"*

**Mardi 14h** — Astuce finance / IA 💡
*Conseil pratique ou explication d'un concept*

**Mercredi 11h** — Témoignage client 🗣️
*Storytelling sur une réussite client*

**Jeudi 16h** — Veille sectorielle 📊
*Actualités fintech, IA, finance*

**Vendredi 10h** — Bilan de la semaine 📈
*Chiffres, insights, anticipation du week-end*

Souhaitez-vous que je développe l'un de ces posts ?`;
                    } else if (content.includes("hashtag")) {
                      responseText = `📌 **Hashtags recommandés pour LNR Finance :**

**Généralistes (forte portée) :**
#Finance #IA #Innovation #Fintech #TransformationDigitale

**Sectoriels (audience cible) :**
#ConseilFinancier #GestionDePatrimoine #Investissement #Bourse #Crypto

**Marque (notoriété) :**
#LNRFinance #ExpertiseLNR #FinanceIntelligente

**Tendance (engagement) :**
#IntelligenceArtificielle #Web3 #Blockchain #GreenFinance

💡 **Conseil :** Utilisez 3-5 hashtags par post, mélangez généralistes et sectoriels pour maximiser votre reach !`;
                    } else if (content.includes("bonjour") || content.includes("salut") || content.includes("hello")) {
                      responseText = `Bonjour ! 👋 Je suis Nora, votre experte en communication digitale.

Je peux vous aider à :
📝 Rédiger des posts LinkedIn, Facebook, Instagram
📅 Créer un calendrier éditorial
📊 Analyser vos performances réseaux sociaux
🏷️ Optimiser vos hashtags
📧 Rédiger des newsletters

Qu'est-ce que vous souhaitez créer aujourd'hui ?`;
                    } else {
                      responseText = `Je comprends votre demande : *"${originalContent}"*

Pour vous donner la meilleure réponse, pourriez-vous préciser :

1️⃣ **Quel réseau social ?** (LinkedIn, Facebook, Instagram, TikTok...)
2️⃣ **Quel ton ?** (professionnel, décontracté, viral...)
3️⃣ **Quel objectif ?** (notoriété, engagement, recrutement, vente...)

Sinon, je peux vous proposer un post standard pour LNR Finance ! 🚀`;
                    }
                  } else if (agentId === 2) {
                    // ─── LEO: HR Agent ───
                    if (content.includes("fiche de poste") || content.includes("offre d'emploi") || content.includes("recrutement")) {
                      responseText = `Voici une fiche de poste type :

---

💼 **Développeur Full Stack H/F — LNR Finance**

**Localisation :** Paris / Remote hybride
**Type :** CDI
**Salaire :** 45-65K€ selon expérience

🎯 **Mission :**
Rejoignez LNR Finance et participez à la construction de notre plateforme digitale. Vous serez au cœur de notre transformation technologique.

**Responsabilités :**
- Concevoir et développer des applications web performantes
- Participer aux choix d'architecture technique
- Collaborer avec les équipes produit et design
- Assurer la qualité du code (tests, revues)

**Profil recherché :**
🎓 Bac+5 en informatique ou équivalent
💻 3+ ans d'expérience en développement web
🔧 Maîtrise de React, Node.js, TypeScript
📊 Expérience avec les bases de données SQL/NoSQL
🤝 Esprit d'équipe et passion pour l'innovation

**Avantages :**
🏠 Télétravail 3j/semaine
🏥 Mutuelle premium
📈 Plan d'épargne entreprise
🍕 Tickets restaurant Swile
🏋️ Budget sport & bien-être

📩 **Postulez :** rh@lnr-finance.com

---

Voulez-vous adapter cette fiche pour un autre poste ?`;
                    } else if (content.includes("entretien") || content.includes("interview")) {
                      responseText = `🎯 **Grille d'entretien — Développeur Full Stack**

**1. Compétences techniques (15 min)**
- Décrivez un projet complexe que vous avez mené
- Comment gérez-vous la dette technique ?
- Quelle est votre approche des tests automatisés ?

**2. Culture d'entreprise (10 min)**
- Comment travaillez-vous en équipe agile ?
- Racontez un désaccord technique et comment vous l'avez résolu
- Qu'est-ce qui vous motive chez LNR Finance ?

**3. Mise en situation (10 min)**
- *"Un bug critique est remonté en production vendredi 17h. Que faites-vous ?"*
- *"Vous devez convaincre votre lead d'adopter une nouvelle technologie. Comment procédez-vous ?"*

**4. Questions du candidat (5 min)**

**Échelle d'évaluation :** ⭐ à ⭐⭐⭐⭐⭐ par critère

Souhaitez-vous une grille pour un autre profil ?`;
                    } else if (content.includes("onboarding")) {
                      responseText = `📋 **Plan d'onboarding — Semaine 1**

**J-1 : Avant l'arrivée**
✅ Matériel prêt (PC, badge, accès)
✅ Mail de bienvenue envoyé
✅ Parrain désigné

**Jour 1 : Bienvenue**
🕘 9h — Accueil RH + remise du matériel
🕙 10h — Présentation de l'entreprise (histoire, valeurs, équipes)
🕛 12h — Déjeuner avec le parrain
🕑 14h — Configuration des outils + accès
🕓 16h — Rencontre avec le manager + définition des objectifs

**Jour 2-3 : Immersion technique**
🔧 Accès au repo + documentation
🔧 Première tâche guidée (easy win)
🔧 Session de pair programming

**Jour 4-5 : Autonomie progressive**
📌 Première tâche en autonomie
📌 Réunion de feedback
📌 Plan de formation personnalisé

Ce plan réduit le time-to-productivity de 40% ! Souhaitez-vous le détailler ?`;
                    } else if (content.includes("bonjour") || content.includes("salut")) {
                      responseText = `Bonjour ! 👔 Je suis Leo, votre expert RH.

Je peux vous aider à :
📝 Rédiger des fiches de poste
🎯 Préparer des grilles d'entretien
📋 Créer des plans d'onboarding
📊 Analyser vos KPIs RH (time-to-hire, turnover...)
💰 Conseiller sur la rémunération

Quel est votre besoin aujourd'hui ?`;
                    } else {
                      responseText = `Je comprends votre demande : *"${originalContent}"*

Pour vous accompagner au mieux, pourriez-vous préciser :

1️⃣ **Quel domaine RH ?** (recrutement, onboarding, formation, paie...)
2️⃣ **Quel est votre objectif ?** (attirer des talents, réduire le turnover...)
3️⃣ **Quel format souhaitez-vous ?** (document, tableau, process...)

Je suis là pour vous aider ! 💼`;
                    }
                  }

                  const agentMsg = {
                    id: ++nextId,
                    agentId,
                    role: "agent" as const,
                    content: responseText,
                    createdAt: new Date(),
                  };
                  setTimeout(() => {
                    mockMessages[agentId] = [...(mockMessages[agentId] ?? []), agentMsg];
                  }, 100);
                  data = agentMsg;
                } else if (path === "chat.createAgent") {
                  const newAgent = {
                    ...json,
                    id: ++nextId,
                    status: "active",
                    createdAt: new Date(),
                  };
                  mockAgents.push(newAgent as typeof mockAgents[0]);
                  data = newAgent;
                } else if (path === "chat.deleteAgent") {
                  const id = Number(json.id);
                  mockAgents = mockAgents.filter((a) => a.id !== id);
                  data = { success: true };
                }
                // ─── Agent detail ───
                else if (path === "agent.getById") {
                  data = mockAgents.find((a) => a.id === Number(json.id)) ?? null;
                } else if (path === "agent.update") {
                  const id = Number(json.id);
                  mockAgents = mockAgents.map((a) =>
                    a.id === id ? { ...a, ...(json.data as object) } : a
                  );
                  data = mockAgents.find((a) => a.id === id);
                } else if (path === "agent.getAnalytics") {
                  data = MOCK_ANALYTICS;
                } else if (path === "agent.listCalls") {
                  data = mockCalls.filter((c) => c.agentId === Number(json.agentId));
                } else if (path === "agent.createCall") {
                  const newCall = {
                    id: ++nextId,
                    ...json,
                    status: "scheduled",
                  };
                  mockCalls.push(newCall as typeof mockCalls[0]);
                  data = newCall;
                } else if (path === "agent.listKnowledge") {
                  data = mockKnowledge.filter((k) => k.agentId === Number(json.agentId));
                } else if (path === "agent.addKnowledge") {
                  const newK = {
                    id: ++nextId,
                    ...json,
                    type: json.type ?? "document",
                    createdAt: new Date(),
                  };
                  mockKnowledge.push(newK as typeof mockKnowledge[0]);
                  data = newK;
                } else if (path === "agent.deleteKnowledge") {
                  mockKnowledge = mockKnowledge.filter((k) => k.id !== Number(json.id));
                  data = { success: true };
                }

                return { result: { data: { json: data } } };
              });

              return new Response(JSON.stringify(results), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
