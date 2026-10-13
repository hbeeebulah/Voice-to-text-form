import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  Mic,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Share2,
  Calendar,
  Layers,
  ArrowLeft,
  TrendingUp,
  BarChart3,
  Sparkles
} from 'lucide-react';
import {
  fetchAnalytics,
  fetchResponses,
  getExportCsvUrl,
  getExportJsonUrl
} from '../../services/api';

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function ResponseAnalytics({
  form,
  onOpenResponderPreview,
  onUpdateForm,
  onNavigateTab
}) {
  const [analytics, setAnalytics] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'individual'
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);

  useEffect(() => {
    loadData();
  }, [form.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsData, responsesData] = await Promise.all([
        fetchAnalytics(form.id),
        fetchResponses(form.id)
      ]);
      setAnalytics(analyticsData);
      setResponses(responsesData || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSubmissions = responses.length;
  const voiceSubmissionsCount = responses.filter(r =>
    r.voiceFieldStats && Object.values(r.voiceFieldStats).some(Boolean)
  ).length;

  const voiceRate = totalSubmissions > 0
    ? Math.round((voiceSubmissionsCount / totalSubmissions) * 100)
    : 0;

  const isAccepting = form.settings?.acceptingResponses !== false;
  const currentResponse = responses[currentResponseIndex];

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container pb-24">
      {/* Centered Analytics Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 flex flex-col gap-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('questions')}
                  className="flex items-center gap-1 hover:text-on-surface transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Questions</span>
                </button>
              )}
              <span>/</span>
              <span>Analytics & Responses</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <h1 className="font-bold text-xl sm:text-2xl text-on-surface tracking-tight">
                {form.title || 'Untitled Form'}
              </h1>

              {/* Accepting responses switch */}
              <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-1 rounded-full bg-surface-container border border-outline-variant/20">
                <input
                  type="checkbox"
                  checked={isAccepting}
                  onChange={(e) => onUpdateForm({
                    settings: { ...(form.settings || {}), acceptingResponses: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-7 h-3.5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-tertiary relative" />
                <span className={`text-[11px] font-mono font-medium ${isAccepting ? 'text-tertiary' : 'text-outline'}`}>
                  {isAccepting ? 'Accepting Responses' : 'Closed'}
                </span>
              </label>
            </div>
          </div>

          {/* Export CSV / JSON & Preview */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={getExportCsvUrl(form.id)}
              download
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-on-surface-variant" />
              <span>Export CSV</span>
            </a>

            <a
              href={getExportJsonUrl(form.id)}
              download
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-on-surface-variant" />
              <span>Export JSON</span>
            </a>

            {onOpenResponderPreview && (
              <button
                type="button"
                onClick={onOpenResponderPreview}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Test Form</span>
              </button>
            )}
          </div>
        </div>

        {/* Real Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
            <span className="text-xs text-on-surface-variant font-medium">Total Submissions</span>
            <span className="font-bold text-2xl text-on-surface">{totalSubmissions}</span>
            <span className="text-[11px] text-on-surface-variant/70 font-mono">Recorded responses</span>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
            <span className="text-xs text-on-surface-variant font-medium">Voice-Dictated Submissions</span>
            <span className="font-bold text-2xl text-tertiary">{voiceSubmissionsCount}</span>
            <span className="text-[11px] text-on-surface-variant/70 font-mono">
              Used speech-to-text
            </span>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
            <span className="text-xs text-on-surface-variant font-medium">Voice Usage Rate</span>
            <span className="font-bold text-2xl text-primary">{voiceRate}%</span>
            <span className="text-[11px] text-on-surface-variant/70 font-mono">
              Of all respondents
            </span>
          </div>
        </div>

        {/* Tab Switcher: Summary vs Individual */}
        <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-surface-container text-primary border border-outline-variant/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Summary Insights
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('individual')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'individual'
                ? 'bg-surface-container text-primary border border-outline-variant/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Individual Responses ({totalSubmissions})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 text-center text-on-surface-variant text-xs font-mono">
            Loading response analytics...
          </div>
        )}

        {/* Empty State */}
        {!loading && totalSubmissions === 0 && (
          <div className="bg-surface-container-low rounded-3xl p-12 text-center border border-outline-variant/20 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary shadow-inner">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-on-surface">No responses yet</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-sm">
                Share your form short link or QR code to collect spoken and written submissions.
              </p>
            </div>
            {onOpenResponderPreview && (
              <button
                type="button"
                onClick={onOpenResponderPreview}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-semibold shadow-md cursor-pointer hover:scale-102 transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Submit a Test Response</span>
              </button>
            )}
          </div>
        )}

        {/* TAB 1: SUMMARY INSIGHTS */}
        {!loading && totalSubmissions > 0 && activeTab === 'summary' && (
          <div className="flex flex-col gap-5">
            {(form.questions || []).map((q, qIdx) => {
              // Gather all answers for this question across responses
              const questionAnswers = responses
                .map((r) => ({
                  val: r.answers?.[q.id],
                  wasVoice: Boolean(r.voiceFieldStats?.[q.id]),
                  submittedAt: r.submittedAt
                }))
                .filter((a) => a.val !== undefined && a.val !== null && a.val !== '');

              return (
                <div
                  key={q.id}
                  className="bg-surface-container-low rounded-2xl p-5 sm:p-6 shadow-md border border-outline-variant/20 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-outline-variant/10 pb-2.5">
                    <div>
                      <span className="font-mono text-xs text-primary font-bold mr-2">Q{qIdx + 1}</span>
                      <span className="font-semibold text-sm sm:text-base text-on-surface">
                        {q.title || 'Untitled Question'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-on-surface-variant">
                      {questionAnswers.length} responses
                    </span>
                  </div>

                  {/* 1. Multiple Choice / Checkboxes Breakdown */}
                  {['multiple_choice', 'checkboxes', 'dropdown'].includes(q.type) && (
                    <div className="flex flex-col gap-2 pt-1">
                      {(q.options || []).map((opt, oIdx) => {
                        const count = questionAnswers.filter((a) =>
                          Array.isArray(a.val) ? a.val.includes(opt) : a.val === opt
                        ).length;
                        const pct = questionAnswers.length > 0
                          ? Math.round((count / questionAnswers.length) * 100)
                          : 0;

                        return (
                          <div key={oIdx} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs text-on-surface">
                              <span>{opt}</span>
                              <span className="font-mono text-on-surface-variant">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 2. Text / Voice Answers List */}
                  {['paragraph', 'short_answer'].includes(q.type) && (
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                      {questionAnswers.length > 0 ? (
                        questionAnswers.map((a, aIdx) => (
                          <div
                            key={aIdx}
                            className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/20 text-xs flex flex-col gap-1.5"
                          >
                            <p className="text-on-surface leading-relaxed whitespace-pre-line">
                              {String(a.val)}
                            </p>
                            <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
                              <span>{new Date(a.submittedAt).toLocaleTimeString()}</span>
                              {a.wasVoice && (
                                <span className="inline-flex items-center gap-1 text-tertiary font-semibold">
                                  <Mic className="w-3 h-3" />
                                  Voice Dictated
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-outline italic py-2">No answers yet.</p>
                      )}
                    </div>
                  )}

                  {/* 3. Linear Scale Breakdown */}
                  {q.type === 'linear_scale' && (
                    <div className="flex flex-col gap-2 pt-1">
                      {Array.from({
                        length: (q.scaleConfig?.max || 5) - (q.scaleConfig?.min || 1) + 1
                      }, (_, i) => (q.scaleConfig?.min || 1) + i).map((num) => {
                        const count = questionAnswers.filter((a) => Number(a.val) === num).length;
                        const pct = questionAnswers.length > 0
                          ? Math.round((count / questionAnswers.length) * 100)
                          : 0;

                        return (
                          <div key={num} className="flex items-center gap-3 text-xs">
                            <span className="w-6 font-mono font-bold text-on-surface">{num}</span>
                            <div className="flex-1 h-2 rounded-full bg-surface-container overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="font-mono text-on-surface-variant text-[11px] w-12 text-right">
                              {count} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 4. File Upload List */}
                  {q.type === 'file_upload' && (
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                      {questionAnswers.map((a, aIdx) => {
                        const file = a.val || {};
                        return (
                          <div
                            key={aIdx}
                            className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/20 text-xs flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileText className="w-4 h-4 text-primary shrink-0" />
                              <div className="min-w-0">
                                <p className="font-semibold text-on-surface truncate">
                                  {file.fileName || 'Attached Document'}
                                </p>
                                <p className="text-[10px] text-on-surface-variant font-mono">
                                  {formatFileSize(file.fileSize)}
                                </p>
                              </div>
                            </div>

                            {file.fileUrl && (
                              <a
                                href={file.fileUrl}
                                download={file.fileName}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/30 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: INDIVIDUAL RESPONSES */}
        {!loading && totalSubmissions > 0 && activeTab === 'individual' && currentResponse && (
          <div className="flex flex-col gap-4">
            {/* Step through navigation */}
            <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentResponseIndex === 0}
                  onClick={() => setCurrentResponseIndex((p) => p - 1)}
                  className="p-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs font-semibold text-on-surface">
                  Response {currentResponseIndex + 1} of {totalSubmissions}
                </span>
                <button
                  type="button"
                  disabled={currentResponseIndex >= totalSubmissions - 1}
                  onClick={() => setCurrentResponseIndex((p) => p + 1)}
                  className="p-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-[11px] text-on-surface-variant font-mono">
                Submitted {new Date(currentResponse.submittedAt).toLocaleString()}
              </div>
            </div>

            {/* Answers to all questions */}
            <div className="flex flex-col gap-3">
              {(form.questions || []).map((q, qIdx) => {
                const answer = currentResponse.answers?.[q.id];
                const wasVoice = Boolean(currentResponse.voiceFieldStats?.[q.id]);

                return (
                  <div
                    key={q.id}
                    className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/20 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs sm:text-sm text-on-surface">
                        {qIdx + 1}. {q.title}
                      </span>
                      {wasVoice && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-tertiary/15 text-tertiary">
                          <Mic className="w-3 h-3" />
                          Voice Dictated
                        </span>
                      )}
                    </div>

                    <div className="p-3 bg-surface-container/60 rounded-xl border border-outline-variant/20 text-xs text-on-surface">
                      {Array.isArray(answer) ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          {answer.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      ) : answer && typeof answer === 'object' && answer.fileName ? (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <span className="truncate">{answer.fileName}</span>
                            <span className="text-[10px] text-on-surface-variant">
                              ({formatFileSize(answer.fileSize)})
                            </span>
                          </div>
                          {answer.fileUrl && (
                            <a
                              href={answer.fileUrl}
                              download={answer.fileName}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline font-mono text-[11px]"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      ) : answer !== undefined && answer !== null && answer !== '' ? (
                        <p className="whitespace-pre-line leading-relaxed">{String(answer)}</p>
                      ) : (
                        <span className="italic text-outline">No response provided</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
