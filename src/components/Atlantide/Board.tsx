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
    BOAT_LOADED_SPRITE,
    COLOR_CLASSES,
    CREATURE_SPRITE,
    CREATURE_LABELS,
    LEVEL_LABELS,
    HEX_CLIP,
    HEX_H,
    LEVEL_SPRITE,
    MEEPLE_SPRITE,
    REFUGE_SPRITE,
    SEA_SPRITE,
    SWIMMER_SPRITE,
    SYMBOL_SPRITE,
    TILE_HIDDEN_SPRITE,
    TOKEN_SAFE_SPRITE,
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
    onPlace: (q: number, r: number) => void;
    onMove: (meepleId: number, q: number, r: number) => void;
    onMoveBoat: (boatId: number, q: number, r: number) => void;
    onRemoveTile: (q: number, r: number) => void;
    onMoveCreature: (creatureId: number, q: number, r: number) => void;
}

/** Normalise les coups légaux d'une créature (liste de cases, ou téléport avec cibles). */
function creatureLegalCells(legal: AtlantideLegalMove[] | { teleport: true; targets: AtlantideHex[] } | undefined): AtlantideHex[] {
    if (!legal) return [];
    return Array.isArray(legal) ? legal : legal.targets;
}

// La cellule est une variable CSS : le plateau grandit pour remplir l'espace
// disponible tout en restant borné par la largeur ET la hauteur du viewport.
// - largeur : ~11 cellules de plateau + la colonne latérale et le journal (~28rem) ;
// - hauteur : ~9.8 cellules + l'en-tête, la barre de temps et le padding (~10rem).
const CELL_BY_WIDTH = 'calc((100vw - 28rem) / 11.5)';
const CELL_BY_HEIGHT = 'calc((100vh - 10rem) / 10.5)';
// On prend la plus petite des deux contraintes (pour tenir dans les deux sens),
// plafonnée à 80px et avec un plancher de 30px sur très petit écran.
const CELL_CSS = `max(30px, min(80px, ${CELL_BY_WIDTH}, ${CELL_BY_HEIGHT}))`;

const key = (q: number, r: number) => `${q},${r}`;

