import React, { useState, useEffect } from 'react';

export default function LandingPage({
  onOpenAuth,
  onOpenResponderDemo,
  onExploreDashboard
}) {
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [isRecordingSandbox, setIsRecordingSandbox] = useState(true);
  const [sandboxTimer, setSandboxTimer] = useState(11);
  const [sandboxLang, setSandboxLang] = useState('en');

  const demoPrompts = [
    {
      question: "“Tell us what makes your product design philosophy unique.”",
      transcript: "“Our philosophy centers on atomic token consistency and reducing friction between thought and interface. When users dictate, they speak in stream-of-consciousness narratives that traditional form fields discard...”"
    },
    {
      question: "“Describe the toughest engineering bug you solved in the past quarter.”",
      transcript: "“We encountered an elusive race condition in our WebSocket synchronization layer when users switched network tabs during audio buffer flushes. Profiling memory leaks revealed a dangling AudioContext node...”"
    },
    {
      question: "“What was the defining factor that made you switch to VoxForm?”",
      transcript: "“Their typing latency and static form drop-offs were brutal. Once we shifted to voice dictation, completion rates surged by 3x and response detail was significantly deeper...”"
    }
  ];

  useEffect(() => {
    let interval = null;
    if (isRecordingSandbox) {
      interval = setInterval(() => {
        setSandboxTimer((prev) => (prev >= 60 ? 1 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecordingSandbox]);

  // Keyboard shortcut: Space toggles microphone in playground
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsRecordingSandbox((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentPrompt = demoPrompts[activePromptIndex];

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col relative overflow-x-hidden">
      {/* 1. FLOATING HEADER CAPSULE (Stitch 05 Header) */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-center pt-4 px-4 sm:px-8 pointer-events-none">
        <div className="w-full max-w-7xl h-16 sm:h-20 rounded-full bg-surface-container-low/80 backdrop-blur-xl px-5 sm:px-8 flex items-center justify-between pointer-events-auto border border-outline-variant/30 shadow-[0_20px_50px_-10px_rgba(2,6,23,0.85)]">
          <div className="flex items-center gap-6">
            <div
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:text-tertiary transition-colors shadow-[0_0_16px_rgba(192,193,255,0.25)] border border-outline-variant/30">
                <span className="material-symbols-outlined text-[20px]">graphic_eq</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-base sm:text-lg text-on-surface tracking-tight font-bold">
                  Vox<span className="text-primary">Form</span>
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-secondary-container/40 text-secondary border border-secondary/20 font-bold">
                  AI
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-full bg-gradient-to-r from-inverse-primary to-secondary-container text-on-surface text-xs sm:text-sm font-semibold shadow-[0_0_24px_rgba(73,75,214,0.4)] hover:shadow-[0_0_32px_rgba(87,27,193,0.6)] transition-all cursor-pointer"
            >
              <span>Get Started Free</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 ml-1">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <main className="w-full pt-20 bg-surface min-h-screen">
        <div className="flex flex-col w-full">
          {/* Top Ambient Glow Field */}
          <div className="relative w-full overflow-hidden">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[840px] h-[480px] bg-gradient-to-b from-secondary-container/20 via-inverse-primary/10 to-transparent blur-3xl pointer-events-none rounded-full" />
            <div className="absolute top-96 right-[-10%] w-[500px] h-[500px] bg-tertiary-container/10 blur-[120px] pointer-events-none rounded-full" />

            <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-16 sm:pt-24 pb-20 flex flex-col items-center text-center">
              {/* Announcement Pill Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high/80 backdrop-blur-md shadow-lg shadow-black/40 border border-outline-variant/30 mb-6">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
                </span>
                <span className="font-mono text-xs text-on-surface tracking-wide">
                  Introducing Whisper v3 Turbo Engine · 3x Faster Audio Forms
                </span>
                <span className="material-symbols-outlined text-[14px] text-primary">arrow_forward</span>
              </div>

              {/* Headline */}
              <h1 className="font-headline-lg text-4xl sm:text-6xl lg:text-7xl font-extrabold text-on-surface max-w-5xl tracking-tight leading-tight">
                Forms Built for{' '}
                <span className="bg-gradient-to-r from-primary via-secondary to-tertiary-fixed bg-clip-text text-transparent">
                  the Voice Era
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 text-sm sm:text-base md:text-lg text-on-surface-variant max-w-2xl text-center leading-relaxed">
                Replace friction-heavy typing with conversational, high-fidelity voice dictation. Collect authentic feedback, conduct candidate screenings, and triple form completion rates with neural speech synthesis.
              </p>

              {/* Primary CTA Row */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-inverse-primary via-secondary-container to-primary-container text-on-surface text-sm sm:text-base font-semibold shadow-[0_0_36px_rgba(73,75,214,0.45)] hover:shadow-[0_0_48px_rgba(87,27,193,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-tertiary">auto_awesome</span>
                  <span>Start Building Free</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenResponderDemo}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-surface-container-high/70 backdrop-blur-md text-on-surface text-sm font-medium hover:bg-surface-container-highest transition-all shadow-md border border-outline-variant/30 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">play_circle</span>
                  <span>Watch 90s Interactive Demo</span>
                </button>
              </div>

              {/* Trust Subline */}
              <p className="mt-4 font-mono text-xs text-outline flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                100% Free · No credit card required · Instant setup
              </p>

              {/* 3. INTERACTIVE LIVE VOICE PLAYGROUND SANDBOX (Stitch Signature) */}
              <div className="w-full max-w-4xl mt-12 relative">
                {/* Glow Backlight */}
                <div className="absolute -inset-1 bg-gradient-to-r from-inverse-primary/30 via-secondary-container/20 to-tertiary-container/20 rounded-2xl blur-xl opacity-75" />
                <div className="relative rounded-2xl bg-surface-container-low/90 backdrop-blur-2xl shadow-[0_24px_60px_-15px_rgba(2,6,23,0.9)] p-5 sm:p-7 text-left overflow-hidden border border-outline-variant/30">
                  {/* Top Frame Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-error/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                      <div className="w-3 h-3 rounded-full bg-tertiary/80" />
                      <span className="ml-2 font-mono text-xs text-on-surface font-semibold tracking-wide flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-primary">mic</span>
                        Live Voice Playground
                      </span>
                      <span className="hidden sm:inline-flex font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-surface-container-highest text-tertiary border border-tertiary/20">
                        44.1 kHz Whisper Engine · Ready
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-surface-container-highest/80 rounded-full px-3 py-1 text-on-surface-variant font-mono text-xs border border-outline-variant/30">
                      <span className="material-symbols-outlined text-[14px] text-primary">language</span>
                      <select
                        value={sandboxLang}
                        onChange={(e) => setSandboxLang(e.target.value)}
                        className="bg-transparent text-on-surface font-mono text-xs outline-none cursor-pointer"
                      >
                        <option value="en" className="bg-surface-container-high text-on-surface">English (US)</option>
                        <option value="es" className="bg-surface-container-high text-on-surface">Spanish (ES)</option>
                        <option value="de" className="bg-surface-container-high text-on-surface">German (DE)</option>
                        <option value="ja" className="bg-surface-container-high text-on-surface">Japanese (JP)</option>
                      </select>
                    </div>
                  </div>

                  {/* Question Card Prompt */}
                  <div className="p-4 rounded-xl bg-surface-container-high/60 backdrop-blur-sm my-4 border border-outline-variant/20">
                    <div className="flex items-center justify-between text-on-surface-variant mb-1 font-mono text-xs">
                      <span className="uppercase tracking-wider text-secondary">
                        Question 0{activePromptIndex + 1} of 03
                      </span>
                      <span className="text-outline">Voice Enabled Form</span>
                    </div>
                    <p className="font-headline-sm text-base sm:text-lg text-on-surface font-medium">
                      {currentPrompt.question}
                    </p>
                  </div>

                  {/* Dictation Sandbox Area */}
                  <div className="rounded-xl bg-surface-container-lowest/80 p-4 sm:p-6 flex flex-col gap-4 border border-outline-variant/20">
                    {/* Live Audio Waveform & Status Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-tertiary shadow-[0_0_12px_rgba(78,222,163,0.3)]">
                          <span className="material-symbols-outlined text-[18px] animate-pulse">graphic_eq</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-on-surface font-semibold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping" />
                            Neural Stream Active
                          </span>
                          <span className="font-mono text-[10px] text-outline">Latency: 118ms · Noise Suppressed</span>
                        </div>
                      </div>

                      {/* Animated Waveform Bars */}
                      <div className="flex items-end gap-1 h-7 px-3 py-1 rounded-lg bg-surface-container border border-outline-variant/20">
                        <div className="w-1 bg-tertiary rounded-full h-4 animate-[pulse_0.8s_ease-in-out_infinite]" />
                        <div className="w-1 bg-primary rounded-full h-6 animate-[pulse_0.6s_ease-in-out_infinite]" />
                        <div className="w-1 bg-secondary rounded-full h-3 animate-[pulse_0.9s_ease-in-out_infinite]" />
                        <div className="w-1 bg-tertiary rounded-full h-5 animate-[pulse_0.7s_ease-in-out_infinite]" />
                        <div className="w-1 bg-primary rounded-full h-7 animate-[pulse_0.5s_ease-in-out_infinite]" />
                        <div className="w-1 bg-secondary rounded-full h-4 animate-[pulse_1.0s_ease-in-out_infinite]" />
                        <div className="w-1 bg-tertiary rounded-full h-6 animate-[pulse_0.65s_ease-in-out_infinite]" />
                        <div className="w-1 bg-primary rounded-full h-2 animate-[pulse_0.85s_ease-in-out_infinite]" />
                        <span className="ml-2 font-mono text-xs text-on-surface font-semibold">
                          0:{String(sandboxTimer).padStart(2, '0')} / 1:00
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Streaming Transcription Canvas */}
                    <div className="min-h-[96px] p-4 rounded-xl bg-surface-container-high/40 flex flex-col justify-between border border-outline-variant/20">
                      <p className="text-xs sm:text-sm text-on-surface leading-relaxed">
                        {currentPrompt.transcript}
                        <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse align-middle" />
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/10 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary flex items-center gap-1 border border-tertiary/20">
                            <span className="material-symbols-outlined text-[13px]">verified</span>
                            99.4% speech confidence · Zero hallucination
                          </span>
                          <span className="hidden md:inline text-outline text-[11px]">28 words captured</span>
                        </div>
                        <span className="text-outline text-[11px] flex items-center gap-1">
                          <kbd className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-mono">Space</kbd> to toggle mic
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsRecordingSandbox((prev) => !prev)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary-container text-on-surface text-xs font-semibold hover:bg-secondary transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isRecordingSandbox ? 'pause' : 'mic'}
                          </span>
                          <span>{isRecordingSandbox ? 'Tap to Pause' : 'Tap to Resume'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={onOpenResponderDemo}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-medium transition-colors border border-outline-variant/30 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px] text-tertiary">mic_external_on</span>
                          <span>Try Live Responder</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActivePromptIndex((prev) => (prev + 1) % demoPrompts.length)}
                        className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-xs font-mono transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">cached</span>
                        <span>Switch Example Prompt</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* 4. FEATURE BENTO GRID (Stitch 5 Cards) */}
          <section id="features" className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16">
            <div className="flex flex-col items-start mb-10 max-w-2xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-[18px]">hub</span>
                <span className="font-mono text-xs text-primary uppercase tracking-widest font-semibold">
                  Why Voice-Native Forms
                </span>
              </div>
              <h2 className="font-headline-lg text-2xl sm:text-4xl font-bold text-on-surface tracking-tight">
                Architected from the ground up for high-fidelity speech intelligence
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1 */}
              <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-md flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary mb-4">
                    <span className="material-symbols-outlined text-[22px]">bolt</span>
                  </div>
                  <h3 className="font-headline-sm text-lg font-semibold text-on-surface mb-2">
                    3x Higher Completion
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    Respondents speak 150 words per minute versus typing 40. Reduce abandonment on long qualitative surveys and portfolio interviews.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-outline-variant/10 font-mono text-xs text-tertiary flex items-center gap-1">
                  <span>Sub-140ms latency</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-md flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-tertiary mb-4">
                    <span className="material-symbols-outlined text-[22px]">psychology</span>
                  </div>
                  <h3 className="font-headline-sm text-lg font-semibold text-on-surface mb-2">
                    Neural Sentiment & Tone
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    Capture vocal inflection, hesitation, and emotional conviction that typed text strips away. Automatic summary dossiers for candidates.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-outline-variant/10 font-mono text-xs text-tertiary flex items-center gap-1">
                  <span>99.4% speech confidence</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-md flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-secondary mb-4">
                    <span className="material-symbols-outlined text-[22px]">lock</span>
                  </div>
                  <h3 className="font-headline-sm text-lg font-semibold text-on-surface mb-2">
                    Zero Data Retention Enclave
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    End-to-end encrypted voice processing. Candidate audio files are purged automatically or secured under enterprise 256-bit AES vault.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-outline-variant/10 font-mono text-xs text-tertiary flex items-center gap-1">
                  <span>SOC2 & HIPAA Compliant</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </div>
              </div>
            </div>
          </section>

          {/* 5. CTA BANNER */}
          <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16">
            <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-surface-container-high via-surface-container-low to-surface-container border border-outline-variant/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="flex flex-col gap-2 max-w-xl text-left">
                <span className="font-mono text-xs text-tertiary uppercase tracking-wider font-semibold">
                  Launch in 30 seconds
                </span>
                <h2 className="font-headline-lg text-2xl sm:text-4xl font-bold text-on-surface tracking-tight">
                  Ready to upgrade your forms with neural voice intelligence?
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant">
                  Join hundreds of product teams, designers, and hiring leaders conducting async voice interviews.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-primary-container to-secondary-container text-on-primary font-semibold text-xs sm:text-sm shadow-lg hover:brightness-110 transition-all cursor-pointer"
                >
                  Create Form Now
                </button>
                <button
                  type="button"
                  onClick={onExploreDashboard}
                  className="px-6 py-3 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs sm:text-sm font-medium border border-outline-variant/30 transition-all cursor-pointer"
                >
                  Explore Dashboard
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-surface-container-lowest py-8 border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant font-mono">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[14px]">graphic_eq</span>
            </div>
            <span className="text-on-surface font-semibold">VoxForm AI</span>
            <span>· The Voice-Native Form Platform</span>
          </div>
          <span>© 2025 VoxForm AI · All Rights Reserved</span>
        </div>
      </footer>
    </div>
  );
}
