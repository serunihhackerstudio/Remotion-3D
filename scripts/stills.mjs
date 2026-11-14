// QA: render beberapa frame sekaligus. node scripts/stills.mjs out/qa 30,120,400 [Main|Thumbnail]
import {bundle} from "@remotion/bundler";
import {renderStill, selectComposition} from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
const [outDir = "out/qa", frames = "0", comp = "Main"] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public")});
const composition = await selectComposition({serveUrl, id: comp});
console.log("durasi", composition.durationInFrames, "frame");
for (const f of frames.split(",").map(Number)) {
  await renderStill({composition, serveUrl, frame: f, output: path.join(outDir, `f${String(f).padStart(4, "0")}.png`), chromiumOptions: {gl: "angle"}, imageFormat: "png"});
  console.log("ok", f);
}
