// src/app/layout.tsx
import type { Metadata } from 'next';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import { Space_Grotesk, DM_Sans } from 'next/font/google';
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
        <html lang="fr" suppressHydrationWarning className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
            <body className={dmSans.className}>
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
