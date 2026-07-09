import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { agents, knowledgeDocs, agentAnalytics, agentCalls, chatMessages } from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const agentRouter = createRouter({
  // ─── Get agent by ID ───
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db.select().from(agents).where(eq(agents.id, input.id));
      return rows[0] ?? null;
    }),

  // ─── Update agent ───
  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        role: z.string().optional(),
        description: z.string().optional(),
        systemPrompt: z.string().optional(),
        capabilities: z.array(z.string()).optional(),
        tools: z.array(z.string()).optional(),
        aiModel: z.string().optional(),
        personality: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(agents).set(data).where(eq(agents.id, id));
      return { ok: true };
    }),

  // ─── Knowledge: list docs ───
  listKnowledge: publicQuery
    .input(z.object({ agentId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(knowledgeDocs)
        .where(eq(knowledgeDocs.agentId, input.agentId))
        .orderBy(desc(knowledgeDocs.createdAt));
    }),

  // ─── Knowledge: add doc ───
  addKnowledge: publicQuery
    .input(
      z.object({
        agentId: z.number(),
        filename: z.string(),
        content: z.string().optional(),
        size: z.number().optional(),
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

  // ─── Knowledge: delete doc ───
  deleteKnowledge: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(knowledgeDocs).where(eq(knowledgeDocs.id, input.id));
      return { ok: true };
    }),

  // ─── Analytics: get stats ───
  getAnalytics: publicQuery
    .input(z.object({ agentId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      // Daily stats for last 30 days
      const daily = await db.select().from(agentAnalytics)
        .where(eq(agentAnalytics.agentId, input.agentId))
        .orderBy(desc(agentAnalytics.date))
        .limit(30);

      // Total messages
      const msgCount = await db.select({ count: sql<number>`count(*)` })
        .from(chatMessages)
        .where(eq(chatMessages.agentId, input.agentId));

      // Total calls
      const callCount = await db.select({ count: sql<number>`count(*)` })
        .from(agentCalls)
        .where(eq(agentCalls.agentId, input.agentId));

      // Total call duration
      const callDuration = await db.select({ total: sql<number>`coalesce(sum(${agentCalls.duration}), 0)` })
        .from(agentCalls)
        .where(eq(agentCalls.agentId, input.agentId));

      // Knowledge docs count
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

  // ─── Analytics: track message ───
  trackMessage: publicQuery
    .input(
      z.object({
        agentId: z.number(),
        type: z.enum(["sent", "received"]),
        tokens: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const today = new Date().toISOString().split("T")[0];

      const existing = await db.select().from(agentAnalytics)
        .where(
          and(
            eq(agentAnalytics.agentId, input.agentId),
            eq(agentAnalytics.date, today)
          )
        );

      if (existing.length > 0) {
        const updates: Record<string, unknown> = {};
        if (input.type === "sent") {
          updates.messagesSent = (existing[0].messagesSent ?? 0) + 1;
        } else {
          updates.messagesReceived = (existing[0].messagesReceived ?? 0) + 1;
        }
        if (input.tokens) {
          updates.tokensUsed = (existing[0].tokensUsed ?? 0) + input.tokens;
        }
        await db.update(agentAnalytics).set(updates)
          .where(eq(agentAnalytics.id, existing[0].id));
      } else {
        await db.insert(agentAnalytics).values({
          agentId: input.agentId,
          date: today,
          messagesSent: input.type === "sent" ? 1 : 0,
          messagesReceived: input.type === "received" ? 1 : 0,
          tokensUsed: input.tokens ?? 0,
        });
      }
      return { ok: true };
    }),

  // ─── Calls: list ───
  listCalls: publicQuery
    .input(z.object({ agentId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(agentCalls)
        .where(eq(agentCalls.agentId, input.agentId))
        .orderBy(desc(agentCalls.createdAt))
        .limit(50);
    }),

  // ─── Calls: create ───
  createCall: publicQuery
    .input(
      z.object({
        agentId: z.number(),
        type: z.enum(["audio", "video"]).default("audio"),
        duration: z.number().default(0),
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
      });
      return { id: Number(result[0].insertId) };
    }),

  // ─── Calls: end ───
  endCall: publicQuery
    .input(z.object({ id: z.number(), duration: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(agentCalls)
        .set({ duration: input.duration, status: "completed" })
        .where(eq(agentCalls.id, input.id));
      return { ok: true };
    }),
});
