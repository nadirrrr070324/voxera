"use client";

import { useEffect, useRef } from "react";
import type { MicMetrics } from "@/hooks/useMicrophone";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: [number, number, number], b: [number, number, number], k: number) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
}

/**
 * Renders a real waveform + frequency bar visualisation driven by live
 * microphone analyser data, with gradient fills, peak-hold caps and a mirrored
 * floor reflection. Falls back to a gentle idle animation when no subscription
 * is supplied (e.g. mic not yet enabled).
 */
export function AudioVisualizer({
  subscribe,
  height = 96,
  barColor = "#818cf8",
  idle = false,
}: {
  subscribe?: (cb: (m: MicMetrics) => void) => () => void;
  height?: number;
  barColor?: string;
  idle?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);
  const lastTsRef = useRef(0);
  const reducedRef = useRef(false);
  const latestRef = useRef<MicMetrics | null>(null);
  const smoothRef = useRef<Float32Array | null>(null);
  const peakRef = useRef<Float32Array | null>(null);

  const BARS = 64;

  useEffect(() => {
    if (!subscribe) {
      latestRef.current = null;
      return;
    }
    return subscribe((m) => {
      latestRef.current = m;
    });
  }, [subscribe]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    smoothRef.current = new Float32Array(BARS);
    peakRef.current = new Float32Array(BARS);
    lastTsRef.current = 0;

    reducedRef.current =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cssW = 0;
    let cssH = height;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas!.getBoundingClientRect();
      cssW = Math.max(1, Math.round(rect.width));
      cssH = Math.max(1, Math.round(rect.height || height));
      canvas!.width = Math.round(cssW * dpr);
      canvas!.height = Math.round(cssH * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);
    window.addEventListener("resize", resize);

    const [r1, g1, b1] = hexToRgb(barColor);
    const top: [number, number, number] = [r1, g1, b1];
    const bottom: [number, number, number] = [Math.round(r1 * 0.45), Math.round(g1 * 0.4), Math.round(b1 * 0.9)];

    const hasRoundRect = typeof ctx.roundRect === "function";

    const rect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      if (hasRoundRect) {
        ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
      } else {
        ctx.rect(x, y, w, h);
      }
    };

    function draw(ts: number) {
      if (!ctx || !canvas) return;
      const w = cssW;
      const h = cssH;
      const dt = lastTsRef.current ? Math.min(0.05, (ts - lastTsRef.current) / 1000) : 0.016;
      lastTsRef.current = ts;
      const motion = reducedRef.current ? 0 : 1;
      tRef.current += dt * motion;
      const t = tRef.current;

      ctx!.clearRect(0, 0, w, h);
      const smooth = smoothRef.current!;
      const peaks = peakRef.current!;
      const data = latestRef.current;
      const gap = 3;
      const barWidth = Math.max(1, w / BARS - gap);
      const mid = h / 2;
      const maxHalf = h * 0.46;

      for (let i = 0; i < BARS; i++) {
        let goal: number;
        const bins = data?.frequencies;
        if (bins && bins.length && !idle) {
          const lo = Math.floor(Math.pow(i / BARS, 1.7) * bins.length);
          const hi = Math.max(lo + 1, Math.floor(Math.pow((i + 1) / BARS, 1.7) * bins.length));
          let sum = 0;
          for (let j = lo; j < hi && j < bins.length; j++) sum += bins[j];
          goal = sum / (hi - lo) / 255;
        } else {
          const wob = Math.sin(t * 2 + i * 0.42) * 0.5 + 0.5;
          goal = (0.08 + wob * 0.22) * 0.55;
        }
        goal = Math.min(1, goal * (1 + (i / BARS) * 0.4));
        const cur = smooth[i];
        smooth[i] = cur + (goal - cur) * (goal > cur ? 0.5 : 0.13);
        const mag = smooth[i];

        const barH = Math.max(3, mag * maxHalf * 2);
        const x = i * (barWidth + gap);
        const y = mid - barH / 2;

        const c = mix(bottom, top, Math.min(1, mag * 1.15 + i / BARS * 0.35));
        const grad = ctx!.createLinearGradient(0, y, 0, y + barH);
        grad.addColorStop(0, `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.95)`);
        grad.addColorStop(1, `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.32)`);
        ctx!.fillStyle = grad;
        rect(x, y, barWidth, barH, 3);
        ctx!.fill();

        // peak-hold cap with slow fall
        const pIdx = i;
        const pNow = Math.max(peaks[pIdx] - dt * 0.55, mag);
        peaks[pIdx] = pNow;
        const capY = mid - pNow * maxHalf - 1;
        ctx!.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.95)`;
        rect(x, capY, barWidth, 2, 1);
        ctx!.fill();

        // mirrored reflection fading downwards
        const reflectH = barH * 0.28;
        const rg = ctx!.createLinearGradient(0, mid + barH / 2, 0, mid + barH / 2 + reflectH);
        rg.addColorStop(0, `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.22)`);
        rg.addColorStop(1, `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0)`);
        ctx!.fillStyle = rg;
        rect(x, mid + barH / 2, barWidth, reflectH, 3);
        ctx!.fill();
      }

      // centre baseline
      ctx!.fillStyle = `rgba(${r1}, ${g1}, ${b1}, 0.14)`;
      ctx!.fillRect(0, mid - 0.5, w, 1);

      if (!reducedRef.current) {
        rafRef.current = requestAnimationFrame(draw);
      }
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      ro?.disconnect();
    };
  }, [barColor, idle, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height }}
      className="drop-shadow-[0_0_24px_rgba(99,102,241,0.25)]"
      aria-hidden="true"
    />
  );
}
