import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const scores = await prisma.attempt.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            questions: { select: { points: true } },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Reformater pour garder la même structure qu'avant
    return NextResponse.json(
      Object.values(
        scores.reduce((acc, a) => {
          const quizId = a.quiz.id;
          const maxScore = a.quiz.questions.reduce((sum, q) => sum + q.points, 0);
          if (!acc[quizId] || a.score > acc[quizId].totalScore) {
            acc[quizId] = {
              quiz: { id: a.quiz.id, title: a.quiz.title },
              totalScore: a.score,
              completedAt: a.createdAt,
              maxScore,
              attempts: scores.filter(s => s.quiz.id === quizId).length, // ← nombre d'essais
            };
          }
          return acc;
        }, {} as Record<string, any>)
      ).sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    );

  } catch (error) {
    console.error('Erreur lors de la récupération des scores:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
