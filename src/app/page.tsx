"use client";

import Link from "next/link";
import { useState } from "react";
import { VoiceOrb } from "@/components/VoiceOrb";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { DemoModeRunner } from "@/components/DemoModeRunner";
import { useMicrophone } from "@/hooks/useMicrophone";

const USE_CASES = [
  { title: "Education", icon: "🎓", desc: "Tutors that explain, adapt, and re-explain the moment a student is confused." },
  { title: "Meetings", icon: "🗓️", desc: "Every decision and owner captured automatically, no note-taking required." },
  { title: "Customer support", icon: "🎧", desc: "Calls that understand tone and hand off structured context instantly." },
  { title: "Healthcare", icon: "🩺", desc: "Multilingual intake conversations transcribed and structured safely." },
  { title: "Accessibility", icon: "♿", desc: "Voice-first flows for people who can't type or read comfortably." },
  { title: "Travel", icon: "✈️", desc: "Real-time translation so language is never a barrier abroad." },
  { title: "Language learning", icon: "🗣️", desc: "Practice speaking naturally with a partner that never gets tired." },
  { title: "Interviews", icon: "🎙️", desc: "Multi-speaker transcripts with instant highlights and quotes." },
];

export default function LandingPage() {
  const mic = useMicrophone();
  const [micOn, setMicOn] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const toggleMic = async () => {
    if (micOn) {
      mic.stop();
      setMicOn(false);
    } else {
      await mic.start();
      setMicOn(true);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[var(--md-sys-color-primary-container)] opacity-60 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[var(--md-sys-color-tertiary-container)] opacity-50 blur-[140px]" />
        <div className="absolute inset-0 bg-grid opacity-30" />
      </div>

      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--md-sys-color-primary)] text-sm font-bold text-[var(--md-sys-color-on-primary)]">V</span>
          <span className="text-lg font-medium tracking-tight">VOXERA</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-[var(--md-sys-color-on-surface-variant)] md:flex">
          <a href="#interrupt" className="hover:text-[var(--md-sys-color-on-surface)]">Real-time</a>
          <a href="#intelligence" className="hover:text-[var(--md-sys-color-on-surface)]">Intelligence</a>
          <a href="#translate" className="hover:text-[var(--md-sys-color-on-surface)]">Translate</a>
          <a href="#action" className="hover:text-[var(--md-sys-color-on-surface)]">Action</a>
          <a href="#stack" className="hover:text-[var(--md-sys-color-on-surface)]">Stack</a>
        </nav>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowDemo(true)} className="hidden m3-btn-outlined sm:block">
            Launch Live Demo
          </button>
          <Link href="/app/live-voice" className="rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] px-4 py-2 text-sm font-medium hover:opacity-90">
            Start Talking →
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-10 text-center">
        <span className="mb-6 m3-chip px-4 py-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          Powered by Gemini 3.8 Live · Flash TTS · Live Translate · Transcribe
        </span>
        <h1 className="font-display max-w-4xl text-[clamp(2.4rem,7vw,5rem)] font-semibold leading-[1.05] tracking-tight">
          Voice is the <span className="text-[var(--md-sys-color-primary)]">new interface.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-balance text-lg text-[var(--md-sys-color-on-surface-variant)]">
          Experience real-time AI that listens between your words, understands how you speak, translates conversations
          as they happen, and turns natural dialogue into action.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/app/live-voice" className="rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] px-7 py-3 text-sm font-semibold shadow-lg shadow-[0_4px_16px_var(--md-sys-color-primary-container)] hover:opacity-90">
            Start Talking →
          </Link>
          <a href="#stack" className="m3-btn-filled !px-7 !py-3">
            Explore the Audio Stack
          </a>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="relative">
            <VoiceOrb state={micOn ? "listening" : "idle"} level={mic.level} subscribe={mic.subscribe} size={300} />
          </div>
          <button onClick={toggleMic} className="m3-btn-outlined !px-3 !py-1 !text-xs">
            {micOn ? "Stop preview" : "🎙️ Try the live visualizer"}
          </button>
          <div className="w-full max-w-sm">
            <AudioVisualizer subscribe={mic.subscribe} idle={!micOn} height={56} />
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--md-sys-color-primary)] opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--md-sys-color-primary)]" />
            </span>
            LIVE · Listening • 24 kHz • Real-time
          </div>
        </div>
      </section>

      {/* SECTION 1 */}
      <Section id="interrupt" eyebrow="No waiting" title="Conversation without waiting.">
        <p className="max-w-2xl text-[var(--md-sys-color-on-surface-variant)]">
          Most voice assistants make you wait for a full response before you can speak again. Voxera supports true
          barge-in: the moment you start talking, the AI stops mid-sentence, and adapts to your new intent instantly.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <MiniCard title="Listening" desc="Continuous stream — no push to talk required." />
          <MiniCard title="Interrupted" desc="AI speech halts within milliseconds of your voice." />
          <MiniCard title="Adapts" desc="Picks up your new sentence without losing context." />
        </div>
      </Section>

      {/* SECTION 2 */}
      <Section id="intelligence" eyebrow="Beyond words" title="Understand more than words.">
        <p className="max-w-2xl text-[var(--md-sys-color-on-surface-variant)]">
          Voxera analyzes pace, energy, pauses and rhythm from your voice — surfaced as responsible, audio-derived
          signals, never as a claim about how you actually feel.
        </p>
        <div className="mt-8 grid max-w-md gap-3 m3-card">
          <Signal label="Energy" value={4} />
          <Signal label="Pace" value={3} />
          <Signal label="Confidence" value={4} />
          <div className="flex items-center justify-between text-sm text-[var(--md-sys-color-on-surface-variant)]">
            <span>Tone</span><span className="text-[var(--md-sys-color-on-surface)]">Calm</span>
          </div>
          <div className="flex items-center justify-between text-sm text-[var(--md-sys-color-on-surface-variant)]">
            <span>Speaking Rate</span><span className="text-[var(--md-sys-color-on-surface)]">142 WPM</span>
          </div>
        </div>
      </Section>

      {/* SECTION 3 */}
      <Section id="translate" eyebrow="No barriers" title="Break language barriers live.">
        <p className="max-w-2xl text-[var(--md-sys-color-on-surface-variant)]">
          Two people, two languages, one natural conversation — translated the instant each sentence finishes.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <TranslateCard flag="🇮🇳" lang="Hindi" text="आप कहाँ से आए हैं?" />
          <div className="hidden items-center justify-center text-2xl sm:flex">↔</div>
          <TranslateCard flag="🇬🇧" lang="English" text="Where are you from?" />
        </div>
      </Section>

      {/* SECTION 4 */}
      <Section id="action" eyebrow="From talk to task" title="From conversation to execution.">
        <p className="max-w-2xl text-[var(--md-sys-color-on-surface-variant)]">Messy multi-speaker conversation → structured summary → decisions → owned action items.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <MiniCard title="Transcript" desc="Speaker 1, 2, 3 — separated automatically with timestamps." />
          <MiniCard title="Decisions" desc="Beta ships Friday. Auth finishes Thursday." />
          <MiniCard title="Action items" desc="Owner + deadline assigned for every open task." />
        </div>
      </Section>

      {/* SECTION 5 */}
      <Section id="stack" eyebrow="Architecture" title="Built for audio-first experiences.">
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          {["Microphone", "Audio Capture", "Streaming Pipeline", "Gemini Live Model", "Realtime Events", "Transcript + Voice", "UI"].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-3">
              <span className="rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] px-3 py-1.5">{step}</span>
              {i < arr.length - 1 && <span className="text-[var(--md-sys-color-outline)]">→</span>}
            </div>
          ))}
        </div>
      </Section>

      {/* SECTION 6 */}
      <Section eyebrow="One voice layer" title="Infinite applications.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {USE_CASES.map((u) => (
            <div key={u.title} className="m3-card text-left transition hover:border-[var(--md-sys-color-primary)]">
              <div className="mb-2 text-xl">{u.icon}</div>
              <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{u.title}</p>
              <p className="mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">{u.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-semibold">Stop typing. Start talking.</h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/app/live-voice" className="rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] px-8 py-3.5 text-sm font-semibold shadow-lg shadow-[0_4px_16px_var(--md-sys-color-primary-container)] hover:opacity-90">
            Launch Voice Experience →
          </Link>
          <button onClick={() => setShowDemo(true)} className="m3-btn-filled !px-8 !py-3.5">
            Launch Live Demo
          </button>
        </div>
      </section>

      <footer className="border-t border-[var(--md-sys-color-outline-variant)] px-6 py-8 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
        VOXERA — a real-time voice intelligence concept platform built on the Gemini audio stack. Audio is processed
        according to your configured storage settings.
      </footer>

      {showDemo && <DemoModeRunner onClose={() => setShowDemo(false)} />}
    </div>
  );
}

function Section({ id, eyebrow, title, children }: { id?: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-6 py-16">
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[var(--md-sys-color-primary)]">{eyebrow}</p>
      <h2 className="font-display mb-6 text-[clamp(1.6rem,3.5vw,2.5rem)] font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function MiniCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="m3-card text-left">
      <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">{desc}</p>
    </div>
  );
}

function Signal({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--md-sys-color-on-surface-variant)]">{label}</span>
      <span className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`h-2 w-2 rounded-full ${i < value ? "bg-[var(--md-sys-color-primary)]" : "bg-[var(--md-sys-color-outline-variant)]"}`} />
        ))}
      </span>
    </div>
  );
}

function TranslateCard({ flag, lang, text }: { flag: string; lang: string; text: string }) {
  return (
    <div className="flex-1 m3-card text-left">
      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{flag} {lang}</p>
      <p className="mt-2 text-lg text-[var(--md-sys-color-on-surface)]">{text}</p>
    </div>
  );
}
