import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";

// ─── LinkedIn OAuth Config ───
const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_API_URL = "https://api.linkedin.com/v2";

// ─── Facebook OAuth Config ───
const FACEBOOK_AUTH_URL = "https://www.facebook.com/v22.0/dialog/oauth";
const FACEBOOK_TOKEN_URL = "https://graph.facebook.com/v22.0/oauth/access_token";
const FACEBOOK_API_URL = "https://graph.facebook.com/v22.0";
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID ?? "1952872092048274";

// ─── In-memory token storage (replace with DB in production) ───
interface SocialToken {
  platform: "linkedin" | "facebook" | "instagram";
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  pageId?: string;
  pageName?: string;
}

const tokenStore = new Map<string, SocialToken[]>(); // userId -> tokens

function getTokens(userId: string): SocialToken[] {
  return tokenStore.get(userId) ?? [];
}

function saveToken(userId: string, token: SocialToken) {
  const existing = getTokens(userId);
  const filtered = existing.filter((t) => t.platform !== token.platform);
  filtered.push(token);
  tokenStore.set(userId, filtered);
}

// ─── Social Router ───
export const socialRouter = createRouter({
  // ═══════════════════════════════════════════
  // LINKEDIN
  // ═══════════════════════════════════════════

  // Get LinkedIn OAuth URL
  getLinkedInAuthUrl: authedQuery.query(({ ctx }) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID ?? "";
    const redirectUri = `${process.env.APP_URL ?? "http://localhost:3000"}/api/oauth/callback/linkedin`;
    const state = Buffer.from(ctx.user.id.toString()).toString("base64");

    const url = new URL(LINKEDIN_AUTH_URL);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set(
      "scope",
      "openid profile w_member_social r_basicprofile r_organization_social w_organization_social"
    );

    return { url: url.toString() };
  }),

  // Exchange LinkedIn code for token
  connectLinkedIn: authedQuery
    .input(z.object({ code: z.string(), state: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const clientId = process.env.LINKEDIN_CLIENT_ID ?? "";
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET ?? "";
      const redirectUri = `${process.env.APP_URL ?? "http://localhost:3000"}/api/oauth/callback/linkedin`;

      // Exchange code for token
      const tokenRes = await fetch(LINKEDIN_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: input.code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenRes.ok) {
        throw new Error(`LinkedIn token exchange failed: ${await tokenRes.text()}`);
      }

      const tokenData = (await tokenRes.json()) as {
        access_token: string;
        expires_in?: number;
      };

      // Get user profile
      const profileRes = await fetch(`${LINKEDIN_API_URL}/userinfo`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = (await profileRes.json()) as { name?: string; sub?: string };

      saveToken(ctx.user.id.toString(), {
        platform: "linkedin",
        accessToken: tokenData.access_token,
        expiresAt: tokenData.expires_in
          ? Date.now() + tokenData.expires_in * 1000
          : undefined,
      });

      return {
        success: true,
        name: profile.name ?? "Compte LinkedIn",
      };
    }),

  // Publish post to LinkedIn
  publishLinkedInPost: authedQuery
    .input(
      z.object({
        text: z.string().min(1).max(3000),
        visibility: z.enum(["PUBLIC", "CONNECTIONS"]).default("PUBLIC"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id.toString();
      const tokens = getTokens(userId);
      const linkedInToken = tokens.find((t) => t.platform === "linkedin");

      if (!linkedInToken) {
        throw new Error("Compte LinkedIn non connecté");
      }

      // Get user URN
      const profileRes = await fetch(`${LINKEDIN_API_URL}/userinfo`, {
        headers: { Authorization: `Bearer ${linkedInToken.accessToken}` },
      });
      const profile = (await profileRes.json()) as { sub: string };
      const authorUrn = `urn:li:person:${profile.sub}`;

      // Create post
      const postRes = await fetch(`${LINKEDIN_API_URL}/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${linkedInToken.accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: authorUrn,
          lifecycleState: "PUBLISHED",
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": input.visibility,
          },
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: input.text },
              shareMediaCategory: "NONE",
            },
          },
        }),
      });

      if (!postRes.ok) {
        throw new Error(`Publication failed: ${await postRes.text()}`);
      }

      const postId = postRes.headers.get("x-restli-id") ?? "unknown";
      return { success: true, postId };
    }),

  // ═══════════════════════════════════════════
  // FACEBOOK
  // ═══════════════════════════════════════════

  // Get Facebook OAuth URL
  getFacebookAuthUrl: authedQuery.query(({ ctx }) => {
    const appId = FACEBOOK_APP_ID;
    const redirectUri = `${process.env.APP_URL ?? "http://localhost:3000"}/api/oauth/callback/facebook`;
    const state = Buffer.from(ctx.user.id.toString()).toString("base64");

    const url = new URL(FACEBOOK_AUTH_URL);
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set(
      "scope",
      "pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish"
    );

    return { url: url.toString() };
  }),

  // Exchange Facebook code for token
  connectFacebook: authedQuery
    .input(z.object({ code: z.string(), state: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const appId = FACEBOOK_APP_ID;
      const appSecret = process.env.FACEBOOK_APP_SECRET ?? "";
      const redirectUri = `${process.env.APP_URL ?? "http://localhost:3000"}/api/oauth/callback/facebook`;

      // Exchange code for token
      const tokenRes = await fetch(
        `${FACEBOOK_TOKEN_URL}?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${input.code}`
      );

      if (!tokenRes.ok) {
        throw new Error(`Facebook token exchange failed: ${await tokenRes.text()}`);
      }

      const tokenData = (await tokenRes.json()) as {
        access_token: string;
        expires_in?: number;
      };

      // Get user's pages
      const pagesRes = await fetch(
        `${FACEBOOK_API_URL}/me/accounts?access_token=${tokenData.access_token}`
      );
      const pages = (await pagesRes.json()) as {
        data: Array<{ id: string; name: string; access_token: string }>;
      };

      const page = pages.data[0];
      if (page) {
        saveToken(ctx.user.id.toString(), {
          platform: "facebook",
          accessToken: page.access_token,
          pageId: page.id,
          pageName: page.name,
        });
      }

      return {
        success: true,
        name: page?.name ?? "Compte Facebook",
        pages: pages.data.map((p) => ({ id: p.id, name: p.name })),
      };
    }),

  // Publish post to Facebook Page
  publishFacebookPost: authedQuery
    .input(
      z.object({
        text: z.string().min(1).max(5000),
        pageId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id.toString();
      const tokens = getTokens(userId);
      const fbToken = tokens.find((t) => t.platform === "facebook");

      if (!fbToken) {
        throw new Error("Compte Facebook non connecté");
      }

      const pageId = input.pageId ?? fbToken.pageId;
      const postRes = await fetch(`${FACEBOOK_API_URL}/${pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.text,
          access_token: fbToken.accessToken,
        }),
      });

      if (!postRes.ok) {
        throw new Error(`Publication failed: ${await postRes.text()}`);
      }

      const result = (await postRes.json()) as { id: string };
      return { success: true, postId: result.id };
    }),

  // Publish to Instagram (via Facebook page)
  publishInstagramPost: authedQuery
    .input(
      z.object({
        caption: z.string().min(1).max(2200),
        imageUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id.toString();
      const tokens = getTokens(userId);
      const fbToken = tokens.find((t) => t.platform === "facebook");

      if (!fbToken?.pageId) {
        throw new Error("Compte Instagram non connecté");
      }

      // Get Instagram Business Account ID
      const igRes = await fetch(
        `${FACEBOOK_API_URL}/${fbToken.pageId}?fields=instagram_business_account&access_token=${fbToken.accessToken}`
      );
      const igData = (await igRes.json()) as {
        instagram_business_account?: { id: string };
      };

      const igAccountId = igData.instagram_business_account?.id;
      if (!igAccountId) {
        throw new Error("Aucun compte Instagram Business lié");
      }

      // Create media container
      const mediaRes = await fetch(`${FACEBOOK_API_URL}/${igAccountId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: input.imageUrl,
          caption: input.caption,
          access_token: fbToken.accessToken,
        }),
      });

      const media = (await mediaRes.json()) as { id: string };

      // Publish media
      const publishRes = await fetch(`${FACEBOOK_API_URL}/${igAccountId}/media_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: media.id,
          access_token: fbToken.accessToken,
        }),
      });

      const result = (await publishRes.json()) as { id: string };
      return { success: true, postId: result.id };
    }),

  // ═══════════════════════════════════════════
  // V2 — Public endpoints (API key auth, token passed directly)
  // ═══════════════════════════════════════════

  // Publish to Facebook Page (V2 — accepts user token or page token)
  publishFacebookPostV2: publicQuery
    .input(
      z.object({
        text: z.string().min(1).max(5000),
        pageId: z.string(),
        accessToken: z.string(),
        pageToken: z.string().optional(), // Optional: if provided, used directly
      })
    )
    .mutation(async ({ input }) => {
      let tokenToUse = input.pageToken;
      let pageName = input.pageId;

      // If no pageToken provided, try to get one from user token
      if (!tokenToUse) {
        const accountsRes = await fetch(
          `${FACEBOOK_API_URL}/me/accounts?access_token=${input.accessToken}`
        );

        if (!accountsRes.ok) {
          const err = await accountsRes.text();
          console.error("[Facebook V2] /me/accounts error:", err);
          throw new Error("Impossible d'obtenir les pages. Vérifiez votre token.");
        }

        const accountsData = (await accountsRes.json()) as {
          data: { id: string; name: string; access_token: string }[];
        };

        const page = accountsData.data.find((p) => p.id === input.pageId);
        if (!page) {
          throw new Error(
            `Page ${input.pageId} non trouvée. Pages disponibles: ${accountsData.data.map((p) => p.name).join(", ")}`
          );
        }

        tokenToUse = page.access_token;
        pageName = page.name;
        console.log(`[Facebook V2] Using page token for "${page.name}"`);
      } else {
        // Get page name with page token
        const infoRes = await fetch(
          `${FACEBOOK_API_URL}/${input.pageId}?fields=name&access_token=${tokenToUse}`
        );
        const info = await infoRes.json() as { name?: string };
        pageName = info.name ?? input.pageId;
      }

      // Publish with page token
      const postRes = await fetch(`${FACEBOOK_API_URL}/${input.pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.text,
          access_token: tokenToUse,
        }),
      });

      if (!postRes.ok) {
        const errorText = await postRes.text();
        console.error("[Facebook V2] Publish error:", errorText);
        throw new Error(`Publication échouée: ${errorText}`);
      }

      const result = (await postRes.json()) as { id: string };
      console.log("[Facebook V2] Published:", result.id);
      return { success: true, postId: result.id, pageName };
    }),

  // ═══════════════════════════════════════════
  // V2 — Facebook : OAuth Connect Flow (publicQuery)
  // ═══════════════════════════════════════════

  getFacebookConnectUrl: publicQuery
    .input(z.object({ redirectUri: z.string().optional() }))
    .query(({ input }) => {
      const appId = FACEBOOK_APP_ID;
      const redirectUri = input.redirectUri ?? `${process.env.APP_URL ?? "https://lnr-ai-hub.onrender.com"}/api/trpc/social.facebookCallback`;
      const state = Buffer.from(Date.now().toString()).toString("base64");

      const url = new URL(FACEBOOK_AUTH_URL);
      url.searchParams.set("client_id", appId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("state", state);
      url.searchParams.set("scope", "pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish");
      url.searchParams.set("response_type", "code");

      return { url: url.toString(), state };
    }),

  facebookCallback: publicQuery
    .input(z.object({ code: z.string(), state: z.string() }))
    .query(async ({ input }) => {
      try {
        const appId = FACEBOOK_APP_ID;
        const appSecret = process.env.FACEBOOK_APP_SECRET ?? "";
        const redirectUri = `${process.env.APP_URL ?? "https://lnr-ai-hub.onrender.com"}/api/trpc/social.facebookCallback`;

        // Exchange code for user access token
        const tokenRes = await fetch(
          `${FACEBOOK_TOKEN_URL}?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${input.code}`
        );

        if (!tokenRes.ok) {
          const err = await tokenRes.text();
          return { success: false, error: `Token exchange failed: ${err}` };
        }

        const tokenData = (await tokenRes.json()) as { access_token: string; expires_in?: number };
        const userToken = tokenData.access_token;

        // Get user's pages with page tokens
        const pagesRes = await fetch(
          `${FACEBOOK_API_URL}/me/accounts?fields=id,name,category,fan_count,picture,access_token&access_token=${userToken}`
        );
        const pagesData = (await pagesRes.json()) as {
          data: { id: string; name: string; category: string; fan_count?: number; picture?: { data: { url: string } }; access_token: string }[];
        };

        const pages = pagesData.data.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          fanCount: p.fan_count ?? 0,
          picture: p.picture?.data?.url ?? null,
          pageToken: p.access_token,
        }));

        return {
          success: true,
          userToken,
          pages,
          count: pages.length,
        };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }),

  // ═══════════════════════════════════════════
  // V2 — Facebook : List available pages (publicQuery)
  // ═══════════════════════════════════════════

  listFacebookPagesV2: publicQuery
    .input(z.object({ accessToken: z.string() }))
    .query(async ({ input }) => {
      try {
        const accountsRes = await fetch(
          `${FACEBOOK_API_URL}/me/accounts?fields=id,name,category,fan_count,picture&access_token=${input.accessToken}`
        );

        if (!accountsRes.ok) {
          const err = await accountsRes.text();
          console.error("[Facebook V2] /me/accounts error:", err);
          throw new Error("Impossible d'obtenir les pages. Vérifiez votre token.");
        }

        const accountsData = (await accountsRes.json()) as {
          data: { id: string; name: string; category: string; fan_count?: number; picture?: { data: { url: string } } }[];
        };

        return {
          pages: accountsData.data.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            fanCount: p.fan_count ?? 0,
            picture: p.picture?.data?.url ?? null,
          })),
          count: accountsData.data.length,
        };
      } catch (err: any) {
        console.error("[Facebook V2] listPages error:", err.message);
        throw new Error(`Erreur: ${err.message}`);
      }
    }),

  // ═══════════════════════════════════════════
  // V2 — Facebook : Test page access (publicQuery)
  // ═══════════════════════════════════════════

  testPageAccess: publicQuery
    .input(z.object({
      pageId: z.string(),
      accessToken: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Test 1: Get page info
        const pageRes = await fetch(
          `${FACEBOOK_API_URL}/${input.pageId}?fields=name,id,category,is_published&access_token=${input.accessToken}`
        );
        const pageData = await pageRes.json() as any;

        if (pageData.error) {
          return {
            canPublish: false,
            pageName: null,
            error: pageData.error.message,
            suggestion: "Vous n'avez pas accès à cette page. Vérifiez que vous êtes admin.",
          };
        }

        // Test 2: Try to publish a test post
        const testRes = await fetch(`${FACEBOOK_API_URL}/${input.pageId}/feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "🧪 Test LNR AI Hub — Ceci est un test de connexion",
            access_token: input.accessToken,
          }),
        });
        const testData = await testRes.json() as any;

        if (testData.error) {
          return {
            canPublish: false,
            pageName: pageData.name,
            error: testData.error.message,
            suggestion: testData.error.code === 200
              ? "Vous devez être ADMIN de la page pour publier. Demandez à l'admin de vous ajouter."
              : "Erreur de permission. Vérifiez votre token.",
          };
        }

        // Delete test post
        if (testData.id) {
          await fetch(`${FACEBOOK_API_URL}/${testData.id}?access_token=${input.accessToken}`, {
            method: "DELETE",
          });
        }

        return {
          canPublish: true,
          pageName: pageData.name,
          pageId: pageData.id,
          category: pageData.category,
          error: null,
          suggestion: null,
        };
      } catch (err: any) {
        return {
          canPublish: false,
          pageName: null,
          error: err.message,
          suggestion: "Erreur réseau. Réessayez plus tard.",
        };
      }
    }),

  // ═══════════════════════════════════════════
  // V2 — LinkedIn (publicQuery, token direct)
  // ═══════════════════════════════════════════

  publishLinkedInPostV2: publicQuery
    .input(z.object({
      text: z.string().min(1).max(3000),
      accessToken: z.string(),
      visibility: z.enum(["PUBLIC", "CONNECTIONS"]).default("PUBLIC"),
    }))
    .mutation(async ({ input }) => {
      try {
        // Step 1: Get user info
        const userRes = await fetch(`${LINKEDIN_API_URL}/userinfo`, {
          headers: { Authorization: `Bearer ${input.accessToken}` },
        });
        if (!userRes.ok) throw new Error("Token LinkedIn invalide");
        const user = await userRes.json() as { sub: string };
        const authorUrn = `urn:li:person:${user.sub}`;

        // Step 2: Create post
        const postRes = await fetch(`${LINKEDIN_API_URL}/posts`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${input.accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
            "LinkedIn-Version": "202309",
          },
          body: JSON.stringify({
            author: authorUrn,
            commentary: input.text,
            visibility: input.visibility,
            distribution: {
              feedDistribution: "MAIN_FEED",
              targetEntities: [],
              thirdPartyDistributionChannels: [],
            },
            lifecycleState: "PUBLISHED",
            isReshareDisabledByAuthor: false,
          }),
        });

        if (!postRes.ok) {
          const err = await postRes.text();
          throw new Error(`Publication LinkedIn échouée: ${err}`);
        }

        const postId = postRes.headers.get("x-restli-id") || "published";
        return { success: true, postId };
      } catch (err: any) {
        console.error("[LinkedIn V2] Error:", err.message);
        throw new Error(`LinkedIn: ${err.message}`);
      }
    }),

  // ═══════════════════════════════════════════
  // V2 — Instagram (publicQuery, token direct)
  // ═══════════════════════════════════════════

  publishInstagramPostV2: publicQuery
    .input(z.object({
      caption: z.string().min(1).max(2200),
      imageUrl: z.string().url(),
      accessToken: z.string(),
      pageId: z.string(), // Facebook page ID linked to Instagram
    }))
    .mutation(async ({ input }) => {
      try {
        // Step 1: Get Instagram Business Account ID from page
        const igRes = await fetch(
          `${FACEBOOK_API_URL}/${input.pageId}?fields=instagram_business_account&access_token=${input.accessToken}`
        );
        const igData = await igRes.json() as { instagram_business_account?: { id: string } };
        const igAccountId = igData.instagram_business_account?.id;

        if (!igAccountId) {
          throw new Error("Aucun compte Instagram Business lié à cette page");
        }

        // Step 2: Create media container
        const mediaRes = await fetch(`${FACEBOOK_API_URL}/${igAccountId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: input.imageUrl,
            caption: input.caption,
            access_token: input.accessToken,
          }),
        });
        const media = await mediaRes.json() as { id: string; error?: any };

        if (media.error) {
          throw new Error(`Instagram media creation: ${JSON.stringify(media.error)}`);
        }

        // Step 3: Publish
        const publishRes = await fetch(`${FACEBOOK_API_URL}/${igAccountId}/media_publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: media.id,
            access_token: input.accessToken,
          }),
        });
        const result = await publishRes.json() as { id: string; error?: any };

        if (result.error) {
          throw new Error(`Instagram publish: ${JSON.stringify(result.error)}`);
        }

        return { success: true, postId: result.id };
      } catch (err: any) {
        console.error("[Instagram V2] Error:", err.message);
        throw new Error(`Instagram: ${err.message}`);
      }
    }),

  // ═══════════════════════════════════════════
  // GENERAL
  // ═══════════════════════════════════════════

  // List connected accounts
  listConnections: authedQuery.query(({ ctx }) => {
    const userId = ctx.user.id.toString();
    const tokens = getTokens(userId);

    return tokens.map((t) => ({
      platform: t.platform,
      connected: true,
      pageName: t.pageName,
      expiresAt: t.expiresAt,
    }));
  }),

  // Disconnect account
  disconnect: authedQuery
    .input(z.object({ platform: z.enum(["linkedin", "facebook", "instagram"]) }))
    .mutation(({ input, ctx }) => {
      const userId = ctx.user.id.toString();
      const existing = getTokens(userId);
      const filtered = existing.filter((t) => t.platform !== input.platform);
      tokenStore.set(userId, filtered);
      return { success: true };
    }),
});
