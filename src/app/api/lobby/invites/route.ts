// src/app/api/lobby/invites/route.ts — pending lobby invites for the current user.
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPendingInvites } from '@/lib/lobbyInvites';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }
    const invites = await getPendingInvites(session.user.id);
    return NextResponse.json({ invites });
}
