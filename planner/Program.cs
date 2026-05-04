using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Text;

var port = GetPreferredPort(5175);
var prefix = $"http://localhost:{port}/";

using var listener = new HttpListener();
listener.Prefixes.Add(prefix);
listener.Start();

OpenBrowser(prefix);

while (listener.IsListening)
{
    var context = await listener.GetContextAsync();
    _ = Task.Run(() => ServeAsync(context));
}

return 0;

static int GetPreferredPort(int preferredPort)
{
    if (IsPortAvailable(preferredPort)) return preferredPort;
    return GetFreePort();
}

static bool IsPortAvailable(int port)
{
    try
    {
        using var socket = new TcpListener(IPAddress.Loopback, port);
        socket.Start();
        return true;
    }
    catch
    {
        return false;
    }
}

static int GetFreePort()
{
    using var socket = new TcpListener(IPAddress.Loopback, 0);
    socket.Start();
    return ((IPEndPoint)socket.LocalEndpoint).Port;
}

static void OpenBrowser(string url)
{
    Process.Start(new ProcessStartInfo
    {
        FileName = url,
        UseShellExecute = true,
    });
}

static async Task ServeAsync(HttpListenerContext context)
{
    try
    {
        var path = context.Request.Url?.AbsolutePath ?? "/";
        if (path.Equals("/health", StringComparison.OrdinalIgnoreCase))
        {
            await WriteAsync(context, "ok", "text/plain; charset=utf-8");
            return;
        }

        if (path is not "/" and not "/index.html")
        {
            context.Response.StatusCode = 404;
            await WriteAsync(context, "Not found", "text/plain; charset=utf-8");
            return;
        }

        await WriteAsync(context, GetHtml(), "text/html; charset=utf-8");
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = 500;
        await WriteAsync(context, ex.Message, "text/plain; charset=utf-8");
    }
}

static async Task WriteAsync(HttpListenerContext context, string content, string contentType)
{
    var bytes = Encoding.UTF8.GetBytes(content);
    context.Response.ContentType = contentType;
    context.Response.ContentLength64 = bytes.LongLength;
    context.Response.Headers["Cache-Control"] = "no-store";
    await context.Response.OutputStream.WriteAsync(bytes);
    context.Response.OutputStream.Close();
}

