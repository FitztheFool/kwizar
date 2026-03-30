// src/components/GoogleButton.tsx
import { signIn } from 'next-auth/react';

interface GoogleButtonProps {
    callbackUrl?: string;
    label?: string;
}

export default function GoogleButton({
    callbackUrl = '/dashboard',
    label = 'Se connecter avec Google',
}: GoogleButtonProps) {
    return (
        <button
            onClick={() => signIn('google', { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-white hover:bg-gray-100 text-gray-800 font-medium border border-gray-300 transition-colors"
        >
            {/* Logo Google officiel */}
            <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.37 1.22 8.3 3.2l6.19-6.19C34.88 2.88 29.93 1 24 1 14.82 1 6.73 6.48 2.69 14.44l7.39 5.74C12.05 13.07 17.57 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24.5c0-1.63-.15-3.2-.43-4.71H24v9.02h12.67c-.55 2.96-2.21 5.47-4.72 7.16l7.28 5.65C43.92 37.24 46.5 31.34 46.5 24.5z" />
                <path fill="#FBBC05" d="M10.08 28.18a14.48 14.48 0 0 1 0-8.36l-7.39-5.74A23.96 23.96 0 0 0 1 24c0 3.86.92 7.51 2.69 10.92l7.39-5.74z" />
                <path fill="#34A853" d="M24 47c6.48 0 11.92-2.14 15.9-5.83l-7.28-5.65c-2.02 1.36-4.61 2.17-8.62 2.17-6.43 0-11.95-3.57-13.92-8.68l-7.39 5.74C6.73 41.52 14.82 47 24 47z" />
            </svg>
            {label}
        </button>
    );
}
