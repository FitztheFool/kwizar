// src/app/api/friends/status/route.ts — relationship between current user and ?username=.
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getRelationship } from '@/lib/friends';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ relationship: 'none', friendshipId: null });
    }
    const me = session.user.id;

    const username = req.nextUrl.searchParams.get('username')?.trim();
    if (!username) {
        return NextResponse.json({ error: 'Username manquant.' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!target) {
        return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    const rel = await getRelationship(me, target.id);
    return NextResponse.json({ ...rel, userId: target.id });
}
