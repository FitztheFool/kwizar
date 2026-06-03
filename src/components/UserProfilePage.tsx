// src/components/UserProfilePage.tsx
'use client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MyQuizzesPanel from '@/components/Quiz/MyQuizzesPanel';
import UserStats from '@/components/UserStats';
import { MembersOnlyBanner } from '@/components/MembersOnlyBanner';
import UserAvatar from '@/components/UserAvatar';
import FriendButton from '@/components/Friends/FriendButton';
import { ChartBarIcon, BookOpenIcon, Cog6ToothIcon, EnvelopeIcon, CheckIcon, PlayIcon, PlusIcon } from '@heroicons/react/24/outline';

// ── Bloc finaliser le compte ───────────────────────────────────────────────────

function ClaimAccountBlock({ currentUsername, isPendingVerification = false }: { currentUsername: string; isPendingVerification?: boolean }) {
    const { data: session, update } = useSession();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState(currentUsername);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isPending, setIsPending] = useState(isPendingVerification);
    const [pendingEmail, setPendingEmail] = useState(isPendingVerification ? (session?.user?.email ?? '') : '');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendRateLimited, setResendRateLimited] = useState(false);

    const handleClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/guest/claim', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? 'Erreur'); return; }
            setPendingEmail(email);
            setIsPending(true);
            setResendCooldown(180);
            await update();
            const interval = setInterval(() => {
                setResendCooldown(c => { if (c <= 1) { clearInterval(interval); return 0; } return c - 1; });
            }, 1000);
        } catch {
            setError('Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!pendingEmail || resendCooldown > 0) return;
        setResendLoading(true);
        try {
            const res = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: pendingEmail }),
            });
            const rateLimited = res.status === 429;
            setResendRateLimited(rateLimited);
            const cooldown = rateLimited ? 180 : res.ok ? 180 : 0;
            if (cooldown > 0) {
                setResendCooldown(cooldown);
                const interval = setInterval(() => {
                    setResendCooldown(c => { if (c <= 1) { clearInterval(interval); return 0; } return c - 1; });
                }, 1000);
            }
        } catch {
            // silencieux
        } finally {
            setResendLoading(false);
        }
    };

    const wrapperCls = isPending
        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700/60'
        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/60';
    const titleCls = isPending ? 'text-primary-800 dark:text-primary-200' : 'text-amber-800 dark:text-amber-200';
    const subtitleCls = isPending ? 'text-primary-700 dark:text-primary-300' : 'text-amber-700 dark:text-amber-300';

    return (
        <div className={`border rounded-2xl px-5 py-4 ${wrapperCls}`}>
            <h2 className={`text-sm font-bold mb-1 ${titleCls}`}>Finaliser votre inscription</h2>
            <p className={`text-xs mb-4 ${subtitleCls}`}>
                {isPending
                    ? 'Vos parties sont déjà sauvegardées. Validez votre compte via le mail d\'inscription.'
                    : 'Vos parties sont déjà sauvegardées. Ajoutez un email et un mot de passe pour ne pas perdre votre compte.'}
            </p>
            <form onSubmit={handleClaim} className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Pseudo"
                    maxLength={30}
                    disabled={isPending}
                    className="input-field text-sm flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <input
                    type="email"
                    value={isPending ? pendingEmail : email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    required={!isPending}
                    disabled={isPending}
                    className="input-field text-sm flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <input
                    type="password"
                    value={isPending ? '••••••' : password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mot de passe (6 car. min.)"
                    required={!isPending}
                    minLength={6}
                    disabled={isPending}
                    className="input-field text-sm flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {!isPending && (
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary text-sm px-4 py-2 whitespace-nowrap"
                    >
                        {loading ? 'Enregistrement...' : 'Valider'}
                    </button>
                )}
            </form>
            {isPending && (
                <div className="mt-3 flex items-center gap-3">
                    {resendCooldown > 0 ? (
                        <p className="text-xs text-primary-600 dark:text-primary-400">
                            {resendRateLimited ? 'Trop de tentatives —' : <>Lien envoyé <CheckIcon className="w-3.5 h-3.5 inline-block text-green-500 align-middle" /> —</>} Renvoi possible dans{' '}
                            <span className="font-semibold">{Math.floor(resendCooldown / 60)}:{String(resendCooldown % 60).padStart(2, '0')}</span>
                        </p>
                    ) : (
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resendLoading}
                            className="flex items-center gap-1.5 text-s font-semibold text-primary-600 dark:text-primary-400 underline hover:no-underline disabled:opacity-50"
                        >
                            <EnvelopeIcon className="w-3.5 h-3.5" />
                            {resendLoading ? 'Envoi…' : 'Renvoyer le mail'}
                        </button>
                    )}
                </div>
            )}
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
    );
}

