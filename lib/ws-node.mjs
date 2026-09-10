// Minimal RFC 6455 WebSocket server for Node hosts.
//
// Cloudflare answers a proxy upgrade with `new Response(null, {status: 101,
// webSocket})`, which is a workerd-only extension: Node's Response rejects 101
// outright and its http server never performs the handshake. Without this the
// VLESS/Trojan tunnel is dead on every non-Cloudflare deployment.
//
// Only what the proxy path needs: binary messages, fragmentation, ping/pong and
// close. No extensions, no permessage-deflate, no subprotocol negotiation.
import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_MESSAGE_BYTES = 64 * 1024 * 1024; // guard against a hostile length header

export function acceptKey(clientKey) {
  return createHash('sha1').update(clientKey + GUID).digest('base64');
}

function toBuffer(data) {
  if (Buffer.isBuffer(data)) return data;
  if (typeof data === 'string') return Buffer.from(data);
  if (ArrayBuffer.isView(data)) return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  return Buffer.from(data);
}

/** Encode one server->client frame. Server frames are never masked. */
export function encodeFrame(payload, opcode = 0x2) {
  const data = toBuffer(payload);
  const len = data.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  header[0] = 0x80 | opcode; // FIN + opcode
  return Buffer.concat([header, data]);
}

/**
 * Incremental frame decoder. TCP gives arbitrary chunk boundaries, so every
 * field has to survive being split mid-header.
 */
export class FrameParser {
  constructor(handlers) {
    this.buf = Buffer.alloc(0);
    this.handlers = handlers; // { onMessage, onClose, onPing, onPong, onError }
    this.fragments = [];
    this.fragmentOpcode = null;
  }

  push(chunk) {
    this.buf = this.buf.length === 0 ? chunk : Buffer.concat([this.buf, chunk]);
    // A single TCP read can carry many frames; drain until one is incomplete.
    while (this.step()) { /* keep draining */ }
  }

  step() {
    const b = this.buf;
    if (b.length < 2) return false;

    const fin = (b[0] & 0x80) !== 0;
    const opcode = b[0] & 0x0f;
    const masked = (b[1] & 0x80) !== 0;
    let len = b[1] & 0x7f;
    let offset = 2;

    if (len === 126) {
      if (b.length < offset + 2) return false;
      len = b.readUInt16BE(offset);
      offset += 2;
    } else if (len === 127) {
      if (b.length < offset + 8) return false;
      const big = b.readBigUInt64BE(offset);
      if (big > BigInt(MAX_MESSAGE_BYTES)) {
        this.handlers.onError?.(new Error('WebSocket frame exceeds size limit'));
        return false;
      }
      len = Number(big);
      offset += 8;
    }

    let mask = null;
    if (masked) {
      if (b.length < offset + 4) return false;
      mask = b.subarray(offset, offset + 4);
      offset += 4;
    }

    if (b.length < offset + len) return false; // frame not fully arrived yet

    const payload = Buffer.from(b.subarray(offset, offset + len)); // copy: buf gets reused
    if (mask) {
      for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
    }
    this.buf = b.subarray(offset + len);

    // Control frames may be interleaved between fragments of a data message.
    if (opcode === 0x8) { this.handlers.onClose?.(payload); return false; }
    if (opcode === 0x9) { this.handlers.onPing?.(payload); return true; }
    if (opcode === 0xa) { this.handlers.onPong?.(payload); return true; }

    if (opcode === 0x0) {
      if (this.fragmentOpcode === null) {
        this.handlers.onError?.(new Error('Continuation frame with nothing to continue'));
        return false;
      }
      this.fragments.push(payload);
    } else if (!fin) {
      this.fragmentOpcode = opcode;
      this.fragments = [payload];
      return true;
    } else {
      this.handlers.onMessage?.(payload, opcode);
      return true;
    }

    if (fin) {
      const full = Buffer.concat(this.fragments);
      const op = this.fragmentOpcode;
      this.fragments = [];
      this.fragmentOpcode = null;
      this.handlers.onMessage?.(full, op);
    }
    return true;
  }
}

