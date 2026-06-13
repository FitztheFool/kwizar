'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
    AtlantideHex,
    AtlantideLegalMove,
    AtlantideState,
} from '@/hooks/useAtlantide';
import {
    BOARD_H,
    BOARD_HEXES,
    BOARD_W,
    BOAT_SPRITE,
    COLOR_CLASSES,
    CREATURE_SPRITE,
    HEX_CLIP,
    HEX_H,
    LEVEL_CLASSES,
    LEVEL_SPRITE,
    REFUGE_SPRITE,
    hexOrigin,
    isRefuge,
} from './boardLayout';

type Selected =
    | { kind: 'meeple'; id: number }
    | { kind: 'boat'; id: number }
    | { kind: 'creature'; id: number }
    | null;

interface BoardProps {
    state: AtlantideState;
    myUserId: string;
    isMyTurn: boolean;
    onMove: (meepleId: number, q: number, r: number) => void;
    onMoveBoat: (boatId: number, q: number, r: number) => void;
    onRemoveTile: (q: number, r: number) => void;
    onMoveCreature: (creatureId: number, q: number, r: number) => void;
}

// La cellule est une variable CSS pour que le plateau s'adapte aux petits écrans.
const CELL_CSS = 'min(52px, max(30px, calc((100vw - 2rem) / 11.5)))';

const key = (q: number, r: number) => `${q},${r}`;

