import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const revalidate = 10; // cache court : reflète vite les suppressions admin

export async function GET() {
    const [gamesRow, pointsAgg] = await Promise.all([
        // "parties" = nombre de parties distinctes (pas le nombre de lignes-joueurs)
        prisma.$queryRaw<{ n: bigint }[]>`SELECT COUNT(DISTINCT "gameId")::int AS n FROM attempts`,
        prisma.attempt.aggregate({ _sum: { score: true } }),
    ]);

    return NextResponse.json({
        parties: Number(gamesRow[0]?.n ?? 0),
        points: pointsAgg._sum.score ?? 0,
    });
}
