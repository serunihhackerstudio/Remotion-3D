// Pembuat geometri low-poly (dibuat sekali, digabung supaya render ringan).
import * as THREE from "three";
import {mergeGeometries} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {V3} from "./geo";

const UP = new THREE.Vector3(0, 1, 0);

/** Gabung banyak geometri jadi satu (semua dijadikan non-indexed dulu supaya cocok). */
export const merge = (list: THREE.BufferGeometry[]): THREE.BufferGeometry => {
  const prepared = list.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    n.deleteAttribute("uv");
    return n;
  });
  const out = mergeGeometries(prepared, false);
  if (!out) throw new Error("mergeGeometries gagal");
  out.computeVertexNormals();
  return out;
};

/** Balok/silinder tipis dari titik a ke b. */
export const beam = (a: V3, b: V3, th: number, round = false): THREE.BufferGeometry => {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const g = round ? new THREE.CylinderGeometry(th, th, len, 10) : new THREE.BoxGeometry(th, len, th);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
  g.applyMatrix4(new THREE.Matrix4().compose(va.clone().add(vb).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
  return g;
};
