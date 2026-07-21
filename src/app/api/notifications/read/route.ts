// Marque des notifications comme lues.
// Body : { id } pour une notif précise, ou {} / { all: true } pour tout marquer.
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }
    const me = session.user.id;

    const { id } = await req.json().catch(() => ({ id: undefined }));

    // `userId: me` dans le where : un utilisateur ne peut marquer que SES notifications.
    const where = id
        ? { id: String(id), userId: me, readAt: null }
        : { userId: me, readAt: null };

    const { count } = await prisma.notification.updateMany({
        where,
        data: { readAt: new Date() },
    });

    return NextResponse.json({ ok: true, marked: count });
}
