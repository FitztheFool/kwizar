// src/lib/eloBackfill.ts
// Recalcule l'ELO en rejouant les attempts (ordre chronologique) à travers le moteur.
// Réutilisé par le CLI/seed (prisma/backfill-elo.ts) et la suppression admin d'attempts.
// Imports RELATIFS uniquement (pas d'alias @/) pour rester exécutable sous tsx.

import type { PrismaClient } from '../generated/prisma/client';

const ELO_GAME_TYPES = new Set<string>([
    'QUIZ', 'UNO', 'TABOO', 'SKYJOW', 'YAHTZEE', 'PUISSANCE4', 'BATTLESHIP',
    'DIAMANT', 'IMPOSTOR', 'SPYFALL', 'LUDO', 'PERUDO', 'CANT_STOP', 'MILLE_BORNES',
    'ATLANTIDE', 'ABALONE',
]);
const DEFAULT_RATING = 1000;
const BOT_RATING = 1000;
const K = 32;

interface Participant { key: string; placement: number | null; rating: number; isBot?: boolean; }
interface Outcome { key: string; before: number; after: number; delta: number; }

function pairScore(a: number, b: number): number { return a < b ? 1 : a > b ? 0 : 0.5; }

function computeElo(participants: Participant[]): Outcome[] {
    const n = participants.length;
    if (n < 2) return [];
    const maxP = participants.reduce((m, p) => (p.placement != null && p.placement > m ? p.placement : m), 1);
    const eff = participants.map(p => ({ ...p, place: p.placement == null ? maxP + 1 : p.placement }));
    return eff.map((p, i) => {
        let E = 0, A = 0;
        for (let j = 0; j < n; j++) {
            if (j === i) continue;
            const q = eff[j];
            E += 1 / (1 + Math.pow(10, (q.rating - p.rating) / 400));
            A += pairScore(p.place, q.place);
        }
        const delta = Math.round((K * (A - E)) / (n - 1));
        return { key: p.key, before: p.rating, after: p.rating + delta, delta };
    });
}

type BotScore = { username?: string; score?: number; placement?: number | null; team?: number | null };

/**
 * Recalcule game_ratings + eloBefore/After/Delta. Idempotent (reset + recalcul).
 * @param gameTypes  si fourni, ne recalcule que ces jeux (l'ELO est indépendant par jeu) ;
 *                   sinon recalcule tous les jeux notés.
 */
export async function recomputeElo(prisma: PrismaClient, gameTypes?: string[]): Promise<void> {
    const types = (gameTypes && gameTypes.length
        ? gameTypes.filter(t => ELO_GAME_TYPES.has(t))
        : [...ELO_GAME_TYPES]);
    if (types.length === 0) return;

    // 1. Reset (limité aux jeux concernés)
    await prisma.gameRating.deleteMany({ where: { gameType: { in: types as never[] } } });
    await prisma.attempt.updateMany({
        where: { gameType: { in: types as never[] } },
        data: { eloBefore: null, eloAfter: null, eloDelta: null },
    });

    // 2. Attempts notées, ordre chronologique
    const attempts = await prisma.attempt.findMany({
        where: { gameType: { in: types as never[] } },
        select: { id: true, userId: true, gameType: true, gameId: true, placement: true, botScores: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
    });

    // 3. Grouper par gameId, trier par date
    const groups = new Map<string, typeof attempts>();
    for (const a of attempts) {
        if (!groups.has(a.gameId)) groups.set(a.gameId, []);
        groups.get(a.gameId)!.push(a);
    }
    const orderedGroups = [...groups.values()].sort(
        (g1, g2) => g1[0].createdAt.getTime() - g2[0].createdAt.getTime(),
    );

    // 4. Rejeu
    const ratingMap = new Map<string, number>();
    const stats = new Map<string, { games: number; wins: number; peak: number; userId: string; gameType: string }>();
    const attemptUpdates: { id: string; before: number; after: number; delta: number }[] = [];
    const key = (gt: string, uid: string) => `${gt}:${uid}`;

    let ratedGames = 0;
    for (const group of orderedGroups) {
        const gameType = group[0].gameType as string;

        const humans: (Participant & { attemptId: string })[] = group.map(a => ({
            key: a.userId,
            attemptId: a.id,
            placement: a.placement,
            rating: ratingMap.get(key(gameType, a.userId)) ?? DEFAULT_RATING,
        }));

        const botJson = group.find(a => a.botScores != null)?.botScores as BotScore[] | null;
        const bots: Participant[] = Array.isArray(botJson)
            ? botJson.map((b, i) => ({ key: `bot-${i}`, placement: b.placement ?? null, rating: BOT_RATING, isBot: true }))
            : [];

        const humanKeys = new Set(humans.map(h => h.key));
        const outcomes = computeElo([...humans, ...bots]);
        if (outcomes.length === 0) continue;

        ratedGames++;
        for (const h of humans) {
            const o = outcomes.find(x => x.key === h.key);
            if (!o || !humanKeys.has(o.key)) continue;
            ratingMap.set(key(gameType, h.key), o.after);
            attemptUpdates.push({ id: h.attemptId, before: o.before, after: o.after, delta: o.delta });

            const sk = key(gameType, h.key);
            const st = stats.get(sk) ?? { games: 0, wins: 0, peak: DEFAULT_RATING, userId: h.key, gameType };
            st.games += 1;
            if (h.placement === 1) st.wins += 1;
            st.peak = Math.max(st.peak, o.after);
            stats.set(sk, st);
        }
    }

    // 5. game_ratings
    const ratingRows = [...stats.entries()].map(([sk, st]) => ({
        userId: st.userId,
        gameType: st.gameType,
        rating: ratingMap.get(sk) ?? DEFAULT_RATING,
        games: st.games,
        wins: st.wins,
        peak: st.peak,
    }));
    if (ratingRows.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await prisma.gameRating.createMany({ data: ratingRows as any });
    }

    // 6. deltas sur les attempts (par lots)
    const CHUNK = 50;
    for (let i = 0; i < attemptUpdates.length; i += CHUNK) {
        await Promise.all(attemptUpdates.slice(i, i + CHUNK).map(u =>
            prisma.attempt.update({ where: { id: u.id }, data: { eloBefore: u.before, eloAfter: u.after, eloDelta: u.delta } }),
        ));
    }

    console.log(`✅ Recompute ELO [${types.join(',')}] — ${ratedGames} parties, ${ratingRows.length} game_ratings, ${attemptUpdates.length} attempts`);
}
