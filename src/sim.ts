// Simulasi fisika sederhana (satuan meter & detik). Satu sumber kebenaran untuk dunia 3D,
// label, dan angka di layar: semua angka di video dihitung dari sini.
//   jarak berhenti = v² / (2·μ·g);  jarak reaksi = v · t_reaksi
import {V3, smooth, clamp01} from "./world/geo";

export const V0 = 80 / 3.6; // 22,2 m/s
export const G = 9.81;
export const REACT = 1.0; // detik
export const MU = {dry: 0.7, wet: 0.4, locked: 0.3};
export const LANE_A = -3.6; // jalur kering (mobil kuning)
export const LANE_B = 3.6; // jalur basah (mobil putih)
export const ROAD_HALF = 7;
export const CONE_S = 40; // posisi kerucut di scene ban terkunci
export const FAR_S = 75; // kerucut jauh (scene jarak)

export const stopDist = (mu: number) => (V0 * V0) / (2 * mu * G);
export const DIST = {
  react: V0 * REACT, // ≈ 22 m
  dry: stopDist(MU.dry), // ≈ 36 m
  wet: stopDist(MU.wet), // ≈ 63 m
  totalDry: V0 * REACT + stopDist(MU.dry), // ≈ 58 m
  totalWet: V0 * REACT + stopDist(MU.wet), // ≈ 85 m
};

/** Jarak tempuh s(t) dengan rem dimulai di t=brakeAt. */
export const sOf = (t: number, mu: number, brakeAt = REACT) => {
  if (t <= brakeAt) return V0 * t;
  const a = mu * G;
  const tau = Math.min(t - brakeAt, V0 / a);
  return V0 * brakeAt + V0 * tau - 0.5 * a * tau * tau;
};
export const vOf = (t: number, mu: number, brakeAt = REACT) => {
  if (t <= brakeAt) return V0;
  return Math.max(0, V0 - mu * G * (t - brakeAt));
};

export type CarState = {
  id: "A" | "B";
  kind: "hatch" | "sedan";
  color: string;
  x: number;
  s: number; // posisi sepanjang jalan (z dunia = -s)
  yaw: number;
  steer: number; // belok roda depan
  spin: number; // putaran roda (rad)
  brake: boolean;
  pitch: number; // nunduk saat mengerem
  smoke: number; // 0..1 asap ban (mobil terkunci)
  speed: number; // m/s
};
export type ConeState = {pos: V3; rot: V3};
export type Mark = {x: number; s0: number; s1: number};
export type Stage = {cars: CarState[]; cones: ConeState[]; marks: Mark[]; wet: number; rain: number; far: number; lab: number};

export const YELLOW = "#C8F03A";
export const WHITE = "#F4F1EA";
const R = 0.36;

const mkCar = (id: "A" | "B", t: number, mu: number, brakeAt = REACT, extra: Partial<CarState> = {}): CarState => {
  const s = sOf(t, mu, brakeAt);
  const v = vOf(t, mu, brakeAt);
  const braking = t > brakeAt && v > 0.1;
  return {
    id,
    kind: id === "A" ? "hatch" : "sedan",
    color: id === "A" ? YELLOW : WHITE,
    x: id === "A" ? LANE_A : LANE_B,
    s,
    yaw: 0,
    steer: 0,
    spin: s / R,
    brake: braking,
    pitch: braking ? 0.035 * Math.min(1, v / V0 + 0.3) : 0,
    smoke: 0,
    speed: v,
    ...extra,
  };
};

/** Kerucut: 2 baris × 3 di dekat pusat jalur. */
export const coneCluster = (cx: number, s: number): V3[] => {
  const out: V3[] = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) out.push([cx + (c - 1) * 1.15, 0, -(s + r * 1.6 + (c === 1 ? 0.5 : 0))]);
  return out;
};

const still = (c: V3[]): ConeState[] => c.map((p) => ({pos: p, rot: [0, 0, 0]}));

