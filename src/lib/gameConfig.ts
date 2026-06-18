export const GAME_CONFIG = {
    uno: {
        gameType: 'UNO' as const,
        bot: true,
        label: 'UNO',
        mode: 'both' as const,
        higherIsBetter: true,
        scoreLabel: 'Points',
        description: "Le classique des jeux de cartes, rapide et nerveux. Débarrasse-toi de toutes tes cartes avant les autres — sans oublier de crier UNO !",
        players: '1 – 8 joueurs',
        rules: "<p>But : être le premier à n'avoir plus aucune carte en main.</p><ul><li>Pose une carte de même couleur ou même chiffre que celle du dessus.</li><li>Cartes spéciales : +2, inversion de sens, passe-tour, joker (choisit la couleur), joker +4.</li><li>Pioche si tu ne peux pas — ou ne veux pas — jouer.</li><li>Crie « UNO ! » quand il te reste une seule carte, sinon pénalité.</li><li>Manche finie, chaque adversaire compte la valeur de ses cartes restantes.</li></ul>",
        score: "Le gagnant de chaque manche marque la valeur des cartes restantes : chiffres = valeur faciale, actions = 20 pts, jokers = 50 pts. Le classement est basé sur le total cumulé. En 2v2, les points sont partagés entre coéquipiers.",
    },
    skyjow: {
        gameType: 'SKYJOW' as const,
        bot: true,
        label: 'Skyjow',
        mode: 'both' as const,
        higherIsBetter: false,
        scoreLabel: 'Score moyen',
        description: "Un jeu de cartes malin où le plus petit score l'emporte. Compose ta grille, élimine tes grosses cartes et surveille les adversaires.",
        players: '1 – 8 joueurs',
        rules: "<p>But : avoir le moins de points possible.</p><ul><li>Chacun gère une grille de 12 cartes face cachée (valeurs -2 à 12).</li><li>À ton tour, pioche (au talon ou à la défausse) puis échange ou retourne une carte.</li><li>3 cartes identiques alignées en colonne sont défaussées.</li><li>La manche s'arrête dès qu'un joueur a retourné toute sa grille.</li><li>Déclencher la fin sans avoir le plus petit score double ton score !</li></ul>",
        score: "Ton score est la somme des cartes restantes dans ta grille. Si tu déclenches la fin de manche sans avoir le plus petit score, le tien est doublé ! Le classement repose sur le score moyen par partie.",
    },
    taboo: {
        gameType: 'TABOO' as const,
        label: 'Taboo',
        mode: 'multi' as const,
        higherIsBetter: true,
        scoreLabel: 'Points',
        description: "Le jeu de mots à faire deviner sous pression, en équipes. Décris le mot mystère… sans jamais lâcher les mots interdits.",
        players: '4 – 12 joueurs',
        rules: "<p>But : faire deviner un maximum de mots à ton équipe.</p><ul><li>Un orateur décrit le mot mystère à ses coéquipiers.</li><li>Interdit de prononcer le mot ou l'un des mots tabous de la carte.</li><li>L'équipe adverse surveille et sanctionne les infractions.</li><li>Chaque mot trouvé dans le temps imparti rapporte un point.</li></ul>",
        score: "1 point par mot deviné. 1 point par mot piégé activé. Le classement correspond au total de mots devinés sur l'ensemble des parties.",
    },
    quiz: {
        gameType: 'QUIZ' as const,
        label: 'Quiz',
        mode: 'both' as const,
        higherIsBetter: true,
        scoreLabel: 'Score total',
        description: "Des questions sur tous les sujets, en solo ou jusqu'à 30 joueurs. Réponds vite et juste pour grimper au classement.",
        players: '1-30 joueurs',
        rules: "<p>But : marquer le plus de points en répondant correctement.</p><ul><li>Questions en vrai/faux, QCM ou texte libre.</li><li>Selon le mode, un chrono par question ou global limite ton temps.</li><li>Plus tu réponds vite et juste, plus tu marques.</li><li>Seul ton meilleur score par quiz est conservé.</li></ul>",
        score: "Pour chaque quiz, seul ton meilleur score est conservé. Ton score total correspond à la somme de tes meilleurs résultats sur tous les quiz joués.",
    },
    yahtzee: {
        gameType: 'YAHTZEE' as const,
        bot: true,
        noOptions: 'Yahtzee — 2 à 8 joueurs',
        label: 'Yahtzee',
        mode: 'both' as const,
        higherIsBetter: true,
        scoreLabel: 'Score total',
        description: "Le grand classique des dés et des combinaisons. Lance, garde, relance et remplis ta fiche au mieux pour battre le record.",
        players: '1 – 8 joueurs',
        rules: "<p>But : maximiser le total de ta fiche de score.</p><ul><li>À ton tour, lance 5 dés, jusqu'à 3 lancers en gardant les dés voulus.</li><li>Place ensuite le résultat dans une catégorie (brelan, full, suite, Yahtzee…).</li><li>Chaque case ne se remplit qu'une seule fois.</li><li>Bonus +35 si la section haute atteint 63 ; +100 par Yahtzee supplémentaire.</li></ul>",
        score: "Bonus de +35 pts si la section haute (1 à 6) atteint 63 pts. +100 pts pour chaque Yahtzee supplémentaire. Le classement est basé sur le score total cumulé sur toutes les parties.",
    },
    puissance4: {
        gameType: 'PUISSANCE4' as const,
        bot: true,
        noOptions: 'Puissance 4 — solo (vs bot) ou 2 joueurs.',
        label: 'Puissance 4',
        mode: 'both' as const,
        higherIsBetter: true,
        scoreLabel: 'Victoires',
        description: "Le duel de réflexion en grille, simple à prendre en main. Aligne quatre pions avant ton adversaire — ou le bot.",
        players: 'vs bot ou 2j',
        rules: "<p>But : aligner 4 pions avant l'adversaire.</p><ul><li>À tour de rôle, lâche un pion dans une colonne ; il tombe tout en bas.</li><li>Aligne 4 pions à l'horizontale, la verticale ou en diagonale pour gagner.</li><li>Grille pleine sans alignement = match nul.</li></ul>",
        score: "1 point par victoire. Le classement est basé sur le total de victoires accumulées.",
    },
    just_one: {
        gameType: 'JUST_ONE' as const,
        noOptions: 'Just One — 3 à 7 joueurs.',
        label: 'Just One',
        mode: 'multi' as const,
        higherIsBetter: true,
        scoreLabel: 'Score moyen',
        description: "Un jeu coopératif d'indices où l'on gagne — ou perd — ensemble. Aidez le devineur, mais gare aux indices en double !",
        players: '3 – 7 joueurs',
        rules: "<p>But : faire deviner un maximum de mots, tous ensemble.</p><ul><li>Un joueur est le devineur ; les autres écrivent chacun un indice d'un seul mot.</li><li>Les indices identiques s'annulent avant d'être montrés.</li><li>Le devineur n'a qu'un seul essai par mot.</li><li>13 manches au total ; le score est commun à toute l'équipe.</li></ul>",
        score: "1 point par mot trouvé, sur 13 manches au total. Le classement reflète le score moyen de l'équipe par partie.",
    },
    battleship: {
        gameType: 'BATTLESHIP' as const,
        bot: true,
        noOptions: 'Bataille Navale — solo (vs bot) ou 2 joueurs.',
        label: 'Bataille Navale',
        mode: 'both' as const,
        higherIsBetter: true,
        scoreLabel: 'Victoires',
        description: "Le duel naval en aveugle, contre le bot ou un adversaire. Repère et coule sa flotte avant qu'il ne coule la tienne.",
        players: 'vs bot ou 2j',
        rules: "<p>But : couler toute la flotte adverse.</p><ul><li>Place secrètement tes navires sur ta grille.</li><li>À tour de rôle, annonce une case pour tirer.</li><li>Un coup au but te laisse rejouer.</li><li>Le premier à perdre toute sa flotte a perdu.</li></ul>",
        score: "1 point par victoire. Le classement est basé sur le nombre total de victoires.",
    },
    diamant: {
        gameType: 'DIAMANT' as const,
        bot: true,
        noOptions: 'Diamant — 2 à 8 joueurs.',
        label: 'Diamant',
        mode: 'both' as const,
        higherIsBetter: true,
        scoreLabel: 'Points',
        description: "Un push-your-luck d'exploration de grotte à plusieurs. Ramasse un max de gemmes… et sors avant de tout perdre !",
        players: '1 – 8 joueurs',
        rules: "<p>But : rapporter le plus de gemmes dans ton coffre sur 5 manches.</p><ul><li>Chaque tour, une carte est révélée : des gemmes (partagées entre les explorateurs restants) ou un danger.</li><li>Avant chaque carte, choisis de continuer ou de sortir pour sécuriser tes gains.</li><li>Si le même danger sort 2 fois, ceux encore dans la grotte repartent les mains vides.</li><li>Les reliques ne se prennent qu'en sortant seul (10 puis 20 diamants).</li></ul>",
        score: "Les gemmes rapportées dans votre coffre comptent comme points. Le classement est basé sur le total de points cumulés sur 5 manches.",
    },
    ludo: {
        gameType: 'LUDO' as const,
        bot: true,
        label: 'Ludo',
        mode: 'both' as const,
        higherIsBetter: true,
        scoreLabel: 'Victoires',
        description: "Le jeu de parcours et de dé, jusqu'à 4 joueurs ou contre le bot. Sors tes pions, capture ceux des autres et rentre à la maison en premier.",
        players: '2 – 4 joueurs (ou vs bot)',
        rules: "<p>But : ramener tes 4 pions à la maison avant les autres.</p><ul><li>Lance le dé à ton tour pour avancer un pion.</li><li>Sortir un pion de la base demande un 6 (selon l'option).</li><li>Atterrir sur un pion adverse le renvoie à sa base.</li><li>Les cases étoilées sont des refuges sûrs.</li></ul>",
        score: "1 point par victoire. Le classement est basé sur le total de victoires accumulées.",
    },
    perudo: {
        gameType: 'PERUDO' as const,
        bot: true,
        label: 'Perudo',
        mode: 'both' as const,
        higherIsBetter: true,
        scoreLabel: 'Victoires',
        description: "Le jeu de dés et de bluff sud-américain, tendu jusqu'au bout. Surenchéris ou démasque le menteur — mais ne te trompe pas.",
        players: '2 – 6 joueurs (ou vs bot)',
        rules: "<p>But : être le dernier joueur à avoir encore des dés.</p><ul><li>Chacun lance ses dés en secret sous son gobelet.</li><li>À tour de rôle, annonce « X dés de valeur Y », en dépassant strictement l'annonce précédente.</li><li>Les 1 (Paco) sont jokers et comptent pour n'importe quelle valeur.</li><li>Crie « Dudo » si tu n'y crois pas : on révèle. Le perdant du défi perd un dé.</li><li>À 0 dé, tu es éliminé.</li></ul>",
        score: "1 point par victoire. Le classement est basé sur le total de victoires.",
    },
    cant_stop: {
        gameType: 'CANT_STOP' as const,
        bot: true,
        label: "Can't Stop",
        mode: 'both' as const,
        higherIsBetter: true,
        scoreLabel: 'Victoires',
        description: "Un push-your-luck aux dés où la cupidité se paie cash. Avance sur tes colonnes… mais sache t'arrêter avant le bust.",
        players: '2 – 4 joueurs (ou vs bot)',
        rules: "<p>But : sécuriser le premier 3 colonnes jusqu'au sommet.</p><ul><li>Lance 4 dés et choisis l'un des 3 appariements possibles.</li><li>Avance tes marqueurs sur les colonnes correspondant aux sommes (3 marqueurs temporaires max).</li><li>Continue pour progresser, ou stoppe pour sécuriser ta progression.</li><li>Aucun appariement jouable = bust : tu perds toute la progression du tour.</li></ul>",
        score: "1 point par victoire. Le classement est basé sur le total de victoires.",
    },
    mille_bornes: {
        gameType: 'MILLE_BORNES' as const,
        bot: true,
        label: 'Mille Bornes',
        mode: 'both' as const,
        higherIsBetter: true,
        scoreLabel: 'Victoires',
        description: "La course automobile en cartes, pleine de coups bas. Avale les kilomètres, attaque tes rivaux et dégaine la botte au bon moment.",
        players: '2 – 4 joueurs (ou vs bot)',
        rules: "<p>But : atteindre le premier la distance cible (700 ou 1000 km).</p><ul><li>Pose des cartes Distance (25 à 200 km) pour avancer — il te faut un feu vert.</li><li>Attaque un adversaire (Accident, Panne, Crevaison, Stop, Limite) : il doit jouer la parade pour repartir.</li><li>Les 4 bottes immunisent ; jouée juste après l'attaque, c'est un Coup Fourré (rejoue aussitôt).</li><li>Atteins exactement la distance cible pour gagner la manche.</li></ul>",
        score: "1 point par victoire. Le classement est basé sur le total de victoires.",
    },
    atlantide: {
        gameType: 'ATLANTIDE' as const,
        bot: true,
        noOptions: "Les Rescapés de l'Atlantide — 2 à 4 joueurs (ou vs bot).",
        label: "Les Rescapés de l'Atlantide",
        mode: 'both' as const,
        higherIsBetter: true,
        scoreLabel: 'Points',
        description: "Un jeu de sauvetage tendu sur une île qui sombre. Mets tes pions à l'abri avant que le volcan ne tout engloutisse.",
        players: '2 – 4 joueurs (ou vs bot)',
        rules: "<p>But : sauver le plus de pions avant l'éruption.</p><ul><li>À ton tour : déplace tes pions (3 points de mouvement) vers les refuges aux coins, à la nage ou en bateau.</li><li>Retire ensuite une tuile de l'île — son effet s'applique (créature, bateau, tourbillon…).</li><li>Lance le dé créature : requin (dévore les nageurs), baleine (retourne les bateaux), serpent (détruit tout).</li><li>L'île s'engloutit par paliers : plages, puis forêts, puis montagnes.</li><li>À l'éruption, tout ce qui n'est pas à l'abri est perdu.</li></ul>",
        score: "Chaque pion sauvé rapporte sa valeur cachée (1 à 6). Le classement est basé sur le total de points cumulés.",
    },
    impostor: {
        gameType: 'IMPOSTOR' as const,
        label: 'Imposteur',
        mode: 'multi' as const,
        higherIsBetter: true,
        scoreLabel: 'Points',
        description: "Un jeu de bluff et de déduction entre amis. Donne des indices subtils… ou improvise pour ne pas te faire griller en imposteur.",
        players: '4 – 8 joueurs',
        rules: "<p>But : démasquer l'imposteur — ou survivre en étant lui.</p><ul><li>Les joueurs reçoivent un mot secret ; l'imposteur, lui, l'ignore.</li><li>Chacun donne à tour de rôle un indice sur le mot, sans trop se dévoiler.</li><li>Option Mister White : un joueur reçoit un mot proche mais différent, sans le savoir.</li><li>Après les tours de parole, tout le monde vote pour éliminer un suspect.</li><li>Démasqué, l'imposteur peut tenter de deviner le mot pour voler la manche.</li></ul>",
        score: "<p>Imposteur éliminé : <ul><li>+2 pts pour chaque joueur ayant voté pour lui</li><li>+1 pt par joueur de l'équipe</li></ul></p><br><p>Vote raté : <ul><li>+3 pts pour l'imposteur</li><li>+1 pt par joueur ayant quand même voté pour lui</li></ul></p><br><p>Mister White (si option activée) : <ul><li>Non identifié : +2 pts pour le Mister White</li><li>Identifié : +1 pt pour chaque joueur ayant voté pour lui</li></ul></p><br><p>Dans tous les cas, l'imposteur peut tenter de deviner le mot mystère après le vote. S'il devine correctement : +2 pts et il remporte la manche malgré l'élimination. Le classement est basé sur le total de points cumulés.</p>",
    },
    spyfall: {
        gameType: 'SPYFALL' as const,
        label: 'Spyfall',
        mode: 'multi' as const,
        higherIsBetter: true,
        scoreLabel: 'Points',
        description: "Un jeu d'interrogatoire et de bluff, idéal en appel vocal. Trouvez l'espion par vos questions… sans révéler le lieu secret.",
        players: '3 – 8 joueurs',
        rules: "<p>But : démasquer l'espion — ou, pour lui, deviner le lieu.</p><ul><li>Tout le monde connaît le lieu et reçoit un rôle, sauf l'espion.</li><li>À tour de rôle, le joueur actif interroge un autre à l'oral, qui interroge à son tour.</li><li>Les civils traquent l'espion par des questions fines, sans trahir le lieu.</li><li>Après les échanges (ou un vote), tout le monde désigne un suspect.</li><li>L'espion peut se déclarer et tenter de deviner le lieu pour gagner.</li></ul>",
        score: "<p>Espion non démasqué : <ul><li>+3 pts pour l'espion</li></ul></p><br><p>Espion démasqué : <ul><li>+1 pt par civil</li><li>+1 pt bonus si le civil a voté pour l'espion</li></ul></p><br><p>Après avoir été démasqué (ou en se déclarant), l'espion peut deviner le lieu : s'il trouve, +2 pts et il vole la victoire. Le classement est basé sur le total de points cumulés.</p>",
    },
    snake: {
        gameType: 'SNAKE' as const,
        label: 'Snake',
        mode: 'solo' as const,
        higherIsBetter: true,
        scoreLabel: 'Meilleur score',
        description: "Le serpent rétro qui ne s'arrête jamais de grandir. Avale un max de pommes sans te mordre la queue.",
        players: '1 joueur',
        rules: "<p>But : faire le plus gros score sans collision.</p><ul><li>Dirige le serpent avec les flèches (ou ZQSD).</li><li>Mange les pommes rouges pour grandir et marquer.</li><li>Game over si tu heurtes un mur ou ton propre corps.</li></ul>",
        score: "Chaque pomme rapporte 10 points. Seul votre meilleur score par partie est conservé pour le classement.",
    },
    pacman: {
        gameType: 'PACMAN' as const,
        label: 'Pac-Man',
        mode: 'solo' as const,
        higherIsBetter: true,
        scoreLabel: 'Meilleur score',
        description: "Le classique du labyrinthe et des fantômes. Gobe tous les points en esquivant les spectres.",
        players: '1 joueur',
        rules: "<p>But : nettoyer le labyrinthe en survivant.</p><ul><li>Déplace Pac-Man avec les flèches (ou ZQSD).</li><li>Mange tous les points du niveau.</li><li>Évite les fantômes : un contact coûte une vie.</li><li>Les super-gommes te laissent les dévorer un court instant.</li></ul>",
        score: "10 pts par point, 50 pts par super-gomme, 200 pts par fantôme mangé. Seul votre meilleur score est conservé.",
    },
    breakout: {
        gameType: 'BREAKOUT' as const,
        label: 'Casse-brique',
        mode: 'solo' as const,
        higherIsBetter: true,
        scoreLabel: 'Meilleur score',
        description: "Le casse-brique nerveux à la palette et à la balle. Pulvérise tout le mur sans laisser tomber la balle.",
        players: '1 joueur',
        rules: "<p>But : détruire toutes les briques.</p><ul><li>Déplace la palette pour renvoyer la balle.</li><li>Casse les briques et ramasse les bonus qui tombent.</li><li>Tu as 3 vies : ne laisse pas la balle passer.</li></ul>",
        score: "10 pts par brique, 20 pts par brique dure. Meilleur score conservé pour le classement.",
    },
    tetris: {
        gameType: 'TETRIS' as const,
        label: 'Tetris',
        mode: 'solo' as const,
        higherIsBetter: true,
        scoreLabel: 'Meilleur score',
        description: "L'empilement de pièces le plus addictif de tous les temps. Complète des lignes et tiens le plus longtemps possible.",
        players: '1 joueur',
        rules: "<p>But : compléter un maximum de lignes.</p><ul><li>Déplace et oriente les pièces qui tombent.</li><li>Une ligne horizontale complète est éliminée.</li><li>La vitesse augmente avec les niveaux.</li><li>Game over quand la pile atteint le haut.</li></ul>",
        score: "100 pts par ligne × niveau, 300 pour 2 lignes, 500 pour 3, 800 pour un Tetris (4 lignes). Meilleur score conservé.",
    },
    sutom: {
        gameType: 'SUTOM' as const,
        label: 'Sutom',
        mode: 'solo' as const,
        higherIsBetter: true,
        scoreLabel: 'Meilleur score',
        description: "Le Motus à la française, un mot mystère par défi. Devine-le en 6 essais grâce aux indices de couleur.",
        players: '1 joueur',
        rules: "<p>But : trouver le mot en 6 essais maximum.</p><ul><li>La première lettre et la longueur du mot sont données.</li><li>Propose un mot de la bonne longueur commençant par cette lettre.</li><li>Lettre bien placée = allumée ; présente mais mal placée = signalée ; absente sinon.</li><li>Gagner vite sur un mot long rapporte le plus.</li></ul>",
        score: "Victoire = (7 − nombre d'essais) × 100 + 25 par lettre du mot. Gagner vite sur un mot long rapporte le plus. Seul votre meilleur score est conservé.",
    },
    space_invaders: {
        gameType: 'SPACE_INVADERS' as const,
        label: 'Space Invaders',
        mode: 'solo' as const,
        higherIsBetter: true,
        scoreLabel: 'Meilleur score',
        description: "La défense spatiale rétro, vague après vague. Repousse l'invasion alien avant qu'elle ne t'atteigne.",
        players: '1 joueur',
        rules: "<p>But : survivre et marquer le plus possible.</p><ul><li>Déplace ton vaisseau et tire sur les aliens.</li><li>Les rangées du haut valent plus de points.</li><li>Esquive les tirs ennemis : tu as 3 vies.</li><li>Chaque vague nettoyée en fait surgir une plus rapide.</li></ul>",
        score: "10 à 30 points par alien selon la rangée. Seul votre meilleur score est conservé pour le classement.",
    },
    '2048': {
        gameType: 'GAME_2048' as const,
        label: '2048',
        mode: 'solo' as const,
        higherIsBetter: true,
        scoreLabel: 'Meilleur score',
        description: "Le puzzle de fusion qui rend accro. Combine les tuiles jusqu'à atteindre 2048… et au-delà.",
        players: '1 joueur',
        rules: "<p>But : faire le plus gros score en fusionnant les tuiles.</p><ul><li>Glisse les tuiles dans une direction : toutes se déplacent.</li><li>Deux tuiles identiques qui se rencontrent fusionnent en doublant.</li><li>Une nouvelle tuile (2 ou 4) apparaît à chaque coup.</li><li>Game over quand plus aucun mouvement n'est possible.</li></ul>",
        score: "Le score augmente de la valeur de chaque tuile fusionnée. Seul votre meilleur score est conservé.",
    },
    flappy_bird: {
        gameType: 'FLAPPY_BIRD' as const,
        label: 'Flappy Bird',
        mode: 'solo' as const,
        higherIsBetter: true,
        scoreLabel: 'Meilleur score',
        description: "Le jeu d'adresse minimaliste et impitoyable. Bats des ailes pour franchir un max de tuyaux.",
        players: '1 joueur',
        rules: "<p>But : passer le plus de tuyaux possible.</p><ul><li>Appuie sur Espace (ou tape l'écran) pour donner un coup d'aile.</li><li>La gravité fait redescendre l'oiseau en continu.</li><li>Évite les tuyaux et le sol.</li><li>1 point par tuyau franchi.</li></ul>",
        score: "1 point par tuyau franchi. Seul votre meilleur score est conservé pour le classement.",
    },
    plumber: {
        gameType: 'PLUMBER' as const,
        label: 'Plumber',
        mode: 'solo' as const,
        higherIsBetter: true,
        scoreLabel: 'Meilleur score',
        description: "Un platformer d'action aux faux airs de plombier. Cours, saute, écrase les ennemis et ramasse les pièces.",
        players: '1 joueur',
        rules: "<p>But : aller le plus loin en marquant un maximum.</p><ul><li>Cours vers la droite ; saute par-dessus les trous et les ennemis.</li><li>Écrase les ennemis en leur sautant dessus.</li><li>Champignon = vie en plus ; fleur de feu = boules de feu.</li><li>Tu meurs en touchant un ennemi sans pouvoir, ou en tombant dans un trou.</li></ul>",
        score: "1 pt par pièce, 5 pts par ennemi écrasé, bonus de distance et de power-up. Seul votre meilleur score est conservé.",
    },
    abalone: {
        gameType: 'ABALONE' as const,
        bot: true,
        noOptions: 'Abalone — solo (vs bot) ou 2 joueurs.',
        label: 'Abalone',
        mode: 'both' as const,
        higherIsBetter: true,
        scoreLabel: 'Victoires',
        description: "Le grand classique abstrait à billes, sur plateau hexagonal. Pousse 6 billes adverses hors du plateau pour l'emporter.",
        players: 'vs bot ou 2j',
        rules: "<p>But : éjecter 6 billes adverses du plateau.</p><ul><li>À ton tour, déplace 1, 2 ou 3 billes alignées d'une case.</li><li>Coup en ligne (dans l'axe des billes) ou de flanc (latéral, sur cases vides).</li><li>Sumito : pousse les billes adverses en supériorité dans l'axe (3 vs 2, 3 vs 1, 2 vs 1) — jamais à égalité ni si une bille bloque derrière.</li><li>Une bille poussée hors du plateau est éjectée.</li></ul>",
        score: "1 point par victoire. Le classement est basé sur le total de victoires.",
    },
    blokus: {
        gameType: 'BLOKUS' as const,
        bot: true,
        noOptions: 'Blokus — 2 à 4 joueurs (places libres comblées par des bots).',
        label: 'Blokus',
        mode: 'both' as const,
        higherIsBetter: true,
        scoreLabel: 'Score',
        description: "Jeu de pose de pièces sur un plateau de 20×20. Chaque couleur place ses 21 polyominoes en partant de son coin pour couvrir un maximum de cases.",
        players: '2 à 4 joueurs',
        rules: "<p>But : poser le plus de cases possible (toutes ses pièces idéalement).</p><ul><li>Ta 1ʳᵉ pièce doit couvrir ton coin de départ.</li><li>Ensuite, chaque nouvelle pièce doit toucher une de tes pièces par un coin, jamais par un côté.</li><li>Tes pièces peuvent toucher celles des adversaires par les côtés sans contrainte.</li><li>Tu passes quand tu ne peux plus poser ; la partie finit quand plus personne ne peut jouer.</li></ul>",
        score: "Score = nombre de cases posées. Bonus de +15 si tu poses toutes tes pièces, +5 de plus si la dernière est le monomino. Classement ELO.",
    },
    six_qui_prend: {
        gameType: 'SIX_QUI_PREND' as const,
        bot: true,
        noOptions: '6 qui prend! — 2 à 10 joueurs (places libres comblées par des bots).',
        label: '6 qui prend!',
        mode: 'both' as const,
        higherIsBetter: false,
        scoreLabel: 'Têtes',
        description: "Jeu de cartes malin où il faut éviter de ramasser. Chaque tour, tout le monde pose une carte en même temps et la 6ᵉ d'une rangée fait tout ramasser.",
        players: '2 à 10 joueurs',
        rules: "<p>But : avoir le moins de têtes de bœuf possible.</p><ul><li>Chacun choisit une carte (1 à 104) en secret, puis on révèle.</li><li>Les cartes se placent par ordre croissant, chacune à la suite de la rangée à la tête la plus haute mais inférieure à elle.</li><li>Poser la 6ᵉ carte d'une rangée = tu ramasses les 5 précédentes (leurs têtes comptent en malus).</li><li>Carte plus basse que toutes les rangées = tu ramasses la rangée de ton choix.</li><li>La partie s'arrête dès qu'un joueur atteint 66 têtes ; le moins de têtes gagne.</li></ul>",
        score: "Score = nombre de têtes de bœuf ramassées (le plus bas gagne). Classement ELO.",
    },
    complot: {
        gameType: 'COMPLOT' as const,
        bot: false,
        noOptions: 'Complot — 2 à 6 joueurs (humains uniquement).',
        label: 'Complot',
        mode: 'multi' as const,
        higherIsBetter: true,
        scoreLabel: 'Victoires',
        description: "Jeu de bluff et de déduction. Manipule, conteste et élimine : sois le dernier joueur avec de l'influence.",
        players: '2 à 6 joueurs',
        rules: "<p>But : être le dernier joueur à garder de l'influence (cartes).</p><ul><li>Chacun démarre avec 2 cartes-personnages cachées et 2 pièces.</li><li>À ton tour, une action : Revenu (+1), Aide étrangère (+2, bloquée par le Duc), Coup (−7, fait perdre une influence), ou une action de personnage que tu revendiques (vrai ou bluff).</li><li>Personnages : Duc (Taxe +3), Assassin (−3, tue une influence, bloqué par la Comtesse), Capitaine (vole 2 pièces, bloqué par Capitaine/Ambassadeur), Ambassadeur (échange ses cartes).</li><li>N'importe qui peut Douter d'un personnage revendiqué : si c'est un bluff, le menteur perd une influence ; sinon c'est le contestataire qui perd la sienne.</li><li>Perdre ses 2 influences = éliminé.</li></ul>",
        score: "1 point par victoire. Classement ELO.",
    },
    tanks: {
        gameType: 'TANKS' as const,
        bot: true,
        noOptions: 'Tanks — duel d\'artillerie : solo (vs bot) ou 2 joueurs.',
        label: 'Tanks',
        mode: 'both' as const,
        higherIsBetter: true,
        scoreLabel: 'Victoires',
        description: "Duel d'artillerie tour par tour sur terrain destructible. Règle l'angle, la puissance et compose avec le vent pour détruire le tank adverse.",
        players: 'vs bot ou 2j',
        rules: "<p>But : réduire les points de vie du tank adverse à zéro.</p><ul><li>À ton tour, choisis ton arme, l'angle et la puissance du tir, puis fais feu.</li><li>L'obus subit la gravité et le vent (indiqué à chaque tour) : anticipe la dérive.</li><li>Une explosion inflige des dégâts de zone (plus tu es proche, plus ça fait mal) et creuse le terrain.</li><li>Trois armes, chacune un compromis : <b>Obus</b> (équilibré), <b>Perforant</b> (petit rayon mais gros dégâts — récompense la précision), <b>Fragmentation</b> (grand rayon facile à toucher mais faibles dégâts). Plus le rayon est grand, plus c'est facile de toucher… mais moins ça fait mal.</li><li>Le premier à détruire l'adversaire gagne la manche.</li></ul>",
        score: "1 point par victoire. Classement ELO.",
    },
    duel: {
        gameType: 'DUEL' as const,
        label: 'Duel',
        mode: 'solo' as const,
        higherIsBetter: true,
        scoreLabel: 'Préférences',
        description: "Un jeu de préférences sans enjeu : choisis une catégorie, puis élimine à chaque duel ton item le moins préféré jusqu'au grand gagnant.",
        players: '1 joueur',
        rules: "<p>But : désigner ton favori dans une catégorie.</p><ul><li>Choisis une catégorie (Pokémon, nourriture, streamers…).</li><li>À chaque tour, deux items s'affrontent : clique sur celui que tu préfères, l'autre est éliminé.</li><li>Continue jusqu'à la finale, puis admire ton podium.</li></ul>",
        score: "Jeu sans score — juste pour le plaisir de classer tes préférences. Rien n'est enregistré.",
    },
    match3: {
        gameType: 'MATCH3' as const,
        label: 'Aligne-3',
        mode: 'solo' as const,
        higherIsBetter: true,
        scoreLabel: 'Meilleur score',
        description: "Le puzzle de gemmes qui rend accro. Échange deux gemmes voisines pour aligner trois symboles ou plus et déclenche des cascades.",
        players: '1 joueur',
        rules: "<p>But : faire le plus gros score avant la fin du chrono.</p><ul><li>Clique deux gemmes voisines pour les échanger.</li><li>Un échange n'est valide que s'il aligne au moins 3 gemmes identiques (en ligne ou en colonne).</li><li>Les gemmes alignées explosent, celles du dessus tombent et de nouvelles arrivent : les enchaînements (cascades) rapportent plus de points… et plus de temps.</li><li>Chaque alignement rallonge le chrono (gros combos = gros bonus). Bien jouer prolonge la partie ; elle s'arrête quand le temps est épuisé.</li></ul>",
        score: "Score = gemmes détruites × multiplicateur de cascade. Seul votre meilleur score est conservé.",
    },
} as const;

