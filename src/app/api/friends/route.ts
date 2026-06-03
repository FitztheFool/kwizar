// src/app/api/friends/route.ts — accepted friends of the current user.
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { isOnline } from '@/lib/friends';

const userSelect = { id: true, username: true, image: true, lastSeen: true } as const;

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }
    const me = session.user.id;

    const rows = await prisma.friendship.findMany({
        where: { status: 'ACCEPTED', OR: [{ requesterId: me }, { addresseeId: me }] },
        select: { id: true, requester: { select: userSelect }, addressee: { select: userSelect } },
    });

    const friends = rows
        .map(r => {
            const u = r.requester.id === me ? r.addressee : r.requester;
            return {
                friendshipId: r.id,
                id: u.id,
                username: u.username,
                image: u.image,
                online: isOnline(u.lastSeen),
            };
        })
        .sort(
            (a, b) =>
                Number(b.online) - Number(a.online) ||
                (a.username ?? '').localeCompare(b.username ?? ''),
        );

    return NextResponse.json({ friends });
}
