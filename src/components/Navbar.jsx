import React, { useState } from 'react';
import { Search, Bell, User, Check, PlayCircle, ExternalLink, HelpCircle, LogOut } from 'lucide-react';
import { mockInventoryService } from '../services/mockInventoryService.js';
import { INITIAL_PERSONAS } from '../services/mockData.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ onOpenScenarioModal, onShowToast, onSearchQuery }) => {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { currentUser: authUser, logout } = useAuth();
  const navigate = useNavigate();

  const currentUser = authUser || mockInventoryService.getCurrentUser();

  const handleSelectPersona = (role) => {
    mockInventoryService.setPersona(role);
    setShowPersonaMenu(false);
    if (onShowToast) {
      const u = mockInventoryService.getCurrentUser();
      onShowToast(`Switched active persona to ${u.name} (${u.role})`, 'info');
    }
  };

  const handleLogout = () => {
    logout();
    if (onShowToast) {
      onShowToast('Signed out of StockSense session', 'info');
    }
    navigate('/', { replace: true });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (onSearchQuery) {
      onSearchQuery(e.target.value);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-4 z-20">
      {/* Search Input */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search products, SKU, documents, locations..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-md focus:outline-none transition-all placeholder:text-slate-400 text-slate-800"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Interactive Scenario Walkthrough Runner */}
        <button
          onClick={onOpenScenarioModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200 transition-colors shadow-xs"
          title="Interactive walkthrough of the 4-step stock scenario"
        >
          <PlayCircle className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Scenario Runner</span>
          <span className="text-[10px] bg-indigo-600 text-white font-mono px-1 rounded">Steel Rod</span>
        </button>

        {/* Demo Persona Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 text-xs transition-colors"
          >
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 leading-none">
                DEMO PERSONA
              </span>
              <span className="font-semibold text-slate-800 leading-tight">
                {currentUser.name}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900 px-1 py-0.5 rounded">
              {currentUser.role.split(' ')[0]}
            </span>
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl p-1.5 z-50 animate-in fade-in-50">
              <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                Switch Hackathon Role Persona
              </div>
              <div className="mt-1 space-y-1">
                {INITIAL_PERSONAS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPersona(p.role)}
                    className={`w-full flex items-center justify-between p-2 rounded text-left transition-colors ${
                      currentUser.role === p.role ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{p.role}</div>
                    </div>
                    {currentUser.role === p.role && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md relative"
            title="System notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-50">
              <div className="px-2 py-1 text-xs font-bold text-slate-700 border-b border-slate-100 flex items-center justify-between">
                <span>System Notifications</span>
                <span className="text-[10px] text-indigo-600 font-normal">Mark all read</span>
              </div>
              <div className="mt-2 space-y-2 text-xs">
                <div className="p-2 rounded bg-amber-50 border border-amber-100 text-amber-900">
                  <div className="font-semibold">Reorder Alert: Aluminum Sheet</div>
                  <div className="text-[11px] text-amber-800">Current stock (8 KG) below minimum threshold (15 KG).</div>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100 text-slate-700">
                  <div className="font-semibold">Pending Delivery Order</div>
                  <div className="text-[11px] text-slate-500">DEL/2026/0002 waiting for warehouse dispatch verification.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