static string GetHtml() => """
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PAD Trilha</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7fb;
      --panel: #ffffff;
      --ink: #111827;
      --muted: #667085;
      --line: #e5e7eb;
      --blue: #2563eb;
      --emerald: #059669;
      --amber: #d97706;
      --shadow: 0 18px 40px rgba(15, 23, 42, .08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top right, rgba(37, 99, 235, .12), transparent 34rem),
        radial-gradient(circle at top left, rgba(5, 150, 105, .11), transparent 28rem),
        var(--bg);
    }
    button {
      border: 0;
      border-radius: 8px;
      cursor: pointer;
      font: inherit;
      font-weight: 600;
      transition: transform .14s ease, background .14s ease, border-color .14s ease;
    }
    button:active { transform: translateY(1px); }
    .shell {
      width: min(1180px, calc(100vw - 32px));
      margin: 0 auto;
      padding: 32px 0;
    }
    .hero {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: flex-end;
      background: rgba(255, 255, 255, .82);
      border: 1px solid rgba(255, 255, 255, .72);
      border-radius: 18px;
      box-shadow: var(--shadow);
      padding: 24px;
      backdrop-filter: blur(12px);
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 10px;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: var(--emerald);
    }
    h1 {
      margin: 0;
      font-size: clamp(26px, 4vw, 38px);
      letter-spacing: 0;
      line-height: 1.1;
    }
    .hero p {
      margin: 10px 0 0;
      color: var(--muted);
      max-width: 680px;
      line-height: 1.55;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: flex-end;
    }
    .primary {
      color: white;
      background: var(--ink);
      padding: 10px 14px;
    }
    .secondary {
      color: var(--ink);
      background: white;
      border: 1px solid var(--line);
      padding: 9px 13px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin: 18px 0;
    }
    .stat {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 16px;
      box-shadow: 0 8px 18px rgba(15, 23, 42, .04);
    }
    .stat strong {
      display: block;
      font-size: 24px;
      margin-bottom: 4px;
    }
    .stat span {
      color: var(--muted);
      font-size: 12px;
    }
    .workspace {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 390px;
      gap: 18px;
    }
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 16px;
      box-shadow: 0 8px 18px rgba(15, 23, 42, .04);
      overflow: hidden;
    }
    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 16px 18px;
      border-bottom: 1px solid var(--line);
    }
    .panel-head h2 {
      margin: 0;
      font-size: 15px;
    }
    .progress {
      height: 8px;
      background: #eef2f7;
      border-radius: 999px;
      overflow: hidden;
      min-width: 160px;
    }
    .progress span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, var(--blue), var(--emerald));
      width: 0;
    }
    .list {
      padding: 10px;
      display: grid;
      gap: 8px;
    }
    .item {
      width: 100%;
      text-align: left;
      background: white;
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px;
    }
    .item:hover,
    .item.active {
      border-color: rgba(37, 99, 235, .38);
      background: #f8fbff;
    }
    .item.done {
      border-color: rgba(5, 150, 105, .28);
      background: #f5fffb;
    }
    .item-top {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
      color: var(--muted);
      font-size: 12px;
    }
    .item-title {
      margin: 0;
      font-size: 15px;
      color: var(--ink);
    }
    .pill {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 4px 9px;
      font-size: 11px;
      color: #1d4ed8;
      background: #eff6ff;
      white-space: nowrap;
    }
    .detail {
      padding: 18px;
      display: grid;
      gap: 16px;
    }
    .detail h2 {
      margin: 0;
      font-size: 22px;
      line-height: 1.22;
    }
    .detail-block {
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px;
      background: #fbfcfe;
    }
    .detail-block h3 {
      margin: 0 0 7px;
      font-size: 12px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: .06em;
    }
    .detail-block p {
      margin: 0;
      color: #344054;
      line-height: 1.55;
      font-size: 14px;
    }
    .toggle {
      width: 100%;
      color: white;
      background: var(--blue);
      padding: 12px 14px;
    }
    .toggle.done {
      background: var(--emerald);
    }
    @media (max-width: 860px) {
      .hero { align-items: stretch; flex-direction: column; }
      .actions { justify-content: flex-start; }
      .stats { grid-template-columns: 1fr; }
      .workspace { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div>
        <div class="eyebrow"><span class="dot"></span> Planejamento local do projeto</div>
        <h1>PAD Trilha</h1>
        <p>Roadmap operacional do PAD com progresso salvo neste navegador. A interface roda como pagina local, sem componentes Windows Forms.</p>
      </div>
      <div class="actions">
        <button class="secondary" id="reset">Limpar progresso</button>
        <button class="primary" id="export">Exportar Markdown</button>
      </div>
    </section>

    <section class="stats">
      <div class="stat"><strong id="doneCount">0</strong><span>etapas concluidas</span></div>
      <div class="stat"><strong id="remainingCount">0</strong><span>etapas restantes</span></div>
      <div class="stat"><strong id="nextDate">-</strong><span>proximo foco</span></div>
    </section>

    <section class="workspace">
      <div class="panel">
        <div class="panel-head">
          <h2>Cronograma</h2>
          <div class="progress"><span id="progress"></span></div>
        </div>
        <div class="list" id="list"></div>
      </div>

      <aside class="panel">
        <div class="panel-head">
          <h2>Detalhe</h2>
          <span class="pill" id="detailBudget">-</span>
        </div>
        <div class="detail" id="detail"></div>
      </aside>
    </section>
  </main>

  <script>
    const storageKey = 'pad_trilha_completed_v2';
    const roadmap = [
      {
        id: 'd1-meta-oauth',
        date: '2026-05-04',
        goal: 'Validar OAuth Meta/Facebook',
        budget: 'Alto: 6-10 prompts',
        result: 'Conta conectada com evidencia real e metricas retornadas pela Graph API.',
        actions: 'Usar somente o Facebook App ID 2023320521557076, confirmar redirect URIs localhost, conectar pelo app e validar /me e /me/accounts.',
        acceptance: 'Configuracoes mostra evidencia validada, page id/nome, validade do token e nenhum dado simulado.'
      },
      {
        id: 'd2-analytics-reais',
        date: '2026-05-05',
        goal: 'Fechar Analytics com dados reais',
        budget: 'Medio: 3-5 prompts',
        result: 'Atualizar funciona e exibe somente contas conectadas e projetos ativos.',
        actions: 'Testar botao Atualizar, estado sem conexao, filtro por projeto ativo e historico retroativo de conteudos publicados.',
        acceptance: 'Analytics nao renderiza valores simulados, nao quebra com dados ausentes e informa claramente quando falta conexao valida.'
      },
      {
        id: 'd3-backend-oauth',
        date: '2026-05-06',
        goal: 'Definir conector OAuth seguro',
        budget: 'Alto: 6-10 prompts',
        result: 'Plano ou implementacao minima para trocar codigo por token fora do frontend.',
        actions: 'Escolher backend local/remoto, variaveis de ambiente, armazenamento seguro e renovacao de tokens.',
        acceptance: 'Nenhum token secreto fica exposto no frontend e o proto agente aponta o bloqueio correto por plataforma.'
      },
      {
        id: 'd4-qa',
        date: '2026-05-07',
        goal: 'Rodada de qualidade funcional',
        budget: 'Medio: 3-5 prompts',
        result: 'Matriz de teste cobrindo autenticacao, privacidade, refresh e telas vazias.',
        actions: 'Executar build, smoke test do exe, rotas principais, fluxo de erro e cenarios sem permissoes.',
        acceptance: 'Os defeitos encontrados ficam registrados com prioridade e status.'
      },
      {
        id: 'd5-windows-release',
        date: '2026-05-08',
        goal: 'Refinar distribuicao Windows',
        budget: 'Baixo: 1-2 prompts',
        result: 'Pacote Windows revisado e pronto para uso interno.',
        actions: 'Validar zip, porta local, logs, icone, nome do produto e instrucoes curtas de execucao.',
        acceptance: 'PAD.exe inicia a aplicacao e abre a interface local sem depender do servidor Vite.'
      },
      {
        id: 'd6-android',
        date: '2026-05-09',
        goal: 'Preparar APK Android 15+',
        budget: 'Alto: 6-10 prompts',
        result: 'SDK Android instalado e caminho de build definido.',
        actions: 'Instalar Android command-line tools com autorizacao, configurar SDK 35+, gerar wrapper Android e assinar APK.',
        acceptance: 'APK gerado ou bloqueio tecnico documentado com comando exato que falta executar.'
      },
      {
        id: 'd7-rc',
        date: '2026-05-10',
        goal: 'Release candidate',
        budget: 'Medio: 3-5 prompts',
        result: 'Versao candidata com checklist de privacidade, OAuth e pacotes.',
        actions: 'Revisar escopo final, preparar backup dos artefatos, documentar credenciais exigidas e validar fluxo ponta a ponta.',
        acceptance: 'Produto fica pronto para proxima rodada de uso real e revisao operacional.'
      }
    ];

    let selectedId = roadmap[0].id;

    function loadCompleted() {
      try { return new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')); }
      catch { return new Set(); }
    }

    function saveCompleted(completed) {
      localStorage.setItem(storageKey, JSON.stringify([...completed]));
    }

    function render() {
      const completed = loadCompleted();
      const list = document.getElementById('list');
      const done = roadmap.filter(item => completed.has(item.id)).length;
      const next = roadmap.find(item => !completed.has(item.id));
      const selected = roadmap.find(item => item.id === selectedId) || next || roadmap[0];
      selectedId = selected.id;

      document.getElementById('doneCount').textContent = `${done}/${roadmap.length}`;
      document.getElementById('remainingCount').textContent = String(roadmap.length - done);
      document.getElementById('nextDate').textContent = next ? next.date.slice(5).replace('-', '/') : 'finalizado';
      document.getElementById('progress').style.width = `${Math.round((done / roadmap.length) * 100)}%`;

      list.innerHTML = roadmap.map(item => {
        const isDone = completed.has(item.id);
        const isActive = item.id === selected.id;
        return `
          <button class="item ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}" data-id="${item.id}">
            <div class="item-top">
              <span>${item.date}</span>
              <span class="pill">${isDone ? 'Concluida' : item.budget}</span>
            </div>
            <p class="item-title">${item.goal}</p>
          </button>
        `;
      }).join('');

      list.querySelectorAll('[data-id]').forEach(button => {
        button.addEventListener('click', () => {
          selectedId = button.dataset.id;
          render();
        });
      });

      document.getElementById('detailBudget').textContent = selected.budget;
      document.getElementById('detail').innerHTML = `
        <div>
          <div class="eyebrow"><span class="dot"></span>${selected.date}</div>
          <h2>${selected.goal}</h2>
        </div>
        <div class="detail-block"><h3>Resultado esperado</h3><p>${selected.result}</p></div>
        <div class="detail-block"><h3>Acoes</h3><p>${selected.actions}</p></div>
        <div class="detail-block"><h3>Criterios de aceite</h3><p>${selected.acceptance}</p></div>
        <button class="toggle ${completed.has(selected.id) ? 'done' : ''}" id="toggle">
          ${completed.has(selected.id) ? 'Etapa concluida' : 'Marcar como concluida'}
        </button>
      `;

      document.getElementById('toggle').addEventListener('click', () => {
        const nextCompleted = loadCompleted();
        if (nextCompleted.has(selected.id)) nextCompleted.delete(selected.id);
        else nextCompleted.add(selected.id);
        saveCompleted(nextCompleted);
        render();
      });
    }

    function exportMarkdown() {
      const completed = loadCompleted();
      const rows = roadmap.map(item => `| ${completed.has(item.id) ? 'Sim' : 'Nao'} | ${item.date} | ${item.goal} | ${item.budget} | ${item.result} |`);
      const markdown = [
        '# Cronograma PAD',
        '',
        '| Feito | Data | Meta | Credito Codex | Resultado esperado |',
        '|---|---|---|---|---|',
        ...rows,
        ''
      ].join('\n');
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'PAD-cronograma.md';
      anchor.click();
      URL.revokeObjectURL(url);
    }

    document.getElementById('export').addEventListener('click', exportMarkdown);
    document.getElementById('reset').addEventListener('click', () => {
      localStorage.removeItem(storageKey);
      render();
    });
    render();
  </script>
</body>
</html>
""";
