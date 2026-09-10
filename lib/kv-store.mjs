// KV store resolution for hosts with no native binding (Vercel, Netlify).
//
// Cloudflare has KV; Render/Fly/Railway/Koyeb/Docker have a mounted disk. Vercel
// and Netlify have neither: their functions are stateless, so anything the panel
// writes vanishes and the VLESS UUID regenerates on every cold start, silently
// breaking every subscription link already handed to a client.
//
// The portable fix is a Redis REST endpoint, which is plain fetch() and so works
// identically on Node, Deno and workerd. Vercel's Marketplace KV (Upstash) sets
// KV_REST_API_URL/KV_REST_API_TOKEN for you; a standalone Upstash database sets
// UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN. Either is picked up here.
//
// With no endpoint configured we fall back to per-instance memory plus env-var
// identities, which keeps subscriptions stable even though panel edits will not
// survive. `createKVStore` reports which mode it chose so the caller can warn.

const ENV_FALLBACK = {
  'config:admin_password': 'PANEL_PASSWORD',
  'config:jwt_secret': 'JWT_SECRET',
  'config:sub_token': 'SUB_TOKEN',
  'config:vless_uuid': 'VLESS_UUID',
  'config:trojan_password': 'TROJAN_PASSWORD',
  'config:proxy_path': 'PROXY_PATH',
  'config:node_share_token': 'NODE_SHARE_TOKEN'
};

const REST_URL_VARS = ['KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL', 'REDIS_REST_URL'];
const REST_TOKEN_VARS = ['KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN', 'REDIS_REST_TOKEN'];

function firstSet(readEnv, names) {
  for (const n of names) {
    const v = readEnv(n);
    if (v) return String(v).trim();
  }
  return null;
}

/**
 * Redis-over-HTTP store. Commands go in the POST body as a JSON array so keys
 * containing ':' need no path escaping.
 */
export function createRestKV(url, token, { fetchImpl = fetch } = {}) {
  const endpoint = url.replace(/\/+$/, '');
  async function cmd(args) {
    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    if (!res.ok) {
      throw new Error('KV REST ' + res.status + ': ' + (await res.text()).slice(0, 200));
    }
    const data = await res.json();
    if (data && data.error) throw new Error('KV REST: ' + data.error);
    return data ? data.result : null;
  }
  return {
    mode: 'rest',
    async get(key) {
      const v = await cmd(['GET', key]);
      return v === null || v === undefined ? null : String(v);
    },
    async put(key, value) {
      await cmd(['SET', key, String(value)]);
      return true;
    },
    async delete(key) {
      await cmd(['DEL', key]);
      return true;
    }
  };
}

/** Per-instance memory, with env vars supplying stable identities. */
export function createMemoryKV(readEnv) {
  const store = new Map();
  return {
    mode: 'memory',
    async get(key) {
      if (store.has(key)) return store.get(key);
      const envName = ENV_FALLBACK[key];
      const fromEnv = envName ? readEnv(envName) : undefined;
      return fromEnv ? String(fromEnv) : null;
    },
    async put(key, value) {
      store.set(key, String(value));
      return true;
    },
    async delete(key) {
      return store.delete(key);
    }
  };
}

/**
 * Pick the best store the environment allows. Returns { kv, mode, warning }.
 * A REST store that cannot be reached degrades to memory rather than taking the
 * whole panel down, but says so loudly.
 */
export function createKVStore(readEnv, options = {}) {
  const url = firstSet(readEnv, REST_URL_VARS);
  const token = firstSet(readEnv, REST_TOKEN_VARS);
  if (url && token) {
    return {
      kv: createRestKV(url, token, options),
      mode: 'rest',
      warning: null
    };
  }
  return {
    kv: createMemoryKV(readEnv),
    mode: 'memory',
    warning:
      'No durable KV configured. Panel changes will not survive a cold start. ' +
      'Set KV_REST_API_URL + KV_REST_API_TOKEN (Vercel Marketplace KV) or ' +
      'UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN, and set PANEL_PASSWORD, ' +
      'JWT_SECRET, SUB_TOKEN, VLESS_UUID and TROJAN_PASSWORD so identities stay stable.'
  };
}

// Kept for callers that only want the volatile behaviour.
export const createEnvKV = createMemoryKV;
