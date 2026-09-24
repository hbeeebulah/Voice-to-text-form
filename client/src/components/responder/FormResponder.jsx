import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Check,
  ChevronDown,
  ArrowRight,
  Eye,
  Edit3
} from 'lucide-react';
import AudioRecorder from '../common/AudioRecorder';
import { submitResponse } from '../../services/api';

export default function FormResponder({
  form,
  onBackToBuilder,
  apiKey = ''
}) {
  const [answers, setAnswers] = useState({});
  const [voiceFieldStats, setVoiceFieldStats] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const theme = form.theme || {};
  const questions = form.questions || [];
  const accentColor = theme.accentColor || '#6366f1';

  // Handle value change for any question
  const handleAnswerChange = (qId, value, wasVoice = false) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));

    if (wasVoice) {
      setVoiceFieldStats(prev => ({ ...prev, [qId]: true }));
    }

    // Clear error if field is filled
    if (errors[qId]) {
      setErrors(prev => {
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
      updated = currentList.filter(item => item !== option);
    } else {
      updated = [...currentList, option];
    }
    handleAnswerChange(qId, updated);
  };

  // Calculate completion progress
  const answeredCount = questions.filter(q => {
    const val = answers[q.id];
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }).length;

  const progressPercentage = questions.length > 0
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  // Validate and submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    questions.forEach(q => {
      if (q.required) {
        const val = answers[q.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          newErrors[q.id] = 'This question is required.';
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // Scroll to first invalid field
      const firstInvalidId = Object.keys(newErrors)[0];
      const el = document.getElementById(`field-${firstInvalidId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitResponse(form.id, {
        answers,
        voiceFieldStats
      });

      setConfirmationMessage(
        res.confirmationMessage ||
        form.settings?.confirmationMessage ||
        'Your response has been recorded. Thank you!'
      );
      setIsSubmitted(true);
    } catch (err) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAnswers({});
    setVoiceFieldStats({});
    setErrors({});
    setIsSubmitted(false);
    setShowReview(false);
  };

  // Confirmation screen
  if (isSubmitted) {
    return (
      <div
        className="min-h-screen py-12 px-4 flex items-center justify-center transition-colors"
        style={{ backgroundColor: theme.backgroundColor || '#f8fafc' }}
      >
        <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fadeIn">
          {/* Accent Header */}
          <div
            className="h-3 w-full"
            style={{ background: theme.bannerGradient || theme.accentColor || '#6366f1' }}
          />

          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2
                className="text-2xl font-bold text-slate-900"
                style={{ fontFamily: theme.fontHeader || 'Inter' }}
              >
                Submission Received!
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                {confirmationMessage}
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Submit Another Response</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReview(!showReview)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>{showReview ? 'Hide Responses' : 'Review My Answers'}</span>
              </button>
            </div>

            {/* Submission Receipt Review */}
            {showReview && (
              <div className="mt-6 text-left p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3 animate-fadeIn">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
                  Response Summary Receipt
                </h4>
                {questions.map((q) => {
                  const val = answers[q.id];
                  return (
                    <div key={q.id} className="space-y-1">
                      <p className="font-semibold text-slate-700">{q.title}</p>
                      <p className="text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                        {Array.isArray(val) ? val.join(', ') : (val || <span className="italic text-slate-400">No answer provided</span>)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {onBackToBuilder && (
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onBackToBuilder}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Return to Form Builder</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-10 px-4 sm:px-6 relative transition-colors"
      style={{
        backgroundColor: theme.backgroundColor || '#f8fafc',
        fontFamily: theme.fontBody || 'Inter'
      }}
    >
      <div className="max-w-2xl mx-auto space-y-5 pb-24">
        {/* Switch to Builder button banner (top) */}
        {onBackToBuilder && (
          <div className="flex items-center justify-between px-2 text-xs">
            <button
              onClick={onBackToBuilder}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-xl border border-slate-200 shadow-2xs transition-colors font-medium"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Back to Form Editor</span>
            </button>

            <span className="text-slate-500 text-[11px]">
              Public Form Responder View
            </span>
          </div>
        )}

        {/* Form Title & Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div
            className="h-3.5 w-full"
            style={{ background: theme.bannerGradient || theme.accentColor || '#6366f1' }}
          />
          <div className="p-6 sm:p-8 space-y-3">
            <h1
              className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight"
              style={{ fontFamily: theme.fontHeader || 'Inter' }}
            >
              {form.title || 'Untitled Form'}
            </h1>

            {form.description && (
              <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                {form.description}
              </p>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-red-500 font-medium">* Indicates required question</span>

              {form.settings?.showProgressBar !== false && (
                <span className="font-medium text-slate-600">
                  {progressPercentage}% Completed
                </span>
              )}
            </div>

            {/* Progress Bar */}
            {form.settings?.showProgressBar !== false && (
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${progressPercentage}%`,
                    backgroundColor: accentColor
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Questions Cards */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {questions.map((q, index) => {
            const hasError = Boolean(errors[q.id]);
            const val = answers[q.id];

            return (
              <div
                key={q.id}
                id={`field-${q.id}`}
                className={`bg-white rounded-2xl border p-6 transition-all duration-200 ${
                  hasError
                    ? 'border-red-400 ring-2 ring-red-100'
                    : 'border-slate-200 shadow-2xs hover:shadow-xs'
                }`}
              >
                {/* Question Title & Description */}
                <div className="mb-4">
                  <h3
                    className="text-base font-semibold text-slate-900 leading-snug"
                    style={{ fontFamily: theme.fontHeader || 'Inter' }}
                  >
                    {q.title || `Question ${index + 1}`}
                    {q.required && <span className="text-red-500 ml-1 font-bold">*</span>}
                  </h3>

                  {q.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {q.description}
                    </p>
                  )}
                </div>

                {/* Question Input Controls */}
                <div>
                  {/* Short Answer */}
                  {q.type === 'short_answer' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={val || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder="Your answer (or click dictate below)..."
                        className="w-full px-3.5 py-2.5 text-sm border-b-2 border-slate-200 focus:border-indigo-600 bg-transparent focus:outline-none transition-colors"
                      />

                      {/* Gemini Voice Dictation Toolbar */}
                      {q.voiceEnabled !== false && (
                        <AudioRecorder
                          questionTitle={q.title}
                          questionDescription={q.description}
                          fieldType="short_answer"
                          currentValue={val || ''}
                          onTranscriptionComplete={(text, mode) => {
                            handleAnswerChange(q.id, text, true);
                          }}
                          accentColor={accentColor}
                          apiKey={apiKey}
                        />
                      )}
                    </div>
                  )}

                  {/* Paragraph (Long Answer) */}
                  {q.type === 'paragraph' && (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={val || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder="Your detailed response (or click dictate below)..."
                        className="w-full px-3.5 py-2.5 text-sm border-2 border-slate-200 focus:border-indigo-600 rounded-xl focus:outline-none transition-colors resize-y min-h-[90px]"
                      />

                      {/* Gemini Voice Dictation Toolbar */}
                      {q.voiceEnabled !== false && (
                        <AudioRecorder
                          questionTitle={q.title}
                          questionDescription={q.description}
                          fieldType="paragraph"
                          currentValue={val || ''}
                          onTranscriptionComplete={(text, mode) => {
                            handleAnswerChange(q.id, text, true);
                          }}
                          accentColor={accentColor}
                          apiKey={apiKey}
                        />
                      )}
                    </div>
                  )}

                  {/* Multiple Choice */}
                  {q.type === 'multiple_choice' && (
                    <div className="space-y-2.5">
                      {(q.options || []).map((opt, optIdx) => {
                        const isSelected = val === opt;
                        return (
                          <label
                            key={optIdx}
                            onClick={() => handleAnswerChange(q.id, opt)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-sm cursor-pointer transition-all ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-50/40 text-indigo-950 font-medium shadow-2xs'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-800'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Checkboxes */}
                  {q.type === 'checkboxes' && (
                    <div className="space-y-2.5">
                      {(q.options || []).map((opt, optIdx) => {
                        const isChecked = Array.isArray(val) && val.includes(opt);
                        return (
                          <label
                            key={optIdx}
                            onClick={() => handleCheckboxToggle(q.id, opt)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-sm cursor-pointer transition-all ${
                              isChecked
                                ? 'border-indigo-500 bg-indigo-50/40 text-indigo-950 font-medium shadow-2xs'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-800'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                isChecked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Dropdown */}
                  {q.type === 'dropdown' && (
                    <div>
                      <select
                        value={val || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 cursor-pointer"
                      >
                        <option value="">Select an option...</option>
                        {(q.options || []).map((opt, optIdx) => (
                          <option key={optIdx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Linear Scale */}
                  {q.type === 'linear_scale' && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
                        <span>{q.scaleConfig?.minLabel || 'Min'}</span>
                        <span>{q.scaleConfig?.maxLabel || 'Max'}</span>
                      </div>

                      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
                        {Array.from(
                          { length: (q.scaleConfig?.max ?? 5) - (q.scaleConfig?.min ?? 1) + 1 },
                          (_, i) => (q.scaleConfig?.min ?? 1) + i
                        ).map((num) => {
                          const isSelected = Number(val) === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleAnswerChange(q.id, num)}
                              className={`flex-1 min-w-[36px] h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Validation Error Message */}
                {hasError && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-red-600 animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors[q.id]}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Form Submit & Clear Action Bar */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition-all hover:scale-102 disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: accentColor }}
            >
              <span>{isSubmitting ? 'Submitting...' : 'Submit Form'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Clear form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
