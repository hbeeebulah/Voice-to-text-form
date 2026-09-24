import React, { useState } from 'react';
import {
  Plus,
  Palette,
  Eye,
  Settings,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Share2
} from 'lucide-react';
import QuestionCard from './QuestionCard';

export default function FormBuilder({
  form,
  onUpdateForm,
  onOpenTheme,
  onOpenPreview,
  onOpenShare
}) {
  const [activeQuestionId, setActiveQuestionId] = useState(
    form.questions && form.questions.length > 0 ? form.questions[0].id : null
  );
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const theme = form.theme || {};
  const accentColor = theme.accentColor || '#6366f1';

  // Add Question
  const handleAddQuestion = () => {
    const newId = `q-${Date.now()}`;
    const newQuestion = {
      id: newId,
      title: '',
      description: '',
      type: 'paragraph', // default to paragraph so voice dictation is ready right away!
      required: false,
      voiceEnabled: true,
      placeholder: ''
    };

    const updatedQuestions = [...(form.questions || []), newQuestion];
    onUpdateForm({ questions: updatedQuestions });
    setActiveQuestionId(newId);
  };

  // Update specific question
  const handleUpdateQuestion = (qId, updates) => {
    const updatedQuestions = (form.questions || []).map((q) => {
      if (q.id === qId) {
        return { ...q, ...updates };
      }
      return q;
    });
    onUpdateForm({ questions: updatedQuestions });
  };

  // Delete question
  const handleDeleteQuestion = (qId) => {
    const questions = form.questions || [];
    if (questions.length <= 1) {
      alert('A form must have at least one question.');
      return;
    }
    const updated = questions.filter(q => q.id !== qId);
    onUpdateForm({ questions: updated });
    if (activeQuestionId === qId && updated.length > 0) {
      setActiveQuestionId(updated[0].id);
    }
  };

  // Duplicate question
  const handleDuplicateQuestion = (qId) => {
    const questions = form.questions || [];
    const index = questions.findIndex(q => q.id === qId);
    if (index === -1) return;

    const original = questions[index];
    const duplicated = {
      ...JSON.parse(JSON.stringify(original)),
      id: `q-${Date.now()}`,
      title: `${original.title || 'Untitled'} (Copy)`
    };

    const updated = [...questions];
    updated.splice(index + 1, 0, duplicated);
    onUpdateForm({ questions: updated });
    setActiveQuestionId(duplicated.id);
  };

  // Move Question Up
  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const questions = [...(form.questions || [])];
    const temp = questions[index];
    questions[index] = questions[index - 1];
    questions[index - 1] = temp;
    onUpdateForm({ questions });
  };

  // Move Question Down
  const handleMoveDown = (index) => {
    const questions = [...(form.questions || [])];
    if (index >= questions.length - 1) return;
    const temp = questions[index];
    questions[index] = questions[index + 1];
    questions[index + 1] = temp;
    onUpdateForm({ questions });
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const questions = [...(form.questions || [])];
    const draggedItem = questions[draggedIndex];
    questions.splice(draggedIndex, 1);
    questions.splice(targetIndex, 0, draggedItem);

    onUpdateForm({ questions });
    setDraggedIndex(null);
  };

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 relative transition-colors duration-200"
      style={{ backgroundColor: theme.backgroundColor || '#f8fafc' }}
    >
      <div className="max-w-3xl mx-auto space-y-5 pb-32">
        {/* Form Title & Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
          {/* Top Decorative Accent Banner */}
          <div
            className="h-3 w-full"
            style={{
              background: theme.bannerGradient || theme.accentColor || '#6366f1'
            }}
          />

          <div className="p-6 md:p-8 space-y-3">
            <input
              type="text"
              value={form.title || ''}
              onChange={(e) => onUpdateForm({ title: e.target.value })}
              placeholder="Form Title"
              className="w-full text-2xl md:text-3xl font-bold text-slate-900 placeholder:text-slate-300 bg-transparent border-b-2 border-transparent hover:border-slate-200 focus:border-indigo-600 focus:outline-none transition-colors"
              style={{ fontFamily: theme.fontHeader || 'Inter' }}
            />

            <textarea
              rows={2}
              value={form.description || ''}
              onChange={(e) => onUpdateForm({ description: e.target.value })}
              placeholder="Form description or instructions for respondents..."
              className="w-full text-sm text-slate-600 placeholder:text-slate-400 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none resize-none transition-colors"
              style={{ fontFamily: theme.fontBody || 'Inter' }}
            />

            {/* Quick Banner Info */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 text-indigo-600 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Voice-to-Text Dictation Enabled</span>
              </div>

              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{showSettings ? 'Hide Settings' : 'Form Settings'}</span>
              </button>
            </div>

            {/* Collapsible Settings Panel */}
            {showSettings && (
              <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3 animate-fadeIn">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Submission & Confirmation Settings
                </h4>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Custom Thank-You Confirmation Message:
                  </label>
                  <input
                    type="text"
                    value={form.settings?.confirmationMessage || ''}
                    onChange={(e) => onUpdateForm({
                      settings: { ...form.settings, confirmationMessage: e.target.value }
                    })}
                    placeholder="Thank you! Your response has been recorded."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-600">Show Progress Bar on Form</span>
                  <input
                    type="checkbox"
                    checked={form.settings?.showProgressBar !== false}
                    onChange={(e) => onUpdateForm({
                      settings: { ...form.settings, showProgressBar: e.target.checked }
                    })}
                    className="rounded text-indigo-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {(form.questions || []).map((question, index) => (
            <div
              key={question.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className="transition-transform duration-100"
            >
              <QuestionCard
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
            </div>
          ))}
        </div>

        {/* Add Question Button Banner at bottom of form */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleAddQuestion}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-indigo-600 font-semibold text-xs border border-indigo-200 shadow-sm hover:shadow transition-all group"
          >
            <Plus className="w-4 h-4 group-hover:scale-125 transition-transform" />
            <span>Add New Question</span>
          </button>
        </div>
      </div>

      {/* Floating Action Toolbar */}
      <div className="fixed right-4 md:right-8 bottom-8 md:bottom-auto md:top-36 z-30 flex md:flex-col items-center bg-white/95 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200 shadow-xl gap-2">
        <button
          type="button"
          onClick={handleAddQuestion}
          className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-all hover:scale-105"
          title="Add Question"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenTheme}
          className="p-3 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-all"
          title="Customize Theme"
        >
          <Palette className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenPreview}
          className="p-3 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-all"
          title="Preview Responder Form"
        >
          <Eye className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenShare}
          className="p-3 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-all"
          title="Share Form"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
