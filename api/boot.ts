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
import { readFileSync } from "fs";
import { resolve } from "path";
import { getDb } from "./queries/connection";
import { leads } from "@db/schema";

const app = new Hono<{ Bindings: HttpBindings }>();

// ═══════════════════════════════════════════════════════════════
// FIDES WEBHOOK — Stockage en memoire (max 100 leads)
// ═══════════════════════════════════════════════════════════════
const leadsStorage: any[] = [];
const MAX_LEADS = 100;

const PIPELINE_ROUTING: Record<number, any> = {
  3: { name: "Mutuelle TN", type: "B2C", currency: "TND", market: "Tunisia", agent: "Agent Qualification Mutuelle TN" },
  4: { name: "Conseil FR", type: "B2B", currency: "EUR", market: "France", agent: "Agent Qualification Conseil FR" },
};

function parsePipedrivePayload(payload: any) {
  const data = payload?.data || {};
  const meta = payload?.meta || {};
  return {
    deal_id: data.id,
    title: data.title,
    person_id: data.person_id,
    org_id: data.org_id,
    pipeline_id: data.pipeline_id,
    stage_id: data.stage_id,
    value: data.value,
    currency: data.currency,
    status: data.status,
    webhook_timestamp: meta.timestamp,
    event_action: meta.action,
  };
}

function routePipeline(pipelineId: number) {
  const route = PIPELINE_ROUTING[pipelineId];
  if (!route) return { status: "ERROR", message: `Pipeline ID ${pipelineId} inconnu` };
  return { status: "OK", pipeline_id: pipelineId, type: route.type, currency: route.currency, agent: route.agent, routing_message: `LEAD ${route.type} detecte — Envoyer vers ${route.agent} (${route.currency})` };
}

// ─── 1. Security Headers ───
app.use("*", secureHeaders({
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
  strictTransportSecurity: env.isProduction ? "max-age=63072000; includeSubDomains; preload" : false,
  xFrameOptions: "DENY",
  xContentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin",
  permissionsPolicy: { camera: false, microphone: false, geolocation: false, payment: false, usb: false, magnetometer: false, gyroscope: false },
}));

// ─── 2. CORS ───
app.use("/api/*", cors({ origin: (origin) => origin || "*", credentials: true, allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowHeaders: ["Content-Type", "Authorization", "x-trpc-source"] }));

// ─── 3. Body size limit ───
app.use(bodyLimit({ maxSize: 10 * 1024 * 1024 }));

// ─── 4. OAuth callback (Kimi) ───
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// ─── LinkedIn callback (original) ───
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

  const redirectUrl = new URL("/dashboard/integrations", `${c.req.header("origin") ?? "http://localhost:3000"}`);
  redirectUrl.searchParams.set("linkedin_code", code);
  redirectUrl.searchParams.set("linkedin_state", state);

  return c.redirect(redirectUrl.toString());
});

