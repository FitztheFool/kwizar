#!/usr/bin/env node
// Génère, pour chaque jeu, une bannière (accueil, 640x224) et une icône (lobby, 128x128)
// via Pollinations (Flux) — gratuit, sans clé. Écrit dans public/covers et public/icons.
//   node scripts/gen-game-images.mjs            # ne régénère pas les fichiers existants
//   FORCE=1 node scripts/gen-game-images.mjs    # régénère tout
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname } from 'node:path';

const COVER = 'wide cinematic banner, subject centered with empty margins top and bottom, '
  + 'premium mobile game cover art, rich saturated colors, soft volumetric lighting, subtle depth, '
  + 'dark atmospheric background with a soft radial glow, polished 3D illustrative render, highly detailed, no text, no watermark';
const ICON = 'single bold iconic symbol centered, semi-flat 3D app icon, vibrant gradient background, '
  + 'rounded soft shapes, high contrast, clean and minimal, readable at tiny size, no text, no words';

// key -> { c: sujet bannière, i: sujet icône }
const GAMES = {
  uno:           { c: 'a fan of vibrant red yellow green and blue playing cards exploding outward, a bold central reverse and +2 action card, dynamic motion', i: 'one glossy red card with a colored ring and four-color corner accents, red gradient' },
  skyjow:        { c: 'a neat 3x4 grid of numbered cards, some flipped face-up showing low numbers, cool teal-blue palette', i: 'a small stack of three numbered cards, teal gradient' },
  taboo:         { c: 'a glowing speech bubble hiding a mystery word behind a red forbidden band, two team silhouettes, energetic', i: 'a speech bubble with a red prohibition slash, warm orange gradient' },
  quiz:          { c: 'a giant glowing question mark surrounded by floating multiple-choice answer buttons, quiz-show stage lighting, purple-blue', i: 'a bold question mark inside a rounded button, purple gradient' },
  yahtzee:       { c: 'five white dice tumbling on green felt showing a five-of-a-kind, dynamic roll, warm light', i: 'five white dice clustered showing pips, green felt gradient' },
  puissance4:    { c: 'a vertical blue grid with red and yellow discs, four yellow aligned diagonally, one disc dropping in', i: 'a blue grid corner with red and yellow discs, one falling, blue gradient' },
  just_one:      { c: 'several mini easels with single hand-written clue words around a hidden mystery word, cozy cooperative vibe', i: 'a single clue word card on a small easel, soft yellow gradient' },
  battleship:    { c: 'a naval grid sea-map with battleships, red hit markers and white miss pegs, periscope mood, deep blue', i: 'a battleship silhouette over a grid with a red target peg, navy gradient' },
  diamant:       { c: 'torch-lit explorers deep in a glittering gem cavern, scattered diamonds, lurking dangers in shadow, golden glow', i: 'one large sparkling diamond gem, deep cave-blue gradient' },
  ludo:          { c: 'a colorful cross-shaped ludo board with red green yellow blue pawns and a big die, playful top-down', i: 'four colorful pawns around a single die, bright multicolor gradient' },
  perudo:        { c: 'leather dice cups and scattered dice on a wooden table, a tense bluffing standoff, warm cantina light', i: 'a leather dice cup tipped over with dice spilling out, terracotta gradient' },
  cant_stop:     { c: 'four white dice and climbing markers ascending numbered columns toward a summit, push-your-luck tension', i: 'three white dice with an upward arrow over columns, orange gradient' },
  mille_bornes:  { c: 'a vintage race car speeding down an open road with kilometer markers, retro racing-card aesthetic, red and cream', i: 'a vintage race car beside a green traffic light, red gradient' },
  atlantide:     { c: 'a crumbling island sinking into the ocean with a smoking volcano, tiny boats and swimmers fleeing to the corners, dramatic', i: 'a small island with a volcano and a rescue boat, turquoise-sea gradient' },
  impostor:      { c: 'a circle of mysterious masked silhouettes, one glowing red as the impostor, secret-word tension, noir', i: 'a single masked face emblem, dark red gradient' },
  spyfall:       { c: 'a shadowy trench-coat spy among location cards beach plane casino, interrogation spotlight, noir spy mood', i: 'a spy hat and sunglasses silhouette, dark blue gradient' },
  snake:         { c: 'a glowing neon retro snake winding across a dark grid toward a red apple, arcade CRT vibe, green neon', i: 'a coiled neon snake segment with a small apple, dark green gradient' },
  pacman:        { c: 'a round yellow chomper character racing through a neon-blue maze chased by colorful ghosts, retro arcade', i: 'a yellow round chomper with open mouth, dark arcade gradient' },
  breakout:      { c: 'a glowing ball smashing through rows of colorful neon bricks, a paddle below, arcade energy, dark background', i: 'a ball and paddle with a few colorful bricks, neon gradient' },
  tetris:        { c: 'colorful falling tetromino blocks stacking and clearing glowing lines, retro arcade neon', i: 'a few interlocking colorful tetromino blocks, dark neon gradient' },
  sutom:         { c: 'a grid of letter tiles with some highlighted red and yellow, word-guessing puzzle mood', i: 'a single bold letter tile highlighted red, dark grid gradient' },
  space_invaders:{ c: 'rows of pixel-art alien invaders descending toward a defending spaceship firing lasers, retro green-on-black', i: 'a single pixel-art alien invader, dark green gradient' },
  '2048':        { c: 'sliding numbered tiles merging into one glowing 2048 tile, clean minimalist puzzle, warm beige-orange', i: 'a single rounded number tile, warm orange gradient' },
  flappy_bird:   { c: 'a tiny round yellow bird flapping between green pipes under a bright cartoon sky, side-scroller', i: 'a small round yellow bird with tiny wings, sky-blue gradient' },
  plumber:       { c: 'a cartoon platformer hero running and jumping over enemies collecting gold coins, bright side-scrolling world', i: 'a shiny gold coin with a star, bright red-and-green gradient' },
  abalone:       { c: 'a hexagonal board with rows of glossy black and white marbles, one pushed off the edge, sleek abstract strategy', i: 'a tight cluster of glossy black and white marbles, slate gradient' },
  blokus:        { c: 'a 20x20 grid filling with interlocking red blue green yellow polyomino pieces from the corners, geometric', i: 'a few colorful polyomino pieces touching at a single corner, bright gradient' },
  six_qui_prend: { c: 'rows of numbered cards with ox-head penalty symbols, a sixth card forcing a pickup, classic card-game vibe', i: 'one card with an ox-head symbol, red gradient' },
  complot:       { c: 'a tense table of face-down character cards and stacked gold coins, a duel of dukes and assassins, royal intrigue', i: 'two crossed face-down character cards over a gold coin, royal purple-and-gold gradient' },
  tanks:         { c: 'two cartoon tanks on opposing destructible hills lobbing an arcing artillery shell, wind and explosion, side-view', i: 'a small cartoon tank with an aiming arc, military-green gradient' },
  duel:          { c: 'two items facing off head-to-head with a glowing VS between them, tournament bracket vibe, playful', i: 'a bold VS versus emblem between two circles, vibrant gradient' },
  match3:        { c: 'a sparkling grid of colorful gems with three aligned and exploding in a cascade, jewel-bright candy puzzle', i: 'three aligned glowing gems, jewel-bright gradient' },
};

