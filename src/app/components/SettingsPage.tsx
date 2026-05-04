import { useEffect, useMemo, useState } from 'react';
import {
  AppSettings,
  DETECTED_FACEBOOK_APP_ID,
  DETECTED_META_BUSINESS_ID,
  PlatformCredentialKey,
  PlatformCredentials,
  loadSettings,
  saveSettings,
} from '../services/apiConfig';
import {
  OAUTH_PLATFORMS,
  buildOAuthStartUrl,
  connectPlatformAccount,
  disconnectPlatformAccount,
  refreshManagedConnection,
} from '../services/oauthConnections';
import { diagnoseConnection } from '../services/connectionAgent';
import { getOAuthGuide } from '../services/oauthGuides';
import {
  buildFacebookLoginUrl,
  clearFacebookOAuthHash,
  FACEBOOK_KNOWN_REDIRECT_URIS,
  FACEBOOK_REQUIRED_SCOPES,
  readFacebookOAuthHash,
  syncInstagramFromFacebook,
  validateFacebookBusinessToken,
} from '../services/facebookBusinessOAuth';
import {
  buildYouTubeLoginUrl,
  clearYouTubeOAuthHash,
  readYouTubeOAuthHash,
  validateYouTubeToken,
  YOUTUBE_KNOWN_REDIRECT_URIS,
  YOUTUBE_REQUIRED_SCOPES,
} from '../services/youtubeOAuth';
import {
  AlertCircle,
  BookOpen,
  Bot,
  CheckCircle,
  ExternalLink,
  Info,
  Link2,
  Lock,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Unlink,
  Wifi,
  WifiOff,
} from 'lucide-react';

type TestResult = { status: 'idle' | 'loading' | 'ok' | 'error'; message?: string };

function hasLegacyCredential(credentials: PlatformCredentials, platform: PlatformCredentialKey): boolean {
  const record = credentials[platform] as Record<string, unknown> | undefined;
  if (!record) return false;
  return Object.entries(record).some(([key, value]) =>
    ['accessToken', 'apiKey', 'bearerToken'].includes(key) && typeof value === 'string' && value.length > 0
  );
}

function formatDate(value?: string): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const FINDING_STYLE = {
  success: 'bg-green-50 text-green-700 border-green-100',
  info: 'bg-blue-50 text-blue-700 border-blue-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  error: 'bg-red-50 text-red-700 border-red-100',
};

function getFacebookSafeRedirectUri(): string {
  const origin = new URL(window.location.origin);
  if (origin.hostname === '127.0.0.1') {
    origin.hostname = 'localhost';
  }
  return `${origin.origin}/configuracoes`;
}

