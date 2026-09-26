import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Search, Filter, Printer } from 'lucide-react';
import { mockInventoryService } from '../services/mockInventoryService.js';
import { exportToCSV } from '../utils/exportUtils.js';
import { DocumentPrintModal } from '../components/DocumentPrintModal.jsx';

export const StockLedgerView = ({ onShowToast }) => {
  const [ledger, setLedger] = useState([]);
  const [docTypeFilter, setDocTypeFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [tableDensity, setTableDensity] = useState('comfortable');
  const [printDoc, setPrintDoc] = useState(null);

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

    const columns = [
      { key: 'date', label: 'Timestamp' },
      { key: 'documentRef', label: 'Document Ref' },
      { key: 'docType', label: 'Movement Type' },
      { key: 'productName', label: 'Product' },
      { key: 'source', label: 'Source' },
      { key: 'destination', label: 'Destination' },
      { key: 'quantityChange', label: 'Delta' },
      { key: 'beforeQty', label: 'Balance Before' },
      { key: 'afterQty', label: 'Balance After' },
      { key: 'operator', label: 'Auditor / Operator' }
    ];
    exportToCSV('Stock_Ledger', columns, ledger);
    if (onShowToast) onShowToast('Stock ledger exported successfully to CSV', 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Stock Ledger</h1>
            <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Double-Entry Accounting Invariant
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable document-driven stock movement timeline with verified before & after balance states
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
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

          <div className="flex items-center border border-slate-200 rounded p-0.5 text-[11px] text-slate-600 ml-2">
            <button
              onClick={() => setTableDensity('comfortable')}
              className={`px-2 py-0.5 rounded ${tableDensity === 'comfortable' ? 'bg-slate-200 font-semibold text-slate-900' : 'hover:bg-slate-100'}`}
            >
              Comfortable
            </button>
            <button
              onClick={() => setTableDensity('compact')}
              className={`px-2 py-0.5 rounded ${tableDensity === 'compact' ? 'bg-slate-200 font-semibold text-slate-900' : 'hover:bg-slate-100'}`}
            >
              Compact
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
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
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {ledger.map(entry => {
                let badgeClass = 'text-slate-600 border-slate-200';
                if (entry.docType === 'RECEIPT') badgeClass = 'text-blue-700 border-blue-200 bg-blue-50/50';
                if (entry.docType === 'DELIVERY') badgeClass = 'text-purple-700 border-purple-200 bg-purple-50/50';
                if (entry.docType === 'TRANSFER') badgeClass = 'text-teal-700 border-teal-200 bg-teal-50/50';
                if (entry.docType === 'ADJUSTMENT') badgeClass = 'text-amber-700 border-amber-200 bg-amber-50/50';

                const rowPadding = tableDensity === 'compact' ? 'py-1.5' : 'py-3';

                return (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className={`${rowPadding} px-4 font-mono text-[11px] text-slate-500 tabular-nums`}>{entry.date}</td>
                    <td className={`${rowPadding} px-4 font-mono font-bold text-indigo-700`}>{entry.documentRef}</td>
                    <td className={`${rowPadding} px-4 font-semibold text-slate-900`}>{entry.productName}</td>
                    <td className={`${rowPadding} px-4 text-slate-600`}>{entry.source}</td>
                    <td className={`${rowPadding} px-4 text-slate-600 font-medium`}>{entry.destination}</td>
                    <td className={`${rowPadding} px-4`}>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                        {entry.docType}
                      </span>
                    </td>
                    <td className={`${rowPadding} px-4 font-mono font-bold text-slate-900 tabular-nums`}>{entry.quantityChange}</td>
                    <td className={`${rowPadding} px-4 font-mono text-slate-500 tabular-nums`}>{entry.beforeQty}</td>
                    <td className={`${rowPadding} px-4 font-mono font-bold text-indigo-700 tabular-nums`}>{entry.afterQty}</td>
                    <td className={`${rowPadding} px-4 text-slate-600 font-medium`}>{entry.operator}</td>
                    <td className={`${rowPadding} px-4 text-right`}>
                      <button
                        onClick={() => {
                          setPrintDoc({
                            reference: entry.documentRef,
                            productName: entry.productName,
                            productId: entry.productId,
                            sourceLocationName: entry.source,
                            destinationName: entry.destination,
                            quantity: entry.quantityChange,
                            date: entry.date,
                            operator: entry.operator,
                            status: 'POSTED_TO_LEDGER'
                          });
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
                        title="Print Voucher"
                      >
                        <Printer className="w-3 h-3 inline mr-1" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Document Modal */}
      {printDoc && (
        <DocumentPrintModal
          isOpen={Boolean(printDoc)}
          onClose={() => setPrintDoc(null)}
          document={printDoc}
          docType="LEDGER"
        />
      )}
    </div>
  );
};
