import {
  AppSettings,
  DETECTED_FACEBOOK_APP_ID,
  PlatformCredentialKey,
  PlatformCredentials,
} from './apiConfig';
import { FACEBOOK_KNOWN_REDIRECT_URIS, FACEBOOK_REQUIRED_SCOPES } from './facebookBusinessOAuth';
import { getOAuthPlatform } from './oauthConnections';
import { PlatformMetrics } from './platformAPIs';
import { YOUTUBE_KNOWN_REDIRECT_URIS, YOUTUBE_REQUIRED_SCOPES } from './youtubeOAuth';

export interface ConnectionAgentFinding {
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  detail: string;
  action: string;
}

export interface ConnectionAgentReport {
  platform: PlatformCredentialKey;
  status: 'not_started' | 'waiting_backend' | 'waiting_provider' | 'validated' | 'failed';
  summary: string;
  findings: ConnectionAgentFinding[];
}

function hasLegacySecret(credentials: PlatformCredentials, platform: PlatformCredentialKey): boolean {
  const record = credentials[platform] as Record<string, unknown> | undefined;
  if (!record) return false;
  return Object.entries(record).some(([key, value]) =>
    ['accessToken', 'apiKey', 'bearerToken'].includes(key) && typeof value === 'string' && value.length > 0
  );
}

