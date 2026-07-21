// src/app/api/me/summary/route.ts
// Résumé « moi » consolidé : demandes d'amis en attente + invitations de salon +
// conversations (liste + non-lus). Une seule requête pour alimenter les 3 providers
// globaux (Friends / Notifications / Messages) → -2 requêtes et -1 poll sur CHAQUE page.
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getPendingInvites } from '@/lib/lobbyInvites';
import { getConversations } from '@/lib/messages';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }
    const me = session.user.id;

    const [friendRequests, invites, conv, notifications] = await Promise.all([
        prisma.friendship.count({ where: { status: 'PENDING', addresseeId: me } }),
        getPendingInvites(me),
        getConversations(me),
        // Backlog de la cloche : notifs non-lues récentes (les temps réel arrivent par socket).
        prisma.notification.findMany({
            where: { userId: me, readAt: null },
            orderBy: { createdAt: 'desc' },
            take: 30,
        }),
    ]);

    return NextResponse.json({
        friendRequests,
        invites,
        conversations: conv.conversations,
        totalUnread: conv.totalUnread,
        notifications,
    });
}
