import { useState, useCallback, useEffect } from 'react';
import { sendMessageToAI } from '@/lib/ai-service';
import { useSocial } from './useSocial';

// ─── Types ───
export interface CampaignPost {
  id: string;
  platform: 'linkedin' | 'facebook' | 'instagram';
  content: string;
  status: 'draft' | 'approved' | 'published' | 'scheduled';
  scheduledAt?: Date;
  publishedAt?: Date;
  postId?: string; // ID du post publié sur le réseau social
}

export interface Campaign {
  id: string;
  name: string;
  topic: string;
  tone: 'professional' | 'casual' | 'inspirational' | 'humorous' | 'promotional';
  networks: ('linkedin' | 'facebook' | 'instagram')[];
  posts: CampaignPost[];
  status: 'draft' | 'generating' | 'review' | 'publishing' | 'published' | 'scheduled';
  createdAt: Date;
  updatedAt: Date;
  scheduledDate?: Date;
}

// ─── Storage ───
const STORAGE_KEY = 'lnr_campaigns';

function loadCampaigns(): Campaign[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored, (key, value) => {
      if (key === 'createdAt' || key === 'updatedAt' || key === 'scheduledAt' || key === 'publishedAt' || key === 'scheduledDate') {
        return value ? new Date(value) : value;
      }
      return value;
    });
  } catch {
    return [];
  }
}

function saveCampaigns(campaigns: Campaign[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
}

let idCounter = Date.now();

// ─── Prompts de génération par plateforme ───
const PLATFORM_PROMPTS: Record<string, string> = {
  linkedin: `Rédige un post LinkedIn professionnel en français sur le sujet demandé.
Règles :
- Ton professionnel mais accessible
- 150-300 mots
- 3-5 hashtags pertinents à la fin
- Structure : accroche + développement + CTA
- Utilise des paragraphes courts
- Emojis pertinents (2-3 maximum)`,

  facebook: `Rédige un post Facebook engageant en français sur le sujet demandé.
Règles :
- Ton chaleureux et conversationnel
- 100-250 mots
- Question ou CTA à la fin pour engager
- Format facile à lire (paragraphes courts)
- Emojis adaptés (3-5)`,

  instagram: `Rédige une légende Instagram captivante en français sur le sujet demandé.
Règles :
- Ton inspirant et visuel
- 80-200 mots maximum
- Accroche immédiate (première ligne captivante)
- 10-15 hashtags stratégiques à la fin
- CTA pour commenter/partager
- Emojis (4-6)`,
};

// ─── Hook ───
export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(loadCampaigns);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const { publishPost, isConnected } = useSocial();

  useEffect(() => {
    saveCampaigns(campaigns);
  }, [campaigns]);

  // ─── Create campaign ───
  const createCampaign = useCallback((data: {
    name: string;
    topic: string;
    tone: Campaign['tone'];
    networks: Campaign['networks'];
    postCount?: number;
  }) => {
    const newCampaign: Campaign = {
      id: `camp_${++idCounter}`,
      name: data.name,
      topic: data.topic,
      tone: data.tone,
      networks: data.networks,
      posts: [],
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCampaigns(prev => [newCampaign, ...prev]);
    return newCampaign.id;
  }, []);

  // ─── Generate posts with AI ───
  const generatePosts = useCallback(async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    setGenerating(true);
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId ? { ...c, status: 'generating' as const } : c
    ));

    const newPosts: CampaignPost[] = [];

    for (const network of campaign.networks) {
      const systemPrompt = PLATFORM_PROMPTS[network];
      const toneMap: Record<string, string> = {
        professional: 'professionnel et sérieux',
        casual: 'décontracté et amical',
        inspirational: 'inspirant et motivant',
        humorous: 'ludique et humoristique',
        promotional: 'promotionnel et persuasif',
      };

      const userMessage = `Sujet : "${campaign.topic}". Ton : ${toneMap[campaign.tone]}. Rédige le post maintenant.`;

      try {
        const aiResponse = await sendMessageToAI('nora', [], userMessage);
        // Extract just the post content from AI response
        const content = aiResponse
          .replace(/^(Voici|Voilà|Voici un post|Voilà un post).*?:\s*/i, '')
          .replace(/^Post (LinkedIn|Facebook|Instagram)[\s:]*\n*/i, '')
          .trim();

        newPosts.push({
          id: `post_${++idCounter}`,
          platform: network,
          content: content || `Post ${network} sur : ${campaign.topic}`,
          status: 'draft',
        });
      } catch {
        // Fallback
        newPosts.push({
          id: `post_${++idCounter}`,
          platform: network,
          content: getFallbackPost(network, campaign.topic, campaign.tone),
          status: 'draft',
        });
      }
    }

    setCampaigns(prev => prev.map(c =>
      c.id === campaignId
        ? { ...c, posts: newPosts, status: 'review' as const, updatedAt: new Date() }
        : c
    ));

    setGenerating(false);
  }, [campaigns]);

  // ─── Update post content ───
  const updatePost = useCallback((campaignId: string, postId: string, content: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== campaignId) return c;
      return {
        ...c,
        posts: c.posts.map(p => p.id === postId ? { ...p, content } : p),
        updatedAt: new Date(),
      };
    }));
  }, []);

  // ─── Approve post ───
  const approvePost = useCallback((campaignId: string, postId: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== campaignId) return c;
      return {
        ...c,
        posts: c.posts.map(p => p.id === postId ? { ...p, status: 'approved' as const } : p),
        updatedAt: new Date(),
      };
    }));
  }, []);

  // ─── Reject/reset post ───
  const rejectPost = useCallback((campaignId: string, postId: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== campaignId) return c;
      return {
        ...c,
        posts: c.posts.map(p => p.id === postId ? { ...p, status: 'draft' as const } : p),
        updatedAt: new Date(),
      };
    }));
  }, []);

  // ─── Publish all approved posts ───
  const publishCampaign = useCallback(async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return { success: 0, failed: 0 };

    setPublishing(true);
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId ? { ...c, status: 'publishing' as const } : c
    ));

    let success = 0;
    let failed = 0;

    for (const post of campaign.posts) {
      if (post.status !== 'approved') continue;

      const published = await publishPost(post.platform, post.content);

      if (published) {
        success++;
        setCampaigns(prev => prev.map(c => {
          if (c.id !== campaignId) return c;
          return {
            ...c,
            posts: c.posts.map(p =>
              p.id === post.id
                ? { ...p, status: 'published' as const, publishedAt: new Date() }
                : p
            ),
          };
        }));
      } else {
        failed++;
      }
    }

    setCampaigns(prev => prev.map(c =>
      c.id === campaignId
        ? { ...c, status: success > 0 ? 'published' as const : 'review' as const, updatedAt: new Date() }
        : c
    ));

    setPublishing(false);
    return { success, failed };
  }, [campaigns, publishPost]);

  // ─── Schedule campaign ───
  const scheduleCampaign = useCallback((campaignId: string, date: Date) => {
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId
        ? { ...c, scheduledDate: date, status: 'scheduled' as const, updatedAt: new Date() }
        : c
    ));
  }, []);

  // ─── Delete campaign ───
  const deleteCampaign = useCallback((campaignId: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
  }, []);

  // ─── Get campaign by ID ───
  const getCampaign = useCallback((id: string) => {
    return campaigns.find(c => c.id === id) ?? null;
  }, [campaigns]);

  // ─── Check scheduled campaigns ───
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCampaigns(prev => {
        let changed = false;
        const updated = prev.map(c => {
          if (c.status === 'scheduled' && c.scheduledDate && c.scheduledDate <= now) {
            changed = true;
            // Auto-publish when scheduled time is reached
            return { ...c, status: 'review' as const, scheduledDate: undefined };
          }
          return c;
        });
        return changed ? updated : prev;
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    campaigns,
    generating,
    publishing,
    createCampaign,
    generatePosts,
    updatePost,
    approvePost,
    rejectPost,
    publishCampaign,
    scheduleCampaign,
    deleteCampaign,
    getCampaign,
    isConnected,
  };
}

