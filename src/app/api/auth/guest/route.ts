// /api/auth/guest
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { randomUUID } from 'crypto';
import { randomUsername } from '@/lib/randomUsername';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session) return NextResponse.json({ ok: true });

    const body = await req.json().catch(() => ({}));
    let username: string = (typeof body.username === 'string' && body.username.trim()) || randomUsername();
    username = username.slice(0, 30);

    let userId: string;
    let finalUsername: string;

    const existing = await prisma.user.findFirst({ where: { username } });

    if (existing?.isAnonymous) {
        userId = existing.id;
        finalUsername = existing.username!;
    } else {
        if (existing) {
            username = `${username}_${Math.floor(Math.random() * 900 + 100)}`;
        }
        const email = `guest_${randomUUID()}@guest.internal`;
        const user = await prisma.user.create({
            data: { username, email, isAnonymous: true },
            select: { id: true, username: true },
        });
        userId = user.id;
        finalUsername = user.username!;
    }

    // Renvoie juste le userId, le signIn se fait côté client
    return NextResponse.json({ ok: true, userId, username: finalUsername });
}
