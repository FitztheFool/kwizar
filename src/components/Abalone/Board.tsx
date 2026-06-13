'use client';
import { useEffect, useMemo, useState } from 'react';
import type { AbaloneGameState } from '@/hooks/useAbalone';

// Doit correspondre au moteur serveur.
const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
    [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1],
];
const RADIUS = 4;
const key = (q: number, r: number) => `${q},${r}`;
const inBoard = (q: number, r: number) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2 <= RADIUS;
const sortedKey = (keys: string[]) => [...keys].sort().join('|');

const CELL_CSS = 'min(56px, max(30px, calc((100vw - 2rem) / 11)))';

const MARBLE: Record<0 | 1, string> = {
    0: 'bg-gradient-to-br from-zinc-700 to-zinc-900 border-zinc-950',
    1: 'bg-gradient-to-br from-zinc-100 to-zinc-300 border-zinc-400',
};

interface Props {
    state: AbaloneGameState;
    myColorIndex: 0 | 1;
    isMyTurn: boolean;
    onMove: (marbles: string[], dir: number) => void;
}

export default function AbaloneBoard({ state, myColorIndex, isMyTurn, onMove }: Props) {
    const [selected, setSelected] = useState<string[]>([]);

    // Toute évolution (tour, plateau) réinitialise la sélection.
    useEffect(() => { setSelected([]); }, [state.currentTurn, state.phase, state.board]);

    const flip = myColorIndex === 1 ? -1 : 1;     // oriente mes billes en bas
    const ux = (q: number, r: number) => flip * (q + r / 2);
    const uy = (q: number, r: number) => flip * (r * 0.8660254);

    const cells = useMemo(() => {
        const out: { q: number; r: number }[] = [];
        for (let q = -RADIUS; q <= RADIUS; q++)
            for (let r = -RADIUS; r <= RADIUS; r++)
                if (inBoard(q, r)) out.push({ q, r });
        return out;
    }, []);

    const bounds = useMemo(() => {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const c of cells) {
            const x = ux(c.q, c.r), y = uy(c.q, c.r);
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
        return { minX, maxX, minY, maxY };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cells, flip]);

    const owners = useMemo(() => {
        const m = new Map<string, 0 | 1>();
        for (const c of state.board) m.set(key(c.q, c.r), c.owner);
        return m;
    }, [state.board]);

    // Billes appartenant à au moins un coup légal (sélectionnables).
    const selectableMarbles = useMemo(() => {
        const s = new Set<string>();
        for (const mv of state.legal ?? []) for (const k of mv.marbles) s.add(k);
        return s;
    }, [state.legal]);

    // Directions valides pour la sélection courante.
    const validDirs = useMemo(() => {
        if (selected.length === 0) return new Map<number, void>();
        const sk = sortedKey(selected);
        const dirs = new Map<number, void>();
        for (const mv of state.legal ?? []) {
            if (sortedKey(mv.marbles) === sk) dirs.set(mv.dir, undefined);
        }
        return dirs;
    }, [selected, state.legal]);

    const toggle = (k: string) => {
        if (!isMyTurn || owners.get(k) !== myColorIndex) return;
        setSelected(prev => {
            if (prev.includes(k)) return prev.filter(x => x !== k);
            if (prev.length >= 3) return [k];
            return [...prev, k];
        });
    };

    const cellPx = (q: number, r: number) => ({
        left: `calc((${ux(q, r) - bounds.minX}) * var(--ab-cell))`,
        top: `calc((${uy(q, r) - bounds.minY}) * var(--ab-cell))`,
    });

    // Centre pixel (unités) de la sélection, pour placer les flèches.
    const center = useMemo(() => {
        if (selected.length === 0) return null;
        let sx = 0, sy = 0;
        for (const k of selected) {
            const [q, r] = k.split(',').map(Number);
            sx += ux(q, r) - bounds.minX; sy += uy(q, r) - bounds.minY;
        }
        return { x: sx / selected.length, y: sy / selected.length };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, bounds, flip]);

    const width = `calc((${bounds.maxX - bounds.minX} + 1) * var(--ab-cell))`;
    const height = `calc((${bounds.maxY - bounds.minY} + 1) * var(--ab-cell))`;

    return (
        <div
            className="relative rounded-2xl p-4 bg-gradient-to-br from-amber-800 to-amber-950 shadow-2xl"
            style={{ ['--ab-cell' as string]: CELL_CSS }}
        >
            <div className="relative mx-auto" style={{ width, height }}>
                {/* Cases (trous) + billes */}
                {cells.map(({ q, r }) => {
                    const k = key(q, r);
                    const owner = owners.get(k);
                    const isSel = selected.includes(k);
                    const canSelect = isMyTurn && owner === myColorIndex && selectableMarbles.has(k);
                    return (
                        <button
                            key={k}
                            type="button"
                            onClick={() => toggle(k)}
                            disabled={owner === undefined || owner !== myColorIndex || !isMyTurn}
                            className="absolute rounded-full flex items-center justify-center"
                            style={{
                                ...cellPx(q, r),
                                width: 'var(--ab-cell)',
                                height: 'var(--ab-cell)',
                            }}
                            title={k}
                        >
                            {/* trou */}
                            <span className="absolute rounded-full bg-amber-950/60 shadow-inner"
                                style={{ width: '74%', height: '74%' }} />
                            {/* bille */}
                            {owner !== undefined && (
                                <span
                                    className={`absolute rounded-full border-2 shadow-md transition-transform ${MARBLE[owner]}
                                        ${isSel ? 'scale-110 ring-2 ring-amber-300 ring-offset-1 ring-offset-amber-900 z-10' : ''}
                                        ${canSelect && !isSel ? 'ring-1 ring-amber-300/60 cursor-pointer hover:scale-105' : ''}`}
                                    style={{ width: '78%', height: '78%' }}
                                />
                            )}
                        </button>
                    );
                })}

                {/* Flèches de direction autour de la sélection */}
                {center && isMyTurn && [0, 1, 2, 3, 4, 5].map(d => {
                    const ok = validDirs.has(d);
                    if (!ok) return null;
                    const [dq, dr] = DIRECTIONS[d];
                    const vx = flip * (dq + dr / 2), vy = flip * (dr * 0.8660254);
                    const len = Math.hypot(vx, vy) || 1;
                    const ox = (vx / len) * 0.95, oy = (vy / len) * 0.95;
                    const angle = Math.atan2(vy, vx) * 180 / Math.PI;
                    return (
                        <button
                            key={d}
                            type="button"
                            onClick={() => { onMove(selected, d); setSelected([]); }}
                            className="absolute z-20 flex items-center justify-center rounded-full bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-lg cursor-pointer animate-pulse"
                            style={{
                                left: `calc((${center.x + ox} + 0.5) * var(--ab-cell) - 0.5 * var(--ab-cell) * 0.5)`,
                                top: `calc((${center.y + oy} + 0.5) * var(--ab-cell) - 0.5 * var(--ab-cell) * 0.5)`,
                                width: 'calc(var(--ab-cell) * 0.5)',
                                height: 'calc(var(--ab-cell) * 0.5)',
                            }}
                            title="Jouer dans cette direction"
                        >
                            <svg viewBox="0 0 24 24" className="w-3/4 h-3/4" style={{ transform: `rotate(${angle}deg)` }} fill="currentColor">
                                <path d="M4 12h12m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
