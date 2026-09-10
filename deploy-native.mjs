import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
export function generateNative({ host, cert, key, out = path.join(root, 'native/generated'), protocols = ['shadowtls', 'shadowsocks', 'openvpn'], handshake = 'www.microsoft.com' }) {
  for (const [name, value] of [['host', host], ['handshake', handshake]]) {
    if (!value || !/^[a-zA-Z0-9.-]+$/.test(value) || value.startsWith('-')) throw new Error(`${name} must be a DNS hostname or IPv4 address`);
  }
  const supported = ['shadowtls', 'shadowsocks', 'hysteria2', 'tuic', 'anytls', 'openvpn'];
  if (!protocols.length || protocols.some(p => !supported.includes(p))) throw new Error(`Protocols: ${supported.join(', ')}`);
  const needsTLS = protocols.some(p => ['hysteria2', 'tuic', 'anytls'].includes(p));
  let certificate;
  if (needsTLS) {
    if (!cert || !key) throw new Error('Hysteria2, TUIC and AnyTLS require --cert and --key for your host');
    certificate = fs.readFileSync(cert, 'utf8');
    const x509 = new crypto.X509Certificate(certificate);
    if (!x509.checkHost(host) && !x509.checkIP(host)) throw new Error('Certificate does not match --host');
    if (!x509.checkPrivateKey(crypto.createPrivateKey(fs.readFileSync(key)))) throw new Error('TLS private key does not match certificate');
    if (Date.parse(x509.validTo) <= Date.now()) throw new Error('TLS certificate has expired');
  }
  out = path.resolve(out);
  if (fs.existsSync(out)) throw new Error(`Output already exists; refusing to replace credentials: ${out}`);
  fs.mkdirSync(out, { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.join(out, 'clients'), { mode: 0o700 });
  const save = (file, data) => fs.writeFileSync(path.join(out, file), typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n', { mode: 0o600 });
  const random = () => crypto.randomBytes(32).toString('base64');
  const inbounds = [], outbounds = [], selected = [], ports = [];
  const tls = { enabled: true, certificate_path: '/etc/sing-box/server.crt', key_path: '/etc/sing-box/server.key' };
  const clientTLS = { enabled: true, server_name: host, ...(certificate ? { certificate: certificate.trim().split('\n') } : {}) };
  const listen = port => ({ listen: '::', listen_port: port });
  const endpoint = port => ({ server: host, server_port: port });
  if (protocols.includes('shadowtls')) {
    const password = random(), ssPassword = random();
    inbounds.push({ type: 'shadowtls', tag: 'shadowtls-in', ...listen(8443), version: 3, users: [{ name: 'client', password }], handshake: { server: handshake, server_port: 443 }, strict_mode: true, detour: 'shadowtls-inner' });
    inbounds.push({ type: 'shadowsocks', tag: 'shadowtls-inner', method: '2022-blake3-aes-256-gcm', password: ssPassword });
    outbounds.push({ type: 'shadowtls', tag: 'shadowtls-transport', ...endpoint(8443), version: 3, password, tls: { enabled: true, server_name: handshake, utls: { enabled: true, fingerprint: 'chrome' } } });
    outbounds.push({ type: 'shadowsocks', tag: 'shadowtls', ...endpoint(8443), method: '2022-blake3-aes-256-gcm', password: ssPassword, detour: 'shadowtls-transport' });
    selected.push('shadowtls'); ports.push('8443:8443/tcp');
  }
  if (protocols.includes('shadowsocks')) {
    const password = random();
    inbounds.push({ type: 'shadowsocks', tag: 'shadowsocks-in', ...listen(8388), method: '2022-blake3-aes-256-gcm', password });
    outbounds.push({ type: 'shadowsocks', tag: 'shadowsocks', ...endpoint(8388), method: '2022-blake3-aes-256-gcm', password });
    selected.push('shadowsocks'); ports.push('8388:8388/tcp', '8388:8388/udp');
  }
  for (const [type, port, transport] of [['hysteria2', 8443, 'udp'], ['tuic', 9443, 'udp'], ['anytls', 9443, 'tcp']]) {
    if (!protocols.includes(type)) continue;
    const password = random(), uuid = crypto.randomUUID();
    const extra = type === 'tuic' ? { uuid } : {};
    inbounds.push({ type, tag: type + '-in', ...listen(port), users: [{ name: 'client', password, ...extra }], tls });
    outbounds.push({ type, tag: type, ...endpoint(port), password, ...extra, tls: clientTLS });
    selected.push(type); ports.push(`${port}:${port}/${transport}`);
  }
  if (needsTLS) { save('server.crt', certificate); save('server.key', fs.readFileSync(key, 'utf8')); }
  const server = { log: { level: 'info', timestamp: true }, inbounds, outbounds: [{ type: 'direct', tag: 'direct' }] };
  const client = { inbounds: [{ type: 'mixed', tag: 'local', listen: '127.0.0.1', listen_port: 2080 }], outbounds: selected.length ? [{ type: 'selector', tag: 'proxy', outbounds: selected }, ...outbounds] : [], route: { final: 'proxy' } };
  save('sing-box.json', server);
  if (selected.length) save('clients/native.json', client);
  save('panel.env', `PANEL_PASSWORD=${crypto.randomBytes(24).toString('hex')}\nJWT_SECRET=${crypto.randomBytes(32).toString('hex')}\n`);
  const services = {
    panel: { build: { context: root }, restart: 'unless-stopped', env_file: ['./panel.env'], environment: { DATA_DIR: '/app/data', OPENVPN_CLIENT_PROFILE_FILE: '/clients/client.ovpn', ...(selected.length ? { NATIVE_CLIENT_CONFIG: JSON.stringify(client) } : {}) }, ports: ['127.0.0.1:8080:8080'], volumes: ['panel-data:/app/data', 'vpn-clients:/clients:ro'] }
  };
  if (selected.length) services['sing-box'] = { image: 'ghcr.io/sagernet/sing-box:v1.14.0', restart: 'unless-stopped', command: ['run', '-c', '/etc/sing-box/sing-box.json'], volumes: ['./sing-box.json:/etc/sing-box/sing-box.json:ro', ...(needsTLS ? ['./server.crt:/etc/sing-box/server.crt:ro', './server.key:/etc/sing-box/server.key:ro'] : [])], ports };
  if (protocols.includes('openvpn')) services.openvpn = { build: { context: path.join(root, 'native/openvpn') }, restart: 'unless-stopped', cap_add: ['NET_ADMIN'], devices: ['/dev/net/tun:/dev/net/tun'], sysctls: { 'net.ipv4.ip_forward': '1' }, environment: { VPN_HOST: host }, ports: ['1194:1194/udp'], volumes: ['vpn-data:/etc/openvpn', 'vpn-clients:/clients'], healthcheck: { test: ['CMD-SHELL', 'test -s /clients/client.ovpn && ip link show tun0 >/dev/null'], interval: '30s', timeout: '5s', retries: 3, start_period: '60s' } };
  save('compose.json', { services, volumes: { 'panel-data': {}, 'vpn-data': {}, 'vpn-clients': {} } });
  save('README.txt', `Generated for ${host}. Credentials are private; do not commit this directory.\nLinux Docker with Compose is required.\n1. docker compose -f compose.json config --quiet\n2. docker compose -f compose.json run --rm sing-box check -c /etc/sing-box/sing-box.json (if enabled)\n3. docker compose -f compose.json up -d --build\n4. docker compose -f compose.json ps\nOpenVPN profile: docker compose -f compose.json cp openvpn:/clients/client.ovpn ./client.ovpn\nOther clients: clients/native.json (Sing-box 1.14).\nPanel: localhost:8080; put an HTTPS reverse proxy in front for remote access.\nPorts: ${ports.join(', ')}${protocols.includes('openvpn') ? ', 1194/udp' : ''}. Allow these in the host firewall.\nShadowTLS requires reachable TLS 1.3 handshake host ${handshake}.\nOpenVPN requires /dev/net/tun and NET_ADMIN; do not deploy that service to an HTTP-only PaaS.\n`);
  return { out, server, client, protocols };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = Object.fromEntries(process.argv.slice(2).map(value => { const i = value.indexOf('='); if (!value.startsWith('--') || i < 0) throw new Error('Use --name=value arguments'); return [value.slice(2, i), value.slice(i + 1)]; }));
    const result = generateNative({ ...args, protocols: args.protocols?.split(',') });
    console.log(`Generated ${result.protocols.join(', ')} in ${result.out}. See README.txt for validation and startup.`);
  } catch (err) { console.error(err.message); process.exitCode = 1; }
}
