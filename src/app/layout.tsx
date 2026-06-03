// src/app/layout.tsx
import type { Metadata } from 'next';
import { Fraunces, DM_Sans } from 'next/font/google';
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
import CommandPalette from '@/components/CommandPalette';
import FloatingChat from '@/components/Chat/FloatingChat';
import MessagesDock from '@/components/Messages/MessagesDock';
import Toasts from '@/components/Notifications/Toasts';

const fraunces = Fraunces({
    subsets: ['latin'],
    variable: '--font-heading',
    weight: ['500', '600', '700', '900'],
    style: ['normal', 'italic'],
    display: 'swap',
});

const dmSans = DM_Sans({
    subsets: ['latin'],
    variable: '--font-body',
    weight: ['400', '500', '600'],
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Kwizar',
    description: 'Application de jeux solo et multijoueurs',
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
        <html lang="fr" suppressHydrationWarning className={`${fraunces.variable} ${dmSans.variable}`}>
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
                                        <FloatingChat />
                                        <MessagesDock />
                                        <Toasts />
                                        <CommandPalette />
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
