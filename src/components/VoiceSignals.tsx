"use client";

function Meter({ label, value }: { label: string; value: number }) {
  const dots = 5;
  const filled = Math.round((value / 100) * dots);
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-[var(--md-sys-color-on-surface-variant)]">{label}</span>
      <span className="flex gap-1">
        {Array.from({ length: dots }).map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${i < filled ? "bg-[var(--md-sys-color-primary)]" : "bg-[var(--md-sys-color-outline-variant)]"}`}
          />
        ))}
      </span>
    </div>
  );
}

export function VoiceSignals({
  energy,
  pace,
  confidence,
  tone,
  wpm,
}: {
  energy: number;
  pace: number;
  confidence: number;
  tone: string;
  wpm: number;
}) {
  return (
    <div className="m3-card">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">Voice Signals</p>
      <div className="flex flex-col gap-2.5">
        <Meter label="Energy" value={energy} />
        <Meter label="Pace" value={pace} />
        <Meter label="Confidence" value={confidence} />
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--md-sys-color-on-surface-variant)]">Tone</span>
          <span className="text-[var(--md-sys-color-on-surface)]">{tone}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--md-sys-color-on-surface-variant)]">Speaking Rate</span>
          <span className="text-[var(--md-sys-color-on-surface)]">{wpm} WPM</span>
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
        Detected vocal characteristics — derived from audio signal only, not a diagnosis of emotional state.
      </p>
    </div>
  );
}
