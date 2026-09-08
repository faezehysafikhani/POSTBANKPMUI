import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { ProjectProgressDashboard } from './components/dashboard/ProjectProgressDashboard';
import { PortfolioView } from './components/projects/PortfolioView';
import { TaskInbox } from './components/tasks/TaskInbox';
import { InternalChat } from './components/chat/InternalChat';
import { KnowledgeView } from './components/knowledge/KnowledgeView';
import { UsersView } from './components/users/UsersView';
import { SettingsView } from './components/settings/SettingsView';
import { ProjectModal } from './components/projects/ProjectModal';
import { ActionModal } from './components/projects/ActionModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { LoginPage } from './components/auth/LoginPage';

const MainLayout: React.FC = () => {
  const { activeNav, isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeNav) {
      case 'dashboards.overview':
        return <OverviewDashboard />;
      case 'dashboards.project':
        return <ProjectProgressDashboard />;
      case 'projects.portfolio':
        return <PortfolioView />;
      case 'inbox.tasks':
        return <TaskInbox initialTab="tasks" />;
      case 'inbox.approvals':
        return <TaskInbox initialTab="approvals" />;
      case 'chat':
        return <InternalChat />;
      case 'knowledge.items':
        return <KnowledgeView initialTab="knowledge" />;
      case 'knowledge.strategy':
        return <KnowledgeView initialTab="strategy" />;
      case 'users.list':
        return <UsersView />;
      case 'users.settings':
        return <SettingsView />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-['Shabnam','Noto_Sans_Arabic',sans-serif]">
      {/* Collapsible Persian Sidebar */}
      <Sidebar />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <ProjectModal />
      <ActionModal />
      <GlobalSearchModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
