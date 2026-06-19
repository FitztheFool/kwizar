// Plateau hexagonal des Rescapés de l'Atlantide (coordonnées axiales q, r).
// Miroir de la géométrie serveur : île rayon 3, mer rayon 5, refuges aux 6 coins.

export type Coord = readonly [number, number];
export interface Hex { q: number; r: number; }

export const BOARD_RADIUS = 5;
export const ISLAND_RADIUS = 3;

// Les 6 coins du plateau — îles refuges.
export const REFUGES: ReadonlyArray<Hex> = [
    { q: 5, r: 0 }, { q: 0, r: 5 }, { q: -5, r: 5 },
    { q: -5, r: 0 }, { q: 0, r: -5 }, { q: 5, r: -5 },
];

export function hexDist(a: Hex, b: Hex): number {
    const dq = a.q - b.q;
    const dr = a.r - b.r;
    return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

export function isRefuge(q: number, r: number): boolean {
    return REFUGES.some(ref => ref.q === q && ref.r === r);
}

/** Tous les hexes du plateau (rayon 5 → 91 cases). */
export const BOARD_HEXES: Hex[] = (() => {
    const out: Hex[] = [];
    for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
        for (let r = -BOARD_RADIUS; r <= BOARD_RADIUS; r++) {
            if (hexDist({ q, r }, { q: 0, r: 0 }) <= BOARD_RADIUS) out.push({ q, r });
        }
    }
    return out;
})();

// ── Projection axiale → pixels (hexagones pointe en haut, en unités de cellule) ──

export const HEX_H = 2 / Math.sqrt(3); // hauteur d'un hex (≈1.155) pour une largeur de 1
const ROW_STEP = 0.75 * HEX_H;          // ≈0.866 — espacement vertical des rangées

const X_MIN = -BOARD_RADIUS;            // min de q + r/2 sur le plateau
const Y_MIN = -BOARD_RADIUS * ROW_STEP;

/** Coin haut-gauche de l'hex (q, r), en unités de cellule. */
export function hexOrigin(q: number, r: number): { x: number; y: number } {
    return { x: q + r / 2 - X_MIN, y: r * ROW_STEP - Y_MIN };
}

export const BOARD_W = 2 * BOARD_RADIUS + 1;                 // 11 cellules de large
export const BOARD_H = 2 * BOARD_RADIUS * ROW_STEP + HEX_H;  // ≈9.8 cellules de haut

/** Hexagone pointe en haut. */
export const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

// ── Habillage ─────────────────────────────────────────────────────────────────

export const COLOR_CLASSES: Record<number, { bg: string; border: string; ring: string; text: string; name: string }> = {
    0: { bg: 'bg-red-500',    border: 'border-red-500',    ring: 'ring-red-500',    text: 'text-red-500',    name: 'Rouge' },
    1: { bg: 'bg-green-500',  border: 'border-green-500',  ring: 'ring-green-500',  text: 'text-green-500',  name: 'Vert' },
    2: { bg: 'bg-yellow-400', border: 'border-yellow-500', ring: 'ring-yellow-400', text: 'text-yellow-500', name: 'Jaune' },
    3: { bg: 'bg-blue-500',   border: 'border-blue-500',   ring: 'ring-blue-500',   text: 'text-blue-500',   name: 'Bleu' },
};

export const LEVEL_CLASSES: Record<string, string> = {
    beach: 'bg-amber-200 dark:bg-amber-300/80',
    forest: 'bg-emerald-500 dark:bg-emerald-600',
    mountain: 'bg-stone-400 dark:bg-stone-500',
};

export const LEVEL_LABELS: Record<string, string> = {
    beach: 'Plage',
    forest: 'Colline',
    mountain: 'Montagne',
};

export const CREATURE_EMOJI: Record<string, string> = {
    dolphin: '🐬',
    shark: '🦈',
    octopus: '🐙',
    monster: '🐉',
};

// ── Sprites PNG (planche découpée dans public/atlantide/sprites/) ──
const SPRITE_BASE = '/atlantide/sprites';

/** Sprites des 4 animaux marins, posés sur le plateau. */
export const CREATURE_SPRITE: Record<string, string> = {
    dolphin: `${SPRITE_BASE}/creature-dolphin.png`,
    shark: `${SPRITE_BASE}/creature-shark.png`,
    octopus: `${SPRITE_BASE}/creature-octopus.png`,
    monster: `${SPRITE_BASE}/creature-monster.png`,
};

/** Image de fond de la tuile selon son niveau. */
export const LEVEL_SPRITE: Record<string, string> = {
    beach: `${SPRITE_BASE}/tile-beach.png`,
    forest: `${SPRITE_BASE}/tile-hill.png`,
    mountain: `${SPRITE_BASE}/tile-mountain.png`,
};

/** Icônes des symboles révélés sous les tuiles. */
export const SYMBOL_SPRITE: Record<string, string> = {
    shark: `${SPRITE_BASE}/symbol-shark.png`,
    boat: `${SPRITE_BASE}/symbol-boat.png`,
    dolphin: `${SPRITE_BASE}/symbol-dolphin.png`,
    whirlpool: `${SPRITE_BASE}/symbol-typhon.png`,
    octopus: `${SPRITE_BASE}/symbol-octopuus.png`,
    monster: `${SPRITE_BASE}/symbol-monster.png`,
};

/** Pions des 4 joueurs, par index couleur (cf. COLOR_CLASSES). */
export const MEEPLE_SPRITE: Record<number, string> = {
    0: `${SPRITE_BASE}/meeple-red.png`,
    1: `${SPRITE_BASE}/meeple-green.png`,
    2: `${SPRITE_BASE}/meeple-yellow.png`,
    3: `${SPRITE_BASE}/meeple-blue.png`,
};

export const BOAT_SPRITE = `${SPRITE_BASE}/boat.png`;
export const BOAT_LOADED_SPRITE = `${SPRITE_BASE}/boat-loaded.png`;
export const REFUGE_SPRITE = `${SPRITE_BASE}/refuge.png`;
export const SEA_SPRITE = `${SPRITE_BASE}/sea.png`;
export const TILE_HIDDEN_SPRITE = `${SPRITE_BASE}/tile-hidden.png`;
export const SWIMMER_SPRITE = `${SPRITE_BASE}/swimmer.png`;
export const TOKEN_SAFE_SPRITE = `${SPRITE_BASE}/token-safe.png`;
export const TOKEN_DEAD_SPRITE = `${SPRITE_BASE}/token-dead.png`;
export const WHEEL_SPRITE = `${SPRITE_BASE}/wheel.png`;

export const CREATURE_LABELS: Record<string, string> = {
    dolphin: 'Dauphin',
    shark: 'Requin',
    octopus: 'Pieuvre',
    monster: 'Monstre marin',
};

export const EFFECT_EMOJI: Record<string, string> = {
    shark: '🦈',
    boat: '⛵',
    dolphin: '🐬',
    whirlpool: '🌀',
    octopus: '🐙',
    monster: '🐉',
};
