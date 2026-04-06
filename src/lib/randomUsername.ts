const ADJECTIVES = ['Brave', 'Swift', 'Clever', 'Lucky', 'Bold', 'Calm', 'Dark', 'Fond', 'Kind', 'Wild'];
const NOUNS = ['Panda', 'Fox', 'Eagle', 'Wolf', 'Tiger', 'Bear', 'Hawk', 'Lion', 'Lynx', 'Raven'];

export function randomUsername(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 9000 + 1000);
    return `${adj}${noun}${num}`;
}
