// Génère public/cant-stop/board.svg : une vraie montagne avec les pistes (colonnes 2..12).
// Géométrie reprise EXACTEMENT de src/components/CantStop/boardCoords.ts pour que
// les pions (positionnés en %) tombent pile sur les cases.
import { writeFileSync } from 'node:fs';

const W = 557, H = 462;

const COLUMN_LENGTHS = { 2:3,3:5,4:7,5:9,6:11,7:13,8:11,9:9,10:7,11:5,12:3 };
const COLUMN_X = { 2:14,3:21,4:28,5:35,6:42,7:50,8:58,9:65,10:72,11:79,12:86 };
const BASE_Y = 83.5, PITCH_Y = 5.55;

const px = p => +(p/100*W).toFixed(1);
const py = p => +(p/100*H).toFixed(1);
const cx = col => px(COLUMN_X[col]);
const cy = (pos) => py(BASE_Y - (pos-1)*PITCH_Y);

const COLS = [2,3,4,5,6,7,8,9,10,11,12];
const R = 10.5;             // rayon des cases
const colColor = ['#f87171','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6','#22d3ee','#fb923c','#a3e635','#e879f9','#94a3b8'];

let parts = [];

// ---- defs ----
parts.push(`<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#bfe3ff"/>
    <stop offset="0.55" stop-color="#e8f4ff"/>
    <stop offset="1" stop-color="#fef3e2"/>
  </linearGradient>
  <linearGradient id="far" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#9db4d6"/><stop offset="1" stop-color="#b9c8e0"/>
  </linearGradient>
  <linearGradient id="mid" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#6f7f9e"/><stop offset="1" stop-color="#8a99b5"/>
  </linearGradient>
  <linearGradient id="main" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#5b6b54"/><stop offset="0.5" stop-color="#4a5a44"/><stop offset="1" stop-color="#3a4636"/>
  </linearGradient>
  <linearGradient id="rockL" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#7b8a68"/><stop offset="1" stop-color="#566249"/>
  </linearGradient>
  <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#fff7d6"/><stop offset="0.6" stop-color="#ffe9a8" stop-opacity="0.9"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/>
  </radialGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000" flood-opacity="0.35"/>
  </filter>
</defs>`);

// ---- ciel ----
parts.push(`<rect width="${W}" height="${H}" fill="url(#sky)"/>`);
parts.push(`<circle cx="${px(80)}" cy="${py(20)}" r="46" fill="url(#sun)"/>`);
parts.push(`<circle cx="${px(80)}" cy="${py(20)}" r="20" fill="#fff6cf"/>`);

// nuages
const cloud = (x,y,s)=>`<g fill="#ffffff" opacity="0.85"><ellipse cx="${x}" cy="${y}" rx="${22*s}" ry="${11*s}"/><ellipse cx="${x+18*s}" cy="${y+3*s}" rx="${16*s}" ry="${9*s}"/><ellipse cx="${x-18*s}" cy="${y+3*s}" rx="${15*s}" ry="${8*s}"/></g>`;
parts.push(cloud(px(20),py(16),1));
parts.push(cloud(px(45),py(9),0.75));

// ---- montagnes lointaines ----
parts.push(`<path d="M0,${py(58)} L${px(12)},${py(40)} L${px(24)},${py(54)} L${px(38)},${py(34)} L${px(52)},${py(52)} L${px(66)},${py(36)} L${px(82)},${py(53)} L${W},${py(42)} L${W},${H} L0,${H} Z" fill="url(#far)"/>`);
parts.push(`<path d="M0,${py(66)} L${px(18)},${py(48)} L${px(34)},${py(62)} L${px(50)},${py(40)} L${px(68)},${py(60)} L${px(84)},${py(46)} L${W},${py(60)} L${W},${H} L0,${H} Z" fill="url(#mid)"/>`);

