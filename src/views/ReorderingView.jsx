import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { mockInventoryService } from '../services/mockInventoryService.js';
import { mockDocumentService } from '../services/mockDocumentService.js';

export const ReorderingView = ({ onShowToast }) => {
  const [products, setProducts] = useState([]);

  const loadData = () => {
    setProducts(mockInventoryService.getProducts());
  };

  useEffect(() => {
    loadData();
    const unsub = mockInventoryService.subscribe(() => loadData());
    return () => unsub();
  }, []);

  const handleReorder = (prod) => {
    try {
      const receipt = mockDocumentService.createReceipt({
        supplier: 'Priority Supplier Logistics',
        warehouseId: 'wh-main',
        destinationLocationId: 'loc-rec',
        productId: prod.id,
        quantity: prod.reorderQty,
        uom: prod.uom,
        status: 'READY',
        notes: `Automated reordering trigger for ${prod.name}`
      });
      onShowToast(`Created Replenishment Receipt ${receipt.reference} for ${prod.reorderQty} ${prod.uom} of ${prod.name}`, 'success');
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
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Reordering Rules</h1>
          <p className="text-xs text-slate-500 mt-0.5">Automated safety stock thresholds and replenishment triggers</p>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4">SKU</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Minimum</th>
                <th className="py-2.5 px-4">Maximum</th>
                <th className="py-2.5 px-4">Current Stock</th>
                <th className="py-2.5 px-4">Reorder Quantity</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {products.map(prod => {
                const isUnderstock = prod.stock <= prod.minStock;

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{prod.name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{prod.sku}</td>
                    <td className="py-3 px-4 text-slate-600">Main Warehouse / Rack A</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{prod.minStock} {prod.uom}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{prod.maxStock} {prod.uom}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {prod.stock} {prod.uom}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700">
                      +{prod.reorderQty} {prod.uom}
                    </td>
                    <td className="py-3 px-4">
                      {isUnderstock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" /> REORDER REQUIRED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> SUFFICIENT
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isUnderstock ? (
                        <button
                          onClick={() => handleReorder(prod)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold shadow-xs flex items-center gap-1 ml-auto"
                        >
                          <Plus className="w-3 h-3" /> Reorder
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReorder(prod)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-medium"
                        >
                          Replenish
                        </button>
                      )}
                    </td>
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
