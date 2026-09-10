import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import net from 'node:net';
import crypto from 'node:crypto';
import { Console } from 'node:console';
import { createMemoryKV } from './lib/kv-store.mjs';
import { ssEncoder, ssDecoder, SS_METHODS } from './lib/ss-websocket.mjs';
for (const method of SS_METHODS) {
  const encode = ssEncoder(method, 'fixture'), decode = ssDecoder(method, 'fixture'), chunks = [];
  for (let i = 0; i < 300; i++) {
    const bytes = encode(Buffer.from('test'));
    for (let offset = 0; offset < bytes.length; offset += 7) chunks.push(...decode(bytes.subarray(offset, offset + 7)));
  }
  assert.equal(Buffer.concat(chunks).toString(), 'test'.repeat(300), `${method}: split packets and nonce carry`);
  const bad = ssEncoder(method, 'fixture')(Buffer.from('bad')); bad[bad.length - 1] ^= 1;
  assert.throws(() => ssDecoder(method, 'fixture')(bad), `${method}: tampering rejected`);
}

// Exercise shipped chain code with fragmented/coalesced TCP reads.
const source = await readFile(new URL('./worker.js', import.meta.url), 'utf8');
const start = source.indexOf('function chainReader(');
const end = source.indexOf('async function establishOutboundSocket(', start);
const chain = vm.runInNewContext(source.slice(start, end) + '\n({ dialHttpChain, dialSocks5Chain })', {
  ReadableStream, Uint8Array, TextEncoder, btoa
});
function socket(chunks) {
  const writes = [];
  return {
    writes,
    readable: new ReadableStream({ start(c) { for (const chunk of chunks) c.enqueue(Buffer.from(chunk)); c.close(); } }),
    writable: new WritableStream({ write(chunk) { writes.push(Buffer.from(chunk)); } })
  };
}
async function remaining(s) { return Buffer.from(await new Response(s.readable).arrayBuffer()).toString(); }
const httpSocket = socket(['HTTP/1.1 2', '00 OK\r\nProxy-Agent: test\r', '\n\r\nHELLO']);
await chain.dialHttpChain(httpSocket, '::1', 443, 'user:pass');
assert.equal(await remaining(httpSocket), 'HELLO');
assert.match(httpSocket.writes[0].toString(), /^CONNECT \[::1\]:443 HTTP\/1.1\r\n/);
assert.match(httpSocket.writes[0].toString(), /Proxy-Authorization: Basic dXNlcjpwYXNz\r\n/);
await assert.rejects(chain.dialHttpChain(socket(['HTTP/1.1 407 Error 200\r\n\r\n']), 'example.org', 443, ''), /CONNECT failed/);
for (const auth of ['', 'user:pass']) {
  const s = socket([[5], [auth ? 2 : 0], ...(auth ? [[1], [0]] : []), [5, 0, 0], [1, 127], [0, 0, 1, 0, 80, ...Buffer.from('HELLO')]]);
  await chain.dialSocks5Chain(s, 'example.org', 443, auth);
  assert.equal(await remaining(s), 'HELLO');
  if (auth) assert.deepEqual(s.writes[1], Buffer.from([1, 4, ...Buffer.from('user'), 4, ...Buffer.from('pass')]));
}
await assert.rejects(chain.dialSocks5Chain(socket([[5, 255]]), 'example.org', 443, ''), /method rejected/);
console.log('  HTTP CONNECT / SOCKS5: split replies, credentials, leftover payload, rejection: ok');

