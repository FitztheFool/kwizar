import nodemailer from 'nodemailer';

const LOGO_URL = 'https://kwizar.vercel.app/logo/icon-light-192.png';

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

function baseTemplate(accentColor: string, title: string, body: string, btnText: string, btnUrl: string, footer: string) {
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
            <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:12px">
              <img src="${LOGO_URL}" alt="" width="64" height="64" style="border-radius:16px;border:0;outline:none;text-decoration:none">
            </td></tr><tr><td align="center">
              <span style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">Kwizar</span>
            </td></tr></table>
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
    const url = `${APP_URL()}/verify-email?token=${token}`;
    try {
        await getTransporter().sendMail({
            from: FROM(),
            to: email,
            subject: 'Confirmez votre adresse email — Kwizar',
            html: baseTemplate(
                '#2563eb',
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
                '#2563eb',
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
