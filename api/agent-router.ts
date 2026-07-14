import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { agents, knowledgeDocs, agentAnalytics, agentCalls, chatMessages } from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const agentRouter = createRouter({
  // ─── Get agent by ID (auth required) ───
  getById: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db.select().from(agents).where(eq(agents.id, input.id));
      return rows[0] ?? null;
    }),

  // ─── Update agent (auth required) ───
  update: authedQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().min(1).max(100).optional(),
        role: z.string().min(1).max(200).optional(),
        description: z.string().max(2000).optional(),
        systemPrompt: z.string().min(10).max(10000).optional(),
        capabilities: z.array(z.string().max(50)).max(20).optional(),
        tools: z.array(z.string().max(50)).max(20).optional(),
        aiModel: z.enum(["kimi-latest", "kimi-k2"]).optional(),
        personality: z.enum(["professional", "friendly", "creative", "balanced"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(agents).set(data).where(eq(agents.id, id));
      return { ok: true };
    }),

  // ─── Knowledge: list docs (auth required) ───
  listKnowledge: authedQuery
    .input(z.object({ agentId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(knowledgeDocs)
        .where(eq(knowledgeDocs.agentId, input.agentId))
        .orderBy(desc(knowledgeDocs.createdAt));
    }),

  // ─── Knowledge: add doc (auth required) ───
  addKnowledge: authedQuery
    .input(
      z.object({
        agentId: z.number().int().positive(),
        filename: z.string().min(1).max(255),
        content: z.string().max(500000).optional(),
        size: z.number().int().max(10 * 1024 * 1024).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(knowledgeDocs).values({
        agentId: input.agentId,
        filename: input.filename,
        content: input.content,
        size: input.size,
      });
      return { ok: true };
    }),

  // ─── Knowledge: delete doc (auth required) ───
  deleteKnowledge: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(knowledgeDocs).where(eq(knowledgeDocs.id, input.id));
      return { ok: true };
    }),

  // ─── Analytics: get stats (auth required) ───
  getAnalytics: authedQuery
    .input(z.object({ agentId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();

      const daily = await db.select().from(agentAnalytics)
        .where(eq(agentAnalytics.agentId, input.agentId))
        .orderBy(desc(agentAnalytics.date))
        .limit(30);

      const msgCount = await db.select({ count: sql<number>`count(*)` })
        .from(chatMessages)
        .where(eq(chatMessages.agentId, input.agentId));

      const callCount = await db.select({ count: sql<number>`count(*)` })
        .from(agentCalls)
        .where(eq(agentCalls.agentId, input.agentId));

      const callDuration = await db.select({ total: sql<number>`coalesce(sum(${agentCalls.duration}), 0)` })
        .from(agentCalls)
        .where(eq(agentCalls.agentId, input.agentId));

      const docCount = await db.select({ count: sql<number>`count(*)` })
        .from(knowledgeDocs)
        .where(eq(knowledgeDocs.agentId, input.agentId));

      return {
        daily: daily.reverse(),
        totals: {
          messages: msgCount[0]?.count ?? 0,
          calls: callCount[0]?.count ?? 0,
          callDuration: callDuration[0]?.total ?? 0,
          knowledgeDocs: docCount[0]?.count ?? 0,
        },
      };
    }),

  // ─── Calls: list (auth required) ───
  listCalls: authedQuery
    .input(z.object({ agentId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(agentCalls)
        .where(eq(agentCalls.agentId, input.agentId))
        .orderBy(desc(agentCalls.createdAt))
        .limit(50);
    }),

  // ─── Calls: create (auth required) ───
  createCall: authedQuery
    .input(
      z.object({
        agentId: z.number().int().positive(),
        type: z.enum(["audio", "video"]).default("audio"),
        duration: z.number().int().max(86400).default(0),
        status: z.enum(["completed", "missed", "ongoing"]).default("completed"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(agentCalls).values({
        agentId: input.agentId,
        type: input.type,
        duration: input.duration,
        status: input.status,
      }).returning({ id: agentCalls.id });
      return { id: result[0].id };
    }),
});
