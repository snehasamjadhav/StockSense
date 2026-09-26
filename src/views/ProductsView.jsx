import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Eye,
  X,
  AlertCircle,
  PackageCheck,
  CheckCircle2
} from 'lucide-react';
import { mockInventoryService } from '../services/mockInventoryService.js';

export const ProductsView = ({ onShowToast }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    uom: 'PCS',
    unitCost: 10,
    minStock: 10,
    maxStock: 100,
    reorderQty: 50,
    description: ''
  });

  const loadData = () => {
    setProducts(mockInventoryService.getProducts({ search, categoryId: selectedCategory }));
    setCategories(mockInventoryService.getCategories());
  };

  useEffect(() => {
    loadData();
    const unsub = mockInventoryService.subscribe(() => loadData());
    return () => unsub();
  }, [search, selectedCategory]);

  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      onShowToast('Product Name and SKU are required', 'error');
      return;
    }
    try {
      const created = mockInventoryService.addProduct({
        ...formData,
        categoryId: formData.categoryId || categories[0]?.id
      });
      onShowToast(`Created product ${created.name} (${created.sku})`, 'success');
      setShowNewModal(false);
      setFormData({
        name: '',
        sku: '',
        categoryId: categories[0]?.id || '',
        uom: 'PCS',
        unitCost: 10,
        minStock: 10,
        maxStock: 100,
        reorderQty: 50,
        description: ''
      });
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
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Products Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">Master product index with real-time on-hand balances</p>
        </div>
        <button
          onClick={() => {
            setFormData(prev => ({ ...prev, categoryId: categories[0]?.id || '' }));
            setShowNewModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent border-none focus:outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.count})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4">SKU</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Stock</th>
                <th className="py-2.5 px-4">Available</th>
                <th className="py-2.5 px-4">Reorder Level</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {products.map(prod => {
                let statusBadge = 'bg-emerald-100 text-emerald-800';
                if (prod.status === 'LOW_STOCK') statusBadge = 'bg-amber-100 text-amber-800';
                if (prod.status === 'OUT_OF_STOCK') statusBadge = 'bg-rose-100 text-rose-800';

                return (
                  <tr
                    key={prod.id}
                    onClick={() => setSelectedProduct(prod)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900">{prod.name}</td>
                    <td className="py-3 px-4 font-mono text-indigo-700 font-bold">{prod.sku}</td>
                    <td className="py-3 px-4 text-slate-600">{prod.categoryName}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {prod.stock} <span className="text-slate-400 font-normal">{prod.uom}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {prod.available} <span className="text-slate-400 font-normal">{prod.uom}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {prod.minStock} {prod.uom}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge}`}>
                        {prod.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(prod);
                        }}
                        className="p-1 hover:text-indigo-600 rounded text-slate-400"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">{selectedProduct.name}</h3>
                <span className="font-mono text-xs text-indigo-600 font-bold">{selectedProduct.sku}</span>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Category</span>
                <div className="font-semibold text-slate-800">{selectedProduct.categoryName}</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Unit Cost</span>
                <div className="font-mono font-semibold text-slate-800">${selectedProduct.unitCost.toFixed(2)}</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Total On-Hand</span>
                <div className="font-mono font-bold text-indigo-700 text-sm">{selectedProduct.stock} {selectedProduct.uom}</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Min Threshold</span>
                <div className="font-mono font-semibold text-slate-800">{selectedProduct.minStock} {selectedProduct.uom}</div>
              </div>
            </div>

            {/* Location breakdown */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Location Balances</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {mockInventoryService.state.locations
                  .filter(l => l.warehouseId !== 'virtual')
                  .map(loc => {
                    const qty = mockInventoryService.getLocationStock(selectedProduct.id, loc.id);
                    return (
                      <div key={loc.id} className="flex justify-between items-center text-xs p-2 rounded bg-slate-50 border border-slate-100">
                        <span className="text-slate-700">{loc.name} ({loc.code})</span>
                        <span className="font-mono font-bold text-slate-900">{qty} {selectedProduct.uom}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Product Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <form
            onSubmit={handleCreateProduct}
            className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Create New Catalog Product</h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Copper Wire Spool"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CPR-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UoM</label>
                  <select
                    value={formData.uom}
                    onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="PCS">PCS</option>
                    <option value="KG">KG</option>
                    <option value="MTR">MTR</option>
                    <option value="BOX">BOX</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