export default function AtlantideBoard({ state, myUserId, isMyTurn, onPlace, onMove, onMoveBoat, onRemoveTile, onMoveCreature }: BoardProps) {
    const [selected, setSelected] = useState<Selected>(null);

    // Toute évolution du tour invalide la sélection en cours.
    useEffect(() => {
        setSelected(null);
    }, [state.phase, state.currentTurn, state.movePoints, state.spin]);

    const tilesByHex = useMemo(() => {
        const map = new Map<string, { level: string; removed: boolean; effect: string | null }>();
        for (const t of state.tiles) map.set(key(t.q, t.r), { level: t.level, removed: t.removed, effect: t.effect });
        return map;
    }, [state.tiles]);

    // Destinations actuellement cliquables (selon la phase et la sélection).
    const targets = useMemo(() => {
        const map = new Map<string, AtlantideLegalMove | AtlantideHex>();
        if (!isMyTurn || !state.legal) return map;
        if (state.phase === 'placement') {
            for (const h of state.legal.placements ?? []) map.set(key(h.q, h.r), h);
        } else if (state.phase === 'tile') {
            for (const t of state.legal.tiles ?? []) map.set(key(t.q, t.r), t);
        } else if (state.phase === 'moving' && selected?.kind === 'meeple') {
            for (const m of state.legal.meeples?.[selected.id] ?? []) map.set(key(m.q, m.r), m);
        } else if (state.phase === 'moving' && selected?.kind === 'boat') {
            for (const m of state.legal.boats?.[selected.id] ?? []) map.set(key(m.q, m.r), m);
        } else if (state.phase === 'spin' && selected?.kind === 'creature') {
            for (const m of creatureLegalCells(state.legal.creatures?.[selected.id])) map.set(key(m.q, m.r), m);
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
        isMyTurn && state.phase === 'spin' ? Object.keys(state.legal?.creatures ?? {}).map(Number) : []
    ), [isMyTurn, state.phase, state.legal]);

    const handleHexClick = (q: number, r: number) => {
        const target = targets.get(key(q, r));
        if (!target) return;
        if (state.phase === 'placement') { onPlace(q, r); return; }
        if (state.phase === 'tile') { onRemoveTile(q, r); return; }
        if (!selected) return;
        if (selected.kind === 'meeple') onMove(selected.id, q, r);
        else if (selected.kind === 'boat') onMoveBoat(selected.id, q, r);
        else onMoveCreature(selected.id, q, r);
        setSelected(null);
    };

    // Pions « libres » (sur tuile, à la nage, sauvés) groupés par hex.
    const meeplesByHex = useMemo(() => {
        const map = new Map<string, { playerIdx: number; meepleId: number; state: string }[]>();
        state.players.forEach((p, playerIdx) => {
            for (const m of p.meeples) {
                if (m.state === 'boat' || m.state === 'dead') continue;
                const k = key(m.q, m.r);
                if (!map.has(k)) map.set(k, []);
                map.get(k)!.push({ playerIdx, meepleId: m.id, state: m.state });
            }
        });
        return map;
    }, [state.players]);

    const passengersByBoat = useMemo(() => {
        const map = new Map<number, { playerIdx: number; meepleId: number }[]>();
        state.players.forEach((p, playerIdx) => {
            for (const m of p.meeples) {
                if (m.state !== 'boat' || m.boatId === null) continue;
                if (!map.has(m.boatId)) map.set(m.boatId, []);
                map.get(m.boatId)!.push({ playerIdx, meepleId: m.id });
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

                    const isLand = refuge || (!!tile && !tile.removed);
                    // Image de fond de la case : tuile selon niveau, refuge, ou mer.
                    const hexSprite = refuge
                        ? REFUGE_SPRITE
                        : (tile && !tile.removed ? LEVEL_SPRITE[tile.level] : SEA_SPRITE);

                    return (
                        <button
                            key={key(q, r)}
                            type="button"
                            onClick={() => handleHexClick(q, r)}
                            disabled={!isTarget}
                            className={`absolute flex items-center justify-center transition-all
                                ${isLand ? 'drop-shadow-[0_3px_2px_rgba(0,0,0,0.45)] z-[1]' : ''}
                                ${isTarget ? 'cursor-pointer brightness-110 animate-pulse z-10' : ''}`}
                            style={{
                                left: `calc(${x} * ${cell})`,
                                top: `calc(${y} * ${cell})`,
                                width: cell,
                                height: `calc(${HEX_H} * ${cell})`,
                                ...(isTarget ? { outline: '3px solid rgba(255,255,255,0.9)', outlineOffset: '-3px', clipPath: HEX_CLIP } : {}),
                            }}
                            title={refuge ? 'Refuge' : tile && !tile.removed ? LEVEL_LABELS[tile.level] : 'Mer'}
                        >
                            {/* Le sprite est déjà hexagonal : on le rend en plein, légèrement débordant pour combler les jointures. */}
                            <img
                                src={hexSprite}
                                alt={refuge ? 'Refuge' : tile && !tile.removed ? tile.level : 'Mer'}
                                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                                style={{ transform: 'scale(1.03)' }}
                                draggable={false}
                            />
                            {/* Tuile encore en place cachant un symbole : pastille face cachée. */}
                            {tile && !tile.removed && tile.effect && tile.effect !== 'none' && (
                                <img
                                    src={TILE_HIDDEN_SPRITE}
                                    alt="Symbole caché"
                                    className="absolute bottom-0 right-0 w-1/4 h-1/4 object-contain pointer-events-none select-none opacity-70 drop-shadow"
                                    draggable={false}
                                />
                            )}
                            {/* Symbole révélé sous une tuile engloutie (mémo du joueur). */}
                            {tile?.removed && tile.effect && tile.effect !== 'none' && SYMBOL_SPRITE[tile.effect] && (
                                <img
                                    src={SYMBOL_SPRITE[tile.effect]}
                                    alt={tile.effect}
                                    className="absolute bottom-0 right-0 w-1/3 h-1/3 object-contain pointer-events-none select-none opacity-80 drop-shadow"
                                    draggable={false}
                                />
                            )}
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
                            title={CREATURE_LABELS[c.type]}
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
                                <img src={passengers.length > 0 ? BOAT_LOADED_SPRITE : BOAT_SPRITE} alt="Bateau" className="w-full h-full object-contain pointer-events-none select-none drop-shadow" draggable={false} />
                            </button>
                            {passengers.length > 0 && (
                                <div className="flex gap-px pointer-events-auto">
                                    {passengers.map(p => (
                                        <MeepleDot
                                            key={`${p.playerIdx}-${p.meepleId}`}
                                            playerIdx={p.playerIdx}
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

function MeepleDot({ playerIdx, sizeRatio, swimming = false, safe = false, mine = false, selectable, selected, onClick }: {
    playerIdx: number;
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
    // Sprite du pion : nageur dans la mer, sinon meeple coloré du joueur.
    const sprite = swimming ? SWIMMER_SPRITE : (MEEPLE_SPRITE[playerIdx] ?? MEEPLE_SPRITE[0]);
    return (
        <button
            type="button"
            disabled={!selectable}
            onClick={onClick}
            className={`relative flex items-center justify-center transition-all
                ${myShelter ? 'drop-shadow-[0_0_4px_rgba(110,231,183,0.9)]' : 'drop-shadow-[0_2px_1px_rgba(0,0,0,0.5)]'}
                ${selectable ? 'cursor-pointer hover:scale-125 animate-pulse pointer-events-auto' : ''}
                ${selected ? 'scale-125 drop-shadow-[0_0_5px_rgba(255,255,255,0.95)]' : ''}`}
            style={{
                width: `calc(var(--atl-cell) * ${sizeRatio})`,
                height: `calc(var(--atl-cell) * ${sizeRatio})`,
            }}
            title={myShelter ? 'À l’abri' : undefined}
        >
            <img
                src={sprite}
                alt={swimming ? 'Nageur' : color.name}
                className="w-full h-full object-contain pointer-events-none select-none"
                draggable={false}
            />
            {/* Nageur : teinte la couleur du joueur via un point en bas. */}
            {swimming && (
                <span
                    className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-full ${color.bg} border border-white shadow`}
                    style={{ width: '0.4em', height: '0.4em' }}
                    aria-hidden
                />
            )}
            {/* Pion à l'abri : jeton "safe" en pastille. */}
            {safe && (
                <img
                    src={TOKEN_SAFE_SPRITE}
                    alt="À l'abri"
                    className="absolute -top-1 -right-1 w-1/2 h-1/2 object-contain pointer-events-none select-none drop-shadow"
                    draggable={false}
                />
            )}
        </button>
    );
}
