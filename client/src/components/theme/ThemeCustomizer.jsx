import React, { useState, useRef } from 'react';
import {
  X,
  Palette,
  Check,
  Type,
  Layout,
  Sparkles,
  RotateCcw,
  Sliders,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';
import {
  CURATED_THEMES,
  ACCENT_PALETTES,
  BACKGROUND_STYLES,
  HEADER_FONTS,
  BODY_FONTS,
  HEADER_BANNER_PRESETS
} from '../../constants/themes';
import { uploadFile, getAssetUrl } from '../../services/api';

export default function ThemeCustomizer({
  theme = {},
  onUpdateTheme,
  onClose,
  isOpen = true
}) {
  const currentThemeId = theme.themeId || 'vibrant-gradient';
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  const handleBannerSelect = (url) => {
    onUpdateTheme({
      headerBannerUrl: url
    });
  };

  const handleBannerRemove = () => {
    onUpdateTheme({
      headerBannerUrl: ''
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError('');
      const data = await uploadFile(file);
      if (data?.fileUrl) {
        onUpdateTheme({
          headerBannerUrl: data.fileUrl
        });
      }
    } catch (err) {
      console.error('Failed to upload banner:', err);
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const applyCuratedTheme = (curated) => {
    onUpdateTheme({
      themeId: curated.id,
      accentColor: curated.accentColor,
      headerColor: curated.headerColor,
      backgroundColor: curated.backgroundColor,
      cardBackground: curated.cardBackground || '#ffffff',
      textColor: curated.textColor || '#0f172a',
      fontHeader: curated.fontHeader,
      fontBody: curated.fontBody,
      cardRoundness: curated.cardRoundness,
      buttonStyle: curated.buttonStyle,
      bannerGradient: curated.bannerGradient
    });
  };

  const handleAccentChange = (hex, headerHex) => {
    onUpdateTheme({
      accentColor: hex,
      headerColor: headerHex || hex,
      themeId: 'custom'
    });
  };

  const handleBackgroundChange = (bgStyle) => {
    onUpdateTheme({
      backgroundColor: bgStyle.color,
      themeId: 'custom'
    });
  };

  const handleHeaderFontChange = (fontId) => {
    onUpdateTheme({
      fontHeader: fontId
    });
  };

  const handleBodyFontChange = (fontId) => {
    onUpdateTheme({
      fontBody: fontId
    });
  };

  if (!isOpen) return null;

  return (
    <div className="w-full max-w-md bg-white border-l border-slate-200 shadow-xl flex flex-col h-full overflow-hidden animate-fadeIn">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-sm">Theme & Design Customizer</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Form Header Image & Banner Section */}
        <section className="space-y-3 pb-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Form Header Image</span>
            </label>
            {theme.headerBannerUrl && (
              <button
                type="button"
                onClick={handleBannerRemove}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>

          {/* Current Banner Preview or Placeholder */}
          {theme.headerBannerUrl ? (
            <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
              <img
                src={getAssetUrl(theme.headerBannerUrl)}
                alt="Form Header Banner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-white text-slate-800 text-[11px] font-semibold rounded-lg shadow-xs hover:bg-slate-100 cursor-pointer"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleBannerRemove}
                  className="p-1 bg-white text-rose-600 text-[11px] font-semibold rounded-lg shadow-xs hover:bg-rose-50 cursor-pointer"
                  title="Remove Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
              <p className="text-xs text-slate-500">
                No header image set. Choose a preset or upload your company banner below.
              </p>
            </div>
          )}

          {/* Upload and URL Action Buttons */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>URL</span>
            </button>
          </div>

          {uploadError && (
            <p className="text-[11px] text-rose-600">{uploadError}</p>
          )}

          {/* URL Input Form */}
          {showUrlInput && (
            <div className="flex gap-1.5 animate-fadeIn">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (customUrl.trim()) {
                    handleBannerSelect(customUrl.trim());
                    setShowUrlInput(false);
                    setCustomUrl('');
                  }
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}

          {/* Preset Banners Quick Grid */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-600 mb-2">
              Curated Stock Headers
            </span>
            <div className="grid grid-cols-4 gap-2">
              {HEADER_BANNER_PRESETS.map((preset) => {
                const isSelected = theme.headerBannerUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleBannerSelect(preset.url)}
                    className={`relative rounded-lg overflow-hidden border aspect-video transition-all group cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                    title={preset.title}
                  >
                    <img
                      src={preset.url}
                      alt={preset.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Curated Visual Themes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Curated Visual Themes
            </label>
            <span className="text-[11px] text-indigo-600 font-medium">1-Click Presets</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {CURATED_THEMES.map((item) => {
              const isSelected = currentThemeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => applyCuratedTheme(item)}
                  className={`p-3 text-left rounded-xl border text-xs transition-all relative group flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-800 truncate">{item.name}</span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                      {item.description}
                    </p>
                  </div>

                  {/* Visual theme mini swatch preview */}
                  <div className="mt-2.5 h-4 w-full rounded-md flex overflow-hidden border border-slate-200/80">
                    <div className="w-1/2 h-full" style={{ backgroundColor: item.backgroundColor }} />
                    <div className="w-1/2 h-full" style={{ backgroundColor: item.accentColor }} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Accent Color Palette */}
        <section>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            Primary Accent Color
          </label>
          <div className="grid grid-cols-4 gap-2">
            {ACCENT_PALETTES.map((color) => {
              const isSelected = (theme.accentColor || '').toLowerCase() === color.value.toLowerCase();
              return (
                <button
                  key={color.value}
                  onClick={() => handleAccentChange(color.value, color.header)}
                  className={`h-10 rounded-xl flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-slate-800 border-transparent shadow-sm'
                      : 'border-slate-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {isSelected && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
                </button>
              );
            })}
          </div>

          {/* Custom Hex input */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Custom Hex:</span>
            <input
              type="text"
              value={theme.accentColor || '#6366f1'}
              onChange={(e) => handleAccentChange(e.target.value)}
              className="w-28 px-2 py-1 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
            />
            <input
              type="color"
              value={theme.accentColor || '#6366f1'}
              onChange={(e) => handleAccentChange(e.target.value)}
              className="w-7 h-7 rounded-lg border border-slate-300 p-0.5 cursor-pointer"
            />
          </div>
        </section>

        {/* Background Styling */}
        <section>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            Background Styling
          </label>
          <div className="grid grid-cols-3 gap-2">
            {BACKGROUND_STYLES.map((bg) => {
              const isSelected = (theme.backgroundColor || '').toLowerCase() === bg.color.toLowerCase();
              return (
                <button
                  key={bg.id}
                  onClick={() => handleBackgroundChange(bg)}
                  className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500 font-bold'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className="w-full h-5 rounded-md border border-slate-200 mb-1.5"
                    style={{ backgroundColor: bg.color }}
                  />
                  <span className="text-[11px] text-slate-700 truncate block">{bg.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Font Pairings */}
        <section className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Font Pairings & Typography
          </label>

          {/* Header Font */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-600 mb-1">
              Header Font
            </span>
            <select
              value={theme.fontHeader || 'Inter'}
              onChange={(e) => handleHeaderFontChange(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              {HEADER_FONTS.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>

          {/* Body Font */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-600 mb-1">
              Body / Question Font
            </span>
            <select
              value={theme.fontBody || 'Inter'}
              onChange={(e) => handleBodyFontChange(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              {BODY_FONTS.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Interactive Live Preview Box */}
        <section className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Live Preview Snippet
          </span>
          <div
            className="rounded-xl border shadow-xs overflow-hidden"
            style={{
              backgroundColor: theme.cardBackground || '#ffffff',
              borderColor: theme.borderColor || '#e2e8f0',
              fontFamily: theme.fontBody || 'Inter'
            }}
          >
            {theme.headerBannerUrl ? (
              <div className="h-20 w-full overflow-hidden bg-slate-100 relative">
                <img
                  src={getAssetUrl(theme.headerBannerUrl)}
                  alt="Preview Header"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div
                className="h-2 w-full"
                style={{
                  background: theme.bannerGradient || theme.accentColor || '#6366f1'
                }}
              />
            )}
            <div className="p-4">
              <h4
                className="text-sm font-bold mb-1"
                style={{
                  color: theme.textColor || '#0f172a',
                  fontFamily: theme.fontHeader || 'Inter'
                }}
              >
                How would you rate your experience?
              </h4>
              <p className="text-xs text-slate-500 mb-3">
                Use voice or select options below
              </p>
              <button
                type="button"
                className="px-3 py-1.5 text-xs text-white font-medium rounded-lg shadow-xs"
                style={{ backgroundColor: theme.accentColor || '#6366f1' }}
              >
                Sample Button
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <button
          onClick={() => applyCuratedTheme(CURATED_THEMES[0])}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Theme</span>
        </button>

        <button
          onClick={onClose}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
