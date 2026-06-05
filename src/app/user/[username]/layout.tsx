import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata(
    { params }: { params: Promise<{ username: string }> },
): Promise<Metadata> {
    const { username } = await params;
    const name = decodeURIComponent(username);
    return buildMetadata({
        title: `Profil de ${name}`,
        description: `Statistiques, scores et quiz de ${name} sur Kwizar.`,
        path: `/user/${username}`,
    });
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
