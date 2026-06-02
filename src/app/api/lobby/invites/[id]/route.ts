// src/app/api/lobby/invites/[id]/route.ts — dismiss/accept (delete) an invite.
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

    const inv = await prisma.lobbyInvite.findUnique({ where: { id }, select: { toUserId: true } });
    if (!inv || inv.toUserId !== me) {
        return NextResponse.json({ error: 'Introuvable.' }, { status: 404 });
    }

    await prisma.lobbyInvite.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}
