import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Header } from './components/layout/Header.js';
import { Sidebar, type NavView } from './components/layout/Sidebar.js';
import { LoginView } from './views/LoginView.js';
import { GeneratorView } from './views/GeneratorView.js';
import { CaseListView } from './views/CaseListView.js';
import { CaseDetailView } from './views/CaseDetailView.js';
import { AuditLogView } from './views/AuditLogView.js';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeView, setActiveView] = useState<NavView>('cases');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Parse URL hash on mount and hash changes for deep linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash.startsWith('cases/')) {
        const id = hash.replace('cases/', '');
        setActiveView('cases');
        setSelectedCaseId(id);
      } else if (hash === 'generator') {
        setActiveView('generator');
        setSelectedCaseId(null);
      } else if (hash === 'audit') {
        setActiveView('audit');
        setSelectedCaseId(null);
      } else if (hash === 'cases') {
        setActiveView('cases');
        setSelectedCaseId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync state to URL hash
  const navigateTo = (view: NavView, caseId?: string | null) => {
    setActiveView(view);
    if (view === 'cases') {
      if (caseId) {
        setSelectedCaseId(caseId);
        window.location.hash = `cases/${caseId}`;
      } else {
        setSelectedCaseId(null);
        window.location.hash = 'cases';
      }
    } else {
      setSelectedCaseId(null);
      window.location.hash = view;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070A0F] tactical-grid-bg flex items-center justify-center">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-tactical-mono text-cyan-400 tracking-wider">
            NETRA CRYPTOGRAPHIC HANDSHAKE...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col tactical-grid-bg">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeView={activeView}
          onNavigate={(view) => navigateTo(view, null)}
          selectedCaseId={selectedCaseId}
        />

        {/* Workspace Content View */}
        <main className="flex-1 overflow-y-auto">
          {activeView === 'generator' && <GeneratorView />}

          {activeView === 'cases' && (
            <>
              {selectedCaseId ? (
                <CaseDetailView
                  caseId={selectedCaseId}
                  onBack={() => navigateTo('cases', null)}
                  onNavigateToGenerator={() => navigateTo('generator', null)}
                />
              ) : (
                <CaseListView onSelectCase={(id) => navigateTo('cases', id)} />
              )}
            </>
          )}

          {activeView === 'audit' && <AuditLogView />}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;
