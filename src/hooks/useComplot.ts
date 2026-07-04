'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getComplotSocket } from '@/lib/socket';
import type { GameLogEntry } from '@/components/GameLog';

export type Character = 'duc' | 'assassin' | 'comtesse' | 'capitaine' | 'ambassadeur';
export type ActionType = 'revenu' | 'aide' | 'coup' | 'taxe' | 'assassinat' | 'vol' | 'echange';
export type Phase = 'action' | 'block' | 'challengeBlock' | 'lose' | 'exchange' | 'finished';

export interface ComplotCard { char: Character | null; revealed: boolean; }
export interface ComplotPlayer {
    userId: string; username: string; colorIndex: number;
    coins: number; alive: boolean; influence: number; cards: ComplotCard[];
    afk?: boolean; surrendered?: boolean;
}
export interface Pending {
    type: ActionType; actor: number; target: number | null;
    claim: Character | null; blocker: number | null; blockClaim: Character | null;
    responded: boolean[];
}
export interface ComplotState {
    phase: Phase;
    currentTurn: number;
    chooser: number | null;
    winner: number | null;
    deckCount: number;
    turnStartedAt: number | null;
    turnDuration: number;
    log: GameLogEntry[];
    players: ComplotPlayer[];
    pending: Pending | null;
    exchangeDraw: Character[];
    spectator?: boolean;
}

export function useComplot({ lobbyId, userId, onNotFound }: { lobbyId: string; userId: string; onNotFound: () => void; }) {
    const socket = useMemo(() => getComplotSocket(), []);
    const joinedRef = useRef(false);
    const [state, setState] = useState<ComplotState | null>(null);
    const [inactivityUserId, setInactivityUserId] = useState<string | null>(null);
    const [inactivityEndsAt, setInactivityEndsAt] = useState<number | null>(null);

    const players = state?.players ?? [];
    const myIndex = players.find(p => p.userId === userId)?.colorIndex ?? null;
    const isMyTurn = state?.phase === 'action' && state.currentTurn === myIndex;

    useEffect(() => {
        if (!socket || !lobbyId || !userId) return;
        const onState = (s: ComplotState) => setState(s);
        const clear = () => { setInactivityUserId(null); setInactivityEndsAt(null); };
        socket.on('notFound', onNotFound);
        socket.on('complot:state', (s: ComplotState) => { onState(s); clear(); });
        socket.on('complot:finished', onState);
        socket.on('complot:inactivityWarning', ({ userId: uid, secondsLeft }: { userId: string; secondsLeft: number }) => { setInactivityUserId(uid); setInactivityEndsAt(Date.now() + secondsLeft * 1000); });
        socket.on('complot:playerKicked', ({ userId: uid }: { userId: string }) => { setInactivityUserId(p => p === uid ? null : p); setInactivityEndsAt(null); });
        socket.on('complot:playerReconnected', ({ userId: uid }: { userId: string }) => { setInactivityUserId(p => p === uid ? null : p); setInactivityEndsAt(null); });
        if (!joinedRef.current) { joinedRef.current = true; socket.emit('complot:join', { lobbyId }); }
        return () => {
            socket.off('notFound', onNotFound);
            socket.off('complot:state'); socket.off('complot:finished');
            socket.off('complot:inactivityWarning'); socket.off('complot:playerKicked'); socket.off('complot:playerReconnected');
            joinedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, lobbyId, userId]);

    const action = useCallback((type: ActionType, target: number | null = null) => socket?.emit('complot:action', { type, target }), [socket]);
    const passReact = useCallback(() => socket?.emit('complot:pass'), [socket]);
    const challenge = useCallback(() => socket?.emit('complot:challenge'), [socket]);
    const block = useCallback((char: Character) => socket?.emit('complot:block', { char }), [socket]);
    const challengeBlock = useCallback(() => socket?.emit('complot:challengeBlock'), [socket]);
    const lose = useCallback((cardIndex: number) => socket?.emit('complot:lose', { cardIndex }), [socket]);
    const exchange = useCallback((keep: number[]) => socket?.emit('complot:exchange', { keep }), [socket]);
    const surrender = useCallback(() => socket?.emit('complot:surrender'), [socket]);

    return {
        state, players, myIndex, isMyTurn, inactivityUserId, inactivityEndsAt,
        action, passReact, challenge, block, challengeBlock, lose, exchange, surrender,
    };
}
