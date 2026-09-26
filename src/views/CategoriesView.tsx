import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { ProductCategory } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Layers, Plus, Edit2, Trash2, X, RefreshCw, FolderTree, ArrowRight } from 'lucide-react';

interface CategoriesViewProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ onShowToast }) => {
  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'INVENTORY_MANAGER']);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormParentId('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: ProductCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormCode(cat.code);
    setFormDescription(cat.description || '');
    setFormParentId(cat.parent_category_id || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formName,
        code: formCode,
        description: formDescription,
        parent_category_id: formParentId || null
      };

      if (editingCategory) {
        await api.updateCategory(editingCategory.id, payload);
        onShowToast(`Category ${payload.name} updated`, 'success');
      } else {
        await api.createCategory(payload);
        onShowToast(`Created category ${payload.name}`, 'success');
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save category', 'error');
    }
  };

  const handleDelete = async (cat: ProductCategory) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    try {
      await api.deleteCategory(cat.id);
      onShowToast(`Category ${cat.name} removed`, 'info');
      fetchCategories();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete category', 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Product Categories</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Hierarchical category tree with circular dependency protection and SKU assignments.
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Category</span>
          </button>
        )}
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 select-none">
            <tr>
              <th className="py-3 px-4 font-semibold">Category Name</th>
              <th className="py-3 px-4 font-semibold">Code</th>
              <th className="py-3 px-4 font-semibold">Hierarchy / Parent</th>
              <th className="py-3 px-4 font-semibold">Description</th>
              <th className="py-3 px-4 font-semibold text-center">Assigned SKUs</th>
              {canManage && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
                  Loading categories hierarchy...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No categories defined.
                </td>
              </tr>
            ) : (
              categories.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-slate-400" />
                      <span>{cat.name}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-slate-700">
                    {cat.code}
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    {cat.parent_name ? (
                      <span className="flex items-center gap-1 text-slate-700">
                        <span className="text-slate-400">{cat.parent_name}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold text-indigo-700">{cat.name}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Top-Level Root</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                    {cat.description || '—'}
                  </td>

                  <td className="py-3 px-4 text-center font-mono font-medium text-slate-800">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {cat.product_count ?? 0}
                    </span>
                  </td>

                  {canManage && (
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(cat)}
                          title="Edit Category"
                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          title="Delete Category"
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingCategory ? 'Edit Product Category' : 'Create Product Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Industrial Automation"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Category Code *</label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={e => setFormCode(e.target.value)}
                  placeholder="e.g. IND-AUT"
                  className="w-full px-3 py-2 font-mono uppercase border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Parent Category (Optional)</label>
                <select
                  value={formParentId}
                  onChange={e => setFormParentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories
                    .filter(c => !editingCategory || c.id !== editingCategory.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Hierarchical tree structure. Circular references are prohibited.</p>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Scope of products classified under this category..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

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
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
