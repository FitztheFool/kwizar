// src/app/api/duel/[id]/route.ts
// Récupère un "Ceci ou Cela" (lecture publique/propriétaire) ou le supprime (propriétaire).
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();

        const deck = await prisma.duelDeck.findUnique({
            where: { id },
            include: {
                items: { orderBy: { position: 'asc' } },
                creator: { select: { id: true, username: true, email: true } },
            },
        });

        if (!deck) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
        if (!deck.isPublic && deck.creatorId !== session?.user?.id) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        return NextResponse.json({
            id: deck.id,
            title: deck.title,
            emoji: deck.emoji,
            imageUrl: deck.imageUrl,
            isPublic: deck.isPublic,
            creator: {
                id: deck.creator.id,
                username: deck.creator.username || deck.creator.email?.split('@')[0] || 'Anonyme',
            },
            items: deck.items.map((i) => ({ name: i.name, imageUrl: i.imageUrl })),
        });
    } catch (error) {
        console.error('Erreur GET /api/duel/[id]:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const deck = await prisma.duelDeck.findUnique({ where: { id }, select: { creatorId: true } });
        if (!deck) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
        if (deck.creatorId !== session.user.id) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        await prisma.duelDeck.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Erreur DELETE /api/duel/[id]:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
