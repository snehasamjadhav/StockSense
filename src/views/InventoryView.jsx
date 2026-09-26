import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Layers, Building2, MapPin, Download } from 'lucide-react';
import { mockInventoryService } from '../services/mockInventoryService.js';
import { exportToCSV } from '../utils/exportUtils.js';

export const InventoryView = ({ onShowToast }) => {
  const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'by-location'
  const [items, setItems] = useState([]);
  const [byLocationTree, setByLocationTree] = useState([]);
  const [search, setSearch] = useState('');
  const [tableDensity, setTableDensity] = useState('comfortable');

  const loadData = () => {
    setItems(mockInventoryService.getStockOverview());
    setByLocationTree(mockInventoryService.getStockByLocation());
  };

  useEffect(() => {
    loadData();
    const unsub = mockInventoryService.subscribe(() => loadData());
    return () => unsub();
  }, []);

  const handleExportCSV = () => {
    const columns = [
      { key: 'productName', label: 'Product' },
      { key: 'sku', label: 'SKU' },
      { key: 'warehouseName', label: 'Warehouse' },
      { key: 'locationName', label: 'Location' },
      { key: 'onHand', label: 'On Hand' },
      { key: 'reserved', label: 'Reserved' },
      { key: 'available', label: 'Available' },
      { key: 'uom', label: 'UOM' },
      { key: 'minStock', label: 'Reorder Level' },
      { key: 'status', label: 'Status' }
    ];
    exportToCSV('Inventory_Overview', columns, filteredItems);
    if (onShowToast) onShowToast('Exported Inventory Overview to CSV', 'info');
  };

  const filteredItems = items.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.productName.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.warehouseName.toLowerCase().includes(q) ||
      item.locationName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Inventory Management</h1>
            <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Bin Allocation & Valuation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical location stock allocations, reserved orders, and real-time on-hand availability
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'overview' && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          )}

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'overview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stock Overview
            </button>
            <button
              onClick={() => setViewMode('by-location')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'by-location' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stock by Location Tree
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'overview' ? (
        <>
          {/* Toolbar */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search product, SKU, warehouse, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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

          {/* Overview Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Product</th>
                    <th className="py-2.5 px-4">SKU</th>
                    <th className="py-2.5 px-4">Warehouse</th>
                    <th className="py-2.5 px-4">Location</th>
                    <th className="py-2.5 px-4 text-right">On Hand</th>
                    <th className="py-2.5 px-4 text-right">Reserved</th>
                    <th className="py-2.5 px-4 text-right">Available</th>
                    <th className="py-2.5 px-4 text-right">Reorder Level</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredItems.map(row => {
                    let statusColor = 'text-emerald-700 border-emerald-200 bg-emerald-50/50';
                    if (row.status === 'LOW_STOCK') statusColor = 'text-amber-700 border-amber-200 bg-amber-50/50';
                    if (row.status === 'OUT_OF_STOCK') statusColor = 'text-rose-700 border-rose-200 bg-rose-50/50';

                    const rowPadding = tableDensity === 'compact' ? 'py-1.5' : 'py-3';

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className={`${rowPadding} px-4 font-semibold text-slate-900`}>{row.productName}</td>
                        <td className={`${rowPadding} px-4 font-mono font-bold text-indigo-700`}>{row.sku}</td>
                        <td className={`${rowPadding} px-4 text-slate-600`}>{row.warehouseName}</td>
                        <td className={`${rowPadding} px-4 text-slate-700 font-medium font-mono text-[11px]`}>{row.locationName}</td>
                        <td className={`${rowPadding} px-4 text-right font-mono font-bold text-slate-900 tabular-nums`}>{row.onHand} {row.uom}</td>
                        <td className={`${rowPadding} px-4 text-right font-mono text-slate-400 tabular-nums`}>{row.reserved} {row.uom}</td>
                        <td className={`${rowPadding} px-4 text-right font-mono font-bold text-indigo-600 tabular-nums`}>{row.available} {row.uom}</td>
                        <td className={`${rowPadding} px-4 text-right font-mono text-slate-500 tabular-nums`}>{row.minStock} {row.uom}</td>
                        <td className={`${rowPadding} px-4`}>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                            {row.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Stock by Location Tree View */
        <div className="space-y-6">
          {byLocationTree.map(wh => (
            <div key={wh.id} className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-sm text-slate-900">{wh.name} ({wh.code})</span>
                </div>
                <span className="text-xs text-slate-500">{wh.address}</span>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wh.locations.map(loc => (
                  <div key={loc.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-2">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{loc.name}</span>
                        </div>
                        <span className="text-[10px] font-mono uppercase bg-slate-200 px-1 rounded text-slate-600">
                          {loc.code}
                        </span>
                      </div>

                      <div className="space-y-1.5 min-h-[60px]">
                        {loc.products.length === 0 ? (
                          <div className="text-xs text-slate-400 italic py-2">Empty location rack</div>
                        ) : (
                          loc.products.map(p => (
                            <div key={p.productId} className="flex items-center justify-between text-xs">
                              <span className="text-slate-700 font-medium truncate max-w-[140px]">{p.name}</span>
                              <span className="font-mono font-bold text-slate-900 tabular-nums">{p.quantity} {p.uom}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
                      <span>Total Units:</span>
                      <strong className="font-mono text-slate-800 tabular-nums">{loc.totalItems}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
