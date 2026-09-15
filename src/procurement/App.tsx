import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ProcurementProvider, useProcurement } from './context/ProcurementContext';
import { Sidebar } from './components/layout/Sidebar';
import { MobileDrawer } from './components/layout/MobileDrawer';
import { TopHeader } from './components/layout/TopHeader';
import { DashboardView } from './components/dashboard/DashboardView';
import { ModuleView } from './components/procurement/ModuleView';
import { ProfileModal } from './components/modals/ProfileModal';
import { CreateRecordModal } from './components/modals/CreateRecordModal';
import { ModuleType } from './types/procurement';

const AppContent: React.FC = () => {
  const { activeNav, createRecord } = useProcurement();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  // Global modal for dashboard quick-add
  const [quickCreateModule, setQuickCreateModule] = useState<ModuleType | null>(null);

  const renderMainContent = () => {
    switch (activeNav) {
      case 'dashboard':
        return <DashboardView onOpenCreate={(mod) => setQuickCreateModule(mod)} />;
      case 'new-leather':
      case 'daily-leather':
      case 'material':
      case 'packaging':
        return <ModuleView module={activeNav as ModuleType} />;
      default:
        return <DashboardView onOpenCreate={(mod) => setQuickCreateModule(mod)} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100/70 text-slate-900 transition-colors">
      {/* Desktop Persistent Sidebar (Req #50 & #70) */}
      <div className="hidden lg:flex flex-shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Mobile Slide-in Drawer (Req #50) */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header (Req #51 & #71) */}
        <TopHeader
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenProfile={() => setProfileModalOpen(true)}
          onOpenActivityLog={() => setActivityModalOpen(true)}
        />

        {/* Scrollable Page Canvas */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full pb-12">
            {renderMainContent()}
          </div>
        </main>
      </div>

      {/* User Profile Modal (Req #71) */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Quick Create Modal from Dashboard */}
      {quickCreateModule && (
        <CreateRecordModal
          isOpen={Boolean(quickCreateModule)}
          onClose={() => setQuickCreateModule(null)}
          module={quickCreateModule}
          onCreate={createRecord}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ProcurementProvider>
          <AppContent />
        </ProcurementProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
