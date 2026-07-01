// src/app/leaderboard/[game]/page.tsx
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import LeaderboardView from '@/components/LeaderboardView';
import { GameType as Game, GAME_OPTIONS, GAME_CONFIG } from '@/lib/gameConfig';
import { getLeaderboardData } from '@/lib/leaderboard';
import { buildMetadata } from '@/lib/seo';

const VALID_GAMES = GAME_OPTIONS.map(g => g.value);

type Props = {
    params: Promise<{ game: string }>;
    searchParams: Promise<{ page?: string }>;
};

const LIMIT = 20;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { game } = await params;
    const label = GAME_CONFIG[game as keyof typeof GAME_CONFIG]?.label ?? 'Jeu';
    return buildMetadata({
        title: `Classement ${label}`,
        description: `Le classement des meilleurs joueurs de ${label} sur Kwizar.`,
        path: `/leaderboard/${game}`,
    });
}

export default async function LeaderboardPage({ params, searchParams }: Props) {
    const { game } = await params;
    const { page: pageParam } = await searchParams;

    if (!VALID_GAMES.includes(game as Game)) {
        redirect('/leaderboard/uno');
    }

    const page = Math.max(1, parseInt(pageParam ?? '1') || 1);

    // Classement (jeu + page) calculé côté serveur → rendu dans le HTML, aucun
    // fetch client. `key` remonte la vue à chaque changement de jeu/page → reseed.
    const initialData = await getLeaderboardData(game, page, LIMIT);

    return <LeaderboardView key={`${game}-${page}`} game={game as Game} initialData={initialData ?? undefined} />;
}
