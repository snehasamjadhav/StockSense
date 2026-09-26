import React, { useState } from 'react';
import { Building2, MapPin, Package, Layers, ChevronRight } from 'lucide-react';
import { mockInventoryService } from '../services/mockInventoryService.js';

export const WarehousesView = () => {
  const warehouses = mockInventoryService.getStockByLocation();
  const [selectedLocation, setSelectedLocation] = useState(null);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Warehouse Topology</h1>
        <p className="text-xs text-slate-500 mt-0.5">Physical facility layouts, racking zones, and live bin allocations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Warehouses & Racks */}
        <div className="lg:col-span-2 space-y-6">
          {warehouses.map(wh => (
            <div key={wh.id} className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-slate-900">{wh.name}</h2>
                    <p className="text-[11px] text-slate-500">{wh.address}</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                  {wh.code}
                </span>
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {wh.locations.map(loc => {
                  const isSelected = selectedLocation?.id === loc.id;
                  let typeColor = 'bg-indigo-50 border-indigo-200 text-indigo-900';
                  if (loc.type === 'damaged') typeColor = 'bg-rose-50 border-rose-200 text-rose-900';
                  if (loc.type === 'receiving') typeColor = 'bg-blue-50 border-blue-200 text-blue-900';
                  if (loc.type === 'dispatch') typeColor = 'bg-purple-50 border-purple-200 text-purple-900';

                  return (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocation({ ...loc, warehouseName: wh.name })}
                      className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'ring-2 ring-indigo-600 bg-white shadow-sm'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${typeColor}`}>
                            {loc.code}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">{loc.type}</span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900">{loc.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{loc.description}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Stored Units:</span>
                        <span className="font-mono font-bold text-slate-900">{loc.totalItems}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right col: Selected Location Stock Inspector */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs h-fit sticky top-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Location Stock Inspector</h3>
              <p className="text-[10px] text-slate-400">Click any rack or zone to inspect inventory</p>
            </div>
          </div>

          {selectedLocation ? (
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-sm font-bold text-slate-900">{selectedLocation.name}</div>
                <div className="text-xs text-slate-500 font-mono">{selectedLocation.code} • {selectedLocation.warehouseName}</div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stored Products</span>
                {selectedLocation.products.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-50 rounded mt-2">
                    No material currently allocated in this rack.
                  </div>
                ) : (
                  <div className="space-y-2 mt-2">
                    {selectedLocation.products.map(p => (
                      <div key={p.productId} className="p-2.5 rounded bg-slate-50 border border-slate-100 flex justify-between items-center text-xs">
                        <div>
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{p.sku}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-indigo-700">{p.quantity} {p.uom}</div>
                          <div className="text-[10px] text-slate-500">${p.value.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 bg-indigo-50/50 rounded border border-indigo-100 text-xs flex justify-between">
                <span className="text-indigo-900 font-semibold">Total Location Value:</span>
                <span className="font-mono font-bold text-indigo-900">
                  ${selectedLocation.products.reduce((acc, p) => acc + p.value, 0).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-8 text-center p-6 text-slate-400 text-xs">
              Select a location on the left to inspect its on-hand inventory balances.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
