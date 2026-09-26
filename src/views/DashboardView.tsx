import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { DashboardStats, Warehouse, ProductCategory } from '../types.ts';
import {
  Boxes,
  AlertTriangle,
  PackageX,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Building2,
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (viewId: string) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onShowToast }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [replenishingId, setReplenishingId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, whData, catData] = await Promise.all([
        api.getDashboardStats({
          warehouse_id: selectedWarehouse !== 'all' ? selectedWarehouse : undefined,
          category_id: selectedCategory !== 'all' ? selectedCategory : undefined
        }),
        api.getWarehouses(),
        api.getCategories()
      ]);
      setStats(statsData);
      setWarehouses(whData);
      setCategories(catData);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedWarehouse, selectedCategory]);

  const handleReplenish = async (productId: string, productName: string) => {
    setReplenishingId(productId);
    try {
      const res = await api.replenishProduct(productId);
      onShowToast(`Created Replenishment Receipt ${res.receipt.reference} for ${productName}`, 'success');
      fetchDashboardData();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to generate replenishment receipt', 'error');
    } finally {
      setReplenishingId(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2 text-slate-500 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <span>Calculating real-time stock balances & ledger invariants...</span>
        </div>
      </div>
    );
  }

  const kpis = stats?.kpis || {
    total_products_in_stock: 0,
    low_stock_items: 0,
    out_of_stock_items: 0,
    pending_receipts: 0,
    pending_deliveries: 0,
    scheduled_transfers: 0,
    total_inventory_valuation: 0,
    incoming_units_total: 0,
    outgoing_units_total: 0
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Contextual Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">StockSense ERP Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time double-entry inventory ledger, document state machines, and warehouse topology.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Warehouse filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs shadow-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedWarehouse}
              onChange={e => setSelectedWarehouse(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs shadow-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchDashboardData}
            title="Refresh Ledger Computations"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total In Stock */}
        <div
          onClick={() => onNavigate('stock-overview')}
          className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">In Stock SKUs</span>
            <Boxes className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {kpis.total_products_in_stock}
          </div>
          <span className="text-[11px] text-slate-400">active products</span>
        </div>

        {/* Low Stock Items */}
        <div
          onClick={() => onNavigate('report-low-stock')}
          className={`p-3.5 rounded-lg border shadow-xs transition-colors cursor-pointer ${
            kpis.low_stock_items > 0
              ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-medium">Low Stock Items</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-900">
            {kpis.low_stock_items}
          </div>
          <span className="text-[11px] text-amber-600 font-medium">≤ Reorder Point</span>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => onNavigate('stock-overview')}
          className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Out of Stock</span>
            <PackageX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {kpis.out_of_stock_items}
          </div>
          <span className="text-[11px] text-rose-600 font-medium">0 Units on-hand</span>
        </div>

        {/* Pending Receipts */}
        <div
          onClick={() => onNavigate('receipts')}
          className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Inbound Receipts</span>
            <ArrowDownLeft className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {kpis.pending_receipts}
          </div>
          <span className="text-[11px] text-blue-600 font-medium">Awaiting Intake</span>
        </div>

        {/* Pending Deliveries */}
        <div
          onClick={() => onNavigate('deliveries')}
          className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Pending Delivery</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {kpis.pending_deliveries}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Pick & Ship queue</span>
        </div>

        {/* Scheduled Transfers */}
        <div
          onClick={() => onNavigate('transfers')}
          className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Transfers</span>
            <ArrowLeftRight className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {kpis.scheduled_transfers}
          </div>
          <span className="text-[11px] text-purple-600 font-medium">Internal routes</span>
        </div>
      </div>

      {/* Financial Valuation Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Enterprise Inventory Valuation (FIFO Standard Cost)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-white mt-0.5">
              ${kpis.total_inventory_valuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6">
          <div>
            <div className="text-slate-400">Cumulative Intake</div>
            <div className="font-mono tabular-nums font-semibold text-emerald-400">
              +{kpis.incoming_units_total.toLocaleString()} units
            </div>
          </div>
          <div>
            <div className="text-slate-400">Cumulative Dispatch</div>
            <div className="font-mono tabular-nums font-semibold text-sky-400">
              -{kpis.outgoing_units_total.toLocaleString()} units
            </div>
          </div>
          <button
            onClick={() => onNavigate('stock-ledger')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>View Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Middle Row: Low Stock Action Center & Warehouse Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Low Stock Alert Card (2 cols on large screen) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">Critical Low Stock & Reordering Engine</h2>
            </div>
            <button
              onClick={() => onNavigate('report-low-stock')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>View full report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">SKU / Product</th>
                  <th className="py-2.5 px-4 font-semibold">Category</th>
                  <th className="py-2.5 px-4 font-semibold text-right">On-Hand</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Reorder Point</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Shortage</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.low_stock_list && stats.low_stock_list.length > 0 ? (
                  stats.low_stock_list.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div>{item.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{item.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.category}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-rose-600">
                        {item.on_hand}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        {item.reorder_level}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-700">
                        -{item.shortage}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleReplenish(item.id, item.name)}
                          disabled={replenishingId === item.id}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {replenishingId === item.id ? 'Ordering...' : '+ Reorder'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      All products currently meet or exceed their reorder inventory thresholds.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Warehouse Utilization Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900">Warehouse Utilization</h2>
            </div>
            <button
              onClick={() => onNavigate('stock-by-location')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Locations
            </button>
          </div>

          <div className="space-y-3">
            {stats?.warehouse_utilization.map(wh => (
              <div key={wh.warehouse_id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-900">{wh.warehouse_name}</span>
                  <span className="font-mono text-slate-500">{wh.warehouse_code}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                  <span>{wh.location_count} Internal Bins/Racks</span>
                  <span className="font-mono font-medium text-slate-800">
                    ${wh.total_valuation.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, Math.max(15, (wh.total_units / 2000) * 100))}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-[10px] text-slate-500 font-mono">
                  {wh.total_units.toLocaleString()} units on-hand
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Business Documents Activity */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Recent Enterprise Inventory Operations</h2>
          </div>
          <span className="text-xs text-slate-400">Live transaction stream</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {stats?.recent_operations && stats.recent_operations.length > 0 ? (
            stats.recent_operations.map(op => {
              const getBadge = (status: string) => {
                switch (status) {
                  case 'DONE':
                    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  case 'READY':
                    return 'bg-blue-100 text-blue-800 border-blue-200';
                  case 'DRAFT':
                    return 'bg-slate-100 text-slate-700 border-slate-200';
                  default:
                    return 'bg-amber-100 text-amber-800 border-amber-200';
                }
              };

              return (
                <div key={op.id} className="p-3.5 px-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-800 px-2 py-0.5 bg-slate-100 rounded">
                      {op.reference}
                    </span>
                    <span className="text-slate-600 font-medium">
                      {op.doc_type.replace('_', ' ')}: {op.partner}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-slate-500 tabular-nums">
                      {op.total_items} items
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getBadge(op.status)}`}>
                      {op.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(op.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center text-slate-400">No operational transactions logged yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};
