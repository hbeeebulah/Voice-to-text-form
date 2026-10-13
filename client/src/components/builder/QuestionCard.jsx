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
  ListOrdered
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
  accentColor = '#8083ff'
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
      className={`relative group bg-surface-container-low rounded-2xl p-5 sm:p-6 shadow-xl border transition-all duration-200 overflow-hidden flex flex-col gap-4 cursor-pointer ${
        isActive
          ? 'border-primary-container shadow-[0_4px_24px_-4px_rgba(128,131,255,0.25)] ring-1 ring-primary/40'
          : 'border-outline-variant/20 hover:border-outline-variant/40'
      }`}
    >
      {/* Active Question Left Indicator */}
      {isActive && (
        <div
          className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
          style={{ backgroundColor: accentColor }}
        />
      )}

      {/* Question Header: Drag indicator, Title, Type dropdown */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="p-1 rounded text-outline group-hover:text-on-surface-variant transition-colors cursor-grab shrink-0">
            <GripVertical className="w-4 h-4" />
          </span>

          <span className="font-mono text-xs font-bold text-primary shrink-0">
            Q{index + 1}
          </span>

          <input
            type="text"
            value={question.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Enter question title..."
            className="w-full bg-transparent font-semibold text-base sm:text-lg text-on-surface focus:outline-none focus:bg-surface-container/70 px-2 py-1 rounded-lg transition-colors placeholder:text-outline/70 border border-transparent focus:border-outline-variant/30"
          />
        </div>

        {/* Question Type Selector Dropdown */}
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-all border border-outline-variant/30"
          >
            <span>{currentType.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-outline" />
          </button>

          {showTypeMenu && (
            <div className="absolute right-0 top-full mt-1.5 z-30 w-56 rounded-xl bg-surface-container-highest/95 backdrop-blur-xl border border-outline-variant/40 shadow-2xl p-1.5 flex flex-col gap-0.5">
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => handleTypeChange(t.type)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                    question.type === t.type
                      ? 'bg-primary-container text-on-primary-container font-semibold'
                      : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span>{t.label}</span>
                  {t.voiceEnabled && (
                    <span className="flex items-center gap-1 text-[10px] text-tertiary font-mono">
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
          className="w-full bg-transparent text-on-surface-variant text-xs focus:outline-none focus:text-on-surface px-2 py-1 rounded focus:bg-surface-container/50 placeholder:text-outline/60"
        />
      </div>

      {/* QUESTION BODY: TYPE-SPECIFIC EDITOR */}
      <div className="ml-0 sm:ml-8">
        {/* 1. SHORT ANSWER & PARAGRAPH */}
        {['paragraph', 'short_answer'].includes(question.type) && (
          <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/20 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs text-on-surface-variant font-mono">
              <span className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-tertiary" />
                <span>{question.voiceEnabled !== false ? 'Voice Dictation Enabled' : 'Text Input Only'}</span>
              </span>
              <span className="text-[11px] text-outline">
                {question.type === 'paragraph' ? 'Multi-line answer' : 'Single-line answer'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-container/50 border border-outline-variant/20 text-xs text-outline italic">
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
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container/60 hover:bg-surface-container border border-outline-variant/20 transition-colors group/opt"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="text-outline text-xs">
                    {question.type === 'multiple_choice' && '○'}
                    {question.type === 'checkboxes' && '□'}
                    {question.type === 'dropdown' && `${optIdx + 1}.`}
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleUpdateOption(optIdx, e.target.value)}
                    placeholder={`Option ${optIdx + 1}`}
                    className="bg-transparent text-on-surface text-xs sm:text-sm focus:outline-none flex-1"
                  />
                </div>

                {(question.options || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteOption(optIdx)}
                    className="opacity-0 group-hover/opt:opacity-100 text-outline hover:text-error transition-opacity p-1 rounded"
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
                className="flex items-center gap-1.5 text-primary hover:text-primary-container text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. LINEAR SCALE (1 to 5 or 10) */}
        {question.type === 'linear_scale' && (
          <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/20 flex flex-col gap-3">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-on-surface-variant font-medium">Scale from</span>
                <select
                  value={question.scaleConfig?.min ?? 1}
                  onChange={(e) => onUpdate({
                    scaleConfig: { ...(question.scaleConfig || {}), min: Number(e.target.value) }
                  })}
                  className="bg-surface-container text-on-surface rounded-lg px-2 py-1 border border-outline-variant/30 text-xs focus:outline-none"
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                </select>
                <span className="text-on-surface-variant font-medium">to</span>
                <select
                  value={question.scaleConfig?.max ?? 5}
                  onChange={(e) => onUpdate({
                    scaleConfig: { ...(question.scaleConfig || {}), max: Number(e.target.value) }
                  })}
                  className="bg-surface-container text-on-surface rounded-lg px-2 py-1 border border-outline-variant/30 text-xs focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-on-surface-variant mb-1 font-mono">
                  Label for {question.scaleConfig?.min ?? 1} (e.g. Lowest)
                </label>
                <input
                  type="text"
                  value={question.scaleConfig?.minLabel || ''}
                  onChange={(e) => onUpdate({
                    scaleConfig: { ...(question.scaleConfig || {}), minLabel: e.target.value }
                  })}
                  placeholder="Low"
                  className="w-full px-3 py-1.5 bg-surface-container text-on-surface rounded-lg text-xs border border-outline-variant/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-on-surface-variant mb-1 font-mono">
                  Label for {question.scaleConfig?.max ?? 5} (e.g. Highest)
                </label>
                <input
                  type="text"
                  value={question.scaleConfig?.maxLabel || ''}
                  onChange={(e) => onUpdate({
                    scaleConfig: { ...(question.scaleConfig || {}), maxLabel: e.target.value }
                  })}
                  placeholder="High"
                  className="w-full px-3 py-1.5 bg-surface-container text-on-surface rounded-lg text-xs border border-outline-variant/30 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. FILE UPLOAD CONFIG */}
        {question.type === 'file_upload' && (
          <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/20 flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-on-surface-variant mb-1">
                  Button Label
                </label>
                <input
                  type="text"
                  value={question.fileConfig?.buttonLabel || 'Attach File'}
                  onChange={(e) => onUpdate({
                    fileConfig: { ...(question.fileConfig || {}), buttonLabel: e.target.value }
                  })}
                  placeholder="Attach File"
                  className="w-full px-3 py-1.5 bg-surface-container text-on-surface rounded-lg text-xs border border-outline-variant/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-on-surface-variant mb-1">
                  Allowed Formats
                </label>
                <select
                  value={question.fileConfig?.allowedTypes || 'all'}
                  onChange={(e) => onUpdate({
                    fileConfig: { ...(question.fileConfig || {}), allowedTypes: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 bg-surface-container text-on-surface rounded-lg text-xs border border-outline-variant/30 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Formats</option>
                  <option value="documents">Documents (PDF, Word, TXT)</option>
                  <option value="images">Images (PNG, JPG, WEBP)</option>
                  <option value="spreadsheets">Spreadsheets (Excel, CSV)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-on-surface-variant mb-1">
                  Max File Size
                </label>
                <select
                  value={question.fileConfig?.maxSizeMB || 10}
                  onChange={(e) => onUpdate({
                    fileConfig: { ...(question.fileConfig || {}), maxSizeMB: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-1.5 bg-surface-container text-on-surface rounded-lg text-xs border border-outline-variant/30 focus:outline-none cursor-pointer"
                >
                  <option value={5}>5 MB</option>
                  <option value={10}>10 MB</option>
                  <option value={25}>25 MB</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl border-2 border-dashed border-outline-variant/30 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
              <UploadCloud className="w-4 h-4 text-primary" />
              <span>Responders will see an upload dropzone here</span>
            </div>
          </div>
        )}
      </div>

      {/* QUESTION FOOTER CONTROLS */}
      <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20 ml-0 sm:ml-8">
        <div className="flex items-center gap-4">
          {/* Required Switch */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={question.required || false}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-container relative" />
            <span className="text-xs text-on-surface font-medium">Required</span>
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
              <div className="w-8 h-4 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-tertiary relative" />
              <span className="flex items-center gap-1 text-xs text-tertiary font-medium">
                <Mic className="w-3 h-3" />
                Voice-to-Text
              </span>
            </label>
          )}
        </div>

        {/* Action Buttons: Duplicate, Delete, Move Up/Down */}
        <div className="flex items-center gap-1 text-on-surface-variant">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="p-1.5 rounded-lg hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            title="Duplicate Question"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg hover:bg-surface-container hover:text-error transition-colors cursor-pointer"
            title="Delete Question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="h-3 w-px bg-outline-variant/30 mx-0.5" />
          <button
            type="button"
            disabled={index === 0}
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            className="p-1.5 rounded-lg hover:bg-surface-container hover:text-on-surface disabled:opacity-30 transition-colors cursor-pointer"
            title="Move Up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={index === totalQuestions - 1}
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            className="p-1.5 rounded-lg hover:bg-surface-container hover:text-on-surface disabled:opacity-30 transition-colors cursor-pointer"
            title="Move Down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
