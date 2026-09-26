import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Download,
  Search,
  ShoppingCart,
  ArrowDownLeft
} from 'lucide-react';
import { mockInventoryService } from '../services/mockInventoryService.js';
import { mockDocumentService } from '../services/mockDocumentService.js';
import { exportToCSV } from '../utils/exportUtils.js';

export const ReorderingView = ({ onShowToast }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'needs_reorder'
  const [tableDensity, setTableDensity] = useState('comfortable');

  const loadData = () => {
    setProducts(mockInventoryService.getProducts());
  };

  useEffect(() => {
    loadData();
    const unsub = mockInventoryService.subscribe(() => loadData());
    return () => unsub();
  }, []);

  const handleCreatePO = (prod) => {
    try {
      const po = mockDocumentService.createPurchaseOrder({
        supplier: 'Priority Supplier Logistics',
        warehouseId: 'wh-main',
        destinationLocationId: 'loc-rec',
        productId: prod.id,
        quantity: prod.reorderQty,
        uom: prod.uom,
        unitCost: prod.unitCost,
        status: 'CONFIRMED',
        notes: `Reorder rule trigger: Current stock (${prod.totalStock}) is below minimum (${prod.minStock})`
      });
      onShowToast(
        `Created Purchase Order ${po.reference} for ${prod.reorderQty} ${prod.uom} of ${prod.name}`,
        'success'
      );
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleFastIntake = (prod) => {
    try {
      const receipt = mockDocumentService.createReceipt({
        supplier: 'Priority Supplier Logistics',
        warehouseId: 'wh-main',
        destinationLocationId: 'loc-rec',
        productId: prod.id,
        quantity: prod.reorderQty,
        uom: prod.uom,
        status: 'READY',
        notes: `Immediate intake receipt from reorder trigger for ${prod.name}`
      });
      onShowToast(
        `Created Intake Receipt ${receipt.reference} for ${prod.reorderQty} ${prod.uom} of ${prod.name}`,
        'success'
      );
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleExportCSV = () => {
    const columns = [
      { key: 'name', label: 'Product Name' },
      { key: 'sku', label: 'SKU' },
      { key: 'categoryName', label: 'Category' },
      { key: 'minStock', label: 'Min Safety Stock' },
      { key: 'maxStock', label: 'Max Stock' },
      { key: 'totalStock', label: 'Current Stock' },
      { key: 'reorderQty', label: 'Reorder Quantity' },
      { key: 'uom', label: 'UOM' }
    ];
    exportToCSV('Reordering_Rules', columns, filteredProducts);
    onShowToast('Exported Reorder Rules to CSV', 'info');
  };

  const filteredProducts = products
    .map(p => ({
      ...p,
      totalStock: mockInventoryService.getProductTotalStock(p.id),
      needsReorder: mockInventoryService.getProductTotalStock(p.id) < p.minStock
    }))
    .filter(p => {
      if (filterMode === 'needs_reorder' && !p.needsReorder) return false;
      const q = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q))
      );
    });

  const criticalCount = products.filter(p => mockInventoryService.getProductTotalStock(p.id) < p.minStock).length;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Reordering Rules</h1>
            {criticalCount > 0 && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {criticalCount} Item{criticalCount > 1 ? 's' : ''} Under Threshold
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated safety stock thresholds, replenishment algorithms, and instant Purchase Order dispatch
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              filterMode === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setFilterMode('needs_reorder')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              filterMode === 'needs_reorder'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Reorder Required ({criticalCount})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search product or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-md focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center border border-slate-200 rounded-md p-0.5 text-[11px] text-slate-600">
            <button
              onClick={() => setTableDensity('comfortable')}
              className={`px-2 py-0.5 rounded ${tableDensity === 'comfortable' ? 'bg-slate-200 font-semibold text-slate-900' : 'hover:bg-slate-100'}`}
            >
              Comfortable
            </button>
            <button
              onClick={() => setTableDensity('compact')}
              className={`px-2 py-0.5 rounded ${tableDensity === 'compact' ? 'bg-slate-200 font-semibold text-slate-900' : 'hover:bg-slate-100'}`}
            >
              Compact
            </button>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4">SKU</th>
                <th className="py-2.5 px-4">Primary Warehouse</th>
                <th className="py-2.5 px-4 text-right">Min Safety Stock</th>
                <th className="py-2.5 px-4 text-right">Max Stock</th>
                <th className="py-2.5 px-4 text-right">Current On Hand</th>
                <th className="py-2.5 px-4 text-right">Reorder Qty</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Replenishment Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.map(prod => {
                const rowPadding = tableDensity === 'compact' ? 'py-1.5' : 'py-3';

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className={`${rowPadding} px-4 font-semibold text-slate-900`}>{prod.name}</td>
                    <td className={`${rowPadding} px-4 font-mono text-slate-600`}>{prod.sku}</td>
                    <td className={`${rowPadding} px-4 text-slate-600`}>Main Warehouse (Rack A)</td>
                    <td className={`${rowPadding} px-4 text-right font-mono text-slate-600 tabular-nums`}>{prod.minStock} {prod.uom}</td>
                    <td className={`${rowPadding} px-4 text-right font-mono text-slate-600 tabular-nums`}>{prod.maxStock} {prod.uom}</td>
                    <td className={`${rowPadding} px-4 text-right font-mono font-bold tabular-nums ${
                      prod.needsReorder ? 'text-amber-700' : 'text-slate-900'
                    }`}>
                      {prod.totalStock} {prod.uom}
                    </td>
                    <td className={`${rowPadding} px-4 text-right font-mono text-indigo-700 font-bold tabular-nums`}>
                      {prod.reorderQty} {prod.uom}
                    </td>
                    <td className={`${rowPadding} px-4`}>
                      {prod.needsReorder ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200 bg-amber-50 text-amber-800 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Reorder Required
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200 bg-slate-50 text-slate-600 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Optimal Level
                        </span>
                      )}
                    </td>
                    <td className={`${rowPadding} px-4 text-right space-x-1.5 whitespace-nowrap`}>
                      <button
                        onClick={() => handleCreatePO(prod)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold shadow-xs transition-colors"
                        title="Create formal Purchase Order to supplier"
                      >
                        <ShoppingCart className="w-3 h-3 inline mr-1" />
                        <span>Issue PO</span>
                      </button>

                      <button
                        onClick={() => handleFastIntake(prod)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
                        title="Direct Intake Receipt"
                      >
                        <ArrowDownLeft className="w-3 h-3 inline mr-1" />
                        <span>Direct Receipt</span>
                      </button>
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
