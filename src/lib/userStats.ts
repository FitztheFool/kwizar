// Calcul des stats d'un joueur nécessaires à l'évaluation des succès.
//
// Sous-ensemble ciblé de ce que /api/user/[username]/stats calcule : totalGames + par jeu
// (count, wins, points, eloPeak). Extrait ici pour être partagé entre la route stats et
// syncAchievements sans dupliquer les requêtes.
//
// `ranks` (rang #1 par jeu) n'est PAS calculé ici : son SQL vit dans l'endpoint ranks et
// dépend de la catégorie de jeu. Les succès « podium » l'exigent → ils sont évalués côté
// profil (où ranks est déjà chargé), pas au sync temps réel. Les autres succès (assiduité,
// victoires, variété, ELO, points) ne dépendent que de ce helper.

import prisma from '@/lib/prisma';
import type { AchievementStats } from '@/lib/achievements';

export async function computeUserStats(userId: string): Promise<AchievementStats> {
    const [sumsByType, distinctByType, ratings] = await Promise.all([
        // Points cumulés par jeu.
        prisma.attempt.groupBy({
            by: ['gameType'],
            where: { userId },
            _sum: { score: true },
        }),
        // Parties distinctes (gameId, gameType) → count + wins (placement 1).
        prisma.attempt.findMany({
            where: { userId },
            select: { gameType: true, gameId: true, placement: true },
            distinct: ['gameId', 'gameType'],
        }),
        // ELO peak par jeu.
        prisma.gameRating.findMany({
            where: { userId },
            select: { gameType: true, peak: true },
        }),
    ]);

    const gameStats: AchievementStats['gameStats'] = {};
    const ensure = (t: string) => (gameStats[t] ??= { count: 0, wins: 0, points: 0, elo: null, eloPeak: 0, bestScore: 0 });

    for (const row of sumsByType) ensure(row.gameType).points = row._sum.score ?? 0;

    for (const g of distinctByType) {
        const s = ensure(g.gameType);
        s.count++;
        if (g.placement === 1) s.wins++;
    }

    for (const r of ratings) ensure(r.gameType).eloPeak = r.peak ?? 0;

    const totalGames = Object.values(gameStats).reduce((n, s) => n + s.count, 0);

    return { totalGames, gameStats };
}