/** Kerucut terhantam mobil di depan (front = s + 2,2). Menghitung kapan tiap kerucut kena, lalu terbang. */
export const hitCones = (cx: number, sCone: number, carS: (t: number) => number, speedAt: (t: number) => number, t: number): ConeState[] => {
  return coneCluster(cx, sCone).map((p, i) => {
    const sc = -p[2];
    let th = Infinity;
    for (let k = 0; k < 400; k++) {
      const tt = k * 0.02;
      if (carS(tt) + 2.2 >= sc) {
        th = tt;
        break;
      }
    }
    if (t < th) return {pos: p, rot: [0, 0, 0]};
    const dt = t - th;
    const v = speedAt(th);
    const dir = i % 3 === 0 ? -1 : i % 3 === 2 ? 1 : 0;
    const vx = dir * (2.2 + (i % 2)) + (i % 2 ? 0.8 : -0.6);
    const vz = v * (0.8 + 0.12 * (i % 3));
    const vy = 5 + (i % 3);
    const y = Math.max(0, vy * dt - 4.9 * dt * dt);
    const grounded = y <= 0 && dt > 0.5;
    const e = Math.min(dt, 1.6);
    return {pos: [p[0] + vx * e, y, p[2] - vz * e * (grounded ? 0.7 : 1)], rot: [dt * (3 + i), dt * 2, dt * (4 - i)]};
  });
};

/** Titik waktu → nilai t_sim dengan interpolasi linear antar titik (frame, t). */
export const tmap = (l: number, pts: [number, number][]) => {
  if (l <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [f0, t0] = pts[i];
    const [f1, t1] = pts[i + 1];
    if (l <= f1) return t0 + ((l - f0) / Math.max(1, f1 - f0)) * (t1 - t0);
  }
  return pts[pts.length - 1][1];
};

export type M = Record<string, number>;
const FPS = 30;

/** Waktu simulasi tiap scene (dipakai juga untuk kamera & label). */
export const timeOf = (id: string, l: number, m: M, d: number): number => {
  switch (id) {
    case "s1":
      return l / FPS - 1.0;
    case "s2":
      return tmap(l, [[0, -0.45], [m.go2, 0], [d - 6, 1.0]]);
    case "s3":
      return tmap(l, [[0, 1.0], [d - 24, 1.0 + V0 / (MU.dry * G)], [d, 1.0 + V0 / (MU.dry * G)]]);
    case "s4":
      return tmap(l, [[0, -0.3], [d - 20, 1.0 + V0 / (MU.wet * G)], [d, 1.0 + V0 / (MU.wet * G) + 0.05]]);
    case "s5":
      return Math.max(0, (l - m.go) / FPS) * 0.62;
    case "s6":
      return l / FPS;
    case "s7":
      return Math.max(0, (l - m.go) / FPS) * 0.62;
    default:
      return l / FPS;
  }
};

const SWERVE = {t0: 0.55, t1: 1.75, dx: 3.6};
/** Posisi lateral & yaw mobil ABS saat menghindar: smoothstep. */
const swerve = (t: number) => {
  const k = clamp01((t - SWERVE.t0) / (SWERVE.t1 - SWERVE.t0));
  const x = SWERVE.dx * smooth(k);
  const dk = 1e-3;
  const k2 = clamp01((t + dk - SWERVE.t0) / (SWERVE.t1 - SWERVE.t0));
  const dxdt = (SWERVE.dx * (smooth(k2) - smooth(k))) / dk;
  return {x, yaw: -Math.atan2(dxdt, Math.max(4, V0 * 0.9)) };
};
export const swerveX = (t: number) => swerve(t).x;

