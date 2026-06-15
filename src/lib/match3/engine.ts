// Moteur Match-3 (type Bejeweled). Grille SIZE×SIZE de gemmes (0..TYPES-1).
// Échange de 2 gemmes adjacentes → alignements de 3+ → explosion, gravité, recharge,
// cascades. Pas de dépendance UI : testable headless.

export const SIZE = 8;
export const TYPES = 6;

export type Board = number[][];

const randGem = () => Math.floor(Math.random() * TYPES);

/** Crée une grille sans alignement initial. */
export function newBoard(): Board {
    const b: Board = Array.from({ length: SIZE }, () => Array(SIZE).fill(-1));
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            let g: number;
            do { g = randGem(); }
            while (
                (c >= 2 && b[r][c - 1] === g && b[r][c - 2] === g) ||
                (r >= 2 && b[r - 1][c] === g && b[r - 2][c] === g)
            );
            b[r][c] = g;
        }
    }
    return b;
}

const inBounds = (r: number, c: number) => r >= 0 && c >= 0 && r < SIZE && c < SIZE;
export const adjacent = (r1: number, c1: number, r2: number, c2: number) =>
    Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;

/** Cellules faisant partie d'un alignement ≥3 (horizontal ou vertical). */
export function findMatches(b: Board): boolean[][] {
    const m: boolean[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
    // horizontal
    for (let r = 0; r < SIZE; r++) {
        let run = 1;
        for (let c = 1; c <= SIZE; c++) {
            if (c < SIZE && b[r][c] === b[r][c - 1] && b[r][c] >= 0) run++;
            else {
                if (run >= 3) for (let k = c - run; k < c; k++) m[r][k] = true;
                run = 1;
            }
        }
    }
    // vertical
    for (let c = 0; c < SIZE; c++) {
        let run = 1;
        for (let r = 1; r <= SIZE; r++) {
            if (r < SIZE && b[r][c] === b[r - 1][c] && b[r][c] >= 0) run++;
            else {
                if (run >= 3) for (let k = r - run; k < r; k++) m[k][c] = true;
                run = 1;
            }
        }
    }
    return m;
}

const hasAnyMatch = (b: Board) => findMatches(b).some(row => row.some(Boolean));

/** Fait tomber les gemmes au-dessus des vides et recharge le haut. */
function gravityAndRefill(b: Board): void {
    for (let c = 0; c < SIZE; c++) {
        let write = SIZE - 1;
        for (let r = SIZE - 1; r >= 0; r--) {
            if (b[r][c] >= 0) { b[write][c] = b[r][c]; if (write !== r) b[r][c] = -1; write--; }
        }
        for (let r = write; r >= 0; r--) b[r][c] = randGem();
    }
}

/** Résout toutes les cascades à partir d'une grille contenant ≥1 alignement.
 *  Renvoie le score gagné. Mutation de `b`. */
export function resolveCascades(b: Board): number {
    let gained = 0;
    let cascade = 1;
    for (; ;) {
        const m = findMatches(b);
        let cleared = 0;
        for (let r = 0; r < SIZE; r++)
            for (let c = 0; c < SIZE; c++)
                if (m[r][c]) { b[r][c] = -1; cleared++; }
        if (cleared === 0) break;
        gained += cleared * 10 * cascade;   // multiplicateur de cascade
        gravityAndRefill(b);
        cascade++;
    }
    return gained;
}

/** Tente l'échange de 2 cellules adjacentes.
 *  Si ça crée un alignement → applique + cascades, renvoie le score gagné (≥0).
 *  Sinon → annule, renvoie -1 (coup illégal). Mutation de `b` seulement si légal. */
export function trySwap(b: Board, r1: number, c1: number, r2: number, c2: number): number {
    if (!inBounds(r1, c1) || !inBounds(r2, c2) || !adjacent(r1, c1, r2, c2)) return -1;
    [b[r1][c1], b[r2][c2]] = [b[r2][c2], b[r1][c1]];
    if (!hasAnyMatch(b)) {
        [b[r1][c1], b[r2][c2]] = [b[r2][c2], b[r1][c1]];   // revert
        return -1;
    }
    return resolveCascades(b);
}

/** Existe-t-il au moins un échange créant un alignement ? (sinon : plus de coup) */
export function hasAnyMove(b: Board): boolean {
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            for (const [dr, dc] of [[0, 1], [1, 0]] as const) {
                const nr = r + dr, nc = c + dc;
                if (!inBounds(nr, nc)) continue;
                [b[r][c], b[nr][nc]] = [b[nr][nc], b[r][c]];
                const ok = hasAnyMatch(b);
                [b[r][c], b[nr][nc]] = [b[nr][nc], b[r][c]];
                if (ok) return true;
            }
        }
    }
    return false;
}
