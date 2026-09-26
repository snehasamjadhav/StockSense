import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Product, ProductCategory } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Archive,
  RefreshCw,
  AlertTriangle,
  X,
  Boxes
} from 'lucide-react';

interface ProductsViewProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ onShowToast }) => {
  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'INVENTORY_MANAGER']);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formUom, setFormUom] = useState('Units');
  const [formCostPrice, setFormCostPrice] = useState('0');
  const [formSellingPrice, setFormSellingPrice] = useState('0');
  const [formWeight, setFormWeight] = useState('0');
  const [formReorderLevel, setFormReorderLevel] = useState('20');
  const [formReorderQuantity, setFormReorderQuantity] = useState('50');
  const [formActive, setFormActive] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        api.getProducts({
          search: search || undefined,
          category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }),
        api.getCategories()
      ]);
      setProducts(prodData);
      setCategories(catData);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku('');
    setFormBarcode(`BC-${Date.now().toString().slice(-6)}`);
    setFormDescription('');
    setFormCategory(categories[0]?.id || '');
    setFormUom('Units');
    setFormCostPrice('10');
    setFormSellingPrice('20');
    setFormWeight('1');
    setFormReorderLevel('25');
    setFormReorderQuantity('50');
    setFormActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormBarcode(p.barcode || '');
    setFormDescription(p.description || '');
    setFormCategory(p.category_id);
    setFormUom(p.unit_of_measure);
    setFormCostPrice(p.cost_price.toString());
    setFormSellingPrice(p.selling_price.toString());
    setFormWeight(p.weight.toString());
    setFormReorderLevel(p.reorder_level.toString());
    setFormReorderQuantity(p.reorder_quantity.toString());
    setFormActive(p.active);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formName,
        sku: formSku,
        barcode: formBarcode,
        description: formDescription,
        category_id: formCategory,
        unit_of_measure: formUom,
        cost_price: parseFloat(formCostPrice) || 0,
        selling_price: parseFloat(formSellingPrice) || 0,
        weight: parseFloat(formWeight) || 0,
        reorder_level: parseInt(formReorderLevel) || 0,
        reorder_quantity: parseInt(formReorderQuantity) || 0,
        active: formActive
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        onShowToast(`Updated product ${payload.sku}`, 'success');
      } else {
        await api.createProduct(payload);
        onShowToast(`Created new product ${payload.sku}`, 'success');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      onShowToast(err.message || 'Error saving product', 'error');
    }
  };

  const handleDeleteOrArchive = async (p: Product) => {
    if (!window.confirm(`Are you sure you want to deactivate or remove product ${p.sku}?`)) return;

    try {
      const res = await api.deleteProduct(p.id);
      onShowToast(res.message, 'info');
      fetchProducts();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to archive product', 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Products Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Master SKU catalog, Unit of Measure (UoM), dynamic stock positions, and reorder levels.
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Product</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by SKU, barcode, name, or description..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="archived">Archived Only</option>
          </select>

          <button
            onClick={fetchProducts}
            title="Refresh List"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 select-none">
              <tr>
                <th className="py-3 px-4 font-semibold">SKU / Item</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">UoM</th>
                <th className="py-3 px-4 font-semibold text-right">Cost Price</th>
                <th className="py-3 px-4 font-semibold text-right">Selling Price</th>
                <th className="py-3 px-4 font-semibold text-right">On-Hand</th>
                <th className="py-3 px-4 font-semibold text-right">Incoming</th>
                <th className="py-3 px-4 font-semibold text-right">Outgoing</th>
                <th className="py-3 px-4 font-semibold text-right">Forecast</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                {canManage && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
                    Loading products catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No products found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                products.map(p => {
                  const onHand = p.on_hand ?? 0;
                  const isLow = onHand <= p.reorder_level;
                  const isOut = onHand === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-bold text-slate-700">{p.sku}</span>
                          {p.barcode && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span>{p.barcode}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {p.category_name || 'General'}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {p.unit_of_measure}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        ${p.cost_price.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        ${p.selling_price.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                        <span className={isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}>
                          {onHand}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-blue-600 font-medium">
                        {p.incoming ? `+${p.incoming}` : '0'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500 font-medium">
                        {p.outgoing ? `-${p.outgoing}` : '0'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-800">
                        {p.forecast ?? onHand}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {!p.active ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                            Archived
                          </span>
                        ) : isOut ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Low Stock (≤{p.reorder_level})
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Available
                          </span>
                        )}
                      </td>

                      {canManage && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(p)}
                              title="Edit product specification"
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrArchive(p)}
                              title="Archive product (preserves ledger history)"
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingProduct ? `Edit Product: ${editingProduct.sku}` : 'Create Enterprise Master Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. NEMA Stepper Motor"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Master SKU * (Unique)</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={e => setFormSku(e.target.value)}
                    placeholder="e.g. MTR-STP-02"
                    className="w-full px-3 py-2 font-mono uppercase border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Barcode / UPC</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={e => setFormBarcode(e.target.value)}
                    placeholder="793573..."
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Product Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unit of Measure (UoM)</label>
                  <select
                    value={formUom}
                    onChange={e => setFormUom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Units">Units (Count)</option>
                    <option value="Kg">Kilograms (Kg)</option>
                    <option value="Meters">Meters (M)</option>
                    <option value="Liters">Liters (L)</option>
                    <option value="Boxes">Standard Box</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unit Weight (Kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formWeight}
                    onChange={e => setFormWeight(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCostPrice}
                    onChange={e => setFormCostPrice(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formSellingPrice}
                    onChange={e => setFormSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Reorder Point Threshold (Min Qty)</label>
                  <input
                    type="number"
                    value={formReorderLevel}
                    onChange={e => setFormReorderLevel(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Standard Reorder Quantity (Batch)</label>
                  <input
                    type="number"
                    value={formReorderQuantity}
                    onChange={e => setFormReorderQuantity(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Item Description / Technical Specs</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Technical specifications, batch handling notes..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {editingProduct && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="productActiveToggle"
                    checked={formActive}
                    onChange={e => setFormActive(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="productActiveToggle" className="font-medium text-slate-700">
                    Product is Active in Inventory Catalog
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition-colors cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
