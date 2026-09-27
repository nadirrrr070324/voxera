"use client";

import { useEffect } from "react";

export type ShortcutMap = Partial<{
  onTalk: () => void;
  onInterrupt: () => void;
  onMute: () => void;
  onToggleTranscript: () => void;
  onCycleLanguage: () => void;
}>;

export function useKeyboardShortcuts(map: ShortcutMap) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          map.onTalk?.();
          break;
        case "Escape":
          map.onInterrupt?.();
          break;
        case "KeyM":
          map.onMute?.();
          break;
        case "KeyT":
          map.onToggleTranscript?.();
          break;
        case "KeyL":
          map.onCycleLanguage?.();
          break;
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [map]);
}
