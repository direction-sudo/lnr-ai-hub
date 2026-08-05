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
// Cache for codes being processed (prevents double-processing by browser extensions)
const codeCache = new Map<string, Promise<any>>();

app.get("/api/oauth/callback/facebook", async (c) => {
  const code = c.req.query("code");
  const error = c.req.query("error");
  const errorDescription = c.req.query("error_description");
  const state = c.req.query("state") || "none";

  console.log(`[FB OAuth] Received callback — code=${code?.slice(0, 10)}... state=${state} UA=${c.req.header("user-agent")?.slice(0, 50)}`);

  if (error) {
    console.log(`[FB OAuth] Error param: ${error}`);
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

  // If this code is already being processed, wait for that result
  if (codeCache.has(code)) {
    console.log(`[FB OAuth] Code ${code.slice(0, 10)}... already processing, waiting...`);
    try {
      const cachedResult = await codeCache.get(code)!;
      return cachedResult;
    } catch (err: any) {
      return c.html(`<html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0a0a0b;color:#fafafa;">
        <h2 style="color:#e74c3c;">Erreur</h2>
        <p style="color:#a1a1aa;">${err.message}</p>
        <a href="/dashboard/agents/nora" style="color:#D4A853;text-decoration:none;">Retour à Nora</a>
      </body></html>`);
    }
  }

  const FACEBOOK_API = "https://graph.facebook.com/v22.0";
  const appId = "1952872092048274";
  const appSecret = "8127659f69b24270675d32ccde0bcbe6";
  // MUST match exactly the redirect_uri used in the OAuth URL
  const redirectUri = "https://lnr-ai-hub.onrender.com/api/oauth/callback/facebook";

  console.log(`[FB OAuth] Exchanging code — appId=${appId} secret=${appSecret.slice(0, 8)}... redirectUri=${redirectUri}`);

  // Create the processing promise and store in cache
  const processingPromise = (async () => {
    try {
      // Step 1: Exchange code for user access token
      const tokenUrl = `${FACEBOOK_API}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
      console.log(`[FB OAuth] Token URL: ${tokenUrl.slice(0, 120)}...`);

      const tokenRes = await fetch(tokenUrl);
      const tokenText = await tokenRes.text();
      console.log(`[FB OAuth] Token response status: ${tokenRes.status}, body: ${tokenText.slice(0, 200)}`);

      let tokenData: { access_token?: string; error?: { message: string } };
      try {
        tokenData = JSON.parse(tokenText);
      } catch {
        throw new Error(`Invalid JSON from Facebook: ${tokenText.slice(0, 200)}`);
      }

      if (tokenData.error || !tokenData.access_token) {
        console.error(`[FB OAuth] Token exchange failed: ${JSON.stringify(tokenData.error)}`);
        throw new Error(tokenData.error?.message || "Impossible d'obtenir le token");
      }

      const userToken = tokenData.access_token;
      console.log(`[FB OAuth] Got user token: ${userToken.slice(0, 20)}...`);

      // Step 2: Get user's pages with page tokens
      console.log(`[FB OAuth] Fetching pages...`);
      const pagesRes = await fetch(`${FACEBOOK_API}/me/accounts?fields=id,name,category,fan_count,picture,access_token&access_token=${userToken}`);
      const pagesText = await pagesRes.text();
      console.log(`[FB OAuth] Pages response: ${pagesText.slice(0, 300)}`);

      let pagesData: {
        data?: Array<{ id: string; name: string; category: string; fan_count?: number; picture?: { data: { url: string } }; access_token: string }>;
        error?: { message: string };
      };
      try {
        pagesData = JSON.parse(pagesText);
      } catch {
        pagesData = { error: { message: "Invalid JSON from pages API" } };
      }

      if (pagesData.error) {
        console.error(`[FB OAuth] Pages error: ${pagesData.error.message}`);
        throw new Error(pagesData.error.message);
      }

      const pages = pagesData.data || [];
      console.log(`[FB OAuth] Found ${pages.length} pages: ${pages.map(p => p.name).join(", ")}`);

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
  ${pageCards || '<p style="color:#52525b;font-size:12px;">Aucune page trouvée. Essayez de générer un token avec les permissions pages_manage_posts et business_management.</p>'}

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
      console.error(`[FB OAuth] Error: ${err.message}`);
      return c.html(`<html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0a0a0b;color:#fafafa;">
        <h2 style="color:#e74c3c;">Erreur Token</h2>
        <p style="color:#a1a1aa;">${err.message}</p>
        <a href="/dashboard/agents/nora" style="color:#D4A853;text-decoration:none;">Retour à Nora</a>
      </body></html>`);
    } finally {
      // Clean up cache after 60 seconds
      setTimeout(() => codeCache.delete(code), 60000);
    }
  })();

  codeCache.set(code, processingPromise);

  return await processingPromise;
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

// ─── LinkedIn callback ───
app.get("/api/oauth/callback/linkedin", async (c) => {
  const code = c.req.query("code");
  const error = c.req.query("error");
  const errorDescription = c.req.query("error_description");

  if (error) {
    return c.html(`<html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0a0a0b;color:#fafafa;">
      <h2 style="color:#e74c3c;">Erreur LinkedIn</h2>
      <p>${errorDescription || error}</p>
      <a href="/dashboard/integrations" style="color:#D4A853;">Retour aux Intégrations</a>
    </body></html>`);
  }
  if (!code) {
    return c.html(`<html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0a0a0b;color:#fafafa;">
      <h2 style="color:#e74c3c;">Paramètres manquants</h2>
      <a href="/dashboard/integrations" style="color:#D4A853;">Retour aux Intégrations</a>
    </body></html>`);
  }

  const LINKEDIN_API = "https://api.linkedin.com/v2";
  const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
  const clientId = process.env.LINKEDIN_CLIENT_ID ?? "";
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET ?? "";
  const redirectUri = "https://lnr-ai-hub.onrender.com/api/oauth/callback/linkedin";

  try {
    // Exchange code for token
    const tokenRes = await fetch(LINKEDIN_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenText = await tokenRes.text();
    let tokenData: { access_token?: string; error?: string; error_description?: string };
    try { tokenData = JSON.parse(tokenText); } catch { throw new Error("Invalid response from LinkedIn"); }

    if (tokenData.error || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || "Token exchange failed");
    }

    const accessToken = tokenData.access_token;

    // Get user profile
    const profileRes = await fetch(`${LINKEDIN_API}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json() as { name?: string; sub?: string; email?: string };

    return c.html(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>LinkedIn Connect - LNR AI Hub</title></head>
<body style="font-family:sans-serif;background:#0a0a0b;color:#fafafa;padding:30px;max-width:600px;margin:0 auto;">
  <div style="text-align:center;margin-bottom:30px;">
    <h2 style="color:#0077B5;margin-bottom:8px;">✅ Connexion LinkedIn réussie !</h2>
    <p style="color:#a1a1aa;font-size:13px;">Copiez votre token et configurez-le dans l'app LNR AI Hub.</p>
  </div>

  <div style="background:#18181b;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px;margin-bottom:20px;">
    <label style="color:#a1a1aa;font-size:10px;">Profil :</label>
    <p style="color:#fafafa;font-size:14px;margin:4px 0 12px;">${profile.name || "LinkedIn User"}</p>
    <label style="color:#a1a1aa;font-size:10px;">Access Token :</label>
    <div style="display:flex;gap:6px;margin:4px 0;">
      <input readonly value="${accessToken}" style="flex:1;background:#0d0d0f;border:1px solid rgba(255,255,255,0.06);color:#0077B5;padding:6px 10px;border-radius:6px;font-size:10px;font-family:monospace;" />
      <button onclick="copy(this)" data-text="${accessToken}" style="background:#0077B5;color:#fff;border:none;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">Copier</button>
    </div>
  </div>

  <div style="text-align:center;margin-top:30px;">
    <a href="/dashboard/integrations" style="display:inline-block;background:#0077B5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">Retour aux Intégrations</a>
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
      <h2 style="color:#e74c3c;">Erreur LinkedIn</h2>
      <p style="color:#a1a1aa;">${err.message}</p>
      <a href="/dashboard/integrations" style="color:#D4A853;text-decoration:none;">Retour aux Intégrations</a>
    </body></html>`);
  }
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
