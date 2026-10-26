import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Sidebar, NavTab } from './components/common/Sidebar.js';
import { Header } from './components/common/Header.js';
import { PublicSite } from './components/public/PublicSite.js';
import { GlobalDashboard } from './components/dashboard/GlobalDashboard.js';
import { RegionsView } from './components/regions/RegionsView.js';
import { EvangelismsView } from './components/evangelism/EvangelismsView.js';
import { ReportsView } from './components/reports/ReportsView.js';
import { AiAnalysisModal } from './components/reports/AiAnalysisModal.js';
import { CoursesView } from './components/courses/CoursesView.js';
import { DepartmentsView } from './components/departments/DepartmentsView.js';
import { LoginView } from './components/auth/LoginView.js';

function MainPortal() {
  const { currentUser, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // If public site is requested, anyone can see it
  if (currentTab === 'public_site') {
    return (
      <PublicSite
        onEnterPortal={() => setCurrentTab('dashboard')}
      />
    );
  }

  // Initial loading state during session restoration
  if (isLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-stone-200">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-stone-400">Verificando credencial ministerial...</p>
      </div>
    );
  }

  // Priority 0: Lock dashboard and admin modules when currentUser is null
  if (!currentUser) {
    return <LoginView onGoToPublicSite={() => setCurrentTab('public_site')} />;
  }

  const renderActiveModule = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <GlobalDashboard
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenAiAnalysis={() => setIsAiModalOpen(true)}
          />
        );
      case 'regions':
        return <RegionsView />;
      case 'evangelisms':
        return <EvangelismsView />;
      case 'courses':
      case 'certificates':
        return <CoursesView />;
      case 'reports':
      case 'ai_analysis':
        return <ReportsView onOpenAiAnalysis={() => setIsAiModalOpen(true)} />;
      case 'departments':
      case 'tasks':
        return <DepartmentsView />;
      default:
        return (
          <GlobalDashboard
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenAiAnalysis={() => setIsAiModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100/60 font-['Montserrat',sans-serif]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'ai_analysis') {
            setIsAiModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentTab={currentTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenAiAnalysis={() => setIsAiModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {renderActiveModule()}
        </main>
      </div>

      {/* Global AI Synthesis Modal */}
      <AiAnalysisModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainPortal />
    </AuthProvider>
  );
}
