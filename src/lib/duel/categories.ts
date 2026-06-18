// Catégories du jeu "Duel" — tournoi d'élimination par préférence.
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
            { name: 'Hashirama Senju (1er)', img: 'https://static.wikia.nocookie.net/naruto/images/2/2e/Kid_Hashirama.png/revision/latest?cb=20230322145136' },
            { name: 'Tobirama Senju (2e)', img: 'https://static.wikia.nocookie.net/naruto/images/7/70/Kid_Tobirama.png/revision/latest?cb=20230322145433' },
            { name: 'Hiruzen Sarutobi (3e)', img: 'https://static.wikia.nocookie.net/naruto/images/e/e8/Young_Hiruzen_Mobile.png/revision/latest?cb=20210422155026' },
            { name: 'Minato Namikaze (4e)', img: 'https://static.wikia.nocookie.net/naruto/images/e/eb/Minato_Jonin.png/revision/latest?cb=20230510153913' },
            { name: 'Tsunade (5e)', img: 'https://static.wikia.nocookie.net/naruto/images/6/62/Kid_Tsunade.png/revision/latest?cb=20230407050656' },
            { name: 'Kakashi Hatake (6e)', img: 'https://static.wikia.nocookie.net/naruto/images/2/27/Kakashi_Hatake.png/revision/latest?cb=20251019002845' },
            { name: 'Naruto Uzumaki (7e)', img: 'https://static.wikia.nocookie.net/naruto/images/d/d6/Naruto_Part_I.png/revision/latest?cb=20251228135525' },
            { name: 'Danzō (intérim)', img: 'https://static.wikia.nocookie.net/naruto/images/1/17/Danz%C5%8D.png/revision/latest?cb=20171028185149' },
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
            { name: 'Pizza', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Pizza_Margherita_stu_spivack.jpg/330px-Pizza_Margherita_stu_spivack.jpg' },
            { name: 'Burger', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/RedDot_Burger.jpg/330px-RedDot_Burger.jpg' },
            { name: 'Sushi', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Nigiri_Sushi_%2826478725732%29.jpg/330px-Nigiri_Sushi_%2826478725732%29.jpg' },
            { name: 'Tacos', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg/330px-001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg' },
            { name: 'Pâtes', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Pasta_2006_1.jpg/330px-Pasta_2006_1.jpg' },
            { name: 'Ramen', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Charsiu_ramen_02.jpg/330px-Charsiu_ramen_02.jpg' },
            { name: 'Kebab', img: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/D%C3%B6ner_kebab_slicing.jpg' },
            { name: 'Raclette', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Raclette_20040817_140816.jpg/330px-Raclette_20040817_140816.jpg' },
            { name: 'Frites', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Fries_2.jpg/330px-Fries_2.jpg' },
            { name: 'Poulet rôti', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Max%27s_Roasted_Chicken_-_Evan_Swigart.jpg/330px-Max%27s_Roasted_Chicken_-_Evan_Swigart.jpg' },
            { name: 'Curry', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Indiandishes.jpg/330px-Indiandishes.jpg' },
            { name: 'Croissant', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Croissant-Petr_Kratochvil.jpg/330px-Croissant-Petr_Kratochvil.jpg' },
        ],
    },
    {
        id: 'bonbons', title: 'Le meilleur bonbon', emoji: '🍬',
        items: [
            { name: 'Fraise Tagada', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Fraise_Tagada.jpg/330px-Fraise_Tagada.jpg' },
            { name: 'Ours Haribo', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Oursons_g%C3%A9latine_march%C3%A9_Rouffignac.jpg/330px-Oursons_g%C3%A9latine_march%C3%A9_Rouffignac.jpg' },
            { name: 'Carambar', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Jielbeaumadier_carambars_2010.jpg/330px-Jielbeaumadier_carambars_2010.jpg' },
            { name: 'Dragibus', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Liebesperlen.JPG/330px-Liebesperlen.JPG' },
            { name: 'Réglisse', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Liquorice_wheels.jpg/330px-Liquorice_wheels.jpg' },
            { name: 'Sucette', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Farbenfrohe_Lollipops%2C_Austria.jpg/330px-Farbenfrohe_Lollipops%2C_Austria.jpg' },
            { name: 'Guimauve', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/White_Marshmallows.jpg/330px-White_Marshmallows.jpg' },
            { name: 'Chamallow', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Guimauves-figures.jpg/330px-Guimauves-figures.jpg' },
            { name: 'Jelly Bean', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/JellyBellyPile.JPG/330px-JellyBellyPile.JPG' },
            { name: 'Wine Gum', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Maynards-Wine-Gums.jpg/330px-Maynards-Wine-Gums.jpg' },
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
            { name: 'Chat', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Cat_August_2010-4.jpg/330px-Cat_August_2010-4.jpg' },
            { name: 'Chien', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Huskiesatrest.jpg/330px-Huskiesatrest.jpg' },
            { name: 'Renard', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Portrait_of_a_red_fox_in_Rautas_fj%C3%A4llurskog_%28cropped%29.jpg/330px-Portrait_of_a_red_fox_in_Rautas_fj%C3%A4llurskog_%28cropped%29.jpg' },
            { name: 'Panda', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Grosser_Panda.JPG/330px-Grosser_Panda.JPG' },
            { name: 'Loup', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Eurasian_wolf_2.jpg/330px-Eurasian_wolf_2.jpg' },
            { name: 'Lion', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/020_The_lion_king_Snyggve_in_the_Serengeti_National_Park_Photo_by_Giles_Laurent.jpg/330px-020_The_lion_king_Snyggve_in_the_Serengeti_National_Park_Photo_by_Giles_Laurent.jpg' },
            { name: 'Tigre', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Bengal_tiger_%28Panthera_tigris_tigris%29_female_3_crop.jpg/330px-Bengal_tiger_%28Panthera_tigris_tigris%29_female_3_crop.jpg' },
            { name: 'Loutre', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Fischotter%2C_Lutra_Lutra.JPG/330px-Fischotter%2C_Lutra_Lutra.JPG' },
            { name: 'Pingouin', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Aptenodytes_forsteri_-Snow_Hill_Island%2C_Antarctica_-adults_and_juvenile-8.jpg/330px-Aptenodytes_forsteri_-Snow_Hill_Island%2C_Antarctica_-adults_and_juvenile-8.jpg' },
            { name: 'Dauphin', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Tursiops_truncatus_01-cropped.jpg/330px-Tursiops_truncatus_01-cropped.jpg' },
            { name: 'Aigle', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Bald_eagle_about_to_fly_in_Alaska_%282016%29.jpg/330px-Bald_eagle_about_to_fly_in_Alaska_%282016%29.jpg' },
            { name: 'Capybara', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Capybaracropped.jpg/330px-Capybaracropped.jpg' },
        ],
    },
    {
        id: 'marvel', title: 'Le meilleur film Marvel', emoji: '🦸',
        items: [
            { name: 'Iron Man', img: 'https://upload.wikimedia.org/wikipedia/en/0/02/Iron_Man_%282008_film%29_poster.jpg' },
            { name: 'Avengers', img: 'https://upload.wikimedia.org/wikipedia/en/8/8a/The_Avengers_%282012_film%29_poster.jpg' },
            { name: 'Endgame', img: 'https://upload.wikimedia.org/wikipedia/en/0/0d/Avengers_Endgame_poster.jpg' },
            { name: 'Black Panther', img: 'https://upload.wikimedia.org/wikipedia/en/d/d6/Black_Panther_%28film%29_poster.jpg' },
            { name: 'No Way Home', img: 'https://upload.wikimedia.org/wikipedia/en/0/00/Spider-Man_No_Way_Home_poster.jpg' },
            { name: 'Gardiens de la Galaxie', img: 'https://upload.wikimedia.org/wikipedia/en/3/33/Guardians_of_the_Galaxy_%28film%29_poster.jpg' },
            { name: 'Thor: Ragnarok', img: 'https://upload.wikimedia.org/wikipedia/en/7/7d/Thor_Ragnarok_poster.jpg' },
            { name: 'Winter Soldier', img: 'https://upload.wikimedia.org/wikipedia/en/9/9e/Captain_America_The_Winter_Soldier_poster.jpg' },
            { name: 'Doctor Strange', img: 'https://upload.wikimedia.org/wikipedia/en/a/a1/Doctor_Strange_%282016_film%29_poster.jpg' },
            { name: 'Infinity War', img: 'https://upload.wikimedia.org/wikipedia/en/4/4d/Avengers_Infinity_War_poster.jpg' },
        ],
    },
];

/** Une "image" est un emoji si ce n'est pas une URL. */
export const isEmoji = (img: string) => !!img && !img.startsWith('http');
