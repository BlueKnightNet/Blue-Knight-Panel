# BlueKnight Panel

Proxy panel, encrypted DNS gateway, and client subscriptions for Cloudflare and Node hosts.

Version **5.2.1**. Live panel: https://your-project.pages.dev/panel

Workers test panel: https://your-worker.your-subdomain.workers.dev/panel
It shares the Pages panel's login and saved settings. Update it with `npx wrangler deploy --config wrangler.workers.toml` after running `BlueKnight-Deploy.cmd --check`.

To update the existing Pages site without replacing its saved settings:

```bat
BlueKnight-Deploy.cmd cloudflare-pages --project=your-project --branch=your-branch --yes
```

See [the deployment guide](DEPLOYMENT.md#update-your-panel) for validation, production-branch details and native-server requirements.

## Security

The panel is an administrative control plane for proxy tunnels. Treat it as one.

- **Set a KV binding.** `BK_KV` stores the admin password (PBKDF2-SHA256,
  210,000 iterations, per-record salt) and the session signing key. Without KV,
  set `JWT_SECRET`. If neither is present the panel refuses to sign sessions
  rather than fall back to a shared key.
- **Set a strong admin password at setup.** There is no lockout or rate limit on
  `/panel/login`: the worker is stateless, and a KV-backed attempt counter costs
  a write per request, which is both a quota cost and its own denial-of-service
  lever. Put a Cloudflare WAF rate-limiting rule on `/panel/login` if the panel
  is reachable from the internet.
- **Keep subscription tokens out of shared links.** `/sub/*` and
  `/api/node/export` authenticate on a query-string token. Responses are sent
  with `Referrer-Policy: no-referrer`, but anyone holding the URL holds the
  credential. Rotate from Settings if one leaks.
- **Never commit `data/`, `.dev.vars`, or a filled-in `wrangler.workers.toml`.**
  They hold the password hash, signing key, VLESS UUID and Trojan password.
  `.gitignore` covers them; check `git status` before a first push anyway.

Every response carries `X-Frame-Options: DENY`, `X-Content-Type-Options:
nosniff` and `Referrer-Policy: no-referrer`. HTML responses add a
`Content-Security-Policy` whose `form-action 'self'`, `frame-ancestors 'none'`,
`base-uri 'none'` and `connect-src 'self'` directives limit what an injected
script could do. `'unsafe-inline'` remains necessary for scripts and styles
while the markup uses inline `onclick` handlers.

## Connection support

- VLESS and Trojan over WebSocket: implemented TCP tunnels on Cloudflare Workers/Pages and Node hosts.
- HTTP streaming endpoint: experimental raw VLESS/Trojan streaming; not advertised as Xray split-HTTP. HTTP Upgrade links are withheld because that transport is not implemented.
- ShadowTLS v3, Shadowsocks 2022, Hysteria2, TUIC and AnyTLS: real sing-box servers and matching client configuration from the native deployment generator.
- OpenVPN: real Linux Docker service with persistent PKI, TLS-crypt, routing/NAT, and an authenticated `.ovpn` download. Requires TUN and NET_ADMIN.
- DNS-over-HTTPS: GET/POST wire format forwarding and a JSON endpoint decoded from standard DNS responses, including providers without a JSON API.
- WARP/Amnezia: exports require configured credentials. Exporting a file does not verify provider registration or Amnezia server compatibility.

Shadowsocks now has its own working WebSocket handler, using AES-128-GCM, AES-256-GCM or ChaCha20-Poly1305. Combined Xray URI/JSON, Sing-box and Clash feeds include it alongside VLESS and Trojan. URI clients need v2ray-plugin with multiplexing disabled. OpenVPN profiles still require a provisioned native server.

In Subscriptions, use **VLESS + Trojan + Shadowsocks — combined subscription** for URI clients, or **All configured protocols — Sing-box 1.14+** to include provisioned native connections too. The VLESS Direct Feed remains VLESS-only. Refresh the subscription in the client after changing its URL. VMess, Xray split-HTTP, gRPC and HTTP Upgrade are not implemented by this Pages handler; sample links for those protocols cannot make it serve them.

## Start the panel

```sh
npm start
```

Open http://localhost:8080/panel/setup. Settings live in `data/blueknight_kv.json`. Set `DATA_DIR` to a persistent volume, or configure a Redis REST store. `PANEL_PASSWORD`, `JWT_SECRET`, `VLESS_UUID`, `TROJAN_PASSWORD` and `SUB_TOKEN` can supply stable identities.

## Native connections on a Linux Docker host

```sh
node deploy-native.mjs --host=vpn.example.com
```

This prepares ShadowTLS, Shadowsocks and OpenVPN under `native/generated`. It refuses to overwrite an existing deployment's credentials. On the target Linux host:

```sh
cd native/generated
docker compose -f compose.json config --quiet
docker compose -f compose.json run --rm sing-box check -c /etc/sing-box/sing-box.json
docker compose -f compose.json up -d --build
docker compose -f compose.json ps
```

For all six native types, supply a real matching certificate and private key:

```sh
node deploy-native.mjs --host=vpn.example.com --protocols=shadowtls,shadowsocks,hysteria2,tuic,anytls,openvpn --cert=/path/fullchain.pem --key=/path/privkey.pem
```

The panel is bound to localhost:8080; configure HTTPS for remote administration. The generated README lists required TCP/UDP ports and profile export commands. Generated client files contain credentials. The OpenVPN container creates its certificates on first startup; no placeholder certificate is used.

## Deploy and verify

See [DEPLOYMENT.md](DEPLOYMENT.md) for platform requirements and [CONNECTION-AUDIT.md](CONNECTION-AUDIT.md) for verification results and remaining limitations.

```sh
node deploy.mjs --list
npm run test:all
```

Native integration checks require sing-box and a localhost test certificate:

```sh
SING_BOX_BIN=/path/sing-box TEST_TLS_CERT=/path/localhost.crt TEST_TLS_KEY=/path/localhost.key npm run test:native
```

Theme images are served from `public/assets`; deploy those assets along with the Worker. Copying only worker.js into a dashboard no longer includes wallpapers.

Cloudflare subscriptions default to all six supported HTTPS ports: 443, 2053, 2083, 2087, 2096 and 8443. Combined feeds include 18 base nodes (six VLESS, six Trojan and six Shadowsocks when enabled). Configured static IPs and enabled fronting variants are included consistently in VLESS, Trojan, Xray, Clash and Sing-box exports, without truncating the IP pool. Other hosts default to 443; PROXY_PORTS overrides the defaults. Port availability still depends on the deployment and network.

## Windows deployment launcher

Double-click `BlueKnight-Deploy.cmd` for the platform picker (native stack is option 11). From a terminal:

```bat
BlueKnight-Deploy.cmd --check
BlueKnight-Deploy.cmd cloudflare
BlueKnight-Deploy.cmd native --host=vpn.example.com --prepare-only
BlueKnight-Deploy.cmd native
```

`--check` validates the project without deploying. `--prepare-only` generates native files without starting services. Running `native` again reuses the generated credentials and starts the stack after Docker checks. Configuration changes require a new `--out` directory. Node 22+ is required; Node 24 LTS is recommended. Terminal invocations return their exit code without pausing; the double-click picker pauses when finished.
