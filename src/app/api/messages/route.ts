// src/app/api/messages/route.ts — conversation list + total unread (drives the header badge).
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getConversations } from '@/lib/messages';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }
    const data = await getConversations(session.user.id);
    return NextResponse.json(data);
}
