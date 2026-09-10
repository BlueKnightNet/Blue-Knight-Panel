# Connection and deployment audit

Date: 2026-09-09. Local runtime: Windows, Node 24.19.0; native validation: official sing-box 1.14.0 release with verified SHA-256 release digest.

## Verified

2026-09-10 compatibility rollback (5.2.1): VLESS/Trojan feeds again use Chrome fingerprint and HTTP/1.1 ALPN, matching the user's working samples; forced early-data options were removed from their URI and Sing-box exports. Shadowsocks remains enabled and unchanged. Both VLESS and Trojan passed real Xray and Sing-box TCP echo tests from generated configs. All three Shadowsocks ciphers also passed both clients. The proxy test now chooses free local ports to avoid an unrelated listener on 8123.

Public production Worker checks accepted WebSocket upgrades (101) on 443, 2053, 2083, 2087, 2096 and 8443. This verifies listeners and TLS/upgrade routing, not authenticated outbound relay. Automatic approval review rejected reading the existing subscription token, using it on the Worker, and storing the credential-bearing client config; that production authentication test was not executed.

Cloudflare Workers deployment: `your-panel-worker`, version `3bad6332-6e62-496b-9584-4f1d983ca640`, serving 100% of traffic. Live https://your-worker.your-subdomain.workers.dev/api/health returned HTTP 200, healthy, version 5.2.0. `/panel` redirected to `/panel/login`, returning HTTP 200. All six predeployment suites passed. This Worker shares the Pages panel's existing KV settings. These production checks verify HTTP availability, not end-to-end production tunnel traffic.

Version 5.2.0 adds a real Shadowsocks AEAD WebSocket handler and mixed VLESS/Trojan/SS subscriptions. Official Sing-box 1.14.0 and Xray 26.3.27 clients each passed real TCP echo through the exported SS configurations with AES-128-GCM, AES-256-GCM and ChaCha20-Poly1305. Client-side HTTPS was disabled only for the local Node fixture. Cloudflare workerd separately passed the default ChaCha20 Shadowsocks WebSocket/TCP echo. Fragmented ciphertext, nonce carry and tamper rejection are covered in the regression suite. Replay tracking is bounded and local to each runtime instance, not a global cross-instance replay database.

The combined Sing-box feed preserves provisioned native outbounds, selectors and transport references. Missing native dependencies fail with 503. VMess samples were reviewed for protocol/transport structure, without importing their credentials or claiming those third-party servers were tested. VMess, gRPC, Xray split-HTTP and HTTP Upgrade remain unsupported by the Pages tunnel handler.

| Check | Result | Scope |
| --- | --- | --- |
| Settings, login, tab navigation, checkbox persistence | PASS | In-memory Worker regression suite |
| Redis REST persistence and invalid credentials | PASS | Local HTTP Redis-compatible service; simulated cold start |
| Node WebSocket VLESS tunnel, legacy path and private static files | PASS | Real local TCP echo and HTTP requests |
| Vercel exported HTTP server | PASS | Real WebSocket/TCP echo through the adapter, including disconnect cleanup |
| Netlify Node Function | PASS | Health, login, panel, explicit unsupported-tunnel responses |
| HTTP CONNECT and SOCKS5 | PASS | Fragmented/coalesced handshake reads, credential negotiation, rejection, retained target payload |
| VLESS/Trojan raw HTTP streaming | PASS | Real local TCP echo, response headers, stream completion and bad auth |
| DNS wire parser and HTTP/2 helper | PASS | Real local HTTP/2 server and malformed DNS response checks |
| Public DNS resolvers | PASS, 8/8 | Live example.com A queries through Cloudflare, Google, AdGuard, Quad9, Mullvad, ControlD, AliDNS and OpenDNS |
| Cloudflare Worker build | PASS | Wrangler dry run; about 80 KiB compressed after moving theme images to assets |
| Cloudflare Pages build | PASS | Wrangler Pages Functions compilation with nodejs_compat |
| Cloudflare Pages production upload | PASS | Version 5.2.0 uploaded to project your-project, production branch your-project; deployment f50ebbf4-d997-4cfa-ab31-d051a0d83a2f confirmed by Wrangler |
| Cloudflare local runtime | PASS | Health, setup, static image, authenticated subscription and real WebSocket/TCP echo in workerd |
| Vercel/Netlify Node bundles | PASS | esbuild Node ESM bundles |
| ShadowTLS v3 and Shadowsocks 2022 | PASS | Real sing-box client -> server -> TCP echo; ShadowTLS used a local TLS 1.3 handshake host |
| Hysteria2 and TUIC | PASS | Real QUIC connection carrying a TCP echo payload |
| AnyTLS | PASS | Real sing-box client -> server -> TCP echo |
| Sing-box panel subscriptions | PASS | Actual 1.14 validator: default plus global/IR/CN/ad-block presets with WireGuard endpoint |
| Windows launcher | PASS | --check, native preparation, argument forwarding, exit behavior; shortcut PowerShell syntax |
| OpenVPN entrypoint | Syntax PASS | POSIX shell syntax only; Docker/TUN runtime unavailable here |

