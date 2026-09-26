import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Warehouse, Location } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Building2, MapPin, Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';

interface WarehousesViewProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const WarehousesView: React.FC<WarehousesViewProps> = ({ onShowToast }) => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['ADMIN']);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'warehouses' | 'locations'>('warehouses');

  // Warehouse Modal
  const [isWhModalOpen, setIsWhModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whAddress, setWhAddress] = useState('');

  // Location Modal
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [locWhId, setLocWhId] = useState('');
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');
  const [locType, setLocType] = useState<Location['type']>('internal');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [whData, locData] = await Promise.all([
        api.getWarehouses(),
        api.getLocations()
      ]);
      setWarehouses(whData);
      setLocations(locData);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch warehouse data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateWh = () => {
    setEditingWh(null);
    setWhName('');
    setWhCode('');
    setWhAddress('');
    setIsWhModalOpen(true);
  };

  const openEditWh = (wh: Warehouse) => {
    setEditingWh(wh);
    setWhName(wh.name);
    setWhCode(wh.code);
    setWhAddress(wh.address || '');
    setIsWhModalOpen(true);
  };

  const handleSaveWh = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWh) {
        await api.updateWarehouse(editingWh.id, { name: whName, code: whCode, address: whAddress });
        onShowToast(`Warehouse ${whCode} updated`, 'success');
      } else {
        await api.createWarehouse({ name: whName, code: whCode, address: whAddress });
        onShowToast(`Warehouse ${whCode} created with default bays`, 'success');
      }
      setIsWhModalOpen(false);
      fetchData();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save warehouse', 'error');
    }
  };

  const openCreateLoc = () => {
    setEditingLoc(null);
    setLocWhId(warehouses[0]?.id || '');
    setLocName('');
    setLocCode('');
    setLocType('internal');
    setIsLocModalOpen(true);
  };

  const openEditLoc = (loc: Location) => {
    setEditingLoc(loc);
    setLocWhId(loc.warehouse_id);
    setLocName(loc.name);
    setLocCode(loc.code);
    setLocType(loc.type);
    setIsLocModalOpen(true);
  };

  const handleSaveLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLoc) {
        await api.updateLocation(editingLoc.id, {
          warehouse_id: locWhId,
          name: locName,
          code: locCode,
          type: locType
        });
        onShowToast(`Location ${locCode} updated`, 'success');
      } else {
        await api.createLocation({
          warehouse_id: locWhId,
          name: locName,
          code: locCode,
          type: locType
        });
        onShowToast(`Location ${locCode} created`, 'success');
      }
      setIsLocModalOpen(false);
      fetchData();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save location', 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Warehouses & Location Topology</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical facilities, high-bay racks, staging bays, and virtual partner locations.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            {activeTab === 'warehouses' ? (
              <button
                onClick={openCreateWh}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Warehouse</span>
              </button>
            ) : (
              <button
                onClick={openCreateLoc}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Location Bay</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 text-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`pb-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'warehouses'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Warehouses ({warehouses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`pb-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'locations'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Locations & Bins ({locations.length})</span>
          </button>
        </div>

        <button
          onClick={fetchData}
          title="Refresh Data"
          className="pb-2 text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {activeTab === 'warehouses' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 select-none">
              <tr>
                <th className="py-3 px-4 font-semibold">Warehouse Name</th>
                <th className="py-3 px-4 font-semibold">Unique Code</th>
                <th className="py-3 px-4 font-semibold">Physical Address</th>
                <th className="py-3 px-4 font-semibold text-center">Configured Bins</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                {isAdmin && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {warehouses.map(w => (
                <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {w.name}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                    {w.code}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {w.address || '—'}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800">
                    {w.location_count ?? 0}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Operational
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEditWh(w)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 select-none">
              <tr>
                <th className="py-3 px-4 font-semibold">Location Name</th>
                <th className="py-3 px-4 font-semibold">Location Code</th>
                <th className="py-3 px-4 font-semibold">Parent Warehouse</th>
                <th className="py-3 px-4 font-semibold">Location Type</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                {isAdmin && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {locations.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {l.name}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">
                    {l.code}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {l.warehouse_name}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                      l.type === 'internal'
                        ? 'bg-blue-50 text-blue-700'
                        : l.type === 'inventory_loss'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {l.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEditLoc(l)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Warehouse Modal */}
      {isWhModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingWh ? 'Edit Warehouse Facility' : 'Create Warehouse Facility'}
              </h3>
              <button onClick={() => setIsWhModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWh} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={whName}
                  onChange={e => setWhName(e.target.value)}
                  placeholder="e.g. East Coast Distribution Hub"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Unique Facility Code *</label>
                <input
                  type="text"
                  required
                  value={whCode}
                  onChange={e => setWhCode(e.target.value)}
                  placeholder="e.g. WH-EAST"
                  className="w-full px-3 py-2 font-mono uppercase border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={whAddress}
                  onChange={e => setWhAddress(e.target.value)}
                  placeholder="e.g. 500 Port Avenue, Newark, NJ"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWhModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition-colors cursor-pointer"
                >
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {isLocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingLoc ? 'Edit Storage Location' : 'Create Storage Location'}
              </h3>
              <button onClick={() => setIsLocModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLoc} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Parent Warehouse *</label>
                <select
                  value={locWhId}
                  onChange={e => setLocWhId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Location Title *</label>
                <input
                  type="text"
                  required
                  value={locName}
                  onChange={e => setLocName(e.target.value)}
                  placeholder="e.g. Rack C High-Bay"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Location Code *</label>
                <input
                  type="text"
                  required
                  value={locCode}
                  onChange={e => setLocCode(e.target.value)}
                  placeholder="e.g. WH-MAIN/RACK-C"
                  className="w-full px-3 py-2 font-mono uppercase border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Location Type</label>
                <select
                  value={locType}
                  onChange={e => setLocType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="internal">Internal Physical Storage Bay</option>
                  <option value="inventory_loss">Inventory Scrap / Quarantine</option>
                  <option value="supplier">External Supplier (Virtual)</option>
                  <option value="customer">External Customer (Virtual)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLocModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition-colors cursor-pointer"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