interface Quiz {
    id: string;
    title: string;
    description: string | null;
    isPublic: boolean;
    imageUrl?: string | null;
    createdAt?: string;
    creatorId?: string;
    creator?: { id: string; username: string } | null;
    _count: { questions: number };
    category?: { name: string } | null;
    questions?: { points: number }[];
}

interface ProfileData {
    id: string;
    name: string | null;
    image?: string | null;
    totalScore: number;
    quizzesCompleted: number;
    quizzesCreated: number;
    quizzes: Quiz[];
}

type TabType = 'stats' | 'quizzes';
const VALID_TABS: TabType[] = ['stats', 'quizzes'];
const isTabType = (v: string): v is TabType => (VALID_TABS as string[]).includes(v);

interface Props {
    username: string;
    isOwnProfile?: boolean;
}

export default function UserProfilePage({ username, isOwnProfile = false }: Props) {
    const router = useRouter();
    const { data: session } = useSession();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>(() => {
        if (typeof window === 'undefined') return 'stats';
        const hash = window.location.hash.replace('#', '');
        return isTabType(hash) ? hash : 'stats';
    });

    useEffect(() => {
        let lastHash = window.location.hash;
        const sync = () => {
            if (window.location.hash === lastHash) return;
            lastHash = window.location.hash;
            const hash = lastHash.replace('#', '');
            setActiveTab(isTabType(hash) ? hash : 'stats');
        };
        window.addEventListener('hashchange', sync);
        const interval = setInterval(sync, 150);
        return () => {
            window.removeEventListener('hashchange', sync);
            clearInterval(interval);
        };
    }, []);

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        const { pathname, search } = window.location;
        history.replaceState(null, '', `${pathname}${search}#${tab}`);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`/api/user/${username}`);
                if (!res.ok) { setNotFound(true); setLoading(false); return; }
                const data = await res.json();
                setProfile(data);
            } catch {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [username]);

    if (loading) return (
        <div className="flex-1 flex items-center justify-center p-8">
            <LoadingSpinner fullScreen={false} message="Chargement du profil..." />
        </div>
    );

    if (notFound || !profile) return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
            <div className="text-center">
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">Joueur introuvable</p>
                <p className="text-gray-500 mb-6">Ce profil n'existe pas ou n'est pas accessible.</p>
                <button onClick={() => router.back()} className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold">← Retour</button>
            </div>
        </div>
    );

    const displayName = profile.name || username;

    return (
        <main className="flex-1 bg-[#F7F1E7] text-[#251C15]">
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-4">
                {/* ── Bannière members only ── */}
                {isOwnProfile && <MembersOnlyBanner isPending={session?.user?.role !== 'GUEST' && session?.user?.status === 'PENDING'} />}

                {/* ── Bloc finaliser le compte (invité) ── */}
                {isOwnProfile && (session?.user?.role === 'GUEST' || (!session?.user?.isAnonymous && session?.user?.status === 'PENDING')) && (
                    <ClaimAccountBlock currentUsername={username} isPendingVerification={!session?.user?.isAnonymous && session?.user?.status === 'PENDING'} />
                )}

                {/* ── Header joueur : action directe ── */}
                <section className="rounded-[28px] border border-[#E2D3BE] bg-[#FFFCF5] shadow-[0_18px_45px_rgba(37,28,21,0.06)] overflow-hidden">
                    <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr] items-stretch">
                        <div className="px-5 py-5 md:px-7 md:py-6">
                            <div className="inline-flex items-center rounded-full border border-[#D8C6AC] bg-[#F7F1E7] px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-[#8A6A37] mb-3">
                                Espace joueur
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                                <div>
                                    <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight text-[#251C15] leading-none">
                                        Jouez !
                                    </h1>
                                    <p className="mt-2 max-w-xl text-sm md:text-base text-[#766A5D]">
                                        Accède directement aux tables ouvertes, puis retrouve tes statistiques et tes quiz ici.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 shrink-0">
                                    <a
                                        href="/lobby/all"
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1F5B45] px-5 py-2.5 text-sm font-black text-[#FFF8E8] shadow-[0_10px_22px_rgba(31,91,69,0.18)] transition hover:bg-[#174735]"
                                    >
                                        <PlayIcon className="w-4 h-4" />
                                        JOUER
                                    </a>
                                    <a
                                        href="/lobby/create"
                                        className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D8C6AC] bg-[#FFFCF5] px-5 py-2.5 text-sm font-bold text-[#251C15] transition hover:border-[#C58B2B] hover:bg-[#FFF8E8]"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Créer une table
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="border-t lg:border-t-0 lg:border-l border-[#E2D3BE] bg-[#F4E8D8]/70 px-5 py-5 md:px-6 md:py-6 flex items-center">
                            <div className="w-full flex items-center gap-3">
                                <UserAvatar
                                    seed={profile.id}
                                    name={displayName}
                                    image={profile.image}
                                    size="md"
                                    shape="square"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8A6A37]">
                                        Profil joueur
                                    </p>
                                    <h2 className="text-lg font-black text-[#251C15] truncate">
                                        {displayName}
                                    </h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Navigation profil ── */}
                <div className="rounded-2xl border border-[#E2D3BE] bg-[#FFFCF5] px-4 py-3 shadow-[0_10px_30px_rgba(37,28,21,0.04)]">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex gap-1 rounded-full border border-[#D8C6AC] bg-[#F7F1E7] p-1">
                            {(['stats', 'quizzes'] as TabType[]).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => handleTabChange(tab)}
                                    className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-black transition-all ${activeTab === tab
                                        ? 'bg-[#1F5B45] text-[#FFF8E8] shadow-sm'
                                        : 'text-[#766A5D] hover:text-[#251C15]'
                                        }`}
                                >
                                    {tab === 'stats' ? <><ChartBarIcon className="w-3.5 h-3.5 mr-1.5" />Stats</> : <><BookOpenIcon className="w-3.5 h-3.5 mr-1.5" />Quiz</>}
                                </button>
                            ))}
                        </div>
                        <FriendButton username={username} isOwnProfile={isOwnProfile} />
                        <div className="ml-auto flex items-center gap-2">
                            {!isOwnProfile && (
                                <button
                                    onClick={() => router.back()}
                                    className="rounded-full border border-[#D8C6AC] bg-[#FFFCF5] px-4 py-2 text-xs font-bold text-[#766A5D] transition hover:border-[#C58B2B] hover:text-[#251C15]"
                                >
                                    ← Retour
                                </button>
                            )}
                            {isOwnProfile && (
                                <a
                                    href="/settings"
                                    className="rounded-full border border-[#D8C6AC] bg-[#FFFCF5] px-4 py-2 text-xs font-bold text-[#766A5D] transition hover:border-[#C58B2B] hover:text-[#251C15]"
                                >
                                    <Cog6ToothIcon className="w-3.5 h-3.5 inline mr-1" />Paramètres
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Contenu ── */}
                {activeTab === 'stats' && <UserStats username={username} />}

                {activeTab === 'quizzes' && (
                    isOwnProfile ? (
                        <MyQuizzesPanel />
                    ) : (
                        <MyQuizzesPanel
                            creatorId={profile.id}
                            title={`Quiz de ${displayName}`}
                            emptyTitle="Aucun quiz public"
                            emptySubtitle=""
                        />
                    )
                )}
            </div>
        </main>
    );
}
