import assert from 'node:assert/strict';
import { Console } from 'node:console';
import fs from 'node:fs/promises';
import { spawnSync, spawn } from 'node:child_process';
import net from 'node:net';
import dgram from 'node:dgram';
import { dnsQuestion, dnsJson } from './lib/dns-wire.mjs';
import { createMemoryKV } from './lib/kv-store.mjs';
import { normalizeDns, parseResolver, singboxDns, clashDns } from './lib/client-dns.mjs';
const proc = process, stdout = process.stdout, stderr = process.stderr;
const { default: worker } = await import('./worker.js');
globalThis.process = proc; globalThis.console = new Console({ stdout, stderr });
const kv = createMemoryKV(() => undefined), env = { BK_KV: kv, PANEL_PASSWORD: 'Test-Dns-Only-123!' };
await kv.put('config:admin_password', env.PANEL_PASSWORD);
await kv.put('config:sub_token', 'dns-test');
const call = (path, init) => worker.fetch(new Request(`https://dns-test.example${path}`, init), env, { waitUntil() {} });
const login = await call('/panel/login', { method: 'POST', body: new URLSearchParams({ password: env.PANEL_PASSWORD }) });
const cookie = login.headers.get('set-cookie').split(';')[0];
const save = policy => call('/panel/settings/protocols', { method: 'POST', headers: { cookie }, body: new URLSearchParams({ clientDnsSettings: '1', ...Object.fromEntries(Object.entries(policy).filter(([,v]) => v !== false).map(([k,v]) => [`clientDns_${k}`, v === true ? 'on' : v])) }) });
for (const invalid of [{ bootstrap: '999.1.1.1' }, { resolver: 'file:///etc/passwd' }, { resolver: 'tls://dns.test:99999' }, { domains: '<script>' }, { route: 'proxy', resolver: 'quic://dns.test' }, { route: 'proxy', resolver: 'panel' }]) assert.throws(() => normalizeDns(invalid));
const policy = normalizeDns({ mode: 'fake-ip', resolver: 'https://1.1.1.1/dns-query', route: 'proxy', tun: true, blockQuic: true, forceProxy: 'google.com\ngstatic.com', domains: 'example.com', domainResolver: 'tls://1.0.0.1' });
await save(policy);
assert.deepEqual(JSON.parse(await kv.get('config:client_dns')), policy);
const sb = await (await call('/sub/singbox?token=dns-test')).json();
assert.ok(sb.dns.servers.some(s => s.type === 'fakeip'));
assert.equal(sb.dns.servers.find(s => s.tag === 'remote-dns').detour, 'select');
assert.equal(sb.dns.rules[0].server, 'domain-dns', 'Domain policy overrides fake answers');
assert.equal(sb.route.default_domain_resolver, 'bootstrap-dns', 'Proxy bootstrap never uses fake answers');
assert.ok(sb.inbounds.some(i => i.type === 'tun'));
assert.equal(sb.route.rules[2].action, 'reject');
assert.deepEqual(sb.route.rules[3].domain_suffix, ['google.com', 'gstatic.com']);
const yaml = await (await call('/sub/clash?token=dns-test')).text();
const dns = JSON.parse(yaml.match(/^dns: (.*)$/m)[1]);
assert.equal(dns['enhanced-mode'], 'fake-ip');
assert.deepEqual(dns.nameserver, ['https://1.1.1.1/dns-query#PROXY']);
assert.deepEqual(dns['proxy-server-nameserver'], ['1.1.1.1']);
assert.match(yaml, /tun: .*"dns-hijack"/);
const html = await (await call('/panel?tab=dns', { headers: { cookie } })).text();
assert.match(html, /Save client DNS &amp; routing/);
assert.match(html, /id="clientDns_resolver"[^>]*value="https:\/\/1.1.1.1\/dns-query"/);
const prior = await kv.get('config:client_dns');
await save({ ...policy, resolver: 'javascript:alert(1)' });
assert.equal(await kv.get('config:client_dns'), prior, 'Invalid save must preserve prior policy');
await save({ ...policy, tun: false, blockQuic: false, ipv6: false });
assert.equal(JSON.parse(await kv.get('config:client_dns')).tun, false, 'Unchecked toggle persists');
const fallbackPolicy = { ...policy, gatewayFallbacks: 'https://fallback.example/dns-query' };
await save(fallbackPolicy);
const attempts = [];
env.DNS_FETCH = async (url, init) => {
  attempts.push(url);
  assert.ok(init.signal, 'Gateway requests have a timeout');
  if (!url.startsWith('https://fallback.example/')) return new Response('unavailable', { status: 502 });
  const bytes = init.method === 'GET' ? Buffer.from(new URL(url).searchParams.get('dns'), 'base64url') : Buffer.from(init.body);
  bytes[2] = 129; bytes[3] = 128;
  return new Response(bytes, { headers: { 'content-type': 'application/dns-message' } });
};
const q = dnsQuestion('example.com');
for (const [path, init] of [
  ['/dns-query?dns=' + Buffer.from(q).toString('base64url'), {}],
  ['/dns-query', { method: 'POST', headers: { 'content-type': 'application/dns-message' }, body: q }],
  ['/dns-json?name=example.com&type=A', {}]
]) {
  attempts.length = 0;
  const response = await call(path, init);
  assert.equal(response.status, 200);
  assert.equal(attempts.length, 2, 'Failed primary retries configured fallback');
  if (path.startsWith('/dns-json')) assert.equal((await response.json()).Status, 0);
  else assert.equal(dnsJson(new Uint8Array(await response.arrayBuffer()), q).Status, 0);
}
const imported = await call('/api/node/import', { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ settings: { clientDns: fallbackPolicy } }) });
assert.equal(imported.status, 200);
const exported = await (await call('/api/node/export', { headers: { cookie } })).json();
assert.deepEqual(exported.settings.clientDns, fallbackPolicy, 'Sharing preserves DNS policy');
const badImport = await call('/api/node/import', { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ settings: { clientDns: { resolver: 'invalid' } } }) });
assert.notEqual(badImport.status, 200);
await call('/panel/settings/protocols', { method: 'POST', headers: { cookie }, body: new URLSearchParams({ chainType: 'socks', chainEnabled: 'on', chainAddress: 'exit.example', chainPort: '1080', chainAuth: 'secret-user:secret-password' }) });
for (const format of ['singbox', 'clash']) {
  const feed = await (await call(`/sub/${format}?token=dns-test`)).text();
  assert.doesNotMatch(feed, /secret-user|secret-password|exit\.example|chain-upstream|Chain-Upstream/, 'Server-side exit must not be exposed or chained from client');
}
const validator = process.env.SING_BOX_BIN || '.validation/sing-box-1.14.0-windows-amd64/sing-box.exe';
const hasValidator = await fs.access(validator).then(() => true, () => false);
if (!hasValidator && process.env.SING_BOX_BIN) throw new Error('SING_BOX_BIN does not exist');
const mihomo = process.env.MIHOMO_BIN || '.validation/mihomo-v1.19.30/mihomo-windows-amd64-compatible.exe';
const hasMihomo = await fs.access(mihomo).then(() => true, () => false);
if (!hasMihomo && process.env.MIHOMO_BIN) throw new Error('MIHOMO_BIN does not exist');
await fs.mkdir('.validation/mihomo-dns-tests', { recursive: true });
await fs.mkdir('.validation/dns-tests', { recursive: true });
const protocols = ['https://1.1.1.1/dns-query', 'tls://1.1.1.1', 'tcp://1.1.1.1', 'udp://1.1.1.1', 'quic://dns.adguard-dns.com', 'h3://dns.google/dns-query'];
for (const resolver of protocols) {
  for (const ipv6 of [false, true]) {
    const p = normalizeDns({ ...policy, resolver, route: 'direct', ipv6 });
    const config = structuredClone(sb); config.dns = singboxDns(p, 'dns-test.example');
    const file = `.validation/dns-tests/${parseResolver(resolver).type}-${ipv6}.json`;
    await fs.writeFile(file, JSON.stringify(config));
    if (hasValidator) {
      const result = spawnSync(validator, ['check', '-c', file], { encoding: 'utf8', windowsHide: true });
      assert.equal(result.status, 0, result.error?.message || result.stderr);
    }
    assert.ok(JSON.parse(clashDns(p, 'dns-test.example').match(/^dns: (.*)$/m)[1]));
    if (hasMihomo) {
      const file = `.validation/mihomo-dns-tests/${parseResolver(resolver).type}-${ipv6}.yaml`;
      const full = yaml.replace(/^tun: .*\r?\n/m, '').replace(/^dns: .*$/m, clashDns(p, 'dns-test.example').trim());
      await fs.writeFile(file, full);
      const result = spawnSync(mihomo, ['-t', '-d', '.validation/mihomo-dns-tests', '-f', file], { encoding: 'utf8', windowsHide: true, timeout: 15000 });
      assert.equal(result.status, 0, result.error?.message || result.stdout + result.stderr);
    }
  }
}
if (hasValidator) {
  const upstream = dgram.createSocket('udp4');
  await new Promise(r => upstream.bind(0, '127.0.0.1', r));
  upstream.on('message', (question, remote) => {
    const reply = Buffer.concat([question, Buffer.from([192,12,0,1,0,1,0,0,0,60,0,4,192,0,2,55])]);
    reply[2] = 129; reply[3] = 128; reply[7] = 1;
    upstream.send(reply, remote.port, remote.address);
  });
  const reserve = net.createServer();
  await new Promise(r => reserve.listen(0, '127.0.0.1', r));
  const port = reserve.address().port; await new Promise(r => reserve.close(r));
  const p = normalizeDns({ mode: 'fake-ip', resolver: `udp://127.0.0.1:${upstream.address().port}`, domains: 'special.test', domainResolver: `udp://127.0.0.1:${upstream.address().port}` });
  const runtime = { dns: singboxDns(p, 'panel.test'), inbounds: [{ type: 'direct', tag: 'dns-in', listen: '127.0.0.1', listen_port: port }], outbounds: [{ type: 'direct', tag: 'direct' }], route: { default_domain_resolver: 'bootstrap-dns', rules: [{ action: 'sniff' }, { protocol: 'dns', action: 'hijack-dns' }], final: 'direct' } };
  const file = '.validation/dns-tests/runtime.json'; await fs.writeFile(file, JSON.stringify(runtime));
  const child = spawn(validator, ['run', '-c', file], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let log = ''; child.stderr.on('data', b => { log += b; });
  async function query(name, targetPort = port) {
    const question = dnsQuestion(name);
    return new Promise((resolve, reject) => {
      const socket = net.connect(targetPort, '127.0.0.1'); let data = Buffer.alloc(0);
      socket.setTimeout(2000, () => socket.destroy(new Error('DNS test timeout')));
      socket.on('error', reject);
      socket.on('connect', () => { const length = Buffer.alloc(2); length.writeUInt16BE(question.length); socket.write(Buffer.concat([length, question])); });
      socket.on('data', b => { data = Buffer.concat([data, b]); if (data.length >= 2 && data.length >= 2 + data.readUInt16BE()) { socket.destroy(); try { resolve(dnsJson(new Uint8Array(data.subarray(2, 2 + data.readUInt16BE())), question)); } catch (e) { reject(e); } } });
    });
  }
  try {
    let result;
    for (let n = 0; n < 50; n++) { try { result = await query('public.test'); break; } catch (e) { if (e.code !== 'ECONNREFUSED') throw e; await new Promise(r => setTimeout(r, 100)); } }
    assert.match(result?.Answer[0]?.data || log, /^198\.(18|19)\./, 'Fake DNS returns synthetic address');
    assert.equal((await query('printer.lan')).Answer[0].data, '192.0.2.55', 'Excluded domain gets real upstream answer');
    assert.equal((await query('special.test')).Answer[0].data, '192.0.2.55', 'Domain-specific resolver overrides Fake DNS');
    if (hasMihomo) {
      const reservation = net.createServer(); await new Promise(r => reservation.listen(0, '127.0.0.1', r));
      const dnsPort = reservation.address().port; await new Promise(r => reservation.close(r));
      const mdns = JSON.parse(clashDns(p, 'panel.test').match(/^dns: (.*)$/m)[1]); mdns.listen = `127.0.0.1:${dnsPort}`;
      const file = '.validation/mihomo-dns-tests/runtime.yaml';
      await fs.writeFile(file, `mode: rule\nproxies: []\nproxy-groups: [{name: PROXY, type: select, proxies: [DIRECT]}]\nrules: [MATCH,DIRECT]\ndns: ${JSON.stringify(mdns)}\n`.replace('rules: [MATCH,DIRECT]', 'rules: ["MATCH,DIRECT"]'));
      const core = spawn(mihomo, ['-d', '.validation/mihomo-dns-tests', '-f', file], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      let coreLog = ''; core.stdout.on('data', b => { coreLog += b; }); core.stderr.on('data', b => { coreLog += b; });
      try {
        let result;
        for (let n = 0; n < 50; n++) { try { result = await query('public.test', dnsPort); break; } catch (e) { if (e.code !== 'ECONNREFUSED') throw e; await new Promise(r => setTimeout(r, 100)); } }
        assert.match(result?.Answer[0]?.data || coreLog, /^198\.18\./);
        assert.equal((await query('printer.lan', dnsPort)).Answer[0].data, '192.0.2.55');
        assert.equal((await query('special.test', dnsPort)).Answer[0].data, '192.0.2.55');
        console.log('Mihomo real Fake DNS, exclusions and domain-policy answers passed.');
      } finally { const stopped = new Promise(r => core.exitCode !== null || core.signalCode !== null ? r() : core.once('exit', r)); core.kill(); await stopped; }
    }
  } finally { child.kill(); await new Promise(r => child.exitCode !== null ? r() : child.once('exit', r)); upstream.close(); }
}
console.log('Client DNS settings, gateway fallback, sharing, policy and chain isolation passed. ' + (hasValidator ? '12 sing-box schema checks and real Fake DNS/exclusion/domain-policy queries passed.' : 'Core validation skipped; set SING_BOX_BIN to enable.'));
console.log(hasMihomo ? '12 full Mihomo DNS configuration checks passed.' : 'Mihomo core checks skipped; set MIHOMO_BIN to enable.');
