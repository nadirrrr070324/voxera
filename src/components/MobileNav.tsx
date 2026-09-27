"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/app/live-voice", label: "Voice", icon: "🎙️" },
  { href: "/app/live-translate", label: "Translate", icon: "🌐" },
  { href: "/app/transcribe", label: "Transcribe", icon: "📝" },
  { href: "/app/action-items", label: "Actions", icon: "✅" },
  { href: "/app/conversations", label: "History", icon: "💬" },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      {NAV.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("m3-nav-bar-item", active && "m3-nav-bar-item-active")}
            aria-current={active ? "page" : undefined}
          >
            <span className="m3-nav-bar-item-icon text-lg leading-none">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
