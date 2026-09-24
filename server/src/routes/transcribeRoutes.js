const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

// POST /api/transcribe
router.post('/', async (req, res) => {
  try {
    const { audioBase64, mimeType, questionTitle, questionDescription, fieldType, existingText } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required in request body.' });
    }

    const userApiKey = req.headers['x-gemini-api-key'] || req.body.apiKey || '';

    const result = await geminiService.transcribeAudio({
      audioBase64,
      mimeType: mimeType || 'audio/webm',
      questionTitle: questionTitle || '',
      questionDescription: questionDescription || '',
      fieldType: fieldType || 'paragraph',
      existingText: existingText || '',
      apiKey: userApiKey
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

// POST /api/transcribe/set-key - Set or update Gemini API key dynamically
router.post('/set-key', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 6) {
    return res.status(400).json({ error: 'Valid Gemini API key is required.' });
  }

  geminiService.setApiKey(apiKey.trim());
  res.json({
    success: true,
    configured: true,
    message: 'Gemini API key configured successfully.'
  });
});

// GET /api/transcribe/status - check if Gemini API key is configured
router.get('/status', (req, res) => {
  res.json({
    configured: geminiService.isConfigured(),
    model: 'gemini-3.8-flash'
  });
});

module.exports = router;
