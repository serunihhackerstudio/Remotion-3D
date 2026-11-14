// Lapisan 2D di atas dunia 3D: tag bab, judul, label bertitik, garis ukur, subtitle, watermark.
import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {clamp} from "./components";
import {poseAt, project} from "./camera";
import {SCENES, VIDEO} from "./config";
import {BODY, C, HEAD, MONO} from "./theme";
import {SceneProps, SceneTiming, Word, leadOf} from "./timing";
import {V3} from "./world/geo";

export type Seg = {t: string; hl?: boolean};

const shadow = "0 3px 0 rgba(0,0,0,0.35), 0 0 22px rgba(0,0,0,0.35)";
const glow = "0 0 18px rgba(255,248,235,0.95), 0 0 6px rgba(255,248,235,0.9)";

/** Teks dengan potongan kata berkotak kuning. */
export const HiText: React.FC<{segs: Seg[]; size: number; color?: string}> = ({segs, size, color = C.ink}) => (
  <>
    {segs.map((s, i) =>
      s.hl ? (
        <span
          key={i}
          style={{
            background: C.tape,
            color: C.ink,
            borderRadius: size * 0.2,
            padding: `0 ${size * 0.18}px`,
            margin: `0 ${size * 0.06}px`,
            boxDecorationBreak: "clone",
            WebkitBoxDecorationBreak: "clone",
            boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
          }}
        >
          {s.t}
        </span>
      ) : (
        <span key={i} style={{color, textShadow: color === C.ink ? glow : shadow}}>
          {s.t}
        </span>
      ),
    )}
  </>
);

/** Pil kecil gelap dengan titik kuning (mis. "MASALAH 1"). */
export const Pill: React.FC<{text: string; size?: number}> = ({text, size = 26}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.4,
      background: C.ink,
      color: C.white,
      fontFamily: HEAD,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: 1.5,
      padding: `${size * 0.28}px ${size * 0.6}px`,
      borderRadius: size * 0.35,
      textTransform: "uppercase",
      boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
    }}
  >
    <span style={{width: size * 0.4, height: size * 0.4, borderRadius: 3, background: C.tape}} />
    {text}
  </span>
);

/** Tag bab di kiri atas: pil + satu kalimat inti. Berganti saat `switchAt` (mis. MASALAH → SOLUSI). */
export const ChapterTag: React.FC<{
  tag: string;
  segs: Seg[];
  switchAt?: number;
  tag2?: string;
  segs2?: Seg[];
}> = ({tag, segs, switchAt, tag2, segs2}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const second = switchAt !== undefined && f >= switchAt && tag2 && segs2;
  const from = second ? (switchAt as number) : 0;
  const s = spring({frame: f - from - 2, fps, config: {damping: 16, stiffness: 180}});
  return (
    <div style={{position: "absolute", top: 172, left: 64, right: 150}}>
      <div style={{transform: `translateY(${interpolate(s, [0, 1], [-14, 0])}px)`, opacity: s}}>
        <Pill text={second ? (tag2 as string) : tag} />
      </div>
      <div
        style={{
          marginTop: 16,
          fontFamily: HEAD,
          fontWeight: 800,
          fontSize: 58,
          lineHeight: 1.22,
          transform: `translateX(${interpolate(s, [0, 1], [-30, 0])}px)`,
          opacity: s,
        }}
      >
        <HiText segs={second ? (segs2 as Seg[]) : segs} size={58} />
      </div>
    </div>
  );
};

