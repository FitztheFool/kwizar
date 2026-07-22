// src/app/api/friends/[id]/route.ts — decline / cancel / remove a friendship.
// Any party of the row may delete it (decline an incoming request, cancel an
// outgoing one, or remove an existing friend).
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
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
        select: { id: true, requesterId: true, addresseeId: true },
    });
    if (!f || (f.requesterId !== me && f.addresseeId !== me)) {
        return NextResponse.json({ error: 'Introuvable.' }, { status: 404 });
    }

    await prisma.friendship.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}
