import React, { useState } from 'react';

export default function ThemeCustomizer({
  theme = {},
  onUpdateTheme,
  onClose,
  isOpen = true
}) {
  const [accentColor, setAccentColor] = useState(theme.accentColor || '#8083ff');
  const [backgroundColor, setBackgroundColor] = useState(theme.backgroundColor || '#0f131c');
  const [voiceGlow, setVoiceGlow] = useState(theme.voiceGlow || '#4edea3');
  const [selectedPreset, setSelectedPreset] = useState(theme.themeId || 'obsidian');
  const [selectedPairing, setSelectedPairing] = useState(theme.fontPairing || 'jakarta-inter');
  const [radius, setRadius] = useState(theme.cardRoundness || '16px');
  const [shaderOrbs, setShaderOrbs] = useState(theme.shaderOrbs !== false);
  const [gridTexture, setGridTexture] = useState(theme.gridTexture !== false);
  const [sonicWaveOverlay, setSonicWaveOverlay] = useState(theme.sonicWaveOverlay !== false);
  const [isLiveActive, setIsLiveActive] = useState(true);

  if (!isOpen) return null;

  const presets = [
    {
      id: 'obsidian',
      name: 'Obsidian Studio',
      accent: '#8083ff',
      bg: '#0f131c',
      glow: '#4edea3',
      colors: ['#0a0e17', '#8083ff', '#571bc1'],
      badge: 'v1.2'
    },
    {
      id: 'emerald',
      name: 'Emerald Neural',
      accent: '#4edea3',
      bg: '#121b16',
      glow: '#00885d',
      colors: ['#121b16', '#4edea3', '#00885d'],
      badge: '#4edea3'
    },
    {
      id: 'violet',
      name: 'Violet Horizon',
      accent: '#d0bcff',
      bg: '#181126',
      glow: '#e9ddff',
      colors: ['#181126', '#d0bcff', '#e9ddff'],
      badge: '#d0bcff'
    },
    {
      id: 'monochrome',
      name: 'Monochrome',
      accent: '#dfe2ef',
      bg: '#0a0e17',
      glow: '#353943',
      colors: ['#0a0e17', '#353943', '#dfe2ef'],
      badge: '#dfe2ef'
    }
  ];

  const applyPreset = (preset) => {
    setSelectedPreset(preset.id);
    setAccentColor(preset.accent);
    setBackgroundColor(preset.bg);
    setVoiceGlow(preset.glow);
    if (isLiveActive) {
      onUpdateTheme({
        themeId: preset.id,
        accentColor: preset.accent,
        backgroundColor: preset.bg,
        voiceGlow: preset.glow
      });
    }
  };

  const handleApply = () => {
    onUpdateTheme({
      themeId: selectedPreset,
      accentColor,
      backgroundColor,
      voiceGlow,
      fontPairing: selectedPairing,
      cardRoundness: radius,
      shaderOrbs,
      gridTexture,
      sonicWaveOverlay
    });
    if (onClose) onClose();
  };

  const handleReset = () => {
    const defaultPreset = presets[0];
    applyPreset(defaultPreset);
    setRadius('16px');
    setShaderOrbs(true);
    setGridTexture(true);
    setSonicWaveOverlay(true);
  };

  return (
    <aside className="fixed right-0 top-0 bottom-0 h-full w-full max-w-[440px] bg-surface-container-low/95 backdrop-blur-2xl shadow-2xl flex flex-col z-50 overflow-hidden border-l border-outline-variant/30 select-none animate-fadeIn">
      {/* Drawer Header (Stitch Exact Header) */}
      <div className="px-5 py-4 bg-surface-container-low shadow-sm flex items-center justify-between shrink-0 border-b border-outline-variant/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">palette</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-base font-semibold text-on-surface tracking-tight">
              Theme & Design Studio
            </h2>
            <span className="font-mono text-[11px] text-outline">Interactive Token Customizer</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Live Preview Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors">
            <input
              type="checkbox"
              checked={isLiveActive}
              onChange={(e) => setIsLiveActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-tertiary relative" />
            <span className="font-mono text-[10px] text-tertiary font-bold pr-1">LIVE</span>
          </label>

          {/* Reset Ghost Button */}
          <button
            type="button"
            onClick={handleReset}
            className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
            title="Reset all tokens to default"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      {/* Drawer Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
        {/* Section 1: Curated Themes */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="uppercase tracking-wider text-outline font-semibold">Curated Themes</span>
              <span className="text-outline">({presets.length} Presets)</span>
            </div>
            <span className="font-mono text-xs text-primary cursor-pointer hover:underline">Explore Store</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {presets.map((preset) => {
              const isActive = selectedPreset === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-surface-container-high border-primary-container shadow-md'
                      : 'bg-surface-container/60 hover:bg-surface-container border-outline-variant/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-on-surface">{preset.name}</span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: preset.accent }}
                    />
                  </div>

                  <div className="flex items-center gap-1.5 mb-2">
                    {preset.colors.map((c, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full border border-white/10 shadow-xs"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-medium ${
                      isActive ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-on-surface-variant'
                    }`}>
                      {isActive ? 'Selected' : 'Preset'}
                    </span>
                    <span className="font-mono text-[10px] text-outline">{preset.badge}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Color Token Mapping */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-outline font-semibold">
              Color Token Mapping
            </span>
            <span className="font-mono text-xs text-tertiary">3 Custom Overrides</span>
          </div>

          <div className="flex flex-col gap-1.5 bg-surface-container/70 rounded-xl p-2 border border-outline-variant/20">
            {/* Token 1: Primary Accent */}
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-high transition-colors">
              <div className="flex items-center gap-2.5">
                <label
                  className="w-8 h-8 rounded-full shadow-md flex items-center justify-center relative cursor-pointer border border-white/20"
                  style={{ backgroundColor: accentColor }}
                >
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => {
                      setAccentColor(e.target.value);
                      if (isLiveActive) onUpdateTheme({ accentColor: e.target.value });
                    }}
                    className="opacity-0 absolute inset-0 cursor-pointer"
                  />
                  <span className="material-symbols-outlined text-[14px] text-white">colorize</span>
                </label>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-on-surface">Primary Accent</span>
                  <span className="font-mono text-[10px] text-outline">var(--token-primary)</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => {
                    setAccentColor(e.target.value);
                    if (isLiveActive) onUpdateTheme({ accentColor: e.target.value });
                  }}
                  className="w-24 px-2 py-1 rounded bg-surface-container-highest text-on-surface font-mono text-xs text-center uppercase focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
            </div>

            {/* Token 2: Background Tint */}
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-high transition-colors">
              <div className="flex items-center gap-2.5">
                <label
                  className="w-8 h-8 rounded-full shadow-md flex items-center justify-center relative cursor-pointer border border-white/20"
                  style={{ backgroundColor: backgroundColor }}
                >
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => {
                      setBackgroundColor(e.target.value);
                      if (isLiveActive) onUpdateTheme({ backgroundColor: e.target.value });
                    }}
                    className="opacity-0 absolute inset-0 cursor-pointer"
                  />
                  <span className="material-symbols-outlined text-[14px] text-white">colorize</span>
                </label>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-on-surface">Background Tint</span>
                  <span className="font-mono text-[10px] text-outline">var(--token-bg)</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => {
                    setBackgroundColor(e.target.value);
                    if (isLiveActive) onUpdateTheme({ backgroundColor: e.target.value });
                  }}
                  className="w-24 px-2 py-1 rounded bg-surface-container-highest text-on-surface font-mono text-xs text-center uppercase focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
            </div>

            {/* Token 3: Voice Glow */}
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-high transition-colors">
              <div className="flex items-center gap-2.5">
                <label
                  className="w-8 h-8 rounded-full shadow-md flex items-center justify-center relative cursor-pointer border border-white/20"
                  style={{ backgroundColor: voiceGlow }}
                >
                  <input
                    type="color"
                    value={voiceGlow}
                    onChange={(e) => {
                      setVoiceGlow(e.target.value);
                      if (isLiveActive) onUpdateTheme({ voiceGlow: e.target.value });
                    }}
                    className="opacity-0 absolute inset-0 cursor-pointer"
                  />
                  <span className="material-symbols-outlined text-[14px] text-white">colorize</span>
                </label>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-on-surface">Voice Glow</span>
                  <span className="font-mono text-[10px] text-outline">var(--token-glow)</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={voiceGlow}
                  onChange={(e) => {
                    setVoiceGlow(e.target.value);
                    if (isLiveActive) onUpdateTheme({ voiceGlow: e.target.value });
                  }}
                  className="w-24 px-2 py-1 rounded bg-surface-container-highest text-on-surface font-mono text-xs text-center uppercase focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Typography Pairings */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-outline font-semibold">
              Typography Pairing
            </span>
            <span className="font-mono text-[11px] text-outline">Fluid Scale (8px Grid)</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {[
              { id: 'jakarta-inter', title: 'Plus Jakarta Sans + Inter', desc: 'Modern Editorial Hierarchy', glyph: 'Aa' },
              { id: 'syne-space', title: 'Syne + Space Grotesk', desc: 'Avant-Garde Tech Expression', glyph: 'Ag' },
              { id: 'mono-inter', title: 'JetBrains Mono + Inter', desc: 'Engineering & Data Rigor', glyph: '>_' }
            ].map((pair) => {
              const isSelected = selectedPairing === pair.id;
              return (
                <div
                  key={pair.id}
                  onClick={() => setSelectedPairing(pair.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-surface-container-high border-primary-container shadow-sm'
                      : 'bg-surface-container/60 hover:bg-surface-container border-outline-variant/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-primary-container/20 text-primary flex items-center justify-center font-bold text-xs">
                      {pair.glyph}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-on-surface">{pair.title}</span>
                      <span className="text-[11px] text-outline">{pair.desc}</span>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-[18px] ${isSelected ? 'text-primary' : 'text-outline-variant'}`}>
                    {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 4: Container Curvature */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-outline font-semibold">
              Container Curvature (Radius)
            </span>
            <span className="font-mono text-xs text-primary">--radius: {radius}</span>
          </div>

          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-surface-container border border-outline-variant/20">
            {[
              { label: 'Flat (0px)', val: '0px' },
              { label: 'Subtle (8px)', val: '8px' },
              { label: 'Modern (16px)', val: '16px' },
              { label: 'Squircle (24px)', val: '24px' }
            ].map((rad) => {
              const isSelected = radius === rad.val;
              return (
                <button
                  key={rad.val}
                  type="button"
                  onClick={() => setRadius(rad.val)}
                  className={`py-2 px-1 rounded-lg text-center font-mono text-[11px] transition-all cursor-pointer ${
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

        {/* Section 5: Atmospheric Shader Effects */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-outline font-semibold">
              Atmospheric Shader Effects
            </span>
            <span className="font-mono text-xs text-tertiary">3 ACTIVE</span>
          </div>

          <div className="flex flex-col gap-1 bg-surface-container/70 rounded-xl p-2.5 border border-outline-variant/20">
            {/* Orbs */}
            <div className="flex items-center justify-between p-1.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">blur_on</span>
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface font-medium">Ambient Glow Orbs</span>
                  <span className="text-[11px] text-outline">Volumetric radial mesh gradients</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={shaderOrbs}
                onChange={(e) => setShaderOrbs(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </div>

            {/* Grid Texture */}
            <div className="flex items-center justify-between p-1.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">grid_4x4</span>
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface font-medium">Editorial Grid Texture</span>
                  <span className="text-[11px] text-outline">Subtle 24px micro-dot underlay</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={gridTexture}
                onChange={(e) => setGridTexture(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </div>

            {/* Sonic Wave */}
            <div className="flex items-center justify-between p-1.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[20px]">graphic_eq</span>
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface font-medium">Sonic Waveform Overlay</span>
                  <span className="text-[11px] text-outline">Dynamic audio reactive loops</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={sonicWaveOverlay}
                onChange={(e) => setSonicWaveOverlay(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* Compiled Tokens Snapshot */}
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-inner flex flex-col gap-1">
          <div className="flex items-center justify-between text-outline font-mono text-[10px]">
            <span>COMPILED TOKENS JSON</span>
            <span className="text-tertiary">SYNTAX VALID</span>
          </div>
          <pre className="font-mono text-[11px] text-on-surface-variant p-2 bg-surface-container/40 rounded overflow-x-auto leading-relaxed">
{JSON.stringify({
  "--vox-accent": accentColor,
  "--vox-surface": backgroundColor,
  "--vox-glow": voiceGlow,
  "--vox-radius-base": radius,
  "--vox-shader-orbs": shaderOrbs
}, null, 2)}
          </pre>
        </div>
      </div>

      {/* Drawer Sticky Footer */}
      <div className="px-5 py-4 bg-surface-container-low border-t border-outline-variant/20 shadow-xl flex items-center justify-between gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 px-4 rounded-xl bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-bright transition-colors text-center cursor-pointer"
        >
          Discard Changes
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container text-on-primary-container text-xs font-semibold hover:opacity-95 shadow-lg shadow-primary-container/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">publish</span>
          <span>Apply & Publish</span>
        </button>
      </div>
    </aside>
  );
}
