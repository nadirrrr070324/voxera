"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { VoicePicker } from "@/components/VoicePicker";
import { useMicrophone } from "@/hooks/useMicrophone";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useVoicePreference } from "@/hooks/useVoicePreference";
import { GEMINI_VOICES } from "@/lib/voices";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/types";

function TtsDemo() {
  const [text, setText] = useState("Voice is the new interface. This is Gemini-powered speech, generated live.");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [lang, setLang] = useState<LanguageCode>("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tts = useSpeechSynthesis();
  const { voice } = useVoicePreference();
  const voiceMeta = GEMINI_VOICES.find((v) => v.name === voice);

  const play = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/voice/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: [{ role: "user", text: `Say exactly: ${text}` }],
          voice,
        }),
      }).then((r) => r.json());
      const meta = SUPPORTED_LANGUAGES.find((l) => l.code === lang)!;
      tts.speak(text, {
        audioBase64: res.audio?.audioBase64,
        mimeType: res.audio?.mimeType,
        rate,
        pitch,
        lang: meta.bcp47,
      });
      if (!res.audio?.audioBase64) {
        setError(
          `No Gemini audio returned, so the browser voice is used instead.${
            res.reason ? ` Reason: ${res.reason}` : ""
          }`,
        );
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [text, rate, pitch, lang, voice, tts]);

  return (
    <div className="m3-card flex flex-col gap-4 !rounded-[28px]">
      <div>
        <h2 className="mb-1 text-lg font-medium">Text-to-Speech</h2>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Enter text and hear natural Gemini-generated speech.
        </p>
      </div>

      <VoicePicker compact />

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="m3-field w-full resize-none !h-auto py-3 leading-relaxed"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          Speed <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{rate.toFixed(1)}x</span>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="m3-slider"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          Pitch <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{pitch.toFixed(1)}</span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={pitch}
            onChange={(e) => setPitch(Number(e.target.value))}
            className="m3-slider"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          Language
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as LanguageCode)}
            className="m3-field w-full"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={play} disabled={loading} className="m3-btn-filled">
          {loading ? "Synthesizing…" : tts.speaking ? "🔊 Speaking…" : "▶ Play"}
        </button>
        <span className="m3-badge bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]">
          {voiceMeta ? `${voiceMeta.name} · ${voiceMeta.style}` : voice}
        </span>
      </div>

      {error && (
        <p className="rounded-xl bg-[var(--md-sys-color-error-container)] px-3 py-2 text-xs text-[var(--md-sys-color-on-error-container)]">
          {error}
        </p>
      )}
    </div>
  );
}

function VadDemo() {
  const mic = useMicrophone();
  const [active, setActive] = useState(false);
  const speaking = mic.level > 0.06;

  const toggle = async () => {
    if (active) {
      mic.stop();
      setActive(false);
    } else {
      await mic.start();
      setActive(true);
    }
  };

  return (
    <div className="m3-card">
      <h2 className="mb-1 text-lg font-semibold">Voice Activity Detection</h2>
      <p className="mb-4 text-sm text-[var(--md-sys-color-on-surface-variant)]">Visualize when someone starts and stops speaking, in real time.</p>
      <AudioVisualizer subscribe={mic.subscribe} idle={!active} barColor="#f472b6" height={90} />
      <div className="mt-4 flex items-center justify-between">
        <span className={`flex items-center gap-2 text-sm ${speaking ? "text-[var(--md-sys-color-primary)]" : "text-[var(--md-sys-color-on-surface-variant)]"}`}>
          <span className={`h-2 w-2 rounded-full ${speaking ? "bg-[var(--md-sys-color-primary)]" : "bg-[var(--md-sys-color-outline-variant)]"}`} />
          {active ? (speaking ? "Speech detected" : "Silence") : "Inactive"}
        </span>
        <button
          onClick={toggle}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            active ? "bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)]" : "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
          }`}
        >
          {active ? "◼ Stop" : "🎙️ Start"}
        </button>
      </div>
    </div>
  );
}

export default function AudioLabPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 lg:px-8">
      <header>
        <h1 className="text-3xl font-normal text-[var(--md-sys-color-on-surface)]">Audio Lab</h1>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">An experimental playground for every part of the Gemini audio stack.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TtsDemo />
        <VadDemo />

        <Link
          href="/app/live-voice"
          className="flex flex-col justify-between m3-card flex flex-col justify-between transition"
        >
          <div>
            <h2 className="mb-1 text-lg font-semibold">Live Voice</h2>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Speak naturally with AI and experience real barge-in interruption.</p>
          </div>
          <span className="mt-4 text-sm text-[var(--md-sys-color-primary)]">Open Live Voice →</span>
        </Link>

        <Link
          href="/app/live-translate"
          className="flex flex-col justify-between m3-card flex flex-col justify-between transition"
        >
          <div>
            <h2 className="mb-1 text-lg font-semibold">Live Translation</h2>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Speak in one language, hear another — conversationally, in real time.</p>
          </div>
          <span className="mt-4 text-sm text-[var(--md-sys-color-primary)]">Open Live Translate →</span>
        </Link>

        <Link
          href="/app/transcribe"
          className="flex flex-col justify-between m3-card flex flex-col justify-between transition lg:col-span-2"
        >
          <div>
            <h2 className="mb-1 text-lg font-semibold">Transcription & Speaker Detection</h2>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Upload multi-speaker audio to generate a structured, diarized transcript.</p>
          </div>
          <span className="mt-4 text-sm text-[var(--md-sys-color-primary)]">Open Smart Transcribe →</span>
        </Link>
      </div>
    </div>
  );
}
