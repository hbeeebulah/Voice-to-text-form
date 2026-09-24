import React, { useEffect, useRef } from 'react';

export default function SoundwaveVisualizer({ stream, isRecording, color = '#6366f1', height = 48 }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (!isRecording) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let analyser;
    let dataArray;

    if (stream) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
      } catch (e) {
        console.warn('AudioContext failed to initialize, using fallback animation:', e);
      }
    }

    let phase = 0;

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);

      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
      }

      // Draw 24 animated equalizer soundwave bars
      const numBars = 28;
      const barSpacing = 4;
      const totalWidth = numBars * barSpacing * 2;
      const startX = (width - totalWidth) / 2;

      phase += 0.08;

      for (let i = 0; i < numBars; i++) {
        let value = 0.2;

        if (analyser && dataArray && dataArray.length > 0) {
          const index = Math.floor((i / numBars) * (dataArray.length / 2));
          value = Math.max(0.15, dataArray[index] / 255);
        } else {
          // Synthetic audio wave animation if analyser is not available
          value = 0.25 + 0.6 * Math.sin(phase + i * 0.4) * Math.cos(phase * 0.7 + i * 0.2);
          value = Math.max(0.15, Math.abs(value));
        }

        const barHeight = Math.max(6, value * (h - 8));
        const x = startX + i * (barSpacing * 2);
        const y = (h - barHeight) / 2;

        // Gradient bar
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, '#a855f7');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, 4, barHeight, 2);
        ctx.fill();
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isRecording, stream, color]);

  return (
    <div className="w-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={320}
        height={height}
        className="w-full max-w-[320px] rounded-lg"
      />
    </div>
  );
}
