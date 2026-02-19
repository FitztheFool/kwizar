export const plural = (count: number, singular: string, pluriel: string) =>
    count <= 1 ? singular : pluriel;
