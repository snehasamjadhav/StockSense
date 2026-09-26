import React from 'react';
import { CheckCircle2, Boxes, ShieldCheck, ArrowRightLeft, BellRing } from 'lucide-react';

export const AuthBranding = () => {
  return (
    <div className="flex flex-col justify-between h-full p-8 lg:p-12 bg-slate-50 border-r border-slate-200">
      {/* Top Logo & Identity */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-sm">
            <Boxes className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              StockSense
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold">
                ERP
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Smart Inventory. Complete Control.</p>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="mt-10 lg:mt-14">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            Inventory management built for modern warehouses.
          </h2>
          <p className="mt-3 text-xs lg:text-sm text-slate-600 leading-relaxed max-w-md">
            Execute receipts, outbound delivery validation, internal transfers, and physical cycle counts with mathematical double-entry stock integrity.
          </p>
        </div>

        {/* Abstract Clean ERP Graphic Card */}
        <div className="mt-8 p-5 bg-white rounded-xl border border-slate-200/90 shadow-sm max-w-md space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Double-Entry Ledger Status</span>
            </div>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
              Live Invariant: Active
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Receiving</div>
              <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">0 KG</div>
            </div>
            <div className="p-2 rounded bg-indigo-50/60 border border-indigo-100">
              <div className="text-[10px] font-bold text-indigo-700 uppercase">Rack A</div>
              <div className="font-mono font-bold text-indigo-700 text-sm mt-0.5">77 KG</div>
            </div>
            <div className="p-2 rounded bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Dispatched</div>
              <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">20 KG</div>
            </div>
          </div>
        </div>

        {/* Feature Checklist */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Real-time multi-location inventory tracking</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Multi-warehouse topology & rack management</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Immutable stock movement audit trail & ledger</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Smart reorder rules with automated replenishment POs</span>
          </div>
        </div>
      </div>

      {/* Footer System Info */}
      <div className="mt-8 pt-6 border-t border-slate-200/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span>StockSense ERP Version 2026.1</span>
        <span>Enterprise Production</span>
      </div>
    </div>
  );
};
