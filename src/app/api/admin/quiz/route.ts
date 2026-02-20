import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function GET() {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const quizzes = await prisma.quiz.findMany({
        select: {
            id: true,
            title: true,
            description: true,
            isPublic: true,
            createdAt: true,
            creator: { select: { username: true } },
            category: { select: { name: true } },
            _count: { select: { questions: true, scores: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(quizzes);
}

export async function DELETE(req: NextRequest) {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { quizId } = await req.json();
    if (!quizId) return NextResponse.json({ error: 'quizId manquant' }, { status: 400 });

    await prisma.quiz.delete({ where: { id: quizId } });
    return NextResponse.json({ success: true });
}
