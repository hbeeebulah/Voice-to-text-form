import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, X, Loader2, Sparkles, AlertCircle, Plus, RefreshCw, Volume2 } from 'lucide-react';
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
  const [status, setStatus] = useState('idle'); // 'idle' | 'recording' | 'transcribing' | 'deciding' | 'error'
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stream, setStream] = useState(null);
  const [pendingText, setPendingText] = useState('');
  const [transcriptionInfo, setTranscriptionInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const mimeTypeRef = useRef('audio/webm');

  // Clean up on unmount
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

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Audio recording is not supported in this browser. Please use Chrome, Edge, or Firefox.');
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

      // Determine supported mime type
      const possibleTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/aac'
      ];
      let selectedMime = '';
      for (const t of possibleTypes) {
        if (MediaRecorder.isTypeSupported(t)) {
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

      recorder.start(250); // Slice data every 250ms
      setStatus('recording');
      setElapsedTime(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime(prev => {
          if (prev >= 120) { // 2 minute max limit
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
        setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No microphone device found on your system.');
      } else {
        setErrorMessage(`Microphone error: ${err.message}`);
      }
      setStatus('error');
      cleanupAudio();
    }
  };

  const stopRecording = () => {
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
    setStatus('idle');
    setElapsedTime(0);
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAudioProcessing = async (blob) => {
    try {
      setStatus('transcribing');
      const base64 = await blobToBase64(blob);

      const result = await transcribeAudio({
        audioBase64: base64,
        mimeType: mimeTypeRef.current,
        questionTitle,
        questionDescription,
        fieldType,
        existingText: currentValue,
        apiKey
      });

      const transcribed = result.text || '';
      setTranscriptionInfo(result);

      if (!transcribed) {
        setErrorMessage('No discernible speech was detected. Please try speaking closer to the microphone.');
        setStatus('error');
        return;
      }

      // If current value already exists, let the user choose append or replace
      if (currentValue && currentValue.trim().length > 0) {
        setPendingText(transcribed);
        setStatus('deciding');
      } else {
        // Direct populate
        onTranscriptionComplete(transcribed, 'replace');
        setStatus('idle');
      }
    } catch (err) {
      console.error('Transcription API error:', err);
      setErrorMessage(err.message || 'Speech-to-text service is currently unavailable. Please try again.');
      setStatus('error');
    }
  };

  const handleAppend = () => {
    const separator = fieldType === 'paragraph' ? '\n\n' : ' ';
    const combined = `${currentValue.trim()}${separator}${pendingText.trim()}`;
    onTranscriptionComplete(combined, 'append');
    setStatus('idle');
    setPendingText('');
  };

  const handleReplace = () => {
    onTranscriptionComplete(pendingText.trim(), 'replace');
    setStatus('idle');
    setPendingText('');
  };

  return (
    <div className="w-full mt-2">
      {/* Idle Trigger Button */}
      {status === 'idle' && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startRecording}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-all border border-slate-200 hover:border-indigo-300 shadow-sm"
            title="Click to dictate using Gemini AI speech-to-text"
          >
            <Mic className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
            <span>Dictate with Gemini</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">
              AI
            </span>
          </button>
        </div>
      )}

      {/* Active Recording State */}
      {status === 'recording' && (
        <div className="p-3.5 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-purple-50/60 to-pink-50/60 shadow-sm transition-all animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Listening...
              </span>
              <span className="text-xs font-mono font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                {formatTimer(elapsedTime)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                title="Stop recording and transcribe"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Done</span>
              </button>
              <button
                type="button"
                onClick={cancelRecording}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
                title="Cancel recording"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Soundwave frequency visualizer */}
          <div className="py-1">
            <SoundwaveVisualizer stream={stream} isRecording={true} color={accentColor} height={42} />
          </div>

          <div className="text-center text-[11px] text-slate-500 mt-1 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Speak naturally. Gemini will automatically strip filler words and format punctuation.</span>
          </div>
        </div>
      )}

      {/* Transcribing State */}
      {status === 'transcribing' && (
        <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 shadow-sm flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            <div>
              <p className="text-xs font-medium text-indigo-900">
                Transcribing & Polishing Audio with Gemini...
              </p>
              <p className="text-[11px] text-indigo-600">
                Removing 'um', 'uh', formatting capitalization and punctuation
              </p>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
        </div>
      )}

      {/* Decision: Append or Replace if existing text exists */}
      {status === 'deciding' && (
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 shadow-sm animate-fadeIn">
          <p className="text-xs font-medium text-amber-900 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Transcribed: "{pendingText}"
          </p>
          <p className="text-[11px] text-amber-700 mb-2.5">
            You already have text in this field. How would you like to apply the transcribed speech?
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAppend}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Append to Existing</span>
            </button>
            <button
              type="button"
              onClick={handleReplace}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 shadow-sm transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Replace All</span>
            </button>
            <button
              type="button"
              onClick={() => { setStatus('idle'); setPendingText(''); }}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Error / Permission Denied State */}
      {status === 'error' && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs shadow-sm flex items-start justify-between gap-2 animate-fadeIn">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">
                {permissionDenied ? 'Microphone Permission Blocked' : 'Transcription Notice'}
              </p>
              <p className="text-[11px] mt-0.5 leading-relaxed">{errorMessage}</p>
              {permissionDenied && (
                <p className="text-[10px] text-red-600 mt-1 italic">
                  Tip: Look for the microphone or lock icon in your browser URL bar to change permissions to "Allow", then try again.
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={startRecording}
              className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded font-medium text-[11px] transition-colors"
            >
              Retry
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
