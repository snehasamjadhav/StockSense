import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Tags,
  SlidersHorizontal,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ClipboardCheck,
  ShoppingCart,
  Package,
  BookOpen,
  Building2,
  BarChart3,
  ShieldAlert,
  Settings,
  User,
  LogOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { mockInventoryService } from '../services/mockInventoryService.js';
import { useAuth } from '../context/AuthContext.jsx';

export const Sidebar = ({ onResetData, onShowToast }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser: authUser, logout } = useAuth();
  const navigate = useNavigate();

  const user = authUser || mockInventoryService.getCurrentUser();

  const handleReset = () => {
    if (window.confirm('Reset all demo inventory and documents back to original test state?')) {
      mockInventoryService.resetAllData();
      if (onResetData) onResetData();
      if (onShowToast) onShowToast('StockSense ERP state has been reset to initial baseline', 'info');
    }
  };

  const handleLogout = () => {
    logout();
    if (onShowToast) {
      onShowToast('Signed out of StockSense session', 'info');
    }
    navigate('/', { replace: true });
  };

  const navSection = (title, items) => (
    <div className="mb-4">
      {!collapsed && (
        <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </div>
      )}
      <div className="space-y-0.5">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                } ${collapsed ? 'justify-center px-2' : ''}`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside
      className={`h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-200 z-30 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center text-white font-black text-base shadow-sm">
              S
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                StockSense
                <span className="text-[10px] uppercase font-mono px-1 py-0.2 bg-slate-100 text-slate-600 rounded">
                  ERP
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium leading-none">
                Smart Inventory. Complete Control.
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center text-white font-black text-sm">
            S
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 hidden md:block"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-2 py-3 custom-scrollbar">
        {navSection('DASHBOARD', [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
        ])}

        {navSection('PRODUCTS', [
          { to: '/products', label: 'Products', icon: Boxes },
          { to: '/categories', label: 'Categories', icon: Tags },
          { to: '/reordering', label: 'Reordering Rules', icon: SlidersHorizontal }
        ])}

        {navSection('OPERATIONS', [
          { to: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
          { to: '/receipts', label: 'Receipts', icon: ArrowDownLeft },
          { to: '/deliveries', label: 'Delivery Orders', icon: ArrowUpRight },
          { to: '/transfers', label: 'Internal Transfers', icon: ArrowLeftRight },
          { to: '/adjustments', label: 'Inventory Adjustments', icon: ClipboardCheck }
        ])}

        {navSection('INVENTORY', [
          { to: '/inventory', label: 'Stock Overview', icon: Package },
          { to: '/ledger', label: 'Stock Ledger', icon: BookOpen }
        ])}

        {navSection('WAREHOUSE', [
          { to: '/warehouses', label: 'Warehouses & Locations', icon: Building2 }
        ])}

        {navSection('REPORTS', [
          { to: '/reports', label: 'Inventory Reports', icon: BarChart3 }
        ])}

        {navSection('ADMINISTRATION', [
          { to: '/audit-logs', label: 'Audit Logs', icon: ShieldAlert },
          { to: '/settings', label: 'Settings', icon: Settings }
        ])}
      </div>

      {/* Footer Profile & Logout Controls */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-1">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
              isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-200/60'
            } ${collapsed ? 'justify-center px-1' : ''}`
          }
          title={collapsed ? `${user.name} (${user.role})` : undefined}
        >
          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
            {user.avatar || 'SS'}
          </div>
          {!collapsed && (
            <div className="truncate flex-1">
              <div className="font-semibold text-slate-800 truncate leading-tight">{user.name}</div>
              <div className="text-[10px] text-slate-500 truncate leading-tight">{user.role}</div>
            </div>
          )}
        </NavLink>

        <div className="flex items-center gap-1">
          <button
            onClick={handleLogout}
            className={`flex-1 flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors ${
              collapsed ? 'justify-center px-1' : ''
            }`}
            title="Sign out of StockSense"
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>

          {!collapsed && (
            <button
              onClick={handleReset}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded"
              title="Reset Demo Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
