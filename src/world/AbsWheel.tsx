// Roda terbuka (potongan) untuk menjelaskan ABS: cakram, kaliper, cincin gigi, dan sensor putaran.
import React from "react";
import {V3} from "./geo";

export const WHEEL_POS: V3 = [200, 1.7, 0];
const S = 4.4; // skala pembesaran
export const pulseOn = (f: number) => Math.sin(f * 0.85) > 0.05;

export const AbsWheel: React.FC<{f: number; spin: number; pulse: boolean; glow: number}> = ({f, spin, pulse, glow}) => {
  const teeth = Array.from({length: 24}, (_, i) => i);
  return (
    <group position={WHEEL_POS}>
      {/* panggung gelap */}
      <mesh position={[0, -1.72, 0]} receiveShadow>
        <cylinderGeometry args={[16, 16, 0.4, 40]} />
        <meshStandardMaterial color="#3B4558" roughness={0.8} />
      </mesh>
      <mesh position={[0, -1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[15.6, 0.16, 6, 64]} />
        <meshStandardMaterial color="#FFC83A" emissive="#FFC83A" emissiveIntensity={0.3} />
      </mesh>
      <group scale={S}>
        {/* bagian yang berputar */}
        <group rotation={[spin, 0, 0]}>
          <mesh castShadow rotation={[0, Math.PI / 2, 0]} position={[0.1, 0, 0]}>
            <torusGeometry args={[0.31, 0.085, 8, 24]} />
            <meshStandardMaterial color="#1b1d22" roughness={0.9} flatShading />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0.12, 0, 0]}>
            <torusGeometry args={[0.215, 0.018, 6, 24]} />
            <meshStandardMaterial color="#cfd5dc" roughness={0.3} metalness={0.7} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} castShadow rotation={[(i * Math.PI * 2) / 5, 0, 0]} position={[0.12, 0, 0]}>
              <boxGeometry args={[0.04, 0.44, 0.07]} />
              <meshStandardMaterial color="#cfd5dc" roughness={0.3} metalness={0.7} />
            </mesh>
          ))}
          {/* cakram rem */}
          <mesh castShadow rotation={[0, 0, Math.PI / 2]} position={[-0.02, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.035, 28]} />
            <meshStandardMaterial color="#9AA2AB" roughness={0.35} metalness={0.8} emissive="#ff5a14" emissiveIntensity={glow * 0.55} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.02, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.06, 16]} />
            <meshStandardMaterial color="#7e858d" metalness={0.8} roughness={0.4} />
          </mesh>
          {/* cincin bergigi (tone ring) */}
          {teeth.map((i) => (
            <mesh key={i} rotation={[(i * Math.PI * 2) / teeth.length, 0, 0]} position={[-0.11, 0, 0]}>
              <boxGeometry args={[0.04, 0.13 * 2 + 0.03, 0.02]} />
              <meshStandardMaterial color="#e8c34a" metalness={0.5} roughness={0.4} />
            </mesh>
          ))}
        </group>
        {/* kaliper (diam) */}
        <mesh castShadow position={[-0.02, 0.19, 0]}>
          <boxGeometry args={[0.13, 0.13, 0.26]} />
          <meshStandardMaterial
            color={pulse ? "#ff3b30" : "#E5483B"}
            roughness={0.4}
            metalness={0.3}
            emissive="#ff2a1a"
            emissiveIntensity={pulse ? 1.6 : 0.1}
          />
        </mesh>
        {/* sensor kecepatan roda + kabel */}
        <mesh castShadow position={[-0.11, 0.17, 0]}>
          <boxGeometry args={[0.06, 0.07, 0.07]} />
          <meshStandardMaterial color="#4FB8E8" roughness={0.4} emissive="#4FB8E8" emissiveIntensity={0.7} />
        </mesh>
        <mesh position={[-0.11, 0.28, 0]}>
          <boxGeometry args={[0.012, 0.2, 0.012]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[-0.11, 0.38, -0.12]} rotation={[0.6, 0, 0]}>
          <boxGeometry args={[0.012, 0.012, 0.28]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>
    </group>
  );
};
