import {
  AppSettings,
  ConnectedPlatformAccount,
  FacebookCreds,
  InstagramCreds,
  saveSettings,
} from './apiConfig';
import { fetchFacebookMetrics, fetchInstagramMetrics } from './platformAPIs';

const GRAPH_VERSION = 'v24.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const FACEBOOK_OAUTH_STATE_KEY = 'pad_facebook_oauth_state';

export const FACEBOOK_REQUIRED_SCOPES = [
  'public_profile',
  'pages_show_list',
  'pages_read_engagement',
  'read_insights',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_manage_insights',
  'instagram_content_publish',
];

export const FACEBOOK_KNOWN_REDIRECT_URIS = [
  'http://localhost:5173/configuracoes',
  'http://localhost:5174/configuracoes',
];

export interface FacebookOAuthResult {
  ok: boolean;
  settings: AppSettings;
  message: string;
}

interface FacebookPageAccount {
  id: string;
  name: string;
  access_token?: string;
  fan_count?: number;
  tasks?: string[];
  perms?: string[];
  instagram_business_account?: InstagramBusinessAccount;
}

interface InstagramBusinessAccount {
  id: string;
  username?: string;
  name?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
}

export function buildFacebookLoginUrl(appId: string, redirectUri: string): string {
  const state = `pad-facebook-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(FACEBOOK_OAUTH_STATE_KEY, state);

  const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
  url.searchParams.set('client_id', appId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'token');
  url.searchParams.set('state', state);
  url.searchParams.set('auth_type', 'rerequest');
  url.searchParams.set('scope', FACEBOOK_REQUIRED_SCOPES.join(','));
  return url.toString();
}

export function readFacebookOAuthHash(): URLSearchParams | null {
  if (!window.location.hash.includes('access_token=') && !window.location.hash.includes('error=')) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const state = params.get('state') ?? '';
  const expectedState = sessionStorage.getItem(FACEBOOK_OAUTH_STATE_KEY) ?? '';
  if (!state.startsWith('pad-facebook-') && !expectedState.startsWith('pad-facebook-')) return null;
  return params;
}

export function clearFacebookOAuthHash() {
  window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
}

async function graphGet<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${GRAPH_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Graph API HTTP ${response.status}`);
  }
  return data as T;
}

export async function validateFacebookBusinessToken(
  currentSettings: AppSettings,
  params: URLSearchParams
): Promise<FacebookOAuthResult> {
  const oauthError = params.get('error');
  if (oauthError) {
    const description = params.get('error_description') || params.get('error_reason') || oauthError;
    return {
      ok: false,
      settings: currentSettings,
      message: `A Meta recusou ou cancelou a autorizacao: ${description}`,
    };
  }

  const accessToken = params.get('access_token');
  const state = params.get('state');
  const expectedState = sessionStorage.getItem(FACEBOOK_OAUTH_STATE_KEY);
  sessionStorage.removeItem(FACEBOOK_OAUTH_STATE_KEY);

  if (!accessToken) {
    return { ok: false, settings: currentSettings, message: 'A Meta nao devolveu access_token.' };
  }
  if (!state || !expectedState || state !== expectedState) {
    return { ok: false, settings: currentSettings, message: 'Estado OAuth invalido. Reinicie a conexao pelo botao Conectar Facebook.' };
  }

  const me = await graphGet<{ id: string; name: string }>('/me?fields=id,name', accessToken);
  const accounts = await graphGet<{ data?: FacebookPageAccount[] }>(
    '/me/accounts?fields=id,name,access_token,fan_count,tasks,perms,instagram_business_account{id,username,name,followers_count,follows_count,media_count}',
    accessToken
  );
  const page = accounts.data?.find(item => !!item.access_token) ?? accounts.data?.[0];
  if (!page?.id || !page.access_token) {
    return {
      ok: false,
      settings: currentSettings,
      message: 'Sua conta autenticou, mas a Meta nao retornou uma Page Access Token. Verifique pages_show_list e sua funcao no Business/Page.',
    };
  }

  const credentials: FacebookCreds = {
    accessToken: page.access_token,
    pageId: page.id,
    authMode: 'oauth',
    connectionId: `facebook-${page.id}`,
    tokenManaged: true,
    tokenExpiresAt: new Date(Date.now() + Number(params.get('expires_in') ?? 60 * 24 * 60 * 60) * 1000).toISOString(),
  };
  const metrics = await fetchFacebookMetrics(credentials);
  if (metrics.status !== 'connected') {
    return {
      ok: false,
      settings: currentSettings,
      message: metrics.errorMessage ?? 'A pagina foi encontrada, mas a chamada de metricas falhou.',
    };
  }

  const checkedAt = new Date().toISOString();
  const connection: ConnectedPlatformAccount = {
    platform: 'facebook',
    providerName: 'Facebook',
    accountName: page.name,
    accountId: page.id,
    connectedAt: checkedAt,
    tokenExpiresAt: credentials.tokenExpiresAt ?? checkedAt,
    lastTokenRefresh: checkedAt,
    scopes: FACEBOOK_REQUIRED_SCOPES,
    privacy: [
      'Nao solicita senha da plataforma.',
      'Usa apenas a pagina retornada pela Meta durante a autorizacao.',
      'Nao acessa mensagens privadas, dados de pagamento ou contatos pessoais.',
      'Guarda o token somente neste navegador/ambiente local.',
    ],
    tokenManaged: true,
    validationStatus: 'verified',
    evidence: {
      checkedAt,
      source: 'Meta Graph API',
      summary: `Pagina "${page.name}" validada para ${me.name}.`,
      sampleMetrics: {
        pageId: page.id,
        followers: metrics.followers ?? page.fan_count ?? 0,
        totalPosts: metrics.totalPosts ?? 0,
        avgEngagement: metrics.avgEngagement ?? 0,
      },
    },
  };

  const instagramResult = await buildInstagramFromFacebookPage(page, credentials, checkedAt);

  const nextSettings: AppSettings = {
    ...currentSettings,
    credentials: {
      ...currentSettings.credentials,
      facebook: credentials,
      ...(instagramResult ? { instagram: instagramResult.credentials } : {}),
    },
    connections: {
      ...currentSettings.connections,
      facebook: connection,
      ...(instagramResult ? { instagram: instagramResult.connection } : {}),
    },
  };
  saveSettings(nextSettings);

  return {
    ok: true,
    settings: nextSettings,
    message: instagramResult
      ? `Facebook e Instagram validados: ${page.name} / ${instagramResult.connection.accountName}. Dados reais recebidos da Meta.`
      : `Facebook Business validado: ${page.name}. Instagram nao foi vinculado porque a Meta nao retornou uma conta profissional conectada a esta pagina.`,
  };
}