// Hash stable -> seed reproductible par image.
const seed = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 100000; };

async function fetchImage(prompt, w, h, sd) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
    + `?width=${w}&height=${h}&nologo=true&model=flux&seed=${sd}`;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 150000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1000) throw new Error(`too small (${buf.length}b)`);
      return buf;
    } catch (e) {
      if (attempt === 6) throw e;
      await new Promise(r => setTimeout(r, [6000, 12000, 25000, 40000, 60000][attempt - 1]));
    }
  }
}

const exists = async (p) => { try { return (await stat(p)).size > 1000; } catch { return false; } };

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function one(path, prompt, w, h) {
  if (!process.env.FORCE && await exists(path)) { console.log(`skip  ${path}`); return; }
  const buf = await fetchImage(`${prompt}, ${w > h ? COVER : ICON}`, w, h, seed(path));
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buf);
  console.log(`ok    ${path} (${(buf.length / 1024 | 0)} KB)`);
  await sleep(2500); // pacing pour éviter le rate-limit
}

// File de tâches avec concurrence limitée.
const tasks = [];
for (const [key, g] of Object.entries(GAMES)) {
  tasks.push([`public/covers/${key}.jpg`, g.c, 640, 224]);
  tasks.push([`public/icons/${key}.jpg`,  g.i, 128, 128]);
}

const CONCURRENCY = 1;
let idx = 0, failed = 0;
async function worker() {
  while (idx < tasks.length) {
    const [path, prompt, w, h] = tasks[idx++];
    try { await one(path, prompt, w, h); }
    catch (e) { failed++; console.error(`FAIL  ${path}: ${e.message}`); }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`\nDone. ${tasks.length - failed}/${tasks.length} images.${failed ? ` ${failed} failed (re-run to retry).` : ''}`);
