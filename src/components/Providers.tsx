// src/components/Providers.tsx
'use client';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { SessionGuard } from '@/components/SessionGuard';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SessionGuard />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
