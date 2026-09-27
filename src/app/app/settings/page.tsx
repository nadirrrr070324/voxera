"use client";

import { useEffect, useState } from "react";
import { VoicePicker } from "@/components/VoicePicker";
import { GEMINI_VOICES } from "@/lib/voices";
import { useVoicePreference } from "@/hooks/useVoicePreference";

export default function SettingsPage() {
  const [connected, setConnected] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [textScale, setTextScale] = useState(100);
  const { voice } = useVoicePreference();

  useEffect(() => {
    fetch("/api/engine-status")
      .then((r) => r.json())
      .then((d) => setConnected(Boolean(d.connected)));
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("font-size", `${textScale}%`);
  }, [textScale]);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reducedMotion);
    document.documentElement.classList.toggle("high-contrast", highContrast);
  }, [reducedMotion, highContrast]);

  const clearAll = async () => {
    if (!confirm("This will delete all saved conversations and action items. Continue?")) return;
    const res = await fetch("/api/conversations").then((r) => r.json());
    await Promise.all(
      (res.conversations ?? []).map((c: { id: number }) =>
        fetch(`/api/conversations/${c.id}`, { method: "DELETE" }),
      ),
    );
    alert("All conversations cleared.");
  };

  const activeVoice = GEMINI_VOICES.find((v) => v.name === voice);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 lg:px-8">
      <header>
        <h1 className="text-3xl font-normal text-[var(--md-sys-color-on-surface)]">Settings</h1>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Engine status, voice, privacy controls, and accessibility preferences.
        </p>
      </header>

      <section className="m3-card">
        <h2 className="mb-3 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Gemini Audio Engine</h2>
        <div
          className={`flex items-center gap-2 text-sm ${
            connected
              ? "text-[var(--md-sys-color-primary)]"
              : "text-[var(--md-sys-color-on-error-container)]"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-[var(--md-sys-color-primary)]" : "bg-[var(--md-sys-color-error)]"
            }`}
          />
          {connected ? "Connected — using live Gemini models" : "Demo Mode — set GEMINI_API_KEY to enable live models"}
        </div>
        <p className="mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          Models used: gemini-3.8-flash (understanding &amp; translation), gemini-3.8-flash-tts (speech synthesis).
        </p>
      </section>

      <section className="m3-card">
        <h2 className="mb-1 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Voice</h2>
        <p className="mb-4 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          Pick the Gemini voice used for every spoken reply. {GEMINI_VOICES.length} voices available.
        </p>
        <VoicePicker />
        {activeVoice && (
          <p className="mt-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            Current: <span className="font-medium text-[var(--md-sys-color-on-surface)]">{activeVoice.name}</span> ·{" "}
            {activeVoice.style} · {activeVoice.gender}
          </p>
        )}
      </section>

      <section className="m3-card">
        <h2 className="mb-2 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Your audio, your control.</h2>
        <ul className="mb-4 flex flex-col gap-1.5 text-sm text-[var(--md-sys-color-on-surface-variant)]">
          <li>🎙️ Microphone status: only active while a session is running</li>
          <li>⏺️ Recording: only captured audio you explicitly upload or record is processed</li>
          <li>⚙️ Processing: audio is sent only to generate a response, transcript, or translation</li>
        </ul>
        <p className="mb-4 text-xs text-[var(--md-sys-color-on-surface-variant)]">
          Audio is processed according to your configured storage settings. Nothing is stored beyond the transcripts
          and summaries you choose to save.
        </p>
        <button
          onClick={clearAll}
          className="m3-btn-filled !bg-[var(--md-sys-color-error)] !text-[var(--md-sys-color-on-error)]"
        >
          Delete all saved conversations
        </button>
      </section>

      <section className="m3-card">
        <h2 className="mb-3 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Accessibility</h2>
        <div className="flex flex-col gap-4">
          <label className="flex items-center justify-between text-sm text-[var(--md-sys-color-on-surface)]">
            Reduced motion
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="m3-switch"
            />
          </label>
          <label className="flex items-center justify-between text-sm text-[var(--md-sys-color-on-surface)]">
            High contrast
            <input
              type="checkbox"
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
              className="m3-switch"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-[var(--md-sys-color-on-surface)]">
            Text size ({textScale}%)
            <input
              type="range"
              min={85}
              max={130}
              value={textScale}
              onChange={(e) => setTextScale(Number(e.target.value))}
              className="m3-slider"
            />
          </label>
        </div>
      </section>

      <section className="m3-card">
        <h2 className="mb-3 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Keyboard Shortcuts</h2>
        <ul className="grid grid-cols-2 gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
          {[
            ["Space", "Talk"],
            ["Esc", "Interrupt AI"],
            ["M", "Mute"],
            ["T", "Toggle transcript"],
            ["L", "Change language"],
          ].map(([key, action]) => (
            <li key={key}>
              <kbd className="rounded bg-[var(--md-sys-color-surface-container-highest)] px-1.5 py-0.5 text-xs">
                {key}
              </kbd>{" "}
              {action}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
