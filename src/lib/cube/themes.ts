/** Temas visuais do C-Cube — cores por face: 0:+X R, 1:-X L, 2:+Y U, 3:-Y D, 4:+Z F, 5:-Z B */

export interface Theme {
  id: string;
  name: string;
  /** cor base do fundo da app */
  bg: string;
  /** cor do "plástico" das peças */
  plastic: string;
  /** brilho emissivo dos adesivos (estilo neon) */
  glow: number;
  faces: [string, string, string, string, string, string];
  /** cor de destaque da interface */
  accent: string;
}

export const THEMES: Theme[] = [
  {
    id: "classic",
    name: "Clássico",
    bg: "#101319",
    plastic: "#15171d",
    glow: 0,
    faces: ["#d92b3a", "#ff7a1a", "#f5f6f8", "#ffd21e", "#22b455", "#1d6fe0"],
    accent: "#fbbf24",
  },
  {
    id: "neon",
    name: "Neon",
    bg: "#07080d",
    plastic: "#0d0f16",
    glow: 0.55,
    faces: ["#ff2d55", "#ff9500", "#ffffff", "#ffdd00", "#30d158", "#00c7ff"],
    accent: "#00e5ff",
  },
  {
    id: "pastel",
    name: "Pastel",
    bg: "#171a21",
    plastic: "#1c1f27",
    glow: 0.12,
    faces: ["#f7a6b4", "#ffc98f", "#fdfdf6", "#ffe9a3", "#a8e6b8", "#9ccbf2"],
    accent: "#ffb4a2",
  },
  {
    id: "carbon",
    name: "Carbono",
    bg: "#0c0c0e",
    plastic: "#09090b",
    glow: 0.35,
    faces: ["#e5e7eb", "#a1a1aa", "#f4f4f5", "#d4d4d8", "#e4e4e7", "#c8c8cf"],
    accent: "#e4e4e7",
  },
];

export function themeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
