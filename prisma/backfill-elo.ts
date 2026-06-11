// prisma/backfill-elo.ts
// Rejoue toutes les attempts des jeux notés (ordre chronologique) à travers le moteur
// ELO et remplit game_ratings + eloBefore/After/Delta. Idempotent (reset puis recalcul).
//
//   npm run db:backfill-elo
//
// (Logique ELO identique à src/lib/elo.ts — inlinée pour éviter l'alias @/ sous tsx.)

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const ELO_GAME_TYPES = new Set<string>([
    'QUIZ', 'UNO', 'TABOO', 'SKYJOW', 'YAHTZEE', 'PUISSANCE4', 'BATTLESHIP',
    'DIAMANT', 'IMPOSTOR', 'SPYFALL', 'LUDO', 'PERUDO', 'CANT_STOP', 'MILLE_BORNES',
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

async function main() {
    console.log('🔄 Backfill ELO — début');

    // 1. Reset
    await prisma.gameRating.deleteMany({});
    await prisma.attempt.updateMany({
        where: { gameType: { in: [...ELO_GAME_TYPES] as never[] } },
        data: { eloBefore: null, eloAfter: null, eloDelta: null },
    });

    // 2. Charger les attempts notées, ordre chronologique
    const attempts = await prisma.attempt.findMany({
        where: { gameType: { in: [...ELO_GAME_TYPES] as never[] } },
        select: { id: true, userId: true, gameType: true, gameId: true, placement: true, botScores: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
    });

    // 3. Grouper par gameId (une partie), trier les groupes par date
    const groups = new Map<string, typeof attempts>();
    for (const a of attempts) {
        if (!groups.has(a.gameId)) groups.set(a.gameId, []);
        groups.get(a.gameId)!.push(a);
    }
    const orderedGroups = [...groups.values()].sort(
        (g1, g2) => g1[0].createdAt.getTime() - g2[0].createdAt.getTime(),
    );

    // 4. État courant par user×jeu
    const ratingMap = new Map<string, number>();          // key `${gameType}:${userId}` -> rating
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

        // Bots : stockés en JSON sur la première attempt humaine de la partie
        const botJson = group.find(a => a.botScores != null)?.botScores as BotScore[] | null;
        const bots: Participant[] = Array.isArray(botJson)
            ? botJson.map((b, i) => ({ key: `bot-${i}`, placement: b.placement ?? null, rating: BOT_RATING, isBot: true }))
            : [];

        const humanKeys = new Set(humans.map(h => h.key));
        const outcomes = computeElo([...humans, ...bots]);
        if (outcomes.length === 0) continue; // < 2 participants → pas de partie notée

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

    // 5. Écrire game_ratings
    const ratingRows = [...stats.entries()].map(([sk, st]) => ({
        userId: st.userId,
        gameType: st.gameType,
        rating: ratingMap.get(sk) ?? DEFAULT_RATING,
        games: st.games,
        wins: st.wins,
        peak: st.peak,
    }));
    await prisma.gameRating.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: ratingRows as any,
    });

    // 6. Écrire les deltas sur les attempts (par lots)
    const CHUNK = 50;
    for (let i = 0; i < attemptUpdates.length; i += CHUNK) {
        await Promise.all(attemptUpdates.slice(i, i + CHUNK).map(u =>
            prisma.attempt.update({ where: { id: u.id }, data: { eloBefore: u.before, eloAfter: u.after, eloDelta: u.delta } }),
        ));
    }

    console.log(`✅ Backfill ELO terminé — ${ratedGames} parties notées, ${ratingRows.length} lignes game_ratings, ${attemptUpdates.length} attempts mises à jour`);
}

main()
    .catch(e => { console.error('❌ Backfill ELO échec', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
