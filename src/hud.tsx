// Komponen overlay 2D khusus video ini: kartu angka, grafik tekanan rem, daftar langkah, wipe transisi.
import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {clockAt} from "./camera";
import {clamp} from "./components";
import {stage, CarState} from "./sim";
import {BODY, C, HEAD, MONO} from "./theme";
import {SceneProps} from "./timing";
import {V3} from "./world/geo";

export const useCar = (p: SceneProps, i = 0): CarState => {
  const f = useCurrentFrame();
  const c = clockAt(p.start + f, p.all, p.frames);
  return stage(c.id, c.local, c.m, c.dur).cars[i];
};
export const carPoint = (c: CarState, y = 1.9): V3 => [c.x, y, -c.s];

/** Frame (relatif scene) saat bumper depan mobil `i` mencapai jarak s. */
export const frameAtFront = (p: SceneProps, i: number, s: number): number => {
  const m = clockAt(p.start, p.all, p.frames).m;
  const id = clockAt(p.start, p.all, p.frames).id;
  for (let l = 0; l < p.dur; l++) {
    const c = stage(id, l, m, p.dur).cars[i];
    if (c && c.s + 2.2 >= s) return l;
  }
  return p.dur;
};

export const Card: React.FC<{at: number; top?: number; left?: number; width?: number; children: React.ReactNode; until?: number}> = ({at, top = 470, left = 64, width = 520, children, until}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = spring({frame: f - at, fps, config: {damping: 15, stiffness: 170}});
  const o = until !== undefined ? 1 - interpolate(f, [until, until + 8], [0, 1], clamp) : 1;
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width,
        background: "rgba(255,255,255,0.96)",
        borderRadius: 26,
        padding: "20px 26px 22px",
        boxShadow: "0 14px 36px rgba(20,24,34,0.35)",
        transform: `translateY(${interpolate(s, [0, 1], [24, 0])}px) scale(${interpolate(s, [0, 1], [0.94, 1])})`,
        opacity: s * o,
      }}
    >
      {children}
    </div>
  );
};

export const CardHead: React.FC<{text: string}> = ({text}) => (
  <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 21, letterSpacing: 1.5, color: C.dim, textTransform: "uppercase"}}>{text}</div>
);

export const BigNum: React.FC<{value: string; unit: string; color?: string}> = ({value, unit, color = C.ink}) => (
  <div style={{fontFamily: HEAD, fontWeight: 800, color, lineHeight: 1.05, marginTop: 6}}>
    <span style={{fontSize: 104, letterSpacing: -2}}>{value}</span>
    <span style={{fontSize: 44, marginLeft: 10}}>{unit}</span>
  </div>
);

export const Caption: React.FC<{text: string}> = ({text}) => (
  <div style={{fontFamily: BODY, fontWeight: 600, fontSize: 25, color: "#5b6270", marginTop: 6}}>{text}</div>
);

/** Baris batang perbandingan (kering vs basah). */
export const Bar: React.FC<{label: string; value: number; max: number; color: string; k: number; unit?: string}> = ({label, value, max, color, k, unit = "m"}) => (
  <div style={{marginTop: 14}}>
    <div style={{display: "flex", justifyContent: "space-between", fontFamily: HEAD, fontWeight: 800, fontSize: 30, color: C.ink}}>
      <span>{label}</span>
      <span>
        {Math.round(value * k)} {unit}
      </span>
    </div>
    <div style={{height: 22, background: "#E7E2D6", borderRadius: 11, marginTop: 6, overflow: "hidden"}}>
      <div style={{width: `${(value / max) * 100 * k}%`, height: "100%", background: color, borderRadius: 11}} />
    </div>
  </div>
);

export const SlowPill: React.FC<{at: number; text: string}> = ({at, text}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = spring({frame: f - at, fps, config: {damping: 14, stiffness: 190}});
  const blink = Math.floor(f / 12) % 2 === 0;
  return (
    <div
      style={{
        position: "absolute",
        top: 190,
        right: 150,
        transform: `scale(${s})`,
        transformOrigin: "right top",
        background: C.siren,
        color: "#fff",
        fontFamily: MONO,
        fontWeight: 700,
        fontSize: 24,
        letterSpacing: 1.5,
        padding: "8px 16px",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
      }}
    >
      <span style={{width: 14, height: 14, borderRadius: 7, background: "#fff", opacity: blink ? 1 : 0.25}} />
      {text}
    </div>
  );
};

