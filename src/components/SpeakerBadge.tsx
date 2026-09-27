import { cn } from "@/lib/cn";

const PALETTE = [
  "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)]",
  "bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border-[var(--md-sys-color-tertiary)]",
  "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary)]",
  "bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline)]",
];

export function SpeakerBadge({ speaker, className }: { speaker: string; className?: string }) {
  const num = parseInt(speaker.replace(/\D/g, ""), 10) || 0;
  const color = PALETTE[num % PALETTE.length];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        color,
        className,
      )}
    >
      {speaker}
    </span>
  );
}
