/**
 * Checks dist/worker-standalone.js — the single-file release artifact.
 *
 * Two things can silently break it: an unbundled ./lib import (Quick Edit
 * fails on the first import), and an empty THEME_BG_DATA_URIS (themes render
 * on a flat colour because /assets/ 404s without an ASSETS binding). Both are
 * invisible until someone actually pastes the file into the dashboard.
 *
 * Run `node build-standalone.mjs` first.
 */

// The bundle installs unenv's process/console shims on import, so bind the real
// stdout and exit before importing anything.
const write = process.stdout.write.bind(process.stdout);
const realExit = (process.reallyExit || process.exit).bind(process);
const out = (s) => write(s + '\n');

const BUNDLE = new URL('./dist/worker-standalone.js', import.meta.url).href;

async function main() {
  const fs = await import('node:fs');
  const bundlePath = new URL(BUNDLE).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  if (!fs.existsSync(bundlePath)) {
    out('dist/worker-standalone.js is missing — run: node build-standalone.mjs');
    return 1;
  }

  const text = fs.readFileSync(bundlePath, 'utf8');
  let failures = 0;
  const check = (ok, label) => { if (!ok) failures++; out(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}`); };

  check(!/from\s+["']\.\.?\//.test(text), 'no unbundled relative imports (Quick Edit safe)');
  check(!/THEME_BG_DATA_URIS = \{\}/.test(text), 'wallpapers are embedded, not an empty map');
  check(text.length < 3 * 1024 * 1024, `under the 3MB Workers free-plan limit (${(text.length / 1024 / 1024).toFixed(2)}MB)`);

  const worker = (await import(BUNDLE)).default;
  const store = new Map();
  const kv = {
    get: async (k) => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, String(v)); },
    delete: async (k) => { store.delete(k); },
    list: async () => ({ keys: [] })
  };
  // No ASSETS binding: exactly the dashboard-paste situation.
  const env = { BK_KV: kv };
  const ctx = { waitUntil() {} };

  for (let n = 1; n <= 10; n++) {
    const res = await worker.fetch(new Request(`https://example.com/assets/theme-bg-${n}.jpg`), env, ctx);
    const b = new Uint8Array(await res.arrayBuffer());
    const isJpeg = b[0] === 0xFF && b[1] === 0xD8 && b[b.length - 2] === 0xFF && b[b.length - 1] === 0xD9;
    check(res.status === 200 && isJpeg && res.headers.get('content-type') === 'image/jpeg',
      `theme-bg-${n}.jpg served as a valid JPEG (${(b.length / 1024).toFixed(0)}KB)`);
  }

  const missing = await worker.fetch(new Request('https://example.com/assets/nope.png'), env, ctx);
  check(missing.status === 404, 'unknown asset still 404s');

  const panel = await worker.fetch(new Request('https://example.com/panel'), env, ctx);
  check([200, 302].includes(panel.status), `GET /panel routes (${panel.status})`);

  out(failures ? `\nStandalone bundle checks FAILED (${failures}).` : '\nStandalone bundle checks passed.');
  return failures ? 1 : 0;
}

main().then(realExit).catch((err) => { out('ERROR: ' + (err && err.stack || err)); realExit(1); });
