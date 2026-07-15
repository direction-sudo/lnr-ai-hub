// ═══════════════════════════════════════════════════════════════
// IFTTT Service — Automatisation des publications réseaux sociaux
// Webhook Maker: https://maker.ifttt.com/trigger/{event}/with/key/{key}
// ═══════════════════════════════════════════════════════════════

import { env } from "./lib/env";

const IFTTT_KEY = env.iftttWebhookKey || "cwiD1tRy3wGlwvaY8opdv-";
const IFTTT_BASE = `https://maker.ifttt.com/trigger`;

// ─── Event names for each platform ───
const EVENTS = {
  facebook: "lnr_facebook_post",
  linkedin: "lnr_linkedin_post",
  instagram: "lnr_instagram_post",
  twitter: "lnr_twitter_post",
} as const;

export type Platform = keyof typeof EVENTS;

export interface PublishRequest {
  content: string;
  platform: Platform | Platform[];
  imageUrl?: string;
  hashtags?: string;
}

/**
 * Publish content to social media via IFTTT webhooks
 */
export async function publishToIFTTT(
  request: PublishRequest
): Promise<{ success: boolean; results: Record<string, boolean> }> {
  const platforms = Array.isArray(request.platform)
    ? request.platform
    : [request.platform];

  const results: Record<string, boolean> = {};

  for (const platform of platforms) {
    const eventName = EVENTS[platform];
    if (!eventName) {
      results[platform] = false;
      continue;
    }

    try {
      const url = `${IFTTT_BASE}/${eventName}/with/key/${IFTTT_KEY}`;

      const body: Record<string, string> = {
        value1: request.content,
        value2: request.hashtags || extractHashtags(request.content),
        value3: request.imageUrl || "",
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      results[platform] = res.ok && text.includes("Congratulations");

      console.log(`[IFTTT] ${platform}: ${results[platform] ? "OK" : "FAILED"} — ${text.slice(0, 100)}`);
    } catch (err) {
      console.error(`[IFTTT] ${platform} error:`, err);
      results[platform] = false;
    }
  }

  const allSuccess = Object.values(results).every(Boolean);
  return { success: allSuccess, results };
}

/**
 * Generate a post with Nora's AI and publish it automatically
 */
export async function generateAndPublish(
  topic: string,
  platform: Platform | Platform[],
  tone?: "professional" | "casual" | "viral"
): Promise<{ success: boolean; content: string; published: Record<string, boolean> }> {
  // Generate content (this would call the AI service)
  // For now, we return a template and publish it
  const content = await generatePostContent(topic, tone);

  const { success, results } = await publishToIFTTT({
    content,
    platform,
  });

  return { success, content, published: results };
}

/**
 * Extract hashtags from content or generate default ones
 */
function extractHashtags(content: string): string {
  const hashtags = content.match(/#[a-zA-Z0-9_]+/g);
  if (hashtags && hashtags.length > 0) {
    return hashtags.join(" ");
  }
  return "#LNRFinance #IA #Innovation";
}

/**
 * Generate post content based on topic and tone
 */
async function generatePostContent(
  topic: string,
  tone?: "professional" | "casual" | "viral"
): Promise<string> {
  const toneInstruction = tone === "viral"
    ? "Tone: viral, punchy, use emojis, short sentences"
    : tone === "casual"
    ? "Tone: casual, friendly, conversational"
    : "Tone: professional, structured";

  return `🚀 ${topic}

${toneInstruction}

Chez LNR Finance, nous croyons en l'innovation et l'excellence. Découvrez comment nous transformons le secteur financier avec l'IA.

💡 L'avenir est maintenant. Rejoignez-nous dans cette aventure !

#LNRFinance #IA #Innovation #Finance`;
}

/**
 * Schedule a post for later (placeholder for future implementation)
 */
export async function schedulePost(
  request: PublishRequest & { scheduledAt: Date }
): Promise<{ success: boolean; scheduledId: string }> {
  // Store in DB for later publishing
  const scheduledId = `sched_${Date.now()}`;

  // For now, publish immediately
  const { success } = await publishToIFTTT(request);

  return { success, scheduledId };
}
