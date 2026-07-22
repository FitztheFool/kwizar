// src/app/api/friends/[id]/accept/route.ts — addressee accepts a pending request.
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { isFeatureEnabled } from '@/lib/appSettings';
import { notifyUser } from '@/lib/notify';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }
    if (!(await isFeatureEnabled('friends'))) {
        return NextResponse.json({ error: 'Fonctionnalité désactivée.' }, { status: 403 });
    }
    const me = session.user.id;
    const { id } = await params;

    // JWT dont l'id ne correspond plus à aucun compte (base re-seedée / compte supprimé) :
    // sans ça, l'appelant tomberait sur un 404 trompeur au lieu d'un signal de reconnexion.
    const meExists = await prisma.user.findUnique({ where: { id: me }, select: { id: true } });
    if (!meExists) {
        return NextResponse.json({ error: 'Session expirée, reconnectez-vous.' }, { status: 401 });
    }

    const f = await prisma.friendship.findUnique({
        where: { id },
        select: { id: true, status: true, addresseeId: true, requesterId: true },
    });
    if (!f || f.status !== 'PENDING' || f.addresseeId !== me) {
        return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 });
    }

    await prisma.friendship.update({ where: { id }, data: { status: 'ACCEPTED' } });

    // Prévient le demandeur que sa demande a été acceptée (boucle jusque-là muette).
    const meUser = await prisma.user.findUnique({ where: { id: me }, select: { username: true } });
    const meName = meUser?.username ?? 'Un joueur';
    void notifyUser(f.requesterId, {
        type: 'friend_accept',
        title: 'Demande acceptée',
        body: `${meName} a accepté votre demande d'ami`,
        link: `/user/${meName}`,
    });

    return NextResponse.json({ ok: true });
}