/**
 * One end of a WebSocketPair. Mirrors the Cloudflare API surface the worker
 * uses: accept/send/close/addEventListener.
 */
class PairSocket extends EventEmitter {
  constructor() {
    super();
    this.readyState = 1; // OPEN
    this.peer = null;
    this.setMaxListeners(0);
  }
  accept() { /* workerd requires this call; nothing to do on Node */ }
  send(data) {
    if (this.readyState !== 1 || !this.peer || this.peer.readyState !== 1) return;
    this.peer.emit('message', { data });
  }
  close(code = 1000, reason = '') {
    if (this.readyState === 3) return;
    this.readyState = 3;
    if (this.peer && this.peer.readyState !== 3) {
      this.peer.readyState = 3;
      this.peer.emit('close', { code, reason });
    }
    this.emit('close', { code, reason });
  }
  addEventListener(type, fn) { this.on(type, fn); }
  removeEventListener(type, fn) { this.off(type, fn); }
}

export class WebSocketPair {
  constructor() {
    const client = new PairSocket();
    const server = new PairSocket();
    client.peer = server;
    server.peer = client;
    this[0] = client;
    this[1] = server;
  }
}

function closeFrame(code, reason) {
  const head = Buffer.alloc(2);
  head.writeUInt16BE(code);
  return encodeFrame(Buffer.concat([head, Buffer.from(String(reason))]), 0x8);
}

/**
 * Complete the handshake on a raw upgrade socket and pump frames between it and
 * `clientWs` (the endpoint the worker handed back in its 101 response).
 */
export function attachSocket(socket, head, clientWs, reqHeaders = {}) {
  const key = reqHeaders['sec-websocket-key'];
  const lines = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    'Sec-WebSocket-Accept: ' + acceptKey(key)
  ];
  if (reqHeaders['sec-websocket-protocol']) {
    lines.push('Sec-WebSocket-Protocol: ' + reqHeaders['sec-websocket-protocol']);
  }
  socket.write(lines.join('\r\n') + '\r\n\r\n');
  socket.setNoDelay(true);

  let closed = false;
  const shutdown = (code = 1000, reason = '') => {
    if (closed) return;
    closed = true;
    try { socket.write(closeFrame(code, reason)); } catch {}
    try { socket.end(); } catch {}
    try { clientWs.close(code, reason); } catch {}
  };

  const parser = new FrameParser({
    onMessage: (payload) => { try { clientWs.send(payload); } catch {} },
    onPing: (payload) => { try { socket.write(encodeFrame(payload, 0xa)); } catch {} },
    onClose: () => shutdown(1000, 'Client Closed'),
    onError: (err) => shutdown(1002, String(err.message).slice(0, 100))
  });

  // Bytes the http parser had already read past the request headers.
  if (head && head.length) parser.push(head);
  socket.on('data', (chunk) => {
    try { parser.push(chunk); } catch { shutdown(1011, 'Parse Error'); }
  });
  socket.on('error', () => { closed = true; try { clientWs.close(1006, 'Socket Error'); } catch {} });
  socket.on('end', () => shutdown(1000, 'Client Disconnected'));
  socket.on('close', () => { closed = true; try { clientWs.close(1006, 'Socket Closed'); } catch {} });

  // Worker -> client
  clientWs.addEventListener('message', (event) => {
    if (closed) return;
    try { socket.write(encodeFrame(toBuffer(event.data), 0x2)); } catch {}
  });
  clientWs.addEventListener('close', (e) => shutdown(e?.code ?? 1000, e?.reason ?? ''));
}

/** Cloudflare returns status 101 with a `webSocket`; Node's Response forbids both. */
export class WorkerResponse extends Response {
  constructor(body, init = {}) {
    if (init && init.status === 101) {
      super(null, { ...init, status: 200, statusText: undefined });
      Object.defineProperty(this, 'status', { value: 101, enumerable: true });
      Object.defineProperty(this, 'webSocket', { value: init.webSocket, enumerable: true });
    } else {
      super(body, init);
      Object.defineProperty(this, 'webSocket', { value: init?.webSocket ?? null, enumerable: true });
    }
  }
}
