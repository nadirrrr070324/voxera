"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { VoiceOrb, type OrbState } from "./VoiceOrb";
import { SpeakerBadge } from "./SpeakerBadge";

type Step =
  | { kind: "listening"; caption: string; duration: number }
  | { kind: "partial"; text: string; duration: number }
  | { kind: "ai"; text: string; duration: number }
  | { kind: "interrupt"; duration: number }
  | { kind: "language"; from: string; to: string; original: string; translated: string; duration: number }
  | { kind: "multispeaker"; lines: { speaker: string; text: string }[]; duration: number }
  | { kind: "actions"; items: string[]; duration: number }
  | { kind: "done"; duration: number };

const SCRIPT: Step[] = [
  { kind: "listening", caption: "Demo starting — the AI begins listening", duration: 1400 },
  { kind: "partial", text: "Hey, can you explain how quantum computing works...", duration: 2200 },
  { kind: "ai", text: "Sure — think of a quantum computer as exploring many possibilities at once, using qubits instead of ordinary bits...", duration: 2600 },
  { kind: "interrupt", duration: 1400 },
  { kind: "ai", text: "Absolutely — simpler version: it's like flipping thousands of coins at once instead of one at a time.", duration: 2400 },
  {
    kind: "language",
    from: "🇮🇳 Hindi",
    to: "🇬🇧 English",
    original: "आप कहाँ से आए हैं?",
    translated: "Where are you from?",
    duration: 2600,
  },
  {
    kind: "multispeaker",
    lines: [
      { speaker: "Speaker 1", text: "We should launch the beta next Friday." },
      { speaker: "Speaker 2", text: "Before that, we need to finish authentication." },
      { speaker: "Speaker 3", text: "I'll handle the testing once that's ready." },
    ],
    duration: 3200,
  },
  {
    kind: "actions",
    items: ["Finish authentication — Speaker 2 — Thursday", "Complete testing — Speaker 3 — Thursday", "Prepare beta launch — Speaker 1 — Friday"],
    duration: 3200,
  },
  { kind: "done", duration: 2000 },
];

const STEP_orb_STATE: Record<Step["kind"], OrbState> = {
  listening: "listening",
  partial: "listening",
  ai: "speaking",
  interrupt: "interrupted",
  language: "thinking",
  multispeaker: "listening",
  actions: "thinking",
  done: "idle",
};

const STEP_LEVEL: Record<Step["kind"], number> = {
  listening: 0.35,
  partial: 0.45,
  ai: 0.6,
  interrupt: 0.7,
  language: 0.3,
  multispeaker: 0.4,
  actions: 0.25,
  done: 0.1,
};

const DEMO_AURORA: Record<OrbState, CSSProperties> = {
  idle: { ["--aurora-1" as string]: "#4f46e5" },
  listening: { ["--aurora-1" as string]: "#4f7bff" },
  thinking: { ["--aurora-1" as string]: "#a855f7" },
  speaking: { ["--aurora-1" as string]: "#22d3ee" },
  interrupted: { ["--aurora-1" as string]: "#f97316" },
};

const DEMO_GLOW: Record<OrbState, CSSProperties> = {
  idle: { boxShadow: "0 0 120px -30px rgba(79,70,229,0.5)" },
  listening: { boxShadow: "0 0 140px -30px rgba(79,123,255,0.6)" },
  thinking: { boxShadow: "0 0 140px -30px rgba(168,85,247,0.6)" },
  speaking: { boxShadow: "0 0 140px -30px rgba(34,211,238,0.6)" },
  interrupted: { boxShadow: "0 0 140px -30px rgba(249,115,22,0.6)" },
};

