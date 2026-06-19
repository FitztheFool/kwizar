'use client';

import Link from 'next/link';
import { NoSymbolIcon } from '@heroicons/react/24/outline';

/** Écran affiché quand un jeu désactivé par l'admin est ouvert via une URL directe. */
export default function GameUnavailable() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center min-h-[60vh]">
            <NoSymbolIcon className="w-14 h-14 text-gray-400 dark:text-gray-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Jeu indisponible</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Ce jeu a été désactivé par l&apos;administrateur et n&apos;est pas accessible pour le moment.
            </p>
            <Link
                href="/"
                className="mt-2 rounded-lg bg-gray-600 hover:bg-gray-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
            >
                Retour à l&apos;accueil
            </Link>
        </div>
    );
}
