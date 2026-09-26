import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Receipt, Product, Warehouse, Location } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ArrowDownLeft,
  Plus,
  CheckCircle2,
  RefreshCw,
  Eye,
  X,
  Trash2,
  Calendar,
  Building2,
  FileCheck2,
  Boxes
} from 'lucide-react';

interface ReceiptsViewProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigate: (viewId: string) => void;
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = ({ onShowToast, onNavigate }) => {
  const { hasRole } = useAuth();
  const canOperate = hasRole(['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF']);

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // New Receipt Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [destWarehouseId, setDestWarehouseId] = useState('');
  const [destLocationId, setDestLocationId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Array<{ product_id: string; demanded_qty: number; unit_price: number }>>([]);

  // Detail Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const [recData, prodData, whData, locData] = await Promise.all([
        api.getReceipts({ status: statusFilter !== 'all' ? statusFilter : undefined }),
        api.getProducts(),
        api.getWarehouses(),
        api.getLocations({ type: 'internal' })
      ]);
      setReceipts(recData);
      setProducts(prodData);
      setWarehouses(whData);
      setLocations(locData);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch receipts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [statusFilter]);

  const openCreateModal = () => {
    const defaultWh = warehouses[0]?.id || '';
    const defaultLoc = locations.find(l => l.warehouse_id === defaultWh)?.id || locations[0]?.id || '';
    setSupplierName('');
    setDestWarehouseId(defaultWh);
    setDestLocationId(defaultLoc);
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setLines([
      {
        product_id: products[0]?.id || '',
        demanded_qty: 50,
        unit_price: products[0]?.cost_price || 0
      }
    ]);
    setIsCreateOpen(true);
  };

  const handleWarehouseChange = (whId: string) => {
    setDestWarehouseId(whId);
    const loc = locations.find(l => l.warehouse_id === whId)?.id || '';
    setDestLocationId(loc);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        product_id: products[0]?.id || '',
        demanded_qty: 25,
        unit_price: products[0]?.cost_price || 0
      }
    ]);
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: string, value: any) => {
    const copy = [...lines];
    copy[idx] = { ...copy[idx], [field]: value };
    if (field === 'product_id') {
      const p = products.find(prod => prod.id === value);
      if (p) copy[idx].unit_price = p.cost_price;
    }
    setLines(copy);
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      onShowToast('Please add at least one line item', 'error');
      return;
    }

    try {
      const res = await api.createReceipt({
        supplier_name: supplierName,
        destination_warehouse_id: destWarehouseId,
        destination_location_id: destLocationId,
        scheduled_date: new Date(scheduledDate).toISOString(),
        notes,
        lines
      });

      onShowToast(`Receipt ${res.reference} generated in READY status`, 'success');
      setIsCreateOpen(false);
      fetchReceipts();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to create receipt', 'error');
    }
  };

  const handleValidateReceipt = async (receipt: Receipt) => {
    setValidatingId(receipt.id);
    try {
      const res = await api.validateReceipt(receipt.id);
      onShowToast(`Receipt ${receipt.reference} validated! Stock Ledger credited (+IN).`, 'success');
      if (selectedReceipt?.id === receipt.id) {
        setSelectedReceipt(res.receipt);
      }
      fetchReceipts();
    } catch (err: any) {
      onShowToast(err.message || 'Validation failed', 'error');
    } finally {
      setValidatingId(null);
    }
  };

  const viewDetails = async (id: string) => {
    try {
      const full = await api.getReceipt(id);
      setSelectedReceipt(full);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load details', 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inbound Receipts (Vendor Shipments)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Document-driven purchase receipts. Validation writes stock movements and credits destination location balances in the central ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canOperate && (
            <button
              onClick={openCreateModal}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Receipt</span>
            </button>
          )}
        </div>
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
                {status === 'all' ? 'All Receipts' : status}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={fetchReceipts}
          title="Refresh Receipts"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 select-none">
            <tr>
              <th className="py-3 px-4 font-semibold">Reference</th>
              <th className="py-3 px-4 font-semibold">Supplier / Vendor</th>
              <th className="py-3 px-4 font-semibold">Destination Location</th>
              <th className="py-3 px-4 font-semibold text-right">Items Demand</th>
              <th className="py-3 px-4 font-semibold text-right">Total Value</th>
              <th className="py-3 px-4 font-semibold">Scheduled Date</th>
              <th className="py-3 px-4 font-semibold text-center">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Workflow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && receipts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
                  Loading inbound shipments...
                </td>
              </tr>
            ) : receipts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No receipts found matching filter.
                </td>
              </tr>
            ) : (
              receipts.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {r.reference}
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-800">
                    {r.supplier_name}
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    <div>{r.destination_warehouse_name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{r.destination_location_name}</div>
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {r.total_items}
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    ${r.total_value ? r.total_value.toFixed(2) : '0.00'}
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-500">
                    {new Date(r.scheduled_date).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {r.status === 'DONE' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Validated (Done)
                      </span>
                    ) : r.status === 'READY' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Ready for Intake
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
                        onClick={() => viewDetails(r.id)}
                        title="Inspect Document Lines"
                        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {r.status !== 'DONE' && canOperate && (
                        <button
                          onClick={() => handleValidateReceipt(r)}
                          disabled={validatingId === r.id}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        >
                          <FileCheck2 className="w-3 h-3" />
                          <span>{validatingId === r.id ? 'Posting...' : 'Validate'}</span>
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

      {/* Inspect Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>Receipt Document: {selectedReceipt.reference}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                    selectedReceipt.status === 'DONE' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedReceipt.status}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Supplier: {selectedReceipt.supplier_name}</p>
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400">Destination:</span>
                  <p className="font-semibold text-slate-800">{selectedReceipt.destination_warehouse_name} / {selectedReceipt.destination_location_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Scheduled Date:</span>
                  <p className="font-semibold text-slate-800">{new Date(selectedReceipt.scheduled_date).toLocaleDateString()}</p>
                </div>
                {selectedReceipt.notes && (
                  <div className="col-span-2">
                    <span className="text-slate-400">Document Notes:</span>
                    <p className="text-slate-700">{selectedReceipt.notes}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Item Demand Lines</h4>
                <table className="w-full text-left border border-slate-100 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="py-2 px-3">Product SKU</th>
                      <th className="py-2 px-3 text-right">Demanded Qty</th>
                      <th className="py-2 px-3 text-right">Received Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedReceipt.lines.map((l: any) => (
                      <tr key={l.id}>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{l.product_name}</div>
                          <div className="font-mono text-slate-400 text-[11px]">{l.product_sku}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">{l.demanded_qty}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-600">
                          {selectedReceipt.status === 'DONE' ? l.demanded_qty : l.received_qty}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">${l.unit_price?.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                          ${((l.demanded_qty) * (l.unit_price || 0)).toFixed(2)}
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
                  Verify in Stock Ledger →
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReceipt(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  {selectedReceipt.status !== 'DONE' && canOperate && (
                    <button
                      type="button"
                      onClick={() => handleValidateReceipt(selectedReceipt)}
                      disabled={validatingId === selectedReceipt.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Validate & Post Ledger</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Receipt Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">Create Inbound Receipt (PO Intake)</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Supplier / Vendor *</label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={e => setSupplierName(e.target.value)}
                    placeholder="e.g. Apex Precision Drives Corp"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Scheduled Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Destination Warehouse *</label>
                  <select
                    value={destWarehouseId}
                    onChange={e => handleWarehouseChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Destination Location / Bay *</label>
                  <select
                    value={destLocationId}
                    onChange={e => setDestLocationId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {locations
                      .filter(l => !destWarehouseId || l.warehouse_id === destWarehouseId)
                      .map(l => (
                        <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Lines table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-800">Shipment Item Lines</label>
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

                      <div className="w-24">
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

                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          value={line.unit_price}
                          onChange={e => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="Price"
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

              <div>
                <label className="block font-medium text-slate-700 mb-1">Receipt Notes / Tracking</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="PO reference, Bill of Lading (BoL), freight tracking..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                  Create Intake Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
