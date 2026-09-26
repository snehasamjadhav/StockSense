import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { AuthModal } from './AuthModal.tsx';
import { Shield, UserCheck, LogOut, KeyRound, ChevronRight, Boxes } from 'lucide-react';

interface NavbarProps {
  currentSection: string;
  currentSubSection?: string;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentSection, currentSubSection }) => {
  const { user, demoLogin, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'INVENTORY_MANAGER':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'WAREHOUSE_STAFF':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'INVENTORY_MANAGER':
        return 'Inventory Mgr';
      case 'WAREHOUSE_STAFF':
        return 'Warehouse Staff';
      default:
        return 'Guest';
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-30 shrink-0">
      {/* Zone 1: Contextual Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1.5 font-bold tracking-tight text-slate-900">
          <Boxes className="w-5 h-5 text-indigo-600" />
          <span>StockSense</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <span className="font-medium text-slate-600 capitalize">{currentSection.replace('-', ' ')}</span>
        {currentSubSection && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="font-semibold text-slate-900 capitalize">{currentSubSection.replace('-', ' ')}</span>
          </>
        )}
      </div>

      {/* Zone 2: Instant Demo Persona Switcher (For evaluators to test multi-role RBAC in 1 click) */}
      <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
        <span className="text-slate-500 font-medium px-2 flex items-center gap-1">
          <Shield className="w-3.5 h-3.5" />
          <span>Switch Role:</span>
        </span>
        <button
          onClick={() => demoLogin('ADMIN')}
          title="Switch to Elena Rostova (Admin: Full Permissions, Locations, Warehouses)"
          className={`px-2.5 py-1 font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            user?.role === 'ADMIN'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          Admin (Elena)
        </button>
        <button
          onClick={() => demoLogin('INVENTORY_MANAGER')}
          title="Switch to Marcus Vance (Manager: Create Orders, Rules, Adjustments)"
          className={`px-2.5 py-1 font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            user?.role === 'INVENTORY_MANAGER'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          Manager (Marcus)
        </button>
        <button
          onClick={() => demoLogin('WAREHOUSE_STAFF')}
          title="Switch to Devon Reed (Staff: Receive, Pick, Transfer, Count)"
          className={`px-2.5 py-1 font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            user?.role === 'WAREHOUSE_STAFF'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          Staff (Devon)
        </button>
      </div>

      {/* Zone 3: User Profile & Authentication Controls */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right leading-tight">
              <span className="text-xs font-semibold text-slate-900">{user.name}</span>
              <span className="text-[11px] text-slate-500 font-mono">{user.email}</span>
            </div>
            <div className={`px-2 py-0.5 text-[11px] font-semibold rounded border ${getRoleBadgeStyle(user.role)}`}>
              {getRoleLabel(user.role)}
            </div>
            <button
              onClick={logout}
              title="Sign Out / Switch Session"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('register'); setAuthModalOpen(true); }}
              className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Register
            </button>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </header>
  );
};
