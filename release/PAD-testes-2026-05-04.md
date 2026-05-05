# PAD - Testes de funcionamento - 2026-05-04

## Build e publicacao

- Vite production build: passou.
- Vite production build apos configuracao Render: passou em 2026-05-05.
- Publicacao Windows `PAD.exe`: passou.
- Publicacao `PADTrilha.exe`: passou.
- `PAD-windows-x64.zip`: regenerado.
- `PAD-trilha-windows-x64.zip`: regenerado.
- Release Windows limpo antes da republicacao para remover bundles antigos que o `dotnet publish` preservava.

## Verificacoes de bundle

- Meta App ID `2023320521557076`: presente.
- Redirect OAuth com `http://localhost:5174/configuracoes`: presente.
- Redirects antigos com `127.0.0.1`: ausentes.
- Fluxo Instagram via Meta Graph API: presente.
- Fluxo YouTube OAuth Google: presente.
- Guias OAuth por plataforma dentro do app: presentes.
- Links oficiais para Meta, Google, LinkedIn, X e TikTok: presentes.
- Guia `PAD-OAuth-caminhos.md`: presente.
- Pesquisa de concorrentes `PAD-pesquisa-concorrentes.md`: presente.
- Plano de execucao dos socios `PAD-plano-execucao-socios.md`: presente.
- Guia de deploy Render `PAD-deploy-render.md`: presente.
- `render.yaml`: presente, com `buildCommand`, `staticPublishPath` e rewrite para React Router.
- Projetos demo removidos do bundle final: `BLR`, `Portal AZ`, `Advbox`/`ADVBox` ausentes.
- Constantes `DEMO_PROJECTS` e `DEMO_CONTENT`: ausentes.
- Badge/estado de plataforma `Simulado`: ausente.
- Persistencia de conteudo real: corrigida para nao remover novos conteudos com ID `c` + timestamp.

## Smoke test HTTP do PAD.exe

Servidor iniciado em `http://localhost:5174/`.

| Rota | Status |
|---|---|
| `/` | 200 |
| `/configuracoes` | 200 |
| `/analytics` | 200 |
| `/projetos` | 200 |
| `/conteudo` | 200 |
| `/calendario` | 200 |
| `/relatorios` | 200 |

## Smoke test do app de trilha

- `PADTrilha.exe` abriu com titulo `PAD Trilha do Projeto`.

## Estado funcional por plataforma

- Facebook: funcional com Meta App ID fixo `2023320521557076`.
- Instagram: funcional via Facebook/Meta, desde que a pagina autorizada tenha Instagram profissional vinculado e escopos aprovados.
- YouTube: funcional via Google OAuth Client ID, depois de cadastrar as Redirect URIs no Google Cloud.
- LinkedIn: funcional somente com conector OAuth seguro, porque a troca do code exige client secret.
- Twitter/X: funcional somente com conector OAuth seguro ou implementacao PKCE dedicada.
- TikTok: funcional somente com conector OAuth seguro, porque o token exchange usa client secret e refresh token.

## Observacao

Nenhuma plataforma e marcada como validada sem evidencia real do provedor. Dados simulados continuam bloqueados.

## Teste nativo

- `PAD.exe` publicado como `WinExe`, sem console do CMD como janela principal.
- `PAD.exe` iniciado em `http://localhost:5174/`.
- Processo ativo apos abertura: confirmado.

## Refinamento adicional

- A tela Configuracoes agora mostra, em cada card de plataforma, o caminho para obter OAuth, a informacao necessaria e links oficiais.
- Estados pendentes antigos sem credencial real sao normalizados ao carregar as configuracoes.
- O PAD pede intervencao do usuario apenas quando precisa de uma credencial criada no painel oficial, como Google OAuth Client ID ou URL de conector seguro.
