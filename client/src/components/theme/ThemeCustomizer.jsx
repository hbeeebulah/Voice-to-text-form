import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Palette,
  Check,
  Plus,
  RefreshCw,
  X,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import {
  GOOGLE_FORMS_PALETTE,
  LIGHT_BACKGROUND_PRESETS,
  DARK_BACKGROUND_PRESETS,
  HEADER_BANNER_PRESETS
} from '../../constants/themes';

export default function ThemeCustomizer({
  theme = {},
  onUpdateTheme,
  onClose,
  isOpen = true
}) {
  const [mode, setMode] = useState(theme.mode || 'dark'); // 'light' | 'dark'
  const [accentColor, setAccentColor] = useState(theme.accentColor || '#673ab7');
  const [backgroundColor, setBackgroundColor] = useState(
    theme.backgroundColor || (theme.mode === 'light' ? '#f0ebf8' : '#0f131c')
  );
  const [voiceGlow, setVoiceGlow] = useState(theme.voiceGlow || '#4edea3');
  const [selectedPreset, setSelectedPreset] = useState(theme.themeId || (theme.mode === 'light' ? 'google-classic' : 'obsidian'));
  const [radius, setRadius] = useState(theme.cardRoundness || '16px');
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [customAccentInput, setCustomAccentInput] = useState(theme.accentColor || '#673ab7');
  const [customBgInput, setCustomBgInput] = useState(
    theme.backgroundColor || (theme.mode === 'light' ? '#f0ebf8' : '#0f131c')
  );

  useEffect(() => {
    if (theme.mode) setMode(theme.mode);
    if (theme.accentColor) {
      setAccentColor(theme.accentColor);
      setCustomAccentInput(theme.accentColor);
    }
    if (theme.backgroundColor) {
      setBackgroundColor(theme.backgroundColor);
      setCustomBgInput(theme.backgroundColor);
    }
  }, [theme]);

  if (!isOpen) return null;

  const curatedPresets = [
    {
      id: 'google-classic',
      name: 'Google Forms Classic',
      mode: 'light',
      accent: '#673ab7',
      bg: '#f0ebf8',
      glow: '#673ab7',
      badge: 'Google Forms'
    },
    {
      id: 'google-blue',
      name: 'Google Blue (Light)',
      mode: 'light',
      accent: '#2196f3',
      bg: '#e8f0fe',
      glow: '#2196f3',
      badge: 'Minimal'
    },
    {
      id: 'obsidian',
      name: 'Obsidian Studio (Dark)',
      mode: 'dark',
      accent: '#8083ff',
      bg: '#0f131c',
      glow: '#4edea3',
      badge: 'Dark Studio'
    },
    {
      id: 'violet-dark',
      name: 'Google Purple (Dark)',
      mode: 'dark',
      accent: '#9c27b0',
      bg: '#181126',
      glow: '#ba68c8',
      badge: 'Violet Dark'
    },
    {
      id: 'emerald',
      name: 'Emerald Neural (Dark)',
      mode: 'dark',
      accent: '#4edea3',
      bg: '#121b16',
      glow: '#00885d',
      badge: 'Emerald'
    },
    {
      id: 'warm-rose',
      name: 'Warm Rose (Light)',
      mode: 'light',
      accent: '#e91e63',
      bg: '#fce4ec',
      glow: '#f06292',
      badge: 'Pastel'
    }
  ];

  const handleModeChange = (newMode) => {
    setMode(newMode);
    let newBg = backgroundColor;
    if (newMode === 'light') {
      // Switch to harmonious light tint
      newBg = accentColor === '#673ab7' ? '#f0ebf8' : '#f6f8fc';
    } else {
      newBg = '#0f131c';
    }
    setBackgroundColor(newBg);
    setCustomBgInput(newBg);

    if (isLiveActive) {
      onUpdateTheme({
        mode: newMode,
        backgroundColor: newBg,
        accentColor
      });
    }
  };

  const handleSelectAccent = (colorVal) => {
    setAccentColor(colorVal);
    setCustomAccentInput(colorVal);

    // If in light mode and using default background, auto-harmonize light background tint
    let newBg = backgroundColor;
    if (mode === 'light' && (backgroundColor === '#f0ebf8' || backgroundColor === '#f6f8fc')) {
      newBg = colorVal === '#673ab7' ? '#f0ebf8' : `${colorVal}15`;
      setBackgroundColor(newBg);
      setCustomBgInput(newBg);
    }

    if (isLiveActive) {
      onUpdateTheme({
        accentColor: colorVal,
        backgroundColor: newBg,
        mode
      });
    }
  };

  const handleSelectBackground = (bgVal) => {
    setBackgroundColor(bgVal);
    setCustomBgInput(bgVal);
    if (isLiveActive) {
      onUpdateTheme({
        backgroundColor: bgVal,
        accentColor,
        mode
      });
    }
  };

  const handleApplyPreset = (preset) => {
    setSelectedPreset(preset.id);
    setMode(preset.mode);
    setAccentColor(preset.accent);
    setCustomAccentInput(preset.accent);
    setBackgroundColor(preset.bg);
    setCustomBgInput(preset.bg);
    setVoiceGlow(preset.glow);

    if (isLiveActive) {
      onUpdateTheme({
        themeId: preset.id,
        mode: preset.mode,
        accentColor: preset.accent,
        backgroundColor: preset.bg,
        voiceGlow: preset.glow
      });
    }
  };

  const handleApply = () => {
    onUpdateTheme({
      themeId: selectedPreset,
      mode,
      accentColor,
      backgroundColor,
      voiceGlow,
      cardRoundness: radius
    });
    if (onClose) onClose();
  };

  const handleReset = () => {
    const defaultPreset = curatedPresets[0];
    handleApplyPreset(defaultPreset);
    setRadius('16px');
  };

  const currentBgPresets = mode === 'light' ? LIGHT_BACKGROUND_PRESETS : DARK_BACKGROUND_PRESETS;

  return (
    <aside className="fixed right-0 top-0 bottom-0 h-full w-full max-w-[440px] bg-surface-container-low/95 backdrop-blur-2xl shadow-2xl flex flex-col z-50 overflow-hidden border-l border-outline-variant/30 select-none animate-fadeIn">
      {/* Header */}
      <div className="px-5 py-4 bg-surface-container-low shadow-sm flex items-center justify-between shrink-0 border-b border-outline-variant/20">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: accentColor }}
          >
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-base text-on-surface tracking-tight">
              Theme Options
            </h2>
            <span className="font-mono text-[11px] text-outline">Google Forms Palette & Modes</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Preview Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors">
            <input
              type="checkbox"
              checked={isLiveActive}
              onChange={(e) => setIsLiveActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-7 h-3.5 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-tertiary relative" />
            <span className="font-mono text-[10px] text-tertiary font-bold pr-1">LIVE</span>
          </label>

          <button
            type="button"
            onClick={handleReset}
            className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            title="Reset to Google Forms default"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
        {/* 1. LIGHT / DARK THEME MODE TOGGLE */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-outline font-semibold">
              Appearance Mode
            </span>
            <span className="font-mono text-[11px] text-primary capitalize">{mode} Theme Active</span>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface-container border border-outline-variant/20">
            <button
              type="button"
              onClick={() => handleModeChange('light')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                mode === 'light'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light Theme</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('dark')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                mode === 'dark'
                  ? 'bg-primary text-on-primary shadow-md font-bold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark Theme</span>
            </button>
          </div>
        </section>

        {/* 2. GOOGLE FORMS THEME COLOR PALETTE */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-outline font-semibold">
              Theme Color
            </span>
            <span className="font-mono text-[11px] font-bold uppercase" style={{ color: accentColor }}>
              {accentColor}
            </span>
          </div>

          {/* Swatches Grid */}
          <div className="grid grid-cols-8 gap-2.5 p-3 rounded-2xl bg-surface-container/70 border border-outline-variant/20">
            {GOOGLE_FORMS_PALETTE.map((c) => {
              const isSelected = accentColor.toLowerCase() === c.value.toLowerCase();
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => handleSelectAccent(c.value)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110 active:scale-95 flex items-center justify-center relative shadow-sm cursor-pointer border border-white/20"
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                  aria-label={c.name}
                >
                  {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md stroke-[3]" />}
                </button>
              );
            })}

            {/* Custom Color Picker Swatch */}
            <label
              className="w-8 h-8 rounded-full border-2 border-dashed border-outline hover:border-primary flex items-center justify-center relative cursor-pointer hover:scale-110 transition-transform bg-surface-container-highest"
              title="Add Custom Theme Color"
            >
              <input
                type="color"
                value={customAccentInput.startsWith('#') ? customAccentInput : '#673ab7'}
                onChange={(e) => handleSelectAccent(e.target.value)}
                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
              />
              <Plus className="w-4 h-4 text-primary" />
            </label>
          </div>

          {/* Custom Hex Input */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container/50 border border-outline-variant/20">
            <div
              className="w-6 h-6 rounded-lg shadow-sm border border-white/20 shrink-0"
              style={{ backgroundColor: accentColor }}
            />
            <input
              type="text"
              value={customAccentInput}
              onChange={(e) => {
                setCustomAccentInput(e.target.value);
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  handleSelectAccent(e.target.value);
                }
              }}
              placeholder="#673ab7"
              className="flex-1 bg-transparent text-xs font-mono text-on-surface uppercase focus:outline-none"
            />
            <span className="text-[10px] font-mono text-outline">Custom Hex</span>
          </div>
        </section>

        {/* 3. BACKGROUND COLOR (Presets + Custom Choice) */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-outline font-semibold">
              Background Color
            </span>
            <span className="font-mono text-[11px] font-bold uppercase text-on-surface">
              {backgroundColor}
            </span>
          </div>

          {/* Background Presets Swatches */}
          <div className="grid grid-cols-7 gap-2.5 p-3 rounded-2xl bg-surface-container/70 border border-outline-variant/20">
            {currentBgPresets.map((bg) => {
              const isSelected = backgroundColor.toLowerCase() === bg.value.toLowerCase();
              return (
                <button
                  key={bg.value}
                  type="button"
                  onClick={() => handleSelectBackground(bg.value)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110 active:scale-95 flex items-center justify-center relative shadow-sm cursor-pointer border border-white/25"
                  style={{ backgroundColor: bg.value }}
                  title={bg.name}
                  aria-label={bg.name}
                >
                  {isSelected && (
                    <Check
                      className={`w-4 h-4 drop-shadow-md stroke-[3] ${
                        mode === 'light' ? 'text-slate-900' : 'text-white'
                      }`}
                    />
                  )}
                </button>
              );
            })}

            {/* Custom Background Color Picker Swatch */}
            <label
              className="w-8 h-8 rounded-full border-2 border-dashed border-outline hover:border-tertiary flex items-center justify-center relative cursor-pointer hover:scale-110 transition-transform bg-surface-container-highest"
              title="Pick Any Custom Background Color"
            >
              <input
                type="color"
                value={customBgInput.startsWith('#') ? customBgInput : (mode === 'light' ? '#f0ebf8' : '#0f131c')}
                onChange={(e) => handleSelectBackground(e.target.value)}
                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
              />
              <Plus className="w-4 h-4 text-tertiary" />
            </label>
          </div>

          {/* Custom Background Hex Input */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container/50 border border-outline-variant/20">
            <div
              className="w-6 h-6 rounded-lg shadow-sm border border-white/20 shrink-0"
              style={{ backgroundColor }}
            />
            <input
              type="text"
              value={customBgInput}
              onChange={(e) => {
                setCustomBgInput(e.target.value);
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  handleSelectBackground(e.target.value);
                }
              }}
              placeholder={mode === 'light' ? '#f0ebf8' : '#0f131c'}
              className="flex-1 bg-transparent text-xs font-mono text-on-surface uppercase focus:outline-none"
            />
            <span className="text-[10px] font-mono text-outline">Custom Background</span>
          </div>
        </section>

        {/* 4. CURATED THEME PRESETS */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-outline font-semibold">
              Curated Style Presets
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {curatedPresets.map((preset) => {
              const isActive = selectedPreset === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isActive
                      ? 'bg-surface-container-high border-primary-container shadow-md'
                      : 'bg-surface-container/60 hover:bg-surface-container border-outline-variant/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-on-surface">{preset.name}</span>
                    <span
                      className="w-3 h-3 rounded-full border border-white/20 shadow-xs"
                      style={{ backgroundColor: preset.accent }}
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-3 w-8 rounded-full border border-white/10"
                      style={{ backgroundColor: preset.bg }}
                      title="Background"
                    />
                    <div
                      className="h-3 w-8 rounded-full border border-white/10"
                      style={{ backgroundColor: preset.accent }}
                      title="Accent"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-outline uppercase">{preset.mode}</span>
                    <span className="text-primary font-bold">{preset.badge}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. CONTAINER CURVATURE */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-outline font-semibold">
              Corner Roundness
            </span>
            <span className="font-mono text-xs text-primary">{radius}</span>
          </div>

          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-surface-container border border-outline-variant/20">
            {[
              { label: 'Sharp', val: '4px' },
              { label: 'Subtle', val: '8px' },
              { label: 'Rounded', val: '16px' },
              { label: 'Pill', val: '24px' }
            ].map((rad) => {
              const isSelected = radius === rad.val;
              return (
                <button
                  key={rad.val}
                  type="button"
                  onClick={() => {
                    setRadius(rad.val);
                    if (isLiveActive) onUpdateTheme({ cardRoundness: rad.val });
                  }}
                  className={`py-1.5 rounded-lg text-center font-mono text-[11px] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  {rad.label}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-4 bg-surface-container-low border-t border-outline-variant/20 shadow-xl flex items-center justify-between gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 px-4 rounded-xl bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-bright transition-colors text-center cursor-pointer"
        >
          Close
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Save Theme</span>
        </button>
      </div>
    </aside>
  );
}
