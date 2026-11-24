import React, { useState, useEffect } from 'react';
import {
  Plus,
  Palette,
  Eye,
  Settings,
  Share2,
  Users,
  UserPlus,
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
  onOpenAddUsers,
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
  const isLightMode = theme.mode === 'light';
  const canvasBgStyle = theme.backgroundColor
    ? { backgroundColor: theme.backgroundColor }
    : isLightMode
      ? { backgroundColor: '#f0ebf8' }
      : {};

  // Add Question
  const handleAddQuestion = (type = 'paragraph') => {
    const newId = `q-${Date.now()}`;
    let initialOptions;
    if (['multiple_choice', 'checkboxes', 'dropdown'].includes(type)) {
      initialOptions = ['Option 1', 'Option 2', 'Option 3'];
    }

    let ratingConfig;
    if (type === 'rating') {
      ratingConfig = {
        max: 5,
        icon: 'star',
        lowLabel: '',
        highLabel: ''
      };
    }

    const newQuestion = {
      id: newId,
      title: '',
      description: '',
      type,
      required: false,
      voiceEnabled: true,
      options: initialOptions,
      ...(ratingConfig ? { ratingConfig } : {})
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
    <div
      className={`min-h-screen ${isLightMode ? 'text-slate-900' : 'bg-surface text-on-surface'} antialiased relative pb-32 transition-colors duration-200`}
      style={canvasBgStyle}
    >
      {/* Centered Canvas Layout */}
      <div className="max-w-3xl mx-auto px-3 sm:px-6 pt-26 sm:pt-28 md:pt-20 flex flex-col gap-5">
        {/* 1. FORM COVER BANNER */}
        <div className={`relative group rounded-2xl overflow-hidden shadow-xl ${isLightMode ? 'bg-white border-slate-200/80' : 'bg-surface-container-low border-outline-variant/20'} border`}>
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
            <div className={`p-4 sm:p-5 flex items-center justify-between ${isLightMode ? 'bg-white border-b border-slate-200' : 'bg-surface-container-low border-b border-outline-variant/10'}`}>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: accentColor }}
                >
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs font-semibold ${isLightMode ? 'text-slate-800' : 'text-on-surface'}`}>Add Cover Banner</p>
                  <p className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-on-surface-variant'}`}>Personalize your form with a custom header image</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHeaderModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  isLightMode
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/30'
                }`}
              >
                <Plus className="w-3.5 h-3.5" style={{ color: accentColor }} />
                <span>Add Banner</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. FORM TITLE & DESCRIPTION CARD */}
        <div className={`${isLightMode ? 'bg-white text-slate-900 border-slate-200/80 shadow-md' : 'bg-surface-container-low text-on-surface border-outline-variant/20 shadow-xl'} rounded-2xl p-5 sm:p-7 border flex flex-col gap-4 relative overflow-hidden`}>
          <div className="h-2 w-full absolute top-0 left-0" style={{ backgroundColor: accentColor }} />
          <div className="flex flex-col gap-1 pt-1">
            <input
              type="text"
              value={form.title || ''}
              onChange={(e) => onUpdateForm({ title: e.target.value })}
              placeholder="Untitled Form"
              className={`w-full bg-transparent font-bold text-xl sm:text-2xl md:text-3xl rounded-xl px-2.5 py-1.5 -ml-2.5 transition-colors border border-transparent ${
                isLightMode
                  ? 'text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-slate-50 focus:border-slate-300'
                  : 'text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container/60 focus:border-outline-variant/30'
              }`}
            />
          </div>

          <div className="flex flex-col gap-1">
            <textarea
              rows={2}
              value={form.description || ''}
              onChange={(e) => onUpdateForm({ description: e.target.value })}
              placeholder="Form description (e.g. Please fill out this form or use voice dictation to speak your answers)..."
              className={`w-full text-xs sm:text-sm rounded-xl p-3 focus:outline-none resize-none transition-all border ${
                isLightMode
                  ? 'bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:border-slate-300 placeholder:text-slate-400'
                  : 'bg-surface-container-lowest/60 text-on-surface border-outline-variant/20 focus:bg-surface-container-lowest placeholder:text-outline'
              }`}
            />
          </div>

          {/* Collaborative Access Strip */}
          <div className={`pt-2 pb-1 border-t ${isLightMode ? 'border-slate-200' : 'border-outline-variant/15'} flex items-center justify-between flex-wrap gap-2`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${isLightMode ? 'text-slate-800' : 'text-on-surface'}`}>
                <Users className="w-3.5 h-3.5" style={{ color: accentColor }} />
                <span>Form Collaborators:</span>
              </span>
              {Array.isArray(form.collaborators) && form.collaborators.length > 0 ? (
                <span className="text-xs text-tertiary font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                  {form.collaborators.length} user{form.collaborators.length > 1 ? 's' : ''} added
                </span>
              ) : (
                <span className={`text-xs font-mono ${isLightMode ? 'text-slate-500' : 'text-on-surface-variant'}`}>Only you have access</span>
              )}
            </div>

            {onOpenAddUsers && (
              <button
                type="button"
                onClick={onOpenAddUsers}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  isLightMode
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                    : 'bg-surface-container hover:bg-surface-container-high text-primary hover:text-on-surface border-outline-variant/30'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" style={{ color: accentColor }} />
                <span>+ Add Users</span>
              </button>
            )}
          </div>

          {/* Google Form Link / Sync Status Badge */}
          {form.googleFormConfig?.publishedUrl && (
            <div className="p-2.5 rounded-xl bg-tertiary/10 border border-tertiary/25 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shrink-0" />
                <span className="font-semibold text-tertiary">Google Form Sync Active:</span>
                <a
                  href={form.googleFormConfig.publishedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-on-surface-variant hover:text-on-surface'} truncate font-mono text-[11px] underline`}
                >
                  {form.googleFormConfig.publishedUrl}
                </a>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-tertiary/20 text-tertiary shrink-0">
                Voice Dictation Enabled
              </span>
            </div>
          )}

          {/* Form Settings Accordion (From commit 52e2aa9) */}
          <div className={`pt-2 border-t ${isLightMode ? 'border-slate-200' : 'border-outline-variant/20'}`}>
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center justify-between w-full text-xs font-mono transition-colors cursor-pointer py-1 ${
                isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" style={{ color: accentColor }} />
                <span>Form Submission & Responder Settings</span>
              </span>
              {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showSettings && (
              <div className={`mt-3 p-4 rounded-xl border text-xs flex flex-col gap-3 ${
                isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-lowest/70 border-outline-variant/20'
              }`}>
                {/* Accepting Responses Toggle */}
                <div className={`flex items-center justify-between pb-2 border-b ${isLightMode ? 'border-slate-200' : 'border-outline-variant/20'}`}>
                  <div>
                    <span className={`font-semibold block ${isLightMode ? 'text-slate-800' : 'text-on-surface'}`}>Accept Responses</span>
                    <span className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-on-surface-variant'}`}>
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
                  <div className={`p-3 rounded-xl flex flex-col gap-1 border ${isLightMode ? 'bg-white border-slate-200' : 'bg-surface-container border-outline-variant/30'}`}>
                    <label className={`block font-semibold text-[11px] ${isLightMode ? 'text-slate-800' : 'text-on-surface'}`}>
                      Message shown when form is closed:
                    </label>
                    <input
                      type="text"
                      value={form.settings?.closedMessage || ''}
                      onChange={(e) => onUpdateForm({
                        settings: { ...(form.settings || {}), closedMessage: e.target.value }
                      })}
                      placeholder="This form is no longer accepting responses."
                      className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none ${
                        isLightMode
                          ? 'bg-slate-50 text-slate-900 border-slate-200 focus:bg-white'
                          : 'bg-surface-container-lowest text-on-surface border-outline-variant/30'
                      }`}
                    />
                  </div>
                )}

                {/* Thank-You Confirmation Message */}
                <div className="flex flex-col gap-1">
                  <label className={`font-medium text-[11px] ${isLightMode ? 'text-slate-600' : 'text-on-surface-variant'}`}>
                    Custom Thank-You Confirmation Message:
                  </label>
                  <input
                    type="text"
                    value={form.settings?.confirmationMessage || ''}
                    onChange={(e) => onUpdateForm({
                      settings: { ...(form.settings || {}), confirmationMessage: e.target.value }
                    })}
                    placeholder="Thank you! Your response has been recorded."
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none ${
                      isLightMode
                        ? 'bg-white text-slate-900 border-slate-200 focus:border-slate-400'
                        : 'bg-surface-container text-on-surface border-outline-variant/30'
                    }`}
                  />
                </div>

                {/* Show Progress Bar */}
                <div className="flex items-center justify-between pt-1">
                  <span className={isLightMode ? 'text-slate-800' : 'text-on-surface'}>Show Progress Bar on Form</span>
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
              isLightMode={isLightMode}
            />
          ))}
        </div>

        {/* 4. ADD QUESTION BUTTON BANNER */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => handleAddQuestion('paragraph')}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-xs border shadow-lg transition-all cursor-pointer group ${
              isLightMode
                ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-slate-200/50'
                : 'bg-surface-container-high hover:bg-surface-container-highest text-primary border-primary/30 hover:shadow-primary/20'
            }`}
            style={isLightMode ? { borderColor: `${accentColor}50` } : {}}
          >
            <Plus className="w-4 h-4 group-hover:scale-125 transition-transform" style={{ color: accentColor }} />
            <span style={{ color: isLightMode ? accentColor : undefined }}>Add New Question</span>
          </button>
        </div>
      </div>

      {/* Floating Action Toolbar */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-8 md:bottom-auto md:top-28 z-40 flex md:flex-col items-center p-1.5 rounded-full md:rounded-2xl border shadow-2xl gap-1 sm:gap-2 backdrop-blur-xl ${
        isLightMode
          ? 'bg-white/95 border-slate-200 shadow-slate-300/50'
          : 'bg-surface-container-lowest/90 border-outline-variant/30 shadow-2xl'
      }`}>
        <button
          type="button"
          onClick={() => handleAddQuestion('paragraph')}
          className="p-2.5 sm:p-3 rounded-full md:rounded-xl text-white shadow-lg transition-all hover:scale-105 cursor-pointer"
          style={{ backgroundColor: accentColor }}
          title="Add Question"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={() => setIsHeaderModalOpen(true)}
          className={`p-2.5 sm:p-3 rounded-full md:rounded-xl transition-all cursor-pointer ${
            isLightMode
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
          title="Form Header Image"
        >
          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenTheme}
          className={`p-2.5 sm:p-3 rounded-full md:rounded-xl transition-all cursor-pointer ${
            isLightMode
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
          title="Theme & Styling"
        >
          <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenPreview}
          className={`p-2.5 sm:p-3 rounded-full md:rounded-xl transition-all cursor-pointer ${
            isLightMode
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
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

        {onOpenAddUsers && (
          <button
            type="button"
            onClick={onOpenAddUsers}
            className="p-2.5 sm:p-3 rounded-full md:rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
            title="Add Users to Form"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </button>
        )}
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
