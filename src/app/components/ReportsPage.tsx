import { useState, useMemo } from 'react';
import { useProjects, useContent, FORMAT_LABELS, PLATFORM_LABELS, STATUS_LABELS } from '../store';
import { Project, ContentItem } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Download, FileText, Table, Eye, TrendingUp, Target, Share2, Heart, CheckCircle } from 'lucide-react';
import { METRIC_TONE_CLASSES, MetricTone } from './metricCardStyles';

const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

function goalProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

function buildReportData(project: Project | null, content: ContentItem[]) {
  const items = project ? content.filter(c => c.projectId === project.id) : content;
  const published = items.filter(c => c.status === 'publicado');
  const totalReach = published.reduce((a, c) => a + (c.metrics?.reach ?? 0), 0);
  const totalEng = published.reduce((a, c) => a + (c.metrics?.engagement ?? 0), 0);
  const totalConv = published.reduce((a, c) => a + (c.metrics?.conversions ?? 0), 0);
  const totalLikes = published.reduce((a, c) => a + (c.metrics?.likes ?? 0), 0);
  const totalShares = published.reduce((a, c) => a + (c.metrics?.shares ?? 0), 0);
  const totalComments = published.reduce((a, c) => a + (c.metrics?.comments ?? 0), 0);
  const totalClicks = published.reduce((a, c) => a + (c.metrics?.clicks ?? 0), 0);
  const totalSaves = published.reduce((a, c) => a + (c.metrics?.saves ?? 0), 0);
  const totalImp = published.reduce((a, c) => a + (c.metrics?.impressions ?? 0), 0);
  const engRate = totalReach > 0 ? ((totalEng / totalReach) * 100).toFixed(2) : '0.00';
  const avgReachPerPost = published.length > 0 ? Math.round(totalReach / published.length) : 0;
  const avgEngPerPost = published.length > 0 ? Math.round(totalEng / published.length) : 0;

  const byFormat: Record<string, number> = {};
  items.forEach(c => { byFormat[c.format] = (byFormat[c.format] ?? 0) + 1; });
  const formatData = Object.entries(byFormat).map(([f, v]) => ({ name: FORMAT_LABELS[f] ?? f, value: v }));

  const byStatus: Record<string, number> = {};
  items.forEach(c => { byStatus[c.status] = (byStatus[c.status] ?? 0) + 1; });

  const byChannel: Record<string, { reach: number; engagement: number; count: number; impressions: number; conversions: number }> = {};
  items.forEach(c => {
    c.channels.forEach(ch => {
      if (!byChannel[ch]) byChannel[ch] = { reach: 0, engagement: 0, count: 0, impressions: 0, conversions: 0 };
      byChannel[ch].reach += c.metrics?.reach ?? 0;
      byChannel[ch].engagement += c.metrics?.engagement ?? 0;
      byChannel[ch].impressions += c.metrics?.impressions ?? 0;
      byChannel[ch].conversions += c.metrics?.conversions ?? 0;
      byChannel[ch].count++;
    });
  });
  const channelData = Object.entries(byChannel).map(([ch, d]) => ({
    canal: PLATFORM_LABELS[ch] ?? ch,
    platform: ch,
    ...d,
    engRate: d.reach > 0 ? ((d.engagement / d.reach) * 100).toFixed(2) : '0.00',
    avgEngPerPost: d.count > 0 ? Math.round(d.engagement / d.count) : 0,
  })).sort((a, b) => b.count - a.count);

  const goals = project ? project.goals : [];

  return {
    items, published, totalReach, totalEng, totalConv, totalLikes, totalShares,
    totalComments, totalClicks, totalSaves, totalImp, engRate,
    avgReachPerPost, avgEngPerPost, formatData, byStatus, channelData, goals,
  };
}

// ─── HTML Report ─────────────────────────────────────────────────────────────

