# PAD - Deploy no Render

Atualizado em 2026-05-05.

## Configuracao na tela "New Static Site"

Use estes valores:

| Campo | Valor |
|---|---|
| Name | `PAD` |
| Branch | `main` |
| Root Directory | deixe vazio |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |

## Redirect/Rewrites

Como o PAD usa React Router, configure uma rewrite rule no Render:

| Source | Destination | Action |
|---|---|---|
| `/*` | `/index.html` | `Rewrite` |

Tambem deixei um `render.yaml` no repositorio com essa regra:

```yaml
services:
  - type: web
    name: pad
    runtime: static
    buildCommand: npm ci && npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

## Variaveis de ambiente

Nao coloque client secrets no Static Site do Render. Um app React estatico nao consegue proteger segredos; qualquer variavel exposta ao frontend pode virar codigo publico no bundle.

Use variaveis no Render Static Site apenas para valores publicos, e somente quando tiverem prefixo `VITE_`.

Exemplos seguros:

- `VITE_PAD_ENV=production`
- `VITE_PUBLIC_META_APP_ID=2023320521557076`

Exemplos que nao devem ficar no Static Site:

- Meta App Secret.
- Google Client Secret.
- TikTok Client Secret.
- LinkedIn Client Secret.
- X/Twitter Client Secret.
- Refresh tokens.

Esses segredos devem ficar no futuro conector OAuth seguro, nao no frontend.

## Depois que o Render gerar a URL

Quando o Render publicar o site, use a URL HTTPS gerada para atualizar os painéis OAuth:

### Meta / Facebook Login

Adicionar em Valid OAuth Redirect URIs:

```text
https://SEU-SITE.onrender.com/configuracoes
```

Manter tambem as URLs locais:

```text
http://localhost:5173/configuracoes
http://localhost:5174/configuracoes
```

### Google / YouTube

Adicionar em Authorized JavaScript origins:

```text
https://SEU-SITE.onrender.com
```

Adicionar em Authorized redirect URIs:

```text
https://SEU-SITE.onrender.com/configuracoes
```

## Observacao importante

O Render resolve o erro de seguranca do Facebook porque entrega o PAD em HTTPS. O app local em `localhost` continua util para desenvolvimento, mas a versao publicada deve ser a URL usada para testes reais com clientes.
