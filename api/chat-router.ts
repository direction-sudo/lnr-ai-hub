import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { agents, chatMessages } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { chatCompletion, AGENT_SYSTEM_PROMPTS } from "./ai-service";
import type { ChatCompletionMessage } from "./ai-service";

export const chatRouter = createRouter({
  // ─── List all agents ───
  listAgents: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.select().from(agents).orderBy(agents.id);
    return rows;
  }),

  // ─── Get single agent by slug ───
  getAgent: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(agents)
        .where(eq(agents.slug, input.slug));
      return rows[0] ?? null;
    }),

  // ─── Get chat history for an agent ───
  getHistory: publicQuery
    .input(z.object({ agentId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.agentId, input.agentId))
        .orderBy(chatMessages.createdAt);
      return rows;
    }),

  // ─── Send message & get AI response ───
  sendMessage: publicQuery
    .input(
      z.object({
        agentId: z.number(),
        content: z.string().min(1).max(4000),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // 1. Fetch agent config
      const agentRows = await db
        .select()
        .from(agents)
        .where(eq(agents.id, input.agentId));
      const agent = agentRows[0];
      if (!agent) throw new Error("Agent not found");

      // 2. Save user message
      await db.insert(chatMessages).values({
        agentId: input.agentId,
        content: input.content,
        sender: "user",
      });

      // 3. Fetch recent history (last 20 messages for context)
      const history = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.agentId, input.agentId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(20);

      // Reverse to chronological order
      const chronological = history.reverse();

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

      // 5. Call Kimi AI
      let aiResponse: string;
      try {
        aiResponse = await chatCompletion(apiMessages, {
          temperature: 0.75,
          maxTokens: 2000,
        });
      } catch {
        // Fallback response if API fails
        aiResponse =
          "Désolé, je rencontre un problème de connexion avec mon service IA. Veuillez réessayer dans un moment.";
      }

      // 6. Save AI response
      await db.insert(chatMessages).values({
        agentId: input.agentId,
        content: aiResponse,
        sender: "agent",
      });

      return { response: aiResponse };
    }),

  // ─── Create custom agent ───
  createAgent: publicQuery
    .input(
      z.object({
        slug: z.string().min(1).max(50),
        name: z.string().min(1).max(100),
        role: z.string().min(1).max(200),
        description: z.string().optional(),
        avatar: z.string().optional(),
        systemPrompt: z.string().min(10),
        capabilities: z.array(z.string()).optional(),
        tools: z.array(z.string()).optional(),
        personality: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
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
      });
      return { id: Number(result[0].insertId) };
    }),

  // ─── Delete agent ───
  deleteAgent: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(chatMessages).where(eq(chatMessages.agentId, input.id));
      await db.delete(agents).where(eq(agents.id, input.id));
      return { ok: true };
    }),
});
