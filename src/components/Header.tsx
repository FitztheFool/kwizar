'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
export default function Header() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-3xl font-bold text-gray-900 dark:text-white">
            🎯 Quiz App
          </Link>
          {isLoading ? (
            <div className="h-10 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ) : session ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white font-semibold">
                Bonjour, {session.user.username ?? session.user.email}
              </Link>
              {session.user.role === 'ADMIN' && (
                <span className="text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded">
                  ADMIN
                </span>
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                Se déconnecter
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="btn-secondary">Connexion</Link>
              <Link href="/register" className="btn-primary">Inscription</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
