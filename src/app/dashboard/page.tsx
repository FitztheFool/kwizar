'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { plural } from '@/lib/utils';
import QuizCard from '@/components/QuizCard';
import QuizFilters from '@/components/QuizFilters';
import Pagination from '@/components/Pagination';
import AdminPanel from '@/components/AdminPanel';
import ScoreList from '@/components/ScoreList';

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

interface UnoStats {
    gamesPlayed: number;
    podiums: number;
    wins: number;
    top1: number;
    top2: number;
    top3: number;
    totalScore: number;
    bestPlacement: number | null;
    recentGames: { placement: number | null; createdAt: string }[];
    recentGamesTotal: number;
    recentGamesTotalPages: number;
}

type TabType = 'available' | 'my-quizzes' | 'quiz-score' | 'uno-score' | 'admin';

const PLACEMENT_EMOJI: Record<number, string> = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
};

const computePoints = (quizzesList: Quiz[]) => {
    const map: Record<string, number> = {};
    quizzesList.forEach((q: Quiz) => {
        map[q.id] =
            q.questions?.reduce((sum: number, qq: { points: number }) => sum + (qq.points || 0), 0) || 0;
    });
    return map;
};

const isTab = (v: string): v is TabType =>
    ['available', 'my-quizzes', 'quiz-score', 'uno-score', 'admin'].includes(v);

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    usePathname();

    const getTabFromHash = (): TabType => {
        if (typeof window === 'undefined') return 'available';
        const hash = window.location.hash.replace('#', '');
        return isTab(hash) ? hash : 'available';
    };

    const [activeTab, setActiveTab] = useState<TabType>(getTabFromHash);

    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [quizzesTotalPages, setQuizzesTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [page, setPage] = useState(1);

    const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
    const [myQuizzesTotal, setMyQuizzesTotal] = useState(0);
    const [myQuizzesTotalPages, setMyQuizzesTotalPages] = useState(0);
    const [mySearch, setMySearch] = useState('');
    const [myCategoryId, setMyCategoryId] = useState('');
    const [myPage, setMyPage] = useState(1);

    const [myScores, setMyScores] = useState<UserScore[]>([]);
    const [unoStats, setUnoStats] = useState<UnoStats | null>(null);
    const [scorePage, setScorePage] = useState(1);
    const [unoPage, setUnoPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [quizPoints, setQuizPoints] = useState<Record<string, number>>({});
    const [categories, setCategories] = useState<Category[]>([]);

    const totalQuizScore = myScores.reduce((sum, s) => sum + s.totalScore, 0);

    useEffect(() => {
        const handleHashChange = () => setActiveTab(getTabFromHash());
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchQuizzes = useCallback(
        async (p = 1, s = search, cat = categoryId) => {
            const params = new URLSearchParams({
                page: String(p),
                pageSize: String(PAGE_SIZE),
            });

            if (s) params.set('search', s);
            if (cat) params.set('categoryId', cat);

            const res = await fetch(`/api/quiz?${params}`);
            if (!res.ok) return;

            const data = await res.json();
            const list = Array.isArray(data) ? data : data.quizzes;

            setQuizzes(list);
            setQuizzesTotalPages(Array.isArray(data) ? Math.ceil(list.length / PAGE_SIZE) : data.totalPages);
            setQuizPoints((prev) => ({ ...prev, ...computePoints(list) }));
        },
        [search, categoryId]
    );

    const fetchMyQuizzes = useCallback(
        async (p = 1, s = mySearch, cat = myCategoryId) => {
            const params = new URLSearchParams({
                page: String(p),
                pageSize: String(PAGE_SIZE),
            });

            if (s) params.set('search', s);
            if (cat) params.set('categoryId', cat);
            if (session?.user?.id) params.set('creatorId', session.user.id);

            const res = await fetch(`/api/quiz?${params}`);
            if (!res.ok) return;

            const data = await res.json();
            const rawList = Array.isArray(data) ? data : data.quizzes;
            const list = rawList.filter((q: Quiz) => q.creatorId === session?.user?.id);

            setMyQuizzes(list);
            setMyQuizzesTotal(Array.isArray(data) ? list.length : data.total);
            setMyQuizzesTotalPages(Array.isArray(data) ? Math.ceil(list.length / PAGE_SIZE) : data.totalPages);
            setQuizPoints((prev) => ({ ...prev, ...computePoints(list) }));
        },
        [mySearch, myCategoryId, session?.user?.id]
    );

    const fetchUnoStats = useCallback(async (unoPageValue = 1) => {
        const params = new URLSearchParams({
            unoPage: String(unoPageValue),
            unoPageSize: String(PAGE_SIZE),
        });

        const res = await fetch(`/api/user/scores?${params}`);
        if (!res.ok) return;

        const data = await res.json();

        if (data?.quizScores) {
            setMyScores(Array.isArray(data.quizScores) ? data.quizScores : []);
        }

        if (data?.unoStats) {
            setUnoStats(data.unoStats);
        }
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const catRes = await fetch('/api/categories');

            await Promise.all([
                fetchQuizzes(1),
                fetchMyQuizzes(1),
                fetchUnoStats(1),
            ]);

            if (catRes.ok) {
                setCategories(await catRes.json());
            }
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    }, [fetchQuizzes, fetchMyQuizzes, fetchUnoStats]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=' + encodeURIComponent('/dashboard'));
        } else if (status === 'authenticated') {
            fetchData();
            setActiveTab(getTabFromHash());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, router, fetchData]);

    const handlePageChange = (p: number) => {
        setPage(p);
        fetchQuizzes(p, search, categoryId);
    };

    const handleMyPageChange = (p: number) => {
        setMyPage(p);
        fetchMyQuizzes(p, mySearch, myCategoryId);
    };

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

    const handleUnoPageChange = async (p: number) => {
        setUnoPage(p);
        await fetchUnoStats(p);
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
        } catch {
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

    const scoreTotalPages = Math.ceil(myScores.length / PAGE_SIZE);
    const paginatedScores = myScores.slice((scorePage - 1) * PAGE_SIZE, scorePage * PAGE_SIZE);

    return (
        <main className="flex-1 p-4 md:p-8">
            {activeTab === 'available' && (
                <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
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
                            <p className="text-gray-600 text-lg">Aucun quiz disponible</p>
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

                            <Pagination
                                currentPage={page}
                                totalPages={quizzesTotalPages}
                                onPageChange={handlePageChange}
                            />
                        </>
                    )}
                </div>
            )}

            {activeTab === 'admin' && session.user?.role === 'ADMIN' && <AdminPanel />}

            {activeTab === 'my-quizzes' && (
                <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {plural(myQuizzesTotal, 'Mon quiz', 'Mes quizzes')}
                        </h2>
                        <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                            {myQuizzesTotal}
                        </span>
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
                            <p className="text-gray-500">Créez votre premier quiz personnalisé</p>
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

                            <Pagination
                                currentPage={myPage}
                                totalPages={myQuizzesTotalPages}
                                onPageChange={handleMyPageChange}
                            />
                        </>
                    )}
                </div>
            )}

            {activeTab === 'quiz-score' && (
                <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Mes scores Quiz</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-blue-700 uppercase">
                                        Score total
                                    </p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900">{totalQuizScore} pts</p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl shadow-inner">
                                    🧠
                                </div>
                            </div>
                            <p className="mt-3 text-sm text-gray-500">Total cumulé sur tous tes quiz complétés</p>
                        </div>

                        <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
                                        {plural(myScores.length, 'Quiz complété', 'Quizzes complétés')}
                                    </p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900">{myScores.length}</p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-xl shadow-inner">
                                    ✅
                                </div>
                            </div>
                            <p className="mt-3 text-sm text-gray-500">Nombre de quiz terminés avec un score enregistré</p>
                        </div>

                        <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-violet-700 uppercase">
                                        {plural(myQuizzesTotal, 'Quiz créé', 'Quizzes créés')}
                                    </p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900">{myQuizzesTotal}</p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-xl shadow-inner">
                                    ✍️
                                </div>
                            </div>
                            <p className="mt-3 text-sm text-gray-500">Tes quiz publiés ou conservés dans ton espace</p>
                        </div>
                    </div>

                    {myScores.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-gray-600 text-lg mb-2">Aucun score enregistré</p>
                            <p className="text-gray-500">Complétez des quiz pour voir vos scores ici</p>
                        </div>
                    ) : (
                        <>
                            <ScoreList scores={paginatedScores} />
                            <Pagination
                                currentPage={scorePage}
                                totalPages={scoreTotalPages}
                                onPageChange={setScorePage}
                            />
                        </>
                    )}
                </div>
            )}

            {activeTab === 'uno-score' && (
                <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Mes scores UNO</h2>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 mb-6 text-sm text-gray-600">
                        <p className="font-semibold text-gray-700 mb-2">Système de points</p>
                        <div className="flex flex-wrap gap-3">
                            <span className="flex items-center gap-1.5">
                                🥇 <span className="font-bold text-gray-800">1ère place</span> — 20 pts
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1.5">
                                🥈 <span className="font-bold text-gray-800">2ème place</span> — 13 pts
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1.5">
                                🥉 <span className="font-bold text-gray-800">3ème place</span> — 6 pts
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1.5">
                                🎴 <span className="font-bold text-gray-800">Autres</span> — 2 pts
                            </span>
                        </div>
                    </div>

                    {!unoStats || unoStats.gamesPlayed === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-gray-600 text-lg mb-2">Aucune partie UNO jouée</p>
                            <p className="text-gray-500">Créez un lobby et lancez une partie !</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="bg-orange-50 rounded-xl p-4 text-center">
                                    <p className="text-xs text-orange-600 font-medium mb-1">Points totaux</p>
                                    <p className="text-2xl font-bold text-orange-700">{unoStats.totalScore ?? 0}</p>
                                </div>

                                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                                    <p className="text-xs text-yellow-600 font-medium mb-1">🥇 1ère place</p>
                                    <p className="text-2xl font-bold text-yellow-700">
                                        {unoStats.top1 ?? unoStats.wins}
                                    </p>
                                </div>

                                <div className="bg-amber-50 rounded-xl p-4 text-center">
                                    <p className="text-xs text-amber-600 font-medium mb-1">🥈 2ème place</p>
                                    <p className="text-2xl font-bold text-amber-700">{unoStats.top2 ?? 0}</p>
                                </div>
                            </div>

                            <div className="flex justify-center gap-4 mb-8">
                                <div className="bg-stone-50 rounded-xl p-4 text-center w-1/3">
                                    <p className="text-xs text-stone-600 font-medium mb-1">🥉 3ème place</p>
                                    <p className="text-2xl font-bold text-stone-700">{unoStats.top3 ?? 0}</p>
                                </div>

                                <div className="bg-blue-50 rounded-xl p-4 text-center w-1/3">
                                    <p className="text-xs text-blue-600 font-medium mb-1">Participations</p>
                                    <p className="text-2xl font-bold text-blue-700">{unoStats.gamesPlayed}</p>
                                </div>
                            </div>

                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                                Parties récentes
                            </h3>

                            <div className="space-y-2">
                                {unoStats.recentGames.map((game, i) => {
                                    const p = game.placement;
                                    const isPodium = p !== null && p <= 3;

                                    return (
                                        <div
                                            key={`${game.createdAt}-${i}`}
                                            className={`flex items-center justify-between px-4 py-3 rounded-lg border ${isPodium
                                                ? 'bg-yellow-50 border-yellow-200'
                                                : 'bg-gray-50 border-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl w-8 text-center">
                                                    {p !== null ? (PLACEMENT_EMOJI[p] ?? `#${p}`) : '—'}
                                                </span>

                                                <span className="text-sm font-medium text-gray-700">
                                                    {p === 1 ? 'Victoire' : p !== null ? `${p}ème place` : 'Partie terminée'}
                                                </span>
                                            </div>

                                            <span className="text-xs text-gray-400">
                                                {new Date(game.createdAt).toLocaleString('fr-FR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <Pagination
                                currentPage={unoPage}
                                totalPages={unoStats.recentGamesTotalPages}
                                onPageChange={handleUnoPageChange}
                            />
                        </>
                    )}
                </div>
            )}
        </main>
    );
}
