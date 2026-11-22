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
  Loader2,
  Palette,
  FileSpreadsheet,
  Rocket,
  Globe
} from 'lucide-react';
import QRCode from 'qrcode';
import { saveFormSlug, publishForm } from '../../services/api';

export default function ShareModal({
  isOpen,
  onClose,
  formId,
  formTitle = 'Form',
  customSlug = '',
  isPublished = false,
  acceptingResponses = true,
  closedMessage = '',
  onSlugUpdated,
  onPublishStateChanged,
  onToggleAcceptingResponses
}) {
  const [published, setPublished] = useState(Boolean(isPublished));
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAccepting, setIsAccepting] = useState(acceptingResponses !== false);
  const [closedMsg, setClosedMsg] = useState(closedMessage || 'This form is no longer accepting responses.');
  const [linkPreference, setLinkPreference] = useState(customSlug ? 'custom' : 'default'); // 'default' | 'custom'
  const [modalTab, setModalTab] = useState('link'); // 'link' | 'embed'
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

  // Embed Customizer states
  const [embedBg, setEmbedBg] = useState('transparent'); // 'transparent' | 'dark' | 'light'
  const [embedAccent, setEmbedAccent] = useState('#6366f1');
  const [embedHideHeader, setEmbedHideHeader] = useState(true);
  const [embedHeight, setEmbedHeight] = useState('680');
  const [embedBorder, setEmbedBorder] = useState(false);
  const [embedRadius, setEmbedRadius] = useState('16');

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

  // Build customizable embed parameters
  const getEmbedParams = () => {
    const params = new URLSearchParams();
    params.set('embed', 'true');
    if (embedHideHeader) params.set('hideHeader', 'true');
    if (embedBg === 'transparent') params.set('transparent', 'true');
    else if (embedBg === 'light') params.set('bg', 'light');
    else if (embedBg === 'dark') params.set('bg', 'dark');
    if (embedAccent) {
      params.set('accent', encodeURIComponent(embedAccent));
    }
    return params.toString();
  };

  const dynamicEmbedUrl = `${shortUrl}?${getEmbedParams()}`;
  const dynamicEmbedCode = `<iframe
  src="${dynamicEmbedUrl}"
  width="100%"
  height="${embedHeight}"
  frameborder="0"
  allow="microphone"
  style="border: ${embedBorder ? '1px solid rgba(148, 163, 184, 0.25)' : 'none'}; border-radius: ${embedRadius}px; width: 100%; max-width: 100%; overflow: hidden;"
  title="${formTitle || 'VoxForm'}"
></iframe>`;
  const embedCode = dynamicEmbedCode;

  // Initialize slugs, accepting responses, and publish status when modal opens
  useEffect(() => {
    if (isOpen) {
      setPublished(Boolean(isPublished));
      setIsAccepting(acceptingResponses !== false);
      setClosedMsg(closedMessage || 'This form is no longer accepting responses.');
      setLinkPreference(customSlug ? 'custom' : 'default');
      const initial = customSlug || `form-${formId ? String(formId).slice(-6) : 'vox'}`;
      setActiveSlug(customSlug || initial);
      setSlugInput(customSlug || initial);
      setSlugError('');
      setSlugSuccess('');
      setCopied(false);
      setShortCopied(false);
      setEmbedCopied(false);
    }
  }, [isOpen, isPublished, acceptingResponses, closedMessage, customSlug, formId]);

  const handleToggleAccepting = (newAccepting) => {
    setIsAccepting(newAccepting);
    if (onToggleAcceptingResponses) {
      onToggleAcceptingResponses(newAccepting, closedMsg);
    }
    setSlugSuccess(newAccepting ? '🟢 Form reopened for public responses.' : '🔴 Form closed to new responses.');
    setTimeout(() => setSlugSuccess(''), 3000);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setSlugError('');
    try {
      const slugToUse = linkPreference === 'custom' && slugInput
        ? slugInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-')
        : null;
      const res = await publishForm(formId, {
        customSlug: slugToUse,
        isPublished: true
      });
      setPublished(true);
      if (onPublishStateChanged) onPublishStateChanged(true);
      if (res.customSlug) {
        setActiveSlug(res.customSlug);
        setSlugInput(res.customSlug);
        if (onSlugUpdated) onSlugUpdated(res.customSlug);
      }
      setSlugSuccess('🎉 Form is now live and published! You can now copy and share the link.');
      setTimeout(() => setSlugSuccess(''), 4000);
    } catch (err) {
      setSlugError(err.message || 'Failed to publish form.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!window.confirm('Revert form to Draft mode? Public respondents will no longer be able to submit responses.')) {
      return;
    }
    setIsPublishing(true);
    setSlugError('');
    try {
      await publishForm(formId, { isPublished: false });
      setPublished(false);
      if (onPublishStateChanged) onPublishStateChanged(false);
      setSlugSuccess('Form reverted to draft mode.');
      setTimeout(() => setSlugSuccess(''), 3000);
    } catch (err) {
      setSlugError(err.message || 'Failed to unpublish form.');
    } finally {
      setIsPublishing(false);
    }
  };

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
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5" />
                <span>{published ? 'Publish & Share Form' : 'Publish Form'}</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wide border ${
                published
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}>
                {published ? '● Live' : '○ Draft'}
              </span>
            </div>
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

        {/* PUBLISH WORKFLOW (When form is in Draft) */}
        {!published && (
          <div className="bg-gradient-to-br from-primary/10 via-surface-container to-secondary-container/10 border border-primary/30 rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-lg animate-fadeIn">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-primary font-bold text-base sm:text-lg">
                <Rocket className="w-5 h-5 text-primary" />
                <h3>Publish your form to the public</h3>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Once published, your form becomes public so respondents can submit their answers. As the creator, edit access remains strictly restricted to your account.
              </p>
            </div>

            {/* Link Options: Default link vs Custom short link */}
            <div className="flex flex-col gap-2.5 bg-surface-container-lowest/80 p-4 rounded-2xl border border-outline-variant/30">
              <span className="text-xs font-semibold text-on-surface">Link Setup (Optional):</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Option 1: Default Form Link */}
                <label
                  onClick={() => setLinkPreference('default')}
                  className={`flex flex-col p-3 rounded-xl border transition-all cursor-pointer ${
                    linkPreference === 'default'
                      ? 'bg-primary/10 border-primary ring-1 ring-primary/40'
                      : 'bg-surface-container border-outline-variant/30 hover:border-outline-variant/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="linkPref"
                      checked={linkPreference === 'default'}
                      onChange={() => setLinkPreference('default')}
                      className="text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="text-xs font-bold text-on-surface">Default Link (Skip setup)</span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant font-mono mt-1.5 truncate">
                    {canonicalUrl}
                  </span>
                  <span className="text-[10px] text-tertiary mt-1 font-medium">✓ Ready instantly</span>
                </label>

                {/* Option 2: Custom Short Link */}
                <label
                  onClick={() => setLinkPreference('custom')}
                  className={`flex flex-col p-3 rounded-xl border transition-all cursor-pointer ${
                    linkPreference === 'custom'
                      ? 'bg-primary/10 border-primary ring-1 ring-primary/40'
                      : 'bg-surface-container border-outline-variant/30 hover:border-outline-variant/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="linkPref"
                      checked={linkPreference === 'custom'}
                      onChange={() => setLinkPreference('custom')}
                      className="text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="text-xs font-bold text-on-surface">Custom Short Link</span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant font-mono mt-1.5 truncate">
                    {origin}/#s/{slugInput || 'custom-alias'}
                  </span>
                  <span className="text-[10px] text-primary mt-1 font-medium">✨ Personalized vanity link</span>
                </label>
              </div>

              {/* If custom short link chosen, show editor */}
              {linkPreference === 'custom' && (
                <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/20 animate-fadeIn">
                  <div className="w-full flex items-center rounded-xl bg-surface-container-lowest px-3 py-2 border border-outline-variant/30 shadow-inner overflow-hidden focus-within:border-primary">
                    <span className="font-mono text-xs text-outline select-none shrink-0">
                      {origin}/#s/
                    </span>
                    <input
                      type="text"
                      value={slugInput}
                      onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                      className="flex-1 min-w-0 bg-transparent text-on-surface font-mono text-xs sm:text-sm focus:outline-none px-1"
                      placeholder="custom-name"
                    />
                    <button
                      type="button"
                      onClick={handleShuffle}
                      className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs text-on-surface-variant flex items-center gap-1 cursor-pointer shrink-0"
                      title="Generate random alias"
                    >
                      <Shuffle className="w-3 h-3" />
                      <span>Shuffle</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {slugError && (
              <p className="text-xs text-error font-medium flex items-center gap-1 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{slugError}</span>
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 hover:opacity-95 text-on-primary font-bold text-sm shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Form...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    <span>Publish Form Now</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* PUBLISHED LIVE BANNER */}
        {published && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs text-emerald-300 animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="leading-snug">
                <strong>Form is Live &amp; Published!</strong> Anyone with the link can respond. Edit permissions remain exclusively restricted to you as the creator.
              </span>
            </div>
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={isPublishing}
              className="text-[11px] font-semibold text-on-surface-variant hover:text-error transition-colors underline shrink-0 cursor-pointer ml-2"
            >
              Revert to Draft
            </button>
          </div>
        )}

        {/* RESPONSES STATUS TOGGLE (Close Form / Reopen Form) */}
        {published && (
          <div className={`rounded-2xl p-4 border transition-all flex flex-col gap-3 shadow-xs animate-fadeIn ${
            isAccepting
              ? 'bg-surface-container/70 border-outline-variant/30'
              : 'bg-rose-500/10 border-rose-500/30'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isAccepting ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span className="font-bold text-xs sm:text-sm text-on-surface">
                  {isAccepting ? '🟢 Accepting Responses' : '🔴 Form Closed'}
                </span>
                <span className="text-[11px] text-on-surface-variant font-mono hidden sm:inline">
                  {isAccepting ? '(Form is open for submissions)' : '(Submissions paused)'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleToggleAccepting(!isAccepting)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isAccepting
                    ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                }`}
              >
                <span>{isAccepting ? 'Close Form' : 'Reopen Form'}</span>
              </button>
            </div>

            {!isAccepting && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-rose-500/20 animate-fadeIn">
                <label className="text-[11px] font-semibold text-rose-300">
                  Message shown when someone visits the closed form:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={closedMsg}
                    onChange={(e) => setClosedMsg(e.target.value)}
                    onBlur={() => onToggleAcceptingResponses && onToggleAcceptingResponses(false, closedMsg)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-surface-container-lowest text-on-surface text-xs font-mono border border-outline-variant/30 focus:outline-none focus:border-primary"
                    placeholder="This form is no longer accepting responses."
                  />
                  <button
                    type="button"
                    onClick={() => onToggleAcceptingResponses && onToggleAcceptingResponses(false, closedMsg)}
                    className="px-3 py-1.5 rounded-xl bg-surface-container text-xs font-semibold text-primary hover:bg-surface-container-high border border-outline-variant/30 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Tabs: Links & QR vs Website Embed */}
        <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2">
          <button
            type="button"
            onClick={() => setModalTab('link')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              modalTab === 'link'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Share Link &amp; QR</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('embed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              modalTab === 'embed'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Embed on Website</span>
            <span className="px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
              Design &amp; Styling
            </span>
          </button>
        </div>

        {/* TAB 1: SHARE LINK & QR CODE */}
        {modalTab === 'link' && (
          <div className="flex flex-col gap-5 sm:gap-6 animate-fadeIn">
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
    )}

    {/* TAB 2: EMBED ON WEBSITE (CUSTOM DESIGN & STYLING) */}
    {modalTab === 'embed' && (
      <div className="flex flex-col gap-4 animate-fadeIn">
        {/* 1. Embed Configuration Controls */}
        <div className="bg-surface-container/70 border border-outline-variant/30 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs sm:text-sm text-on-surface flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-primary" />
              <span>Customize Website Embed Design</span>
            </span>
            <span className="text-[11px] font-mono text-tertiary font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
              Live Preview
            </span>
          </div>

          {/* Setting 1: Background & Theme */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant">
              Background Style (Match your website):
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEmbedBg('transparent')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border flex flex-col items-center gap-1 cursor-pointer ${
                  embedBg === 'transparent'
                    ? 'bg-primary/10 border-primary text-primary shadow-xs'
                    : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>✨ Transparent</span>
                <span className="text-[10px] font-normal opacity-80">Blends with host site</span>
              </button>
              <button
                type="button"
                onClick={() => setEmbedBg('dark')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border flex flex-col items-center gap-1 cursor-pointer ${
                  embedBg === 'dark'
                    ? 'bg-primary/10 border-primary text-primary shadow-xs'
                    : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>🌙 Dark Theme</span>
                <span className="text-[10px] font-normal opacity-80">VoxForm Dark mode</span>
              </button>
              <button
                type="button"
                onClick={() => setEmbedBg('light')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border flex flex-col items-center gap-1 cursor-pointer ${
                  embedBg === 'light'
                    ? 'bg-primary/10 border-primary text-primary shadow-xs'
                    : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>☀️ Light Theme</span>
                <span className="text-[10px] font-normal opacity-80">Clean light cards</span>
              </button>
            </div>
          </div>

          {/* Setting 2: Brand Accent Color */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant">
              Brand Accent Color:
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: 'Indigo', hex: '#6366f1' },
                { label: 'Purple', hex: '#8b5cf6' },
                { label: 'Emerald', hex: '#10b981' },
                { label: 'Rose', hex: '#f43f5e' },
                { label: 'Amber', hex: '#f59e0b' },
                { label: 'Cyan', hex: '#06b6d4' },
                { label: 'Slate', hex: '#0f172a' }
              ].map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setEmbedAccent(color.hex)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center border-2 ${
                    embedAccent.toLowerCase() === color.hex.toLowerCase()
                      ? 'border-white scale-110 shadow-md ring-2 ring-primary/50'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.label}
                >
                  {embedAccent.toLowerCase() === color.hex.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  )}
                </button>
              ))}

              {/* Custom color picker */}
              <div className="flex items-center gap-1.5 ml-auto">
                <input
                  type="color"
                  value={embedAccent}
                  onChange={(e) => setEmbedAccent(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  title="Custom color picker"
                />
                <input
                  type="text"
                  value={embedAccent}
                  onChange={(e) => setEmbedAccent(e.target.value)}
                  className="w-20 px-2 py-1 rounded-lg bg-surface-container text-[11px] font-mono border border-outline-variant/30 text-on-surface"
                  placeholder="#6366f1"
                />
              </div>
            </div>
          </div>

          {/* Setting 3: Layout Options (Header & Sizing) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-outline-variant/20">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-on-surface">
              <input
                type="checkbox"
                checked={embedHideHeader}
                onChange={(e) => setEmbedHideHeader(e.target.checked)}
                className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <span>Hide VoxForm Header (Seamless native look)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-on-surface">
              <input
                type="checkbox"
                checked={embedBorder}
                onChange={(e) => setEmbedBorder(e.target.checked)}
                className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <span>Show subtle border frame</span>
            </label>
          </div>

          {/* Height & Corner presets */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-outline-variant/20 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-on-surface-variant font-medium">Height:</span>
              {['550', '680', '820'].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setEmbedHeight(h)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                    embedHeight === h
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {h}px
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-on-surface-variant font-medium">Corners:</span>
              {[
                { label: 'Round', val: '16' },
                { label: 'Pill', val: '24' },
                { label: 'Square', val: '0' }
              ].map((r) => (
                <button
                  key={r.val}
                  type="button"
                  onClick={() => setEmbedRadius(r.val)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    embedRadius === r.val
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Live Generated Iframe Code */}
        <div className="bg-surface-container/60 border border-outline-variant/30 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-on-surface flex items-center gap-1.5">
              <Code className="w-4 h-4 text-primary" />
              <span>HTML Embed Snippet (Ready to Paste)</span>
            </span>
            <span className="text-[10px] font-mono text-outline">
              allow="microphone" included
            </span>
          </div>

          <pre className="bg-surface-container-lowest p-3 rounded-xl text-xs font-mono text-on-surface-variant overflow-x-auto border border-outline-variant/20 whitespace-pre">
            <code>{dynamicEmbedCode}</code>
          </pre>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={copyEmbed}
              className={`flex-1 px-5 py-2.5 rounded-xl text-on-primary flex items-center justify-center gap-2 shadow-md transition-all text-xs sm:text-sm font-bold cursor-pointer ${
                embedCopied
                  ? 'bg-tertiary text-surface ring-2 ring-tertiary/40'
                  : 'bg-primary hover:bg-primary-container'
              }`}
            >
              {embedCopied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Copied Embed Code!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Embed Snippet</span>
                </>
              )}
            </button>

            <a
              href={dynamicEmbedUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/30 flex items-center gap-1.5 transition-all"
            >
              <span>Preview Embed</span>
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
            </a>
          </div>
        </div>

        {/* 3. Automatic Response Sync & Google Sheets Info Banner */}
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-tertiary" />
          </div>
          <div className="flex flex-col text-xs text-on-surface-variant leading-relaxed">
            <span className="font-bold text-on-surface">
              Real-time Responses &amp; Google Sheets Export
            </span>
            <span>
              Responses submitted on your website immediately sync to your VoxForm dashboard. You can view all submissions or export to Google Sheets / CSV at any time.
            </span>
          </div>
        </div>
      </div>
    )}
      </div>
    </div>
  );
}