export function diagnoseConnection(
  settings: AppSettings,
  platform: PlatformCredentialKey,
  metrics?: PlatformMetrics
): ConnectionAgentReport {
  const definition = getOAuthPlatform(platform);
  const connection = settings.connections[platform];
  const findings: ConnectionAgentFinding[] = [];

  if (!settings.oauthBackendUrl?.trim()) {
    if (platform === 'facebook' && settings.facebookAppId?.trim()) {
      findings.push({
        severity: 'info',
        title: 'Facebook pode usar OAuth local',
        detail: 'Ha um Facebook App ID configurado. O app pode abrir o login da Meta nesta maquina e validar a pagina retornada pelo Business.',
        action: 'Clique em Conectar Facebook e autorize os escopos Meta solicitados.',
      });
    } else if (platform === 'instagram') {
      const facebookVerified = settings.connections.facebook?.validationStatus === 'verified';
      findings.push({
        severity: facebookVerified ? 'info' : 'warning',
        title: facebookVerified ? 'Instagram usa a conexao Meta' : 'Conecte Facebook primeiro',
        detail: facebookVerified
          ? 'O Instagram profissional sera validado pela pagina Facebook conectada, usando a Meta Graph API.'
          : 'Para metricas reais do Instagram profissional, a Meta exige uma pagina Facebook autorizada e vinculada ao Instagram.',
        action: facebookVerified
          ? 'Clique em Verificar evidencia no Instagram para buscar a conta profissional vinculada.'
          : 'Conecte Facebook com instagram_basic e instagram_manage_insights, depois volte ao Instagram.',
      });
    } else if (platform === 'youtube' && settings.youtubeClientId?.trim()) {
      findings.push({
        severity: 'info',
        title: 'YouTube pode usar OAuth Google',
        detail: `Client ID configurado. Escopo esperado: ${YOUTUBE_REQUIRED_SCOPES.join(', ')}.`,
        action: `Cadastre as Redirect URIs ${YOUTUBE_KNOWN_REDIRECT_URIS.join(' e ')} no Google Cloud e clique em Conectar YouTube.`,
      });
    } else {
      findings.push({
        severity: 'error',
        title: platform === 'youtube' ? 'Google OAuth Client ID nao configurado' : 'Conector OAuth nao configurado',
        detail: platform === 'facebook'
          ? 'Para Facebook, configure pelo menos o Facebook App ID ou um conector OAuth backend. Sem isso, a Meta nao sabe qual app esta solicitando permissao.'
          : platform === 'youtube'
            ? 'Para YouTube, informe um Google OAuth Client ID. Sem ele, o Google nao sabe qual app esta solicitando consentimento.'
            : `${definition.name} exige token real emitido pelo provedor. Sem conector/backend OAuth, nenhuma conta sera validada.`,
        action: platform === 'facebook'
          ? `Use o App ID ${DETECTED_FACEBOOK_APP_ID} e cadastre as Redirect URIs ${FACEBOOK_KNOWN_REDIRECT_URIS.join(' e ')} no Meta Developers.`
          : platform === 'youtube'
            ? 'Cole o Google OAuth Client ID no bloco YouTube OAuth e cadastre as Redirect URIs mostradas na tela.'
            : 'Configure a URL do conector OAuth seguro da empresa para LinkedIn, Twitter/X ou TikTok e tente conectar novamente.',
      });
    }
  }

  if (platform === 'facebook' && settings.facebookAppId?.trim()) {
    findings.push({
      severity: 'info',
      title: 'Checklist Meta antes de conectar',
      detail: `Escopos esperados: ${FACEBOOK_REQUIRED_SCOPES.join(', ')}. App sugerido nesta sessao: ${DETECTED_FACEBOOK_APP_ID}. O app so valida quando a Meta retorna Page Access Token e metricas reais.`,
      action: 'Confirme Facebook Login no Meta Developers, adicione as Redirect URIs locais e clique em Conectar Facebook neste app.',
    });
  }

  if (!connection) {
    findings.push({
      severity: 'info',
      title: 'Conta ainda nao autorizada',
      detail: `Nenhuma solicitacao de vinculo foi registrada para ${definition.name}.`,
      action: `Clique em Conectar ${definition.name}, revise as permissoes e conclua a autorizacao no provedor.`,
    });
  } else if (connection.validationStatus !== 'verified') {
    findings.push({
      severity: 'warning',
      title: 'Sem evidencia efetiva do provedor',
      detail: 'Existe uma solicitacao local, mas ainda nao ha payload validado com conta, token gerenciado e amostra de dados reais.',
      action: 'Conclua o OAuth pelo provedor e aguarde o conector devolver dados de conta e metricas verificaveis.',
    });
  }

  if (hasLegacySecret(settings.credentials, platform)) {
    findings.push({
      severity: 'warning',
      title: 'Credencial manual antiga detectada',
      detail: 'Ha uma chave/token salvo no navegador. Ela nao sera usada como evidencia de conexao automatizada.',
      action: 'Reautorize pelo fluxo OAuth e remova credenciais manuais antigas ao desconectar.',
    });
  }

  if (metrics?.status === 'connected') {
    findings.push({
      severity: 'success',
      title: 'Dados reais recebidos',
      detail: 'A conta retornou metricas atuais por uma chamada validada do provedor/conector.',
      action: 'Use Atualizar para buscar novos dados e acompanhe a evidencia na tela de Configuracoes.',
    });
  } else if (metrics?.status === 'error') {
    findings.push({
      severity: 'error',
      title: 'Falha ao buscar metricas',
      detail: metrics.errorMessage ?? 'A API recusou a chamada ou o conector nao retornou uma resposta valida.',
      action: 'Revise permissoes, escopos aprovados, validade do token e logs do conector OAuth.',
    });
  }

  if (findings.length === 0) {
    findings.push({
      severity: 'success',
      title: 'Conexao validada',
      detail: 'A plataforma possui evidencia de conta conectada e tokens gerenciados fora do frontend.',
      action: 'Nenhuma acao necessaria no momento.',
    });
  }

  const hasError = findings.some(f => f.severity === 'error');
  const hasWarning = findings.some(f => f.severity === 'warning');
  const status: ConnectionAgentReport['status'] =
    metrics?.status === 'connected' || connection?.validationStatus === 'verified' ? 'validated' :
    hasError ? 'waiting_backend' :
    hasWarning ? 'waiting_provider' :
    connection ? 'waiting_provider' : 'not_started';

  return {
    platform,
    status,
    summary:
      status === 'validated' ? `${definition.name} validado com evidencia real.` :
      status === 'waiting_backend' ? `${definition.name} precisa de conector OAuth configurado.` :
      status === 'waiting_provider' ? `${definition.name} aguarda retorno verificavel do provedor.` :
      `${definition.name} ainda nao foi conectado.`,
    findings,
  };
}
