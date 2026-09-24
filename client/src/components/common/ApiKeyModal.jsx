import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, Sparkles, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { getTranscribeStatus, setServerApiKey } from '../../services/api';

export default function ApiKeyModal({ isOpen, onClose, onKeyUpdated }) {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    try {
      const status = await getTranscribeStatus();
      setIsConfigured(Boolean(status.configured));
    } catch {
      setIsConfigured(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!apiKey || apiKey.trim().length < 8) {
      setError('Please enter a valid Gemini API key.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await setServerApiKey(apiKey.trim());
      setIsConfigured(true);
      setSaveSuccess(true);
      if (onKeyUpdated) onKeyUpdated(apiKey.trim());
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to update Gemini API key');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Gemini Voice AI Configuration</h3>
            <p className="text-xs text-slate-500">Multimodal Speech-to-Text with Gemini 3.8 Flash</p>
          </div>
        </div>

        {/* Current Status Badge */}
        <div className="mb-5 p-3 rounded-xl border flex items-center justify-between text-xs transition-colors">
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
            <span className="font-medium text-slate-700">
              API Status: {isConfigured ? 'Active & Authenticated' : 'Preview / Simulation Mode'}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
            isConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
          }`}>
            {isConfigured ? 'Live Gemini 3.8' : 'Simulated Dictation'}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Google Gemini API Key
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Keys can also be configured in <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">server/.env</code>.
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          {saveSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Gemini API Key activated successfully!</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              <span>Get API Key from Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isConfigured ? 'Update Key' : 'Activate Live AI'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
