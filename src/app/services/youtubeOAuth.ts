import {
  AppSettings,
  ConnectedPlatformAccount,
  YouTubeCreds,
  saveSettings,
} from './apiConfig';
import { fetchYouTubeMetrics } from './platformAPIs';

const YOUTUBE_OAUTH_STATE_KEY = 'pad_youtube_oauth_state';

export const YOUTUBE_REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
];

export const YOUTUBE_KNOWN_REDIRECT_URIS = [
  'http://localhost:5173/configuracoes',
  'http://localhost:5174/configuracoes',
];

export interface YouTubeOAuthResult {
  ok: boolean;
  settings: AppSettings;
  message: string;
}

export function buildYouTubeLoginUrl(clientId: string, redirectUri: string): string {
  const state = `pad-youtube-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(YOUTUBE_OAUTH_STATE_KEY, state);

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'token');
  url.searchParams.set('state', state);
  url.searchParams.set('scope', YOUTUBE_REQUIRED_SCOPES.join(' '));
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('prompt', 'consent');
  return url.toString();
}

export function readYouTubeOAuthHash(): URLSearchParams | null {
  if (!window.location.hash.includes('access_token=') && !window.location.hash.includes('error=')) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const state = params.get('state') ?? '';
  const expectedState = sessionStorage.getItem(YOUTUBE_OAUTH_STATE_KEY) ?? '';
  if (!state.startsWith('pad-youtube-') && !expectedState.startsWith('pad-youtube-')) return null;
  return params;
}

export function clearYouTubeOAuthHash() {
  window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
}

export async function validateYouTubeToken(
  currentSettings: AppSettings,
  params: URLSearchParams
): Promise<YouTubeOAuthResult> {
  const oauthError = params.get('error');
  if (oauthError) {
    const description = params.get('error_description') || oauthError;
    return {
      ok: false,
      settings: currentSettings,
      message: `O Google recusou ou cancelou a autorizacao: ${description}`,
    };
  }

  const accessToken = params.get('access_token');
  const state = params.get('state');
  const expectedState = sessionStorage.getItem(YOUTUBE_OAUTH_STATE_KEY);
  sessionStorage.removeItem(YOUTUBE_OAUTH_STATE_KEY);

  if (!accessToken) {
    return { ok: false, settings: currentSettings, message: 'O Google nao devolveu access_token.' };
  }
  if (!state || !expectedState || state !== expectedState) {
    return { ok: false, settings: currentSettings, message: 'Estado OAuth invalido. Reinicie a conexao pelo botao Conectar YouTube.' };
  }

  const tokenExpiresAt = new Date(Date.now() + Number(params.get('expires_in') ?? 3600) * 1000).toISOString();
  const draftCredentials: YouTubeCreds = {
    accessToken,
    authMode: 'oauth',
    connectionId: `youtube-${Date.now()}`,
    tokenManaged: true,
    tokenExpiresAt,
  };
  const metrics = await fetchYouTubeMetrics(draftCredentials);
  if (metrics.status !== 'connected') {
    return {
      ok: false,
      settings: currentSettings,
      message: metrics.errorMessage ?? 'A chamada de metricas do YouTube falhou.',
    };
  }

  const checkedAt = new Date().toISOString();
  const credentials: YouTubeCreds = {
    ...draftCredentials,
    channelId: metrics.channelId,
  };
  const connection: ConnectedPlatformAccount = {
    platform: 'youtube',
    providerName: 'YouTube',
    accountName: metrics.subscribers !== undefined ? 'Canal YouTube autorizado' : 'YouTube autorizado',
    accountId: metrics.channelId ?? 'youtube-authenticated-channel',
    connectedAt: checkedAt,
    tokenExpiresAt,
    lastTokenRefresh: checkedAt,
    scopes: YOUTUBE_REQUIRED_SCOPES,
    privacy: [
      'Nao solicita senha do Google.',
      'Usa permissao somente de leitura do YouTube.',
      'Nao acessa Gmail, Drive, contatos pessoais ou dados de pagamento.',
      'Guarda o token somente neste navegador/ambiente local.',
    ],
    tokenManaged: true,
    validationStatus: 'verified',
    evidence: {
      checkedAt,
      source: 'YouTube Data API',
      summary: 'Canal YouTube validado via OAuth Google.',
      sampleMetrics: {
        subscribers: metrics.subscribers ?? 0,
        totalViews: metrics.totalViews ?? 0,
        totalVideos: metrics.totalPosts ?? 0,
      },
    },
  };

  const nextSettings: AppSettings = {
    ...currentSettings,
    credentials: {
      ...currentSettings.credentials,
      youtube: credentials,
    },
    connections: {
      ...currentSettings.connections,
      youtube: connection,
    },
  };
  saveSettings(nextSettings);

  return {
    ok: true,
    settings: nextSettings,
    message: 'YouTube validado com dados reais da YouTube Data API.',
  };
}
