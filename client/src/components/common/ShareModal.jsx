import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Share2, Code } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, formId, formTitle }) {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const shareUrl = `${origin}/#form/${formId}`;
  const embedCode = `<iframe src="${shareUrl}" width="100%" height="800" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`;

  const copyToClipboard = (text, type = 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Share Form</h3>
            <p className="text-xs text-slate-500 truncate max-w-xs">{formTitle || 'Untitled Form'}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Public Link Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Public Responder Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-700 select-all focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(shareUrl, 'link')}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Test Link Button */}
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div className="text-xs text-indigo-900">
              <span className="font-semibold">Test Responder View:</span>
              <p className="text-[11px] text-indigo-700">Open the public responder form in a fresh tab</p>
            </div>
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 shadow-xs"
            >
              <span>Open Form</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Embed HTML */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-slate-500" />
              <span>Embed HTML</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={embedCode}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-600 select-all focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(embedCode, 'embed')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors flex items-center gap-1.5 shrink-0"
              >
                {embedCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{embedCopied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
