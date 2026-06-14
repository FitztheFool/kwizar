'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSixQuiPrendSocket } from '@/lib/socket';
import type { GameLogEntry } from '@/components/GameLog';

export interface SixPlayer {
    userId: string;
    username: string;
    colorIndex: number;
}

export interface SixState {
    phase: 'selecting' | 'choosingRow' | 'finished';
    rows: number[][];
    penalty: number[];
    turn: number;
    deal: number;
    threshold: number;
    chooser: number | null;
    lastTakenRow: number | null;
    lastReveals: { colorIndex: number; card: number }[];
    selectedMask: boolean[];
    mySelected: number | null;
    myHand: number[];
    myColorIndex: number | null;
    turnStartedAt: number | null;
    turnDuration: number;
    players: SixPlayer[];
    log: GameLogEntry[];
}

export function isBot(p: Pick<SixPlayer, 'userId'> | null | undefined): boolean {
    return !!p?.userId?.startsWith('bot-');
}

export function useSixQuiPrend({
    lobbyId, userId, onNotFound,
}: {
    lobbyId: string;
    userId: string;
    onNotFound: () => void;
}) {
    const socket = useMemo(() => getSixQuiPrendSocket(), []);
    const joinedRef = useRef(false);

    const [state, setState] = useState<SixState | null>(null);
    const [inactivityUserId, setInactivityUserId] = useState<string | null>(null);
    const [inactivityEndsAt, setInactivityEndsAt] = useState<number | null>(null);

    const players = state?.players ?? [];
    const myColorIndex = state?.myColorIndex ?? null;
    const isMyTurnToChooseRow = state?.phase === 'choosingRow' && state.chooser === myColorIndex;
    const vsBot = players.some(p => isBot(p) && p.userId !== userId);

    useEffect(() => {
        if (!socket || !lobbyId || !userId) return;

        const onState = (s: SixState) => setState(s);
        const clearInactivity = () => { setInactivityUserId(null); setInactivityEndsAt(null); };

        socket.on('notFound', onNotFound);
        socket.on('six:state', (s: SixState) => { onState(s); clearInactivity(); });
        socket.on('six:finished', onState);
        socket.on('six:inactivityWarning', ({ userId: uid, secondsLeft }: { userId: string; secondsLeft: number }) => {
            setInactivityUserId(uid);
            setInactivityEndsAt(Date.now() + secondsLeft * 1000);
        });
        socket.on('six:playerKicked', ({ userId: uid }: { userId: string }) => {
            setInactivityUserId(prev => prev === uid ? null : prev); setInactivityEndsAt(null);
        });
        socket.on('six:playerReconnected', ({ userId: uid }: { userId: string }) => {
            setInactivityUserId(prev => prev === uid ? null : prev); setInactivityEndsAt(null);
        });

        if (!joinedRef.current) {
            joinedRef.current = true;
            socket.emit('six:join', { lobbyId });
        }

        return () => {
            socket.off('notFound', onNotFound);
            socket.off('six:state');
            socket.off('six:finished');
            socket.off('six:inactivityWarning');
            socket.off('six:playerKicked');
            socket.off('six:playerReconnected');
            joinedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, lobbyId, userId]);

    const chooseCard = useCallback((card: number) => {
        if (state?.phase !== 'selecting' || state.mySelected !== null) return;
        socket?.emit('six:choose', { card });
    }, [socket, state]);

    const chooseRow = useCallback((row: number) => {
        socket?.emit('six:chooseRow', { row });
    }, [socket]);

    const surrender = useCallback(() => { socket?.emit('six:surrender'); }, [socket]);

    return {
        players, state, myColorIndex, isMyTurnToChooseRow, vsBot,
        inactivityUserId, inactivityEndsAt,
        chooseCard, chooseRow, surrender,
    };
}
