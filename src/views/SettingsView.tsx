import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { User, AuditLog } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ShieldCheck, UserCheck, Plus, ToggleLeft, ToggleRight, X, RefreshCw, KeyRound, ShieldAlert } from 'lucide-react';

interface SettingsViewProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onShowToast }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF'>('WAREHOUSE_STAFF');

  const fetchData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [usersData, logsData] = await Promise.all([
        api.getUsers(),
        api.getAuditLogs()
      ]);
      setUsers(usersData);
      setAuditLogs(logsData);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch administration settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole
      });
      onShowToast(`User ${newUserEmail} provisioned`, 'success');
      setIsUserModalOpen(false);
      fetchData();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to create user', 'error');
    }
  };

  const handleToggleUser = async (u: User) => {
    try {
      await api.toggleUser(u.id);
      onShowToast(`User ${u.name} active status updated`, 'info');
      fetchData();
    } catch (err: any) {
      onShowToast(err.message || 'Action prohibited', 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-3">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">403 Forbidden: Administrator Access Required</h2>
        <p className="text-xs text-slate-500">
          Your current active role ({user?.role}) does not have permission to view operator user management or system audit logs. Switch to the Admin persona using the top navigation bar.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Administration & Audit Governance</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-Based Access Control (RBAC), operator account provisioning, and security audit log streams.
          </p>
        </div>

        {activeTab === 'users' && (
          <button
            onClick={() => {
              setNewUserName('');
              setNewUserEmail('');
              setNewUserPassword('temp1234');
              setNewUserRole('WAREHOUSE_STAFF');
              setIsUserModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Provision User</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 text-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Operator User Accounts ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Trail Logs ({auditLogs.length})</span>
          </button>
        </div>

        <button
          onClick={fetchData}
          title="Refresh Settings"
          className="pb-2 text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tab 1: Users */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 select-none">
              <tr>
                <th className="py-3 px-4 font-semibold">Operator Name</th>
                <th className="py-3 px-4 font-semibold">Corporate Email</th>
                <th className="py-3 px-4 font-semibold">Security Role</th>
                <th className="py-3 px-4 font-semibold">Account Created</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {u.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {u.email}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : u.role === 'INVENTORY_MANAGER'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                      u.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {u.active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleUser(u)}
                      disabled={u.id === user.id}
                      title={u.id === user.id ? 'Cannot deactivate self' : 'Toggle account access'}
                      className="px-2 py-1 text-[11px] font-medium rounded border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {u.active ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 select-none">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Operator</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Entity Type</th>
                <th className="py-3 px-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors text-[11px]">
                  <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 font-sans font-medium whitespace-nowrap">
                    {log.user_name}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-indigo-700 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                    {log.entity_type}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-700">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">Provision Operator Account</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g. Jordan Hayes"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Corporate Email *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="name@stocksense.erp"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  placeholder="Temporary password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Assigned ERP Security Role *</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="WAREHOUSE_STAFF">Warehouse Staff (Pick, Pack, Receive, Count)</option>
                  <option value="INVENTORY_MANAGER">Inventory Manager (Orders, Adjustments, Rules)</option>
                  <option value="ADMIN">System Administrator (Full Control, Topology, Users)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition-colors cursor-pointer"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
