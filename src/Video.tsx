import React from "react";
import {AbsoluteFill, Audio, Sequence, Series, interpolate, staticFile, useVideoConfig} from "remotion";
import {SCENES} from "./config";
import {Wipe} from "./hud";
import {STORY} from "./story";
import {Sfx} from "./components";
import {SCENE_COMPONENTS} from "./scenes";
import {FPS, Timing, leadOf, sceneFrames} from "./timing";
import {Captions2, Watermark} from "./ui";
import {World} from "./world/World";

export type VideoProps = {timing: Timing};

export const Video: React.FC<VideoProps> = ({timing}) => {
  const {durationInFrames} = useVideoConfig();
  const frames = timing.scenes.map(sceneFrames);
  const starts = frames.map((_, i) => frames.slice(0, i).reduce((a, b) => a + b, 0));

  return (
    <AbsoluteFill style={{background: "#F3E7D2"}}>
      {/* Satu dunia 3D sepanjang video; kamera mengalir antar-scene seperti referensi */}
      <World timing={timing} frames={frames} />

      <Series>
        {timing.scenes.map((s, i) => {
          const Scene = SCENE_COMPONENTS[s.id];
          const showCaptions = SCENES.find((c) => c.id === s.id)?.captions !== false;
          return (
            <Series.Sequence key={s.id} durationInFrames={frames[i]}>
              {Scene && <Scene t={s} dur={frames[i]} idx={i} start={starts[i]} all={timing} frames={frames} />}
              {s.file && !timing.voiceover && (
                <Sequence from={Math.round(leadOf(s.id) * FPS)} layout="none">
                  <Audio src={staticFile(`audio/${s.file}`)} />
                </Sequence>
              )}
              {showCaptions && <Captions2 t={s} />}
            </Series.Sequence>
          );
        })}
      </Series>

      {/* wipe transisi di setiap batas scene yang memotong kamera */}
      {timing.scenes.map((s, i) =>
        STORY[s.id]?.cut && i > 0 ? (
          <Sequence key={`w${s.id}`} from={starts[i] - 9} durationInFrames={20} layout="none">
            <Wipe span={20} />
            <Sfx at={2} name="whoosh" volume={0.28} />
          </Sequence>
        ) : null,
      )}

      {/* rekaman suara satu file (tts/rekaman_timing.py) */}
      {timing.voiceover && <Audio src={staticFile(`audio/${timing.voiceover}`)} />}

      {/* musik latar lembut (dibuat oleh tts/make_extra_sfx.py) */}
      <Audio
        src={staticFile("sfx/bed_soft.wav")}
        loop
        volume={(f) =>
          interpolate(f, [0, 20, durationInFrames - 70, durationInFrames - 30], [0, 0.12, 0.12, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      <Watermark />
    </AbsoluteFill>
  );
};
