import { COLS, ROWS, CELL, FRUIT_POS, type Pos, type FruitType } from './constants';
import type { GameState } from './engine';
import { GHOST_COLORS } from './constants';

// ── Image cache ───────────────────────────────────────────────────────────────

const IMG: Record<string, HTMLImageElement> = {};
// Stores background-removed canvases. Only set when removeBackground succeeds.
// Falls back to IMG[src] (the raw element) when not present.
const PROCESSED: Record<string, CanvasImageSource> = {};

function removeBackground(img: HTMLImageElement): HTMLCanvasElement | null {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return removeBackgroundFromCtx(ctx, c.width, c.height) ? c : null;
}

function removeBackgroundFromCtx(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number,
): boolean {
    const id = ctx.getImageData(0, 0, width, height);
    const d = id.data;

    for (let i = 3; i < Math.min(d.length, 400); i += 4) {
        if (d[i] < 250) return false; // déjà transparent
    }

    const w = width;
    const corners = [
        [d[0], d[1], d[2]],
        [d[(w - 1) * 4], d[(w - 1) * 4 + 1], d[(w - 1) * 4 + 2]],
        [d[(height - 1) * w * 4], d[(height - 1) * w * 4 + 1], d[(height - 1) * w * 4 + 2]],
        [d[((height - 1) * w + w - 1) * 4], d[((height - 1) * w + w - 1) * 4 + 1], d[((height - 1) * w + w - 1) * 4 + 2]],
    ];
    const [bgR, bgG, bgB] = corners[0];
    const allSame = corners.every(([r, g, b]) =>
        Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB) < 30
    );
    if (!allSame) return false;

    let removed = 0;
    const tol = 40;
    for (let i = 0; i < d.length; i += 4) {
        if (Math.abs(d[i] - bgR) + Math.abs(d[i + 1] - bgG) + Math.abs(d[i + 2] - bgB) < tol) {
            d[i + 3] = 0;
            removed++;
        }
    }
    if (removed / (d.length / 4) > 0.8) return false;

    ctx.putImageData(id, 0, 0);
    return true;
}

const PAC_FRAMES = [
    '/pacman/pacman/pacman_ferme.png',
    '/pacman/pacman/pacman_mi_ouvert.png',
    '/pacman/pacman/pacman_ouvert.png',
];
const GHOST_IMGS = [
    '/pacman/fantomes/blinky.png',
    '/pacman/fantomes/pinky.png',
    '/pacman/fantomes/inky.png',
    '/pacman/fantomes/clyde.png',
];
const EFFRAYE = '/pacman/fantomes/fantome_effraye.png';
const CLIGNOTANT = '/pacman/fantomes/fantome_clignotant.png';
const YEUX = '/pacman/fantomes/fantome_yeux.png';
const DOT_IMG = '/pacman/items/dot.png';
const ENERG_IMG = '/pacman/items/energizer.png';

const FRUIT_IMGS: Record<FruitType, string> = {
    cerise: '/pacman/items/cerise.png',
    fraise: '/pacman/items/fraise.png',
    orange: '/pacman/items/orange.png',
    pomme: '/pacman/items/pomme.png',
    melon: '/pacman/items/melon.png',
    galaxian: '/pacman/items/cle.png',
    cloche: '/pacman/items/cle.png',
    cle: '/pacman/items/cle.png',
};


export function preloadPacmanImages() {
    const all = [
        ...PAC_FRAMES, ...GHOST_IMGS,
        EFFRAYE, CLIGNOTANT, YEUX,
        DOT_IMG, ENERG_IMG,
        ...Object.values(FRUIT_IMGS),
    ];
    for (const src of all) {
        if (!IMG[src]) {
            const el = new Image();
            el.onload = () => {
                const process = () => {
                    if (typeof OffscreenCanvas !== 'undefined') {
                        const oc = new OffscreenCanvas(el.naturalWidth, el.naturalHeight);
                        const ctx = oc.getContext('2d');
                        if (!ctx) return;
                        ctx.drawImage(el, 0, 0);
                        if (removeBackgroundFromCtx(ctx, oc.width, oc.height)) {
                            PROCESSED[src] = oc;
                        }
                    } else {
                        const canvas = removeBackground(el);
                        if (canvas) PROCESSED[src] = canvas;
                    }
                };
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(process, { timeout: 2000 });
                } else {
                    setTimeout(process, 0);
                }
            };
            el.src = src;
            IMG[src] = el;
        }
    }
}

