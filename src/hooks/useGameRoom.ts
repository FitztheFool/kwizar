'use client';

// Socle commun des hooks de jeu « room » (plateau) : join + roster + état +
// avertissements d'inactivité + reconnexion. Chaque jeu garde son hook dédié
// (useDames, useTanks…) qui ajoute ses actions et sélecteurs par-dessus.
//
// Convention d'événements (préfixe = gameType côté serveur, ex. 'dames') :
//   {prefix}:players, {prefix}:state, {prefix}:inactivityWarning,
//   {prefix}:playerKicked, {prefix}:playerReconnected, notFound.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { getGameSocket, type GameSocketKey } from '@/lib/socket';

export interface GameRoomOptions<S> {
    /** Clé du serveur socket (voir GAME_SERVERS dans lib/socket). */
    socketKey: GameSocketKey;
    /** Préfixe des événements (ex. 'dames' → 'dames:state'). */
    prefix: string;
    lobbyId: string;
    userId: string;
    /** Payload additionnel du join (ex. { username }). */
    joinPayload?: Record<string, unknown>;
    onNotFound?: () => void;
    /** Appelé à chaque état reçu (side-effects page : reset modal, etc.). */
    onState?: (state: S) => void;
}

export function useGameRoom<P extends { userId: string }, S>({
    socketKey,
    prefix,
    lobbyId,
    userId,
    joinPayload,
    onNotFound,
    onState,
}: GameRoomOptions<S>) {
    const socket = useMemo(() => getGameSocket(socketKey), [socketKey]);
    const joinedRef = useRef(false);

    const [players, setPlayers] = useState<P[]>([]);
    const [state, setState] = useState<S | null>(null);
    const [inactivityUserId, setInactivityUserId] = useState<string | null>(null);
    const [inactivityEndsAt, setInactivityEndsAt] = useState<number | null>(null);

    // Refs pour éviter de re-binder les listeners quand les callbacks changent.
    const onNotFoundRef = useRef(onNotFound);
    onNotFoundRef.current = onNotFound;
    const onStateRef = useRef(onState);
    onStateRef.current = onState;
    const joinPayloadRef = useRef(joinPayload);
    joinPayloadRef.current = joinPayload;

    useEffect(() => {
        if (!socket || !lobbyId || !userId) return;

        const clearInactivity = () => { setInactivityUserId(null); setInactivityEndsAt(null); };
        const handleNotFound = () => onNotFoundRef.current?.();
        const handlePlayers = (data: P[]) => setPlayers(data);
        const handleState = (s: S) => {
            setState(s);
            clearInactivity();
            onStateRef.current?.(s);
        };
        const handleWarning = ({ userId: uid, secondsLeft }: { userId: string; secondsLeft: number }) => {
            setInactivityUserId(uid);
            setInactivityEndsAt(Date.now() + secondsLeft * 1000);
        };
        const clearFor = ({ userId: uid }: { userId: string }) => {
            setInactivityUserId(prev => (prev === uid ? null : prev));
            setInactivityEndsAt(null);
        };

        socket.on('notFound', handleNotFound);
        socket.on(`${prefix}:players`, handlePlayers);
        socket.on(`${prefix}:state`, handleState);
        socket.on(`${prefix}:inactivityWarning`, handleWarning);
        socket.on(`${prefix}:playerKicked`, clearFor);
        socket.on(`${prefix}:playerReconnected`, clearFor);

        if (!joinedRef.current) {
            joinedRef.current = true;
            socket.emit(`${prefix}:join`, { lobbyId, userId, ...joinPayloadRef.current });
        }

        return () => {
            socket.off('notFound', handleNotFound);
            socket.off(`${prefix}:players`, handlePlayers);
            socket.off(`${prefix}:state`, handleState);
            socket.off(`${prefix}:inactivityWarning`, handleWarning);
            socket.off(`${prefix}:playerKicked`, clearFor);
            socket.off(`${prefix}:playerReconnected`, clearFor);
            joinedRef.current = false;
        };
    }, [socket, prefix, lobbyId, userId]);

    // Spectateur : la partie existe (état reçu, roster connu) mais aucun siège à moi.
    const myPlayer = players.find(p => p.userId === userId);
    const spectator = !!state && players.length > 0 && !myPlayer;

    return { socket, players, state, myPlayer, spectator, inactivityUserId, inactivityEndsAt };
}
