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
  Edit3
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
  apiKey = ''
}) {
  const [answers, setAnswers] = useState({});
  const [voiceFieldStats, setVoiceFieldStats] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [dragOverQuestionId, setDragOverQuestionId] = useState(null);

  const theme = form.theme || {};
  const questions = form.questions || [];
  const headerBannerUrl = theme.headerBannerUrl || form.headerBannerUrl || form.headerImage || '';
  const accentColor = theme.accentColor || '#8083ff';

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

  // If form is closed
  const isFormClosed = form.settings?.acceptingResponses === false;

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container pb-24">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/20 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold shadow-md">
            <Mic className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-on-surface">
            VoxForm
          </span>
        </div>

        {onBackToBuilder && (
          <button
            type="button"
            onClick={onBackToBuilder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/30 transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-primary" />
            <span>Back to Builder</span>
          </button>
        )}
      </header>

      {/* Main Centered Responder Canvas */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 flex flex-col gap-5">
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
        <div className="bg-surface-container-low rounded-2xl p-6 sm:p-8 shadow-xl border border-outline-variant/20 flex flex-col gap-3">
          <h1 className="font-bold text-2xl sm:text-3xl text-on-surface tracking-tight">
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
          <div className="bg-surface-container-low rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
              <span>{answeredCount} of {questions.length} answered</span>
              <span className="text-primary font-bold">{progressPercentage}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
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

        {/* Case 1: Form is Closed */}
        {isFormClosed ? (
          <div className="bg-surface-container-low rounded-2xl p-8 shadow-xl border border-outline-variant/20 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-outline">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-lg text-on-surface">Form Closed</h2>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-md">
              {form.settings?.closedMessage || 'This form is no longer accepting responses.'}
            </p>
          </div>
        ) : isSubmitted ? (
          /* Case 2: Response Submitted Successfully */
          <div className="bg-surface-container-low rounded-2xl p-8 sm:p-10 shadow-xl border border-outline-variant/20 text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="font-bold text-xl sm:text-2xl text-on-surface">
              {form.settings?.confirmationMessage || 'Thank you! Your response has been recorded.'}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
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
                className="px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all border border-outline-variant/30 cursor-pointer"
              >
                Submit another response
              </button>
              {onBackToBuilder && (
                <button
                  type="button"
                  onClick={onBackToBuilder}
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold transition-all shadow-md cursor-pointer"
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
                  className={`bg-surface-container-low rounded-2xl p-5 sm:p-7 shadow-lg border transition-all flex flex-col gap-3.5 ${
                    hasError
                      ? 'border-error ring-1 ring-error/50'
                      : 'border-outline-variant/20'
                  }`}
                >
                  {/* Question Title & Description */}
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-base sm:text-lg text-on-surface leading-snug">
                      {q.title || `Question ${idx + 1}`}
                      {q.required && <span className="text-error ml-1">*</span>}
                    </h3>
                    {q.description && (
                      <p className="text-xs text-on-surface-variant leading-relaxed">
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
                          className="w-full px-3.5 py-2.5 bg-surface-container text-on-surface text-xs sm:text-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary transition-colors placeholder:text-outline"
                        />
                      ) : (
                        <textarea
                          rows={3}
                          value={val || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          placeholder="Your answer (type or speak)..."
                          className="w-full px-3.5 py-2.5 bg-surface-container text-on-surface text-xs sm:text-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary transition-colors placeholder:text-outline resize-y"
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
                              className="text-[11px] text-outline hover:text-on-surface font-mono transition-colors"
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
                              ? 'bg-surface-container-high border-primary text-on-surface font-medium'
                              : 'bg-surface-container/60 hover:bg-surface-container border-outline-variant/20 text-on-surface-variant'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={val === option}
                            onChange={() => handleAnswerChange(q.id, option)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            val === option ? 'border-primary bg-primary' : 'border-outline'
                          }`}>
                            {val === option && <div className="w-1.5 h-1.5 rounded-full bg-on-primary" />}
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
                                ? 'bg-surface-container-high border-primary text-on-surface font-medium'
                                : 'bg-surface-container/60 hover:bg-surface-container border-outline-variant/20 text-on-surface-variant'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCheckboxToggle(q.id, option)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                              isChecked ? 'border-primary bg-primary' : 'border-outline'
                            }`}>
                              {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-on-primary" />}
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
                        className="w-full px-3.5 py-2.5 bg-surface-container text-on-surface text-xs sm:text-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary cursor-pointer"
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
                                ? 'bg-primary text-on-primary border-primary shadow-md'
                                : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/20'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-on-surface-variant px-1 font-mono">
                        <span>{q.scaleConfig?.minLabel || 'Low'}</span>
                        <span>{q.scaleConfig?.maxLabel || 'High'}</span>
                      </div>
                    </div>
                  )}

                  {/* 6. FILE UPLOAD */}
                  {q.type === 'file_upload' && (
                    <div className="pt-1 flex flex-col gap-2">
                      {val && (val.fileName || val.name) ? (
                        <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-on-surface truncate">
                                {val.fileName || val.name}
                              </p>
                              <p className="text-[10px] text-on-surface-variant">
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
                              ? 'border-primary bg-surface-container-high'
                              : 'border-outline-variant/30 hover:border-outline-variant/60 bg-surface-container/50'
                          }`}
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
                          <UploadCloud className="w-6 h-6 text-primary" />
                          <p className="text-xs text-on-surface font-medium">
                            Drag & drop file here, or{' '}
                            <button
                              type="button"
                              onClick={() => document.getElementById(`file-input-${q.id}`)?.click()}
                              className="text-primary underline cursor-pointer"
                            >
                              browse
                            </button>
                          </p>
                          <p className="text-[10px] text-outline font-mono">
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
    </div>
  );
}
