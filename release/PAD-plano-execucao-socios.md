# PAD - Plano de execucao para os socios

Atualizado em 2026-05-04.

## Objetivo do negocio

Prestar servicos remotos de analise, relatorios e impulsionamento de conteudo. O PAD sera usado como ferramenta operacional para organizar clientes, canais, metricas, calendario, relatorios e a execucao recorrente.

## Oferta inicial

1. Diagnostico pago de presenca digital.
2. Relatorio com analise de desempenho, oportunidades e plano de acao.
3. Opcional recorrente: execucao de impulsionamento, acompanhamento e relatorio mensal.

## Divisao de tarefas

### Socio A - Produto, integracoes e operacao tecnica

- Validar o PAD em ambiente limpo: criar projeto real, cadastrar canais, criar conteudos e gerar relatorio.
- Finalizar OAuth real por plataforma.
- Conferir se cada conta conectada mostra evidencia: nome da conta, ID, origem, validade e metricas reais.
- Configurar ou contratar um conector OAuth seguro para LinkedIn, X e TikTok.
- Criar o modelo padrao de relatorio mensal no PAD.
- Preparar o pacote Windows nativo e validar que nao abre CMD.
- Documentar problemas de API, permissoes pendentes e limites de cada rede.
- Definir checklist tecnico de onboarding de cliente.

### Socio B - Comercial, clientes e execucao de servico

- Definir nichos prioritarios: negocios locais, clinicas, restaurantes, infoprodutores, prestadores de servico, e-commerces pequenos.
- Montar oferta comercial em 3 pacotes:
  - Diagnostico unico.
  - Relatorio mensal.
  - Relatorio + execucao/impulsionamento.
- Criar roteiro de reuniao inicial com cliente.
- Criar checklist de acesso do cliente: paginas, perfis, canais, permissao de anuncios e autorizacao de dados.
- Fazer lista de 30 prospects.
- Validar preco com pelo menos 5 conversas reais.
- Preparar contrato simples ou termo de aceite com permissao para acessar metricas e gerenciar campanhas.
- Coletar exemplos reais de problemas de clientes para orientar o produto.

## Passos ate o PAD ficar funcional para clientes reais

### 1. Remover simulacoes

Status: feito.

- O app nao inicia mais com BLR, Portal AZ ou Advbox.
- Conteudos demo tambem nao sao carregados.
- Se havia dados demo antigos no localStorage, eles sao removidos pelo ID legado.
- Novos projetos criados no PAD ficam salvos no armazenamento local do app.

### 2. Facebook e Instagram

Status: parcialmente funcional.

O que ja existe:

- App Meta fixo: `2023320521557076`.
- Redirects com localhost:
  - `http://localhost:5173/configuracoes`
  - `http://localhost:5174/configuracoes`
- Facebook Login abre pelo PAD.
- Instagram e validado pela Pagina Facebook conectada.

O que falta buscar/configurar:

- Confirmar no Meta Developers que o app `2023320521557076` tem Facebook Login ativo.
- Confirmar as Redirect URIs acima.
- Confirmar escopos:
  - `public_profile`
  - `pages_show_list`
  - `pages_read_engagement`
  - `read_insights`
  - `pages_manage_posts`
  - `instagram_basic`
  - `instagram_manage_insights`
  - `instagram_content_publish`
- Confirmar que o Instagram do cliente e Business/Creator e esta vinculado a uma Pagina Facebook.

### 3. YouTube

Status: funcional quando houver Google OAuth Client ID.

O que buscar:

- Google OAuth Client ID do tipo Web Application.

Caminho:

1. Google Cloud Console.
2. Criar/selecionar projeto.
3. Ativar YouTube Data API v3.
4. Configurar OAuth consent screen.
5. Criar Credentials > OAuth Client ID > Web application.
6. Authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://localhost:5174`
7. Authorized redirect URIs:
   - `http://localhost:5173/configuracoes`
   - `http://localhost:5174/configuracoes`
8. Copiar o Client ID e colar no PAD.

### 4. TikTok

Status: precisa de conector OAuth seguro.

O que buscar:

- TikTok Client Key.
- TikTok Client Secret.
- Redirect URI aprovada.
- Escopos: `user.info.basic`, `video.list` e, se aprovado, `video.upload`/`video.publish`.

Acao tecnica:

- Criar endpoint seguro para trocar authorization code por access token.
- Guardar refresh token fora do frontend.

### 5. LinkedIn

Status: precisa de conector OAuth seguro.

O que buscar:

- LinkedIn Client ID.
- LinkedIn Client Secret.
- Redirect URL do conector.
- Acesso aos produtos/permissoes necessarios para organizacao e metricas.

Acao tecnica:

- Conector backend para Authorization Code Flow.

### 6. Twitter / X

Status: precisa de conector OAuth seguro ou PKCE dedicado.

O que buscar:

- X Client ID.
- Configuracao OAuth 2.0.
- Callback URL.
- Escopos: `tweet.read`, `users.read`, `offline.access`.

Acao tecnica:

- Implementar PKCE e armazenamento seguro de refresh token.

### 7. Relatorios e impulsionamento

Falta implementar/refinar:

- Modelo de diagnostico inicial.
- Modelo de relatorio mensal.
- Separacao de organic vs pago.
- Registro de recomendacoes.
- Registro de acoes executadas.
- Historico por cliente.
- Exportacao PDF ou HTML.
- Campo para verba de impulsionamento, objetivo, periodo, criativo, publico e resultado.

### 8. Nativo Windows

Status: ajustado.

- `PAD.exe` agora e publicado como `WinExe`.
- Objetivo: abrir sem painel CMD.
- O app continua servindo a interface local em `http://localhost:5174`.

### 9. Proxima decisao tecnica indispensavel

Escolher o caminho para o conector OAuth seguro:

- Local: servidor pequeno em `http://localhost:8787`.
- Remoto: `https://api.seu-dominio.com`.
- Terceiro: Supabase Edge Functions, Cloudflare Workers, Render, Railway, Vercel Functions ou similar.

Sem essa decisao, LinkedIn, X e TikTok nao devem ser marcados como funcionais.

## Checklist de onboarding de cliente

- Nome do cliente.
- Nicho.
- Objetivo de negocio.
- Plataformas usadas.
- Links dos perfis.
- Quem tem permissao de admin.
- Meta Business ID, se houver.
- Pagina Facebook.
- Instagram profissional vinculado.
- Canal YouTube.
- TikTok Business, se houver.
- Conta de anuncios Meta, se houver.
- Verba mensal de impulsionamento.
- Periodo do relatorio.
- Autorizacao para acessar metricas.

## Criterio de pronto

O projeto estara operacional quando:

- Um cliente real puder ser cadastrado do zero.
- Pelo menos Facebook/Instagram e YouTube puderem conectar por OAuth.
- O PAD gerar relatorio com dados reais.
- As acoes de impulsionamento puderem ser registradas com verba, objetivo, periodo e resultado.
- LinkedIn/X/TikTok estiverem conectados via conector seguro ou claramente marcados como pendentes.
