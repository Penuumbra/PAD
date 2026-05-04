# PAD - Caminhos OAuth por plataforma

Atualizado em 2026-05-04.

## Redirect URIs locais do PAD

Use estas URLs quando a plataforma aceitar `localhost`:

- `http://localhost:5173/configuracoes` - servidor Vite/dev
- `http://localhost:5174/configuracoes` - PAD.exe

Nao use `127.0.0.1` no Facebook Login.

## Facebook

Status no PAD: funcional via Meta App ID `2023320521557076`.

1. Acesse Meta for Developers.
2. Abra o app `2023320521557076`.
3. Em Facebook Login > Settings, cadastre:
   - `http://localhost:5173/configuracoes`
   - `http://localhost:5174/configuracoes`
4. Em App Review/Permissions, mantenha ou solicite:
   - `public_profile`
   - `pages_show_list`
   - `pages_read_engagement`
   - `read_insights`
   - `pages_manage_posts`
5. No PAD, clique em `Conectar Facebook`.

Validacao esperada: Graph API retorna usuario, paginas, Page Access Token e metricas reais da pagina.

Docs oficiais:
- https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/
- https://developers.facebook.com/docs/facebook-login/security/

## Instagram

Status no PAD: funcional via conexao Meta/Facebook.

1. Confirme que a conta Instagram e Business/Creator.
2. Confirme que a conta esta vinculada a uma Pagina Facebook no Meta Business.
3. No app Meta `2023320521557076`, solicite/conceda:
   - `instagram_basic`
   - `instagram_manage_insights`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
4. No PAD, valide o Facebook primeiro.
5. No card Instagram, clique em `Verificar evidencia`.

Validacao esperada: Meta Graph API retorna `instagram_business_account` na pagina autorizada e metricas reais da conta.

Docs oficiais:
- https://developers.facebook.com/docs/instagram-platform/
- https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/
- https://developers.facebook.com/docs/instagram-platform/insights/

## YouTube

Status no PAD: funcional via Google OAuth Client ID.

1. Acesse Google Cloud Console.
2. Crie ou selecione um projeto.
3. Em APIs & Services > Library, ative YouTube Data API v3.
4. Em OAuth consent screen, configure nome do app, usuario de teste e escopo.
5. Em Credentials, crie OAuth Client ID do tipo Web application.
6. Em Authorized JavaScript origins, cadastre:
   - `http://localhost:5173`
   - `http://localhost:5174`
7. Em Authorized redirect URIs, cadastre:
   - `http://localhost:5173/configuracoes`
   - `http://localhost:5174/configuracoes`
8. Copie o Client ID terminado em `.apps.googleusercontent.com`.
9. No PAD, cole em `Google OAuth Client ID` e clique em `Conectar YouTube`.

Escopo usado pelo PAD:
- `https://www.googleapis.com/auth/youtube.readonly`

Validacao esperada: YouTube Data API retorna o canal autorizado, inscritos, visualizacoes e videos.

Docs oficiais:
- https://developers.google.com/youtube/v3/guides/auth/client-side-web-apps
- https://developers.google.com/youtube/v3/guides/authentication

## LinkedIn

Status no PAD: exige conector OAuth seguro.

Motivo: LinkedIn usa Authorization Code Flow e a troca do `code` por `access_token` exige `client_secret`. Esse segredo nao deve ficar no frontend.

1. Acesse LinkedIn Developers.
2. Crie um app.
3. Em Auth, cadastre a Redirect URL do conector seguro, por exemplo:
   - `https://seu-dominio.com/oauth/linkedin/callback`
4. Copie Client ID e Client Secret para o conector seguro.
5. Solicite produtos/permissoes conforme uso:
   - Sign In with LinkedIn/OpenID Connect para identidade.
   - Marketing Developer Platform/Organization APIs para paginas e metricas, se aprovado.
6. Configure no PAD a URL do conector OAuth seguro.
7. Clique em `Conectar LinkedIn`.

Docs oficiais:
- https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow

## Twitter / X

Status no PAD: exige conector OAuth seguro ou implementacao PKCE dedicada.

Motivo: X usa OAuth 2.0 Authorization Code Flow with PKCE para acesso de usuario. O `code` expira rapido e precisa ser trocado por token com `code_verifier`. Para uso robusto, refresh token e chamadas devem ficar em conector seguro.

1. Acesse X Developer Portal.
2. Crie/abra seu App.
3. Ative OAuth 2.0 nas Authentication settings.
4. Escolha App type adequado.
5. Cadastre Callback/Redirect URI do conector seguro, por exemplo:
   - `https://seu-dominio.com/oauth/x/callback`
6. Copie Client ID para o conector.
7. Solicite escopos minimos:
   - `tweet.read`
   - `users.read`
   - `offline.access` se precisar renovar token.
8. Configure no PAD a URL do conector OAuth seguro.
9. Clique em `Conectar Twitter / X`.

Docs oficiais:
- https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code
- https://docs.x.com/fundamentals/authentication/oauth-2-0/user-access-token

## TikTok

Status no PAD: exige conector OAuth seguro.

Motivo: TikTok exige Client Key e Client Secret para trocar o authorization code por tokens. O proprio guia oficial recomenda que token e refresh token fiquem no backend.

1. Acesse TikTok for Developers.
2. Crie um app em Manage apps.
3. Ative Login Kit e, se necessario, Content Posting API.
4. Para desktop/local, cadastre redirect URI do conector ou localhost permitido pelo produto, por exemplo:
   - `http://localhost:5174/configuracoes`
   - ou `https://seu-dominio.com/oauth/tiktok/callback`
5. Copie Client Key e Client Secret para o conector seguro.
6. Solicite escopos conforme uso:
   - `user.info.basic`
   - `video.list`
   - `video.upload` ou `video.publish`, se aprovado para publicacao.
7. Configure no PAD a URL do conector OAuth seguro.
8. Clique em `Conectar TikTok`.

Docs oficiais:
- https://developers.tiktok.com/doc/login-kit-desktop/
- https://developers.tiktok.com/doc/login-kit-web
- https://developers.tiktok.com/doc/oauth-user-access-token-management
- https://developers.tiktok.com/doc/content-posting-api-get-started/

## Resultado esperado no PAD

- Uma plataforma so aparece como `Validado` se retornar evidencia real do provedor.
- Sem OAuth real ou conector seguro, o Analytics permanece vazio para aquela plataforma.
- Dados simulados continuam bloqueados.
