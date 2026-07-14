import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { agents, chatMessages, agentAnalytics } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";
import { chatCompletion, AGENT_SYSTEM_PROMPTS } from "./ai-service";
import type { ChatCompletionMessage } from "./ai-service";
import { checkRateLimit } from "./rate-limit";

export const chatRouter = createRouter({
  // ─── List all agents (public — needed for landing page) ───
  listAgents: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.select().from(agents).orderBy(agents.id);
    return rows;
  }),

  // ─── Get single agent by slug (public) ───
  getAgent: publicQuery
    .input(z.object({ slug: z.string().min(1).max(50) }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(agents)
        .where(eq(agents.slug, input.slug));
      return rows[0] ?? null;
    }),

  // ─── Get chat history (auth required) ───
  getHistory: authedQuery
    .input(z.object({ agentId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.agentId, input.agentId))
        .orderBy(chatMessages.createdAt);
      return rows;
    }),

  // ─── Send message & get AI response (auth required + rate limited) ───
  sendMessage: authedQuery
    .input(
      z.object({
        agentId: z.number().int().positive(),
        content: z.string().min(1).max(4000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // ─── Rate limiting per user (60 req/min) ───
      const userRate = checkRateLimit(`user:${userId}:chat`, 60, 60 * 1000);
      if (!userRate.allowed) {
        return { response: "Vous avez atteint la limite de 60 messages par minute. Veuillez patienter." };
      }

      // ─── Rate limiting per agent (100 req/min) ───
      const agentRate = checkRateLimit(`agent:${input.agentId}:chat`, 100, 60 * 1000);
      if (!agentRate.allowed) {
        return { response: "Cet agent est temporairement surchargé. Veuillez réessayer dans un moment." };
      }

      // 1. Fetch agent config
      const agentRows = await db
        .select()
        .from(agents)
        .where(eq(agents.id, input.agentId));
      const agent = agentRows[0];
      if (!agent) throw new Error("Agent not found");

      // 2. Save user message + track analytics
      await db.insert(chatMessages).values({
        agentId: input.agentId,
        userId,
        content: input.content,
        sender: "user",
      });

      // Track in analytics
      const today = new Date().toISOString().split("T")[0];
      const existing = await db.select().from(agentAnalytics)
        .where(and(eq(agentAnalytics.agentId, input.agentId), eq(agentAnalytics.date, today)));
      if (existing.length > 0) {
        await db.update(agentAnalytics)
          .set({ messagesSent: (existing[0].messagesSent ?? 0) + 1 })
          .where(eq(agentAnalytics.id, existing[0].id));
      } else {
        await db.insert(agentAnalytics).values({ agentId: input.agentId, date: today, messagesSent: 1, messagesReceived: 0, tokensUsed: 0 });
      }

      // 3. Fetch recent history (last 20 messages for context)
      const history = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.agentId, input.agentId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(20);

      const chronological = [...history].reverse();

      // 4. Build messages for Kimi API
      const systemPrompt =
        agent.systemPrompt ||
        AGENT_SYSTEM_PROMPTS[agent.slug] ||
        AGENT_SYSTEM_PROMPTS.default;

      const apiMessages: ChatCompletionMessage[] = [
        { role: "system", content: systemPrompt },
        ...chronological.map((m) => ({
          role: m.sender as "user" | "assistant",
          content: m.content,
        })),
      ];

      // 5. Call Kimi AI with user's access token
      let aiResponse: string;

      if (ctx.accessToken) {
        try {
          aiResponse = await chatCompletion(ctx.accessToken, apiMessages, {
            temperature: 0.75,
            maxTokens: 2000,
          });
        } catch (err) {
          console.error("[AI] Error calling Kimi:", err);
          aiResponse = "Désolé, je rencontre un problème technique avec le service IA. Veuillez réessayer dans un moment.";
        }
      } else {
        aiResponse = `Je suis ${agent.name}, ${agent.role}.\n\nPour accéder à mes capacités d'IA avancées, veuillez vous connecter.\n\nCe que je peux faire :\n${(agent.capabilities as string[] || []).map(c => `• ${c}`).join('\n')}`;
      }

      // 6. Save AI response + track analytics
      await db.insert(chatMessages).values({
        agentId: input.agentId,
        userId,
        content: aiResponse,
        sender: "agent",
      });

      const existing2 = await db.select().from(agentAnalytics)
        .where(and(eq(agentAnalytics.agentId, input.agentId), eq(agentAnalytics.date, today)));
      if (existing2.length > 0) {
        await db.update(agentAnalytics)
          .set({ messagesReceived: (existing2[0].messagesReceived ?? 0) + 1 })
          .where(eq(agentAnalytics.id, existing2[0].id));
      }

      return { response: aiResponse };
    }),

  // ─── Create custom agent (auth required) ───
  createAgent: authedQuery
    .input(
      z.object({
        slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
        name: z.string().min(1).max(100),
        role: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        avatar: z.string().max(500).optional(),
        systemPrompt: z.string().min(10).max(10000),
        capabilities: z.array(z.string().max(50)).max(20).optional(),
        tools: z.array(z.string().max(50)).max(20).optional(),
        personality: z.enum(["professional", "friendly", "creative", "balanced"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      // Check slug uniqueness
      const existing = await db.select().from(agents).where(eq(agents.slug, input.slug));
      if (existing.length > 0) {
        throw new Error("Un agent avec ce slug existe déjà");
      }
      const result = await db.insert(agents).values({
        slug: input.slug,
        name: input.name,
        role: input.role,
        description: input.description,
        avatar: input.avatar,
        systemPrompt: input.systemPrompt,
        capabilities: input.capabilities ?? [],
        tools: input.tools ?? [],
        personality: input.personality ?? "balanced",
        isDefault: "false",
      }).returning({ id: agents.id });
      return { id: result[0].id };
    }),

  // ─── Delete agent (auth required) ───
  deleteAgent: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(chatMessages).where(eq(chatMessages.agentId, input.id));
      await db.delete(agents).where(eq(agents.id, input.id));
      return { ok: true };
    }),
});
