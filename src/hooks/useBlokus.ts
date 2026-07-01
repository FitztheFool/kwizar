'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getBlokusSocket } from '@/lib/socket';
import type { GameLogEntry } from '@/components/GameLog';

export interface BlokusPlayer {
    userId: string;
    username: string;
    colorIndex: number;          // 1ʳᵉ couleur (compat)
    colorIndices?: number[];     // couleurs contrôlées (duo : 2)
}

export interface BlokusState {
    phase: 'waiting' | 'playing' | 'finished';
    board: number[][];
    currentTurn: number;
    remaining: string[][];
    placedAny: boolean[];
    passed: boolean[];
    scores: number[];
    status: 'playing' | 'finished';
    turnStartedAt: number | null;
    turnDuration: number;
    players: BlokusPlayer[];
    log: GameLogEntry[];
}

export interface BlokusMove { pieceId: string; ori: number; x: number; y: number; }

export function isBot(p: Pick<BlokusPlayer, 'userId'> | null | undefined): boolean {
    return !!p?.userId?.startsWith('bot-');
}

export function useBlokus({
    lobbyId, userId, onNotFound,
}: {
    lobbyId: string;
    userId: string;
    onNotFound: () => void;
}) {
    const socket = useMemo(() => getBlokusSocket(), []);
    const joinedRef = useRef(false);

    const [state, setState] = useState<BlokusState | null>(null);
    const [inactivityUserId, setInactivityUserId] = useState<string | null>(null);
    const [inactivityEndsAt, setInactivityEndsAt] = useState<number | null>(null);

    const players = state?.players ?? [];
    const myPlayer = players.find(p => p.userId === userId);
    const myColorIndices = myPlayer ? (myPlayer.colorIndices ?? [myPlayer.colorIndex]) : [];
    const isMyTurn = state?.phase === 'playing' && myColorIndices.includes(state.currentTurn);
    // Couleur active à jouer : celle du tour quand c'est à moi (duo), sinon ma 1ʳᵉ couleur.
    const myColorIndex = isMyTurn && state ? state.currentTurn : (myColorIndices[0] ?? null);
    const vsBot = players.some(p => isBot(p) && p.userId !== userId);
    const spectator = !!state && players.length > 0 && !myPlayer;

    useEffect(() => {
        if (!socket || !lobbyId || !userId) return;

        const onState = (s: BlokusState) => setState(s);
        const clearInactivity = () => { setInactivityUserId(null); setInactivityEndsAt(null); };

        socket.on('notFound', onNotFound);
        socket.on('blokus:state', (s: BlokusState) => { onState(s); clearInactivity(); });
        socket.on('blokus:finished', onState);
        socket.on('blokus:inactivityWarning', ({ userId: uid, secondsLeft }: { userId: string; secondsLeft: number }) => {
            setInactivityUserId(uid);
            setInactivityEndsAt(Date.now() + secondsLeft * 1000);
        });
        socket.on('blokus:playerKicked', ({ userId: uid }: { userId: string }) => {
            setInactivityUserId(prev => prev === uid ? null : prev); setInactivityEndsAt(null);
        });
        socket.on('blokus:playerReconnected', ({ userId: uid }: { userId: string }) => {
            setInactivityUserId(prev => prev === uid ? null : prev); setInactivityEndsAt(null);
        });

        if (!joinedRef.current) {
            joinedRef.current = true;
            socket.emit('blokus:join', { lobbyId });
        }

        return () => {
            socket.off('notFound', onNotFound);
            socket.off('blokus:state');
            socket.off('blokus:finished');
            socket.off('blokus:inactivityWarning');
            socket.off('blokus:playerKicked');
            socket.off('blokus:playerReconnected');
            joinedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, lobbyId, userId]);

    const move = useCallback((m: BlokusMove) => {
        if (!isMyTurn) return;
        socket?.emit('blokus:move', m);
    }, [isMyTurn, socket]);

    const pass = useCallback(() => { socket?.emit('blokus:pass'); }, [socket]);
    const surrender = useCallback(() => { socket?.emit('blokus:surrender'); }, [socket]);

    return {
        players, state, myColorIndex, myColorIndices, isMyTurn, spectator, vsBot,
        inactivityUserId, inactivityEndsAt,
        move, pass, surrender,
    };
}
