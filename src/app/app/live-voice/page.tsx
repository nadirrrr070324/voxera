"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { VoiceOrb, type OrbState } from "@/components/VoiceOrb";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { LiveTranscript, type TranscriptLine } from "@/components/LiveTranscript";
import { VoiceControls } from "@/components/VoiceControls";
import { VoiceSignals } from "@/components/VoiceSignals";
import { VoicePicker } from "@/components/VoicePicker";
import { MicDeniedNotice, UnsupportedBrowserNotice } from "@/components/ErrorStates";
import { useMicrophone } from "@/hooks/useMicrophone";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useVoicePreference } from "@/hooks/useVoicePreference";
import type { ChatTurn } from "@/lib/types";

const STATE_LABEL: Record<OrbState, string> = {
  idle: "Press Start Talking",
  listening: "Listening...",
  thinking: "Understanding...",
  speaking: "Speaking...",
  interrupted: "Interrupted — listening to you",
};

/** Ambient colours that follow the orb so the whole stage breathes with it. */
const STAGE_AURORA: Record<OrbState, CSSProperties> = {
  idle: { ["--aurora-1" as string]: "#6750a4" },
  listening: { ["--aurora-1" as string]: "#6750a4" },
  thinking: { ["--aurora-1" as string]: "#7d5260" },
  speaking: { ["--aurora-1" as string]: "#006a7a" },
  interrupted: { ["--aurora-1" as string]: "#ba1a1a" },
};

const STAGE_GLOW: Record<OrbState, CSSProperties> = {
  idle: { boxShadow: "inset 0 0 140px -40px rgba(103,80,164,0.30)" },
  listening: { boxShadow: "inset 0 0 160px -30px rgba(103,80,164,0.42)" },
  thinking: { boxShadow: "inset 0 0 160px -30px rgba(125,82,96,0.42)" },
  speaking: { boxShadow: "inset 0 0 160px -30px rgba(0,106,122,0.42)" },
  interrupted: { boxShadow: "inset 0 0 160px -30px rgba(186,26,26,0.45)" },
};

const STAGE_DOT: Record<OrbState, string> = {
  idle: "#6750a4",
  listening: "#7f5af0",
  thinking: "#a06a7c",
  speaking: "#006a7a",
  interrupted: "#ba1a1a",
};

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `seg-${Date.now()}-${idCounter}`;
}

