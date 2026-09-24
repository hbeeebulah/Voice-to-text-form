const { GoogleGenAI } = require('@google/genai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    if (this.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
      console.log('[Gemini] Initialized with Gemini API Key.');
    } else {
      console.warn('[Gemini] WARNING: No GEMINI_API_KEY found in environment. Simulated fallback will be available for UI testing.');
    }
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  setApiKey(key) {
    if (key && key.trim().length > 5) {
      this.apiKey = key.trim();
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
      console.log('[Gemini] Key updated dynamically from user interface.');
      return true;
    }
    return false;
  }

  formatRawSpeech(text) {
    if (!text || !text.trim()) return '';
    let cleaned = text.trim();
    // Strip common speech disfluencies
    cleaned = cleaned.replace(/\b(um|uh|er|ah|like you know|you know|sort of)\b/gi, '');
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      if (!/[.?!]$/.test(cleaned)) {
        cleaned += '.';
      }
    }
    return cleaned;
  }

  async transcribeAudio({ audioBase64, mimeType = 'audio/webm', questionTitle, questionDescription, fieldType, existingText, apiKey, recognizedText }) {
    if (!audioBase64 && !recognizedText) {
      throw new Error('Audio payload or speech transcript is required.');
    }

    const effectiveKey = apiKey || this.apiKey;
    if (apiKey && !this.apiKey) {
      this.setApiKey(apiKey);
    }

    // Clean base64 string if it contains data URI header
    const cleanBase64 = audioBase64 ? audioBase64.replace(/^data:audio\/[a-zA-Z0-9.+_-]+;base64,/, '') : '';

    // If no API key configured, use the user's real spoken words if captured via speech recognition
    if (!effectiveKey) {
      if (recognizedText && recognizedText.trim().length > 0) {
        return {
          text: this.formatRawSpeech(recognizedText),
          isDemoFallback: true,
          model: 'browser-speech-engine',
          warning: 'Transcribed directly via browser speech recognition. Configure GEMINI_API_KEY in server/.env for Gemini 3.8 Flash neural polishing.'
        };
      }
      return this.simulateTranscription({ questionTitle, fieldType });
    }

    const client = apiKey ? new GoogleGenAI({ apiKey }) : this.ai;

    const promptText = `You are an expert speech-to-text dictation processor for form fields.
Transcribe the user's spoken audio directly, adhering strictly to these rules:
1. Strip all speech disfluencies and filler words such as "um", "uh", "er", "ah", "like", "you know", and accidental repetitions or stuttering.
2. Format punctuation naturally with proper capitalization, commas, periods, and question marks.
3. If the user dictates numbers, dates, or emails, format them clearly (e.g. "twenty five" -> "25", "john dot doe at gmail dot com" -> "john.doe@gmail.com").
4. If the user dictates bullet points or multiple paragraphs, separate sentences and paragraphs naturally.
5. Contextual guidance:
   - Form Question Title: "${questionTitle || 'General Form Input'}"
   - Question Type: "${fieldType || 'text'}" (if 'short_answer', keep response concise; if 'paragraph', preserve full narrative depth)
   - Help / Instructions: "${questionDescription || 'None'}"
   ${existingText ? `- Existing Text in Field: "${existingText}"` : ''}
6. IMPORTANT: Return ONLY the cleaned transcribed text. Do NOT add preamble, conversational commentary, or quotes. Output the clean text directly.`;

    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'audio/webm',
                  data: cleanBase64
                }
              },
              {
                text: promptText
              }
            ]
          }
        ]
      });

      const transcribedText = response.text ? response.text.trim() : '';
      return {
        text: transcribedText,
        isDemoFallback: false,
        model: 'gemini-3.8-flash'
      };
    } catch (err) {
      console.error('[Gemini] Transcription error:', err);

      // Handle common Gemini API errors gracefully
      let userFriendlyMessage = 'Speech transcription failed.';
      const errStr = err.message || '';

      if (errStr.includes('429') || errStr.toLowerCase().includes('quota') || errStr.toLowerCase().includes('rate')) {
        userFriendlyMessage = 'Gemini API rate limit or quota exceeded. Please wait a moment before trying again.';
      } else if (errStr.includes('401') || errStr.includes('403') || errStr.toLowerCase().includes('api key')) {
        userFriendlyMessage = 'Invalid or expired GEMINI_API_KEY. Please verify your API key in server/.env.';
      } else if (errStr.toLowerCase().includes('audio') || errStr.toLowerCase().includes('format')) {
        userFriendlyMessage = 'Audio encoding not supported by model. Please check microphone settings.';
      }

      throw new Error(userFriendlyMessage);
    }
  }

  simulateTranscription({ questionTitle = '', fieldType = 'paragraph' }) {
    const qLower = questionTitle.toLowerCase();
    let text = '';

    if (qLower.includes('name') || qLower.includes('who')) {
      text = 'Jordan Taylor';
    } else if (qLower.includes('role') || qLower.includes('title') || qLower.includes('work')) {
      text = 'Senior Product Designer and Accessibility Advocate';
    } else if (qLower.includes('feedback') || qLower.includes('experience') || qLower.includes('challenge')) {
      text = 'The multimodal audio dictation felt remarkably fluid and natural. It eliminated the friction of typing lengthy feedback on a mobile screen, and the auto-cleaning of filler words made my answer look polished immediately.';
    } else if (fieldType === 'short_answer') {
      text = 'Streamlined workflow and exceptional voice transcription speed.';
    } else {
      text = 'I found the interface intuitive and responsive. The seamless voice dictation helped me express my thoughts in complete sentences without second-guessing my typing speed. It made the entire survey feel conversational rather than tedious.';
    }

    return {
      text,
      isDemoFallback: true,
      model: 'simulated-preview',
      warning: 'GEMINI_API_KEY is not set. Using contextual speech recognition preview. Add GEMINI_API_KEY to server/.env for live Gemini 3.8 Flash transcription.'
    };
  }
}

module.exports = new GeminiService();