// ─── Facebook callback (original) ───
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
      <a href="/dashboard/agents/nora" style="color:#D4A853;">Retour a Nora</a>
    </body></html>`);
  }
  if (!code) {
    return c.html(`<html><body style="font-family:sans-serif;text-align:center;padding:50px;">
      <h2 style="color:#e74c3c;">Parametres manquants</h2>
      <a href="/dashboard/agents/nora" style="color:#D4A853;">Retour a Nora</a>
    </body></html>`);
  }

  if (codeCache.has(code)) {
    console.log(`[FB OAuth] Code ${code.slice(0, 10)}... already processing, waiting...`);
    try {
      const cachedResult = await codeCache.get(code)!;
      return cachedResult;
    } catch (err: any) {
      return c.html(`<html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0a0a0b;color:#fafafa;">
        <h2 style="color:#e74c3c;">Erreur</h2>
        <p style="color:#a1a1aa;">${err.message}</p>
        <a href="/dashboard/agents/nora" style="color:#D4A853;text-decoration:none;">Retour a Nora</a>
      </body></html>`);
    }
  }

  const FACEBOOK_API = "https://graph.facebook.com/v22.0";
  const appId = "1952872092048274";
  const appSecret = "8127659f69b24270675d32ccde0bcbe6";
  const redirectUri = "https://lnr-ai-hub.onrender.com/api/oauth/callback/facebook";

  console.log(`[FB OAuth] Exchanging code — appId=${appId} secret=${appSecret.slice(0, 8)}... redirectUri=${redirectUri}`);

  const processingPromise = (async () => {
    try {
      const tokenUrl = `${FACEBOOK_API}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
      console.log(`[FB OAuth] Token URL: ${tokenUrl.slice(0, 120)}...`);

      const tokenRes = await fetch(tokenUrl);
      const tokenText = await tokenRes.text();
      console.log(`[FB OAuth] Token response status: ${tokenRes.status}, body: ${tokenText.slice(0, 200)}`);

      let tokenData: { access_token?: string; error?: { message: string } };
      try { tokenData = JSON.parse(tokenText); } catch { throw new Error(`Invalid JSON from Facebook: ${tokenText.slice(0, 200)}`); }

      if (tokenData.error || !tokenData.access_token) {
        console.error(`[FB OAuth] Token exchange failed: ${JSON.stringify(tokenData.error)}`);
        throw new Error(tokenData.error?.message || "Impossible d'obtenir le token");
      }

      const userToken = tokenData.access_token;
      console.log(`[FB OAuth] Got user token: ${userToken.slice(0, 20)}...`);

      const pagesRes = await fetch(`${FACEBOOK_API}/me/accounts?fields=id,name,category,fan_count,picture,access_token&access_token=${userToken}`);
      const pagesText = await pagesRes.text();
      console.log(`[FB OAuth] Pages response: ${pagesText.slice(0, 300)}`);

      let pagesData: {
        data?: Array<{ id: string; name: string; category: string; fan_count?: number; picture?: { data: { url: string } }; access_token: string }>;
        error?: { message: string };
      };
      try { pagesData = JSON.parse(pagesText); } catch { pagesData = { error: { message: "Invalid JSON from pages API" } }; }

      if (pagesData.error) { throw new Error(pagesData.error.message); }
      const pages = pagesData.data || [];
      console.log(`[FB OAuth] Found ${pages.length} pages: ${pages.map(p => p.name).join(", ")}`);

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
    <h2 style="color:#D4A853;margin-bottom:8px;">Connexion Facebook reussie !</h2>
    <p style="color:#a1a1aa;font-size:13px;">Copiez vos tokens et configurez-les dans l'app LNR AI Hub.</p>
  </div>
  <div style="background:#18181b;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px;margin-bottom:20px;">
    <label style="color:#a1a1aa;font-size:10px;">User Token:</label>
    <div style="display:flex;gap:6px;margin:4px 0;">
      <input id="userToken" readonly value="${userToken}" style="flex:1;background:#0d0d0f;border:1px solid rgba(255,255,255,0.06);color:#D4A853;padding:6px 10px;border-radius:6px;font-size:10px;font-family:monospace;" />
      <button onclick="copy(this)" data-text="${userToken}" style="background:#D4A853;color:#0a0a0b;border:none;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">Copier</button>
    </div>
  </div>
  <h3 style="color:#fafafa;font-size:14px;margin:20px 0 10px;">Pages disponibles (${pages.length}):</h3>
  ${pageCards || '<p style="color:#52525b;font-size:12px;">Aucune page trouvee.</p>'}
  <div style="text-align:center;margin-top:30px;">
    <a href="/dashboard/agents/nora" style="display:inline-block;background:#D4A853;color:#0a0a0b;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">Retour a Nora</a>
  </div>
  <script>
    function copy(btn) {
      const text = btn.getAttribute('data-text');
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copie !';
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
        <a href="/dashboard/agents/nora" style="color:#D4A853;text-decoration:none;">Retour a Nora</a>
      </body></html>`);
    } finally {
      setTimeout(() => codeCache.delete(code), 60000);
    }
  })();

  codeCache.set(code, processingPromise);
  return await processingPromise;
});

// ═══════════════════════════════════════════════════════════════
// FIDES WEBHOOK ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// ─── Pipedrive webhook (deal.added) ───
app.post("/api/webhooks/pipedrive", async (c) => {
  try {
    const payload = await c.req.json();
    const parsed = parsePipedrivePayload(payload);
    const routing = routePipeline(parsed.pipeline_id);

    const lead = {
      id: parsed.deal_id,
      title: parsed.title,
      person_id: parsed.person_id,
      org_id: parsed.org_id,
      pipeline_id: parsed.pipeline_id,
      pipeline_name: routing.type === "B2C" ? "Mutuelle TN" : routing.type === "B2B" ? "Conseil FR" : "Unknown",
      stage_id: parsed.stage_id,
      value: parsed.value,
      currency: parsed.currency,
      status: parsed.status,
      type: routing.type || "UNKNOWN",
      market: routing.type === "B2C" ? "Tunisia" : routing.type === "B2B" ? "France" : "Unknown",
      agent: routing.agent || "Unknown",
      webhook_timestamp: parsed.webhook_timestamp,
      received_at: new Date().toISOString(),
      raw_payload: JSON.stringify(payload),
    };

    leadsStorage.unshift(lead);
    if (leadsStorage.length > MAX_LEADS) leadsStorage.pop();

    console.log(`[FIDES] Lead received: ${lead.title} (${lead.type})`);
    return c.json({ success: true, lead });
  } catch (err: any) {
    console.error("[FIDES] Webhook error:", err.message);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ─── List leads ───
app.get("/api/fides/leads", (c) => {
  return c.json({ leads: leadsStorage, count: leadsStorage.length });
});

// ─── FIDES Dashboard HTML ───
app.get("/fides-dashboard", (c) => {
  const b2c = leadsStorage.filter((l) => l.type === "B2C").length;
  const b2b = leadsStorage.filter((l) => l.type === "B2B").length;
  const endpoint = `${new URL(c.req.url).origin}/api/webhooks/pipedrive`;

  const rows = leadsStorage.map((lead) => `
    <tr>
      <td>${lead.id ?? "N/A"}</td>
      <td>${lead.title ?? "N/A"}</td>
      <td><span class="badge ${lead.type}">${lead.type ?? "?"}</span></td>
      <td>${lead.pipeline_name ?? "N/A"}</td>
      <td>${lead.value ?? 0} ${lead.currency ?? ""}</td>
      <td>${lead.market ?? "N/A"}</td>
      <td>${lead.agent ?? "N/A"}</td>
      <td>${lead.received_at ? lead.received_at.slice(0, 16) : "N/A"}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FIDES — Dashboard Leads</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f7fafc; color: #2d3748; }
    .header { background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white; padding: 2rem; text-align: center; }
    .header h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
    .header p { opacity: 0.9; font-size: 0.95rem; }
    .stats { display: flex; justify-content: center; gap: 2rem; padding: 1.5rem; flex-wrap: wrap; }
    .stat-card { background: white; padding: 1.2rem 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; min-width: 140px; }
    .stat-card .value { font-size: 1.8rem; font-weight: bold; color: #1a365d; }
    .stat-card .label { font-size: 0.85rem; color: #718096; margin-top: 0.3rem; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 2rem; }
    table { width: 100%; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; border-collapse: collapse; }
    th { background: #edf2f7; padding: 0.75rem 1rem; text-align: left; font-weight: 600; font-size: 0.85rem; color: #4a5568; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 0.75rem 1rem; border-top: 1px solid #e2e8f0; font-size: 0.9rem; }
    tr:hover { background: #f7fafc; }
    .badge { display: inline-block; padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .badge.B2C { background: #e6fffa; color: #234e52; }
    .badge.B2B { background: #bee3f8; color: #2c5282; }
    .empty { text-align: center; padding: 3rem; color: #a0aec0; }
    .footer { text-align: center; padding: 2rem; color: #a0aec0; font-size: 0.85rem; }
    .refresh { position: fixed; bottom: 2rem; right: 2rem; background: #1a365d; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 50px; cursor: pointer; font-size: 0.9rem; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .refresh:hover { background: #2c5282; }
    .endpoint { background: #edf2f7; padding: 0.5rem 1rem; border-radius: 4px; font-family: monospace; font-size: 0.85rem; margin: 1rem auto; display: inline-block; }
  </style>
</head>
<body>
  <div class="header">
    <h1>&#128202; FIDES CONSEIL — Dashboard Leads</h1>
    <p>CRM Pipedrive x LNR AI Hub — En temps reel</p>
    <div class="endpoint">Webhook: ${endpoint}</div>
  </div>
  <div class="stats">
    <div class="stat-card"><div class="value">${leadsStorage.length}</div><div class="label">Total Leads</div></div>
    <div class="stat-card"><div class="value">${b2c}</div><div class="label">B2C (Mutuelle TN)</div></div>
    <div class="stat-card"><div class="value">${b2b}</div><div class="label">B2B (Conseil FR)</div></div>
  </div>
  <div class="container">
    ${leadsStorage.length > 0 ? `<table><thead><tr><th>ID</th><th>Titre</th><th>Type</th><th>Pipeline</th><th>Valeur</th><th>Marche</th><th>Agent</th><th>Recu</th></tr></thead><tbody>${rows}</tbody></table>` : `<div class="empty">Aucun lead recu.<br>Creez un deal dans Pipedrive pour voir apparaitre le lead ici.</div>`}
  </div>
  <div class="footer">FIDES CONSEIL x LNR AI Hub — Mis a jour en temps reel</div>
  <button class="refresh" onclick="location.reload()">&#128260; Actualiser</button>
</body>
</html>`;

  return c.html(html);
});

// ─── Console de pilotage agents IA ───
app.get("/console-agents", (c) => {
  const paths = [
    resolve(process.cwd(), "public/console-agents.html"),
    resolve(process.cwd(), "dist/public/console-agents.html"),
    resolve(process.cwd(), "dist/console-agents.html"),
    resolve(__dirname, "../public/console-agents.html"),
    resolve(__dirname, "../../public/console-agents.html"),
    resolve(__dirname, "../../../public/console-agents.html"),
  ];
  let html = "";
  for (const p of paths) {
    try { html = readFileSync(p, "utf-8"); break; } catch {}
  }
  if (!html) return c.text("Console de pilotage non disponible", 500);
  return c.html(html);
});

// ─── Health check ───
app.get("/api/health", (c) => c.json({ ok: true, ts: Date.now(), fides_leads: leadsStorage.length }));

// ─── 6. tRPC handler ───
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({ endpoint: "/api/trpc", req: c.req.raw, router: appRouter, createContext });
});

// ─── WhatsApp webhook ───
app.get("/api/webhooks/whatsapp", async (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");
  const VERIFY_TOKEN = "lnr_whatsapp_verify_2026";
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge ?? "OK", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new Response("Verification failed", { status: 403 });
});

app.post("/api/webhooks/whatsapp", async (c) => {
  const body = await c.req.json();
  console.log("[WhatsApp] Incoming webhook:", JSON.stringify(body, null, 2));
  return c.json({ status: "received" });
});

// ═══════════════════════════════════════════════════════════════
// LEAD CAPTURE — Landing page form
// ═══════════════════════════════════════════════════════════════

app.post("/api/lead", async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, phone, company, message } = body;

    if (!name || !email) {
      return c.json({ success: false, error: "Nom et email requis" }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ success: false, error: "Email invalide" }, 400);
    }

    const db = getDb();
    await db.insert(leads).values({
      name,
      email,
      phone: phone || null,
      company: company || null,
      message: message || null,
      source: "landing_page",
      status: "new",
    });

    return c.json({ success: true, message: "Merci ! Votre demande a bien été enregistrée." });
  } catch (err: any) {
    console.error("[Lead] Error:", err);
    return c.json({ success: false, error: err.message || "Erreur serveur" }, 500);
  }
});

app.get("/api/leads", async (c) => {
  try {
    const db = getDb();
    const allLeads = await db.select().from(leads).orderBy(leads.createdAt);
    return c.json({ success: true, data: allLeads });
  } catch (err: any) {
    console.error("[Leads] Error:", err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ─── Catch-all ───
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

// ─── Start server ───
const port = parseInt(process.env.PORT || "3000");
const { serve } = await import("@hono/node-server");
const { serveStaticFiles } = await import("./lib/vite");
serveStaticFiles(app);

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, () => {
  console.log(`[LNR AI Hub] Server running on http://0.0.0.0:${port}/`);
  console.log(`[FIDES] Webhook endpoint: http://0.0.0.0:${port}/api/webhooks/pipedrive`);
  console.log(`[FIDES] Dashboard: http://0.0.0.0:${port}/fides-dashboard`);
  console.log(`[FIDES] Console agents: http://0.0.0.0:${port}/console-agents`);
});
