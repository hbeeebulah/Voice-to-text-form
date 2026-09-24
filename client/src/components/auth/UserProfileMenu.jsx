import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  LogOut,
  ChevronDown,
  FolderOpen
} from 'lucide-react';
import { logoutUser } from '../../services/api';

export default function UserProfileMenu({
  user,
  onOpenAuth,
  onUserLoggedOut,
  onGoToDashboard
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutUser();
    setIsOpen(false);
    if (onUserLoggedOut) onUserLoggedOut();
  };

  // If not logged in, render Sign In CTA button
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenAuth('login')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-all border border-indigo-200/60 shadow-xs cursor-pointer"
        >
          <User className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenAuth('signup')}
          className="hidden sm:inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
        >
          <span>Sign Up</span>
        </button>
      </div>
    );
  }

  const initials = (user.name || user.email || 'U')
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-2 sm:pr-2.5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer group"
      >
        {/* Avatar container */}
        <div className="relative">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || 'User Avatar'}
              className="w-7 h-7 rounded-xl object-cover ring-1 ring-slate-200"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-1 ring-slate-200 ${
              user.avatarUrl ? 'hidden' : 'flex'
            }`}
          >
            {initials}
          </div>
        </div>

        <div className="hidden sm:block text-left max-w-[120px]">
          <p className="text-xs font-semibold text-slate-800 truncate leading-tight group-hover:text-indigo-600 transition-colors">
            {user.name || 'Creator'}
          </p>
          <p className="text-[10px] text-slate-400 truncate">
            Creator
          </p>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Profile Header */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-xs shrink-0 overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-1 space-y-0.5">
            {onGoToDashboard && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onGoToDashboard();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-slate-400" />
                <span>My Forms Dashboard</span>
              </button>
            )}
          </div>

          {/* Logout */}
          <div className="pt-1 mt-1 border-t border-slate-100 p-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
