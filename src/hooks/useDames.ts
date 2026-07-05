'use client';

import { useCallback } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import type { GameLogEntry } from '@/components/GameLog';

export type Coord = [number, number];
export interface Piece { p: 0 | 1; k: boolean }
export type Cell = Piece | null;
export type Board = Cell[][];

export interface Move { from: Coord; to: Coord; captured: Coord | null }

export interface PlayerInfo {
    userId: string;
    username: string;
    colorIndex: 0 | 1;
}

export interface GameState {
    board: Board;
    currentTurn: 0 | 1;
    status: 'waiting' | 'playing' | 'finished';
    winner: 0 | 1 | 'draw' | null;
    scores: [number, number];
    legalMoves: Move[];
    mustContinueFrom: Coord | null;
    lastMove: { from: Coord; to: Coord } | null;
    turnStartedAt: number | null;
    turnDuration: number;
    reason?: 'surrender' | 'afk' | null;
    log?: GameLogEntry[];
}

export function isBot(player: Pick<PlayerInfo, 'userId'> | null | undefined): boolean {
    return !!player?.userId?.startsWith('bot-');
}

export function useDames({
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
            socketKey: 'dames',
            prefix: 'dames',
            lobbyId,
            userId,
            joinPayload: { username },
            onNotFound,
            onState: (s) => { if (s.status === 'playing') onModalReset(); },
        });

    const myColorIndex = myPlayer?.colorIndex ?? null;
    const isMyTurn = gameState?.status === 'playing' && gameState.currentTurn === myColorIndex;
    const vsBot = players.some(p => isBot(p) && p.userId !== userId);

    const move = useCallback((from: Coord, to: Coord) => {
        if (!isMyTurn) return;
        socket?.emit('dames:move', { from, to });
    }, [isMyTurn, socket]);

    const surrender = useCallback(() => { socket?.emit('dames:surrender'); }, [socket]);

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
