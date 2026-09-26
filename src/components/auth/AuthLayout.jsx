import React from 'react';
import { AuthBranding } from './AuthBranding.jsx';

export const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-center items-center p-4 md:p-6 lg:p-8 font-sans antialiased text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* Centered Two-Column White Enterprise Card */}
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[640px]">
        {/* Left Branding Column */}
        <div className="hidden md:block h-full">
          <AuthBranding />
        </div>

        {/* Mobile Mini Branding Header */}
        <div className="md:hidden p-6 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center text-white font-bold text-base shadow-sm">
              S
            </div>
            <div>
              <div className="text-base font-bold text-slate-900">StockSense ERP</div>
              <p className="text-[10px] text-slate-500">Smart Inventory. Complete Control.</p>
            </div>
          </div>
        </div>

        {/* Right Form Card Container */}
        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-12 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
};