// ─── Fallback posts when AI is unavailable ───
function getFallbackPost(platform: string, topic: string, tone: string): string {
  const toneMap: Record<string, string> = {
    professional: 'de manière professionnelle',
    casual: 'avec simplicité et authenticité',
    inspirational: "pour vous inspirer et vous motiver",
    humorous: 'avec une touche d\'humour',
    promotional: 'pour vous faire découvrir',
  };

  const t = toneMap[tone] || '';

  if (platform === 'linkedin') {
    return `🚀 ${topic}

Aujourd'hui, j'ai le plaisir de vous parler ${t} de "${topic}".

Chez LNR Finance, nous croyons fermement que l'innovation est au cœur de la performance. C'est pourquoi nous avons développé cette initiative avec passion et expertise.

Les enjeux sont nombreux :
• Une meilleure efficacité opérationnelle
• Des résultats mesurables et durables
• Une approche centrée sur nos clients

N'hésitez pas à partager vos réflexions en commentaires. Votre feedback est précieux ! 💬

#Innovation #Finance #Excellence #LNRFinance #Stratégie`;
  }

  if (platform === 'facebook') {
    return `✨ Nouveau sur ${topic} !

On est super excités de vous partager ça ${t} ! 🎉

"${topic}" — c'est le fruit de nombreux mois de travail et d'écoute de vos retours.

Qu'est-ce que ça change pour vous ?
👉 Des processus simplifiés
👉 Plus de transparence
👉 Des résultats au rendez-vous

Et vous, qu'attendez-vous de cette nouveauté ? Dites-nous tout en commentaires ! 👇

#LNRFinance #Nouveau #Innovation`;
  }

  // instagram
  return `✨ ${topic} ✨

Le moment est enfin arrivé ${t} ! 🎉

"${topic}" — notre nouvelle initiative qui va tout changer.

💡 Ce qui nous rend fiers :
Des mois de travail, d'itérations et d'écoute pour vous offrir le meilleur.

🎯 Notre promesse :
Excellence, transparence et résultats.

Le futur s'écrit maintenant. 🚀

Taguez quelqu'un qui doit voir ça ! 👇

# LNRFinance #Innovation #Finance #Excellence #Nouveau #Startup #Vision2030 #Entrepreneuriat #Stratégie #Results`;
}
