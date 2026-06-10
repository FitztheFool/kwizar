// src/hooks/useEloUpdate.ts
// Écoute l'événement socket `elo:update` (émis par le serveur de jeu à la fin d'une partie)
// et renvoie la variation d'ELO du joueur courant, pour l'afficher sur l'écran de fin.
'use client';

import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
    getUnoSocket, getQuizSocket, getTabooSocket, getSkyjowSocket, getYahtzeeSocket,
    getPuissance4Socket, getBattleshipSocket, getDiamantSocket, getImpostorSocket,
    getSpyfallSocket, getLudoSocket, getPerudoSocket, getCantStopSocket, getMilleBornesSocket,
} from '@/lib/socket';

export interface EloResult {
    userId: string;
    before: number;
    after: number;
    delta: number;
}

const SOCKET_GETTERS: Record<string, () => Socket | null> = {
    uno: getUnoSocket,
    quiz: getQuizSocket,
    taboo: getTabooSocket,
    skyjow: getSkyjowSocket,
    yahtzee: getYahtzeeSocket,
    puissance4: getPuissance4Socket,
    battleship: getBattleshipSocket,
    diamant: getDiamantSocket,
    impostor: getImpostorSocket,
    spyfall: getSpyfallSocket,
    ludo: getLudoSocket,
    perudo: getPerudoSocket,
    'cant-stop': getCantStopSocket,
    'mille-bornes': getMilleBornesSocket,
};

/**
 * @param game  clé du jeu (ex. 'skyjow', 'puissance4', 'cant-stop')
 * @param userId  id du joueur courant
 * @returns la variation d'ELO du joueur courant, ou null tant qu'elle n'est pas reçue
 */
export function useEloUpdate(game: string, userId: string | undefined): EloResult | null {
    const [elo, setElo] = useState<EloResult | null>(null);

    useEffect(() => {
        const socket = SOCKET_GETTERS[game]?.() ?? null;
        if (!socket || !userId) return;

        const handler = (payload: { gameType?: string; elo?: EloResult[] }) => {
            const mine = payload?.elo?.find(e => e.userId === userId);
            if (mine) setElo(mine);
        };
        socket.on('elo:update', handler);
        return () => { socket.off('elo:update', handler); };
    }, [game, userId]);

    return elo;
}
