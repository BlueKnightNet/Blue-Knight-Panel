import { attachSocket } from './ws-node.mjs';
export function installWorkerUpgrades(server, worker, env) {
server.on('upgrade', async (req, socket, head) => {
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const proto = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const url = new URL(req.url, `${proto}://${host}`);

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) v.forEach((val) => headers.append(k, val));
      else if (typeof v === 'string') headers.set(k, v);
    }

    const webReq = new Request(url.toString(), { method: 'GET', headers });
    const executionCtx = {
      waitUntil: (promise) => Promise.resolve(promise).catch((err) =>
        console.error('[BlueKnight WS Async Error]:', err))
    };

    const response = await worker.fetch(webReq, env, executionCtx);

    if (response.status === 101 && response.webSocket) {
      attachSocket(socket, head, response.webSocket, req.headers);
      return;
    }

    // Worker refused the upgrade (wrong path, auth, ...). Answer over the raw socket.
    const CRLF = String.fromCharCode(13, 10);
    const body = await response.text();
    socket.end([
      'HTTP/1.1 ' + response.status + ' ' + (response.statusText || 'Error'),
      'Content-Type: application/json; charset=utf-8',
      'Content-Length: ' + Buffer.byteLength(body),
      'Connection: close',
      '',
      body
    ].join(CRLF));
  } catch (err) {
    console.error('[BlueKnight WS Error]:', err);
    try { socket.end('HTTP/1.1 500 Internal Server Error' + String.fromCharCode(13, 10, 13, 10)); } catch {}
  }
});

}
