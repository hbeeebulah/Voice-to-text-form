import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  Copy,
  Trash2,
  Eye,
  BarChart3,
  Calendar,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Home,
  Search,
  X,
  Mic,
  Sparkles,
  Share2
} from 'lucide-react';
import UserProfileMenu from '../auth/UserProfileMenu';
import { getAssetUrl } from '../../services/api';

export default function FormsDashboard({
  forms = [],
  onSelectForm,
  onCreateForm,
  onDuplicateForm,
  onDeleteForm,
  onOpenResponder,
  onOpenShare,
  user = null,
  onOpenAuth,
  onUserLoggedOut,
  onUserUpdated,
  onGoToMainPage,
  onOpenApiKey,
  hasApiKey = false
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + N to create form
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        onCreateForm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCreateForm]);

  const templates = [
    {
      title: 'Blank Form',
      description: 'Start from scratch with a single question',
      accentColor: '#8083ff',
      questions: [
        {
          id: `q-${Date.now()}-1`,
          title: 'What would you like to share today?',
          description: 'Type or tap the microphone to speak your answer',
          type: 'paragraph',
          required: false,
          voiceEnabled: true
        }
      ]
    },
    {
      title: 'Customer Audio Feedback',
      description: 'Collect detailed spoken opinions, feature ratings, and satisfaction scores',
      accentColor: '#4edea3',
      questions: [
        {
          id: `q-${Date.now()}-1`,
          title: 'What is your full name?',
          type: 'short_answer',
          required: true,
          voiceEnabled: true
        },
        {
          id: `q-${Date.now()}-2`,
          title: 'Overall satisfaction with our service',
          type: 'linear_scale',
          required: true,
          scaleConfig: { min: 1, max: 5, minLabel: 'Needs Improvement', maxLabel: 'Delighted' }
        },
        {
          id: `q-${Date.now()}-3`,
          title: 'What did you like most or what could we improve?',
          description: 'Feel free to speak your thoughts with voice dictation',
          type: 'paragraph',
          required: true,
          voiceEnabled: true
        }
      ]
    },
    {
      title: 'Daily Voice Standup',
      description: 'Frictionless daily reflection powered by speech-to-text dictation',
      accentColor: '#ff80bf',
      questions: [
        {
          id: `q-${Date.now()}-1`,
          title: 'What are your primary goals for today?',
          type: 'paragraph',
          required: true,
          voiceEnabled: true
        },
        {
          id: `q-${Date.now()}-2`,
          title: 'Any blockers or challenges in your way?',
          type: 'paragraph',
          required: false,
          voiceEnabled: true
        },
        {
          id: `q-${Date.now()}-3`,
          title: 'Current energy & focus level',
          type: 'linear_scale',
          required: false,
          scaleConfig: { min: 1, max: 10, minLabel: 'Low Energy', maxLabel: 'Peak Focus' }
        }
      ]
    },
    {
      title: 'Event Registration & RSVP',
      description: 'Event signup with attendee details and attendance options',
      accentColor: '#ffd166',
      questions: [
        {
          id: `q-${Date.now()}-1`,
          title: 'Attendee Name and Organization',
          type: 'short_answer',
          required: true,
          voiceEnabled: true
        },
        {
          id: `q-${Date.now()}-2`,
          title: 'Will you be attending in person or remotely?',
          type: 'multiple_choice',
          required: true,
          options: ['In Person', 'Remote via Livestream', 'Unable to Attend']
        },
        {
          id: `q-${Date.now()}-3`,
          title: 'Any dietary restrictions or questions for the speakers?',
          type: 'paragraph',
          required: false,
          voiceEnabled: true
        }
      ]
    }
  ];

  const handleCreateWithTemplate = (tpl) => {
    onCreateForm({
      title: tpl.title,
      description: tpl.description,
      questions: tpl.questions,
      theme: { accentColor: tpl.accentColor }
    });
    setTemplateModalOpen(false);
  };

  // Filter forms
  const filteredForms = forms.filter((f) =>
    (f.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalResponses = forms.reduce((sum, f) => sum + (f.responseCount || 0), 0);
  const activeFormsCount = forms.filter((f) => f.settings?.acceptingResponses !== false).length;

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container pb-24">
      {/* Top Header / Greeting Bar */}
      <header className="sticky top-0 z-30 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/20 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onGoToMainPage}
            className="flex items-center gap-2.5 hover:opacity-85 transition-opacity cursor-pointer text-left"
            title="Return to Main Landing Page"
          >
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold shadow-md">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-on-surface block">
                VoxForm Studio
              </span>
            </div>
          </button>

          {onGoToMainPage && (
            <button
              type="button"
              onClick={onGoToMainPage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-semibold border border-outline-variant/30 transition-all cursor-pointer group"
              title="Return to Main Landing Page"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Main Page</span>
            </button>
          )}
        </div>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <UserProfileMenu
              user={user}
              onUserUpdated={onUserUpdated}
              onGoToMainPage={onGoToMainPage}
              onUserLoggedOut={onUserLoggedOut}
              onLogout={onUserLoggedOut}
            />
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/30 transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col gap-8">
        {/* Workspace Greeting & Actions */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div className="flex flex-col gap-1">
            <h1 className="font-bold text-2xl sm:text-3xl text-on-surface tracking-tight">
              {user ? `Welcome back, ${user.name}` : 'Welcome to VoxForm'}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Manage your forms, track voice responses, and share short links.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setTemplateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs sm:text-sm font-semibold border border-outline-variant/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Templates</span>
            </button>

            <button
              type="button"
              onClick={() => onCreateForm()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-bold shadow-lg transition-all hover:scale-102 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Form</span>
            </button>
          </div>
        </section>

        {/* Real Summary Metrics Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
            <span className="text-xs text-on-surface-variant font-medium">Total Forms</span>
            <span className="font-bold text-2xl text-on-surface">{forms.length}</span>
            <span className="text-[11px] text-on-surface-variant/70 font-mono">Created in workspace</span>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
            <span className="text-xs text-on-surface-variant font-medium">Total Responses</span>
            <span className="font-bold text-2xl text-primary">{totalResponses}</span>
            <span className="text-[11px] text-on-surface-variant/70 font-mono">Submissions recorded</span>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
            <span className="text-xs text-on-surface-variant font-medium">Active Forms</span>
            <span className="font-bold text-2xl text-tertiary">{activeFormsCount}</span>
            <span className="text-[11px] text-on-surface-variant/70 font-mono">Open for responders</span>
          </div>
        </section>

        {/* Search Bar */}
        <section className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search forms by title or description..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low text-on-surface text-xs sm:text-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary placeholder:text-outline transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </section>

        {/* Forms Grid or Empty State */}
        <section>
          {filteredForms.length === 0 ? (
            <div className="bg-surface-container-low rounded-3xl p-8 sm:p-12 text-center border border-outline-variant/20 flex flex-col items-center gap-6 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                <FileText className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="font-bold text-lg sm:text-xl text-on-surface">
                  {searchQuery ? 'No forms match your search' : 'No forms yet in your workspace'}
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
                  {searchQuery
                    ? 'Try searching with another keyword or clear the search query filter.'
                    : 'Get started by creating a new form. Set up voice-to-text dictation questions, generate your short link and QR code to share, and start seeing responses in real-time.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => onCreateForm()}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold shadow-lg cursor-pointer hover:bg-primary-container transition-all hover:scale-102"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Form</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs sm:text-sm font-semibold border border-outline-variant/30 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Start from Template</span>
                </button>
              </div>

              {/* 3-Step Quick Guide Strip */}
              {!searchQuery && (
                <div className="w-full max-w-2xl mt-4 pt-6 border-t border-outline-variant/15 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
                  <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center font-mono">
                      1
                    </div>
                    <span className="text-xs font-bold text-on-surface">1. Create Form</span>
                    <p className="text-[11px] text-on-surface-variant leading-normal">
                      Build questions and toggle voice dictation for spoken answers.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-secondary/15 text-secondary text-xs font-bold flex items-center justify-center font-mono">
                      2
                    </div>
                    <span className="text-xs font-bold text-on-surface">2. Share Link & QR</span>
                    <p className="text-[11px] text-on-surface-variant leading-normal">
                      Send your short link or download the QR code for respondents.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-tertiary/15 text-tertiary text-xs font-bold flex items-center justify-center font-mono">
                      3
                    </div>
                    <span className="text-xs font-bold text-on-surface">3. See Responses</span>
                    <p className="text-[11px] text-on-surface-variant leading-normal">
                      Review voice-to-text transcripts and live analytics instantly.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredForms.map((form) => {
                const headerUrl = form.theme?.headerBannerUrl || form.headerBannerUrl || form.headerImage;
                const accent = form.theme?.accentColor || '#8083ff';

                return (
                  <div
                    key={form.id}
                    className="bg-surface-container-low rounded-2xl border border-outline-variant/20 hover:border-outline-variant/50 hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Header Banner Preview or Color Bar */}
                    {headerUrl ? (
                      <div className="h-20 w-full overflow-hidden bg-surface-container-high relative">
                        <img
                          src={getAssetUrl(headerUrl)}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-2 w-full" style={{ backgroundColor: accent }} />
                    )}

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3
                            onClick={() => onSelectForm(form.id, 'builder')}
                            className="font-bold text-on-surface text-base hover:text-primary cursor-pointer transition-colors line-clamp-1"
                          >
                            {form.title || 'Untitled Form'}
                          </h3>

                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/20 shrink-0">
                            <MessageSquare className="w-3 h-3 text-primary" />
                            <span>{form.responseCount || 0}</span>
                          </span>
                        </div>

                        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                          {form.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant/70 font-mono">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {new Date(form.updatedAt || form.createdAt || Date.now()).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <span>{(form.questions || []).length || form.questionCount || 0} questions</span>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="px-5 py-3 bg-surface-container/40 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectForm(form.id, 'builder')}
                        className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Edit Form
                      </button>

                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <button
                          type="button"
                          onClick={() => onOpenResponder(form.id)}
                          className="p-1.5 hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                          title="Open Form Responder"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {onOpenShare && (
                          <button
                            type="button"
                            onClick={() => onOpenShare(form)}
                            className="p-1.5 hover:text-primary hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                            title="Share Link & Real QR Code"
                          >
                            <Share2 className="w-4 h-4 text-primary" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectForm(form.id, 'analytics')}
                          className="p-1.5 hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                          title="View Responses & Analytics"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDuplicateForm(form.id)}
                          className="p-1.5 hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                          title="Duplicate Form"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteForm(form.id)}
                          className="p-1.5 hover:text-error hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                          title="Delete Form"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Template Selection Modal */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-md">
          <div className="bg-surface-container-low rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-outline-variant/30 max-h-[90vh] overflow-y-auto flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Choose a Template</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Pick a pre-configured template or customize it
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="p-2 text-outline hover:text-on-surface rounded-xl hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templates.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleCreateWithTemplate(tpl)}
                  className="p-5 rounded-2xl border border-outline-variant/30 hover:border-primary/60 bg-surface-container/40 hover:bg-surface-container text-left transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-md"
                      style={{ backgroundColor: tpl.accentColor }}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">
                      {tpl.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-primary font-semibold">
                    <span>Use template</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
