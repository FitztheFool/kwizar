// src/app/api/lobby/invite/route.ts — persist a lobby invite + push it in realtime.
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { checkRateLimit, getIp } from '@/lib/rateLimit';
import { getRelationship } from '@/lib/friends';
import { pushToUser } from '@/lib/messages';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }
    const me = session.user.id;

    const { allowed, retryAfter } = checkRateLimit(`lobby-invite:${me}:${getIp(req)}`, 30, 60_000);
    if (!allowed) {
        return NextResponse.json(
            { error: 'Trop d’invitations, réessayez plus tard.' },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } },
        );
    }

    const body = await req.json().catch(() => ({}));
    const toUserId = typeof body.toUserId === 'string' ? body.toUserId : '';
    const lobbyId = typeof body.lobbyId === 'string' ? body.lobbyId.trim() : '';
    const gameType = typeof body.gameType === 'string' && body.gameType ? body.gameType : 'quiz';
    if (!toUserId || !lobbyId) {
        return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
    }
    if (toUserId === me) {
        return NextResponse.json({ error: 'Invitation invalide.' }, { status: 400 });
    }

    // Only friends can be invited.
    const rel = await getRelationship(me, toUserId);
    if (rel.relationship !== 'friends') {
        return NextResponse.json({ error: 'Vous ne pouvez inviter que vos amis.' }, { status: 403 });
    }

    // Target must be an active account.
    const target = await prisma.user.findUnique({
        where: { id: toUserId },
        select: { status: true, deletedAt: true },
    });
    if (!target || target.deletedAt || target.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Utilisateur indisponible.' }, { status: 404 });
    }

    // One invite per (recipient, lobby): refresh it if re-invited.
    const invite = await prisma.lobbyInvite.upsert({
        where: { toUserId_lobbyId: { toUserId, lobbyId } },
        update: { gameType, fromUserId: me, createdAt: new Date() },
        create: { toUserId, lobbyId, gameType, fromUserId: me },
        select: { id: true },
    });

    await pushToUser(toUserId, 'lobby:invited', {
        id: invite.id,
        lobbyId,
        gameType,
        fromUserId: me,
        fromUsername: session.user.username ?? null,
    });

    return NextResponse.json({ ok: true, id: invite.id });
}
