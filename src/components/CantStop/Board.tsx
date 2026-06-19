'use client';

import { colorForIndex } from './colors';
import { COLUMN_LENGTHS, cellCenter } from './boardCoords';
import type { CantStopState } from '@/hooks/useCantStop';

interface Props {
    state: CantStopState;
}

const COLS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function Board({ state }: Props) {
    const currentPlayerIndex = state.currentPlayerIndex;

    // Tous les pions à poser sur l'image : { col, pos, ownerIndex, active }.
    const pawns: { key: string; col: number; pos: number; idx: number; active: boolean }[] = [];
    for (const col of COLS) {
        state.players.forEach((p, idx) => {
            const perm = p.permanent?.[col];
            if (perm && perm >= 1) pawns.push({ key: `p-${col}-${idx}`, col, pos: perm, idx, active: false });
        });
        const active = state.activeMarkers?.[col];
        if (active != null && active >= 1) {
            pawns.push({ key: `a-${col}`, col, pos: active, idx: currentPlayerIndex, active: true });
        }
    }

    return (
        <div className="relative w-full max-w-xl mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/cant-stop/board.png" alt="Plateau Can't Stop" className="w-full h-auto select-none" draggable={false} />

            {pawns.map(pawn => {
                const { x, y } = cellCenter(pawn.col, Math.min(pawn.pos, COLUMN_LENGTHS[pawn.col]));
                const c = colorForIndex(pawn.idx);
                // Plusieurs pions sur la même case : léger décalage horizontal.
                const sameCell = pawns.filter(q => q.col === pawn.col && q.pos === pawn.pos);
                const orderInCell = sameCell.findIndex(q => q.key === pawn.key);
                const offset = (orderInCell - (sameCell.length - 1) / 2) * 2.2;
                return (
                    <span
                        key={pawn.key}
                        className={`absolute rounded-full border-2 shadow-md ${pawn.active ? 'animate-pulse' : ''}`}
                        style={{
                            left: `calc(${x + offset}% )`,
                            top: `${y}%`,
                            width: '3.2%',
                            aspectRatio: '1 / 1',
                            transform: 'translate(-50%, -50%)',
                            background: c.bg,
                            borderColor: pawn.active ? '#fff' : c.border,
                        }}
                        title={pawn.active ? 'Marqueur en cours' : undefined}
                    />
                );
            })}
        </div>
    );
}
