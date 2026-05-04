import { useState, useEffect, useCallback, useRef } from 'react';
import { isManagedCredential, loadSettings, PlatformCredentialKey } from '../services/apiConfig';
import {
  PlatformMetrics,
  fetchInstagramMetrics,
  fetchYouTubeMetrics,
  fetchFacebookMetrics,
  fetchTwitterMetrics,
  fetchLinkedInMetrics,
  fetchTikTokMetrics,
} from '../services/platformAPIs';

export type MetricsMap = Partial<Record<PlatformCredentialKey, PlatformMetrics>>;

const PLATFORM_ORDER: PlatformCredentialKey[] = [
  'instagram',
  'youtube',
  'facebook',
  'linkedin',
  'twitter',
  'tiktok',
];

function unconfigured(platform: PlatformCredentialKey, message = 'Conta sem conexao validada.'): PlatformMetrics {
  return {
    platform,
    status: 'unconfigured',
    lastUpdated: new Date().toISOString(),
    errorMessage: message,
  };
}

async function fetchPlatform(platform: PlatformCredentialKey): Promise<PlatformMetrics> {
  const { credentials, connections } = loadSettings();
  const connection = connections[platform];
  const credential = credentials[platform];

  if (connection && connection.validationStatus !== 'verified') {
    return unconfigured(platform, 'Vinculo pendente: ainda nao ha evidencia real do provedor.');
  }

  if (isManagedCredential(credential) && connection?.validationStatus !== 'verified') {
    return unconfigured(platform, 'Token gerenciado sem evidencia validada pelo conector OAuth.');
  }

  if (platform === 'instagram') {
    const c = credentials.instagram;
    if (!c?.accessToken || !c?.userId) return unconfigured(platform);
    return fetchInstagramMetrics(c);
  }

  if (platform === 'youtube') {
    const c = credentials.youtube;
    if (!c?.accessToken && (!c?.apiKey || !c?.channelId)) return unconfigured(platform);
    return fetchYouTubeMetrics(c);
  }

  if (platform === 'facebook') {
    const c = credentials.facebook;
    if (!c?.accessToken || !c?.pageId) return unconfigured(platform);
    return fetchFacebookMetrics(c);
  }

  if (platform === 'linkedin') {
    const c = credentials.linkedin;
    if (!c?.accessToken || !c?.organizationId) return unconfigured(platform);
    return fetchLinkedInMetrics(c);
  }

  if (platform === 'twitter') {
    const c = credentials.twitter;
    if (!c?.bearerToken || !c?.userId) return unconfigured(platform);
    return fetchTwitterMetrics(c);
  }

  if (platform === 'tiktok') {
    const c = credentials.tiktok;
    if (!c?.accessToken) return unconfigured(platform);
    return fetchTikTokMetrics(c);
  }

  return unconfigured(platform);
}

async function fetchAll(requestedPlatforms: PlatformCredentialKey[]): Promise<MetricsMap> {
  const targets = requestedPlatforms.length ? requestedPlatforms : PLATFORM_ORDER;
  const entries = await Promise.all(
    targets.map(async platform => [platform, await fetchPlatform(platform)] as const)
  );
  return Object.fromEntries(entries);
}

export function useRealTimeMetrics(requestedPlatforms: PlatformCredentialKey[] = []) {
  const [metrics, setMetrics] = useState<MetricsMap>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const platformKey = requestedPlatforms.join('|');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAll(requestedPlatforms);
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar metricas');
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [platformKey]);

  useEffect(() => {
    refresh();
    const settings = loadSettings();
    if (settings.refresh.enabled) {
      const ms = settings.refresh.intervalMinutes * 60 * 1000;
      timerRef.current = setInterval(refresh, ms);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refresh]);

  const restartPolling = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const settings = loadSettings();
    if (settings.refresh.enabled) {
      const ms = settings.refresh.intervalMinutes * 60 * 1000;
      timerRef.current = setInterval(refresh, ms);
    }
    refresh();
  }, [refresh]);

  return { metrics, lastUpdated, loading, error, refresh, restartPolling };
}
