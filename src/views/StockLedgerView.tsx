import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { StockLedgerEntry, Product, Warehouse } from '../types.ts';
import { FileSpreadsheet, Download, RefreshCw, Filter, ArrowDownLeft, ArrowUpRight, ShieldCheck, Search } from 'lucide-react';

interface StockLedgerViewProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const StockLedgerView: React.FC<StockLedgerViewProps> = ({ onShowToast }) => {
  const [ledger, setLedger] = useState<StockLedgerEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [search, setSearch] = useState('');

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const [ledgerData, prodsData, whData] = await Promise.all([
        api.getStockLedger({
          product_id: selectedProduct !== 'all' ? selectedProduct : undefined,
          warehouse_id: selectedWarehouse !== 'all' ? selectedWarehouse : undefined,
          type: selectedType !== 'all' ? selectedType : undefined
        }),
        api.getProducts(),
        api.getWarehouses()
      ]);
      setLedger(ledgerData);
      setProducts(prodsData);
      setWarehouses(whData);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch stock ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [selectedProduct, selectedWarehouse, selectedType]);

  const filtered = ledger.filter(entry => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      entry.reference.toLowerCase().includes(term) ||
      (entry.product_name && entry.product_name.toLowerCase().includes(term)) ||
      (entry.product_sku && entry.product_sku.toLowerCase().includes(term)) ||
      (entry.location_name && entry.location_name.toLowerCase().includes(term)) ||
      (entry.notes && entry.notes.toLowerCase().includes(term))
    );
  });

  const exportCSV = () => {
    const headers = ['Date', 'Reference', 'Type', 'Product SKU', 'Product Name', 'Warehouse', 'Location', 'Quantity', 'Balance Before', 'Balance After', 'Unit Cost', 'Total Value', 'Notes'];
    const rows = filtered.map(e => [
      `"${new Date(e.date).toISOString()}"`,
      `"${e.reference}"`,
      e.type,
      `"${e.product_sku}"`,
      `"${e.product_name}"`,
      `"${e.warehouse_name}"`,
      `"${e.location_name}"`,
      e.quantity,
      e.balance_before,
      e.balance_after,
      e.unit_cost,
      (e.total_value ?? (e.quantity * e.unit_cost)).toFixed(2),
      `"${e.notes.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stocksense_stock_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Exported official stock ledger CSV', 'success');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Centralized Stock Ledger (Double-Entry Audit)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable physical stock ledger recording every validated credit (+IN) and debit (-OUT) with running balance integrity.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Ledger Security & Invariant Note */}
      <div className="p-4 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-semibold text-slate-100">Cryptographically & Mathematically Verified Inventory Book</div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              Every row maps directly to an approved business document. Direct mutation without a source document is architecturally prohibited.
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-right">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Entries Logged</div>
            <div className="font-mono text-base font-bold text-emerald-400">{filtered.length} Records</div>
          </div>
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
            placeholder="Search ledger by document reference, SKU, notes, location..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Movements (IN & OUT)</option>
            <option value="IN">+IN (Credit / Intake)</option>
            <option value="OUT">-OUT (Debit / Dispatch)</option>
          </select>

          <select
            value={selectedWarehouse}
            onChange={e => setSelectedWarehouse(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <select
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All SKUs</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.sku}</option>
            ))}
          </select>

          <button
            onClick={fetchLedger}
            title="Refresh Ledger"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stock Ledger Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 select-none">
            <tr>
              <th className="py-3 px-4 font-semibold">Date & Time</th>
              <th className="py-3 px-4 font-semibold">Reference Document</th>
              <th className="py-3 px-4 font-semibold text-center">Type</th>
              <th className="py-3 px-4 font-semibold">SKU / Item</th>
              <th className="py-3 px-4 font-semibold">Location / Bin</th>
              <th className="py-3 px-4 font-semibold text-right">Debit / Credit</th>
              <th className="py-3 px-4 font-semibold text-right">Bal. Before</th>
              <th className="py-3 px-4 font-semibold text-right">Bal. After</th>
              <th className="py-3 px-4 font-semibold text-right">Unit Cost</th>
              <th className="py-3 px-4 font-semibold">Notes / Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
                  Loading immutable ledger entries...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  No ledger transactions found matching filter.
                </td>
              </tr>
            ) : (
              filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(entry.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {entry.reference}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {entry.type === 'IN' ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ArrowDownLeft className="w-3 h-3" />
                        +IN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <ArrowUpRight className="w-3 h-3" />
                        -OUT
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{entry.product_name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{entry.product_sku}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="text-slate-800 font-medium">{entry.location_name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{entry.warehouse_name}</div>
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold">
                    <span className={entry.type === 'IN' ? 'text-emerald-700' : 'text-rose-700'}>
                      {entry.type === 'IN' ? `+${entry.quantity}` : `-${entry.quantity}`} {entry.unit_of_measure}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                    {entry.balance_before}
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                    {entry.balance_after}
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    ${entry.unit_cost.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={entry.notes}>
                    {entry.notes}
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
