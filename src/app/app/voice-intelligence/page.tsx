"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { VoiceSignals } from "@/components/VoiceSignals";
import { MicDeniedNotice } from "@/components/ErrorStates";
import { useMicrophone } from "@/hooks/useMicrophone";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

export default function VoiceIntelligencePage() {
  const mic = useMicrophone();
  const [active, setActive] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const wordCountRef = useRef(0);
  const startRef = useRef(0);
  const lastSpeechRef = useRef(0);

  const onFinal = useCallback((text: string) => {
    wordCountRef.current += text.split(/\s+/).filter(Boolean).length;
    const now = Date.now();
    if (lastSpeechRef.current && now - lastSpeechRef.current > 2200) {
      setPauseCount((p) => p + 1);
    }
    lastSpeechRef.current = now;
    if (startRef.current) {
      const minutes = (now - startRef.current) / 60000;
      if (minutes > 0.05) setWpm(Math.round(wordCountRef.current / minutes));
    }
  }, []);

  const recog = useSpeechRecognition("en-US", onFinal);

  const toggle = useCallback(async () => {
    if (active) {
      mic.stop();
      recog.stop();
      setActive(false);
    } else {
      await mic.start();
      startRef.current = Date.now();
      wordCountRef.current = 0;
      setWpm(0);
      setPauseCount(0);
      recog.start();
      setActive(true);
    }
  }, [active, mic, recog]);

  useEffect(() => () => { mic.stop(); recog.stop(); }, [mic, recog]);

  const energy = Math.round(mic.level * 100);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 lg:px-8">
      <header>
        <h1 className="text-3xl font-normal text-[var(--md-sys-color-on-surface)]">Voice Intelligence</h1>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Live vocal characteristics derived from your microphone — pace, energy, pauses and rhythm.
        </p>
      </header>

      {mic.permission === "denied" && <MicDeniedNotice onRetry={toggle} />}

      <div className="m3-card">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{active ? "Analyzing your voice…" : "Start speaking to see live signals"}</p>
          <button
            onClick={toggle}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              active
                ? "bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)]"
                : "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90"
            }`}
          >
            {active ? "◼ Stop" : "🎙️ Start"}
          </button>
        </div>
        <AudioVisualizer subscribe={mic.subscribe} idle={!active} barColor="#22d3ee" height={120} />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <VoiceSignals
          energy={energy}
          pace={Math.min(100, Math.round((wpm / 180) * 100))}
          confidence={active ? 92 : 0}
          tone={energy > 55 ? "Energetic" : energy > 20 ? "Calm" : "Quiet"}
          wpm={wpm}
        />
        <div className="m3-card">
          <p className="mb-3 m3-label text-[var(--md-sys-color-on-surface-variant)]">Conversational Rhythm</p>
          <div className="flex flex-col gap-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Detected pauses</span>
              <span className="text-[var(--md-sys-color-on-surface)]">{pauseCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Speaking rate</span>
              <span className="text-[var(--md-sys-color-on-surface)]">{wpm} WPM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--md-sys-color-on-surface-variant)]">Session energy</span>
              <span className="text-[var(--md-sys-color-on-surface)]">{energy}%</span>
            </div>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
            These are audio-derived signals intended to help you understand delivery — not a measurement of your
            actual emotional or mental state.
          </p>
        </div>
      </div>
      {recog.interim && <p className="text-xs italic text-[var(--md-sys-color-on-surface-variant)]">{recog.interim}</p>}
    </div>
  );
}
