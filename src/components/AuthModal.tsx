import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import { Lock, Mail, User as UserIcon, KeyRound, ArrowRight, ShieldCheck, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(defaultMode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF'>('WAREHOUSE_STAFF');

  // OTP flow state
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [simulatedOtpNotice, setSimulatedOtpNotice] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onClose();
      } else if (mode === 'register') {
        await register(name, email, password, role);
        onClose();
      } else if (mode === 'forgot') {
        const res = await api.forgotPasswordOtp(email);
        setSimulatedOtpNotice(res.otp || res.debug_otp || '123456');
        setSuccessMsg('OTP code generated! Check the notice below or your mailbox.');
        setMode('reset');
      } else if (mode === 'reset') {
        await api.resetPasswordOtp({ email, otp: otpCode, newPassword });
        setSuccessMsg('Password updated successfully! Please log in.');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              SS
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">StockSense Access Control</h3>
              <p className="text-xs text-slate-500">
                {mode === 'login' && 'Sign in to your enterprise workstation'}
                {mode === 'register' && 'Provision a new ERP operator account'}
                {mode === 'forgot' && 'Request an OTP verification code'}
                {mode === 'reset' && 'Enter verification OTP & set password'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg">
              {successMsg}
            </div>
          )}

          {simulatedOtpNotice && (
            <div className="p-3 text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-lg flex items-center justify-between">
              <span><strong>Verification OTP:</strong> <code className="font-mono text-sm px-1.5 py-0.5 bg-amber-100 rounded">{simulatedOtpNotice}</code></span>
              <button
                type="button"
                onClick={() => setOtpCode(simulatedOtpNotice)}
                className="text-xs font-semibold text-amber-800 underline hover:text-amber-950"
              >
                Auto-fill
              </button>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Jordan Hayes"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="WAREHOUSE_STAFF">Warehouse Staff (Pick, Pack, Receive)</option>
                  <option value="INVENTORY_MANAGER">Inventory Manager (Orders, Adjustments, Rules)</option>
                  <option value="ADMIN">System Administrator (Full Access, Topology)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Corporate Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@stocksense.erp"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {(mode === 'login' || mode === 'register') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">6-Digit OTP Code</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono tracking-widest border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Secure Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {loading ? (
              <span>Verifying credentials...</span>
            ) : (
              <>
                {mode === 'login' && 'Sign In to StockSense'}
                {mode === 'register' && 'Register New Account'}
                {mode === 'forgot' && 'Generate Recovery OTP'}
                {mode === 'reset' && 'Reset & Update Password'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            {mode === 'login' ? (
              <>
                <span>Need a staff profile?</span>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className="font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                <span>Already registered?</span>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className="font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Back to Sign In
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
