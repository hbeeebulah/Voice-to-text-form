import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import {
  loginUser,
  registerUser
} from '../../services/api';

export default function AuthModal({
  isOpen = true,
  isModal = true, // if false, renders as full standalone page
  initialTab = 'login', // 'login' | 'signup'
  onClose,
  onAuthSuccess,
  onContinueAsGuest
}) {
  const [tab, setTab] = useState(initialTab); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setTab(initialTab);
    setError('');
    setSuccessMsg('');
  }, [initialTab, isOpen]);

  // Email / Password Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide your email and password.');
      return;
    }

    if (tab === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      let result;
      if (tab === 'signup') {
        result = await registerUser({ name, email, password });
        setSuccessMsg('Account created successfully!');
      } else {
        result = await loginUser({ email, password });
        setSuccessMsg('Logged in successfully!');
      }

      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess(result.user);
      }, 500);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (isModal && !isOpen) return null;

  const content = (
    <div className={`w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative ${
      !isModal ? 'mx-auto' : ''
    }`}>
      {/* Decorative top header bar */}
      <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-700" />

      {/* Top Bar with Close button (if modal) */}
      <div className="p-6 sm:p-7 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                VoxForm Studio
              </span>
              <p className="text-[11px] text-slate-400">Form Creator Portal</p>
            </div>
          </div>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {tab === 'signup' ? 'Create Creator Account' : 'Sign in to VoxForm'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {tab === 'signup'
            ? 'Start building voice-powered forms and collecting speech dictation'
            : 'Welcome back! Manage your forms and inspect voice analytics'}
        </p>

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-slate-100 p-1 mt-5">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'signup'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>
      </div>

      <div className="px-6 sm:px-7 pb-6 space-y-4">
        {/* Alerts / Error feedback */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              {tab === 'signup' && (
                <span className="text-[10px] text-slate-400">Min 6 characters</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {tab === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {tab === 'login' && (
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="inline-flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[11px]">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Password reset simulation: Instructions sent to your email.')}
                className="text-[11px] text-indigo-600 hover:underline font-medium cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md hover:shadow-indigo-200 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{tab === 'signup' ? 'Create Creator Account' : 'Sign In as Creator'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Guest Mode option */}
        {onContinueAsGuest && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-xs text-slate-400 hover:text-slate-600 underline font-medium cursor-pointer"
            >
              Skip for now and explore as guest
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (!isModal) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      {content}
    </div>
  );
}
