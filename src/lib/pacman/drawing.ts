import { COLS, ROWS, CELL, GHOST_COLORS, MAZE_TEMPLATE, type Pos } from './constants';
import type { GameState } from './engine';

// ── Palette ───────────────────────────────────────────────────────────────────

const THEME = {
    light: {
        bg:     '#f1f0ec',
        wall:   '#1e3a8a',
        wallHi: '#3b82f6',
        dot:    '#9ca3af',
        pellet: '#dc2626',
    },
    dark: {
        bg:     '#0f0f23',
        wall:   '#2563eb',
        wallHi: '#60a5fa',
        dot:    '#fbbf24',
        pellet: '#fbbf24',
    },
};

// ── Wall drawing ──────────────────────────────────────────────────────────────

function drawWall(ctx: CanvasRenderingContext2D, x: number, y: number, isDark: boolean) {
    const t = isDark ? THEME.dark : THEME.light;
    const px = x * CELL + 1;
    const py = y * CELL + 1;
    const s = CELL - 2;
    const r = 4;

    ctx.beginPath();
    ctx.roundRect(px, py, s, s, r);
    ctx.fillStyle = t.wall;
    ctx.fill();

    // inner highlight edge (top-left)
    ctx.beginPath();
    ctx.roundRect(px + 2, py + 2, s - 4, s - 4, r - 1);
    ctx.strokeStyle = t.wallHi;
    ctx.lineWidth = 1;
    ctx.globalAlpha = isDark ? 0.35 : 0.25;
    ctx.stroke();
    ctx.globalAlpha = 1;
}

// ── Dot / pellet ──────────────────────────────────────────────────────────────

function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, isDark: boolean) {
    const t = isDark ? THEME.dark : THEME.light;
    ctx.beginPath();
    ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 2, 0, Math.PI * 2);
    ctx.fillStyle = t.dot;
    ctx.fill();
}

function drawPellet(ctx: CanvasRenderingContext2D, x: number, y: number, phase: number, isDark: boolean) {
    const t = isDark ? THEME.dark : THEME.light;
    const cx = x * CELL + CELL / 2;
    const cy = y * CELL + CELL / 2;
    const r = 4.5 + Math.sin(phase * 2) * 0.8;

    ctx.save();
    ctx.shadowColor = t.pellet;
    ctx.shadowBlur = isDark ? 10 : 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = t.pellet;
    ctx.fill();
    ctx.restore();
}

// ── Pac-Man sprite ────────────────────────────────────────────────────────────

function drawPacmanSprite(
    ctx: CanvasRenderingContext2D,
    pos: Pos,
    dir: string,
    mouthAngle: number,
) {
    const cx = pos.x * CELL + CELL / 2;
    const cy = pos.y * CELL + CELL / 2;
    const r = CELL / 2 - 1;
    const angle = Math.abs(Math.sin(mouthAngle)) * 0.36;

    const rotations: Record<string, number> = { R: 0, L: Math.PI, U: -Math.PI / 2, D: Math.PI / 2, N: 0 };
    const rot = rotations[dir] ?? 0;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    // Radial gradient body
    const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.3, 1, 0, 0, r);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.6, '#facc15');
    grad.addColorStop(1, '#ca8a04');

    ctx.shadowColor = 'rgba(250,204,21,0.45)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, angle, 2 * Math.PI - angle);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Eye
    const eyeX = r * 0.1;
    const eyeY = -r * 0.45;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    ctx.restore();
}

// ── Ghost sprite ──────────────────────────────────────────────────────────────

