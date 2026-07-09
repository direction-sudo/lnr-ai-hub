import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users (auth) ───
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Agents ───
export const agents = mysqlTable("agents", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 200 }).notNull(),
  description: text("description"),
  avatar: varchar("avatar", { length: 500 }),
  systemPrompt: text("systemPrompt").notNull(),
  capabilities: json("capabilities").$type<string[]>(),
  tools: json("tools").$type<string[]>(),
  personality: varchar("personality", { length: 20 }).default("balanced"),
  isDefault: mysqlEnum("isDefault", ["true", "false"]).default("false").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

// ─── Chat Messages ───
export const chatMessages = mysqlTable("chat_messages", {
  id: serial("id").primaryKey(),
  agentId: bigint("agentId", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  content: text("content").notNull(),
  sender: mysqlEnum("sender", ["user", "agent"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
