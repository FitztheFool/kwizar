'use client';

import { useEffect } from 'react';

// Root error boundary (App Router). Catches render/runtime errors in any route
// and offers a retry instead of a blank screen.
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Intentional error-boundary logging.
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Une erreur est survenue</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Désolé, quelque chose s&apos;est mal passé. Vous pouvez réessayer.
            </p>
            <button
                onClick={reset}
                className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
            >
                Réessayer
            </button>
        </div>
    );
}
