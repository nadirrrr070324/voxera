"use client";

import { SpeakerBadge } from "./SpeakerBadge";
import { cn } from "@/lib/cn";

export type TranscriptLine = {
  id: string;
  speaker: string;
  text: string;
  isFinal: boolean;
  interrupted?: boolean;
  confidence?: number;
  /** True when this AI line is canned fallback content, not a real model answer. */
  demo?: boolean;
  time: string;
};

export function LiveTranscript({ lines, interimText }: { lines: TranscriptLine[]; interimText?: string }) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto pr-1" role="log" aria-live="polite">
      {lines.length === 0 && !interimText && (
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Your conversation will appear here as you speak.</p>
      )}
      {lines.map((line) => (
        <div key={line.id} className={cn("flex flex-col gap-1", line.speaker === "AI" ? "items-start" : "items-start")}>
          <div className="flex items-center gap-2">
            <SpeakerBadge speaker={line.speaker} />
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">{line.time}</span>
            {line.interrupted && (
              <span className="m3-badge border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-high)] !text-[var(--md-sys-color-error)]">
                interrupted
              </span>
            )}
            {line.demo && (
              <span
                className="rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-high)] px-2 py-0.5 text-[10px] text-[var(--md-sys-color-error)]"
                title="Canned demo reply — not a real model answer"
              >
                demo reply
              </span>
            )}
            {typeof line.confidence === "number" && (
              <span className="text-[10px] text-[var(--md-sys-color-on-surface)]/25">{Math.round(line.confidence * 100)}% conf.</span>
            )}
          </div>
          <p
            className={cn(
              "max-w-2xl rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              line.speaker === "AI"
                ? "border border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
                : "border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]",
              line.demo &&
                "border-dashed border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]",
            )}
          >
            {line.text}
          </p>
        </div>
      ))}
      {interimText && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <SpeakerBadge speaker="You" />
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">now</span>
          </div>
          <p className="max-w-2xl rounded-2xl border border-dashed border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] px-4 py-2.5 text-sm italic text-[var(--md-sys-color-on-surface-variant)]">
            {interimText}
            <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-[var(--md-sys-color-on-surface-variant)] align-middle" />
          </p>
        </div>
      )}
    </div>
  );
}
