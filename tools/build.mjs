// PathFinder bauen: App-Dateien nach dist/ kopieren und CSS/JS mit Versionsnummer laden (frische Dateien nach jedem Update).
// Aufruf: node tools/build.mjs [zielordner]   – braucht nur Node, keine Pakete.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = ['index.html', 'core', 'fonts', 'beispiele', 'icon.svg', 'icon-32.png', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest'];
const out = path.resolve(process.argv[2] || path.join(root, 'dist'));
const copy = (a, b) => { fs.mkdirSync(b, { recursive: true }); for (const f of fs.readdirSync(a)) { const s = path.join(a, f), d = path.join(b, f); if (fs.statSync(s).isDirectory()) copy(s, d); else fs.copyFileSync(s, d); } };

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of APP) { const s = path.join(root, f), d = path.join(out, f); if (!fs.existsSync(s)) continue; if (fs.statSync(s).isDirectory()) copy(s, d); else fs.copyFileSync(s, d); }

const hash = crypto.createHash('sha256');
for (const f of ['core/pathfinder.js', 'core/pathfinder.css', 'core/pftext.js', 'core/pfskin.js']) hash.update(fs.readFileSync(path.join(out, f)));
const v = hash.digest('hex').slice(0, 10);
const ip = path.join(out, 'index.html');
fs.writeFileSync(ip, fs.readFileSync(ip, 'utf8').replace('core/pathfinder.css"', `core/pathfinder.css?v=${v}"`).replace("'./core/pathfinder.js'", `'./core/pathfinder.js?v=${v}'`));
console.log('PathFinder gebaut nach', out, '· Version', v);
