'use client';

import { useCallback } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import type { GameLogEntry } from '@/components/GameLog';

/** Valeur de `from` pour une entrée depuis la barre. */
export const BAR = 24;
/** Valeur de `to` pour une sortie de pion (bear-off). */
export const OFF = -1;

export interface Move { from: number; to: number; die: number }

export interface PlayerInfo {
    userId: string;
    username: string;
    colorIndex: 0 | 1;
}

export interface GameState {
    /** 24 flèches ; >0 = pions du joueur 0, <0 = pions du joueur 1. */
    points: number[];
    bar: [number, number];
    off: [number, number];
    currentTurn: 0 | 1;
    status: 'waiting' | 'playing' | 'finished';
    winner: 0 | 1 | null;
    scores: [number, number];
    rolled: number[];
    dice: number[];
    legalMoves: Move[];
    noMoves: boolean;
    lastMove: { from: number; to: number } | null;
    turnStartedAt: number | null;
    turnDuration: number;
    reason?: 'surrender' | 'afk' | null;
    gammon?: 'gammon' | 'backgammon' | null;
    log?: GameLogEntry[];
}

export function isBot(player: Pick<PlayerInfo, 'userId'> | null | undefined): boolean {
    return !!player?.userId?.startsWith('bot-');
}

export function useBackgammon({
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
    const { socket, players, state: gameState, myPlayer, spectator, inactivityUserId, inactivityEndsAt } =
        useGameRoom<PlayerInfo, GameState>({
            socketKey: 'backgammon',
            prefix: 'backgammon',
            lobbyId,
            userId,
            joinPayload: { username },
            onNotFound,
            onState: (s) => { if (s.status === 'playing') onModalReset(); },
        });

    const myColorIndex = myPlayer?.colorIndex ?? null;
    const isMyTurn = gameState?.status === 'playing' && gameState.currentTurn === myColorIndex;
    const vsBot = players.some(p => isBot(p) && p.userId !== userId);

    const move = useCallback((m: Move) => {
        if (!isMyTurn) return;
        socket?.emit('backgammon:move', m);
    }, [isMyTurn, socket]);

    const surrender = useCallback(() => { socket?.emit('backgammon:surrender'); }, [socket]);

    return {
        players,
        gameState,
        myColorIndex,
        isMyTurn,
        spectator,
        vsBot,
        inactivityUserId,
        inactivityEndsAt,
        move,
        surrender,
    };
}
