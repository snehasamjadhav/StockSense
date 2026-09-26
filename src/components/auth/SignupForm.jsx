import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PasswordInput } from './PasswordInput.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const SignupForm = ({ onShowToast }) => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    loginId: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'WAREHOUSE STAFF'
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};

    // Full Name
    if (!formData.fullName.trim()) {
      errs.fullName = 'Full Name is required';
    }

    // Login ID
    if (!formData.loginId.trim()) {
      errs.loginId = 'Login ID is required';
    } else if (formData.loginId.trim().length < 3) {
      errs.loginId = 'Login ID must be at least 3 characters';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Invalid email address.';
    }

    // Password rules
    // Minimum 8 characters, uppercase, lowercase, number, special character
    const password = formData.password;
    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 8) {
      errs.password = 'Password must contain at least 8 characters.';
    } else if (!/[A-Z]/.test(password)) {
      errs.password = 'Password must contain at least one uppercase letter.';
    } else if (!/[a-z]/.test(password)) {
      errs.password = 'Password must contain at least one lowercase letter.';
    } else if (!/[0-9]/.test(password)) {
      errs.password = 'Password must contain at least one number.';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errs.password = 'Password must contain at least one special character (!@#$%^&* etc).';
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Confirm Password is required';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    // Role
    if (!formData.role) {
      errs.role = 'Role selection is required';
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
      const user = await signup(formData);
      if (onShowToast) {
        onShowToast(`Account created successfully! Welcome to StockSense, ${user.name}.`, 'success');
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Account creation failed. Please try again.');
      if (onShowToast) {
        onShowToast(err.message || 'Signup failed', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-5">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your StockSense account</h1>
        <p className="text-xs text-slate-500 mt-1">Set up your inventory management workspace.</p>
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

      {/* Sign Up Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {/* Full Name */}
        <div className="space-y-1">
          <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="e.g. Rachel Adams"
            className={`w-full px-3 py-2 text-xs bg-white border rounded-md transition-colors placeholder:text-slate-400 focus:outline-none ${
              errors.fullName
                ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-rose-900'
                : 'border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-800'
            }`}
          />
          {errors.fullName && <p className="text-[11px] text-rose-600 font-medium">{errors.fullName}</p>}
        </div>

        {/* Login ID & Role Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="loginId" className="block text-xs font-semibold text-slate-700">
              Login ID <span className="text-rose-500">*</span>
            </label>
            <input
              id="loginId"
              name="loginId"
              type="text"
              value={formData.loginId}
              onChange={handleChange}
              placeholder="e.g. radams"
              className={`w-full px-3 py-2 text-xs bg-white border rounded-md transition-colors placeholder:text-slate-400 focus:outline-none font-mono ${
                errors.loginId
                  ? 'border-rose-300 focus:border-rose-500 text-rose-900'
                  : 'border-slate-300 focus:border-indigo-600 text-slate-800'
              }`}
            />
            {errors.loginId && <p className="text-[11px] text-rose-600 font-medium">{errors.loginId}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="role" className="block text-xs font-semibold text-slate-700">
              Select Role <span className="text-rose-500">*</span>
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-800 focus:outline-none"
            >
              <option value="WAREHOUSE STAFF">Warehouse Staff</option>
              <option value="INVENTORY MANAGER">Inventory Manager</option>
            </select>
            <p className="text-[10px] text-slate-400">Admin accounts require system provision</p>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@company.com"
            autoComplete="email"
            className={`w-full px-3 py-2 text-xs bg-white border rounded-md transition-colors placeholder:text-slate-400 focus:outline-none ${
              errors.email
                ? 'border-rose-300 focus:border-rose-500 text-rose-900'
                : 'border-slate-300 focus:border-indigo-600 text-slate-800'
            }`}
          />
          {errors.email && <p className="text-[11px] text-rose-600 font-medium">{errors.email}</p>}
        </div>

        {/* Password */}
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Min. 8 chars (uppercase, number, symbol)"
          error={errors.password}
          autoComplete="new-password"
        />

        {/* Confirm Password */}
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter password"
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        {/* Password Requirements Helper */}
        <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-md text-[10px] text-slate-500 space-y-0.5">
          <div className="font-semibold text-slate-700 uppercase tracking-wider text-[9px]">Password Guidelines:</div>
          <div>• Minimum 8 characters</div>
          <div>• Uppercase, lowercase, number & special character (!@#$%^&*)</div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          <span>{isSubmitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}</span>
        </button>
      </form>

      {/* Switch to Sign In */}
      <div className="pt-2 text-center text-xs text-slate-600 border-t border-slate-100">
        Already have an account?{' '}
        <Link
          to="/"
          className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
};
