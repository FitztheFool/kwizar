import type { MetadataRoute } from 'next';
import { GAME_CONFIG, type GameMode } from '@/lib/gameConfig';
import prisma from '@/lib/prisma';

const BASE = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    const staticRoutes: MetadataRoute.Sitemap = ['', '/quiz/available', '/lobby/all', '/login', '/register']
        .map(p => ({ url: `${BASE}${p}`, lastModified: now }));

    // Per-game: a leaderboard for every game, plus a play page for solo arcade games.
    const gameRoutes: MetadataRoute.Sitemap = Object.entries(GAME_CONFIG).flatMap(([key, g]) => {
        const urls: MetadataRoute.Sitemap = [{ url: `${BASE}/leaderboard/${key}`, lastModified: now }];
        if ((g.mode as GameMode) === 'solo') urls.push({ url: `${BASE}/game/${key}`, lastModified: now });
        return urls;
    });

    // Public quizzes (best-effort: skip if the DB is unreachable at build time).
    let quizRoutes: MetadataRoute.Sitemap = [];
    try {
        const quizzes = await prisma.quiz.findMany({
            where: { isPublic: true },
            select: { id: true },
            take: 1000,
        });
        quizRoutes = quizzes.map(q => ({ url: `${BASE}/quiz/${q.id}`, lastModified: now }));
    } catch {
        /* ignore */
    }

    return [...staticRoutes, ...gameRoutes, ...quizRoutes];
}
