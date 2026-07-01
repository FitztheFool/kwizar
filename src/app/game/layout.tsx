import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import SoloGameGuard from '@/components/SoloGameGuard';

export const metadata: Metadata = buildMetadata({
    title: 'Jeux solo',
    description: 'Snake, Tetris, Pac-Man, 2048, Sutom… jouez et battez le record du classement.',
});

export default function Layout({ children }: { children: React.ReactNode }) {
    return <SoloGameGuard>{children}</SoloGameGuard>;
}