export type GameType = keyof typeof GAME_CONFIG;
export type GameMode = 'solo' | 'both' | 'multi';

export const GAME_LABEL_MAP = Object.fromEntries(
    Object.values(GAME_CONFIG).map(g => [g.gameType, g.label])
) as Record<string, string>;

export const GAME_OPTIONS = Object.entries(GAME_CONFIG).map(([key, g]) => ({
    value: key as GameType,
    label: g.label,
}));

export const LOBBY_GAME_OPTIONS = GAME_OPTIONS.filter(
    g => (GAME_CONFIG[g.value] as { mode: string }).mode !== 'solo'
);

// Plage de joueurs par jeu [min, max] (solo = [1, 1]). Source unique des 2 maps dérivées ci-dessous.
const PLAYER_RANGE: Record<GameType, [number, number]> = {
    quiz: [1, 30], uno: [2, 8], taboo: [4, 12], skyjow: [2, 8], yahtzee: [2, 8],
    puissance4: [2, 2], just_one: [3, 7], battleship: [2, 2], diamant: [2, 8],
    ludo: [2, 4], perudo: [2, 6], cant_stop: [2, 4], mille_bornes: [2, 4], atlantide: [2, 4],
    impostor: [4, 8], spyfall: [3, 8], abalone: [2, 2], blokus: [2, 4], six_qui_prend: [2, 10], tanks: [2, 2], complot: [2, 6],
    snake: [1, 1], pacman: [1, 1], breakout: [1, 1], tetris: [1, 1], sutom: [1, 1],
    space_invaders: [1, 1], '2048': [1, 1], flappy_bird: [1, 1], plumber: [1, 1], match3: [1, 1], duel: [1, 1],
};

