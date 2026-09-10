import { dnsFetch } from './lib/dns-fetch-node.mjs';
import { queryDnsJson } from './lib/dns-wire.mjs';
const resolvers = {
  Cloudflare: 'https://cloudflare-dns.com/dns-query', Google: 'https://dns.google/dns-query',
  AdGuard: 'https://dns.adguard-dns.com/dns-query', Quad9: 'https://dns.quad9.net/dns-query',
  Mullvad: 'https://dns.mullvad.net/dns-query', ControlD: 'https://freedns.controld.com/p0',
  AliDNS: 'https://dns.alidns.com/dns-query', OpenDNS: 'https://doh.opendns.com/dns-query'
};
await Promise.all(Object.entries(resolvers).map(async ([name, url]) => {
  try {
    const data = await queryDnsJson(url, 'example.com', 'A', dnsFetch);
    if (data.Status !== 0 || !data.Answer.some(a => a.type === 1)) throw new Error('No successful A answer');
    console.log(`${name}: PASS`);
  } catch (error) { console.error(`${name}: FAIL (${error.message})`); process.exitCode = 1; }
}));
