import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { DeliveryOrder, Product, Warehouse, Location } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ArrowUpRight,
  Plus,
  CheckCircle2,
  RefreshCw,
  Eye,
  X,
  Trash2,
  Truck,
  AlertTriangle,
  FileCheck2
} from 'lucide-react';

interface DeliveriesViewProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigate: (viewId: string) => void;
}

export const DeliveriesView: React.FC<DeliveriesViewProps> = ({ onShowToast, onNavigate }) => {
  const { hasRole } = useAuth();
  const canOperate = hasRole(['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF']);

  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Array<{ product_id: string; demanded_qty: number; unit_price: number }>>([]);

  // Detail Modal
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const [delData, prodData, whData, locData] = await Promise.all([
        api.getDeliveries({ status: statusFilter !== 'all' ? statusFilter : undefined }),
        api.getProducts(),
        api.getWarehouses(),
        api.getLocations({ type: 'internal' })
      ]);
      setDeliveries(delData);
      setProducts(prodData);
      setWarehouses(whData);
      setLocations(locData);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch deliveries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter]);

  const openCreateModal = () => {
    const defaultWh = warehouses[0]?.id || '';
    const defaultLoc = locations.find(l => l.warehouse_id === defaultWh)?.id || locations[0]?.id || '';
    setCustomerName('');
    setSourceWarehouseId(defaultWh);
    setSourceLocationId(defaultLoc);
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setLines([
      {
        product_id: products[0]?.id || '',
        demanded_qty: 10,
        unit_price: products[0]?.selling_price || 0
      }
    ]);
    setIsCreateOpen(true);
  };

  const handleWarehouseChange = (whId: string) => {
    setSourceWarehouseId(whId);
    const loc = locations.find(l => l.warehouse_id === whId)?.id || '';
    setSourceLocationId(loc);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        product_id: products[0]?.id || '',
        demanded_qty: 5,
        unit_price: products[0]?.selling_price || 0
      }
    ]);
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: string, value: any) => {
    const copy = [...lines];
    copy[idx] = { ...copy[idx], [field]: value };
    if (field === 'product_id') {
      const p = products.find(prod => prod.id === value);
      if (p) copy[idx].unit_price = p.selling_price;
    }
    setLines(copy);
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      onShowToast('Please add at least one line item', 'error');
      return;
    }

    try {
      const res = await api.createDelivery({
        customer_name: customerName,
        source_warehouse_id: sourceWarehouseId,
        source_location_id: sourceLocationId,
        scheduled_date: new Date(scheduledDate).toISOString(),
        notes,
        lines
      });

      onShowToast(`Delivery order ${res.reference} registered`, 'success');
      setIsCreateOpen(false);
      fetchDeliveries();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to create delivery order', 'error');
    }
  };

  const handleValidateDelivery = async (delivery: DeliveryOrder) => {
    setValidatingId(delivery.id);
    try {
      const res = await api.validateDelivery(delivery.id);
      onShowToast(`Delivery ${delivery.reference} shipped! Stock Ledger debited (-OUT).`, 'success');
      if (selectedDelivery?.id === delivery.id) {
        setSelectedDelivery(res.delivery);
      }
      fetchDeliveries();
    } catch (err: any) {
      const details = err.details?.join('; ');
      onShowToast(`${err.message}${details ? `: ${details}` : ''}`, 'error');
    } finally {
      setValidatingId(null);
    }
  };

  const viewDetails = async (id: string) => {
    try {
      const full = await api.getDelivery(id);
      setSelectedDelivery(full);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load details', 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Delivery Orders (Outbound Shipments)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer shipments with real-time stock allocation checks. Validation writes -OUT entries to the centralized stock ledger.
          </p>
        </div>

        {canOperate && (
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Delivery Order</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-600">Filter Status:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
            {['all', 'READY', 'DONE'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 font-medium rounded transition-colors cursor-pointer capitalize ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'all' ? 'All Deliveries' : status}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={fetchDeliveries}
          title="Refresh Deliveries"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 select-none">
            <tr>
              <th className="py-3 px-4 font-semibold">Reference</th>
              <th className="py-3 px-4 font-semibold">Customer / Destination</th>
              <th className="py-3 px-4 font-semibold">Source Location</th>
              <th className="py-3 px-4 font-semibold text-right">Items Demand</th>
              <th className="py-3 px-4 font-semibold text-right">Order Value</th>
              <th className="py-3 px-4 font-semibold">Ship Date</th>
              <th className="py-3 px-4 font-semibold text-center">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Workflow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && deliveries.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
                  Loading delivery orders...
                </td>
              </tr>
            ) : deliveries.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No delivery orders found.
                </td>
              </tr>
            ) : (
              deliveries.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {d.reference}
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-800">
                    {d.customer_name}
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    <div>{d.source_warehouse_name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{d.source_location_name}</div>
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {d.total_items}
                  </td>

                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    ${d.total_value ? d.total_value.toFixed(2) : '0.00'}
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-500">
                    {new Date(d.scheduled_date).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {d.status === 'DONE' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Shipped (Done)
                      </span>
                    ) : d.status === 'READY' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Ready to Ship
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Draft
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => viewDetails(d.id)}
                        title="Inspect Delivery Lines"
                        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {d.status !== 'DONE' && canOperate && (
                        <button
                          onClick={() => handleValidateDelivery(d)}
                          disabled={validatingId === d.id}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        >
                          <Truck className="w-3 h-3" />
                          <span>{validatingId === d.id ? 'Shipping...' : 'Validate & Ship'}</span>
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

      {/* Inspect Delivery Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>Delivery Order: {selectedDelivery.reference}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                    selectedDelivery.status === 'DONE' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedDelivery.status}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Customer: {selectedDelivery.customer_name}</p>
              </div>
              <button onClick={() => setSelectedDelivery(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400">Dispatch Location:</span>
                  <p className="font-semibold text-slate-800">{selectedDelivery.source_warehouse_name} / {selectedDelivery.source_location_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Scheduled Dispatch:</span>
                  <p className="font-semibold text-slate-800">{new Date(selectedDelivery.scheduled_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Line Items & Stock Availability Check</h4>
                <table className="w-full text-left border border-slate-100 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="py-2 px-3">Product SKU</th>
                      <th className="py-2 px-3 text-right">Demanded</th>
                      <th className="py-2 px-3 text-right">Available at Bay</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDelivery.lines.map((l: any) => {
                      const isShort = selectedDelivery.status !== 'DONE' && (l.available_stock_at_location ?? 0) < l.demanded_qty;
                      return (
                        <tr key={l.id}>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{l.product_name}</div>
                            <div className="font-mono text-slate-400 text-[11px]">{l.product_sku}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">{l.demanded_qty}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                            {selectedDelivery.status === 'DONE' ? (
                              <span className="text-emerald-600">Dispatched</span>
                            ) : (
                              <span className={isShort ? 'text-rose-600' : 'text-slate-700'}>
                                {l.available_stock_at_location ?? '—'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">${l.unit_price?.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                            ${((l.demanded_qty) * (l.unit_price || 0)).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onNavigate('stock-ledger')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Verify in Stock Ledger →
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDelivery(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  {selectedDelivery.status !== 'DONE' && canOperate && (
                    <button
                      type="button"
                      onClick={() => handleValidateDelivery(selectedDelivery)}
                      disabled={validatingId === selectedDelivery.id}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Validate & Dispatch</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Delivery Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">Create Outbound Delivery Order (Sales Order)</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Customer / Consignee *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="e.g. Vanguard Industrial Automation Ltd"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Scheduled Dispatch Date</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Dispatch Source Warehouse *</label>
                  <select
                    value={sourceWarehouseId}
                    onChange={e => handleWarehouseChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Pick Location / Bay *</label>
                  <select
                    value={sourceLocationId}
                    onChange={e => setSourceLocationId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {locations
                      .filter(l => !sourceWarehouseId || l.warehouse_id === sourceWarehouseId)
                      .map(l => (
                        <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Lines table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-800">Delivery Order Lines</label>
                  <button
                    type="button"
                    onClick={addLine}
                    className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded font-semibold transition-colors cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {lines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex-1">
                        <select
                          value={line.product_id}
                          onChange={e => updateLine(idx, 'product_id', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          required
                          value={line.demanded_qty}
                          onChange={e => updateLine(idx, 'demanded_qty', parseInt(e.target.value) || 1)}
                          placeholder="Qty"
                          className="w-full px-2 py-1.5 font-mono text-right border border-slate-300 rounded bg-white"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          value={line.unit_price}
                          onChange={e => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="Price"
                          className="w-full px-2 py-1.5 font-mono text-right border border-slate-300 rounded bg-white"
                        />
                      </div>

                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Shipping Notes / Order Ref</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Carrier instructions, customer PO, delivery docks..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition-colors cursor-pointer"
                >
                  Register Delivery Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
