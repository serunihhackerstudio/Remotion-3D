# Remotion-3D

Video explainer 3D low-poly 9:16 (Reels/TikTok/Shorts) dengan Remotion + Three.js.
Topik demo: fisika rem mendadak & ABS (8 scene, ±53 dtk).

## Perintah
- `npm install`
- `python tts/make_sfx.py public/sfx && python tts/make_extra_sfx.py public/sfx` (butuh `pip install numpy scipy`)
- `python tts/estimate_timing.py` — timing perkiraan tanpa audio (untuk pratinjau)
- `python tts/generate_tts.py` — narasi Edge TTS (butuh akses speech.platform.bing.com), menimpa timing.json
- `npm run studio` — pratinjau; `node scripts/stills.mjs out/qa 20,120` — QA frame
- `npm run render` → `out/video.mp4`; `npm run thumb` (atur `THUMB` di `src/config.ts`)

## Struktur
- `src/sim.ts` simulasi fisika (semua angka di layar dihitung dari sini)
- `src/story.ts` momen per kata + jalur kamera tiap scene
- `src/world/*` dunia 3D (mobil, kota, jalan, roda ABS)
- `src/scenes/all.tsx`, `src/hud.tsx`, `src/ui.tsx` overlay 2D
- `tts/naskah.json` naskah per scene
