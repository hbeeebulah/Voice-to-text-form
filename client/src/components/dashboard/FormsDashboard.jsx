import React, { useState } from 'react';
import {
  Plus,
  FileText,
  Copy,
  Trash2,
  Eye,
  BarChart3,
  Sparkles,
  Calendar,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  X
} from 'lucide-react';

export default function FormsDashboard({
  forms = [],
  onSelectForm,
  onCreateForm,
  onDuplicateForm,
  onDeleteForm,
  onOpenResponder
}) {
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const templates = [
    {
      title: 'Blank Form',
      description: 'Start from scratch with a single question',
      themeId: 'modern-minimalist',
      accentColor: '#2563eb',
      questions: [
        {
          id: `q-${Date.now()}-1`,
          title: 'What would you like to share today?',
          description: 'Type or click the microphone to speak',
          type: 'paragraph',
          required: false,
          voiceEnabled: true
        }
      ]
    },
    {
      title: 'Customer Audio Feedback Survey',
      description: 'Collect detailed spoken opinions, feature ratings, and satisfaction scores',
      themeId: 'vibrant-gradient',
      accentColor: '#6366f1',
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
          description: 'Feel free to speak your thoughts with AI voice dictation',
          type: 'paragraph',
          required: true,
          voiceEnabled: true
        }
      ]
    },
    {
      title: 'Daily Voice Journal & Standup',
      description: 'Frictionless daily reflection powered by speech-to-text dictation',
      themeId: 'warm-pastel',
      accentColor: '#f43f5e',
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
      title: 'Executive Conference Registration',
      description: 'Sleek dark theme event signup with role selection and dietary preferences',
      themeId: 'dark-executive',
      accentColor: '#10b981',
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
          title: 'Which breakout tracks will you attend?',
          type: 'checkboxes',
          required: true,
          options: ['AI & Machine Learning', 'Cloud Architecture', 'Product Strategy', 'Design Systems']
        },
        {
          id: `q-${Date.now()}-3`,
          title: 'Any dietary restrictions or accessibility needs?',
          type: 'short_answer',
          required: false,
          voiceEnabled: true
        }
      ]
    }
  ];

  const handleCreateWithTemplate = (template) => {
    onCreateForm({
      title: template.title === 'Blank Form' ? 'Untitled Form' : template.title,
      description: template.description,
      theme: {
        themeId: template.themeId,
        accentColor: template.accentColor
      },
      questions: template.questions
    });
    setTemplateModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Hero / Header Section */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-xs font-semibold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Voice-First AI Forms + Multimodal Dictation</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              VoxForm AI Studio
            </h1>

            <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
              Design bespoke, intelligent forms with curated visual themes and empower respondents with seamless voice dictation. Frictionless conversational input meets powerful analytics.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onCreateForm({})}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-indigo-700 font-bold text-xs shadow-md hover:bg-indigo-50 transition-all hover:scale-102 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create New Form</span>
              </button>

              <button
                type="button"
                onClick={() => setTemplateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Choose Template</span>
              </button>
            </div>
          </div>
        </div>

        {/* Templates Picker Row */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Start with a Curated Template
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((tpl, i) => (
              <button
                key={i}
                onClick={() => handleCreateWithTemplate(tpl)}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-xs"
                    style={{ backgroundColor: tpl.accentColor }}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                    {tpl.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {tpl.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
                  <span>Use template</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Existing Forms Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Your Forms ({forms.length})
            </h2>
            <button
              type="button"
              onClick={() => onCreateForm({})}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Form</span>
            </button>
          </div>

          {forms.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="font-bold text-slate-800 text-base">No forms created yet</h3>
                <p className="text-xs text-slate-500 mt-1">Pick a template above or create your first voice form from scratch!</p>
              </div>
              <button
                type="button"
                onClick={() => onCreateForm({})}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create New Form</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {forms.map((form) => (
                <div
                  key={form.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div
                    className="h-2 w-full"
                    style={{ backgroundColor: form.theme?.accentColor || '#6366f1' }}
                  />

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3
                          onClick={() => onSelectForm(form.id, 'builder')}
                          className="font-bold text-slate-900 text-base hover:text-indigo-600 cursor-pointer transition-colors line-clamp-1"
                        >
                          {form.title || 'Untitled Form'}
                        </h3>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 shrink-0">
                          <MessageSquare className="w-3 h-3 text-indigo-500" />
                          <span>{form.responseCount || 0}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                        {form.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(form.updatedAt || form.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <span>{form.questionCount || 0} questions</span>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1">
                    <button
                      onClick={() => onSelectForm(form.id, 'builder')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-2xs transition-colors"
                    >
                      Edit Form
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenResponder(form.id)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                        title="Open Responder Form"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onSelectForm(form.id, 'analytics')}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                        title="View Responses & Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDuplicateForm(form.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
                        title="Duplicate Form"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteForm(form.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Form"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template Selection Modal */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Choose a Template</h3>
                <p className="text-xs text-slate-500 mt-0.5">Start with a pre-configured template or build from scratch</p>
              </div>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
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
                  className="p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:shadow-md text-left transition-all group flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-xs"
                      style={{ backgroundColor: tpl.accentColor }}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                      {tpl.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {tpl.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
                    <span>Use this template</span>
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
