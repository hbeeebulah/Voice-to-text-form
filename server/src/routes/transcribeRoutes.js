const express = require('express');
const router = express.Router();
const voiceAiService = require('../services/voiceAiService');

// POST /api/transcribe
router.post('/', async (req, res) => {
  try {
    const { audioBase64, mimeType, questionTitle, questionDescription, fieldType, existingText, recognizedText } = req.body;

    if (!audioBase64 && !recognizedText) {
      return res.status(400).json({ error: 'audioBase64 or recognizedText is required in request body.' });
    }

    const userApiKey = req.headers['x-voice-ai-key'] || req.headers['x-gemini-api-key'] || req.body.apiKey || '';

    const result = await voiceAiService.transcribeAudio({
      audioBase64,
      mimeType: mimeType || 'audio/webm',
      questionTitle: questionTitle || '',
      questionDescription: questionDescription || '',
      fieldType: fieldType || 'paragraph',
      existingText: existingText || '',
      apiKey: userApiKey,
      recognizedText: recognizedText || ''
    });

    return res.json({
      success: true,
      text: result.text,
      isDemoFallback: result.isDemoFallback || false,
      model: result.model,
      warning: result.warning || null
    });
  } catch (err) {
    console.error('[Transcribe Route] Error:', err.message);
    return res.status(500).json({
      success: false,
      error: err.message || 'Speech transcription failed.'
    });
  }
});

// POST /api/transcribe/set-key - Set or update Voice AI key dynamically
router.post('/set-key', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 6) {
    return res.status(400).json({ error: 'Valid API key is required.' });
  }

  voiceAiService.setApiKey(apiKey.trim());
  res.json({
    success: true,
    configured: true,
    message: 'Voice AI key configured successfully.'
  });
});

// GET /api/transcribe/status - check if Voice AI key is configured
router.get('/status', (req, res) => {
  res.json({
    configured: voiceAiService.isConfigured(),
    model: 'neural-voice-engine'
  });
});

module.exports = router;
