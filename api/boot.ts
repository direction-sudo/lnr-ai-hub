import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

// ─── 1. Security Headers (CSP, HSTS, X-Frame-Options, etc.) ───
app.use(
  "*",
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", env.kimiOpenUrl],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
    },
    crossOriginEmbedderPolicy: false,
    strictTransportSecurity: env.isProduction
      ? "max-age=63072000; includeSubDomains; preload"
      : false,
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "strict-origin-when-cross-origin",
    permissionsPolicy: {
      camera: false,
      microphone: false,
      geolocation: false,
      payment: false,
      usb: false,
      magnetometer: false,
      gyroscope: false,
    },
  })
);

// ─── 2. CORS ───
app.use(
  "/api/*",
  cors({
    origin: (origin) => origin || "*",
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "x-trpc-source"],
  })
);

// ─── 3. Body size limit ───
app.use(bodyLimit({ maxSize: 10 * 1024 * 1024 }));

// ─── 4. OAuth callback (Kimi) ───
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// ─── 5. OAuth callbacks (Social platforms) ───
// LinkedIn callback
app.get("/api/oauth/callback/linkedin", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");

  if (error) {
    return c.redirect("/dashboard/integrations?error=linkedin_denied");
  }
  if (!code || !state) {
    return c.redirect("/dashboard/integrations?error=missing_params");
  }

  // Redirect to dashboard with code and state as query params
  // The frontend will then call the tRPC mutation to exchange the code
  const redirectUrl = new URL("/dashboard/integrations", `${c.req.header("origin") ?? "http://localhost:3000"}`);
  redirectUrl.searchParams.set("linkedin_code", code);
  redirectUrl.searchParams.set("linkedin_state", state);

  return c.redirect(redirectUrl.toString());
});

// Facebook callback
app.get("/api/oauth/callback/facebook", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");

  if (error) {
    return c.redirect("/dashboard/integrations?error=facebook_denied");
  }
  if (!code || !state) {
    return c.redirect("/dashboard/integrations?error=missing_params");
  }

  const redirectUrl = new URL("/dashboard/integrations", `${c.req.header("origin") ?? "http://localhost:3000"}`);
  redirectUrl.searchParams.set("facebook_code", code);
  redirectUrl.searchParams.set("facebook_state", state);

  return c.redirect(redirectUrl.toString());
});

// ─── Health check endpoint ───
app.get("/api/health", (c) => c.json({ ok: true, ts: Date.now() }));

// ─── 6. tRPC handler ───
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

// ─── 6. Catch-all ───
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

// ─── Start server (Render sets PORT, so we use that as the signal) ───
const port = parseInt(process.env.PORT || "3000");
const { serve } = await import("@hono/node-server");
const { serveStaticFiles } = await import("./lib/vite");
serveStaticFiles(app);

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, () => {
  console.log(`[LNR AI Hub] Server running on http://0.0.0.0:${port}/`);
});
