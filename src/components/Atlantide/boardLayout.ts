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
    forest: 'Forêt',
    mountain: 'Montagne',
};

export const CREATURE_EMOJI: Record<string, string> = {
    shark: '🦈',
    whale: '🐋',
    serpent: '🐍',
};

export const CREATURE_LABELS: Record<string, string> = {
    shark: 'Requin',
    whale: 'Baleine',
    serpent: 'Serpent de mer',
};

export const EFFECT_EMOJI: Record<string, string> = {
    shark: '🦈',
    whale: '🐋',
    serpent: '🐍',
    boat: '⛵',
    whirlpool: '🌀',
    volcano: '🌋',
};
