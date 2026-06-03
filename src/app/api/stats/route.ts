import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const revalidate = 60; // cache 1 minute

export async function GET() {
    const [parties, pointsAgg] = await Promise.all([
        prisma.attempt.count(),
        prisma.attempt.aggregate({ _sum: { score: true } }),
    ]);

    return NextResponse.json({
        parties,
        points: pointsAgg._sum.score ?? 0,
    });
}