## Changes that address failures

- Fixed raw HTTP streaming's ignored chain settings and missing VLESS response header, and closed completed streams.
- Fixed SOCKS5 authentication and partial handshakes; HTTP CONNECT now checks the actual status line and preserves post-handshake data.
- Fixed WebSocket disconnect leaks and unhandled asynchronous stream-close errors.
- Restricted public file serving so project source, settings and deployment credentials cannot be downloaded from the Node server.
- Added HTTP/2 DNS fallback with Content-Length, updated Mullvad's hostname, and decoded standard DNS wire responses for the dashboard's JSON endpoint.
- Reduced the Worker bundle by moving embedded wallpapers into static assets.
- Added Vercel's current HTTP-server upgrade adapter and a compatible Netlify Node Function, and fixed Node Redis store selection.
- Corrected Render's disk plan, Koyeb's source deployment command, Railway variable command, and Fly volume failure handling.
- Added native Docker generation with independent OpenVPN and sing-box services, private random credentials, matching native client exports, certificate/key validation and overwrite protection.
- Removed fake OpenVPN and Shadowsocks exports. Missing native provisioning returns 503. Unimplemented HTTP Upgrade and nonstandard XHTTP links are withheld from client feeds.
- Subscription regression corrected in 5.1.1: restored six Cloudflare HTTPS ports and consistent configured static-IP/fronting variants across client formats. Node hosts retain port 443 defaults. Tests cover 12 base combined nodes, a 14-node per-protocol fixture, IPv6, full IP pools and explicit port overrides.
- Updated Sing-box exports to its current schema and added the native stack and six-suite preflight to BlueKnight-Deploy.cmd/deploy.mjs.

## Still requires the deployment environment

Cloudflare Pages production was updated on 2026-09-09 at https://your-project.pages.dev/panel. The helper downloaded and preserved the existing project's configuration and BK_KV binding before publishing. All six predeployment regression suites passed. Wrangler confirmed deployment f50ebbf4-d997-4cfa-ab31-d051a0d83a2f on production branch your-project. Live HTTP/UI verification remains incomplete: this workstation resolved the Pages hostname to unreachable private address 10.10.34.36, alternate encrypted DNS checks failed, and no browser was available. Upload success does not establish live tunnel or UI health.

Platforms other than Cloudflare Pages and Workers have not been deployed in this session. Real TLS certificates and a Linux Docker host were not supplied. The root wrangler.toml still has a placeholder KV ID; the deployed test Worker uses wrangler.workers.toml and the Pages update uses its downloaded project configuration instead.

OpenVPN has real provisioning code but has NOT been verified running: Docker and /dev/net/tun are unavailable on this workstation. Its container must start on Linux, become healthy, and pass an actual OpenVPN client handshake plus routed traffic test before it can be called deployed correctly.

Native Docker builds and Compose startup were not executed here. The native protocols were tested using the same generated sing-box configurations with filesystem paths/listen addresses adapted for local Windows validation. The tests do not establish internet reachability, UDP target relay, long-duration stability, certificate renewal, provider quotas or every client version.

WARP account registration and AmneziaWG interoperability were not tested; real credentials and matching server support are still required. Raw HTTP streaming remains experimental, and it is not an implementation of Xray split-HTTP. Advanced DNS records outside the dashboard's listed types may be represented as raw hex.

The supported platform boundaries and official provider references are in DEPLOYMENT.md. Glitch hosting is discontinued. HTTP-only serverless deployments cannot run the native OpenVPN stack.

## Repeat checks

- `BlueKnight-Deploy.cmd --check` or `npm run test:all`
- `npm run test:dns:live` (requires outbound network access)
- `npm run test:native` with SING_BOX_BIN, TEST_TLS_CERT and TEST_TLS_KEY
- `npx wrangler deploy --dry-run`
- On Linux: Compose validation, sing-box check, container health, then a real OpenVPN client test as documented in DEPLOYMENT.md
