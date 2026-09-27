"use client";

import { cn } from "@/lib/cn";

export function VoiceControls({
  active,
  muted,
  onToggleTalk,
  onInterrupt,
  onToggleMute,
}: {
  active: boolean;
  muted: boolean;
  onToggleTalk: () => void;
  onInterrupt: () => void;
  onToggleMute: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        onClick={onToggleTalk}
        className={cn(
          "flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition",
          active
            ? "bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)]"
            : "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:brightness-110",
        )}
      >
        {active ? "◼ End Session" : "🎙️ Start Talking"}
      </button>
      <button
        onClick={onToggleMute}
        aria-pressed={muted}
        className={cn(
          "rounded-full border px-4 py-3 text-sm transition",
          muted
            ? "border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]"
            : "m3-btn-outlined",
        )}
      >
        {muted ? "🔇 Muted" : "🔊 Mute"}
      </button>
      <button onClick={onInterrupt} className="m3-btn-outlined !px-4 !py-3">
        ⎋ Interrupt
      </button>
    </div>
  );
}
