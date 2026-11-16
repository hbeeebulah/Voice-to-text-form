/**
 * VoxForm Chrome Extension — Background Service Worker
 * Handles communication with the VoxForm backend (/api/transcribe) without page CORS restrictions.
 */

const DEFAULT_SERVER_URL = 'https://voice-to-text-form.onrender.com';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['voxformServerUrl', 'voxformEnabled', 'voxformLang', 'voxformCount'], (res) => {
    if (!res.voxformServerUrl) {
      chrome.storage.sync.set({
        voxformServerUrl: DEFAULT_SERVER_URL,
        voxformEnabled: true,
        voxformLang: '',
        voxformCount: 0
      });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VOXFORM_TRANSCRIBE') {
    handleTranscribeRequest(message.payload)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((err) => sendResponse({ success: false, error: err.message || 'Transcription failed' }));
    return true; // Keep message channel open for async response
  }
});

async function handleTranscribeRequest(payload) {
  const settings = await chrome.storage.sync.get(['voxformServerUrl', 'voxformApiKey', 'voxformCount']);
  const serverUrl = (settings.voxformServerUrl || DEFAULT_SERVER_URL).trim().replace(/\/$/, '');
  const apiKey = settings.voxformApiKey || '';

  const headers = {
    'Content-Type': 'application/json'
  };
  if (apiKey) {
    headers['x-voice-ai-key'] = apiKey;
  }

  const response = await fetch(`${serverUrl}/api/transcribe`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      audioBase64: payload.audioBase64 || '',
      mimeType: payload.mimeType || 'audio/webm',
      questionTitle: payload.questionTitle || 'Form Question',
      questionDescription: payload.questionDescription || '',
      fieldType: payload.fieldType || 'paragraph',
      existingText: payload.existingText || '',
      recognizedText: payload.recognizedText || '',
      apiKey
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.error || `Server returned status ${response.status}`);
  }

  // Increment dictation counter
  const nextCount = (Number(settings.voxformCount) || 0) + 1;
  await chrome.storage.sync.set({ voxformCount: nextCount });

  return data;
}
