import React, { useState } from 'react';
import { Settings, Shield, Bell, Database, Server, Check } from 'lucide-react';

export const SettingsView = ({ onShowToast }) => {
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [strictDoubleEntry, setStrictDoubleEntry] = useState(true);
  const [autoReorderEmails, setAutoReorderEmails] = useState(true);

  const handleSave = () => {
    if (onShowToast) onShowToast('System configuration settings saved', 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Enterprise inventory controls, ledger invariants, and system parameters</p>
      </div>

      <div className="space-y-4">
        {/* Inventory Rules */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" />
            <span>Inventory & Ledger Rules</span>
          </h2>

          <div className="space-y-3 text-xs divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="font-semibold text-slate-800">Strict Double-Entry Enforcement</div>
                <div className="text-slate-500">Every stock mutation must possess a source location, destination, and document ref.</div>
              </div>
              <input
                type="checkbox"
                checked={strictDoubleEntry}
                onChange={(e) => setStrictDoubleEntry(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="font-semibold text-slate-800">Allow Negative Stock Balances</div>
                <div className="text-slate-500">Permit dispatches when on-hand quantity is below requested delivery (Default: Disabled).</div>
              </div>
              <input
                type="checkbox"
                checked={allowNegativeStock}
                onChange={(e) => setAllowNegativeStock(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            <span>Alerts & Notifications</span>
          </h2>

          <div className="space-y-3 text-xs divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="font-semibold text-slate-800">Automated Reorder Alerts</div>
                <div className="text-slate-500">Trigger warnings in dashboard when products fall below configured minimum safety threshold.</div>
              </div>
              <input
                type="checkbox"
                checked={autoReorderEmails}
                onChange={(e) => setAutoReorderEmails(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-2 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-600" />
            <span>System Information</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 text-slate-600 pt-2">
            <div>Application: <strong>StockSense ERP</strong></div>
            <div>Version: <strong>2026.1 (Enterprise Production)</strong></div>
            <div>Database Mode: <strong>Local In-Memory / REST-Ready</strong></div>
            <div>Accounting Mode: <strong>Double-Entry Invariant</strong></div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
