"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MicPermission = "idle" | "requesting" | "granted" | "denied" | "unsupported";

export type MicMetrics = {
  level: number; // 0..1 smoothed amplitude
  frequencies: Uint8Array | null;
  waveform: Uint8Array | null;
};

/**
 * Captures the microphone via getUserMedia + Web Audio API and exposes a
 * live analyser so components can render real waveform / frequency
 * visualisations instead of decorative fake animations.
 */
export function useMicrophone() {
  const [permission, setPermission] = useState<MicPermission>("idle");
  const [level, setLevel] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const freqRef = useRef<Uint8Array | null>(null);
  const waveRef = useRef<Uint8Array | null>(null);
  const listenersRef = useRef<Set<(m: MicMetrics) => void>>(new Set());

  const subscribe = useCallback((cb: (m: MicMetrics) => void) => {
    listenersRef.current.add(cb);
    return () => listenersRef.current.delete(cb);
  }, []);

  const tickRef = useRef<() => void>(() => {});

  useEffect(() => {
    tickRef.current = () => {
      const analyser = analyserRef.current;
      if (!analyser) return;
      const freq = freqRef.current!;
      const wave = waveRef.current!;
      analyser.getByteFrequencyData(freq as Uint8Array<ArrayBuffer>);
      analyser.getByteTimeDomainData(wave as Uint8Array<ArrayBuffer>);

      let sum = 0;
      for (let i = 0; i < wave.length; i++) {
        const v = (wave[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / wave.length);
      setLevel((prev) => prev * 0.7 + Math.min(1, rms * 4) * 0.3);

      listenersRef.current.forEach((cb) => cb({ level: rms, frequencies: freq, waveform: wave }));
      rafRef.current = requestAnimationFrame(() => tickRef.current());
    };
  });

  const start = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission("unsupported");
      return;
    }
    setPermission("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;
      freqRef.current = new Uint8Array(analyser.frequencyBinCount);
      waveRef.current = new Uint8Array(analyser.fftSize);
      setPermission("granted");
      rafRef.current = requestAnimationFrame(() => tickRef.current());
    } catch {
      setPermission("denied");
    }
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => stop, [stop]);

  return { permission, level, start, stop, subscribe, stream: streamRef };
}