// ---- montagne principale (sommet aligné colonne 7) ----
const peakX = cx(7), peakY = py(7);   // apex au-dessus de la case sommet
const baseL = px(-4), baseR = px(104), baseY = H;
parts.push(`<path d="M${baseL},${baseY} L${px(30)},${py(46)} L${peakX},${peakY} L${px(70)},${py(46)} L${baseR},${baseY} Z" fill="url(#main)"/>`);
// flanc gauche éclairé
parts.push(`<path d="M${baseL},${baseY} L${px(30)},${py(46)} L${peakX},${peakY} L${peakX},${baseY} Z" fill="url(#rockL)" opacity="0.45"/>`);
// arêtes
parts.push(`<path d="M${peakX},${peakY} L${px(40)},${py(40)} L${px(34)},${py(58)}" fill="none" stroke="#2f3a2c" stroke-width="2" opacity="0.4" stroke-linejoin="round"/>`);
parts.push(`<path d="M${peakX},${peakY} L${px(60)},${py(38)} L${px(67)},${py(57)}" fill="none" stroke="#2f3a2c" stroke-width="2" opacity="0.4" stroke-linejoin="round"/>`);

// ---- calotte neigeuse (collée à l'apex, au-dessus de la case sommet à y≈16.9%) ----
// Bord bas en festons autour de y=15%, pointe à l'apex.
parts.push(`<path d="M${px(42.5)},${py(15)} L${px(45.5)},${py(10)} L${peakX},${peakY} L${px(54.5)},${py(10)} L${px(57.5)},${py(15)} `
  + `L${px(54.5)},${py(15.8)} L${px(52)},${py(12.5)} L${px(49.5)},${py(16)} L${px(47)},${py(12.5)} L${px(44.5)},${py(15.8)} Z" fill="#f4fbff"/>`);
// reflets neige
parts.push(`<path d="M${peakX},${peakY} L${px(47.5)},${py(11)} L${px(48.5)},${py(15)}" fill="#dfeefc" opacity="0.7"/>`);

// brume au pied
parts.push(`<ellipse cx="${px(50)}" cy="${py(70)}" rx="${px(60)}" ry="${py(7)}" fill="#ffffff" opacity="0.16"/>`);

// ---- pistes (colonnes) ----
// trait reliant les cases de chaque colonne
let tracks = [], cells = [], labels = [];
for (const col of COLS) {
  const len = COLUMN_LENGTHS[col];
  const x = cx(col);
  const yBottom = cy(1), yTop = cy(len);
  tracks.push(`<line x1="${x}" y1="${yBottom}" x2="${x}" y2="${yTop}" stroke="#1f2937" stroke-width="${R*2+2}" stroke-linecap="round" opacity="0.18"/>`);
  for (let pos=1; pos<=len; pos++) {
    const y = cy(pos);
    const top = pos===len;
    cells.push(`<circle cx="${x}" cy="${y}" r="${R}" fill="${top?'#fff7e6':'#ffffff'}" stroke="${top?'#f59e0b':'#cbd5e1'}" stroke-width="${top?2.5:1.5}" opacity="0.96"/>`);
  }
  // drapeau au sommet de chaque pic (case la plus haute de la colonne)
  {
    const y = cy(len);
    labels.push(`<g filter="url(#soft)"><rect x="${x+0.8}" y="${y-21}" width="2" height="15" fill="#7c2d12"/><path d="M${x+2.6},${y-21} l12,4 l-12,4 Z" fill="#ef4444"/></g>`);
  }
  // étiquette numéro sous la base
  const ly = cy(1)+R+13;
  labels.push(`<g filter="url(#soft)"><rect x="${x-13}" y="${ly-13}" width="26" height="22" rx="6" fill="${colColor[col-2]}"/><text x="${x}" y="${ly+3}" font-family="'Segoe UI',Arial,sans-serif" font-size="15" font-weight="800" fill="#fff" text-anchor="middle">${col}</text></g>`);
}
parts.push(`<g>${tracks.join('')}</g>`);
parts.push(`<g filter="url(#soft)">${cells.join('')}</g>`);
parts.push(labels.join(''));

// ---- titre ----
parts.push(`<text x="${px(50)}" y="${py(95.5)}" font-family="'Segoe UI',Arial,sans-serif" font-size="13" font-weight="800" letter-spacing="3" fill="#475569" text-anchor="middle" opacity="0.8">CAN'T STOP</text>`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Plateau Can't Stop">\n${parts.join('\n')}\n</svg>\n`;
writeFileSync(new URL('../public/cant-stop/board.svg', import.meta.url), svg);
console.log('written', svg.length, 'bytes');