const nodeProcess = process;
const stdout = process.stdout, stderr = process.stderr;
const { default: worker } = await import('./worker.js');
globalThis.process = nodeProcess;
globalThis.console = new Console({ stdout, stderr });
const kv = createMemoryKV(() => undefined);
const uuid = '8831688d-d6eb-49a8-bda1-046e5e14ec00';
const password = 'connection-test-password';
await kv.put('config:vless_uuid', uuid);
await kv.put('config:trojan_password', password);
await kv.put('config:sub_token', 'test-sub-token');
const env = { BK_KV: kv, WD_KV: kv };
const background = [];
const call = (path, init) => worker.fetch(new Request(`http://localhost${path}`, init), env, { waitUntil(p) { background.push(p); } });
const sockets = new Set();
const echo = net.createServer(s => { sockets.add(s); s.on('close', () => sockets.delete(s)); s.on('error', () => {}); s.pipe(s); });
await new Promise(resolve => echo.listen(0, '127.0.0.1', resolve));
try {
  const port = echo.address().port;
  const portBytes = [port >> 8, port & 255];
  const payload = Buffer.from('CONNECTION-CHECK');
  const vless = Buffer.from([0, ...Buffer.from(uuid.replaceAll('-', ''), 'hex'), 0, 1, ...portBytes, 1, 127, 0, 0, 1, ...payload]);
  const trojan = Buffer.from([...Buffer.from(crypto.createHash('sha224').update(password).digest('hex')), 13, 10, 1, 1, 127, 0, 0, 1, ...portBytes, 13, 10, ...payload]);
  for (const [name, body, expected] of [['VLESS', vless, Buffer.concat([Buffer.from([0, 0]), payload])], ['Trojan', trojan, payload]]) {
    const response = await call('/bk-xhttp', { method: 'POST', body });
    assert.equal(response.status, 200, `${name} XHTTP status`);
    const bytes = await Promise.race([
      response.arrayBuffer(),
      new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error(`${name} response did not finish`)), 5000); timer.unref(); })
    ]);
    assert.deepEqual(Buffer.from(bytes), expected, `${name} XHTTP response framing and echo`);
  }
  assert.equal((await call('/bk-xhttp', { method: 'POST', body: 'bad-auth' })).status, 403);
  console.log('  VLESS / Trojan HTTP streaming: real TCP echo, response framing, completion, bad auth: ok');
  for (const type of ['vless', 'trojan', 'ss', 'openvpn', 'clash', 'singbox', 'xray', 'warp', 'amnezia']) {
    assert.equal((await call(`/sub/${type}`)).status, 401, `${type} requires authorization`);
    const response = await call(`/sub/${type}?token=test-sub-token`);
    if (type === 'openvpn') {
      assert.equal(response.status, 503, `${type} must not export fake credentials`);
      continue;
    }
    if (['warp', 'amnezia'].includes(type)) {
      assert.equal(response.status, 400, `${type} requires real credentials`);
      continue;
    }
    assert.equal(response.status, 200, `${type} export status`);
    const text = await response.text();
    assert.ok(text.length > 20, `${type} export is not empty`);
    if (type === 'singbox') JSON.parse(text);
  }
  console.log('  All 9 subscription routes: auth, valid output or missing-configuration errors: ok');
  // Any *.pages.dev host exercises the Pages branch that restores the six TLS
  // port variants; the specific project name is irrelevant to the assertion.
  const feed = async (format, host = process.env.BK_TEST_PAGES_HOST || 'example-panel.pages.dev') => {
    const response = await worker.fetch(new Request(`https://${host}/sub/${format}${format.includes('?') ? '&' : '?'}token=test-sub-token`), env, { waitUntil(p) { background.push(p); } });
    assert.equal(response.status, 200);
    return response.text();
  };
  assert.equal((await feed('vless', 'node.example.com')).split('\n').length, 1, 'Node default remains 443');
  assert.equal((await feed('vless')).split('\n').length, 6, 'Pages restores six TLS port variants');
  for (const type of ['vless', 'trojan']) {
    for (const line of (await feed(type)).split('\n')) {
      const uri = new URL(line);
      assert.equal(uri.searchParams.get('alpn'), 'http/1.1', 'Use the working sample WebSocket ALPN');
      assert.equal(uri.searchParams.get('fp'), 'chrome');
      assert.equal(uri.searchParams.has('ed'), false, 'Do not force early data in compatibility feeds');
    }
  }
  assert.equal(Buffer.from(await feed('xray'), 'base64').toString().split('\n').length, 18, 'Combined feed contains VLESS, Trojan and SS');
  await kv.put('config:static_ip_list', '192.0.2.1,192.0.2.2,192.0.2.3,192.0.2.4,192.0.2.5,2001:db8::1,192.0.2.1');
  await kv.put('config:domain_fronting_enabled', 'true');
  await kv.put('config:fronting_sni', 'front.example.com');
  const realDateNow = Date.now;
  let settingsClock = realDateNow() + 60001;
  Date.now = () => settingsClock;
  await feed('vless'); // Expire the settings cache after changing the fixture.
  Date.now = realDateNow;
  for (const type of ['vless', 'trojan']) {
    const lines = (await feed(type)).split('\n');
    assert.equal(lines.length, 14, `${type}: six ports, two fronting, all six unique static IPs`);
    assert.ok(lines.some(line => line.includes('@[2001:db8::1]:443')), 'IPv6 URI is bracketed');
  }
  assert.equal(Buffer.from(await feed('xray'), 'base64').toString().split('\n').length, 40);
  const sb = JSON.parse(await feed('singbox'));
  const proxyNodes = sb.outbounds.filter(o => ['vless', 'trojan', 'shadowsocks'].includes(o.type));
  assert.equal(proxyNodes.length, 40);
  assert.equal(new Set(proxyNodes.map(o => o.tag)).size, 40);
  assert.ok(proxyNodes.every(o => sb.outbounds[0].outbounds.includes(o.tag)), 'Selector includes every node');
  assert.equal(proxyNodes.find(o => o.tag === 'BlueKnight-VLESS-Fronting-443').tls.server_name, 'front.example.com');
  const clash = await feed('clash');
  assert.equal((clash.match(/    type: (vless|trojan|ss)\n/g) || []).length, 40);
  for (const format of ['xray-json', 'xray?format=json']) {
    const config = JSON.parse(await feed(format));
    assert.equal(config.outbounds.filter(o => ['vless', 'trojan', 'shadowsocks'].includes(o.protocol)).length, 40, `${format}: all configured endpoints`);
  }
  await kv.put('config:static_ip_list', '');
  await kv.put('config:domain_fronting_enabled', 'false');
  settingsClock += 60001;
  Date.now = () => settingsClock;
  await feed('vless');
  Date.now = realDateNow;
  env.PROXY_PORTS = '443,8443,443';
  assert.equal((await feed('vless')).split('\n').length, 2, 'Explicit port override preserved and deduplicated');
  delete env.PROXY_PORTS;
  console.log('  Subscription regression: restored ports, 14 configured nodes, all formats, IPv6, explicit overrides: ok');
  const native = { outbounds: [{ type: 'shadowsocks', tag: 'shadowsocks', server: 'localhost', server_port: 8388, method: '2022-blake3-aes-256-gcm', password: 'test' }] };
  env.NATIVE_CLIENT_CONFIG = JSON.stringify(native);
  assert.equal((await call('/sub/ss?token=test-sub-token')).status, 200);
  const nativeResponse = await call('/sub/native?token=test-sub-token');
  assert.deepEqual(await nativeResponse.json(), native);
  const combined = await (await call('/sub/all?token=test-sub-token')).json();
  assert.ok(combined.outbounds.some(o => o.type === 'vless'));
  assert.ok(combined.outbounds.some(o => o.type === 'trojan'));
  assert.ok(combined.outbounds.some(o => o.tag === 'native-shadowsocks'));
  assert.ok(combined.outbounds[0].outbounds.includes('native-shadowsocks'));
  env.NATIVE_CLIENT_CONFIG = JSON.stringify({ outbounds: [{ type: 'shadowsocks', tag: 'bad', detour: 'missing' }] });
  assert.equal((await call('/sub/all?token=test-sub-token')).status, 503, 'Invalid native references fail visibly');
  env.NATIVE_CLIENT_CONFIG = JSON.stringify(native);
  assert.equal((await call('/sub/tuic?token=test-sub-token')).status, 503);
  const realFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, init) => {
      if (init.headers.Accept === 'application/dns-json') return Response.json({ Status: 0, Answer: [{ data: '192.0.2.1' }] });
      return new Response(Buffer.from([0, 1, 2, 3]), { headers: { 'content-type': 'application/dns-message' } });
    };
    for (const [path, init] of [['/dns-query?dns=AAEC', {}], ['/dns-query', { method: 'POST', headers: { 'content-type': 'application/dns-message' }, body: Buffer.from([0, 1, 2]) }]]) {
      const response = await call(path, init);
      assert.equal(response.status, 200);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from([0, 1, 2, 3]));
    }
    globalThis.fetch = async (url, init) => {
      const bytes = Buffer.from(init.body);
      bytes[2] = 129; bytes[3] = 128;
      return new Response(bytes);
    };
    assert.equal((await (await call('/dns-json?name=example.org')).json()).Status, 0);
    assert.equal((await call('/dns-json?name=example.org&type=invalid')).status, 400);
    assert.equal((await call('/dns-query')).status, 400);
    assert.equal((await call('/dns-query', { method: 'POST', body: 'bad' })).status, 415);
    globalThis.fetch = async () => { throw new Error('test upstream unavailable'); };
    assert.equal((await call('/dns-query?dns=AAEC')).status, 502);
  } finally { globalThis.fetch = realFetch; }
  console.log('  DNS forwarding: GET, POST, JSON, validation, upstream failure: ok (controlled upstream)');
} finally {
  for (const s of sockets) s.destroy();
  await new Promise(resolve => echo.close(resolve));
  await Promise.allSettled(background);
}
console.log('Connection regression checks passed.');
