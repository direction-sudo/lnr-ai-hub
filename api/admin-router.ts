// ═══════════════════════════════════════════════════════════════
// Admin Router — Database management & monitoring
// ═══════════════════════════════════════════════════════════════

import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { env } from "./lib/env";

export const adminRouter = createRouter({
  // ─── List all tables ───
  listTables: publicQuery.query(async () => {
    const db = getDb();
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      )
      .all() as { name: string }[];
    return tables.map((t) => t.name);
  }),

  // ─── Get table schema ───
  tableSchema: publicQuery
    .input(z.object({ table: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const columns = db
        .prepare(`PRAGMA table_info(${input.table})`)
        .all() as {
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: string | null;
        pk: number;
      }[];
      return columns;
    }),

  // ─── Query table data ───
  queryTable: publicQuery
    .input(
      z.object({
        table: z.string(),
        limit: z.number().min(1).max(1000).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const rows = db
        .prepare(
          `SELECT * FROM ${input.table} LIMIT ? OFFSET ?`
        )
        .all(input.limit, input.offset);
      const count = (
        db
          .prepare(`SELECT COUNT(*) as count FROM ${input.table}`)
          .get() as { count: number }
      ).count;
      return { rows, count };
    }),

  // ─── Execute raw SQL (read-only) ───
  rawQuery: publicQuery
    .input(z.object({ sql: z.string().max(5000) }))
    .query(async ({ input }) => {
      // Only allow SELECT statements for safety
      const trimmed = input.sql.trim().toLowerCase();
      if (!trimmed.startsWith("select") && !trimmed.startsWith("pragma")) {
        throw new Error("Only SELECT and PRAGMA queries are allowed");
      }
      const db = getDb();
      const rows = db.prepare(input.sql).all();
      return rows;
    }),

  // ─── Get stats ───
  stats: publicQuery.query(async () => {
    const db = getDb();
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      )
      .all() as { name: string }[];

    const stats: Record<string, number> = {};
    for (const t of tables) {
      const result = db
        .prepare(`SELECT COUNT(*) as count FROM ${t.name}`)
        .get() as { count: number };
      stats[t.name] = result.count;
    }

    return {
      tables: stats,
      totalTables: tables.length,
      dbPath: env.databaseUrl,
    };
  }),
});
