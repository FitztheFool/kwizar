'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAtlantideSocket } from '@/lib/socket';
import type { GameLogEntry } from '@/components/GameLog';

export type AtlantideTileLevel = 'beach' | 'forest' | 'mountain';
export type AtlantideEffect = 'none' | 'shark' | 'whale' | 'serpent' | 'boat' | 'whirlpool' | 'volcano';
export type AtlantideCreatureType = 'shark' | 'whale' | 'serpent';
export type AtlantideMoveKind = 'tile' | 'sea' | 'boat' | 'refuge';
export type AtlantidePhase = 'waiting' | 'moving' | 'tile' | 'creature' | 'finished';

export interface AtlantideHex { q: number; r: number; }

export interface AtlantideLegalMove extends AtlantideHex { kind: AtlantideMoveKind; }

export interface AtlantideTile extends AtlantideHex {
    level: AtlantideTileLevel;
    removed: boolean;
    effect: AtlantideEffect | null; // révélé uniquement une fois la tuile retirée
}

export interface AtlantideBoat extends AtlantideHex { id: number; }

export interface AtlantideCreature extends AtlantideHex { id: number; type: AtlantideCreatureType; }

export interface AtlantideMeeple extends AtlantideHex {
    id: number;
    state: 'tile' | 'sea' | 'boat' | 'safe' | 'dead';
    boatId: number | null;
    movesUsed: number;
    value: number | null; // null = caché (pion adverse, partie en cours)
}

export interface AtlantidePlayer {
    userId: string;
    username: string;
    colorIndex: number;
    connected: boolean;
    saved: number;
    score: number | null;
    meeples: AtlantideMeeple[];
}

export interface AtlantideLegal {
    meeples?: Record<number, AtlantideLegalMove[]>;
    boats?: Record<number, AtlantideLegalMove[]>;
    tiles?: AtlantideHex[];
    creatures?: Record<number, AtlantideLegalMove[]>;
}

export interface AtlantideState {
    phase: AtlantidePhase;
    currentTurn: number;
    movePoints: number;
    creatureDie: AtlantideCreatureType | null;
    volcanoErupted: boolean;
    ranking: number[];
    surrenderedIdxs: number[];
    afkIdxs: number[];
    winner: number | null;
    turnStartedAt: number | null;
    turnDuration: number;
    log?: GameLogEntry[];
    tiles: AtlantideTile[];
    boats: AtlantideBoat[];
    creatures: AtlantideCreature[];
    players: AtlantidePlayer[];
    legal: AtlantideLegal | null;
}

export function isBot(p: { userId: string } | null | undefined): boolean {
    return !!p?.userId?.startsWith('bot-');
}

export function useAtlantide({
    lobbyId,
    userId,
    username,
    onNotFound,
    onModalReset,
}: {
    lobbyId: string;
    userId: string;
    username: string;
    onNotFound: () => void;
    onModalReset: () => void;
}) {
    const socket = useMemo(() => getAtlantideSocket(), []);
    const joinedRef = useRef(false);
    const [state, setState] = useState<AtlantideState | null>(null);
    const [inactivityUserId, setInactivityUserId] = useState<string | null>(null);
    const [inactivityEndsAt, setInactivityEndsAt] = useState<number | null>(null);
    const [lastDie, setLastDie] = useState<{ die: AtlantideCreatureType; at: number } | null>(null);

    useEffect(() => {
        if (!socket || !lobbyId || !userId) return;

        const onState = (s: AtlantideState) => {
            setState(s);
            if (s.phase !== 'finished') onModalReset();
        };
        const onDie = ({ die }: { die: AtlantideCreatureType }) => setLastDie({ die, at: Date.now() });

        socket.on('notFound', onNotFound);
        socket.on('atlantide:state', onState);
        socket.on('atlantide:dieRolled', onDie);
        socket.on('atlantide:inactivityWarning', ({ userId: uid, secondsLeft }: { userId: string; secondsLeft: number }) => {
            setInactivityUserId(uid);
            setInactivityEndsAt(Date.now() + secondsLeft * 1000);
        });
        socket.on('atlantide:playerKicked', ({ userId: uid }: { userId: string }) => {
            setInactivityUserId(prev => prev === uid ? null : prev);
            setInactivityEndsAt(null);
        });
        socket.on('atlantide:playerReconnected', ({ userId: uid }: { userId: string }) => {
            setInactivityUserId(prev => prev === uid ? null : prev);
            setInactivityEndsAt(null);
        });

        if (!joinedRef.current) {
            joinedRef.current = true;
            socket.emit('atlantide:join', { lobbyId, userId, username });
        }

        return () => {
            socket.off('notFound', onNotFound);
            socket.off('atlantide:state', onState);
            socket.off('atlantide:dieRolled', onDie);
            socket.off('atlantide:inactivityWarning');
            socket.off('atlantide:playerKicked');
            socket.off('atlantide:playerReconnected');
        };
    }, [socket, lobbyId, userId, username, onNotFound, onModalReset]);

    const move = useCallback((meepleId: number, q: number, r: number) => socket?.emit('atlantide:move', { meepleId, q, r }), [socket]);
    const moveBoat = useCallback((boatId: number, q: number, r: number) => socket?.emit('atlantide:moveBoat', { boatId, q, r }), [socket]);
    const endMove = useCallback(() => socket?.emit('atlantide:endMove'), [socket]);
    const removeTile = useCallback((q: number, r: number) => socket?.emit('atlantide:removeTile', { q, r }), [socket]);
    const moveCreature = useCallback((creatureId: number, q: number, r: number) => socket?.emit('atlantide:moveCreature', { creatureId, q, r }), [socket]);
    const skipCreature = useCallback(() => socket?.emit('atlantide:skipCreature'), [socket]);
    const surrender = useCallback(() => socket?.emit('atlantide:surrender'), [socket]);
    const rematch = useCallback(() => socket?.emit('atlantide:rematch'), [socket]);

    const myIdx = state?.players.findIndex(p => p.userId === userId) ?? -1;
    const me = myIdx >= 0 ? state?.players[myIdx] ?? null : null;
    const currentPlayer = state?.players[state.currentTurn ?? 0] ?? null;
    const isMyTurn = !!state && state.phase !== 'finished' && state.phase !== 'waiting' && currentPlayer?.userId === userId;

    return {
        state,
        me,
        myIdx,
        currentPlayer,
        isMyTurn,
        inactivityUserId,
        inactivityEndsAt,
        lastDie,
        move,
        moveBoat,
        endMove,
        removeTile,
        moveCreature,
        skipCreature,
        surrender,
        rematch,
    };
}
