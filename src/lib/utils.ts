export const plural = (count: number, singular: string, pluriel: string) =>
    count <= 1 ? singular : pluriel;

export const randomLobbyId = () => {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
}
