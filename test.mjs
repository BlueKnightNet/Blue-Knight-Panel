// Regression checks for the settings-save path. Run with: npm test
import assert from 'node:assert/strict';
import { createMemoryKV, createKVStore, createRestKV } from './lib/kv-store.mjs';
import { Console } from 'node:console';

// wrangler's unenv preset replaces globalThis.process and mutates Node's real
// console in place, repointing its internal _stdout/_stderr at dead streams.
// Correct inside workerd, but on Node it silences every log line. Snapshot the
// real process and rebuild the console on the real streams after importing.
const nodeProcess = globalThis.process;
const nodeStdout = process.stdout;
const nodeStderr = process.stderr;
const { default: worker } = await import('./worker.js');
globalThis.process = nodeProcess;
globalThis.console = new Console({ stdout: nodeStdout, stderr: nodeStderr });


const kv = createMemoryKV(() => undefined);
const env = { PANEL_PASSWORD: 'Admin@12345678', WD_KV: kv, BK_KV: kv };
const ctx = { waitUntil: () => {} };
await kv.put('config:admin_password', 'Admin@12345678');

// --- KV store resolution (Vercel / Netlify have no native binding) ---
{
  const calls = [];
  const fakeFetch = async (url, init) => {
    const args = JSON.parse(init.body);
    calls.push(args);
    if (args[0] === 'GET') return { ok: true, json: async () => ({ result: args[1] === 'known' ? 'v' : null }) };
    return { ok: true, json: async () => ({ result: 'OK' }) };
  };
  const rest = createRestKV('https://example.upstash.io/', 'tok', { fetchImpl: fakeFetch });
  assert.equal(await rest.get('known'), 'v', 'REST get returns the value');
  assert.equal(await rest.get('config:vless_uuid'), null, 'REST get returns null when unset');
  await rest.put('config:vless_uuid', 'abc');
  assert.deepEqual(calls.at(-1), ['SET', 'config:vless_uuid', 'abc'], 'keys with ":" need no escaping');

  const failing = createRestKV('https://x', 't', {
    fetchImpl: async () => ({ ok: false, status: 401, text: async () => 'unauthorized' })
  });
  await assert.rejects(() => failing.get('k'), /KV REST 401/, 'a bad token must surface, not read as empty');

  // env picks the durable store when credentials exist, memory otherwise
  const withRest = createKVStore((n) => ({ KV_REST_API_URL: 'https://x', KV_REST_API_TOKEN: 't' })[n]);
  assert.equal(withRest.mode, 'rest', 'Vercel KV vars select the durable store');
  assert.equal(withRest.warning, null);
  const noRest = createKVStore(() => undefined);
  assert.equal(noRest.mode, 'memory', 'no credentials falls back to memory');
  assert.match(noRest.warning, /not survive a cold start/, 'memory mode must warn');

  // identities stay stable from env vars even without a durable store
  const envKv = createMemoryKV((n) => (n === 'VLESS_UUID' ? 'fixed-uuid' : undefined));
  assert.equal(await envKv.get('config:vless_uuid'), 'fixed-uuid', 'env supplies stable identity');
  console.log('  kv store resolution: ok');
}

const call = (path, init) =>
  worker.fetch(new Request(`https://t.local${path}`, init), env, ctx);

const login = await call('/panel/login', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: 'password=Admin@12345678'
});
const cookie = login.headers.get('set-cookie').split(';')[0];
assert.equal(login.status, 302, 'login should redirect');

const postProtocols = (body) =>
  call('/panel/settings/protocols', {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
    body
  });

// Browsers omit unchecked checkboxes entirely; a toggle must still turn off.
// ssEnabled/xhttpEnabled default to true, so start by unchecking them.
const base = 'ssPassword=p&ssMethod=chacha20-ietf-poly1305&xhttpPath=%2Fwd-xhttp&staticIpList=1.1.1.1';
await postProtocols(base);
assert.equal(await kv.get('config:ss_enabled'), 'false', 'unchecked -> false');
assert.equal(await kv.get('config:xhttp_enabled'), 'false', 'unchecked -> false');

await postProtocols(`${base}&ssEnabled=on&xhttpEnabled=on&allowLANConnection=on`);
assert.equal(await kv.get('config:ss_enabled'), 'true', 'checked -> true');
assert.equal(await kv.get('config:xhttp_enabled'), 'true', 'checked -> true');
assert.equal(await kv.get('config:allow_lan_connection'), 'true', 'LAN checked -> true');

await postProtocols(base);
assert.equal(await kv.get('config:allow_lan_connection'), 'false', 'LAN unchecked -> false');

// dnsCustom used to render outside its <form>, so it never reached the server.
await postProtocols('dnsCustom=https%3A%2F%2Fdns.example%2Fdns-query&dnsDoH=https%3A%2F%2Fcloudflare-dns.com%2Fdns-query');
assert.equal(await kv.get('config:dns_custom'), 'https://dns.example/dns-query', 'dnsCustom persists');

const html = await (await call('/panel', { headers: { cookie } })).text();
const dnsField = html.indexOf('name="dnsCustom"');
const formOpen = html.lastIndexOf('<form', dnsField);
assert.ok(formOpen > html.lastIndexOf('</form>', dnsField), 'dnsCustom must sit inside a <form>');

// Every sidebar entry must deep-link to its own tab. Four of the seven used to
// silently fall back to the overview.
for (const tab of ['overview', 'warp', 'subscriptions', 'protocols', 'dns', 'routing', 'settings']) {
  const page = await (await call(`/panel/settings/${tab}`, { headers: { cookie } })).text();
  assert.ok(page.includes(`id="tab-${tab}" class="tab-pane active"`),
    `/panel/settings/${tab} must open the ${tab} pane`);
  assert.match(page, new RegExp(`id="nav-${tab}"[^>]*class="nav-btn active"`),
    `/panel/settings/${tab} must highlight its sidebar entry`);
}
console.log('  tab deep links: ok');

// Trailing slashes are stripped before routing.
assert.equal((await call('/panel/settings', { headers: { cookie } })).status, 200, '/panel/settings routes');

console.log('All settings-save regression checks passed.');
