// Position en pourcentage (sur l'image du plateau) du centre de chaque case.
// Le plateau réel (image) porte déjà les chiffres : on ne pose QUE les pions.
//
// Colonnes 2..12, chacune avec sa longueur. Toutes partagent la même base et le
// même pas vertical ; seule la colonne (x) et la longueur changent.

export const COLUMN_LENGTHS: Record<number, number> = {
    2: 3, 3: 5, 4: 7, 5: 9, 6: 11, 7: 13, 8: 11, 9: 9, 10: 7, 11: 5, 12: 3,
};

// Centre horizontal de chaque colonne (% largeur).
const COLUMN_X: Record<number, number> = {
    2: 14, 3: 21, 4: 28, 5: 35, 6: 42, 7: 50, 8: 58, 9: 65, 10: 72, 11: 79, 12: 86,
};

const BASE_Y = 83.5;  // centre de la case du bas (position 1), en % hauteur
const PITCH_Y = 5.55; // écart vertical entre deux cases, en % hauteur

/** Centre {x,y} en % de la case `pos` (1 = bas) de la colonne `col`. */
export function cellCenter(col: number, pos: number): { x: number; y: number } {
    return {
        x: COLUMN_X[col],
        y: BASE_Y - (pos - 1) * PITCH_Y,
    };
}
