'use client';

import { useEffect, useMemo, useState } from 'react';
import type { BlokusState, BlokusMove } from '@/hooks/useBlokus';
import {
    BOARD_SIZE, COLORS, CORNERS, PIECE_IDS, PIECE_ORIENTATIONS, PIECE_SIZE,
    canPlace, placementCells, rotateOri, flipOri,
} from './pieces';
import { ArrowPathIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

interface Props {
    state: BlokusState;
    myColorIndex: number;
    isMyTurn: boolean;
    onMove: (m: BlokusMove) => void;
}

/** Aperçu d'une pièce (orientation donnée) dans une mini-grille. */
function PieceThumb({ pieceId, ori, color, size = 11 }: { pieceId: string; ori: number; color: string; size?: number }) {
    const cells = PIECE_ORIENTATIONS[pieceId][ori];
    const w = Math.max(...cells.map(c => c[0])) + 1;
    const h = Math.max(...cells.map(c => c[1])) + 1;
    const filled = new Set(cells.map(([x, y]) => `${x},${y}`));
    return (
        <div className="grid" style={{ gridTemplateColumns: `repeat(${w}, ${size}px)`, gridTemplateRows: `repeat(${h}, ${size}px)` }}>
            {Array.from({ length: h }).map((_, y) =>
                Array.from({ length: w }).map((_, x) => (
                    <div key={`${x},${y}`} style={{
                        width: size, height: size,
                        background: filled.has(`${x},${y}`) ? color : 'transparent',
                        border: filled.has(`${x},${y}`) ? '1px solid rgba(0,0,0,0.25)' : 'none',
                    }} />
                ))
            )}
        </div>
    );
}

export default function BlokusBoard({ state, myColorIndex, isMyTurn, onMove }: Props) {
    const [selected, setSelected] = useState<string | null>(null);
    const [ori, setOri] = useState(0);
    const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

    const myColor = COLORS[myColorIndex];
    const placedAny = state.placedAny[myColorIndex];
    const remaining = state.remaining[myColorIndex] ?? [];

    // garde une pièce/orientation valide quand l'état change
    useEffect(() => { if (selected && !remaining.includes(selected)) { setSelected(null); setHover(null); } }, [remaining, selected]);
    useEffect(() => { if (!isMyTurn) { setHover(null); } }, [isMyTurn]);

    const preview = useMemo(() => {
        if (!selected || !hover || myColorIndex == null) return null;
        const cells = placementCells(selected, ori, hover.x, hover.y);
        const valid = isMyTurn && canPlace(state.board, myColorIndex, placedAny, selected, ori, hover.x, hover.y);
        return { cells: new Set(cells.map(([x, y]) => `${x},${y}`)), valid };
    }, [selected, ori, hover, state.board, myColorIndex, placedAny, isMyTurn]);

    // clavier : R = pivoter, F = retourner
    useEffect(() => {
        if (!selected) return;
        const h = (e: KeyboardEvent) => {
            if (e.key === 'r' || e.key === 'R') setOri(o => rotateOri(selected, o));
            if (e.key === 'f' || e.key === 'F') setOri(o => flipOri(selected, o));
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [selected]);

    const place = (x: number, y: number) => {
        if (!selected || !isMyTurn) return;
        if (!canPlace(state.board, myColorIndex, placedAny, selected, ori, x, y)) return;
        onMove({ pieceId: selected, ori, x, y });
        setSelected(null); setHover(null);
    };

    const cellPx = 'min(4.2vw, 26px)';

    return (
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-5">
            {/* Plateau */}
            <div
                className="grid bg-white/70 dark:bg-zinc-900/60 p-1 rounded-lg shadow ring-1 ring-black/10 select-none"
                style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, ${cellPx})`, gridTemplateRows: `repeat(${BOARD_SIZE}, ${cellPx})` }}
                onMouseLeave={() => setHover(null)}
            >
                {Array.from({ length: BOARD_SIZE }).map((_, y) =>
                    Array.from({ length: BOARD_SIZE }).map((_, x) => {
                        const owner = state.board[y][x];
                        const key = `${x},${y}`;
                        const inPreview = preview?.cells.has(key);
                        const corner = CORNERS.findIndex(([cx, cy]) => cx === x && cy === y);
                        let bg = owner >= 0 ? COLORS[owner] : 'transparent';
                        if (inPreview) bg = preview!.valid ? myColor : '#ef4444';
                        return (
                            <div
                                key={key}
                                onMouseEnter={() => isMyTurn && selected && setHover({ x, y })}
                                onClick={() => place(x, y)}
                                style={{
                                    width: cellPx, height: cellPx, background: bg,
                                    opacity: inPreview && owner < 0 ? 0.7 : 1,
                                    outline: '1px solid rgba(120,120,120,0.18)',
                                    boxShadow: corner >= 0 && owner < 0 ? `inset 0 0 0 2px ${COLORS[corner]}66` : undefined,
                                    cursor: isMyTurn && selected ? 'pointer' : 'default',
                                }}
                            />
                        );
                    })
                )}
            </div>

            {/* Réserve + contrôles */}
            <div className="flex flex-col gap-3 w-full lg:w-64">
                {selected && (
                    <div className="flex items-center gap-2 justify-center lg:justify-start">
                        <button onClick={() => setOri(o => rotateOri(selected, o))}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600">
                            <ArrowPathIcon className="w-4 h-4" /> Pivoter <span className="opacity-50">R</span>
                        </button>
                        <button onClick={() => setOri(o => flipOri(selected, o))}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600">
                            <ArrowsRightLeftIcon className="w-4 h-4" /> Retourner <span className="opacity-50">F</span>
                        </button>
                    </div>
                )}
                <div className="flex flex-wrap gap-1.5 justify-center lg:justify-start max-h-[40vh] lg:max-h-none overflow-y-auto p-1 rounded-lg bg-black/5 dark:bg-white/5">
                    {PIECE_IDS.filter(id => remaining.includes(id))
                        .sort((a, b) => PIECE_SIZE[b] - PIECE_SIZE[a])
                        .map(id => {
                            const active = selected === id;
                            return (
                                <button key={id}
                                    onClick={() => { setSelected(id); setOri(0); }}
                                    disabled={!isMyTurn}
                                    className={`p-1 rounded-md transition ${active ? 'ring-2 ring-offset-1 ring-indigo-500 bg-white dark:bg-zinc-800' : 'hover:bg-white/60 dark:hover:bg-zinc-800/60'} ${!isMyTurn ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
                                    title={id}>
                                    <PieceThumb pieceId={id} ori={active ? ori : 0} color={myColor} />
                                </button>
                            );
                        })}
                    {remaining.length === 0 && <p className="text-xs text-gray-500 p-2">Toutes tes pièces sont posées 🎉</p>}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center lg:text-left">
                    {remaining.length} pièce{remaining.length > 1 ? 's' : ''} restante{remaining.length > 1 ? 's' : ''} · {89 - state.scores[myColorIndex]} cases à poser
                </p>
            </div>
        </div>
    );
}
