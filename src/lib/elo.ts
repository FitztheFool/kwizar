// src/lib/elo.ts
// Moteur ELO par jeu — note de niveau relative, mise à jour à la fin de chaque partie.
// Calcul "pairwise" basé uniquement sur le placement (1 = meilleur), ce qui généralise
// 1v1, free-for-all à N joueurs et jeux par équipes (coéquipiers partagent le placement).

import { GameType } from '@/generated/prisma/client';

/** Jeux compétitifs notés à l'ELO. Exclut JUST_ONE (coop pur) et tous les jeux solo. */
export const ELO_GAME_TYPES: ReadonlySet<GameType> = new Set<GameType>([
    'QUIZ', 'UNO', 'TABOO', 'SKYJOW', 'YAHTZEE', 'PUISSANCE4', 'BATTLESHIP',
    'DIAMANT', 'IMPOSTOR', 'SPYFALL', 'LUDO', 'PERUDO', 'CANT_STOP', 'MILLE_BORNES',
    'ATLANTIDE', 'ABALONE',
]);

export const DEFAULT_RATING = 1000;
export const BOT_RATING = 1000;
/** Facteur K : amplitude max d'un gain/perte par adversaire. */
export const K_FACTOR = 32;

export function isEloGame(gameType: GameType): boolean {
    return ELO_GAME_TYPES.has(gameType);
}

export interface EloParticipant {
    /** Identifiant unique dans la partie (userId humain, ou clé de bot). */
    key: string;
    /** Placement final : 1 = meilleur. `null` (abandon/afk) = traité comme dernier. */
    placement: number | null;
    /** Note avant la partie. */
    rating: number;
    /** Les bots servent d'adversaire mais leur nouvelle note n'est pas conservée. */
    isBot?: boolean;
}

export interface EloOutcome {
    key: string;
    before: number;
    after: number;
    delta: number;
}

/** Score réel d'un duel selon le placement : meilleur = 1, égalité = 0.5, moins bon = 0. */
function pairScore(placementA: number, placementB: number): number {
    if (placementA < placementB) return 1;
    if (placementA > placementB) return 0;
    return 0.5;
}

/**
 * Calcule les nouvelles notes ELO de tous les participants d'une partie.
 * Renvoie une sortie par participant (bots inclus — le caller ignore leur résultat).
 * Renvoie [] si moins de 2 participants (pas d'adversaire → pas de mise à jour).
 */
export function computeElo(participants: EloParticipant[]): EloOutcome[] {
    const n = participants.length;
    if (n < 2) return [];

    // Placement effectif : null = dernier (perd contre tous ceux qui ont un placement).
    const maxPlacement = participants.reduce(
        (max, p) => (p.placement != null && p.placement > max ? p.placement : max),
        1,
    );
    const eff = participants.map(p => ({
        ...p,
        place: p.placement == null ? maxPlacement + 1 : p.placement,
    }));

    return eff.map((p, i) => {
        let expected = 0;
        let actual = 0;
        for (let j = 0; j < n; j++) {
            if (j === i) continue;
            const q = eff[j];
            expected += 1 / (1 + Math.pow(10, (q.rating - p.rating) / 400));
            actual += pairScore(p.place, q.place);
        }
        const delta = Math.round((K_FACTOR * (actual - expected)) / (n - 1));
        return { key: p.key, before: p.rating, after: p.rating + delta, delta };
    });
}
