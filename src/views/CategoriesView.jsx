import React, { useState, useEffect } from 'react';
import { Tags, Plus, Boxes } from 'lucide-react';
import { mockInventoryService } from '../services/mockInventoryService.js';

export const CategoriesView = ({ onShowToast }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setCategories(mockInventoryService.getCategories());
    const unsub = mockInventoryService.subscribe(() => {
      setCategories(mockInventoryService.getCategories());
    });
    return () => unsub();
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Product Categories</h1>
          <p className="text-xs text-slate-500 mt-0.5">Hierarchical taxonomy and item grouping for materials and finished inventory</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {cat.code}
                </span>
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Boxes className="w-3.5 h-3.5" /> {cat.count} SKUs
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 mt-3">{cat.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{cat.description}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
              <span>View catalog items</span>
              <span>→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
