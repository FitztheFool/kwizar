// src/app/api/duel/[id]/route.ts
// Récupère / modifie / supprime un Duel. Lecture : public, propriétaire ou admin.
// Écriture (PUT/DELETE) : propriétaire ou admin.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

const MIN_ITEMS = 4;
const MAX_ITEMS = 32;

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        const isAdmin = session?.user?.role === 'ADMIN';

        const deck = await prisma.duelDeck.findUnique({
            where: { id },
            include: {
                items: { orderBy: { position: 'asc' } },
                creator: { select: { id: true, username: true, email: true } },
            },
        });

        if (!deck) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
        if (!deck.isPublic && deck.creatorId !== session?.user?.id && !isAdmin) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        return NextResponse.json({
            id: deck.id,
            title: deck.title,
            imageUrl: deck.imageUrl,
            isPublic: deck.isPublic,
            isBuiltin: deck.isBuiltin,
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

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }
        const isAdmin = session.user.role === 'ADMIN';

        const deck = await prisma.duelDeck.findUnique({ where: { id }, select: { creatorId: true } });
        if (!deck) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
        if (deck.creatorId !== session.user.id && !isAdmin) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const body = await request.json();
        const title = typeof body.title === 'string' ? body.title.trim() : '';
        const isPublic = body.isPublic !== false;
        const imageUrl = typeof body.imageUrl === 'string' && body.imageUrl.trim() ? body.imageUrl.trim() : null;

        if (!title) return NextResponse.json({ error: 'Titre requis' }, { status: 400 });

        const rawItems = Array.isArray(body.items) ? body.items : [];
        const items = rawItems
            .map((it: any) => ({
                name: typeof it?.name === 'string' ? it.name.trim() : '',
                imageUrl: typeof it?.imageUrl === 'string' && it.imageUrl.trim() ? it.imageUrl.trim() : null,
            }))
            .filter((it: { name: string }) => it.name.length > 0);

        if (items.length < MIN_ITEMS) {
            return NextResponse.json({ error: `Au moins ${MIN_ITEMS} items requis` }, { status: 400 });
        }
        if (items.length > MAX_ITEMS) {
            return NextResponse.json({ error: `Maximum ${MAX_ITEMS} items` }, { status: 400 });
        }

        const updated = await prisma.duelDeck.update({
            where: { id },
            data: {
                title,
                imageUrl,
                isPublic,
                items: {
                    deleteMany: {},
                    create: items.map((it: { name: string; imageUrl: string | null }, idx: number) => ({
                        name: it.name,
                        imageUrl: it.imageUrl,
                        position: idx,
                    })),
                },
            },
            include: { items: { orderBy: { position: 'asc' } } },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Erreur PUT /api/duel/[id]:', error);
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
        const isAdmin = session.user.role === 'ADMIN';

        const deck = await prisma.duelDeck.findUnique({ where: { id }, select: { creatorId: true } });
        if (!deck) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
        if (deck.creatorId !== session.user.id && !isAdmin) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        await prisma.duelDeck.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Erreur DELETE /api/duel/[id]:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
