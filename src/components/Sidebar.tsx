"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/app/live-voice", label: "Live Voice", icon: "🎙️" },
  { href: "/app/live-translate", label: "Live Translate", icon: "🌐" },
  { href: "/app/transcribe", label: "Transcribe", icon: "📝" },
  { href: "/app/voice-intelligence", label: "Voice Intelligence", icon: "📊" },
  { href: "/app/conversations", label: "Conversations", icon: "💬" },
  { href: "/app/action-items", label: "Action Items", icon: "✅" },
  { href: "/app/audio-lab", label: "Audio Lab", icon: "🧪" },
  { href: "/app/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetch("/api/engine-status")
      .then((r) => r.json())
      .then((d) => setConnected(Boolean(d.connected)))
      .catch(() => setConnected(false));
  }, []);

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] px-4 py-6 lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-3 px-3">
        <span
          className="grid h-10 w-10 place-items-center rounded-[14px] text-base font-bold text-[var(--md-sys-color-on-primary-container)]"
          style={{ background: "var(--md-sys-color-primary-container)" }}
        >
          V
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-lg font-medium">VOXERA</span>
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
            Voice-native AI
          </span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("m3-nav-item", active && "m3-nav-item-active")}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="m3-card mt-4 flex flex-col gap-1 !rounded-[20px] !p-4">
        <p className="m3-label">Gemini Engine</p>
        <p
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            connected
              ? "text-[var(--md-sys-color-tertiary)]"
              : "text-[var(--md-sys-color-error)]",
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              connected ? "bg-[var(--md-sys-color-tertiary)]" : "bg-[var(--md-sys-color-error)]",
            )}
          />
          {connected ? "Connected" : "Demo Mode"}
        </p>
        <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
          {connected ? "gemini-3.8-flash + TTS" : "Add GEMINI_API_KEY"}
        </p>
      </div>
    </aside>
  );
}
