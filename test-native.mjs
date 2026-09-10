// Requires SING_BOX_BIN and TEST_TLS_CERT/TEST_TLS_KEY (certificate for localhost).
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import https from 'node:https';
import { spawn } from 'node:child_process';
import { generateNative } from './deploy-native.mjs';

const binary = process.env.SING_BOX_BIN;
if (!binary || !process.env.TEST_TLS_CERT || !process.env.TEST_TLS_KEY) throw new Error('Set SING_BOX_BIN, TEST_TLS_CERT and TEST_TLS_KEY');
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'blueknight-native-'));
const children = [], connections = new Set();
const delay = ms => new Promise(r => setTimeout(r, ms));
const logs = [];
function run(config) {
  const child = spawn(binary, ['run', '-c', config], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', d => logs.push(d.toString())); child.stderr.on('data', d => logs.push(d.toString()));
  children.push(child); return child;
}
async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise(resolve => child.once('exit', resolve)); child.kill(); await exited;
}
const echo = net.createServer(s => { connections.add(s); s.on('error', () => {}); s.on('close', () => connections.delete(s)); s.pipe(s); });
const handshake = https.createServer({ cert: await fs.readFile(process.env.TEST_TLS_CERT), key: await fs.readFile(process.env.TEST_TLS_KEY), minVersion: 'TLSv1.3' }, (req, res) => res.end('ok'));
handshake.on('connection', s => { connections.add(s); s.on('close', () => connections.delete(s)); });
await new Promise(resolve => echo.listen(0, '127.0.0.1', resolve));
await new Promise(resolve => handshake.listen(0, '127.0.0.1', resolve));
async function tunnelEcho(clientPort) {
  const socket = net.createConnection({ host: '127.0.0.1', port: clientPort });
  connections.add(socket);
  socket.on('close', () => connections.delete(socket));
  socket.on('error', () => {});
  const iterator = socket.iterator({ destroyOnReturn: false });
  let pending = Buffer.alloc(0);
  async function read(n) {
    while (pending.length < n) {
      const { value, done } = await iterator.next();
      if (done) throw new Error('Tunnel closed before reply');
      pending = Buffer.concat([pending, value]);
    }
    const value = pending.subarray(0, n); pending = pending.subarray(n); return value;
  }
  const timer = setTimeout(() => socket.destroy(new Error('Native tunnel timeout')), 12000);
  try {
    await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('error', reject); });
    socket.write(Buffer.from([5, 1, 0]));
    assert.deepEqual(await read(2), Buffer.from([5, 0]));
    const port = echo.address().port;
    socket.write(Buffer.from([5, 1, 0, 1, 127, 0, 0, 1, port >> 8, port & 255]));
    const reply = await read(4);
    assert.equal(reply[1], 0, 'SOCKS connect accepted');
    const length = reply[3] === 1 ? 4 : reply[3] === 4 ? 16 : (await read(1))[0];
    await read(length + 2);
    const payload = Buffer.from('NATIVE-TUNNEL-ROUNDTRIP');
    socket.write(payload);
    assert.deepEqual(await read(payload.length), payload);
  } finally { clearTimeout(timer); socket.destroy(); }
}
try {
  const generated = generateNative({ host: 'localhost', cert: process.env.TEST_TLS_CERT, key: process.env.TEST_TLS_KEY, out: path.join(temp, 'stack'), protocols: ['shadowtls', 'shadowsocks', 'hysteria2', 'tuic', 'anytls', 'openvpn'], handshake: 'localhost' });
  const server = generated.server;
  for (const inbound of server.inbounds) {
    if (inbound.listen) inbound.listen = '127.0.0.1';
    if (inbound.tls) { inbound.tls.certificate_path = path.resolve(process.env.TEST_TLS_CERT); inbound.tls.key_path = path.resolve(process.env.TEST_TLS_KEY); }
    if (inbound.type === 'shadowtls') inbound.handshake = { server: '127.0.0.1', server_port: handshake.address().port };
  }
  const serverFile = path.join(temp, 'server.json'); await fs.writeFile(serverFile, JSON.stringify(server));
  run(serverFile); await delay(500);
  for (const type of ['shadowtls', 'shadowsocks', 'hysteria2', 'tuic', 'anytls']) {
    const client = structuredClone(generated.client);
    const reservation = net.createServer();
    await new Promise(r => reservation.listen(0, '127.0.0.1', r));
    const clientPort = reservation.address().port;
    await new Promise(r => reservation.close(r));
    client.inbounds[0].listen_port = clientPort;
    client.route.final = type;
    for (const outbound of client.outbounds) {
      if (outbound.server) outbound.server = '127.0.0.1';
      if (outbound.type === 'shadowtls') outbound.tls.certificate = (await fs.readFile(process.env.TEST_TLS_CERT, 'utf8')).trim().split('\n');
    }
    const clientFile = path.join(temp, 'client.json'); await fs.writeFile(clientFile, JSON.stringify(client));
    const child = run(clientFile); await delay(500);
    assert.equal(child.exitCode, null, `${type} client must start`);
    await tunnelEcho(clientPort); console.log(`  ${type}: real sing-box client -> server -> TCP echo: ok`);
    await stop(child);
  }
  console.log('Native protocol integration checks passed. OpenVPN requires separate Linux/TUN validation.');
  for (const method of ['aes-128-gcm', 'aes-256-gcm', 'chacha20-ietf-poly1305']) {
    const dataDir = path.join(temp, method); await fs.mkdir(dataDir);
    await fs.writeFile(path.join(dataDir, 'blueknight_kv.json'), JSON.stringify({ 'config:ss_method': method, 'config:ss_password': 'integration-only-password' }));
    const panel = spawn(process.execPath, ['server.js'], { windowsHide: true, env: { ...process.env, PORT: '18675', HOST: '127.0.0.1', DATA_DIR: dataDir, SUB_TOKEN: 'native-test-token' }, stdio: ['ignore', 'pipe', 'pipe'] });
    children.push(panel); panel.stdout.on('data', d => logs.push(d.toString())); panel.stderr.on('data', d => logs.push(d.toString()));
    await delay(600);
    const response = await fetch('http://127.0.0.1:18675/sub/singbox?token=native-test-token');
    assert.equal(response.status, 200);
    const config = await response.json();
    if (method === 'aes-128-gcm') {
      for (const protocol of ['vless', 'trojan']) {
        const clientConfig = structuredClone(config);
        const route = clientConfig.outbounds.find(o => o.type === protocol);
        assert.deepEqual(route.tls.alpn, ['http/1.1']);
        assert.equal(route.transport.max_early_data, undefined);
        route.server = '127.0.0.1'; route.server_port = 18675;
        delete route.tls; // Local fixture has no HTTPS terminator.
        clientConfig.inbounds[0].listen_port = 18676; clientConfig.route.final = route.tag;
        const file = path.join(temp, `${protocol}-singbox.json`); await fs.writeFile(file, JSON.stringify(clientConfig));
        const client = run(file); await delay(500);
        assert.equal(client.exitCode, null); await tunnelEcho(18676); await stop(client);
        console.log(`  ${protocol}: exported Sing-box WebSocket -> panel -> TCP echo: ok`);
        if (process.env.XRAY_BIN) {
          const xray = await (await fetch('http://127.0.0.1:18675/sub/xray-json?token=native-test-token')).json();
          const route = xray.outbounds.find(o => o.protocol === protocol);
          assert.deepEqual(route.streamSettings.tlsSettings.alpn, ['http/1.1']);
          const remote = protocol === 'vless' ? route.settings.vnext[0] : route.settings.servers[0];
          remote.address = '127.0.0.1'; remote.port = 18675;
          route.streamSettings.security = 'none'; delete route.streamSettings.tlsSettings;
          xray.outbounds = [route]; xray.routing = { rules: [] };
          xray.inbounds = [{ listen: '127.0.0.1', port: 18676, protocol: 'socks', settings: { auth: 'noauth', udp: false } }];
          const file = path.join(temp, `${protocol}-xray.json`); await fs.writeFile(file, JSON.stringify(xray));
          const client = spawn(process.env.XRAY_BIN, ['run', '-c', file], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
          children.push(client); client.stdout.on('data', d => logs.push(d.toString())); client.stderr.on('data', d => logs.push(d.toString()));
          await delay(500); assert.equal(client.exitCode, null); await tunnelEcho(18676); await stop(client);
          console.log(`  ${protocol}: exported Xray WebSocket -> panel -> TCP echo: ok`);
        }
      }
    }
    const outbound = config.outbounds.find(o => o.type === 'shadowsocks');
    assert.ok(outbound, 'Shadowsocks is included in the actual panel feed');
    outbound.server = '127.0.0.1'; outbound.server_port = 18675;
    outbound.plugin_opts = outbound.plugin_opts.replace(/^tls;/, ''); // Local fixture has no HTTPS terminator.
    config.inbounds[0].listen_port = 18676;
    config.route.final = outbound.tag;
    const file = path.join(temp, 'ss-client.json'); await fs.writeFile(file, JSON.stringify(config));
    const client = run(file); await delay(500);
    assert.equal(client.exitCode, null, 'Exported Sing-box config starts');
    await tunnelEcho(18676);
    console.log(`  ${method}: exported SS + v2ray-plugin -> panel WebSocket -> TCP echo: ok`);
    await stop(client);
    if (process.env.XRAY_BIN) {
      const xray = await (await fetch('http://127.0.0.1:18675/sub/xray-json?token=native-test-token')).json();
      const ss = xray.outbounds.find(o => o.protocol === 'shadowsocks');
      ss.settings.servers[0].address = '127.0.0.1'; ss.settings.servers[0].port = 18675;
      ss.streamSettings.security = 'none'; delete ss.streamSettings.tlsSettings;
      xray.outbounds = [ss]; xray.routing = { rules: [] };
      xray.inbounds = [{ listen: '127.0.0.1', port: 18676, protocol: 'socks', settings: { auth: 'noauth', udp: false } }];
      const xrayFile = path.join(temp, 'xray.json'); await fs.writeFile(xrayFile, JSON.stringify(xray));
      const xrayClient = spawn(process.env.XRAY_BIN, ['run', '-c', xrayFile], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      children.push(xrayClient); xrayClient.stdout.on('data', d => logs.push(d.toString())); xrayClient.stderr.on('data', d => logs.push(d.toString()));
      await delay(500); assert.equal(xrayClient.exitCode, null);
      await tunnelEcho(18676);
      console.log(`  ${method}: exported Xray SS/WebSocket -> panel -> TCP echo: ok`);
      await stop(xrayClient);
    }
    await stop(panel);
  }
} catch (err) {
  console.error(logs.join('').slice(-12000)); throw err;
} finally {
  for (const child of children) await stop(child);
  for (const socket of connections) socket.destroy();
  await Promise.all([new Promise(r => echo.close(r)), new Promise(r => handshake.close(r))]);
  await fs.rm(temp, { recursive: true, force: true });
}
