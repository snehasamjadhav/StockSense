import React, { useState } from 'react';
import { User, Shield, Mail, Clock, Save, Check } from 'lucide-react';
import { mockInventoryService } from '../services/mockInventoryService.js';

export const ProfileView = ({ onShowToast }) => {
  const currentUser = mockInventoryService.getCurrentUser();
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    department: currentUser.department || 'Supply Chain Operations'
  });

  const handleSave = (e) => {
    e.preventDefault();
    mockInventoryService.updateProfile(formData);
    if (onShowToast) onShowToast('Profile information saved successfully', 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Operator Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">Role permissions and session identity</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            {currentUser.avatar}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{currentUser.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                {currentUser.role}
              </span>
              <span className="text-xs text-slate-400">• Last active: {currentUser.lastLogin}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 max-w-lg text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Work Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded focus:border-indigo-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs"
            >
              <Save className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
