import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Boxes, Download, RefreshCw, Search, AlertTriangle, ArrowRight } from 'lucide-react';

interface StockOverviewViewProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigate: (viewId: string) => void;
}

export const StockOverviewView: React.FC<StockOverviewViewProps> = ({ onShowToast, onNavigate }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const data = await api.getStockOverview();
      setItems(data);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch inventory overview', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const filtered = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.category_name.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'LOW_STOCK') return item.status === 'LOW_STOCK';
    if (statusFilter === 'OUT_OF_STOCK') return item.status === 'OUT_OF_STOCK';
    if (statusFilter === 'NORMAL') return item.status === 'NORMAL';
    return true;
  });

  const exportCSV = () => {
    const headers = ['SKU', 'Product Name', 'Category', 'UoM', 'On Hand', 'Incoming', 'Outgoing', 'Forecast', 'Cost Price', 'Valuation', 'Status'];
    const rows = filtered.map(i => [
      `"${i.sku}"`,
      `"${i.name}"`,
      `"${i.category_name}"`,
      `"${i.unit_of_measure}"`,
      i.on_hand,
      i.incoming,
      i.outgoing,
      i.forecast,
      i.cost_price,
      i.valuation.toFixed(2),
      i.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stocksense_inventory_overview_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Exported inventory overview CSV', 'success');
  };

  const totalValuation = filtered.reduce((acc, i) => acc + i.valuation, 0);
  const totalUnits = filtered.reduce((acc, i) => acc + i.on_hand, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock Overview & Availability</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated corporate inventory balance calculated from ledger movements: On-Hand + Incoming - Outgoing = Forecast.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Aggregate Valuation Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Aggregated On-Hand Units</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {totalUnits.toLocaleString()} units
          </div>
          <span className="text-[11px] text-slate-400">across all active warehouses</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Inventory Valuation</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400">standard FIFO acquisition cost</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Filtered SKU Count</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {filtered.length} SKUs
            </div>
            <span className="text-[11px] text-slate-400">ready for picking/intake</span>
          </div>
          <button
            onClick={() => onNavigate('stock-by-location')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View by Bins</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by SKU, product name, or category..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Inventory States</option>
            <option value="NORMAL">Normal / Healthy Stock</option>
            <option value="LOW_STOCK">Low Stock (≤ Reorder)</option>
            <option value="OUT_OF_STOCK">Out of Stock (0 Units)</option>
          </select>

          <button
            onClick={fetchOverview}
            title="Refresh Balances"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stock Overview Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 select-none">
            <tr>
              <th className="py-3 px-4 font-semibold">SKU / Product</th>
              <th className="py-3 px-4 font-semibold">Category</th>
              <th className="py-3 px-4 font-semibold">UoM</th>
              <th className="py-3 px-4 font-semibold text-right">Cost Price</th>
              <th className="py-3 px-4 font-semibold text-right">On-Hand</th>
              <th className="py-3 px-4 font-semibold text-right">Incoming (+)</th>
              <th className="py-3 px-4 font-semibold text-right">Outgoing (-)</th>
              <th className="py-3 px-4 font-semibold text-right">Forecast Available</th>
              <th className="py-3 px-4 font-semibold text-right">Total Valuation</th>
              <th className="py-3 px-4 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
                  Calculating inventory positions...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  No inventory items match filter.
                </td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{item.sku}</div>
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    {item.category_name}
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    {item.unit_of_measure}
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    ${item.cost_price.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold">
                    <span className={item.on_hand === 0 ? 'text-rose-600' : item.on_hand <= item.reorder_level ? 'text-amber-600' : 'text-slate-900'}>
                      {item.on_hand}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums text-blue-600 font-medium">
                    {item.incoming > 0 ? `+${item.incoming}` : '0'}
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500 font-medium">
                    {item.outgoing > 0 ? `-${item.outgoing}` : '0'}
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-800">
                    {item.forecast}
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                    ${item.valuation.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {item.status === 'OUT_OF_STOCK' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Out of Stock
                      </span>
                    ) : item.status === 'LOW_STOCK' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Low Stock (≤{item.reorder_level})
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
