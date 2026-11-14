"""Timing PERKIRAAN (tanpa audio) agar subtitle & animasi bisa dipratinjau sebelum TTS ada.
python tts/estimate_timing.py   → public/audio/timing.json (file=null)
Setelah generate_tts.py / rekaman_timing.py dijalankan, file ini otomatis tertimpa timing asli."""
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
cfg = json.loads((ROOT / "tts" / "naskah.json").read_text(encoding="utf-8"))
out = []
for s in cfg["scenes"]:
    t = 0.0
    words = []
    for w in s["text"].split():
        dur = 0.12 + 0.04 * len(re.sub(r"[^A-Za-z0-9]", "", w))
        words.append({"w": w, "start": round(t, 3), "end": round(t + dur, 3)})
        t += dur + (0.18 if re.search(r"[.,:?!]$", w) else 0.04)
    out.append({"id": s["id"], "file": None, "duration": 0, "words": words, "estimated": round(t, 2)})
    print(s["id"], round(t, 2), "dtk,", len(words), "kata")
(ROOT / "public" / "audio").mkdir(parents=True, exist_ok=True)
(ROOT / "public" / "audio" / "timing.json").write_text(json.dumps({"scenes": out}, ensure_ascii=False, indent=1), encoding="utf-8")
print("total", round(sum(s["estimated"] for s in out), 1), "dtk")
