import { dnsFetch } from '../lib/dns-fetch-node.mjs';
import http from 'node:http';
import { WebSocketPair, WorkerResponse } from '../lib/ws-node.mjs';
import { installWorkerUpgrades } from '../lib/upgrade-node.mjs';
globalThis.WebSocketPair = WebSocketPair;
globalThis.Response = WorkerResponse;
import { Readable } from 'node:stream';
import { Console } from 'node:console';
import { createKVStore } from '../lib/kv-store.mjs';

// KV keys look like "config:vless_uuid", which is not a legal env-var name, so
// the old `process.env[k]` fallback never matched anything.
const { kv: vercelKV, warning: kvWarning } = createKVStore((n) => process.env[n]);

const env = { DNS_FETCH: dnsFetch,
  ...process.env,
  PANEL_PASSWORD: process.env.PANEL_PASSWORD || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  WD_KV: vercelKV,
  BK_KV: vercelKV
};

// wrangler's unenv preset replaces globalThis.process and mutates Node's real
// console in place, repointing its internal _stdout/_stderr at dead streams.
// Correct inside workerd, but on Node it silences every log line. Snapshot the
// real process and rebuild the console on the real streams after importing.
const nodeProcess = globalThis.process;
const nodeStdout = process.stdout;
const nodeStderr = process.stderr;
const { default: worker } = await import('../worker.js');
globalThis.process = nodeProcess;
globalThis.console = new Console({ stdout: nodeStdout, stderr: nodeStderr });


if (kvWarning) console.warn('[BlueKnight] ' + kvWarning);

export async function handler(req, res) {
  try {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const url = new URL(req.url, `${proto}://${host}`);

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) {
        v.forEach(val => headers.append(k, val));
      } else if (typeof v === 'string') {
        headers.set(k, v);
      }
    }

    const init = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = Readable.toWeb(req);
      init.duplex = 'half';
    }

    const webReq = new Request(url.toString(), init);
    const response = await worker.fetch(webReq, env, { waitUntil: () => {} });

    res.statusCode = response.status;
    const setCookies = [];
    response.headers.forEach((val, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        setCookies.push(val);
      } else {
        res.setHeader(key, val);
      }
    });
    if (setCookies.length > 0) res.setHeader('Set-Cookie', setCookies);

    if (response.body) {
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
}

// Vercel Fluid compute supports exported Node HTTP servers and upgrades.
const server = http.createServer(handler);
installWorkerUpgrades(server, worker, env);
export default server;
