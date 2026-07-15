import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import {
  publishToIFTTT,
  generateAndPublish,
  schedulePost,
} from "./ifttt-service";
import type { Platform } from "./ifttt-service";
import { getDb } from "./queries/connection";
import { chatMessages } from "@db/schema";
import { chatCompletion, AGENT_SYSTEM_PROMPTS } from "./ai-service";
import { env } from "./lib/env";

export const iftttRouter = createRouter({
  // ─── Publish content to social media ───
  publish: publicQuery
    .input(
      z.object({
        content: z.string().min(1).max(5000),
        platforms: z.array(z.enum(["facebook", "linkedin", "instagram", "twitter"])),
        imageUrl: z.string().max(1000).optional(),
        hashtags: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await publishToIFTTT({
        content: input.content,
        platform: input.platforms as Platform[],
        imageUrl: input.imageUrl,
        hashtags: input.hashtags,
      });

      return {
        success: result.success,
        platforms: result.results,
        timestamp: new Date().toISOString(),
      };
    }),

  // ─── Generate content with AI + publish automatically ───
  generateAndPublish: publicQuery
    .input(
      z.object({
        topic: z.string().min(1).max(500),
        platforms: z.array(z.enum(["facebook", "linkedin", "instagram", "twitter"])),
        tone: z.enum(["professional", "casual", "viral"]).optional().default("professional"),
      })
    )
    .mutation(async ({ input }) => {
      // 1. Generate content with Kimi AI
      const apiKey = env.kimiApiKey;
      let generatedContent: string;

      if (apiKey) {
        try {
          const toneInstruction =
            input.tone === "viral"
              ? "Tone viral, punchy, phrases courtes, beaucoup d'emojis. Capturer l'attention en 3 secondes."
              : input.tone === "casual"
              ? "Tone décontracté, amical, conversationnel. Comme parler à un ami."
              : "Tone professionnel, structuré, avec des données chiffrées.";

          const systemPrompt = `${AGENT_SYSTEM_PROMPTS.nora}\n\n${toneInstruction}\n\nRègles:
- Rédige UN SEUL post prêt à publier (pas de versions alternatives)
- Commence directement avec le contenu (pas d'introduction type "Voici un post...")
- Inclut des hashtags pertinents à la fin
- Longueur optimale: 150-300 mots
- Langue: français`;

          generatedContent = await chatCompletion(apiKey, [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Rédige un post pour ${input.platforms.join(", ")} sur le sujet: "${input.topic}". C'est pour la page de LNR Finance.`,
            },
          ]);
        } catch (err) {
          console.error("[IFTTT] AI generation failed:", err);
          generatedContent = generateFallbackContent(input.topic, input.platforms);
        }
      } else {
        generatedContent = generateFallbackContent(input.topic, input.platforms);
      }

      // 2. Publish to IFTTT
      const publishResult = await publishToIFTTT({
        content: generatedContent,
        platform: input.platforms as Platform[],
      });

      return {
        success: publishResult.success,
        content: generatedContent,
        platforms: publishResult.results,
        tone: input.tone,
        timestamp: new Date().toISOString(),
      };
    }),

  // ─── Schedule a post for later ───
  schedule: publicQuery
    .input(
      z.object({
        content: z.string().min(1).max(5000),
        platforms: z.array(z.enum(["facebook", "linkedin", "instagram", "twitter"])),
        scheduledAt: z.string(), // ISO date string
        imageUrl: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await schedulePost({
        content: input.content,
        platform: input.platforms as Platform[],
        scheduledAt: new Date(input.scheduledAt),
      });

      return {
        success: result.success,
        scheduledId: result.scheduledId,
        scheduledAt: input.scheduledAt,
      };
    }),

  // ─── Get IFTTT connection status ───
  status: publicQuery.query(async () => {
    try {
      const testRes = await fetch(
        `https://maker.ifttt.com/trigger/lnr_test/with/key/cwiD1tRy3wGlwvaY8opdv-`,
        { method: "POST", body: JSON.stringify({ value1: "test" }) }
      );
      const text = await testRes.text();
      return {
        connected: testRes.ok && text.includes("Congratulations"),
        message: text.includes("Congratulations")
          ? "IFTTT connecté et opérationnel"
          : "IFTTT non connecté - vérifiez vos applets",
      };
    } catch {
      return {
        connected: false,
        message: "IFTTT inaccessible - vérifiez votre connexion",
      };
    }
  }),
});

// ─── Fallback content generator ───
function generateFallbackContent(
  topic: string,
  platforms: string[]
): string {
  return `🚀 ${topic}

L'intelligence artificielle transforme notre industrie. Chez LNR Finance, nous sommes à la pointe de cette révolution.

💡 Pourquoi l'IA est l'avenir :
✅ Automatisation intelligente des processus
✅ Analyse prédictive des tendances marché
✅ Expérience client personnalisée à l'échelle
✅ Productivité accrue pour nos équipes

L'IA ne remplace pas l'humain — elle le amplifie. 💪

Rejoignez LNR Finance dans cette transformation digitale. L'avenir s'écrit maintenant.

🔗 www.lnr-finance.com

#LNRFinance #IA #Innovation #TransformationDigitale #Finance`;
}
