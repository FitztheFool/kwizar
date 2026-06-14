'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAbaloneSocket } from '@/lib/socket';
import type { GameLogEntry } from '@/components/GameLog';

export interface PlayerInfo {
    userId: string;
    username: string;
    colorIndex: 0 | 1;
}

export interface AbaloneCell { q: number; r: number; owner: 0 | 1; }
export interface AbaloneLegalMove { marbles: string[]; dir: number; }

export interface AbaloneGameState {
    phase: 'waiting' | 'playing' | 'finished';
    board: AbaloneCell[];
    currentTurn: 0 | 1;
    ejected: [number, number];
    winner: 0 | 1 | null;
    lastMove: AbaloneLegalMove | null;
    scores: [number, number];
    reason?: 'surrender' | 'afk' | null;
    turnStartedAt: number | null;
    turnDuration: number;
    legal: AbaloneLegalMove[] | null;
    players: PlayerInfo[];
    log: GameLogEntry[];
}

export function isBot(player: Pick<PlayerInfo, 'userId'> | null | undefined): boolean {
    return !!player?.userId?.startsWith('bot-');
}

export function useAbalone({
    lobbyId, userId, username, onNotFound,
}: {
    lobbyId: string;
    userId: string;
    username: string;
    onNotFound: () => void;
}) {
    const socket = useMemo(() => getAbaloneSocket(), []);
    const joinedRef = useRef(false);

    const [players, setPlayers] = useState<PlayerInfo[]>([]);
    const [state, setState] = useState<AbaloneGameState | null>(null);
    const [inactivityUserId, setInactivityUserId] = useState<string | null>(null);
    const [inactivityEndsAt, setInactivityEndsAt] = useState<number | null>(null);

    const myPlayer = players.find(p => p.userId === userId);
    const myColorIndex = myPlayer?.colorIndex ?? null;
    const isMyTurn = state?.phase === 'playing' && state.currentTurn === myColorIndex;
    const vsBot = players.some(p => isBot(p) && p.userId !== userId);

    useEffect(() => {
        if (!socket || !lobbyId || !userId) return;

        const onPlayers = (data: PlayerInfo[]) => setPlayers(data);
        const onState = (s: AbaloneGameState) => {
            setState(s);
            if (s.players?.length) setPlayers(s.players);
        };
        const clearInactivity = () => { setInactivityUserId(null); setInactivityEndsAt(null); };

        socket.on('notFound', onNotFound);
        socket.on('abalone:players', onPlayers);
        socket.on('abalone:state', (s: AbaloneGameState) => { onState(s); clearInactivity(); });
        socket.on('abalone:finished', (s: AbaloneGameState) => onState(s));
        socket.on('abalone:inactivityWarning', ({ userId: uid, secondsLeft }: { userId: string; secondsLeft: number }) => {
            setInactivityUserId(uid);
            setInactivityEndsAt(Date.now() + secondsLeft * 1000);
        });
        socket.on('abalone:playerKicked', ({ userId: uid }: { userId: string }) => {
            setInactivityUserId(prev => prev === uid ? null : prev); setInactivityEndsAt(null);
        });
        socket.on('abalone:playerReconnected', ({ userId: uid }: { userId: string }) => {
            setInactivityUserId(prev => prev === uid ? null : prev); setInactivityEndsAt(null);
        });

        if (!joinedRef.current) {
            joinedRef.current = true;
            socket.emit('abalone:join', { lobbyId });
        }

        return () => {
            socket.off('notFound', onNotFound);
            socket.off('abalone:players', onPlayers);
            socket.off('abalone:state');
            socket.off('abalone:finished');
            socket.off('abalone:inactivityWarning');
            socket.off('abalone:playerKicked');
            socket.off('abalone:playerReconnected');
            joinedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, lobbyId, userId]);

    const move = useCallback((marbles: string[], dir: number) => {
        if (!isMyTurn) return;
        socket?.emit('abalone:move', { marbles, dir });
    }, [isMyTurn, socket]);

    const surrender = useCallback(() => { socket?.emit('abalone:surrender'); }, [socket]);
    const rematch = useCallback(() => { socket?.emit('abalone:rematch'); }, [socket]);

    return {
        players, state, myColorIndex, isMyTurn, vsBot,
        inactivityUserId, inactivityEndsAt,
        move, surrender, rematch,
    };
}
