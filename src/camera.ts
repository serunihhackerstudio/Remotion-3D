import * as THREE from "three";
import {Key, Moments, STORY} from "./story";
import {Timing} from "./timing";
import {V3, easeInOut, lerp, lerp3} from "./world/geo";

export type Pose = {pos: V3; look: V3; fov: number};
export type Clock = {
  idx: number; // urutan scene
  id: string;
  local: number; // frame relatif scene
  dur: number;
  m: Moments; // momen scene ini
};

export const WIDTH = 1080;
export const HEIGHT = 1920;
const BLEND = 22; // frame transisi kamera dari akhir scene sebelumnya

const starts = (frames: number[]) => frames.map((_, i) => frames.slice(0, i).reduce((a, b) => a + b, 0));

export const clockAt = (frame: number, timing: Timing, frames: number[]): Clock => {
  const st = starts(frames);
  let idx = 0;
  for (let i = 0; i < st.length; i++) if (frame >= st[i]) idx = i;
  const s = timing.scenes[idx];
  const dur = frames[idx];
  const beat = STORY[s.id];
  return {idx, id: s.id, local: frame - st[idx], dur, m: beat ? beat.moments(s, dur) : {}};
};

const keysOf = (id: string, m: Moments, dur: number): Key[] => {
  const beat = STORY[id];
  if (!beat) return [{f: 0, pos: [0, 40, 120], look: [0, 20, 0], fov: 40}];
  return [...beat.cam(m, dur)].sort((a, b) => a.f - b.f);
};

const poseFromKeys = (keys: Key[], f: number): Pose => {
  const fovOf = (k: Key) => k.fov ?? 40;
  if (f <= keys[0].f) return {pos: keys[0].pos, look: keys[0].look, fov: fovOf(keys[0])};
  const last = keys[keys.length - 1];
  if (f >= last.f) return {pos: last.pos, look: last.look, fov: fovOf(last)};
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f >= a.f && f <= b.f) {
      const raw = (f - a.f) / Math.max(1, b.f - a.f);
      const k = a.lin ? raw : easeInOut(raw);
      return {pos: lerp3(a.pos, b.pos, k), look: lerp3(a.look, b.look, k), fov: lerp(fovOf(a), fovOf(b), k)};
    }
  }
  return {pos: last.pos, look: last.look, fov: fovOf(last)};
};

/** Posisi kamera di frame global. Awal tiap scene disambung mulus dari akhir scene sebelumnya. */
export const poseAt = (frame: number, timing: Timing, frames: number[]): Pose => {
  const c = clockAt(frame, timing, frames);
  const here = poseFromKeys(keysOf(c.id, c.m, c.dur), c.local);
  if (c.idx === 0 || c.local >= BLEND || STORY[c.id]?.cut) return here;
  const prevS = timing.scenes[c.idx - 1];
  const prevDur = frames[c.idx - 1];
  const prevM = STORY[prevS.id] ? STORY[prevS.id].moments(prevS, prevDur) : {};
  const prev = poseFromKeys(keysOf(prevS.id, prevM, prevDur), prevDur);
  const k = easeInOut(c.local / BLEND);
  return {pos: lerp3(prev.pos, here.pos, k), look: lerp3(prev.look, here.look, k), fov: lerp(prev.fov, here.fov, k)};
};

const cam = new THREE.PerspectiveCamera(40, WIDTH / HEIGHT, 0.2, 6000);
const v = new THREE.Vector3();

/** Proyeksikan titik 3D ke piksel layar 1080×1920 (untuk label & garis ukur di overlay 2D). */
export const project = (p: V3, pose: Pose): {x: number; y: number; visible: boolean} => {
  cam.fov = pose.fov;
  cam.position.set(...pose.pos);
  cam.lookAt(...pose.look);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  v.set(...p).project(cam);
  return {x: ((v.x + 1) / 2) * WIDTH, y: ((1 - v.y) / 2) * HEIGHT, visible: v.z < 1 && v.z > -1};
};
