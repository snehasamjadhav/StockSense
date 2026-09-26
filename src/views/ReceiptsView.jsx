import React, { useState, useEffect } from 'react';
import { Plus, Check, X, ArrowDownLeft, Filter, AlertCircle, Clock } from 'lucide-react';
import { mockDocumentService } from '../services/mockDocumentService.js';
import { mockInventoryService } from '../services/mockInventoryService.js';

export const ReceiptsView = ({ onShowToast }) => {
  const [receipts, setReceipts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    supplier: '',
    warehouseId: 'wh-main',
    destinationLocationId: 'loc-rec',
    productId: '',
    quantity: 100,
    uom: 'KG',
    notes: '',
    status: 'READY'
  });

  const products = mockInventoryService.getProducts();
  const warehouses = mockInventoryService.getWarehouses();
  const locations = mockInventoryService.getLocations('wh-main');

  const loadData = () => {
    setReceipts(mockDocumentService.getReceipts({ status: statusFilter }));
  };

  useEffect(() => {
    loadData();
    const unsub = mockInventoryService.subscribe(() => loadData());
    return () => unsub();
  }, [statusFilter]);

  const handleCreate = (statusToSet = 'READY') => {
    if (!formData.supplier || !formData.productId || !formData.quantity) {
      onShowToast('Supplier, Product, and Quantity are required', 'error');
      return;
    }

    try {
      const receipt = mockDocumentService.createReceipt({
        ...formData,
        status: statusToSet
      });
      onShowToast(`Created Receipt ${receipt.reference} (${statusToSet})`, 'success');
      setShowModal(false);
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleValidate = (id) => {
    try {
      const validated = mockDocumentService.validateReceipt(id);
      onShowToast(`Validated ${validated.reference}: Stock ledger updated and inventory received.`, 'success');
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleMarkReady = (id) => {
    try {
      mockDocumentService.updateReceiptStatus(id, 'READY');
      onShowToast('Receipt status set to READY', 'info');
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleCancel = (id) => {
    try {
      mockDocumentService.updateReceiptStatus(id, 'CANCELED');
      onShowToast('Receipt order canceled', 'info');
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
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Inbound Receipts</h1>
          <p className="text-xs text-slate-500 mt-0.5">Supplier shipments, intake verification, and receiving ledger entry</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              supplier: 'Global Metallics Ltd',
              warehouseId: 'wh-main',
              destinationLocationId: 'loc-rec',
              productId: products[0]?.id || 'prod-steel',
              quantity: 100,
              uom: products[0]?.uom || 'KG',
              notes: 'Inbound PO verification batch',
              status: 'READY'
            });
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Receipt</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['all', 'READY', 'WAITING', 'DRAFT', 'DONE', 'CANCELED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md font-semibold text-[11px] transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Receipt #</th>
                <th className="py-2.5 px-4">Supplier</th>
                <th className="py-2.5 px-4">Warehouse</th>
                <th className="py-2.5 px-4">Destination</th>
                <th className="py-2.5 px-4">Items / Qty</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {receipts.map(rec => {
                let statusBadge = 'bg-slate-100 text-slate-700';
                if (rec.status === 'DONE') statusBadge = 'bg-emerald-100 text-emerald-800';
                if (rec.status === 'READY') statusBadge = 'bg-blue-100 text-blue-800';
                if (rec.status === 'WAITING') statusBadge = 'bg-amber-100 text-amber-800';
                if (rec.status === 'CANCELED') statusBadge = 'bg-rose-100 text-rose-800';

                return (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{rec.reference}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{rec.supplier}</td>
                    <td className="py-3 px-4 text-slate-600">{rec.warehouseName}</td>
                    <td className="py-3 px-4 text-slate-600">{rec.destinationName}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{rec.productName}: </span>
                      <strong className="font-mono text-emerald-700">+{rec.quantity} {rec.uom}</strong>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{rec.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {rec.status === 'DRAFT' && (
                        <button
                          onClick={() => handleMarkReady(rec.id)}
                          className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold"
                        >
                          Mark Ready
                        </button>
                      )}
                      {(rec.status === 'READY' || rec.status === 'WAITING') && (
                        <button
                          onClick={() => handleValidate(rec.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold shadow-xs"
                        >
                          Validate
                        </button>
                      )}
                      {rec.status !== 'DONE' && rec.status !== 'CANCELED' && (
                        <button
                          onClick={() => handleCancel(rec.id)}
                          className="px-2 py-1 text-slate-400 hover:text-rose-600 text-[11px]"
                        >
                          Cancel
                        </button>
                      )}
                      {rec.status === 'DONE' && (
                        <span className="text-[11px] text-slate-400 italic">Posted to Ledger</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Receipt Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-indigo-600" />
                <span>Create New Inbound Receipt</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supplier Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Global Metallics Ltd"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warehouse</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none bg-white"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination Location</label>
                  <select
                    value={formData.destinationLocationId}
                    onChange={(e) => setFormData({ ...formData, destinationLocationId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none bg-white"
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none font-mono"
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
                <input
                  type="text"
                  placeholder="PO number or bill of lading reference..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCreate('DRAFT')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleCreate('READY')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
                >
                  Mark Ready
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const receipt = mockDocumentService.createReceipt({
                      ...formData,
                      status: 'READY'
                    });
                    mockDocumentService.validateReceipt(receipt.id);
                    onShowToast(`Created & Validated ${receipt.reference}. Stock increased!`, 'success');
                    setShowModal(false);
                    loadData();
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs"
                >
                  Validate Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
