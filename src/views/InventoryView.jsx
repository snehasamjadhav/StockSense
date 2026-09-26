import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Layers, Building2, MapPin } from 'lucide-react';
import { mockInventoryService } from '../services/mockInventoryService.js';

export const InventoryView = () => {
  const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'by-location'
  const [items, setItems] = useState([]);
  const [byLocationTree, setByLocationTree] = useState([]);
  const [search, setSearch] = useState('');

  const loadData = () => {
    setItems(mockInventoryService.getStockOverview());
    setByLocationTree(mockInventoryService.getStockByLocation());
  };

  useEffect(() => {
    loadData();
    const unsub = mockInventoryService.subscribe(() => loadData());
    return () => unsub();
  }, []);

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
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Physical location stock allocations and on-hand availability</p>
        </div>

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

      {viewMode === 'overview' ? (
        <>
          {/* Search bar */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center gap-2 max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, SKU, warehouse, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-none focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Overview Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Product</th>
                    <th className="py-2.5 px-4">SKU</th>
                    <th className="py-2.5 px-4">Warehouse</th>
                    <th className="py-2.5 px-4">Location</th>
                    <th className="py-2.5 px-4">On Hand</th>
                    <th className="py-2.5 px-4">Reserved</th>
                    <th className="py-2.5 px-4">Available</th>
                    <th className="py-2.5 px-4">Reorder Level</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredItems.map(row => {
                    let statusBadge = 'bg-emerald-100 text-emerald-800';
                    if (row.status === 'LOW_STOCK') statusBadge = 'bg-amber-100 text-amber-800';
                    if (row.status === 'OUT_OF_STOCK') statusBadge = 'bg-rose-100 text-rose-800';

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">{row.productName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">{row.sku}</td>
                        <td className="py-3 px-4 text-slate-600">{row.warehouseName}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{row.locationName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.onHand} {row.uom}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{row.reserved} {row.uom}</td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">{row.available} {row.uom}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{row.minStock} {row.uom}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge}`}>
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
                              <span className="font-mono font-bold text-slate-900">{p.quantity} {p.uom}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
                      <span>Total Units:</span>
                      <strong className="font-mono text-slate-800">{loc.totalItems}</strong>
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
