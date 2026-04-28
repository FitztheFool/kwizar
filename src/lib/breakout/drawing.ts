import {
    W, H, PADDLE_Y, PADDLE_H, BALL_R, PADDLE_W_DEFAULT,
    BRICK_W, BRICK_H, BRICK_GAP, BRICK_OFFSET_Y,
    ROW_COLORS, POWERUP_COLORS, POWERUP_LABELS,
    type PowerUpType,
} from './constants';
import type { GameState, Brick } from './engine';

// Cache module-level : persiste pour toute la durée de la session
const _imgCache = new Map<string, HTMLImageElement>();

export function preloadPowerUpImages(paths: Record<string, string>) {
    for (const [type, path] of Object.entries(paths)) {
        if (_imgCache.has(type)) continue;
        const img = new Image();
        img.onload = () => _imgCache.set(type, img);
        img.src = path;
    }
}

function brickX(col: number) {
    const BRICK_OFFSET_X = (W - 8 * (BRICK_W + BRICK_GAP) + BRICK_GAP) / 2;
    return BRICK_OFFSET_X + col * (BRICK_W + BRICK_GAP);
}

function brickY(row: number) {
    return BRICK_OFFSET_Y + row * (BRICK_H + BRICK_GAP);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawBrick(ctx: CanvasRenderingContext2D, b: Brick) {
    const x = brickX(b.col);
    const y = brickY(b.row);
    const w = BRICK_W;
    const h = BRICK_H;

    if (b.type === 'indestructible') {
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, '#374151');
        grad.addColorStop(1, '#1f2937');
        ctx.fillStyle = grad;
        roundRect(ctx, x, y, w, h, 3);
        ctx.fill();

        // diagonal hatching
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 1;
        for (let i = -h; i < w + h; i += 6) {
            ctx.beginPath();
            ctx.moveTo(x + i, y);
            ctx.lineTo(x + i + h, y + h);
            ctx.stroke();
        }
        ctx.restore();

        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1;
        roundRect(ctx, x, y, w, h, 3);
        ctx.stroke();
        return;
    }

    if (b.type === 'hard') {
        const baseColor = b.hp === b.maxHp ? '#9ca3af' : '#6b7280';
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, baseColor);
        grad.addColorStop(1, '#4b5563');
        ctx.fillStyle = grad;
        roundRect(ctx, x, y, w, h, 3);
        ctx.fill();

        // crack after 1st hit
        if (b.hp < b.maxHp) {
            ctx.save();
            ctx.clip();
            ctx.strokeStyle = '#1f2937';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x + w * 0.3, y + 2);
            ctx.lineTo(x + w * 0.45, y + h * 0.5);
            ctx.lineTo(x + w * 0.6, y + h - 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + w * 0.6, y + 3);
            ctx.lineTo(x + w * 0.5, y + h * 0.4);
            ctx.stroke();
            ctx.restore();
        }
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 0.5;
        roundRect(ctx, x, y, w, h, 3);
        ctx.stroke();
        return;
    }

    if (b.type === 'explosive') {
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, '#f97316');
        grad.addColorStop(1, '#c2410c');
        ctx.fillStyle = grad;
        roundRect(ctx, x, y, w, h, 3);
        ctx.fill();
        // ✦ symbol
        ctx.fillStyle = '#fff8';
        ctx.font = `bold ${Math.floor(h * 0.75)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✦', x + w / 2, y + h / 2);
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 0.5;
        roundRect(ctx, x, y, w, h, 3);
        ctx.stroke();
        return;
    }

    // Normal brick — gradient by row
    const color = ROW_COLORS[b.row % ROW_COLORS.length];
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, color + 'ff');
    grad.addColorStop(1, color + '99');
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, w, h, 3);
    ctx.fill();
    ctx.strokeStyle = color + '66';
    ctx.lineWidth = 0.5;
    roundRect(ctx, x, y, w, h, 3);
    ctx.stroke();

    // small power-up indicator dot
    if (b.power) {
        ctx.fillStyle = POWERUP_COLORS[b.power] + 'cc';
        ctx.beginPath();
        ctx.arc(x + w - 5, y + 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPaddle(ctx: CanvasRenderingContext2D, paddleX: number, paddleW: number, laserMode: boolean, isDark: boolean) {
    const x = paddleX;
    const y = PADDLE_Y;
    const w = paddleW;
    const h = PADDLE_H;
    const r = h / 2;

    const color = laserMode ? '#06b6d4' : isDark ? '#e2e8f0' : '#334155';
    const colorEnd = laserMode ? '#0891b2' : isDark ? '#94a3b8' : '#0f172a';
    const grad = ctx.createRadialGradient(x + w / 2, y + h / 2, 2, x + w / 2, y + h / 2, w / 2);
    grad.addColorStop(0, color);
    grad.addColorStop(1, colorEnd);

    ctx.fillStyle = grad;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();

    if (laserMode) {
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1;
        roundRect(ctx, x, y, w, h, r);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, stickyMode: boolean, isDark: boolean) {
    const color = stickyMode ? '#eab308' : isDark ? '#ffffff' : '#0f172a';
    const glow = stickyMode ? '#eab308' : isDark ? '#ffffff' : '#475569';
    ctx.shadowColor = glow;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawPowerUpCapsule(ctx: CanvasRenderingContext2D, x: number, y: number, type: PowerUpType) {
    const img = _imgCache.get(type);
    if (img) {
        const size = 36;
        ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
        return;
    }

    // Fallback canvas
    const w = 28;
    const h = 14;
    const color = POWERUP_COLORS[type];
    const label = POWERUP_LABELS[type];

    roundRect(ctx, x - w / 2, y - h / 2, w, h, 4);
    ctx.fillStyle = color + 'dd';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
}

function drawLaser(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 20);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: GameState['particles']) {
    for (const p of particles) {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.r), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawLives(ctx: CanvasRenderingContext2D, lives: number, isDark: boolean) {
    const textColor = isDark ? '#e2e8f0' : '#1e293b';
    ctx.fillStyle = textColor;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < Math.min(lives, 5); i++) {
        const x = 12 + i * 18;
        const y = H - 18;
        // mini heart
        ctx.fillStyle = '#f472b6';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('♥', x, y);
    }
}

export function drawBreakout(canvas: HTMLCanvasElement, state: GameState, isDark: boolean) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid lines
    ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
    ctx.lineWidth = 0.5;
    for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Active effects indicator bar (top)
    const hasWide = state.activeEffects.some(e => e.type === 'WIDE');
    const hasNarrow = state.activeEffects.some(e => e.type === 'NARROW');
    const hasSlow = state.activeEffects.some(e => e.type === 'SLOW');
    const hasFast = state.activeEffects.some(e => e.type === 'FAST');
    const hasSticky = state.activeEffects.some(e => e.type === 'STICKY');
    const hasLaser = state.activeEffects.some(e => e.type === 'LASER');
    const indicators: { label: string; color: string }[] = [];
    if (hasWide) indicators.push({ label: 'WIDE', color: '#22c55e' });
    if (hasNarrow) indicators.push({ label: 'NARROW', color: '#ef4444' });
    if (hasSlow) indicators.push({ label: 'SLOW', color: '#38bdf8' });
    if (hasFast) indicators.push({ label: 'FAST', color: '#dc2626' });
    if (hasSticky) indicators.push({ label: 'STICK', color: '#eab308' });
    if (hasLaser) indicators.push({ label: 'LASER', color: '#06b6d4' });

    if (indicators.length > 0) {
        ctx.font = 'bold 9px monospace';
        ctx.textBaseline = 'top';
        let ix = W - 8;
        for (const ind of [...indicators].reverse()) {
            ctx.fillStyle = ind.color;
            const tw = ctx.measureText(ind.label).width;
            ix -= tw + 4;
            ctx.fillText(ind.label, ix, 4);
        }
    }

    // Bricks
    for (const brick of state.bricks) {
        drawBrick(ctx, brick);
    }

    // Falling power-ups
    for (const fp of state.fallingPowers) {
        drawPowerUpCapsule(ctx, fp.x, fp.y, fp.type as PowerUpType);
    }

    // Lasers
    for (const laser of state.lasers) {
        drawLaser(ctx, laser.x, laser.y);
    }

    // Particles
    drawParticles(ctx, state.particles);

    // Balls
    for (const ball of state.balls) {
        drawBall(ctx, ball.x, ball.y, state.stickyMode, isDark);
    }

    // Paddle
    drawPaddle(ctx, state.paddleX, state.paddleW, state.laserMode, isDark);

    // Lives
    drawLives(ctx, state.lives, isDark);
}

export function drawIdleScreen(canvas: HTMLCanvasElement, isDark: boolean) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    // Decorative bricks
    const demoColors = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'];
    const bw = 44, bh = 18, bg = 4;
    const offsetX = (W - 8 * (bw + bg) + bg) / 2;
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 8; col++) {
            const x = offsetX + col * (bw + bg);
            const y = BRICK_OFFSET_Y + row * (bh + bg);
            const color = demoColors[(row * 2 + col) % demoColors.length];
            const grad = ctx.createLinearGradient(x, y, x, y + bh);
            grad.addColorStop(0, color + 'ff');
            grad.addColorStop(1, color + '88');
            ctx.fillStyle = grad;
            roundRect(ctx, x, y, bw, bh, 3);
            ctx.fill();
        }
    }

    // Title
    const titleColor = isDark ? '#f1f5f9' : '#0f172a';
    ctx.fillStyle = titleColor;
    ctx.font = 'black 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BREAKOUT', W / 2, 220);

    // Subtitle glow
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Cassez toutes les briques !', W / 2, 258);
    ctx.shadowBlur = 0;

    // Instructions
    const subColor = isDark ? '#64748b' : '#94a3b8';
    ctx.fillStyle = subColor;
    ctx.font = '13px sans-serif';
    ctx.fillText('Souris / touch pour déplacer la palette', W / 2, 300);
    ctx.fillText('Clic / tap pour lancer la balle', W / 2, 320);
    ctx.fillText('Espace / clic pour tirer en mode Laser', W / 2, 340);

    // Demo ball + paddle
    const ballColor = isDark ? '#ffffff' : '#0f172a';
    const ballGlow = isDark ? '#ffffff' : '#475569';
    ctx.fillStyle = ballColor;
    ctx.shadowColor = ballGlow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(W / 2, 410, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    const pw = PADDLE_W_DEFAULT;
    const paddleTop = isDark ? '#e2e8f0' : '#334155';
    const paddleBot = isDark ? '#94a3b8' : '#0f172a';
    const grad = ctx.createRadialGradient(W / 2, H - 60, 2, W / 2, H - 60, pw / 2);
    grad.addColorStop(0, paddleTop);
    grad.addColorStop(1, paddleBot);
    ctx.fillStyle = grad;
    roundRect(ctx, W / 2 - pw / 2, H - 70, pw, 12, 6);
    ctx.fill();
}
