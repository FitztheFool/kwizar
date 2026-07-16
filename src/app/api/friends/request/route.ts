// src/app/api/friends/request/route.ts — send a friend request by username.
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { checkRateLimit, getIp } from '@/lib/rateLimit';
import { isFeatureEnabled } from '@/lib/appSettings';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }
    if (!(await isFeatureEnabled('friends'))) {
        return NextResponse.json({ error: 'Fonctionnalité désactivée.' }, { status: 403 });
    }
    const me = session.user.id;

    const { allowed, retryAfter } = await checkRateLimit(
        `friend-req:${me}:${getIp(req)}`,
        20,
        60 * 60 * 1000,
    );
    if (!allowed) {
        return NextResponse.json(
            { error: 'Trop de demandes, réessayez plus tard.' },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } },
        );
    }

    const body = await req.json().catch(() => ({}));
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    if (!username) {
        return NextResponse.json({ error: 'Username manquant.' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
        where: { username },
        select: { id: true, deletedAt: true, status: true },
    });
    // Only ACTIVE users can be befriended (excludes PENDING / DEACTIVATED / BANNED).
    if (!target || target.deletedAt || target.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Utilisateur introuvable ou indisponible.' }, { status: 404 });
    }
    if (target.id === me) {
        return NextResponse.json({ error: 'Vous ne pouvez pas vous ajouter vous-même.' }, { status: 400 });
    }

    const existing = await prisma.friendship.findFirst({
        where: {
            OR: [
                { requesterId: me, addresseeId: target.id },
                { requesterId: target.id, addresseeId: me },
            ],
        },
        select: { id: true, status: true, requesterId: true },
    });

    if (existing) {
        if (existing.status === 'ACCEPTED') {
            return NextResponse.json({ error: 'Vous êtes déjà amis.' }, { status: 409 });
        }
        if (existing.requesterId === me) {
            return NextResponse.json({ error: 'Demande déjà envoyée.' }, { status: 409 });
        }
        // The other person already requested us → accept automatically.
        const updated = await prisma.friendship.update({
            where: { id: existing.id },
            data: { status: 'ACCEPTED' },
        });
        return NextResponse.json({ status: 'friends', friendshipId: updated.id });
    }

    const created = await prisma.friendship.create({
        data: { requesterId: me, addresseeId: target.id, status: 'PENDING' },
    });
    return NextResponse.json({ status: 'pending_out', friendshipId: created.id }, { status: 201 });
}
