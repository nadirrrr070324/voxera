"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionAlternative = { transcript: string; confidence: number };
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
  length: number;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported() {
  return getRecognitionCtor() !== null;
}

export type LiveSegment = {
  id: string;
  text: string;
  isFinal: boolean;
  confidence: number;
  createdAt: number;
};

export function useSpeechRecognition(lang: string, onFinal: (text: string, confidence: number) => void) {
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  // Assume supported until proven otherwise on mount, to avoid SSR/client
  // hydration mismatches — this is corrected immediately after mount.
  const [supported, setSupported] = useState(true);
  const recogRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  const shouldRunRef = useRef(false);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feature detection requires browser APIs unavailable during render
    setSupported(isSpeechRecognitionSupported());
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    shouldRunRef.current = true;
    const recog = new Ctor();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = lang;
    recog.onstart = () => setListening(true);
    recog.onresult = (ev) => {
      let interimText = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        const alt = res[0];
        if (res.isFinal) {
          onFinalRef.current(alt.transcript.trim(), alt.confidence || 0.9);
        } else {
          interimText += alt.transcript;
        }
      }
      setInterim(interimText);
    };
    recog.onerror = () => {
      // swallow — will attempt restart via onend if still desired
    };
    recog.onend = () => {
      setListening(false);
      setInterim("");
      if (shouldRunRef.current) {
        try {
          recog.start();
        } catch {
          /* ignore rapid restart errors */
        }
      }
    };
    recogRef.current = recog;
    try {
      recog.start();
    } catch {
      /* ignore */
    }
  }, [lang]);

  const stop = useCallback(() => {
    shouldRunRef.current = false;
    recogRef.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  useEffect(() => stop, [stop]);

  return { interim, listening, supported, start, stop };
}
