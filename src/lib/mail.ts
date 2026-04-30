import nodemailer from 'nodemailer';

function getTransporter() {
    const user = process.env.GMAIL_USER;
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

    if (!user || !clientId || !clientSecret || !refreshToken) {
        throw new Error(`[mail] Variables manquantes : GMAIL_USER=${user ? 'ok' : 'ABSENT'}, GMAIL_CLIENT_ID=${clientId ? 'ok' : 'ABSENT'}, GMAIL_CLIENT_SECRET=${clientSecret ? 'ok' : 'ABSENT'}, GMAIL_REFRESH_TOKEN=${refreshToken ? 'ok' : 'ABSENT'}`);
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: { type: 'OAuth2', user, clientId, clientSecret, refreshToken },
    });
}

const FROM    = () => `Kwizar <${process.env.GMAIL_USER}>`;
const APP_URL = () => process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

function baseTemplate(accentColor: string, icon: string, title: string, body: string, btnText: string, btnUrl: string, footer: string) {
    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr>
          <td style="background:${accentColor};padding:32px;text-align:center">
            <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:50%;padding:14px;line-height:0">
              ${icon}
            </div>
            <div style="margin-top:12px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">Kwizar</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 28px">
            <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827">${title}</h1>
            <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.6">${body}</p>
            <table cellpadding="0" cellspacing="0"><tr><td>
              <a href="${btnUrl}"
                 style="display:inline-block;padding:14px 28px;background:${accentColor};color:#ffffff;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.2px">
                ${btnText}
              </a>
            </td></tr></table>
            <p style="margin:24px 0 0;font-size:12px;color:#9ca3af">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
              <a href="${btnUrl}" style="color:${accentColor};word-break:break-all">${btnUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center">
            <p style="margin:0;font-size:12px;color:#9ca3af">${footer}</p>
            <p style="margin:6px 0 0;font-size:12px;color:#9ca3af">© ${new Date().getFullYear()} Kwizar</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(email: string, token: string) {
    const url = `${APP_URL()}/api/auth/verify-email?token=${token}`;
    try {
        await getTransporter().sendMail({
            from: FROM(),
            to: email,
            subject: 'Confirmez votre adresse email — Kwizar',
            html: baseTemplate(
                '#2563eb',
                `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>`,
                'Confirmez votre adresse email',
                'Merci de vous être inscrit sur Kwizar ! Cliquez sur le bouton ci-dessous pour activer votre compte.',
                'Confirmer mon email',
                url,
                'Ce lien est valable <strong>24 heures</strong>. Si vous n\'avez pas créé de compte, ignorez cet email.',
            ),
        });
    } catch (err) {
        console.error('[mail] sendVerificationEmail failed:', err);
        throw err;
    }
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const url = `${APP_URL()}/reset-password?token=${token}`;
    try {
        await getTransporter().sendMail({
            from: FROM(),
            to: email,
            subject: 'Réinitialisation de votre mot de passe — Kwizar',
            html: baseTemplate(
                '#dc2626',
                `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>`,
                'Réinitialisation du mot de passe',
                'Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Kwizar. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.',
                'Réinitialiser mon mot de passe',
                url,
                'Ce lien est valable <strong>1 heure</strong>. Si vous n\'avez pas fait cette demande, ignorez cet email.',
            ),
        });
    } catch (err) {
        console.error('[mail] sendPasswordResetEmail failed:', err);
        throw err;
    }
}
