// src/app/api/friends/request/route.ts — send a friend request by username.
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { checkRateLimit, getIp } from '@/lib/rateLimit';
import { isFeatureEnabled } from '@/lib/appSettings';
import { notifyUser } from '@/lib/notify';

/** Username d'un utilisateur pour les messages de notification (repli « Un joueur »). */
async function friendName(userId: string): Promise<string> {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    return u?.username ?? 'Un joueur';
}

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

    // Le JWT peut porter un id qui n'existe plus (compte supprimé, base re-seedée
    // depuis la connexion). Sans ce contrôle, l'INSERT plus bas échoue en violation
    // de clé étrangère (P2003) → 500 opaque. On force une reconnexion à la place.
    const meExists = await prisma.user.findUnique({ where: { id: me }, select: { id: true } });
    if (!meExists) {
        return NextResponse.json(
            { error: 'Session expirée, reconnectez-vous.' },
            { status: 401 },
        );
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
        // On vient d'accepter la demande de `target` → on le prévient qu'on est amis.
        const meName = await friendName(me);
        void notifyUser(target.id, {
            type: 'friend_accept',
            title: 'Demande acceptée',
            body: `${meName} a accepté votre demande d'ami`,
            link: `/user/${meName}`,
        });
        return NextResponse.json({ status: 'friends', friendshipId: updated.id });
    }

    const created = await prisma.friendship.create({
        data: { requesterId: me, addresseeId: target.id, status: 'PENDING' },
    });
    // Prévient le destinataire de la nouvelle demande (temps réel + cloche).
    const meName = await friendName(me);
    void notifyUser(target.id, {
        type: 'friend_request',
        title: "Demande d'ami",
        body: `${meName} souhaite vous ajouter`,
        link: '/friends',
    });
    return NextResponse.json({ status: 'pending_out', friendshipId: created.id }, { status: 201 });
}
