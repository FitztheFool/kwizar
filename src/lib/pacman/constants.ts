export const COLS = 19;
export const ROWS = 21;
export const CELL = 20;
export const TICK = 200;

// Tile types: 0=dot, 1=wall, 2=ghost-house (ghost only), 3=power pellet, 4=empty
export type Tile = 0 | 1 | 2 | 3 | 4;

export type Pos = { x: number; y: number };
export type Dir = 'U' | 'D' | 'L' | 'R' | 'N';

export const OPP: Record<Dir, Dir> = { U: 'D', D: 'U', L: 'R', R: 'L', N: 'N' };
export const DELTA: Record<Dir, Pos> = {
    U: { x: 0, y: -1 }, D: { x: 0, y: 1 },
    L: { x: -1, y: 0 }, R: { x: 1, y: 0 },
    N: { x: 0, y: 0 },
};

export const TUNNEL_ROW = 10;

export const DOT_SCORE = 10;
export const PELLET_SCORE = 50;
export const GHOST_SCORE = 200;
export const FRIGHTEN_TICKS = 30;
export const LIVES = 3;

// 19×21 maze: 0=dot, 1=wall, 2=ghost-house, 3=power pellet, 4=empty
export const MAZE_TEMPLATE: Tile[][] = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 3, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 3, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 4, 4, 4, 4, 4, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0, 1, 1, 1, 1],
    [4, 4, 4, 4, 0, 1, 1, 2, 4, 4, 4, 2, 1, 1, 0, 4, 4, 4, 4],
    [1, 1, 1, 1, 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 4, 4, 4, 4, 4, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 3, 1],
    [1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// Maze 2 — couloirs larges, moins de murs intérieurs
export const MAZE_2: Tile[][] = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 3, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 3, 1],
    [1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 2, 1, 2, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 4, 4, 4, 4, 4, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0, 1, 1, 1, 1],
    [4, 4, 4, 4, 0, 1, 1, 2, 4, 4, 4, 2, 1, 1, 0, 4, 4, 4, 4],
    [1, 1, 1, 1, 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 4, 4, 4, 4, 4, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1],
    [1, 3, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 3, 1],
    [1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// Maze 3 — plus de power pellets, couloirs en U
export const MAZE_3: Tile[][] = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3, 1],
    [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
    [4, 4, 4, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 4, 4, 4],
    [1, 1, 1, 1, 0, 1, 0, 1, 1, 4, 1, 1, 0, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 4, 4, 4, 4, 4, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0, 1, 1, 1, 1],
    [4, 4, 4, 4, 0, 1, 1, 2, 4, 4, 4, 2, 1, 1, 0, 4, 4, 4, 4],
    [1, 1, 1, 1, 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 4, 4, 4, 4, 4, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 3, 0, 1, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 1, 0, 3, 1],
    [1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1],
    [1, 3, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 3, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const MAZES = [MAZE_TEMPLATE, MAZE_2, MAZE_3];

export function getMaze(level: number): Tile[][] {
    return MAZES[(level - 1) % MAZES.length].map(row => [...row] as Tile[]);
}

export const PACMAN_START: Pos = { x: 9, y: 16 };

// ── Fruits bonus ──────────────────────────────────────────────────────────────

export type FruitType = 'cerise' | 'fraise' | 'orange' | 'pomme' | 'melon' | 'galaxian' | 'cloche' | 'cle';

export const FRUIT_SCORES: Record<FruitType, number> = {
    cerise: 100, fraise: 300, orange: 500, pomme: 700,
    melon: 1000, galaxian: 2000, cloche: 3000, cle: 5000,
};

export function levelFruit(level: number): FruitType {
    if (level === 1) return 'cerise';
    if (level === 2) return 'fraise';
    if (level <= 4) return 'orange';
    if (level <= 6) return 'pomme';
    if (level <= 8) return 'melon';
    if (level <= 10) return 'galaxian';
    if (level <= 12) return 'cloche';
    return 'cle';
}

// Fruit apparaît au centre du labyrinthe (dessous de la maison des fantômes)
export const FRUIT_POS: Pos = { x: 9, y: 16 };
// Déclencheurs : nombre de dots mangés pour faire apparaître le fruit (2 fois par niveau)
export const FRUIT_DOTS_TRIGGERS = [70, 170] as const;
// Durée d'apparition en ticks (≈9 s à 150 ms/tick)
export const FRUIT_DURATION_TICKS = 60;
export const GHOST_STARTS: Pos[] = [
    { x: 8, y: 10 },
    { x: 10, y: 10 },
    { x: 9, y: 9 },
];

// Point de retour pour les yeux : centre de la cage, commun à tous les fantômes
export const GHOST_HOME: Pos = { x: 9, y: 10 };

export const GHOST_COLORS = [
    { body: '#ff4444', frightened: '#4444ff' }, // Blinky
    { body: '#ffb8ff', frightened: '#4444ff' }, // Pinky
    { body: '#00b8d4', frightened: '#4444ff' }, // Inky
    { body: '#ffb852', frightened: '#4444ff' }, // Clyde ← manquait
] as const;

export const KEY_DIR: Record<string, Dir> = {
    ArrowUp: 'U', z: 'U', Z: 'U',
    ArrowDown: 'D', s: 'D', S: 'D',
    ArrowLeft: 'L', q: 'L', Q: 'L',
    ArrowRight: 'R', d: 'R', D: 'R',
};

export const STARTERS = new Set([
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'z', 'Z', 'q', 'Q', 's', 'S', 'd', 'D', ' ', 'Enter',
]);
