import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search } from 'lucide-react';
import { mockInventoryService } from '../services/mockInventoryService.js';

export const AuditLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLogs(mockInventoryService.getAuditLogs());
    const unsub = mockInventoryService.subscribe(() => {
      setLogs(mockInventoryService.getAuditLogs());
    });
    return () => unsub();
  }, []);

  const filtered = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.user.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.entity.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Security & Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-0.5">Immutable audit trail of operator mutations, document validations, and role sessions</p>
      </div>

      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center gap-2 max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search audit trail by user, action, entity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs bg-transparent border-none focus:outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Operator</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Entity</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{l.timestamp}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{l.user}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-indigo-50 text-indigo-700">
                      {l.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 font-medium">{l.entity}</td>
                  <td className="py-3 px-4 text-slate-600">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
