// src/app/quiz/my-quizzes/page.tsx
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// « Mes quiz » est désormais l'onglet #quizzes du dashboard.
// On conserve cette route comme simple redirection pour les anciens liens / favoris.
export default function MyQuizzesPage() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return;
        if (status === 'unauthenticated') {
            router.replace('/login?callbackUrl=/dashboard%23quizzes');
        } else {
            router.replace('/dashboard#quizzes');
        }
    }, [status, router]);

    return null;
}
