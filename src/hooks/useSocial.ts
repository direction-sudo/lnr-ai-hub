import { useState, useCallback, useEffect } from 'react';
import { trpc } from '@/providers/trpc';

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

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════
export function useSocial() {
  const [connections, setConnections] = useState<SocialConnection[]>(loadConnections);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // tRPC mutations V2 (all public, token passed directly)
  const fbMutation = trpc.social.publishFacebookPostV2.useMutation();
  const liMutation = trpc.social.publishLinkedInPostV2.useMutation();
  const igMutation = trpc.social.publishInstagramPostV2.useMutation();

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
    if (!conn?.connected || !conn.accessToken) {
      setLastError(`Compte ${platform} non connecté`);
      return false;
    }

    setIsPublishing(true);
    setLastError(null);

    try {
      if (platform === 'linkedin') {
        const result = await liMutation.mutateAsync({
          text: content,
          accessToken: conn.accessToken,
        });
        return result.success;
      }

      if (platform === 'facebook' && conn.pageId) {
        const result = await fbMutation.mutateAsync({
          text: content,
          pageId: conn.pageId,
          accessToken: conn.accessToken,
        });
        return result.success;
      }

      if (platform === 'instagram' && conn.pageId && extra?.imageUrl) {
        const result = await igMutation.mutateAsync({
          caption: content,
          imageUrl: extra.imageUrl,
          accessToken: conn.accessToken,
          pageId: conn.pageId,
        });
        return result.success;
      }

      setLastError(`Configuration ${platform} incomplète (pageId manquant)`);
      return false;
    } catch (err: any) {
      const msg = err.message || String(err);
      console.error(`[Publish ${platform}] Error:`, msg);
      setLastError(msg);
      return false;
    } finally {
      setIsPublishing(false);
    }
  }, [getConnection, fbMutation, liMutation, igMutation]);

  return {
    connections,
    isConnected,
    getConnection,
    manualConnect,
    disconnect,
    publishPost,
    isPublishing,
    lastError,
  };
}
