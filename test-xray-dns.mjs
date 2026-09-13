import assert from 'node:assert/strict';
import { Console } from 'node:console';
import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import dgram from 'node:dgram';
import tls from 'node:tls';
import { X509Certificate } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { createMemoryKV } from './lib/kv-store.mjs';
import { normalizeDns } from './lib/client-dns.mjs';
import { applyXrayDns } from './lib/xray-dns.mjs';
import { dnsQuestion, dnsJson } from './lib/dns-wire.mjs';
const proc = process, stdout = process.stdout, stderr = process.stderr;
const { default: worker } = await import('./worker.js');
globalThis.process = proc; globalThis.console = new Console({ stdout, stderr });
const kv = createMemoryKV(() => undefined), env = { BK_KV: kv, PANEL_PASSWORD: 'Xray-Test-12345!' };
await kv.put('config:admin_password', env.PANEL_PASSWORD); await kv.put('config:sub_token', 'xray-dns-test');
const call = (url, init) => worker.fetch(new Request(`https://panel.test${url}`, init), env, { waitUntil() {} });
const login = await call('/panel/login', { method: 'POST', body: new URLSearchParams({ password: env.PANEL_PASSWORD }) });
const cookie = login.headers.get('set-cookie').split(';')[0];
const save = data => call('/panel/settings/protocols', { method: 'POST', headers: { cookie }, body: new URLSearchParams(data) });
const policy = normalizeDns({ mode: 'fake-ip', resolver: 'https://1.1.1.1/dns-query', route: 'proxy', domains: 'special.test', domainResolver: 'tls://dns.example', forceProxy: 'google.com', blockQuic: true });
await save({ clientDnsSettings: '1', ...Object.fromEntries(Object.entries(policy).map(([k,v]) => [`clientDns_${k}`, v === true ? 'on' : v === false ? '' : v])) });
const config = await (await call('/sub/xray-json?token=xray-dns-test')).json();
assert.deepEqual(config, await (await call('/sub/xray?format=json&token=xray-dns-test')).json());
assert.ok(config.fakedns.length);
assert.equal(config.dns.servers[0].tag, 'dns-bootstrap');
assert.ok(config.inbounds.find(i => i.tag === 'dns-in'));
assert.equal(config.outbounds.find(o => o.tag === 'dns-domain-tls-out').streamSettings.sockopt.dialerProxy, config.outbounds[0].tag);
assert.ok(config.inbounds.filter(i => ['socks-in', 'http-in'].includes(i.tag)).every(i => i.sniffing.destOverride.includes('fakedns')));
const selectedTag = config.outbounds.find(o => o.protocol === 'trojan').tag;
const selected = await (await call('/sub/xray-json?token=xray-dns-test&node=' + selectedTag)).json();
assert.equal(selected.outbounds[0].tag, selectedTag);
assert.equal(selected.routing.rules.find(r => r.domain?.includes('domain:google.com')).outboundTag, selectedTag);
assert.equal((await call('/sub/xray-json?token=xray-dns-test&node=missing')).status, 400);
await save({ chainType: 'socks', chainEnabled: 'on', chainAddress: 'exit.example', chainPort: '1080', chainAuth: 'secret-user:secret-password' });
assert.doesNotMatch(await (await call('/sub/xray-json?token=xray-dns-test')).text(), /exit\.example|secret-user|secret-password/);
const binary = process.env.XRAY_BIN || '.validation/xray/xray.exe';
const hasBinary = await fs.access(binary).then(() => true, () => false);
if (!hasBinary && process.env.XRAY_BIN) throw new Error('XRAY_BIN does not exist');
await fs.mkdir('.validation/xray-dns-tests', { recursive: true });
function base() {
  return { log: { loglevel: 'warning' }, inbounds: [{ tag: 'socks-in', listen: '127.0.0.1', port: 10808, protocol: 'socks', settings: { auth: 'noauth', udp: true } }], outbounds: [structuredClone(config.outbounds.find(o => o.protocol === 'vless')), { tag: 'direct', protocol: 'freedom', settings: {} }, { tag: 'block', protocol: 'blackhole', settings: {} }], routing: { domainStrategy: 'IPIfNonMatch', rules: [] } };
}
let checks = 0;
async function check(c) {
  const file = `.validation/xray-dns-tests/config-${checks++}.json`; await fs.writeFile(file, JSON.stringify(c));
  if (hasBinary) { const result = spawnSync(binary, ['run', '-test', '-c', file], { windowsHide: true, encoding: 'utf8' }); assert.equal(result.status, 0, result.error?.message || result.stdout + result.stderr); }
}
await check(config);
for (const resolver of ['https://dns.google/dns-query', 'tls://dns.example', 'tcp://1.1.1.1', 'udp://1.1.1.1:5353', 'quic://dns.example', 'h3://dns.google/dns-query']) {
  for (const mode of ['real', 'fake-ip']) {
    const p = normalizeDns({ ...policy, resolver, route: 'direct', mode, ipv6: mode === 'fake-ip' });
    const c = base(); applyXrayDns(c, p, 'panel.test'); await check(c);
    if (resolver.startsWith('h3:')) assert.ok(c.routing.rules.some(r => r.inboundTag?.includes('dns-primary')));
  }
}
for (const routingPreset of ['off', 'bypass-iran', 'bypass-cn', 'block-ads']) {
  await save({ routingPreset });
  const exported = await (await call('/sub/xray-json?token=xray-dns-test')).json();
  const guard = exported.routing.rules.findIndex(r => r.ip?.includes('198.18.0.0/15'));
  assert.ok(guard >= 0);
  const bypass = exported.routing.rules.findIndex(r => r.ip?.includes('geoip:private'));
  if (bypass >= 0) assert.ok(guard < bypass, 'Fake pools must not follow private/country bypass');
  await check(exported);
}
if (!hasBinary) { console.log('Xray export tests passed; core checks skipped (set XRAY_BIN).'); process.exit(0); }

