// src/app/api/internal/lobby-invites/route.ts
// Internal endpoint (lobby-server → front, Bearer INTERNAL_API_KEY): purge all
// pending invites for a lobby once its game has started — they're now stale.
import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function isAuthorized(req: NextRequest): boolean {
    const auth = req.headers.get('authorization') ?? '';
    const secret = process.env.INTERNAL_API_KEY;
    if (!secret) return false;
    const expected = `Bearer ${secret}`;
    return auth.length === expected.length && timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
}

export async function DELETE(req: NextRequest) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const lobbyId = req.nextUrl.searchParams.get('lobbyId')?.trim();
    if (!lobbyId) {
        return NextResponse.json({ error: 'lobbyId requis' }, { status: 400 });
    }
    const { count } = await prisma.lobbyInvite.deleteMany({ where: { lobbyId } });
    return NextResponse.json({ ok: true, deleted: count });
}
