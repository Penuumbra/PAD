# Diario PAD - 2026-05-04

## Decisao do dia

Trabalhar somente com o Meta App ID `2023320521557076`.

## Ajuste realizado

- O PAD nao oferece mais o App ID antigo como opcao.
- O App ID `2023320521557076` foi fixado como padrao unico do fluxo Facebook.
- Mesmo que o navegador tenha salvo outro App ID anteriormente, o carregamento das configuracoes normaliza para `2023320521557076`.
- A tela Configuracoes mostra o App ID como campo fixo e mantem as Redirect URIs necessarias.
- O redirect OAuth foi migrado de `127.0.0.1` para `localhost` para evitar o bloqueio de conexao insegura do Facebook Login.

## Proxima acao

No Meta Developers do app `2023320521557076`, confirmar/cadastrar:

- `http://localhost:5173/configuracoes`
- `http://localhost:5174/configuracoes`

Depois, no PAD, clicar em `Conectar Facebook` e concluir o consentimento da conta Meta.
