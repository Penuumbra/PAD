import {
  AppSettings,
  ConnectedPlatformAccount,
  PlatformCredentialKey,
} from './apiConfig';

export interface OAuthScope {
  id: string;
  label: string;
  reason: string;
}

export interface OAuthPlatformDefinition {
  key: PlatformCredentialKey;
  name: string;
  color: string;
  accountKind: string;
  scopes: OAuthScope[];
  privacy: string[];
}

const DEFAULT_SCOPES: OAuthScope[] = [
  {
    id: 'profile.read',
    label: 'Identificar conta autorizada',
    reason: 'Confirma nome, identificador publico e contas/paginas que voce escolher vincular.',
  },
  {
    id: 'metrics.read',
    label: 'Ler metricas de performance',
    reason: 'Atualiza alcance, engajamento, seguidores, visualizacoes e estatisticas agregadas.',
  },
  {
    id: 'content.manage',
    label: 'Gerenciar conteudo aprovado',
    reason: 'Permite preparar, agendar ou publicar somente conteudos criados dentro do app.',
  },
];

const DEFAULT_PRIVACY = [
  'Nao solicita senha da plataforma.',
  'Nao acessa mensagens privadas, contatos pessoais ou dados de pagamento.',
  'Usa apenas a conta, pagina ou canal autorizado no momento da vinculacao.',
  'Mantem tokens ocultos e gerenciados pelo conector local do app.',
];

export const OAUTH_PLATFORMS: OAuthPlatformDefinition[] = [
  {
    key: 'instagram',
    name: 'Instagram',
    color: '#e1306c',
    accountKind: 'Conta profissional',
    scopes: [
      {
        id: 'instagram_basic',
        label: 'Identificar conta profissional',
        reason: 'Confirma o Instagram Business/Creator vinculado a pagina Meta autorizada.',
      },
      {
        id: 'instagram_manage_insights',
        label: 'Ler metricas do Instagram',
        reason: 'Atualiza seguidores, publicacoes, curtidas, comentarios e estatisticas permitidas pela Meta.',
      },
      {
        id: 'instagram_content_publish',
        label: 'Preparar publicacao aprovada',
        reason: 'Permite publicar somente conteudos criados ou aprovados dentro do app quando a permissao estiver liberada.',
      },
    ],
    privacy: DEFAULT_PRIVACY,
  },
  {
    key: 'youtube',
    name: 'YouTube',
    color: '#ff0000',
    accountKind: 'Canal',
    scopes: [
      {
        id: 'youtube.readonly',
        label: 'Ler canal autorizado',
        reason: 'Confirma o canal do usuario e dados publicos/estatisticos permitidos pela YouTube Data API.',
      },
      {
        id: 'metrics.read',
        label: 'Ler metricas do canal',
        reason: 'Atualiza inscritos, visualizacoes, videos publicados e estatisticas agregadas.',
      },
      {
        id: 'content.prepare',
        label: 'Preparar conteudo no PAD',
        reason: 'Permite planejar conteudos no app sem publicar no YouTube com o escopo atual.',
      },
    ],
    privacy: DEFAULT_PRIVACY,
  },
  {
    key: 'facebook',
    name: 'Facebook',
    color: '#1877f2',
    accountKind: 'Pagina',
    scopes: DEFAULT_SCOPES,
    privacy: DEFAULT_PRIVACY,
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    color: '#0a66c2',
    accountKind: 'Perfil ou organizacao',
    scopes: DEFAULT_SCOPES,
    privacy: DEFAULT_PRIVACY,
  },
  {
    key: 'twitter',
    name: 'Twitter / X',
    color: '#111827',
    accountKind: 'Conta',
    scopes: DEFAULT_SCOPES,
    privacy: DEFAULT_PRIVACY,
  },
  {
    key: 'tiktok',
    name: 'TikTok',
    color: '#010101',
    accountKind: 'Conta business',
    scopes: DEFAULT_SCOPES,
    privacy: DEFAULT_PRIVACY,
  },
];

export function getOAuthPlatform(key: PlatformCredentialKey): OAuthPlatformDefinition {
  const platform = OAUTH_PLATFORMS.find(p => p.key === key);
  if (!platform) throw new Error(`Plataforma nao suportada: ${key}`);
  return platform;
}

function makeId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function makeToken(prefix: string, connectionId: string): string {
  return `${prefix}_${connectionId}_${Math.random().toString(36).slice(2, 14)}`;
}

function futureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function connectPlatformAccount(
  settings: AppSettings,
  platformKey: PlatformCredentialKey
): AppSettings {
  const platform = getOAuthPlatform(platformKey);
  const now = new Date().toISOString();
  const tokenExpiresAt = futureDate(60);
  const connectionId = makeId(platformKey);
  const accountId = makeId(`${platformKey}_account`);
  const connection: ConnectedPlatformAccount = {
    platform: platformKey,
    providerName: platform.name,
    accountName: `${platform.name} aguardando validacao`,
    accountId,
    connectedAt: now,
    tokenExpiresAt,
    lastTokenRefresh: now,
    scopes: platform.scopes.map(scope => scope.id),
    privacy: platform.privacy,
    tokenManaged: false,
    validationStatus: 'pending',
    evidence: {
      checkedAt: now,
      source: 'Proto agente de conexao',
      summary: 'Autorizacao solicitada, mas ainda sem resposta verificavel do provedor OAuth.',
    },
  };
  const credentials = { ...settings.credentials };
  delete credentials[platformKey];

  return {
    ...settings,
    credentials,
    connections: {
      ...settings.connections,
      [platformKey]: connection,
    },
  };
}

export function disconnectPlatformAccount(
  settings: AppSettings,
  platformKey: PlatformCredentialKey
): AppSettings {
  const credentials = { ...settings.credentials };
  const connections = { ...settings.connections };
  delete credentials[platformKey];
  delete connections[platformKey];
  return { ...settings, credentials, connections };
}

export function refreshManagedConnection(
  settings: AppSettings,
  platformKey: PlatformCredentialKey
): AppSettings {
  const connection = settings.connections[platformKey];
  if (!connection) return settings;

  const tokenExpiresAt = futureDate(60);
  const lastTokenRefresh = new Date().toISOString();
  return {
    ...settings,
    connections: {
      ...settings.connections,
      [platformKey]: {
        ...connection,
        tokenExpiresAt,
        lastTokenRefresh,
        validationStatus: connection.validationStatus ?? 'pending',
        evidence: connection.evidence ?? {
          checkedAt: lastTokenRefresh,
          source: 'Proto agente de conexao',
          summary: 'Nao houve retorno verificavel do provedor; token nao foi renovado.',
        },
      },
    },
  };
}

export function buildOAuthStartUrl(settings: AppSettings, platformKey: PlatformCredentialKey): string | null {
  const base = settings.oauthBackendUrl?.trim();
  if (!base) return null;
  const url = new URL(base.replace(/\/$/, '') + '/oauth/start');
  url.searchParams.set('platform', platformKey);
  url.searchParams.set('requested_scopes', getOAuthPlatform(platformKey).scopes.map(scope => scope.id).join(','));
  return url.toString();
}
