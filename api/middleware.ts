import { ErrorMessages } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { env } from "./lib/env";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

// ─── Auth middleware ───
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

// ─── Auth or API Key middleware (allows access with Kimi API key even without user auth) ───
const requireAuthOrApiKey = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  // If user is authenticated, allow
  if (ctx.user) {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  // If Kimi API key is configured, allow with a system user context
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

// ─── Admin middleware ───
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

export const authedQuery = t.procedure.use(requireAuth);
export const authedOrApiKeyQuery = t.procedure.use(requireAuthOrApiKey);
export const adminQuery = authedQuery.use(requireAdmin);
