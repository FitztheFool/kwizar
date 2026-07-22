// src/components/Notifications/Toasts.tsx — in-app toast stack for lobby invites.
'use client';

import { useRouter } from 'next/navigation';
import { PlayIcon, XMarkIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '@/context/NotificationsContext';
import { GAME_LABEL_MAP } from '@/lib/gameConfig';
import { useGameLabels } from '@/hooks/useGameLabels';
import { notificationIcon } from '@/components/achievementIcons';

export default function Toasts() {
    const { toasts, dismissInvite, dismissToast, notifToasts, markNotifRead, dismissNotifToast } = useNotifications();
    const { labelOf } = useGameLabels();
    const router = useRouter();
    if (toasts.length === 0 && notifToasts.length === 0) return null;

    return (
        <div role="status" aria-live="polite" className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-[60] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
            {/* Toasts de succès débloqués */}
            {notifToasts.map(n => {
                const Icon = notificationIcon(n.type, n.icon);
                const go = () => {
                    markNotifRead(n.id);
                    if (n.link) router.push(n.link);
                };
                return (
                    <div
                        key={n.id}
                        className="flex items-start gap-3 p-3 rounded-2xl border border-yellow-300 dark:border-yellow-700/60 bg-white dark:bg-gray-900 shadow-xl animate-in slide-in-from-bottom-2"
                    >
                        <div className="shrink-0 w-9 h-9 rounded-full bg-yellow-500/15 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                            <Icon className="w-5 h-5" aria-hidden />
                        </div>
                        <button onClick={go} className="min-w-0 flex-1 text-left">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{n.title}</p>
                            {n.body && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.body}</p>}
                        </button>
                        <button
                            onClick={() => dismissNotifToast(n.id)}
                            aria-label="Fermer"
                            className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
            {toasts.map(inv => {
                const game = GAME_LABEL_MAP[inv.gameType] ? labelOf(inv.gameType) : 'une partie';
                const join = () => {
                    dismissInvite(inv.id);
                    router.push(`/lobby/create/${inv.lobbyId}`);
                };
                return (
                    <div
                        key={inv.id}
                        className="flex items-start gap-3 p-3 rounded-2xl border border-primary-200 dark:border-primary-800 bg-white dark:bg-gray-900 shadow-xl animate-in slide-in-from-bottom-2"
                    >
                        <div className="shrink-0 w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                            <UsersIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-900 dark:text-white">
                                <span className="font-bold">{inv.fromUsername ?? 'Un ami'}</span> t&apos;invite à jouer à{' '}
                                <span className="font-bold">{game}</span>
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <button
                                    onClick={join}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors"
                                >
                                    <PlayIcon className="w-4 h-4" />
                                    Rejoindre
                                </button>
                                <button
                                    onClick={() => dismissToast(inv.id)}
                                    className="px-3 py-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold transition-colors"
                                >
                                    Ignorer
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => dismissToast(inv.id)}
                            aria-label="Fermer"
                            className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
