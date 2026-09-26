import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const PasswordInput = ({
  id,
  name,
  value,
  onChange,
  placeholder = '••••••••',
  required = true,
  error,
  label = 'Password',
  autoComplete = 'current-password',
  disabled = false
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name || id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full px-3 py-2 pr-10 text-xs bg-white border rounded-md transition-colors placeholder:text-slate-400 focus:outline-none ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-rose-900'
              : 'border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-800'
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-rose-600 font-medium animate-in fade-in-50 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
