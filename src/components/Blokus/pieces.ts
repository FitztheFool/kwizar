// Géométrie Blokus côté client : les 21 polyominoes + orientations, et la validation de pose
// (miroir de blokus-server/src/{pieces,game}.ts) pour l'aperçu et la surbrillance.

export type Cell = [number, number];
export const BOARD_SIZE = 20;

const BASE_PIECES: { id: string; cells: Cell[] }[] = [
    { id: 'mono', cells: [[0, 0]] },
    { id: 'domino', cells: [[0, 0], [1, 0]] },
    { id: 'tri_I', cells: [[0, 0], [1, 0], [2, 0]] },
    { id: 'tri_L', cells: [[0, 0], [1, 0], [1, 1]] },
    { id: 'tet_I', cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
    { id: 'tet_O', cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
    { id: 'tet_T', cells: [[0, 0], [1, 0], [2, 0], [1, 1]] },
    { id: 'tet_S', cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
    { id: 'tet_L', cells: [[0, 0], [0, 1], [0, 2], [1, 2]] },
    { id: 'pen_F', cells: [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]] },
    { id: 'pen_I', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
    { id: 'pen_L', cells: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]] },
    { id: 'pen_N', cells: [[1, 0], [1, 1], [0, 2], [1, 2], [0, 3]] },
    { id: 'pen_P', cells: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]] },
    { id: 'pen_T', cells: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]] },
    { id: 'pen_U', cells: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]] },
    { id: 'pen_V', cells: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]] },
    { id: 'pen_W', cells: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]] },
    { id: 'pen_X', cells: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]] },
    { id: 'pen_Y', cells: [[1, 0], [0, 1], [1, 1], [1, 2], [1, 3]] },
    { id: 'pen_Z', cells: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]] },
];

export const PIECE_IDS = BASE_PIECES.map(p => p.id);
export const PIECE_SIZE: Record<string, number> = Object.fromEntries(BASE_PIECES.map(p => [p.id, p.cells.length]));

function normalize(cells: Cell[]): Cell[] {
    const minX = Math.min(...cells.map(c => c[0]));
    const minY = Math.min(...cells.map(c => c[1]));
    return cells.map(([x, y]) => [x - minX, y - minY] as Cell).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}
const keyOf = (cells: Cell[]) => normalize(cells).map(c => c.join(',')).join('|');
const rotate = (cells: Cell[]): Cell[] => cells.map(([x, y]) => [y, -x] as Cell);
const reflect = (cells: Cell[]): Cell[] => cells.map(([x, y]) => [-x, y] as Cell);

function orientations(cells: Cell[]): Cell[][] {
    const seen = new Map<string, Cell[]>();
    let cur = cells;
    for (let r = 0; r < 4; r++) {
        for (const v of [cur, reflect(cur)]) { const n = normalize(v); seen.set(keyOf(n), n); }
        cur = rotate(cur);
    }
    return [...seen.values()];
}

export const PIECE_ORIENTATIONS: Record<string, Cell[][]> = Object.fromEntries(
    BASE_PIECES.map(p => [p.id, orientations(p.cells)]),
);

/** Nouvel index d'orientation après rotation 90° de l'orientation courante. */
export function rotateOri(pieceId: string, ori: number): number {
    return matchOri(pieceId, rotate(PIECE_ORIENTATIONS[pieceId][ori]));
}
/** Nouvel index d'orientation après retournement (miroir). */
export function flipOri(pieceId: string, ori: number): number {
    return matchOri(pieceId, reflect(PIECE_ORIENTATIONS[pieceId][ori]));
}
function matchOri(pieceId: string, cells: Cell[]): number {
    const k = keyOf(cells);
    const idx = PIECE_ORIENTATIONS[pieceId].findIndex(o => keyOf(o) === k);
    return idx === -1 ? 0 : idx;
}

export const CORNERS: ReadonlyArray<readonly [number, number]> = [
    [0, 0], [BOARD_SIZE - 1, 0], [BOARD_SIZE - 1, BOARD_SIZE - 1], [0, BOARD_SIZE - 1],
];

// Couleurs des 4 joueurs (index 0..3).
export const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706']; // bleu, rouge, vert, orange
export const COLOR_NAMES = ['Bleu', 'Rouge', 'Vert', 'Orange'];

const inBoard = (x: number, y: number) => x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE;
const EDGES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAGS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

/** Cellules absolues d'une pose. */
export function placementCells(pieceId: string, ori: number, x: number, y: number): Cell[] {
    const oris = PIECE_ORIENTATIONS[pieceId];
    if (!oris || ori < 0 || ori >= oris.length) return [];
    return oris[ori].map(([cx, cy]) => [x + cx, y + cy] as Cell);
}

/** La pose est-elle légale pour `player` ? (board: -1 vide sinon index joueur) */
export function canPlace(board: number[][], player: number, placedAny: boolean, pieceId: string, ori: number, x: number, y: number): boolean {
    const cells = placementCells(pieceId, ori, x, y);
    if (!cells.length) return false;
    for (const [cx, cy] of cells) {
        if (!inBoard(cx, cy) || board[cy][cx] !== -1) return false;
        for (const [dx, dy] of EDGES) {
            const nx = cx + dx, ny = cy + dy;
            if (inBoard(nx, ny) && board[ny][nx] === player) return false;
        }
    }
    if (!placedAny) {
        const [kx, ky] = CORNERS[player];
        return cells.some(([cx, cy]) => cx === kx && cy === ky);
    }
    for (const [cx, cy] of cells) {
        for (const [dx, dy] of DIAGS) {
            const nx = cx + dx, ny = cy + dy;
            if (inBoard(nx, ny) && board[ny][nx] === player) return true;
        }
    }
    return false;
}
