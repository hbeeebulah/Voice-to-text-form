import React from 'react';
import {
  X,
  Palette,
  Check,
  Type,
  Layout,
  Sparkles,
  RotateCcw,
  Sliders
} from 'lucide-react';
import {
  CURATED_THEMES,
  ACCENT_PALETTES,
  BACKGROUND_STYLES,
  HEADER_FONTS,
  BODY_FONTS
} from '../../constants/themes';

export default function ThemeCustomizer({
  theme = {},
  onUpdateTheme,
  onClose,
  isOpen = true
}) {
  const currentThemeId = theme.themeId || 'vibrant-gradient';

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
            className="p-4 rounded-xl border shadow-xs"
            style={{
              backgroundColor: theme.cardBackground || '#ffffff',
              borderColor: theme.borderColor || '#e2e8f0',
              fontFamily: theme.fontBody || 'Inter'
            }}
          >
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
