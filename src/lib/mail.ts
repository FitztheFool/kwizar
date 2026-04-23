import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

const FROM = `Kwizar <${process.env.GMAIL_USER}>`;
const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

export async function sendVerificationEmail(email: string, token: string) {
    const url = `${APP_URL}/api/auth/verify-email?token=${token}`;
    await transporter.sendMail({
        from: FROM,
        to: email,
        subject: 'Confirmez votre adresse email',
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto">
                <h2>Bienvenue sur Kwizar !</h2>
                <p>Cliquez sur le bouton ci-dessous pour confirmer votre adresse email :</p>
                <a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
                    Confirmer mon email
                </a>
                <p style="margin-top:16px;color:#6b7280;font-size:13px">
                    Ce lien est valable 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.
                </p>
            </div>
        `,
    });
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const url = `${APP_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
        from: FROM,
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto">
                <h2>Réinitialisation du mot de passe</h2>
                <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
                <a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
                    Réinitialiser mon mot de passe
                </a>
                <p style="margin-top:16px;color:#6b7280;font-size:13px">
                    Ce lien est valable 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
                </p>
            </div>
        `,
    });
}
