"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { GEMINI_VOICES } from "@/lib/voices";
import { useVoicePreference } from "@/hooks/useVoicePreference";

type Filter = "All" | "Female" | "Male";

/** Material 3 voice selector: search + gender filter + chip-style selection. */
export function VoicePicker({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { voice, setVoice } = useVoicePreference();
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GEMINI_VOICES.filter((v) => {
      if (filter !== "All" && v.gender !== filter) return false;
      if (!q) return true;
      return v.name.toLowerCase().includes(q) || v.style.toLowerCase().includes(q);
    });
  }, [filter, query]);

  const current = GEMINI_VOICES.find((v) => v.name === voice);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="m3-label">AI Voice</span>
        {(["All", "Female", "Male"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn("m3-chip", filter === f && "m3-chip-selected")}
          >
            {f}
          </button>
        ))}
        <div className="relative ml-auto">
          <button
            onClick={() => setOpen((o) => !o)}
            className="m3-chip m3-chip-selected"
            aria-expanded={open}
          >
            {current ? `${current.name} · ${current.style}` : voice}
            <span className={cn("ml-1 text-[10px] transition-transform", open && "rotate-180")}>▾</span>
          </button>
          {open && (
            <div className="m3-menu absolute right-0 z-50 mt-1 w-64">
              <div className="border-b border-[var(--md-sys-color-outline-variant)] p-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search voices"
                  className="m3-field w-full"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto p-1">
                {list.length === 0 && (
                  <p className="px-3 py-4 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    No voices match “{query}”
                  </p>
                )}
                {list.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => {
                      setVoice(v.name);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn("m3-menu-item w-full", v.name === voice && "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]")}
                  >
                    <span className="font-medium">{v.name}</span>
                    <span className="text-[11px] opacity-70">
                      {v.style} · {v.gender}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {!compact && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {list.map((v) => (
            <button
              key={v.name}
              onClick={() => setVoice(v.name)}
              className={cn("m3-voice-tile", v.name === voice && "m3-voice-tile-active")}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {v.name}
                {v.name === voice && <span className="text-[var(--md-sys-color-primary)]">●</span>}
              </span>
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                {v.style} · {v.gender}
              </span>
            </button>
          ))}
          {list.length === 0 && (
            <p className="col-span-full py-4 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
              No voices match your search or filter.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
