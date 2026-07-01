'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getDamesSocket } from '@/lib/socket';
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
    const socket = useMemo(() => getDamesSocket(), []);
    const joinedRef = useRef(false);

    const [players, setPlayers] = useState<PlayerInfo[]>([]);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [inactivityUserId, setInactivityUserId] = useState<string | null>(null);
    const [inactivityEndsAt, setInactivityEndsAt] = useState<number | null>(null);

    const myPlayer = players.find(p => p.userId === userId);
    const myColorIndex = myPlayer?.colorIndex ?? null;
    const isMyTurn = gameState?.status === 'playing' && gameState.currentTurn === myColorIndex;
    const vsBot = players.some(p => isBot(p) && p.userId !== userId);
    // Spectateur : la partie a démarré (joueurs connus) mais je n'occupe aucun siège.
    const spectator = !!gameState && players.length > 0 && !myPlayer;

    useEffect(() => {
        if (!socket || !lobbyId || !userId) return;

        const onPlayers = (data: PlayerInfo[]) => setPlayers(data);
        const clearInactivity = () => { setInactivityUserId(null); setInactivityEndsAt(null); };
        const onState = (state: GameState) => {
            setGameState(state);
            if (state.status === 'playing') onModalReset();
            clearInactivity();
        };

        socket.on('notFound', onNotFound);
        socket.on('dames:players', onPlayers);
        socket.on('dames:state', onState);
        socket.on('dames:inactivityWarning', ({ userId: uid, secondsLeft }: { userId: string; secondsLeft: number }) => {
            setInactivityUserId(uid);
            setInactivityEndsAt(Date.now() + secondsLeft * 1000);
        });
        socket.on('dames:playerKicked', ({ userId: uid }: { userId: string }) => {
            setInactivityUserId(prev => prev === uid ? null : prev);
            setInactivityEndsAt(null);
        });
        socket.on('dames:playerReconnected', ({ userId: uid }: { userId: string }) => {
            setInactivityUserId(prev => prev === uid ? null : prev);
            setInactivityEndsAt(null);
        });

        if (!joinedRef.current) {
            joinedRef.current = true;
            socket.emit('dames:join', { lobbyId, userId, username });
        }

        return () => {
            socket.off('notFound', onNotFound);
            socket.off('dames:players', onPlayers);
            socket.off('dames:state');
            socket.off('dames:inactivityWarning');
            socket.off('dames:playerKicked');
            socket.off('dames:playerReconnected');
            joinedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, lobbyId, userId]);

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
