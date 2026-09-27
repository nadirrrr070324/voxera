"use client";

import { cn } from "@/lib/cn";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/types";

export function TranslationPanel({
  label,
  lang,
  active,
  originalText,
  translatedText,
  onSelect,
}: {
  label: string;
  lang: LanguageCode;
  active: boolean;
  originalText: string;
  translatedText: string;
  onSelect: () => void;
}) {
  const meta = SUPPORTED_LANGUAGES.find((l) => l.code === lang)!;
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-3 rounded-3xl border p-5 transition",
        active
          ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]"
          : "border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">{label}</p>
        <button
          onClick={onSelect}
          className={cn(
            "rounded-full px-3 py-1 text-xs transition",
            active ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]" : "border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]",
          )}
        >
          {active ? "🎙️ Speaking" : "Tap to speak"}
        </button>
      </div>
      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
        {meta.flag} {meta.label}
      </p>
      <div className="min-h-[64px] rounded-2xl bg-[var(--md-sys-color-surface-container-highest)] p-3 text-sm text-[var(--md-sys-color-on-surface)]">
        {originalText || <span className="text-[var(--md-sys-color-on-surface)]/25">Waiting for speech…</span>}
      </div>
      <div className="min-h-[64px] rounded-2xl border border-dashed border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] p-3 text-sm text-[var(--md-sys-color-on-surface)]">
        {translatedText || <span className="text-[var(--md-sys-color-outline)]">Translation appears here</span>}
      </div>
    </div>
  );
}
