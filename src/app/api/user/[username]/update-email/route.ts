import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRegistered } from '@/lib/authGuard';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { session, error } = await requireRegistered();
    if (error) return error;

    const { username } = await params;
    if (session.user.username !== username)
        return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });

    const { email } = await req.json();

    if (!email || typeof email !== 'string')
        return NextResponse.json({ error: 'Email invalide.' }, { status: 400 });

    const trimmed = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
        return NextResponse.json({ error: "Format d'email invalide." }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email: trimmed } });
    if (existing && existing.id !== session.user.id)
        return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 409 });

    const updated = await prisma.user.update({
        where: { id: session.user.id },
        data: { email: trimmed },
    });

    return NextResponse.json({ email: updated.email });
}
