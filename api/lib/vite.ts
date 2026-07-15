import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";

type App = Hono<{ Bindings: HttpBindings }>;

export function serveStaticFiles(app: App) {
  // __dirname is defined by the esbuild banner in dist/boot.js
  const distPath = path.resolve(__dirname, "../dist/public");

  app.use("*", serveStatic({ root: "./dist/public" }));

  app.notFound((c) => {
    const accept = c.req.header("accept") ?? "";
    if (!accept.includes("text/html")) {
      return c.json({ error: "Not Found" }, 404);
    }
    try {
      const indexPath = path.resolve(distPath, "index.html");
      const content = fs.readFileSync(indexPath, "utf-8");
      return c.html(content);
    } catch {
      return c.json({ error: "Not Found" }, 404);
    }
  });
}