function generateHTMLReport(project: Project | null, data: ReturnType<typeof buildReportData>, allProjects: Project[], generatedAt: string) {
  const title = project ? project.name : 'Consolidado – Todos os Projetos';
  const fmt = (n: number) => n.toLocaleString('pt-BR');

  const goalRows = data.goals.map(g => {
    const pct = goalProgress(g.current, g.target);
    const st = pct >= 100 ? '✅ Atingida' : pct >= 70 ? '🔶 Em andamento' : '🔴 Abaixo';
    const c = pct >= 100 ? '#16a34a' : pct >= 70 ? '#d97706' : '#dc2626';
    return `<tr>
      <td>${g.metric}</td><td>${fmt(g.target)} ${g.unit}</td><td>${fmt(g.current)} ${g.unit}</td>
      <td><div style="background:#e5e7eb;border-radius:4px;height:8px;width:100%">
        <div style="background:${c};height:8px;border-radius:4px;width:${pct}%"></div></div></td>
      <td style="color:${c}">${pct}% — ${st}</td></tr>`;
  }).join('');

  const channelRows = data.channelData.map(ch =>
    `<tr><td>${ch.canal}</td><td>${ch.count}</td><td>${fmt(ch.reach)}</td><td>${fmt(ch.engagement)}</td>
     <td>${fmt(ch.impressions)}</td><td>${fmt(ch.conversions)}</td>
     <td>${ch.engRate}%</td><td>${fmt(ch.avgEngPerPost)}</td></tr>`
  ).join('');

  const contentRows = data.published.slice(0, 25).map(c => {
    const proj = allProjects.find(p => p.id === c.projectId);
    return `<tr>
      <td>${c.title}</td><td>${proj?.name ?? '—'}</td>
      <td>${FORMAT_LABELS[c.format] ?? c.format}</td>
      <td>${c.channels.map(ch => PLATFORM_LABELS[ch] ?? ch).join(', ')}</td>
      <td>${c.publishedDate ?? c.scheduledDate ?? '—'}</td>
      <td>${fmt(c.metrics?.reach ?? 0)}</td>
      <td>${fmt(c.metrics?.impressions ?? 0)}</td>
      <td>${fmt(c.metrics?.engagement ?? 0)}</td>
      <td>${fmt(c.metrics?.likes ?? 0)}</td>
      <td>${fmt(c.metrics?.comments ?? 0)}</td>
      <td>${fmt(c.metrics?.shares ?? 0)}</td>
      <td>${fmt(c.metrics?.saves ?? 0)}</td>
      <td>${fmt(c.metrics?.clicks ?? 0)}</td>
      <td>${fmt(c.metrics?.conversions ?? 0)}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Relatório – ${title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937;background:#f9fafb}
.cover{background:linear-gradient(135deg,#1e40af,#7c3aed);color:white;padding:56px 48px}
.cover h1{font-size:30px;margin:12px 0 6px}
.cover h2{font-size:16px;opacity:.8;font-weight:400;margin-bottom:20px}
.badge{display:inline-block;background:rgba(255,255,255,.2);padding:4px 14px;border-radius:20px;font-size:12px}
.meta{font-size:12px;opacity:.6;margin-top:10px}
.body{max-width:960px;margin:0 auto;padding:40px 24px}
.section{margin-bottom:40px}
h3{font-size:17px;color:#1e40af;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e7eb}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:32px}
.kpi{background:white;border:1px solid #e5e7eb;border-radius:10px;padding:18px;text-align:center}
.kpi .v{font-size:26px;color:#1e40af;margin-bottom:4px}
.kpi .l{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.04em}
table{width:100%;border-collapse:collapse;background:white;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);font-size:13px}
th{background:#f3f4f6;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:.05em;white-space:nowrap}
td{padding:9px 14px;color:#374151;border-top:1px solid #f3f4f6;vertical-align:middle}
tr:hover td{background:#f9fafb}
.footer{background:#111827;color:#6b7280;text-align:center;padding:24px;font-size:11px;margin-top:40px}
@media print{body{background:white}.cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="cover">
  <div class="badge">📊 Relatório de Distribuição de Conteúdo</div>
  <h1>${title}</h1>
  <h2>Analista: Carlos Calebe Sousa · CDA Admin</h2>
  <p class="meta">Gerado em: ${generatedAt}</p>
</div>
<div class="body">
  <div class="section">
    <h3>📈 Indicadores de Performance</h3>
    <div class="kpis">
      <div class="kpi"><div class="v">${data.published.length}</div><div class="l">Publicados</div></div>
      <div class="kpi"><div class="v">${fmt(data.totalReach)}</div><div class="l">Alcance Total</div></div>
      <div class="kpi"><div class="v">${fmt(data.totalImp)}</div><div class="l">Impressões</div></div>
      <div class="kpi"><div class="v">${fmt(data.totalEng)}</div><div class="l">Engajamento</div></div>
      <div class="kpi"><div class="v">${data.engRate}%</div><div class="l">Taxa de Eng.</div></div>
      <div class="kpi"><div class="v">${fmt(data.totalConv)}</div><div class="l">Conversões</div></div>
      <div class="kpi"><div class="v">${fmt(data.totalClicks)}</div><div class="l">Cliques</div></div>
      <div class="kpi"><div class="v">${fmt(data.totalLikes)}</div><div class="l">Curtidas</div></div>
      <div class="kpi"><div class="v">${fmt(data.totalShares)}</div><div class="l">Compartilh.</div></div>
      <div class="kpi"><div class="v">${fmt(data.avgReachPerPost)}</div><div class="l">Alcance/Post</div></div>
    </div>
  </div>
  ${data.goals.length ? `<div class="section"><h3>🎯 Metas e Objetivos</h3>
    <table><thead><tr><th>Métrica</th><th>Meta</th><th>Realizado</th><th style="width:160px">Progresso</th><th>Status</th></tr></thead>
    <tbody>${goalRows}</tbody></table></div>` : ''}
  ${data.channelData.length ? `<div class="section"><h3>📡 Desempenho por Canal</h3>
    <table><thead><tr><th>Canal</th><th>Peças</th><th>Alcance</th><th>Engajamento</th><th>Impressões</th><th>Conversões</th><th>Taxa Eng.(%)</th><th>Eng./Peça</th></tr></thead>
    <tbody>${channelRows}</tbody></table></div>` : ''}
  ${data.published.length ? `<div class="section"><h3>📝 Inventário de Conteúdo Publicado</h3>
    <table><thead><tr><th>Título</th><th>Projeto</th><th>Formato</th><th>Canais</th><th>Data</th><th>Alcance</th><th>Impressões</th><th>Engaj.</th><th>Curtidas</th><th>Coment.</th><th>Compart.</th><th>Salv.</th><th>Cliques</th><th>Convers.</th></tr></thead>
    <tbody>${contentRows}</tbody></table>
    ${data.published.length > 25 ? `<p style="font-size:12px;color:#6b7280;margin-top:8px">Exibindo 25 de ${data.published.length} conteúdos.</p>` : ''}
  </div>` : ''}
  <div class="section"><h3>📋 Pipeline de Conteúdo</h3>
    <table><thead><tr><th>Estágio</th><th>Quantidade</th><th>% do Total</th></tr></thead>
    <tbody>${Object.entries(data.byStatus).map(([s, n]) =>
      `<tr><td>${STATUS_LABELS[s] ?? s}</td><td>${n}</td><td>${data.items.length > 0 ? Math.round((n / data.items.length) * 100) : 0}%</td></tr>`
    ).join('')}</tbody></table></div>
</div>
<div class="footer">
  <p>CDA Admin – Sistema de Gestão de Distribuição de Conteúdo</p>
  <p style="margin-top:4px">Carlos Calebe Sousa · carloscalebesousa@gmail.com · (86) 9 9513-3390 · @carloscallebe</p>
</div></body></html>`;
}

// ─── CSV Report (estrutura limpa e organizada para Excel) ────────────────────

function esc(v: string | number): string {
  if (typeof v === 'number') return String(v);
  if (v.includes(',') || v.includes('"') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function row(...cells: (string | number)[]): string {
  return cells.map(esc).join(',');
}

function sep(label = ''): string {
  return label ? `"### ${label}"` : '';
}

function generateCSV(
  project: Project | null,
  data: ReturnType<typeof buildReportData>,
  allProjects: Project[],
  generatedAt: string
): string {
  const title = project ? project.name : 'Consolidado – Todos os Projetos';
  const lines: string[] = [];

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  lines.push(row('RELATÓRIO DE DISTRIBUIÇÃO DE CONTEÚDO'));
  lines.push(row('Projeto:', title));
  lines.push(row('Analista:', 'Carlos Calebe Sousa'));
  lines.push(row('Gerado em:', generatedAt));
  lines.push(row('Sistema:', 'CDA Admin'));
  lines.push('');

  // ── 1. Sumário Executivo ───────────────────────────────────────────────────
  lines.push(sep('1. SUMÁRIO EXECUTIVO'));
  lines.push(row('Indicador', 'Valor', 'Observação'));
  lines.push(row('Conteúdos Publicados', data.published.length, 'Peças com status Publicado'));
  lines.push(row('Total no Pipeline', data.items.length, 'Todos os estágios'));
  lines.push(row('Alcance Total', data.totalReach, 'Soma de todos os conteúdos'));
  lines.push(row('Impressões Totais', data.totalImp, 'Soma de todos os conteúdos'));
  lines.push(row('Engajamento Total', data.totalEng, 'Curtidas + comentários + compartilhamentos'));
  lines.push(row('Taxa de Engajamento', `${data.engRate}%`, 'Engajamento / Alcance × 100'));
  lines.push(row('Conversões Totais', data.totalConv, ''));
  lines.push(row('Cliques Totais', data.totalClicks, ''));
  lines.push(row('Curtidas Totais', data.totalLikes, ''));
  lines.push(row('Comentários Totais', data.totalComments, ''));
  lines.push(row('Compartilhamentos Totais', data.totalShares, ''));
  lines.push(row('Salvamentos Totais', data.totalSaves, ''));
  lines.push(row('Alcance Médio / Post', data.avgReachPerPost, ''));
  lines.push(row('Engajamento Médio / Post', data.avgEngPerPost, ''));
  lines.push('');

  // ── 2. Metas e Objetivos ───────────────────────────────────────────────────
  if (data.goals.length > 0) {
    lines.push(sep('2. METAS E OBJETIVOS'));
    lines.push(row('Métrica', 'Meta', 'Unidade', 'Realizado', 'Progresso (%)', 'Atingimento', 'Status'));
    data.goals.forEach(g => {
      const pct = goalProgress(g.current, g.target);
      const ating = pct >= 100 ? 'Atingida' : pct >= 70 ? 'Em andamento' : 'Abaixo da meta';
      lines.push(row(g.metric, g.target, g.unit, g.current, `${pct}%`, ating,
        g.deadline ? `Prazo: ${g.deadline}` : ''));
    });
    lines.push('');
  }

  // ── 3. Desempenho por Canal ────────────────────────────────────────────────
  if (data.channelData.length > 0) {
    lines.push(sep('3. DESEMPENHO POR CANAL'));
    lines.push(row(
      'Canal', 'Peças de Conteúdo', 'Alcance Total', 'Impressões Totais',
      'Engajamento Total', 'Conversões', 'Taxa Eng. (%)', 'Eng. Médio / Peça'
    ));
    data.channelData.forEach(ch => {
      lines.push(row(
        ch.canal, ch.count, ch.reach, ch.impressions,
        ch.engagement, ch.conversions, `${ch.engRate}%`, ch.avgEngPerPost
      ));
    });
    lines.push('');
  }

  // ── 4. Distribuição por Formato ────────────────────────────────────────────
  if (data.formatData.length > 0) {
    lines.push(sep('4. DISTRIBUIÇÃO POR FORMATO'));
    lines.push(row('Formato', 'Quantidade', '% do Total'));
    data.formatData.sort((a, b) => b.value - a.value).forEach(f => {
      lines.push(row(f.name, f.value,
        `${data.items.length > 0 ? ((f.value / data.items.length) * 100).toFixed(1) : 0}%`));
    });
    lines.push('');
  }

  // ── 5. Pipeline por Estágio ────────────────────────────────────────────────
  lines.push(sep('5. PIPELINE DE CONTEÚDO'));
  lines.push(row('Estágio', 'Quantidade', '% do Total'));
  const stageOrder = ['ideia', 'redacao', 'revisao', 'aprovado', 'publicado', 'arquivado'];
  stageOrder.forEach(s => {
    if (data.byStatus[s] !== undefined) {
      lines.push(row(
        STATUS_LABELS[s] ?? s,
        data.byStatus[s],
        `${data.items.length > 0 ? Math.round((data.byStatus[s] / data.items.length) * 100) : 0}%`
      ));
    }
  });
  lines.push('');

  // ── 6. Inventário Completo de Conteúdo ────────────────────────────────────
  lines.push(sep('6. INVENTÁRIO DE CONTEÚDO PUBLICADO'));
  lines.push(row(
    'Título', 'Projeto', 'Cliente', 'Formato', 'Canais',
    'Data Publicação', 'Data Agendada', 'Status',
    'Alcance', 'Impressões', 'Engajamento', 'Taxa Eng. (%)',
    'Curtidas', 'Comentários', 'Compartilhamentos', 'Salvamentos',
    'Cliques', 'Conversões', 'Tags'
  ));
  data.published.forEach(c => {
    const proj = allProjects.find(p => p.id === c.projectId);
    const reach = c.metrics?.reach ?? 0;
    const eng = c.metrics?.engagement ?? 0;
    lines.push(row(
      c.title,
      proj?.name ?? '',
      proj?.client ?? '',
      FORMAT_LABELS[c.format] ?? c.format,
      c.channels.map(ch => PLATFORM_LABELS[ch] ?? ch).join(' | '),
      c.publishedDate ?? '',
      c.scheduledDate ?? '',
      STATUS_LABELS[c.status] ?? c.status,
      reach,
      c.metrics?.impressions ?? 0,
      eng,
      reach > 0 ? `${((eng / reach) * 100).toFixed(2)}%` : '0.00%',
      c.metrics?.likes ?? 0,
      c.metrics?.comments ?? 0,
      c.metrics?.shares ?? 0,
      c.metrics?.saves ?? 0,
      c.metrics?.clicks ?? 0,
      c.metrics?.conversions ?? 0,
      c.tags.join(' | ')
    ));
  });
  lines.push('');

  // ── 7. Todo o Pipeline (todos os estágios) ────────────────────────────────
  lines.push(sep('7. PIPELINE COMPLETO (TODOS OS ESTÁGIOS)'));
  lines.push(row(
    'Título', 'Projeto', 'Formato', 'Status', 'Canais',
    'Data Agendada', 'Tags', 'Notas'
  ));
  data.items
    .sort((a, b) => (a.scheduledDate ?? '').localeCompare(b.scheduledDate ?? ''))
    .forEach(c => {
      const proj = allProjects.find(p => p.id === c.projectId);
      lines.push(row(
        c.title,
        proj?.name ?? '',
        FORMAT_LABELS[c.format] ?? c.format,
        STATUS_LABELS[c.status] ?? c.status,
        c.channels.map(ch => PLATFORM_LABELS[ch] ?? ch).join(' | '),
        c.scheduledDate ?? '',
        c.tags.join(' | '),
        c.notes ?? ''
      ));
    });

  return lines.join('\n');
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const { projects } = useProjects();
  const { content } = useContent();
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'preview' | 'channels' | 'pipeline'>('preview');

  const project = selectedProject === 'all' ? null : projects.find(p => p.id === selectedProject) ?? null;
  const data = useMemo(() => buildReportData(project, content), [project, content]);
  const generatedAt = new Date().toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
  const slug = project ? project.name.replace(/\s+/g, '-') : 'Consolidado';
  const date = new Date().toISOString().slice(0, 10);

  function handleHTML() {
    const html = generateHTMLReport(project, data, projects, generatedAt);
    download(html, `Relatorio-CDA-${slug}-${date}.html`, 'text/html');
  }

  function handleCSV() {
    const csv = generateCSV(project, data, projects, generatedAt);
    download('\uFEFF' + csv, `Dados-CDA-${slug}-${date}.csv`, 'text/csv;charset=utf-8');
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-900">Relatórios</h1>
          <p className="text-gray-500 text-sm mt-1">Gere, visualize e baixe relatórios completos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleHTML}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 text-sm">
            <Download size={16} /> Baixar HTML
          </button>
          <button onClick={handleCSV}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 text-sm">
            <Table size={16} /> Baixar CSV/Excel
          </button>
        </div>
      </div>

      {/* Config */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base text-gray-800 mb-4">Configurar Relatório</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Projeto / Escopo</label>
            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white min-w-[220px]">
              <option value="all">Todos os Projetos (Consolidado)</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.client}</option>)}
            </select>
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-100 leading-relaxed">
            <div className="text-gray-400 mb-0.5">Gerado em</div>
            <div className="text-gray-800">{generatedAt}</div>
          </div>
          <div className="text-xs bg-blue-50 text-blue-700 rounded-lg px-4 py-2.5 border border-blue-100 leading-relaxed">
            <div>CSV inclui <strong>7 seções</strong> organizadas:</div>
            <div className="text-blue-500">Sumário · Metas · Canais · Formatos · Pipeline · Inventário · Completo</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {([
          { label: 'Publicados', value: data.published.length, icon: CheckCircle, tone: 'green' },
          { label: 'Alcance Total', value: fmt(data.totalReach), icon: Eye, tone: 'blue' },
          { label: 'Engajamento', value: fmt(data.totalEng), icon: Heart, tone: 'pink' },
          { label: 'Taxa de Eng.', value: `${data.engRate}%`, icon: TrendingUp, tone: 'teal' },
          { label: 'Conversões', value: fmt(data.totalConv), icon: Target, tone: 'purple' },
          { label: 'Cliques', value: fmt(data.totalClicks), icon: Share2, tone: 'orange' },
          { label: 'Curtidas', value: fmt(data.totalLikes), icon: Heart, tone: 'red' },
          { label: 'Impressões', value: fmt(data.totalImp), icon: Eye, tone: 'indigo' },
          { label: 'Alcance/Post', value: fmt(data.avgReachPerPost), icon: TrendingUp, tone: 'blue' },
          { label: 'Eng./Post', value: fmt(data.avgEngPerPost), icon: Heart, tone: 'green' },
        ] satisfies Array<{ label: string; value: string | number; icon: typeof CheckCircle; tone: MetricTone }>).map((k) => {
          const tone = METRIC_TONE_CLASSES[k.tone];
          return (
            <div key={k.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className={`w-7 h-7 rounded-lg ${tone.icon} flex items-center justify-center mb-2`}>
                <k.icon size={14} />
              </div>
              <div className={`text-xl ${tone.value} mb-0.5`}>{k.value}</div>
              <div className="text-xs text-gray-500">{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {[
            { id: 'preview', label: 'Prévia & Metas', icon: FileText },
            { id: 'channels', label: 'Canais', icon: Share2 },
            { id: 'pipeline', label: 'Formatos & Pipeline', icon: Target },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id as 'preview' | 'channels' | 'pipeline')}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        <div className="p-5 md:p-6">
          {/* ── Preview tab ──────────────────────────────────────────────── */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              {data.goals.length > 0 && (
                <div>
                  <h3 className="text-sm text-gray-700 mb-3 uppercase tracking-wide">Metas do Projeto</h3>
                  <div className="space-y-3">
                    {data.goals.map(g => {
                      const pct = goalProgress(g.current, g.target);
                      return (
                        <div key={g.id}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-700">{g.metric}</span>
                            <span className="text-sm text-gray-900">
                              {g.current.toLocaleString('pt-BR')} / {g.target.toLocaleString('pt-BR')} {g.unit}
                              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${pct >= 100 ? 'bg-green-100 text-green-700' : pct >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{pct}%</span>
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full">
                            <div className={`h-2 rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm text-gray-700 mb-3 uppercase tracking-wide">
                  Conteúdos Publicados — {data.published.length} peça(s)
                </h3>
                {data.published.length === 0 ? (
                  <p className="text-gray-400 text-sm py-6 text-center">Nenhum conteúdo publicado ainda.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Título', 'Formato', 'Canais', 'Data', 'Alcance', 'Engajamento', 'Taxa Eng.', 'Conversões'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.published.map(c => {
                          const reach = c.metrics?.reach ?? 0;
                          const eng = c.metrics?.engagement ?? 0;
                          return (
                            <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-800 max-w-[180px] truncate">{c.title}</td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{FORMAT_LABELS[c.format]}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1 flex-wrap max-w-[120px]">
                                  {c.channels.slice(0, 2).map(ch => (
                                    <span key={ch} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded whitespace-nowrap">
                                      {PLATFORM_LABELS[ch] ?? ch}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.publishedDate ?? c.scheduledDate ?? '—'}</td>
                              <td className="px-4 py-3 text-blue-600">{reach.toLocaleString('pt-BR')}</td>
                              <td className="px-4 py-3 text-green-600">{eng.toLocaleString('pt-BR')}</td>
                              <td className="px-4 py-3 text-purple-600">
                                {reach > 0 ? `${((eng / reach) * 100).toFixed(1)}%` : '—'}
                              </td>
                              <td className="px-4 py-3 text-orange-600">{(c.metrics?.conversions ?? 0).toLocaleString('pt-BR')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Channels tab ─────────────────────────────────────────────── */}
          {activeTab === 'channels' && (
            <div className="space-y-5">
              {data.channelData.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">Nenhum dado de canal disponível.</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data.channelData.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="canal" tick={{ fontSize: 11 }} stroke="#e5e7eb" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#e5e7eb" width={40} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" name="Peças" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="engagement" fill="#10b981" name="Engajamento" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Canal', 'Peças', 'Alcance', 'Impressões', 'Engajamento', 'Conversões', 'Taxa Eng.(%)', 'Eng./Peça'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.channelData.map(ch => (
                          <tr key={ch.canal} className="border-t border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-800">{ch.canal}</td>
                            <td className="px-4 py-3 text-gray-700">{ch.count}</td>
                            <td className="px-4 py-3 text-blue-600">{ch.reach.toLocaleString('pt-BR')}</td>
                            <td className="px-4 py-3 text-gray-600">{ch.impressions.toLocaleString('pt-BR')}</td>
                            <td className="px-4 py-3 text-green-600">{ch.engagement.toLocaleString('pt-BR')}</td>
                            <td className="px-4 py-3 text-purple-600">{ch.conversions.toLocaleString('pt-BR')}</td>
                            <td className="px-4 py-3 text-orange-600">{ch.engRate}%</td>
                            <td className="px-4 py-3 text-gray-700">{ch.avgEngPerPost.toLocaleString('pt-BR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Pipeline tab ─────────────────────────────────────────────── */}
          {activeTab === 'pipeline' && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <h3 className="text-sm text-gray-700 mb-3 uppercase tracking-wide">Por Estágio</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={Object.entries(data.byStatus).map(([s, n]) => ({ name: STATUS_LABELS[s] ?? s, value: n }))}
                        dataKey="value" nameKey="name" outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {Object.keys(data.byStatus).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-sm text-gray-700 mb-3 uppercase tracking-wide">Por Formato</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data.formatData}
                        dataKey="value" nameKey="name" outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {data.formatData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Estágio</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Quantidade</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">% do Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.byStatus).map(([s, n]) => (
                      <tr key={s} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-800">{STATUS_LABELS[s] ?? s}</td>
                        <td className="px-4 py-3 text-gray-700">{n}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {data.items.length > 0 ? Math.round((n / data.items.length) * 100) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Download CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg mb-1">Relatório pronto para download</h3>
          <p className="text-blue-100 text-sm">
            <strong>HTML</strong>: relatório visual profissional, imprimível como PDF.<br />
            <strong>CSV/Excel</strong>: 7 seções organizadas — abra diretamente no Excel ou Google Sheets.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button onClick={handleHTML}
            className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-lg hover:bg-blue-50 text-sm">
            <Download size={16} /> HTML
          </button>
          <button onClick={handleCSV}
            className="flex items-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-lg hover:bg-blue-400 text-sm border border-blue-400">
            <Table size={16} /> CSV/Excel
          </button>
        </div>
      </div>
    </div>
  );
}
