import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [parties, pointsAgg] = await Promise.all([
      prisma.attempt.count(),
      prisma.attempt.aggregate({ _sum: { score: true } }),
    ]);

    return NextResponse.json({
      parties,
      points: pointsAgg._sum.score ?? 0,
    });
  } catch (error) {
    console.error('[api/stats] Prisma error:', error);

    return NextResponse.json(
      {
        parties: 0,
        points: 0,
      },
      { status: 200 }
    );
  }
}