// Tokens de vérification (reset de mot de passe, vérification d'email).
//
// Le token en clair n'existe que dans l'email envoyé à l'utilisateur : la base ne
// stocke que son SHA-256. Un accès en lecture à la table (dump, log, injection)
// ne permet donc plus de consommer un token en attente.
//
// SHA-256 nu (sans bcrypt/salt) est le bon choix ici : le token fait 256 bits
// d'entropie aléatoire, il n'est pas brute-forçable, et la consommation doit
// rester un lookup indexé O(1).
import { createHash, randomBytes } from 'crypto';
import prisma from '@/lib/prisma';

/** Empreinte stockée en base pour un token en clair. */
export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

/**
 * Génère un token, en persiste l'empreinte, et renvoie la valeur *en clair*
 * — la seule à transmettre par email. Purge au passage les tokens précédents
 * de cet identifiant.
 */
export async function issueVerificationToken(identifier: string, ttlMs: number): Promise<string> {
    const token = randomBytes(32).toString('hex');

    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({
        data: {
            identifier,
            token: hashToken(token),
            expires: new Date(Date.now() + ttlMs),
        },
    });

    return token;
}

/**
 * Valide un token en clair et le consomme (usage unique). Renvoie l'identifiant
 * associé, ou `null` si le token est inconnu ou expiré — un token expiré est
 * supprimé au passage.
 */
export async function consumeVerificationToken(token: string): Promise<string | null> {
    const hashed = hashToken(token);

    const record = await prisma.verificationToken.findUnique({ where: { token: hashed } });
    if (!record) return null;

    if (record.expires < new Date()) {
        await prisma.verificationToken.delete({ where: { token: hashed } });
        return null;
    }

    await prisma.verificationToken.delete({ where: { token: hashed } });
    return record.identifier;
}
