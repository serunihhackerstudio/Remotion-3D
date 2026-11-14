import React from "react";
import * as THREE from "three";
import {useThree} from "@react-three/fiber";
import {ThreeCanvas} from "@remotion/three";
import {useCurrentFrame} from "remotion";
import {HEIGHT, Pose, WIDTH, clockAt, poseAt} from "../camera";
import {stage} from "../sim";
import {Timing} from "../timing";
import {AbsWheel, pulseOn} from "./AbsWheel";
import {Car} from "./Car";
import {City, Cones, Rain, Road, SkidMarks, Smoke} from "./Env";

const SKY = "#EAD9BD";
const STUDIO_BG = "#232C3A";

const CameraRig: React.FC<{pose: Pose}> = ({pose}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.set(...pose.pos);
  camera.lookAt(...pose.look);
  camera.fov = pose.fov;
  camera.near = 0.2;
  camera.far = 3000;
  camera.updateProjectionMatrix();
  return null;
};

export const World: React.FC<{timing: Timing; frames: number[]}> = ({timing, frames}) => {
  const f = useCurrentFrame();
  const c = clockAt(f, timing, frames);
  const pose = poseAt(f, timing, frames);
  const st = stage(c.id, c.local, c.m, c.dur);
  const camX = pose.pos[0];
  const sc = c.id === "s6";
  const spinW = c.local * 0.55;
  const glow = pulseOn(c.local) ? 1 : 0.2;

  return (
    <ThreeCanvas
      width={WIDTH}
      height={HEIGHT}
      shadows
      flat
      camera={{fov: 40, near: 0.2, far: 3000, position: pose.pos}}
      style={{position: "absolute", inset: 0}}
    >
      <CameraRig pose={pose} />
      <color attach="background" args={[sc ? STUDIO_BG : SKY]} />
      <fog attach="fog" args={[sc ? STUDIO_BG : SKY, sc ? 60 : st.rain ? 120 : 200, sc ? 160 : st.rain ? 520 : 760]} />
      <hemisphereLight args={[st.rain ? "#E6EEF7" : "#FFF4DE", "#CBBB9C", st.rain ? 2.1 : 2.5]} />
      <directionalLight
        position={[-90 + camX * 0.4, 140, pose.look[2] + 70]}
        target-position={[camX, 0, pose.look[2]]}
        intensity={st.rain ? 2.4 : 3.6}
        color={st.rain ? "#EEF2F7" : "#FFE7C2"}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-camera-near={10}
        shadow-camera-far={420}
        shadow-bias={-0.0006}
      />
      <directionalLight position={[60, 40, -120]} intensity={0.9} color="#CFE0FF" />
      <ambientLight intensity={0.35} />

      {!sc && (
        <>
          <Road wet={st.wet} />
          <City />
          {st.cars.map((car) => (
            <Car key={car.id} st={car} />
          ))}
          <Cones cones={st.cones} />
          <SkidMarks marks={st.marks} />
          {st.cars.filter((x) => x.smoke > 0).map((x) => (
            <Smoke key={x.id} s={x.s} x={x.x} f={f} on={1} />
          ))}
          <Rain amount={st.rain} f={f} center={[0, 0, pose.look[2]]} />
        </>
      )}
      {sc && <AbsWheel f={c.local} spin={spinW} pulse={pulseOn(c.local)} glow={glow} />}
    </ThreeCanvas>
  );
};

