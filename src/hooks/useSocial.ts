import { useState, useCallback, useEffect } from 'react';

// ─── Types ───
export interface SocialConnection {
  platform: 'linkedin' | 'facebook' | 'instagram';
  connected: boolean;
  pageName?: string;
  accessToken?: string;
  pageId?: string;
}

// ─── localStorage keys ───
const STORAGE_KEY = 'lnr_social_connections';

// ─── Load connections from localStorage ───
function loadConnections(): SocialConnection[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// ─── Save connections ───
function saveConnections(connections: SocialConnection[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
}

// ─── LinkedIn OAuth URLs ───
// These require backend. For frontend-only mode, user pastes token manually.
function getLinkedInAuthUrl(): string {
  // In fullstack mode, this would come from backend
  // For now, return empty - user needs to get token manually or use backend
  return '';
}

// ─── Facebook OAuth URLs ───
function getFacebookAuthUrl(): string {
  return '';
}

// ─── Publish to LinkedIn (frontend direct call) ───
async function publishLinkedIn(accessToken: string, text: string): Promise<{ success: boolean; postId?: string }> {
  try {
    // Step 1: Get user info to get the person URN
    const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const user = await userRes.json() as { sub: string };
    const authorUrn = `urn:li:person:${user.sub}`;

    // Step 2: Create the post
    const postRes = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202309',
      },
      body: JSON.stringify({
        author: authorUrn,
        commentary: text,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
    });

    if (!postRes.ok) {
      const error = await postRes.text();
      console.error('LinkedIn publish error:', error);
      return { success: false };
    }

    const postId = postRes.headers.get('x-restli-id') || 'published';
    return { success: true, postId };
  } catch (err) {
    console.error('LinkedIn publish failed:', err);
    return { success: false };
  }
}

// ─── Publish to Facebook Page (frontend direct call) ───
async function publishFacebook(accessToken: string, pageId: string, text: string): Promise<{ success: boolean; postId?: string }> {
  try {
    const url = `https://graph.facebook.com/v18.0/${pageId}/feed?access_token=${accessToken}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Facebook publish error:', error);
      return { success: false };
    }

    const data = await res.json() as { id: string };
    return { success: true, postId: data.id };
  } catch (err) {
    console.error('Facebook publish failed:', err);
    return { success: false };
  }
}

// ─── Publish to Instagram (frontend direct call) ───
async function publishInstagram(accessToken: string, pageId: string, caption: string, imageUrl: string): Promise<{ success: boolean; postId?: string }> {
  try {
    // Step 1: Get Instagram Business Account ID from page
    const igRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`);
    const igData = await igRes.json() as { instagram_business_account?: { id: string } };
    const igAccountId = igData.instagram_business_account?.id;

    if (!igAccountId) {
      return { success: false };
    }

    // Step 2: Create media container
    const mediaRes = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    });
    const media = await mediaRes.json() as { id: string };

    // Step 3: Publish
    const publishRes = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: media.id,
        access_token: accessToken,
      }),
    });
    const result = await publishRes.json() as { id: string };

    return { success: true, postId: result.id };
  } catch (err) {
    console.error('Instagram publish failed:', err);
    return { success: false };
  }
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════
export function useSocial() {
  const [connections, setConnections] = useState<SocialConnection[]>(loadConnections);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    saveConnections(connections);
  }, [connections]);

  // ─── Get connection status ───
  const getConnection = useCallback((platform: string): SocialConnection | undefined => {
    return connections.find(c => c.platform === platform);
  }, [connections]);

  const isConnected = useCallback((platform: string): boolean => {
    return connections.some(c => c.platform === platform && c.connected);
  }, [connections]);

  // ─── Manual connect (paste token) ───
  const manualConnect = useCallback((platform: 'linkedin' | 'facebook' | 'instagram', accessToken: string, pageName?: string, pageId?: string) => {
    setConnections(prev => {
      const filtered = prev.filter(c => c.platform !== platform);
      return [...filtered, { platform, connected: true, accessToken, pageName, pageId }];
    });
  }, []);

  // ─── Disconnect ───
  const disconnect = useCallback((platform: string) => {
    setConnections(prev => prev.filter(c => c.platform !== platform));
  }, []);

  // ─── Publish post ───
  const publishPost = useCallback(async (platform: string, content: string, extra?: { imageUrl?: string }): Promise<boolean> => {
    const conn = getConnection(platform);
    if (!conn?.connected || !conn.accessToken) return false;

    setIsPublishing(true);
    let result: { success: boolean } = { success: false };

    try {
      if (platform === 'linkedin') {
        result = await publishLinkedIn(conn.accessToken, content);
      } else if (platform === 'facebook' && conn.pageId) {
        result = await publishFacebook(conn.accessToken, conn.pageId, content);
      } else if (platform === 'instagram' && conn.pageId && extra?.imageUrl) {
        result = await publishInstagram(conn.accessToken, conn.pageId, content, extra.imageUrl);
      }
    } catch (err) {
      console.error('Publish error:', err);
    }

    setIsPublishing(false);
    return result.success;
  }, [getConnection]);

  return {
    connections,
    isConnected,
    getConnection,
    manualConnect,
    disconnect,
    publishPost,
    isPublishing,
  };
}
