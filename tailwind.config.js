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
                // ── Couleur du jeu courant ────────────────────────────────────────
                // UNE seule utilitaire (`bg-game`, `text-game`, `border-game/20`…) qui
                // résout vers la couleur des 34 jeux, via --game-rgb posé par useGameTheme.
                // Source : src/lib/theme/games.ts. Repli sur l'accent hors page de jeu.
                game: 'rgb(var(--game-rgb) / <alpha-value>)',

                // ── Tokens sémantiques ────────────────────────────────────────────
                // Distincts de la marque : en dark l'accent EST rouge, donc `danger`
                // doit rester lisible comme « erreur » et non comme « marque ».
                success: 'rgb(var(--success) / <alpha-value>)',
                danger: 'rgb(var(--danger) / <alpha-value>)',
                warning: 'rgb(var(--warning) / <alpha-value>)',
                info: 'rgb(var(--info) / <alpha-value>)',

                // ── DÉPRÉCIÉ — ancienne charte, en cours de retrait ───────────────
                // `clay` est supprimé (plus aucun usage). `felt` survit dans 16 fichiers
                // (quiz + lobby/social) : son double rôle — accent multi ET « bonne
                // réponse » — sera scindé en MODE_THEME.multi et `success` aux lots 6-7.
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
            },
            fontFamily: {
                sans: ['var(--font-body)', 'sans-serif'],
                display: ['var(--font-heading)', 'sans-serif'],
                // Arcade — titres de jeu et gros chiffres de score UNIQUEMENT.
                // Était référencée en inline dans 7 pages mais jamais chargée : tout
                // s'affichait en Courier New. Chargée via next/font dans app/layout.tsx.
                arcade: ['var(--font-arcade)', 'ui-monospace', 'monospace'],
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
                'glow-felt': '0 0 0 1px rgba(42,128,84,0.3), 0 8px 30px -8px rgba(42,128,84,0.4)', // déprécié avec felt
                // Néon du jeu courant — réservé aux affordances (hover, focus, CTA actif).
                'game-glow': '0 0 0 1px rgb(var(--game-rgb) / 0.25), 0 8px 32px -8px rgb(var(--game-rgb) / 0.4)',
                'game-glow-lg': '0 0 0 1px rgb(var(--game-rgb) / 0.35), 0 0 60px -10px rgb(var(--game-rgb) / 0.55)',
            },
            backgroundImage: {
                // Rampe d'accent : accent → accent-hot (rouge movix en dark, bleu en light).
                'accent-gradient': 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-hot)) 100%)',
                'game-gradient': 'linear-gradient(135deg, rgb(var(--game-rgb)) 0%, rgb(var(--game-rgb) / 0.55) 100%)',
            },
            keyframes: {
                'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
                'scale-in': { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
            },
            animation: {
                'fade-in': 'fade-in 0.2s ease-out',
                'scale-in': 'scale-in 0.18s ease-out',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