// Liste des effectifs jouables (ex. uno → [2,3,4,5,6,7,8]) pour les sélecteurs.
export const MAX_PLAYERS_BY_GAME = Object.fromEntries(
    Object.entries(PLAYER_RANGE).map(([k, [min, max]]) => [k, Array.from({ length: max - min + 1 }, (_, i) => min + i)]),
) as Record<GameType, number[]>;

// Minimum de joueurs des jeux non-solo (les solos n'ont pas de minimum de lobby).
export const MIN_PLAYERS: Partial<Record<GameType, number>> = Object.fromEntries(
    Object.entries(PLAYER_RANGE)
        .filter(([k]) => GAME_CONFIG[k as GameType].mode !== 'solo')
        .map(([k, [min]]) => [k, min]),
);

// Jeux affichant un message « pas d'options » dans le lobby (champ noOptions de l'entrée).
export const NO_OPTIONS_GAMES: Partial<Record<GameType, string>> = Object.fromEntries(
    Object.entries(GAME_CONFIG)
        .map(([k, g]) => [k, (g as { noOptions?: string }).noOptions])
        .filter(([, v]) => v),
) as Partial<Record<GameType, string>>;

// Jeux jouables contre un bot (champ bot de l'entrée).
export const BOT_SUPPORTED_GAMES: Set<string> = new Set(
    Object.entries(GAME_CONFIG).filter(([, g]) => (g as { bot?: boolean }).bot).map(([k]) => k),
);

