"use client";

import { useEffect, useRef } from "react";
import type { MicMetrics } from "@/hooks/useMicrophone";

export type OrbState = "idle" | "listening" | "thinking" | "speaking" | "interrupted";

type Palette = {
  /** inner -> outer gradient stops of the core sphere */
  core: [string, string, string];
  /** primary accent for the spectrum ring + particles */
  accent: string;
  /** secondary accent for gradient blending */
  accent2: string;
  /** ambient halo colour */
  halo: string;
  /** ring assembly rotation speed (revolutions/sec) */
  spin: number;
  /** how strongly the mic level deforms the orb (0..1.2) */
  reactive: number;
};

const PALETTES: Record<OrbState, Palette> = {
  idle: {
    core: ["#e6e0e9", "#49454f", "#0f0d13"],
    accent: "#cac4d0",
    accent2: "#938f99",
    halo: "#6750a4",
    spin: 0.05,
    reactive: 0.35,
  },
  listening: {
    core: ["#eaddff", "#6750a4", "#1d1035"],
    accent: "#d0bcff",
    accent2: "#4f378b",
    halo: "#6750a4",
    spin: 0.34,
    reactive: 1,
  },
  thinking: {
    core: ["#ffd8e4", "#7d5260", "#2a1520"],
    accent: "#efb8c8",
    accent2: "#633b48",
    halo: "#7d5260",
    spin: 0.85,
    reactive: 0.7,
  },
  speaking: {
    core: ["#e0fbff", "#00687a", "#04222a"],
    accent: "#67e8f9",
    accent2: "#00687a",
    halo: "#006a7a",
    spin: 0.26,
    reactive: 1.05,
  },
  interrupted: {
    core: ["#ffdad6", "#93000a", "#2c0509"],
    accent: "#ffb4ab",
    accent2: "#93000a",
    halo: "#ba1a1a",
    spin: 0.5,
    reactive: 1.2,
  },
};

const TAU = Math.PI * 2;
const BARS = 72;
const PARTICLES = 90;
const RIPPLE_LIFE = 1.15;

type Ripple = { born: number; speed: number; width: number };

