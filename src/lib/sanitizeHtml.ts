// Assainissement du HTML de contenu (descriptions / règles / calcul des points des jeux),
// rendu via `dangerouslySetInnerHTML` sur la page de classement.
//
// Ces champs sont surchargeables depuis l'admin. Sans filtrage, un compte admin
// compromis injecte du JS exécuté chez tous les visiteurs du classement (la CSP
// autorise `script-src 'unsafe-inline'`).
//
// Stratégie : tout échapper, puis ré-autoriser une liste blanche fermée de balises
// de mise en forme, sans aucun attribut. Une liste noire serait contournable
// (`<img onerror>`, `<svg onload>`, `javascript:`, encodages exotiques…) ; ici rien
// ne peut survivre à l'échappement sauf ce qu'on réintroduit explicitement.

/** Balises de mise en forme autorisées. Aucun attribut n'est conservé. */
const ALLOWED_TAGS = ['p', 'ul', 'ol', 'li', 'b', 'strong', 'i', 'em', 'br'] as const;

/** Balises vides (pas de fermeture). */
const VOID_TAGS = new Set(['br']);

// Seuls `<` et `>` ouvrent du balisage, et `&` amorce une entité. Les guillemets ne sont
// dangereux qu'en contexte d'attribut — or la sortie n'en contient jamais (tous les
// attributs sont supprimés). Les échapper mutilerait le texte français (« d'une » →
// « d&#39;une »).
function escapeHtml(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Renvoie une version sûre de `html` : seules les balises de `ALLOWED_TAGS` subsistent,
 * dépouillées de leurs attributs. Tout le reste (scripts, gestionnaires d'événements,
 * URLs `javascript:`, balises inconnues) est neutralisé par échappement.
 */
export function sanitizeContentHtml(html: string): string {
    if (!html) return '';

    const escaped = escapeHtml(html);

    // Ré-autorise `<tag>` et `</tag>` pour la liste blanche uniquement. On repart de la
    // chaîne échappée, donc `&lt;p&gt;` ne peut provenir que d'un `<p>` d'origine : un
    // `<p onclick=…>` a vu ses attributs échappés et ne correspondra pas au motif.
    const alternation = ALLOWED_TAGS.join('|');
    const openOrClose = new RegExp(`&lt;(\\/?)(${alternation})\\s*(\\/?)&gt;`, 'gi');

    return escaped.replace(openOrClose, (_match, slash: string, tag: string) => {
        const name = tag.toLowerCase();
        if (slash) return VOID_TAGS.has(name) ? '' : `</${name}>`;
        return VOID_TAGS.has(name) ? `<${name}>` : `<${name}>`;
    });
}
