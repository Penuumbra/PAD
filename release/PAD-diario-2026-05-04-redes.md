# Diario PAD - 2026-05-04 - Redes sociais

## Pedido

Resolver o bloqueio de conexao do Instagram e das demais redes, mantendo Facebook funcionando.

## Entrega

- Instagram passou a ser validado pela conexao Meta/Facebook ja funcional.
- O fluxo Meta solicita tambem `instagram_basic`, `instagram_manage_insights` e `instagram_content_publish`.
- O app busca a conta Instagram profissional vinculada a pagina Facebook via Meta Graph API.
- YouTube recebeu fluxo OAuth proprio com Google OAuth Client ID e escopo `https://www.googleapis.com/auth/youtube.readonly`.
- O app mostra as Redirect URIs do YouTube com `localhost`.
- LinkedIn, Twitter/X e TikTok nao criam mais vinculo pendente sem conector real. O proto agente informa que essas plataformas precisam de conector OAuth seguro.
- Nenhuma rede social passa a ser marcada como validada sem retorno real do provedor.

## Proxima acao no app

1. Para Instagram: clicar em `Verificar evidencia` no card do Instagram. Se a Meta pedir nova autorizacao, conceder os escopos do Instagram no app `2023320521557076`.
2. Para YouTube: criar/usar um Google OAuth Client ID, cadastrar as Redirect URIs exibidas e clicar em `Conectar YouTube`.
3. Para LinkedIn, Twitter/X e TikTok: configurar uma URL de conector OAuth seguro antes de conectar.
