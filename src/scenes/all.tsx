// Overlay 2D tiap scene (tag bab, label bertitik, garis ukur, kartu angka). Dunia 3D ada di world/World.tsx.
import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Sfx, clamp} from "../components";
import {Bar, BigNum, Caption, Card, CardHead, PressureGraph, SlowPill, Step, carPoint, frameAtFront, useCar} from "../hud";
import {CONE_S, DIST, FAR_S, LANE_A, LANE_B, REACT, V0} from "../sim";
import {STORY} from "../story";
import {C, HEAD} from "../theme";
import {SceneProps} from "../timing";
import {BigTitle, ChapterTag, Flash, Label3D, Measure3D} from "../ui";
import {WHEEL_POS} from "../world/AbsWheel";
import {win} from "../world/geo";

const mm = (p: SceneProps, id: string) => STORY[id].moments(p.t, p.dur);
const EDGE_A = -8.3;
const EDGE_B = 8.3;

export const S1: React.FC<SceneProps> = (p) => {
  const m = mm(p, "s1");
  const car = useCar(p);
  return (
    <>
      <BigTitle at={m.title} badge="Fisika jalan raya" line1={[{t: "Rem mendadak"}]} line2={[{t: "80 km/jam", hl: true}]} top={250} out={m.stop - 10} />
      <Label3D sp={p} at={m.speed} until={m.stop - 4} point={carPoint(car, 1.9)} text="80 km/jam" dx={150} dy={-130} />
      <Sfx at={2} name="whoosh" volume={0.5} />
      <Sfx at={m.stop} name="tick" volume={0.4} />
    </>
  );
};

export const S2: React.FC<SceneProps> = (p) => {
  const m = mm(p, "s2");
  const f = useCurrentFrame();
  const car = useCar(p);
  const t = Math.max(0, Math.min(REACT, (car.s / V0)));
  const dist = Math.min(DIST.react, Math.max(0, car.s));
  return (
    <>
      <ChapterTag tag="Langkah 1" segs={[{t: "Waktu "}, {t: "reaksi", hl: true}]} />
      <SlowPill at={6} text="SLOW MOTION" />
      <Card at={14} width={500}>
        <CardHead text="Sebelum rem diinjak" />
        <BigNum value={t.toFixed(1)} unit="detik" />
        <Caption text={`mobil sudah melaju ${Math.round(dist)} m`} />
      </Card>
      <Label3D sp={p} at={4} until={m.react} point={[LANE_A, 0.9, -FAR_S]} text="bahaya di depan!" dx={-10} dy={-170} tone="warn" />
      <Measure3D sp={p} at={m.m22 - 8} a={[EDGE_A, 0.3, 0]} b={[EDGE_A, 0.3, -DIST.react]} text="22 m" />
      <Sfx at={4} name="tick" volume={0.5} />
      <Sfx at={m.m22 - 8} name="whoosh" volume={0.35} />
    </>
  );
};

export const S3: React.FC<SceneProps> = (p) => {
  const m = mm(p, "s3");
  const car = useCar(p);
  const braked = Math.max(0, car.s - DIST.react);
  return (
    <>
      <ChapterTag tag="Langkah 2" segs={[{t: "Jarak "}, {t: "pengereman", hl: true}]} />
      <Card at={10} width={500}>
        <CardHead text="Aspal kering · μ ≈ 0,7" />
        <BigNum value={String(Math.round(braked))} unit="m" />
        <Caption text="dari injak rem sampai berhenti" />
      </Card>
      <Measure3D sp={p} at={0} a={[EDGE_A, 0.3, 0]} b={[EDGE_A, 0.3, -DIST.react]} text="22 m" />
      <Measure3D sp={p} at={m.m36 - 6} a={[EDGE_A, 0.3, -DIST.react]} b={[EDGE_A, 0.3, -DIST.totalDry]} text="36 m" />
      <Label3D sp={p} at={m.stop} point={[LANE_A, 0.9, -DIST.totalDry]} text="berhenti: 58 m" dx={-30} dy={-160} />
      <Sfx at={m.brake} name="whoosh" volume={0.3} />
      <Sfx at={m.stop - 6} name="hit" volume={0.3} />
    </>
  );
};

export const S4: React.FC<SceneProps> = (p) => {
  const m = mm(p, "s4");
  const f = useCurrentFrame();
  const k58 = win(f, m.wet + 30, m.m63 + 10);
  const k85 = win(f, m.m63, m.m85 + 20);
  return (
    <>
      <ChapterTag tag="Langkah 3" segs={[{t: "Aspal "}, {t: "basah", hl: true}]} />
      <Card at={m.half - 4} width={540}>
        <CardHead text="Total jarak berhenti · 80 km/jam" />
        <Bar label="Kering" value={DIST.totalDry} max={DIST.totalWet} color="#5B9B3C" k={k58} />
        <Bar label="Basah" value={DIST.totalWet} max={DIST.totalWet} color={C.scan} k={k85} />
        <Caption text="gesekan ban turun ±43%" />
      </Card>
      <Measure3D sp={p} at={m.half} a={[EDGE_A, 0.3, 0]} b={[EDGE_A, 0.3, -DIST.totalDry]} text="58 m" />
      <Measure3D sp={p} at={m.m63} a={[EDGE_B, 0.3, 0]} b={[EDGE_B, 0.3, -DIST.totalWet]} text="85 m" />
      <Label3D sp={p} at={m.m85 + 4} point={[LANE_B, 0.6, -FAR_S - 1]} text="kerucut tertabrak" dx={-120} dy={-160} tone="warn" />
      <Sfx at={2} name="whoosh" volume={0.4} />
      <Sfx at={m.m85 - 4} name="hit" volume={0.5} />
    </>
  );
};

