// src/app/api/duel/route.ts
// Duels créés par les utilisateurs : liste + création.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

const MIN_ITEMS = 4;
const MAX_ITEMS = 32;

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const { searchParams } = new URL(request.url);
        const search = (searchParams.get('search') ?? '').trim();
        const onlyMine = searchParams.get('onlyMine') === 'true';

        // Connecté : decks publics + ses propres decks (même privés). Sinon : publics seuls.
        const where: any = onlyMine && session?.user?.id
            ? { creatorId: session.user.id }
            : session?.user?.id
                ? { OR: [{ isPublic: true }, { creatorId: session.user.id }] }
                : { isPublic: true };
        if (search) where.title = { contains: search, mode: 'insensitive' };

        const decks = await prisma.duelDeck.findMany({
            where,
            orderBy: [{ isBuiltin: 'desc' }, { createdAt: 'desc' }],
            include: {
                items: { orderBy: { position: 'asc' } },
                creator: { select: { id: true, username: true, email: true } },
            },
        });

        return NextResponse.json({
            decks: decks.map((d) => ({
                id: d.id,
                title: d.title,
                emoji: d.emoji,
                imageUrl: d.imageUrl,
                isPublic: d.isPublic,
                isBuiltin: d.isBuiltin,
                creator: {
                    id: d.creator.id,
                    username: d.creator.username || d.creator.email?.split('@')[0] || 'Anonyme',
                },
                items: d.items.map((i) => ({ name: i.name, imageUrl: i.imageUrl })),
                createdAt: d.createdAt,
            })),
        });
    } catch (error) {
        console.error('Erreur GET /api/duel:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const body = await request.json();
        const title = typeof body.title === 'string' ? body.title.trim() : '';
        const emoji = typeof body.emoji === 'string' && body.emoji.trim() ? body.emoji.trim() : '🆚';
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

        const deck = await prisma.duelDeck.create({
            data: {
                title,
                emoji,
                imageUrl,
                isPublic,
                creatorId: session.user.id,
                items: {
                    create: items.map((it: { name: string; imageUrl: string | null }, idx: number) => ({
                        name: it.name,
                        imageUrl: it.imageUrl,
                        position: idx,
                    })),
                },
            },
            include: { items: { orderBy: { position: 'asc' } } },
        });

        return NextResponse.json(deck, { status: 201 });
    } catch (error) {
        console.error('Erreur POST /api/duel:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