export const stage = (id: string, l: number, m: M, d: number): Stage => {
  const t = timeOf(id, l, m, d);
  const base: Stage = {cars: [], cones: [], marks: [], wet: 0, rain: 0, far: 0, lab: 0};
  switch (id) {
    case "s1": {
      return {...base, cars: [mkCar("A", t, MU.dry, 99)]};
    }
    case "s2": {
      return {...base, cars: [mkCar("A", t, MU.dry)], cones: still(coneCluster(LANE_A, FAR_S))};
    }
    case "s3": {
      return {...base, cars: [mkCar("A", t, MU.dry)], cones: still(coneCluster(LANE_A, FAR_S))};
    }
    case "s4": {
      const cars = [mkCar("A", t, MU.dry), mkCar("B", t, MU.wet)];
      const carB = (tt: number) => sOf(tt, MU.wet);
      return {...base, wet: 1, rain: 1, cars, cones: hitCones(LANE_B, FAR_S, carB, (tt) => vOf(tt, MU.wet), t).concat(still(coneCluster(LANE_A, FAR_S)))};
    }
    case "s5": {
      // mobil putih: rem mentok, ban terkunci → meluncur lurus ke kerucut
      const brakeAt = 0.15;
      const lockS = sOf(brakeAt, MU.locked, brakeAt);
      const sCar = (tt: number) => sOf(tt, MU.locked, brakeAt);
      const v = vOf(t, MU.locked, brakeAt);
      const s = sCar(t);
      const car = mkCar("B", t, MU.locked, brakeAt, {
        spin: lockS / R,
        steer: -0.5 * smooth((t - 0.5) / 0.5),
        yaw: 0.02 * smooth((t - 0.6) / 1.2),
        smoke: t > brakeAt && v > 1 ? 1 : 0,
        pitch: 0.05,
      });
      return {
        ...base,
        wet: 1,
        rain: 1,
        cars: [car],
        marks: [
          {x: LANE_B - 0.7, s0: lockS - 1.4, s1: s - 1.4},
          {x: LANE_B + 0.7, s0: lockS - 1.4, s1: s - 1.4},
        ],
        cones: hitCones(LANE_B, CONE_S, sCar, (tt) => vOf(tt, MU.locked, brakeAt), t).concat(still(coneCluster(LANE_A, CONE_S))),
      };
    }
    case "s6": {
      return {...base, lab: 1};
    }
    case "s7": {
      const brakeAt = 0.15;
      const sw = swerve(t);
      const A = mkCar("A", t, MU.wet, brakeAt, {x: LANE_A + sw.x, yaw: sw.yaw, steer: sw.yaw * 5, pitch: 0.035});
      const lockS = sOf(brakeAt, MU.locked, brakeAt);
      const sCar = (tt: number) => sOf(tt, MU.locked, brakeAt);
      const B = mkCar("B", t, MU.locked, brakeAt, {spin: lockS / R, smoke: t > brakeAt && vOf(t, MU.locked, brakeAt) > 1 ? 1 : 0, pitch: 0.05});
      return {
        ...base,
        wet: 1,
        rain: 1,
        cars: [A, B],
        marks: [
          {x: LANE_B - 0.7, s0: lockS - 1.4, s1: sCar(t) - 1.4},
          {x: LANE_B + 0.7, s0: lockS - 1.4, s1: sCar(t) - 1.4},
        ],
        cones: hitCones(LANE_B, CONE_S, sCar, (tt) => vOf(tt, MU.locked, brakeAt), t).concat(still(coneCluster(LANE_A, CONE_S))),
      };
    }
    default: {
      // s8: dua mobil melaju tenang
      const tt = l / FPS;
      return {...base, wet: 0, cars: [mkCar("A", tt, MU.dry, 99, {s: -30 + V0 * 0.55 * tt, speed: V0 * 0.55, brake: false, pitch: 0, spin: (-30 + V0 * 0.55 * tt) / R}), mkCar("B", tt, MU.dry, 99, {s: -42 + V0 * 0.5 * tt, speed: V0 * 0.5, brake: false, pitch: 0, spin: (-42 + V0 * 0.5 * tt) / R})]};
    }
  }
};
