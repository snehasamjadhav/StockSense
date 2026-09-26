import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { InternalTransfer, Product, Warehouse, Location } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ArrowLeftRight,
  Plus,
  CheckCircle2,
  RefreshCw,
  Eye,
  X,
  Trash2,
  Boxes,
  MapPin,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface TransfersViewProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigate: (viewId: string) => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({ onShowToast, onNavigate }) => {
  const { hasRole } = useAuth();
  const canOperate = hasRole(['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF']);

  const [transfers, setTransfers] = useState<InternalTransfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [destWarehouseId, setDestWarehouseId] = useState('');
  const [destLocationId, setDestLocationId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Array<{ product_id: string; demanded_qty: number }>>([]);

  // Detail Modal
  const [selectedTransfer, setSelectedTransfer] = useState<InternalTransfer | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const [trnData, prodData, whData, locData] = await Promise.all([
        api.getTransfers({ status: statusFilter !== 'all' ? statusFilter : undefined }),
        api.getProducts(),
        api.getWarehouses(),
        api.getLocations({ type: 'internal' })
      ]);
      setTransfers(trnData);
      setProducts(prodData);
      setWarehouses(whData);
      setLocations(locData);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch transfers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [statusFilter]);

  const openCreateModal = () => {
    const wh1 = warehouses[0]?.id || '';
    const wh2 = warehouses[1]?.id || wh1;
    const locsWh1 = locations.filter(l => l.warehouse_id === wh1);
    const locsWh2 = locations.filter(l => l.warehouse_id === wh2);

    const srcLoc = locsWh1[0]?.id || locations[0]?.id || '';
    const dstLoc = (locsWh1[1] ? locsWh1[1].id : (locsWh2[0]?.id || locations[1]?.id || ''));

    setSourceWarehouseId(wh1);
    setSourceLocationId(srcLoc);
    setDestWarehouseId(wh1);
    setDestLocationId(dstLoc);
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setLines([
      {
        product_id: products[0]?.id || '',
        demanded_qty: 20
      }
    ]);
    setIsCreateOpen(true);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        product_id: products[0]?.id || '',
        demanded_qty: 10
      }
    ]);
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: string, value: any) => {
    const copy = [...lines];
    copy[idx] = { ...copy[idx], [field]: value };
    setLines(copy);
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceLocationId === destLocationId) {
      onShowToast('Source and Destination locations must be distinct', 'error');
      return;
    }
    if (lines.length === 0) {
      onShowToast('Please add at least one line item', 'error');
      return;
    }

    try {
      const res = await api.createTransfer({
        source_warehouse_id: sourceWarehouseId,
        source_location_id: sourceLocationId,
        destination_warehouse_id: destWarehouseId,
        destination_location_id: destLocationId,
        scheduled_date: new Date(scheduledDate).toISOString(),
        notes,
        lines
      });

      onShowToast(`Internal transfer ${res.reference} created in READY state`, 'success');
      setIsCreateOpen(false);
      fetchTransfers();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to create transfer', 'error');
    }
  };

  const handleValidateTransfer = async (transfer: InternalTransfer) => {
    setValidatingId(transfer.id);
    try {
      const res = await api.validateTransfer(transfer.id);
      onShowToast(`Transfer ${transfer.reference} validated! 2 Ledger entries posted. Total company stock unchanged.`, 'success');
      if (selectedTransfer?.id === transfer.id) {
        setSelectedTransfer(res.transfer);
      }
      fetchTransfers();
    } catch (err: any) {
      const details = err.details?.join('; ');
      onShowToast(`${err.message}${details ? `: ${details}` : ''}`, 'error');
    } finally {
      setValidatingId(null);
    }
  };

  const viewDetails = async (id: string) => {
    try {
      const full = await api.getTransfer(id);
      setSelectedTransfer(full);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load transfer details', 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Internal Transfers (Location Relocation)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Inter-location & inter-warehouse material transfers. Produces 2 offsetting ledger entries (OUT at source, IN at destination) with zero net change to total company stock.
          </p>
        </div>

        {canOperate && (
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Transfer</span>
          </button>
        )}
      </div>

      {/* Mathematical Invariant Banner */}
      <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-700 shrink-0" />
          <div>
            <div className="font-bold text-slate-900">ERP Double-Entry Principle Enforced:</div>
            <div className="text-slate-600 font-mono text-[11px] mt-0.5">
              Source Location: <span className="text-rose-600 font-bold">-N units</span> · Destination Location: <span className="text-emerald-600 font-bold">+N units</span> · Total Company Stock: <span className="font-bold text-indigo-900">Δ 0 (Unchanged)</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('stock-by-location')}
          className="px-3 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-800 rounded-md font-semibold text-xs transition-colors shrink-0 cursor-pointer"
        >
          View Location Balances
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-600">Filter Status:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
            {['all', 'READY', 'DONE'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 font-medium rounded transition-colors cursor-pointer capitalize ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'all' ? 'All Transfers' : status}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={fetchTransfers}
          title="Refresh List"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 select-none">
            <tr>
              <th className="py-3 px-4 font-semibold">Reference</th>
              <th className="py-3 px-4 font-semibold">Source (Origin)</th>
              <th className="py-3 px-4 font-semibold">Destination (Target)</th>
              <th className="py-3 px-4 font-semibold text-right">Items Quantity</th>
              <th className="py-3 px-4 font-semibold">Transfer Date</th>
              <th className="py-3 px-4 font-semibold text-center">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Workflow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && transfers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
                  Loading internal transfers...
                </td>
              </tr>
            ) : transfers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No internal transfers found.
                </td>
              </tr>
            ) : (
              transfers.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {t.reference}
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-800">
                    <div>{t.source_warehouse_name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{t.source_location_name}</div>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-800">
                    <div>{t.destination_warehouse_name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{t.destination_location_name}</div>
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {t.total_items}
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-500">
                    {new Date(t.scheduled_date).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {t.status === 'DONE' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed (Done)
                      </span>
                    ) : t.status === 'READY' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Ready to Move
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Draft
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => viewDetails(t.id)}
                        title="View Lines"
                        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {t.status !== 'DONE' && canOperate && (
                        <button
                          onClick={() => handleValidateTransfer(t)}
                          disabled={validatingId === t.id}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-purple-700 hover:bg-purple-600 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>{validatingId === t.id ? 'Transferring...' : 'Execute Move'}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Modal */}
      {selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>Transfer: {selectedTransfer.reference}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                    selectedTransfer.status === 'DONE' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedTransfer.status}
                  </span>
                </h3>
              </div>
              <button onClick={() => setSelectedTransfer(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400">Source Location:</span>
                  <p className="font-semibold text-slate-800">{selectedTransfer.source_location_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Destination Location:</span>
                  <p className="font-semibold text-slate-800">{selectedTransfer.destination_location_name}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Transfer Line Items</h4>
                <table className="w-full text-left border border-slate-100 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="py-2 px-3">Product SKU</th>
                      <th className="py-2 px-3 text-right">Demanded Qty</th>
                      <th className="py-2 px-3 text-right">Available at Source</th>
                      <th className="py-2 px-3 text-right">Transferred</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTransfer.lines.map((l: any) => (
                      <tr key={l.id}>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{l.product_name}</div>
                          <div className="font-mono text-slate-400 text-[11px]">{l.product_sku}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">{l.demanded_qty}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {selectedTransfer.status === 'DONE' ? 'Verified' : (l.available_at_source ?? '—')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-purple-700">
                          {selectedTransfer.status === 'DONE' ? l.demanded_qty : l.transferred_qty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onNavigate('stock-ledger')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Verify 2 Ledger Entries →
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTransfer(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  {selectedTransfer.status !== 'DONE' && canOperate && (
                    <button
                      type="button"
                      onClick={() => handleValidateTransfer(selectedTransfer)}
                      disabled={validatingId === selectedTransfer.id}
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Execute & Relocate</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">Create Internal Stock Transfer</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Source Location *</label>
                  <select
                    value={sourceLocationId}
                    onChange={e => setSourceLocationId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.warehouse_code} · {l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Destination Location *</label>
                  <select
                    value={destLocationId}
                    onChange={e => setDestLocationId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.warehouse_code} · {l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Scheduled Transfer Date</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Transfer Reason / Route</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Put-away to Rack A, Assembly Line Staging..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Lines */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-800">Items to Relocate</label>
                  <button
                    type="button"
                    onClick={addLine}
                    className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded font-semibold transition-colors cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {lines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex-1">
                        <select
                          value={line.product_id}
                          onChange={e => updateLine(idx, 'product_id', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          min="1"
                          required
                          value={line.demanded_qty}
                          onChange={e => updateLine(idx, 'demanded_qty', parseInt(e.target.value) || 1)}
                          placeholder="Qty"
                          className="w-full px-2 py-1.5 font-mono text-right border border-slate-300 rounded bg-white"
                        />
                      </div>

                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition-colors cursor-pointer"
                >
                  Register Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
