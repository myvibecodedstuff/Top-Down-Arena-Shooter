
export const BAYER_4X4 = [
  [ 0/16,  8/16,  2/16, 10/16],
  [12/16,  4/16, 14/16,  6/16],
  [ 3/16, 11/16,  1/16,  9/16],
  [15/16,  7/16, 13/16,  5/16]
];

export const BAYER_8X8 = [
  [ 0/64, 32/64,  8/64, 40/64,  2/64, 34/64, 10/64, 42/64],
  [48/64, 16/64, 56/64, 24/64, 50/64, 18/64, 58/64, 26/64],
  [12/64, 44/64,  4/64, 36/64, 14/64, 46/64,  6/64, 38/64],
  [60/64, 28/64, 52/64, 20/64, 62/64, 30/64, 54/64, 22/64],
  [ 3/64, 35/64, 11/64, 43/64,  1/64, 33/64,  9/64, 41/64],
  [51/64, 19/64, 59/64, 27/64, 49/64, 17/64, 57/64, 25/64],
  [15/64, 47/64,  7/64, 39/64, 13/64, 45/64,  5/64, 37/64],
  [63/64, 31/64, 55/64, 23/64, 61/64, 29/64, 53/64, 21/64]
];

export const PALETTES = {
  CYBERPUNK: {
    name: 'CYBERPUNK NEON',
    colors: [
      [10, 8, 20],
      [24, 20, 48],
      [64, 28, 96],
      [140, 32, 110],
      [255, 0, 85],
      [255, 80, 140],
      [0, 180, 216],
      [0, 240, 255],
      [16, 185, 129],
      [52, 211, 153],
      [251, 191, 36],
      [255, 230, 0],
      [244, 244, 245],
    ]
  },
  AMBER: {
    name: 'CRT AMBER',
    colors: [
      [8, 5, 0],
      [30, 18, 0],
      [75, 45, 0],
      [130, 78, 0],
      [190, 114, 0],
      [245, 150, 0],
      [255, 190, 40],
      [255, 235, 160]
    ]
  },
  GAMEBOY: {
    name: 'GAMEBOY GREEN',
    colors: [
      [15, 56, 15],
      [48, 98, 48],
      [139, 172, 15],
      [155, 188, 15]
    ]
  },
  VOID: {
    name: 'VOID MONOCHROME',
    colors: [
      [10, 10, 12],
      [35, 35, 40],
      [75, 75, 85],
      [130, 130, 145],
      [195, 195, 210],
      [250, 250, 255]
    ]
  }
};

export let activePaletteName = 'CYBERPUNK';

export function setActivePalette(name) {
  if (PALETTES[name]) {
    activePaletteName = name;
  }
}

export function quantizeColor(r, g, b, x, y, paletteName = activePaletteName, ditherStrength = 0.35) {
  const palette = PALETTES[paletteName].colors;
  const ditherValue = BAYER_4X4[y % 4][x % 4] - 0.5;
  const offset = ditherValue * ditherStrength * 255;

  const dr = Math.min(255, Math.max(0, r + offset));
  const dg = Math.min(255, Math.max(0, g + offset));
  const db = Math.min(255, Math.max(0, b + offset));

  let closest = palette[0];
  let minDistance = Infinity;

  for (let i = 0; i < palette.length; i++) {
    const c = palette[i];
    const dist = 0.3 * (dr - c[0]) ** 2 + 0.59 * (dg - c[1]) ** 2 + 0.11 * (db - c[2]) ** 2;
    if (dist < minDistance) {
      minDistance = dist;
      closest = c;
    }
  }

  return closest;
}