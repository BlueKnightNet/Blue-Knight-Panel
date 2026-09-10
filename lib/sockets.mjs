import net from 'node:net';
import tls from 'node:tls';
import { Readable, Writable } from 'node:stream';

/**
 * Universal TCP & TLS Socket connector for Node.js environments,
 * providing 1:1 API compatibility with Cloudflare Workers 'cloudflare:sockets'.
 */
export function connect(address, options = {}) {
  let hostname, port, secure = false;

  if (typeof address === 'string') {
    const parts = address.split(':');
    hostname = parts[0];
    port = parseInt(parts[1] || '80', 10);
  } else if (typeof address === 'object' && address !== null) {
    hostname = address.hostname || address.host || '127.0.0.1';
    port = typeof address.port === 'number' ? address.port : parseInt(address.port || '80', 10);
    secure = Boolean(address.secureTransport === 'on' || address.secureTransport === 'starttls');
  } else {
    throw new Error('Invalid address argument for connect()');
  }

  let sock;
  if (secure) {
    sock = tls.connect({ host: hostname, port, rejectUnauthorized: false });
  } else {
    sock = net.createConnection({ host: hostname, port });
  }

  sock.setNoDelay(true);

  const opened = new Promise((resolve, reject) => {
    sock.once('connect', () => resolve({ remoteAddress: sock.remoteAddress, remotePort: sock.remotePort }));
    sock.once('secureConnect', () => resolve({ remoteAddress: sock.remoteAddress, remotePort: sock.remotePort }));
    sock.once('error', (err) => reject(err));
  });

  const closed = new Promise((resolve) => {
    sock.once('close', (hadError) => resolve({ hadError }));
    sock.once('end', () => resolve({ hadError: false }));
  });

  const readable = Readable.toWeb(sock);
  const writable = Writable.toWeb(sock);

  return {
    opened,
    closed,
    readable,
    writable,
    close: () => {
      try {
        sock.destroy();
      } catch (_) {}
    },
    startTls: (tlsOptions = {}) => {
      const tlsSocket = tls.connect({
        socket: sock,
        host: hostname,
        rejectUnauthorized: false,
        ...tlsOptions
      });
      return {
        readable: Readable.toWeb(tlsSocket),
        writable: Writable.toWeb(tlsSocket)
      };
    }
  };
}

export default { connect };
