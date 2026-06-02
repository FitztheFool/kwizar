// src/app/api/messages/[userId]/route.ts
// GET  — thread with one friend (marks incoming messages read as a side-effect).
// POST — send a message to a friend (persist + realtime push to both parties).
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getRelationship } from '@/lib/friends';
import { MAX_BODY, pushToUser, serializeMessage } from '@/lib/messages';

const THREAD_LIMIT = 50;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }
    const me = session.user.id;
    const { userId: other } = await params;
    if (!other || other === me) {
        return NextResponse.json({ error: 'Conversation invalide.' }, { status: 400 });
    }

    const partner = await prisma.user.findUnique({
        where: { id: other },
        select: { id: true, username: true, image: true, lastSeen: true },
    });
    if (!partner) {
        return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    // Mark everything this friend sent me as read, then return the latest slice.
    await prisma.directMessage.updateMany({
        where: { senderId: other, recipientId: me, readAt: null },
        data: { readAt: new Date() },
    });

    const rows = await prisma.directMessage.findMany({
        where: {
            OR: [
                { senderId: me, recipientId: other },
                { senderId: other, recipientId: me },
            ],
        },
        orderBy: { createdAt: 'desc' },
        take: THREAD_LIMIT,
    });

    const messages = rows.reverse().map(serializeMessage);
    return NextResponse.json({ partner: { id: partner.id, username: partner.username, image: partner.image }, messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }
    const me = session.user.id;
    const { userId: other } = await params;
    if (!other || other === me) {
        return NextResponse.json({ error: 'Destinataire invalide.' }, { status: 400 });
    }

    // Friends only.
    const { relationship } = await getRelationship(me, other);
    if (relationship !== 'friends') {
        return NextResponse.json({ error: 'Vous devez être amis pour envoyer un message.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const text = typeof body.body === 'string' ? body.body.trim() : '';
    if (!text) {
        return NextResponse.json({ error: 'Message vide.' }, { status: 400 });
    }
    if (text.length > MAX_BODY) {
        return NextResponse.json({ error: 'Message trop long.' }, { status: 400 });
    }

    const created = await prisma.directMessage.create({
        data: { senderId: me, recipientId: other, body: text },
    });
    const msg = serializeMessage(created);

    // Deliver in real time to the recipient and to the sender's other tabs.
    await Promise.all([
        pushToUser(other, 'dm:message', msg),
        pushToUser(me, 'dm:message', msg),
    ]);

    return NextResponse.json({ message: msg }, { status: 201 });
}
