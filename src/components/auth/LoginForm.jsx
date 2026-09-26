import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle, CheckCircle2, User, KeyRound } from 'lucide-react';
import { PasswordInput } from './PasswordInput.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const LoginForm = ({ onShowToast }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('admin@stocksense.com');
  const [password, setPassword] = useState('Admin@123');
  const [remember, setRemember] = useState(true);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!identifier.trim()) {
      errs.identifier = 'Email or Login ID is required';
    }
    if (!password) {
      errs.password = 'Password is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const user = await login(identifier, password, remember);
      if (onShowToast) {
        onShowToast(`Welcome back, ${user.name}! Authentication successful.`, 'success');
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Invalid email or password.');
      if (onShowToast) {
        onShowToast(err.message || 'Authentication failed', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill helper for hackathon demo convenience
  const handleQuickFill = (email, pass) => {
    setIdentifier(email);
    setPassword(pass);
    setServerError('');
    setErrors({});
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
        <p className="text-xs text-slate-500 mt-1">Sign in to your StockSense account</p>
      </div>

      {/* Global Server Error Alert */}
      {serverError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in-50">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{serverError}</p>
          </div>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email or Login ID */}
        <div className="space-y-1">
          <label htmlFor="identifier" className="block text-xs font-semibold text-slate-700">
            Email or Login ID <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errors.identifier) setErrors(prev => ({ ...prev, identifier: '' }));
              }}
              placeholder="e.g. admin@stocksense.com or admin"
              autoComplete="username"
              className={`w-full px-3 py-2 text-xs bg-white border rounded-md transition-colors placeholder:text-slate-400 focus:outline-none ${
                errors.identifier
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-rose-900'
                  : 'border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-800'
              }`}
            />
          </div>
          {errors.identifier && (
            <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.identifier}</p>
          )}
        </div>

        {/* Password */}
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
          }}
          placeholder="••••••••"
          error={errors.password}
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs text-slate-600">Remember me</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          <span>{isSubmitting ? 'SIGNING IN...' : 'SIGN IN'}</span>
        </button>
      </form>

      {/* Switch to Sign Up */}
      <div className="pt-2 text-center text-xs text-slate-600 border-t border-slate-100">
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Create Account
        </Link>
      </div>

      {/* Demo Accounts Helper Accordion / Tray (For Hackathon Evaluation) */}
      <div className="pt-2">
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Demo Quick-Fill Accounts</span>
            <span className="text-[10px] text-slate-400 font-normal">Click to load</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@stocksense.com', 'Admin@123')}
              className="p-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded text-left transition-colors"
            >
              <div className="font-bold text-[10px] text-slate-800">Admin</div>
              <div className="text-[9px] text-slate-500 font-mono truncate">Elena R.</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('manager@stocksense.com', 'Manager@123')}
              className="p-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded text-left transition-colors"
            >
              <div className="font-bold text-[10px] text-slate-800">Manager</div>
              <div className="text-[9px] text-slate-500 font-mono truncate">Marcus V.</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('warehouse@stocksense.com', 'Warehouse@123')}
              className="p-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded text-left transition-colors"
            >
              <div className="font-bold text-[10px] text-slate-800">Staff</div>
              <div className="text-[9px] text-slate-500 font-mono truncate">Devon R.</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
