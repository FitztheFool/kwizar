import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        attempts: {
          select: {
            score: true,
            createdAt: true,
            quiz: {
              select: {
                id: true,
                title: true,
                questions: { select: { points: true } },
              },
            },
          },
        },
        createdQuizzes: {
          where: { isPublic: true },
          select: {
            id: true,
            title: true,
            description: true,
            isPublic: true,
            createdAt: true,
            creatorId: true,
            category: { select: { name: true } },
            _count: { select: { questions: true } },
            questions: { select: { points: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const groupedScores = Object.values(
      user.attempts
        .filter((a): a is typeof a & { quiz: NonNullable<typeof a.quiz> } => a.quiz !== null)
        .reduce((acc, a) => {
          const quizId = a.quiz.id;
          const maxScore = a.quiz.questions.reduce((sum, q) => sum + q.points, 0);
          if (!acc[quizId] || a.score > acc[quizId].totalScore) {
            acc[quizId] = {
              quiz: { id: a.quiz.id, title: a.quiz.title },
              totalScore: a.score,
              completedAt: a.createdAt,
              maxScore,
              attempts: user.attempts.filter(s => s.quiz?.id === quizId).length,
            };
          }
          return acc;
        }, {} as Record<string, any>)
    ).sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    return NextResponse.json({
      id: user.id,
      name: user.username,
      totalScore: groupedScores.reduce((sum: number, s: any) => sum + s.totalScore, 0),
      quizzesCompleted: groupedScores.length,
      quizzesCreated: user.createdQuizzes.length,
      scores: groupedScores,
      quizzes: user.createdQuizzes,
    });
  } catch (error) {
    console.error('Erreur profil public:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
