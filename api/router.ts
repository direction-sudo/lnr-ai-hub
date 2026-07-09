import { authRouter } from "./auth-router";
import { chatRouter } from "./chat-router";
import { agentRouter } from "./agent-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  chat: chatRouter,
  agent: agentRouter,
});

export type AppRouter = typeof appRouter;
