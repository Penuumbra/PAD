import { useState, useMemo } from 'react';
import { useProjects, useContent, FORMAT_LABELS, PLATFORM_LABELS } from '../store';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Eye, Heart, Target, Share2,
  RefreshCw, Wifi, WifiOff, AlertCircle, Clock,
} from 'lucide-react';
import { useRealTimeMetrics } from '../hooks/useRealTimeMetrics';
import { ConnectionStatus } from '../services/platformAPIs';
import { Platform } from '../types';
import { PlatformCredentialKey } from '../services/apiConfig';
import { METRIC_TONE_CLASSES, MetricTone } from './metricCardStyles';

const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
const PLATFORM_DISPLAY_ORDER: PlatformCredentialKey[] = ['instagram', 'youtube', 'linkedin', 'facebook', 'twitter', 'tiktok'];
const CONNECTABLE_PLATFORMS = new Set<string>(PLATFORM_DISPLAY_ORDER);
const MONTH_LABEL = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' });

const STATUS_BADGE: Record<ConnectionStatus, { label: string; cls: string; icon: typeof Wifi }> = {
  connected: { label: 'Validado', cls: 'bg-green-100 text-green-700', icon: Wifi },
  error: { label: 'Erro', cls: 'bg-red-100 text-red-700', icon: AlertCircle },
  unconfigured: { label: 'Sem evidencia', cls: 'bg-gray-100 text-gray-500', icon: WifiOff },
};

function isCredentialPlatform(platform: Platform): platform is PlatformCredentialKey {
  return CONNECTABLE_PLATFORMS.has(platform);
}

function goalProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

