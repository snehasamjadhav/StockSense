import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { PasswordInput } from './PasswordInput.jsx';
import { passwordResetService } from '../../services/passwordResetService.js';
import { authService } from '../../services/authService.js';

export const ForgotPasswordForm = ({ onShowToast }) => {
  const navigate = useNavigate();

  // Steps: 'email' -> 'otp' -> 'reset' -> 'success'
  const [step, setStep] = useState('email');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [demoOtpNotice, setDemoOtpNotice] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Please enter a valid registered email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await passwordResetService.requestOtp(email);
      setDemoOtpNotice(res.demoOtp);
      setStep('otp');
      if (onShowToast) {
        onShowToast(`Verification code generated for ${email}`, 'info', `Demo OTP: ${res.demoOtp}`);
      }
    } catch (err) {
      setError(err.message || 'Could not send verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await passwordResetService.verifyOtp(email, otp);
      setStep('reset');
      if (onShowToast) {
        onShowToast('Verification code confirmed. Enter your new password.', 'success');
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword) {
      setError('New password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must contain uppercase, lowercase, and numeric characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.updatePassword(email, newPassword);
      await passwordResetService.resetPassword(email, newPassword);
      setStep('success');
      if (onShowToast) {
        onShowToast('Password reset successful. You may now sign in.', 'success');
      }
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Back to Sign In Link */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot Password?</h1>
        <p className="text-xs text-slate-500 mt-1">
          {step === 'email' && 'Enter your registered email address to receive a verification OTP.'}
          {step === 'otp' && `Enter the 6-digit verification code sent to ${email}.`}
          {step === 'reset' && 'Create a new secure password for your StockSense account.'}
          {step === 'success' && 'Your password has been updated successfully.'}
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in-50">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* STEP 1: Enter Email */}
      {step === 'email' && (
        <form onSubmit={handleRequestOtp} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="reset-email" className="block text-xs font-semibold text-slate-700">
              Registered Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. admin@stocksense.com"
              required
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-800 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            <span>{isSubmitting ? 'SENDING CODE...' : 'SEND OTP'}</span>
          </button>
        </form>
      )}

      {/* STEP 2: Verify OTP */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
          {/* Demo OTP Notice Box */}
          {demoOtpNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Development / Hackathon Mode</span>
              </div>
              <div className="text-amber-800 font-mono text-sm font-bold">
                Demo OTP: {demoOtpNotice}
              </div>
              <div className="text-[10px] text-amber-700">
                (Click the code below to auto-fill)
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="otp-input" className="block text-xs font-semibold text-slate-700">
                Enter 6-Digit OTP <span className="text-rose-500">*</span>
              </label>
              {demoOtpNotice && (
                <button
                  type="button"
                  onClick={() => setOtp(demoOtpNotice)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Auto-fill ({demoOtpNotice})
                </button>
              )}
            </div>
            <input
              id="otp-input"
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/[^0-9]/g, ''));
                if (error) setError('');
              }}
              placeholder="_ _ _ _ _ _"
              className="w-full px-3 py-2 text-center tracking-widest font-mono text-lg bg-white border border-slate-300 rounded-md focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md transition-colors"
            >
              Change Email
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'VERIFYING...' : 'VERIFY OTP'}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Set New Password */}
      {step === 'reset' && (
        <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
          <PasswordInput
            id="newPassword"
            name="newPassword"
            label="New Password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (error) setError('');
            }}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
          />

          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError('');
            }}
            placeholder="Re-enter new password"
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? 'UPDATING...' : 'RESET PASSWORD'}
          </button>
        </form>
      )}

      {/* STEP 4: Success Message */}
      {step === 'success' && (
        <div className="space-y-4 text-center py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Password Reset Completed</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your password has been changed successfully. You can now log into your account using your new credentials.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow-sm transition-all cursor-pointer"
          >
            PROCEED TO SIGN IN
          </button>
        </div>
      )}
    </div>
  );
};
