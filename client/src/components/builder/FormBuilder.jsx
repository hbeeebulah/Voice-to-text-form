import React, { useState, useEffect } from 'react';
import {
  Plus,
  Palette,
  Eye,
  Settings,
  Share2,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import QuestionCard from './QuestionCard';
import HeaderImageModal from '../common/HeaderImageModal';
import { getAssetUrl } from '../../services/api';

export default function FormBuilder({
  form,
  onUpdateForm,
  onOpenTheme,
  onOpenPreview,
  onOpenShare,
  onOpenApiKey,
  onNavigateTab
}) {
  const [activeQuestionId, setActiveQuestionId] = useState(
    form.questions && form.questions.length > 0 ? form.questions[0].id : null
  );
  const [showSettings, setShowSettings] = useState(false);
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);

  const theme = form.theme || {};
  const accentColor = theme.accentColor || '#8083ff';
  const headerBannerUrl = theme.headerBannerUrl || form.headerBannerUrl || form.headerImage || '';

  // Add Question
  const handleAddQuestion = (type = 'paragraph') => {
    const newId = `q-${Date.now()}`;
    let initialOptions;
    if (['multiple_choice', 'checkboxes', 'dropdown'].includes(type)) {
      initialOptions = ['Option 1', 'Option 2', 'Option 3'];
    }

    const newQuestion = {
      id: newId,
      title: '',
      description: '',
      type,
      required: false,
      voiceEnabled: true,
      options: initialOptions
    };

    const updated = [...(form.questions || []), newQuestion];
    onUpdateForm({ questions: updated });
    setActiveQuestionId(newId);
  };

  // Keyboard shortcut listener for 'A' key to quick add question
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleAddQuestion('paragraph');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form.questions]);

  // Update specific question
  const handleUpdateQuestion = (qId, updates) => {
    const updated = (form.questions || []).map((q) => {
      if (q.id === qId) {
        return { ...q, ...updates };
      }
      return q;
    });
    onUpdateForm({ questions: updated });
  };

  // Delete question
  const handleDeleteQuestion = (qId) => {
    const questions = form.questions || [];
    if (questions.length <= 1) {
      alert('A form must have at least one question.');
      return;
    }
    const updated = questions.filter((q) => q.id !== qId);
    onUpdateForm({ questions: updated });
    if (activeQuestionId === qId && updated.length > 0) {
      setActiveQuestionId(updated[0].id);
    }
  };

  // Duplicate question
  const handleDuplicateQuestion = (qId) => {
    const questions = form.questions || [];
    const index = questions.findIndex((q) => q.id === qId);
    if (index === -1) return;

    const original = questions[index];
    const duplicated = {
      ...JSON.parse(JSON.stringify(original)),
      id: `q-${Date.now()}`,
      title: original.title ? `${original.title} (Copy)` : 'Untitled (Copy)'
    };

    const updated = [...questions];
    updated.splice(index + 1, 0, duplicated);
    onUpdateForm({ questions: updated });
    setActiveQuestionId(duplicated.id);
  };

  // Move Question Up / Down
  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const questions = [...(form.questions || [])];
    const temp = questions[index];
    questions[index] = questions[index - 1];
    questions[index - 1] = temp;
    onUpdateForm({ questions });
  };

  const handleMoveDown = (index) => {
    const questions = [...(form.questions || [])];
    if (index >= questions.length - 1) return;
    const temp = questions[index];
    questions[index] = questions[index + 1];
    questions[index + 1] = temp;
    onUpdateForm({ questions });
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased relative pb-32">
      {/* Centered Canvas Layout */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 flex flex-col gap-5">
        {/* 1. FORM COVER BANNER */}
        <div className="relative group rounded-2xl overflow-hidden shadow-xl bg-surface-container-low border border-outline-variant/20">
          {headerBannerUrl ? (
            <div className="h-48 sm:h-56 md:h-64 w-full relative overflow-hidden bg-surface-container-highest">
              <img
                src={getAssetUrl(headerBannerUrl)}
                alt="Form Header Banner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsHeaderModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest/80 hover:bg-surface-container-lowest backdrop-blur-md text-on-surface text-xs font-semibold shadow-md transition-all border border-outline-variant/30 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-primary" />
                  <span>Change Cover</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateForm({
                      theme: { ...theme, headerBannerUrl: '' },
                      headerBannerUrl: '',
                      headerImage: ''
                    });
                  }}
                  className="p-1.5 rounded-xl bg-surface-container-lowest/80 hover:bg-surface-container-lowest backdrop-blur-md text-outline hover:text-error shadow-md transition-all border border-outline-variant/30 cursor-pointer"
                  title="Remove Cover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 flex items-center justify-between bg-surface-container-low border-b border-outline-variant/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-on-surface">Add Cover Banner</p>
                  <p className="text-[11px] text-on-surface-variant">Personalize your form with a custom header image</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHeaderModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium border border-outline-variant/30 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span>Add Banner</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. FORM TITLE & DESCRIPTION CARD */}
        <div className="bg-surface-container-low rounded-2xl p-5 sm:p-7 shadow-xl border border-outline-variant/20 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={form.title || ''}
              onChange={(e) => onUpdateForm({ title: e.target.value })}
              placeholder="Untitled Form"
              className="w-full bg-transparent font-bold text-xl sm:text-2xl md:text-3xl text-on-surface focus:outline-none focus:bg-surface-container/60 rounded-xl px-2.5 py-1.5 -ml-2.5 transition-colors placeholder:text-outline border border-transparent focus:border-outline-variant/30"
            />
          </div>

          <div className="flex flex-col gap-1">
            <textarea
              rows={2}
              value={form.description || ''}
              onChange={(e) => onUpdateForm({ description: e.target.value })}
              placeholder="Form description (e.g. Please fill out this form or use voice dictation to speak your answers)..."
              className="w-full bg-surface-container-lowest/60 text-on-surface text-xs sm:text-sm rounded-xl p-3 focus:outline-none focus:bg-surface-container-lowest resize-none transition-all placeholder:text-outline border border-outline-variant/20"
            />
          </div>

          {/* Form Settings Accordion (From commit 52e2aa9) */}
          <div className="pt-2 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center justify-between w-full text-xs font-mono text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer py-1"
            >
              <span className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-primary" />
                <span>Form Submission & Responder Settings</span>
              </span>
              {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showSettings && (
              <div className="mt-3 p-4 bg-surface-container-lowest/70 rounded-xl border border-outline-variant/20 text-xs flex flex-col gap-3">
                {/* Accepting Responses Toggle */}
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <div>
                    <span className="font-semibold text-on-surface block">Accept Responses</span>
                    <span className="text-[11px] text-on-surface-variant">
                      {form.settings?.acceptingResponses !== false
                        ? 'Form is active and open to responders'
                        : 'Form is closed to new responses'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.settings?.acceptingResponses !== false}
                      onChange={(e) => onUpdateForm({
                        settings: { ...(form.settings || {}), acceptingResponses: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tertiary relative" />
                  </label>
                </div>

                {/* Message shown when closed */}
                {form.settings?.acceptingResponses === false && (
                  <div className="p-3 bg-surface-container rounded-xl flex flex-col gap-1 border border-outline-variant/30">
                    <label className="block text-on-surface font-semibold text-[11px]">
                      Message shown when form is closed:
                    </label>
                    <input
                      type="text"
                      value={form.settings?.closedMessage || ''}
                      onChange={(e) => onUpdateForm({
                        settings: { ...(form.settings || {}), closedMessage: e.target.value }
                      })}
                      placeholder="This form is no longer accepting responses."
                      className="w-full px-3 py-1.5 bg-surface-container-lowest text-on-surface rounded-lg text-xs border border-outline-variant/30 focus:outline-none"
                    />
                  </div>
                )}

                {/* Thank-You Confirmation Message */}
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant font-medium text-[11px]">
                    Custom Thank-You Confirmation Message:
                  </label>
                  <input
                    type="text"
                    value={form.settings?.confirmationMessage || ''}
                    onChange={(e) => onUpdateForm({
                      settings: { ...(form.settings || {}), confirmationMessage: e.target.value }
                    })}
                    placeholder="Thank you! Your response has been recorded."
                    className="w-full px-3 py-1.5 bg-surface-container text-on-surface rounded-lg text-xs border border-outline-variant/30 focus:outline-none"
                  />
                </div>

                {/* Show Progress Bar */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-on-surface">Show Progress Bar on Form</span>
                  <input
                    type="checkbox"
                    checked={form.settings?.showProgressBar !== false}
                    onChange={(e) => onUpdateForm({
                      settings: { ...(form.settings || {}), showProgressBar: e.target.checked }
                    })}
                    className="rounded text-primary bg-surface-container border-outline-variant"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. QUESTIONS STACK */}
        <div className="flex flex-col gap-4">
          {(form.questions || []).map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              totalQuestions={(form.questions || []).length}
              isActive={activeQuestionId === question.id}
              onSelect={() => setActiveQuestionId(question.id)}
              onUpdate={(updates) => handleUpdateQuestion(question.id, updates)}
              onDelete={() => handleDeleteQuestion(question.id)}
              onDuplicate={() => handleDuplicateQuestion(question.id)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              accentColor={accentColor}
            />
          ))}
        </div>

        {/* 4. ADD QUESTION BUTTON BANNER */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => handleAddQuestion('paragraph')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-primary font-semibold text-xs border border-primary/30 shadow-lg hover:shadow-primary/20 transition-all cursor-pointer group"
          >
            <Plus className="w-4 h-4 group-hover:scale-125 transition-transform" />
            <span>Add New Question</span>
          </button>
        </div>
      </div>

      {/* Floating Action Toolbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-8 md:bottom-auto md:top-28 z-40 flex md:flex-col items-center bg-surface-container-lowest/90 backdrop-blur-xl p-1.5 rounded-full md:rounded-2xl border border-outline-variant/30 shadow-2xl gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => handleAddQuestion('paragraph')}
          className="p-2.5 sm:p-3 rounded-full md:rounded-xl bg-primary hover:bg-primary-container text-on-primary shadow-lg transition-all hover:scale-105 cursor-pointer"
          title="Add Question"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={() => setIsHeaderModalOpen(true)}
          className="p-2.5 sm:p-3 rounded-full md:rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
          title="Form Header Image"
        >
          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenTheme}
          className="p-2.5 sm:p-3 rounded-full md:rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
          title="Theme & Styling"
        >
          <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenPreview}
          className="p-2.5 sm:p-3 rounded-full md:rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
          title="Preview Form Responder"
        >
          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenShare}
          className="p-2.5 sm:p-3 rounded-full md:rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
          title="Share Form & QR Code"
        >
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Header Image Modal */}
      <HeaderImageModal
        isOpen={isHeaderModalOpen}
        onClose={() => setIsHeaderModalOpen(false)}
        currentHeaderUrl={headerBannerUrl}
        onSaveHeader={(url) => {
          onUpdateForm({
            theme: { ...theme, headerBannerUrl: url },
            headerBannerUrl: url,
            headerImage: url
          });
        }}
        onRemoveHeader={() => {
          onUpdateForm({
            theme: { ...theme, headerBannerUrl: '' },
            headerBannerUrl: '',
            headerImage: ''
          });
        }}
        formTitle={form.title}
      />
    </div>
  );
}
