import React, { useState, useEffect, useCallback } from 'react';
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
  AlertCircle,
  CheckCircle2,
  QrCode,
  Printer,
  Download,
  Loader2
} from 'lucide-react';
import QRCode from 'qrcode';
import { saveFormSlug } from '../../services/api';

export default function ShareModal({
  isOpen,
  onClose,
  formId,
  formTitle = 'Form',
  customSlug = '',
  onSlugUpdated
}) {
  const [copied, setCopied] = useState(false);
  const [shortCopied, setShortCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  // Short link management states
  const [activeSlug, setActiveSlug] = useState(customSlug || '');
  const [slugInput, setSlugInput] = useState(customSlug || '');
  const [isSavingSlug, setIsSavingSlug] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [slugSuccess, setSlugSuccess] = useState('');

  // QR Code generator states
  const [qrTarget, setQrTarget] = useState('short'); // 'short' | 'canonical'
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const randomAliases = [
    'feedback',
    'voice-form',
    'intake',
    'survey',
    'rsvp',
    'interview',
    'connect',
    'audio-review',
    'insights'
  ];

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentSlug = slugInput || activeSlug;
  const shortUrl = `${origin}/#s/${currentSlug}`;
  const canonicalUrl = `${origin}/#form/${formId}`;
  const embedCode = `<iframe src="${shortUrl}" width="100%" height="680" allow="microphone" frameborder="0"></iframe>`;

  // Initialize slugs when modal opens
  useEffect(() => {
    if (isOpen) {
      const initial = customSlug || `form-${formId ? String(formId).slice(-6) : 'vox'}`;
      setActiveSlug(customSlug || initial);
      setSlugInput(customSlug || initial);
      setSlugError('');
      setSlugSuccess('');
      setCopied(false);
      setShortCopied(false);
      setEmbedCopied(false);

      // If form doesn't have a saved slug yet, automatically save default slug so link works immediately
      if (!customSlug && formId) {
        saveFormSlug(formId, initial)
          .then(() => {
            setActiveSlug(initial);
            if (onSlugUpdated) onSlugUpdated(initial);
          })
          .catch(() => {
            // Silently fall back to ID routing
          });
      }
    }
  }, [isOpen, customSlug, formId, onSlugUpdated]);

  // Generate real, scannable QR Code whenever URL changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const targetUrl = qrTarget === 'short' ? shortUrl : canonicalUrl;

    setIsGeneratingQr(true);
    QRCode.toDataURL(targetUrl, {
      width: 480,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((dataUrl) => {
        if (isMounted) {
          setQrDataUrl(dataUrl);
          setIsGeneratingQr(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate real QR code:', err);
        if (isMounted) setIsGeneratingQr(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, qrTarget, shortUrl, canonicalUrl]);

  if (!isOpen) return null;

  const handleShuffle = () => {
    const prefix = randomAliases[Math.floor(Math.random() * randomAliases.length)];
    const suffix = Math.floor(100 + Math.random() * 900);
    const next = `${prefix}-${suffix}`;
    setSlugInput(next);
  };

  const handleSaveSlug = async (targetSlug = slugInput) => {
    const raw = targetSlug || slugInput;
    if (!raw.trim()) {
      setSlugError('Please enter a valid slug.');
      return false;
    }
    const sanitized = raw.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    setIsSavingSlug(true);
    setSlugError('');
    try {
      await saveFormSlug(formId, sanitized);
      setActiveSlug(sanitized);
      setSlugInput(sanitized);
      setSlugSuccess('Short link updated and live!');
      if (onSlugUpdated) onSlugUpdated(sanitized);
      setTimeout(() => setSlugSuccess(''), 3000);
      return true;
    } catch (err) {
      setSlugError(err.message || 'Failed to update short link');
      return false;
    } finally {
      setIsSavingSlug(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      console.warn('Clipboard API error, trying fallback:', err);
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch {
      return false;
    }
  };

  const copyShortLink = async () => {
    // If slug input changed and not saved yet, save it so the link works for responders
    if (slugInput && slugInput !== activeSlug) {
      await handleSaveSlug(slugInput);
    }
    const ok = await copyToClipboard(shortUrl);
    if (ok) {
      setShortCopied(true);
      setTimeout(() => setShortCopied(false), 2200);
    }
  };

  const copyCanonical = async () => {
    const ok = await copyToClipboard(canonicalUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyEmbed = async () => {
    const ok = await copyToClipboard(embedCode);
    if (ok) {
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `voxform-${currentSlug || formId}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintQr = () => {
    if (!qrDataUrl) return;
    const activeUrl = qrTarget === 'short' ? shortUrl : canonicalUrl;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the QR code.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Scan to Respond - ${formTitle}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              margin: 0;
              padding: 24px;
              color: #0f172a;
              text-align: center;
            }
            .card {
              border: 2px solid #e2e8f0;
              border-radius: 24px;
              padding: 36px 32px;
              max-width: 420px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            }
            h1 {
              font-size: 22px;
              font-weight: 800;
              margin: 0 0 8px 0;
              color: #1e1b4b;
            }
            p {
              font-size: 13px;
              color: #64748b;
              margin: 0 0 24px 0;
              line-height: 1.4;
            }
            .qr-wrapper {
              background: #ffffff;
              padding: 16px;
              border-radius: 16px;
              border: 1px solid #cbd5e1;
              display: inline-block;
            }
            img {
              width: 260px;
              height: 260px;
              display: block;
            }
            .badge {
              margin-top: 20px;
              display: inline-block;
              background: #e0e7ff;
              color: #4338ca;
              font-size: 12px;
              font-weight: 700;
              padding: 4px 14px;
              border-radius: 9999px;
            }
            .url {
              margin-top: 12px;
              font-family: monospace;
              font-size: 12px;
              color: #6366f1;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${formTitle}</h1>
            <p>Scan with your smartphone camera to dictate or write your response instantly.</p>
            <div class="qr-wrapper">
              <img src="${qrDataUrl}" alt="Form QR Code" />
            </div>
            <div>
              <span class="badge">🎙️ Voice Dictation Enabled</span>
            </div>
            <div class="url">${activeUrl}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSocialShare = (platform) => {
    const shareText = encodeURIComponent(`Fill out: ${formTitle}`);
    const url = encodeURIComponent(shortUrl);
    let targetUrl = '';
    if (platform === 'twitter') targetUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${url}`;
    if (platform === 'linkedin') targetUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    if (platform === 'whatsapp') targetUrl = `https://api.whatsapp.com/send?text=${shareText}%20${url}`;
    if (platform === 'slack') targetUrl = `https://slack.com/share?text=${shareText}%20${url}`;
    if (targetUrl) window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-surface-container-lowest/80 backdrop-blur-xl animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-2xl bg-surface-container-low rounded-3xl p-5 sm:p-7 relative flex flex-col gap-5 sm:gap-6 my-auto border border-outline-variant/30 text-on-surface shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant/20 pb-4">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              <span>Share & Distribute Form</span>
            </span>
            <h2 className="font-bold text-lg sm:text-2xl text-on-surface truncate tracking-tight">
              {formTitle || 'Untitled Form'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all flex items-center justify-center border border-outline-variant/30 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Responsive Custom Short Link Section */}
        <div className="bg-surface-container/70 border border-outline-variant/30 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="font-semibold text-xs sm:text-sm text-on-surface flex items-center gap-1.5" htmlFor="vanity-alias">
              <Link2 className="w-4 h-4 text-primary" />
              <span>Custom Short Link</span>
            </label>
            <span className="text-[11px] font-mono text-tertiary flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
              Live Respondent Link
            </span>
          </div>

          {/* Fully Responsive Input & Action Buttons Layout */}
          <div className="flex flex-col gap-2.5">
            {/* Input with Origin Prefix */}
            <div className="w-full flex items-center rounded-xl bg-surface-container-lowest px-3 py-2.5 border border-outline-variant/30 shadow-inner overflow-hidden focus-within:border-primary transition-colors">
              <span className="font-mono text-xs text-outline select-none shrink-0 truncate max-w-[140px] sm:max-w-none">
                {origin}/#s/
              </span>
              <input
                id="vanity-alias"
                type="text"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                className="flex-1 min-w-0 bg-transparent text-on-surface font-mono text-xs sm:text-sm focus:outline-none px-1"
                placeholder="custom-slug"
              />
            </div>

            {/* Responsive Actions Strip (Wrap on mobile, clean inline on desktop) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleShuffle}
                className="px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-all text-xs border border-outline-variant/30 cursor-pointer"
                title="Generate a random short alias"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Shuffle</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveSlug(slugInput)}
                disabled={isSavingSlug || slugInput === activeSlug}
                className="px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest disabled:opacity-50 text-primary font-semibold flex items-center gap-1.5 transition-all text-xs border border-outline-variant/30 cursor-pointer"
                title="Save this custom name"
              >
                {isSavingSlug ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{isSavingSlug ? 'Saving...' : 'Save Slug'}</span>
              </button>

              {/* Primary Responsive Copy Link Button */}
              <button
                type="button"
                onClick={copyShortLink}
                className={`flex-1 min-w-[140px] sm:flex-initial px-5 py-2.5 rounded-xl text-on-primary flex items-center justify-center gap-2 shadow-md transition-all text-xs sm:text-sm font-bold cursor-pointer ${
                  shortCopied
                    ? 'bg-tertiary text-surface ring-2 ring-tertiary/40'
                    : 'bg-primary hover:bg-primary-container hover:scale-101 active:scale-99'
                }`}
              >
                {shortCopied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <a
                href={shortUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-all text-xs border border-outline-variant/30 flex items-center gap-1"
                title="Open short link in new tab"
              >
                <span className="hidden sm:inline">Test</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {slugError && (
            <p className="text-xs text-error font-medium flex items-center gap-1 animate-fadeIn">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{slugError}</span>
            </p>
          )}
          {slugSuccess && (
            <p className="text-xs text-tertiary font-medium flex items-center gap-1 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{slugSuccess}</span>
            </p>
          )}
        </div>

        {/* 2. REAL SCANNABLE QR CODE & CANONICAL LINK GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Real QR Code Card */}
          <div className="md:col-span-5 flex flex-col items-center justify-between bg-surface-container/60 border border-outline-variant/30 rounded-2xl p-4 sm:p-5 gap-3.5 shadow-sm text-center">
            <div className="flex items-center justify-between w-full text-xs font-mono text-on-surface">
              <span className="font-semibold flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-tertiary" />
                <span>Real Scannable QR</span>
              </span>

              {/* Target Link Selector */}
              <div className="flex items-center gap-1 text-[10px] bg-surface-container rounded-lg p-0.5 border border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setQrTarget('short')}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-medium ${
                    qrTarget === 'short'
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="Encode Short Link in QR"
                >
                  Short
                </button>
                <button
                  type="button"
                  onClick={() => setQrTarget('canonical')}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-medium ${
                    qrTarget === 'canonical'
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="Encode Direct Canonical Link in QR"
                >
                  Direct
                </button>
              </div>
            </div>

            {/* High-Contrast Genuine QR Code Canvas */}
            <div className="relative w-36 h-36 sm:w-40 sm:h-40 bg-white rounded-2xl p-2.5 flex items-center justify-center border-2 border-outline-variant/40 shadow-md overflow-hidden">
              {isGeneratingQr || !qrDataUrl ? (
                <div className="flex flex-col items-center gap-2 text-outline">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-[10px] font-mono">Generating QR...</span>
                </div>
              ) : (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${formTitle}`}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <p className="text-[11px] text-on-surface-variant leading-tight max-w-[200px]">
              Scan with any smartphone camera to open form instantly
            </p>

            {/* QR Download & Print Actions */}
            <div className="flex items-center gap-2 w-full pt-1">
              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={!qrDataUrl}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/30 transition-all cursor-pointer disabled:opacity-50"
                title="Download QR as PNG image"
              >
                <Download className="w-3.5 h-3.5 text-tertiary" />
                <span>Download PNG</span>
              </button>

              <button
                type="button"
                onClick={handlePrintQr}
                disabled={!qrDataUrl}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/30 transition-all cursor-pointer disabled:opacity-50"
                title="Print ready-to-display poster"
              >
                <Printer className="w-3.5 h-3.5 text-primary" />
                <span>Print QR</span>
              </button>
            </div>
          </div>

          {/* Full Canonical URL & Direct Responder Card */}
          <div className="md:col-span-7 flex flex-col justify-between gap-3.5 bg-surface-container/50 border border-outline-variant/20 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  Direct Canonical Form Link
                </span>
                <span className="text-[10px] font-mono text-outline">Permanent URL</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-2 sm:p-1.5 sm:pl-3">
                <span className="font-mono text-xs text-on-surface-variant truncate select-all flex-1 min-w-0">
                  {canonicalUrl}
                </span>

                <button
                  type="button"
                  onClick={copyCanonical}
                  className={`shrink-0 px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-xs font-semibold cursor-pointer ${
                    copied
                      ? 'bg-tertiary text-surface font-bold'
                      : 'bg-surface-container hover:bg-surface-container-high text-primary hover:text-on-surface'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Direct Link'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 text-xs text-on-surface-variant flex items-center justify-between">
              <span className="leading-tight">Direct link with voice-to-text enabled</span>
              <a
                href={canonicalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-semibold shrink-0 ml-2"
              >
                <span>Test Direct</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Embed Code HTML */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-on-surface flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-primary" />
                  <span>Embed HTML iframe</span>
                </span>
                <button
                  type="button"
                  onClick={copyEmbed}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border border-outline-variant/30 cursor-pointer ${
                    embedCopied
                      ? 'bg-tertiary text-surface font-bold'
                      : 'bg-surface-container hover:bg-surface-container-high text-primary'
                  }`}
                >
                  {embedCopied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <pre className="bg-surface-container-lowest p-2 rounded-xl text-[11px] font-mono text-on-surface-variant overflow-x-auto border border-outline-variant/20 whitespace-pre">
                <code>{embedCode}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* 3. Social Share Strip */}
        <div className="pt-2 border-t border-outline-variant/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <span className="font-mono text-[11px] uppercase tracking-wider text-outline font-semibold">
            Share on Networks:
          </span>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSocialShare('twitter')}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-all flex items-center justify-center gap-1 text-xs border border-outline-variant/30 cursor-pointer"
            >
              <span>X (Twitter)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialShare('linkedin')}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-all flex items-center justify-center gap-1 text-xs border border-outline-variant/30 cursor-pointer"
            >
              <span>LinkedIn</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialShare('whatsapp')}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-all flex items-center justify-center gap-1 text-xs border border-outline-variant/30 cursor-pointer"
            >
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialShare('slack')}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-all flex items-center justify-center gap-1 text-xs border border-outline-variant/30 cursor-pointer"
            >
              <span>Slack</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
