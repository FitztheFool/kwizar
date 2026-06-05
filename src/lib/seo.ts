// src/lib/seo.ts — central metadata builder (titles, description, OpenGraph, Twitter).
import type { Metadata } from 'next';

export const SITE_NAME = 'Kwizar';
export const SITE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
const DEFAULT_DESCRIPTION =
    'Jouez à des quiz et des jeux solo ou multijoueurs, défiez vos amis et grimpez au classement.';

export function buildMetadata({
    title,
    description = DEFAULT_DESCRIPTION,
    path = '',
}: {
    title?: string;
    description?: string;
    path?: string;
} = {}): Metadata {
    const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — jeux & quiz en ligne`;
    const url = `${SITE_URL}${path}`;
    return {
        title: fullTitle,
        description,
        alternates: { canonical: url },
        openGraph: {
            title: fullTitle,
            description,
            url,
            siteName: SITE_NAME,
            type: 'website',
            locale: 'fr_FR',
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description,
        },
    };
}
