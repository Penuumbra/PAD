import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProjectsPage } from './components/ProjectsPage';
import { ContentPipeline } from './components/ContentPipeline';
import { AnalyticsPage } from './components/AnalyticsPage';
import { EditorialCalendar } from './components/EditorialCalendar';
import { ReportsPage } from './components/ReportsPage';
import { SettingsPage } from './components/SettingsPage';
import { LegalPage } from './components/LegalPage';

export const router = createBrowserRouter([
  { path: '/politica-de-privacidade', Component: LegalPage },
  { path: '/termos-de-servico', Component: LegalPage },
  { path: '/exclusao-de-dados', Component: LegalPage },
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'projetos', Component: ProjectsPage },
      { path: 'conteudo', Component: ContentPipeline },
      { path: 'analytics', Component: AnalyticsPage },
      { path: 'calendario', Component: EditorialCalendar },
      { path: 'relatorios', Component: ReportsPage },
      { path: 'configuracoes', Component: SettingsPage },
    ],
  },
]);
