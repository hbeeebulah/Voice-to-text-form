import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Check,
  Camera,
  UploadCloud,
  Loader2,
  Home
} from 'lucide-react';
import {
  loginUser,
  registerUser,
  uploadFile,
  getAssetUrl
} from '../../services/api';
import { HEADSHOT_PRESETS } from '../../constants/themes';

export default function AuthModal({
  isOpen = true,
  isModal = true,
  initialTab = 'login', // 'login' | 'signup'
  onClose,
  onGoToMainPage,
  onAuthSuccess
}) {
  const [tab, setTab] = useState(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(HEADSHOT_PRESETS[0].url);
  const [customAvatarUrl, setCustomAvatarUrl] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    setTab(initialTab);
    setError('');
    setSuccessMsg('');
  }, [initialTab, isOpen]);

  const handleCustomAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    setIsUploadingAvatar(true);
    setError('');

    // Instant local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const localDataUrl = event.target?.result;
      setCustomAvatarUrl(localDataUrl);
      setSelectedAvatarUrl(localDataUrl);
    };
    reader.readAsDataURL(file);

    try {
      const uploadRes = await uploadFile(file);
      if (uploadRes?.fileUrl) {
        setCustomAvatarUrl(uploadRes.fileUrl);
        setSelectedAvatarUrl(uploadRes.fileUrl);
      }
    } catch (err) {
      console.warn('Could not persist avatar to server, using local preview:', err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide your email and password.');
      return;
    }

    if (tab === 'signup') {
      if (!name.trim()) {
        setError('Please provide your name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
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
        result = await registerUser({
          name: name.trim(),
          email: email.trim(),
          password,
          avatarUrl: selectedAvatarUrl
        });
        setSuccessMsg('Account created successfully!');
      } else {
        result = await loginUser({
          email: email.trim(),
          password
        });
        setSuccessMsg('Logged in successfully!');
      }

      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess(result.user);
      }, 500);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMain = () => {
    if (onGoToMainPage) {
      onGoToMainPage();
    } else if (onClose) {
      onClose();
    }
  };

  if (isModal && !isOpen) return null;

  const cardContent = (
    <div className="relative w-full max-w-md mx-auto my-auto">
      {/* Ambient background glow */}
      <div className="absolute -top-16 -left-12 w-56 h-56 rounded-full bg-primary/15 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-14 -right-10 w-60 h-60 rounded-full bg-tertiary/10 blur-3xl pointer-events-none"></div>

      {/* Main Container Card */}
      <div className="relative bg-surface-container-low/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden text-on-surface border border-outline-variant/30 flex flex-col gap-4">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>

        {/* Top Navigation Row: Back to Main Page & Close Modal */}
        <div className="flex items-center justify-between relative z-20">
          <button
            type="button"
            onClick={handleBackToMain}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-semibold border border-outline-variant/25 transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Main Page</span>
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all border border-outline-variant/20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Header Section */}
        <div className="flex flex-col items-center text-center pt-1">
          <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-primary mb-2 shadow-lg border border-outline-variant/30">
            <span className="material-symbols-outlined text-[24px]">graphic_eq</span>
          </div>
          <h1 className="font-headline-sm text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
            {tab === 'signup' ? 'Create Creator Account' : 'Welcome to VoxForm'}
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant mt-1 max-w-xs">
            {tab === 'signup'
              ? 'Select or upload an animated headshot and start creating voice forms'
              : 'Sign in to access your forms and voice response analytics'}
          </p>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="p-1 bg-surface-container-lowest rounded-full flex items-center relative border border-outline-variant/20">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError('');
            }}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all duration-200 text-center cursor-pointer ${
              tab === 'login'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
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
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all duration-200 text-center cursor-pointer ${
              tab === 'signup'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-error-container/30 border border-error/30 text-error rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-tertiary-container/30 border border-tertiary/40 text-tertiary rounded-xl text-xs flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {/* Form Container */}
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          {/* Headshot Selection with Animated Designs & Upload Option (Registration only) */}
          {tab === 'signup' && (
            <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-surface-container/60 border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-primary" />
                  <span>Choose Geometric Design or Upload Photo</span>
                </span>
                <span className="font-mono text-[10px] text-tertiary font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Geometric Halos
                </span>
              </div>

              {/* Headshots Grid with Animated Designs & Upload Slot */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-1">
                {/* 1. Custom Upload Slot */}
                <div className="relative group aspect-square">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className={`w-full h-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all cursor-pointer p-1 ${
                      selectedAvatarUrl === customAvatarUrl && customAvatarUrl
                        ? 'border-tertiary bg-tertiary/10 ring-2 ring-tertiary/40'
                        : 'border-outline-variant/40 hover:border-primary bg-surface-container-lowest/60 hover:bg-surface-container-high'
                    }`}
                    title="Upload your own headshot photo if you do not want to use geometric drawings"
                  >
                    {customAvatarUrl ? (
                      <div className="relative w-full h-full rounded-xl overflow-hidden">
                        <img
                          src={getAssetUrl(customAvatarUrl)}
                          alt="Custom upload"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <UploadCloud className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : isUploadingAvatar ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-mono text-on-surface-variant font-medium text-center leading-none">
                          Upload Photo
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* 2. Animated Presets */}
                {HEADSHOT_PRESETS.map((preset) => {
                  const isSelected = selectedAvatarUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedAvatarUrl(preset.url)}
                      className={`relative group rounded-2xl p-0.5 aspect-square transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'scale-105 z-10'
                          : 'opacity-85 hover:opacity-100 hover:scale-102'
                      }`}
                      title={`${preset.name} · ${preset.title}`}
                    >
                      {/* Animated Glow Aura Behind Avatar */}
                      <div
                        className={`absolute inset-0 rounded-2xl bg-gradient-to-tr ${preset.aura || 'from-primary to-tertiary'} opacity-75 blur-[2px] transition-all ${
                          isSelected
                            ? 'opacity-100 ring-2 ring-tertiary shadow-[0_0_12px_rgba(78,222,163,0.5)]'
                            : 'group-hover:opacity-90'
                        }`}
                      />

                      {/* Headshot Image Container */}
                      <div className="relative w-full h-full rounded-[14px] overflow-hidden bg-surface-container-lowest border border-white/20">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                        />

                        {/* Selected Animated Check Badge */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-tertiary/25 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full bg-tertiary flex items-center justify-center shadow-md">
                              <Check className="w-3 h-3 text-surface stroke-[3]" />
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full Name Field (Registration only) */}
          {tab === 'signup' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-on-surface font-medium" htmlFor="auth-name">
                Full Name
              </label>
              <div className="relative flex items-center rounded-xl bg-surface-container-lowest focus-within:bg-surface-container transition-colors border border-outline-variant/30">
                <User className="absolute left-3 text-on-surface-variant w-4 h-4 pointer-events-none" />
                <input
                  id="auth-name"
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent py-2.5 pl-9 pr-3 text-on-surface text-xs focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Work Email Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-on-surface font-medium" htmlFor="auth-email">
              Email Address
            </label>
            <div className="relative flex items-center rounded-xl bg-surface-container-lowest focus-within:bg-surface-container transition-colors border border-outline-variant/30">
              <Mail className="absolute left-3 text-on-surface-variant w-4 h-4 pointer-events-none" />
              <input
                id="auth-email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent py-2.5 pl-9 pr-3 text-on-surface text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-on-surface font-medium" htmlFor="auth-password">
                Password
              </label>
              {tab === 'signup' && (
                <span className="font-mono text-[10px] text-on-surface-variant">Min 6 characters</span>
              )}
            </div>
            <div className="relative flex items-center rounded-xl bg-surface-container-lowest focus-within:bg-surface-container transition-colors border border-outline-variant/30">
              <Lock className="absolute left-3 text-on-surface-variant w-4 h-4 pointer-events-none" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent py-2.5 pl-9 pr-10 text-on-surface text-xs font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 p-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Registration only) */}
          {tab === 'signup' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-on-surface font-medium" htmlFor="auth-confirm-password">
                Confirm Password
              </label>
              <div className="relative flex items-center rounded-xl bg-surface-container-lowest focus-within:bg-surface-container transition-colors border border-outline-variant/30">
                <Lock className="absolute left-3 text-on-surface-variant w-4 h-4 pointer-events-none" />
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent py-2.5 pl-9 pr-3 text-on-surface text-xs font-mono focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-lg hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            <span>
              {loading
                ? 'Processing...'
                : tab === 'signup'
                ? 'Create Creator Account'
                : 'Sign In to Workspace'}
            </span>
          </button>
        </form>

        {/* Footer Navigation: Toggle between Sign In / Sign Up AND Go Back to Main Page */}
        <div className="pt-3 border-t border-outline-variant/20 flex flex-col items-center gap-2 text-xs">
          {tab === 'signup' ? (
            <p className="text-on-surface-variant">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError('');
                }}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                Go back to Sign In
              </button>
            </p>
          ) : (
            <p className="text-on-surface-variant">
              Don't have a creator account?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('signup');
                  setError('');
                }}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                Create Creator Account
              </button>
            </p>
          )}

          {/* Leave Section & Go Back to Main Page Button */}
          <button
            type="button"
            onClick={handleBackToMain}
            className="text-[11px] font-mono text-outline hover:text-on-surface flex items-center gap-1 transition-colors cursor-pointer pt-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Leave this section and return to Main Page</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (!isModal) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center py-12 px-4 sm:px-6 relative">
        {cardContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/85 backdrop-blur-2xl overflow-y-auto animate-fadeIn">
      {cardContent}
    </div>
  );
}
