import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Code,
  Link2,
  Sparkles,
  Shuffle,
  Edit2,
  AlertCircle,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { saveFormSlug } from '../../services/api';

export default function ShareModal({
  isOpen,
  onClose,
  formId,
  formTitle,
  customSlug = '',
  onSlugUpdated
}) {
  const [copied, setCopied] = useState(false);
  const [shortCopied, setShortCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  // Short link management states
  const [activeSlug, setActiveSlug] = useState(customSlug || '');
  const [slugInput, setSlugInput] = useState(customSlug || '');
  const [isEditingSlug, setIsEditingSlug] = useState(!customSlug);
  const [isSavingSlug, setIsSavingSlug] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [slugSuccess, setSlugSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveSlug(customSlug || '');
      setSlugInput(customSlug || '');
      setIsEditingSlug(!customSlug);
      setSlugError('');
      setSlugSuccess('');
      setCopied(false);
      setShortCopied(false);
      setEmbedCopied(false);
    }
  }, [isOpen, customSlug]);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const longUrl = `${origin}/#form/${formId}`;
  const shortBaseUrl = `${origin}/s/`;
  const shortUrl = `${origin}/s/${activeSlug}`;
  const embedCode = `<iframe src="${activeSlug ? shortUrl : longUrl}" width="100%" height="800" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`;

  const copyToClipboard = (text, type = 'long') => {
    navigator.clipboard.writeText(text);
    if (type === 'long') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (type === 'short') {
      setShortCopied(true);
      setTimeout(() => setShortCopied(false), 2000);
    } else {
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    }
  };

  const handleSlugChange = (val) => {
    // Sanitize: lowercase, spaces to dashes, only valid characters
    const sanitized = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
    setSlugInput(sanitized);
    setSlugError('');
    setSlugSuccess('');
  };

  const handleRandomize = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSlugInput(result);
    setSlugError('');
    setSlugSuccess('');
  };

  const handleSaveSlug = async () => {
    const cleanSlug = slugInput.trim();
    if (!cleanSlug) {
      setSlugError('Please enter a unique name for your short link.');
      return;
    }

    if (cleanSlug.length < 2 || cleanSlug.length > 60) {
      setSlugError('Short link must be between 2 and 60 characters.');
      return;
    }

    setIsSavingSlug(true);
    setSlugError('');
    setSlugSuccess('');

    try {
      const res = await saveFormSlug(formId, cleanSlug);
      setActiveSlug(res.customSlug);
      setIsEditingSlug(false);
      setSlugSuccess('Custom short link saved successfully!');
      if (onSlugUpdated) onSlugUpdated(res.customSlug);
    } catch (err) {
      setSlugError(err.message || 'Failed to save short link.');
    } finally {
      setIsSavingSlug(false);
    }
  };

  const handleRemoveSlug = async () => {
    if (!window.confirm('Remove this custom short link? The long link will still work.')) return;
    setIsSavingSlug(true);
    try {
      await saveFormSlug(formId, '');
      setActiveSlug('');
      setSlugInput('');
      setIsEditingSlug(true);
      setSlugSuccess('');
      if (onSlugUpdated) onSlugUpdated('');
    } catch (err) {
      setSlugError(err.message || 'Failed to remove short link.');
    } finally {
      setIsSavingSlug(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
            <Share2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 pr-8">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Share Form with Responders</h3>
            <p className="text-xs text-slate-500 truncate">{formTitle || 'Untitled Form'}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* SECTION 1: Standard Public Link (Long Link) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Standard Public Link</span>
                <span className="text-[10px] font-normal text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  Full URL
                </span>
              </label>
              <span className="text-[11px] text-slate-400">Direct ID link</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={longUrl}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl text-slate-700 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(longUrl, 'long')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: Custom Short Link Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 border border-indigo-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Short Link Generator</h4>
                  <p className="text-[11px] text-slate-500">Create a personalized, easy-to-share short URL</p>
                </div>
              </div>

              {activeSlug && !isEditingSlug && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Active
                </span>
              )}
            </div>

            {/* Display Active Short Link if already created and not currently editing */}
            {activeSlug && !isEditingSlug ? (
              <div className="space-y-2 pt-1">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shortUrl}
                    className="w-full px-3 py-2 text-xs font-mono font-semibold bg-white border border-indigo-200 rounded-xl text-indigo-900 select-all focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(shortUrl, 'short')}
                      className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {shortCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{shortCopied ? 'Copied!' : 'Copy Short Link'}</span>
                    </button>
                    <a
                      href={shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center justify-center"
                      title="Open Short Link in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                  <span className="text-emerald-700 font-medium">✓ Ready to share with respondents</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSlugInput(activeSlug);
                        setIsEditingSlug(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Name</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveSlug}
                      className="text-red-500 hover:text-red-700 font-semibold underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Create or Edit Short Link Editor */
              <div className="space-y-3 pt-1">
                <p className="text-[11px] text-slate-600">
                  Type your desired custom name below. The short link will be:
                </p>

                {/* Website domain + custom unique name input */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center rounded-xl bg-white border border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 overflow-hidden shadow-2xs">
                  <span className="px-3 py-2 bg-slate-100 text-slate-500 font-mono text-xs border-b sm:border-b-0 sm:border-r border-slate-200 select-none whitespace-nowrap">
                    {shortBaseUrl}
                  </span>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="e.g. feedback-survey"
                    className="flex-1 px-3 py-2 text-xs font-mono text-indigo-950 font-bold placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleRandomize}
                    className="px-2.5 py-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 text-xs transition-colors border-t sm:border-t-0 sm:border-l border-slate-200 flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                    title="Generate a random short code"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Random</span>
                  </button>
                </div>

                {/* Validation and Feedback Message */}
                {slugError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{slugError}</span>
                  </div>
                )}
                {slugSuccess && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{slugSuccess}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  {isEditingSlug && activeSlug ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingSlug(false);
                        setSlugInput(activeSlug);
                        setSlugError('');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">Letters, numbers, and dashes allowed</span>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveSlug}
                    disabled={isSavingSlug || !slugInput.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                  >
                    {isSavingSlug ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{activeSlug ? 'Update Short Link' : 'Create Short Link'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Test Link Button */}
          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="text-xs text-indigo-900">
              <span className="font-semibold">Test Responder View:</span>
              <p className="text-[11px] text-indigo-700">Open the public responder form in a fresh tab to test it</p>
            </div>
            <a
              href={activeSlug ? shortUrl : longUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 shadow-xs shrink-0 w-full sm:w-auto"
            >
              <span>Open Form</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* SECTION 3: Embed HTML */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-slate-500" />
              <span>Embed HTML Code</span>
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={embedCode}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-600 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(embedCode, 'embed')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                {embedCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{embedCopied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
