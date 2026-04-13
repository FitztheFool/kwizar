// src/components/ServerWarmupLoader.tsx
export default function ServerWarmupLoader({ error }: { error?: boolean }) {
    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <div className="text-center max-w-sm">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Serveur indisponible</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Le serveur n&apos;a pas pu démarrer. Réessaie dans quelques secondes.</p>
                <button onClick={() => window.location.reload()}
                    className="px-5 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold rounded-xl transition-colors">
                    Réessayer
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <div className="text-center max-w-sm w-full">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-500 dark:text-white/60 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Démarrage du serveur…</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Environ 45–90 secondes</p>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1 overflow-hidden">
                    <style>{`@keyframes warmup { from { width: 0% } to { width: 92% } }`}</style>
                    <div className="h-1 bg-gray-500 dark:bg-white/50 rounded-full" style={{ animation: 'warmup 90s linear forwards' }} />
                </div>
            </div>
        </div>
    );
}
