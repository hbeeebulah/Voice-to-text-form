import React, { useState } from 'react';
import {
  GripVertical,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Sparkles,
  AlignLeft,
  AlignJustify,
  CircleDot,
  CheckSquare,
  ChevronDownCircle,
  SlidersHorizontal,
  Plus,
  X,
  HelpCircle,
  Mic,
  Paperclip,
  UploadCloud,
  FileText,
  FileUp
} from 'lucide-react';
import { QUESTION_TYPES } from '../../constants/themes';
import AudioRecorder from '../common/AudioRecorder';

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
  accentColor = '#6366f1'
}) {
  const [builderTestText, setBuilderTestText] = useState('');
  const currentType = QUESTION_TYPES.find(t => t.type === question.type) || QUESTION_TYPES[0];

  const handleTypeChange = (newType) => {
    const typeDef = QUESTION_TYPES.find(t => t.type === newType);
    const updates = {
      type: newType,
      voiceEnabled: typeDef?.voiceEnabled || false
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
  };

  const handleAddOption = () => {
    const currentOptions = question.options || [];
    const nextNumber = currentOptions.length + 1;
    onUpdate({
      options: [...currentOptions, `Option ${nextNumber}`]
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
      className={`bg-white rounded-2xl border transition-all duration-150 relative ${
        isActive
          ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
          : 'border-slate-200 hover:border-slate-300 shadow-xs'
      }`}
      style={{
        borderLeftWidth: isActive ? '6px' : '1px',
        borderLeftColor: isActive ? accentColor : undefined
      }}
    >
      {/* Drag & Reorder Bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 border-b border-slate-100/60">
        <div className="flex items-center gap-2 cursor-grab text-slate-400 hover:text-slate-600">
          <GripVertical className="w-4 h-4" />
          <span className="text-xs font-semibold text-slate-500">Question {index + 1}</span>
        </div>

        {/* Quick Move Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 rounded-md hover:bg-slate-100 transition-colors"
            title="Move Question Up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={index === totalQuestions - 1}
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 rounded-md hover:bg-slate-100 transition-colors"
            title="Move Question Down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Question Header: Title & Type Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
          <div className="md:col-span-2">
            <input
              type="text"
              value={question.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Question Title (e.g., What are your thoughts?)"
              className="w-full text-base font-semibold text-slate-900 placeholder:text-slate-400 bg-transparent px-3 py-2 border-b-2 border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:outline-none transition-colors"
            />
            {/* Optional Description / Help Text */}
            <input
              type="text"
              value={question.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Description or help text (optional)"
              className="w-full text-xs text-slate-600 placeholder:text-slate-400 bg-transparent px-3 py-1.5 focus:outline-none focus:text-slate-800 transition-colors mt-1"
            />
          </div>

          {/* Question Type Selector */}
          <div>
            <select
              value={question.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Question Body by Type */}
        <div className="pt-2">
          {/* Short Answer & Paragraph: Voice-enabled preview */}
          {(question.type === 'short_answer' || question.type === 'paragraph') && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-mono text-[11px]">
                    {question.type === 'short_answer' ? 'Short-answer text field' : 'Long-answer paragraph text field'}
                  </span>
                  {question.voiceEnabled && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-200">
                      <Mic className="w-3 h-3 text-indigo-500" />
                      Voice Dictation Active
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {question.type === 'short_answer' ? (
                    <input
                      type="text"
                      value={builderTestText}
                      onChange={(e) => setBuilderTestText(e.target.value)}
                      placeholder="Type or click the microphone below to test voice dictation..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                    />
                  ) : (
                    <textarea
                      rows={2}
                      value={builderTestText}
                      onChange={(e) => setBuilderTestText(e.target.value)}
                      placeholder="Type or click the microphone below to test voice dictation..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs resize-y"
                    />
                  )}

                  {question.voiceEnabled !== false && (
                    <AudioRecorder
                      questionTitle={question.title || 'Sample Question'}
                      questionDescription={question.description}
                      fieldType={question.type}
                      currentValue={builderTestText}
                      onTranscriptionComplete={(text) => setBuilderTestText(text)}
                      accentColor={accentColor}
                    />
                  )}
                </div>
              </div>

              {/* Voice Transcription Toggle Option */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-medium">Enable AI Voice Dictation</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={question.voiceEnabled !== false}
                    onChange={(e) => onUpdate({ voiceEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* Multiple Choice, Checkboxes, Dropdown Options */}
          {['multiple_choice', 'checkboxes', 'dropdown'].includes(question.type) && (
            <div className="space-y-2.5">
              {(question.options || []).map((option, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2 group">
                  <div className="text-slate-400 shrink-0">
                    {question.type === 'multiple_choice' && <CircleDot className="w-4 h-4 text-slate-300" />}
                    {question.type === 'checkboxes' && <CheckSquare className="w-4 h-4 text-slate-300" />}
                    {question.type === 'dropdown' && <span className="text-xs font-mono w-4 text-center">{optIdx + 1}.</span>}
                  </div>

                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleUpdateOption(optIdx, e.target.value)}
                    className="flex-1 text-xs text-slate-800 bg-transparent px-2.5 py-1.5 border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none transition-colors"
                    placeholder={`Option ${optIdx + 1}`}
                  />

                  {(question.options || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(optIdx)}
                      className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove option"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add option</span>
                </button>
              </div>
            </div>
          )}

          {/* Linear Scale Configuration */}
          {question.type === 'linear_scale' && (
            <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-600 font-medium">Scale Range:</span>
                <select
                  value={question.scaleConfig?.min ?? 1}
                  onChange={(e) => onUpdate({
                    scaleConfig: { ...question.scaleConfig, min: Number(e.target.value) }
                  })}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                </select>
                <span className="text-slate-400">to</span>
                <select
                  value={question.scaleConfig?.max ?? 5}
                  onChange={(e) => onUpdate({
                    scaleConfig: { ...question.scaleConfig, max: Number(e.target.value) }
                  })}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Label for {question.scaleConfig?.min ?? 1} (e.g., Needs Work)
                  </label>
                  <input
                    type="text"
                    value={question.scaleConfig?.minLabel || ''}
                    onChange={(e) => onUpdate({
                      scaleConfig: { ...question.scaleConfig, minLabel: e.target.value }
                    })}
                    placeholder="Min Label"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Label for {question.scaleConfig?.max ?? 5} (e.g., Delighted)
                  </label>
                  <input
                    type="text"
                    value={question.scaleConfig?.maxLabel || ''}
                    onChange={(e) => onUpdate({
                      scaleConfig: { ...question.scaleConfig, maxLabel: e.target.value }
                    })}
                    placeholder="Max Label"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* File / Document Upload Configuration & Preview */}
          {question.type === 'file_upload' && (
            <div className="space-y-4 pt-1">
              {/* Creator Settings Bar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Document Attachment Settings</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={question.fileConfig?.buttonLabel || 'Attach File'}
                      onChange={(e) => onUpdate({
                        fileConfig: {
                          ...(question.fileConfig || {}),
                          buttonLabel: e.target.value
                        }
                      })}
                      placeholder="e.g. Attach File, Upload Document"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Allowed Formats
                    </label>
                    <select
                      value={question.fileConfig?.allowedTypes || 'all'}
                      onChange={(e) => onUpdate({
                        fileConfig: {
                          ...(question.fileConfig || {}),
                          allowedTypes: e.target.value
                        }
                      })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="all">All Formats (PDF, Docs, Images, Sheets)</option>
                      <option value="documents">Documents (.pdf, .doc, .docx, .txt)</option>
                      <option value="images">Images (.png, .jpg, .jpeg, .webp)</option>
                      <option value="spreadsheets">Spreadsheets (.xlsx, .xls, .csv)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Max File Size
                    </label>
                    <select
                      value={question.fileConfig?.maxSizeMB || 10}
                      onChange={(e) => onUpdate({
                        fileConfig: {
                          ...(question.fileConfig || {}),
                          maxSizeMB: Number(e.target.value)
                        }
                      })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value={5}>5 MB</option>
                      <option value={10}>10 MB</option>
                      <option value={25}>25 MB</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Live Preview Dropzone */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-2.5 text-indigo-600">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700 mb-1">
                  Drag and drop document here, or browse
                </p>
                <p className="text-[11px] text-slate-400 mb-3">
                  {question.fileConfig?.allowedTypes === 'documents' && 'PDF, DOC, DOCX, TXT'}
                  {question.fileConfig?.allowedTypes === 'images' && 'PNG, JPG, JPEG, WEBP'}
                  {question.fileConfig?.allowedTypes === 'spreadsheets' && 'XLSX, XLS, CSV'}
                  {(!question.fileConfig?.allowedTypes || question.fileConfig?.allowedTypes === 'all') && 'PDF, Word, Excel, Images, or Text'}
                  {' '}up to {question.fileConfig?.maxSizeMB || 10} MB
                </p>
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs font-bold text-slate-700 pointer-events-none">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{question.fileConfig?.buttonLabel || 'Attach File'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="Duplicate Question"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Required Switch */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Required</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={question.required || false}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
