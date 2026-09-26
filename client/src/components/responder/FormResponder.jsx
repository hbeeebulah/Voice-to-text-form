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
  Edit3,
  Paperclip,
  UploadCloud,
  FileText,
  Download,
  X,
  File
} from 'lucide-react';
import AudioRecorder from '../common/AudioRecorder';
import { submitResponse, uploadFile } from '../../services/api';

// Format bytes into human-readable string
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Get icon corresponding to file type/extension
function getFileIcon(type = '', name = '') {
  const ext = (name || '').split('.').pop()?.toLowerCase();
  if (type.includes('pdf') || ext === 'pdf') {
    return <FileText className="w-5 h-5 text-red-500" />;
  }
  if (type.includes('image') || ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
    return <FileText className="w-5 h-5 text-emerald-500" />;
  }
  if (type.includes('sheet') || type.includes('csv') || ['xlsx', 'xls', 'csv'].includes(ext)) {
    return <FileText className="w-5 h-5 text-teal-500" />;
  }
  return <Paperclip className="w-5 h-5 text-indigo-500" />;
}

// Compute accept attribute for file input
function getAcceptedMimeTypes(allowedTypes) {
  if (allowedTypes === 'documents') {
    return '.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';
  }
  if (allowedTypes === 'images') {
    return 'image/*,.png,.jpg,.jpeg,.webp';
  }
  if (allowedTypes === 'spreadsheets') {
    return '.xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';
  }
  return '*/*';
}

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
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [dragOverQuestionId, setDragOverQuestionId] = useState(null);

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

  // Handle file attachment selection and upload
  const handleFileSelect = async (qId, file, fileConfig = {}) => {
    if (!file) return;

    const maxSizeMB = fileConfig.maxSizeMB || 10;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      setErrors(prev => ({
        ...prev,
        [qId]: `File size (${formatFileSize(file.size)}) exceeds the maximum allowed limit of ${maxSizeMB} MB.`
      }));
      return;
    }

    setUploadingFiles(prev => ({ ...prev, [qId]: true }));
    if (errors[qId]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }

    try {
      // 1. Read base64 dataUrl for instant client-side preview & fallback
      const reader = new FileReader();
      const dataUrlPromise = new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });

      // 2. Upload to backend if available
      let serverResult = null;
      try {
        serverResult = await uploadFile(file);
      } catch (uploadErr) {
        console.warn('[File Upload] Using dataUrl fallback:', uploadErr.message);
      }

      const dataUrl = await dataUrlPromise;

      const fileRecord = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        fileUrl: serverResult?.fileUrl || '',
        dataUrl: dataUrl || ''
      };

      handleAnswerChange(qId, fileRecord);
    } catch (err) {
      console.error('[File Select] Error:', err);
      setErrors(prev => ({ ...prev, [qId]: 'Failed to process attached file.' }));
    } finally {
      setUploadingFiles(prev => ({ ...prev, [qId]: false }));
    }
  };

  // Validate and submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    questions.forEach(q => {
      if (q.required) {
        const val = answers[q.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          newErrors[q.id] = q.type === 'file_upload' ? 'Please attach a document or file.' : 'This question is required.';
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
                        {Array.isArray(val) ? (
                          val.join(', ')
                        ) : val && typeof val === 'object' && val.fileName ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                            <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                            {val.fileName} ({formatFileSize(val.fileSize)})
                          </span>
                        ) : (
                          val || <span className="italic text-slate-400">No answer provided</span>
                        )}
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

                      {/* Voice Dictation Toolbar */}
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

                      {/* Voice Dictation Toolbar */}
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

                  {/* File / Document Attachment */}
                  {q.type === 'file_upload' && (
                    <div className="space-y-3">
                      {val && typeof val === 'object' && val.fileName ? (
                        /* Attached File Card */
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                              {getFileIcon(val.fileType, val.fileName)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate" title={val.fileName}>
                                {val.fileName}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <span>{formatFileSize(val.fileSize)}</span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  Attached
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {(val.dataUrl || val.fileUrl) && (
                              <a
                                href={val.dataUrl || val.fileUrl}
                                download={val.fileName}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAnswerChange(q.id, null)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
                              title="Remove attached document"
                            >
                              <X className="w-4 h-4" />
                              <span className="sm:hidden">Remove</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Upload Dropzone */
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
                          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-7 text-center transition-all ${
                            dragOverQuestionId === q.id
                              ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
                              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="file"
                            id={`file-input-${q.id}`}
                            accept={getAcceptedMimeTypes(q.fileConfig?.allowedTypes)}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileSelect(q.id, file, q.fileConfig);
                            }}
                            className="hidden"
                          />

                          {uploadingFiles[q.id] ? (
                            <div className="flex flex-col items-center justify-center py-4 space-y-2">
                              <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                              <p className="text-xs font-semibold text-slate-700">Attaching document...</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-2xs">
                                <UploadCloud className="w-6 h-6 stroke-[2]" />
                              </div>

                              <div>
                                <p className="text-xs font-bold text-slate-800">
                                  Drag & drop document here, or browse
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {q.fileConfig?.allowedTypes === 'documents' && 'PDF, DOC, DOCX, TXT'}
                                  {q.fileConfig?.allowedTypes === 'images' && 'PNG, JPG, JPEG, WEBP'}
                                  {q.fileConfig?.allowedTypes === 'spreadsheets' && 'XLSX, XLS, CSV'}
                                  {(!q.fileConfig?.allowedTypes || q.fileConfig?.allowedTypes === 'all') && 'PDF, Word, Excel, Images, or Text'}
                                  {' '}up to {q.fileConfig?.maxSizeMB || 10} MB
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => document.getElementById(`file-input-${q.id}`)?.click()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 shadow-2xs transition-all hover:scale-102 cursor-pointer"
                              >
                                <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{q.fileConfig?.buttonLabel || 'Attach File'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
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
