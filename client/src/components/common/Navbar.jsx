import React from 'react';
import {
  FileText,
  Palette,
  Eye,
  Send,
  Sparkles,
  CloudCheck,
  CloudUpload,
  ArrowLeft,
  ChevronRight,
  FolderOpen
} from 'lucide-react';

export default function Navbar({
  formTitle,
  onTitleChange,
  activeTab,
  setActiveTab,
  responseCount = 0,
  isSaving = false,
  onOpenTheme,
  onOpenPreview,
  onOpenShare,
  onOpenApiKey,
  onGoToDashboard,
  hasApiKey = false,
  mode = 'builder' // 'builder' | 'responder'
}) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Section: Back button & Form Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={onGoToDashboard}
            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors shrink-0"
            title="Forms Dashboard"
          >
            <FolderOpen className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-200">
            <FileText className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            {mode === 'builder' ? (
              <input
                type="text"
                value={formTitle || ''}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Untitled Form"
                className="text-base font-semibold text-slate-800 bg-transparent hover:bg-slate-100/70 focus:bg-white px-2 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:border-indigo-400 focus:outline-none transition-all truncate max-w-sm sm:max-w-md"
              />
            ) : (
              <span className="text-base font-semibold text-slate-800 truncate">
                {formTitle || 'Voice Form'}
              </span>
            )}

            {mode === 'builder' && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 ml-1">
                {isSaving ? (
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <CloudUpload className="w-3.5 h-3.5 animate-bounce text-indigo-500" />
                    <span>Saving...</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400" title="All edits autosaved">
                    <CloudCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[11px]">Saved</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center Section: Tabs (Builder Mode only) */}
        {mode === 'builder' && (
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all relative ${
                activeTab === 'questions'
                  ? 'text-indigo-600 font-semibold bg-indigo-50/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Questions</span>
              {activeTab === 'questions' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('responses')}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all relative flex items-center gap-1.5 ${
                activeTab === 'responses'
                  ? 'text-indigo-600 font-semibold bg-indigo-50/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Responses</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'responses' ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {responseCount}
              </span>
              {activeTab === 'responses' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('theme')}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all relative flex items-center gap-1.5 ${
                activeTab === 'theme'
                  ? 'text-indigo-600 font-semibold bg-indigo-50/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Theme</span>
              {activeTab === 'theme' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          </div>
        )}

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2">
          {/* Voice AI Status / Settings */}
          <button
            onClick={onOpenApiKey}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-indigo-50/70 hover:border-indigo-200 hover:text-indigo-600 text-xs font-medium transition-all"
            title="Configure Voice AI Speech Engine"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Voice AI</span>
            <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
          </button>

          {mode === 'builder' && (
            <>
              {/* Theme panel trigger */}
              <button
                onClick={onOpenTheme}
                className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                title="Theme Customizer"
              >
                <Palette className="w-5 h-5" />
              </button>

              {/* Preview button */}
              <button
                onClick={onOpenPreview}
                className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                title="Preview Responder Form"
              >
                <Eye className="w-5 h-5" />
              </button>

              {/* Send / Share button */}
              <button
                onClick={onOpenShare}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </>
          )}

          {mode === 'responder' && (
            <button
              onClick={onOpenPreview}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            >
              <span>Edit Form</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Tabs */}
      {mode === 'builder' && (
        <div className="flex md:hidden border-t border-slate-100 px-4 py-1.5 justify-around bg-slate-50/80">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3 py-1 text-xs font-medium rounded-lg ${
              activeTab === 'questions' ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            Questions
          </button>
          <button
            onClick={() => setActiveTab('responses')}
            className={`px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-1 ${
              activeTab === 'responses' ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            <span>Responses</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              {responseCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-1 ${
              activeTab === 'theme' ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            <Palette className="w-3 h-3" />
            <span>Theme</span>
          </button>
        </div>
      )}
    </header>
  );
}
