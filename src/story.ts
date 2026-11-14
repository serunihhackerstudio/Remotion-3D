// Momen penting (frame relatif scene, disinkronkan ke kata) + jalur kamera tiap scene.
// Satu sumber kebenaran: dipakai dunia 3D (World) dan overlay 2D (scenes/*).
import {SceneTiming, wordFrame} from "./timing";
import {M, stage} from "./sim";
import {WHEEL_POS} from "./world/AbsWheel";
import {V3} from "./world/geo";

export type Key = {f: number; pos: V3; look: V3; fov?: number; lin?: boolean};
export type Moments = Record<string, number>;

type Beat = {
  cut?: boolean; // true = kamera memulai pose barunya langsung (ada wipe transisi)
  moments: (t: SceneTiming, dur: number) => Moments;
  cam: (m: Moments, dur: number) => Key[];
};

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** Posisi mobil (indeks i) pada frame f scene `id`. */
const carAt = (id: string, f: number, m: M, d: number, i = 0): V3 => {
  const c = stage(id, f, m, d).cars[i];
  return [c.x, 0, -c.s];
};
/** Kunci kamera yang menempel pada mobil dengan offset relatif. */
const follow = (id: string, f: number, m: M, d: number, off: V3, lookOff: V3 = [0, 0.8, 0], fov = 40, i = 0): Key => {
  const p = carAt(id, f, m, d, i);
  return {f, pos: add(p, off), look: add(p, lookOff), fov};
};

type WP = {f: number; off: V3; look?: V3; fov?: number};
const ez = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** Kamera menempel mobil: offset relatif diinterpolasi halus di antara waypoint, dibuat sebagai kunci linear rapat. */
const followPath = (id: string, m: M, d: number, wps: WP[], i = 0): Key[] => {
  const keys: Key[] = [];
  for (let f = 0; f <= d + 5; f += 5) {
    const ff = Math.min(f, d);
    let a = wps[0];
    let b = wps[wps.length - 1];
    for (let j = 0; j < wps.length - 1; j++) if (ff >= wps[j].f && ff <= wps[j + 1].f) {a = wps[j]; b = wps[j + 1];}
    const k = ff <= a.f ? 0 : ff >= b.f ? 1 : ez((ff - a.f) / (b.f - a.f));
    const mix = (x: V3, y: V3): V3 => [x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k];
    const off = mix(a.off, b.off);
    const lk = mix(a.look ?? [0, 0.8, 0], b.look ?? [0, 0.8, 0]);
    const p = carAt(id, ff, m, d, i);
    keys.push({f: ff, pos: add(p, off), look: add(p, lk), fov: (a.fov ?? 40) + ((b.fov ?? 40) - (a.fov ?? 40)) * k, lin: true});
  }
  return keys;
};