async function buildInstagramFromFacebookPage(
  page: FacebookPageAccount,
  facebookCredentials: FacebookCreds,
  checkedAt: string
): Promise<{ credentials: InstagramCreds; connection: ConnectedPlatformAccount } | null> {
  const instagram = page.instagram_business_account;
  if (!instagram?.id) return null;

  const credentials: InstagramCreds = {
    accessToken: facebookCredentials.accessToken,
    userId: instagram.id,
    authMode: 'oauth',
    connectionId: `instagram-${instagram.id}`,
    tokenManaged: true,
    tokenExpiresAt: facebookCredentials.tokenExpiresAt,
  };
  const metrics = await fetchInstagramMetrics(credentials);
  if (metrics.status !== 'connected') return null;

  const accountName = instagram.username ? `@${instagram.username}` : instagram.name ?? 'Instagram profissional';
  return {
    credentials,
    connection: {
      platform: 'instagram',
      providerName: 'Instagram',
      accountName,
      accountId: instagram.id,
      connectedAt: checkedAt,
      tokenExpiresAt: credentials.tokenExpiresAt ?? checkedAt,
      lastTokenRefresh: checkedAt,
      scopes: ['instagram_basic', 'instagram_manage_insights', 'instagram_content_publish', 'pages_read_engagement'],
      privacy: [
        'Nao solicita senha do Instagram.',
        'Usa apenas a conta profissional vinculada a pagina autorizada na Meta.',
        'Nao acessa mensagens privadas, contatos pessoais ou dados de pagamento.',
        'Guarda o token somente neste navegador/ambiente local.',
      ],
      tokenManaged: true,
      validationStatus: 'verified',
      evidence: {
        checkedAt,
        source: 'Meta Graph API',
        summary: `Instagram ${accountName} validado pela pagina ${page.name}.`,
        sampleMetrics: {
          instagramId: instagram.id,
          followers: metrics.followers ?? instagram.followers_count ?? 0,
          totalPosts: metrics.totalPosts ?? instagram.media_count ?? 0,
          avgEngagement: metrics.avgEngagement ?? 0,
        },
      },
    },
  };
}

export async function syncInstagramFromFacebook(settings: AppSettings): Promise<FacebookOAuthResult> {
  const facebookCredentials = settings.credentials.facebook;
  const facebookConnection = settings.connections.facebook;
  if (!facebookCredentials?.accessToken || !facebookCredentials.pageId || facebookConnection?.validationStatus !== 'verified') {
    return {
      ok: false,
      settings,
      message: 'Conecte e valide o Facebook primeiro. O Instagram sera derivado da pagina Meta autorizada.',
    };
  }

  const page = await graphGet<FacebookPageAccount>(
    `/${facebookCredentials.pageId}?fields=id,name,fan_count,instagram_business_account{id,username,name,followers_count,follows_count,media_count}`,
    facebookCredentials.accessToken
  );
  const checkedAt = new Date().toISOString();
  const instagramResult = await buildInstagramFromFacebookPage(page, facebookCredentials, checkedAt);
  if (!instagramResult) {
    return {
      ok: false,
      settings,
      message: 'A pagina Facebook validada nao retornou uma conta Instagram profissional com metricas. Verifique se o Instagram esta vinculado no Meta Business e se os escopos instagram_basic e instagram_manage_insights foram concedidos.',
    };
  }

  const nextSettings: AppSettings = {
    ...settings,
    credentials: {
      ...settings.credentials,
      instagram: instagramResult.credentials,
    },
    connections: {
      ...settings.connections,
      instagram: instagramResult.connection,
    },
  };
  saveSettings(nextSettings);
  return {
    ok: true,
    settings: nextSettings,
    message: `Instagram validado pela Meta: ${instagramResult.connection.accountName}.`,
  };
}
