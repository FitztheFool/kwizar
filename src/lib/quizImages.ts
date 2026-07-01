// src/lib/quizImages.ts
// Génération d'images de quiz via Pollinations (Flux, gratuit, sans clé) + hébergement Cloudinary
// pour une URL stable. Utilisé en FALLBACK quand Unsplash ne renvoie rien :
//   - bannière du quiz (synchronously, au moment de la génération)
//   - image d'une question (en async/after au moment de la sauvegarde)
// Retourne null sur le moindre échec → l'appelant retombe sur le défaut / pas d'image.
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const BANNER_STYLE = 'wide cinematic quiz banner illustration, premium polished render, rich saturated colors, '
    + 'soft volumetric lighting, subtle depth, dark atmospheric background with a soft glow, highly detailed, '
    + 'subject centered, no text, no words, no watermark';

const QUESTION_STYLE = 'clear realistic illustration, single subject centered, clean simple background, '
    + 'natural lighting, highly detailed, no text, no words, no watermark';

async function fetchFluxImage(prompt: string, w: number, h: number, timeoutMs = 25000): Promise<Buffer | null> {
    const seed = Math.floor(Math.random() * 100000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
        + `?width=${w}&height=${h}&nologo=true&model=flux&seed=${seed}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
        if (!res.ok) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        return buf.length > 1000 ? buf : null;
    } catch {
        return null; // timeout / réseau → on laisse tomber proprement
    } finally {
        clearTimeout(t);
    }
}

async function uploadBufferToCloudinary(buf: Buffer, folder: string): Promise<string | null> {
    try {
        const dataUri = `data:image/jpeg;base64,${buf.toString('base64')}`;
        const res = await cloudinary.uploader.upload(dataUri, { folder, resource_type: 'image' });
        return res.secure_url ?? null;
    } catch (e) {
        console.error('[quizImages] upload Cloudinary échoué:', e);
        return null;
    }
}

/** Bannière de quiz générée + hébergée. Renvoie l'URL Cloudinary, ou null si indisponible. */
export async function generateQuizBanner(subject: string): Promise<string | null> {
    const topic = subject.trim();
    // Sans Cloudinary on ne pourrait pas stabiliser l'URL → on n'essaie même pas.
    if (!topic || !process.env.CLOUDINARY_CLOUD_NAME) return null;
    const buf = await fetchFluxImage(`${topic}, ${BANNER_STYLE}`, 768, 432);
    return buf ? uploadBufferToCloudinary(buf, 'quiz/ai') : null;
}

/** Image illustrant une question (depuis l'imageQuery du LLM). URL Cloudinary, ou null. */
export async function generateQuestionImage(query: string): Promise<string | null> {
    const q = query.trim();
    if (!q || !process.env.CLOUDINARY_CLOUD_NAME) return null;
    const buf = await fetchFluxImage(`${q}, ${QUESTION_STYLE}`, 768, 432);
    return buf ? uploadBufferToCloudinary(buf, 'quiz/ai/questions') : null;
}
