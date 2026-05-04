import { NavLink } from 'react-router';
import { useProjects, useContent, STATUS_LABELS, STATUS_COLORS } from '../store';
import { ContentItem } from '../types';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  FolderKanban,
  PlusCircle,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar as ChartBar } from 'recharts';
import { METRIC_TONE_CLASSES, MetricTone } from './metricCardStyles';

const MONTH_LABEL = new Intl.DateTimeFormat('pt-BR', { month: 'short' });

function formatCompact(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return String(value);
}

function buildMonthlyTrend(items: ContentItem[]) {
  const map = new Map<string, { mes: string; alcance: number; engajamento: number; sort: string }>();

  items
    .filter(item => item.status === 'publicado')
    .forEach(item => {
      const dateValue = item.publishedDate ?? item.scheduledDate ?? item.createdAt;
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = map.get(key) ?? {
        mes: MONTH_LABEL.format(date).replace('.', ''),
        alcance: 0,
        engajamento: 0,
        sort: key,
      };

      current.alcance += item.metrics?.reach ?? 0;
      current.engajamento += item.metrics?.engagement ?? 0;
      map.set(key, current);
    });

  return Array.from(map.values()).sort((a, b) => a.sort.localeCompare(b.sort)).slice(-6);
}

const emptyActions = [
  { to: '/projetos', label: 'Criar projeto', icon: FolderKanban, copy: 'Defina cliente, canais e metas.' },
  { to: '/conteudo', label: 'Planejar conteúdo', icon: FileText, copy: 'Organize peças no pipeline.' },
  { to: '/configuracoes', label: 'Conectar contas', icon: Zap, copy: 'Valide métricas reais por OAuth.' },
];

