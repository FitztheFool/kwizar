// src/app/layout.tsx
import type { Metadata } from 'next';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import { Space_Grotesk, DM_Sans, Press_Start_2P } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import AppLayout from '@/components/Layout/AppLayout';
import { ChatProvider } from '@/context/ChatContext';
import { FriendsProvider } from '@/context/FriendsContext';
import { MessagesProvider } from '@/context/MessagesContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { CommandPaletteProvider } from '@/context/CommandPaletteContext';
import DeferredOverlays from '@/components/Layout/DeferredOverlays';
import GridBackground from '@/components/GridBackground';

const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    variable: '--font-heading',
    weight: ['400', '500', '600', '700'],
    display: 'swap',
});

const dmSans = DM_Sans({
    subsets: ['latin'],
    variable: '--font-body',
    weight: ['400', '500', '600'],
    display: 'swap',
});

// Arcade — 7 pages de jeu la déclaraient en `fontFamily` inline sans jamais la charger :
// tout s'affichait en Courier New. Chargée ici (next/font auto-héberge → conforme à la
// CSP `font-src 'self'`). Réservée aux titres de jeu et aux gros scores : illisible en
// petit corps, c'est une fonte d'enseigne, pas de texte.
const pressStart = Press_Start_2P({
    subsets: ['latin'],
    variable: '--font-arcade',
    weight: ['400'],
    display: 'swap',
});

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    ...buildMetadata(),
    icons: {
        icon: [
            { url: '/logo/favicon.ico', sizes: 'any' },
            { url: '/logo/icon-light.svg', type: 'image/svg+xml' },
        ],
        apple: { url: '/logo/icon-light-192.png', sizes: '192x192' },
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr" suppressHydrationWarning className={`${spaceGrotesk.variable} ${dmSans.variable} ${pressStart.variable}`}>
            <body className={dmSans.className}>
                <GridBackground />
                <Providers>
                    <FriendsProvider>
                        <MessagesProvider>
                            <NotificationsProvider>
                                <ChatProvider>
                                    <CommandPaletteProvider>
                                        <Header />
                                        <AppLayout>{children}</AppLayout>
                                        <Footer />
                                        <DeferredOverlays />
                                    </CommandPaletteProvider>
                                </ChatProvider>
                            </NotificationsProvider>
                        </MessagesProvider>
                    </FriendsProvider>
                </Providers>
            </body>
        </html>
    );
}
