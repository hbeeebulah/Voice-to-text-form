import React, { useState } from 'react';
import {
  GripVertical,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  Mic,
  UploadCloud,
  Paperclip,
  CheckCircle2,
  ListOrdered,
  Star
} from 'lucide-react';
import { QUESTION_TYPES } from '../../constants/themes';

export default function QuestionCard({
  question,
  index,
  totalQuestions,
  isActive,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  accentColor = '#673ab7',
  isLightMode = false
}) {
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const currentType = QUESTION_TYPES.find(t => t.type === question.type) || QUESTION_TYPES[0];

  const handleTypeChange = (newType) => {
    const typeDef = QUESTION_TYPES.find(t => t.type === newType);
    const updates = {
      type: newType,
      voiceEnabled: typeDef?.voiceEnabled !== false
    };

    if (['multiple_choice', 'checkboxes', 'dropdown'].includes(newType) && (!question.options || question.options.length === 0)) {
      updates.options = ['Option 1', 'Option 2', 'Option 3'];
    }

    if (newType === 'linear_scale' && !question.scaleConfig) {
      updates.scaleConfig = {
        min: 1,
        max: 5,
        minLabel: 'Low',
        maxLabel: 'High'
      };
    }

    if (newType === 'rating' && !question.ratingConfig) {
      updates.ratingConfig = {
        max: 5,
        icon: 'star',
        lowLabel: '',
        highLabel: ''
      };
    }

    if (newType === 'file_upload' && !question.fileConfig) {
      updates.fileConfig = {
        maxSizeMB: 10,
        allowedTypes: 'all',
        buttonLabel: 'Attach File'
      };
    }

    onUpdate(updates);
    setShowTypeMenu(false);
  };

  const handleAddOption = () => {
    const currentOptions = question.options || [];
    onUpdate({
      options: [...currentOptions, `Option ${currentOptions.length + 1}`]
    });
  };

  const handleUpdateOption = (optIndex, value) => {
    const currentOptions = [...(question.options || [])];
    currentOptions[optIndex] = value;
    onUpdate({ options: currentOptions });
  };

  const handleDeleteOption = (optIndex) => {
    const currentOptions = (question.options || []).filter((_, i) => i !== optIndex);
    onUpdate({ options: currentOptions });
  };

  return (
    <div
      onClick={onSelect}
      className={`relative group rounded-2xl p-5 sm:p-6 border transition-all duration-200 overflow-hidden flex flex-col gap-4 cursor-pointer ${
        isLightMode
          ? 'bg-white text-slate-900 border-slate-200/90 shadow-md'
          : 'bg-surface-container-low text-on-surface border-outline-variant/20 shadow-xl'
      } ${
        isActive
          ? isLightMode
            ? 'ring-2 shadow-lg'
            : 'shadow-[0_4px_24px_-4px_rgba(128,131,255,0.25)] ring-1'
          : isLightMode
            ? 'hover:border-slate-300'
            : 'hover:border-outline-variant/40'
      }`}
      style={
        isActive
          ? {
              borderColor: accentColor,
              boxShadow: `0 4px 20px -2px ${accentColor}33`,
              ...(isLightMode ? { ringColor: `${accentColor}40` } : {})
            }
          : {}
      }
    >
      {/* Active Question Left Indicator */}
      {isActive && (
        <div
          className="absolute left-0 top-4 bottom-4 w-1.5 rounded-r-full"
          style={{ backgroundColor: accentColor }}
        />
      )}

      {/* Question Header: Drag indicator, Title, Type dropdown */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`p-1 rounded transition-colors cursor-grab shrink-0 ${
            isLightMode ? 'text-slate-400 group-hover:text-slate-600' : 'text-outline group-hover:text-on-surface-variant'
          }`}>
            <GripVertical className="w-4 h-4" />
          </span>

          <span
            className="font-mono text-xs font-bold shrink-0"
            style={{ color: accentColor }}
          >
            Q{index + 1}
          </span>

          <input
            type="text"
            value={question.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Enter question title..."
            className={`w-full bg-transparent font-semibold text-base sm:text-lg focus:outline-none px-2 py-1 rounded-lg transition-colors border border-transparent ${
              isLightMode
                ? 'text-slate-900 placeholder:text-slate-400 focus:bg-slate-50 focus:border-slate-300'
                : 'text-on-surface placeholder:text-outline/70 focus:bg-surface-container/70 focus:border-outline-variant/30'
            }`}
          />
        </div>

        {/* Question Type Selector Dropdown */}
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
              isLightMode
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/30'
            }`}
          >
            <span>{currentType.label}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {showTypeMenu && (
            <div className={`absolute right-0 top-full mt-1.5 z-30 w-56 rounded-xl backdrop-blur-xl border shadow-2xl p-1.5 flex flex-col gap-0.5 ${
              isLightMode
                ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/60'
                : 'bg-surface-container-highest/95 border-outline-variant/40 text-on-surface shadow-2xl'
            }`}>
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => handleTypeChange(t.type)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                    question.type === t.type
                      ? 'text-white font-semibold'
                      : isLightMode
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-on-surface hover:bg-surface-container'
                  }`}
                  style={question.type === t.type ? { backgroundColor: accentColor } : {}}
                >
                  <span>{t.label}</span>
                  {t.voiceEnabled && (
                    <span className={`flex items-center gap-1 text-[10px] font-mono ${
                      question.type === t.type ? 'text-white/90' : 'text-emerald-500'
                    }`}>
                      <Mic className="w-3 h-3" />
                      Voice
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sub-description input */}
      <div className="pl-6 sm:pl-8 -mt-2">
        <input
          type="text"
          value={question.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Add description or instructions for responders (optional)..."
          className={`w-full bg-transparent text-xs focus:outline-none px-2 py-1 rounded transition-colors ${
            isLightMode
              ? 'text-slate-500 focus:text-slate-900 focus:bg-slate-50 placeholder:text-slate-400'
              : 'text-on-surface-variant focus:text-on-surface focus:bg-surface-container/50 placeholder:text-outline/60'
          }`}
        />
      </div>

      {/* QUESTION BODY: TYPE-SPECIFIC EDITOR */}
      <div className="ml-0 sm:ml-8">
        {/* 1. SHORT ANSWER & PARAGRAPH */}
        {['paragraph', 'short_answer'].includes(question.type) && (
          <div className={`p-4 rounded-xl border flex flex-col gap-2.5 ${
            isLightMode
              ? 'bg-slate-50/80 border-slate-200 text-slate-700'
              : 'bg-surface-container-lowest/80 border-outline-variant/20 text-on-surface-variant'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-emerald-500" />
                <span>{question.voiceEnabled !== false ? 'Voice Dictation Enabled' : 'Text Input Only'}</span>
              </span>
              <span className={`text-[11px] ${isLightMode ? 'text-slate-400' : 'text-outline'}`}>
                {question.type === 'paragraph' ? 'Multi-line answer' : 'Single-line answer'}
              </span>
            </div>

            <div className={`p-3 rounded-lg border text-xs italic ${
              isLightMode
                ? 'bg-white border-slate-200 text-slate-400'
                : 'bg-surface-container/50 border-outline-variant/20 text-outline'
            }`}>
              {question.voiceEnabled !== false
                ? 'Responders can type their answer or tap the microphone to dictate with speech-to-text...'
                : 'Responders will type their answer here...'}
            </div>
          </div>
        )}

        {/* 2. MULTIPLE CHOICE / CHECKBOXES / DROPDOWN */}
        {['multiple_choice', 'checkboxes', 'dropdown'].includes(question.type) && (
          <div className="flex flex-col gap-2">
            {(question.options || []).map((option, optIdx) => (
              <div
                key={optIdx}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors group/opt ${
                  isLightMode
                    ? 'bg-slate-50 hover:bg-slate-100/90 border-slate-200 text-slate-800'
                    : 'bg-surface-container/60 hover:bg-surface-container border-outline-variant/20 text-on-surface'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className={`text-xs ${isLightMode ? 'text-slate-400' : 'text-outline'}`}>
                    {question.type === 'multiple_choice' && '○'}
                    {question.type === 'checkboxes' && '□'}
                    {question.type === 'dropdown' && `${optIdx + 1}.`}
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleUpdateOption(optIdx, e.target.value)}
                    placeholder={`Option ${optIdx + 1}`}
                    className={`bg-transparent text-xs sm:text-sm focus:outline-none flex-1 ${
                      isLightMode ? 'text-slate-900 placeholder:text-slate-400' : 'text-on-surface placeholder:text-outline'
                    }`}
                  />
                </div>

                {(question.options || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteOption(optIdx)}
                    className="opacity-0 group-hover/opt:opacity-100 text-outline hover:text-error transition-opacity p-1 rounded cursor-pointer"
                    title="Remove option"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
                style={{ color: accentColor }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. LINEAR SCALE (1 to 5 or 10) */}
        {question.type === 'linear_scale' && (
          <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
            isLightMode
              ? 'bg-slate-50/80 border-slate-200'
              : 'bg-surface-container-lowest/80 border-outline-variant/20'
          }`}>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${isLightMode ? 'text-slate-600' : 'text-on-surface-variant'}`}>Scale from</span>
                <select
                  value={question.scaleConfig?.min ?? 1}
                  onChange={(e) => onUpdate({
                    scaleConfig: { ...(question.scaleConfig || {}), min: Number(e.target.value) }
                  })}
                  className={`rounded-lg px-2 py-1 border text-xs focus:outline-none ${
                    isLightMode
                      ? 'bg-white text-slate-900 border-slate-200'
                      : 'bg-surface-container text-on-surface border-outline-variant/30'
                  }`}
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                </select>
                <span className={`font-medium ${isLightMode ? 'text-slate-600' : 'text-on-surface-variant'}`}>to</span>
                <select
                  value={question.scaleConfig?.max ?? 5}
                  onChange={(e) => onUpdate({
                    scaleConfig: { ...(question.scaleConfig || {}), max: Number(e.target.value) }
                  })}
                  className={`rounded-lg px-2 py-1 border text-xs focus:outline-none ${
                    isLightMode
                      ? 'bg-white text-slate-900 border-slate-200'
                      : 'bg-surface-container text-on-surface border-outline-variant/30'
                  }`}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className={`block text-[11px] mb-1 font-mono ${isLightMode ? 'text-slate-500' : 'text-on-surface-variant'}`}>
                  Label for {question.scaleConfig?.min ?? 1} (e.g. Lowest)
                </label>
                <input
                  type="text"
                  value={question.scaleConfig?.minLabel || ''}
                  onChange={(e) => onUpdate({
                    scaleConfig: { ...(question.scaleConfig || {}), minLabel: e.target.value }
                  })}
                  placeholder="Low"
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none ${
                    isLightMode
                      ? 'bg-white text-slate-900 border-slate-200'
                      : 'bg-surface-container text-on-surface border-outline-variant/30'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-[11px] mb-1 font-mono ${isLightMode ? 'text-slate-500' : 'text-on-surface-variant'}`}>
                  Label for {question.scaleConfig?.max ?? 5} (e.g. Highest)
                </label>
                <input
                  type="text"
                  value={question.scaleConfig?.maxLabel || ''}
                  onChange={(e) => onUpdate({
                    scaleConfig: { ...(question.scaleConfig || {}), maxLabel: e.target.value }
                  })}
                  placeholder="High"
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none ${
                    isLightMode
                      ? 'bg-white text-slate-900 border-slate-200'
                      : 'bg-surface-container text-on-surface border-outline-variant/30'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* 3b. STAR RATING (Google Forms Style) */}
        {question.type === 'rating' && (
          <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
            isLightMode
              ? 'bg-slate-50/80 border-slate-200'
              : 'bg-surface-container-lowest/80 border-outline-variant/20'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${isLightMode ? 'text-slate-600' : 'text-on-surface-variant'}`}>Rating Scale:</span>
                <select
                  value={question.ratingConfig?.max ?? 5}
                  onChange={(e) => onUpdate({
                    ratingConfig: { ...(question.ratingConfig || {}), max: Number(e.target.value) }
                  })}
                  className={`rounded-lg px-2.5 py-1.5 border text-xs focus:outline-none cursor-pointer font-semibold ${
                    isLightMode
                      ? 'bg-white text-slate-900 border-slate-200'
                      : 'bg-surface-container text-on-surface border-outline-variant/30'
                  }`}
                >
                  <option value={3}>3 Stars</option>
                  <option value={5}>5 Stars (Standard)</option>
                  <option value={7}>7 Stars</option>
                  <option value={10}>10 Stars</option>
                </select>
              </div>

              {/* Star Preview in Builder */}
              <div className={`flex items-center gap-1.5 p-1.5 rounded-xl border ${
                isLightMode ? 'bg-white border-slate-200' : 'bg-surface-container/60 border-outline-variant/20'
              }`}>
                {Array.from({ length: question.ratingConfig?.max ?? 5 }, (_, i) => i + 1).map((starNum) => (
                  <Star
                    key={starNum}
                    className="w-5 h-5 text-amber-400 fill-amber-400/50"
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className={`block text-[11px] mb-1 font-mono ${isLightMode ? 'text-slate-500' : 'text-on-surface-variant'}`}>
                  Lowest Rating Label (Optional)
                </label>
                <input
                  type="text"
                  value={question.ratingConfig?.lowLabel || ''}
                  onChange={(e) => onUpdate({
                    ratingConfig: { ...(question.ratingConfig || {}), lowLabel: e.target.value }
                  })}
                  placeholder="e.g. Poor, Terrible"
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none ${
                    isLightMode
                      ? 'bg-white text-slate-900 border-slate-200'
                      : 'bg-surface-container text-on-surface border-outline-variant/30'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-[11px] mb-1 font-mono ${isLightMode ? 'text-slate-500' : 'text-on-surface-variant'}`}>
                  Highest Rating Label (Optional)
                </label>
                <input
                  type="text"
                  value={question.ratingConfig?.highLabel || ''}
                  onChange={(e) => onUpdate({
                    ratingConfig: { ...(question.ratingConfig || {}), highLabel: e.target.value }
                  })}
                  placeholder="e.g. Excellent, Outstanding"
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none ${
                    isLightMode
                      ? 'bg-white text-slate-900 border-slate-200'
                      : 'bg-surface-container text-on-surface border-outline-variant/30'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. FILE UPLOAD CONFIG */}
        {question.type === 'file_upload' && (
          <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
            isLightMode
              ? 'bg-slate-50/80 border-slate-200'
              : 'bg-surface-container-lowest/80 border-outline-variant/20'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={`block text-[11px] font-mono mb-1 ${isLightMode ? 'text-slate-500' : 'text-on-surface-variant'}`}>
                  Button Label
                </label>
                <input
                  type="text"
                  value={question.fileConfig?.buttonLabel || 'Attach File'}
                  onChange={(e) => onUpdate({
                    fileConfig: { ...(question.fileConfig || {}), buttonLabel: e.target.value }
                  })}
                  placeholder="Attach File"
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none ${
                    isLightMode
                      ? 'bg-white text-slate-900 border-slate-200'
                      : 'bg-surface-container text-on-surface border-outline-variant/30'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-mono mb-1 ${isLightMode ? 'text-slate-500' : 'text-on-surface-variant'}`}>
                  Allowed Formats
                </label>
                <select
                  value={question.fileConfig?.allowedTypes || 'all'}
                  onChange={(e) => onUpdate({
                    fileConfig: { ...(question.fileConfig || {}), allowedTypes: e.target.value }
                  })}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none cursor-pointer ${
                    isLightMode
                      ? 'bg-white text-slate-900 border-slate-200'
                      : 'bg-surface-container text-on-surface border-outline-variant/30'
                  }`}
                >
                  <option value="all">All Formats</option>
                  <option value="documents">Documents (PDF, Word, TXT)</option>
                  <option value="images">Images (PNG, JPG, WEBP)</option>
                  <option value="spreadsheets">Spreadsheets (Excel, CSV)</option>
                </select>
              </div>
              <div>
                <label className={`block text-[11px] font-mono mb-1 ${isLightMode ? 'text-slate-500' : 'text-on-surface-variant'}`}>
                  Max File Size
                </label>
                <select
                  value={question.fileConfig?.maxSizeMB || 10}
                  onChange={(e) => onUpdate({
                    fileConfig: { ...(question.fileConfig || {}), maxSizeMB: Number(e.target.value) }
                  })}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none cursor-pointer ${
                    isLightMode
                      ? 'bg-white text-slate-900 border-slate-200'
                      : 'bg-surface-container text-on-surface border-outline-variant/30'
                  }`}
                >
                  <option value={5}>5 MB</option>
                  <option value={10}>10 MB</option>
                  <option value={25}>25 MB</option>
                </select>
              </div>
            </div>

            <div className={`p-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs ${
              isLightMode
                ? 'border-slate-300 bg-white/60 text-slate-600'
                : 'border-outline-variant/30 bg-surface-container/40 text-on-surface-variant'
            }`}>
              <UploadCloud className="w-4 h-4" style={{ color: accentColor }} />
              <span>Responders will see an upload dropzone here</span>
            </div>
          </div>
        )}
      </div>

      {/* QUESTION FOOTER CONTROLS */}
      <div className={`flex items-center justify-between pt-3 border-t ml-0 sm:ml-8 ${
        isLightMode ? 'border-slate-200' : 'border-outline-variant/20'
      }`}>
        <div className="flex items-center gap-4">
          {/* Required Switch */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={question.required || false}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="sr-only peer"
            />
            <div
              className={`w-8 h-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all relative ${
                isLightMode ? 'bg-slate-200' : 'bg-surface-container-highest'
              }`}
              style={question.required ? { backgroundColor: accentColor } : {}}
            />
            <span className={`text-xs font-medium ${isLightMode ? 'text-slate-700' : 'text-on-surface'}`}>Required</span>
          </label>

          {/* Voice Dictation Switch (if applicable) */}
          {['paragraph', 'short_answer'].includes(question.type) && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={question.voiceEnabled !== false}
                onChange={(e) => onUpdate({ voiceEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className={`w-8 h-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 relative ${
                isLightMode ? 'bg-slate-200' : 'bg-surface-container-highest'
              }`} />
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <Mic className="w-3 h-3" />
                Voice-to-Text
              </span>
            </label>
          )}
        </div>

        {/* Action Buttons: Duplicate, Delete, Move Up/Down */}
        <div className={`flex items-center gap-1 ${isLightMode ? 'text-slate-400' : 'text-on-surface-variant'}`}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLightMode ? 'hover:bg-slate-100 hover:text-slate-800' : 'hover:bg-surface-container hover:text-on-surface'
            }`}
            title="Duplicate Question"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLightMode ? 'hover:bg-slate-100 hover:text-error' : 'hover:bg-surface-container hover:text-error'
            }`}
            title="Delete Question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className={`h-3 w-px mx-0.5 ${isLightMode ? 'bg-slate-200' : 'bg-outline-variant/30'}`} />
          <button
            type="button"
            disabled={index === 0}
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            className={`p-1.5 rounded-lg disabled:opacity-30 transition-colors cursor-pointer ${
              isLightMode ? 'hover:bg-slate-100 hover:text-slate-800' : 'hover:bg-surface-container hover:text-on-surface'
            }`}
            title="Move Up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={index === totalQuestions - 1}
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            className={`p-1.5 rounded-lg disabled:opacity-30 transition-colors cursor-pointer ${
              isLightMode ? 'hover:bg-slate-100 hover:text-slate-800' : 'hover:bg-surface-container hover:text-on-surface'
            }`}
            title="Move Down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