/** Judul besar (hook / penutup), tengah atas. */
export const BigTitle: React.FC<{at: number; badge: string; line1: Seg[]; line2: Seg[]; top?: number; out?: number}> = ({
  at,
  badge,
  line1,
  line2,
  top = 420,
  out,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < at) return null;
  const s1 = spring({frame: f - at, fps, config: {damping: 14, stiffness: 160}});
  const s2 = spring({frame: f - at - 6, fps, config: {damping: 11, stiffness: 200, mass: 0.7}});
  const o = out !== undefined ? 1 - interpolate(f, [out, out + 10], [0, 1], clamp) : 1;
  return (
    <div style={{position: "absolute", top, left: 40, right: 40, textAlign: "center", opacity: o}}>
      <div style={{opacity: s1, transform: `translateY(${interpolate(s1, [0, 1], [-20, 0])}px)`}}>
        <Pill text={badge} size={28} />
      </div>
      <div style={{marginTop: 26, fontFamily: HEAD, fontWeight: 800, fontSize: 92, lineHeight: 1.12, opacity: s1}}>
        <HiText segs={line1} size={92} />
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: HEAD,
          fontWeight: 800,
          fontSize: 118,
          lineHeight: 1.15,
          transform: `scale(${interpolate(s2, [0, 1], [1.5, 1])}) rotate(${interpolate(s2, [0, 1], [-4, -1.5])}deg)`,
          opacity: interpolate(s2, [0, 0.2], [0, 1], clamp),
        }}
      >
        <HiText segs={line2} size={118} />
      </div>
    </div>
  );
};

/** Hook untuk memproyeksikan titik 3D ke layar pada frame scene ini. */
export const useProject = (p: SceneProps) => {
  const f = useCurrentFrame();
  const pose = poseAt(p.start + f, p.all, p.frames);
  return (pt: V3) => project(pt, pose);
};

/** Label pil dengan garis penunjuk ke titik 3D. dx/dy = posisi pil relatif titik. */
export const Label3D: React.FC<{
  sp: SceneProps;
  at: number;
  until?: number;
  point: V3;
  text: string;
  dx?: number;
  dy?: number;
  tone?: "dark" | "warn" | "air";
}> = ({sp, at, until, point, text, dx = 0, dy = -120, tone = "dark"}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const proj = useProject(sp);
  if (f < at || (until !== undefined && f >= until + 8)) return null;
  const p = proj(point);
  if (!p.visible) return null;
  const s = spring({frame: f - at, fps, config: {damping: 15, stiffness: 200}});
  const o = until !== undefined ? 1 - interpolate(f, [until, until + 8], [0, 1], clamp) : 1;
  const lx = p.x + dx;
  const ly = p.y + dy;
  const bg = tone === "warn" ? C.siren : tone === "air" ? C.scan : C.ink;
  const fg = tone === "air" ? C.ink : C.white;
  return (
    <AbsoluteFill style={{opacity: o * Math.min(1, s * 1.4)}}>
      <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
        <line x1={p.x} y1={p.y} x2={interpolate(s, [0, 1], [p.x, lx])} y2={interpolate(s, [0, 1], [p.y, ly])} stroke={C.white} strokeWidth={3} />
        <circle cx={p.x} cy={p.y} r={9} fill={C.tape} stroke={C.ink} strokeWidth={3} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: lx,
          top: ly,
          transform: `translate(-50%, -50%) scale(${interpolate(s, [0, 1], [0.6, 1])})`,
          background: bg,
          color: fg,
          fontFamily: HEAD,
          fontWeight: 800,
          fontSize: 34,
          padding: "8px 18px",
          borderRadius: 12,
          whiteSpace: "nowrap",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/** Garis ukur antara dua titik 3D, dengan label di tengah. */
export const Measure3D: React.FC<{sp: SceneProps; at: number; a: V3; b: V3; text: string; until?: number}> = ({
  sp,
  at,
  a,
  b,
  text,
  until,
}) => {
  const f = useCurrentFrame();
  const proj = useProject(sp);
  if (f < at || (until !== undefined && f >= until + 8)) return null;
  const k = interpolate(f, [at, at + 16], [0, 1], {...clamp, easing: (x: number) => 1 - Math.pow(1 - x, 3)});
  const o = until !== undefined ? 1 - interpolate(f, [until, until + 8], [0, 1], clamp) : 1;
  const pa = proj(a);
  const pb0 = proj(b);
  const pb = {x: pa.x + (pb0.x - pa.x) * k, y: pa.y + (pb0.y - pa.y) * k};
  const ang = Math.atan2(pb.y - pa.y, pb.x - pa.x);
  const nx = -Math.sin(ang) * 16;
  const ny = Math.cos(ang) * 16;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
        <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={C.tape} strokeWidth={5} />
        <line x1={pa.x - nx} y1={pa.y - ny} x2={pa.x + nx} y2={pa.y + ny} stroke={C.tape} strokeWidth={5} />
        {k > 0.98 && <line x1={pb.x - nx} y1={pb.y - ny} x2={pb.x + nx} y2={pb.y + ny} stroke={C.tape} strokeWidth={5} />}
      </svg>
      {k > 0.5 && (
        <div
          style={{
            position: "absolute",
            left: (pa.x + pb.x) / 2,
            top: (pa.y + pb.y) / 2,
            transform: "translate(-50%, -50%)",
            background: C.tape,
            color: C.ink,
            fontFamily: HEAD,
            fontWeight: 800,
            fontSize: 32,
            padding: "6px 14px",
            borderRadius: 10,
            whiteSpace: "nowrap",
            opacity: interpolate(k, [0.5, 0.8], [0, 1], clamp),
          }}
        >
          {text}
        </div>
      )}
    </AbsoluteFill>
  );
};

/** Watermark akun di kanan tengah (ala referensi), di luar 120 px paling kanan. */
export const Watermark: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 600,
      right: 132,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      opacity: 0.85,
    }}
  >
    <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.6" fill="#fff" />
    </svg>
    <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 18, color: "#fff", textShadow: shadow}}>{VIDEO.brand}</span>
  </div>
);

