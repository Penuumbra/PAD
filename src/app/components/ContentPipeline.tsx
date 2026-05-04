import { Plus, X, ChevronRight, ArrowRight, Trash2, BarChart2 } from 'lucide-react';
import { useProjects, useContent, PLATFORM_LABELS, FORMAT_LABELS, STATUS_LABELS, STATUS_COLORS } from '../store';
import { ContentItem, ContentStatus, Platform, ContentFormat } from '../types';
import { useState } from 'react';

const STATUSES: ContentStatus[] = ['ideia', 'redacao', 'revisao', 'aprovado', 'publicado'];
const FORMATS: ContentFormat[] = ['post', 'reel', 'carrossel', 'artigo', 'newsletter', 'stories', 'infografico', 'video', 'podcast', 'live', 'thread'];
const PLATFORMS: Platform[] = ['instagram', 'linkedin', 'blog', 'email', 'youtube', 'tiktok', 'twitter', 'facebook', 'whatsapp', 'website'];

const COLUMN_COLORS: Record<ContentStatus, string> = {
  ideia: 'border-gray-300',
  redacao: 'border-yellow-400',
  revisao: 'border-orange-400',
  aprovado: 'border-blue-400',
  publicado: 'border-green-400',
  arquivado: 'border-red-300',
};

const EMPTY: Omit<ContentItem, 'id' | 'createdAt'> = {
  projectId: '', title: '', description: '', format: 'post',
  channels: [], status: 'ideia', tags: [], notes: '',
  scheduledDate: '', metrics: {},
};

