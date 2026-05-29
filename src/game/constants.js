// ─── Board & Adjacency ─────────────────────────────────────────────
export const BOARD_SIZE = 21;
export const ROW_STARTS = [0, 1, 3, 6, 10, 15];
export const ROWS = 6;

export const ADJACENCY = {
  0: [1, 2],
  1: [0, 2, 3, 4],
  2: [0, 1, 4, 5],
  3: [1, 4, 6, 7],
  4: [1, 2, 3, 5, 7, 8],
  5: [2, 4, 8, 9],
  6: [3, 7, 10, 11],
  7: [3, 4, 6, 8, 11, 12],
  8: [4, 5, 7, 9, 12, 13],
  9: [5, 8, 13, 14],
  10: [6, 11, 15],
  11: [6, 7, 10, 12, 15, 16],
  12: [7, 8, 11, 13, 16, 17],
  13: [8, 9, 12, 14, 17, 18],
  14: [9, 13, 18, 19],
  15: [10, 11, 16, 19, 20],
  16: [11, 12, 15, 17, 20],
  17: [12, 13, 16, 18, 20],
  18: [13, 14, 17, 19, 20],
  19: [14, 15, 18, 20],
  20: [15, 16, 17, 18, 19],
};

// ─── Player Colors ─────────────────────────────────────────────────
export const PLAYER_COLORS = [
  {
    id: "red",
    name: "Red",
    hue: 0,
    hex: "#ef4444",
    bg: "hsla(0, 85%, 60%, 0.15)",
    glow: "hsla(0, 85%, 60%, 0.6)",
  },
  {
    id: "blue",
    name: "Blue",
    hue: 220,
    hex: "#3b82f6",
    bg: "hsla(220, 85%, 60%, 0.15)",
    glow: "hsla(220, 85%, 60%, 0.6)",
  },
  {
    id: "green",
    name: "Green",
    hue: 150,
    hex: "#22c55e",
    bg: "hsla(150, 85%, 50%, 0.15)",
    glow: "hsla(150, 85%, 50%, 0.6)",
  },
];

// ─── SVG Layout ────────────────────────────────────────────────────
const CX = 300;
const CY = 65;
const SPACING = 64;
const SIN60 = 0.866;

export function getCirclePosition(index) {
  let row = 0;
  for (let r = ROW_STARTS.length - 1; r >= 0; r--) {
    if (index >= ROW_STARTS[r]) {
      row = r;
      break;
    }
  }
  const col = index - ROW_STARTS[row];
  const x = CX + (col - row / 2) * SPACING;
  const y = CY + row * SPACING * SIN60;
  return { x, y };
}

// ─── Variants ──────────────────────────────────────────────────────
export const VARIANTS = {
  standard: {
    label: "Standard",
    description: "Place tiles in ascending order (1, 2, 3…)",
  },
  free: {
    label: "Free Placement",
    description: "Choose any remaining tile each turn",
  },
  blind: {
    label: "Blind Draw",
    description: "Tiles are drawn randomly each turn",
  },
};

export const DEFAULT_SETTINGS = {
  mode: "2player", // '2player' | '3player'
  variant: "standard", // 'standard' | 'free' | 'blind'
  totalRounds: 1, // 1–5
  turnTimer: 0, // 0 = off, 15, 30, 60 seconds
};
