import { parseResolver } from './client-dns.mjs';

const domains = text => text.split('\n').filter(Boolean).map(d => `domain:${d}`);
const literal = host => host.includes(':') || /^(\d+\.){3}\d+$/.test(host);
const authority = host => host.includes(':') ? `[${host}]` : host;

// Xray 26.3.27-compatible DNS. No fields that this core silently ignores.
export function applyXrayDns(config, policy, panelHost) {
  const proxies = config.outbounds.filter(o => ['vless', 'trojan', 'shadowsocks'].includes(o.protocol));
  if (!proxies.length) throw new Error('Xray export requires a proxy outbound.');
  const proxyTag = proxies[0].tag;
  const bootstrapHosts = new Set();
  const addHost = host => { if (host && !literal(host)) bootstrapHosts.add(`full:${host}`); };
  for (const outbound of proxies) {
    for (const remote of outbound.settings.vnext || outbound.settings.servers || []) addHost(remote.address);
    outbound.streamSettings.sockopt = { ...outbound.streamSettings.sockopt, domainStrategy: policy.ipv6 ? 'UseIP' : 'UseIPv4' };
  }
  const routeRules = [{ type: 'field', inboundTag: ['dns-bootstrap'], outboundTag: 'dns-bootstrap-out' }];
  config.outbounds.push(
    { tag: 'dns-bootstrap-out', protocol: 'freedom', settings: {} },
    { tag: 'dns-direct-out', protocol: 'freedom', settings: {}, streamSettings: { sockopt: { domainStrategy: policy.ipv6 ? 'UseIP' : 'UseIPv4' } } },
    { tag: 'dns-out', protocol: 'dns', settings: { nonIPQuery: 'reject' } }
  );
  function resolver(value, tag) {
    const r = parseResolver(value === 'panel' ? `https://${panelHost}/dns-query` : value);
    addHost(r.server);
    const hostPort = `${authority(r.server)}:${r.server_port}`;
    let address;
    let outboundTag = policy.route === 'proxy' ? proxyTag : 'dns-direct-out';
    if (r.type === 'udp') address = r.server;
    else if (r.type === 'quic') address = `quic+local://${hostPort}`;
    else if (r.type === 'https' || r.type === 'h3') address = `https://${hostPort}${r.path}`;
    else address = `tcp://${hostPort}`;
    if (r.type === 'tls') {
      outboundTag = `${tag}-tls-out`;
      config.outbounds.push({
        tag: outboundTag, protocol: 'freedom', settings: {},
        streamSettings: {
          network: 'tcp', security: 'tls',
          tlsSettings: { serverName: r.server, allowInsecure: false },
          sockopt: { domainStrategy: policy.ipv6 ? 'UseIP' : 'UseIPv4', ...(policy.route === 'proxy' ? { dialerProxy: proxyTag } : {}) }
        }
      });
    }
    routeRules.push({ type: 'field', inboundTag: [tag], outboundTag });
    return { address, ...(r.type === 'udp' ? { port: r.server_port } : {}), tag };
  }
  const primary = resolver(policy.resolver, 'dns-primary');
  const servers = [];
  if (policy.domains) servers.push({ ...resolver(policy.domainResolver, 'dns-domain'), domains: domains(policy.domains), skipFallback: true, finalQuery: true });
  if (policy.mode === 'fake-ip') {
    if (policy.exclusions) servers.push({ ...primary, domains: domains(policy.exclusions), skipFallback: true, finalQuery: true });
    servers.push({ address: 'fakedns' });
    config.fakedns = [{ ipPool: '198.18.0.0/15', poolSize: 65535 }, ...(policy.ipv6 ? [{ ipPool: 'fc00::/18', poolSize: 65535 }] : [])];
  } else servers.push(primary);
  // Highest-priority real answers for proxy and resolver addresses, even when
  // domain overrides or exclusions overlap them. Never bootstrap via the proxy.
  if (bootstrapHosts.size) servers.unshift({ address: policy.bootstrap, port: 53, tag: 'dns-bootstrap', domains: [...bootstrapHosts], skipFallback: true, finalQuery: true });
  config.dns = { servers, queryStrategy: policy.ipv6 ? 'UseIP' : 'UseIPv4', disableFallbackIfMatch: true, tag: 'dns-primary' };
  const userInbounds = config.inbounds.map(i => i.tag);
  for (const inbound of config.inbounds) {
    // Preserve real destination IPs (e.g. Smart DNS). Only FakeDNS mappings
    // may replace the destination; TLS/HTTP sniffing is for routing alone.
    inbound.sniffing = policy.mode === 'fake-ip'
      ? { enabled: true, destOverride: ['fakedns'], metadataOnly: true }
      : { enabled: true, destOverride: ['http', 'tls'], routeOnly: true };
  }
  config.inbounds.push({ tag: 'dns-in', listen: '127.0.0.1', port: 1053, protocol: 'dokodemo-door', settings: { address: policy.bootstrap, port: 53, network: 'tcp,udp' } });
  routeRules.push(
    { type: 'field', inboundTag: ['dns-in'], outboundTag: 'dns-out' },
    { type: 'field', inboundTag: userInbounds, port: '53', outboundTag: 'dns-out' }
  );
  if (policy.blockQuic) routeRules.push({ type: 'field', network: 'udp', port: '443', outboundTag: 'block' });
  if (policy.forceProxy) routeRules.push({ type: 'field', domain: domains(policy.forceProxy), outboundTag: proxyTag });
  // IPIfNonMatch can resolve a recovered domain back into a fake pool.
  // Keep synthetic IPv6 ULA/IPv4 answers ahead of private/country bypasses.
  if (policy.mode === 'fake-ip') routeRules.push({ type: 'field', ip: ['198.18.0.0/15', ...(policy.ipv6 ? ['fc00::/18'] : [])], outboundTag: proxyTag });
  config.routing.rules.unshift(...routeRules);
}
