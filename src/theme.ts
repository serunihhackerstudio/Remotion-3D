// Preset: LOW-POLY 3D HANGAT (meniru gaya explainer 3D). Font dimuat lokal dari public/fonts (tanpa jaringan).
import {continueRender, delayRender, staticFile} from "remotion";

export const HEAD = "'Plus Jakarta Sans', sans-serif";
export const BODY = HEAD;
export const MONO = "'JetBrains Mono', monospace";

const faces: [string, string, string][] = [
  ["Plus Jakarta Sans", "600", "plus-jakarta-sans-latin-600-normal.woff2"],
  ["Plus Jakarta Sans", "700", "plus-jakarta-sans-latin-700-normal.woff2"],
  ["Plus Jakarta Sans", "800", "plus-jakarta-sans-latin-800-normal.woff2"],
  ["JetBrains Mono", "700", "jetbrains-mono-latin-700-normal.woff2"],
];
if (typeof document !== "undefined") {
  const h = delayRender("font");
  Promise.all(
    faces.map(async ([family, weight, file]) => {
      const ff = new FontFace(family, `url(${staticFile("fonts/" + file)}) format("woff2")`, {weight});
      await ff.load();
      document.fonts.add(ff);
    }),
  )
    .catch(() => undefined)
    .finally(() => continueRender(h));
}

export const C = {
  ink: "#161A22", // pil label, teks di atas kuning
  steel: "#2A303B", // panel
  siren: "#E5483B", // bahaya / masalah
  tape: "#FFC83A", // sorotan utama (kuning peringatan tegangan)
  scan: "#4FB8E8", // aksen kedua (udara, isolator, biru kabel)
  paper: "#F3E9D6", // langit / kabut hangat
  white: "#FFFFFF",
  dim: "#8A93A3",
};

// Warna dunia 3D
export const W = {
  sky: "#F3E7D2",
  ground: "#E7D9BC",
  paddyA: "#A9C46C",
  paddyB: "#93B45A",
  paddyC: "#B9CE7E",
  road: "#5A5F66",
  roadLine: "#E9E2CF",
  roof: "#E06A2C",
  roofB: "#C9572A",
  wall: "#EFE6D4",
  tree: "#7DB24E",
  treeB: "#5E9A3C",
  trunk: "#7A5534",
  tower: "#9AA4AE",
  conductor: "#8C949C",
  glass: "#5FA8B5",
  studio: "#E4DED2",
};
