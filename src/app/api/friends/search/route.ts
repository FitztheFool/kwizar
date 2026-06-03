// src/app/api/friends/search/route.ts — typeahead search for ACTIVE users to befriend.
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import type { Relationship } from '@/lib/friends';

const LIMIT = 8;

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }
    const me = session.user.id;

    const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (!q) {
        return NextResponse.json({ results: [] });
    }

    // Only ACTIVE users can be befriended (cf. /api/friends/request).
    const candidates = await prisma.user.findMany({
        where: {
            status: 'ACTIVE',
            deletedAt: null,
            id: { not: me },
            username: { contains: q, mode: 'insensitive' },
        },
        select: { id: true, username: true, image: true },
        take: LIMIT,
        orderBy: { username: 'asc' },
    });

    const ids = candidates.map(c => c.id);
    const links = ids.length
        ? await prisma.friendship.findMany({
              where: {
                  OR: [
                      { requesterId: me, addresseeId: { in: ids } },
                      { requesterId: { in: ids }, addresseeId: me },
                  ],
              },
              select: { id: true, requesterId: true, addresseeId: true, status: true },
          })
        : [];

    const annotate = (otherId: string): { relationship: Relationship; friendshipId: string | null } => {
        const f = links.find(l => l.requesterId === otherId || l.addresseeId === otherId);
        if (!f) return { relationship: 'none', friendshipId: null };
        if (f.status === 'ACCEPTED') return { relationship: 'friends', friendshipId: f.id };
        return { relationship: f.requesterId === me ? 'pending_out' : 'pending_in', friendshipId: f.id };
    };

    const results = candidates.map(c => ({ ...c, ...annotate(c.id) }));
    return NextResponse.json({ results });
}