/** Deterministic pseudo-random in [0,1) — no allocation, stable across frames. */
function seeded(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function rgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function VoiceOrb({
  state,
  level,
  size = 280,
  subscribe,
  className,
}: {
  state: OrbState;
  level: number; // 0..1
  size?: number;
  /** Optional live mic metrics for a true spectrum/waveform response. */
  subscribe?: (cb: (m: MicMetrics) => void) => () => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useRef(size);

  const levelRef = useRef(level);
  const stateRef = useRef(state);
  const metricsRef = useRef<MicMetrics | null>(null);
  const reducedRef = useRef(false);

  const timeRef = useRef(0);
  const lastTsRef = useRef(0);
  const smoothRef = useRef(0);
  const peakRef = useRef(0);
  const lastStateRef = useRef(state);
  const lastSpawnRef = useRef(0);
  const spectrumRef = useRef<Float32Array | null>(null);
  const ripplesRef = useRef<Ripple[]>([]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!subscribe) {
      metricsRef.current = null;
      return;
    }
    return subscribe((m) => {
      metricsRef.current = m;
    });
  }, [subscribe]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    reducedRef.current =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    spectrumRef.current = new Float32Array(BARS);
    timeRef.current = 0;
    lastTsRef.current = 0;
    smoothRef.current = 0;
    peakRef.current = 0;
    ripplesRef.current = [];

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const css = Math.max(1, Math.round(rect.width || sizeRef.current));
      canvas.width = Math.round(css * dpr);
      canvas.height = Math.round(css * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);
    window.addEventListener("resize", resize);

    const draw = (ts: number) => {
      const box = sizeRef.current;
      const rect = canvas.getBoundingClientRect();
      const S = Math.max(1, rect.width || box);
      const cx = S / 2;
      const cy = S / 2;

      const dt = lastTsRef.current ? Math.min(0.05, (ts - lastTsRef.current) / 1000) : 0.016;
      lastTsRef.current = ts;
      const motion = reducedRef.current ? 0 : 1;
      timeRef.current += dt * motion;
      const t = timeRef.current;

      const st = stateRef.current;
      const p = PALETTES[st];

      // --- signal conditioning: fast attack, slow release ---------------------
      const target = Math.min(1, Math.max(0, levelRef.current));
      const k = target > smoothRef.current ? 0.34 : 0.08;
      smoothRef.current += (target - smoothRef.current) * k;
      const lvl = smoothRef.current;
      peakRef.current = Math.max(lvl, peakRef.current - dt * 0.5);
      const energy = lvl * p.reactive;

      if (st !== lastStateRef.current) {
        lastStateRef.current = st;
        ripplesRef.current.push({
          born: t,
          speed: st === "interrupted" ? 1.5 : 1,
          width: 3,
        });
        if (ripplesRef.current.length > 12) ripplesRef.current.shift();
      }
      if (energy > 0.1 && t - lastSpawnRef.current > 0.26) {
        lastSpawnRef.current = t;
        ripplesRef.current.push({ born: t, speed: 0.85, width: 2 });
        if (ripplesRef.current.length > 12) ripplesRef.current.shift();
      }

      const baseR = S * 0.185;
      const breathe = Math.sin(t * 1.5) * 0.018;
      const jitter = st === "interrupted" ? Math.sin(t * 46) * 0.012 * energy : 0;
      const coreR = baseR * (1 + breathe + energy * 0.24 + jitter);
      const outerR = S * 0.47;

      ctx.clearRect(0, 0, S, S);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // --- 1. ambient halo ----------------------------------------------------
      const halo = ctx.createRadialGradient(cx, cy, baseR * 0.2, cx, cy, outerR * 1.15);
      halo.addColorStop(0, rgba(p.halo, 0.34 + energy * 0.34));
      halo.addColorStop(0.45, rgba(p.halo, 0.1 + energy * 0.12));
      halo.addColorStop(1, rgba(p.halo, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, S, S);

      // --- 2. rotating conic aura ring ---------------------------------------
      if (typeof ctx.createConicGradient === "function") {
        const auraR = outerR * (0.86 + energy * 0.06);
        const cg = ctx.createConicGradient(t * p.spin * TAU, cx, cy);
        cg.addColorStop(0, rgba(p.accent, 0));
        cg.addColorStop(0.22, rgba(p.accent, 0.4 + energy * 0.3));
        cg.addColorStop(0.5, rgba(p.accent2, 0));
        cg.addColorStop(0.74, rgba(p.accent2, 0.3 + energy * 0.25));
        cg.addColorStop(1, rgba(p.accent, 0));
        ctx.strokeStyle = cg;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, auraR, 0, TAU);
        ctx.stroke();
      }

      // --- 3. expanding ripples ---------------------------------------------
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        const age = t - rp.born;
        if (age > RIPPLE_LIFE || age < 0) {
          ripples.splice(i, 1);
          continue;
        }
        const k2 = age / RIPPLE_LIFE;
        const r = coreR * 0.5 + age * outerR * 0.85 * rp.speed;
        if (r > outerR * 1.1) continue;
        ctx.strokeStyle = rgba(p.accent, (1 - k2) * 0.4);
        ctx.lineWidth = Math.max(0.4, rp.width * (1 - k2));
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.stroke();
      }

      // --- 4. particle field --------------------------------------------------
      const pInner = coreR * 1.04;
      const pSpan = outerR - pInner;
      for (let i = 0; i < PARTICLES; i++) {
        const base = seeded(i, 1);
        const dir = seeded(i, 3) > 0.5 ? 1 : -1;
        const speed = 0.05 + seeded(i, 2) * 0.55;
        const depth = seeded(i, 4);
        const twinkle = 0.55 + 0.45 * Math.sin(t * 2.6 + base * 12.9);
        const a = base * TAU + t * p.spin * speed * dir * 1.7;
        const push = depth * (1 - energy * 0.22) + Math.sin(t * 0.9 + base * TAU) * 0.03;
        const r = pInner + pSpan * Math.min(1, Math.max(0, push));
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        const sz = 0.5 + seeded(i, 5) * 1.9 * (0.5 + energy);
        // motion-blur tail
        const ta = a - dir * t * p.spin * speed * 1.7 * 0.16;
        ctx.strokeStyle = rgba(i % 3 === 0 ? p.accent2 : p.accent, 0.16 * twinkle);
        ctx.lineWidth = sz;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ta) * r, cy + Math.sin(ta) * r);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = rgba(i % 4 === 0 ? p.accent2 : p.accent, 0.75 * twinkle);
        ctx.beginPath();
        ctx.arc(x, y, sz, 0, TAU);
        ctx.fill();
      }

      // --- 5. spectrum ring (real FFT bins when available) --------------------
      const spec = spectrumRef.current!;
      const bins = metricsRef.current?.frequencies ?? null;
      const ringR = coreR + S * 0.035;
      for (let i = 0; i < BARS; i++) {
        let goal: number;
        if (bins && bins.length) {
          // log-ish bin grouping reads far more like a real spectrum
          const lo = Math.floor(Math.pow(i / BARS, 1.7) * bins.length);
          const hi = Math.max(lo + 1, Math.floor(Math.pow((i + 1) / BARS, 1.7) * bins.length));
          let sum = 0;
          for (let j = lo; j < hi && j < bins.length; j++) sum += bins[j];
          goal = sum / (hi - lo) / 255;
        } else {
          const wob = Math.sin(t * 2.3 + i * 0.36) * 0.5 + 0.5;
          goal = (0.07 + wob * 0.2) * (0.4 + energy * 1.5);
        }
        goal = Math.min(1, goal * (1 + (i / BARS) * 0.55));
        const cur = spec[i];
        spec[i] = cur + (goal - cur) * (goal > cur ? 0.45 : 0.1);
        const mag = spec[i];

        const a = (i / BARS) * TAU - Math.PI / 2 + t * p.spin * 0.35;
        const len = S * 0.012 + mag * S * (0.085 + energy * 0.075);
        const x1 = cx + Math.cos(a) * ringR;
        const y1 = cy + Math.sin(a) * ringR;
        const x2 = cx + Math.cos(a) * (ringR + len);
        const y2 = cy + Math.sin(a) * (ringR + len);
        const nearPeak = i / BARS < peakRef.current;
        ctx.strokeStyle = rgba(
          i % 2 === 0 ? p.accent : p.accent2,
          (nearPeak ? 0.95 : 0.55) * (0.35 + mag),
        );
        ctx.lineWidth = nearPeak ? 3 : 1.6 + mag * 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // --- 6. radial oscilloscope -------------------------------------------
      const wave = metricsRef.current?.waveform ?? null;
      const oR = ringR + S * 0.105;
      ctx.strokeStyle = rgba(p.accent, 0.5);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * TAU + t * 0.12;
        let amp: number;
        if (wave && wave.length) {
          amp = ((wave[Math.floor((i / 128) * wave.length)] ?? 128) - 128) / 128;
        } else {
          amp =
            (Math.sin(t * 3 + (i / 128) * TAU * 3) * 0.5 +
              Math.sin(t * 1.7 + (i / 128) * TAU * 5) * 0.5) *
            0.1 *
            (0.3 + energy);
        }
        const r = oR + amp * S * 0.05 * (0.4 + energy);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // --- 7. thinking: orbiting arc spinner ---------------------------------
      if (st === "thinking" || st === "interrupted") {
        const arcs = st === "interrupted" ? 5 : 3;
        const ar = outerR * 0.93;
        ctx.lineWidth = 2.4;
        for (let i = 0; i < arcs; i++) {
          const a0 = t * p.spin * 2.2 + (i / arcs) * TAU;
          const span = (TAU / arcs) * 0.55;
          ctx.strokeStyle = rgba(i % 2 ? p.accent2 : p.accent, 0.85);
          ctx.beginPath();
          ctx.arc(cx, cy, ar, a0, a0 + span);
          ctx.stroke();
        }
      }

      // --- 8. core sphere -----------------------------------------------------
      const coreGrad = ctx.createRadialGradient(
        cx - coreR * 0.32,
        cy - coreR * 0.36,
        coreR * 0.05,
        cx,
        cy,
        coreR,
      );
      coreGrad.addColorStop(0, p.core[0]);
      coreGrad.addColorStop(0.5, p.core[1]);
      coreGrad.addColorStop(1, p.core[2]);
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, TAU);
      ctx.fill();

      // inner glow so the core reads as emissive, not flat
      const inner = ctx.createRadialGradient(cx, cy, coreR * 0.55, cx, cy, coreR);
      inner.addColorStop(0, rgba(p.halo, 0));
      inner.addColorStop(1, rgba(p.halo, 0.45));
      ctx.fillStyle = inner;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, TAU);
      ctx.fill();

      // specular highlight
      ctx.save();
      ctx.globalAlpha = 0.5;
      const spec1 = ctx.createRadialGradient(
        cx - coreR * 0.3,
        cy - coreR * 0.34,
        0,
        cx - coreR * 0.3,
        cy - coreR * 0.34,
        coreR * 0.62,
      );
      spec1.addColorStop(0, "rgba(255,255,255,0.85)");
      spec1.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = spec1;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, TAU);
      ctx.fill();
      ctx.restore();

      // rim light
      ctx.strokeStyle = rgba(p.accent, 0.55 + energy * 0.4);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 0.995, 0, TAU);
      ctx.stroke();

      // --- 9. level ring gauge around the core -------------------------------
      ctx.strokeStyle = rgba(p.accent2, 0.28);
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 1.02, -Math.PI / 2, -Math.PI / 2 + TAU * energy * 0.92);
      ctx.stroke();

      if (!reducedRef.current) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      ro?.disconnect();
      ctxRef.current = null;
    };
  }, []);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", maxWidth: size, aspectRatio: "1 / 1", height: "auto" }}
      className={className ?? "drop-shadow-[0_0_70px_rgba(99,102,241,0.4)]"}
      aria-hidden="true"
    />
  );
}
