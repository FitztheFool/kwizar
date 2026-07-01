'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getTanksSocket } from '@/lib/socket';
import type { GameLogEntry } from '@/components/GameLog';

export interface TanksPlayer { userId: string; username: string; colorIndex: 0 | 1; }
export interface Tank { x: number; y: number; hp: number; }
export interface Weapon { id: string; name: string; radius: number; damage: number; }
export interface Point { x: number; y: number; }

export interface TanksGameState {
    phase: 'waiting' | 'playing' | 'finished';
    terrain: number[];
    tanks: [Tank, Tank];
    currentTurn: 0 | 1;
    wind: number;
    moveBudget: number;
    status: 'playing' | 'finished';
    winner: 0 | 1 | null;
    weapons: Weapon[];
    scores: [number, number];
    reason?: 'afk' | 'surrender' | null;
    turnStartedAt: number | null;
    turnDuration: number;
    log: GameLogEntry[];
    players: TanksPlayer[];
}

export interface ShotEvent {
    side: 0 | 1;
    trajectory: Point[];
    impact: Point | null;
    weaponId: string;
    hpAfter: [number, number];
    finished: boolean;
    winner: 0 | 1 | null;
}

export function isBot(p: Pick<TanksPlayer, 'userId'> | null | undefined): boolean {
    return !!p?.userId?.startsWith('bot-');
}

export function useTanks({ lobbyId, userId, username, onNotFound }: {
    lobbyId: string; userId: string; username: string; onNotFound: () => void;
}) {
    const socket = useMemo(() => getTanksSocket(), []);
    const joinedRef = useRef(false);

    const [state, setState] = useState<TanksGameState | null>(null);
    const [shot, setShot] = useState<ShotEvent | null>(null);
    const [inactivityUserId, setInactivityUserId] = useState<string | null>(null);
    const [inactivityEndsAt, setInactivityEndsAt] = useState<number | null>(null);

    const players = state?.players ?? [];
    const myPlayer = players.find(p => p.userId === userId);
    const myColorIndex = myPlayer?.colorIndex ?? null;
    const isMyTurn = state?.phase === 'playing' && state.currentTurn === myColorIndex;
    const vsBot = players.some(p => isBot(p) && p.userId !== userId);
    const spectator = !!state && players.length > 0 && !myPlayer;

    useEffect(() => {
        if (!socket || !lobbyId || !userId) return;
        const onState = (s: TanksGameState) => setState(s);
        const clearInactivity = () => { setInactivityUserId(null); setInactivityEndsAt(null); };

        socket.on('notFound', onNotFound);
        socket.on('tanks:state', (s: TanksGameState) => { onState(s); clearInactivity(); });
        socket.on('tanks:finished', onState);
        socket.on('tanks:shot', (e: ShotEvent) => setShot(e));
        socket.on('tanks:inactivityWarning', ({ userId: uid, secondsLeft }: { userId: string; secondsLeft: number }) => {
            setInactivityUserId(uid); setInactivityEndsAt(Date.now() + secondsLeft * 1000);
        });
        socket.on('tanks:playerKicked', ({ userId: uid }: { userId: string }) => { setInactivityUserId(p => p === uid ? null : p); setInactivityEndsAt(null); });
        socket.on('tanks:playerReconnected', ({ userId: uid }: { userId: string }) => { setInactivityUserId(p => p === uid ? null : p); setInactivityEndsAt(null); });

        if (!joinedRef.current) { joinedRef.current = true; socket.emit('tanks:join', { lobbyId }); }
        return () => {
            socket.off('notFound', onNotFound);
            socket.off('tanks:state'); socket.off('tanks:finished'); socket.off('tanks:shot');
            socket.off('tanks:inactivityWarning'); socket.off('tanks:playerKicked'); socket.off('tanks:playerReconnected');
            joinedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, lobbyId, userId]);

    const fire = useCallback((angle: number, power: number, weaponId: string) => {
        if (!isMyTurn) return;
        socket?.emit('tanks:fire', { angle, power, weaponId });
    }, [isMyTurn, socket]);

    const move = useCallback((dir: -1 | 1) => {
        if (!isMyTurn) return;
        socket?.emit('tanks:move', { dir });
    }, [isMyTurn, socket]);

    const surrender = useCallback(() => { socket?.emit('tanks:surrender'); }, [socket]);
    const clearShot = useCallback(() => setShot(null), []);

    return {
        players, state, shot, clearShot, myColorIndex, isMyTurn, spectator, vsBot,
        inactivityUserId, inactivityEndsAt, fire, move, surrender,
    };
}