export function ContentPipeline() {
  const { projects } = useProjects();
  const { content, addContent, updateContent, deleteContent } = useContent();
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [modal, setModal] = useState<null | 'create' | ContentItem>(null);
  const [detailItem, setDetailItem] = useState<ContentItem | null>(null);
  const [form, setForm] = useState<Omit<ContentItem, 'id' | 'createdAt'>>(EMPTY);
  const [tagInput, setTagInput] = useState('');

  const filtered = content.filter(c => {
    if (filterProject !== 'all' && c.projectId !== filterProject) return false;
    if (filterFormat !== 'all' && c.format !== filterFormat) return false;
    return true;
  });

  function openCreate() {
    setForm({ ...EMPTY, projectId: filterProject !== 'all' ? filterProject : (projects[0]?.id ?? '') });
    setModal('create');
  }

  function openEdit(item: ContentItem) {
    setForm({ projectId: item.projectId, title: item.title, description: item.description ?? '',
      format: item.format, channels: item.channels, status: item.status, tags: item.tags,
      notes: item.notes ?? '', scheduledDate: item.scheduledDate ?? '',
      publishedDate: item.publishedDate, metrics: item.metrics ?? {} });
    setModal(item);
    setDetailItem(null);
  }

  function handleSave() {
    if (!form.title.trim() || !form.projectId) return;
    if (modal === 'create') addContent(form);
    else updateContent((modal as ContentItem).id, form);
    setModal(null);
  }

  function advance(item: ContentItem) {
    const idx = STATUSES.indexOf(item.status as ContentStatus);
    if (idx < STATUSES.length - 1) updateContent(item.id, { status: STATUSES[idx + 1] });
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) { setForm(f => ({ ...f, tags: [...f.tags, t] })); }
    setTagInput('');
  }

  function toggleChannel(p: Platform) {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(p) ? f.channels.filter(c => c !== p) : [...f.channels, p],
    }));
  }

  function updateMetric(field: string, val: number) {
    setForm(f => ({ ...f, metrics: { ...f.metrics, [field]: val } }));
  }

  const METRICS_FIELDS = [
    { key: 'reach', label: 'Alcance' }, { key: 'impressions', label: 'Impressões' },
    { key: 'engagement', label: 'Engajamento' }, { key: 'likes', label: 'Curtidas' },
    { key: 'comments', label: 'Comentários' }, { key: 'shares', label: 'Compartilhamentos' },
    { key: 'saves', label: 'Salvamentos' }, { key: 'clicks', label: 'Cliques' },
    { key: 'conversions', label: 'Conversões' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-900">Pipeline de Conteúdo</h1>
          <p className="text-gray-500 text-sm mt-1">{content.length} peças no total</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 text-sm self-start">
          <Plus size={16} /> Nova Peça
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white">
          <option value="all">Todos os Projetos</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterFormat} onChange={e => setFilterFormat(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white">
          <option value="all">Todos os Formatos</option>
          {FORMATS.map(f => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
        </select>
        <div className="text-sm text-gray-500 flex items-center px-2">{filtered.length} resultado(s)</div>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {STATUSES.map(status => {
          const cols = filtered.filter(c => c.status === status);
          return (
            <div key={status} className={`flex-shrink-0 w-64 md:w-72 bg-white rounded-xl border-t-4 ${COLUMN_COLORS[status]} shadow-sm`}>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-700">{STATUS_LABELS[status]}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{cols.length}</span>
              </div>
              <div className="p-3 space-y-2.5 min-h-[120px] max-h-[60vh] overflow-y-auto">
                {cols.map(item => {
                  const proj = projects.find(p => p.id === item.projectId);
                  return (
                    <div key={item.id}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-gray-300 transition-colors cursor-pointer group"
                      onClick={() => setDetailItem(item)}>
                      <div className="flex items-start gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: proj?.color ?? '#9ca3af' }} />
                        <p className="text-sm text-gray-800 leading-tight flex-1">{item.title}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1 flex-wrap">
                          <span className="text-xs bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                            {FORMAT_LABELS[item.format]}
                          </span>
                        </div>
                        {status !== 'publicado' && (
                          <button
                            onClick={e => { e.stopPropagation(); advance(item); }}
                            className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-700 transition-opacity"
                            title="Avançar estágio"
                          >
                            <ChevronRight size={16} />
                          </button>
                        )}
                      </div>
                      {item.scheduledDate && (
                        <p className="text-xs text-gray-400 mt-1.5">{item.scheduledDate}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {detailItem && (() => {
        const proj = projects.find(p => p.id === detailItem.projectId);
        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end p-0 md:p-4">
            <div className="bg-white w-full md:w-[420px] h-full md:h-auto md:max-h-[90vh] md:rounded-xl flex flex-col shadow-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[detailItem.status]}`}>
                  {STATUS_LABELS[detailItem.status]}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(detailItem)} className="text-xs text-blue-600 hover:text-blue-700">Editar</button>
                  <button onClick={() => { deleteContent(detailItem.id); setDetailItem(null); }}
                    className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                  <button onClick={() => setDetailItem(null)}><X size={18} className="text-gray-500" /></button>
                </div>
              </div>
              <div className="overflow-y-auto p-5 space-y-4 flex-1">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{proj?.name}</p>
                  <h2 className="text-lg text-gray-900">{detailItem.title}</h2>
                  {detailItem.description && <p className="text-sm text-gray-600 mt-2">{detailItem.description}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Formato</p>
                    <p className="text-sm text-gray-800">{FORMAT_LABELS[detailItem.format]}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Agendado</p>
                    <p className="text-sm text-gray-800">{detailItem.scheduledDate ?? '—'}</p>
                  </div>
                </div>
                {detailItem.channels.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Canais</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detailItem.channels.map(c => (
                        <span key={c} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{PLATFORM_LABELS[c]}</span>
                      ))}
                    </div>
                  </div>
                )}
                {detailItem.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detailItem.tags.map(t => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">#{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {detailItem.metrics && Object.keys(detailItem.metrics).length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><BarChart2 size={12} />Métricas</p>
                    <div className="grid grid-cols-3 gap-2">
                      {METRICS_FIELDS.filter(f => (detailItem.metrics as any)[f.key] !== undefined).map(f => (
                        <div key={f.key} className="bg-gray-50 rounded-lg p-2 text-center">
                          <div className="text-sm text-gray-900">{((detailItem.metrics as any)[f.key] ?? 0).toLocaleString('pt-BR')}</div>
                          <div className="text-xs text-gray-500">{f.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {detailItem.notes && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Notas</p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{detailItem.notes}</p>
                  </div>
                )}
                {detailItem.status !== 'publicado' && (
                  <button onClick={() => { advance(detailItem); setDetailItem(null); }}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm hover:bg-blue-700">
                    <ArrowRight size={16} /> Avançar para {STATUS_LABELS[STATUSES[STATUSES.indexOf(detailItem.status as ContentStatus) + 1]]}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg text-gray-900">{modal === 'create' ? 'Nova Peça de Conteúdo' : 'Editar Conteúdo'}</h2>
              <button onClick={() => setModal(null)}><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4 flex-1">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm text-gray-700 mb-1 block">Título *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Título do conteúdo" />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">Projeto</label>
                  <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500">
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">Formato</label>
                  <select value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value as any }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500">
                    {FORMATS.map(f => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500">
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">Data Agendada</label>
                  <input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-2 block">Canais</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => toggleChannel(p)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.channels.includes(p) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                      {PLATFORM_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-1 block">Descrição</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Briefing ou descrição da peça..." />
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-2 block">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Digite uma tag e pressione Enter" />
                  <button onClick={addTag} className="bg-gray-100 px-3 py-2 rounded-lg text-sm hover:bg-gray-200"><Plus size={14} /></button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map(t => (
                    <span key={t} className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                      #{t}
                      <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}><X size={11} /></button>
                    </span>
                  ))}
                </div>
              </div>

              {(form.status === 'publicado' || modal !== 'create') && (
                <div>
                  <label className="text-sm text-gray-700 mb-2 block flex items-center gap-1"><BarChart2 size={14} />Métricas de Performance</label>
                  <div className="grid grid-cols-3 gap-2">
                    {METRICS_FIELDS.map(f => (
                      <div key={f.key}>
                        <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                        <input type="number" value={(form.metrics as any)?.[f.key] ?? ''}
                          onChange={e => updateMetric(f.key, Number(e.target.value))}
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500" placeholder="0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-700 mb-1 block">Notas Internas</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Observações, referências, links..." />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 py-2.5 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm hover:bg-blue-700">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}