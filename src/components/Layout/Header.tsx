// src/components/Header.tsx
'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
export default function Header() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="w-full px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-3xl font-bold text-gray-900 dark:text-white">
            🎯 Quiz App
          </Link>
          {isLoading ? (
            <div className="h-10 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ) : session ? (
            <div className="flex items-center gap-4 ml-auto">
              <Link href="/dashboard" className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white font-semibold">
                Bonjour,{' '}
                <span className={session.user.role === 'ADMIN'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded text-xs font-semibold'
                  : ''}>
                  {session.user.username ?? session.user.email}
                </span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md font-medium transition-all shadow-sm hover:shadow"
              >
                Se déconnecter
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 ml-auto">
              <Link href="/login" className="btn-secondary">Connexion</Link>
              <Link href="/register" className="btn-primary">Inscription</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