export default function AtlantideBoard({ state, myUserId, isMyTurn, onMove, onMoveBoat, onRemoveTile, onMoveCreature }: BoardProps) {
    const [selected, setSelected] = useState<Selected>(null);

    // Toute évolution du tour invalide la sélection en cours.
    useEffect(() => {
        setSelected(null);
    }, [state.phase, state.currentTurn, state.movePoints, state.creatureDie]);

    const tilesByHex = useMemo(() => {
        const map = new Map<string, { level: string; removed: boolean }>();
        for (const t of state.tiles) map.set(key(t.q, t.r), { level: t.level, removed: t.removed });
        return map;
    }, [state.tiles]);

    // Destinations actuellement cliquables (selon la phase et la sélection).
    const targets = useMemo(() => {
        const map = new Map<string, AtlantideLegalMove | AtlantideHex>();
        if (!isMyTurn || !state.legal) return map;
        if (state.phase === 'tile') {
            for (const t of state.legal.tiles ?? []) map.set(key(t.q, t.r), t);
        } else if (state.phase === 'moving' && selected?.kind === 'meeple') {
            for (const m of state.legal.meeples?.[selected.id] ?? []) map.set(key(m.q, m.r), m);
        } else if (state.phase === 'moving' && selected?.kind === 'boat') {
            for (const m of state.legal.boats?.[selected.id] ?? []) map.set(key(m.q, m.r), m);
        } else if (state.phase === 'creature' && selected?.kind === 'creature') {
            for (const m of state.legal.creatures?.[selected.id] ?? []) map.set(key(m.q, m.r), m);
        }
        return map;
    }, [isMyTurn, state.legal, state.phase, selected]);

    const selectableMeeples = useMemo(() => new Set(
        isMyTurn && state.phase === 'moving' ? Object.keys(state.legal?.meeples ?? {}).map(Number) : []
    ), [isMyTurn, state.phase, state.legal]);
    const selectableBoats = useMemo(() => new Set(
        isMyTurn && state.phase === 'moving' ? Object.keys(state.legal?.boats ?? {}).map(Number) : []
    ), [isMyTurn, state.phase, state.legal]);
    const selectableCreatures = useMemo(() => new Set(
        isMyTurn && state.phase === 'creature' ? Object.keys(state.legal?.creatures ?? {}).map(Number) : []
    ), [isMyTurn, state.phase, state.legal]);

    const handleHexClick = (q: number, r: number) => {
        const target = targets.get(key(q, r));
        if (!target) return;
        if (state.phase === 'tile') { onRemoveTile(q, r); return; }
        if (!selected) return;
        if (selected.kind === 'meeple') onMove(selected.id, q, r);
        else if (selected.kind === 'boat') onMoveBoat(selected.id, q, r);
        else onMoveCreature(selected.id, q, r);
        setSelected(null);
    };

    // Pions « libres » (sur tuile, à la nage, sauvés) groupés par hex.
    const meeplesByHex = useMemo(() => {
        const map = new Map<string, { playerIdx: number; meepleId: number; value: number | null; state: string }[]>();
        state.players.forEach((p, playerIdx) => {
            for (const m of p.meeples) {
                if (m.state === 'boat' || m.state === 'dead') continue;
                const k = key(m.q, m.r);
                if (!map.has(k)) map.set(k, []);
                map.get(k)!.push({ playerIdx, meepleId: m.id, value: m.value, state: m.state });
            }
        });
        return map;
    }, [state.players]);

    const passengersByBoat = useMemo(() => {
        const map = new Map<number, { playerIdx: number; meepleId: number; value: number | null }[]>();
        state.players.forEach((p, playerIdx) => {
            for (const m of p.meeples) {
                if (m.state !== 'boat' || m.boatId === null) continue;
                if (!map.has(m.boatId)) map.set(m.boatId, []);
                map.get(m.boatId)!.push({ playerIdx, meepleId: m.id, value: m.value });
            }
        });
        return map;
    }, [state.players]);

    const cell = `var(--atl-cell)`;

    return (
        <div
            className="relative rounded-2xl p-3 bg-gradient-to-br from-sky-700 to-blue-900 dark:from-sky-900 dark:to-slate-950 shadow-2xl"
            style={{ ['--atl-cell' as string]: CELL_CSS }}
        >
            <div className="relative" style={{ width: `calc(${BOARD_W} * ${cell})`, height: `calc(${BOARD_H} * ${cell})` }}>
                {BOARD_HEXES.map(({ q, r }) => {
                    const { x, y } = hexOrigin(q, r);
                    const tile = tilesByHex.get(key(q, r));
                    const refuge = isRefuge(q, r);
                    const isTarget = targets.has(key(q, r));

                    let bg = 'bg-sky-300/30 dark:bg-sky-400/15'; // mer
                    if (refuge) bg = 'bg-emerald-300 dark:bg-emerald-600';
                    else if (tile && !tile.removed) bg = LEVEL_CLASSES[tile.level];
                    const isLand = refuge || (!!tile && !tile.removed);

                    return (
                        <button
                            key={key(q, r)}
                            type="button"
                            onClick={() => handleHexClick(q, r)}
                            disabled={!isTarget}
                            className={`absolute flex items-center justify-center transition-all ${bg}
                                ${isLand ? 'drop-shadow-[0_3px_2px_rgba(0,0,0,0.45)]' : ''}
                                ${isTarget ? 'cursor-pointer ring-0 brightness-110 animate-pulse z-10' : ''}`}
                            style={{
                                left: `calc(${x} * ${cell})`,
                                top: `calc(${y} * ${cell})`,
                                width: cell,
                                height: `calc(${HEX_H} * ${cell})`,
                                clipPath: HEX_CLIP,
                                ...(isTarget ? { outline: '3px solid rgba(255,255,255,0.9)', outlineOffset: '-3px' } : {}),
                            }}
                            title={refuge ? 'Refuge' : tile && !tile.removed ? tile.level : 'Mer'}
                        >
                            {/* Relief : biseau haut-clair / bas-sombre (clippé par la forme du bouton) */}
                            {isLand && (
                                <span className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/35 via-white/5 to-black/30" />
                            )}
                            {refuge ? (
                                <img src={REFUGE_SPRITE} alt="Refuge" className="w-2/3 h-2/3 pointer-events-none select-none" draggable={false} />
                            ) : tile && !tile.removed && LEVEL_SPRITE[tile.level] ? (
                                <img src={LEVEL_SPRITE[tile.level]} alt={tile.level} className="w-3/4 h-3/4 pointer-events-none select-none" draggable={false} />
                            ) : null}
                        </button>
                    );
                })}

                {/* Créatures */}
                {state.creatures.map(c => {
                    const { x, y } = hexOrigin(c.q, c.r);
                    const selectable = selectableCreatures.has(c.id);
                    const isSel = selected?.kind === 'creature' && selected.id === c.id;
                    return (
                        <button
                            key={`c-${c.id}`}
                            type="button"
                            disabled={!selectable}
                            onClick={() => selectable && setSelected(isSel ? null : { kind: 'creature', id: c.id })}
                            className={`absolute flex items-center justify-center select-none z-20 transition-transform
                                ${selectable ? 'cursor-pointer hover:scale-125 animate-pulse pointer-events-auto' : 'pointer-events-none'}
                                ${isSel ? 'scale-125 drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]' : ''}`}
                            style={{
                                left: `calc(${x} * ${cell})`,
                                top: `calc(${y} * ${cell})`,
                                width: cell,
                                height: `calc(${HEX_H} * ${cell})`,
                                fontSize: `calc(0.52 * ${cell})`,
                            }}
                            title={c.type}
                        >
                            <img
                                src={CREATURE_SPRITE[c.type]}
                                alt={c.type}
                                className="w-4/5 h-4/5 object-contain pointer-events-none select-none drop-shadow"
                                draggable={false}
                            />
                        </button>
                    );
                })}

                {/* Bateaux et leurs passagers */}
                {state.boats.map(b => {
                    const { x, y } = hexOrigin(b.q, b.r);
                    const selectable = selectableBoats.has(b.id);
                    const isSel = selected?.kind === 'boat' && selected.id === b.id;
                    const passengers = passengersByBoat.get(b.id) ?? [];
                    return (
                        <div
                            key={`b-${b.id}`}
                            className="absolute z-20 flex flex-col items-center justify-center pointer-events-none"
                            style={{
                                left: `calc(${x} * ${cell})`,
                                top: `calc(${y} * ${cell})`,
                                width: cell,
                                height: `calc(${HEX_H} * ${cell})`,
                            }}
                        >
                            <button
                                type="button"
                                disabled={!selectable}
                                onClick={() => selectable && setSelected(isSel ? null : { kind: 'boat', id: b.id })}
                                className={`select-none leading-none transition-transform
                                    ${selectable ? 'cursor-pointer hover:scale-125 animate-pulse pointer-events-auto' : ''}
                                    ${isSel ? 'scale-125 drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]' : ''}`}
                                style={{ width: `calc(0.7 * ${cell})`, height: `calc(0.7 * ${cell})` }}
                                title="Bateau"
                            >
                                <img src={BOAT_SPRITE} alt="Bateau" className="w-full h-full object-contain pointer-events-none select-none drop-shadow" draggable={false} />
                            </button>
                            {passengers.length > 0 && (
                                <div className="flex gap-px pointer-events-auto">
                                    {passengers.map(p => (
                                        <MeepleDot
                                            key={`${p.playerIdx}-${p.meepleId}`}
                                            playerIdx={p.playerIdx}
                                            value={p.value}
                                            sizeRatio={0.26}
                                            selectable={selectableMeeples.has(p.meepleId) && state.players[p.playerIdx]?.userId === myUserId}
                                            selected={selected?.kind === 'meeple' && selected.id === p.meepleId && state.players[p.playerIdx]?.userId === myUserId}
                                            onClick={() => setSelected(prev => prev?.kind === 'meeple' && prev.id === p.meepleId ? null : { kind: 'meeple', id: p.meepleId })}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Pions sur tuile / à la nage / sauvés */}
                {Array.from(meeplesByHex.entries()).map(([k, group]) => {
                    const [q, r] = k.split(',').map(Number);
                    const { x, y } = hexOrigin(q, r);
                    return (
                        <div
                            key={`m-${k}`}
                            className="absolute z-20 flex flex-wrap items-center justify-center gap-px pointer-events-none"
                            style={{
                                left: `calc(${x} * ${cell})`,
                                top: `calc(${y} * ${cell})`,
                                width: cell,
                                height: `calc(${HEX_H} * ${cell})`,
                            }}
                        >
                            {group.map(m => (
                                <MeepleDot
                                    key={`${m.playerIdx}-${m.meepleId}`}
                                    playerIdx={m.playerIdx}
                                    value={m.value}
                                    sizeRatio={group.length > 2 ? 0.3 : 0.42}
                                    swimming={m.state === 'sea'}
                                    safe={m.state === 'safe'}
                                    mine={state.players[m.playerIdx]?.userId === myUserId}
                                    selectable={selectableMeeples.has(m.meepleId) && state.players[m.playerIdx]?.userId === myUserId}
                                    selected={selected?.kind === 'meeple' && selected.id === m.meepleId && state.players[m.playerIdx]?.userId === myUserId}
                                    onClick={() => setSelected(prev => prev?.kind === 'meeple' && prev.id === m.meepleId ? null : { kind: 'meeple', id: m.meepleId })}
                                />
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function MeepleDot({ playerIdx, value, sizeRatio, swimming = false, safe = false, mine = false, selectable, selected, onClick }: {
    playerIdx: number;
    value: number | null;
    sizeRatio: number;
    swimming?: boolean;
    safe?: boolean;
    mine?: boolean;
    selectable: boolean;
    selected: boolean;
    onClick: () => void;
}) {
    const color = COLOR_CLASSES[playerIdx] ?? COLOR_CLASSES[0];
    const myShelter = safe && mine; // mes pions à l'abri : mis en évidence
    return (
        <button
            type="button"
            disabled={!selectable}
            onClick={onClick}
            className={`relative rounded-full ${color.bg} flex items-center justify-center text-white font-bold shadow-md transition-all
                ${swimming ? 'border-2 border-sky-200' : 'border-2 border-white'}
                ${myShelter ? 'ring-2 ring-emerald-300 ring-offset-1 ring-offset-emerald-900' : ''}
                ${selectable ? 'cursor-pointer hover:scale-125 animate-pulse pointer-events-auto' : ''}
                ${selected ? 'scale-125 ring-2 ring-white ring-offset-1' : ''}`}
            style={{
                width: `calc(var(--atl-cell) * ${sizeRatio})`,
                height: `calc(var(--atl-cell) * ${sizeRatio})`,
                fontSize: `calc(var(--atl-cell) * ${sizeRatio * 0.55})`,
            }}
            title={[myShelter ? 'À l’abri' : null, value !== null ? `Valeur ${value}` : null].filter(Boolean).join(' · ') || undefined}
        >
            {value !== null ? value : ''}
            {myShelter && (
                <span
                    className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-emerald-400 text-emerald-950 leading-none shadow"
                    style={{ width: '0.7em', height: '0.7em', fontSize: '0.6em' }}
                    aria-hidden
                >
                    ✓
                </span>
            )}
        </button>
    );
}
