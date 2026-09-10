import { dnsFetch } from './lib/dns-fetch-node.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { Console } from 'node:console';
import { WebSocketPair, WorkerResponse } from './lib/ws-node.mjs';

import { installWorkerUpgrades } from './lib/upgrade-node.mjs';
import { createKVStore } from './lib/kv-store.mjs';

// 1. Real WebSocket + workerd-Response shims (see lib/ws-node.mjs)
globalThis.WebSocketPair = WebSocketPair;
globalThis.Response = WorkerResponse;

// 2. Persistent KV Storage Polyfill for Node.js / Container deployments
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const KV_FILE = path.join(DATA_DIR, 'blueknight_kv.json');
// Pre-rename store. Read it once if the new file does not exist yet, so an
// upgrade on a mounted disk keeps the admin password, UUID and subscription
// token instead of silently regenerating them.
const LEGACY_KV_FILE = path.join(DATA_DIR, 'whitedns_kv.json');

try {
  fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (_) {}

let kvMemoryStore = new Map();

try {
  const source = fs.existsSync(KV_FILE) ? KV_FILE
    : fs.existsSync(LEGACY_KV_FILE) ? LEGACY_KV_FILE
    : null;
  if (source) {
    const raw = JSON.parse(fs.readFileSync(source, 'utf-8'));
    for (const [k, v] of Object.entries(raw)) {
      kvMemoryStore.set(k, String(v));
    }
    if (source === LEGACY_KV_FILE) {
      console.log('[BlueKnight Server] Migrated settings from whitedns_kv.json.');
    }
  }
} catch (e) {
  console.warn('[BlueKnight Server] Could not read existing KV file, starting fresh:', e.message);
}

function flushKVToFile() {
  try {
    const obj = {};
    for (const [k, v] of kvMemoryStore.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(KV_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('[BlueKnight Server] Failed to save KV data to disk:', err.message);
  }
}

const nodeKV = {
  async get(key) {
    // Check direct env vars first
    if (key === 'config:admin_password' && process.env.PANEL_PASSWORD) return process.env.PANEL_PASSWORD;
    if (key === 'config:jwt_secret' && process.env.JWT_SECRET) return process.env.JWT_SECRET;
    if (key === 'config:sub_token' && process.env.SUB_TOKEN) return process.env.SUB_TOKEN;
    if (key === 'config:vless_uuid' && process.env.VLESS_UUID) return process.env.VLESS_UUID;
    if (key === 'config:trojan_password' && process.env.TROJAN_PASSWORD) return process.env.TROJAN_PASSWORD;
    return kvMemoryStore.has(key) ? kvMemoryStore.get(key) : null;
  },
  async put(key, value) {
    kvMemoryStore.set(key, String(value));
    flushKVToFile();
    return true;
  },
  async delete(key) {
    const res = kvMemoryStore.delete(key);
    flushKVToFile();
    return res;
  }
};

const restStore = createKVStore((name) => process.env[name]);
const activeKV = restStore.mode === 'rest' ? restStore.kv : nodeKV;
const env = { DNS_FETCH: dnsFetch,
  ...process.env,
  PANEL_PASSWORD: process.env.PANEL_PASSWORD || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  WD_KV: activeKV,
  BK_KV: activeKV
};

// 3. Import the unified Worker
// wrangler's unenv preset replaces globalThis.process and mutates Node's real
// console in place, repointing its internal _stdout/_stderr at dead streams.
// Correct inside workerd, but on Node it silences every log line. Snapshot the
// real process and rebuild the console on the real streams after importing.
const nodeProcess = globalThis.process;
const nodeStdout = process.stdout;
const nodeStderr = process.stderr;
console.log('[BlueKnight Server] Loading BlueKnight Worker engine...');
const { default: worker } = await import('./worker.js');
globalThis.process = nodeProcess;
globalThis.console = new Console({ stdout: nodeStdout, stderr: nodeStderr });
console.log('[BlueKnight Server] BlueKnight Worker loaded successfully!');

// 4. Create the HTTP server
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(async (req, res) => {
  try {
    const proto = req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http');
    const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
    const url = new URL(req.url, `${proto}://${host}`);

    // Fast static file serving for assets from disk if present
    if (req.method === 'GET' || req.method === 'HEAD') {
      const cleanPath = url.pathname.replace(/^\/+/, '');
      const candidates = [
        path.join(process.cwd(), 'public', cleanPath),
        ...(/^theme-bg-\d+\.jpg$/.test(cleanPath) ? [path.join(process.cwd(), 'assets', cleanPath)] : [])
      ];
      for (const candidate of candidates) {
        const allowed = ['public', 'assets'].some(root => path.resolve(candidate).startsWith(path.resolve(process.cwd(), root) + path.sep));
        if (!allowed) continue;
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          const ext = path.extname(candidate).toLowerCase();
          const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.svg': 'image/svg+xml',
            '.webp': 'image/webp',
            '.css': 'text/css; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.html': 'text/html; charset=utf-8'
          };
          const contentType = mimeTypes[ext] || 'application/octet-stream';
          const stat = fs.statSync(candidate);
          res.statusCode = 200;
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Length', stat.size);
          res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
          if (req.method === 'HEAD') {
            res.end();
          } else {
            fs.createReadStream(candidate).pipe(res);
          }
          return;
        }
      }
    }

    // Read generated client files on each request so provisioning needs no panel restart.
    for (const [fileVar, valueVar] of [['OPENVPN_CLIENT_PROFILE_FILE', 'OPENVPN_CLIENT_PROFILE'], ['NATIVE_CLIENT_CONFIG_FILE', 'NATIVE_CLIENT_CONFIG']]) {
      if (process.env[fileVar]) {
        try { env[valueVar] = fs.readFileSync(process.env[fileVar], 'utf8'); }
        catch (err) { if (err.code !== 'ENOENT') throw err; delete env[valueVar]; }
      }
    }
    // Convert IncomingMessage to web Request
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) {
        v.forEach(val => headers.append(k, val));
      } else if (typeof v === 'string') {
        headers.set(k, v);
      }
    }

    const init = {
      method: req.method,
      headers
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = Readable.toWeb(req);
      init.duplex = 'half';
    }

    const webReq = new Request(url.toString(), init);
    const executionCtx = {
      waitUntil: (promise) => promise.catch(err => console.error('[BlueKnight Async Error]:', err))
    };

    const response = await worker.fetch(webReq, env, executionCtx);

    // Write back response
    res.statusCode = response.status;
    const setCookies = [];
    response.headers.forEach((val, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        setCookies.push(val);
      } else {
        res.setHeader(key, val);
      }
    });

    if (setCookies.length > 0) {
      res.setHeader('Set-Cookie', setCookies);
    }

    if (response.body) {
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    console.error('[BlueKnight HTTP Error]:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
    }
  }
});

// 5. WebSocket upgrades. Node's request handler cannot answer a 101, so the
// proxy tunnel has to be served from the server-level "upgrade" event where the
// raw socket is available for the RFC 6455 handshake.
installWorkerUpgrades(server, worker, env);

server.listen(PORT, HOST, () => {
  console.log(`✨ BlueKnight Universal Server running at http://${HOST}:${PORT}`);
  console.log(`🌐 Deployable on Render, Fly.io, Railway, Koyeb, Glitch, Vercel, Netlify & Cloudflare`);
});
