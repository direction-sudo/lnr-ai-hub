import { setCookie, deleteCookie } from "hono/cookie";
import { verifySessionToken, signSessionToken } from "./session";
import { env } from "../lib/env";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { Paths } from "@contracts/constants";
import type { Context } from "hono";
import type { User } from "../context";

/**
 * Extract and verify session from request headers.
 * Returns the user + access token if valid.
 */
export async function authenticateRequest(
  headers: Headers,
): Promise<{ user: User; accessToken?: string } | undefined> {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return undefined;

  const sessionMatch = cookieHeader.match(/session=([^;]+)/);
  if (!sessionMatch) return undefined;

  const token = decodeURIComponent(sessionMatch[1]);
  if (!token) return undefined;

  const payload = await verifySessionToken(token);
  if (!payload) return undefined;

  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.unionId, payload.unionId));

  const user = rows[0];
  if (!user) return undefined;

  return { user, accessToken: payload.accessToken };
}

// ─── Cookie helpers ───

export function setSessionCookie(c: Context, token: string) {
  setCookie(c, "session", token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "Strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, "session", { path: "/" });
}

// ─── OAuth callback handler ───

export function createOAuthCallbackHandler() {
  return async (c: Context) => {
    const code = c.req.query("code");
    if (!code) {
      return c.json({ error: "No authorization code provided" }, 400);
    }

    try {
      const tokenRes = await fetch(`${env.kimiAuthUrl}/api/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: env.appId,
          app_secret: env.appSecret,
          code,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        console.error("[auth] Token exchange failed:", await tokenRes.text());
        return c.json({ error: "Token exchange failed" }, 401);
      }

      const tokenData = (await tokenRes.json()) as {
        access_token: string;
        refresh_token?: string;
      };

      const userRes = await fetch(`${env.kimiAuthUrl}/api/oauth/user`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userRes.ok) {
        console.error("[auth] Failed to get user info:", await userRes.text());
        return c.json({ error: "Failed to get user info" }, 401);
      }

      const userData = (await userRes.json()) as {
        union_id: string;
        name?: string;
        email?: string;
        avatar_url?: string;
      };

      const db = getDb();
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.unionId, userData.union_id));

      if (existing.length === 0) {
        await db.insert(users).values({
          unionId: userData.union_id,
          name: userData.name || "Utilisateur",
          email: userData.email,
          avatar: userData.avatar_url,
          role: "user",
        });
      } else {
        await db
          .update(users)
          .set({
            name: userData.name || existing[0].name,
            email: userData.email || existing[0].email,
            avatar: userData.avatar_url || existing[0].avatar,
            lastSignInAt: new Date(),
          })
          .where(eq(users.id, existing[0].id));
      }

      const sessionToken = await signSessionToken({
        unionId: userData.union_id,
        clientId: env.appId,
        accessToken: tokenData.access_token,
      });

      setSessionCookie(c, sessionToken);
      return c.redirect("/dashboard");
    } catch (err) {
      console.error("[auth] OAuth callback error:", err);
      return c.json({ error: "Authentication failed" }, 500);
    }
  };
}
