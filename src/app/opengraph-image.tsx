import { ImageResponse } from 'next/og';

// Default social-share image (1200×630) for every route that doesn't define its
// own. Next auto-wires it into the page metadata (og:image / twitter:image).
export const alt = 'Kwizar — jeux & quiz en ligne';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #0f3d2e 0%, #07261c 100%)',
                    color: '#fef3c7',
                    fontFamily: 'sans-serif',
                }}
            >
                <div style={{ fontSize: 130, fontWeight: 800, letterSpacing: -2 }}>Kwizar</div>
                <div style={{ fontSize: 44, color: '#fcd34d', marginTop: 8 }}>Jeux &amp; quiz en ligne</div>
                <div style={{ fontSize: 30, color: '#a7d4c0', marginTop: 28 }}>Jouez. Rivalisez. Grimpez.</div>
            </div>
        ),
        { ...size },
    );
}
