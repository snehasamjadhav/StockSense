import React, { useState, useEffect } from 'react';
import { Plus, ArrowUpRight, AlertTriangle, X, Check } from 'lucide-react';
import { mockDocumentService } from '../services/mockDocumentService.js';
import { mockInventoryService } from '../services/mockInventoryService.js';

export const DeliveriesView = ({ onShowToast }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customer: 'Apex Manufacturing Co',
    warehouseId: 'wh-main',
    sourceLocationId: 'loc-rack-a',
    productId: 'prod-steel',
    quantity: 20,
    uom: 'KG',
    notes: 'Outbound dispatch'
  });

  const products = mockInventoryService.getProducts();
  const warehouses = mockInventoryService.getWarehouses();
  const locations = mockInventoryService.getLocations('wh-main');

  const availableStock = mockInventoryService.getLocationStock(formData.productId, formData.sourceLocationId);
  const isInsufficient = formData.quantity > availableStock;

  const loadData = () => {
    setDeliveries(mockDocumentService.getDeliveries({ status: statusFilter }));
  };

  useEffect(() => {
    loadData();
    const unsub = mockInventoryService.subscribe(() => loadData());
    return () => unsub();
  }, [statusFilter]);

  const handleCreateAndValidate = () => {
    if (isInsufficient) {
      onShowToast(`Insufficient stock available. Required: ${formData.quantity}, Available: ${availableStock}`, 'error');
      return;
    }

    try {
      const order = mockDocumentService.createDelivery({
        ...formData,
        status: 'READY'
      });
      mockDocumentService.validateDelivery(order.id);
      onShowToast(`Validated ${order.reference}: Dispatched ${formData.quantity} ${formData.uom} to ${formData.customer}`, 'success');
      setShowModal(false);
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleValidateExisting = (id) => {
    try {
      const validated = mockDocumentService.validateDelivery(id);
      onShowToast(`Validated ${validated.reference}: Customer dispatch ledger entry recorded.`, 'success');
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
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Delivery Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">Outbound customer dispatches with stock validation guards</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              customer: 'Apex Manufacturing Co',
              warehouseId: 'wh-main',
              sourceLocationId: 'loc-rack-a',
              productId: products[0]?.id || 'prod-steel',
              quantity: 20,
              uom: products[0]?.uom || 'KG',
              notes: 'Commercial delivery batch'
            });
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Delivery Order</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['all', 'READY', 'WAITING', 'DRAFT', 'DONE'].map((st) => (
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

      {/* Deliveries Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Delivery #</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Warehouse</th>
                <th className="py-2.5 px-4">Source Location</th>
                <th className="py-2.5 px-4">Items / Qty</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {deliveries.map(del => {
                let statusBadge = 'bg-slate-100 text-slate-700';
                if (del.status === 'DONE') statusBadge = 'bg-emerald-100 text-emerald-800';
                if (del.status === 'READY') statusBadge = 'bg-purple-100 text-purple-800';
                if (del.status === 'WAITING') statusBadge = 'bg-amber-100 text-amber-800';

                return (
                  <tr key={del.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{del.reference}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{del.customer}</td>
                    <td className="py-3 px-4 text-slate-600">{del.warehouseName}</td>
                    <td className="py-3 px-4 text-slate-600">{del.sourceLocationName}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{del.productName}: </span>
                      <strong className="font-mono text-purple-700">-{del.quantity} {del.uom}</strong>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{del.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge}`}>
                        {del.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {del.status === 'READY' && (
                        <button
                          onClick={() => handleValidateExisting(del.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold shadow-xs"
                        >
                          Validate Dispatch
                        </button>
                      )}
                      {del.status === 'DONE' && (
                        <span className="text-[11px] text-slate-400 italic">Dispatched</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Delivery Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-purple-600" />
                <span>Create New Delivery Order</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Manufacturing Co"
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
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
                  <label className="block font-semibold text-slate-700 mb-1">Source Location</label>
                  <select
                    value={formData.sourceLocationId}
                    onChange={(e) => setFormData({ ...formData, sourceLocationId: e.target.value })}
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

              {/* Available Stock Indicator Box */}
              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                isInsufficient ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center gap-1.5">
                  {isInsufficient && <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                  <span>Available Stock at Source:</span>
                </div>
                <span className="font-mono font-bold text-sm">
                  {availableStock} {formData.uom}
                </span>
              </div>

              {isInsufficient && (
                <div className="text-[11px] font-bold text-rose-600 bg-rose-100/60 p-2 rounded">
                  Insufficient stock available. Order exceeds available source balance.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dispatch Quantity *</label>
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
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                Validate Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
