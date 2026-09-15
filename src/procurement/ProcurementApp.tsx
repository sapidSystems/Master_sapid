import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ProcurementProvider, useProcurement } from './context/ProcurementContext';
import { DashboardView } from './components/dashboard/DashboardView';
import { ModuleView } from './components/procurement/ModuleView';
import { CreateRecordModal } from './components/modals/CreateRecordModal';
import { ModuleType } from './types/procurement';
import AdminLayout from '../components/layout/AdminLayout';

interface ProcurementAppInnerProps {
  currentTab?: string;
}

const ProcurementAppInner: React.FC<ProcurementAppInnerProps> = ({ currentTab }) => {
  const { activeNav, setActiveNav, createRecord } = useProcurement();
  const [quickCreateModule, setQuickCreateModule] = useState<ModuleType | null>(null);

  // Sync tab with route if provided
  React.useEffect(() => {
    if (currentTab && currentTab !== activeNav) {
      setActiveNav(currentTab);
    }
  }, [currentTab, activeNav, setActiveNav]);

  const renderMainContent = () => {
    const effectiveNav = currentTab || activeNav;
    switch (effectiveNav) {
      case 'dashboard':
        return <DashboardView />;
      case 'new-leather':
      case 'daily-leather':
      case 'material':
      case 'packaging':
        return <ModuleView module={effectiveNav as ModuleType} />;
      default:
        return <DashboardView />;
    }
  };

  const getPageTitle = () => {
    const nav = currentTab || activeNav;
    switch (nav) {
      case 'dashboard':
        return 'Procurement Dashboard';
      case 'new-leather':
        return 'New Leather Development';
      case 'daily-leather':
        return 'Daily Leather Procurement';
      case 'material':
      case 'packaging':
        return 'Daily Material Procurement';
      default:
        return nav.replace('-', ' ');
    }
  };

  return (
    <AdminLayout>
      <div className="w-full bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Procurement System</span>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {getPageTitle()}
          </h1>
        </div>
      </div>
      <div className="min-h-full text-slate-900 p-3 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto w-full pb-12">
          {renderMainContent()}
        </div>

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
    </AdminLayout>
  );
};

export function ProcurementApp({ currentTab }: { currentTab?: string }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ProcurementProvider>
          <ProcurementAppInner currentTab={currentTab} />
        </ProcurementProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default ProcurementApp;
