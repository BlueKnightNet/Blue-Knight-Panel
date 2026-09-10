import { Buffer } from 'node:buffer';
import { createHash, hkdfSync, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export const SS_METHODS = ['aes-128-gcm', 'aes-256-gcm', 'chacha20-ietf-poly1305'];
const salts = new Map();
function masterKey(password, length) {
  let previous = Buffer.alloc(0), key = Buffer.alloc(0);
  while (key.length < length) {
    previous = createHash('md5').update(Buffer.concat([previous, Buffer.from(password)])).digest();
    key = Buffer.concat([key, previous]);
  }
  return key.subarray(0, length);
}
export function ssCipher(method, password, salt) {
  if (!SS_METHODS.includes(method)) throw new Error('Unsupported Shadowsocks cipher');
  const size = method === 'aes-128-gcm' ? 16 : 32;
  const key = Buffer.from(hkdfSync('sha1', masterKey(password, size), salt, 'ss-subkey', size));
  const nonce = Buffer.alloc(12);
  const algorithm = method === 'chacha20-ietf-poly1305' ? 'chacha20-poly1305' : method;
  const advance = () => { for (let i = 0; i < nonce.length; i++) { nonce[i] = (nonce[i] + 1) & 255; if (nonce[i]) return; } throw new Error('Nonce exhausted'); };
  return {
    encrypt(data) {
      const cipher = createCipheriv(algorithm, key, nonce, { authTagLength: 16 });
      const result = Buffer.concat([cipher.update(data), cipher.final(), cipher.getAuthTag()]);
      advance(); return result;
    },
    decrypt(data) {
      const cipher = createDecipheriv(algorithm, key, nonce, { authTagLength: 16 });
      cipher.setAuthTag(data.subarray(-16));
      const result = Buffer.concat([cipher.update(data.subarray(0, -16)), cipher.final()]);
      advance(); return result;
    }
  };
}
export function ssEncoder(method, password) {
  let salt = randomBytes(method === 'aes-128-gcm' ? 16 : 32);
  const cipher = ssCipher(method, password, salt);
  return data => {
    const chunks = [salt]; salt = Buffer.alloc(0);
    for (let offset = 0; offset < data.length; offset += 0x3fff) {
      const part = data.subarray(offset, offset + 0x3fff), length = Buffer.alloc(2);
      length.writeUInt16BE(part.length);
      chunks.push(cipher.encrypt(length), cipher.encrypt(part));
    }
    return Buffer.concat(chunks);
  };
}
export function ssDecoder(method, password, onSalt = () => {}) {
  let pending = Buffer.alloc(0), cipher, size, saltToCheck;
  const saltSize = method === 'aes-128-gcm' ? 16 : 32;
  return data => {
    pending = Buffer.concat([pending, data]);
    const chunks = [];
    if (!cipher) {
      if (pending.length < saltSize) return chunks;
      const salt = pending.subarray(0, saltSize);
      saltToCheck = salt; cipher = ssCipher(method, password, salt); pending = pending.subarray(saltSize);
    }
    while (true) {
      if (size === undefined) {
        if (pending.length < 18) break;
        size = cipher.decrypt(pending.subarray(0, 18)).readUInt16BE(); pending = pending.subarray(18);
        if (saltToCheck) { onSalt(saltToCheck); saltToCheck = null; }
        if (size > 0x3fff) throw new Error('Invalid Shadowsocks chunk length');
      }
      if (pending.length < size + 16) break;
      chunks.push(cipher.decrypt(pending.subarray(0, size + 16)));
      pending = pending.subarray(size + 16); size = undefined;
    }
    return chunks;
  };
}
export function serveShadowsocks(ws, settings, connect, earlyData) {
  return new Promise(resolve => {
    let socket, writer, closed = false, header = Buffer.alloc(0), queued = 0;
    const timer = setTimeout(() => close(), 10000);
    const close = () => {
      if (closed) return;
      closed = true; clearTimeout(timer);
      try { Promise.resolve(socket?.close()).catch(() => {}); } catch {}
      try { ws.close(1000, 'Closed'); } catch {}
      resolve();
    };
    const encode = ssEncoder(settings.ssMethod, settings.ssPassword);
    const decode = ssDecoder(settings.ssMethod, settings.ssPassword, salt => {
      const now = Date.now();
      for (const [key, expiry] of salts) if (expiry < now) salts.delete(key);
      const key = createHash('sha256').update(settings.ssPassword).update(salt).digest('hex');
      if (salts.has(key) || salts.size >= 10000) throw new Error('Replay or capacity limit');
      salts.set(key, now + 600000);
    });
    async function process(data) {
      if (closed) return;
      for (const chunk of decode(Buffer.from(data))) {
        if (!writer) {
          header = Buffer.concat([header, chunk]);
          if (!header.length) continue;
          const type = header[0];
          if (type === 3 && header.length < 2) continue;
          const length = type === 1 ? 4 : type === 4 ? 16 : type === 3 ? header[1] : -1;
          if (length < 1) throw new Error('Invalid destination');
          const start = type === 3 ? 2 : 1, end = start + length;
          if (header.length < end + 2) continue;
          const address = header.subarray(start, end);
          const host = type === 1 ? [...address].join('.') : type === 3 ? address.toString() : Array.from({ length: 8 }, (_, i) => address.readUInt16BE(i * 2).toString(16)).join(':');
          const port = header.readUInt16BE(end);
          if (!port) throw new Error('Invalid destination port');
          socket = await connect(host, port);
          socket.closed?.catch(close);
          if (closed) { await socket.close(); return; }
          clearTimeout(timer); writer = socket.writable.getWriter();
          const payload = header.subarray(end + 2); header = Buffer.alloc(0);
          void (async () => {
            const reader = socket.readable.getReader();
            try { while (!closed) { const { value, done } = await reader.read(); if (done) break; ws.send(encode(value)); } }
            finally { reader.releaseLock(); close(); }
          })().catch(close);
          if (payload.length) await writer.write(payload);
        } else await writer.write(chunk);
      }
    }
    let queue = Promise.resolve();
    const receive = data => {
      const size = data.byteLength ?? data.size ?? data.length ?? 0;
      queued += size;
      if (queued > 1048576) { close(); return; }
      queue = queue.then(async () => process(data instanceof Blob ? await data.arrayBuffer() : data)).catch(error => { console.warn('Shadowsocks session failed:', error.message); close(); }).finally(() => { queued -= size; });
    };
    ws.addEventListener('message', event => receive(event.data));
    ws.addEventListener('close', close); ws.addEventListener('error', close);
    if (earlyData?.length) receive(earlyData);
  });
}