export default function LiveVoicePage() {
  const mic = useMicrophone();
  const tts = useSpeechSynthesis();
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [showTranscript, setShowTranscript] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const stateRef = useRef<OrbState>("idle");
  const speakingLineId = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const wordCountRef = useRef(0);
  const [wpm, setWpm] = useState(0);
  const { voice } = useVoicePreference();
  const voiceRef = useRef(voice);
  const [engineConnected, setEngineConnected] = useState<boolean | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  useEffect(() => {
    voiceRef.current = voice;
  }, [voice]);

  useEffect(() => {
    let alive = true;
    fetch("/api/engine-status")
      .then((r) => r.json())
      .then((d: { connected?: boolean }) => {
        if (alive) setEngineConnected(Boolean(d.connected));
      })
      .catch(() => {
        if (alive) setEngineConnected(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Keep a ref mirror of orbState so the speech-recognition callback can read the
  // latest value without being re-created on every state change.
  useEffect(() => {
    stateRef.current = orbState;
  }, [orbState]);

  const handleFinal = useCallback((text: string, confidence: number) => {
    if (!text) return;

    // Barge-in: if AI is currently speaking, cut it off immediately.
    if (stateRef.current === "speaking") {
      tts.cancel();
      if (speakingLineId.current) {
        setLines((prev) =>
          prev.map((l) => (l.id === speakingLineId.current ? { ...l, interrupted: true } : l)),
        );
      }
      setOrbState("interrupted");
    }

    wordCountRef.current += text.split(/\s+/).filter(Boolean).length;
    if (startTimeRef.current) {
      const minutes = (Date.now() - startTimeRef.current) / 60000;
      if (minutes > 0.05) setWpm(Math.round(wordCountRef.current / minutes));
    }

    const userLine: TranscriptLine = {
      id: nextId(),
      speaker: "You",
      text,
      isFinal: true,
      confidence,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    setLines((prev) => [...prev, userLine]);
    setOrbState("thinking");

    setLines((prevLines) => {
      const history: ChatTurn[] = prevLines
        .filter((l) => l.speaker === "You" || l.speaker === "AI")
        .map((l) => ({ role: l.speaker === "You" ? "user" : "ai", text: l.text }));

      fetch("/api/voice/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, voice: voiceRef.current }),
      })
        .then((r) => r.json())
        .then((data: {
          text: string;
          source?: "gemini" | "demo";
          reason?: string;
          audio?: { audioBase64: string; mimeType: string } | null;
        }) => {
          const isDemo = data.source === "demo";
          const aiId = nextId();
          speakingLineId.current = aiId;
          setLines((prev) => [
            ...prev,
            {
              id: aiId,
              speaker: "AI",
              text: data.text,
              isFinal: true,
              demo: isDemo,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            },
          ]);
          if (isDemo) setDemoNotice(data.reason ?? "Showing canned demo content.");
          setOrbState("speaking");
          tts.speak(data.text, {
            audioBase64: data.audio?.audioBase64,
            mimeType: data.audio?.mimeType,
            // Natural playback completion hands control back to the mic.
            onDone: () => setOrbState((s) => (s === "speaking" ? "listening" : s)),
          });
        })
        .catch(() => setOrbState("listening"));

      return prevLines;
    });
  }, [tts]);

  const recog = useSpeechRecognition("en-US", handleFinal);

  useEffect(() => {
    if (orbState === "interrupted") {
      const t = setTimeout(() => setOrbState("listening"), 900);
      return () => clearTimeout(t);
    }
  }, [orbState]);

  const start = useCallback(async () => {
    await mic.start();
    startTimeRef.current = Date.now();
    wordCountRef.current = 0;
    recog.start();
    setActive(true);
    setOrbState("listening");
  }, [mic, recog]);

  const stop = useCallback(() => {
    mic.stop();
    recog.stop();
    tts.cancel();
    setActive(false);
    setOrbState("idle");
  }, [mic, recog, tts]);

  const toggleTalk = useCallback(() => {
    if (active) stop();
    else start();
  }, [active, start, stop]);

  const interrupt = useCallback(() => {
    tts.cancel();
    setOrbState(active ? "listening" : "idle");
  }, [tts, active]);

  useKeyboardShortcuts({
    onTalk: toggleTalk,
    onInterrupt: interrupt,
    onMute: () => setMuted((m) => !m),
    onToggleTranscript: () => setShowTranscript((s) => !s),
  });

  const saveConversation = useCallback(async () => {
    if (lines.length === 0) return;
    setSaving(true);
    try {
      const transcriptText = lines.map((l) => `${l.speaker}: ${l.text}`).join("\n");
      const actionsRes = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptText }),
      }).then((r) => r.json());

      await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Live Voice Session — ${new Date().toLocaleDateString()}`,
          mode: "live-voice",
          languages: ["en"],
          participantCount: 2,
          durationSeconds: startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0,
          transcript: lines.map((l) => ({
            speaker: l.speaker,
            text: l.text,
            timestampMs: Date.now(),
            confidence: l.confidence,
            interrupted: l.interrupted,
          })),
          summary: actionsRes.result?.summary ?? "",
          decisions: actionsRes.result?.decisions ?? [],
          followUps: actionsRes.result?.followUps ?? [],
          actionItems: actionsRes.result?.actionItems ?? [],
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }, [lines]);

  const energy = Math.round(mic.level * 100);

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-normal text-[var(--md-sys-color-on-surface)]">Live Voice</h1>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Speak naturally. Interrupt any time. Press Space to talk, Esc to interrupt.
          </p>
        </div>
        <button
          onClick={saveConversation}
          disabled={saving || lines.length === 0}
          className="m3-btn-outlined"
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Conversation"}
        </button>
      </header>

      {mic.permission === "denied" && <MicDeniedNotice onRetry={start} />}
      {!recog.supported && <UnsupportedBrowserNotice />}

      {(demoNotice || engineConnected === false) && (
        <div
          role="status"
          className="m3-card !rounded-[20px] !p-4"
          style={{
            background:
              engineConnected === false
                ? "var(--md-sys-color-error-container)"
                : "var(--md-sys-color-tertiary-container)",
            color:
              engineConnected === false
                ? "var(--md-sys-color-on-error-container)"
                : "var(--md-sys-color-on-tertiary-container)",
          }}
        >
          <div className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 shrink-0 text-base leading-none">!</span>
            <div className="flex flex-col gap-1">
              {engineConnected === false ? (
                <>
                  <span className="font-medium">Demo mode — the AI is not connected.</span>
                  <span className="opacity-80">
                    Replies below are canned placeholder text, not real answers. Add{" "}
                    <code className="rounded bg-black/25 px-1 py-0.5 text-xs">GEMINI_API_KEY</code> to{" "}
                    <code className="rounded bg-black/25 px-1 py-0.5 text-xs">
                      {process.env.NEXT_PUBLIC_VERCEL_ENV ? "Vercel env vars" : ".env.local"}
                    </code>{" "}
                    {process.env.NEXT_PUBLIC_VERCEL ? "and redeploy" : "and restart"} to get{" "}
                    <span className="font-medium">gemini-3.8-flash</span> responses.
                  </span>
                </>
              ) : (
                <>
                  <span className="font-medium">Showing canned content — Gemini is connected but returned an error.</span>
                  <span className="opacity-80">
                    The last reply was not generated by the model, so treat it as a placeholder.
                  </span>
                </>
              )}
              {demoNotice && <span className="text-xs opacity-70">{demoNotice}</span>}
            </div>
          </div>
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div
          className="m3-card-elevated relative flex flex-col items-center justify-center gap-6 overflow-hidden !rounded-[28px] !border !border-[var(--md-sys-color-outline-variant)] !p-8"
          style={STAGE_GLOW[orbState]}
        >
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <div className="aurora aurora-a" style={STAGE_AURORA[orbState]} />
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                style={{ background: STAGE_DOT[orbState] }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: STAGE_DOT[orbState] }}
              />
            </span>
            LIVE · Listening • 24 kHz • Real-time
          </div>

          <VoiceOrb state={orbState} level={mic.level} subscribe={mic.subscribe} size={280} />

          <p className="text-lg font-medium text-[var(--md-sys-color-on-surface)]">{STATE_LABEL[orbState]}</p>

          <div className="w-full max-w-md">
            <AudioVisualizer subscribe={mic.subscribe} idle={!active} barColor={STAGE_DOT[orbState]} />
          </div>

          <VoiceControls active={active} muted={muted} onToggleTalk={toggleTalk} onInterrupt={interrupt} onToggleMute={() => setMuted((m) => !m)} />

          <VoicePicker compact className="w-full max-w-md" />

          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
            Press <kbd className="rounded bg-[var(--md-sys-color-surface-container-highest)] px-1.5 py-0.5">Space</kbd> to talk ·{" "}
            <kbd className="rounded bg-[var(--md-sys-color-surface-container-highest)] px-1.5 py-0.5">Esc</kbd> to interrupt
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="m3-card flex-1 !rounded-[28px]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                Real-time Transcript
                {engineConnected === false && (
                  <span className="m3-badge ml-2 bg-[var(--md-sys-color-error-container)] !text-[var(--md-sys-color-on-error-container)]">
                    demo mode
                  </span>
                )}
              </h2>
              <button onClick={() => setShowTranscript((s) => !s)} className="m3-btn-text">
                {showTranscript ? "Hide" : "Show"} (T)
              </button>
            </div>
            {showTranscript && (
              <div className="h-72 lg:h-96">
                <LiveTranscript lines={lines} interimText={recog.interim} />
              </div>
            )}
          </div>

          <VoiceSignals
            energy={energy}
            pace={Math.min(100, Math.round((wpm / 180) * 100))}
            confidence={lines.length ? Math.round((lines.at(-1)?.confidence ?? 0.9) * 100) : 0}
            tone={energy > 55 ? "Energetic" : energy > 20 ? "Calm" : "Quiet"}
            wpm={wpm || 0}
          />
        </div>
      </div>
    </div>
  );
}
