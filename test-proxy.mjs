// End-to-end proxy tunnel check: real WebSocket handshake + VLESS framing +
// TCP relay to a local echo server. Run with: npm run test:proxy
import assert from 'node:assert/strict';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { acceptKey, encodeFrame, FrameParser } from './lib/ws-node.mjs';

// --target=<port> tests an already-running host (e.g. `wrangler dev`) instead of
// spawning server.js; --uuid=<uuid> supplies that host's VLESS identity.
const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || `=${d}`).split('=').pop();
const EXTERNAL = process.argv.some((a) => a.startsWith('--target='));
let PORT = Number(arg('target', 0));
let ECHO_PORT = Number(arg('echo', 0));
if (!EXTERNAL) {
  const reservation = net.createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  PORT = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
}
const UUID = arg('uuid', '8831688d-d6eb-49a8-bda1-046e5e14ec00');
const PASSWORD = 'Admin@12345678';
// Git Bash (MSYS) rewrites an argument that looks like a unix absolute path
// into a Windows path, so `--path=/bk-ws` arrives as "C:/Program Files/Git/bk-ws".
// Undo that here or the test reports a bogus 500 against a perfectly good server.
const rawPath = arg('path', '/bk-ws');
const WS_PATH = /^[A-Za-z]:[\/]/.test(rawPath)
  ? '/' + rawPath.split(/[\/]/).pop()
  : (rawPath.startsWith('/') ? rawPath : '/' + rawPath);
// Pre-rename path. The router must keep accepting it or every client
// configured before the BlueKnight rename silently stops connecting.
const LEGACY_WS_PATH = '/wd-ws';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- unit: frame codec round-trips, including split reads and fragmentation ---
function maskedFrame(payload, opcode = 0x2, fin = true) {
  const mask = crypto.randomBytes(4);
  const data = Buffer.from(payload);
  const masked = Buffer.from(data);
  for (let i = 0; i < masked.length; i++) masked[i] ^= mask[i & 3];
  let header;
  if (data.length < 126) {
    header = Buffer.alloc(2);
    header[1] = 0x80 | data.length;
  } else if (data.length < 65536) {
    header = Buffer.alloc(4);
    header[1] = 0x80 | 126;
    header.writeUInt16BE(data.length, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 0x80 | 127;
    header.writeBigUInt64BE(BigInt(data.length), 2);
  }
  header[0] = (fin ? 0x80 : 0x00) | opcode;
  return Buffer.concat([header, mask, masked]);
}

function collect(frames) {
  const got = [];
  const p = new FrameParser({ onMessage: (m) => got.push(m) });
  for (const f of frames) p.push(f);
  return got;
}

{
  const big = crypto.randomBytes(200000);
  assert.deepEqual(collect([maskedFrame(Buffer.from('hi'))])[0], Buffer.from('hi'), 'small frame');
  assert.deepEqual(collect([maskedFrame(big)])[0], big, '64-bit length frame');

  // split every frame byte-by-byte across reads
  const f = maskedFrame(Buffer.from('abcdefghij'.repeat(30)));
  const chunks = [];
  for (let i = 0; i < f.length; i += 7) chunks.push(Buffer.from(f.subarray(i, i + 7)));
  assert.deepEqual(collect(chunks)[0], Buffer.from('abcdefghij'.repeat(30)), 'split reads reassemble');

  // two frames in one read
  const two = collect([Buffer.concat([maskedFrame(Buffer.from('one')), maskedFrame(Buffer.from('two'))])]);
  assert.deepEqual([two[0].toString(), two[1].toString()], ['one', 'two'], 'coalesced frames');

  // fragmented message: first frame FIN=0 opcode=2, continuation FIN=1 opcode=0
  const frag = collect([maskedFrame(Buffer.from('part1'), 0x2, false), maskedFrame(Buffer.from('part2'), 0x0, true)]);
  assert.equal(frag[0].toString(), 'part1part2', 'fragments reassemble');

  const enc = encodeFrame(Buffer.from('xyz'), 0x2);
  assert.equal(enc[0], 0x82, 'server frame is FIN+binary');
  assert.equal(enc[1] & 0x80, 0, 'server frames must not be masked');
  console.log('  frame codec: ok');
}

// --- integration: boot the server, tunnel a VLESS request to a TCP echo ---
const echo = net.createServer((c) => { c.on('error', () => {}); c.pipe(c); });
await new Promise((r) => echo.listen(ECHO_PORT, '127.0.0.1', r));
ECHO_PORT = echo.address().port;

const logs = [];
const testDataDir = EXTERNAL ? null : await mkdtemp(path.join(tmpdir(), 'blueknight-proxy-'));
const server = EXTERNAL ? null : spawn(process.execPath, ['server.js'], {
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(PORT), PANEL_PASSWORD: PASSWORD, VLESS_UUID: UUID, DATA_DIR: testDataDir },
  stdio: ['ignore', 'pipe', 'pipe']
});
if (server) {
  server.stdout.on('data', (d) => logs.push(d.toString()));
  server.stderr.on('data', (d) => logs.push(d.toString()));
}