export const STORY: Record<string, Beat> = {
  // HOOK: mobil kuning melaju 80 km/jam, kamera menyambut lalu menempel dari belakang
  s1: {
    moments: (t, d) => ({title: 4, speed: wordFrame(t, "kecepatan", 0.4, d), stop: wordFrame(t, "berhenti", 0.8, d)}),
    cam: (m, d) => [
      ...followPath("s1", m, d, [
        {f: 0, off: [11, 1.5, -34], look: [0, 0.9, 0], fov: 38},
        {f: 70, off: [11.5, 2.4, -4], look: [0, 0.9, 0], fov: 40},
        {f: d, off: [-6.5, 4.4, 17], look: [0, 0.6, -6], fov: 42},
      ]),
    ],
  },
  // LANGKAH 1: waktu reaksi (slow motion), mobil melaju 22 m sebelum rem
  s2: {
    cut: true,
    moments: (t, d) => ({go2: wordFrame(t, "pertama", 0.04, d), react: wordFrame(t, "bereaksi", 0.5, d), m22: wordFrame(t, "22", 0.85, d)}),
    cam: (_m, d) => [
      {f: 0, pos: [10, 10, 20], look: [-3, 0.5, -6], fov: 40},
      {f: d, pos: [10, 13, -4], look: [-3, 0.2, -28], fov: 42},
    ],
  },
  // LANGKAH 2: jarak pengereman di aspal kering, kamera naik melihat seluruh jarak
  s3: {
    moments: (t, d) => ({brake: 4, dry: wordFrame(t, "kering", 0.4, d), m36: wordFrame(t, "36", 0.62, d), stop: d - 26}),
    cam: (_m, d) => [
      {f: 0, pos: [10, 13, -4], look: [-3, 0.2, -28], fov: 42},
      {f: d, pos: [9, 32, 12], look: [-1, 0, -36], fov: 44},
    ],
  },
  // LANGKAH 3: balapan kering vs basah, jarak berhenti 58 m vs 85 m
  s4: {
    cut: true,
    moments: (t, d) => ({wet: wordFrame(t, "basah", 0.06, d), half: wordFrame(t, "separuh", 0.35, d), m63: wordFrame(t, "63", 0.62, d), m85: wordFrame(t, "85", 0.88, d)}),
    cam: (_m, d) => [
      {f: 0, pos: [-1, 7, 18], look: [0, 0.8, -14], fov: 40},
      {f: Math.round(d * 0.55), pos: [9, 24, 6], look: [0, 0, -44], fov: 42},
      {f: d, pos: [8, 36, -6], look: [0, 0, -52], fov: 44},
    ],
  },
  // MASALAH: ban terkunci → meluncur lurus menabrak kerucut
  s5: {
    cut: true,
    moments: (t, d) => ({go: 6, lock: wordFrame(t, "terkunci", 0.3, d), slide: wordFrame(t, "meluncur", 0.55, d), steer: wordFrame(t, "setir", 0.8, d)}),
    cam: (m, d) => [
      ...followPath("s5", m, d, [
        {f: 0, off: [-6.5, 2.4, 13], look: [0.5, 0.7, -3], fov: 40},
        {f: Math.round(d * 0.55), off: [-8.5, 3.4, 9], look: [1, 0.7, -5], fov: 41},
        {f: d, off: [-10, 5.5, 2], look: [2, 0.5, -12], fov: 43},
      ]),
    ],
  },
  // SOLUSI: roda terbuka — sensor, cakram, kaliper berdenyut
  s6: {
    cut: true,
    moments: (t, d) => ({abs: wordFrame(t, "ABS", 0.12, d), sensor: wordFrame(t, "sensor", 0.3, d), wheel: wordFrame(t, "putaran", 0.45, d), pulse: wordFrame(t, "melepas", 0.62, d), rate: wordFrame(t, "belasan", 0.82, d)}),
    cam: (_m, d) => {
      const [x, y, z] = WHEEL_POS;
      return [
        {f: 0, pos: [x + 19, y + 4.5, z + 11], look: [x, y - 0.9, z], fov: 40},
        {f: Math.round(d * 0.5), pos: [x + 13.5, y + 1.6, z + 4.5], look: [x, y - 0.9, z], fov: 40},
        {f: d, pos: [x + 11.5, y + 1.2, z - 8], look: [x, y - 0.8, z], fov: 40},
      ];
    },
  },
  // HASIL: kuning menyelinap di antara kerucut, putih menabrak
  s7: {
    cut: true,
    moments: (t, d) => ({go: 6, spin: wordFrame(t, "berputar", 0.3, d), turn: wordFrame(t, "membelokkan", 0.6, d)}),
    cam: (_m, d) => [
      {f: 0, pos: [0, 5.5, 14], look: [0, 1, -14], fov: 40},
      {f: Math.round(d * 0.6), pos: [9, 12, 2], look: [0, 0.5, -34], fov: 42},
      {f: d, pos: [10, 15, -14], look: [0, 0.5, -46], fov: 44},
    ],
  },
  // PENUTUP: dua mobil melaju tenang, kamera mengorbit, ajakan komentar
  s8: {
    cut: true,
    moments: (t, d) => ({inj: wordFrame(t, "injak", 0.2, d), jan: wordFrame(t, "jangan", 0.33, d), bel: wordFrame(t, "belokkan", 0.46, d), bet: wordFrame(t, "bergetar", 0.62, d), cta: wordFrame(t, "pernah", 0.88, d), fade: Math.max(0, d - 24)}),
    cam: (m, d) => [
      ...followPath("s8", m, d, [
        {f: 0, off: [-8, 6.5, 10], look: [0, 0.8, -4], fov: 38},
        {f: Math.round(d * 0.5), off: [8, 7.5, 9], look: [0, 0.8, -4], fov: 40},
        {f: d, off: [-3, 9.5, 22], look: [0, 0.6, -8], fov: 42},
      ]),
    ],
  },
};
