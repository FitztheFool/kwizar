// src/app/api/presence/ping/route.ts — heartbeat keeping `lastSeen` fresh for online status.
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ ok: false }, { status: 401 });
    }
    // updateMany ne lève pas si l'utilisateur n'existe plus (ex. session périmée
    // après un reseed) — la présence est best-effort, pas de 500.
    const res = await prisma.user.updateMany({
        where: { id: session.user.id },
        data: { lastSeen: new Date() },
    });
    return NextResponse.json({ ok: res.count > 0 });
}
