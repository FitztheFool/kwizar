// Moteur du Sudoku : génération de grilles à solution unique, par difficulté.
// Logique pure, sans état : la page/le hook gèrent la saisie du joueur.

export type Difficulty = 'facile' | 'moyen' | 'difficile';

/** Nombre d'indices (cases pré-remplies) visés par difficulté. */
export const CLUES: Record<Difficulty, number> = { facile: 38, moyen: 32, difficile: 27 };

/** Multiplicateur de score par difficulté. */
export const DIFF_MULT: Record<Difficulty, number> = { facile: 1, moyen: 2, difficile: 3 };

/** Points par case correctement remplie (avant multiplicateur). */
export const POINTS_PER_CELL = 10;
/** Bonus de complétion : max(0, TIME_BONUS_MAX - secondes écoulées), puis multiplié. */
export const TIME_BONUS_MAX = 900;
/** Borne serveur du score : 55 cases × 10 pts + bonus 900, le tout ×3 (difficile). */
export const MAX_SCORE = 4500;
/** Nombre d'erreurs autorisées avant la fin de partie. */
export const MAX_LIVES = 3;

export interface Puzzle {
    /** 81 cases, 0 = vide. */
    givens: number[];
    /** Solution complète (81 valeurs 1-9). */
    solution: number[];
    difficulty: Difficulty;
}

const rowOf = (i: number) => Math.floor(i / 9);
const colOf = (i: number) => i % 9;
const boxOf = (i: number) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);

/** Indices des 20 cases « voisines » (même ligne, colonne ou bloc) de chaque case. */
export const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => {
    const out: number[] = [];
    for (let j = 0; j < 81; j++) {
        if (j !== i && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i))) out.push(j);
    }
    return out;
});

function shuffled<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const canPlace = (grid: number[], i: number, v: number): boolean =>
    PEERS[i].every(p => grid[p] !== v);

/** Remplit la grille par backtracking aléatoire (mutation). */
function fillGrid(grid: number[]): boolean {
    const i = grid.indexOf(0);
    if (i === -1) return true;
    for (const v of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
        if (canPlace(grid, i, v)) {
            grid[i] = v;
            if (fillGrid(grid)) return true;
            grid[i] = 0;
        }
    }
    return false;
}

/** Compte les solutions (s'arrête à `limit`) — sert au contrôle d'unicité. */
function countSolutions(grid: number[], limit = 2): number {
    // Case vide la plus contrainte d'abord : accélère beaucoup la recherche.
    let best = -1, bestOptions: number[] | null = null;
    for (let i = 0; i < 81; i++) {
        if (grid[i] !== 0) continue;
        const options: number[] = [];
        for (let v = 1; v <= 9; v++) if (canPlace(grid, i, v)) options.push(v);
        if (options.length === 0) return 0;
        if (!bestOptions || options.length < bestOptions.length) { best = i; bestOptions = options; }
        if (bestOptions.length === 1) break;
    }
    if (best === -1) return 1; // grille pleine

    let count = 0;
    for (const v of bestOptions!) {
        grid[best] = v;
        count += countSolutions(grid, limit - count);
        grid[best] = 0;
        if (count >= limit) break;
    }
    return count;
}

/**
 * Génère une grille à solution unique avec ~CLUES[difficulty] indices.
 * On creuse une grille pleine case par case (ordre aléatoire) en refusant tout
 * retrait qui rendrait la solution non unique.
 */
export function generatePuzzle(difficulty: Difficulty): Puzzle {
    const solution = new Array<number>(81).fill(0);
    fillGrid(solution);

    const givens = [...solution];
    const target = CLUES[difficulty];
    let clues = 81;

    for (const i of shuffled(Array.from({ length: 81 }, (_, k) => k))) {
        if (clues <= target) break;
        const saved = givens[i];
        givens[i] = 0;
        const test = [...givens];
        if (countSolutions(test) !== 1) {
            givens[i] = saved; // retrait impossible : la grille deviendrait ambiguë
        } else {
            clues--;
        }
    }

    return { givens, solution, difficulty };
}

/** Score courant : cases justes × points × multiplicateur. */
export function cellScore(correctCells: number, difficulty: Difficulty): number {
    return correctCells * POINTS_PER_CELL * DIFF_MULT[difficulty];
}

/** Score final en cas de grille complétée (bonus de rapidité inclus). */
export function finalScore(correctCells: number, difficulty: Difficulty, elapsedSeconds: number): number {
    const bonus = Math.max(0, TIME_BONUS_MAX - Math.floor(elapsedSeconds));
    return cellScore(correctCells, difficulty) + bonus * DIFF_MULT[difficulty];
}
