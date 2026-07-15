// components/MembersOnlyBanner.tsx
'use client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { LockClosedIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

export function MembersOnlyBanner({ isPending = false }: { isPending?: boolean }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (searchParams.get('error') === 'members_only') {
            setVisible(true);

            // Nettoie le query param sans recharger la page
            const params = new URLSearchParams(searchParams.toString());
            params.delete('error');
            const clean = params.size ? `${pathname}?${params}` : pathname;
            router.replace(clean, { scroll: false });

            // Disparaît après 5 s
            const t = setTimeout(() => setVisible(false), 5000);
            return () => clearTimeout(t);
        }
    }, [searchParams]);

    if (!visible) return null;

    return (
        <div
            role="alert"
            className={`flex items-center gap-3 rounded-xl border px-5 py-4 shadow-sm ${isPending
                ? 'border-info/30 bg-info/10 text-info'
                : 'border-warning/30 bg-warning/10 text-warning'}`}
        >
            <LockClosedIcon className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
                Seuls les membres inscrits peuvent créer ou générer un quiz.
            </p>
            <button
                onClick={() => setVisible(false)}
                className={`ml-auto transition hover:brightness-125 ${isPending ? 'text-info' : 'text-warning'}`}
                aria-label="Fermer"
            >
                <XMarkIcon className="w-4 h-4" />
            </button>
        </div>
    );
}
