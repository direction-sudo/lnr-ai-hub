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
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", env.kimiOpenUrl, "https://maker.ifttt.com"],
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

// Facebook callback — handles OAuth code exchange directly
app.get("/api/oauth/callback/facebook", async (c) => {
  const code = c.req.query("code");
  const error = c.req.query("error");
  const errorDescription = c.req.query("error_description");

  if (error) {
    return c.html(`<html><body style="font-family:sans-serif;text-align:center;padding:50px;">
      <h2 style="color:#e74c3c;">Erreur Facebook</h2>
      <p>${errorDescription || error}</p>
      <a href="/dashboard/agents/nora" style="color:#D4A853;">Retour à Nora</a>
    </body></html>`);
  }
  if (!code) {
    return c.html(`<html><body style="font-family:sans-serif;text-align:center;padding:50px;">
      <h2 style="color:#e74c3c;">Paramètres manquants</h2>
      <a href="/dashboard/agents/nora" style="color:#D4A853;">Retour à Nora</a>
    </body></html>`);
  }

  const FACEBOOK_API = "https://graph.facebook.com/v22.0";
  const appId = process.env.FACEBOOK_APP_ID || "1952872092048274";
  const appSecret = process.env.FACEBOOK_APP_SECRET || "";
  const redirectUri = `${c.req.header("origin") ?? "https://lnr-ai-hub.onrender.com"}/api/oauth/callback/facebook`;

  try {
    // Step 1: Exchange code for user access token
    const tokenRes = await fetch(
      `${FACEBOOK_API}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json() as { access_token?: string; error?: { message: string } };

    if (tokenData.error || !tokenData.access_token) {
      return c.html(`<html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0a0a0b;color:#fafafa;">
        <h2 style="color:#e74c3c;">Erreur Token</h2>
        <p style="color:#a1a1aa;">${tokenData.error?.message || "Impossible d'obtenir le token"}</p>
        <a href="/dashboard/agents/nora" style="color:#D4A853;text-decoration:none;">Retour à Nora</a>
      </body></html>`);
    }

    const userToken = tokenData.access_token;

    // Step 2: Get user's pages with page tokens
    const pagesRes = await fetch(`${FACEBOOK_API}/me/accounts?fields=id,name,category,fan_count,picture,access_token&access_token=${userToken}`);
    const pagesData = await pagesRes.json() as {
      data?: Array<{ id: string; name: string; category: string; fan_count?: number; picture?: { data: { url: string } }; access_token: string }>;
      error?: { message: string };
    };

    if (pagesData.error) {
      return c.html(`<html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0a0a0b;color:#fafafa;">
        <h2 style="color:#e74c3c;">Erreur Pages</h2>
        <p style="color:#a1a1aa;">${pagesData.error.message}</p>
        <a href="/dashboard/agents/nora" style="color:#D4A853;text-decoration:none;">Retour à Nora</a>
      </body></html>`);
    }

    const pages = pagesData.data || [];

    // Build HTML response with copy-pasteable tokens
    const pageCards = pages.map(p => `
      <div style="background:#18181b;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px;margin:12px 0;text-align:left;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
          ${p.picture?.data?.url ? `<img src="${p.picture.data.url}" style="width:40px;height:40px;border-radius:8px;" />` : ""}
          <div>
            <strong style="color:#fafafa;font-size:14px;">${p.name}</strong>
            <div style="color:#52525b;font-size:11px;">${p.category} · ${p.fan_count || 0} fans</div>
          </div>
        </div>
        <label style="color:#a1a1aa;font-size:10px;">Page ID:</label>
        <div style="display:flex;gap:6px;margin:4px 0 8px;">
          <input readonly value="${p.id}" style="flex:1;background:#0d0d0f;border:1px solid rgba(255,255,255,0.06);color:#D4A853;padding:6px 10px;border-radius:6px;font-size:11px;font-family:monospace;" />
          <button onclick="copy(this)" data-text="${p.id}" style="background:#D4A853;color:#0a0a0b;border:none;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">Copier</button>
        </div>
        <label style="color:#a1a1aa;font-size:10px;">Page Token:</label>
        <div style="display:flex;gap:6px;margin:4px 0;">
          <input readonly value="${p.access_token}" style="flex:1;background:#0d0d0f;border:1px solid rgba(255,255,255,0.06);color:#D4A853;padding:6px 10px;border-radius:6px;font-size:10px;font-family:monospace;" />
          <button onclick="copy(this)" data-text="${p.access_token}" style="background:#D4A853;color:#0a0a0b;border:none;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">Copier</button>
        </div>
      </div>
    `).join("");

    return c.html(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Facebook Connect - LNR AI Hub</title></head>
<body style="font-family:sans-serif;background:#0a0a0b;color:#fafafa;padding:30px;max-width:600px;margin:0 auto;">
  <div style="text-align:center;margin-bottom:30px;">
    <h2 style="color:#D4A853;margin-bottom:8px;">✅ Connexion Facebook réussie !</h2>
    <p style="color:#a1a1aa;font-size:13px;">Copiez vos tokens et configurez-les dans l'app LNR AI Hub.</p>
  </div>

  <div style="background:#18181b;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px;margin-bottom:20px;">
    <label style="color:#a1a1aa;font-size:10px;">User Token:</label>
    <div style="display:flex;gap:6px;margin:4px 0;">
      <input id="userToken" readonly value="${userToken}" style="flex:1;background:#0d0d0f;border:1px solid rgba(255,255,255,0.06);color:#D4A853;padding:6px 10px;border-radius:6px;font-size:10px;font-family:monospace;" />
      <button onclick="copy(this)" data-text="${userToken}" style="background:#D4A853;color:#0a0a0b;border:none;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">Copier</button>
    </div>
  </div>

  <h3 style="color:#fafafa;font-size:14px;margin:20px 0 10px;">📄 Pages disponibles (${pages.length}):</h3>
  ${pageCards || '<p style="color:#52525b;font-size:12px;">Aucune page trouvée.</p>'}

  <div style="text-align:center;margin-top:30px;">
    <a href="/dashboard/agents/nora" style="display:inline-block;background:#D4A853;color:#0a0a0b;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">Retour à Nora</a>
  </div>

  <script>
    function copy(btn) {
      const text = btn.getAttribute('data-text');
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = '✅ Copié !';
        setTimeout(() => btn.textContent = 'Copier', 2000);
      });
    }
  </script>
</body></html>`);

  } catch (err: any) {
    return c.html(`<html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0a0a0b;color:#fafafa;">
      <h2 style="color:#e74c3c;">Erreur</h2>
      <p style="color:#a1a1aa;">${err.message}</p>
      <a href="/dashboard/agents/nora" style="color:#D4A853;text-decoration:none;">Retour à Nora</a>
    </body></html>`);
  }
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
