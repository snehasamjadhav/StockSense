import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Plus,
  PlayCircle,
  Building2,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { mockInventoryService } from '../services/mockInventoryService.js';
import { mockDocumentService } from '../services/mockDocumentService.js';

const CATEGORY_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

export const DashboardView = ({ onShowToast, onOpenScenarioModal }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(mockInventoryService.getDashboardData());

  const refreshData = () => {
    setData(mockInventoryService.getDashboardData());
  };

  useEffect(() => {
    const unsubscribe = mockInventoryService.subscribe(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, []);

  const handleQuickReorder = (productId, productName) => {
    try {
      const prod = mockInventoryService.getProductById(productId);
      const receipt = mockDocumentService.createReceipt({
        supplier: 'Priority Reorder Dispatch',
        warehouseId: 'wh-main',
        destinationLocationId: 'loc-rec',
        productId,
        quantity: prod.reorderQty || 50,
        uom: prod.uom,
        status: 'READY',
        notes: `Automated replenishment PO for ${productName}`
      });
      onShowToast(`Created Inbound Replenishment Receipt ${receipt.reference} for ${productName}`, 'success');
      refreshData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const kpis = data.kpis;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Inventory operations at a glance</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScenarioModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Interactive Demo Scenario</span>
          </button>
          <button
            onClick={refreshData}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top KPI Cards (7 cards as requested) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Total Products in Stock */}
        <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Products</span>
            <Boxes className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-slate-900">{kpis.totalUnits.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{kpis.totalProducts} catalog SKUs</div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="p-3.5 bg-white rounded-lg border border-amber-200 bg-amber-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-amber-900">{kpis.lowStock}</div>
            <div className="text-[10px] text-amber-700 mt-0.5">Below threshold</div>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="p-3.5 bg-white rounded-lg border border-rose-200 bg-rose-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Out of Stock</span>
            <PackageX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-rose-900">{kpis.outOfStock}</div>
            <div className="text-[10px] text-rose-700 mt-0.5">Immediate order</div>
          </div>
        </div>

        {/* Pending Receipts */}
        <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Receipts</span>
            <ArrowDownLeft className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-blue-900">{kpis.pendingReceipts}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Inbound shipments</div>
          </div>
        </div>

        {/* Pending Deliveries */}
        <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Deliv.</span>
            <ArrowUpRight className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-purple-900">{kpis.pendingDeliveries}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Outbound dispatches</div>
          </div>
        </div>

        {/* Scheduled Transfers */}
        <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transfers</span>
            <ArrowLeftRight className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-teal-900">{kpis.scheduledTransfers}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Inter-bay moves</div>
          </div>
        </div>

        {/* Total Inventory Value */}
        <div className="p-3.5 bg-white rounded-lg border border-emerald-200 bg-emerald-50/20 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Inventory Value</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-base font-bold font-mono text-emerald-950 truncate">
              ${kpis.totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Real-time valuation</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Stock Movement Chart */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Stock Movement Flow</h2>
              <p className="text-[11px] text-slate-400">Incoming vs Outgoing vs Adjustments</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span> Inbound</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-purple-400"></span> Outbound</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span> Adjustments</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.movementTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '11px' }}
                />
                <Bar dataKey="incoming" fill="#6366f1" radius={[3, 3, 0, 0]} name="Incoming" />
                <Bar dataKey="outgoing" fill="#c084fc" radius={[3, 3, 0, 0]} name="Outgoing" />
                <Bar dataKey="adjustments" fill="#fbbf24" radius={[3, 3, 0, 0]} name="Adjustments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Stock by Category */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col">
          <div className="mb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Stock by Category</h2>
            <p className="text-[11px] text-slate-400">Distribution of stock valuation</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryBreakdown}
                  dataKey="units"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  innerRadius={35}
                  paddingAngle={2}
                >
                  {data.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name, props) => [`${val} units`, `${props.payload.name}`]}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 space-y-1.5 text-xs">
            {data.categoryBreakdown.map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}></span>
                  <span className="text-[11px]">{cat.name}</span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-slate-800">{cat.units} units</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Warehouse Stock & Critical Stock Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouse Stock distribution */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Warehouse Stock</h2>
              <p className="text-[11px] text-slate-400">Storage capacity & unit levels</p>
            </div>
            <Link to="/warehouses" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5">
              Topology <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {data.warehouseStock.map(wh => (
              <div key={wh.name} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">{wh.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-900">{wh.units} units</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(15, (wh.units / 600) * 100))}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-1 text-[10px] text-slate-500">
                  <span>Valuation: ${wh.value.toLocaleString()}</span>
                  <span>Code: {wh.code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Stock Alert Panel */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Critical Stock Watchlist</h2>
                <p className="text-[11px] text-slate-400">Items at or below safety stock threshold</p>
              </div>
            </div>
            <Link to="/reordering" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              View Reordering Rules
            </Link>
          </div>

          <div className="space-y-2 flex-1">
            {/* Steel Rod */}
            {(() => {
              const steel = mockInventoryService.getProductById('prod-steel');
              return (
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Steel Rod</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {steel?.sku || 'STEEL-001'}
                      </span>
                      {steel?.stock === 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                          OUT OF STOCK
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Current: <strong className="text-slate-800 font-mono">{steel?.stock || 0} KG</strong> | Minimum: <strong className="text-slate-800 font-mono">20 KG</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuickReorder('prod-steel', 'Steel Rod')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Reorder
                  </button>
                </div>
              );
            })()}

            {/* Aluminum Sheet */}
            {(() => {
              const al = mockInventoryService.getProductById('prod-al');
              return (
                <div className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50/20 hover:bg-amber-50/40 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Aluminum Sheet</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        {al?.sku || 'AL-001'}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        LOW STOCK
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Current: <strong className="text-amber-900 font-mono">{al?.stock || 8} KG</strong> | Minimum: <strong className="text-slate-800 font-mono">15 KG</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuickReorder('prod-al', 'Aluminum Sheet')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Reorder
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Recent Operations Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Operations</h2>
            <p className="text-[11px] text-slate-400">Validated business documents & stock ledger entries</p>
          </div>
          <Link to="/ledger" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
            Complete Ledger <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Document</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4">Quantity</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.recentOperations.map(op => {
                let badgeClass = 'bg-slate-100 text-slate-700';
                if (op.type === 'Receipt') badgeClass = 'bg-blue-100 text-blue-800';
                if (op.type === 'Transfer') badgeClass = 'bg-teal-100 text-teal-800';
                if (op.type === 'Delivery') badgeClass = 'bg-purple-100 text-purple-800';
                if (op.type === 'Adjustment') badgeClass = 'bg-amber-100 text-amber-800';

                return (
                  <tr key={`${op.ref}-${op.id}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-indigo-700">{op.ref}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                        {op.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{op.productName}</td>
                    <td className="py-2.5 px-4 font-mono font-semibold">{op.quantity}</td>
                    <td className="py-2.5 px-4 text-slate-600">{op.location}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        op.status === 'DONE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {op.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{op.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
