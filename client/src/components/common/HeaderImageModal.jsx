import React, { useState, useRef } from 'react';
import {
  X,
  Image as ImageIcon,
  UploadCloud,
  Link as LinkIcon,
  Trash2,
  Check,
  Loader2,
  Sparkles,
  Building2
} from 'lucide-react';
import { HEADER_BANNER_PRESETS } from '../../constants/themes';
import { uploadFile, getAssetUrl } from '../../services/api';

export default function HeaderImageModal({
  isOpen,
  onClose,
  currentHeaderUrl,
  onSaveHeader,
  onRemoveHeader,
  formTitle = 'Form Header'
}) {
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'upload' | 'url'
  const [selectedUrl, setSelectedUrl] = useState(currentHeaderUrl || '');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleApplyPreset = (url) => {
    setSelectedUrl(url);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFileUpload(file);
  };

  const processFileUpload = async (file) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Image size exceeds 25 MB limit.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError('');
      const data = await uploadFile(file);
      if (data?.fileUrl) {
        setSelectedUrl(data.fileUrl);
      } else {
        throw new Error('Upload succeeded but no file URL returned.');
      }
    } catch (err) {
      console.error('Header image upload failed:', err);
      setUploadError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFileUpload(file);
    }
  };

  const handleCustomUrlApply = () => {
    if (!customUrlInput.trim()) return;
    setSelectedUrl(customUrlInput.trim());
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-tight">
                Form Header Image
              </h3>
              <p className="text-xs text-slate-500">
                Add your company banner, logo, or themed image to the top of the form
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="px-5 pt-4 pb-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Header Preview</span>
            {selectedUrl ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Image Selected
              </span>
            ) : (
              <span className="text-slate-400 font-normal">No header image currently set</span>
            )}
          </div>
          <div className="relative w-full h-28 sm:h-36 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner flex items-center justify-center">
            {selectedUrl ? (
              <img
                src={getAssetUrl(selectedUrl)}
                alt="Selected Form Header"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  setUploadError('Image failed to load. Please verify the URL.');
                }}
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-slate-400">
                <Building2 className="w-7 h-7 stroke-[1.5]" />
                <span className="text-xs font-medium">Select or upload an image below</span>
              </div>
            )}
            {selectedUrl && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-3 pointer-events-none">
                <span className="text-white text-xs font-semibold drop-shadow-sm truncate">
                  {formTitle || 'Untitled Form'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-5 mt-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preset Banners</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload from Device</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Image URL</span>
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: Curated Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Select a high-resolution curated header image:</span>
                <span className="text-[11px] text-indigo-600 font-medium">8 Presets</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {HEADER_BANNER_PRESETS.map((preset) => {
                  const isSelected = selectedUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.url)}
                      className={`group relative rounded-xl overflow-hidden border-2 text-left transition-all aspect-video flex flex-col justify-end p-2 cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 shadow-md ring-2 ring-indigo-500/30'
                          : 'border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </div>
                      )}

                      <span className="relative z-10 text-[11px] font-bold text-white drop-shadow-sm leading-tight line-clamp-1">
                        {preset.title}
                      </span>
                      <span className="relative z-10 text-[9px] text-white/80 uppercase font-semibold">
                        {preset.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Upload from Device */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  dragOver
                    ? 'border-indigo-600 bg-indigo-50/50 scale-101'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-white'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                  {isUploading ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <UploadCloud className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {isUploading ? 'Uploading Image...' : 'Click to browse or drag & drop'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload your company banner, logo, or photograph
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    PNG, JPG, WEBP, SVG or GIF (Max 25 MB)
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isUploading}
                  className="px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 text-xs font-semibold rounded-xl border border-indigo-200 shadow-2xs transition-colors cursor-pointer"
                >
                  {isUploading ? 'Processing...' : 'Browse Computer'}
                </button>
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 animate-fadeIn">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Custom URL */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Paste Direct Image Address (URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/company-banner.png"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleCustomUrlApply}
                    disabled={!customUrlInput.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    Preview
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Ensure the image link is publicly accessible (e.g. from your company website, Cloudinary, AWS S3, or Imgur).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
          <div>
            {(currentHeaderUrl || selectedUrl) && (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Header</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all hover:scale-102 cursor-pointer"
            >
              Save Header
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
