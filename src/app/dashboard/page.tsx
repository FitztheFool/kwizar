'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import QuizCard from '@/components/QuizCard';
import QuizFilters from '@/components/QuizFilters';
import Pagination from '@/components/Pagination';
import AdminPanel from '@/components/AdminPanel';
import ScoreList from '@/components/ScoreList';
import CreateLobbyButton from '@/components/CreateLobbyButton';

const PAGE_SIZE = 6;

interface Category {
  id: string;
  name: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  createdAt?: string;
  _count: { questions: number };
  creatorId?: string;
  category?: { name: string } | null;
  questions?: { points: number }[];
}

interface UserScore {
  quiz: { id: string; title: string };
  totalScore: number;
  completedAt: string;
  maxScore: number;
  attempts: number;
}

type TabType = 'available' | 'my-quizzes' | 'scores' | 'admin';

const computePoints = (quizzesList: Quiz[]) => {
  const map: Record<string, number> = {};
  quizzesList.forEach((q: any) => {
    map[q.id] = q.questions?.reduce((sum: number, qq: any) => sum + (qq.points || 0), 0) || 0;
  });
  return map;
};

const isTab = (v: string): v is TabType => ['available', 'my-quizzes', 'scores', 'admin'].includes(v);

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  usePathname(); // juste pour s'aligner avec Next (pas indispensable ici)

  const getTabFromHash = (): TabType => {
    if (typeof window === 'undefined') return 'available';
    const hash = window.location.hash.replace('#', '');
    return isTab(hash) ? (hash as TabType) : 'available';
  };

  // Onglet (sync avec hash)
  const [activeTab, setActiveTab] = useState<TabType>(getTabFromHash);

  // Quiz disponibles
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizzesTotal, setQuizzesTotal] = useState(0);
  const [quizzesTotalPages, setQuizzesTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);

  // Mes quiz
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [myQuizzesTotal, setMyQuizzesTotal] = useState(0);
  const [myQuizzesTotalPages, setMyQuizzesTotalPages] = useState(0);
  const [mySearch, setMySearch] = useState('');
  const [myCategoryId, setMyCategoryId] = useState('');
  const [myPage, setMyPage] = useState(1);

  // Scores
  const [myScores, setMyScores] = useState<UserScore[]>([]);
  const [scorePage, setScorePage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [quizPoints, setQuizPoints] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<Category[]>([]);

  const setTab = (tab: TabType) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${tab}`);
    }
  };

  // Écoute les changements de hash (si l’utilisateur modifie l’URL ou utilise back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Fetch quiz disponibles (paginé) ────────────────────────────────────
  const fetchQuizzes = useCallback(async (p = 1, s = search, cat = categoryId) => {
    const params = new URLSearchParams({ page: String(p), pageSize: String(PAGE_SIZE) });
    if (s) params.set('search', s);
    if (cat) params.set('categoryId', cat);
    const res = await fetch(`/api/quiz?${params}`);
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.quizzes;
      setQuizzes(list);
      setQuizzesTotal(Array.isArray(data) ? list.length : data.total);
      setQuizzesTotalPages(Array.isArray(data) ? Math.ceil(list.length / PAGE_SIZE) : data.totalPages);
      setQuizPoints((prev) => ({ ...prev, ...computePoints(list) }));
    }
  }, []);

  // ─── Fetch mes quiz (paginé) ─────────────────────────────────────────────
  const fetchMyQuizzes = useCallback(
    async (p = 1, s = mySearch, cat = myCategoryId) => {
      const params = new URLSearchParams({ page: String(p), pageSize: String(PAGE_SIZE) });
      if (s) params.set('search', s);
      if (cat) params.set('categoryId', cat);
      if (session?.user?.id) params.set('creatorId', session.user.id);

      const res = await fetch(`/api/quiz?${params}`);
      if (res.ok) {
        const data = await res.json();
        const list = (Array.isArray(data) ? data : data.quizzes).filter(
          (q: Quiz) => q.creatorId === session?.user?.id
        );
        setMyQuizzes(list);
        setMyQuizzesTotal(Array.isArray(data) ? list.length : data.total);
        setMyQuizzesTotalPages(Array.isArray(data) ? Math.ceil(list.length / PAGE_SIZE) : data.totalPages);
        setQuizPoints((prev) => ({ ...prev, ...computePoints(list) }));
      }
    },
    [session?.user?.id]
  );

  // ─── Chargement initial ───────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [scoresRes, catRes] = await Promise.all([fetch('/api/user/scores'), fetch('/api/categories')]);
      await Promise.all([fetchQuizzes(1), fetchMyQuizzes(1)]);
      if (scoresRes.ok) setMyScores(await scoresRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchQuizzes, fetchMyQuizzes]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent('/dashboard'));
    } else if (status === 'authenticated') {
      fetchData();
      // au premier rendu côté client, si URL a un hash, on le respecte
      setActiveTab(getTabFromHash());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router, fetchData]);

  // ─── Handlers pagination ──────────────────────────────────────────────────
  const handlePageChange = (p: number) => {
    setPage(p);
    fetchQuizzes(p, search, categoryId);
  };

  const handleMyPageChange = (p: number) => {
    setMyPage(p);
    fetchMyQuizzes(p, mySearch, myCategoryId);
  };

  // ─── Handlers filtres ─────────────────────────────────────────────────────
  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
    fetchQuizzes(1, v, categoryId);
  };

  const handleCategoryChange = (v: string) => {
    setCategoryId(v);
    setPage(1);
    fetchQuizzes(1, search, v);
  };

  const handleMySearchChange = (v: string) => {
    setMySearch(v);
    setMyPage(1);
    fetchMyQuizzes(1, v, myCategoryId);
  };

  const handleMyCategoryChange = (v: string) => {
    setMyCategoryId(v);
    setMyPage(1);
    fetchMyQuizzes(1, mySearch, v);
  };

  // ─── Suppression ─────────────────────────────────────────────────────────
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
    } catch {
      alert('Erreur lors de la suppression du quiz');
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
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
  const scoreTotalPages = Math.ceil(myScores.length / PAGE_SIZE);
  const paginatedScores = myScores.slice((scorePage - 1) * PAGE_SIZE, scorePage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
            <p className="text-sm opacity-70">Gère tes quiz et lance un lobby</p>
          </div>

          <CreateLobbyButton />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-sm opacity-90 mb-2">Score Total</div>
            <div className="text-4xl font-bold">{totalScore}</div>
            <div className="text-xs opacity-80 mt-1">points gagnés</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-sm opacity-90 mb-2">Quiz Complétés</div>
            <div className="text-4xl font-bold">{myScores.length}</div>
            <div className="text-xs opacity-80 mt-1">sur {quizzesTotal} disponibles</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-sm opacity-90 mb-2">Mes Quiz Créés</div>
            <div className="text-4xl font-bold">{myQuizzesTotal}</div>
            <div className="text-xs opacity-80 mt-1">quiz personnalisés</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b-2 border-gray-200">
          <div className="flex gap-6">
            {(['available', 'my-quizzes', 'scores'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setTab(tab)}
                className={`pb-4 px-2 font-semibold text-base transition-colors border-b-4 ${activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab === 'available' ? 'Quiz disponibles' : tab === 'my-quizzes' ? 'Mes quiz' : 'Mes scores'}
              </button>
            ))}

            {session.user?.role === 'ADMIN' && (
              <button
                onClick={() => setTab('admin')}
                className={`pb-4 px-2 font-semibold text-base transition-colors border-b-4 ${activeTab === 'admin'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                🛡️ Admin
              </button>
            )}
          </div>
        </div>

        {/* Tab: Quiz disponibles */}
        {activeTab === 'available' && (
          <div id="available" className="bg-white rounded-xl shadow-lg p-6 md:p-8 mt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz disponibles</h2>

            <div className="mb-6">
              <QuizFilters
                search={search}
                onSearchChange={handleSearchChange}
                categoryId={categoryId}
                onCategoryChange={handleCategoryChange}
                categories={categories}
                onQuizzesChange={(data) => {
                  setQuizzes(data);
                  setPage(1);
                  setQuizPoints((prev) => ({ ...prev, ...computePoints(data) }));
                }}
              />
            </div>

            {quizzes.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg mb-2">Aucun quiz disponible</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {quizzes.map((quiz) => {
                    const userScore = myScores.find((s) => s.quiz.id === quiz.id);
                    return (
                      <QuizCard
                        key={quiz.id}
                        quiz={quiz}
                        currentUserId={session?.user?.id}
                        score={userScore?.totalScore}
                        totalPoints={quizPoints[quiz.id] || 0}
                      />
                    );
                  })}
                </div>

                <Pagination currentPage={page} totalPages={quizzesTotalPages} onPageChange={handlePageChange} />
              </>
            )}
          </div>
        )}

        {/* Tab: Panel Admin */}
        {activeTab === 'admin' && session.user?.role === 'ADMIN' && (
          <div id="admin" className="mt-6">
            <AdminPanel />
          </div>
        )}

        {/* Tab: Mes quiz */}
        {activeTab === 'my-quizzes' && (
          <div id="my-quizzes" className="bg-white rounded-xl shadow-lg p-6 md:p-8 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Mes quiz</h2>
            </div>

            <div className="mb-6">
              <QuizFilters
                search={mySearch}
                onSearchChange={handleMySearchChange}
                categoryId={myCategoryId}
                onCategoryChange={handleMyCategoryChange}
                categories={categories}
                onQuizzesChange={(data) => {
                  setMyQuizzes(data.filter((q) => q.creatorId === session?.user?.id));
                  setMyPage(1);
                  setQuizPoints((prev) => ({ ...prev, ...computePoints(data) }));
                }}
              />
            </div>

            {myQuizzes.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg mb-2">Aucun quiz créé</p>
                <p className="text-gray-500 mb-6">Créez votre premier quiz personnalisé</p>
                <div className="flex gap-3 justify-center">
                  <Link
                    href="/quiz/generate"
                    className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    Générer un quiz
                  </Link>
                  <Link
                    href="/quiz/create"
                    className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    Créer un quiz
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
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

                <Pagination currentPage={myPage} totalPages={myQuizzesTotalPages} onPageChange={handleMyPageChange} />
              </>
            )}
          </div>
        )}

        {/* Tab: Mes scores */}
        {activeTab === 'scores' && (
          <div id="scores" className="bg-white rounded-xl shadow-lg p-6 md:p-8 mt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mes scores</h2>

            {myScores.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg mb-2">Aucun score enregistré</p>
                <p className="text-gray-500">Complétez des quiz pour voir vos scores ici</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <ScoreList scores={paginatedScores} />
                </div>

                <Pagination currentPage={scorePage} totalPages={scoreTotalPages} onPageChange={setScorePage} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
