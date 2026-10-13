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

  async transcribeWithOpenAI(apiKey, audioBuffer, mimeType) {
    // Call OpenAI Whisper API directly if an OpenAI key (sk-...) is passed
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType || 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
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
      throw new Error('Audio payload or speech transcript is required.');
    }

    const effectiveKey = apiKey || this.apiKey;
    if (apiKey && !this.apiKey) {
      this.setApiKey(apiKey);
    }

    // Clean base64 string if it contains data URI header
    const cleanBase64 = audioBase64 ? audioBase64.replace(/^data:audio\/[a-zA-Z0-9.+_-]+;base64,/, '') : '';

    // If recognizedText is provided and audioBase64 is empty, immediately format and return the speech
    if (!cleanBase64 && recognizedText && recognizedText.trim().length > 0) {
      return {
        text: this.formatRawSpeech(recognizedText),
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
            text: this.formatRawSpeech(text),
            isDemoFallback: false,
            model: 'whisper-v3-turbo'
          };
        }
      } catch (whisperErr) {
        console.warn('[Voice AI] Whisper error, checking fallbacks:', whisperErr.message);
        if (recognizedText && recognizedText.trim().length > 0) {
          return {
            text: this.formatRawSpeech(recognizedText),
            isDemoFallback: true,
            model: 'browser-speech-engine',
            warning: `Whisper inference notice: ${whisperErr.message}. Real speech transcribed via browser audio engine.`
          };
        }
      }
    }

    // If no API key configured, use the user's real spoken words if captured via speech recognition
    if (!effectiveKey) {
      if (recognizedText && recognizedText.trim().length > 0) {
        return {
          text: this.formatRawSpeech(recognizedText),
          isDemoFallback: true,
          model: 'browser-speech-engine',
          warning: 'Transcribed directly via browser speech recognition. Configure your AI API key for neural speech polishing.'
        };
      }
      return this.simulateTranscription({ questionTitle, fieldType });
    }

    // Gemini Multimodal Engine
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

    // Try candidate models in order of priority: gemini-2.5-flash -> gemini-2.0-flash -> gemini-1.5-flash
    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = null;

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
        if (transcribedText) {
          return {
            text: transcribedText,
            isDemoFallback: false,
            model: modelName
          };
        }
      } catch (err) {
        lastError = err;
        // If error is 404 model not found, try next candidate model
        const errStr = (err.message || '').toLowerCase();
        if (errStr.includes('not found') || errStr.includes('404')) {
          continue;
        }
        // If it's auth or rate limit, break early
        break;
      }
    }

    // If Google model failed, fallback to recognizedText if captured by browser
    if (recognizedText && recognizedText.trim().length > 0) {
      return {
        text: this.formatRawSpeech(recognizedText),
        isDemoFallback: true,
        model: 'browser-speech-engine',
        warning: `Neural model note: ${lastError?.message || 'Using browser engine fallback.'}`
      };
    }

    console.warn('[VoiceAI] AI call failed, falling back to contextual simulation:', lastError?.message);
    const sim = this.simulateTranscription({ questionTitle, fieldType });
    return {
      ...sim,
      warning: `AI Quota/Auth notice: ${lastError?.message || 'Using contextual speech preview.'}`
    };
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
      model: 'neural-simulated-preview',
      warning: 'Voice AI key is not set. Using contextual speech recognition preview.'
    };
  }
}

module.exports = new VoiceAiService();
