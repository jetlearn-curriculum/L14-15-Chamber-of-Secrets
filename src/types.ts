export interface DrawingStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface DiaryEntry {
  id: string;
  date: string;
  text: string;
  response: string;
  reflection: string;
  strokes?: DrawingStroke[]; // Hand-drawn quill strokes to redraw on archival pages
  timestamp: number;
  resonance: number; // Magic strength of the entry
}

export interface LoreScroll {
  id: string;
  title: string;
  content: string;
  unlockedAt: string;
  entryCount: number;
}

export interface ScribeProfile {
  name: string;
  house: "Gryffindor" | "Slytherin" | "Ravenclaw" | "Hufflepuff" | "None";
  bloodStatus: "Pure-blood" | "Half-blood" | "Muggle-born" | "Unknown";
  year: string;
  wand: string;
}

export type MagicalTheme = "candlelight" | "eclipse" | "aurora";

export interface ThemeConfig {
  id: MagicalTheme;
  name: string;
  deskBg: string; // Tailwind class
  paperBg: string; // Tailwind class
  paperTexture: string; // Custom shadow/border decoration
  inkColor: string; // Text color
  quillColor: string; // Canvas pen stroke color
  glowColor: string; // Motion glow
  accentColor: string; // Buttons/Candle colors
  candleColor: string; // Flame color
}

export const THEME_CONFIGS: Record<MagicalTheme, ThemeConfig> = {
  candlelight: {
    id: "candlelight",
    name: "Natural Amber",
    deskBg: "bg-[#1a0f0a]",
    paperBg: "bg-[#f4e4bc] paper-papyrus",
    paperTexture: "shadow-2xl shadow-[#1a0f0a]/90 border-[4px] border-[#3d2b1f]/80 rounded-lg",
    inkColor: "text-[#3e2b1f]",
    quillColor: "#3e2b1f", // Classic organic charcoal ink
    glowColor: "rgba(255, 160, 40, 0.15)", // Glowing candle amber
    accentColor: "border-[#3e2b1f]/30 hover:bg-[#3e2b1f]/10 text-[#3e2b1f]",
    candleColor: "from-[#ff9d28] via-[#e57c10] to-transparent",
  },
  eclipse: {
    id: "eclipse",
    name: "Spectral Eclipse",
    deskBg: "bg-[#090b11]",
    paperBg: "bg-[#181a24] paper-papyrus",
    paperTexture: "shadow-2xl shadow-indigo-950/60 border-[4px] border-indigo-950 rounded-lg",
    inkColor: "text-indigo-200",
    quillColor: "#67e8f9", // Cyan glowing ink
    glowColor: "rgba(99, 102, 241, 0.5)", // Blue-purple glow
    accentColor: "border-indigo-500/50 hover:bg-indigo-950/40 text-indigo-300",
    candleColor: "from-cyan-300 via-purple-600 to-transparent",
  },
  aurora: {
    id: "aurora",
    name: "Eldritch Aurora",
    deskBg: "bg-[#0a1410]",
    paperBg: "bg-[#14221d] paper-papyrus",
    paperTexture: "shadow-2xl shadow-emerald-950/50 border-[4px] border-emerald-950 rounded-lg",
    inkColor: "text-emerald-100",
    quillColor: "#fbbf24", // Golden glowing ink
    glowColor: "rgba(16, 185, 129, 0.4)", // Emerald glow
    accentColor: "border-emerald-500/50 hover:bg-emerald-950/40 text-emerald-300",
    candleColor: "from-emerald-300 via-teal-500 to-transparent",
  },
};
