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
// MIDDLEWARE FACTORIES — fonctions hoisted, appelées inline
// ═══════════════════════════════════════════════════════════════

function createRequireAuth() {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: ErrorMessages.unauthenticated,
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

function createRequireAuthOrApiKey() {
  return t.middleware(async (opts) => {
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
}

function createRequireAdmin() {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole,
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

// ═══════════════════════════════════════════════════════════════
// PROCEDURES — middlewares créés via factory (hoisted-safe)
// ═══════════════════════════════════════════════════════════════

export const publicQuery = t.procedure.use(createRequireAuth());
export const publicNoAuth = t.procedure;
export const apiKeyQuery = t.procedure.use(createRequireAuthOrApiKey());
export const authedQuery = t.procedure.use(createRequireAuth());
export const authedOrApiKeyQuery = t.procedure.use(createRequireAuthOrApiKey());
export const adminQuery = authedQuery.use(createRequireAdmin());