// Badges par mode — chaque jeu n'apparaît que dans une seule catégorie
export const SOLO_GAMES: Record<string, { text: string; color: string }> = Object.fromEntries(
    Object.entries(GAME_CONFIG)
        .filter(([, g]) => (g.mode as GameMode) === 'solo')
        .map(([key]) => [key, { text: 'SOLO', color: '#A32D2D' }])
);

export const BOTH_GAMES: Record<string, { text: string; color: string }> = Object.fromEntries(
    Object.entries(GAME_CONFIG)
        .filter(([, g]) => (g.mode as GameMode) === 'both')
        .map(([key]) => [key, { text: 'MIXTE', color: '#7C3AED' }])
);

export const MULTI_GAMES: Record<string, { text: string; color: string }> = Object.fromEntries(
    Object.entries(GAME_CONFIG)
        .filter(([, g]) => (g.mode as GameMode) === 'multi')
        .map(([key]) => [key, { text: 'MULTI', color: '#1D4ED8' }])
);

/** Slug d'URL d'un jeu : les clés à underscore deviennent kebab-case (just_one → just-one). */
export const gameSlug = (key: GameType): string => key.replace(/_/g, '-');

// Jeux multijoueurs (hors quiz) — utilisés pour matcher les routes de lobby (cf. proxy.ts).
export const GAME_URL_SLUGS: readonly string[] = Object.entries(GAME_CONFIG)
    .filter(([key, g]) => g.mode !== 'solo' && key !== 'quiz')
    .map(([key]) => gameSlug(key as GameType));

// Route de chaque jeu jouable en ligne — toutes suivent /slug/:lobbyId(/:gameId).
export const GAME_ROUTES: Partial<Record<GameType, (lobbyId: string, gameId?: string) => string>> =
    Object.fromEntries(
        Object.entries(GAME_CONFIG)
            .filter(([, g]) => g.mode !== 'solo')
            .map(([key]) => {
                const s = gameSlug(key as GameType);
                return [key, (id: string, gid?: string) => (gid ? `/${s}/${id}/${gid}` : `/${s}/${id}`)];
            }),
    );
