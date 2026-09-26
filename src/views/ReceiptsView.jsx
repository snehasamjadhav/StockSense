import React, { useState, useEffect } from 'react';
import {
  Plus,
  Check,
  X,
  ArrowDownLeft,
  Filter,
  AlertCircle,
  Clock,
  Printer,
  Download,
  Search,
  CheckCircle2
} from 'lucide-react';
import { mockDocumentService } from '../services/mockDocumentService.js';
import { mockInventoryService } from '../services/mockInventoryService.js';
import { exportToCSV } from '../utils/exportUtils.js';
import { DocumentPrintModal } from '../components/DocumentPrintModal.jsx';

export const ReceiptsView = ({ onShowToast }) => {
  const [receipts, setReceipts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tableDensity, setTableDensity] = useState('comfortable'); // 'comfortable' | 'compact'
  const [showModal, setShowModal] = useState(false);
  const [printDoc, setPrintDoc] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    supplier: '',
    warehouseId: 'wh-main',
    destinationLocationId: 'loc-rec',
    productId: '',
    quantity: 100,
    uom: 'KG',
    notes: '',
    status: 'READY'
  });

  const products = mockInventoryService.getProducts();
  const warehouses = mockInventoryService.getWarehouses();
  const locations = mockInventoryService.getLocations('wh-main');

  const loadData = () => {
    setReceipts(mockDocumentService.getReceipts({ status: statusFilter }));
  };

  useEffect(() => {
    loadData();
    const unsub = mockInventoryService.subscribe(() => loadData());
    return () => unsub();
  }, [statusFilter]);

  const handleCreate = (statusToSet = 'READY') => {
    if (!formData.supplier || !formData.productId || !formData.quantity) {
      onShowToast('Supplier, Product, and Quantity are required', 'error');
      return;
    }

    try {
      const receipt = mockDocumentService.createReceipt({
        ...formData,
        status: statusToSet
      });
      onShowToast(`Created Receipt ${receipt.reference} (${statusToSet})`, 'success');
      setShowModal(false);
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleValidate = (id) => {
    try {
      const validated = mockDocumentService.validateReceipt(id);
      onShowToast(`Validated ${validated.reference}: Stock ledger updated and inventory received.`, 'success');
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleMarkReady = (id) => {
    try {
      mockDocumentService.updateReceiptStatus(id, 'READY');
      onShowToast('Receipt status set to READY', 'info');
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleCancel = (id) => {
    try {
      mockDocumentService.updateReceiptStatus(id, 'CANCELED');
      onShowToast('Receipt order canceled', 'info');
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleExportCSV = () => {
    const columns = [
      { key: 'reference', label: 'Receipt Ref' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'warehouseName', label: 'Warehouse' },
      { key: 'destinationName', label: 'Destination' },
      { key: 'productName', label: 'Product' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'uom', label: 'UOM' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
      { key: 'operator', label: 'Operator' }
    ];
    exportToCSV('Inbound_Receipts', columns, filteredReceipts);
    onShowToast('Exported Receipts to CSV', 'info');
  };

  const filteredReceipts = receipts.filter(r => {
    const q = searchTerm.toLowerCase();
    return (
      r.reference.toLowerCase().includes(q) ||
      r.supplier.toLowerCase().includes(q) ||
      (r.productName && r.productName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Inbound Receipts</h1>
            <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Goods Receipt Notes (GRN)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Supplier shipments, intake verification, and document-driven receiving ledger entries
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
                supplier: 'Global Metallics Ltd',
                warehouseId: 'wh-main',
                destinationLocationId: 'loc-rec',
                productId: products[0]?.id || 'prod-steel',
                quantity: 100,
                uom: products[0]?.uom || 'KG',
                notes: 'Inbound PO verification batch',
                status: 'READY'
              });
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Receipt</span>
          </button>
        </div>
      </div>

      {/* Filter and Density Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        {/* Status Segmented Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {['all', 'READY', 'WAITING', 'DRAFT', 'DONE', 'CANCELED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search & Density Switcher */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search receipt #, supplier, product..."
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

      {/* Receipts Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Receipt #</th>
                <th className="py-2.5 px-4">Supplier</th>
                <th className="py-2.5 px-4">Warehouse</th>
                <th className="py-2.5 px-4">Destination</th>
                <th className="py-2.5 px-4">Items / Qty</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No inbound receipts found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map(rec => {
                  let statusColor = 'text-slate-600 border-slate-200';
                  if (rec.status === 'DONE') statusColor = 'text-emerald-700 border-emerald-200 bg-emerald-50/50';
                  if (rec.status === 'READY') statusColor = 'text-blue-700 border-blue-200 bg-blue-50/50';
                  if (rec.status === 'WAITING') statusColor = 'text-amber-700 border-amber-200 bg-amber-50/50';
                  if (rec.status === 'CANCELED') statusColor = 'text-rose-700 border-rose-200 bg-rose-50/50';

                  const rowPadding = tableDensity === 'compact' ? 'py-1.5' : 'py-3';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className={`${rowPadding} px-4 font-mono font-bold text-indigo-700`}>{rec.reference}</td>
                      <td className={`${rowPadding} px-4 font-semibold text-slate-900`}>{rec.supplier}</td>
                      <td className={`${rowPadding} px-4 text-slate-600`}>{rec.warehouseName}</td>
                      <td className={`${rowPadding} px-4 text-slate-600`}>{rec.destinationName}</td>
                      <td className={`${rowPadding} px-4`}>
                        <span className="font-medium text-slate-900">{rec.productName}: </span>
                        <strong className="font-mono text-slate-900 tabular-nums">+{rec.quantity} {rec.uom}</strong>
                      </td>
                      <td className={`${rowPadding} px-4 text-slate-500 font-mono text-[11px] tabular-nums`}>{rec.date}</td>
                      <td className={`${rowPadding} px-4`}>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className={`${rowPadding} px-4 text-right space-x-1.5 whitespace-nowrap`}>
                        {/* Print Document Slip */}
                        <button
                          onClick={() => setPrintDoc(rec)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
                          title="Print Goods Receipt Note (GRN)"
                        >
                          <Printer className="w-3 h-3 inline mr-1" />
                          <span>Print</span>
                        </button>

                        {rec.status === 'DRAFT' && (
                          <button
                            onClick={() => handleMarkReady(rec.id)}
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold transition-colors"
                          >
                            Mark Ready
                          </button>
                        )}
                        {(rec.status === 'READY' || rec.status === 'WAITING') && (
                          <button
                            onClick={() => handleValidate(rec.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold shadow-xs transition-colors"
                          >
                            Validate Intake
                          </button>
                        )}
                        {rec.status !== 'DONE' && rec.status !== 'CANCELED' && (
                          <button
                            onClick={() => handleCancel(rec.id)}
                            className="px-2 py-1 text-slate-400 hover:text-rose-600 text-[11px] transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        {rec.status === 'DONE' && (
                          <span className="text-[11px] text-emerald-700 font-medium">Posted</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Receipt Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-indigo-600" />
                <span>Create New Inbound Receipt</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supplier Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Global Metallics Ltd"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
                />
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
                  <label className="block font-semibold text-slate-700 mb-1">Destination Location</label>
                  <select
                    value={formData.destinationLocationId}
                    onChange={(e) => setFormData({ ...formData, destinationLocationId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Item *</label>
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
                  className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Intake Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    disabled
                    value={formData.uom}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded bg-slate-50 text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Notes / PO Ref</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Inbound shipment verified via PO-4481"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreate('DRAFT')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleCreate('READY')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
              >
                Create Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Document Modal */}
      {printDoc && (
        <DocumentPrintModal
          isOpen={Boolean(printDoc)}
          onClose={() => setPrintDoc(null)}
          document={printDoc}
          docType="RECEIPT"
        />
      )}
    </div>
  );
};
