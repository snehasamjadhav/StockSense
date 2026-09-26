import React, { useState, useEffect } from 'react';
import {
  Plus,
  ArrowLeftRight,
  X,
  AlertTriangle,
  Layers,
  Printer,
  Download,
  Search,
  Check,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronDown,
  ChevronRight,
  Navigation
} from 'lucide-react';
import { mockDocumentService } from '../services/mockDocumentService.js';
import { mockInventoryService } from '../services/mockInventoryService.js';
import { exportToCSV } from '../utils/exportUtils.js';
import { DocumentPrintModal } from '../components/DocumentPrintModal.jsx';

export const TransfersView = ({ onShowToast }) => {
  const [transfers, setTransfers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [routeTypeFilter, setRouteTypeFilter] = useState('all'); // 'all' | 'DIRECT' | 'MULTI_STEP'
  const [tableDensity, setTableDensity] = useState('comfortable');
  const [showModal, setShowModal] = useState(false);
  const [printDoc, setPrintDoc] = useState(null);
  const [expandedTransferId, setExpandedTransferId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    routeType: 'DIRECT',
    sourceWarehouseId: 'wh-main',
    sourceLocationId: 'loc-rec',
    destWarehouseId: 'wh-main',
    destLocationId: 'loc-rack-a',
    productId: 'prod-steel',
    quantity: 25,
    uom: 'KG',
    carrier: 'Apex Logistics Freight Line (Truck #FL-108)',
    notes: 'Inter-warehouse supply transfer'
  });

  const products = mockInventoryService.getProducts();
  const warehouses = mockInventoryService.getWarehouses();
  const sourceLocations = mockInventoryService.getLocations(formData.sourceWarehouseId);
  const destLocations = mockInventoryService.getLocations(formData.destWarehouseId);

  const availableAtSource = mockInventoryService.getLocationStock(formData.productId, formData.sourceLocationId);
  const isInsufficient = formData.quantity > availableAtSource;

  const loadData = () => {
    setTransfers(mockDocumentService.getTransfers({ routeType: routeTypeFilter }));
  };

  useEffect(() => {
    loadData();
    const unsub = mockInventoryService.subscribe(() => loadData());
    return () => unsub();
  }, [routeTypeFilter]);

  const handleExecuteAction = (tr) => {
    try {
      if (tr.routeType === 'MULTI_STEP') {
        const updated = mockDocumentService.advanceMultiStepTransfer(tr.id);
        const legName = tr.currentStep === 1 ? 'Dispatched to In-Transit Freight' :
                        tr.currentStep === 2 ? 'Intake Staged at Destination Dock' :
                        'Final Putaway Completed';
        onShowToast(`Multi-Step Route ${tr.reference}: ${legName}`, 'success');
      } else {
        const validated = mockDocumentService.validateTransfer(tr.id);
        onShowToast(`Direct Transfer ${validated.reference} Completed: Inventory moved instantly!`, 'success');
      }
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleCreate = () => {
    if (formData.sourceLocationId === formData.destLocationId && formData.sourceWarehouseId === formData.destWarehouseId) {
      onShowToast('Source and Destination locations must be different', 'error');
      return;
    }
    if (isInsufficient) {
      onShowToast(`Insufficient stock at source location. Required: ${formData.quantity}, Available: ${availableAtSource}`, 'error');
      return;
    }

    try {
      const transfer = mockDocumentService.createTransfer({
        ...formData
      });
      onShowToast(`Created ${transfer.routeType} Transfer ${transfer.reference}`, 'success');
      setShowModal(false);
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleExportCSV = () => {
    const columns = [
      { key: 'reference', label: 'Transfer Ref' },
      { key: 'routeType', label: 'Route Type' },
      { key: 'sourceWarehouseName', label: 'Source WH' },
      { key: 'sourceLocationName', label: 'Source Loc' },
      { key: 'destWarehouseName', label: 'Dest WH' },
      { key: 'destLocationName', label: 'Dest Loc' },
      { key: 'productName', label: 'Product' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'uom', label: 'UOM' },
      { key: 'carrier', label: 'Freight Carrier' },
      { key: 'trackingNumber', label: 'Tracking #' },
      { key: 'status', label: 'Status' },
      { key: 'date', label: 'Date' },
      { key: 'operator', label: 'Operator' }
    ];
    exportToCSV('Stock_Transfers_and_Routes', columns, filteredTransfers);
    onShowToast('Exported Transfers to CSV', 'info');
  };

  const filteredTransfers = transfers.filter(t => {
    const q = searchTerm.toLowerCase();
    return (
      t.reference.toLowerCase().includes(q) ||
      (t.productName && t.productName.toLowerCase().includes(q)) ||
      (t.sourceLocationName && t.sourceLocationName.toLowerCase().includes(q)) ||
      (t.destLocationName && t.destLocationName.toLowerCase().includes(q)) ||
      (t.carrier && t.carrier.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Internal Transfers & Routes</h1>
            <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Multi-Warehouse Routing Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct inter-bin relocations and 3-step multi-warehouse freight corridors (Dispatch $\rightarrow$ Transit $\rightarrow$ Staging $\rightarrow$ Putaway)
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
                routeType: 'MULTI_STEP',
                sourceWarehouseId: 'wh-main',
                sourceLocationId: 'loc-rack-a',
                destWarehouseId: 'wh-prod',
                destLocationId: 'loc-fg',
                productId: products[0]?.id || 'prod-steel',
                quantity: 25,
                uom: products[0]?.uom || 'KG',
                carrier: 'Apex Logistics Freight Line (Truck #FL-108)',
                notes: 'Multi-warehouse inter-facility supply transfer'
              });
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Transfer Route</span>
          </button>
        </div>
      </div>

      {/* Filter and Density Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        {/* Route Type Segmented Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          <button
            onClick={() => setRouteTypeFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              routeTypeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ALL ROUTES
          </button>
          <button
            onClick={() => setRouteTypeFilter('MULTI_STEP')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
              routeTypeFilter === 'MULTI_STEP'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>MULTI-STEP CORRIDORS</span>
          </button>
          <button
            onClick={() => setRouteTypeFilter('DIRECT')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              routeTypeFilter === 'DIRECT'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            DIRECT TRANSFERS
          </button>
        </div>

        {/* Search & Density Switcher */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search transfer #, carrier, product..."
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

      {/* Transfers Table with Stepper Rows */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Transfer #</th>
                <th className="py-2.5 px-4">Route Type</th>
                <th className="py-2.5 px-4">Origin</th>
                <th className="py-2.5 px-4">Destination</th>
                <th className="py-2.5 px-4">Items / Qty</th>
                <th className="py-2.5 px-4">Status & Step</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No transfers found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map(tr => {
                  const isMulti = tr.routeType === 'MULTI_STEP';
                  const isExpanded = expandedTransferId === tr.id;
                  let statusColor = 'text-slate-600 border-slate-200';
                  if (tr.status === 'DONE') statusColor = 'text-emerald-700 border-emerald-200 bg-emerald-50/50';
                  if (tr.status === 'IN_TRANSIT') statusColor = 'text-blue-700 border-blue-200 bg-blue-50/50';
                  if (tr.status === 'STAGED') statusColor = 'text-amber-700 border-amber-200 bg-amber-50/50';
                  if (tr.status === 'READY') statusColor = 'text-indigo-700 border-indigo-200 bg-indigo-50/50';

                  const rowPadding = tableDensity === 'compact' ? 'py-2' : 'py-3.5';

                  return (
                    <React.Fragment key={tr.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className={`${rowPadding} px-4 font-mono font-bold text-indigo-700 flex items-center gap-1.5`}>
                          {isMulti && (
                            <button
                              onClick={() => setExpandedTransferId(isExpanded ? null : tr.id)}
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                              title="Toggle route leg details"
                            >
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <span>{tr.reference}</span>
                        </td>

                        <td className={`${rowPadding} px-4`}>
                          {isMulti ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-200 bg-indigo-50/80 text-indigo-800">
                              <Truck className="w-3 h-3 text-indigo-600" />
                              Multi-Step (3 Legs)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200 bg-slate-50 text-slate-600">
                              <ArrowLeftRight className="w-3 h-3 text-slate-500" />
                              Direct (1 Leg)
                            </span>
                          )}
                        </td>

                        <td className={`${rowPadding} px-4`}>
                          <div className="font-semibold text-slate-900">{tr.sourceWarehouseName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{tr.sourceLocationName}</div>
                        </td>

                        <td className={`${rowPadding} px-4`}>
                          <div className="font-semibold text-slate-900">{tr.destWarehouseName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{tr.destLocationName}</div>
                        </td>

                        <td className={`${rowPadding} px-4`}>
                          <span className="font-medium text-slate-900">{tr.productName}: </span>
                          <strong className="font-mono text-slate-900 tabular-nums">{tr.quantity} {tr.uom}</strong>
                        </td>

                        <td className={`${rowPadding} px-4`}>
                          <div className="space-y-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                              {tr.status.replace('_', ' ')}
                            </span>
                            {isMulti && tr.status !== 'DONE' && (
                              <div className="text-[10px] font-mono text-slate-500">
                                Current Leg: {tr.currentStep} of 3
                              </div>
                            )}
                          </div>
                        </td>

                        <td className={`${rowPadding} px-4 text-right space-x-1.5 whitespace-nowrap`}>
                          <button
                            onClick={() => setPrintDoc(tr)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
                            title="Print Transfer Voucher"
                          >
                            <Printer className="w-3 h-3 inline mr-1" />
                            <span>Print</span>
                          </button>

                          {/* Stepper advancement or completion button */}
                          {tr.status !== 'DONE' ? (
                            <button
                              onClick={() => handleExecuteAction(tr)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold shadow-xs transition-colors inline-flex items-center gap-1"
                            >
                              {isMulti ? (
                                tr.currentStep === 1 ? '1. Dispatch Freight' :
                                tr.currentStep === 2 ? '2. Receive at Dock' :
                                '3. Complete Putaway'
                              ) : (
                                'Execute Transfer'
                              )}
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-medium inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Multi-Step Stepper Drawer */}
                      {isMulti && isExpanded && tr.steps && (
                        <tr className="bg-slate-50/70 border-b border-slate-200">
                          <td colSpan="7" className="p-4 pl-10 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-indigo-700" />
                                <span className="font-bold text-xs text-slate-900">
                                  Inter-Warehouse Multi-Step Logistics Corridor Stepper
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-500">
                                Carrier: <strong className="text-slate-800">{tr.carrier}</strong> · Tracking: <strong className="text-indigo-800">{tr.trackingNumber}</strong>
                              </div>
                            </div>

                            {/* 3-Leg Interactive Stepper */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {tr.steps.map((st) => {
                                const isCurrent = tr.currentStep === st.step && tr.status !== 'DONE';
                                const isDone = st.status === 'COMPLETED';

                                return (
                                  <div
                                    key={st.step}
                                    className={`p-3 rounded-lg border text-xs transition-all ${
                                      isDone
                                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                        : isCurrent
                                        ? 'bg-white border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                                        : 'bg-white/60 border-slate-200 text-slate-400 opacity-70'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[10px] font-bold uppercase tracking-wider">
                                        Leg {st.step} of 3
                                      </span>
                                      {isDone ? (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                          <CheckCircle2 className="w-3 h-3" /> Completed
                                        </span>
                                      ) : isCurrent ? (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 animate-pulse">
                                          <Clock className="w-3 h-3" /> Active Leg
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-slate-400">Pending</span>
                                      )}
                                    </div>

                                    <div className="font-bold text-slate-900 text-xs mb-1">
                                      {st.name}
                                    </div>
                                    <div className="text-[11px] text-slate-600 font-mono">
                                      {st.location}
                                    </div>

                                    {st.timestamp && (
                                      <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 font-mono flex justify-between">
                                        <span>{st.timestamp}</span>
                                        <span>By {st.operator}</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transfer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                <span>Configure Material Transfer Route</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Route Strategy Switcher */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Transfer Route Strategy</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, routeType: 'DIRECT' })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      formData.routeType === 'DIRECT'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Direct (1-Step)</span>
                    </div>
                    <p className="text-[10px] font-normal text-slate-500 mt-1">Instant internal relocation between local racks</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, routeType: 'MULTI_STEP' })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      formData.routeType === 'MULTI_STEP'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Multi-Step Route</span>
                    </div>
                    <p className="text-[10px] font-normal text-slate-500 mt-1">3 legs: Dispatch $\rightarrow$ Freight Transit $\rightarrow$ Dock $\rightarrow$ Putaway</p>
                  </button>
                </div>
              </div>

              {/* Product Selection */}
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

              {/* Source & Destination Warehouse Configuration */}
              <div className="grid grid-cols-2 gap-3">
                {/* Source Selection */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Origin Facility</div>
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-0.5">Warehouse</label>
                    <select
                      value={formData.sourceWarehouseId}
                      onChange={(e) => setFormData({ ...formData, sourceWarehouseId: e.target.value })}
                      className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-xs"
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-0.5">Source Rack / Bin</label>
                    <select
                      value={formData.sourceLocationId}
                      onChange={(e) => setFormData({ ...formData, sourceLocationId: e.target.value })}
                      className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-xs"
                    >
                      {sourceLocations.map(l => (
                        <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Destination Selection */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Target Destination</div>
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-0.5">Warehouse</label>
                    <select
                      value={formData.destWarehouseId}
                      onChange={(e) => setFormData({ ...formData, destWarehouseId: e.target.value })}
                      className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-xs"
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-0.5">Target Bin</label>
                    <select
                      value={formData.destLocationId}
                      onChange={(e) => setFormData({ ...formData, destLocationId: e.target.value })}
                      className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-xs"
                    >
                      {destLocations.map(l => (
                        <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Multi-Step Carrier Config */}
              {formData.routeType === 'MULTI_STEP' && (
                <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-indigo-900 block">Freight Carrier Logistics</span>
                  <div>
                    <label className="block text-slate-600 text-[10px] mb-0.5">Carrier / Vehicle Identification</label>
                    <input
                      type="text"
                      value={formData.carrier}
                      onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                      className="w-full px-2.5 py-1 text-xs border border-indigo-200 rounded bg-white"
                      placeholder="e.g. Apex Logistics Freight Line (Truck #FL-108)"
                    />
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transfer Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
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

              {/* Available Check */}
              <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                isInsufficient ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div>
                  <span className="font-semibold">Stock at Origin Bin: </span>
                  <span className="font-mono font-bold">{availableAtSource} {formData.uom}</span>
                </div>
                {isInsufficient ? (
                  <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Insufficient Stock
                  </span>
                ) : (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Sufficient
                  </span>
                )}
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
                disabled={isInsufficient || (formData.sourceLocationId === formData.destLocationId && formData.sourceWarehouseId === formData.destWarehouseId)}
                onClick={handleCreate}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-semibold transition-colors"
              >
                Create Transfer
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
          docType="TRANSFER"
        />
      )}
    </div>
  );
};
