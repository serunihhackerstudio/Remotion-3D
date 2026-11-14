import React, {useMemo} from "react";
import * as THREE from "three";
import {random} from "remotion";
import {merge} from "./build";
import {ConeState, Mark} from "../sim";
import {LANE_A, LANE_B, ROAD_HALF} from "../sim";

const Z0 = 160;
const Z1 = -520;
const LEN = Z0 - Z1;
const ZC = (Z0 + Z1) / 2;

const box = (w: number, h: number, d: number, x: number, y: number, z: number) => {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
};

const WALLS = ["#F2E8D5", "#EBD3B0", "#E2DCCD", "#F6EEDC", "#E4C4A8", "#D4DEE1"];

export const City: React.FC = () => {
  const parts = useMemo(() => {
    const walls: Record<string, THREE.BufferGeometry[]> = {};
    const roofs: THREE.BufferGeometry[] = [];
    const glass: THREE.BufferGeometry[] = [];
    const trunk: THREE.BufferGeometry[] = [];
    const leaf: THREE.BufferGeometry[] = [];
    const pole: THREE.BufferGeometry[] = [];
    const lamp: THREE.BufferGeometry[] = [];
    let n = 0;
    for (const side of [-1, 1]) {
      let z = Z0 - 6;
      while (z > Z1) {
        const w = 12 + random(`w${n}`) * 12;
        const dd = 14 + random(`d${n}`) * 12;
        const h = 8 + random(`h${n}`) * 26;
        const x = side * (ROAD_HALF + 7.5 + dd / 2 + random(`x${n}`) * 6);
        const c = WALLS[Math.floor(random(`c${n}`) * WALLS.length)];
        (walls[c] ||= []).push(box(dd, h, w, x, h / 2, z - w / 2));
        roofs.push(box(dd + 0.6, 0.6, w + 0.6, x, h + 0.3, z - w / 2));
        const faceX = x - side * (dd / 2 + 0.02);
        for (let y = 3.2; y < h - 1; y += 3.4) glass.push(box(0.1, 1.5, w - 3, faceX, y, z - w / 2));
        z -= w + 2 + random(`g${n}`) * 5;
        n++;
      }
      // pohon & lampu jalan di tepi jalan
      for (let zz = Z0 - 4; zz > Z1; zz -= 18) {
        const jit = random(`t${side}${zz}`);
        const tx = side * (ROAD_HALF + 2.6);
        const tz = zz - jit * 6;
        trunk.push(box(0.35, 1.6, 0.35, tx, 0.8, tz));
        const cone = new THREE.ConeGeometry(1.5 + jit * 0.5, 3.2, 6);
        cone.translate(tx, 3.3, tz);
        leaf.push(cone);
        const cone2 = new THREE.ConeGeometry(1.1, 2.4, 6);
        cone2.translate(tx, 4.7, tz);
        leaf.push(cone2);
        const lx = side * (ROAD_HALF + 1.2);
        const lz = zz - 9;
        pole.push(box(0.18, 6.4, 0.18, lx, 3.2, lz));
        pole.push(box(side === 1 ? -2 : 2, 0.16, 0.16, lx - side * 1.0, 6.3, lz));
        lamp.push(box(0.8, 0.14, 0.4, lx - side * 2, 6.2, lz));
      }
    }
    return {
      walls: Object.entries(walls).map(([c, g]) => ({c, geo: merge(g)})),
      roofs: merge(roofs),
      glass: merge(glass),
      trunk: merge(trunk),
      leaf: merge(leaf),
      pole: merge(pole),
      lamp: merge(lamp),
    };
  }, []);
  return (
    <group>
      {parts.walls.map(({c, geo}) => (
        <mesh key={c} geometry={geo} castShadow receiveShadow>
          <meshStandardMaterial color={c} roughness={0.85} flatShading />
        </mesh>
      ))}
      <mesh geometry={parts.roofs} castShadow receiveShadow>
        <meshStandardMaterial color="#8a8f96" roughness={0.9} flatShading />
      </mesh>
      <mesh geometry={parts.glass}>
        <meshStandardMaterial color="#4a6272" roughness={0.15} metalness={0.7} emissive="#2a3b47" emissiveIntensity={0.4} flatShading />
      </mesh>
      <mesh geometry={parts.trunk} castShadow>
        <meshStandardMaterial color="#6e4d30" roughness={1} flatShading />
      </mesh>
      <mesh geometry={parts.leaf} castShadow receiveShadow>
        <meshStandardMaterial color="#6FAE4A" roughness={0.9} flatShading />
      </mesh>
      <mesh geometry={parts.pole} castShadow>
        <meshStandardMaterial color="#555b63" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh geometry={parts.lamp}>
        <meshStandardMaterial color="#fff2c8" emissive="#ffe9a8" emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
};

export const Road: React.FC<{wet: number}> = ({wet}) => {
  const lines = useMemo(() => {
    const g: THREE.BufferGeometry[] = [];
    for (let z = Z0; z > Z1; z -= 6) g.push(box(0.2, 0.02, 3, 0, 0.03, z - 1.5));
    g.push(box(0.22, 0.02, LEN, -ROAD_HALF + 0.5, 0.03, ZC));
    g.push(box(0.22, 0.02, LEN, ROAD_HALF - 0.5, 0.03, ZC));
    return merge(g);
  }, []);
  const gloss = THREE.MathUtils.clamp(wet, 0, 1);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, ZC]} receiveShadow>
        <planeGeometry args={[900, LEN + 200]} />
        <meshStandardMaterial color="#C9BC9C" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, ZC]} receiveShadow>
        <planeGeometry args={[ROAD_HALF * 2, LEN]} />
        <meshStandardMaterial color="#6B7078" roughness={0.9} />
      </mesh>
      {/* trotoar */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (ROAD_HALF + 1.6), 0.08, ZC]} receiveShadow castShadow>
          <boxGeometry args={[3.2, 0.2, LEN]} />
          <meshStandardMaterial color="#B9B2A3" roughness={0.95} />
        </mesh>
      ))}
      <mesh geometry={lines}>
        <meshStandardMaterial color="#EAE3D0" roughness={0.7} />
      </mesh>
      {/* jalur basah: gelap, licin, memantulkan cahaya */}
      {gloss > 0.01 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[LANE_B + 0.1, 0.045, ZC]} receiveShadow>
          <planeGeometry args={[ROAD_HALF - 0.6, LEN]} />
          <meshStandardMaterial color="#2F3A47" roughness={0.12} metalness={0.45} transparent opacity={gloss * 0.92} />
        </mesh>
      )}
    </group>
  );
};

