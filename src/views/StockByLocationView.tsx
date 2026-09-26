import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Building2, MapPin, RefreshCw, ChevronDown, ChevronRight, Boxes, ArrowRight } from 'lucide-react';

interface StockByLocationViewProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigate: (viewId: string) => void;
}

export const StockByLocationView: React.FC<StockByLocationViewProps> = ({ onShowToast, onNavigate }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedWhs, setCollapsedWhs] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.getStockByLocation();
      setData(res);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load stock by location', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleWh = (id: string) => {
    setCollapsedWhs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock by Warehouse & Location</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Spatial distribution of inventory items across internal racks, staging docks, and receiving bays.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('transfers')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Initiate Internal Transfer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={fetchData}
            title="Refresh Locations"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Warehouse / Location Hierarchical Cards */}
      <div className="space-y-6">
        {loading && data.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
            Loading location topology and bin balances...
          </div>
        ) : (
          data.map(wh => {
            const isCollapsed = collapsedWhs[wh.warehouse_id];
            return (
              <div key={wh.warehouse_id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Warehouse Header */}
                <div
                  onClick={() => toggleWh(wh.warehouse_id)}
                  className="px-5 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400">
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{wh.warehouse_name}</span>
                        <span className="font-mono text-xs px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold">
                          {wh.warehouse_code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{wh.warehouse_address || 'Facility Hub'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs">
                    <div>
                      <span className="text-slate-400">Total Bins:</span>{' '}
                      <span className="font-semibold text-slate-800">{wh.locations.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Stock Units:</span>{' '}
                      <span className="font-mono font-bold text-slate-900">{wh.total_items.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Valuation:</span>{' '}
                      <span className="font-mono font-bold text-indigo-700">
                        ${wh.total_valuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Locations Grid */}
                {!isCollapsed && (
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30">
                    {wh.locations.map((loc: any) => (
                      <div key={loc.id} className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span className="font-bold text-xs text-slate-900">{loc.name}</span>
                            </div>
                            <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {loc.code}
                            </span>
                          </div>

                          {loc.products.length === 0 ? (
                            <div className="py-6 text-center text-slate-400 text-xs italic">
                              Location currently empty (0 items)
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {loc.products.map((p: any) => (
                                <div key={p.product_id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-b-0">
                                  <div>
                                    <div className="font-medium text-slate-800">{p.product_name}</div>
                                    <div className="text-[11px] font-mono text-slate-400">{p.sku}</div>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-mono font-bold text-slate-900 text-xs">
                                      {p.quantity} {p.unit_of_measure}
                                    </span>
                                    <div className="text-[10px] font-mono text-slate-400">
                                      ${p.valuation.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span>Total: <strong>{loc.total_items}</strong> units</span>
                          <span className="font-mono font-semibold text-slate-800">
                            ${loc.total_valuation.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
