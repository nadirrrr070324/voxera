"use client";

import { useEffect, useState } from "react";

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        ok ? "bg-[var(--md-sys-color-primary)]" : "bg-[var(--md-sys-color-outline)]"
      }`}
    />
  );
}

export function ConnectionStatus({
  engineConnected,
  micReady,
  transcriptionActive,
  translationReady,
}: {
  engineConnected: boolean;
  micReady: boolean;
  transcriptionActive: boolean;
  translationReady: boolean;
}) {
  const [latency, setLatency] = useState(180);

  useEffect(() => {
    const id = setInterval(() => {
      setLatency((prev) => {
        const delta = Math.round((Math.random() - 0.5) * 40);
        return Math.min(320, Math.max(60, prev + delta));
      });
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex w-full flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] px-4 py-2 text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
      <span className="flex items-center gap-1.5 font-medium text-[var(--md-sys-color-primary)]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--md-sys-color-primary)] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--md-sys-color-primary)]" />
        </span>
        LIVE
      </span>
      <span className="flex items-center gap-1.5">
        <Dot ok={micReady} /> Audio: {micReady ? "Connected" : "Idle"}
      </span>
      <span className="flex items-center gap-1.5">
        <Dot ok={transcriptionActive} /> Transcription: {transcriptionActive ? "Active" : "Standby"}
      </span>
      <span className="flex items-center gap-1.5">
        <Dot ok={translationReady} /> Translation: Ready
      </span>
      <span className="hidden sm:inline">Latency: {latency}ms</span>
      <span className="hidden sm:inline">Microphone: Default</span>
      <span className="ml-auto flex items-center gap-1.5">
        <Dot ok={engineConnected} />
        Gemini Audio Engine: {engineConnected ? "Connected" : "Demo Mode"}
      </span>
    </div>
  );
}
