#!/usr/bin/env node
// Ajoute cover_img (/covers/<key>.jpg) + image (/icons/<key>.jpg) à chaque entrée de GAME_CONFIG,
// en supprimant les champs image/cover_img préexistants de l'entrée. Idempotent.
import { readFile, writeFile } from 'node:fs/promises';

const KEYS = new Set(['uno','skyjow','taboo','quiz','yahtzee','puissance4','just_one','battleship','diamant','ludo','perudo','cant_stop','mille_bornes','atlantide','impostor','spyfall','snake','pacman','breakout','tetris','sutom','space_invaders','2048','flappy_bird','plumber','abalone','blokus','six_qui_prend','complot','tanks','duel','match3']);

const file = 'src/lib/gameConfig.ts';
const lines = (await readFile(file, 'utf8')).split('\n');
const out = [];
let cur = null;
for (const line of lines) {
  const open = line.match(/^    '?([A-Za-z0-9_]+)'?: \{$/);
  if (open && KEYS.has(open[1])) {
    cur = open[1];
    out.push(line);
    out.push(`        cover_img: '/covers/${cur}.jpg',`);
    out.push(`        image: '/icons/${cur}.jpg',`);
    continue;
  }
  if (cur && /^    \},?$/.test(line)) { cur = null; out.push(line); continue; }
  if (cur && /^\s*(image|cover_img):/.test(line)) continue; // drop ancien champ
  out.push(line);
}
await writeFile(file, out.join('\n'));
console.log('gameConfig.ts patched.');
