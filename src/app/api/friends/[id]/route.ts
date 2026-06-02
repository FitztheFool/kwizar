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
