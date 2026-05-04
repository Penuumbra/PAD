import { useState } from 'react';
import { useProjects, useContent, PLATFORM_LABELS, PROJECT_COLOR_OPTIONS } from '../store';
import { Project, ProjectChannel, Platform } from '../types';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const PLATFORMS: Platform[] = ['instagram', 'linkedin', 'blog', 'email', 'youtube', 'tiktok', 'twitter', 'facebook', 'whatsapp', 'website'];
const STATUS_OPTS = [
  { value: 'ativo', label: 'Ativo', cls: 'bg-green-100 text-green-700' },
  { value: 'pausado', label: 'Pausado', cls: 'bg-yellow-100 text-yellow-700' },
  { value: 'concluido', label: 'Concluído', cls: 'bg-gray-100 text-gray-700' },
];

function goalRatio(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(current / target, 1);
}

const EMPTY_PROJECT: Omit<Project, 'id' | 'createdAt'> = {
  name: '', client: '', description: '', color: '#2563eb',
  status: 'ativo', channels: [], goals: [], startDate: new Date().toISOString().slice(0, 10),
};

export function ProjectsPage() {
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const { content } = useContent();
  const [modal, setModal] = useState<null | 'create' | Project>(null);
  const [form, setForm] = useState(EMPTY_PROJECT);
  const [newChannel, setNewChannel] = useState<Platform>('instagram');
  const [delConfirm, setDelConfirm] = useState<string | null>(null);

  function openCreate() {
    setForm(EMPTY_PROJECT);
    setModal('create');
  }

  function openEdit(p: Project) {
    setForm({ name: p.name, client: p.client, description: p.description ?? '', color: p.color, status: p.status, channels: p.channels, goals: p.goals, startDate: p.startDate });
    setModal(p);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (modal === 'create') {
      addProject(form);
    } else {
      updateProject((modal as Project).id, form);
    }
    setModal(null);
  }

  function addChannel() {
    if (form.channels.some(c => c.platform === newChannel)) return;
    setForm(f => ({ ...f, channels: [...f.channels, { platform: newChannel }] }));
  }

  function removeChannel(platform: string) {
    setForm(f => ({ ...f, channels: f.channels.filter(c => c.platform !== platform) }));
  }

  function updateChannel(platform: string, field: keyof ProjectChannel, value: string | number) {
    setForm(f => ({
      ...f,
      channels: f.channels.map(c => c.platform === platform ? { ...c, [field]: value } : c),
    }));
  }

  function addGoal() {
    const g = { id: `g${Date.now()}`, metric: '', target: 0, current: 0, unit: '' };
    setForm(f => ({ ...f, goals: [...f.goals, g] }));
  }

  function updateGoal(id: string, field: string, value: string | number) {
    setForm(f => ({ ...f, goals: f.goals.map(g => g.id === id ? { ...g, [field]: value } : g) }));
  }

  function removeGoal(id: string) {
    setForm(f => ({ ...f, goals: f.goals.filter(g => g.id !== id) }));
  }

  const statusCls = (s: string) => STATUS_OPTS.find(o => o.value === s)?.cls ?? '';
  const statusLabel = (s: string) => STATUS_OPTS.find(o => o.value === s)?.label ?? s;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-900">Projetos</h1>
          <p className="text-gray-500 mt-1 text-sm">{projects.length} projeto(s) cadastrado(s)</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Novo Projeto</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {projects.map(p => {
          const pContent = content.filter(c => c.projectId === p.id);
          const published = pContent.filter(c => c.status === 'publicado').length;
          const pct = p.goals.length
            ? Math.round(p.goals.reduce((a, g) => a + goalRatio(g.current, g.target), 0) / p.goals.length * 100)
            : 0;
          return (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-2" style={{ backgroundColor: p.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <h3 className="text-base text-gray-900 truncate">{p.name}</h3>
                    <p className="text-sm text-gray-500">{p.client}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 ${statusCls(p.status)}`}>
                    {statusLabel(p.status)}
                  </span>
                </div>

                {p.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{p.description}</p>}

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {p.channels.slice(0, 4).map(ch => (
                    <span key={ch.platform} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {PLATFORM_LABELS[ch.platform]}
                    </span>
                  ))}
                  {p.channels.length > 4 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">+{p.channels.length - 4}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-lg text-gray-900">{pContent.length}</div>
                    <div className="text-xs text-gray-500">Conteúdos</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-lg text-green-600">{published}</div>
                    <div className="text-xs text-gray-500">Publicados</div>
                  </div>
                </div>

                {p.goals.length > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Metas</span><span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm text-gray-600 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit2 size={14} /> Editar
                  </button>
                  <button
                    onClick={() => setDelConfirm(p.id)}
                    className="p-2 text-red-500 border border-gray-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* New project card */}
        <button
          onClick={openCreate}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors min-h-[200px]"
        >
          <Plus size={28} />
          <span className="text-sm">Adicionar Projeto</span>
        </button>
      </div>

      {/* Delete Confirm */}
      {delConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg text-gray-900 mb-2">Excluir projeto?</h3>
            <p className="text-gray-500 text-sm mb-6">Esta ação não pode ser desfeita. O conteúdo vinculado ao projeto permanecerá.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelConfirm(null)} className="flex-1 border border-gray-200 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={() => { deleteProject(delConfirm); setDelConfirm(null); }} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg text-gray-900">{modal === 'create' ? 'Novo Projeto' : 'Editar Projeto'}</h2>
              <button onClick={() => setModal(null)}><X size={20} className="text-gray-500" /></button>
            </div>

            <div className="overflow-y-auto p-6 space-y-5 flex-1">
              {/* Basic info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">Nome do Projeto *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Ex: Campanha Institucional" />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">Cliente</label>
                  <input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Ex: Empresa XYZ" />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500">
                    {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">Início</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-1 block">Descrição</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Objetivo geral do projeto..." />
              </div>

              {/* Color */}
              <div>
                <label className="text-sm text-gray-700 mb-2 block">Cor do Projeto</label>
                <div className="flex gap-2 flex-wrap">
                  {PROJECT_COLOR_OPTIONS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              {/* Channels */}
              <div>
                <label className="text-sm text-gray-700 mb-2 block">Canais de Distribuição</label>
                <div className="flex gap-2 mb-3">
                  <select value={newChannel} onChange={e => setNewChannel(e.target.value as Platform)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500">
                    {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
                  </select>
                  <button onClick={addChannel} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {form.channels.map(ch => (
                    <div key={ch.platform} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-700 w-24 flex-shrink-0">{PLATFORM_LABELS[ch.platform]}</span>
                      <input value={ch.handle ?? ''} onChange={e => updateChannel(ch.platform, 'handle', e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400" placeholder="@handle ou URL" />
                      <input type="number" value={ch.targetReach ?? ''} onChange={e => updateChannel(ch.platform, 'targetReach', Number(e.target.value))}
                        className="w-24 bg-transparent text-sm outline-none text-right placeholder-gray-400" placeholder="Meta alcance" />
                      <button onClick={() => removeChannel(ch.platform)} className="text-red-400 hover:text-red-600">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Goals */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700">Metas de Performance</label>
                  <button onClick={addGoal} className="text-xs text-blue-600 flex items-center gap-1 hover:text-blue-700">
                    <Plus size={13} /> Adicionar Meta
                  </button>
                </div>
                <div className="space-y-2">
                  {form.goals.map(g => (
                    <div key={g.id} className="grid grid-cols-4 gap-2 bg-gray-50 rounded-lg p-2">
                      <input value={g.metric} onChange={e => updateGoal(g.id, 'metric', e.target.value)}
                        className="col-span-2 bg-white border border-gray-200 rounded px-2 py-1 text-sm outline-none" placeholder="Métrica (ex: Alcance)" />
                      <input type="number" value={g.target || ''} onChange={e => updateGoal(g.id, 'target', Number(e.target.value))}
                        className="bg-white border border-gray-200 rounded px-2 py-1 text-sm outline-none" placeholder="Meta" />
                      <div className="flex gap-1">
                        <input type="number" value={g.current || ''} onChange={e => updateGoal(g.id, 'current', Number(e.target.value))}
                          className="flex-1 bg-white border border-gray-200 rounded px-2 py-1 text-sm outline-none" placeholder="Atual" />
                        <button onClick={() => removeGoal(g.id)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 py-2.5 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm hover:bg-blue-700">Salvar Projeto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
