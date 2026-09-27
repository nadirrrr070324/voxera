"use client";

import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/types";
import { cn } from "@/lib/cn";

export function LanguageSelector({
  value,
  onChange,
  label,
  className,
}: {
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
  label?: string;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)]", className)}>
      {label && <span className="uppercase tracking-wider">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as LanguageCode)}
        className="m3-field cursor-pointer"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option
            key={lang.code}
            value={lang.code}
            className="bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]"
          >
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </label>
  );
}
