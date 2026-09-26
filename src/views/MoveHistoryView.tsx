import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { StockMovement, Product } from '../types.ts';
import { History, RefreshCw, Filter, ArrowRight, UserCheck, Search } from 'lucide-react';

interface MoveHistoryViewProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigate: (viewId: string) => void;
}

export const MoveHistoryView: React.FC<MoveHistoryViewProps> = ({ onShowToast, onNavigate }) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedDocType, setSelectedDocType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const [movesData, prodsData] = await Promise.all([
        api.getMovements({
          product_id: selectedProduct !== 'all' ? selectedProduct : undefined,
          doc_type: selectedDocType !== 'all' ? selectedDocType : undefined
        }),
        api.getProducts()
      ]);
      setMovements(movesData);
      setProducts(prodsData);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch movements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [selectedProduct, selectedDocType]);

  const filtered = movements.filter(m => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.reference_doc_number.toLowerCase().includes(term) ||
      (m.product_name && m.product_name.toLowerCase().includes(term)) ||
      (m.product_sku && m.product_sku.toLowerCase().includes(term)) ||
      m.user_name.toLowerCase().includes(term)
    );
  });

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case 'RECEIPT':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DELIVERY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INTERNAL_TRANSFER':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ADJUSTMENT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'OPENING_STOCK':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock Move History (Physical Audit Trail)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Traceable log of all historical inventory displacements across warehouse bays, vendor docks, and customer shipments.
          </p>
        </div>

        <button
          onClick={() => onNavigate('stock-ledger')}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>Open Financial Stock Ledger</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search movements by doc reference, product SKU, operator name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedDocType}
            onChange={e => setSelectedDocType(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Document Types</option>
            <option value="RECEIPT">Receipt (Incoming)</option>
            <option value="DELIVERY">Delivery Order (Outgoing)</option>
            <option value="INTERNAL_TRANSFER">Internal Transfer</option>
            <option value="ADJUSTMENT">Inventory Adjustment</option>
            <option value="OPENING_STOCK">Opening Initialization</option>
          </select>

          <select
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Products</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
            ))}
          </select>

          <button
            onClick={fetchMovements}
            title="Refresh Movement Stream"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 select-none">
            <tr>
              <th className="py-3 px-4 font-semibold">Date & Time</th>
              <th className="py-3 px-4 font-semibold">Document Reference</th>
              <th className="py-3 px-4 font-semibold">Type</th>
              <th className="py-3 px-4 font-semibold">Product SKU</th>
              <th className="py-3 px-4 font-semibold">Source Location</th>
              <th className="py-3 px-4 font-semibold">Destination Location</th>
              <th className="py-3 px-4 font-semibold text-right">Quantity</th>
              <th className="py-3 px-4 font-semibold text-right">Total Value</th>
              <th className="py-3 px-4 font-semibold">Validated By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
                  Loading stock movements...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  No stock movements found matching filter.
                </td>
              </tr>
            ) : (
              filtered.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(m.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {m.reference_doc_number}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getDocTypeBadge(m.reference_doc_type)}`}>
                      {m.reference_doc_type.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{m.product_name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{m.product_sku}</div>
                  </td>

                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    {m.source_location_name}
                  </td>

                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    {m.destination_location_name}
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                    {m.quantity} {m.unit_of_measure}
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    ${m.total_value.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{m.user_name}</span>
                    </div>
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
