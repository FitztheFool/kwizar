import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
    title: 'Quiz disponibles',
    description: 'Parcourez et jouez aux quiz de la communauté Kwizar.',
    path: '/quiz/available',
});

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