/** Grafik animasi: tekanan rem (gerigi) vs putaran roda. Tanpa ABS: roda jatuh ke nol. */
export const PressureGraph: React.FC<{at: number; rateAt: number}> = ({at, rateAt}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = spring({frame: f - at, fps, config: {damping: 16, stiffness: 160}});
  const prog = interpolate(f, [at + 8, at + 120], [0, 1], clamp);
  const W = 880;
  const H = 150;
  const N = 140;
  const pts = (fn: (x: number) => number) =>
    Array.from({length: Math.round(N * prog) + 1}, (_, i) => `${(i / N) * (W - 40) + 20},${H - 14 - fn(i / N) * (H - 40)}`).join(" ");
  // tekanan: naik cepat, dilepas sebagian (gerigi) ~14x
  const press = (x: number) => 0.55 + 0.4 * (((x * 14) % 1) < 0.6 ? ((x * 14) % 1) / 0.6 : 1 - (((x * 14) % 1) - 0.6) / 0.4) * 1;
  const wheel = (x: number) => 0.62 + 0.1 * Math.sin(x * 14 * Math.PI * 2 + 1.2) * 0.6 - x * 0.25;
  const wheelNoAbs = (x: number) => Math.max(0, 0.8 - x * 6);
  const hl = f >= rateAt;
  return (
    <div
      style={{
        position: "absolute",
        left: 100,
        top: 1080,
        width: W + 24,
        background: "rgba(22,26,34,0.93)",
        borderRadius: 26,
        padding: "20px 24px 14px",
        transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
        opacity: s,
        boxShadow: "0 14px 36px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{display: "flex", gap: 24, fontFamily: HEAD, fontWeight: 800, fontSize: 25, alignItems: "center"}}>
        <span style={{color: "#ff6a5c"}}>▬ tekanan rem</span>
        <span style={{color: C.scan}}>▬ putaran roda</span>
        <span style={{color: "#aab1be", fontWeight: 600}}>┄ tanpa ABS</span>
        <span
          style={{
            marginLeft: "auto",
            background: hl ? C.tape : "transparent",
            color: hl ? C.ink : "transparent",
            padding: "0 12px",
            borderRadius: 10,
            transform: `scale(${hl ? 1 : 0.8})`,
          }}
        >
          belasan × / detik
        </span>
      </div>
      <svg width={W} height={H} style={{display: "block", marginTop: 6}}>
        <line x1={20} y1={H - 14} x2={W - 20} y2={H - 14} stroke="#3a414f" strokeWidth={2} />
        <polyline points={pts(wheelNoAbs)} fill="none" stroke="#aab1be" strokeWidth={4} strokeDasharray="8 8" />
        <polyline points={pts(wheel)} fill="none" stroke={C.scan} strokeWidth={6} strokeLinejoin="round" />
        <polyline points={pts(press)} fill="none" stroke="#ff6a5c" strokeWidth={6} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export const Step: React.FC<{n: number; at: number; text: string; hl: string; y: number}> = ({n, at, text, hl, y}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = spring({frame: f - at, fps, config: {damping: 14, stiffness: 190}});
  return (
    <div style={{display: "flex", alignItems: "center", gap: 18, marginTop: y === 0 ? 0 : 16, transform: `translateX(${interpolate(s, [0, 1], [-40, 0])}px)`, opacity: s}}>
      <div style={{width: 58, height: 58, borderRadius: 29, background: C.tape, color: C.ink, fontFamily: HEAD, fontWeight: 800, fontSize: 34, display: "grid", placeItems: "center"}}>{n}</div>
      <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 44, color: C.ink}}>
        {text} <span style={{background: C.tape, borderRadius: 10, padding: "0 12px"}}>{hl}</span>
      </div>
    </div>
  );
};

/** Wipe transisi antar-scene: dua pita diagonal menyapu layar. Pasang di Video.tsx di sekitar batas scene. */
export const Wipe: React.FC<{span: number}> = ({span}) => {
  // frame lokal 0..span: pita masuk (0→span/2) menutup penuh, lalu keluar (span/2→span)
  const f = useCurrentFrame();
  const half = span / 2;
  const e = (x: number) => 1 - Math.pow(1 - x, 3);
  const enter = e(interpolate(f, [0, half], [0, 1], clamp));
  const leave = e(interpolate(f, [half, span], [0, 1], clamp));
  const bands = [
    {c: C.ink, d: 0},
    {c: C.tape, d: 2},
  ];
  return (
    <AbsoluteFill style={{pointerEvents: "none", overflow: "hidden"}}>
      {bands.map((b, i) => {
        const a = interpolate(enter - (i === 0 ? 0 : 0.12), [0, 1], [-130, 0], clamp);
        const o = interpolate(leave - (i === 0 ? 0.12 : 0), [0, 1], [0, 130], clamp);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: -300,
              background: i === 0 ? b.c : b.c,
              transform: `translateX(${(a + o) * 12}px) skewX(-14deg)`,
              zIndex: i === 0 ? 2 : 1,
              opacity: leave >= 1 ? 0 : 1,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
