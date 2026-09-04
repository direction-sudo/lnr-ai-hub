import { authRouter } from "./auth-router";
import { chatRouter } from "./chat-router";
import { agentRouter } from "./agent-router";
import { socialRouter } from "./social-router";
import { iftttRouter } from "./ifttt-router";
import { adminRouter } from "./admin-router";
import { rhRouter } from "./rh-router";
import { patrimoineRouter } from "./patrimoine-router";
import { juliaRouter } from "./julia-router";
import { manueRouter } from "./manue-router";
import { charlyRouter } from "./charly-router";
import { samRouter } from "./sam-router";
import { tomRouter } from "./tom-router";
import { ronyRouter } from "./rony-router";
import { johnRouter } from "./john-router";
import { louRouter } from "./lou-router";
import { noraRouter } from "./nora-router";
import { createRouter, publicNoAuth } from "./middleware";

export const appRouter = createRouter({
  ping: publicNoAuth.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  chat: chatRouter,
  agent: agentRouter,
  social: socialRouter,
  ifttt: iftttRouter,
  admin: adminRouter,
  rh: rhRouter,
  patrimoine: patrimoineRouter,
  julia: juliaRouter,
  manue: manueRouter,
  charly: charlyRouter,
  sam: samRouter,
  tom: tomRouter,
  rony: ronyRouter,
  john: johnRouter,
  lou: louRouter,
  nora: noraRouter,
});

export type AppRouter = typeof appRouter;
