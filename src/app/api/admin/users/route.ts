import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function GET() {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const users = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
            _count: { select: { createdQuizzes: true, scores: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
}

export async function PATCH(req: NextRequest) {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { userId, role } = await req.json();
    if (!userId || !role) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });

    const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, username: true, role: true },
    });

    return NextResponse.json(user);
}

export async function DELETE(req: NextRequest) {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId manquant' }, { status: 400 });

    // Empêcher la suppression d'un admin
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (target?.role === 'ADMIN') {
        return NextResponse.json({ error: 'Impossible de supprimer un admin' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
}
