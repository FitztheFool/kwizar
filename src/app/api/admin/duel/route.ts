// src/app/api/admin/duel/route.ts
// Gestion admin des Duels : liste (tous, paginée) + suppression.
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));
    const q = searchParams.get('q')?.trim() ?? '';
    const where: NonNullable<NonNullable<Parameters<typeof prisma.duelDeck.findMany>[0]>['where']> = {};
    if (q) where.title = { contains: q, mode: 'insensitive' };

    const [decks, total] = await Promise.all([
        prisma.duelDeck.findMany({
            where,
            select: {
                id: true,
                title: true,
                emoji: true,
                imageUrl: true,
                isPublic: true,
                isBuiltin: true,
                createdAt: true,
                creator: { select: { username: true } },
                _count: { select: { items: true } },
            },
            orderBy: [{ isBuiltin: 'desc' }, { createdAt: 'desc' }],
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.duelDeck.count({ where }),
    ]);

    return NextResponse.json({ decks, total, totalPages: Math.ceil(total / pageSize) });
}

export async function DELETE(req: NextRequest) {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { deckId } = await req.json();
    if (!deckId) return NextResponse.json({ error: 'deckId manquant' }, { status: 400 });

    await prisma.duelDeck.delete({ where: { id: deckId } });
    return NextResponse.json({ success: true });
}