function drawGhost(
    ctx: CanvasRenderingContext2D,
    pos: Pos,
    index: number,
    frightened: boolean,
    ghostDir: string,
    dead = false,
) {
    const cx = pos.x * CELL + CELL / 2;
    const cy = pos.y * CELL + CELL / 2;

    // Fantôme mort : seulement les yeux qui rentrent à la prison
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
    const bodyColor = frightened ? '#3730a3' : (GHOST_COLORS[index]?.body ?? '#ff4444');

    ctx.save();

    // Body gradient
    const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.3, 1, cx, cy, r * 1.4);
    if (frightened) {
        grad.addColorStop(0, '#6366f1');
        grad.addColorStop(1, '#1e1b4b');
    } else {
        const base = GHOST_COLORS[index]?.body ?? '#ff4444';
        grad.addColorStop(0, lighten(base, 0.4));
        grad.addColorStop(1, darken(base, 0.2));
    }

    ctx.shadowColor = frightened ? 'rgba(99,102,241,0.5)' : `${bodyColor}88`;
    ctx.shadowBlur = 8;
    ctx.fillStyle = grad;

    // Ghost shape: dome top + bezier skirt
    const top = cy - r;
    const bot = cy + r;
    const left = cx - r;
    const right = cx + r;
    const bumpH = 5;
    const numBumps = 3;
    const bumpW = (r * 2) / numBumps;

    ctx.beginPath();
    ctx.arc(cx, cy - 1, r, Math.PI, 0); // dome
    // Wavy skirt with smooth bezier bumps
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
    ctx.shadowBlur = 0;

    if (!frightened) {
        // Eyes — white sclera
        const eyeOffX = 3.5;
        const eyeY = cy - r * 0.25;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(cx - eyeOffX, eyeY, 3, 3.8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + eyeOffX, eyeY, 3, 3.8, 0, 0, Math.PI * 2); ctx.fill();

        // Pupils — track ghost direction
        const pupilDirs: Record<string, [number, number]> = {
            L: [-1.2, 0], R: [1.2, 0], U: [0, -1.2], D: [0, 1.2], N: [0, 0],
        };
        const [pdx, pdy] = pupilDirs[ghostDir] ?? [0, 0];
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath(); ctx.arc(cx - eyeOffX + pdx, eyeY + pdy, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + eyeOffX + pdx, eyeY + pdy, 1.8, 0, Math.PI * 2); ctx.fill();
    } else {
        // Frightened face
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy - 1);
        ctx.lineTo(cx - 2.5, cy + 2);
        ctx.lineTo(cx, cy - 1);
        ctx.lineTo(cx + 2.5, cy + 2);
        ctx.lineTo(cx + 5, cy - 1);
        ctx.stroke();
        // Two dots for eyes
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(cx - 3.5, cy - 4, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 3.5, cy - 4, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
}

// ── Lives indicator ───────────────────────────────────────────────────────────

function drawLives(ctx: CanvasRenderingContext2D, lives: number) {
    for (let i = 0; i < lives; i++) {
        const lx = (i + 1) * (CELL + 3);
        const ly = ROWS * CELL - CELL / 2;
        const r = CELL / 2 - 3;

        const grad = ctx.createRadialGradient(lx - r * 0.2, ly - r * 0.3, 1, lx, ly, r);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(1, '#ca8a04');

        ctx.save();
        ctx.beginPath();
        ctx.arc(lx, ly, r, 0.3 * Math.PI, 1.7 * Math.PI);
        ctx.lineTo(lx, ly);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
    }
}

// ── Main draw ─────────────────────────────────────────────────────────────────

export function drawPacman(
    canvas: HTMLCanvasElement,
    state: GameState,
    mouthAngle: number,
    isDark: boolean,
) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const t = isDark ? THEME.dark : THEME.light;

    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const tile = state.maze[y][x];
            if (tile === 1) drawWall(ctx, x, y, isDark);
            else if (tile === 0) drawDot(ctx, x, y, isDark);
            else if (tile === 3) drawPellet(ctx, x, y, mouthAngle, isDark);
        }
    }

    for (let i = 0; i < state.ghosts.length; i++) {
        const g = state.ghosts[i];
        drawGhost(ctx, g.pos, i, g.frightened > 0, g.dir ?? 'N', g.dead);
    }

    drawPacmanSprite(ctx, state.pacPos, state.pacDir, mouthAngle);
    drawLives(ctx, state.lives);
}

// ── Idle screen ───────────────────────────────────────────────────────────────

export function drawIdleScreen(canvas: HTMLCanvasElement, isDark: boolean) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const t = isDark ? THEME.dark : THEME.light;

    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (MAZE_TEMPLATE[y][x] === 1) drawWall(ctx, x, y, isDark);
        }
    }

    ctx.textAlign = 'center';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#facc15';
    ctx.font = `bold ${CELL}px monospace`;
    ctx.fillText('PAC-MAN', (COLS * CELL) / 2, (ROWS * CELL) / 2 - CELL);
    ctx.shadowBlur = 0;

    const subText = 'Flèches ou Z,Q,S,D pour jouer';
    ctx.font = `${CELL - 6}px monospace`;
    const textW = ctx.measureText(subText).width;
    const tx = (COLS * CELL) / 2;
    const ty = (ROWS * CELL) / 2 + CELL;
    const pad = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.roundRect(tx - textW / 2 - pad, ty - (CELL - 6) + 2, textW + pad * 2, CELL - 2, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(subText, tx, ty);
    ctx.textAlign = 'left';
}

// ── Color helpers ─────────────────────────────────────────────────────────────

function lighten(hex: string, amount: number): string {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 0xff) + Math.round(255 * amount));
    const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * amount));
    const b = Math.min(255, (n & 0xff) + Math.round(255 * amount));
    return `rgb(${r},${g},${b})`;
}

function darken(hex: string, amount: number): string {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((n >> 16) & 0xff) - Math.round(255 * amount));
    const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amount));
    const b = Math.max(0, (n & 0xff) - Math.round(255 * amount));
    return `rgb(${r},${g},${b})`;
}
