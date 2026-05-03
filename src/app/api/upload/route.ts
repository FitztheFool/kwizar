// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });
        }

        // Convertir le File en Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload vers Cloudinary via un stream
        const url = await new Promise<string>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'quiz', resource_type: 'image' },
                (error, result) => {
                    if (error || !result) return reject(error ?? new Error('Upload échoué'));
                    resolve(result.secure_url);
                }
            );
            stream.end(buffer);
        });

        return NextResponse.json({ url });
    } catch (e: any) {
        console.error('Erreur upload Cloudinary:', e);
        return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 });
    }
}
