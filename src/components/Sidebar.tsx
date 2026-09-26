import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Repeat,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Scale,
  History,
  Boxes,
  MapPin,
  Building2,
  FileSpreadsheet,
  AlertTriangle,
  Activity,
  Sliders,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  pendingReceiptsCount?: number;
  pendingDeliveriesCount?: number;
  lowStockCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeAlert?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  pendingReceiptsCount = 0,
  pendingDeliveriesCount = 0,
  lowStockCount = 0
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const navGroups: NavGroup[] = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Products',
      items: [
        { id: 'products', label: 'Products', icon: Package },
        { id: 'categories', label: 'Categories', icon: Layers },
        { id: 'reorder-rules', label: 'Reordering Rules', icon: Repeat }
      ]
    },
    {
      title: 'Operations',
      items: [
        {
          id: 'receipts',
          label: 'Receipts',
          icon: ArrowDownLeft,
          badge: pendingReceiptsCount > 0 ? pendingReceiptsCount : undefined
        },
        {
          id: 'deliveries',
          label: 'Delivery Orders',
          icon: ArrowUpRight,
          badge: pendingDeliveriesCount > 0 ? pendingDeliveriesCount : undefined
        },
        { id: 'transfers', label: 'Internal Transfers', icon: ArrowLeftRight },
        { id: 'adjustments', label: 'Inventory Adjustments', icon: Scale },
        { id: 'movements', label: 'Move History', icon: History }
      ]
    },
    {
      title: 'Inventory',
      items: [
        {
          id: 'stock-overview',
          label: 'Stock Overview',
          icon: Boxes,
          badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
          badgeAlert: lowStockCount > 0
        },
        { id: 'stock-by-location', label: 'Stock by Location', icon: MapPin },
        { id: 'stock-ledger', label: 'Stock Ledger', icon: FileSpreadsheet }
      ]
    },
    {
      title: 'Warehouses',
      items: [
        { id: 'warehouses', label: 'Warehouses', icon: Building2 },
        { id: 'locations', label: 'Locations', icon: MapPin }
      ]
    },
    {
      title: 'Reports',
      items: [
        { id: 'report-inventory', label: 'Inventory Valuation', icon: FileSpreadsheet },
        { id: 'report-low-stock', label: 'Low Stock Report', icon: AlertTriangle },
        { id: 'report-movements', label: 'Movement Flow', icon: Activity },
        { id: 'report-adjustments', label: 'Adjustment Audit', icon: Scale }
      ]
    },
    ...(isAdmin ? [{
      title: 'Administration',
      items: [
        { id: 'settings', label: 'Settings & Audit Logs', icon: ShieldCheck }
      ]
    }] : [])
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 h-screen select-none">
      {/* Brand Header */}
      <div className="h-14 px-5 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs font-bold text-sm tracking-wider">
          SS
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-white tracking-tight">StockSense</span>
            <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-800 text-indigo-400 rounded">ERP</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-none">Enterprise Inventory</p>
        </div>
      </div>

      {/* Navigation Links Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              {group.title}
            </div>
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full shrink-0 font-medium ${
                        isActive
                          ? 'bg-indigo-800 text-indigo-100'
                          : item.badgeAlert
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[11px] font-medium">Stock Accounting</span>
          <span className="text-[10px] font-mono text-emerald-400">Ledger Verified</span>
        </div>
        <div className="text-[11px] text-slate-400 truncate">
          {user ? `${user.name} (${user.role})` : 'Guest Session'}
        </div>
      </div>
    </aside>
  );
};
