'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token') ?? '';

    const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleConfirm = async () => {
        setState('loading');
        try {
            const res = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            if (res.ok) {
                setState('success');
                setTimeout(() => router.push('/login?verified=1'), 2000);
            } else {
                const data = await res.json();
                setErrorMsg(data.error ?? 'Lien invalide ou expiré.');
                setState('error');
            }
        } catch {
            setErrorMsg('Erreur réseau.');
            setState('error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                {state === 'idle' && (
                    <>
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <EnvelopeIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirmer votre adresse email</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Cliquez sur le bouton ci-dessous pour activer votre compte Kwizar.</p>
                        <button
                            onClick={handleConfirm}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                        >
                            Confirmer mon compte
                        </button>
                    </>
                )}

                {state === 'loading' && (
                    <p className="text-gray-500 dark:text-gray-400">Vérification en cours…</p>
                )}

                {state === 'success' && (
                    <>
                        <div className="flex justify-center mb-4">
                            <CheckCircleIcon className="w-16 h-16 text-green-500" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Email confirmé !</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Vous allez être redirigé vers la page de connexion…</p>
                    </>
                )}

                {state === 'error' && (
                    <>
                        <div className="flex justify-center mb-4">
                            <XCircleIcon className="w-16 h-16 text-red-500" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lien invalide</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{errorMsg}</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            Retour à la connexion
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