export function AnalyticsPage() {
  const { projects } = useProjects();
  const { content, getByProject } = useContent();
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const activeProjects = useMemo(() => projects.filter(p => p.status === 'ativo'), [projects]);
  const activeProjectIds = useMemo(() => new Set(activeProjects.map(p => p.id)), [activeProjects]);

  const requestedPlatforms = useMemo(() => {
    const sourceProjects = selectedProject === 'all'
      ? activeProjects
      : activeProjects.filter(p => p.id === selectedProject);
    const platforms = new Set<PlatformCredentialKey>();
    sourceProjects.forEach(project => {
      project.channels.forEach(channel => {
        if (isCredentialPlatform(channel.platform)) platforms.add(channel.platform);
      });
    });
    return PLATFORM_DISPLAY_ORDER.filter(platform => platforms.has(platform));
  }, [activeProjects, selectedProject]);

  const { metrics: liveMetrics, lastUpdated, loading, error, refresh } = useRealTimeMetrics(requestedPlatforms);

  const projectData = useMemo(() => {
    if (selectedProject === 'all') return null;
    return activeProjects.find(p => p.id === selectedProject) ?? null;
  }, [selectedProject, activeProjects]);

  const projectContent = useMemo(() => {
    if (selectedProject === 'all') return content.filter(c => activeProjectIds.has(c.projectId));
    if (!activeProjectIds.has(selectedProject)) return [];
    return getByProject(selectedProject);
  }, [selectedProject, content, getByProject, activeProjectIds]);

  const connectedPlatforms = useMemo(() => {
    return new Set(
      Object.entries(liveMetrics)
        .filter(([, metric]) => metric?.status === 'connected')
        .map(([platform]) => platform as PlatformCredentialKey)
    );
  }, [liveMetrics]);

  const connectedMetrics = useMemo(() => {
    return PLATFORM_DISPLAY_ORDER
      .map(platform => ({ platform, metric: liveMetrics[platform] }))
      .filter((item): item is { platform: PlatformCredentialKey; metric: NonNullable<typeof item.metric> } =>
        item.metric?.status === 'connected'
      );
  }, [liveMetrics]);

  const published = useMemo(() => {
    return projectContent.filter(c =>
      c.status === 'publicado' &&
      c.channels.some(ch => isCredentialPlatform(ch) && connectedPlatforms.has(ch))
    );
  }, [projectContent, connectedPlatforms]);

  const totalReach = published.reduce((a, c) => a + (c.metrics?.reach ?? 0), 0);
  const totalEngagement = published.reduce((a, c) => a + (c.metrics?.engagement ?? 0), 0);
  const totalConversions = published.reduce((a, c) => a + (c.metrics?.conversions ?? 0), 0);
  const totalShares = published.reduce((a, c) => a + (c.metrics?.shares ?? 0), 0);
  const engRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(1) : '0.0';

  const trendData = useMemo(() => {
    const map = new Map<string, { mes: string; alcance: number; engajamento: number; conversoes: number; sort: string }>();
    published.forEach(item => {
      const dateValue = item.publishedDate ?? item.scheduledDate ?? item.createdAt;
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = map.get(key) ?? {
        mes: MONTH_LABEL.format(date).replace('.', ''),
        alcance: 0,
        engajamento: 0,
        conversoes: 0,
        sort: key,
      };
      current.alcance += item.metrics?.reach ?? 0;
      current.engajamento += item.metrics?.engagement ?? 0;
      current.conversoes += item.metrics?.conversions ?? 0;
      map.set(key, current);
    });
    return Array.from(map.values()).sort((a, b) => a.sort.localeCompare(b.sort)).slice(-6);
  }, [published]);

  const byFormat = useMemo(() => {
    const map: Record<string, { count: number; reach: number }> = {};
    published.forEach(c => {
      if (!map[c.format]) map[c.format] = { count: 0, reach: 0 };
      map[c.format].count++;
      map[c.format].reach += c.metrics?.reach ?? 0;
    });
    return Object.entries(map).map(([fmt, d]) => ({
      name: FORMAT_LABELS[fmt] ?? fmt,
      count: d.count,
      reach: d.reach,
    })).sort((a, b) => b.count - a.count);
  }, [published]);

  const byChannel = useMemo(() => {
    const map: Record<string, { reach: number; engagement: number; count: number }> = {};
    published.forEach(c => {
      c.channels.forEach(ch => {
        if (!isCredentialPlatform(ch) || !connectedPlatforms.has(ch)) return;
        if (!map[ch]) map[ch] = { reach: 0, engagement: 0, count: 0 };
        map[ch].reach += c.metrics?.reach ?? 0;
        map[ch].engagement += c.metrics?.engagement ?? 0;
        map[ch].count++;
      });
    });
    return Object.entries(map).map(([ch, d]) => ({
      canal: PLATFORM_LABELS[ch] ?? ch,
      alcance: d.reach,
      engagement: d.engagement,
      pecas: d.count,
    })).sort((a, b) => b.pecas - a.pecas);
  }, [published, connectedPlatforms]);

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
  const fmtN = (n?: number) => n !== undefined ? n.toLocaleString('pt-BR') : '-';

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">
            Metricas reais de contas validadas, projetos ativos e historico publicado
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
          >
            <option value="all">Todos os projetos ativos</option>
            {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 border border-gray-200 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{loading ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white rounded-lg px-4 py-2.5 border border-gray-100 shadow-sm w-fit">
          <Clock size={13} />
          Ultima verificacao: {lastUpdated.toLocaleTimeString('pt-BR')}
          {loading && <RefreshCw size={12} className="animate-spin ml-1" />}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base text-gray-800 flex items-center gap-2">
            <Wifi size={17} className="text-green-600" />
            Metricas atuais - contas validadas
          </h2>
          <span className={`text-xs px-2 py-1 rounded-full ${
            loading ? 'bg-yellow-100 text-yellow-700' :
            connectedMetrics.length ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {loading ? 'Atualizando...' : connectedMetrics.length ? 'Com evidencia' : 'Sem contas validadas'}
          </span>
        </div>
        <div className="p-5">
          {connectedMetrics.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedMetrics.map(({ platform, metric: m }) => {
                const badge = STATUS_BADGE[m.status];
                const BadgeIcon = badge.icon;
                const mainValue = platform === 'youtube' ? m.subscribers : m.followers;
                const mainLabel = platform === 'youtube' ? 'Inscritos' : 'Seguidores';
                const engValue = platform === 'youtube' || platform === 'tiktok' ? m.avgViews : m.avgReach;
                const engLabel = platform === 'youtube' || platform === 'tiktok' ? 'Views/Post' : 'Alcance/Post';

                return (
                  <div key={platform} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-800 capitalize">
                        {platform === 'twitter' ? 'Twitter / X' : PLATFORM_LABELS[platform] ?? platform}
                      </span>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>
                        <BadgeIcon size={11} />
                        {badge.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                        <div className="text-lg text-gray-900">{fmtN(mainValue)}</div>
                        <div className="text-xs text-gray-500">{mainLabel}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                        <div className="text-lg text-blue-600">{fmtN(engValue)}</div>
                        <div className="text-xs text-gray-500">{engLabel}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-sm text-pink-600">{fmtN(m.avgLikes)}</div>
                        <div className="text-xs text-gray-400">Curtidas</div>
                      </div>
                      <div>
                        <div className="text-sm text-purple-600">{fmtN(m.avgComments)}</div>
                        <div className="text-xs text-gray-400">Comentarios</div>
                      </div>
                      <div>
                        <div className="text-sm text-green-600">{m.engagementRate ?? '-'}%</div>
                        <div className="text-xs text-gray-400">Taxa Eng.</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
              <WifiOff size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-700">Nenhuma conta com evidencia real de conexao.</p>
              <p className="text-xs text-gray-500 mt-1">
                Use Configuracoes para diagnosticar o bloqueio e validar uma conta pelo conector OAuth.
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-base text-gray-700 mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-600" />
          Performance retroativa - projetos ativos e contas conectadas
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {([
            { label: 'Publicados', value: published.length, icon: Eye, tone: 'blue' },
            { label: 'Alcance', value: fmt(totalReach), icon: Eye, tone: 'indigo' },
            { label: 'Engajamento', value: fmt(totalEngagement), icon: Heart, tone: 'pink' },
            { label: 'Taxa Eng.', value: `${engRate}%`, icon: TrendingUp, tone: 'green' },
            { label: 'Conversões', value: fmt(totalConversions), icon: Target, tone: 'purple' },
            { label: 'Compart.', value: fmt(totalShares), icon: Share2, tone: 'orange' },
          ] satisfies Array<{ label: string; value: string | number; icon: typeof Eye; tone: MetricTone }>).slice(0, 5).map((k) => {
            const tone = METRIC_TONE_CLASSES[k.tone];
            return (
              <div key={k.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className={`w-8 h-8 rounded-lg ${tone.icon} flex items-center justify-center mb-2`}>
                  <k.icon size={15} />
                </div>
                <div className={`text-xl ${tone.value} mb-0.5`}>{k.value}</div>
                <div className="text-xs text-gray-500">{k.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {projectData && projectData.goals.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-base text-gray-800 mb-4">Progresso de metas - {projectData.name}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectData.goals.map(g => {
              const pct = goalProgress(g.current, g.target);
              const over = g.current >= g.target;
              return (
                <div key={g.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-700">{g.metric}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${over ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-xl text-gray-900">{g.current.toLocaleString('pt-BR')}</span>
                    <span className="text-sm text-gray-400 pb-0.5">/ {g.target.toLocaleString('pt-BR')} {g.unit}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className={`h-2 rounded-full ${over ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <h2 className="text-base text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-600" />
          Historico de alcance, engajamento e conversoes
        </h2>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="ga2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ge2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#e5e7eb" />
              <YAxis tick={{ fontSize: 11 }} stroke="#e5e7eb" width={45} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="alcance" stroke="#3b82f6" fill="url(#ga2)" name="Alcance" />
              <Area type="monotone" dataKey="engajamento" stroke="#10b981" fill="url(#ge2)" name="Engajamento" />
              <Area type="monotone" dataKey="conversoes" stroke="#8b5cf6" fill="none" name="Conversoes" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-sm text-center py-10">
            Sem historico validado. Conecte uma conta com evidencia real para liberar dados retroativos.
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-base text-gray-800 mb-4">Performance por formato</h2>
          {byFormat.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byFormat.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#e5e7eb" />
                <YAxis tick={{ fontSize: 11 }} stroke="#e5e7eb" width={30} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Pecas" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">Sem dados validados.</p>}
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-base text-gray-800 mb-4">Distribuicao por canal conectado</h2>
          {byChannel.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={byChannel} dataKey="pecas" nameKey="canal" outerRadius={80} label={false}>
                    {byChannel.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {byChannel.slice(0, 6).map((ch, i) => (
                  <div key={ch.canal} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-gray-700 truncate">{ch.canal}</span>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">{ch.pecas} pecas</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-10">Sem canais conectados com historico.</p>}
        </div>
      </div>

      {byChannel.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base text-gray-800">Desempenho detalhado por canal</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Canal', 'Pecas', 'Alcance Total', 'Engajamento Total', 'Eng/Peca', 'Taxa Eng. (%)'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byChannel.map(ch => (
                  <tr key={ch.canal} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-800">{ch.canal}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{ch.pecas}</td>
                    <td className="px-5 py-3 text-sm text-blue-600">{ch.alcance.toLocaleString('pt-BR')}</td>
                    <td className="px-5 py-3 text-sm text-green-600">{ch.engagement.toLocaleString('pt-BR')}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">
                      {ch.pecas > 0 ? Math.round(ch.engagement / ch.pecas).toLocaleString('pt-BR') : '-'}
                    </td>
                    <td className="px-5 py-3 text-sm text-purple-600">
                      {ch.alcance > 0 ? ((ch.engagement / ch.alcance) * 100).toFixed(1) + '%' : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
