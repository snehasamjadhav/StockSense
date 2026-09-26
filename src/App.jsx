import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

// Auth Pages
import { Login } from './pages/Login.jsx';
import { Signup } from './pages/Signup.jsx';
import { ForgotPassword } from './pages/ForgotPassword.jsx';

// Layout Components
import { Sidebar } from './components/Sidebar.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Toast } from './components/Toast.jsx';
import { ScenarioModal } from './components/ScenarioModal.jsx';

// ERP Protected Views
import { DashboardView } from './views/DashboardView.jsx';
import { ProductsView } from './views/ProductsView.jsx';
import { CategoriesView } from './views/CategoriesView.jsx';
import { PurchaseOrdersView } from './views/PurchaseOrdersView.jsx';
import { ReceiptsView } from './views/ReceiptsView.jsx';
import { DeliveriesView } from './views/DeliveriesView.jsx';
import { TransfersView } from './views/TransfersView.jsx';
import { AdjustmentsView } from './views/AdjustmentsView.jsx';
import { InventoryView } from './views/InventoryView.jsx';
import { StockLedgerView } from './views/StockLedgerView.jsx';
import { WarehousesView } from './views/WarehousesView.jsx';
import { ReorderingView } from './views/ReorderingView.jsx';
import { ReportsView } from './views/ReportsView.jsx';
import { AuditLogsView } from './views/AuditLogsView.jsx';
import { SettingsView } from './views/SettingsView.jsx';
import { ProfileView } from './views/ProfileView.jsx';
import { BarcodeScannerModal } from './components/BarcodeScannerModal.jsx';

// Authenticated ERP Shell Layout
const ErpShell = ({ children, onShowToast, onOpenScenarioModal, onOpenScanner }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        onResetData={() => onShowToast('StockSense ERP state reset to initial baseline', 'info')}
        onShowToast={onShowToast}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onOpenScenarioModal={onOpenScenarioModal}
          onOpenScanner={onOpenScanner}
          onShowToast={onShowToast}
        />

        {/* Viewport Outlet */}
        <main className="flex-1 overflow-y-auto bg-slate-50/70 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

// Main App Router Component
function MainAppRoutes({
  toasts,
  showToast,
  dismissToast,
  isScenarioModalOpen,
  setIsScenarioModalOpen,
  isScannerOpen,
  setIsScannerOpen
}) {
  const { isAuthenticated } = useAuth();

  const wrapWithShell = (view) => (
    <ProtectedRoute>
      <ErpShell
        onShowToast={showToast}
        onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
      >
        {view}
      </ErpShell>
    </ProtectedRoute>
  );

  return (
    <>
      <Routes>
        {/* Public Authentication Routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onShowToast={showToast} />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onShowToast={showToast} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Signup onShowToast={showToast} />
            )
          }
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword onShowToast={showToast} />}
        />

        {/* Protected ERP Dashboard & Modules */}
        <Route
          path="/dashboard"
          element={wrapWithShell(
            <DashboardView
              onShowToast={showToast}
              onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
            />
          )}
        />

        <Route
          path="/products"
          element={wrapWithShell(<ProductsView onShowToast={showToast} />)}
        />

        <Route
          path="/categories"
          element={wrapWithShell(<CategoriesView onShowToast={showToast} />)}
        />

        <Route
          path="/purchase-orders"
          element={wrapWithShell(<PurchaseOrdersView onShowToast={showToast} />)}
        />

        <Route
          path="/receipts"
          element={wrapWithShell(<ReceiptsView onShowToast={showToast} />)}
        />

        <Route
          path="/deliveries"
          element={wrapWithShell(<DeliveriesView onShowToast={showToast} />)}
        />

        <Route
          path="/transfers"
          element={wrapWithShell(<TransfersView onShowToast={showToast} />)}
        />

        <Route
          path="/adjustments"
          element={wrapWithShell(<AdjustmentsView onShowToast={showToast} />)}
        />

        <Route
          path="/inventory"
          element={wrapWithShell(<InventoryView onShowToast={showToast} />)}
        />

        <Route
          path="/ledger"
          element={wrapWithShell(<StockLedgerView onShowToast={showToast} />)}
        />

        <Route
          path="/warehouses"
          element={wrapWithShell(<WarehousesView onShowToast={showToast} />)}
        />

        <Route
          path="/reordering"
          element={wrapWithShell(<ReorderingView onShowToast={showToast} />)}
        />

        <Route
          path="/reports"
          element={wrapWithShell(<ReportsView onShowToast={showToast} />)}
        />

        <Route
          path="/audit-logs"
          element={wrapWithShell(<AuditLogsView onShowToast={showToast} />)}
        />

        <Route
          path="/settings"
          element={wrapWithShell(<SettingsView onShowToast={showToast} />)}
        />

        <Route
          path="/profile"
          element={wrapWithShell(<ProfileView onShowToast={showToast} />)}
        />

        {/* Fallback Catch-all: Unauthenticated -> Login (/), Authenticated -> Dashboard */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />}
        />
      </Routes>

      {/* Interactive Scenario Engine Modal */}
      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Optical Barcode & QR Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onShowToast={showToast}
      />

      {/* Floating System Notification Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

export default function App() {
  const [toasts, setToasts] = useState([]);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const showToast = (message, type = 'info', details = '') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast = { id, message, type, details };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <AuthProvider>
      <MainAppRoutes
        toasts={toasts}
        showToast={showToast}
        dismissToast={dismissToast}
        isScenarioModalOpen={isScenarioModalOpen}
        setIsScenarioModalOpen={setIsScenarioModalOpen}
        isScannerOpen={isScannerOpen}
        setIsScannerOpen={setIsScannerOpen}
      />
    </AuthProvider>
  );
}
