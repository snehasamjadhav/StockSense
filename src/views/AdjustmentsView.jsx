import React, { useState, useEffect } from 'react';
import {
  Plus,
  ClipboardCheck,
  X,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Printer,
  Download,
  Search
} from 'lucide-react';
import { mockDocumentService } from '../services/mockDocumentService.js';
import { mockInventoryService } from '../services/mockInventoryService.js';
import { exportToCSV } from '../utils/exportUtils.js';
import { DocumentPrintModal } from '../components/DocumentPrintModal.jsx';

export const AdjustmentsView = ({ onShowToast }) => {
  const [adjustments, setAdjustments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableDensity, setTableDensity] = useState('comfortable');
  const [showModal, setShowModal] = useState(false);
  const [printDoc, setPrintDoc] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    productId: 'prod-steel',
    warehouseId: 'wh-main',
    locationId: 'loc-rack-a',
    physicalQty: 77,
    reason: 'Monthly physical inventory cycle count calibration'
  });

  const products = mockInventoryService.getProducts();
  const warehouses = mockInventoryService.getWarehouses();
  const locations = mockInventoryService.getLocations(formData.warehouseId);

  const currentSystemQty = mockInventoryService.getLocationStock(formData.productId, formData.locationId);
  const difference = Number(formData.physicalQty) - currentSystemQty;

  const loadData = () => {
    setAdjustments(mockDocumentService.getAdjustments());
  };

  useEffect(() => {
    loadData();
    const unsub = mockInventoryService.subscribe(() => loadData());
    return () => unsub();
  }, []);

  const handleValidateAdjustment = (e) => {
    e.preventDefault();
    try {
      const adj = mockDocumentService.createAdjustment(formData);
      onShowToast(`Posted Adjustment ${adj.reference}: Inventory updated to ${formData.physicalQty} (${difference > 0 ? '+' : ''}${difference}). Ledger entry created.`, 'success');
      setShowModal(false);
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleExportCSV = () => {
    const columns = [
      { key: 'reference', label: 'Adjustment Ref' },
      { key: 'productName', label: 'Product' },
      { key: 'warehouseName', label: 'Warehouse' },
      { key: 'locationName', label: 'Location' },
      { key: 'systemQty', label: 'System Qty' },
      { key: 'physicalQty', label: 'Physical Qty' },
      { key: 'difference', label: 'Difference' },
      { key: 'uom', label: 'UOM' },
      { key: 'reason', label: 'Audit Reason' },
      { key: 'date', label: 'Date' },
      { key: 'operator', label: 'Auditor' }
    ];
    exportToCSV('Inventory_Adjustments', columns, filteredAdjustments);
    onShowToast('Exported Adjustments to CSV', 'info');
  };

  const filteredAdjustments = adjustments.filter(a => {
    const q = searchTerm.toLowerCase();
    return (
      a.reference.toLowerCase().includes(q) ||
      (a.productName && a.productName.toLowerCase().includes(q)) ||
      (a.locationName && a.locationName.toLowerCase().includes(q)) ||
      (a.reason && a.reason.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Inventory Adjustments</h1>
            <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Cycle Count Reconciliations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical stocktaking reconciliation, shrinkage/damage accounting, and discrepancy ledger offset
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

          <button
            onClick={() => {
              setFormData({
                productId: products[0]?.id || 'prod-steel',
                warehouseId: 'wh-main',
                locationId: 'loc-rack-a',
                physicalQty: mockInventoryService.getLocationStock(products[0]?.id || 'prod-steel', 'loc-rack-a'),
                reason: 'Physical count audit reconciliation'
              });
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Adjustment</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search adjustment #, product, or reason..."
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

      {/* Adjustments Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Adjustment #</th>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4">Warehouse</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4 text-right">System Qty</th>
                <th className="py-2.5 px-4 text-right">Physical Qty</th>
                <th className="py-2.5 px-4 text-right">Difference</th>
                <th className="py-2.5 px-4">Audit Reason</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400">
                    No inventory adjustments recorded.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map(adj => {
                  const diffColor =
                    adj.difference > 0
                      ? 'text-emerald-700 font-bold'
                      : adj.difference < 0
                      ? 'text-rose-700 font-bold'
                      : 'text-slate-500';

                  const rowPadding = tableDensity === 'compact' ? 'py-1.5' : 'py-3';

                  return (
                    <tr key={adj.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className={`${rowPadding} px-4 font-mono font-bold text-indigo-700`}>{adj.reference}</td>
                      <td className={`${rowPadding} px-4 font-semibold text-slate-900`}>{adj.productName}</td>
                      <td className={`${rowPadding} px-4 text-slate-600`}>{adj.warehouseName}</td>
                      <td className={`${rowPadding} px-4 text-slate-600 font-mono`}>{adj.locationName}</td>
                      <td className={`${rowPadding} px-4 text-right font-mono text-slate-500 tabular-nums`}>{adj.systemQty} {adj.uom}</td>
                      <td className={`${rowPadding} px-4 text-right font-mono font-bold text-slate-900 tabular-nums`}>{adj.physicalQty} {adj.uom}</td>
                      <td className={`${rowPadding} px-4 text-right font-mono tabular-nums ${diffColor}`}>
                        {adj.difference > 0 ? `+${adj.difference}` : adj.difference} {adj.uom}
                      </td>
                      <td className={`${rowPadding} px-4 text-slate-600 text-[11px] max-w-xs truncate`}>{adj.reason}</td>
                      <td className={`${rowPadding} px-4 text-slate-500 font-mono text-[11px] tabular-nums`}>{adj.date}</td>
                      <td className={`${rowPadding} px-4 text-right`}>
                        <button
                          onClick={() => setPrintDoc(adj)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
                          title="Print Inventory Audit Discrepancy Slip"
                        >
                          <Printer className="w-3 h-3 inline mr-1" />
                          <span>Print Slip</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                <span>Record Inventory Adjustment</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleValidateAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Item *</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warehouse</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Calculation Cards */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">System Qty</div>
                  <div className="font-mono text-base font-bold text-slate-800 tabular-nums">{currentSystemQty}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Physical Qty</div>
                  <div className="font-mono text-base font-bold text-indigo-700 tabular-nums">{formData.physicalQty}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Difference</div>
                  <div className={`font-mono text-base font-bold tabular-nums ${
                    difference > 0 ? 'text-emerald-700' : difference < 0 ? 'text-rose-700' : 'text-slate-600'
                  }`}>
                    {difference > 0 ? `+${difference}` : difference}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Counted Quantity *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.physicalQty}
                  onChange={(e) => setFormData({ ...formData, physicalQty: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit / Discrepancy Reason *</label>
                <input
                  type="text"
                  placeholder="e.g. Broken packaging scrap or cycle count audit"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold transition-colors"
                >
                  Post Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Document Modal */}
      {printDoc && (
        <DocumentPrintModal
          isOpen={Boolean(printDoc)}
          onClose={() => setPrintDoc(null)}
          document={printDoc}
          docType="ADJUSTMENT"
        />
      )}
    </div>
  );
};
