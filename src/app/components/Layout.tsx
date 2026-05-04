import { useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  BarChart3,
  CalendarDays,
  Download,
  ChevronLeft,
  ChevronRight,
  Menu,
  Share2,
  User,
  Settings,
} from 'lucide-react';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projetos', label: 'Projetos', icon: FolderKanban },
  { to: '/conteudo', label: 'Conteúdo', icon: FileText },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/calendario', label: 'Calendário', icon: CalendarDays },
  { to: '/relatorios', label: 'Relatórios', icon: Download },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6f7fb] flex">
      {mobileOpen && (
        <div className="fixed inset-0 bg-gray-950/50 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed md:sticky top-0 h-screen bg-[#101828] text-white flex flex-col z-40 transition-all duration-300 shadow-2xl shadow-gray-950/10
          ${collapsed ? 'w-16' : 'w-60'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-white text-gray-950 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Share2 size={16} />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm leading-tight text-white">PAD</div>
              <div className="text-xs text-gray-400 leading-tight">Distribuição de conteúdo</div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'bg-white text-gray-950 shadow-sm'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={`border-t border-white/10 p-3 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 text-white">
            <User size={14} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm text-white truncate">Carlos Calebe</div>
              <div className="text-xs text-gray-400 truncate">Analista de conteúdo</div>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-white text-gray-700 border border-gray-200 rounded-full items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="text-gray-700" aria-label="Abrir menu">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-950 flex items-center justify-center">
              <Share2 size={13} className="text-white" />
            </div>
            <span className="text-sm text-gray-800">PAD</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
