export interface ManagedTokenFields {
  authMode?: 'manual' | 'oauth';
  connectionId?: string;
  tokenManaged?: boolean;
  tokenExpiresAt?: string;
}

export interface InstagramCreds extends ManagedTokenFields {
  accessToken: string;   // Page Access Token autorizado via Meta/Facebook
  userId: string;        // Instagram Business/Creator Account ID
}

export interface YouTubeCreds extends ManagedTokenFields {
  apiKey?: string;       // Google Cloud Console API Key
  accessToken?: string;  // OAuth access token autorizado pelo Google
  channelId?: string;    // YouTube Channel ID
}

export interface TwitterCreds extends ManagedTokenFields {
  bearerToken: string;   // Twitter/X App Bearer Token
  userId: string;        // Twitter numeric User ID
}

export interface LinkedInCreds extends ManagedTokenFields {
  accessToken: string;   // LinkedIn OAuth 2.0 Access Token
  organizationId: string; // LinkedIn Organization URN number
}

export interface FacebookCreds extends ManagedTokenFields {
  accessToken: string;   // Page Access Token
  pageId: string;        // Facebook Page ID
}

export interface TikTokCreds extends ManagedTokenFields {
  accessToken: string;   // TikTok for Business Access Token
}

export interface PlatformCredentials {
  instagram?: InstagramCreds;
  youtube?: YouTubeCreds;
  twitter?: TwitterCreds;
  linkedin?: LinkedInCreds;
  facebook?: FacebookCreds;
  tiktok?: TikTokCreds;
}

export type PlatformCredentialKey = keyof PlatformCredentials;

export interface ConnectedPlatformAccount {
  platform: PlatformCredentialKey;
  providerName: string;
  accountName: string;
  accountId: string;
  connectedAt: string;
  tokenExpiresAt: string;
  lastTokenRefresh: string;
  scopes: string[];
  privacy: string[];
  tokenManaged: boolean;
  validationStatus?: 'pending' | 'verified' | 'error';
  evidence?: {
    checkedAt: string;
    source: string;
    summary: string;
    sampleMetrics?: Record<string, number | string>;
  };
}

export type ConnectedAccounts = Partial<Record<PlatformCredentialKey, ConnectedPlatformAccount>>;

export interface RefreshConfig {
  enabled: boolean;
  intervalMinutes: number;
}

export interface AppSettings {
  credentials: PlatformCredentials;
  connections: ConnectedAccounts;
  oauthBackendUrl?: string;
  facebookAppId?: string;
  youtubeClientId?: string;
  refresh: RefreshConfig;
}

export const CORS_SUPPORT: Record<string, boolean> = {
  instagram: true,
  youtube: true,
  twitter: false,
  linkedin: false,
  facebook: true,
  tiktok: false,
};

const SETTINGS_KEY = 'cda_settings';

export const DETECTED_META_BUSINESS_ID = '918356768344160';
export const DETECTED_FACEBOOK_APP_ID = '2023320521557076';

const DEFAULT_SETTINGS: AppSettings = {
  credentials: {},
  connections: {},
  oauthBackendUrl: '',
  facebookAppId: DETECTED_FACEBOOK_APP_ID,
  youtubeClientId: '',
  refresh: { enabled: true, intervalMinutes: 10 },
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return normalizeSettings({
      ...DEFAULT_SETTINGS,
      ...parsed,
      facebookAppId: DEFAULT_SETTINGS.facebookAppId,
      youtubeClientId: parsed.youtubeClientId ?? DEFAULT_SETTINGS.youtubeClientId,
      credentials: parsed.credentials ?? {},
      connections: parsed.connections ?? {},
      refresh: { ...DEFAULT_SETTINGS.refresh, ...(parsed.refresh ?? {}) },
    });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadCredentials(): PlatformCredentials {
  return loadSettings().credentials;
}

export function isManagedCredential(creds?: ManagedTokenFields): boolean {
  return !!creds && (creds.authMode === 'oauth' || creds.tokenManaged === true);
}

function normalizeSettings(settings: AppSettings): AppSettings {
  const credentials = { ...settings.credentials };
  const connections = { ...settings.connections };

  (Object.keys(connections) as PlatformCredentialKey[]).forEach(platform => {
    const connection = connections[platform];
    if (!connection || connection.validationStatus === 'verified') return;

    const credential = credentials[platform];
    const hasRealCredential = !!credential && Object.values(credential).some(value =>
      typeof value === 'string' && value.length > 0
    );

    if (!hasRealCredential) {
      delete connections[platform];
    }
  });

  return {
    ...settings,
    credentials,
    connections,
  };
}
