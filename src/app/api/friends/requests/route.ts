// src/app/api/friends/requests/route.ts — pending requests, incoming & outgoing.
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { isOnline } from '@/lib/friends';

const userSelect = { id: true, username: true, image: true, lastSeen: true } as const;
type U = { id: string; username: string | null; image: string | null; lastSeen: Date };
const pick = (u: U) => ({ id: u.id, username: u.username, image: u.image, online: isOnline(u.lastSeen) });

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }
    const me = session.user.id;

    const [incoming, outgoing] = await Promise.all([
        prisma.friendship.findMany({
            where: { status: 'PENDING', addresseeId: me },
            select: { id: true, createdAt: true, requester: { select: userSelect } },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.friendship.findMany({
            where: { status: 'PENDING', requesterId: me },
            select: { id: true, createdAt: true, addressee: { select: userSelect } },
            orderBy: { createdAt: 'desc' },
        }),
    ]);

    return NextResponse.json({
        incoming: incoming.map(r => ({ friendshipId: r.id, user: pick(r.requester) })),
        outgoing: outgoing.map(r => ({ friendshipId: r.id, user: pick(r.addressee) })),
    });
}
