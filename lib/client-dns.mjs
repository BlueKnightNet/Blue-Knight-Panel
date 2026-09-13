// Shared, validated DNS policy for Mihomo, sing-box and Xray subscriptions.
export const DNS_DEFAULTS = Object.freeze({ mode: 'real', resolver: 'panel', route: 'direct', bootstrap: '1.1.1.1', ipv6: false, tun: false, blockQuic: false, exclusions: 'localhost\nlan\nlocal', domains: '', domainResolver: 'https://1.1.1.1/dns-query', forceProxy: '', gatewayFallbacks: '' });
const domainList = value => [...new Set(String(value).split(/[\s,]+/).filter(Boolean).map(v => v.toLowerCase().replace(/^\*?\./, '')))];
const isIP = value => /^(\d{1,3}\.){3}\d{1,3}$/.test(value) ? value.split('.').every(n => +n <= 255) : value.includes(':') && (() => { try { return !!new URL(`http://[${value}]/`).hostname; } catch { return false; } })();
export function parseResolver(value) {
  if (value === 'panel') return { type: 'panel' };
  let url;
  try { url = new URL(value); } catch { throw new Error('DNS resolver must use https://, tls://, tcp://, udp://, quic:// or h3://.'); }
  const type = { 'https:': 'https', 'tls:': 'tls', 'tcp:': 'tcp', 'udp:': 'udp', 'quic:': 'quic', 'h3:': 'h3' }[url.protocol];
  if (!type || !url.hostname || url.username || url.password || url.hash || (url.port && (+url.port < 1 || +url.port > 65535))) throw new Error('Invalid DNS resolver URL. Credentials and fragments are not supported.');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (!isIP(host) && (host.length > 253 || !host.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)))) throw new Error('Invalid DNS resolver hostname.');
  if (!['https', 'h3'].includes(type) && ((url.pathname && url.pathname !== '/') || url.search)) throw new Error('Only HTTPS/HTTP3 DNS supports a path or query.');
  return { type, server: url.hostname.replace(/^\[|\]$/g, ''), server_port: +(url.port || ({ https: 443, h3: 443, tls: 853, quic: 853, tcp: 53, udp: 53 }[type])), ...(['https', 'h3'].includes(type) ? { path: (url.pathname === '/' ? '/dns-query' : url.pathname || '/dns-query') + url.search } : {}) };
}
export function normalizeDns(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid client DNS settings.');
  const p = Object.fromEntries(Object.entries(DNS_DEFAULTS).map(([k, v]) => [k, input[k] ?? v]));
  for (const k of ['ipv6', 'tun', 'blockQuic']) if (typeof p[k] !== 'boolean') throw new Error(`Invalid DNS ${k} toggle.`);
  if (!['real', 'fake-ip'].includes(p.mode) || !['direct', 'proxy'].includes(p.route)) throw new Error('Invalid DNS mode or route.');
  for (const k of ['resolver', 'bootstrap', 'domainResolver']) { if (typeof p[k] !== 'string' || p[k].length > 2048) throw new Error(`Invalid DNS ${k}.`); p[k] = p[k].trim(); }
  if (!isIP(p.bootstrap)) throw new Error('Bootstrap DNS must be an IPv4 or IPv6 address.');
  for (const k of ['exclusions', 'domains', 'forceProxy']) {
    if (typeof p[k] !== 'string' || p[k].length > 8192) throw new Error(`Invalid DNS ${k} list.`);
    const list = domainList(p[k]);
    if (list.length > 100 || list.some(d => d.length > 253 || !d.split('.').every(l => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(l)))) throw new Error('Enter domain suffixes only, one per line (no URLs or paths).');
    p[k] = list.join('\n');
  }
  for (const k of ['resolver', 'domainResolver']) {
    const r = parseResolver(p[k]);
    if (p.route === 'proxy' && (k === 'resolver' || p.domains) && r.type === 'panel') throw new Error('For proxy-routed DNS, enter an external HTTPS/TLS/TCP resolver instead of panel to avoid connecting the Worker back to itself.');
    if (p.route === 'proxy' && (k === 'resolver' || p.domains) && ['udp', 'quic', 'h3'].includes(r.type)) throw new Error('Worker tunnels carry TCP. Use HTTPS, TLS or TCP DNS for proxy-routed DNS; UDP/QUIC/HTTP3 require direct DNS.');
  }
  if (typeof p.gatewayFallbacks !== 'string' || p.gatewayFallbacks.length > 4096) throw new Error('Invalid gateway fallback list.');
  const fallback = [...new Set(p.gatewayFallbacks.split(/\s+/).filter(Boolean))];
  if (fallback.length > 3) throw new Error('Use at most three gateway fallback resolvers.');
  fallback.forEach(validateDoh);
  p.gatewayFallbacks = fallback.join('\n');
  return p;
}
export function validateDoh(value) {
  if (value && parseResolver(value).type !== 'https') throw new Error('The panel DNS gateway requires an HTTPS DoH URL. Configure other transports under Client DNS.');
  return value;
}
export function readDns(stored) { return normalizeDns(stored ? JSON.parse(stored) : {}); }
export function dnsFromForm(form) {
  const p = {};
  for (const [k, v] of Object.entries(DNS_DEFAULTS)) p[k] = typeof v === 'boolean' ? form.get(`clientDns_${k}`) === 'on' : String(form.get(`clientDns_${k}`) ?? v);
  return normalizeDns(p);
}
function server(value, tag, p, host) {
  let r = parseResolver(value);
  if (r.type === 'panel') r = { type: 'https', server: host, path: '/dns-query' };
  return { ...r, tag, ...(!isIP(r.server) ? { domain_resolver: 'bootstrap-dns' } : {}), ...(p.route === 'proxy' ? { detour: 'select' } : {}) };
}
export function singboxDns(p, host) {
  const servers = [{ type: 'udp', tag: 'bootstrap-dns', server: p.bootstrap }, server(p.resolver, 'remote-dns', p, host)];
  const rules = [];
  if (p.domains) { servers.push(server(p.domainResolver, 'domain-dns', p, host)); rules.push({ domain_suffix: domainList(p.domains), action: 'route', server: 'domain-dns' }); }
  if (p.mode === 'fake-ip') {
    servers.push({ type: 'fakeip', tag: 'fake-dns', inet4_range: '198.18.0.0/15', ...(p.ipv6 ? { inet6_range: 'fc00::/18' } : {}) });
    if (p.exclusions) rules.push({ domain_suffix: domainList(p.exclusions), action: 'route', server: 'remote-dns' });
    rules.push({ query_type: p.ipv6 ? ['A', 'AAAA'] : ['A'], action: 'route', server: 'fake-dns' });
  }
  return { servers, rules, final: 'remote-dns', strategy: p.ipv6 ? 'prefer_ipv4' : 'ipv4_only' };
}
export function singboxDnsExtras(config, p) {
  if (p.tun) config.inbounds.push({ type: 'tun', tag: 'tun-in', address: ['172.19.0.1/30', ...(p.ipv6 ? ['fdfe:dcba:9876::1/126'] : [])], auto_route: true, strict_route: true, stack: 'mixed' });
  const extra = [];
  if (p.blockQuic) extra.push({ network: 'udp', port: 443, action: 'reject' });
  if (p.forceProxy) extra.push({ domain_suffix: domainList(p.forceProxy), outbound: 'select' });
  config.route.rules.splice(2, 0, ...extra);
}
export function clashDns(p, host) {
  const endpoint = v => v === 'panel' ? `https://${host}/dns-query` : v.replace(/^h3:\/\//, 'https://') + (v.startsWith('h3://') ? '#h3=true' : '');
  const d = { enable: true, listen: '127.0.0.1:1053', ipv6: p.ipv6, 'enhanced-mode': p.mode === 'fake-ip' ? 'fake-ip' : 'redir-host', 'default-nameserver': [p.bootstrap], 'proxy-server-nameserver': [p.bootstrap], nameserver: [endpoint(p.resolver) + (p.route === 'proxy' ? '#PROXY' : '')] };
  if (p.mode === 'fake-ip') { d['fake-ip-range'] = '198.18.0.1/16'; if (p.ipv6) d['fake-ip-range6'] = 'fc00::/18'; d['fake-ip-filter'] = domainList(p.exclusions + '\n' + p.domains).flatMap(d => [d, `+.${d}`]); }
  if (p.domains) d['nameserver-policy'] = Object.fromEntries(domainList(p.domains).map(d => [`+.${d}`, endpoint(p.domainResolver) + (p.route === 'proxy' ? '#PROXY' : '')]));
  return `dns: ${JSON.stringify(d)}\n${p.tun ? 'tun: ' + JSON.stringify({ enable: true, stack: 'mixed', 'auto-route': true, 'strict-route': true, 'auto-detect-interface': true, 'dns-hijack': ['any:53', 'tcp://any:53'] }) + '\n' : ''}`;
}
export function clashDnsRules(p) { return (p.blockQuic ? '\n  - AND,((NETWORK,UDP),(DST-PORT,443)),REJECT' : '') + domainList(p.forceProxy).map(d => `\n  - DOMAIN-SUFFIX,${d},PROXY`).join(''); }
const html = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function dnsControls(p) {
  const select = (k, label, options) => `<div class="form-group"><label class="form-label" for="clientDns_${k}">${label}</label><select class="form-control" id="clientDns_${k}" name="clientDns_${k}">${options.map(([v, t]) => `<option value="${v}" ${p[k] === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`;
  const field = (k, label, hint, area = false) => `<div class="form-group"><label class="form-label" for="clientDns_${k}">${label}</label>${area ? `<textarea rows="3"` : '<input type="text"'} class="form-control code-input" id="clientDns_${k}" name="clientDns_${k}" ${area ? `>${html(p[k])}</textarea>` : `value="${html(p[k])}" />`}<p class="card-desc">${hint}</p></div>`;
  return `<div class="card" style="margin-bottom:20px"><div class="card-title">Client DNS &amp; site routing</div><p class="card-desc">Applies to full Mihomo/Clash, Sing-box and Xray JSON subscriptions. Individual VLESS/Trojan/SS links cannot carry these settings; native-only profiles use their own DNS settings. Fake IP needs TUN or client DNS interception. It preserves domain names for routing, but does not change the country or reputation of your exit IP.</p><p class="card-desc">Xray exposes DNS at 127.0.0.1:1053. Enable VPN/TUN in your Xray client app. For h3 resolver URLs, Xray uses HTTPS over TCP at the same endpoint, which must support ordinary DoH. QUIC DNS connects directly; TLS DNS uses a verified TLS connection.</p><form action="/panel/settings/protocols" method="POST"><input type="hidden" name="clientDnsSettings" value="1" />
  ${select('mode', 'DNS answer mode', [['real', 'Real IP'], ['fake-ip', 'Fake IP (Fake DNS)']])}
  ${field('resolver', 'Client DNS resolver', 'Use panel, https://1.1.1.1/dns-query, tls://1.1.1.1, tcp://1.1.1.1, udp://1.1.1.1, quic://dns.adguard-dns.com or h3://dns.google/dns-query. The resolver must support the selected transport.')}
  ${select('route', 'DNS connection route', [['direct', 'Direct from device'], ['proxy', 'Through selected proxy (HTTPS / TLS / TCP)']])}
  ${field('bootstrap', 'Bootstrap DNS IP', 'Resolves proxy and resolver hostnames directly to avoid DNS loops. Use an address reachable from your device.')}
  ${['ipv6', 'tun', 'blockQuic'].map((k, i) => `<label style="display:block;margin:12px 0"><input type="checkbox" name="clientDns_${k}" ${p[k] ? 'checked' : ''} /> ${['Enable IPv6 DNS answers', 'Enable TUN for Mihomo/Sing-box (requires client VPN/admin permission)', 'Reject UDP port 443 to encourage HTTPS over TCP'][i]}</label>`).join('')}
  ${field('exclusions', 'Fake IP exclusions', 'Domain suffixes, one per line. These receive real addresses.', true)}
  ${field('domains', 'Domains using a separate resolver', 'Domain suffixes, one per line. Overrides Fake IP for these domains. Useful with a trusted Smart DNS service; access depends on that service.', true)}
  ${field('domainResolver', 'Resolver for those domains', 'Same URL formats as the main resolver. Uses the DNS connection route selected above.')}
  ${field('forceProxy', 'Always send these domains through the selected proxy', 'Domain suffixes, one per line, applied before country bypass rules. For Google services you can include google.com, googleapis.com and gstatic.com. Choose a working proxy in your client; selecting DIRECT still connects directly.', true)}
  ${field('gatewayFallbacks', 'Panel gateway fallback resolvers', 'Optional HTTPS DoH URLs, one per line (maximum three). The panel retries these in order if its primary upstream times out, fails to connect or returns an HTTP error. Queries may be sent to these providers. Applies to /dns-query and /dns-json.', true)}
  <p class="card-desc">For IP-based regional blocks, configure a tested external exit under Routing &amp; Chain. The panel gateway below accepts HTTPS DoH upstreams; other DNS transports run in your client. Browser-specific Secure DNS may bypass client DNS policies.</p><button class="btn btn-primary" type="submit">Save client DNS &amp; routing</button></form></div>`;
}
