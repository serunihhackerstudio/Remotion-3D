// ====== TOPIK DEMO: fisika rem mendadak & ABS ======
export const VIDEO = {
  compositionId: "Main",
  brand: "serunihstudio",
  label: "Cara Kerja",
};

export type SceneConfig = {
  id: string;
  seconds: number; // durasi perkiraan (dipakai kalau audio belum ada)
  lead: number;
  tail: number;
  captions?: boolean;
  keywords?: string[]; // kata di subtitle yang diberi kotak kuning
};

export const SCENES: SceneConfig[] = [
  {id: "s1", seconds: 6.3, lead: 0.3, tail: 0.3, keywords: ["80", "berhenti"]},
  {id: "s2", seconds: 7.2, lead: 0.2, tail: 0.3, keywords: ["1", "22", "meter"]},
  {id: "s3", seconds: 6.4, lead: 0.2, tail: 0.3, keywords: ["kering", "36"]},
  {id: "s4", seconds: 6.7, lead: 0.2, tail: 0.3, keywords: ["basah", "63", "85"]},
  {id: "s5", seconds: 8.0, lead: 0.2, tail: 0.3, keywords: ["terkunci", "meluncur", "setir"]},
  {id: "s6", seconds: 7.1, lead: 0.2, tail: 0.3, keywords: ["ABS", "sensor", "belasan"]},
  {id: "s7", seconds: 5.7, lead: 0.2, tail: 0.3, keywords: ["berputar", "membelokkan"]},
  {id: "s8", seconds: 9.4, lead: 0.2, tail: 0.6, keywords: ["injak", "belokkan", "bergetar"]},
];

// Thumbnail/cover Reels: frame global dengan visual paling kuat
export const THUMB = {
  frame: 770,
  badge: "Fisika jalan raya",
  line1: [{t: "Rem mendadak"}],
  line2: [{t: "ban terkunci?", hl: true}],
};
