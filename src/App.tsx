import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { ToastContainer, ToastMessage } from './components/Toast.tsx';

// Views
import { DashboardView } from './views/DashboardView.tsx';
import { ProductsView } from './views/ProductsView.tsx';
import { CategoriesView } from './views/CategoriesView.tsx';
import { ReorderingRulesView } from './views/ReorderingRulesView.tsx';
import { ReceiptsView } from './views/ReceiptsView.tsx';
import { DeliveriesView } from './views/DeliveriesView.tsx';
import { TransfersView } from './views/TransfersView.tsx';
import { AdjustmentsView } from './views/AdjustmentsView.tsx';
import { MoveHistoryView } from './views/MoveHistoryView.tsx';
import { StockOverviewView } from './views/StockOverviewView.tsx';
import { StockByLocationView } from './views/StockByLocationView.tsx';
import { StockLedgerView } from './views/StockLedgerView.tsx';
import { WarehousesView } from './views/WarehousesView.tsx';
import { ReportsView } from './views/ReportsView.tsx';
import { SettingsView } from './views/SettingsView.tsx';

import { api } from './api.ts';

function AppContent() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [badgeCounters, setBadgeCounters] = useState({
    pendingReceipts: 0,
    pendingDeliveries: 0,
    lowStock: 0
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', details?: string) => {
    const newToast: ToastMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      message,
      details
    };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const updateBadges = async () => {
    try {
      const stats = await api.getDashboardStats();
      if (stats?.kpis) {
        setBadgeCounters({
          pendingReceipts: stats.kpis.pending_receipts || 0,
          pendingDeliveries: stats.kpis.pending_deliveries || 0,
          lowStock: stats.kpis.low_stock_items || 0
        });
      }
    } catch {
      // silent background counter refresh
    }
  };

  useEffect(() => {
    updateBadges();
  }, [currentView]);

  const getSectionNames = (view: string) => {
    switch (view) {
      case 'dashboard':
        return { section: 'Overview', subSection: 'Dashboard' };
      case 'products':
        return { section: 'Products', subSection: 'Master Catalog' };
      case 'categories':
        return { section: 'Products', subSection: 'Categories' };
      case 'reorder-rules':
        return { section: 'Products', subSection: 'Reordering Rules' };
      case 'receipts':
        return { section: 'Operations', subSection: 'Receipts' };
      case 'deliveries':
        return { section: 'Operations', subSection: 'Delivery Orders' };
      case 'transfers':
        return { section: 'Operations', subSection: 'Internal Transfers' };
      case 'adjustments':
        return { section: 'Operations', subSection: 'Inventory Adjustments' };
      case 'movements':
        return { section: 'Operations', subSection: 'Move History' };
      case 'stock-overview':
        return { section: 'Inventory', subSection: 'Stock Overview' };
      case 'stock-by-location':
        return { section: 'Inventory', subSection: 'Stock by Location' };
      case 'stock-ledger':
        return { section: 'Inventory', subSection: 'Stock Ledger' };
      case 'warehouses':
        return { section: 'Warehouses', subSection: 'Warehouses' };
      case 'locations':
        return { section: 'Warehouses', subSection: 'Locations' };
      case 'report-inventory':
        return { section: 'Reports', subSection: 'Inventory Valuation' };
      case 'report-low-stock':
        return { section: 'Reports', subSection: 'Low Stock Critical' };
      case 'report-movements':
        return { section: 'Reports', subSection: 'Movement Flow' };
      case 'report-adjustments':
        return { section: 'Reports', subSection: 'Adjustment Audit' };
      case 'settings':
        return { section: 'Administration', subSection: 'Settings & Audit Logs' };
      default:
        return { section: 'ERP', subSection: view };
    }
  };

  const { section, subSection } = getSectionNames(currentView);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* ERP Hierarchical Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        pendingReceiptsCount={badgeCounters.pendingReceipts}
        pendingDeliveriesCount={badgeCounters.pendingDeliveries}
        lowStockCount={badgeCounters.lowStock}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Contextual Top Bar */}
        <Navbar
          currentSection={section}
          currentSubSection={subSection}
          onRefreshData={updateBadges}
        />

        {/* Viewport Canvas */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          {currentView === 'dashboard' && (
            <DashboardView onNavigate={setCurrentView} onShowToast={showToast} />
          )}

          {currentView === 'products' && (
            <ProductsView onShowToast={showToast} />
          )}

          {currentView === 'categories' && (
            <CategoriesView onShowToast={showToast} />
          )}

          {currentView === 'reorder-rules' && (
            <ReorderingRulesView onShowToast={showToast} onNavigate={setCurrentView} />
          )}

          {currentView === 'receipts' && (
            <ReceiptsView onShowToast={showToast} onNavigate={setCurrentView} />
          )}

          {currentView === 'deliveries' && (
            <DeliveriesView onShowToast={showToast} onNavigate={setCurrentView} />
          )}

          {currentView === 'transfers' && (
            <TransfersView onShowToast={showToast} onNavigate={setCurrentView} />
          )}

          {currentView === 'adjustments' && (
            <AdjustmentsView onShowToast={showToast} onNavigate={setCurrentView} />
          )}

          {currentView === 'movements' && (
            <MoveHistoryView onShowToast={showToast} onNavigate={setCurrentView} />
          )}

          {currentView === 'stock-overview' && (
            <StockOverviewView onShowToast={showToast} onNavigate={setCurrentView} />
          )}

          {currentView === 'stock-by-location' && (
            <StockByLocationView onShowToast={showToast} onNavigate={setCurrentView} />
          )}

          {currentView === 'stock-ledger' && (
            <StockLedgerView onShowToast={showToast} />
          )}

          {(currentView === 'warehouses' || currentView === 'locations') && (
            <WarehousesView onShowToast={showToast} />
          )}

          {currentView.startsWith('report-') && (
            <ReportsView initialReport={currentView} onShowToast={showToast} onNavigate={setCurrentView} />
          )}

          {currentView === 'settings' && (
            <SettingsView onShowToast={showToast} />
          )}
        </main>
      </div>

      {/* Floating System Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