try {
  for (let i = 0; i < 40; i++) {
    try { await fetch(`http://127.0.0.1:${PORT}/api/health`); break; } catch { await sleep(250); }
  }

  if (!EXTERNAL) {
    for (const file of ['/server.js', '/worker.js', '/package.json', '/data/blueknight_kv.json']) {
      assert.equal((await fetch(`http://127.0.0.1:${PORT}${file}`)).status, 404, 'Private project files must not be public');
    }
    assert.equal((await fetch(`http://127.0.0.1:${PORT}/assets/theme-bg-1.jpg`)).status, 200);
    console.log('  static assets and private-file isolation: ok');
  }

  const key = crypto.randomBytes(16).toString('base64');
  const sock = net.createConnection({ host: '127.0.0.1', port: PORT });
  sock.on('error', () => {});
  await new Promise((r, j) => { sock.once('connect', r); sock.once('error', j); });

  sock.write(
    [`GET ${WS_PATH} HTTP/1.1`, `Host: 127.0.0.1:${PORT}`, 'Upgrade: websocket',
     'Connection: Upgrade', `Sec-WebSocket-Key: ${key}`, 'Sec-WebSocket-Version: 13', '', '']
      .join(String.fromCharCode(13, 10))
  );

  // handshake
  const handshake = await new Promise((resolve, reject) => {
    let buf = Buffer.alloc(0);
    const t = setTimeout(() => reject(new Error('handshake timeout')), 8000);
    sock.on('data', function onData(c) {
      buf = Buffer.concat([buf, c]);
      const end = buf.indexOf(String.fromCharCode(13, 10, 13, 10));
      if (end !== -1) {
        clearTimeout(t);
        sock.off('data', onData);
        resolve({ head: buf.subarray(0, end).toString(), rest: buf.subarray(end + 4) });
      }
    });
  });

  assert.match(handshake.head, /^HTTP\/1\.1 101 /, 'server must answer 101, got: ' + JSON.stringify(handshake.head.slice(0, 300)));
  assert.match(handshake.head, new RegExp('Sec-WebSocket-Accept: ' + acceptKey(key).replace(/\+/g, '\\+')),
    'Sec-WebSocket-Accept must be the RFC 6455 digest');
  console.log('  websocket handshake: ok');

  // VLESS request: ver, uuid, addonLen=0, cmd=TCP, port, addrType=IPv4, ip, payload
  const uuidBytes = Buffer.from(UUID.replace(/-/g, ''), 'hex');
  const port = Buffer.alloc(2); port.writeUInt16BE(ECHO_PORT);
  const payload = Buffer.from('PING-THROUGH-TUNNEL');
  const vless = Buffer.concat([
    Buffer.from([0x00]), uuidBytes, Buffer.from([0x00]), Buffer.from([0x01]),
    port, Buffer.from([0x01]), Buffer.from([127, 0, 0, 1]), payload
  ]);

  const received = [];
  const parser = new FrameParser({ onMessage: (m) => received.push(m) });
  sock.on('data', (c) => parser.push(c));
  if (handshake.rest.length) parser.push(handshake.rest);

  sock.write(maskedFrame(vless));

  for (let i = 0; i < 60 && Buffer.concat(received).length < 2 + payload.length; i++) await sleep(100);
  const all = Buffer.concat(received);
  assert.ok(all.length >= 2, 'expected a VLESS response header');
  assert.equal(all[0], 0x00, 'VLESS response version');
  const echoed = all.subarray(2).toString();
  assert.equal(echoed, payload.toString(), `tunnel must echo the payload, got ${JSON.stringify(echoed)}`);
  console.log('  vless tunnel -> tcp echo: ok');

  sock.destroy();

  // The legacy path must still complete a handshake.
  const legacyKey = crypto.randomBytes(16).toString('base64');
  const legacySock = net.createConnection({ host: '127.0.0.1', port: PORT });
  legacySock.on('error', () => {});
  await new Promise((r, j) => { legacySock.once('connect', r); legacySock.once('error', j); });
  legacySock.write(
    [`GET ${LEGACY_WS_PATH} HTTP/1.1`, `Host: 127.0.0.1:${PORT}`, 'Upgrade: websocket',
     'Connection: Upgrade', `Sec-WebSocket-Key: ${legacyKey}`, 'Sec-WebSocket-Version: 13', '', '']
      .join(String.fromCharCode(13, 10))
  );
  const legacyHead = await new Promise((resolve, reject) => {
    let buf = Buffer.alloc(0);
    const t = setTimeout(() => reject(new Error('legacy handshake timeout')), 8000);
    legacySock.on('data', (c) => {
      buf = Buffer.concat([buf, c]);
      const end = buf.indexOf(String.fromCharCode(13, 10, 13, 10));
      if (end !== -1) { clearTimeout(t); resolve(buf.subarray(0, end).toString()); }
    });
  });
  assert.match(legacyHead, /^HTTP\/1\.1 101 /,
    `legacy ${LEGACY_WS_PATH} must still upgrade, got: ` + JSON.stringify(legacyHead.slice(0, 200)));
  legacySock.destroy();
  console.log(`  legacy path ${LEGACY_WS_PATH} still upgrades: ok`);

  console.log(`Proxy tunnel checks passed (${EXTERNAL ? 'external host :' + PORT : 'server.js'}).`);
} catch (err) {
  console.error('FAILED:', err.message);
  console.error('--- server output ---\n' + logs.join(''));
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) {
    const exited = new Promise((resolve) => server.once('exit', resolve));
    server.kill();
    await exited;
  }
  echo.close();
  if (testDataDir) await rm(testDataDir, { recursive: true, force: true });
}
