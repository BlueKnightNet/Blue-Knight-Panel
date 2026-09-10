// Verifies the Vercel/Netlify persistence solution end to end.
//
// Stands up a local Upstash-compatible Redis REST endpoint, points the serverless
// adapters at it, and checks that a setting written through the panel survives a
// simulated cold start (a brand-new store instance reading the same backend).
// Run with: npm run test:edge
import assert from 'node:assert/strict';
import http from 'node:http';
import { createKVStore } from './lib/kv-store.mjs';

const redis = new Map();
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (d) => { body += d; });
  req.on('end', () => {
    if (req.headers.authorization !== 'Bearer test-token') {
      res.writeHead(401).end('unauthorized');
      return;
    }
    let result = null;
    try {
      const [op, key, value] = JSON.parse(body);
      if (op === 'GET') result = redis.has(key) ? redis.get(key) : null;
      else if (op === 'SET') { redis.set(key, value); result = 'OK'; }
      else if (op === 'DEL') { redis.delete(key); result = 1; }
    } catch {
      res.writeHead(400).end('bad command');
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ result }));
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const REST_URL = `http://127.0.0.1:${server.address().port}`;
const redisGet = async (k) => redis.has(k) ? redis.get(k) : null;

try {
  // Vercel's variable names
  const vercelEnv = { KV_REST_API_URL: REST_URL, KV_REST_API_TOKEN: 'test-token' };
  const a = createKVStore((n) => vercelEnv[n]);
  assert.equal(a.mode, 'rest', 'Vercel KV vars must select the durable store');

  await a.kv.put('config:vless_uuid', 'persisted-uuid');
  await a.kv.put('config:ss_enabled', 'false');
  assert.equal(await a.kv.get('config:vless_uuid'), 'persisted-uuid');

  // Cold start: a fresh store instance, same backend.
  const b = createKVStore((n) => vercelEnv[n]);
  assert.equal(await b.kv.get('config:vless_uuid'), 'persisted-uuid',
    'identity must survive a cold start');
  assert.equal(await b.kv.get('config:ss_enabled'), 'false',
    'a toggle turned off must survive a cold start');
  console.log('  vercel (KV_REST_API_*) persistence: ok');

  // Netlify / standalone Upstash variable names
  const netlifyEnv = { UPSTASH_REDIS_REST_URL: REST_URL, UPSTASH_REDIS_REST_TOKEN: 'test-token' };
  const n1 = createKVStore((n) => netlifyEnv[n]);
  assert.equal(n1.mode, 'rest', 'Upstash vars must select the durable store');
  assert.equal(await n1.kv.get('config:vless_uuid'), 'persisted-uuid',
    'both adapters share one backend');
  await n1.kv.delete('config:ss_enabled');
  assert.equal(await n1.kv.get('config:ss_enabled'), null, 'delete works');
  console.log('  netlify (UPSTASH_REDIS_REST_*) persistence: ok');

  // Without a durable store the panel must still start, warn, and keep identity.
  const memory = createKVStore((n) => (n === 'VLESS_UUID' ? 'env-uuid' : undefined));
  assert.equal(memory.mode, 'memory');
  assert.match(memory.warning, /not survive a cold start/);
  assert.equal(await memory.kv.get('config:vless_uuid'), 'env-uuid',
    'env identity keeps subscription links valid without Redis');
  console.log('  memory fallback + env identity: ok');

  // A wrong token must fail loudly rather than look like an empty store.
  const badAuth = createKVStore((n) => ({ KV_REST_API_URL: REST_URL, KV_REST_API_TOKEN: 'nope' })[n]);
  await assert.rejects(() => badAuth.kv.get('config:vless_uuid'), /KV REST 401/,
    'bad credentials must throw, not silently read as empty');
  console.log('  bad credentials surface as an error: ok');

  // --- the Vercel adapter itself, driven the way Vercel drives it ---
  process.env.KV_REST_API_URL = REST_URL;
  process.env.KV_REST_API_TOKEN = 'test-token';
  process.env.PANEL_PASSWORD = 'Admin@12345678';
  const { handler } = await import('./api/index.js');

  const app = http.createServer((req, res) => handler(req, res));
  await new Promise((r) => app.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${app.address().port}`;
  try {
    assert.equal((await fetch(base + '/api/health')).status, 200, 'vercel: health');

    const login = await fetch(base + '/panel/login', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'password=Admin@12345678',
      redirect: 'manual'
    });
    assert.equal(login.status, 302, 'vercel: login redirects');
    const cookie = (login.headers.get('set-cookie') || '').split(';')[0];

    const save = await fetch(base + '/panel/settings/protocols', {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
      body: 'staticIpList=198.51.100.7&ssPassword=v&ssMethod=chacha20-ietf-poly1305&xhttpPath=/wd-xhttp'
    });
    assert.match(await save.text(), /Saved \d+ updated setting\(s\)/, 'vercel: settings save');
    assert.equal(await redisGet('config:static_ip_list'), '198.51.100.7',
      'vercel: the write must land in the durable store');
    assert.equal((await fetch(base + '/sub/vless', { headers: { cookie } })).status, 200, 'vercel: subscription');
    console.log('  vercel adapter (http round-trip + durable write): ok');
  } finally {
    app.close();
  }

  console.log('Edge persistence checks passed.');
} finally {
  server.close();
}
