# Cronograma PAD

Estado em 2026-05-03: app web funcional, executavel Windows gerado, valores simulados removidos, Analytics filtrando projetos ativos/contas conectadas e etapa atual focada em validar OAuth real do Meta/Facebook Business.

Atualizacao de encerramento em 2026-05-03: etapa Meta/Facebook preparada no app. O App ID detectado nas abas Meta foi aplicado como padrao local, as Redirect URIs de dev/exe foram expostas na tela Configuracoes e a validacao agora trata erro/cancelamento OAuth sem criar conexao falsa.

Atualizacao em 2026-05-04: decisao do projeto: trabalhar somente com o app Meta `2023320521557076`. O outro App ID deixou de ser opcao no PAD para evitar validar a conta contra o aplicativo errado.

Correcao em 2026-05-04: o Facebook bloqueou `http://127.0.0.1` como conexao insegura. O PAD passou a abrir e gerar OAuth com `http://localhost`, que e o endereco local correto para cadastrar no Facebook Login em desenvolvimento.

## Leitura das abas relevantes do Opera

- App local aberto em `http://localhost:5174/`, `http://localhost:5174/configuracoes` e `http://localhost:5174/projetos`.
- Meta Business aberto para o business `918356768344160`.
- Meta Developers aberto no app `2023320521557076`, com area de Facebook Login Settings.
- Ha uma submissao de app review aberta: `4327564264126926`.
- A etapa real do projeto e validar a conexao Meta/Facebook, comprovar evidencia de conta/pagina e liberar metricas reais.

Abas privadas ou nao relacionadas ao projeto foram ignoradas.

## Trilha diaria

| Data | Meta | Credito Codex | Resultado esperado |
|---|---|---|---|
| 2026-05-04 | Validar OAuth Meta/Facebook | Alto: 6-10 prompts | Conta conectada com evidencia real e metricas retornadas pela Graph API |
| 2026-05-05 | Fechar Analytics com dados reais | Medio: 3-5 prompts | Atualizar funciona e exibe somente contas conectadas e projetos ativos |
| 2026-05-06 | Definir conector OAuth seguro | Alto: 6-10 prompts | Plano ou implementacao minima para trocar codigo por token fora do frontend |
| 2026-05-07 | Rodada de qualidade funcional | Medio: 3-5 prompts | Matriz de teste cobrindo autenticacao, privacidade, refresh e telas vazias |
| 2026-05-08 | Refinar distribuicao Windows | Baixo: 1-2 prompts | Pacote Windows revisado e pronto para uso interno |
| 2026-05-09 | Preparar APK Android 15+ | Alto: 6-10 prompts | SDK Android instalado e caminho de build definido |
| 2026-05-10 | Release candidate | Medio: 3-5 prompts | Versao candidata com checklist de privacidade, OAuth e pacotes |

## Metas de aceite

- Nenhuma tela deve exibir dados simulados como se fossem metricas reais.
- A tela Configuracoes deve mostrar evidencia efetiva da conta conectada: origem, identificador, validade e status.
- O botao Atualizar deve buscar dados reais ou informar claramente o bloqueio.
- Analytics deve considerar somente projetos ativos e plataformas com conexao valida.
- Tokens tecnicos nao devem ser expostos no frontend em uma versao de producao.
- O APK Android 15+ depende de autorizacao para instalar/configurar Android SDK nesta maquina.

## Proxima decisao

Na sessao atual, abrir Configuracoes, manter somente o App ID Meta `2023320521557076`, cadastrar as Redirect URIs `http://localhost:5173/configuracoes` e `http://localhost:5174/configuracoes` no Meta Developers e fazer o consentimento OAuth da conta Meta/Facebook. A instalacao do Android SDK fica para depois da validacao Meta.