const CONE_ORANGE = "#FF7A1A";
export const Cones: React.FC<{cones: ConeState[]}> = ({cones}) => {
  const geo = useMemo(() => {
    const c = new THREE.ConeGeometry(0.26, 0.7, 8);
    c.translate(0, 0.35, 0);
    return c;
  }, []);
  const band = useMemo(() => {
    const c = new THREE.CylinderGeometry(0.17, 0.2, 0.12, 8);
    c.translate(0, 0.38, 0);
    return c;
  }, []);
  return (
    <group>
      {cones.map((c, i) => (
        <group key={i} position={c.pos} rotation={c.rot}>
          <mesh geometry={geo} castShadow>
            <meshStandardMaterial color={CONE_ORANGE} roughness={0.5} flatShading />
          </mesh>
          <mesh geometry={band}>
            <meshStandardMaterial color="#fff" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const SkidMarks: React.FC<{marks: Mark[]}> = ({marks}) => (
  <group>
    {marks.map((m, i) => {
      const len = Math.max(0.01, m.s1 - m.s0);
      return (
        <mesh key={i} position={[m.x, 0.06, -(m.s0 + len / 2)]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.28, len]} />
          <meshBasicMaterial color="#0f1013" transparent opacity={0.85} />
        </mesh>
      );
    })}
  </group>
);

/** Hujan: pola goresan berulang yang bergeser tiap frame (murah, tanpa partikel). */
export const Rain: React.FC<{amount: number; f: number; center: [number, number, number]}> = ({amount, f, center}) => {
  const geo = useMemo(() => {
    const g: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 900; i++) {
      g.push(box(0.035, 1.3, 0.035, (random(`rx${i}`) - 0.5) * 70, random(`ry${i}`) * 40, (random(`rz${i}`) - 0.5) * 110));
    }
    return merge(g);
  }, []);
  if (amount < 0.02) return null;
  const off = (f * 1.6) % 40;
  return (
    <group position={center}>
      {[0, 40].map((y) => (
        <mesh key={y} geometry={geo} position={[0, y - off, 0]}>
          <meshBasicMaterial color="#DCE8F2" transparent opacity={0.4 * amount} />
        </mesh>
      ))}
    </group>
  );
};

/** Asap ban saat terkunci: bola abu yang membesar dan memudar. */
export const Smoke: React.FC<{s: number; x: number; f: number; on: number}> = ({s, x, f, on}) => {
  if (!on) return null;
  const puffs = [];
  for (let i = 0; i < 9; i++) {
    const age = ((f * 0.9 + i * 6) % 54) / 54;
    const sz = 0.25 + age * 1.1;
    puffs.push(
      <mesh key={i} position={[x + (random(`sp${i}`) - 0.5) * 2.4, 0.5 + age * 1.8, -(s - 2.3) + age * 1.2 + (i % 2) * 0.3]}>
        <icosahedronGeometry args={[sz, 0]} />
        <meshStandardMaterial color="#E8E8E8" transparent opacity={0.42 * (1 - age)} roughness={1} flatShading depthWrite={false} />
      </mesh>,
    );
  }
  return <group>{puffs}</group>;
};