const connections = new Set(), children = [], servers = [], runtimeLogs = [];
const track = socket => { connections.add(socket); socket.on('error', () => {}); socket.on('close', () => connections.delete(socket)); return socket; };
const listen = async server => { servers.push(server); await new Promise(r => server.listen(0, '127.0.0.1', r)); return server.address().port; };
const reply = question => { const b = Buffer.concat([question, Buffer.from([192,12,0,1,0,1,0,0,0,60,0,4,192,0,2,55])]); b[2] = 129; b[3] = 128; b[7] = 1; return b; };
function framedDns(socket) {
  track(socket); let pending = Buffer.alloc(0);
  socket.on('data', b => { pending = Buffer.concat([pending, b]); while (pending.length >= 2 && pending.length >= 2 + pending.readUInt16BE()) { const length = pending.readUInt16BE(); const response = reply(pending.subarray(2, 2 + length)); pending = pending.subarray(2 + length); const prefix = Buffer.alloc(2); prefix.writeUInt16BE(response.length); socket.write(Buffer.concat([prefix, response])); } });
}
async function reserve() { const s = net.createServer(); await new Promise(r => s.listen(0, '127.0.0.1', r)); const p = s.address().port; await new Promise(r => s.close(r)); return p; }
async function start(c) {
  const port = await reserve(); c.inbounds.find(i => i.tag === 'dns-in').port = port;
  c.inbounds.find(i => i.tag === 'socks-in').port = await reserve();
  const file = `.validation/xray-dns-tests/runtime-${children.length}.json`; await fs.writeFile(file, JSON.stringify(c));
  const child = spawn(binary, ['run', '-c', file], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }); children.push(child);
  let logs = ''; child.stdout.on('data', b => { logs += b; runtimeLogs.push(String(b)); }); child.stderr.on('data', b => { logs += b; runtimeLogs.push(String(b)); });
  for (let n = 0; n < 50; n++) { if (child.exitCode !== null) throw new Error(logs); try { const socket = net.connect(port, '127.0.0.1'); await new Promise((r,j) => { socket.once('connect', r); socket.once('error', j); }); socket.destroy(); return { port, child }; } catch { await new Promise(r => setTimeout(r, 100)); } }
  throw new Error('Xray startup timeout: ' + logs);
}
async function stop(child) { if (child.exitCode !== null || child.signalCode !== null) return; const exited = new Promise(r => child.once('exit', r)); child.kill(); await exited; }
async function query(port, name) {
  const question = dnsQuestion(name);
  return new Promise((resolve, reject) => { const socket = track(net.connect(port, '127.0.0.1')); let bytes = Buffer.alloc(0); socket.setTimeout(5000, () => socket.destroy(new Error('Xray DNS timeout'))); socket.on('error', reject); socket.on('connect', () => { const prefix = Buffer.alloc(2); prefix.writeUInt16BE(question.length); socket.write(Buffer.concat([prefix, question])); }); socket.on('data', b => { bytes = Buffer.concat([bytes, b]); if (bytes.length >= 2 && bytes.length >= 2 + bytes.readUInt16BE()) { socket.destroy(); try { resolve(dnsJson(new Uint8Array(bytes.subarray(2, 2 + bytes.readUInt16BE())), question)); } catch(e) { reject(e); } } }); });
}
const udp = dgram.createSocket('udp4');
function reader(socket) {
  const iterator = socket.iterator({ destroyOnReturn: false }); let pending = Buffer.alloc(0);
  return {
    async read(n) { while (pending.length < n) { const next = await iterator.next(); if (next.done) throw new Error('SOCKS stream closed'); pending = Buffer.concat([pending, next.value]); } const value = pending.subarray(0,n); pending = pending.subarray(n); return value; },
    async release() { await iterator.return(); if (pending.length) socket.unshift(pending); }
  };
}
try {
  await new Promise(r => udp.bind(0, '127.0.0.1', r)); udp.on('message', (q, remote) => udp.send(reply(q), remote.port, remote.address));
  const tcpPort = await listen(net.createServer(framedDns));
  const cert = await fs.readFile(process.env.TEST_TLS_CERT || '.validation/test.crt', 'utf8');
  const key = await fs.readFile(process.env.TEST_TLS_KEY || '.validation/test.key', 'utf8');
  const tlsPort = await listen(tls.createServer({ cert, key }, framedDns));
  const echoPort = await listen(net.createServer(socket => { track(socket); socket.pipe(socket); }));
  const targets = [];
  const proxyPort = await listen(net.createServer(socket => {
    track(socket);
    (async () => {
      const input = reader(socket), greeting = await input.read(2); await input.read(greeting[1]); socket.write(Buffer.from([5,0]));
      const header = await input.read(4);
      const host = header[3] === 3 ? (await input.read((await input.read(1))[0])).toString() : [...await input.read(4)].join('.');
      const port = (await input.read(2)).readUInt16BE(); targets.push({ host, port });
      const remote = track(net.connect(port, host === 'public.test' ? '127.0.0.1' : host));
      await new Promise((r,j) => { remote.once('connect', r); remote.once('error', j); });
      socket.write(Buffer.from([5,0,0,1,127,0,0,1,0,0])); await input.release(); socket.pipe(remote); remote.pipe(socket);
    })().catch(error => socket.destroy(error));
  }));
  for (const [resolver, route] of [[`udp://127.0.0.1:${udp.address().port}`, 'direct'], [`tcp://127.0.0.1:${tcpPort}`, 'direct'], [`tls://127.0.0.1:${tlsPort}`, 'direct'], [`tls://127.0.0.1:${tlsPort}`, 'proxy']]) {
    const c = base(), p = normalizeDns({ mode: 'fake-ip', resolver, route, domains: 'special.test', domainResolver: resolver }); c.log.loglevel = 'debug';
    applyXrayDns(c, p, 'panel.test');
    // A recording SOCKS exit proves that fake addresses recover to domains;
    // it also verifies that TLS-wrapped DNS can traverse a proxy outbound.
    c.outbounds[0] = { tag: c.outbounds[0].tag, protocol: 'socks', settings: { servers: [{ address: '127.0.0.1', port: proxyPort }] } };
    for (const o of c.outbounds.filter(o => o.tag.endsWith('-tls-out'))) { o.streamSettings.tlsSettings.serverName = 'localhost'; o.streamSettings.tlsSettings.pinnedPeerCertSha256 = new X509Certificate(cert).fingerprint256; }
    const { port, child } = await start(c);
    const fakeAddress = (await query(port, 'public.test')).Answer[0].data;
    assert.match(fakeAddress, /^198\.(18|19)\./);
    assert.equal((await query(port, 'printer.lan')).Answer[0].data, '192.0.2.55');
    assert.equal((await query(port, 'special.test')).Answer[0].data, '192.0.2.55');
    const socket = track(net.connect(c.inbounds.find(i => i.tag === 'socks-in').port, '127.0.0.1'));
    socket.setTimeout(5000, () => socket.destroy(new Error('FakeDNS recovery timeout')));
    const input = reader(socket); socket.write(Buffer.from([5,1,0])); assert.deepEqual(await input.read(2), Buffer.from([5,0]));
    socket.write(Buffer.from([5,1,0,1,...fakeAddress.split('.').map(Number),echoPort >> 8,echoPort & 255]));
    const header = await input.read(4); assert.equal(header[1],0); await input.read((header[3] === 1 ? 4 : header[3] === 4 ? 16 : (await input.read(1))[0]) + 2);
    socket.write(Buffer.from('FAKE-DNS-RECOVERY')); assert.equal((await input.read(17)).toString(), 'FAKE-DNS-RECOVERY'); socket.destroy();
    assert.ok(targets.some(t => t.host === 'public.test' && t.port === echoPort));
    if (route === 'proxy') assert.ok(targets.some(t => t.port === tlsPort), 'TLS DNS actually passed through the proxy');
    await stop(child);
  }
  console.log(`Xray: ${checks} full config checks; real FakeDNS recovery, UDP/TCP/pinned-TLS DNS, domain policies and TLS DNS through a proxy passed.`);
} catch (error) { console.error(runtimeLogs.join('').slice(-6500)); throw error; }
finally { for (const child of children) await stop(child); for (const socket of connections) socket.destroy(); udp.close(); await Promise.all(servers.map(s => new Promise(r => s.close(r)))); }
