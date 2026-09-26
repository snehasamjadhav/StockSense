import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { InventoryAdjustment, Product, Warehouse, Location } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Scale,
  Plus,
  CheckCircle2,
  RefreshCw,
  Eye,
  X,
  Trash2,
  AlertTriangle,
  Boxes
} from 'lucide-react';

interface AdjustmentsViewProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigate: (viewId: string) => void;
}

export const AdjustmentsView: React.FC<AdjustmentsViewProps> = ({ onShowToast, onNavigate }) => {
  const { hasRole } = useAuth();
  const canAdjust = hasRole(['ADMIN', 'INVENTORY_MANAGER']);

  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [reason, setReason] = useState<InventoryAdjustment['reason']>('Annual Physical Count');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Array<{ product_id: string; counted_qty: number }>>([]);

  // Detail Modal
  const [selectedAdjustment, setSelectedAdjustment] = useState<InventoryAdjustment | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const [adjData, prodData, whData, locData] = await Promise.all([
        api.getAdjustments(),
        api.getProducts(),
        api.getWarehouses(),
        api.getLocations({ type: 'internal' })
      ]);
      setAdjustments(adjData);
      setProducts(prodData);
      setWarehouses(whData);
      setLocations(locData);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch adjustments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const openCreateModal = () => {
    const defaultWh = warehouses[0]?.id || '';
    const defaultLoc = locations.find(l => l.warehouse_id === defaultWh)?.id || locations[0]?.id || '';

    setWarehouseId(defaultWh);
    setLocationId(defaultLoc);
    setReason('Annual Physical Count');
    setNotes('');
    setLines([
      {
        product_id: products[0]?.id || '',
        counted_qty: 30
      }
    ]);
    setIsCreateOpen(true);
  };

  const handleWarehouseChange = (whId: string) => {
    setWarehouseId(whId);
    const loc = locations.find(l => l.warehouse_id === whId)?.id || '';
    setLocationId(loc);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        product_id: products[0]?.id || '',
        counted_qty: 10
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

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      onShowToast('Please add at least one physical count line', 'error');
      return;
    }

    try {
      const res = await api.createAdjustment({
        warehouse_id: warehouseId,
        location_id: locationId,
        reason,
        notes,
        lines
      });

      onShowToast(`Created adjustment count ${res.reference}`, 'success');
      setIsCreateOpen(false);
      fetchAdjustments();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to create adjustment', 'error');
    }
  };

  const handleValidateAdjustment = async (adj: InventoryAdjustment) => {
    setValidatingId(adj.id);
    try {
      const res = await api.validateAdjustment(adj.id);
      onShowToast(`Adjustment ${adj.reference} reconciled! Ledger updated.`, 'success');
      if (selectedAdjustment?.id === adj.id) {
        setSelectedAdjustment(res.adjustment);
      }
      fetchAdjustments();
    } catch (err: any) {
      onShowToast(err.message || 'Validation failed', 'error');
    } finally {
      setValidatingId(null);
    }
  };

  const viewDetails = (adj: InventoryAdjustment) => {
    setSelectedAdjustment(adj);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventory Adjustments (Physical Stock Reconciliation)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit physical counts against recorded system quantities. Validation writes offsetting positive or negative movements to the Stock Ledger.
          </p>
        </div>

        {canAdjust && (
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Physical Count</span>
          </button>
        )}
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 select-none">
            <tr>
              <th className="py-3 px-4 font-semibold">Reference</th>
              <th className="py-3 px-4 font-semibold">Reason</th>
              <th className="py-3 px-4 font-semibold">Warehouse / Location</th>
              <th className="py-3 px-4 font-semibold">Audited By</th>
              <th className="py-3 px-4 font-semibold text-right">Net Units Diff</th>
              <th className="py-3 px-4 font-semibold">Count Date</th>
              <th className="py-3 px-4 font-semibold text-center">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Workflow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && adjustments.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
                  Loading physical count audits...
                </td>
              </tr>
            ) : adjustments.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No adjustments recorded.
                </td>
              </tr>
            ) : (
              adjustments.map(adj => {
                const diff = adj.total_difference_qty ?? 0;
                return (
                  <tr key={adj.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {adj.reference}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">
                      {adj.reason}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div>{adj.warehouse_name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{adj.location_name}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {adj.created_by_name}
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold">
                      {diff > 0 ? (
                        <span className="text-emerald-600">+{diff} (Gain)</span>
                      ) : diff < 0 ? (
                        <span className="text-rose-600">{diff} (Shrinkage)</span>
                      ) : (
                        <span className="text-slate-400">0 (Exact)</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(adj.counted_date).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {adj.status === 'DONE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Reconciled (Done)
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Draft Count
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => viewDetails(adj)}
                          title="Inspect Count Breakdown"
                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {adj.status !== 'DONE' && canAdjust && (
                          <button
                            onClick={() => handleValidateAdjustment(adj)}
                            disabled={validatingId === adj.id}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            <Scale className="w-3 h-3" />
                            <span>{validatingId === adj.id ? 'Posting...' : 'Reconcile'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Detail Modal */}
      {selectedAdjustment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>Adjustment Record: {selectedAdjustment.reference}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                    selectedAdjustment.status === 'DONE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedAdjustment.status}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Reason: {selectedAdjustment.reason}</p>
              </div>
              <button onClick={() => setSelectedAdjustment(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400">Location Audited:</span>
                  <p className="font-semibold text-slate-800">{selectedAdjustment.warehouse_name} · {selectedAdjustment.location_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Audited Timestamp:</span>
                  <p className="font-semibold text-slate-800">{new Date(selectedAdjustment.counted_date).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Count Discrepancy Breakdown</h4>
                <table className="w-full text-left border border-slate-100 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="py-2 px-3">Product SKU</th>
                      <th className="py-2 px-3 text-right">System Qty</th>
                      <th className="py-2 px-3 text-right">Counted Qty</th>
                      <th className="py-2 px-3 text-right">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedAdjustment.lines.map((l: any) => (
                      <tr key={l.id}>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{l.product_name || l.product_id}</div>
                          <div className="font-mono text-slate-400 text-[11px]">{l.product_sku || l.product_id}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">{l.system_qty}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">{l.counted_qty}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold">
                          {l.difference > 0 ? (
                            <span className="text-emerald-600">+{l.difference}</span>
                          ) : l.difference < 0 ? (
                            <span className="text-rose-600">{l.difference}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
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
                    onClick={() => setSelectedAdjustment(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  {selectedAdjustment.status !== 'DONE' && canAdjust && (
                    <button
                      type="button"
                      onClick={() => handleValidateAdjustment(selectedAdjustment)}
                      disabled={validatingId === selectedAdjustment.id}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Post Reconciliation</span>
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
              <h3 className="font-bold text-slate-900 text-sm">New Physical Inventory Count & Spot Check</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Target Warehouse *</label>
                  <select
                    value={warehouseId}
                    onChange={e => handleWarehouseChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Target Location / Bin *</label>
                  <select
                    value={locationId}
                    onChange={e => setLocationId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {locations
                      .filter(l => !warehouseId || l.warehouse_id === warehouseId)
                      .map(l => (
                        <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Audit Reason</label>
                  <select
                    value={reason}
                    onChange={e => setReason(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Annual Physical Count">Annual Physical Count</option>
                    <option value="Routine Audit">Routine Spot Check</option>
                    <option value="Damaged Goods">Damaged Goods Scrap</option>
                    <option value="Theft/Loss">Theft / Shrinkage Loss</option>
                    <option value="Found Stock">Found Inventory Surplus</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Audit Notes / Witness</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Q3 warehouse wall-to-wall recount..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-800">Physical Stock Count</label>
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

                      <div className="w-36">
                        <input
                          type="number"
                          min="0"
                          required
                          value={line.counted_qty}
                          onChange={e => updateLine(idx, 'counted_qty', parseInt(e.target.value) || 0)}
                          placeholder="Counted Qty"
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
                  Save Count Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
