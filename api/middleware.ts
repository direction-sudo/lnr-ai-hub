import { ErrorMessages } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { env } from "./lib/env";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARES — définis avant d'être utilisés
// ═══════════════════════════════════════════════════════════════

const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

const requireAuthOrApiKey = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (ctx.user) {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  if (env.kimiApiKey) {
    return next({
      ctx: {
        ...ctx,
        user: { id: 0, unionId: "system", name: "System", role: "user" as const },
        accessToken: env.kimiApiKey,
      },
    });
  }

  throw new TRPCError({
    code: "UNAUTHORIZED",
    message: ErrorMessages.unauthenticated,
  });
});

const requireAdmin = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: ErrorMessages.insufficientRole,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

// ═══════════════════════════════════════════════════════════════
// PROCEDURES — utilisent les middlewares déjà définis
// ═══════════════════════════════════════════════════════════════

// Strict auth — requires a logged-in user
export const publicQuery = t.procedure.use(requireAuth);

// No auth at all — for ping, OAuth callbacks, etc.
export const publicNoAuth = t.procedure;

// Auth or API Key — allows server-to-server calls with Kimi API key
export const apiKeyQuery = t.procedure.use(requireAuthOrApiKey);

export const authedQuery = t.procedure.use(requireAuth);
export const authedOrApiKeyQuery = t.procedure.use(requireAuthOrApiKey);
export const adminQuery = authedQuery.use(requireAdmin);