export const S5: React.FC<SceneProps> = (p) => {
  const m = mm(p, "s5");
  const car = useCar(p);
  const hit = frameAtFront(p, 0, CONE_S);
  return (
    <>
      <ChapterTag tag="Masalah" segs={[{t: "Ban "}, {t: "terkunci", hl: true}]} />
      <Label3D sp={p} at={m.lock} until={m.slide + 30} point={[car.x - 0.95, 0.4, -car.s + 1.4]} text="roda berhenti berputar" dx={-200} dy={-210} tone="warn" />
      <Label3D sp={p} at={m.steer} until={hit + 40} point={carPoint(car, 1.5)} text="setir diputar, mobil tetap lurus" dx={-40} dy={-170} />
      <Sfx at={4} name="whoosh" volume={0.4} />
      <Sfx at={m.lock - 4} name="glitch" volume={0.3} />
      <Sfx at={hit} name="hit" volume={0.6} />
      <Flash at={hit} color="#FFF3D6" />
    </>
  );
};

export const S6: React.FC<SceneProps> = (p) => {
  const m = mm(p, "s6");
  const [x, y, z] = WHEEL_POS;
  return (
    <>
      <ChapterTag tag="Solusi" segs={[{t: "Sistem "}, {t: "ABS", hl: true}]} />
      <Label3D sp={p} at={m.sensor} until={m.pulse - 6} point={[x - 0.48, y + 0.75, z]} text="sensor putaran roda" dx={170} dy={-190} tone="air" />
      <Label3D sp={p} at={m.wheel} until={m.pulse - 6} point={[x - 0.48, y - 0.4, z + 0.5]} text="cincin bergigi" dx={190} dy={150} tone="air" />
      <Label3D sp={p} at={m.pulse} point={[x - 0.09, y + 0.84, z]} text="kaliper rem" dx={-150} dy={-190} tone="warn" />
      <PressureGraph at={m.pulse - 4} rateAt={m.rate} />
      <Sfx at={4} name="whoosh" volume={0.4} />
      <Sfx at={m.sensor} name="tick" volume={0.45} />
      <Sfx at={m.pulse} name="zap" volume={0.25} />
    </>
  );
};

export const S7: React.FC<SceneProps> = (p) => {
  const m = mm(p, "s7");
  const a = useCar(p, 0);
  const b = useCar(p, 1);
  const hit = frameAtFront(p, 1, CONE_S);
  return (
    <>
      <ChapterTag tag="Hasilnya" segs={[{t: "Roda "}, {t: "tetap berputar", hl: true}]} />
      <Label3D sp={p} at={m.spin} until={m.turn + 70} point={carPoint(a, 1.5)} text="ABS: masih bisa belok" dx={-110} dy={-190} tone="air" />
      <Label3D sp={p} at={hit + 6} until={hit + 90} point={carPoint(b, 1.4)} text="tanpa ABS: lurus" dx={-90} dy={200} tone="warn" />
      <Sfx at={4} name="whoosh" volume={0.4} />
      <Sfx at={hit} name="hit" volume={0.55} />
    </>
  );
};

export const S8: React.FC<SceneProps> = (p) => {
  const m = mm(p, "s8");
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const out = interpolate(f, [m.fade, p.dur], [0, 1], clamp);
  const s = spring({frame: f - m.cta, fps, config: {damping: 13, stiffness: 150}});
  return (
    <>
      <ChapterTag tag="Saat darurat" segs={[{t: "Tiga "}, {t: "langkah", hl: true}]} />
      <Card at={m.inj - 6} width={640} top={500} until={m.bet - 4}>
        <Step n={1} at={m.inj - 2} text="Injak" hl="penuh" y={0} />
        <Step n={2} at={m.jan - 2} text="Jangan" hl="dilepas" y={1} />
        <Step n={3} at={m.bel - 2} text="Lalu" hl="belokkan" y={1} />
      </Card>
      <Card at={m.bet - 2} width={660} top={500} until={m.cta - 6}>
        <CardHead text="Kalau pedal bergetar" />
        <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 52, color: C.ink, lineHeight: 1.15, marginTop: 8}}>
          Itu <span style={{background: C.tape, borderRadius: 10, padding: "0 12px"}}>ABS</span> sedang bekerja
        </div>
      </Card>
      {f >= m.cta && (
        <div style={{position: "absolute", top: 520, left: 64, right: 150, transform: `scale(${interpolate(s, [0, 1], [0.85, 1])})`, opacity: s}}>
          <div style={{background: C.ink, color: "#fff", borderRadius: 30, padding: "26px 32px", boxShadow: "0 16px 40px rgba(0,0,0,0.4)"}}>
            <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 60, lineHeight: 1.15}}>Kamu pernah merasakannya?</div>
            <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 38, marginTop: 10, color: C.tape}}>Tulis di komentar ↓</div>
          </div>
        </div>
      )}
      <Sfx at={m.inj} name="tick" volume={0.5} />
      <Sfx at={m.jan} name="tick" volume={0.5} />
      <Sfx at={m.bel} name="tick" volume={0.5} />
      <Sfx at={m.bet} name="zap" volume={0.25} />
      <Sfx at={m.cta} name="stamp" volume={0.4} />
      <AbsoluteFill style={{background: C.ink, opacity: out}} />
    </>
  );
};
