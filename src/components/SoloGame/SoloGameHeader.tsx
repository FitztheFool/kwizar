import Link from 'next/link';
import { TrophyIcon } from '@heroicons/react/24/solid';

interface Props {
    leaderboardHref: string;
    children: React.ReactNode;
    maxWidthClass?: string;
}

export default function SoloGameHeader({ leaderboardHref, children, maxWidthClass = 'max-w-[440px]' }: Props) {
    const linkClass = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-all';
    return (
        <div className={`w-full ${maxWidthClass} flex items-center justify-between mb-5`}>
            <Link href="/" className={linkClass}>← Accueil</Link>
            <div className="flex items-center gap-2 select-none">{children}</div>
            <Link href={leaderboardHref} className={linkClass}>
                <TrophyIcon className="w-4 h-4" /><span className="hidden sm:inline">Classement</span>
            </Link>
        </div>
    );
}
