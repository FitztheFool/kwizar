// Catégories du jeu "Duel" — tournoi d'élimination par préférence.
// Chaque item = { name, img } (image web). Si l'image casse, l'UI affiche le nom.

export interface DuelItem { name: string; img: string; }
export interface DuelCategory { id: string; title: string; emoji: string; items: DuelItem[]; }

// Helpers
const poke = (id: number, name: string): DuelItem => ({
    name,
    img: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
});

const flag = (code: string, name: string): DuelItem => ({
    name,
    img: `https://flagcdn.com/w320/${code}.png`,
});

export const CATEGORIES: DuelCategory[] = [
    {
        id: 'pokemon',
        title: 'Le meilleur Pokémon',
        emoji: '⚡',
        items: [
            poke(25, 'Pikachu'), poke(6, 'Dracaufeu'), poke(9, 'Tortank'), poke(3, 'Florizarre'),
            poke(94, 'Ectoplasma'), poke(149, 'Dracolosse'), poke(448, 'Lucario'), poke(133, 'Évoli'),
            poke(150, 'Mewtwo'), poke(143, 'Ronflex'), poke(282, 'Gardevoir'), poke(658, 'Amphinobi'),
            poke(384, 'Rayquaza'), poke(445, 'Carchacrok'), poke(196, 'Mentali'), poke(197, 'Noctali'),
            // Ajouts
            poke(59, 'Arcanin'), poke(131, 'Léviator'), poke(144, 'Artikodin'), poke(145, 'Électhor'),
            poke(146, 'Sulfura'), poke(151, 'Mew'), poke(248, 'Tyranocif'), poke(380, 'Latias'),
            poke(381, 'Latios'), poke(385, 'Jirachi'), poke(483, 'Dialga'), poke(484, 'Palkia'),
            poke(491, 'Darkrai'), poke(493, 'Arceus'), poke(649, 'Genesect'), poke(1007, 'Ogerpon'),
        ],
    },
    {
        id: 'hokage',
        title: 'Le meilleur Hokage de Konoha',
        emoji: '🍥',
        items: [
            { name: 'Hashirama Senju (1er)', img: 'https://static.wikia.nocookie.net/naruto/images/2/2e/Kid_Hashirama.png/revision/latest?cb=20230322145136' },
            { name: 'Tobirama Senju (2e)', img: 'https://static.wikia.nocookie.net/naruto/images/7/70/Kid_Tobirama.png/revision/latest?cb=20230322145433' },
            { name: 'Hiruzen Sarutobi (3e)', img: 'https://static.wikia.nocookie.net/naruto/images/e/e8/Young_Hiruzen_Mobile.png/revision/latest?cb=20210422155026' },
            { name: 'Minato Namikaze (4e)', img: 'https://static.wikia.nocookie.net/naruto/images/e/eb/Minato_Jonin.png/revision/latest?cb=20230510153913' },
            { name: 'Tsunade (5e)', img: 'https://static.wikia.nocookie.net/naruto/images/6/62/Kid_Tsunade.png/revision/latest?cb=20230407050656' },
            { name: 'Kakashi Hatake (6e)', img: 'https://static.wikia.nocookie.net/naruto/images/2/27/Kakashi_Hatake.png/revision/latest?cb=20251019002845' },
            { name: 'Naruto Uzumaki (7e)', img: 'https://static.wikia.nocookie.net/naruto/images/d/d6/Naruto_Part_I.png/revision/latest?cb=20251228135525' },
            { name: 'Danzō (intérim)', img: 'https://static.wikia.nocookie.net/naruto/images/1/17/Danz%C5%8D.png/revision/latest?cb=20171028185149' },
            // Ajouts
            { name: 'Itachi Uchiha (intérim)', img: 'https://static.wikia.nocookie.net/naruto/images/2/2e/Itachi_Part_1.png/revision/latest' },
            { name: 'Kakashi (jeune)', img: 'https://static.wikia.nocookie.net/naruto/images/0/0f/Kakashi_Young.png/revision/latest' },
        ],
    },
    {
        id: 'streamers',
        title: 'Le meilleur streamer FR',
        emoji: '🎮',
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
            // Ajouts
            { name: 'Michou', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Michou_2024.jpg/330px-Michou_2024.jpg' },
            { name: 'Locklear', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Locklear_ZEvent.jpg/330px-Locklear_ZEvent.jpg' },
            { name: 'Doigby', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Doigby_2024.jpg/330px-Doigby_2024.jpg' },
            { name: 'JLTomy', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/JLTomy.jpg/330px-JLTomy.jpg' },
            { name: 'Chowh1', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Chowh1.jpg/330px-Chowh1.jpg' },
        ],
    },
    {
        id: 'nourriture',
        title: 'Le meilleur plat',
        emoji: '🍔',
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
            // Ajouts
            { name: 'Steak frites', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Steak_with_fries.jpg/330px-Steak_with_fries.jpg' },
            { name: 'Lasagnes', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Lasagne_-_v2.jpg/330px-Lasagne_-_v2.jpg' },
            { name: 'Couscous', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Couscous_with_vegetables.jpg/330px-Couscous_with_vegetables.jpg' },
            { name: 'Magret de canard', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Magret_de_canard.jpg/330px-Magret_de_canard.jpg' },
            { name: 'Fondue savoyarde', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Fondue_savoyarde.jpg/330px-Fondue_savoyarde.jpg' },
        ],
    },
    {
        id: 'bonbons',
        title: 'Le meilleur bonbon',
        emoji: '🍬',
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
            // Ajouts
            { name: 'Schtroumpfs', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Schtroumpfs_Haribo.jpg/330px-Schtroumpfs_Haribo.jpg' },
            { name: 'Rotella', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Rotella.jpg/330px-Rotella.jpg' },
            { name: 'Malabar', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Malabar_gum.jpg/330px-Malabar_gum.jpg' },
            { name: 'M&M\'s', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/M%26Ms_plain.jpg/330px-M%26Ms_plain.jpg' },
        ],
    },
    {
        id: 'pays',
        title: 'Le plus beau drapeau',
        emoji: '🏳️',
        items: [
            flag('fr', 'France'), flag('jp', 'Japon'), flag('br', 'Brésil'), flag('it', 'Italie'),
            flag('de', 'Allemagne'), flag('es', 'Espagne'), flag('ca', 'Canada'), flag('us', 'États-Unis'),
            flag('kr', 'Corée du Sud'), flag('za', 'Afrique du Sud'), flag('mx', 'Mexique'), flag('se', 'Suède'),
            // Ajouts
            flag('au', 'Australie'), flag('nz', 'Nouvelle-Zélande'), flag('ch', 'Suisse'), flag('pt', 'Portugal'),
            flag('nl', 'Pays-Bas'), flag('in', 'Inde'), flag('tr', 'Turquie'), flag('ar', 'Argentine'),
            flag('cl', 'Chili'), flag('th', 'Thaïlande'), flag('gr', 'Grèce'), flag('ie', 'Irlande'),
        ],
    },
    {
        id: 'animaux',
        title: "L'animal préféré",
        emoji: '🐾',
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
            // Ajouts
            { name: 'Koala', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Koala_climbing_tree.jpg/330px-Koala_climbing_tree.jpg' },
            { name: 'Hérisson', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/European_hedgehog.jpg/330px-European_hedgehog.jpg' },
            { name: 'Flamant rose', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Greater_flamingo.jpg/330px-Greater_flamingo.jpg' },
            { name: 'Paresseux', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Bradypus.jpg/330px-Bradypus.jpg' },
        ],
    },
    {
        id: 'marvel',
        title: 'Le meilleur film Marvel',
        emoji: '🦸',
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
            // Ajouts
            { name: 'Civil War', img: 'https://upload.wikimedia.org/wikipedia/en/5/53/Captain_America_Civil_War_poster.jpg' },
            { name: 'Shang-Chi', img: 'https://upload.wikimedia.org/wikipedia/en/7/74/Shang-Chi_and_the_Legend_of_the_Ten_Rings_poster.jpeg' },
            { name: 'Spider-Man: Homecoming', img: 'https://upload.wikimedia.org/wikipedia/en/f/f9/Spider-Man_Homecoming_poster.jpg' },
        ],
    },

    // ==================== NOUVELLES CATÉGORIES ====================

    {
        id: 'dc',
        title: 'Le meilleur film DC',
        emoji: '🦇',
        items: [
            { name: 'The Dark Knight', img: 'https://upload.wikimedia.org/wikipedia/en/8/8a/The_Dark_Knight_%282008_film%29_poster.jpg' },
            { name: 'Joker', img: 'https://upload.wikimedia.org/wikipedia/en/9/9e/Joker_%282019_film%29_poster.jpg' },
            { name: 'Wonder Woman', img: 'https://upload.wikimedia.org/wikipedia/en/3/3f/Wonder_Woman_%282017_film%29_poster.jpg' },
            { name: 'Aquaman', img: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Aquaman_%28film%29_poster.jpg' },
            { name: 'The Batman', img: 'https://upload.wikimedia.org/wikipedia/en/3/3b/The_Batman_%282022_film%29_poster.jpg' },
            { name: 'Man of Steel', img: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Man_of_Steel_poster.jpg' },
        ],
    },
    {
        id: 'starwars',
        title: 'Le meilleur de Star Wars',
        emoji: '🌌',
        items: [
            { name: 'L\'Empire contre-attaque', img: 'https://upload.wikimedia.org/wikipedia/en/3/3c/SW_-_Empire_Strikes_Back.jpg' },
            { name: 'Un Nouvel Espoir', img: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Star_Wars_Episode_IV_-_A_New_Hope_%28poster%29.jpg' },
            { name: 'Le Retour du Jedi', img: 'https://upload.wikimedia.org/wikipedia/en/b/b2/Return_of_the_Jedi_poster.jpg' },
            { name: 'Rogue One', img: 'https://upload.wikimedia.org/wikipedia/en/4/4f/Rogue_One_poster.jpg' },
            { name: 'Andor', img: 'https://upload.wikimedia.org/wikipedia/en/5/5f/Andor_season_1_poster.jpg' },
            { name: 'The Mandalorian', img: 'https://upload.wikimedia.org/wikipedia/en/b/b9/The_Mandalorian_season_2_poster.jpg' },
        ],
    },
    {
        id: 'jeuxvideo',
        title: 'Le meilleur jeu vidéo',
        emoji: '🎮',
        items: [
            { name: 'The Legend of Zelda: BOTW', img: 'https://upload.wikimedia.org/wikipedia/en/c/c3/The_Legend_of_Zelda_Breath_of_the_Wild.jpg' },
            { name: 'Elden Ring', img: 'https://upload.wikimedia.org/wikipedia/en/b/b8/Elden_Ring_cover_art.jpg' },
            { name: 'Minecraft', img: 'https://upload.wikimedia.org/wikipedia/en/5/51/Minecraft_cover.png' },
            { name: 'GTA V', img: 'https://upload.wikimedia.org/wikipedia/en/a/a5/Grand_Theft_Auto_V.png' },
            { name: 'The Witcher 3', img: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Witcher_3_cover_art.jpg' },
            { name: 'Super Mario Odyssey', img: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Super_Mario_Odyssey.jpg' },
            { name: 'Red Dead Redemption 2', img: 'https://upload.wikimedia.org/wikipedia/en/4/44/Red_Dead_Redemption_II.jpg' },
            { name: 'Hades', img: 'https://upload.wikimedia.org/wikipedia/en/6/6a/Hades_cover_art.jpg' },
        ],
    },
    {
        id: 'boissons',
        title: 'La meilleure boisson',
        emoji: '🥤',
        items: [
            { name: 'Coca-Cola', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Coca-Cola_logo.svg/330px-Coca-Cola_logo.svg.png' },
            { name: 'Café', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Cappuccino_at_Sightglass_Coffee.jpg/330px-Cappuccino_at_Sightglass_Coffee.jpg' },
            { name: 'Thé', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Cup_of_black_tea.jpg/330px-Cup_of_black_tea.jpg' },
            { name: 'Chocolat chaud', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Hot_chocolate.jpg/330px-Hot_chocolate.jpg' },
            { name: 'Jus d\'orange', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Orange_juice_1.jpg/330px-Orange_juice_1.jpg' },
            { name: 'Bières artisanales', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Assorted_beer.jpg/330px-Assorted_beer.jpg' },
            { name: 'Limonade', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Lemonade.jpg/330px-Lemonade.jpg' },
        ],
    },
    {
        id: 'desserts',
        title: 'Le meilleur dessert',
        emoji: '🍰',
        items: [
            { name: 'Crème brûlée', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Cr%C3%A8me_br%C3%BBl%C3%A9e.jpg/330px-Cr%C3%A8me_br%C3%BBl%C3%A9e.jpg' },
            { name: 'Tiramisu', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Tiramisu_-_Two.jpg/330px-Tiramisu_-_Two.jpg' },
            { name: 'Macarons', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Macarons.jpg/330px-Macarons.jpg' },
            { name: 'Éclair', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/%C3%89clair_au_chocolat.jpg/330px-%C3%89clair_au_chocolat.jpg' },
            { name: 'Fondant au chocolat', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Fondant_au_chocolat.jpg/330px-Fondant_au_chocolat.jpg' },
            { name: 'Cheesecake', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Cheesecake.jpg/330px-Cheesecake.jpg' },
        ],
    },
    {
        id: 'kpop',
        title: 'Le meilleur groupe/artiste K-pop',
        emoji: '🎤',
        items: [
            { name: 'BTS', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/BTS_at_the_White_House_%28cropped%29.jpg/330px-BTS_at_the_White_House_%28cropped%29.jpg' },
            { name: 'Blackpink', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Blackpink_in_your_area.jpg/330px-Blackpink_in_your_area.jpg' },
            { name: 'Stray Kids', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Stray_Kids_2023.jpg/330px-Stray_Kids_2023.jpg' },
            { name: 'NewJeans', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/NewJeans_2024.jpg/330px-NewJeans_2024.jpg' },
            { name: 'Twice', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/TWICE_2022.jpg/330px-TWICE_2022.jpg' },
        ],
    },
];

export const isEmoji = (img: string) => !!img && !img.startsWith('http');
