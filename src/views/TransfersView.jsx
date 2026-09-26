import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeftRight, X, AlertTriangle, Layers } from 'lucide-react';
import { mockDocumentService } from '../services/mockDocumentService.js';
import { mockInventoryService } from '../services/mockInventoryService.js';

export const TransfersView = ({ onShowToast }) => {
  const [transfers, setTransfers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    sourceWarehouseId: 'wh-main',
    sourceLocationId: 'loc-rec',
    destWarehouseId: 'wh-main',
    destLocationId: 'loc-rack-a',
    productId: 'prod-steel',
    quantity: 100,
    uom: 'KG'
  });

  const products = mockInventoryService.getProducts();
  const warehouses = mockInventoryService.getWarehouses();
  const sourceLocations = mockInventoryService.getLocations(formData.sourceWarehouseId);
  const destLocations = mockInventoryService.getLocations(formData.destWarehouseId);

  const availableAtSource = mockInventoryService.getLocationStock(formData.productId, formData.sourceLocationId);
  const isInsufficient = formData.quantity > availableAtSource;

  const loadData = () => {
    setTransfers(mockDocumentService.getTransfers());
  };

  useEffect(() => {
    loadData();
    const unsub = mockInventoryService.subscribe(() => loadData());
    return () => unsub();
  }, []);

  const handleValidateTransfer = (id) => {
    try {
      const validated = mockDocumentService.validateTransfer(id);
      onShowToast(`Validated Transfer ${validated.reference}: Source deducted, destination credited. Company total invariant preserved!`, 'success');
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleCreateAndValidate = () => {
    if (formData.sourceLocationId === formData.destLocationId) {
      onShowToast('Source and Destination locations must be different', 'error');
      return;
    }
    if (isInsufficient) {
      onShowToast(`Insufficient stock at source location. Available: ${availableAtSource}`, 'error');
      return;
    }

    try {
      const created = mockDocumentService.createTransfer({
        ...formData,
        status: 'READY'
      });
      mockDocumentService.validateTransfer(created.id);
      onShowToast(`Validated Transfer ${created.reference}: Relocated ${formData.quantity} ${formData.uom}. Company balance unchanged.`, 'success');
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
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Internal Transfers</h1>
          <p className="text-xs text-slate-500 mt-0.5">Dual-entry warehouse relocations and inter-rack replenishment</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              sourceWarehouseId: 'wh-main',
              sourceLocationId: 'loc-rec',
              destWarehouseId: 'wh-main',
              destLocationId: 'loc-rack-a',
              productId: products[0]?.id || 'prod-steel',
              quantity: 100,
              uom: products[0]?.uom || 'KG'
            });
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Transfer</span>
        </button>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Transfer #</th>
                <th className="py-2.5 px-4">Source Location</th>
                <th className="py-2.5 px-4">Destination Location</th>
                <th className="py-2.5 px-4">Product / Qty</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {transfers.map(tr => {
                return (
                  <tr key={tr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{tr.reference}</td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-semibold">{tr.sourceLocationName}</div>
                      <div className="text-[10px] text-slate-400">{tr.sourceWarehouseName}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-semibold text-indigo-900">{tr.destLocationName}</div>
                      <div className="text-[10px] text-slate-400">{tr.destWarehouseName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{tr.productName}: </span>
                      <strong className="font-mono text-teal-700">{tr.quantity} {tr.uom}</strong>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{tr.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tr.status === 'DONE' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {tr.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {tr.status === 'READY' && (
                        <button
                          onClick={() => handleValidateTransfer(tr.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold shadow-xs"
                        >
                          Execute Transfer
                        </button>
                      )}
                      {tr.status === 'DONE' && (
                        <span className="text-[11px] text-slate-400 italic">Dual-Entry Complete</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transfer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-teal-600" />
                <span>Create Internal Transfer</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product *</label>
                <select
                  value={formData.productId}
                  onChange={(e) => {
                    const sel = products.find(p => p.id === e.target.value);
                    setFormData({
                      ...formData,
                      productId: e.target.value,
                      uom: sel ? sel.uom : 'PCS'
                    });
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              {/* Source & Dest grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">FROM: Source Location</span>
                  <select
                    value={formData.sourceLocationId}
                    onChange={(e) => setFormData({ ...formData, sourceLocationId: e.target.value })}
                    className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded focus:border-indigo-500 bg-white"
                  >
                    {sourceLocations.filter(l => l.warehouseId !== 'virtual').map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                  <div className="mt-1 text-[11px] text-slate-500 font-mono">
                    Available: <strong>{availableAtSource} {formData.uom}</strong>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">TO: Destination Location</span>
                  <select
                    value={formData.destLocationId}
                    onChange={(e) => setFormData({ ...formData, destLocationId: e.target.value })}
                    className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded focus:border-indigo-500 bg-white"
                  >
                    {destLocations.filter(l => l.warehouseId !== 'virtual').map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {isInsufficient && (
                <div className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Insufficient stock available at source location ({availableAtSource} {formData.uom} available).</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transfer Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UoM</label>
                  <input
                    type="text"
                    disabled
                    value={formData.uom}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded bg-slate-100 text-slate-600 font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-indigo-50 rounded border border-indigo-100 text-[11px] text-indigo-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>Dual-entry guarantee: Source stock will decrease, Destination will increase by {formData.quantity} {formData.uom}. Company total remains constant.</span>
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
                type="button"
                disabled={isInsufficient}
                onClick={handleCreateAndValidate}
                className={`px-4 py-1.5 rounded text-xs font-semibold shadow-xs ${
                  isInsufficient
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                Execute Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
