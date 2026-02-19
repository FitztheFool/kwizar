'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QuizCard from '@/components/QuizCard';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  _count: {
    questions: number;
  };
  creatorId?: string;
}

interface UserScore {
  quiz: {
    id: string;
    title: string;
  };
  totalScore: number;
  completedAt: string;
}

type TabType = 'available' | 'my-quizzes' | 'scores';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [myScores, setMyScores] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [quizPoints, setQuizPoints] = useState<Record<string, number>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent('/dashboard'));
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const quizzesRes = await fetch('/api/quiz');
      if (quizzesRes.ok) {
        const quizzesData = await quizzesRes.json();
        setQuizzes(quizzesData);
        const userQuizzes = quizzesData.filter(
          (quiz: Quiz) => quiz.creatorId === session?.user?.id
        );
        setMyQuizzes(userQuizzes);
        fetchQuizPoints(quizzesData);
      }

      const scoresRes = await fetch('/api/user/scores');
      if (scoresRes.ok) {
        const scoresData = await scoresRes.json();
        setMyScores(scoresData);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizPoints = async (quizzesList: Quiz[]) => {
    const pointsMap: Record<string, number> = {};
    await Promise.all(
      quizzesList.map(async (quiz) => {
        try {
          const res = await fetch(`/api/quiz/${quiz.id}`);
          if (res.ok) {
            const data = await res.json();
            const total = data.questions?.reduce((sum: number, q: any) => sum + (q.points || 0), 0) || 0;
            pointsMap[quiz.id] = total;
          }
        } catch (err) {
          console.error(`Erreur pour quiz ${quiz.id}:`, err);
        }
      })
    );
    setQuizPoints(pointsMap);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) return;
    try {
      const res = await fetch(`/api/quiz/${quizId}`, { method: 'DELETE' });
      if (res.ok) {
        setMyQuizzes(myQuizzes.filter((q) => q.id !== quizId));
        setQuizzes(quizzes.filter((q) => q.id !== quizId));
      } else {
        alert('Erreur lors de la suppression du quiz');
      }
    } catch (error) {
      alert('Erreur lors de la suppression du quiz');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 text-lg font-semibold">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const totalScore = myScores.reduce((sum, score) => sum + score.totalScore, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Plateforme de Quiz</h1>
              <p className="text-gray-600 text-lg">
                Bienvenue, <span className="font-semibold">{session.user?.name || session.user?.email}</span>
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="text-sm opacity-90 mb-2">Score Total</div>
              <div className="text-4xl font-bold">{totalScore}</div>
              <div className="text-xs opacity-80 mt-1">points gagnés</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="text-sm opacity-90 mb-2">Quiz Complétés</div>
              <div className="text-4xl font-bold">{myScores.length}</div>
              <div className="text-xs opacity-80 mt-1">sur {quizzes.length} disponibles</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="text-sm opacity-90 mb-2">Mes Quiz Créés</div>
              <div className="text-4xl font-bold">{myQuizzes.length}</div>
              <div className="text-xs opacity-80 mt-1">quiz personnalisés</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 border-b-2 border-gray-200">
            <div className="flex gap-6">
              <button onClick={() => setActiveTab('available')} className={`pb-4 px-2 font-semibold text-base transition-colors border-b-4 ${activeTab === 'available' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                Quiz disponibles
              </button>
              <button onClick={() => setActiveTab('my-quizzes')} className={`pb-4 px-2 font-semibold text-base transition-colors border-b-4 ${activeTab === 'my-quizzes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                Mes quiz
              </button>
              <button onClick={() => setActiveTab('scores')} className={`pb-4 px-2 font-semibold text-base transition-colors border-b-4 ${activeTab === 'scores' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                Mes scores
              </button>
            </div>
          </div>
        </div>

        {/* Tab: Quiz Disponibles — ✅ utilise QuizCard */}
        {activeTab === 'available' && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quiz disponibles</h2>
            {quizzes.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg mb-2">Aucun quiz disponible</p>
                <p className="text-gray-500">Les quiz apparaîtront ici</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => {
                  const userScore = myScores.find((s) => s.quiz.id === quiz.id);
                  const totalPoints = quizPoints[quiz.id] || 0;

                  return (
                    <QuizCard
                      key={quiz.id}
                      quiz={quiz}
                      currentUserId={session?.user?.id}
                      score={userScore?.totalScore}
                      totalPoints={totalPoints}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Mes Quiz */}
        {activeTab === 'my-quizzes' && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Mes quiz</h2>
              <Link href="/quiz/create" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                <span className="text-xl">+</span> Créer un quiz
              </Link>
            </div>
            {myQuizzes.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg mb-2">Aucun quiz créé</p>
                <p className="text-gray-500 mb-6">Créez votre premier quiz personnalisé</p>
                <Link href="/quiz/create" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg">
                  Créer un quiz
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myQuizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    currentUserId={session?.user?.id}
                    showActions={true}
                    onEdit={() => router.push(`/quiz/${quiz.id}/edit`)}
                    onDelete={() => handleDeleteQuiz(quiz.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Mes Scores */}
        {activeTab === 'scores' && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mes scores</h2>
            {myScores.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg mb-2">Aucun score enregistré</p>
                <p className="text-gray-500">Complétez des quiz pour voir vos scores ici</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myScores.map((score, index) => {
                  const totalPoints = quizPoints[score.quiz.id] || 0;
                  const isPerfect = totalPoints > 0 && score.totalScore === totalPoints;

                  return (
                    <div key={index} className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{score.quiz.title}</h4>
                        <p className="text-sm text-gray-500">
                          Complété le {new Date(score.completedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${isPerfect ? 'text-green-600' : 'text-orange-500'}`}>
                            {score.totalScore}{totalPoints > 0 ? `/${totalPoints}` : ''}
                          </div>
                          <div className="text-xs text-gray-500">points</div>
                        </div>
                        <Link href={`/quiz/${score.quiz.id}`} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg whitespace-nowrap">
                          Rejouer →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
