// Catégories du jeu "Ceci ou Cela" — tournoi d'élimination par préférence.
// Chaque item = { name, img } (image web). Si l'image casse, l'UI affiche le nom (repli).

export interface DuelItem { name: string; img: string; }
export interface DuelCategory { id: string; title: string; emoji: string; items: DuelItem[]; }

// Pokémon : artwork officiel (CDN PokeAPI, par n° de Pokédex).
const poke = (id: number, name: string): DuelItem => ({
    name,
    img: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
});
// Drapeaux : flagcdn (code ISO 2 lettres).
const flag = (code: string, name: string): DuelItem => ({ name, img: `https://flagcdn.com/w320/${code}.png` });
// Wikimedia Commons : nom de fichier exact (repli sur le nom si 404).
const wiki = (file: string, name: string): DuelItem => ({ name, img: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=400` });

export const CATEGORIES: DuelCategory[] = [
    {
        id: 'pokemon', title: 'Le meilleur Pokémon', emoji: '⚡',
        items: [
            poke(25, 'Pikachu'), poke(6, 'Dracaufeu'), poke(9, 'Tortank'), poke(3, 'Florizarre'),
            poke(94, 'Ectoplasma'), poke(149, 'Dracolosse'), poke(448, 'Lucario'), poke(133, 'Évoli'),
            poke(150, 'Mewtwo'), poke(143, 'Ronflex'), poke(282, 'Gardevoir'), poke(658, 'Amphinobi'),
            poke(384, 'Rayquaza'), poke(445, 'Carchacrok'), poke(196, 'Mentali'), poke(197, 'Noctali'),
        ],
    },
    {
        id: 'hokage', title: 'Le meilleur Hokage de Konoha', emoji: '🍥',
        items: [
            wiki('Hashirama_Senju.png', 'Hashirama Senju (1er)'),
            { name: 'Tobirama Senju (2e)', img: '' },
            { name: 'Hiruzen Sarutobi (3e)', img: '' },
            { name: 'Minato Namikaze (4e)', img: '' },
            { name: 'Tsunade (5e)', img: '' },
            { name: 'Kakashi Hatake (6e)', img: '' },
            { name: 'Naruto Uzumaki (7e)', img: '' },
            { name: 'Danzō (intérim)', img: '' },
        ],
    },
    {
        id: 'streamers', title: 'Le meilleur streamer FR', emoji: '🎮',
        items: [
            { name: 'Squeezie', img: '' }, { name: 'Gotaga', img: '' }, { name: 'ZeratoR', img: '' },
            { name: 'Domingo', img: '' }, { name: 'Antoine Daniel', img: '' }, { name: 'Etoiles', img: '' },
            { name: 'Ponce', img: '' }, { name: 'Kameto', img: '' }, { name: 'AmineMaTue', img: '' },
            { name: 'Locklear', img: '' }, { name: 'Maghla', img: '' }, { name: 'Inoxtag', img: '' },
        ],
    },
    {
        id: 'nourriture', title: 'Le meilleur plat', emoji: '🍔',
        items: [
            { name: 'Pizza', img: '🍕' }, { name: 'Burger', img: '🍔' }, { name: 'Sushi', img: '🍣' },
            { name: 'Tacos', img: '🌮' }, { name: 'Pâtes', img: '🍝' }, { name: 'Ramen', img: '🍜' },
            { name: 'Kebab', img: '🥙' }, { name: 'Raclette', img: '🧀' }, { name: 'Frites', img: '🍟' },
            { name: 'Poulet rôti', img: '🍗' }, { name: 'Curry', img: '🍛' }, { name: 'Croissant', img: '🥐' },
        ],
    },
    {
        id: 'bonbons', title: 'Le meilleur bonbon', emoji: '🍬',
        items: [
            { name: 'Fraise Tagada', img: '🍓' }, { name: 'Ours Haribo', img: '🐻' }, { name: 'Carambar', img: '🍫' },
            { name: 'Dragibus', img: '🔵' }, { name: 'Crocodile', img: '🐊' }, { name: 'Schtroumpf', img: '💙' },
            { name: 'Réglisse', img: '⚫' }, { name: 'Marshmallow', img: '☁️' }, { name: 'Chamallow', img: '🍡' },
            { name: 'Sucette Chupa Chups', img: '🍭' },
        ],
    },
    {
        id: 'pays', title: 'Le plus beau drapeau', emoji: '🏳️',
        items: [
            flag('fr', 'France'), flag('jp', 'Japon'), flag('br', 'Brésil'), flag('it', 'Italie'),
            flag('de', 'Allemagne'), flag('es', 'Espagne'), flag('ca', 'Canada'), flag('us', 'États-Unis'),
            flag('kr', 'Corée du Sud'), flag('za', 'Afrique du Sud'), flag('mx', 'Mexique'), flag('se', 'Suède'),
        ],
    },
    {
        id: 'animaux', title: "L'animal préféré", emoji: '🐾',
        items: [
            { name: 'Chat', img: '🐱' }, { name: 'Chien', img: '🐶' }, { name: 'Renard', img: '🦊' },
            { name: 'Panda', img: '🐼' }, { name: 'Loup', img: '🐺' }, { name: 'Lion', img: '🦁' },
            { name: 'Tigre', img: '🐯' }, { name: 'Loutre', img: '🦦' }, { name: 'Pingouin', img: '🐧' },
            { name: 'Dauphin', img: '🐬' }, { name: 'Aigle', img: '🦅' }, { name: 'Capybara', img: '🦫' },
        ],
    },
];

/** Une "image" est un emoji si ce n'est pas une URL. */
export const isEmoji = (img: string) => !!img && !img.startsWith('http');
