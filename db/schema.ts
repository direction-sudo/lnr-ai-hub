import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// ─── Users ───
export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  unionId: text("union_id").notNull().unique(),
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  lastSignInAt: integer("last_sign_in_at", { mode: "timestamp" }),
});

// ─── Agents ───
export const agents = sqliteTable("agents", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  description: text("description"),
  avatar: text("avatar"),
  systemPrompt: text("system_prompt"),
  capabilities: text("capabilities", { mode: "json" }).$type<string[]>().default([]),
  tools: text("tools", { mode: "json" }).$type<string[]>().default([]),
  personality: text("personality"),
  aiModel: text("ai_model").default("kimi-latest"),
  isDefault: text("is_default", { enum: ["true", "false"] }).default("false"),
  status: text("status", { enum: ["active", "archived"] }).default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ─── Chat Messages ───
export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  agentId: integer("agent_id", { mode: "number" }).notNull(),
  userId: integer("user_id", { mode: "number" }),
  content: text("content").notNull(),
  sender: text("sender", { enum: ["user", "agent", "system"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ─── Knowledge Docs ───
export const knowledgeDocs = sqliteTable("knowledge_docs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  agentId: integer("agent_id", { mode: "number" }).notNull(),
  filename: text("filename").notNull(),
  content: text("content"),
  size: integer("size"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ─── Agent Analytics ───
export const agentAnalytics = sqliteTable("agent_analytics", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  agentId: integer("agent_id", { mode: "number" }).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  messagesSent: integer("messages_sent").default(0),
  messagesReceived: integer("messages_received").default(0),
  tokensUsed: integer("tokens_used").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ─── Agent Calls ───
export const agentCalls = sqliteTable("agent_calls", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  agentId: integer("agent_id", { mode: "number" }).notNull(),
  type: text("type", { enum: ["audio", "video"] }).default("audio"),
  duration: integer("duration").default(0),
  status: text("status", { enum: ["completed", "missed", "ongoing"] }).default("completed"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
