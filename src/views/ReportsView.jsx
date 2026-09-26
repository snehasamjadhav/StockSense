import React, { useState } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Download, Package } from 'lucide-react';
import { mockInventoryService } from '../services/mockInventoryService.js';

export const ReportsView = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState('valuation');
  const products = mockInventoryService.getProducts();
  const totalValue = products.reduce((acc, p) => acc + (p.stock * p.unitCost), 0);
  const lowStockItems = products.filter(p => p.stock <= p.minStock);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Analytical Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">Inventory valuation, turnover velocity, and replenishment telemetry</p>
        </div>

        <div className="flex items-center bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('valuation')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'valuation' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inventory Valuation
          </button>
          <button
            onClick={() => setActiveTab('low-stock')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'low-stock' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Low Stock Critical ({lowStockItems.length})
          </button>
        </div>
      </div>

      {activeTab === 'valuation' ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Total Asset Valuation</span>
              <div className="text-2xl font-bold font-mono text-emerald-950 mt-1">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <button
              onClick={() => onShowToast && onShowToast('Exported Valuation Report to CSV', 'success')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
            >
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Product</th>
                  <th className="py-2.5 px-4">SKU</th>
                  <th className="py-2.5 px-4">On-Hand Stock</th>
                  <th className="py-2.5 px-4">Unit Cost</th>
                  <th className="py-2.5 px-4">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map(p => {
                  const val = p.stock * p.unitCost;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-indigo-700 font-bold">{p.sku}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.stock} {p.uom}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">${p.unitCost.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Critical Reorder Required</span>
                <p className="text-xs text-amber-700 mt-0.5">{lowStockItems.length} products currently at or below minimum threshold</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Product</th>
                  <th className="py-2.5 px-4">SKU</th>
                  <th className="py-2.5 px-4">Current Stock</th>
                  <th className="py-2.5 px-4">Safety Minimum</th>
                  <th className="py-2.5 px-4">Deficit / Reorder Qty</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {lowStockItems.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 font-mono text-indigo-700 font-bold">{p.sku}</td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">{p.stock} {p.uom}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.minStock} {p.uom}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">+{p.reorderQty} {p.uom}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {p.stock === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
