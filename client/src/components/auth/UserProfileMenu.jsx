import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  LogOut,
  ChevronDown,
  FolderOpen,
  Camera,
  Check,
  UploadCloud,
  Loader2,
  Home,
  Sparkles
} from 'lucide-react';
import { logoutUser, updateUserProfile, uploadFile, getAssetUrl } from '../../services/api';
import { HEADSHOT_PRESETS } from '../../constants/themes';

export default function UserProfileMenu({
  user,
  onOpenAuth,
  onUserLoggedOut,
  onLogout,
  onGoToDashboard,
  onGoToMainPage,
  onUserUpdated
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChangingHeadshot, setIsChangingHeadshot] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsChangingHeadshot(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    try {
      logoutUser();
    } catch (err) {
      console.warn('Logout error:', err);
    }
    setIsOpen(false);
    if (typeof onUserLoggedOut === 'function') onUserLoggedOut();
    if (typeof onLogout === 'function') onLogout();
    if (typeof onGoToMainPage === 'function') onGoToMainPage();
    window.location.hash = '#landing';
  };

  const handleSelectHeadshot = async (avatarUrl) => {
    try {
      const res = await updateUserProfile({ avatarUrl });
      if (onUserUpdated) onUserUpdated(res.user);
      setIsChangingHeadshot(false);
    } catch (err) {
      alert(`Could not update headshot: ${err.message}`);
    }
  };

  const handleUploadHeadshot = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    setIsUploading(true);
    try {
      const uploadRes = await uploadFile(file);
      if (uploadRes?.fileUrl) {
        await handleSelectHeadshot(uploadRes.fileUrl);
      }
    } catch (err) {
      alert(`Could not upload photo: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // If not logged in, render Sign In CTA buttons
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenAuth('login')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all border border-outline-variant/30 cursor-pointer"
        >
          <User className="w-3.5 h-3.5 text-primary" />
          <span>Sign In</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenAuth('signup')}
          className="hidden sm:inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary-container to-secondary-container hover:opacity-95 text-on-primary-fixed text-xs font-semibold transition-all shadow-sm cursor-pointer"
        >
          <span>Sign Up</span>
        </button>
      </div>
    );
  }

  const userAvatar = getAssetUrl(user.avatarUrl || HEADSHOT_PRESETS[0].url);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer group"
      >
        {/* Headshot Avatar with subtle animated halo */}
        <div className="relative w-8 h-8 rounded-full p-0.5 shrink-0 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary via-tertiary to-secondary animate-pulse opacity-80" />
          <div className="relative w-full h-full rounded-full overflow-hidden bg-surface-container-lowest">
            <img
              src={userAvatar}
              alt={user.name || 'User Avatar'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="hidden sm:block text-left max-w-[120px]">
          <p className="text-xs font-semibold text-on-surface truncate leading-tight group-hover:text-primary transition-colors">
            {user.name || 'Creator'}
          </p>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-on-surface transition-colors" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/30 py-2 z-50 animate-fadeIn text-on-surface">
          {/* User Profile Header */}
          <div className="px-4 py-3 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-2xl p-0.5 shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary via-purple-500 to-tertiary animate-pulse opacity-90 shadow-md" />
                <div className="relative w-full h-full rounded-[14px] overflow-hidden bg-surface-container-lowest">
                  <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-on-surface truncate">{user.name}</p>
                <p className="text-[11px] text-on-surface-variant truncate font-mono">{user.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-surface-container font-mono text-[10px] text-primary font-semibold">
                  Creator Account
                </span>
              </div>
            </div>
          </div>

          {/* Change Headshot Toggle / Picker */}
          <div className="p-2 border-b border-outline-variant/20">
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-primary" />
                <span>Geometric Avatar or Photo</span>
              </span>
              <button
                type="button"
                onClick={() => setIsChangingHeadshot(!isChangingHeadshot)}
                className="text-[11px] font-mono text-primary hover:underline cursor-pointer"
              >
                {isChangingHeadshot ? 'Close' : 'Change'}
              </button>
            </div>

            {isChangingHeadshot && (
              <div className="flex flex-col gap-2 p-2 mt-1 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-on-surface-variant font-mono">Geometric designs or upload:</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadHeadshot}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-1 text-[11px] text-tertiary hover:underline font-mono cursor-pointer"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3 h-3" />
                    )}
                    <span>Upload Photo</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {HEADSHOT_PRESETS.map((preset) => {
                    const isSelected = userAvatar === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectHeadshot(preset.url)}
                        className={`relative group rounded-xl p-0.5 aspect-square transition-all cursor-pointer flex items-center justify-center ${
                          isSelected ? 'scale-105 z-10' : 'opacity-85 hover:opacity-100'
                        }`}
                        title={preset.name}
                      >
                        {/* Animated Glow Aura */}
                        <div
                          className={`absolute inset-0 rounded-xl bg-gradient-to-tr ${preset.aura || 'from-primary to-tertiary'} opacity-75 blur-[2px] transition-all ${
                            isSelected
                              ? 'opacity-100 ring-2 ring-tertiary shadow-[0_0_8px_rgba(78,222,163,0.5)]'
                              : 'group-hover:opacity-90'
                          }`}
                        />
                        <div className="relative w-full h-full rounded-[10px] overflow-hidden bg-surface-container-lowest border border-white/20">
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-tertiary/25 flex items-center justify-center">
                              <Check className="w-3 h-3 text-surface stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="p-1.5 space-y-0.5">
            {onGoToDashboard && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onGoToDashboard();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-on-surface hover:text-primary hover:bg-surface-container rounded-xl transition-colors text-left cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-on-surface-variant" />
                <span>My Forms Dashboard</span>
              </button>
            )}

            {onGoToMainPage && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onGoToMainPage();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-on-surface hover:text-primary hover:bg-surface-container rounded-xl transition-colors text-left cursor-pointer"
              >
                <Home className="w-4 h-4 text-on-surface-variant" />
                <span>Back to Main Page</span>
              </button>
            )}
          </div>

          {/* Logout */}
          <div className="pt-1 mt-1 border-t border-outline-variant/20 p-1.5">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-error hover:bg-error-container/20 rounded-xl transition-colors text-left font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-error" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
