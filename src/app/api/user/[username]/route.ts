// src/app/api/user/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserProfile } from '@/lib/userProfile';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;
    if (!username) {
        return NextResponse.json({ error: 'Username manquant.' }, { status: 400 });
    }

    const session = await auth();
    const data = await getUserProfile(username, session?.user?.id ?? null);
    if (!data) {
        return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    return NextResponse.json(data);
}
