import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
process.env.PANEL_PASSWORD = 'Adapter-test-password';
process.env.VLESS_UUID = '8831688d-d6eb-49a8-bda1-046e5e14ec00';
const { default: server } = await import('./api/index.js');
const connections = new Set();
server.on('connection', socket => { connections.add(socket); socket.on('close', () => connections.delete(socket)); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
try {
  const child = spawn(process.execPath, ['test-proxy.mjs', `--target=${server.address().port}`], { stdio: 'inherit', windowsHide: true });
  assert.equal(await new Promise(r => child.once('exit', r)), 0, 'Vercel exported server carries real WebSocket tunnel traffic');
  const { default: netlify } = await import('./netlify/functions/blueknight.mjs');
  const call = (path, init) => netlify(new Request(`https://localhost${path}`, init), { waitUntil() {} });
  assert.equal((await call('/api/health')).status, 200);
  const login = await call('/panel/login', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'password=Adapter-test-password' });
  assert.equal(login.status, 302, 'Netlify Node function login');
  const cookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await call('/panel', { headers: { cookie } })).status, 200);
  assert.equal((await call('/bk-ws', { headers: { upgrade: 'websocket' } })).status, 501, 'Netlify refuses unsupported tunnels explicitly');
  assert.equal((await call('/bk-xhttp', { method: 'POST', body: 'test' })).status, 501);
  console.log('Vercel and Netlify adapter checks passed. Live provider deployment is separate.');
} finally { for (const socket of connections) socket.destroy(); await new Promise(r => server.close(r)); }
