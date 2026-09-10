/**
 * Builds dist/worker-standalone.js — one self-contained file to paste into the
 * Cloudflare dashboard (Workers → Quick Edit) or ship with `wrangler deploy`
 * when there is no [assets] binding.
 *
 * Two things separate it from the repo's worker.js:
 *
 * 1. worker.js is not actually standalone: it imports ./lib/dns-wire.mjs,
 *    ./lib/subscription-native.mjs and ./lib/ss-websocket.mjs, so pasting it
 *    into Quick Edit fails on the first import. esbuild inlines those here.
 *    node: builtins stay external — nodejs_compat supplies them.
 *
 * 2. THEME_BG_DATA_URIS, an empty object in the repo copy, is filled with the
 *    ten theme wallpapers as data URIs, so /assets/theme-bg-N.jpg resolves
 *    with no static-asset binding.
 *
 * The originals are ~4.4MB, which base64-encodes to ~5.9MB and blows the 3MB
 * (gzipped) script limit on the Workers free plan. They are re-encoded here
 * because of how they are used: full-bleed wallpaper sitting under a tinted
 * overlay and 17px-blurred cards, where the detail is not visible anyway.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import * as esbuild from 'esbuild';

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC = path.join(ROOT, 'public', 'assets');
const OUT_DIR = path.join(ROOT, 'dist');
const OUT = path.join(OUT_DIR, 'worker-standalone.js');

// Workers free plan: 3MB after gzip. JPEG does not gzip further, so the base64
// payload is effectively the compressed size. Stay well under it.
const BUDGET_BYTES = 2.6 * 1024 * 1024;
const WIDTH = 1600;

async function encodeAll(quality) {
  const out = {};
  let total = 0;
  for (let i = 1; i <= 10; i++) {
    const name = `theme-bg-${i}.jpg`;
    const buf = await sharp(path.join(SRC, name))
      .resize({ width: WIDTH, withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toBuffer();
    const uri = `data:image/jpeg;base64,${buf.toString('base64')}`;
    out[name] = uri;
    total += uri.length;
  }
  return { map: out, total };
}

const entry = path.join(ROOT, 'worker.js');
const rawSize = fs.statSync(entry).size;

const bundled = await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  // nodejs_compat provides these at runtime; inlining them would break the build.
  external: ['node:*', 'cloudflare:*'],
  legalComments: 'none'
});
const source = bundled.outputFiles[0].text;

const ANCHOR = /THEME_BG_DATA_URIS = \{\}/;
if (!ANCHOR.test(source)) {
  console.error('Could not find the THEME_BG_DATA_URIS placeholder in the bundle.');
  process.exit(1);
}

// Step the quality down until the encoded set fits the budget.
let chosen = null;
for (const quality of [72, 64, 56, 48, 40]) {
  const attempt = await encodeAll(quality);
  console.log(`  quality ${quality}: ${(attempt.total / 1024 / 1024).toFixed(2)}MB of base64`);
  if (attempt.total <= BUDGET_BYTES) { chosen = { ...attempt, quality }; break; }
}
if (!chosen) {
  console.error('Could not fit the wallpapers into the script budget even at quality 40.');
  process.exit(1);
}

const literal = Object.entries(chosen.map)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
  .join(',\n');
// $-escaped: a data URI can contain $&, which replace() would expand.
const patched = source.replace(ANCHOR, () => `THEME_BG_DATA_URIS = {\n${literal}\n}`);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, patched, 'utf8');

const mb = (n) => (n / 1024 / 1024).toFixed(2) + 'MB';
console.log(`\n  wallpapers embedded at quality ${chosen.quality} (${WIDTH}px wide)`);
console.log(`  worker.js (source)   ${mb(rawSize)}`);
console.log(`  bundled              ${mb(source.length)}`);
console.log(`  + wallpapers         ${mb(patched.length)}  -> ${path.relative(ROOT, OUT)}`);
if (patched.length > 3 * 1024 * 1024) {
  console.warn('  ! over the 3MB Workers free-plan limit');
}
