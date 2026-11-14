export type V3 = [number, number, number];
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** 0→1 antara frame a dan b. */
export const win = (f: number, a: number, b: number) => clamp01((f - a) / Math.max(1, b - a));
export const smooth = (x: number) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};
