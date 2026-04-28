// src/lib/adminAuth.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
    }
    if (session.user.role !== 'ADMIN') {
        return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) };
    }
    // Vérifier en base que le compte n'a pas été banni après la création du token
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { status: true },
    });
    if (!dbUser || dbUser.status === 'BANNED') {
        return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) };
    }
    return { session };
}