export function Dashboard() {
  const { projects } = useProjects();
  const { content } = useContent();

  const active = projects.filter(p => p.status === 'ativo').length;
  const published = content.filter(c => c.status === 'publicado').length;
  const pending = content.filter(c => ['ideia', 'redacao', 'revisao', 'aprovado'].includes(c.status)).length;
  const totalReach = content
    .filter(c => c.status === 'publicado' && c.metrics?.reach)
    .reduce((acc, c) => acc + (c.metrics?.reach ?? 0), 0);

  const recentContent = [...content]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const byStatus = ['ideia', 'redacao', 'revisao', 'aprovado', 'publicado'].map(status => ({
    status: STATUS_LABELS[status],
    count: content.filter(c => c.status === status).length,
  }));

  const projectProgress = projects.map(project => {
    const total = project.goals.reduce((acc, goal) => acc + goal.target, 0);
    const current = project.goals.reduce((acc, goal) => acc + goal.current, 0);
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    return {
      name: project.name,
      pct,
      color: project.color,
      items: content.filter(item => item.projectId === project.id).length,
    };
  });

  const trendData = buildMonthlyTrend(content);
  const hasProjects = projects.length > 0;
  const hasContent = content.length > 0;

  const kpis: Array<{
    label: string;
    value: string | number;
    icon: typeof Zap;
    tone: MetricTone;
    sub: string;
  }> = [
    { label: 'Projetos ativos', value: active, icon: Zap, tone: 'blue', sub: `${projects.length} no total` },
    { label: 'Conteúdos publicados', value: published, icon: CheckCircle, tone: 'emerald', sub: 'com status finalizado' },
    { label: 'Em produção', value: pending, icon: Clock, tone: 'amber', sub: 'ideia, redação ou revisão' },
    { label: 'Alcance validado', value: formatCompact(totalReach), icon: Eye, tone: 'purple', sub: 'somente publicados' },
  ];

  return (
    <div className="min-h-full bg-[#f6f7fb]">
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 md:p-6 overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-50 via-emerald-50/60 to-transparent pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Operação de distribuição
              </div>
              <h1 className="text-2xl md:text-3xl text-gray-950">Painel PAD</h1>
              <p className="text-gray-500 mt-1 text-sm md:text-base max-w-2xl">
                Controle projetos, pipeline editorial, calendário e métricas validadas em um fluxo único.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <NavLink
                to="/projetos"
                className="inline-flex items-center gap-2 bg-gray-950 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                <PlusCircle size={16} />
                Novo projeto
              </NavLink>
              <NavLink
                to="/conteudo"
                className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <FileText size={16} />
                Nova peça
              </NavLink>
            </div>
          </div>
        </section>

        {!hasProjects && !hasContent && (
          <section className="grid md:grid-cols-3 gap-3">
            {emptyActions.map(({ to, label, icon: Icon, copy }) => (
              <NavLink
                key={to}
                to={to}
                className="group bg-white rounded-xl border border-dashed border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600">
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      {label}
                      <ArrowRight size={13} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{copy}</p>
                  </div>
                </div>
              </NavLink>
            ))}
          </section>
        )}

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {kpis.map(kpi => {
            const tone = METRIC_TONE_CLASSES[kpi.tone];
            return (
              <div key={kpi.label} className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 shadow-sm">
                <div className={`w-9 h-9 rounded-lg ${tone.icon} flex items-center justify-center mb-3`}>
                  <kpi.icon size={18} />
                </div>
                <div className={`text-2xl md:text-3xl ${tone.value} mb-1`}>{kpi.value}</div>
                <div className="text-gray-800 text-xs md:text-sm">{kpi.label}</div>
                <div className="text-gray-400 text-xs mt-0.5">{kpi.sub}</div>
              </div>
            );
          })}
        </section>

        <section className="grid lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-base text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              Alcance e engajamento publicados
            </h2>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="alcanceDashboard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="engajamentoDashboard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#d1d5db" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#d1d5db" width={45} />
                  <Tooltip />
                  <Area type="monotone" dataKey="alcance" stroke="#2563eb" fill="url(#alcanceDashboard)" name="Alcance" />
                  <Area type="monotone" dataKey="engajamento" stroke="#10b981" fill="url(#engajamentoDashboard)" name="Engajamento" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center px-6">
                <BarChart3 size={24} className="text-gray-400 mb-2" />
                <p className="text-sm text-gray-700">Sem métricas publicadas ainda.</p>
                <p className="text-xs text-gray-500 mt-1 max-w-md">
                  Publique conteúdos e registre métricas reais para liberar a evolução mensal.
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-base text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-purple-600" />
              Pipeline de conteúdo
            </h2>
            {hasContent ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#d1d5db" />
                  <YAxis dataKey="status" type="category" tick={{ fontSize: 11 }} stroke="#d1d5db" width={70} />
                  <Tooltip />
                  <ChartBar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} name="Qtd" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center px-6">
                <FileText size={24} className="text-gray-400 mb-2" />
                <p className="text-sm text-gray-700">Pipeline vazio.</p>
                <NavLink to="/conteudo" className="text-xs text-blue-600 mt-1 hover:text-blue-700">
                  Cadastrar primeira peça
                </NavLink>
              </div>
            )}
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-base text-gray-800 mb-4 flex items-center gap-2">
              <Target size={18} className="text-orange-600" />
              Progresso de metas por projeto
            </h2>
            {projectProgress.length > 0 ? (
              <div className="space-y-4">
                {projectProgress.map(project => (
                  <div key={project.name}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                        <span className="text-sm text-gray-700 truncate">{project.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{project.items} peças</span>
                        <span className="text-sm text-gray-800">{project.pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(project.pct, 100)}%`, backgroundColor: project.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
                <Target size={24} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-700">Nenhuma meta cadastrada.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-base text-gray-800 mb-4 flex items-center gap-2">
              <CalendarDays size={18} className="text-blue-600" />
              Atividade recente
            </h2>
            {recentContent.length > 0 ? (
              <div className="space-y-3">
                {recentContent.map(item => {
                  const project = projects.find(p => p.id === item.projectId);
                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <span
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: project?.color ?? '#6b7280' }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-800 truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 truncate">{project?.name ?? 'Sem projeto'}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>
                            {STATUS_LABELS[item.status]}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{item.createdAt}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
                <Clock size={24} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-700">Sem atividade registrada.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
