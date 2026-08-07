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

// ═══════════════════════════════════════════════════════════════
// FIDES WEBHOOK — Stockage en mémoire (max 100 leads)
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

// ─── Facebook callback ───
const codeCache = new Map<string, Promise<any>>();

app.get("/api/oauth/callback/facebook", async (c) => { /* ... existing code ... */ });

// ─── LinkedIn callback ───
app.get("/api/oauth/callback/linkedin", async (c) => { /* ... existing code ... */ });

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
});
