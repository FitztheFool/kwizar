// src/app/api/friends/[id]/accept/route.ts — addressee accepts a pending request.
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }
    const me = session.user.id;
    const { id } = await params;

    const f = await prisma.friendship.findUnique({
        where: { id },
        select: { id: true, status: true, addresseeId: true },
    });
    if (!f || f.status !== 'PENDING' || f.addresseeId !== me) {
        return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 });
    }

    await prisma.friendship.update({ where: { id }, data: { status: 'ACCEPTED' } });
    return NextResponse.json({ ok: true });
}
