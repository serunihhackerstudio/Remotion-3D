import React, {useMemo} from "react";
import * as THREE from "three";
import {CarState} from "../sim";

const taper = (g: THREE.BoxGeometry, topX: number, topZ: number, zShift = 0) => {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) > 0) {
      p.setX(i, p.getX(i) * topX);
      p.setZ(i, p.getZ(i) * topZ + zShift);
    }
  }
  g.computeVertexNormals();
  return g;
};

const TIRE = "#1b1d22";
const HUB = "#cfd5dc";

const Wheel: React.FC<{x: number; z: number; spin: number; steer?: number; r?: number}> = ({x, z, spin, steer = 0, r = 0.36}) => (
  <group position={[x, r, z]} rotation={[0, steer, 0]}>
    <group rotation={[spin, 0, 0]}>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r, r, 0.26, 12]} />
        <meshStandardMaterial color={TIRE} roughness={0.9} flatShading />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[Math.sign(x) * 0.02, 0, 0]}>
        <cylinderGeometry args={[r * 0.62, r * 0.62, 0.28, 10]} />
        <meshStandardMaterial color={HUB} roughness={0.35} metalness={0.5} flatShading />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[(i * Math.PI) / 3, 0, 0]} position={[Math.sign(x) * 0.15, 0, 0]}>
          <boxGeometry args={[0.05, r * 1.3, 0.09]} />
          <meshStandardMaterial color="#2a2d33" roughness={0.6} />
        </mesh>
      ))}
    </group>
  </group>
);

export const Car: React.FC<{st: CarState}> = ({st}) => {
  const sedan = st.kind === "sedan";
  const L = sedan ? 4.6 : 3.95;
  const geo = useMemo(() => {
    const lower = new THREE.BoxGeometry(1.8, 0.55, L);
    const hood = taper(new THREE.BoxGeometry(1.74, 0.16, sedan ? 1.2 : 0.95), 0.96, 0.7);
    const cab = taper(new THREE.BoxGeometry(1.6, sedan ? 0.5 : 0.62, sedan ? 2.0 : 2.3), 0.88, 0.72);
    const glass = taper(new THREE.BoxGeometry(1.64, sedan ? 0.46 : 0.56, sedan ? 2.04 : 2.34), 0.86, 0.7);
    const roof = new THREE.BoxGeometry(1.34, 0.07, sedan ? 1.3 : 1.55);
    return {lower, hood, cab, glass, roof};
  }, [sedan, L]);
  const cabZ = sedan ? 0.25 : 0.35;
  const cabY = 0.9 + (sedan ? 0.25 : 0.31);
  const rear = L / 2;
  const wz = L / 2 - 0.85;
  const brakeI = st.brake ? 3.2 : 0.5;
  return (
    <group position={[st.x, 0, -st.s]} rotation={[0, st.yaw, 0]}>
      <group rotation={[-st.pitch, 0, 0]}>
        <mesh castShadow receiveShadow geometry={geo.lower} position={[0, 0.65, 0]}>
          <meshStandardMaterial color={st.color} roughness={0.3} metalness={0.15} flatShading />
        </mesh>
        <mesh castShadow geometry={geo.hood} position={[0, 0.98, -L / 2 + 0.7]}>
          <meshStandardMaterial color={st.color} roughness={0.3} metalness={0.15} flatShading />
        </mesh>
        <mesh castShadow geometry={geo.glass} position={[0, cabY - 0.01, cabZ]}>
          <meshStandardMaterial color="#27323f" roughness={0.12} metalness={0.6} flatShading />
        </mesh>
        <mesh castShadow geometry={geo.roof} position={[0, cabY + (sedan ? 0.27 : 0.33), cabZ + 0.05]}>
          <meshStandardMaterial color={sedan ? st.color : "#16181d"} roughness={0.3} metalness={0.15} flatShading />
        </mesh>
        {/* lampu belakang (menyala terang saat mengerem) */}
        {[-0.65, 0.65].map((x) => (
          <mesh key={x} position={[x, 0.78, rear + 0.01]}>
            <boxGeometry args={[0.42, 0.16, 0.05]} />
            <meshStandardMaterial color="#7a0d0d" emissive="#ff1a1a" emissiveIntensity={brakeI} />
          </mesh>
        ))}
        {[-0.62, 0.62].map((x) => (
          <mesh key={x} position={[x, 0.78, -rear - 0.01]}>
            <boxGeometry args={[0.4, 0.14, 0.05]} />
            <meshStandardMaterial color="#fff6dc" emissive="#fff0c0" emissiveIntensity={1.2} />
          </mesh>
        ))}
        <mesh position={[0, 0.42, -rear - 0.02]}>
          <boxGeometry args={[1.5, 0.14, 0.1]} />
          <meshStandardMaterial color="#202228" roughness={0.8} />
        </mesh>
      </group>
      <Wheel x={-0.92} z={-wz} spin={st.spin} steer={st.steer} />
      <Wheel x={0.92} z={-wz} spin={st.spin} steer={st.steer} />
      <Wheel x={-0.92} z={wz} spin={st.spin} />
      <Wheel x={0.92} z={wz} spin={st.spin} />
    </group>
  );
};
