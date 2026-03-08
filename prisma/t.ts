// prisma/seed.ts
import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();


async function main() {
    const words = [
        // Animaux
        'ÉLÉPHANT', 'GIRAFE', 'CROCODILE', 'PINGOUIN', 'DAUPHIN', 'PANTHÈRE', 'FLAMANT', 'KANGOUROU',
        'CAMÉLÉON', 'HIPPOPOTAME', 'AUTRUCHE', 'PERROQUET', 'SCORPION', 'PIEUVRE', 'BALEINE',
        // Objets
        'PARAPLUIE', 'TÉLESCOPE', 'MICROSCOPE', 'ACCORDÉON', 'TRAMPOLINE', 'ESCALATOR', 'BOUILLOIRE',
        'LAMPADAIRE', 'FRIGO', 'ASPIRATEUR', 'CALCULATRICE', 'CHRONOMÈTRE', 'THERMOMÈTRE',
        // Lieux
        'BIBLIOTHÈQUE', 'AQUARIUM', 'VOLCAN', 'DÉSERT', 'GLACIER', 'PHARE', 'CATHÉDRALE', 'CASINO',
        'STADE', 'CIRQUE', 'CIMETIÈRE', 'LABORATOIRE', 'OBSERVATOIRE', 'MANÈGE',
        // Concepts
        'GRAVITÉ', 'DÉMOCRATIE', 'RENAISSANCE', 'RÉVOLUTION', 'PHOTOSYNTHÈSE', 'HIBERNATION',
        'MIGRATION', 'ÉVOLUTION', 'INFLATION', 'PANDÉMIE', 'PROPHÉTIE', 'PARADOXE',
        // Métiers
        'ARCHÉOLOGUE', 'ASTRONAUTE', 'POMPIER', 'VÉTÉRINAIRE', 'SOMMELIER', 'CARTOGRAPHE',
        'CHORÉGRAPHE', 'MARIONNETTISTE', 'APICULTEUR', 'PLONGEUR', 'GLACIOLOGUE',
        // Sport / Loisirs
        'SKATEBOARD', 'PARACHUTE', 'PLANCHE À VOILE', 'TRAMPOLINE', 'BOOMERANG', 'CALLIGRAPHIE',
        'ORIGAMI', 'ESCALADE', 'ESCRIME', 'BOXE', 'NATATION', 'MARATHON',
        // Nourriture
        'GUACAMOLE', 'CROISSANT', 'FONDUE', 'SUSHI', 'RAVIOLI', 'MACARON', 'SOUFFLÉ', 'CRÊPE',
        'COUSCOUS', 'PAELLA', 'TIRAMISU', 'ÉCLAIR', 'MADELEINE',
    ];
    for (const word of words) {
        await prisma.word.upsert({
            where: { word },
            update: {},
            create: { word },
        });
    }
}
main()
    .catch((e) => {
        console.error('❌ Erreur lors du seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
