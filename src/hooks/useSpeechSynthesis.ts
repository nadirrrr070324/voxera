"use client";

import { useCallback, useRef, useState } from "react";

export type SpeakOptions = {
  audioBase64?: string;
  mimeType?: string;
  rate?: number;
  pitch?: number;
  voiceName?: string;
  lang?: string;
  /** Called only on *natural* completion, never when the utterance is cancelled. */
  onDone?: () => void;
};

export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const generationRef = useRef(0);

  const cancel = useCallback(() => {
    // Bump the generation so any in-flight playback callbacks become stale and
    // are ignored — this keeps `onDone` from firing on a barge-in cancel.
    generationRef.current += 1;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioElRef.current) {
      audioElRef.current.onended = null;
      audioElRef.current.onerror = null;
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
    }
    setSpeaking(false);
  }, []);

  /** Plays server-provided audio (base64 wav) when available, falling back
   * to the browser's built-in speech synthesis voice otherwise. */
  const speak = useCallback(
    (text: string, opts?: SpeakOptions) => {
      cancel();
      const generation = generationRef.current;
      const finish = () => {
        if (generationRef.current !== generation) return;
        setSpeaking(false);
        opts?.onDone?.();
      };

      if (opts?.audioBase64) {
        const audio = new Audio(`data:${opts?.mimeType ?? "audio/wav"};base64,${opts.audioBase64}`);
        audioElRef.current = audio;
        setSpeaking(true);
        audio.onended = finish;
        audio.onerror = finish;
        audio.play().catch(finish);
        return;
      }
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = opts?.rate ?? 1;
      utter.pitch = opts?.pitch ?? 1;
      if (opts?.lang) utter.lang = opts.lang;
      if (opts?.voiceName) {
        const voice = window.speechSynthesis.getVoices().find((v) => v.name === opts?.voiceName);
        if (voice) utter.voice = voice;
      }
      utter.onstart = () => {
        if (generationRef.current === generation) setSpeaking(true);
      };
      utter.onend = finish;
      utter.onerror = finish;
      window.speechSynthesis.speak(utter);
    },
    [cancel],
  );

  return { speak, cancel, speaking };
}
