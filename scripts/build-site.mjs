// Builds the website from prototype/index.html: minified, installable (PWA) and offline-ready.
// Usage: npm install --no-save esbuild@0.24.2 && node scripts/build-site.mjs  →  dist/
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { transform } from 'esbuild';

const src = readFileSync(new URL('../prototype/index.html', import.meta.url), 'utf8');
const pick = (re) => { const m = re.exec(src); if (!m) throw new Error('missing ' + re); return m[1]; };
const css = pick(/<style>([\s\S]*?)<\/style>/), js = pick(/<script>([\s\S]*?)<\/script>/);
const body = src.slice(src.indexOf('</style>') + 8, src.indexOf('<script>')).trim();
const target = ['safari15', 'chrome100', 'firefox100'];
const mcss = (await transform(css, { loader: 'css', minify: true, target })).code.trim();
const mjs = (await transform(js, { loader: 'js', minify: true, target })).code.trim();
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Chitrakar</title>
<meta name="description" content="Design, sketch and vectorize on iPad and desktop. Built for Apple Pencil, light on battery.">
<meta name="theme-color" content="#ecebe8">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Chitrakar">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<style>html,body{margin:0}${mcss}</style>
</head>
<body>
${body.replace(/\n\s*/g, '\n')}
<script>${mjs}</script>
<script>if('serviceWorker'in navigator&&location.protocol==='https:')addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))</script>
</body>
</html>
`;
const out = new URL('../dist/', import.meta.url);
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
cpSync(new URL('../site/', import.meta.url), out, { recursive: true });
writeFileSync(new URL('index.html', out), html);
const ver = createHash('sha256').update(html).digest('hex').slice(0, 12);
writeFileSync(new URL('sw.js', out), readFileSync(new URL('sw.js', out), 'utf8').replace('__BUILD__', 'chitrakar-' + ver));
writeFileSync(new URL('.nojekyll', out), '');
const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log(`dist/index.html: ${kb(Buffer.byteLength(html))} (${kb(gzipSync(html).length)} gzipped; source ${kb(Buffer.byteLength(src))}) · cache ${ver}`);
