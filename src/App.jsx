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

// Authenticated ERP Shell Layout
const ErpShell = ({ children, onShowToast, onOpenScenarioModal }) => {
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
function MainAppRoutes({ toasts, showToast, dismissToast, isScenarioModalOpen, setIsScenarioModalOpen }) {
  const { isAuthenticated } = useAuth();

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
          element={
            <ProtectedRoute>
              <ErpShell
                onShowToast={showToast}
                onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
              >
                <DashboardView
                  onShowToast={showToast}
                  onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
                />
              </ErpShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ErpShell onShowToast={showToast} onOpenScenarioModal={() => setIsScenarioModalOpen(true)}>
                <ProductsView onShowToast={showToast} />
              </ErpShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <ErpShell onShowToast={showToast} onOpenScenarioModal={() => setIsScenarioModalOpen(true)}>
                <CategoriesView onShowToast={showToast} />
              </ErpShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/receipts"
          element={
            <ProtectedRoute>
              <ErpShell onShowToast={showToast} onOpenScenarioModal={() => setIsScenarioModalOpen(true)}>
                <ReceiptsView onShowToast={showToast} />
              </ErpShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/deliveries"
          element={
            <ProtectedRoute>
              <ErpShell onShowToast={showToast} onOpenScenarioModal={() => setIsScenarioModalOpen(true)}>
                <DeliveriesView onShowToast={showToast} />
              </ErpShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/transfers"
          element={
            <ProtectedRoute>
              <ErpShell onShowToast={showToast} onOpenScenarioModal={() => setIsScenarioModalOpen(true)}>
                <TransfersView onShowToast={showToast} />
              </ErpShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/adjustments"
          element={
            <ProtectedRoute>
              <ErpShell onShowToast={showToast} onOpenScenarioModal={() => setIsScenarioModalOpen(true)}>
                <AdjustmentsView onShowToast={showToast} />
              </ErpShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <ErpShell onShowToast={showToast} onOpenScenarioModal={() => setIsScenarioModalOpen(true)}>
                <InventoryView onShowToast={showToast} />
              </ErpShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ledger"
          element={
            <ProtectedRoute>
              <ErpShell onShowToast={showToast} onOpenScenarioModal={() => setIsScenarioModalOpen(true)}>
                <StockLedgerView onShowToast={showToast} />
              </ErpShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/warehouses"
          element={
            <ProtectedRoute>
              <ErpShell onShowToast={showToast} onOpenScenarioModal={() => setIsScenarioModalOpen(true)}>
                <WarehousesView onShowToast={showToast} />
              </ErpShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reordering"
          element={
            <ProtectedRoute>
              <ErpShell onShowToast={showToast} onOpenScenarioModal={() => setIsScenarioModalOpen(true)}>
                <ReorderingView onShowToast={showToast} />
              </ErpShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ErpShell onShowToast={showToast} onOpenScenarioModal={() => setIsScenarioModalOpen(true)}>
                <ReportsView onShowToast={showToast} />
              </ErpShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <ErpShell onShowToast={showToast} onOpenScenarioModal={() => setIsScenarioModalOpen(true)}>
                <AuditLogsView onShowToast={showToast} />
              </ErpShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <ErpShell onShowToast={showToast} onOpenScenarioModal={() => setIsScenarioModalOpen(true)}>
                <SettingsView onShowToast={showToast} />
              </ErpShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ErpShell onShowToast={showToast} onOpenScenarioModal={() => setIsScenarioModalOpen(true)}>
                <ProfileView onShowToast={showToast} />
              </ErpShell>
            </ProtectedRoute>
          }
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

      {/* Floating System Notification Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

export default function App() {
  const [toasts, setToasts] = useState([]);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);

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
      />
    </AuthProvider>
  );
}