export function DemoModeRunner({ onClose }: { onClose: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [typed, setTyped] = useState<{ step: number; text: string }>({ step: -1, text: "" });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = SCRIPT[stepIndex];
  const orbState = STEP_orb_STATE[step.kind];
  const typedText = typed.step === stepIndex ? typed.text : "";

  useEffect(() => {
    if (step.kind === "partial") {
      let i = 0;
      const interval = setInterval(() => {
        i += 1;
        setTyped({ step: stepIndex, text: step.text.slice(0, i) });
        if (i >= step.text.length) clearInterval(interval);
      }, 28);
      timeoutRef.current = setTimeout(() => {
        clearInterval(interval);
        setStepIndex((s) => Math.min(s + 1, SCRIPT.length - 1));
      }, step.duration);
      return () => {
        clearInterval(interval);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    timeoutRef.current = setTimeout(() => {
      setStepIndex((s) => (s + 1 < SCRIPT.length ? s + 1 : s));
    }, step.duration);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  const isLast = stepIndex === SCRIPT.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[color-mix(in_srgb,var(--md-sys-color-scrim)_85%,transparent)] backdrop-blur-md p-4">
      <div
        className="m3-card-elevated relative flex w-full max-w-2xl flex-col items-center gap-6 overflow-hidden !rounded-[28px] !border !border-[var(--md-sys-color-outline-variant)] p-8 text-center"
        style={DEMO_GLOW[orbState]}
      >
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="aurora aurora-a" style={DEMO_AURORA[orbState]} />
        </div>
        <button onClick={onClose} className="absolute right-4 top-4 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]">
          ✕
        </button>
        <p className="text-xs uppercase tracking-widest text-[var(--md-sys-color-primary)]">Live Demo</p>
        <VoiceOrb state={orbState} level={STEP_LEVEL[step.kind]} size={220} />

        <div className="min-h-[140px] w-full">
          {step.kind === "listening" && <p className="text-[var(--md-sys-color-on-surface)]">{step.caption}</p>}

          {step.kind === "partial" && (
            <div className="flex flex-col items-center gap-2">
              <SpeakerBadge speaker="You" />
              <p className="italic text-[var(--md-sys-color-on-surface)]">{typedText}</p>
            </div>
          )}

          {step.kind === "ai" && (
            <div className="flex flex-col items-center gap-2">
              <SpeakerBadge speaker="AI" />
              <p className="text-[var(--md-sys-color-on-surface)]">{step.text}</p>
            </div>
          )}

          {step.kind === "interrupt" && (
            <p className="font-medium text-[var(--md-sys-color-error)]">
              Interrupted — the AI stops instantly and listens to you
            </p>
          )}

          {step.kind === "language" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{step.from} → {step.to}</p>
              <p className="text-[var(--md-sys-color-on-surface)]">{step.original}</p>
              <p className="text-[var(--md-sys-color-on-surface)]">{step.translated}</p>
            </div>
          )}

          {step.kind === "multispeaker" && (
            <div className="flex flex-col gap-2 text-left">
              {step.lines.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <SpeakerBadge speaker={l.speaker} />
                  <p className="text-sm text-[var(--md-sys-color-on-surface)]">{l.text}</p>
                </div>
              ))}
            </div>
          )}

          {step.kind === "actions" && (
            <div className="flex flex-col gap-2 text-left">
              {step.items.map((item, i) => (
                <div key={i} className="rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-high)] px-3 py-2 text-sm text-[var(--md-sys-color-on-surface)]">
                  ✓ {item}
                </div>
              ))}
            </div>
          )}

          {step.kind === "done" && (
            <p className="text-lg font-medium text-[var(--md-sys-color-on-surface)]">Voice → Understanding → Translation → Action. That&apos;s Voxera.</p>
          )}
        </div>

        <div className="flex w-full items-center gap-2">
          {SCRIPT.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= stepIndex ? "bg-[var(--md-sys-color-primary)]" : "bg-[var(--md-sys-color-outline-variant)]"}`} />
          ))}
        </div>

        <div className="flex gap-3">
          {!isLast ? (
            <button
              onClick={() => setStepIndex(SCRIPT.length - 1)}
              className="rounded-full border border-[var(--md-sys-color-outline)] px-4 py-2 text-xs text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
            >
              Skip to end
            </button>
          ) : (
            <button
              onClick={onClose}
              className="rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] px-5 py-2 text-sm font-semibold text-[var(--md-sys-color-on-surface)]"
            >
              Close demo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
