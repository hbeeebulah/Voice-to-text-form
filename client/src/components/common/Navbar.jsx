import React from 'react';
import { Star } from 'lucide-react';
import UserProfileMenu from '../auth/UserProfileMenu';

export default function Navbar({
  formTitle,
  onTitleChange,
  activeTab,
  setActiveTab,
  responseCount = 0,
  isSaving = false,
  isPublished = false,
  acceptingResponses = true,
  isStarred = false,
  onToggleStar,
  onOpenTheme,
  onOpenPreview,
  onOpenShare,
  onOpenAddUsers,
  onGoToDashboard,
  mode = 'builder', // 'builder' | 'responder'
  user = null,
  onOpenAuth,
  onUserLoggedOut,
  onUserUpdated,
  onGoToMainPage
}) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-md border-b border-outline-variant/20">
      <div className="h-16 w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Section: Logo, Breadcrumb & Editable Title */}
        <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
          <div
            onClick={onGoToDashboard}
            className="flex items-center gap-2 cursor-pointer group"
            title="Go to Dashboard"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary-container flex items-center justify-center text-on-primary shadow-sm group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
            </div>
            <span className="font-headline-sm text-base sm:text-lg text-on-surface tracking-tight font-bold hidden sm:inline-block">
              VoxForm
            </span>
          </div>

          <div className="h-4 w-px bg-outline-variant/30 hidden md:block" />

          {/* Breadcrumb & Title */}
          <div className="flex items-center gap-1.5 text-on-surface-variant min-w-0">
            {mode === 'builder' ? (
              <div className="flex items-center gap-1.5 group max-w-[200px] sm:max-w-[280px] md:max-w-[340px]">
                <input
                  type="text"
                  value={formTitle || ''}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="Untitled Form"
                  className="bg-transparent text-xs sm:text-sm text-on-surface font-semibold truncate group-hover:text-primary transition-colors focus:bg-surface-container/60 focus:outline-none focus:ring-1 focus:ring-primary/40 rounded px-1.5 py-0.5 -ml-1 w-full"
                />
                <button
                  type="button"
                  onClick={onToggleStar}
                  className="p-1 rounded-md hover:bg-surface-container-high transition-transform active:scale-90 cursor-pointer shrink-0"
                  title={isStarred ? 'Starred (click to unstar)' : 'Star form'}
                  aria-label={isStarred ? 'Starred (click to unstar)' : 'Star form'}
                >
                  <Star
                    className={`w-4 h-4 transition-colors ${
                      isStarred
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-on-surface-variant/50 hover:text-amber-400'
                    }`}
                  />
                </button>
              </div>
            ) : (
              <span className="text-xs sm:text-sm text-on-surface font-semibold truncate max-w-[200px] sm:max-w-[320px]">
                {formTitle || 'VoxForm'}
              </span>
            )}
          </div>
        </div>

        {/* Center: Segmented Navigation (Builder Mode) */}
        {mode === 'builder' && (
          <div className="hidden md:flex flex-1 justify-center max-w-md">
            <nav className="flex items-center bg-surface-container-low p-1 rounded-full border border-outline-variant/20 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('questions')}
                className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                  activeTab === 'questions'
                    ? 'bg-surface-container-high text-on-surface font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface font-medium'
                }`}
              >
                Questions
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('responses')}
                className={`px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'responses'
                    ? 'bg-surface-container-high text-on-surface font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface font-medium'
                }`}
              >
                <span>Responses</span>
                <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-[10px] font-mono text-primary font-bold">
                  {responseCount}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenTheme}
                className={`px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === 'theme'
                    ? 'bg-surface-container-high text-on-surface font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[15px] text-secondary">palette</span>
                <span>Theme</span>
              </button>
            </nav>
          </div>
        )}

        {/* Right Section: Cloud Save, Preview, Share & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {mode === 'builder' && (
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low text-xs border border-outline-variant/20">
              <span className={`material-symbols-outlined text-[15px] ${isSaving ? 'text-primary animate-spin' : 'text-tertiary'}`}>
                {isSaving ? 'sync' : 'cloud_done'}
              </span>
              <span className="text-on-surface-variant font-mono text-[11px]">
                {isSaving ? 'Saving...' : 'Saved'}
              </span>
            </div>
          )}

          {mode === 'builder' && (
            <>
              {/* Add Users / Collaborators Button */}
              {onOpenAddUsers && (
                <button
                  type="button"
                  onClick={onOpenAddUsers}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/30 transition-all cursor-pointer"
                  title="Add Users & Manage Form Access"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">person_add</span>
                  <span className="hidden sm:inline">Add Users</span>
                </button>
              )}

              {/* Preview Button */}
              <button
                type="button"
                onClick={onOpenPreview}
                className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                title="Preview Form"
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
              </button>

              {/* Publish & Status Button */}
              <button
                type="button"
                onClick={onOpenShare}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm cursor-pointer ${
                  !isPublished
                    ? 'bg-gradient-to-r from-primary to-indigo-600 hover:opacity-95 text-white ring-2 ring-primary/40'
                    : acceptingResponses === false
                      ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:opacity-95 text-white shadow-rose-900/30'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white'
                }`}
                title={
                  !isPublished
                    ? 'Publish this form to the public'
                    : acceptingResponses === false
                      ? 'Form is Published but Closed — Click to Reopen or Manage Link'
                      : 'Form is Live & Published — Click to Share or Manage Link'
                }
              >
                <span className="material-symbols-outlined text-[16px]">
                  {!isPublished ? 'rocket_launch' : acceptingResponses === false ? 'do_not_disturb_on' : 'check_circle'}
                </span>
                <span>
                  {!isPublished ? 'Publish' : acceptingResponses === false ? 'Closed' : 'Published'}
                </span>
              </button>
            </>
          )}

          {/* User Profile Menu with Headshot */}
          <div className="pl-1 border-l border-outline-variant/30">
            <UserProfileMenu
              user={user}
              onOpenAuth={onOpenAuth}
              onUserLoggedOut={onUserLoggedOut}
              onGoToDashboard={onGoToDashboard}
              onGoToMainPage={onGoToMainPage}
              onUserUpdated={onUserUpdated}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Tabs */}
      {mode === 'builder' && (
        <div className="flex md:hidden border-t border-outline-variant/20 px-3 py-1.5 justify-around bg-surface-container-lowest/90 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'questions' ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant'
            }`}
          >
            Questions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('responses')}
            className={`px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors ${
              activeTab === 'responses' ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant'
            }`}
          >
            <span>Responses</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-surface-container text-primary font-mono">
              {responseCount}
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenTheme}
            className={`px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors ${
              activeTab === 'theme' ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] text-secondary">palette</span>
            <span>Theme</span>
          </button>
        </div>
      )}
    </header>
  );
}
