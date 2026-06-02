// src/app/api/presence/ping/route.ts — heartbeat keeping `lastSeen` fresh for online status.
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ ok: false }, { status: 401 });
    }
    await prisma.user.update({
        where: { id: session.user.id },
        data: { lastSeen: new Date() },
    });
    return NextResponse.json({ ok: true });
}