function getLocalSafeRedirectUri(): string {
  const origin = new URL(window.location.origin);
  if (origin.hostname === '127.0.0.1') {
    origin.hostname = 'localhost';
  }
  return `${origin.origin}/configuracoes`;
}

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [authorizing, setAuthorizing] = useState<PlatformCredentialKey | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [saved, setSaved] = useState(false);

  const verifiedCount = useMemo(() => {
    return Object.values(settings.connections).filter(c => c?.validationStatus === 'verified').length;
  }, [settings.connections]);

  const facebookRedirectUri = getFacebookSafeRedirectUri();
  const youtubeRedirectUri = getLocalSafeRedirectUri();
  const facebookRedirectUris = useMemo(() => {
    return Array.from(new Set([facebookRedirectUri, ...FACEBOOK_KNOWN_REDIRECT_URIS]));
  }, [facebookRedirectUri]);
  const youtubeRedirectUris = useMemo(() => {
    return Array.from(new Set([youtubeRedirectUri, ...YOUTUBE_KNOWN_REDIRECT_URIS]));
  }, [youtubeRedirectUri]);
  const facebookAppIdReady = /^\d{8,}$/.test(settings.facebookAppId?.trim() ?? '');
  const facebookSetupReady = facebookAppIdReady && facebookRedirectUris.includes(facebookRedirectUri);
  const youtubeClientIdReady = !!settings.youtubeClientId?.trim();

  useEffect(() => {
    const params = readFacebookOAuthHash();
    if (!params) return;

    setTestResults(r => ({ ...r, facebook: { status: 'loading', message: 'Validando retorno da Meta...' } }));
    validateFacebookBusinessToken(settings, params)
      .then(result => {
        setSettings(result.settings);
        setTestResults(r => ({
          ...r,
          facebook: { status: result.ok ? 'ok' : 'error', message: result.message },
        }));
      })
      .catch(error => {
        setTestResults(r => ({
          ...r,
          facebook: { status: 'error', message: error instanceof Error ? error.message : 'Falha ao validar Facebook.' },
        }));
      })
      .finally(clearFacebookOAuthHash);
  }, []);

  useEffect(() => {
    const params = readYouTubeOAuthHash();
    if (!params) return;

    setTestResults(r => ({ ...r, youtube: { status: 'loading', message: 'Validando retorno do Google...' } }));
    validateYouTubeToken(settings, params)
      .then(result => {
        setSettings(result.settings);
        setTestResults(r => ({
          ...r,
          youtube: { status: result.ok ? 'ok' : 'error', message: result.message },
        }));
      })
      .catch(error => {
        setTestResults(r => ({
          ...r,
          youtube: { status: 'error', message: error instanceof Error ? error.message : 'Falha ao validar YouTube.' },
        }));
      })
      .finally(clearYouTubeOAuthHash);
  }, []);

  function persist(next: AppSettings) {
    setSettings(next);
    saveSettings(next);
  }

  function handleSave() {
    persist(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleAuthorize(platform: PlatformCredentialKey) {
    if (platform === 'instagram') {
      const facebookVerified = settings.connections.facebook?.validationStatus === 'verified';
      if (facebookVerified) {
        setTestResults(r => ({ ...r, instagram: { status: 'loading', message: 'Validando Instagram pela Meta...' } }));
        syncInstagramFromFacebook(settings)
          .then(result => {
            persist(result.settings);
            setAuthorizing(null);
            setTestResults(r => ({
              ...r,
              instagram: { status: result.ok ? 'ok' : 'error', message: result.message },
            }));
          })
          .catch(error => {
            setTestResults(r => ({
              ...r,
              instagram: { status: 'error', message: error instanceof Error ? error.message : 'Falha ao validar Instagram pela Meta.' },
            }));
          });
        return;
      }

      persist({ ...settings, facebookAppId: DETECTED_FACEBOOK_APP_ID });
      window.location.href = buildFacebookLoginUrl(DETECTED_FACEBOOK_APP_ID, facebookRedirectUri);
      return;
    }

    if (platform === 'facebook') {
      const appId = settings.facebookAppId?.trim();
      if (!appId || !/^\d{8,}$/.test(appId)) {
        setAuthorizing(platform);
        setTestResults(r => ({
          ...r,
          facebook: {
            status: 'error',
            message: 'Informe um Facebook App ID numerico valido antes de conectar. O Business estar logado na maquina nao substitui o App ID do OAuth.',
          },
        }));
        return;
      }

      persist({ ...settings, facebookAppId: DETECTED_FACEBOOK_APP_ID });
      window.location.href = buildFacebookLoginUrl(DETECTED_FACEBOOK_APP_ID, facebookRedirectUri);
      return;
    }

    if (platform === 'youtube') {
      const clientId = settings.youtubeClientId?.trim();
      if (!clientId) {
        setTestResults(r => ({
          ...r,
          youtube: {
            status: 'error',
            message: 'Informe o Google OAuth Client ID antes de conectar o YouTube.',
          },
        }));
        return;
      }

      persist(settings);
      window.location.href = buildYouTubeLoginUrl(clientId, youtubeRedirectUri);
      return;
    }

    const startUrl = buildOAuthStartUrl(settings, platform);
    if (startUrl) {
      const next = connectPlatformAccount(settings, platform);
      persist(next);
      setAuthorizing(null);
      window.open(startUrl, '_blank', 'noopener,noreferrer');
      setTestResults(r => ({
        ...r,
        [platform]: {
          status: 'ok',
          message: 'Autorizacao aberta no conector OAuth. A conta so sera validada quando o provedor devolver evidencia real.',
        },
      }));
      return;
    }

    setTestResults(r => ({
      ...r,
      [platform]: {
        status: 'error',
        message: 'Conector OAuth nao configurado. Nenhuma conta foi considerada validada e nenhum dado sera exibido.',
      },
    }));
  }

  function handleDisconnect(platform: PlatformCredentialKey) {
    const ok = window.confirm(
      'Desconectar esta conta remove tokens, solicitacoes de vinculo e evidencias salvas neste navegador. Continuar?'
    );
    if (!ok) return;

    const next = disconnectPlatformAccount(settings, platform);
    persist(next);
    setAuthorizing(current => current === platform ? null : current);
    setTestResults(r => ({
      ...r,
      [platform]: { status: 'ok', message: 'Conta desconectada deste navegador.' },
    }));
  }

  function handleSync(platform: PlatformCredentialKey) {
    if (platform === 'instagram') {
      setTestResults(r => ({ ...r, instagram: { status: 'loading' } }));
      syncInstagramFromFacebook(settings)
        .then(result => {
          persist(result.settings);
          setTestResults(r => ({
            ...r,
            instagram: { status: result.ok ? 'ok' : 'error', message: result.message },
          }));
        })
        .catch(error => {
          setTestResults(r => ({
            ...r,
            instagram: { status: 'error', message: error instanceof Error ? error.message : 'Falha ao validar Instagram.' },
          }));
        });
      return;
    }

    if (platform === 'youtube' && settings.connections.youtube?.validationStatus !== 'verified') {
      const clientId = settings.youtubeClientId?.trim();
      if (!clientId) {
        setTestResults(r => ({
          ...r,
          youtube: { status: 'error', message: 'Informe o Google OAuth Client ID e conecte novamente o YouTube.' },
        }));
        return;
      }
      window.location.href = buildYouTubeLoginUrl(clientId, youtubeRedirectUri);
      return;
    }

    const connection = settings.connections[platform];
    if (!connection) {
      setTestResults(r => ({
        ...r,
        [platform]: { status: 'error', message: 'Conecte a conta antes de sincronizar.' },
      }));
      return;
    }

    setTestResults(r => ({ ...r, [platform]: { status: 'loading' } }));
    const next = refreshManagedConnection(settings, platform);
    persist(next);
    setTestResults(r => ({
      ...r,
      [platform]: {
        status: connection.validationStatus === 'verified' ? 'ok' : 'error',
        message: connection.validationStatus === 'verified'
          ? 'Conexao verificada e token renovado pelo conector.'
          : 'Nao ha evidencia do provedor. O proto agente listou o que impede a validacao.',
      },
    }));
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-900 flex items-center gap-3">
            <Settings size={26} className="text-blue-600" />
            Configuracoes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Conexoes reais, tokens fora do frontend e evidencia antes de liberar metricas.
          </p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm transition-colors ${
            saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saved ? <><CheckCircle size={16} /> Salvo</> : <><Save size={16} /> Salvar</>}
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Link2 size={14} />
            Contas validadas
          </div>
          <div className="text-2xl text-gray-900">{verifiedCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <ShieldCheck size={14} />
            Permissoes
          </div>
          <div className="text-sm text-gray-900">Minimas e auditaveis</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Lock size={14} />
            Dados simulados
          </div>
          <div className="text-sm text-gray-900">Bloqueados no Analytics</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="text-base text-gray-800 flex items-center gap-2">
          <Bot size={17} className="text-blue-600" />
          Proto agente de conexao
        </h2>
        <p className="text-sm text-gray-600">
          A ferramenta diagnostica cada plataforma, identifica o bloqueio e orienta a correcao. Sem evidencia real, a conta nao entra no Analytics.
        </p>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">URL do conector OAuth seguro</label>
          <input
            value={settings.oauthBackendUrl ?? ''}
            onChange={e => setSettings(s => ({ ...s, oauthBackendUrl: e.target.value }))}
            placeholder="https://seu-dominio.com/api ou http://localhost:8787"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            O conector faz a troca segura do codigo OAuth por tokens reais e devolve evidencia da conta autorizada.
          </p>
        </div>
        <div className="border border-blue-100 rounded-lg p-4 bg-blue-50">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm text-blue-900">Facebook Business nesta maquina</h3>
              <p className="text-xs text-blue-700 mt-1">
                Business detectado nas abas Meta: {DETECTED_META_BUSINESS_ID}. O App ID esta fixo para este projeto.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettings(s => ({ ...s, facebookAppId: DETECTED_FACEBOOK_APP_ID }))}
              className="text-xs bg-blue-600 text-white border border-blue-600 px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Usar App ID {DETECTED_FACEBOOK_APP_ID}
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-blue-800 mb-1 block">Facebook App ID fixo</label>
              <input
                value={DETECTED_FACEBOOK_APP_ID}
                readOnly
                className="w-full border border-blue-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-blue-800 mb-1 block">Redirect URI atual</label>
              <input
                value={facebookRedirectUri}
                readOnly
                className="w-full border border-blue-100 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-2 mt-3">
            <div className={`rounded-lg border p-3 ${facebookAppIdReady ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
              <p className="text-xs font-medium">App ID</p>
              <p className="text-xs mt-1">{facebookAppIdReady ? 'Configurado' : 'Pendente'}</p>
            </div>
            <div className="rounded-lg border p-3 bg-green-50 border-green-100 text-green-700">
              <p className="text-xs font-medium">Redirect local</p>
              <p className="text-xs mt-1">Pronto para esta porta</p>
            </div>
            <div className={`rounded-lg border p-3 ${facebookSetupReady ? 'bg-green-50 border-green-100 text-green-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
              <p className="text-xs font-medium">Status de preparo</p>
              <p className="text-xs mt-1">{facebookSetupReady ? 'Pode tentar conectar' : 'Revise App ID/URI'}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs text-blue-900 mb-2">Cadastre estas URLs em Meta Developers &gt; Facebook Login &gt; Valid OAuth Redirect URIs:</p>
            <div className="space-y-2">
              {facebookRedirectUris.map(uri => (
                <input
                  key={uri}
                  value={uri}
                  readOnly
                  className="w-full border border-blue-100 rounded-lg px-3 py-2 text-xs bg-white text-gray-700 font-mono"
                />
              ))}
            </div>
          </div>

          <div className="mt-3 text-xs text-blue-800 space-y-1">
            <p>1. No Meta Developers, abra o App {settings.facebookAppId || DETECTED_FACEBOOK_APP_ID} e confirme Facebook Login.</p>
            <p>2. Cadastre as Redirect URIs com localhost listadas acima, incluindo dev 5173 e exe 5174. Nao use 127.0.0.1 no Facebook Login.</p>
            <p>3. Garanta as permissoes: {FACEBOOK_REQUIRED_SCOPES.join(', ')}.</p>
            <p>4. Clique em Conectar Facebook. A validacao so passa se a Graph API retornar pagina, Page Access Token e metricas reais.</p>
          </div>
        </div>
        <div className="border border-red-100 rounded-lg p-4 bg-red-50">
          <h3 className="text-sm text-red-900 mb-2">YouTube OAuth</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-red-800 mb-1 block">Google OAuth Client ID</label>
              <input
                value={settings.youtubeClientId ?? ''}
                onChange={e => setSettings(s => ({ ...s, youtubeClientId: e.target.value }))}
                placeholder="Ex.: 000000000000-xxxxxxxx.apps.googleusercontent.com"
                className="w-full border border-red-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-red-800 mb-1 block">Redirect URI atual</label>
              <input
                value={youtubeRedirectUri}
                readOnly
                className="w-full border border-red-100 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-2 mt-3">
            <div className={`rounded-lg border p-3 ${youtubeClientIdReady ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
              <p className="text-xs font-medium">Client ID</p>
              <p className="text-xs mt-1">{youtubeClientIdReady ? 'Configurado' : 'Pendente'}</p>
            </div>
            <div className="rounded-lg border p-3 bg-green-50 border-green-100 text-green-700">
              <p className="text-xs font-medium">Escopo</p>
              <p className="text-xs mt-1">Somente leitura do canal</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-red-900 mb-2">Cadastre estas URLs no Google Cloud OAuth Client:</p>
            <div className="space-y-2">
              {youtubeRedirectUris.map(uri => (
                <input
                  key={uri}
                  value={uri}
                  readOnly
                  className="w-full border border-red-100 rounded-lg px-3 py-2 text-xs bg-white text-gray-700 font-mono"
                />
              ))}
            </div>
          </div>
          <div className="mt-3 text-xs text-red-800 space-y-1">
            <p>1. No Google Cloud, crie um OAuth Client ID do tipo Web Application.</p>
            <p>2. Ative a YouTube Data API v3 e cadastre as Redirect URIs com localhost acima.</p>
            <p>3. Use o escopo: {YOUTUBE_REQUIRED_SCOPES.join(', ')}.</p>
            <p>4. Volte aqui, cole o Client ID e clique em Conectar YouTube.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base text-gray-800 mb-4 flex items-center gap-2">
          <RefreshCw size={17} className="text-blue-600" />
          Atualizacao automatica
        </h2>
        <div className="flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={() => setSettings(s => ({ ...s, refresh: { ...s.refresh, enabled: !s.refresh.enabled } }))}
            className="flex items-center gap-2"
          >
            <span className={`w-11 h-6 rounded-full transition-colors relative ${settings.refresh.enabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.refresh.enabled ? 'left-5' : 'left-0.5'}`} />
            </span>
            <span className="text-sm text-gray-700">Polling ativo</span>
          </button>
          {settings.refresh.enabled && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Atualizar a cada</span>
              <select
                value={settings.refresh.intervalMinutes}
                onChange={e => setSettings(s => ({
                  ...s,
                  refresh: { ...s.refresh, intervalMinutes: Number(e.target.value) },
                }))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
              >
                {[5, 10, 15, 30, 60].map(v => (
                  <option key={v} value={v}>{v} minutos</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {OAUTH_PLATFORMS.map(platform => {
          const connection = settings.connections[platform.key];
          const legacy = !connection && hasLegacyCredential(settings.credentials, platform.key);
          const test = testResults[platform.key];
          const isAuthorizing = authorizing === platform.key;
          const verified = connection?.validationStatus === 'verified';
          const report = diagnoseConnection(settings, platform.key);
          const guide = getOAuthGuide(platform.key);

          return (
            <div key={platform.key} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.name[0]}
                  </div>
                  <div>
                    <span className="text-base text-gray-900">{platform.name}</span>
                    <p className="text-xs text-gray-500">{platform.accountKind}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {verified ? (
                    <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                      <Wifi size={13} /> Validado
                    </span>
                  ) : connection ? (
                    <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                      <AlertCircle size={13} /> Aguardando evidencia
                    </span>
                  ) : legacy ? (
                    <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                      <AlertCircle size={13} /> Token antigo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded-full">
                      <WifiOff size={13} /> Nao vinculado
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {connection ? (
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Conta</p>
                      <p className="text-sm text-gray-900">{connection.accountName}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Evidencia</p>
                      <p className="text-sm text-gray-900">{verified ? 'Recebida do provedor' : 'Pendente'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Validade</p>
                      <p className="text-sm text-gray-900">{verified ? formatDate(connection.tokenExpiresAt) : '-'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                    <Info size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                      Conecte a conta pelo provedor. O frontend nao aceita tokens colados; ele exige resposta validada do conector OAuth.
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm text-gray-800 mb-2 flex items-center gap-2">
                    <ShieldCheck size={15} className="text-green-600" />
                    Permissoes solicitadas
                  </h3>
                  <div className="grid md:grid-cols-3 gap-2">
                    {platform.scopes.map(scope => (
                      <div key={scope.id} className="border border-gray-100 rounded-lg p-3">
                        <p className="text-xs text-gray-900 mb-1">{scope.label}</p>
                        <p className="text-xs text-gray-500">{scope.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-100 rounded-lg p-3">
                  <h3 className="text-sm text-gray-800 mb-2 flex items-center gap-2">
                    <Bot size={15} className="text-blue-600" />
                    Diagnostico do proto agente
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">{report.summary}</p>
                  <div className="space-y-2">
                    {report.findings.map(finding => (
                      <div key={`${finding.title}-${finding.action}`} className={`border rounded-lg p-3 ${FINDING_STYLE[finding.severity]}`}>
                        <p className="text-xs font-medium">{finding.title}</p>
                        <p className="text-xs mt-1 opacity-90">{finding.detail}</p>
                        <p className="text-xs mt-2">Acao: {finding.action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                  <h3 className="text-sm text-gray-800 mb-2 flex items-center gap-2">
                    <BookOpen size={15} className="text-slate-600" />
                    {guide.title}
                  </h3>
                  <div className="grid md:grid-cols-[1fr_auto] gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-2">
                        Necessario: {guide.requiredInput}
                      </p>
                      <ol className="list-decimal pl-4 space-y-1">
                        {guide.steps.map(step => (
                          <li key={step} className="text-xs text-gray-600">{step}</li>
                        ))}
                      </ol>
                    </div>
                    <div className="flex md:flex-col flex-wrap gap-2">
                      {guide.docs.map(doc => (
                        <a
                          key={doc.url}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs border border-slate-200 bg-white text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <ExternalLink size={12} />
                          {doc.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                {(isAuthorizing || connection) && (
                  <div className="border border-green-100 bg-green-50 rounded-lg p-3">
                    <h3 className="text-sm text-green-800 mb-2 flex items-center gap-2">
                      <Lock size={15} />
                      Limites de privacidade
                    </h3>
                    <div className="grid md:grid-cols-2 gap-2">
                      {platform.privacy.map(item => (
                        <p key={item} className="text-xs text-green-700 flex items-start gap-2">
                          <CheckCircle size={13} className="mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {isAuthorizing && !connection && (
                  <div className="border border-blue-100 rounded-lg p-4">
                    <p className="text-sm text-gray-800 mb-3">
                      Solicitar autorizacao de {platform.name} com as permissoes acima?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleAuthorize(platform.key)}
                        className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <CheckCircle size={14} />
                        Solicitar autorizacao
                      </button>
                      <button
                        onClick={() => setAuthorizing(null)}
                        className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {test && test.status !== 'idle' && (
                  <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                    test.status === 'loading' ? 'bg-gray-50 text-gray-600' :
                    test.status === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {test.status === 'loading' && <RefreshCw size={15} className="animate-spin mt-0.5 flex-shrink-0" />}
                    {test.status === 'ok' && <CheckCircle size={15} className="mt-0.5 flex-shrink-0" />}
                    {test.status === 'error' && <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />}
                    <span className="text-xs">{test.status === 'loading' ? 'Sincronizando...' : test.message}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {connection ? (
                    <>
                      <button
                        onClick={() => handleSync(platform.key)}
                        disabled={test?.status === 'loading'}
                        className="flex items-center gap-2 text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={test?.status === 'loading' ? 'animate-spin' : ''} />
                        Verificar evidencia
                      </button>
                      <button
                        onClick={() => handleDisconnect(platform.key)}
                        className="flex items-center gap-2 text-sm border border-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Unlink size={14} />
                        Desconectar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setAuthorizing(platform.key)}
                      className="flex items-center gap-2 text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Link2 size={14} />
                      {legacy ? 'Reautorizar conta' : `Conectar ${platform.name}`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex items-start gap-3">
        <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-amber-800">
            O app nao exibira dados simulados. Para validar contas reais, configure um conector OAuth com client IDs, secrets e escopos aprovados pelas plataformas.
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Instagram usa a conexao Meta/Facebook; YouTube usa Google OAuth Client ID; LinkedIn, Twitter/X e TikTok ainda precisam de conector OAuth seguro.
          </p>
        </div>
      </div>
    </div>
  );
}
