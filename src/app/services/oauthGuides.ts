import { PlatformCredentialKey } from './apiConfig';

export interface OAuthGuide {
  platform: PlatformCredentialKey;
  title: string;
  mode: 'local' | 'backend' | 'derived';
  requiredInput: string;
  steps: string[];
  docs: Array<{ label: string; url: string }>;
}

const localRedirects = [
  'http://localhost:5173/configuracoes',
  'http://localhost:5174/configuracoes',
];

export const OAUTH_GUIDES: Record<PlatformCredentialKey, OAuthGuide> = {
  facebook: {
    platform: 'facebook',
    title: 'Caminho OAuth Facebook',
    mode: 'local',
    requiredInput: 'Nenhuma informacao nova: o App ID do projeto ja esta fixo em 2023320521557076.',
    steps: [
      'Abra Meta for Developers e selecione o app 2023320521557076.',
      'Em Facebook Login > Settings, cadastre as Redirect URIs com localhost.',
      'Garanta os escopos public_profile, pages_show_list, pages_read_engagement, read_insights e pages_manage_posts.',
      'Volte ao PAD e clique em Conectar Facebook.',
    ],
    docs: [
      { label: 'Facebook Login', url: 'https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/' },
      { label: 'Seguranca do login', url: 'https://developers.facebook.com/docs/facebook-login/security/' },
    ],
  },
  instagram: {
    platform: 'instagram',
    title: 'Caminho OAuth Instagram',
    mode: 'derived',
    requiredInput: 'Nenhuma credencial separada se o Instagram profissional estiver vinculado a Pagina Facebook autorizada.',
    steps: [
      'Confirme no Meta Business que o Instagram e Business ou Creator.',
      'Vincule esse Instagram a uma Pagina Facebook do mesmo Business.',
      'No app Meta 2023320521557076, conceda instagram_basic e instagram_manage_insights junto com a autorizacao do Facebook.',
      'No PAD, valide Facebook primeiro e depois clique em Verificar evidencia no card Instagram.',
    ],
    docs: [
      { label: 'Instagram Platform', url: 'https://developers.facebook.com/docs/instagram-platform/' },
      { label: 'Instagram com Facebook Login', url: 'https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/' },
      { label: 'Instagram Insights', url: 'https://developers.facebook.com/docs/instagram-platform/insights/' },
    ],
  },
  youtube: {
    platform: 'youtube',
    title: 'Caminho OAuth YouTube',
    mode: 'local',
    requiredInput: 'Google OAuth Client ID do tipo Web Application.',
    steps: [
      'No Google Cloud Console, crie ou selecione um projeto.',
      'Ative YouTube Data API v3 em APIs & Services > Library.',
      'Configure OAuth consent screen e adicione seu usuario como teste, se o app ainda nao estiver publicado.',
      'Crie Credentials > OAuth Client ID > Web application.',
      `Cadastre em Authorized redirect URIs: ${localRedirects.join(' e ')}.`,
      'Cole o Client ID no bloco YouTube OAuth do PAD e clique em Conectar YouTube.',
    ],
    docs: [
      { label: 'YouTube OAuth client-side', url: 'https://developers.google.com/youtube/v3/guides/auth/client-side-web-apps' },
      { label: 'YouTube Authentication', url: 'https://developers.google.com/youtube/v3/guides/authentication' },
    ],
  },
  linkedin: {
    platform: 'linkedin',
    title: 'Caminho OAuth LinkedIn',
    mode: 'backend',
    requiredInput: 'URL de conector OAuth seguro com Client ID e Client Secret configurados fora do frontend.',
    steps: [
      'Abra LinkedIn Developers e crie um app.',
      'Em Auth, cadastre uma Redirect URL do seu conector, por exemplo https://seu-dominio.com/oauth/linkedin/callback.',
      'Copie Client ID e Client Secret para o conector seguro, nunca para o frontend.',
      'Solicite os produtos/permissoes necessarios para organizacao e metricas.',
      'No PAD, informe a URL do conector OAuth seguro e clique em Conectar LinkedIn.',
    ],
    docs: [
      { label: 'LinkedIn Authorization Code Flow', url: 'https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow' },
    ],
  },
  twitter: {
    platform: 'twitter',
    title: 'Caminho OAuth Twitter / X',
    mode: 'backend',
    requiredInput: 'URL de conector OAuth seguro ou implementacao PKCE dedicada com armazenamento de refresh token.',
    steps: [
      'Abra X Developer Portal e selecione seu app.',
      'Ative OAuth 2.0 nas Authentication settings.',
      'Cadastre callback do conector, por exemplo https://seu-dominio.com/oauth/x/callback.',
      'Use escopos minimos tweet.read, users.read e offline.access se precisar renovar token.',
      'No PAD, informe a URL do conector OAuth seguro e clique em Conectar Twitter / X.',
    ],
    docs: [
      { label: 'X OAuth 2.0 Authorization Code', url: 'https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code' },
      { label: 'X user access token', url: 'https://docs.x.com/fundamentals/authentication/oauth-2-0/user-access-token' },
    ],
  },
  tiktok: {
    platform: 'tiktok',
    title: 'Caminho OAuth TikTok',
    mode: 'backend',
    requiredInput: 'URL de conector OAuth seguro com Client Key e Client Secret configurados fora do frontend.',
    steps: [
      'Abra TikTok for Developers e crie ou selecione um app.',
      'Ative Login Kit e, se necessario, Content Posting API.',
      'Cadastre a Redirect URI do conector ou localhost permitido pelo produto.',
      'Copie Client Key e Client Secret para o conector seguro.',
      'Solicite escopos como user.info.basic, video.list e video.publish conforme o caso.',
      'No PAD, informe a URL do conector OAuth seguro e clique em Conectar TikTok.',
    ],
    docs: [
      { label: 'TikTok Login Kit Web', url: 'https://developers.tiktok.com/doc/login-kit-web' },
      { label: 'TikTok token management', url: 'https://developers.tiktok.com/doc/oauth-user-access-token-management' },
      { label: 'TikTok Content Posting API', url: 'https://developers.tiktok.com/doc/content-posting-api-get-started/' },
    ],
  },
};

export function getOAuthGuide(platform: PlatformCredentialKey): OAuthGuide {
  return OAUTH_GUIDES[platform];
}
