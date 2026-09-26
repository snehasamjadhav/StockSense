import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { FileSpreadsheet, AlertTriangle, Activity, Scale, Download, RefreshCw, Play } from 'lucide-react';

interface ReportsViewProps {
  initialReport?: string;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigate: (viewId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ initialReport = 'inventory', onShowToast, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'low-stock' | 'movements' | 'adjustments'>(
    initialReport === 'report-low-stock' ? 'low-stock' :
    initialReport === 'report-movements' ? 'movements' :
    initialReport === 'report-adjustments' ? 'adjustments' : 'inventory'
  );

  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [lowStockData, setLowStockData] = useState<any[]>([]);
  const [movementsData, setMovementsData] = useState<any>(null);
  const [adjustmentsData, setAdjustmentsData] = useState<any[]>([]);
  const [orderingId, setOrderingId] = useState<string | null>(null);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'inventory') {
        const data = await api.getInventoryReport();
        setInventoryData(data);
      } else if (activeTab === 'low-stock') {
        const data = await api.getLowStockReport();
        setLowStockData(data);
      } else if (activeTab === 'movements') {
        const data = await api.getMovementsReport();
        setMovementsData(data);
      } else if (activeTab === 'adjustments') {
        const data = await api.getAdjustmentsReport();
        setAdjustmentsData(data);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  const handleOrderReplenishment = async (productId: string, productName: string) => {
    setOrderingId(productId);
    try {
      const res = await api.replenishProduct(productId);
      onShowToast(`Replenishment Receipt ${res.receipt.reference} created for ${productName}`, 'success');
      fetchReportData();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to order replenishment', 'error');
    } finally {
      setOrderingId(null);
    }
  };

  const exportCurrentReportCSV = () => {
    if (activeTab === 'inventory' && inventoryData) {
      const headers = ['SKU', 'Product Name', 'Category', 'UoM', 'On Hand', 'Cost Price', 'Selling Price', 'Inventory Valuation', 'Potential Revenue', 'Margin %', 'Reorder Status'];
      const rows = inventoryData.items.map((i: any) => [
        `"${i.sku}"`, `"${i.name}"`, `"${i.category}"`, `"${i.unit_of_measure}"`, i.on_hand_qty, i.cost_price, i.selling_price, i.inventory_valuation.toFixed(2), i.potential_revenue.toFixed(2), i.margin_pct, i.reorder_status
      ]);
      downloadCSV(headers, rows, 'inventory_valuation_report');
    } else if (activeTab === 'low-stock') {
      const headers = ['SKU', 'Product Name', 'Category', 'On Hand', 'Reorder Level', 'Shortage', 'Reorder Batch', 'Unit Cost', 'Est. Restock Cost', 'Urgency'];
      const rows = lowStockData.map(i => [
        `"${i.sku}"`, `"${i.name}"`, `"${i.category}"`, i.on_hand, i.reorder_level, i.shortage, i.reorder_quantity, i.cost_price, i.estimated_restock_cost.toFixed(2), i.urgency
      ]);
      downloadCSV(headers, rows, 'low_stock_report');
    } else if (activeTab === 'adjustments') {
      const headers = ['Reference', 'Reason', 'Warehouse', 'Location', 'Audited By', 'Net Units Difference', 'Net Value Impact ($)'];
      const rows = adjustmentsData.map(i => [
        `"${i.reference}"`, `"${i.reason}"`, `"${i.warehouse_name}"`, `"${i.location_name}"`, `"${i.created_by_name}"`, i.net_units_difference, i.net_value_difference.toFixed(2)
      ]);
      downloadCSV(headers, rows, 'adjustment_audit_report');
    }
    onShowToast('Exported report CSV', 'success');
  };

  const downloadCSV = (headers: string[], rows: any[], filename: string) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `stocksense_${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise Inventory Reports</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time financial valuation, inventory turn metrics, critical shortages, and physical discrepancy audits.
          </p>
        </div>

        <button
          onClick={exportCurrentReportCSV}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Report CSV</span>
        </button>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 text-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inventory' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Valuation & Health</span>
          </button>

          <button
            onClick={() => setActiveTab('low-stock')}
            className={`pb-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'low-stock' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Low Stock Critical ({lowStockData.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`pb-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'movements' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Movement Flow Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab('adjustments')}
            className={`pb-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'adjustments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Adjustment Discrepancies</span>
          </button>
        </div>

        <button
          onClick={fetchReportData}
          title="Recalculate Report"
          className="pb-2 text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tab 1: Inventory Valuation */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {inventoryData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Total Enterprise Valuation</div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  ${inventoryData.summary.total_valuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Total Physical Units on Record</div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  {inventoryData.summary.total_units.toLocaleString()} units
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Active Monitored SKUs</div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  {inventoryData.summary.total_skus} items
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">SKU / Product</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold text-right">On-Hand</th>
                  <th className="py-3 px-4 font-semibold text-right">Cost Price</th>
                  <th className="py-3 px-4 font-semibold text-right">Selling Price</th>
                  <th className="py-3 px-4 font-semibold text-right">Inventory Valuation</th>
                  <th className="py-3 px-4 font-semibold text-right">Margin %</th>
                  <th className="py-3 px-4 font-semibold text-center">Stock Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryData?.items.map((i: any) => (
                  <tr key={i.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{i.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{i.sku}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{i.category}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {i.on_hand_qty} {i.unit_of_measure}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      ${i.cost_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      ${i.selling_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      ${i.inventory_valuation.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700">
                      {i.margin_pct}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        i.reorder_status === 'HEALTHY'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : i.reorder_status === 'LOW_STOCK'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {i.reorder_status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Low Stock Report */}
      {activeTab === 'low-stock' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 select-none">
              <tr>
                <th className="py-3 px-4 font-semibold">SKU / Item</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-right">On-Hand</th>
                <th className="py-3 px-4 font-semibold text-right">Reorder Threshold</th>
                <th className="py-3 px-4 font-semibold text-right">Deficit Shortage</th>
                <th className="py-3 px-4 font-semibold text-right">Standard Replenish Batch</th>
                <th className="py-3 px-4 font-semibold text-right">Est. Restock Cost</th>
                <th className="py-3 px-4 font-semibold text-center">Urgency</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lowStockData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No items currently in deficit below reorder thresholds.
                  </td>
                </tr>
              ) : (
                lowStockData.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{item.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{item.sku}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.category}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-rose-600">
                      {item.on_hand}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {item.reorder_level}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-amber-700">
                      -{item.shortage}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-indigo-700 font-semibold">
                      +{item.reorder_quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      ${item.estimated_restock_cost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        item.urgency === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.urgency}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOrderReplenishment(item.id, item.name)}
                        disabled={orderingId === item.id}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 ml-auto"
                      >
                        <Play className="w-3 h-3" />
                        <span>{orderingId === item.id ? 'Ordering...' : 'Order PO'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Movements Breakdown */}
      {activeTab === 'movements' && movementsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(movementsData.breakdown_by_type).map(([type, stats]: [string, any]) => (
            <div key={type} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {type.replace('_', ' ')}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {stats.count}
                </span>
                <span className="text-xs text-slate-400">transactions</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Units Displaced:</span>
                <span className="font-mono font-bold">{stats.total_qty.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Total Value:</span>
                <span className="font-mono font-bold">${stats.total_val.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Adjustment Discrepancies */}
      {activeTab === 'adjustments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 select-none">
              <tr>
                <th className="py-3 px-4 font-semibold">Reference</th>
                <th className="py-3 px-4 font-semibold">Reason</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">Auditor</th>
                <th className="py-3 px-4 font-semibold text-right">Net Units Diff</th>
                <th className="py-3 px-4 font-semibold text-right">Financial Impact</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {adjustmentsData.map(adj => (
                <tr key={adj.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{adj.reference}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{adj.reason}</td>
                  <td className="py-3 px-4 text-slate-600">{adj.warehouse_name} · {adj.location_name}</td>
                  <td className="py-3 px-4 text-slate-600">{adj.created_by_name}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold">
                    {adj.net_units_difference > 0 ? (
                      <span className="text-emerald-600">+{adj.net_units_difference}</span>
                    ) : adj.net_units_difference < 0 ? (
                      <span className="text-rose-600">{adj.net_units_difference}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold">
                    ${adj.net_value_difference.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {adj.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
