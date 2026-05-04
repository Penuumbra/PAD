import { useState } from 'react';
import { useProjects, useContent, FORMAT_LABELS, STATUS_COLORS, STATUS_LABELS } from '../store';
import { ChevronLeft, ChevronRight, Plus, X, Calendar } from 'lucide-react';
import { ContentItem } from '../types';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function EditorialCalendar() {
  const { projects } = useProjects();
  const { content } = useContent();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [filterProject, setFilterProject] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [view, setView] = useState<'month' | 'week'>('month');

  const filteredContent = filterProject === 'all'
    ? content
    : content.filter(c => c.projectId === filterProject);

  function getDayKey(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function getContentForDay(day: string) {
    return filteredContent.filter(c => c.scheduledDate === day || c.publishedDate === day);
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = getDayKey(now.getFullYear(), now.getMonth(), now.getDate());

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const selectedDayContent = selectedDay ? getContentForDay(selectedDay) : [];

  // Weekly view: current week
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return { date: d, key: getDayKey(d.getFullYear(), d.getMonth(), d.getDate()) };
  });

  // Upcoming scheduled content
  const upcoming = filteredContent
    .filter(c => c.scheduledDate && c.scheduledDate >= todayKey && c.status !== 'publicado')
    .sort((a, b) => (a.scheduledDate ?? '').localeCompare(b.scheduledDate ?? ''))
    .slice(0, 8);

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-900">Calendário Editorial</h1>
          <p className="text-gray-500 text-sm mt-1">Planejamento e distribuição de conteúdo</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white">
            <option value="all">Todos os Projetos</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            {(['month', 'week'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-2 text-sm transition-colors ${view === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {v === 'month' ? 'Mês' : 'Semana'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          {view === 'month' ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Calendar header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <button onClick={prev} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><ChevronLeft size={18} /></button>
                <h2 className="text-base text-gray-900">{MONTH_NAMES[month]} {year}</h2>
                <button onClick={next} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><ChevronRight size={18} /></button>
              </div>

              {/* Day names */}
              <div className="grid grid-cols-7 border-b border-gray-100">
                {DAYS.map(d => (
                  <div key={d} className="py-2 text-center text-xs text-gray-500">{d}</div>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7">
                {/* Empty cells */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`e${i}`} className="min-h-[70px] md:min-h-[90px] border-b border-r border-gray-50 bg-gray-50/50" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const key = getDayKey(year, month, day);
                  const items = getContentForDay(key);
                  const isToday = key === todayKey;
                  const isSelected = key === selectedDay;

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDay(isSelected ? null : key)}
                      className={`min-h-[70px] md:min-h-[90px] border-b border-r border-gray-50 p-1.5 cursor-pointer transition-colors
                        ${isToday ? 'bg-blue-50' : 'hover:bg-gray-50'}
                        ${isSelected ? 'ring-2 ring-inset ring-blue-400' : ''}
                      `}
                    >
                      <div className={`text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full
                        ${isToday ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {items.slice(0, 2).map(item => {
                          const proj = projects.find(p => p.id === item.projectId);
                          return (
                            <div key={item.id}
                              className="text-[10px] px-1 py-0.5 rounded truncate text-white leading-tight"
                              style={{ backgroundColor: proj?.color ?? '#6b7280' }}>
                              {item.title}
                            </div>
                          );
                        })}
                        {items.length > 2 && (
                          <div className="text-[10px] text-gray-500 px-1">+{items.length - 2} mais</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Weekly view */
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base text-gray-900">Semana Atual</h2>
              </div>
              <div className="grid grid-cols-7 divide-x divide-gray-100">
                {weekDays.map(({ date, key }) => {
                  const items = getContentForDay(key);
                  const isToday = key === todayKey;
                  return (
                    <div key={key} className={`p-2 min-h-[200px] ${isToday ? 'bg-blue-50' : ''}`}>
                      <div className={`text-xs text-center mb-2 ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                        <div>{DAYS[date.getDay()]}</div>
                        <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center ${isToday ? 'bg-blue-600 text-white' : 'text-gray-800'}`}>
                          {date.getDate()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {items.map(item => {
                          const proj = projects.find(p => p.id === item.projectId);
                          return (
                            <div key={item.id} className="text-[10px] p-1 rounded text-white leading-tight"
                              style={{ backgroundColor: proj?.color ?? '#6b7280' }}>
                              {item.title}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected day */}
          {selectedDay && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm text-gray-800 flex items-center gap-2">
                  <Calendar size={15} className="text-blue-600" />
                  {selectedDay}
                </h3>
                <button onClick={() => setSelectedDay(null)}><X size={15} className="text-gray-400" /></button>
              </div>
              <div className="p-4">
                {selectedDayContent.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Nenhum conteúdo neste dia.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedDayContent.map(item => {
                      const proj = projects.find(p => p.id === item.projectId);
                      return (
                        <div key={item.id} className="border border-gray-100 rounded-lg p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: proj?.color ?? '#9ca3af' }} />
                            <p className="text-sm text-gray-800 flex-1">{item.title}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{FORMAT_LABELS[item.format]}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>{STATUS_LABELS[item.status]}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upcoming */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm text-gray-800">Próximos Agendamentos</h3>
            </div>
            <div className="p-4 space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum conteúdo agendado.</p>
              ) : (
                upcoming.map(item => {
                  const proj = projects.find(p => p.id === item.projectId);
                  const daysUntil = Math.ceil(
                    (new Date(item.scheduledDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="text-center flex-shrink-0 w-10">
                        <div className="text-lg text-gray-900 leading-none">{new Date(item.scheduledDate!).getDate()}</div>
                        <div className="text-xs text-gray-400">{MONTH_NAMES[new Date(item.scheduledDate!).getMonth()].slice(0, 3)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{item.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proj?.color ?? '#9ca3af' }} />
                          <span className="text-xs text-gray-500 truncate">{proj?.name}</span>
                        </div>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${daysUntil <= 2 ? 'bg-red-100 text-red-600' : daysUntil <= 5 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                        {daysUntil === 0 ? 'Hoje' : daysUntil === 1 ? 'Amanhã' : `${daysUntil}d`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm text-gray-800 mb-3">Projetos</h3>
            <div className="space-y-2">
              {projects.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-xs text-gray-700 truncate">{p.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {content.filter(c => c.projectId === p.id && c.scheduledDate).length} agendados
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
