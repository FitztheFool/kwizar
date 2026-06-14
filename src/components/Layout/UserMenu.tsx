'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import {
    ArrowRightStartOnRectangleIcon,
    UserCircleIcon,
    Cog6ToothIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '@/components/UserAvatar';

/**
 * Compact account menu for the top navbar — the single account entry point
 * (avatar + name → dropdown: Profil / Paramètres / Déconnexion).
 */
export default function UserMenu() {
    const { data: session } = useSession();
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    if (!session?.user) return null;

    const user = session.user;
    const name = user.username ?? user.name ?? user.email ?? 'Invité';
    const isAdmin = user.role === 'ADMIN';

    return (
        <div ref={wrapRef} className="relative shrink-0">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Menu du compte"
                className={`flex items-center gap-1.5 sm:gap-2 h-9 pl-1 pr-1.5 sm:pr-2 rounded-lg border transition-all ${open
                    ? 'border-primary-400 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-400'}`}
            >
                <UserAvatar seed={user.id ?? name} name={name} image={user.image} size="sm" shape="round" />
                <span className="hidden sm:block max-w-[120px] truncate text-sm font-semibold">
                    {name}
                </span>
                {isAdmin && (
                    <span className="hidden sm:inline text-[9px] font-black px-1 rounded bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30">ADMIN</span>
                )}
                <ChevronDownIcon className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 mt-2 w-56 rounded-xl p-1 animate-scale-in origin-top-right z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-glass-lg"
                >
                    <div className="px-2.5 py-2 mb-1 border-b border-gray-100 dark:border-gray-700">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</div>
                        {user.email && user.email !== name && (
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                        )}
                    </div>
                    <Link
                        href="/dashboard"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
                    >
                        <UserCircleIcon className="w-4 h-4 text-gray-400" />
                        Profil
                    </Link>
                    <Link
                        href="/settings"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
                    >
                        <Cog6ToothIcon className="w-4 h-4 text-gray-400" />
                        Paramètres
                    </Link>
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
                        Déconnexion
                    </button>
                </div>
            )}
        </div>
    );
}
