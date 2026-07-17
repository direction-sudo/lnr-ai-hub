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

// ═══════════════════════════════════════════════════════════════
// LEO RH MODULE — Tables pour le recrutement et la gestion RH
// ═══════════════════════════════════════════════════════════════

// ─── Job Offers ───
export const jobOffers = sqliteTable("job_offers", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  department: text("department"),
  location: text("location"),
  contractType: text("contract_type", { enum: ["cdi", "cdd", "stage", "alternance", "freelance"] }).default("cdi"),
  description: text("description"),
  requirements: text("requirements"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  status: text("status", { enum: ["draft", "published", "archived", "filled"] }).default("draft"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ─── Candidates ───
export const candidates = sqliteTable("candidates", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  linkedinUrl: text("linkedin_url"),
  source: text("source", { enum: ["linkedin", "indeed", "welcometothejungle", "site_web", "recommandation", "candidature_spontanee", "autre"] }).default("autre"),
  currentPosition: text("current_position"),
  experienceYears: integer("experience_years"),
  skills: text("skills", { mode: "json" }).$type<string[]>().default([]),
  education: text("education"),
  summary: text("summary"),
  cvContent: text("cv_content"), // Contenu texte extrait du CV
  cvFileName: text("cv_file_name"),
  score: integer("score").default(0), // 0-100
  status: text("status", { enum: ["new", "screening", "interview", "offer", "hired", "rejected", "onboarding"] }).default("new"),
  jobOfferId: integer("job_offer_id", { mode: "number" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ─── Interviews ───
export const interviews = sqliteTable("interviews", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  candidateId: integer("candidate_id", { mode: "number" }).notNull(),
  jobOfferId: integer("job_offer_id", { mode: "number" }),
  title: text("title").notNull(),
  type: text("type", { enum: ["phone", "video", "onsite", "technical", "final"] }).default("phone"),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }).notNull(),
  duration: integer("duration").default(60), // minutes
  interviewer: text("interviewer"),
  location: text("location"),
  notes: text("notes"),
  rating: integer("rating"), // 1-5
  feedback: text("feedback"),
  status: text("status", { enum: ["scheduled", "completed", "cancelled", "no_show"] }).default("scheduled"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ─── Onboarding Steps ───
export const onboardingSteps = sqliteTable("onboarding_steps", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  candidateId: integer("candidate_id", { mode: "number" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category", { enum: ["admin", "technique", "formation", "integration", "evaluation"] }).default("admin"),
  isCompleted: integer("is_completed", { mode: "boolean" }).default(false),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  dueDate: integer("due_date", { mode: "timestamp" }),
  assignedTo: text("assigned_to"),
  order: integer("order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ─── HR Metrics ───
export const hrMetrics = sqliteTable("hr_metrics", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  date: text("date").notNull(), // YYYY-MM-DD
  jobOfferId: integer("job_offer_id", { mode: "number" }),
  metricType: text("metric_type", { enum: [
    "time_to_hire",           // Jours moyens pour recruter
    "cost_per_hire",          // Coût moyen par recrutement
    "applications_count",     // Nombre de candidatures
    "interviews_count",       // Nombre d'entretiens
    "offers_accepted",        // Offres acceptées
    "offers_declined",        // Offres refusées
    "onboarding_completion",  // Taux completion onboarding
    "source_effectiveness",   // Efficacité source
    "screening_rate",         // Taux passage screening
    "conversion_rate",        // Taux conversion entretien -> embauche
  ] }).notNull(),
  value: integer("value").notNull(),
  unit: text("unit").default("count"), // count, percentage, days, euros
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
