// src/components/Header.tsx
'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { UserIcon } from '@heroicons/react/24/outline';
import NotificationCenter from '@/components/Notifications/NotificationCenter';
import UserMenu from '@/components/Layout/UserMenu';
export default function Header() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAnonymous = session?.user?.isAnonymous ?? false;
  const isGuestRole = session?.user?.role === 'GUEST';
  const isPending = session?.user?.status === 'PENDING';
  const showBanner = isGuestRole || (!isAnonymous && isPending);
  const isBlue = !isAnonymous && isPending;

  const bannerBase = "px-4 py-2 flex items-center justify-center gap-3 text-sm border-b";
  const bannerColor = isBlue
    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50"
    : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50";
  const textColor = isBlue ? "text-blue-700 dark:text-blue-300" : "text-amber-700 dark:text-amber-300";
  const linkColor = isBlue
    ? "text-blue-800 dark:text-blue-200 hover:text-blue-900 dark:hover:text-white"
    : "text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-white";

  return (
    <>
      {/* Banniere invite / en attente de verification */}
      {session && showBanner && (
        <div className={bannerBase + " " + bannerColor}>
          <span className={textColor}>
            <UserIcon className="w-4 h-4 inline mr-1" />
            {isBlue
              ? "Vérifiez votre boîte mail pour activer votre compte"
              : "Les comptes invités sont supprimés tous les jours à 7h."}
          </span>
          <Link href="/dashboard" className={"font-semibold underline underline-offset-2 transition-colors " + linkColor}>
            {isBlue ? "Renvoyer le mail →" : "Finaliser l'inscription →"}
          </Link>
        </div>
      )}
      <header className="sticky top-0 z-40 glass border-b border-black/5 dark:border-white/10">
        <div className="w-full px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <img src="/logo/icon-light.svg" alt="Kwizar" width={36} height={36}
                className="rounded-lg block dark:hidden" />
              <img src="/logo/icon-dark.svg" alt="Kwizar" width={36} height={36}
                className="rounded-lg hidden dark:block" />
              <span className="text-xl font-bold bg-accent-gradient bg-clip-text text-transparent">Kwizar</span>
            </Link>
            {isLoading ? (
              <div className="h-10 w-32 sm:w-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-2 sm:gap-3 ml-auto min-w-0">
                {!isAnonymous && !isGuestRole && <NotificationCenter />}
                <UserMenu />
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-auto shrink-0">
                <Link href="/login" className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Connexion</Link>
                <Link href="/register" className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors">Inscription</Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
