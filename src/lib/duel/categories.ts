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
            { name: 'Hashirama Senju (1er)', img: '' },
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
            { name: 'Squeezie', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Squeezie_Zack_en_Roue_Libre_2025.png/330px-Squeezie_Zack_en_Roue_Libre_2025.png' },
            { name: 'Gotaga', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Gotaga_2026.jpg/330px-Gotaga_2026.jpg' },
            { name: 'ZeratoR', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/ZeratoR%2C_lors_du_ZEVENT_2025.jpg/330px-ZeratoR%2C_lors_du_ZEVENT_2025.jpg' },
            { name: 'Antoine Daniel', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Antoine_Daniel_-_N%C3%A9oCast2_-_3_%28cropped%29.jpg/330px-Antoine_Daniel_-_N%C3%A9oCast2_-_3_%28cropped%29.jpg' },
            { name: 'Etoiles', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Etoiles_%28Rayenne_Guendil%29_lors_du_ZEVENT_2025.jpg/330px-Etoiles_%28Rayenne_Guendil%29_lors_du_ZEVENT_2025.jpg' },
            { name: 'Ponce', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Aur%C3%A9lien_Gilles_%28Ponce%29_lors_du_ZEVENT_2025.jpg/330px-Aur%C3%A9lien_Gilles_%28Ponce%29_lors_du_ZEVENT_2025.jpg' },
            { name: 'Kameto', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Kameto_ZERL.jpg/330px-Kameto_ZERL.jpg' },
            { name: 'AmineMaTue', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/AmineMaTu%C3%A9%2C_De_Twittos_%C3%A0_Top_Streameur_-_Zack_en_Roue_Libre_avec_AmineMaTu%C3%A9_%28S05E04%29_2-49_%28cropped%29.png/330px-AmineMaTu%C3%A9%2C_De_Twittos_%C3%A0_Top_Streameur_-_Zack_en_Roue_Libre_avec_AmineMaTu%C3%A9_%28S05E04%29_2-49_%28cropped%29.png' },
            { name: 'Inoxtag', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Inoxtag-2023.jpg/330px-Inoxtag-2023.jpg' },
            { name: 'Joyca', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Jordan_Rondelli_%28Joyca%29_lors_du_ZEVENT_2025.jpg/330px-Jordan_Rondelli_%28Joyca%29_lors_du_ZEVENT_2025.jpg' },
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
