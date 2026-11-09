const { GoogleGenAI } = require('@google/genai');

class VoiceAiService {
  constructor() {
    this.apiKey = process.env.VOICE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    if (this.apiKey) {
      this.initGoogleClient(this.apiKey);
      console.log('[Voice AI] Initialized with Voice AI Key.');
    } else {
      console.warn('[Voice AI] No API key found in environment. Simulated fallback & browser engine active.');
    }
  }

  initGoogleClient(key) {
    try {
      this.ai = new GoogleGenAI({ apiKey: key });
    } catch (e) {
      console.warn('[Voice AI] GoogleGenAI init warning:', e.message);
    }
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  setApiKey(key) {
    if (key && key.trim().length > 5) {
      this.apiKey = key.trim();
      this.initGoogleClient(this.apiKey);
      console.log('[Voice AI] Key updated dynamically.');
      return true;
    }
    return false;
  }

  formatRawSpeech(text, fieldType = 'paragraph') {
    if (!text || !text.trim()) return '';
    let cleaned = text.trim();
    // Strip common speech disfluencies
    cleaned = cleaned.replace(/\b(um|uh|er|ah|like you know|you know|sort of)\b/gi, '');
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      const wordCount = cleaned.split(/\s+/).length;
      const isShortField = fieldType === 'short_answer' || wordCount <= 4;
      if (!isShortField && !/[.?!]$/.test(cleaned)) {
        cleaned += '.';
      }
    }
    return cleaned;
  }

  async transcribeWithOpenAI(apiKey, audioBuffer, mimeType) {
    // Call OpenAI Whisper API directly if an OpenAI key (sk-...) is passed
    const formData = new FormData();
    const isMp4 = mimeType && (mimeType.includes('mp4') || mimeType.includes('m4a') || mimeType.includes('aac'));
    const filename = isMp4 ? 'audio.m4a' : 'audio.webm';
    const blobType = isMp4 ? 'audio/m4a' : ((mimeType || 'audio/webm').split(';')[0].trim());

    const blob = new Blob([audioBuffer], { type: blobType });
    formData.append('file', blob, filename);
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `OpenAI Whisper failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.text || '';
  }

  async transcribeAudio({ audioBase64, mimeType = 'audio/webm', questionTitle, questionDescription, fieldType, existingText, apiKey, recognizedText }) {
    if (!audioBase64 && !recognizedText) {
      throw new Error('No speech was detected. Please speak clearly into your microphone and try again.');
    }

    const effectiveKey = apiKey || this.apiKey;
    if (apiKey && !this.apiKey) {
      this.setApiKey(apiKey);
    }

    // Clean base64 string if it contains data URI header (handles codecs parameters like data:audio/webm;codecs=opus;base64,...)
    const cleanBase64 = audioBase64 ? audioBase64.replace(/^data:audio\/[^;]+(?:;[^;]+)*;base64,/, '') : '';

    // If recognizedText is provided and audioBase64 is empty, immediately format and return the real spoken words
    if (!cleanBase64 && recognizedText && recognizedText.trim().length > 0) {
      return {
        text: this.formatRawSpeech(recognizedText, fieldType),
        isDemoFallback: false,
        model: 'browser-speech-engine'
      };
    }

    // If an OpenAI Whisper key is provided (starts with sk-)
    if (effectiveKey && effectiveKey.startsWith('sk-') && cleanBase64) {
      try {
        const audioBuffer = Buffer.from(cleanBase64, 'base64');
        const text = await this.transcribeWithOpenAI(effectiveKey, audioBuffer, mimeType);
        if (text && text.trim().length > 0) {
          return {
            text: this.formatRawSpeech(text, fieldType),
            isDemoFallback: false,
            model: 'whisper-v3-turbo'
          };
        }
      } catch (whisperErr) {
        console.warn('[Voice AI] Whisper error, checking fallbacks:', whisperErr.message);
        if (recognizedText && recognizedText.trim().length > 0) {
          return {
            text: this.formatRawSpeech(recognizedText, fieldType),
            isDemoFallback: false,
            model: 'browser-speech-engine'
          };
        }
      }
    }

    // If no API key configured, use the user's real spoken words captured via speech recognition
    if (!effectiveKey) {
      if (recognizedText && recognizedText.trim().length > 0) {
        return {
          text: this.formatRawSpeech(recognizedText, fieldType),
          isDemoFallback: false,
          model: 'browser-speech-engine'
        };
      }
      throw new Error('No speech was detected. Please speak clearly into your microphone and try again.');
    }

    // Multimodal Audio Engine
    const client = apiKey ? new GoogleGenAI({ apiKey }) : this.ai;

    const promptText = `You are an expert speech-to-text dictation processor for form fields.
Transcribe the user's spoken audio directly, adhering strictly to these rules:
1. Strip all speech disfluencies and filler words such as "um", "uh", "er", "ah", "like", "you know", and accidental repetitions or stuttering.
2. Format punctuation naturally with proper capitalization, commas, periods, and question marks.
3. If the user dictates numbers, dates, or emails, format them clearly (e.g. "twenty five" -> "25", "john dot doe at gmail dot com" -> "john.doe@gmail.com").
4. If the user dictates bullet points or multiple paragraphs, separate sentences and paragraphs naturally.
5. Contextual guidance:
   - Form Question Title: "${questionTitle || 'General Form Input'}"
   - Question Type: "${fieldType || 'text'}" (if 'short_answer', keep response concise without trailing period for names/short values; if 'paragraph', preserve full narrative depth)
   - Help / Instructions: "${questionDescription || 'None'}"
   ${existingText ? `- Existing Text in Field: "${existingText}"` : ''}
6. IMPORTANT: Return ONLY the cleaned transcribed text. Do NOT add preamble, conversational commentary, or quotes. Output the clean text directly.`;

    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = null;

    // Strip ';codecs=...' parameters and normalize iOS Safari audio/mp4 to audio/m4a
    const baseMime = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
    const normalizedMime = (baseMime.includes('mp4') || baseMime.includes('m4a'))
      ? 'audio/m4a'
      : (baseMime || 'audio/webm');

    if (cleanBase64) {
      for (const modelName of candidateModels) {
        try {
          const response = await client.models.generateContent({
            model: modelName,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: normalizedMime,
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
          if (transcribedText) {
            return {
              text: transcribedText,
              isDemoFallback: false,
              model: modelName
            };
          }
        } catch (err) {
          lastError = err;
          const errStr = (err.message || '').toLowerCase();
          if (errStr.includes('not found') || errStr.includes('404')) {
            continue;
          }
          break;
        }
      }
    }

    // Fallback to the user's actual spoken words captured by browser speech recognition
    if (recognizedText && recognizedText.trim().length > 0) {
      return {
        text: this.formatRawSpeech(recognizedText, fieldType),
        isDemoFallback: false,
        model: 'browser-speech-engine'
      };
    }

    console.warn('[VoiceAI] Transcription did not yield text:', lastError?.message);
    throw new Error('No speech was detected. Please speak clearly into your microphone and try again.');
  }
}

module.exports = new VoiceAiService();
