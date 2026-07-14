import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { users } from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";

export type InsertUser = typeof users.$inferInsert;

export async function findUserByUnionId(unionId: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, unionId))
    .limit(1);
  return rows.at(0);
}

export async function upsertUser(data: InsertUser) {
  const db = getDb();
  const values = { ...data };

  // Check owner
  if (
    values.role === undefined &&
    values.unionId &&
    values.unionId === env.ownerUnionId
  ) {
    values.role = "admin";
  }

  // Check if user exists
  const existing = await findUserByUnionId(values.unionId || "");

  if (existing) {
    // Update
    await db
      .update(schema.users)
      .set({
        name: values.name || existing.name,
        email: values.email || existing.email,
        avatar: values.avatar || existing.avatar,
        role: values.role || existing.role,
        lastSignInAt: new Date(),
      })
      .where(eq(schema.users.id, existing.id));
  } else {
    // Insert
    await db.insert(schema.users).values(values);
  }
}
