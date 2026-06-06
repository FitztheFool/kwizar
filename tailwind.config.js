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
                // ── Brand "Kwizar" — amber / brass primary ──
                primary: {
                    50: '#fdf6ec',
                    100: '#f9e7c9',
                    200: '#f2cd91',
                    300: '#eab059',
                    400: '#e29632',
                    500: '#d97706',
                    600: '#bd6306',
                    700: '#9a5009',
                    800: '#7c400d',
                    900: '#67360f',
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
                glow: '0 0 0 1px rgba(217,119,6,0.25), 0 8px 30px -8px rgba(217,119,6,0.35)',
                'glow-felt': '0 0 0 1px rgba(42,128,84,0.3), 0 8px 30px -8px rgba(42,128,84,0.4)',
            },
            backgroundImage: {
                'accent-gradient': 'linear-gradient(135deg, #2a8054 0%, #d97706 100%)',
                'accent-gradient-soft': 'linear-gradient(135deg, rgba(42,128,84,0.18) 0%, rgba(217,119,6,0.18) 100%)',
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
