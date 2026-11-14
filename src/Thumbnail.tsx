// Thumbnail/cover Reels 1080×1920: dunia 3D di frame terpilih + judul besar (tanpa subtitle).
// Render: npx remotion still Thumbnail out/thumbnail.png --frame=<THUMB.frame> --gl=angle
// Teks penting berada di area tengah 1080×1350 (aman untuk potongan grid Instagram 4:5).
import React from "react";
import {AbsoluteFill} from "remotion";
import {THUMB} from "./config";
import {sceneFrames} from "./timing";
import {BigTitle} from "./ui";
import {VideoProps} from "./Video";
import {World} from "./world/World";

export const Thumbnail: React.FC<VideoProps> = ({timing}) => {
  const frames = timing.scenes.map(sceneFrames);
  return (
    <AbsoluteFill style={{background: "#F3E7D2"}}>
      <World timing={timing} frames={frames} />
      {/* sedikit gelap di atas supaya judul terbaca */}
      <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(255,248,235,0.55) 0%, rgba(255,248,235,0.0) 45%)"}} />
      <BigTitle at={0} badge={THUMB.badge} line1={THUMB.line1} line2={THUMB.line2} top={340} />
    </AbsoluteFill>
  );
};
