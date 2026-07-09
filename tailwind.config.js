/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
    darkMode: 'class',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/lib/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                gray: colors.stone,
                // ── Brand "Kwizar" — accent thématisé (bleu en light, rouge movix en dark).
                // Les valeurs vivent dans globals.css (:root / .dark) → un seul point de bascule.
                primary: {
                    50: 'rgb(var(--accent-50) / <alpha-value>)',
                    100: 'rgb(var(--accent-100) / <alpha-value>)',
                    200: 'rgb(var(--accent-200) / <alpha-value>)',
                    300: 'rgb(var(--accent-300) / <alpha-value>)',
                    400: 'rgb(var(--accent-400) / <alpha-value>)',
                    500: 'rgb(var(--accent-500) / <alpha-value>)',
                    600: 'rgb(var(--accent-600) / <alpha-value>)',
                    700: 'rgb(var(--accent-700) / <alpha-value>)',
                    800: 'rgb(var(--accent-800) / <alpha-value>)',
                    900: 'rgb(var(--accent-900) / <alpha-value>)',
                },
                // ── Felt green (multiplayer / success accents) ──
                felt: {
                    50: '#edf7f1',
                    100: '#d2ebdc',
                    200: '#a7d7bb',
                    300: '#72bd94',
                    400: '#449d6e',
                    500: '#2a8054',
                    600: '#1f6b47',
                    700: '#1a553a',
                    800: '#174330',
                    900: '#133829',
                },
                // ── Clay / terracotta (third accent) ──
                clay: {
                    50: '#fbf0ed',
                    100: '#f6dad2',
                    200: '#ecb6a8',
                    300: '#df8d78',
                    400: '#cf6750',
                    500: '#b45441',
                    600: '#9a4435',
                    700: '#7d372c',
                    800: '#652f27',
                    900: '#552a24',
                },
            },
            fontFamily: {
                sans: ['var(--font-body)', 'sans-serif'],
                display: ['var(--font-heading)', 'sans-serif'],
            },
            borderRadius: {
                xl: '0.875rem',
                '2xl': '1.125rem',
                '3xl': '1.5rem',
            },
            boxShadow: {
                // Soft layered elevation for glass surfaces (dark-first).
                glass: '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 8px 30px -12px rgba(0,0,0,0.6)',
                'glass-lg': '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 24px 60px -20px rgba(0,0,0,0.7)',
                glow: '0 0 0 1px rgb(var(--accent) / 0.3), 0 8px 30px -8px rgb(var(--accent) / 0.45)',
                'glow-felt': '0 0 0 1px rgba(42,128,84,0.3), 0 8px 30px -8px rgba(42,128,84,0.4)',
                'glow-accent': '0 0 0 1px rgb(var(--accent) / 0.35), 0 10px 40px -10px rgb(var(--accent) / 0.55)',
            },
            backgroundImage: {
                // Rampe d'accent : accent → accent-hot (rouge movix en dark, bleu en light).
                'accent-gradient': 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-hot)) 100%)',
                'accent-gradient-soft': 'linear-gradient(135deg, rgb(var(--accent) / 0.20) 0%, rgb(var(--accent-hot) / 0.14) 100%)',
                'glass-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 60%)',
            },
            keyframes: {
                'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
                'slide-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
                'scale-in': { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
                shimmer: { '100%': { transform: 'translateX(100%)' } },
            },
            animation: {
                'fade-in': 'fade-in 0.2s ease-out',
                'slide-up': 'slide-up 0.25s ease-out',
                'scale-in': 'scale-in 0.18s ease-out',
                shimmer: 'shimmer 1.6s infinite',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