/** Kilatan layar (busur listrik). */
export const Flash: React.FC<{at: number; color?: string}> = ({at, color = "#FFFFFF"}) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [at, at + 2, at + 12], [0, 0.3, 0], clamp);
  if (k <= 0) return null;
  return <AbsoluteFill style={{background: color, opacity: k, pointerEvents: "none"}} />;
};

const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Subtitle per kata (Edge TTS WordBoundary). Kata kunci diberi kotak kuning. */
export const Captions2: React.FC<{t: SceneTiming}> = ({t}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (!t.words.length) return null;
  const keys = (SCENES.find((s) => s.id === t.id)?.keywords ?? []).map(norm);
  const time = (f - leadOf(t.id) * fps) / fps;

  const chunks: Word[][] = [];
  let cur: Word[] = [];
  t.words.forEach((w, i) => {
    cur.push(w);
    const next = t.words[i + 1];
    const longGap = next ? next.start - w.end > 0.35 : true;
    if (cur.length >= 3 || /[.,!?:…]$/.test(w.w) || longGap) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);

  const idx = chunks.findIndex((c, i) => {
    const start = c[0].start - 0.08;
    const end = chunks[i + 1] ? chunks[i + 1][0].start - 0.08 : c[c.length - 1].end + 0.5;
    return time >= start && time < end;
  });
  if (idx < 0) return null;
  const chunk = chunks[idx];
  const pop = interpolate(time, [chunk[0].start - 0.08, chunk[0].start + 0.05], [0.9, 1], clamp);

  return (
    <div
      style={{
        position: "absolute",
        top: 1410,
        left: 70,
        right: 130,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px 16px",
        transform: `scale(${pop})`,
      }}
    >
      {chunk.map((w) => {
        const hl = keys.includes(norm(w.w));
        const shown = time >= w.start - 0.05;
        return (
          <span
            key={`${w.w}-${w.start}`}
            style={{
              fontFamily: BODY,
              fontWeight: 800,
              fontSize: 64,
              lineHeight: 1.2,
              color: hl ? C.ink : C.white,
              background: hl ? C.tape : "transparent",
              borderRadius: 12,
              padding: hl ? "0 14px" : 0,
              opacity: shown ? 1 : 0,
              textShadow: hl ? "none" : "0 3px 0 rgba(0,0,0,0.55), 0 0 18px rgba(0,0,0,0.6)",
              boxShadow: hl ? "0 6px 16px rgba(0,0,0,0.3)" : "none",
            }}
          >
            {w.w}
          </span>
        );
      })}
    </div>
  );
};
