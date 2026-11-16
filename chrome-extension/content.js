/**
 * VoxForm Voice-to-Text for Google Forms — Content Script
 * Automatically injects "Dictate with VoxForm" microphone controls into every
 * Short Answer and Paragraph field on docs.google.com/forms/* and dynamically
 * matches the background and theme colors of the active Google Form.
 */

(function () {
  // Only run on Responder views (/viewform or /formResponse), skip the Creator Editor (/edit)
  if (window.location.pathname.endsWith('/edit')) {
    return;
  }

  let isExtensionEnabled = true;
  let preferredLang = '';

  chrome.storage.sync.get(['voxformEnabled', 'voxformLang'], (res) => {
    isExtensionEnabled = res.voxformEnabled !== false;
    preferredLang = res.voxformLang || '';
    if (isExtensionEnabled) {
      scanAndInjectMicButtons();
    }
  });

  // Watch for dynamic page transitions (multi-section Google Forms)
  const observer = new MutationObserver(() => {
    if (isExtensionEnabled) {
      scanAndInjectMicButtons();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  /**
   * Parse an rgb/rgba string into { r, g, b, a }
   */
  function parseRgb(colorStr) {
    if (!colorStr || typeof colorStr !== 'string') return null;
    const m = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
    if (!m) return null;
    const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
    if (a === 0) return null;
    return {
      r: parseInt(m[1], 10),
      g: parseInt(m[2], 10),
      b: parseInt(m[3], 10),
      a
    };
  }

  /**
   * Compute relative luminance (0 = black, 1 = white)
   */
  function getLuminance({ r, g, b }) {
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  /**
   * Detect the Google Form's background color, card surface color, and theme accent color
   * and apply them as CSS variables on the widget container.
   */
  function applyGoogleFormTheme(container, questionCard) {
    // 1. Detect the Google Form page background color (e.g., pastel purple, blue, green, etc.)
    const bgCandidates = [
      document.body,
      document.querySelector('.freebirdFormviewerViewFormContentWrapper'),
      document.querySelector('.o3Dpx'),
      document.documentElement
    ].filter(Boolean);

    let formBgRgb = null;
    for (const el of bgCandidates) {
      const rgb = parseRgb(window.getComputedStyle(el).backgroundColor);
      if (rgb) {
        formBgRgb = rgb;
        break;
      }
    }
    if (!formBgRgb) {
      formBgRgb = { r: 240, g: 235, b: 248, a: 1 };
    }

    // 2. Detect the question card's surface color (usually white or dark card surface)
    let cardSurfaceRgb = null;
    if (questionCard) {
      const innerCard = questionCard.querySelector('.geS5n') || questionCard;
      cardSurfaceRgb = parseRgb(window.getComputedStyle(innerCard).backgroundColor);
    }
    if (!cardSurfaceRgb) {
      cardSurfaceRgb = { r: 255, g: 255, b: 255, a: 1 };
    }

    // 3. Detect the Google Form's primary theme accent color (from top header bar or submit button)
    const accentSelectors = [
      '.RVEQke',
      '.vnFTpb',
      '.freebirdSolidBackground',
      '.NPEfkd',
      'div[role="button"].uArJ5e'
    ];
    let accentRgb = null;
    for (const sel of accentSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const rgb = parseRgb(window.getComputedStyle(el).backgroundColor);
        // Ensure it's not pure white/transparent
        if (rgb && !(rgb.r > 245 && rgb.g > 245 && rgb.b > 245)) {
          accentRgb = rgb;
          break;
        }
      }
    }

    if (!accentRgb) {
      // Derive a deeper accent shade from the form's background color
      accentRgb = {
        r: Math.max(25, Math.round(formBgRgb.r * 0.55)),
        g: Math.max(25, Math.round(formBgRgb.g * 0.55)),
        b: Math.max(25, Math.round(formBgRgb.b * 0.55)),
        a: 1
      };
    }

    const bgLum = getLuminance(formBgRgb);
    const isDarkBg = bgLum < 0.45;
    const accentLum = getLuminance(accentRgb);

    const bgCss = `rgb(${formBgRgb.r}, ${formBgRgb.g}, ${formBgRgb.b})`;
    const surfaceCss = `rgb(${cardSurfaceRgb.r}, ${cardSurfaceRgb.g}, ${cardSurfaceRgb.b})`;
    const accentCss = `rgb(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b})`;
    const accentSoftCss = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.15)`;
    const borderCss = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.32)`;
    const accentTextCss = accentLum > 0.6 ? '#0f172a' : '#ffffff';
    const textCss = isDarkBg ? '#f8fafc' : '#1f2937';
    const textMutedCss = isDarkBg ? '#cbd5e1' : '#4b5563';

    container.style.setProperty('--vf-bg', bgCss);
    container.style.setProperty('--vf-surface', surfaceCss);
    container.style.setProperty('--vf-border', borderCss);
    container.style.setProperty('--vf-accent', accentCss);
    container.style.setProperty('--vf-accent-soft', accentSoftCss);
    container.style.setProperty('--vf-accent-text', accentTextCss);
    container.style.setProperty('--vf-text', textCss);
    container.style.setProperty('--vf-text-muted', textMutedCss);
  }

  /**
   * Find all text inputs and textareas inside Google Form question cards
   */
  function scanAndInjectMicButtons() {
    const inputs = document.querySelectorAll(
      'div[role="listitem"] input[type="text"], ' +
      'div[role="listitem"] input[type="email"], ' +
      'div[role="listitem"] input[type="url"], ' +
      'div[role="listitem"] input[type="tel"], ' +
      'div[role="listitem"] textarea'
    );

    inputs.forEach((inputEl) => {
      if (inputEl.dataset.voxformAttached === 'true') return;
      inputEl.dataset.voxformAttached = 'true';

      const questionCard = inputEl.closest('div[role="listitem"]');
      const headingEl = questionCard ? questionCard.querySelector('[role="heading"]') : null;
      const questionTitle = headingEl ? headingEl.innerText.replace(/\*\s*$/, '').trim() : 'Form Question';
      const fieldType = inputEl.tagName.toLowerCase() === 'textarea' ? 'paragraph' : 'short_answer';

      // Find the best anchor container directly below the input line
      const inputWrapper =
        inputEl.closest('.rFrNMe') ||
        inputEl.closest('.Pc9Gce') ||
        inputEl.parentElement;

      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'voxform-ext-container';

      // Match the Google Form's background and theme colors
      applyGoogleFormTheme(widgetContainer, questionCard);

      if (inputWrapper && inputWrapper.parentElement) {
        inputWrapper.parentElement.insertBefore(widgetContainer, inputWrapper.nextSibling);
      } else {
        inputEl.insertAdjacentElement('afterend', widgetContainer);
      }

      mountVoxFormWidget(widgetContainer, inputEl, {
        questionTitle,
        fieldType,
        questionCard
      });
    });
  }

  /**
   * Native value setter that triggers Google Forms' internal Closure/Wiz state & validation
   */
  function setGoogleFormInputValue(inputEl, newValue) {
    inputEl.focus();

    const prototype =
      inputEl.tagName.toLowerCase() === 'textarea'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;

    const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (nativeValueSetter) {
      nativeValueSetter.call(inputEl, newValue);
    } else {
      inputEl.value = newValue;
    }

    inputEl.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: newValue
      })
    );
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Fallback client-side speech formatter if server is offline
   */
  function formatLocalSpeech(text, fieldType) {
    if (!text || !text.trim()) return '';
    let cleaned = text.trim();
    cleaned = cleaned.replace(/\b(um|uh|er|ah|like you know|you know|sort of)\b/gi, '');
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      const wordCount = cleaned.split(/\s+/).length;
      if (fieldType === 'paragraph' && wordCount > 4 && !/[.?!]$/.test(cleaned)) {
        cleaned += '.';
      }
    }
    return cleaned;
  }

  /**
   * Mount interactive microphone recorder UI for a specific Google Form input
   */
  function mountVoxFormWidget(container, inputEl, { questionTitle, fieldType, questionCard }) {
    let status = 'idle'; // 'idle' | 'recording' | 'transcribing' | 'success' | 'error'
    let elapsed = 0;
    let timerId = null;
    let recognition = null;
    let mediaRecorder = null;
    let audioStream = null;
    let audioChunks = [];
    let selectedMime = 'audio/webm';
    let isRecording = false;
    let processingStarted = false;
    let finalizedSegments = [];
    let currentSessionTranscript = '';
    let liveTranscript = '';
    let previousValue = '';
    let lastInserted = '';
    let errorMessage = '';

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    function formatTime(secs) {
      const m = Math.floor(secs / 60).toString().padStart(2, '0');
      const s = (secs % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }

    function cleanup() {
      isRecording = false;
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      if (recognition) {
        try {
          recognition.onend = null;
          recognition.abort();
        } catch {}
        recognition = null;
      }
      if (audioStream) {
        try {
          audioStream.getTracks().forEach((t) => t.stop());
        } catch {}
        audioStream = null;
      }
    }

    function blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    async function startRecording() {
      // Refresh theme variables in case the form updated its styles
      applyGoogleFormTheme(container, questionCard);

      errorMessage = '';
      liveTranscript = '';
      finalizedSegments = [];
      currentSessionTranscript = '';
      processingStarted = false;
      mediaRecorder = null;
      audioChunks = [];

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      // On mobile Chrome/Safari, give SpeechRecognition exclusive access to the mic
      if (isMobile && SpeechRecognition) {
        try {
          recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = preferredLang || navigator.language || 'en-US';

          recognition.onresult = (event) => {
            let sessionText = '';
            for (let i = 0; i < event.results.length; i++) {
              sessionText += event.results[i][0].transcript + ' ';
            }
            currentSessionTranscript = sessionText.trim();
            liveTranscript = [...finalizedSegments, currentSessionTranscript].filter(Boolean).join(' ').trim();
            render();
          };

          recognition.onerror = (e) => {
            if (e.error === 'not-allowed' || e.error === 'permission-denied') {
              isRecording = false;
              errorMessage = 'Microphone access denied. Please allow mic access in your browser.';
              status = 'error';
              cleanup();
              render();
            }
          };

          recognition.onend = () => {
            if (currentSessionTranscript) {
              finalizedSegments.push(currentSessionTranscript);
              currentSessionTranscript = '';
              liveTranscript = finalizedSegments.filter(Boolean).join(' ').trim();
            }
            if (isRecording) {
              try {
                recognition.start();
              } catch {}
            } else if (!processingStarted) {
              processingStarted = true;
              processTranscription(null);
            }
          };

          isRecording = true;
          recognition.start();
          status = 'recording';
          startTimer();
          render();
          return;
        } catch (err) {
          isRecording = false;
        }
      }

      // Desktop: record audio + live browser speech recognition
      try {
        try {
          audioStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          });
        } catch {
          audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        isRecording = true;

        if (!isMobile && SpeechRecognition) {
          try {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = preferredLang || navigator.language || 'en-US';
            recognition.onresult = (event) => {
              let fullText = '';
              for (let i = 0; i < event.results.length; i++) {
                fullText += event.results[i][0].transcript + ' ';
              }
              liveTranscript = fullText.trim();
              render();
            };
            recognition.start();
          } catch {}
        }

        const possibleTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
        selectedMime = possibleTypes.find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) || 'audio/webm';

        mediaRecorder = new MediaRecorder(audioStream, { mimeType: selectedMime });
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunks.push(e.data);
        };
        mediaRecorder.onstop = async () => {
          if (audioStream) {
            audioStream.getTracks().forEach((t) => t.stop());
            audioStream = null;
          }
          if (!processingStarted) {
            processingStarted = true;
            const blob = new Blob(audioChunks, { type: selectedMime });
            await processTranscription(blob);
          }
        };

        mediaRecorder.start(250);
        status = 'recording';
        startTimer();
        render();
      } catch (err) {
        errorMessage = 'Microphone permission is required to dictate answers.';
        status = 'error';
        cleanup();
        render();
      }
    }

    function startTimer() {
      elapsed = 0;
      if (timerId) clearInterval(timerId);
      timerId = setInterval(() => {
        elapsed += 1;
        if (elapsed >= 120) {
          stopRecording();
        } else {
          render();
        }
      }, 1000);
    }

    function stopRecording() {
      isRecording = false;
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      status = 'transcribing';
      render();

      if (recognition) {
        try {
          recognition.stop();
        } catch {}
      }

      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try {
          mediaRecorder.stop();
        } catch {}
      } else {
        setTimeout(() => {
          if (!processingStarted) {
            processingStarted = true;
            if (currentSessionTranscript) {
              finalizedSegments.push(currentSessionTranscript);
              currentSessionTranscript = '';
            }
            liveTranscript = finalizedSegments.filter(Boolean).join(' ').trim() || liveTranscript;
            processTranscription(null);
          }
        }, 400);
      }
    }

    function cancelRecording() {
      processingStarted = true;
      cleanup();
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.ondataavailable = null;
        mediaRecorder.onstop = null;
        try {
          mediaRecorder.stop();
        } catch {}
      }
      liveTranscript = '';
      status = 'idle';
      render();
    }

    async function processTranscription(blob) {
      status = 'transcribing';
      render();

      let base64 = '';
      if (blob && blob.size > 0) {
        try {
          base64 = await blobToBase64(blob);
        } catch {}
      }

      const recognized = (liveTranscript || '').trim();
      if (!base64 && !recognized) {
        errorMessage = 'No speech detected. Please speak clearly into your microphone.';
        status = 'error';
        render();
        return;
      }

      try {
        const response = await chrome.runtime.sendMessage({
          type: 'VOXFORM_TRANSCRIBE',
          payload: {
            audioBase64: base64,
            mimeType: selectedMime,
            questionTitle,
            fieldType,
            existingText: inputEl.value || '',
            recognizedText: recognized
          }
        });

        let finalText = '';
        if (response && response.success && response.data?.text) {
          finalText = response.data.text.trim();
        } else if (recognized) {
          finalText = formatLocalSpeech(recognized, fieldType);
        } else {
          throw new Error(response?.error || 'Could not transcribe audio.');
        }

        insertIntoGoogleForm(finalText);
      } catch (err) {
        if (recognized) {
          insertIntoGoogleForm(formatLocalSpeech(recognized, fieldType));
        } else {
          errorMessage = err.message || 'Voice transcription failed.';
          status = 'error';
          render();
        }
      }
    }

    function insertIntoGoogleForm(transcribedText) {
      previousValue = inputEl.value || '';
      lastInserted = transcribedText;

      let nextVal = transcribedText;
      if (previousValue.trim().length > 0) {
        const sep = fieldType === 'paragraph' ? '\n\n' : ' ';
        nextVal = `${previousValue.trim()}${sep}${transcribedText}`;
      }

      setGoogleFormInputValue(inputEl, nextVal);
      status = 'success';
      render();

      setTimeout(() => {
        if (status === 'success') {
          status = 'idle';
          render();
        }
      }, 4500);
    }

    function undoInsert() {
      setGoogleFormInputValue(inputEl, previousValue);
      status = 'idle';
      render();
    }

    function render() {
      container.innerHTML = '';

      if (status === 'idle') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'voxform-ext-idle-btn';
        btn.innerHTML = `
          <span class="voxform-ext-mic-dot">🎙️</span>
          <span>Dictate with VoxForm</span>
          <span class="voxform-ext-badge">VOICE AI</span>
        `;
        btn.addEventListener('click', startRecording);
        container.appendChild(btn);
        return;
      }

      if (status === 'recording') {
        const card = document.createElement('div');
        card.className = 'voxform-ext-card';

        const header = document.createElement('div');
        header.className = 'voxform-ext-header';

        const statusLeft = document.createElement('div');
        statusLeft.className = 'voxform-ext-status';
        statusLeft.innerHTML = `
          <span class="voxform-ext-pulse"></span>
          <span>Listening...</span>
          <span class="voxform-ext-timer">${formatTime(elapsed)}</span>
        `;

        const actions = document.createElement('div');
        actions.className = 'voxform-ext-actions';

        const doneBtn = document.createElement('button');
        doneBtn.type = 'button';
        doneBtn.className = 'voxform-ext-done-btn';
        doneBtn.textContent = '■ Done';
        doneBtn.addEventListener('click', stopRecording);

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'voxform-ext-cancel-btn';
        cancelBtn.textContent = '✕';
        cancelBtn.addEventListener('click', cancelRecording);

        actions.appendChild(doneBtn);
        actions.appendChild(cancelBtn);
        header.appendChild(statusLeft);
        header.appendChild(actions);
        card.appendChild(header);

        if (liveTranscript) {
          const liveBox = document.createElement('div');
          liveBox.className = 'voxform-ext-live-box';
          liveBox.textContent = `"${liveTranscript}"`;
          card.appendChild(liveBox);
        }

        container.appendChild(card);
        return;
      }

      if (status === 'transcribing') {
        const card = document.createElement('div');
        card.className = 'voxform-ext-card';
        card.textContent = '✨ Transcribing & polishing speech...';
        container.appendChild(card);
        return;
      }

      if (status === 'success') {
        const box = document.createElement('div');
        box.className = 'voxform-ext-success';

        const textSpan = document.createElement('span');
        textSpan.textContent = `✓ Inserted: "${lastInserted.slice(0, 48)}${lastInserted.length > 48 ? '...' : ''}"`;

        const undoBtn = document.createElement('button');
        undoBtn.type = 'button';
        undoBtn.className = 'voxform-ext-undo-btn';
        undoBtn.textContent = 'Undo';
        undoBtn.addEventListener('click', undoInsert);

        box.appendChild(textSpan);
        box.appendChild(undoBtn);
        container.appendChild(box);
        return;
      }

      if (status === 'error') {
        const box = document.createElement('div');
        box.className = 'voxform-ext-error';

        const errSpan = document.createElement('span');
        errSpan.textContent = `⚠️ ${errorMessage}`;

        const retryBtn = document.createElement('button');
        retryBtn.type = 'button';
        retryBtn.className = 'voxform-ext-undo-btn';
        retryBtn.textContent = 'Try Again';
        retryBtn.addEventListener('click', startRecording);

        box.appendChild(errSpan);
        box.appendChild(retryBtn);
        container.appendChild(box);
      }
    }

    render();
  }
})();
