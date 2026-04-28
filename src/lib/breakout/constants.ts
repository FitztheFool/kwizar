export const W = 400;
export const H = 560;

export const PADDLE_Y = 520;
export const PADDLE_H = 12;
export const PADDLE_W_DEFAULT = 80;
export const BALL_R = 7;
export const BASE_SPEED = 1.5;

export const BRICK_W = 44;
export const BRICK_H = 18;
export const BRICK_GAP = 4;
export const BRICK_COLS = 8;
export const BRICK_ROWS = 10;
export const BRICK_OFFSET_X = (W - BRICK_COLS * (BRICK_W + BRICK_GAP) + BRICK_GAP) / 2;
export const BRICK_OFFSET_Y = 8;

export type BrickType = 'normal' | 'hard' | 'indestructible' | 'explosive';
export type PowerUpType = 'WIDE' | 'SLOW' | 'MULTI' | 'LIFE' | 'STICKY' | 'LASER' | 'BOMB' | 'NARROW' | 'FAST';

export const POWERUP_IMAGE_PATHS: Record<PowerUpType, string> = {
    WIDE:   '/breakout/bonus/WI.png',
    SLOW:   '/breakout/bonus/SL.png',
    MULTI:  '/breakout/bonus/MB.png',
    LIFE:   '/breakout/bonus/UP.png',
    STICKY: '/breakout/bonus/ST.png',
    LASER:  '/breakout/bonus/LZ.png',
    BOMB:   '/breakout/bonus/BM.png',
    NARROW: '/breakout/malus/NR.png',
    FAST:   '/breakout/malus/FS.png',
};

// Row colors for normal bricks (hue by row)
export const ROW_COLORS = [
    '#f87171', // red
    '#fb923c', // orange
    '#fbbf24', // amber
    '#a3e635', // lime
    '#34d399', // emerald
    '#22d3ee', // cyan
    '#60a5fa', // blue
    '#a78bfa', // violet
    '#f472b6', // pink
    '#e879f9', // fuchsia
];

export const POWERUP_COLORS: Record<PowerUpType, string> = {
    WIDE: '#22c55e',
    NARROW: '#ef4444',
    SLOW: '#38bdf8',
    FAST: '#dc2626',
    MULTI: '#a855f7',
    LIFE: '#ec4899',
    STICKY: '#eab308',
    LASER: '#06b6d4',
    BOMB: '#f97316',
};

export const POWERUP_LABELS: Record<PowerUpType, string> = {
    WIDE: 'WI',
    NARROW: 'NR',
    SLOW: 'SL',
    FAST: 'FS',
    MULTI: 'MB',
    LIFE: 'UP',
    STICKY: 'ST',
    LASER: 'LZ',
    BOMB: 'BM',
};

// Level layouts: 0=empty, 1=normal, 2=hard, 3=indestructible, 4=explosive
// Each level is BRICK_ROWS rows × BRICK_COLS cols
export const LEVELS: number[][][] = [
    // Level 1: 4 rows collées en haut
    [
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    // Level 2: pyramide inversée (pointe en haut)
    [
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 2, 2, 2, 2, 1, 0],
        [0, 0, 1, 2, 2, 1, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    // Level 3: checkerboard + indestructibles aux coins
    [
        [3, 1, 1, 1, 1, 1, 1, 3],
        [1, 0, 1, 0, 0, 1, 0, 1],
        [1, 1, 0, 1, 1, 0, 1, 1],
        [0, 1, 1, 0, 0, 1, 1, 0],
        [1, 0, 1, 1, 1, 1, 0, 1],
        [1, 1, 0, 1, 1, 0, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    // Level 4: forteresse (ouverte par le bas)
    [
        [3, 3, 3, 3, 3, 3, 3, 3],
        [3, 0, 0, 0, 0, 0, 0, 3],
        [3, 0, 2, 2, 2, 2, 0, 3],
        [3, 0, 2, 1, 1, 2, 0, 3],
        [3, 0, 2, 2, 2, 2, 0, 3],
        [3, 0, 0, 0, 0, 0, 0, 3],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    // Level 5: mix tous types + explosifs
    [
        [2, 1, 2, 1, 1, 2, 1, 2],
        [1, 3, 1, 2, 2, 1, 3, 1],
        [2, 1, 1, 4, 4, 1, 1, 2],
        [1, 2, 4, 1, 1, 4, 2, 1],
        [3, 1, 1, 4, 4, 1, 1, 3],
        [1, 2, 4, 1, 1, 4, 2, 1],
        [2, 1, 1, 4, 4, 1, 1, 2],
        [1, 3, 1, 2, 2, 1, 3, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    // Level 6: X (diagonales croisées)
    [
        [2, 1, 0, 0, 0, 0, 1, 2],
        [1, 2, 1, 0, 0, 1, 2, 1],
        [0, 1, 2, 1, 1, 2, 1, 0],
        [0, 0, 1, 2, 2, 1, 0, 0],
        [0, 0, 1, 2, 2, 1, 0, 0],
        [0, 1, 2, 1, 1, 2, 1, 0],
        [1, 2, 1, 0, 0, 1, 2, 1],
        [2, 1, 0, 0, 0, 0, 1, 2],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    // Level 7: pyramide (large en bas, explosive au cœur)
    [
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 2, 2, 1, 1, 0],
        [1, 1, 2, 2, 2, 2, 1, 1],
        [1, 2, 2, 4, 4, 2, 2, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    // Level 8: grille 3×3 (blocs séparés par des couloirs)
    [
        [1, 1, 0, 1, 1, 0, 1, 1],
        [1, 1, 0, 2, 2, 0, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 0, 2, 4, 0, 1, 1],
        [1, 1, 0, 4, 2, 0, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [2, 2, 0, 1, 1, 0, 2, 2],
        [2, 2, 0, 1, 1, 0, 2, 2],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    // Level 9: forteresse de briques dures (murs brisables)
    [
        [0, 2, 2, 2, 2, 2, 2, 0],
        [2, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 1, 1, 1, 1, 0, 2],
        [2, 0, 1, 4, 4, 1, 0, 2],
        [2, 0, 1, 4, 4, 1, 0, 2],
        [2, 0, 1, 1, 1, 1, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 2],
        [0, 2, 2, 2, 2, 2, 2, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    // Level 10: chaos dense — tous types, chaînes d'explosions
    [
        [2, 1, 2, 4, 4, 2, 1, 2],
        [1, 3, 1, 2, 2, 1, 3, 1],
        [2, 1, 4, 1, 1, 4, 1, 2],
        [4, 2, 1, 3, 3, 1, 2, 4],
        [1, 1, 4, 2, 2, 4, 1, 1],
        [2, 3, 1, 4, 4, 1, 3, 2],
        [1, 2, 2, 1, 1, 2, 2, 1],
        [4, 1, 3, 2, 2, 3, 1, 4],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
];
