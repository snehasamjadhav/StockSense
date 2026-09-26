import React, { useState, useEffect } from 'react';
import { Plus, ClipboardCheck, X, AlertCircle, ArrowDown, ArrowUp } from 'lucide-react';
import { mockDocumentService } from '../services/mockDocumentService.js';
import { mockInventoryService } from '../services/mockInventoryService.js';

export const AdjustmentsView = ({ onShowToast }) => {
  const [adjustments, setAdjustments] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    productId: 'prod-steel',
    warehouseId: 'wh-main',
    locationId: 'loc-rack-a',
    physicalQty: 77,
    reason: 'Monthly physical inventory cycle count calibration'
  });

  const products = mockInventoryService.getProducts();
  const warehouses = mockInventoryService.getWarehouses();
  const locations = mockInventoryService.getLocations(formData.warehouseId);

  const currentSystemQty = mockInventoryService.getLocationStock(formData.productId, formData.locationId);
  const difference = Number(formData.physicalQty) - currentSystemQty;

  const loadData = () => {
    setAdjustments(mockDocumentService.getAdjustments());
  };

  useEffect(() => {
    loadData();
    const unsub = mockInventoryService.subscribe(() => loadData());
    return () => unsub();
  }, []);

  const handleValidateAdjustment = (e) => {
    e.preventDefault();
    try {
      const adj = mockDocumentService.createAdjustment(formData);
      onShowToast(`Posted Adjustment ${adj.reference}: Inventory updated to ${formData.physicalQty} (${difference > 0 ? '+' : ''}${difference}). Ledger entry created.`, 'success');
      setShowModal(false);
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Inventory Adjustments</h1>
          <p className="text-xs text-slate-500 mt-0.5">Physical cycle count reconciliation, scrap write-offs, and discrepancy ledger auditing</p>
        </div>
        <button
          onClick={() => {
            const steelStock = mockInventoryService.getLocationStock('prod-steel', 'loc-rack-a');
            setFormData({
              productId: 'prod-steel',
              warehouseId: 'wh-main',
              locationId: 'loc-rack-a',
              physicalQty: steelStock > 0 ? steelStock - 3 : 77,
              reason: 'Cycle count physical count discrepancy audit'
            });
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Adjustment</span>
        </button>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Adjustment #</th>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">System Qty</th>
                <th className="py-2.5 px-4">Physical Count</th>
                <th className="py-2.5 px-4">Discrepancy (Diff)</th>
                <th className="py-2.5 px-4">Reason</th>
                <th className="py-2.5 px-4">Operator</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {adjustments.map(adj => {
                const isNegative = adj.difference < 0;
                return (
                  <tr key={adj.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{adj.reference}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{adj.productName}</td>
                    <td className="py-3 px-4 text-slate-600">{adj.locationName}</td>
                    <td className="py-3 px-4 font-mono">{adj.systemQty} {adj.uom}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{adj.physicalQty} {adj.uom}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                        isNegative ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {adj.difference > 0 ? `+${adj.difference}` : adj.difference} {adj.uom}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{adj.reason}</td>
                    <td className="py-3 px-4 text-slate-600">{adj.operator}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{adj.date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {adj.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <form
            onSubmit={handleValidateAdjustment}
            className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-amber-600" />
                <span>Physical Cycle Count Adjustment</span>
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product *</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warehouse</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 bg-white"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 bg-white"
                  >
                    {locations.filter(l => l.warehouseId !== 'virtual').map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Automatic Difference Calculator Box */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">System Recorded Quantity:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{currentSystemQty}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-slate-700">Actual Physical Count *</label>
                  <input
                    type="number"
                    required
                    value={formData.physicalQty}
                    onChange={(e) => setFormData({ ...formData, physicalQty: parseInt(e.target.value, 10) || 0 })}
                    className="w-24 px-2 py-1 border border-indigo-300 rounded font-mono font-bold text-right bg-white focus:outline-indigo-500"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-semibold text-slate-700 text-xs">Calculated Difference:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                      difference < 0 ? 'bg-rose-100 text-rose-800' : difference > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {difference > 0 ? `+${difference}` : difference}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      difference < 0 ? 'text-rose-700' : difference > 0 ? 'text-emerald-700' : 'text-slate-500'
                    }`}>
                      {difference < 0 ? 'ADJUSTMENT OUT' : difference > 0 ? 'ADJUSTMENT IN' : 'NO CHANGE'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Notes *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly cycle count scale calibration correction"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-xs"
              >
                Post Adjustment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
