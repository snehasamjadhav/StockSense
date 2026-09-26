import React, { useState } from 'react';
import { X, Play, RotateCcw, CheckCircle, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { mockInventoryService } from '../services/mockInventoryService.js';

export const ScenarioModal = ({ isOpen, onClose, onRefresh, onShowToast }) => {
  if (!isOpen) return null;

  const [activeStep, setActiveStep] = useState(1);
  const steelId = 'prod-steel';
  const recStock = mockInventoryService.getLocationStock(steelId, 'loc-rec');
  const rackAStock = mockInventoryService.getLocationStock(steelId, 'loc-rack-a');
  const companyTotal = mockInventoryService.getProductTotalStock(steelId);

  const handleRunStep = (stepNum) => {
    const res = mockInventoryService.runScenarioStep(stepNum);
    if (res) {
      if (onShowToast) onShowToast(res.message, 'success');
      setActiveStep(stepNum + 1);
      if (onRefresh) onRefresh();
    }
  };

  const handleResetSteel = () => {
    mockInventoryService.state.balances[steelId] = {
      'loc-rec': 0,
      'loc-rack-a': 0,
      'loc-rack-b': 0,
      'loc-disp': 0,
      'loc-dmg': 0
    };
    mockInventoryService.save();
    setActiveStep(1);
    if (onShowToast) onShowToast('Steel Rod balances reset to 0 KG baseline', 'info');
    if (onRefresh) onRefresh();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-20">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-300" />
            <div>
              <h2 className="font-bold text-sm">Interactive ERP Scenario Engine</h2>
              <p className="text-xs text-indigo-200">
                Step-by-step verification of double-entry stock invariants & document flow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-200 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Balance Monitor Box */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Live Steel Rod (STEEL-001) Telemetry</span>
            <button
              onClick={handleResetSteel}
              className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-rose-600 font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Reset Steel Rod to 0 KG
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Receiving Bay</span>
              <div className="text-xl font-bold font-mono text-slate-800 mt-0.5">
                {recStock} <span className="text-xs font-normal text-slate-500">KG</span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Rack A Storage</span>
              <div className="text-xl font-bold font-mono text-indigo-600 mt-0.5">
                {rackAStock} <span className="text-xs font-normal text-slate-500">KG</span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-indigo-200 bg-indigo-50/30 text-center shadow-xs">
              <span className="text-[10px] text-indigo-700 font-bold uppercase">Company Total</span>
              <div className="text-xl font-bold font-mono text-indigo-900 mt-0.5">
                {companyTotal} <span className="text-xs font-normal text-indigo-600">KG</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scenario Steps List */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
          {/* Step 1 */}
          <div className={`p-3 rounded-lg border transition-all ${
            companyTotal >= 100 && recStock === 100
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-[10px]">
                  1
                </span>
                <div>
                  <div className="font-bold text-slate-900">Action 1: Receive 100 KG Inbound</div>
                  <div className="text-[11px] text-slate-500">
                    Vendor PO Receipt → Destination: <strong>Receiving</strong> bay
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRunStep(1)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Play className="w-3 h-3" /> Post Receipt
              </button>
            </div>
            <div className="mt-2 text-[11px] font-mono text-slate-600 bg-slate-100/70 p-1.5 rounded">
              Expected Target: Receiving = 100 KG | Company Total = 100 KG
            </div>
          </div>

          {/* Step 2 */}
          <div className={`p-3 rounded-lg border transition-all ${
            rackAStock === 100 && recStock === 0
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-[10px]">
                  2
                </span>
                <div>
                  <div className="font-bold text-slate-900">Action 2: Internal Transfer 100 KG</div>
                  <div className="text-[11px] text-slate-500">
                    Relocate: <strong>Receiving → Rack A</strong> (Company total balance invariant = 0 net change)
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRunStep(2)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Play className="w-3 h-3" /> Post Transfer
              </button>
            </div>
            <div className="mt-2 text-[11px] font-mono text-slate-600 bg-slate-100/70 p-1.5 rounded">
              Expected Target: Receiving = 0 KG | Rack A = 100 KG | Company Total = 100 KG
            </div>
          </div>

          {/* Step 3 */}
          <div className={`p-3 rounded-lg border transition-all ${
            rackAStock === 80
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-[10px]">
                  3
                </span>
                <div>
                  <div className="font-bold text-slate-900">Action 3: Customer Delivery 20 KG</div>
                  <div className="text-[11px] text-slate-500">
                    Dispatch order from <strong>Rack A → Customer</strong>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRunStep(3)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Play className="w-3 h-3" /> Post Delivery
              </button>
            </div>
            <div className="mt-2 text-[11px] font-mono text-slate-600 bg-slate-100/70 p-1.5 rounded">
              Expected Target: Rack A = 80 KG | Company Total = 80 KG
            </div>
          </div>

          {/* Step 4 */}
          <div className={`p-3 rounded-lg border transition-all ${
            rackAStock === 77
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-[10px]">
                  4
                </span>
                <div>
                  <div className="font-bold text-slate-900">Action 4: Physical Count = 77 KG</div>
                  <div className="text-[11px] text-slate-500">
                    Cycle count audit: System = 80, Physical = 77 (Difference = -3 KG)
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRunStep(4)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Play className="w-3 h-3" /> Post Adjustment
              </button>
            </div>
            <div className="mt-2 text-[11px] font-mono text-slate-600 bg-slate-100/70 p-1.5 rounded">
              Expected Target: Difference = -3 KG | Final Stock = 77 KG | Double-Entry Ledger Recorded
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            All actions immediately generate verifiable ledger and movement records.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-medium text-xs transition-colors"
          >
            Close Engine
          </button>
        </div>
      </div>
    </div>
  );
};
