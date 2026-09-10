const TYPES = { A: 1, NS: 2, CNAME: 5, SOA: 6, PTR: 12, MX: 15, TXT: 16, AAAA: 28 };
export function dnsQuestion(name, type = 'A') {
  const code = TYPES[String(type).toUpperCase()] || Number(type);
  const labels = name.replace(/\.$/, '').split('.');
  if (!Number.isInteger(code) || code < 1 || code > 65535 || name.length > 254 || labels.some(l => !l.length || l.length > 63 || !/^[a-zA-Z0-9_-]+$/.test(l))) throw new RangeError('Invalid DNS name or record type');
  const id = crypto.getRandomValues(new Uint8Array(2));
  return new Uint8Array([...id, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, ...labels.flatMap(l => [l.length, ...new TextEncoder().encode(l)]), 0, code >> 8, code & 255, 0, 1]);
}

export function dnsJson(bytes, question) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const requireBytes = (offset, size) => { if (offset < 0 || offset + size > bytes.length) throw new Error('Truncated DNS response'); };
  requireBytes(0, 12);
  if (!(bytes[2] & 128) || bytes[0] !== question[0] || bytes[1] !== question[1]) throw new Error('Invalid DNS response ID or flags');
  function nameAt(offset) {
    const labels = [], seen = new Set();
    let next;
    while (true) {
      requireBytes(offset, 1);
      if (seen.has(offset) || seen.size > 128) throw new Error('Invalid DNS compression');
      seen.add(offset);
      const length = bytes[offset++];
      if (!length) return { name: labels.join('.') + '.', next: next ?? offset };
      if ((length & 192) === 192) {
        requireBytes(offset, 1); next ??= offset + 1;
        offset = ((length & 63) << 8) | bytes[offset]; continue;
      }
      if (length > 63) throw new Error('Invalid DNS label');
      requireBytes(offset, length);
      labels.push(new TextDecoder().decode(bytes.subarray(offset, offset + length))); offset += length;
    }
  }
  let cursor = 12;
  const questions = [], answers = [];
  for (let i = 0; i < view.getUint16(4); i++) {
    const q = nameAt(cursor); cursor = q.next; requireBytes(cursor, 4);
    questions.push({ name: q.name, type: view.getUint16(cursor) }); cursor += 4;
  }
  for (let i = 0; i < view.getUint16(6); i++) {
    const name = nameAt(cursor); cursor = name.next; requireBytes(cursor, 10);
    const type = view.getUint16(cursor), TTL = view.getUint32(cursor + 4), size = view.getUint16(cursor + 8);
    cursor += 10; requireBytes(cursor, size);
    const dataBytes = bytes.subarray(cursor, cursor + size);
    let data;
    if (type === 1 && size === 4) data = [...dataBytes].join('.');
    else if (type === 28 && size === 16) data = Array.from({ length: 8 }, (_, n) => view.getUint16(cursor + n * 2).toString(16)).join(':');
    else if ([2, 5, 12].includes(type)) data = nameAt(cursor).name;
    else if (type === 15 && size >= 3) data = `${view.getUint16(cursor)} ${nameAt(cursor + 2).name}`;
    else if (type === 16) {
      const text = [];
      for (let n = 0; n < size;) {
        const length = dataBytes[n++];
        if (n + length > size) throw new Error('Truncated TXT record');
        text.push(JSON.stringify(new TextDecoder().decode(dataBytes.subarray(n, n + length)))); n += length;
      }
      data = text.join(' ');
    } else data = [...dataBytes].map(n => n.toString(16).padStart(2, '0')).join('');
    answers.push({ name: name.name, type, TTL, data }); cursor += size;
  }
  return { Status: bytes[3] & 15, TC: !!(bytes[2] & 2), RD: !!(bytes[2] & 1), RA: !!(bytes[3] & 128), AD: !!(bytes[3] & 32), CD: !!(bytes[3] & 16), Question: questions, Answer: answers };
}

export async function queryDnsJson(url, name, type, fetchImpl = fetch) {
  const question = dnsQuestion(name, type);
  const response = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/dns-message', Accept: 'application/dns-message' }, body: question, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`DNS upstream HTTP ${response.status}`);
  return dnsJson(new Uint8Array(await response.arrayBuffer()), question);
}
