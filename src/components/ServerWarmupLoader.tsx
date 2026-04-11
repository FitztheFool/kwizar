// src/components/ServerWarmupLoader.tsx
export default function ServerWarmupLoader({ error }: { error?: boolean }) {
    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <div className="text-center max-w-sm">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Serveur indisponible</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Le serveur n&apos;a pas pu démarrer. Réessaie dans quelques secondes.</p>
                <button onClick={() => window.location.reload()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                    Réessayer
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <div className="text-center max-w-sm w-full">
                <div className="text-4xl mb-4 animate-pulse">🔄</div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Démarrage du serveur…</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Environ 30–45 secondes</p>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <style>{`@keyframes warmup { from { width: 0% } to { width: 92% } }`}</style>
                    <div className="h-1.5 bg-blue-500 rounded-full" style={{ animation: 'warmup 45s linear forwards' }} />
                </div>
            </div>
        </div>
    );
}
