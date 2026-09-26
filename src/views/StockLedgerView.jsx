import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Search, Filter } from 'lucide-react';
import { mockInventoryService } from '../services/mockInventoryService.js';

export const StockLedgerView = ({ onShowToast }) => {
  const [ledger, setLedger] = useState([]);
  const [docTypeFilter, setDocTypeFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [search, setSearch] = useState('');

  const products = mockInventoryService.getProducts();

  const loadData = () => {
    setLedger(mockInventoryService.getLedger({
      docType: docTypeFilter,
      productId: productFilter,
      search
    }));
  };

  useEffect(() => {
    loadData();
    const unsub = mockInventoryService.subscribe(() => loadData());
    return () => unsub();
  }, [docTypeFilter, productFilter, search]);

  const handleExportCSV = () => {
    if (ledger.length === 0) {
      if (onShowToast) onShowToast('No ledger records to export', 'error');
      return;
    }

    const headers = ['Date', 'Document', 'Product', 'Source', 'Destination', 'Movement', 'Quantity', 'Before', 'After', 'Operator'];
    const rows = ledger.map(l => [
      `"${l.date}"`,
      `"${l.documentRef}"`,
      `"${l.productName}"`,
      `"${l.source}"`,
      `"${l.destination}"`,
      `"${l.docType}"`,
      `"${l.quantityChange}"`,
      l.beforeQty,
      l.afterQty,
      `"${l.operator}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `stocksense_ledger_export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) onShowToast('Stock ledger exported successfully to CSV', 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Stock Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">Immutable double-entry inventory ledger with before/after balance auditing</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search document ref, product, operator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent border-none focus:outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none"
          >
            <option value="all">All Movements</option>
            <option value="RECEIPT">RECEIPT</option>
            <option value="DELIVERY">DELIVERY</option>
            <option value="TRANSFER">TRANSFER</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
          </select>

          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none"
          >
            <option value="all">All Products</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Date & Time</th>
                <th className="py-2.5 px-4">Document</th>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4">Source</th>
                <th className="py-2.5 px-4">Destination</th>
                <th className="py-2.5 px-4">Movement</th>
                <th className="py-2.5 px-4">Quantity</th>
                <th className="py-2.5 px-4 font-mono">Before</th>
                <th className="py-2.5 px-4 font-mono">After</th>
                <th className="py-2.5 px-4">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {ledger.map(entry => {
                let badgeClass = 'bg-slate-100 text-slate-700';
                if (entry.docType === 'RECEIPT') badgeClass = 'bg-blue-100 text-blue-800';
                if (entry.docType === 'DELIVERY') badgeClass = 'bg-purple-100 text-purple-800';
                if (entry.docType === 'TRANSFER') badgeClass = 'bg-teal-100 text-teal-800';
                if (entry.docType === 'ADJUSTMENT') badgeClass = 'bg-amber-100 text-amber-800';

                return (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{entry.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{entry.documentRef}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{entry.productName}</td>
                    <td className="py-3 px-4 text-slate-600">{entry.source}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{entry.destination}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                        {entry.docType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{entry.quantityChange}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{entry.beforeQty}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{entry.afterQty}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{entry.operator}</td>
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
