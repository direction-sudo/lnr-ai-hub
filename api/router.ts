import { authRouter } from "./auth-router";
import { chatRouter } from "./chat-router";
import { agentRouter } from "./agent-router";
import { socialRouter } from "./social-router";
import { iftttRouter } from "./ifttt-router";
import { adminRouter } from "./admin-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  chat: chatRouter,
  agent: agentRouter,
  social: socialRouter,
  ifttt: iftttRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
