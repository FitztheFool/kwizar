// Moteur du Démineur (niveau débutant : grille 9×9, 10 mines).
// Logique pure et immuable : chaque action renvoie une nouvelle grille.

export const ROWS = 9;
export const COLS = 9;
export const MINES = 10;
export const SAFE_CELLS = ROWS * COLS - MINES; // 71

export interface Cell {
    mine: boolean;
    revealed: boolean;
    flagged: boolean;
    adjacent: number; // nombre de mines voisines (0..8)
}
export type Grid = Cell[][];

export interface RevealResult {
    grid: Grid;
    exploded: boolean;   // une mine a été révélée
    won: boolean;        // toutes les cases sûres sont révélées
    revealed: number;    // nombre de cases sûres révélées (= score)
}

const inBounds = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

function neighbors(r: number, c: number): [number, number][] {
    const out: [number, number][] = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            if (inBounds(r + dr, c + dc)) out.push([r + dr, c + dc]);
        }
    }
    return out;
}

const clone = (g: Grid): Grid => g.map(row => row.map(cell => ({ ...cell })));

export function emptyGrid(): Grid {
    return Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 })));
}

/** Place les mines (en évitant la 1re case cliquée + ses voisines pour garantir un
 *  premier coup sûr) puis calcule les nombres. À appeler une seule fois. */
export function withMines(base: Grid, safeR: number, safeC: number): Grid {
    const g = clone(base);
    const forbidden = new Set<string>([
        `${safeR},${safeC}`,
        ...neighbors(safeR, safeC).map(([r, c]) => `${r},${c}`),
    ]);
    let placed = 0;
    while (placed < MINES) {
        const r = Math.floor(Math.random() * ROWS);
        const c = Math.floor(Math.random() * COLS);
        if (g[r][c].mine || forbidden.has(`${r},${c}`)) continue;
        g[r][c].mine = true;
        placed++;
    }
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (!g[r][c].mine) {
                g[r][c].adjacent = neighbors(r, c).filter(([nr, nc]) => g[nr][nc].mine).length;
            }
        }
    }
    return g;
}

function countRevealedSafe(g: Grid): number {
    let n = 0;
    for (const row of g) for (const cell of row) if (cell.revealed && !cell.mine) n++;
    return n;
}

export function countFlags(g: Grid): number {
    let n = 0;
    for (const row of g) for (const cell of row) if (cell.flagged) n++;
    return n;
}

/** Révèle (r,c). Propagation en cascade sur les cases à 0 mine voisine.
 *  Sur une mine : révèle toutes les mines et signale l'explosion. */
export function revealCell(base: Grid, r: number, c: number): RevealResult {
    const g = clone(base);
    const target = g[r][c];
    if (target.flagged || target.revealed) {
        return { grid: g, exploded: false, won: false, revealed: countRevealedSafe(g) };
    }
    if (target.mine) {
        for (const row of g) for (const cell of row) if (cell.mine) cell.revealed = true;
        return { grid: g, exploded: true, won: false, revealed: countRevealedSafe(g) };
    }
    const stack: [number, number][] = [[r, c]];
    while (stack.length) {
        const [cr, cc] = stack.pop()!;
        const cell = g[cr][cc];
        if (cell.revealed || cell.flagged || cell.mine) continue;
        cell.revealed = true;
        if (cell.adjacent === 0) {
            for (const [nr, nc] of neighbors(cr, cc)) {
                if (!g[nr][nc].revealed) stack.push([nr, nc]);
            }
        }
    }
    const revealed = countRevealedSafe(g);
    return { grid: g, exploded: false, won: revealed === SAFE_CELLS, revealed };
}

/** Pose / retire un drapeau sur une case non révélée. */
export function toggleFlag(base: Grid, r: number, c: number): Grid {
    const g = clone(base);
    if (!g[r][c].revealed) g[r][c].flagged = !g[r][c].flagged;
    return g;
}
