import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  UploadCloud,
  FileText,
  Download,
  X,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Edit3,
  Star
} from 'lucide-react';
import AudioRecorder from '../common/AudioRecorder';
import { submitResponse, uploadFile, getAssetUrl } from '../../services/api';

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function FormResponder({
  form = {},
  onBackToBuilder,
  canEdit = false,
  apiKey = ''
}) {
  const [answers, setAnswers] = useState({});
  const [voiceFieldStats, setVoiceFieldStats] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [dragOverQuestionId, setDragOverQuestionId] = useState(null);
  const [hoveredRating, setHoveredRating] = useState({});

  const theme = form.theme || {};
  const questions = form.questions || [];
  const headerBannerUrl = theme.headerBannerUrl || form.headerBannerUrl || form.headerImage || '';
  const baseAccentColor = theme.accentColor || '#8083ff';

  // Embed query parameters detection
  const getEmbedConfig = () => {
    if (typeof window === 'undefined') return { isEmbed: false };
    const hash = window.location.hash || '';
    const hashQuery = hash.includes('?') ? hash.split('?')[1] : '';
    const search = window.location.search ? window.location.search.replace(/^\?/, '') : '';
    const combined = [search, hashQuery].filter(Boolean).join('&');
    const params = new URLSearchParams(combined);

    const isEmbed = params.get('embed') === 'true' || (window.self !== window.top);
    const hideHeader = params.get('hideHeader') === 'true' || params.get('noHeader') === 'true';
    const transparent = params.get('transparent') === 'true';
    const bg = params.get('bg'); // 'light' | 'dark' | 'transparent'
    const customAccent = params.get('accent') ? decodeURIComponent(params.get('accent')) : null;

    return {
      isEmbed,
      hideHeader: isEmbed && (hideHeader || (params.get('hideHeader') !== 'false' && params.get('showHeader') !== 'true')),
      transparent: transparent || bg === 'transparent',
      bg,
      accentColor: customAccent || baseAccentColor
    };
  };

  const embedConfig = getEmbedConfig();
  const accentColor = embedConfig.accentColor;

  // Handle value change
  const handleAnswerChange = (qId, value, wasVoice = false) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    if (wasVoice) {
      setVoiceFieldStats((prev) => ({ ...prev, [qId]: true }));
    }
    if (errors[qId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
  };

  // Toggle checkbox option
  const handleCheckboxToggle = (qId, option) => {
    const currentList = Array.isArray(answers[qId]) ? answers[qId] : [];
    let updated;
    if (currentList.includes(option)) {
      updated = currentList.filter((item) => item !== option);
    } else {
      updated = [...currentList, option];
    }
    handleAnswerChange(qId, updated);
  };

  // Progress calculation
  const answeredCount = questions.filter((q) => {
    const val = answers[q.id];
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }).length;

  const progressPercentage = questions.length > 0
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  // File upload handler
  const handleFileSelect = async (qId, file, fileConfig = {}) => {
    if (!file) return;

    // Check size limit
    const maxSizeMB = fileConfig.maxSizeMB || 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        [qId]: `File size exceeds the ${maxSizeMB}MB limit.`
      }));
      return;
    }

    setUploadingFiles((prev) => ({ ...prev, [qId]: true }));
    try {
      const data = await uploadFile(file);
      handleAnswerChange(qId, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: data?.fileUrl || ''
      });
    } catch (err) {
      setErrors((prev) => ({ ...prev, [qId]: `Upload failed: ${err.message}` }));
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [qId]: false }));
    }
  };

  // Submit response
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const newErrors = {};
    questions.forEach((q) => {
      if (q.required) {
        const val = answers[q.id];
        if (val === undefined || val === null || val === '') {
          newErrors[q.id] = 'This question is required.';
        } else if (Array.isArray(val) && val.length === 0) {
          newErrors[q.id] = 'Please select at least one option.';
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorQ = questions.find((q) => newErrors[q.id]);
      if (firstErrorQ) {
        const el = document.getElementById(`q-card-${firstErrorQ.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedAnswers = questions.map((q) => ({
        questionId: q.id,
        questionTitle: q.title,
        value: answers[q.id] ?? '',
        wasVoice: Boolean(voiceFieldStats[q.id])
      }));

      await submitResponse(form.id, {
        answers: { ...answers },
        formattedAnswers,
        voiceFieldStats
      });
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Notify host embedding website via postMessage
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        try {
          window.parent.postMessage({
            type: 'voxform-response-submitted',
            formId: form.id,
            answersCount: formattedAnswers.length
          }, '*');
        } catch {
          // ignore cross-origin postMessage errors
        }
      }
    } catch (err) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    if (window.confirm('Are you sure you want to clear all your answers?')) {
      setAnswers({});
      setVoiceFieldStats({});
      setErrors({});
      setIsSubmitted(false);
    }
  };

  // If form is closed or unpublished
  const isFormClosed = form.settings?.acceptingResponses === false;
  const isFormPublished = form.isPublished !== undefined
    ? Boolean(form.isPublished)
    : form.status !== undefined
      ? form.status === 'published'
      : true;

  const isLightMode = theme.mode === 'light' || embedConfig.bg === 'light';
  const customBg = theme.backgroundColor;

  const outerBgClass = embedConfig.transparent
    ? 'bg-transparent text-on-surface'
    : isLightMode
      ? 'text-slate-900'
      : 'bg-surface text-on-surface';

  const outerBgStyle = embedConfig.transparent
    ? {}
    : customBg
      ? { backgroundColor: customBg }
      : isLightMode
        ? { backgroundColor: '#f0ebf8' }
        : {};

  return (
    <div
      className={`min-h-screen ${outerBgClass} antialiased selection:bg-primary-container selection:text-on-primary-container ${embedConfig.isEmbed ? 'pb-8 pt-2' : 'pb-24'} transition-colors duration-200`}
      style={outerBgStyle}
    >
      {/* Top Header Bar (hidden in embed when clean embed is requested) */}
      {!embedConfig.hideHeader && (
        <header className={`sticky top-0 z-40 backdrop-blur-xl border-b px-3.5 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 ${
          isLightMode
            ? 'bg-white/80 border-slate-200/80 text-slate-900 shadow-xs'
            : 'bg-surface-container-lowest/80 border-outline-variant/20 text-on-surface'
        }`}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
              style={{ backgroundColor: accentColor }}
            >
              <Mic className="w-4 h-4" />
            </div>
            <span className={`font-bold text-sm tracking-tight ${isLightMode ? 'text-slate-900' : 'text-on-surface'}`}>
              VoxForm
            </span>
          </div>

          {canEdit && onBackToBuilder && (
            <button
              type="button"
              onClick={onBackToBuilder}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isLightMode
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/30'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" style={{ color: accentColor }} />
              <span className="hidden xs:inline">Back to Builder</span>
              <span className="xs:hidden">Studio</span>
            </button>
          )}
        </header>
      )}

      {/* Main Centered Responder Canvas */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 flex flex-col gap-5">
        {/* Creator Draft Preview Banner */}
        {!isFormPublished && canEdit && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-amber-200 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="truncate sm:whitespace-normal">
                <strong>Draft Mode (Creator Preview)</strong> — Not published yet. Public visitors cannot fill this form until you click Publish in the studio.
              </span>
            </div>
            {onBackToBuilder && (
              <button
                type="button"
                onClick={onBackToBuilder}
                className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 font-semibold text-xs shrink-0 transition-all cursor-pointer border border-amber-500/30"
              >
                Go to Studio
              </button>
            )}
          </div>
        )}

        {/* Cover Banner (if present) */}
        {headerBannerUrl && (
          <div className="rounded-2xl overflow-hidden shadow-xl bg-surface-container-low border border-outline-variant/20 h-44 sm:h-56 w-full">
            <img
              src={getAssetUrl(headerBannerUrl)}
              alt="Form Cover"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Form Title & Description Card */}
        <div className={`${isLightMode ? 'bg-white text-slate-900 border-slate-200/80 shadow-md' : 'bg-surface-container-low text-on-surface border-outline-variant/20 shadow-xl'} rounded-2xl p-6 sm:p-8 border flex flex-col gap-3 relative overflow-hidden`}>
          <div className="h-2.5 w-full absolute top-0 left-0" style={{ backgroundColor: accentColor }} />
          <h1 className="font-bold text-2xl sm:text-3xl tracking-tight pt-1">
            {form.title || 'Untitled Form'}
          </h1>
          {form.description && (
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
              {form.description}
            </p>
          )}

          <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant font-mono">
            <span className="text-primary font-medium">* Indicates required question</span>
            {form.creatorName && (
              <span>Created by {form.creatorName}</span>
            )}
          </div>
        </div>

        {/* Progress Bar (if enabled) */}
        {form.settings?.showProgressBar !== false && !isSubmitted && !isFormClosed && questions.length > 0 && (
          <div className={`${
            isLightMode
              ? 'bg-white text-slate-900 border-slate-200/80 shadow-md'
              : 'bg-surface-container-low text-on-surface border-outline-variant/20 shadow-sm'
          } rounded-2xl p-4 border flex flex-col gap-1.5`}>
            <div className={`flex items-center justify-between text-xs font-mono ${isLightMode ? 'text-slate-600' : 'text-on-surface-variant'}`}>
              <span>{answeredCount} of {questions.length} answered</span>
              <span className="font-bold" style={{ color: accentColor }}>{progressPercentage}%</span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLightMode ? 'bg-slate-100' : 'bg-surface-container-highest'}`}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPercentage}%`,
                  backgroundColor: accentColor
                }}
              />
            </div>
          </div>
        )}

        {/* Case 0: Form in Draft / Not Yet Published (for public responders) */}
        {!isFormPublished && !canEdit ? (
          <div className={`${
            isLightMode ? 'bg-white border-slate-200/80 shadow-md' : 'bg-surface-container-low border-outline-variant/30 shadow-xl'
          } rounded-3xl p-8 sm:p-12 border text-center flex flex-col items-center gap-4 max-w-lg mx-auto my-8 animate-fadeIn`}>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className={`text-xl sm:text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-on-surface'}`}>
                Form Not Published Yet
              </h2>
              <p className={`text-xs sm:text-sm leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-on-surface-variant'}`}>
                This form is currently in draft mode and not accepting public responses yet. If you are the creator, please open your VoxForm studio and click <strong>Publish</strong> to make it live.
              </p>
            </div>
          </div>
        ) : isFormClosed ? (
          <div className={`${
            isLightMode ? 'bg-white border-slate-200/80 shadow-md' : 'bg-surface-container-low border-outline-variant/20 shadow-xl'
          } rounded-2xl p-8 border text-center flex flex-col items-center gap-3`}>
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className={`font-bold text-lg ${isLightMode ? 'text-slate-900' : 'text-on-surface'}`}>Form Closed</h2>
            <p className={`text-xs sm:text-sm max-w-md ${isLightMode ? 'text-slate-600' : 'text-on-surface-variant'}`}>
              {form.settings?.closedMessage || 'This form is no longer accepting responses.'}
            </p>
          </div>
        ) : isSubmitted ? (
          /* Case 2: Response Submitted Successfully */
          <div className={`${
            isLightMode ? 'bg-white border-slate-200/80 shadow-md' : 'bg-surface-container-low border-outline-variant/20 shadow-xl'
          } rounded-2xl p-8 sm:p-10 border text-center flex flex-col items-center gap-4`}>
            <div
              className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className={`font-bold text-xl sm:text-2xl ${isLightMode ? 'text-slate-900' : 'text-on-surface'}`}>
              {form.settings?.confirmationMessage || 'Thank you! Your response has been recorded.'}
            </h2>
            <p className={`text-xs sm:text-sm ${isLightMode ? 'text-slate-600' : 'text-on-surface-variant'}`}>
              Your voice and text inputs were successfully saved.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setVoiceFieldStats({});
                  setIsSubmitted(false);
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  isLightMode
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/30'
                }`}
              >
                Submit another response
              </button>
              {canEdit && onBackToBuilder && (
                <button
                  type="button"
                  onClick={onBackToBuilder}
                  className="px-5 py-2.5 rounded-xl text-white text-xs font-semibold transition-all shadow-md cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                >
                  Back to Editor
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Case 3: Normal Form Questions List */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {questions.map((q, idx) => {
              const val = answers[q.id];
              const hasError = Boolean(errors[q.id]);
              const isVoiceUsed = Boolean(voiceFieldStats[q.id]);

              return (
                <div
                  key={q.id}
                  id={`q-card-${q.id}`}
                  className={`${
                    isLightMode
                      ? 'bg-white text-slate-900 border-slate-200/80 shadow-md'
                      : 'bg-surface-container-low text-on-surface border-outline-variant/20 shadow-lg'
                  } rounded-2xl p-5 sm:p-7 border transition-all flex flex-col gap-3.5 ${
                    hasError
                      ? 'border-error ring-1 ring-error/50'
                      : ''
                  }`}
                >
                  {/* Question Title & Description */}
                  <div className="flex flex-col gap-1">
                    <h3 className={`font-semibold text-base sm:text-lg leading-snug ${isLightMode ? 'text-slate-900' : 'text-on-surface'}`}>
                      {q.title || `Question ${idx + 1}`}
                      {q.required && <span className="text-error ml-1">*</span>}
                    </h3>
                    {q.description && (
                      <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-500' : 'text-on-surface-variant'}`}>
                        {q.description}
                      </p>
                    )}
                  </div>

                  {/* 1. SHORT ANSWER / PARAGRAPH */}
                  {['paragraph', 'short_answer'].includes(q.type) && (
                    <div className="flex flex-col gap-2.5">
                      {q.type === 'short_answer' ? (
                        <input
                          type="text"
                          value={val || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          placeholder="Your answer..."
                          className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border transition-colors focus:outline-none ${
                            isLightMode
                              ? 'bg-slate-50 text-slate-900 border-slate-200 placeholder:text-slate-400 focus:bg-white focus:border-slate-400'
                              : 'bg-surface-container text-on-surface border-outline-variant/30 placeholder:text-outline focus:border-primary'
                          }`}
                          style={val ? { borderColor: accentColor } : {}}
                        />
                      ) : (
                        <textarea
                          rows={3}
                          value={val || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          placeholder="Your answer (type or speak)..."
                          className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border transition-colors focus:outline-none resize-y ${
                            isLightMode
                              ? 'bg-slate-50 text-slate-900 border-slate-200 placeholder:text-slate-400 focus:bg-white focus:border-slate-400'
                              : 'bg-surface-container text-on-surface border-outline-variant/30 placeholder:text-outline focus:border-primary'
                          }`}
                          style={val ? { borderColor: accentColor } : {}}
                        />
                      )}

                      {/* Integrated AudioRecorder Voice Dictation */}
                      {q.voiceEnabled !== false && (
                        <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                          <AudioRecorder
                            questionTitle={q.title}
                            questionDescription={q.description}
                            fieldType={q.type}
                            currentValue={val || ''}
                            onTranscriptionComplete={(text) => handleAnswerChange(q.id, text, true)}
                            accentColor={accentColor}
                            apiKey={apiKey}
                          />

                          {val && (
                            <button
                              type="button"
                              onClick={() => handleAnswerChange(q.id, '')}
                              className={`text-[11px] font-mono transition-colors ${
                                isLightMode ? 'text-slate-400 hover:text-slate-800' : 'text-outline hover:text-on-surface'
                              }`}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. MULTIPLE CHOICE */}
                  {q.type === 'multiple_choice' && (
                    <div className="flex flex-col gap-2 pt-1">
                      {(q.options || []).map((option, optIdx) => (
                        <label
                          key={optIdx}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            val === option
                              ? isLightMode
                                ? 'bg-slate-50/90 font-medium text-slate-900 border-2'
                                : 'bg-surface-container-high text-on-surface font-medium border-2'
                              : isLightMode
                                ? 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                                : 'bg-surface-container/60 hover:bg-surface-container border-outline-variant/20 text-on-surface-variant'
                          }`}
                          style={val === option ? { borderColor: accentColor } : {}}
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={val === option}
                            onChange={() => handleAnswerChange(q.id, option)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              val === option
                                ? ''
                                : isLightMode ? 'border-slate-300' : 'border-outline'
                            }`}
                            style={val === option ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
                          >
                            {val === option && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs sm:text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* 3. CHECKBOXES */}
                  {q.type === 'checkboxes' && (
                    <div className="flex flex-col gap-2 pt-1">
                      {(q.options || []).map((option, optIdx) => {
                        const isChecked = Array.isArray(val) && val.includes(option);
                        return (
                          <label
                            key={optIdx}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? isLightMode
                                  ? 'bg-slate-50/90 font-medium text-slate-900 border-2'
                                  : 'bg-surface-container-high text-on-surface font-medium border-2'
                                : isLightMode
                                  ? 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                                  : 'bg-surface-container/60 hover:bg-surface-container border-outline-variant/20 text-on-surface-variant'
                            }`}
                            style={isChecked ? { borderColor: accentColor } : {}}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCheckboxToggle(q.id, option)}
                              className="sr-only"
                            />
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                isChecked
                                  ? ''
                                  : isLightMode ? 'border-slate-300' : 'border-outline'
                              }`}
                              style={isChecked ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
                            >
                              {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className="text-xs sm:text-sm">{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* 4. DROPDOWN */}
                  {q.type === 'dropdown' && (
                    <div className="pt-1">
                      <select
                        value={val || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border cursor-pointer focus:outline-none ${
                          isLightMode
                            ? 'bg-slate-50 text-slate-900 border-slate-200 focus:bg-white'
                            : 'bg-surface-container text-on-surface border-outline-variant/30 focus:border-primary'
                        }`}
                        style={val ? { borderColor: accentColor } : {}}
                      >
                        <option value="">Select an option</option>
                        {(q.options || []).map((option, optIdx) => (
                          <option key={optIdx} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* 5. LINEAR SCALE */}
                  {q.type === 'linear_scale' && (
                    <div className="pt-2 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-1 sm:gap-2">
                        {Array.from({
                          length: (q.scaleConfig?.max || 5) - (q.scaleConfig?.min || 1) + 1
                        }, (_, i) => (q.scaleConfig?.min || 1) + i).map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, num)}
                            className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all border cursor-pointer ${
                              val === num
                                ? 'text-white shadow-md'
                                : isLightMode
                                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/20'
                            }`}
                            style={val === num ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <div className={`flex items-center justify-between text-[11px] px-1 font-mono ${
                        isLightMode ? 'text-slate-500' : 'text-on-surface-variant'
                      }`}>
                        <span>{q.scaleConfig?.minLabel || 'Low'}</span>
                        <span>{q.scaleConfig?.maxLabel || 'High'}</span>
                      </div>
                    </div>
                  )}

                  {/* 5b. STAR RATING (Google Forms Parity) */}
                  {q.type === 'rating' && (
                    <div className="pt-2 flex flex-col gap-3">
                      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
                        {Array.from({ length: q.ratingConfig?.max || 5 }, (_, i) => i + 1).map((starNum) => {
                          const currentHover = hoveredRating[q.id];
                          const isFilled = (currentHover !== undefined ? currentHover : (Number(val) || 0)) >= starNum;
                          return (
                            <button
                              key={starNum}
                              type="button"
                              onClick={() => {
                                const newVal = Number(val) === starNum ? 0 : starNum;
                                handleAnswerChange(q.id, newVal);
                              }}
                              onMouseEnter={() => setHoveredRating(prev => ({ ...prev, [q.id]: starNum }))}
                              onMouseLeave={() => setHoveredRating(prev => ({ ...prev, [q.id]: undefined }))}
                              className={`p-1 sm:p-2 rounded-xl transition-transform active:scale-95 cursor-pointer focus:outline-none ${
                                isLightMode ? 'hover:bg-slate-100' : 'hover:bg-surface-container-high'
                              }`}
                              title={`Rate ${starNum} out of ${q.ratingConfig?.max || 5} stars`}
                              aria-label={`Rate ${starNum} of ${q.ratingConfig?.max || 5} stars`}
                            >
                              <Star
                                className={`w-8 h-8 sm:w-9 sm:h-9 transition-all duration-150 ${
                                  isFilled
                                    ? 'fill-amber-400 text-amber-400 scale-105 drop-shadow-sm'
                                    : isLightMode
                                      ? 'text-slate-300 hover:text-amber-300'
                                      : 'text-outline/40 hover:text-amber-300'
                                }`}
                              />
                            </button>
                          );
                        })}

                        {Number(val) > 0 && (
                          <span className="ml-2 px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-400/15 text-amber-500 border border-amber-400/30">
                            {val} / {q.ratingConfig?.max || 5} Stars
                          </span>
                        )}
                      </div>

                      {(q.ratingConfig?.lowLabel || q.ratingConfig?.highLabel) && (
                        <div className={`flex items-center justify-between text-xs px-1 font-mono ${
                          isLightMode ? 'text-slate-500' : 'text-on-surface-variant'
                        }`}>
                          <span>{q.ratingConfig?.lowLabel || '1 Star'}</span>
                          <span>{q.ratingConfig?.highLabel || `${q.ratingConfig?.max || 5} Stars`}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. FILE UPLOAD */}
                  {q.type === 'file_upload' && (
                    <div className="pt-1 flex flex-col gap-2">
                      {val && (val.fileName || val.name) ? (
                        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-surface-container border-outline-variant/30'
                        }`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                              style={{ backgroundColor: accentColor }}
                            >
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold truncate ${isLightMode ? 'text-slate-800' : 'text-on-surface'}`}>
                                {val.fileName || val.name}
                              </p>
                              <p className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-on-surface-variant'}`}>
                                {formatFileSize(val.fileSize)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAnswerChange(q.id, null)}
                            className="p-1 rounded-lg text-outline hover:text-error transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverQuestionId(q.id);
                          }}
                          onDragLeave={() => setDragOverQuestionId(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverQuestionId(null);
                            const file = e.dataTransfer?.files?.[0];
                            if (file) handleFileSelect(q.id, file, q.fileConfig);
                          }}
                          className={`p-6 rounded-xl border-2 border-dashed text-center flex flex-col items-center justify-center gap-2 transition-all ${
                            dragOverQuestionId === q.id
                              ? 'border-2 shadow-inner'
                              : isLightMode
                                ? 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                                : 'border-outline-variant/30 hover:border-outline-variant/60 bg-surface-container/50'
                          }`}
                          style={dragOverQuestionId === q.id ? { borderColor: accentColor } : {}}
                        >
                          <input
                            type="file"
                            id={`file-input-${q.id}`}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileSelect(q.id, file, q.fileConfig);
                            }}
                          />
                          <UploadCloud className="w-6 h-6" style={{ color: accentColor }} />
                          <p className={`text-xs font-medium ${isLightMode ? 'text-slate-700' : 'text-on-surface'}`}>
                            Drag & drop file here, or{' '}
                            <button
                              type="button"
                              onClick={() => document.getElementById(`file-input-${q.id}`)?.click()}
                              className="underline cursor-pointer font-semibold"
                              style={{ color: accentColor }}
                            >
                              browse
                            </button>
                          </p>
                          <p className={`text-[10px] font-mono ${isLightMode ? 'text-slate-400' : 'text-outline'}`}>
                            Up to {q.fileConfig?.maxSizeMB || 10} MB
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Validation Error */}
                  {hasError && (
                    <div className="flex items-center gap-1.5 text-xs text-error font-medium pt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors[q.id]}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom Actions Bar */}
            <div className="pt-4 flex items-center justify-between gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm shadow-xl transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: accentColor }}
              >
                <span>{isSubmitting ? 'Submitting...' : 'Submit Form'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs text-on-surface-variant hover:text-on-surface px-3 py-2 transition-colors cursor-pointer"
              >
                Clear form
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Floating Google Forms-style Edit button (Only visible to authenticated creator/editor) */}
      {canEdit && onBackToBuilder && (
        <button
          type="button"
          onClick={onBackToBuilder}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-primary hover:bg-primary-container text-on-primary font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group border border-white/20"
          title="Edit this form (Only visible to you as the creator)"
        >
          <Edit3 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-semibold hidden sm:inline">Edit this form</span>
        </button>
      )}
    </div>
  );
}
