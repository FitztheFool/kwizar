import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import prisma from '@/lib/prisma';

export async function generateMetadata(
    { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
    const { id } = await params;
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id },
            select: { title: true, description: true },
        });
        if (quiz) {
            return buildMetadata({
                title: quiz.title,
                description: quiz.description ?? `Jouez au quiz « ${quiz.title} » sur Kwizar.`,
                path: `/quiz/${id}`,
            });
        }
    } catch {
        /* ignore — fall through to generic */
    }
    return buildMetadata({ title: 'Quiz', path: `/quiz/${id}` });
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
