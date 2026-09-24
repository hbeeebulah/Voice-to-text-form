import React, { useState, useEffect } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  Users,
  Mic,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
  UserCheck,
  RefreshCw,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import {
  fetchAnalytics,
  fetchResponses,
  getExportCsvUrl,
  getExportJsonUrl
} from '../../services/api';

export default function ResponseAnalytics({ form, onOpenResponderPreview }) {
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
      setResponses(responsesData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
          <span className="text-xs font-semibold text-slate-500">
            Calculating response analytics...
          </span>
        </div>
      </div>
    );
  }

  const totalSubmissions = analytics?.totalSubmissions || 0;
  const currentResponse = responses[currentResponseIndex];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-fadeIn pb-32">
      {/* Top Header Card: Metric Highlights & Export Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                Live Analytics
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Responses Dashboard
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Real-time insights and Gemini voice dictation engagement
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <a
              href={getExportCsvUrl(form.id)}
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
              title="Download CSV Spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </a>

            <a
              href={getExportJsonUrl(form.id)}
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
              title="Download JSON Payload"
            >
              <FileCode className="w-4 h-4 text-indigo-600" />
              <span>Export JSON</span>
            </a>

            <button
              onClick={loadData}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Metric Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Submissions */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-200">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{totalSubmissions}</p>
              <p className="text-xs font-medium text-slate-500">Total Submissions</p>
            </div>
          </div>

          {/* Card 2: Voice Dictation Usage */}
          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm shadow-purple-200">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-slate-900">
                  {analytics?.voiceUsagePercentage ?? 0}%
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                  Voice
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500">Voice Dictation Usage</p>
            </div>
          </div>

          {/* Card 3: Latest Submission */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-200">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {analytics?.lastSubmissionAt
                  ? new Date(analytics.lastSubmissionAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'No submissions'}
              </p>
              <p className="text-xs font-medium text-slate-500">Latest Activity</p>
            </div>
          </div>
        </div>

        {/* View Switcher: Summary vs Individual */}
        <div className="flex items-center border-b border-slate-200 pt-2 gap-6 text-sm">
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-3 font-semibold transition-all relative flex items-center gap-2 ${
              activeTab === 'summary'
                ? 'text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Summary Charts</span>
            {activeTab === 'summary' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('individual')}
            className={`pb-3 font-semibold transition-all relative flex items-center gap-2 ${
              activeTab === 'individual'
                ? 'text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Individual Responses ({totalSubmissions})</span>
            {activeTab === 'individual' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Zero Submissions Empty State */}
      {totalSubmissions === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Waiting for responses</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            This form has not received any submissions yet. Try opening the responder view to submit a test response with Gemini voice dictation!
          </p>
          {onOpenResponderPreview && (
            <button
              onClick={onOpenResponderPreview}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <span>Open Form Responder to Test</span>
            </button>
          )}
        </div>
      )}

      {/* SUMMARY CHARTS TAB */}
      {totalSubmissions > 0 && activeTab === 'summary' && (
        <div className="space-y-4">
          {(analytics?.questionAnalytics || []).map((qAnalytics, idx) => (
            <div
              key={qAnalytics.questionId || idx}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Question {idx + 1} • {qAnalytics.type.replace('_', ' ')}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {qAnalytics.title}
                  </h3>
                </div>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {qAnalytics.responseCount} answers
                </span>
              </div>

              {/* Multiple Choice, Checkboxes, Dropdown Bar Charts */}
              {['multiple_choice', 'checkboxes', 'dropdown'].includes(qAnalytics.type) && (
                <div className="space-y-3 pt-2">
                  {(qAnalytics.data || []).map((item, itemIdx) => {
                    const colors = [
                      'bg-indigo-600',
                      'bg-purple-600',
                      'bg-pink-500',
                      'bg-amber-500',
                      'bg-emerald-500',
                      'bg-cyan-500'
                    ];
                    const barColor = colors[itemIdx % colors.length];

                    return (
                      <div key={itemIdx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-800">{item.label}</span>
                          <span className="font-semibold text-slate-600">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor} rounded-full transition-all duration-500`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Linear Scale Rating Analytics */}
              {qAnalytics.type === 'linear_scale' && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-center px-4 border-r border-slate-200">
                      <p className="text-3xl font-black text-indigo-600">
                        {qAnalytics.average || '—'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase">
                        Average Score
                      </p>
                    </div>

                    <div className="flex-1 flex items-center justify-between text-xs text-slate-500 px-2">
                      <span>Min: {qAnalytics.scaleConfig?.minLabel || 'Lowest'}</span>
                      <span>Max: {qAnalytics.scaleConfig?.maxLabel || 'Highest'}</span>
                    </div>
                  </div>

                  {/* Distribution breakdown */}
                  <div className="space-y-2">
                    {(qAnalytics.distribution || []).map((scoreItem) => (
                      <div key={scoreItem.score} className="flex items-center gap-3 text-xs">
                        <span className="font-bold text-slate-700 w-5 text-center">
                          {scoreItem.score}
                        </span>
                        <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${scoreItem.percentage}%` }}
                          />
                        </div>
                        <span className="text-slate-500 w-16 text-right">
                          {scoreItem.count} ({scoreItem.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Short Answer & Paragraph: List of responses with Voice Badge */}
              {(qAnalytics.type === 'short_answer' || qAnalytics.type === 'paragraph') && (
                <div className="space-y-3 pt-2">
                  {/* Voice dictation percentage badge */}
                  <div className="flex items-center justify-between px-3 py-2 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900">
                    <span className="font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Gemini Voice Dictation Adoption
                    </span>
                    <span className="font-bold px-2 py-0.5 rounded-md bg-white text-indigo-700 shadow-2xs border border-indigo-200">
                      {qAnalytics.voiceRate}% ({qAnalytics.voiceCount} of {qAnalytics.responseCount})
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(qAnalytics.responses || []).map((item, rIdx) => (
                      <div
                        key={item.id || rIdx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 hover:bg-white transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {item.usedVoice && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700">
                              <Mic className="w-3 h-3 text-purple-600" />
                              Dictated via Voice
                            </span>
                          )}
                        </div>
                        <p className="text-slate-800 leading-relaxed font-sans">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* INDIVIDUAL RESPONSES TAB */}
      {totalSubmissions > 0 && activeTab === 'individual' && currentResponse && (
        <div className="space-y-4">
          {/* Navigation Bar between respondents */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                disabled={currentResponseIndex === 0}
                onClick={() => setCurrentResponseIndex(prev => prev - 1)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold text-slate-800">
                Response {currentResponseIndex + 1} of {totalSubmissions}
              </span>

              <button
                disabled={currentResponseIndex >= totalSubmissions - 1}
                onClick={() => setCurrentResponseIndex(prev => prev + 1)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Submitted: {new Date(currentResponse.submittedAt).toLocaleString()}
            </div>
          </div>

          {/* Render individual responses to all questions */}
          <div className="space-y-3">
            {(form.questions || []).map((q, qIdx) => {
              const answer = currentResponse.answers?.[q.id];
              const wasVoice = Boolean(currentResponse.voiceFieldStats?.[q.id]);

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {qIdx + 1}. {q.title}
                    </span>
                    {wasVoice && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
                        <Mic className="w-3 h-3 text-purple-600" />
                        Voice Dictated
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800">
                    {Array.isArray(answer) ? (
                      <ul className="list-disc list-inside space-y-0.5">
                        {answer.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    ) : answer !== undefined && answer !== null && answer !== '' ? (
                      <p className="whitespace-pre-line leading-relaxed">{String(answer)}</p>
                    ) : (
                      <span className="italic text-slate-400">No response provided</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
