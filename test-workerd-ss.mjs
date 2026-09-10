// Run against a local Wrangler dev instance with fixture KV credentials.
import assert from 'node:assert/strict';
import net from 'node:net';
import WebSocket from 'ws';
import { ssEncoder, ssDecoder } from './lib/ss-websocket.mjs';
const base = process.env.TEST_WORKER_URL || 'http://127.0.0.1:18677';
const response = await fetch(`${base}/sub/ss?token=${encodeURIComponent(process.env.TEST_SUB_TOKEN || 'ss-workerd-test')}`);
assert.equal(response.status, 200);
const uri = new URL((await response.text()).split('\n')[0]);
const auth = Buffer.from(uri.username, 'base64').toString(), colon = auth.indexOf(':');
const method = auth.slice(0, colon), password = auth.slice(colon + 1);
const plugin = uri.searchParams.get('plugin');
const wsPath = plugin.split(';').find(part => part.startsWith('path=')).slice(5);
const sockets = new Set();
const echo = net.createServer(socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); socket.on('error', () => {}); socket.pipe(socket); });
await new Promise(resolve => echo.listen(0, '127.0.0.1', resolve));
const ws = new WebSocket(base.replace(/^http/, 'ws') + wsPath);
let timer;
try {
  const done = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error('Cloudflare SS echo timeout')), 10000);
    const decode = ssDecoder(method, password);
    let received = Buffer.alloc(0);
    ws.on('message', bytes => { try { received = Buffer.concat([received, ...decode(bytes)]); if (received.length >= 14) { assert.equal(received.toString(), 'WORKER-SS-ECHO'); resolve(); } } catch (error) { reject(error); } });
    ws.on('error', reject);
    ws.on('open', () => {
      const port = echo.address().port;
      const bytes = ssEncoder(method, password)(Buffer.from([1, 127, 0, 0, 1, port >> 8, port & 255, ...Buffer.from('WORKER-SS-ECHO')]));
      ws.send(bytes.subarray(0, 11)); ws.send(bytes.subarray(11));
    });
  });
  await done;
  console.log('Cloudflare workerd: Shadowsocks WebSocket -> real TCP echo PASS');
} finally {
  clearTimeout(timer); ws.terminate();
  for (const socket of sockets) socket.destroy();
  await new Promise(resolve => echo.close(resolve));
}
