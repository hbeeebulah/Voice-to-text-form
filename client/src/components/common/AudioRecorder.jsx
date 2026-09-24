import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  X,
  Loader2,
  Sparkles,
  AlertCircle,
  Check,
  Undo2,
  Volume2
} from 'lucide-react';
import SoundwaveVisualizer from './SoundwaveVisualizer';
import { transcribeAudio } from '../../services/api';

export default function AudioRecorder({
  questionTitle,
  questionDescription,
  fieldType = 'paragraph',
  currentValue = '',
  onTranscriptionComplete,
  accentColor = '#6366f1',
  apiKey = ''
}) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'recording' | 'transcribing' | 'success' | 'error'
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stream, setStream] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [lastInsertedText, setLastInsertedText] = useState('');
  const [previousValueBeforeInsert, setPreviousValueBeforeInsert] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const mimeTypeRef = useRef('audio/webm');
  const recognitionRef = useRef(null);
  const transcriptAccumulatorRef = useRef('');

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  const cleanupAudio = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setErrorMessage('');
    setPermissionDenied(false);
    setLiveTranscript('');
    transcriptAccumulatorRef.current = '';

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Audio recording is not supported in this browser. Please use Chrome, Edge, or Safari.');
      setStatus('error');
      return;
    }

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setStream(audioStream);

      // 1. Initialize real-time browser SpeechRecognition (Web Speech API)
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = navigator.language || 'en-US';

          recognition.onresult = (event) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + ' ';
            }
            const cleanText = fullText.trim();
            setLiveTranscript(cleanText);
            transcriptAccumulatorRef.current = cleanText;
          };

          recognition.onerror = (e) => {
            console.warn('SpeechRecognition warning:', e.error);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (err) {
          console.warn('SpeechRecognition initialization skipped:', err);
        }
      }

      // 2. Determine supported MediaRecorder mime type
      const possibleTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/aac'
      ];
      let selectedMime = '';
      for (const t of possibleTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
          selectedMime = t;
          break;
        }
      }
      mimeTypeRef.current = selectedMime || 'audio/webm';

      const options = selectedMime ? { mimeType: selectedMime } : {};
      const recorder = new MediaRecorder(audioStream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
        await handleAudioProcessing(audioBlob);
      };

      recorder.start(250);
      setStatus('recording');
      setElapsedTime(0);

      // Start elapsed timer
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime(prev => {
          if (prev >= 120) {
            stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Microphone error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser URL bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No microphone device detected on your system.');
      } else {
        setErrorMessage(`Microphone error: ${err.message}`);
      }
      setStatus('error');
      cleanupAudio();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    setStatus('transcribing');
  };

  const cancelRecording = () => {
    cleanupAudio();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    setLiveTranscript('');
    setStatus('idle');
    setElapsedTime(0);
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAudioProcessing = async (blob) => {
    try {
      setStatus('transcribing');
      const base64 = await blobToBase64(blob);
      const recognized = transcriptAccumulatorRef.current || liveTranscript || '';

      const result = await transcribeAudio({
        audioBase64: base64,
        mimeType: mimeTypeRef.current,
        questionTitle,
        questionDescription,
        fieldType,
        existingText: currentValue,
        apiKey,
        recognizedText: recognized
      });

      const transcribed = (result.text || recognized || '').trim();

      if (!transcribed) {
        setErrorMessage('No speech was detected. Please try speaking closer to your microphone.');
        setStatus('error');
        return;
      }

      // Save previous value for Undo capability
      setPreviousValueBeforeInsert(currentValue || '');
      setLastInsertedText(transcribed);

      // Directly populate or append to the text field
      let updatedValue = transcribed;
      if (currentValue && currentValue.trim().length > 0) {
        const separator = fieldType === 'paragraph' ? '\n\n' : ' ';
        updatedValue = `${currentValue.trim()}${separator}${transcribed}`;
      }

      onTranscriptionComplete(updatedValue, 'append');
      setStatus('success');

      // Auto-hide success state after 4 seconds
      setTimeout(() => {
        setStatus(curr => (curr === 'success' ? 'idle' : curr));
      }, 4000);

    } catch (err) {
      console.error('Transcription API error:', err);
      // Fallback: If we captured live speech from the browser engine, insert it anyway!
      const fallbackSpeech = transcriptAccumulatorRef.current || liveTranscript || '';
      if (fallbackSpeech.trim().length > 0) {
        setPreviousValueBeforeInsert(currentValue || '');
        setLastInsertedText(fallbackSpeech.trim());

        let updatedValue = fallbackSpeech.trim();
        if (currentValue && currentValue.trim().length > 0) {
          const separator = fieldType === 'paragraph' ? '\n\n' : ' ';
          updatedValue = `${currentValue.trim()}${separator}${fallbackSpeech.trim()}`;
        }

        onTranscriptionComplete(updatedValue, 'append');
        setStatus('success');
      } else {
        setErrorMessage(err.message || 'Speech-to-text service is temporarily unavailable. Please try speaking again.');
        setStatus('error');
      }
    }
  };

  const handleUndo = () => {
    onTranscriptionComplete(previousValueBeforeInsert, 'replace');
    setStatus('idle');
  };

  return (
    <div className="w-full mt-2">
      {/* 1. Idle Trigger Button */}
      {status === 'idle' && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startRecording}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-all border border-slate-200 hover:border-indigo-300 shadow-2xs"
            title="Click and speak into your microphone to dictate"
          >
            <Mic className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
            <span>Dictate with Voice</span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
              AI
            </span>
          </button>
        </div>
      )}

      {/* 2. Active Recording State */}
      {status === 'recording' && (
        <div className="p-3.5 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-purple-50/70 to-pink-50/70 shadow-sm transition-all animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Listening...
              </span>
              <span className="text-xs font-mono font-semibold text-slate-600 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200">
                {formatTimer(elapsedTime)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-1 px-3.5 py-1 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all hover:scale-102"
                title="Stop recording and write speech into field"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Done</span>
              </button>
              <button
                type="button"
                onClick={cancelRecording}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Soundwave Frequency Visualizer */}
          <div className="py-1">
            <SoundwaveVisualizer stream={stream} isRecording={true} color={accentColor} height={40} />
          </div>

          {/* Live Real-Time Speech Subtitles */}
          {liveTranscript && (
            <div className="mt-2 p-2 bg-white/80 rounded-xl border border-indigo-100 text-xs text-indigo-950 font-medium animate-fadeIn">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-0.5">
                Heard live:
              </span>
              <p className="italic">"{liveTranscript}"</p>
            </div>
          )}

          <div className="text-center text-[11px] text-slate-500 mt-2 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Speak naturally. Your words will automatically be formatted and inserted into this field.</span>
          </div>
        </div>
      )}

      {/* 3. Transcribing / Polishing State */}
      {status === 'transcribing' && (
        <div className="p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/70 shadow-sm flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            <div>
              <p className="text-xs font-bold text-indigo-950">
                Transcribing & Polishing Speech...
              </p>
              <p className="text-[11px] text-indigo-700">
                Removing filler words ('um', 'uh') and inserting text directly into field
              </p>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
        </div>
      )}

      {/* 4. Success State (Text inserted directly with Undo option) */}
      {status === 'success' && (
        <div className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 shadow-2xs flex items-center justify-between gap-2 animate-fadeIn text-xs text-emerald-800">
          <div className="flex items-center gap-2 min-w-0">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold">Speech transcribed and inserted!</span>
              <span className="text-[11px] text-emerald-700 block truncate max-w-xs sm:max-w-md">
                "{lastInsertedText}"
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition-colors"
              title="Undo voice insertion"
            >
              <Undo2 className="w-3 h-3" />
              <span>Undo</span>
            </button>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="p-1 text-emerald-600 hover:text-emerald-900 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Error State */}
      {status === 'error' && (
        <div className="p-3 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-xs shadow-2xs flex items-start justify-between gap-2 animate-fadeIn">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800">
                {permissionDenied ? 'Microphone Access Required' : 'Voice Input Notice'}
              </p>
              <p className="text-[11px] mt-0.5 leading-relaxed">{errorMessage}</p>
              {permissionDenied && (
                <p className="text-[10px] text-red-600 mt-1">
                  Click the lock or camera/mic icon next to the URL in your browser bar, choose <strong>Allow</strong> for Microphone, and click Try Again.
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={startRecording}
              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-bold text-[11px] transition-colors"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="p-1 text-red-400 hover:text-red-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
