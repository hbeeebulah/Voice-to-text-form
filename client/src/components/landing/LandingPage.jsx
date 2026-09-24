import React from 'react';
import {
  Sparkles,
  Mic,
  FileText,
  Palette,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Share2,
  Download,
  ShieldCheck,
  Zap,
  Play,
  Volume2
} from 'lucide-react';

export default function LandingPage({
  onOpenAuth,
  onOpenResponderDemo,
  onExploreDashboard
}) {
  const templates = [
    {
      title: 'Customer Audio Feedback Survey',
      desc: 'Collect spoken opinions, rating scales, and detailed customer feedback.',
      color: '#6366f1',
      badge: 'Popular'
    },
    {
      title: 'Daily Voice Journal & Standup',
      desc: 'Reflect on daily goals, blockers, and energy levels with speech dictation.',
      color: '#f43f5e',
      badge: 'Productivity'
    },
    {
      title: 'Executive Event Registration',
      desc: 'Sleek dark theme event signup with tracks and dietary preferences.',
      color: '#10b981',
      badge: 'Business'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-800">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Mic className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900 bg-clip-text text-transparent">
                VoxForm AI
              </span>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest -mt-0.5">
                Voice-First Form Studio
              </p>
            </div>
          </div>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#templates" className="hover:text-indigo-600 transition-colors">Templates</a>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition-all cursor-pointer hover:scale-102"
            >
              <span>Build your form</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
          {/* Background Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-300/30 via-purple-200/20 to-pink-200/20 blur-3xl -z-10 rounded-full pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Voice-Powered Multimodal Forms &amp; Dictation</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Build Smarter Forms With{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
                Instant Voice Dictation
              </span>
            </h1>

            {/* Subheading */}
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
              Empower respondents to speak their thoughts naturally. Eliminate typing fatigue with AI-powered punctuation, real-time waveform visualizers, and rich audio analytics.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="inline-flex items-center gap-2 px-7 sm:px-9 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-indigo-300 hover:shadow-indigo-400 transition-all hover:scale-102 cursor-pointer"
              >
                <span>Create your form now</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200 shadow-md hover:shadow-lg transition-all hover:scale-102 cursor-pointer"
              >
                <span>Sign In</span>
              </button>
            </div>

            {/* Quick Demo Preview Link */}
            <div className="pt-2 text-xs text-slate-500 flex items-center justify-center gap-4">
              {onOpenResponderDemo && (
                <button
                  type="button"
                  onClick={onOpenResponderDemo}
                  className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-indigo-600" />
                  <span>Try interactive demo form</span>
                </button>
              )}

              {onExploreDashboard && (
                <button
                  type="button"
                  onClick={onExploreDashboard}
                  className="font-medium text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                >
                  Explore as guest &rarr;
                </button>
              )}
            </div>

            {/* Interactive Mockup / Product Showcase */}
            <div className="pt-10 max-w-3xl mx-auto">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 text-left relative overflow-hidden group">
                <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 absolute top-0 left-0" />

                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                    <span className="text-xs font-bold text-slate-400 ml-2">Product Feedback Survey (Live Preview)</span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                    Voice Dictation Active
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Describe your favorite experience or any challenges you faced
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Respondents can type or click the microphone to speak freely
                    </p>
                  </div>

                  {/* Mock Dictation Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center animate-pulse shadow-sm shadow-red-200">
                          <Mic className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800">Listening &amp; Transcribing...</span>
                          <p className="text-[10px] text-slate-400">Neural speech engine active</p>
                        </div>
                      </div>

                      {/* Mock waveform bars */}
                      <div className="flex items-center gap-1 h-6">
                        {[40, 75, 100, 60, 90, 45, 80, 50, 95, 30].map((h, i) => (
                          <span
                            key={i}
                            className="w-1 bg-indigo-500 rounded-full animate-pulse"
                            style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-200 font-medium leading-relaxed">
                      &ldquo;The voice dictation is an absolute game-changer for field studies. Usually taking notes while examining data is tedious, but being able to speak naturally without filler words made documentation effortless.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURES SECTION */}
        <section id="features" className="py-16 sm:py-24 bg-white border-y border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Engineered for Frictionless Input
              </h2>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Everything you need to collect richer answers
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Traditional forms get short, one-word replies. VoxForm empowers respondents with voice dictation so you get thorough, thoughtful feedback.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
                  <Mic className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Multimodal Dictation</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  HTML5 audio capture with real-time waveform visualizer. AI automatically cleans filler words and fixes punctuation.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-purple-400 hover:shadow-lg transition-all space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-200">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Visual Form Builder</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Short answers, paragraphs, multiple-choice, scales, and checkboxes. Drag-and-drop questions with live autosave.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-pink-400 hover:shadow-lg transition-all space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-pink-600 text-white flex items-center justify-center shadow-md shadow-pink-200">
                  <Palette className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Designer Themes</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Choose from Modern Minimalist, Vibrant Gradient, Warm Pastel, and Dark Executive themes with custom typography.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Speech Analytics &amp; Export</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Inspect voice usage rates, rating distributions, and export submissions instantly to CSV or JSON.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-16 sm:py-24 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Simple &amp; Frictionless
              </h2>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                How VoxForm Works in 3 Steps
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 font-extrabold text-base flex items-center justify-center mx-auto shadow-xs">
                  1
                </div>
                <h4 className="text-base font-bold text-slate-900">Build Your Form</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Add questions or pick a pre-made template. Voice dictation is enabled automatically on text questions.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 font-extrabold text-base flex items-center justify-center mx-auto shadow-xs">
                  2
                </div>
                <h4 className="text-base font-bold text-slate-900">Share with Anyone</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Respondents open your link and dictate answers from any device with zero app downloads or accounts required.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 font-extrabold text-base flex items-center justify-center mx-auto shadow-xs">
                  3
                </div>
                <h4 className="text-base font-bold text-slate-900">Analyze &amp; Export</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Review spoken transcripts, analyze response percentages, and export full reports in CSV or JSON.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TEMPLATES PREVIEW SECTION */}
        <section id="templates" className="py-16 sm:py-24 bg-white border-t border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Ready-to-Use Templates
                </h2>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Start with a Curated Voice Form
                </h3>
              </div>

              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                <span>View all templates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {templates.map((tpl, i) => (
                <div
                  key={i}
                  className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: tpl.color }}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                        {tpl.badge}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base">{tpl.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{tpl.desc}</p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => onOpenAuth('signup')}
                      className="w-full py-2.5 rounded-xl bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold text-xs border border-slate-200 transition-all cursor-pointer text-center"
                    >
                      Use this template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION BANNER */}
        <section className="py-16 sm:py-20 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to build your form?
            </h2>
            <p className="text-sm sm:text-base text-indigo-100 max-w-xl mx-auto leading-relaxed">
              Start building voice-first forms with curated themes and multimodal AI dictation. Sign up or log in to get started in seconds.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-white text-indigo-700 font-extrabold text-sm shadow-xl hover:bg-indigo-50 transition-all hover:scale-102 cursor-pointer"
              >
                <span>Create your form now</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 backdrop-blur-xs transition-all cursor-pointer"
              >
                <span>Sign In</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white text-sm">VoxForm AI</span>
            <span className="text-slate-500">— Multimodal Voice-to-Text Form Studio</span>
          </div>

          <p className="text-slate-500">
            &copy; {new Date().getFullYear()} VoxForm AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