// Returns a background-removed canvas if available, falls back to the raw
// HTMLImageElement once loaded, or null if not yet ready (triggers fallback drawing).
function loaded(src: string): CanvasImageSource | null {
    if (PROCESSED[src]) return PROCESSED[src];
    const img = IMG[src];
    if (img?.complete && img.naturalWidth > 0) return img;
    return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isWallLike(tile: number): boolean {
    return tile === 1 || tile === 2;
}

function neighbor(maze: number[][], x: number, y: number): number {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return 1;
    return maze[y][x];
}

// ── Wall rendering — neon outline style ──────────────────────────────────────
// Each wall cell gets a dark fill, then a glowing blue line on every side that
// faces a corridor. This naturally handles all topologies (T, cross, corner…)
// without needing per-topology tile assets.

function drawWallTile(ctx: CanvasRenderingContext2D, maze: number[][], x: number, y: number) {
    const px = x * CELL;
    const py = y * CELL;

    ctx.fillStyle = '#060820';
    ctx.fillRect(px, py, CELL, CELL);

    const U = isWallLike(neighbor(maze, x, y - 1));
    const D = isWallLike(neighbor(maze, x, y + 1));
    const L = isWallLike(neighbor(maze, x - 1, y));
    const R = isWallLike(neighbor(maze, x + 1, y));

    type Seg = [number, number, number, number];
    const edges: Seg[] = [];
    if (!U) edges.push([px, py, px + CELL, py]);
    if (!D) edges.push([px, py + CELL, px + CELL, py + CELL]);
    if (!L) edges.push([px, py, px, py + CELL]);
    if (!R) edges.push([px + CELL, py, px + CELL, py + CELL]);
    if (edges.length === 0) return;

    // Pass 1 — wide glow
    ctx.save();
    ctx.strokeStyle = '#1d4ed8';
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 3;
    ctx.lineCap = 'square';
    for (const [x1, y1, x2, y2] of edges) {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.restore();

    // Pass 2 — bright crisp line on top
    ctx.save();
    ctx.strokeStyle = '#93c5fd';
    ctx.shadowColor = '#bfdbfe';
    ctx.shadowBlur = 4;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'square';
    for (const [x1, y1, x2, y2] of edges) {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.restore();
}


// ── Dot ───────────────────────────────────────────────────────────────────────

function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const cx = x * CELL + CELL / 2;
    const cy = y * CELL + CELL / 2;
    const img = loaded(DOT_IMG);
    if (img) {
        const s = CELL * 0.38;
        ctx.drawImage(img, cx - s / 2, cy - s / 2, s, s);
    } else {
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#e2e8f0';
        ctx.fill();
    }
}

// ── Power pellet ──────────────────────────────────────────────────────────────

function drawPellet(ctx: CanvasRenderingContext2D, x: number, y: number, phase: number) {
    const cx = x * CELL + CELL / 2;
    const cy = y * CELL + CELL / 2;
    const pulse = 1 + Math.sin(phase * 2) * 0.08;
    const img = loaded(ENERG_IMG);
    const s = CELL * 0.72 * pulse;

    ctx.save();                          // ← save AVANT toute mutation
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 12;
    if (img) {
        ctx.drawImage(img, cx - s / 2, cy - s / 2, s, s);
    } else {
        ctx.beginPath();
        ctx.arc(cx, cy, 4.5 + Math.sin(phase * 2) * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#facc15';
        ctx.fill();
    }
    ctx.restore();                       // ← restore annule shadow proprement
}

// ── Pac-Man sprite ────────────────────────────────────────────────────────────

const DIR_ROT: Record<string, number> = {
    R: 0, L: Math.PI, U: -Math.PI / 2, D: Math.PI / 2, N: 0,
};

function drawPacmanSprite(
    ctx: CanvasRenderingContext2D,
    pos: Pos,
    dir: string,
    mouthAngle: number,
) {
    const cx = pos.x * CELL + CELL / 2;
    const cy = pos.y * CELL + CELL / 2;
    const rot = DIR_ROT[dir] ?? 0;

    // Pick animation frame: 0 = ferme, 1 = mi-ouvert, 2 = ouvert
    const t = Math.abs(Math.sin(mouthAngle));
    const frameIdx = t < 0.33 ? 0 : t < 0.66 ? 1 : 2;
    const img = loaded(PAC_FRAMES[frameIdx]);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    if (img) {
        ctx.drawImage(img, -CELL / 2, -CELL / 2, CELL, CELL);
    } else {
        // Fallback canvas Pac-Man
        const r = CELL / 2 - 1;
        const angle = 0.12 + t * 0.28;
        const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.35, 1, 0, 0, r);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.6, '#facc15');
        grad.addColorStop(1, '#ca8a04');
        ctx.shadowColor = 'rgba(250,204,21,0.6)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, angle, Math.PI * 2 - angle);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
    }

    ctx.restore();
}

// ── Ghost sprite ──────────────────────────────────────────────────────────────

function drawGhost(
    ctx: CanvasRenderingContext2D,
    pos: Pos,
    index: number,
    frightened: number,
    ghostDir: string,
    dead = false,
) {
    const cx = pos.x * CELL + CELL / 2;
    const cy = pos.y * CELL + CELL / 2;
    const px = pos.x * CELL;
    const py = pos.y * CELL;

    // Choose image source
    let src: string;
    if (dead) {
        src = YEUX;
    } else if (frightened > 0) {
        // Flash during last ~8 ticks
        const flash = frightened < 8 && Math.floor(Date.now() / 220) % 2 === 0;
        src = flash ? CLIGNOTANT : EFFRAYE;
    } else {
        src = GHOST_IMGS[index] ?? GHOST_IMGS[0];
    }

    const img = loaded(src);
    if (img) {
        ctx.drawImage(img, px, py, CELL, CELL);
        return;
    }

    // ── Fallback canvas ghost ─────────────────────────────────────────────────

    if (dead) {
        const eyeOffX = 3.5;
        const eyeY = cy - 2;
        const pupilDirs: Record<string, [number, number]> = {
            L: [-1.2, 0], R: [1.2, 0], U: [0, -1.2], D: [0, 1.2], N: [0, 0],
        };
        const [pdx, pdy] = pupilDirs[ghostDir] ?? [0, 0];
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(cx - eyeOffX, eyeY, 2.8, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + eyeOffX, eyeY, 2.8, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath(); ctx.arc(cx - eyeOffX + pdx, eyeY + pdy, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + eyeOffX + pdx, eyeY + pdy, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        return;
    }

    const r = CELL / 2 - 1;
    const bodyColor = frightened > 0 ? '#3730a3' : (GHOST_COLORS[index]?.body ?? '#ff4444');
    ctx.save();
    ctx.shadowColor = `${bodyColor}88`;
    ctx.shadowBlur = 8;
    ctx.fillStyle = bodyColor;
    const bot = cy + r;
    const left = cx - r;
    const right = cx + r;
    const bumpH = 5;
    const numBumps = 3;
    const bumpW = (r * 2) / numBumps;
    ctx.beginPath();
    ctx.arc(cx, cy - 1, r, Math.PI, 0);
    for (let b = 0; b < numBumps; b++) {
        const bx0 = right - b * bumpW;
        const bx1 = right - (b + 0.5) * bumpW;
        const bx2 = right - (b + 1) * bumpW;
        const by = b % 2 === 0 ? bot : bot - bumpH;
        const mid = b % 2 === 0 ? bot + bumpH : bot;
        ctx.quadraticCurveTo(bx0, by, bx1, mid);
        ctx.quadraticCurveTo(bx2, by, bx2, bot - (b % 2 === 0 ? 0 : bumpH));
    }
    ctx.lineTo(left, bot);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// ── Fruit bonus ───────────────────────────────────────────────────────────────

function drawFruit(ctx: CanvasRenderingContext2D, type: FruitType) {
    const cx = FRUIT_POS.x * CELL + CELL / 2;
    const cy = FRUIT_POS.y * CELL + CELL / 2;
    const src = FRUIT_IMGS[type];
    const img = loaded(src);
    const s = CELL * 1.1;
    ctx.save();
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 10;
    if (img) {
        ctx.drawImage(img, cx - s / 2, cy - s / 2, s, s);
    } else {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(cx, cy, CELL / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// ── Lives indicator ───────────────────────────────────────────────────────────

function drawLives(ctx: CanvasRenderingContext2D, lives: number) {
    for (let i = 0; i < lives; i++) {
        const lx = (i + 1) * (CELL + 3);
        const ly = ROWS * CELL - CELL / 2;
        const r = CELL / 2 - 3;
        const img = loaded(PAC_FRAMES[2]);
        if (img) {
            ctx.drawImage(img, lx - r, ly - r, r * 2, r * 2);
        } else {
            const grad = ctx.createRadialGradient(lx - r * 0.2, ly - r * 0.3, 1, lx, ly, r);
            grad.addColorStop(0, '#fef08a');
            grad.addColorStop(1, '#ca8a04');
            ctx.save();
            ctx.shadowColor = 'rgba(250,204,21,0.5)';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(lx, ly, r, 0.3 * Math.PI, 1.7 * Math.PI);
            ctx.lineTo(lx, ly);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();
        }
    }
}

// ── Main draw ─────────────────────────────────────────────────────────────────

export function drawPacman(
    canvas: HTMLCanvasElement,
    state: GameState,
    mouthAngle: number,
    _isDark: boolean,
) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

    // Walls (tile images) + dots/pellets
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const tile = state.maze[y][x];
            if (tile === 1) drawWallTile(ctx, state.maze, x, y);
            else if (tile === 0) drawDot(ctx, x, y);
            else if (tile === 3) drawPellet(ctx, x, y, mouthAngle);
        }
    }


    for (let i = 0; i < state.ghosts.length; i++) {
        const g = state.ghosts[i];
        drawGhost(ctx, g.pos, i, g.frightened, g.dir ?? 'N', g.dead);
    }

    if (state.fruit) drawFruit(ctx, state.fruit.type);

    drawPacmanSprite(ctx, state.pacPos, state.pacDir, mouthAngle);
    drawLives(ctx, state.lives);
}

// ── Idle screen ───────────────────────────────────────────────────────────────

export function drawIdleScreen(_canvas: HTMLCanvasElement, _isDark: boolean) {
    // no-op
}
