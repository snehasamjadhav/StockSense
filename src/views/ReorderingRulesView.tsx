import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { ReorderRule, Product, Warehouse } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Repeat, Plus, Trash2, Edit2, Play, RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-react';

interface ReorderingRulesViewProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigate: (viewId: string) => void;
}

export const ReorderingRulesView: React.FC<ReorderingRulesViewProps> = ({ onShowToast, onNavigate }) => {
  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'INVENTORY_MANAGER']);

  const [rules, setRules] = useState<ReorderRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReorderRule | null>(null);
  const [formProductId, setFormProductId] = useState('');
  const [formWarehouseId, setFormWarehouseId] = useState('');
  const [formMinQty, setFormMinQty] = useState('20');
  const [formMaxQty, setFormMaxQty] = useState('100');
  const [formReorderQty, setFormReorderQty] = useState('50');
  const [formAutoReceipt, setFormAutoReceipt] = useState(true);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const [rulesData, prodsData, whData] = await Promise.all([
        api.getReorderRules(),
        api.getProducts(),
        api.getWarehouses()
      ]);
      setRules(rulesData);
      setProducts(prodsData);
      setWarehouses(whData);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch reorder rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const openCreateModal = () => {
    setEditingRule(null);
    setFormProductId(products[0]?.id || '');
    setFormWarehouseId(warehouses[0]?.id || '');
    setFormMinQty('25');
    setFormMaxQty('100');
    setFormReorderQty('50');
    setFormAutoReceipt(true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        product_id: formProductId,
        warehouse_id: formWarehouseId,
        min_quantity: parseInt(formMinQty) || 0,
        max_quantity: parseInt(formMaxQty) || 0,
        reorder_quantity: parseInt(formReorderQty) || 0,
        auto_create_receipt: formAutoReceipt
      };

      if (editingRule) {
        await api.updateReorderRule(editingRule.id, payload);
        onShowToast('Reorder rule updated', 'success');
      } else {
        await api.createReorderRule(payload);
        onShowToast('Reorder rule established', 'success');
      }

      setIsModalOpen(false);
      fetchRules();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save reorder rule', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this automated reordering rule?')) return;
    try {
      await api.deleteReorderRule(id);
      onShowToast('Reorder rule removed', 'info');
      fetchRules();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete rule', 'error');
    }
  };

  const handleTriggerReplenishment = async (rule: ReorderRule) => {
    setProcessingId(rule.id);
    try {
      const res = await api.replenishProduct(rule.product_id);
      onShowToast(`Generated Replenishment Receipt ${res.receipt.reference}`, 'success');
      fetchRules();
    } catch (err: any) {
      onShowToast(err.message || 'Replenishment order creation failed', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reordering Rules (Min/Max Replenishment)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated stock replenishment thresholds. Triggers inbound receipts when on-hand inventory drops below minimums.
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Rule</span>
          </button>
        )}
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 select-none">
            <tr>
              <th className="py-3 px-4 font-semibold">Product SKU / Title</th>
              <th className="py-3 px-4 font-semibold">Warehouse</th>
              <th className="py-3 px-4 font-semibold text-right">Min Qty (Trigger)</th>
              <th className="py-3 px-4 font-semibold text-right">Max Qty</th>
              <th className="py-3 px-4 font-semibold text-right">Order Batch</th>
              <th className="py-3 px-4 font-semibold text-right">Current On-Hand</th>
              <th className="py-3 px-4 font-semibold text-center">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
                  Loading reordering rules...
                </td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No automated reordering rules configured.
                </td>
              </tr>
            ) : (
              rules.map(rule => (
                <tr key={rule.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div className="font-semibold text-slate-900">{rule.product_name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{rule.product_sku}</div>
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    {rule.warehouse_name}
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    {rule.min_quantity}
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    {rule.max_quantity}
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums text-indigo-700 font-semibold">
                    +{rule.reorder_quantity}
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold">
                    <span className={rule.is_triggered ? 'text-rose-600' : 'text-slate-800'}>
                      {rule.current_on_hand ?? 0}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    {rule.is_triggered ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="w-3 h-3" />
                        Triggered (Below Min)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" />
                        Optimal Stock
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleTriggerReplenishment(rule)}
                        disabled={processingId === rule.id}
                        title="Generate Intake PO Receipt Now"
                        className="px-2 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>Order PO</span>
                      </button>

                      {canManage && (
                        <button
                          onClick={() => handleDelete(rule.id)}
                          title="Delete rule"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
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
              <h3 className="font-bold text-slate-900 text-sm">Create Reordering Rule</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Product SKU</label>
                <select
                  value={formProductId}
                  onChange={e => setFormProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Warehouse</label>
                <select
                  value={formWarehouseId}
                  onChange={e => setFormWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Min Qty</label>
                  <input
                    type="number"
                    required
                    value={formMinQty}
                    onChange={e => setFormMinQty(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Max Qty</label>
                  <input
                    type="number"
                    required
                    value={formMaxQty}
                    onChange={e => setFormMaxQty(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Order Batch</label>
                  <input
                    type="number"
                    required
                    value={formReorderQty}
                    onChange={e => setFormReorderQty(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="autoReceiptCheck"
                  checked={formAutoReceipt}
                  onChange={e => setFormAutoReceipt(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="autoReceiptCheck" className="font-medium text-slate-700">
                  Allow automated draft PO receipt generation
                </label>
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
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
