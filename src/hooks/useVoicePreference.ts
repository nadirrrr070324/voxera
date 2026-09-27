"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_VOICE, isValidVoice } from "@/lib/voices";

const STORAGE_KEY = "voxera.voice";
const CHANGE_EVENT = "voxera:voicechange";

/**
 * Reads the persisted TTS voice via useSyncExternalStore so there is no
 * setState-in-effect and the server snapshot stays deterministic during SSR.
 */
function getSnapshot(): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isValidVoice(stored) ? stored : DEFAULT_VOICE;
  } catch {
    // localStorage can be unavailable (private mode / SSR)
    return DEFAULT_VOICE;
  }
}

function getServerSnapshot(): string {
  return DEFAULT_VOICE;
}

function subscribe(onStoreChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

export function useVoicePreference() {
  const voice = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setVoice = useCallback((name: string) => {
    if (!isValidVoice(name)) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, name);
    } catch {
      // ignore persistence failures — selection still applies for this session
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { voice, setVoice };
}
