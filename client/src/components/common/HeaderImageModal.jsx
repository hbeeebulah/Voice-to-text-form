import React, { useState, useRef } from 'react';
import { uploadFile } from '../../services/api';

export default function HeaderImageModal({
  isOpen,
  onClose,
  currentHeaderUrl,
  onSaveHeader,
  onRemoveHeader,
  formTitle = 'Form Header'
}) {
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'upload' | 'mesh' | 'url'
  const [selectedUrl, setSelectedUrl] = useState(currentHeaderUrl || '');
  const [dimmerValue, setDimmerValue] = useState(45);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const presets = [
    {
      id: 'prisms',
      name: 'Dark 3D Prisms',
      tag: 'Obsidian / Neon',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChCTX-OVHqJD5ZrIdu7EUKCqoJkMJxjRi_CuAeNHWJK4sID5dfUoH0OSDvYOnRA0upaMTi07ABtzJ-sFDdAEfgB-amOKlK3Frgdu8dFW2RbAkhLGk-YXpSn6kFligsoG5-lezan34ZZure_gOqGUThwBxDm9BJErkG5CU1UA-2nyQN2uDfVeGrvFQtXkFIE98T-kMKQ0eykqaiMJwJm8IkLjm_9IcmIknXP3_8hHxjFFJd60QRJLWWVg'
    },
    {
      id: 'waves',
      name: 'Holographic Waves',
      tag: 'Cyan / Emerald',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDK698vDb9aQ2pyHFXOXO2e_qIWUuzAA-pDrg1nhArEI3vA3kM7l6FugPQiVmvrfH4y4xAALZfakn6blQdEyFCZVsu4Ta5xhTD3pZ4gBDsEVKeSm4egNnFbuER7NRD_X35sD8KamiAvyuwwdRbGBs_ECUiub2cClbrLNSHG42y1aHz8DgH7OpVKrU2w0Yek3sGQlIy-pmwpH8vF8n42hw0KUKRA0W0lFhpwsddS7KR0ynNHUfZ8xl8sQQ'
    },
    {
      id: 'consoles',
      name: 'Studio Consoles',
      tag: 'Telemetry Grid',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfEqnNz5jThMORtSwvRGFYOholr-40QWF3L5SEuUzblJUzblMznb4LT4R3QFVKgP9w968HyfJe9oxPKCef1oboBNh_gYvqnujGfSXiU1ndDy3C8hMqw1X0BvaDiugdnuJgFKt0rVyTQ7l0pd0Wxm-YuHDHis0lXeDHP7IPVgZ0Y45C8ZPqc1IIspufZAn9M6jvkVrGEHPbQ3_DuD46NFustUXLMt-lh4qK1gWrBhFVYpCjBHpf55Egdw'
    },
    {
      id: 'brutalist',
      name: 'Brutalist Angle',
      tag: 'Architectural / Mist',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWjHsR2s4PL7JrA0xNIm5ulAFfDwGsBpc3FNzDbCYIflWbtGp19yRFMtcGe_eODokjWEj9yn3Iagb2hI-tMm2lHlgEQt4b-MDuIZ9eJ4FkZ14rcCqcqEpznNpY9HtOOygTNXF0-Dwlc3q8p6uOTQD5Z-au0_mUy9LiLEsbl3Khtl_A3fIgG7ZFIpSOngAt5kXR8uMAmS1K-51EnJQI0oaGz3okJ6CP0atQxKSWN35OcHgzJzi6Sblatg'
    }
  ];

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP, SVG).');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError('');
      const data = await uploadFile(file);
      if (data?.fileUrl) {
        setSelectedUrl(data.fileUrl);
      }
    } catch (err) {
      setUploadError(err.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    onSaveHeader(selectedUrl);
    onClose();
  };

  const handleRemove = () => {
    setSelectedUrl('');
    onRemoveHeader();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn select-none">
      {/* Modal Window (Stitch 08 Window) */}
      <div className="relative w-full max-w-3xl my-auto rounded-2xl bg-surface-container-low/95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] p-5 sm:p-7 text-on-surface overflow-hidden border border-outline-variant/30">
        {/* Top Subtle Edge Flare */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-outline-variant/20">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">palette</span>
              <h2 className="font-headline-sm text-base sm:text-lg font-semibold tracking-tight text-on-surface">
                Cover Media & Branded Header Studio
              </h2>
            </div>
            <p className="text-xs text-on-surface-variant">
              Configure dynamic banners, generative gradients, and custom audio artworks.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Tabbed Navigation Bar */}
        <div className="relative flex items-center gap-1 p-1 rounded-xl bg-surface-container my-4 border border-outline-variant/20">
          {[
            { id: 'presets', label: 'Curated Presets' },
            { id: 'upload', label: 'Upload File' },
            { id: 'mesh', label: 'Generative Mesh' },
            { id: 'url', label: 'Custom URL' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 py-1.5 px-2 text-center rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-surface-container-high text-primary font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(192,193,255,0.8)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Presets & Dropzone Container */}
        <div className="space-y-4">
          {/* TAB 1: CURATED PRESETS */}
          {activeTab === 'presets' && (
            <div>
              <div className="flex items-center justify-between pb-2 font-mono text-xs">
                <span className="uppercase tracking-wider text-outline">
                  Preset Catalog • 4 Abstract Audio Themes
                </span>
                <span className="text-tertiary">
                  {selectedUrl ? 'Cover Selected' : 'Choose a Preset'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {presets.map((preset) => {
                  const isSelected = selectedUrl === preset.url;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedUrl(preset.url)}
                      className={`group relative rounded-xl overflow-hidden cursor-pointer p-1 transition-all border ${
                        isSelected
                          ? 'bg-surface-container border-primary-container shadow-md'
                          : 'bg-surface-container/60 hover:bg-surface-container border-outline-variant/20'
                      }`}
                    >
                      <div className="relative w-full h-24 rounded-lg overflow-hidden">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent" />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-lg">
                            <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                          </div>
                        )}
                      </div>
                      <div className="p-1.5">
                        <span className="text-xs font-semibold text-on-surface block truncate">
                          {preset.name}
                        </span>
                        <span className="font-mono text-[10px] text-outline block">{preset.tag}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative rounded-xl p-6 bg-surface-container/60 hover:bg-surface-container border-2 border-dashed border-primary-container/30 hover:border-primary-container/70 transition-all cursor-pointer group text-center shadow-inner flex flex-col items-center justify-center gap-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
              />
              <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary-container group-hover:text-on-primary-container transition-all">
                <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm text-on-surface font-medium block">
                  {isUploading ? 'Uploading...' : 'Drag & drop banner image, or browse files'}
                </span>
                <span className="font-mono text-[10px] text-outline block">
                  PNG, JPG, WEBP, SVG up to 25 MB • Recommended 1920×640px
                </span>
              </div>
              {uploadError && <p className="text-xs text-error">{uploadError}</p>}
            </div>
          )}

          {/* TAB 3: GENERATIVE MESH */}
          {activeTab === 'mesh' && (
            <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/20 flex flex-col gap-3">
              <span className="text-xs font-semibold text-on-surface">Generative Mesh Gradient</span>
              <p className="text-xs text-on-surface-variant">
                Synthesize a procedural algorithmic gradient based on your current theme tokens.
              </p>
              <button
                type="button"
                onClick={() => setSelectedUrl('')}
                className="px-4 py-2 rounded-xl bg-primary-container text-on-primary-container text-xs font-semibold self-start"
              >
                Use Dynamic SVG Mesh
              </button>
            </div>
          )}

          {/* TAB 4: CUSTOM URL */}
          {activeTab === 'url' && (
            <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/20 flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-on-surface">External Image URL</span>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="flex-1 bg-surface-container px-3 py-2 rounded-xl text-xs text-on-surface border border-outline-variant/30 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSelectedUrl(customUrlInput.trim())}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* Live Cover Aspect Ratio Preview Frame (16:9 / Banner Mode) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="uppercase tracking-wider text-outline font-semibold">
                  Interactive Banner Alignment Preview
                </span>
                <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface text-[10px]">
                  16:9 Aspect
                </span>
              </div>
              <div className="flex items-center gap-1 text-outline text-[11px]">
                <span className="material-symbols-outlined text-[14px] text-tertiary">open_with</span>
                <span>Drag to reposition</span>
              </div>
            </div>

            <div className="relative w-full h-40 sm:h-44 rounded-xl overflow-hidden bg-surface-container-lowest shadow-md group border border-outline-variant/30">
              {/* Simulated Banner Background with dynamic dimming overlay */}
              {selectedUrl ? (
                <img
                  src={selectedUrl}
                  alt="Banner Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-secondary-container via-surface-container-high to-tertiary-container" />
              )}

              {/* Dimming Scrim Layer */}
              <div
                className="absolute inset-0 transition-colors"
                style={{ backgroundColor: `rgba(10, 14, 23, ${dimmerValue / 100})` }}
              />

              {/* Alignment Composition Lines (Rule of Thirds) */}
              <div className="absolute inset-0 grid grid-cols-3 pointer-events-none opacity-40">
                <div className="h-full bg-gradient-to-r from-transparent via-white/10 to-transparent w-[1px] mx-auto" />
                <div className="h-full bg-gradient-to-r from-transparent via-white/10 to-transparent w-[1px] mx-auto" />
              </div>
              <div className="absolute inset-0 grid grid-rows-3 pointer-events-none opacity-40">
                <div className="w-full bg-gradient-to-b from-transparent via-white/10 to-transparent h-[1px] my-auto" />
                <div className="w-full bg-gradient-to-b from-transparent via-white/10 to-transparent h-[1px] my-auto" />
              </div>

              {/* Centered Reposition Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-3 py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md flex items-center gap-1.5 shadow-lg border border-outline-variant/30">
                  <span className="material-symbols-outlined text-primary text-[14px]">crop_free</span>
                  <span className="font-mono text-[10px] text-on-surface">Anchor: Center (0px, -14px)</span>
                </div>
              </div>

              {/* Form Context Mock Header Info in Banner */}
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between pointer-events-none">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[16px]">graphic_eq</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-on-surface block leading-tight">
                      {formTitle}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">Live Banner Typography Check</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-tertiary px-2 py-0.5 rounded bg-surface-container-high/90 border border-tertiary/20">
                  HIGH CONTRAST OK
                </span>
              </div>
            </div>
          </div>

          {/* Dimming / Text Contrast Control Slider */}
          <div className="p-3 rounded-xl bg-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-outline-variant/20">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-on-surface block">
                Header Dimming • Text Contrast
              </span>
              <span className="font-mono text-[11px] text-outline block">
                Controls legibility filter over arbitrary photography
              </span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-64">
              <input
                type="range"
                min="0"
                max="90"
                value={dimmerValue}
                onChange={(e) => setDimmerValue(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-container-high text-primary min-w-[68px] text-center">
                {dimmerValue}% Dark
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Actions Toolbar */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-outline-variant/20">
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-1.5 text-error hover:text-on-error-container hover:bg-error-container/20 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            <span>Remove Cover</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary-container text-on-primary font-semibold text-xs shadow-[0_4px_16px_rgba(87,27,193,0.4)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Save Header Art</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
