import assert from 'node:assert/strict';
import http2 from 'node:http2';
import { dnsQuestion, dnsJson, queryDnsJson } from './lib/dns-wire.mjs';
import { fetchHttp2 } from './lib/dns-fetch-node.mjs';
const question = dnsQuestion('example.com', 'A');
const reply = new Uint8Array([...question, 192, 12, 0, 1, 0, 1, 0, 0, 0, 60, 0, 4, 192, 0, 2, 1]);
reply[2] = 129; reply[3] = 128; reply[7] = 1;
assert.equal(dnsJson(reply, question).Answer[0].data, '192.0.2.1');
assert.equal(dnsJson(reply, question).Answer[0].name, 'example.com.');
assert.throws(() => dnsJson(reply.subarray(0, reply.length - 1), question), /Truncated/);
const loop = reply.slice(); loop[12] = 192; loop[13] = 12;
assert.throws(() => dnsJson(loop, question), /compression/);
assert.throws(() => dnsQuestion('bad name', 'A'), RangeError);
const server = http2.createServer();
server.on('stream', (stream, headers) => {
  const chunks = [];
  stream.on('data', d => chunks.push(d));
  stream.on('end', () => {
    assert.ok(Number(headers['content-length']) > 0, 'DNS POST declares its length for providers that require it');
    const data = Buffer.concat(chunks); data[2] = 129; data[3] = 128;
    stream.respond({ ':status': 200, 'content-type': 'application/dns-message' }); stream.end(data);
  });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
try {
  const data = await queryDnsJson(`http://127.0.0.1:${server.address().port}/dns-query`, 'example.com', 'AAAA', fetchHttp2);
  assert.equal(data.Status, 0);
  assert.equal(data.Question[0].type, 28);
} finally { await new Promise(r => server.close(r)); }
console.log('DNS wire decoding, invalid responses and real HTTP/2 forwarding: ok');
