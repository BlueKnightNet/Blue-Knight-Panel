import http2 from 'node:http2';

// Some DoH providers reject HTTP/1.1. Retry DNS requests over verified HTTP/2.
export async function dnsFetch(url, init = {}) {
  const target = new URL(url);
  try {
    const response = await fetch(url, { ...init, signal: init.signal || AbortSignal.timeout(10000) });
    if (![400, 505].includes(response.status) || target.protocol !== 'https:') return response;
    await response.body?.cancel();
  } catch (err) {
    if (target.protocol !== 'https:' || init.signal?.aborted) throw err;
  }
  return fetchHttp2(target, init);
}

export function fetchHttp2(target, init = {}, connectOptions = {}) {
  target = new URL(target);
  return new Promise((resolve, reject) => {
    const session = http2.connect(target.origin, connectOptions);
    let request, settled = false;
    const finish = (error, response) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      init.signal?.removeEventListener('abort', abort);
      session.destroy();
      if (error) reject(error); else resolve(response);
    };
    const abort = () => finish(init.signal.reason || new Error('DNS request aborted'));
    const timer = setTimeout(() => finish(new Error('DNS HTTP/2 timeout')), 10000);
    session.on('error', error => finish(error));
    if (init.signal?.aborted) { abort(); return; }
    init.signal?.addEventListener('abort', abort, { once: true });
    session.once('connect', () => {
      try {
        const headers = Object.fromEntries(new Headers(init.headers));
        if (init.body) headers['content-length'] = String(Buffer.byteLength(Buffer.from(init.body)));
        request = session.request({ ...headers, ':method': init.method || 'GET', ':path': target.pathname + target.search });
        let responseHeaders, length = 0;
        const chunks = [];
        request.on('response', h => { responseHeaders = h; });
        request.on('error', error => finish(error));
        request.on('aborted', () => finish(new Error('DNS HTTP/2 response aborted')));
        request.on('data', chunk => {
          length += chunk.length;
          if (length > 1024 * 1024) finish(new Error('DNS response too large'));
          else chunks.push(chunk);
        });
        request.on('end', () => {
          if (!responseHeaders) return finish(new Error('DNS HTTP/2 response missing headers'));
          try {
            const status = Number(responseHeaders[':status']);
            const headers = Object.fromEntries(Object.entries(responseHeaders).filter(([key]) => !key.startsWith(':')));
            finish(null, new Response([204, 205, 304].includes(status) ? null : Buffer.concat(chunks), { status, headers }));
          } catch (err) { finish(err); }
        });
        request.end(init.body ? Buffer.from(init.body) : undefined);
      } catch (err) { finish(err); }
    });
  });
}
