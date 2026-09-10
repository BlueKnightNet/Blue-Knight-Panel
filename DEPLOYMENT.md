# Deployment

## Platform capabilities

| Target | Panel / DNS / subscriptions | VLESS/Trojan WebSocket | Native OpenVPN / ShadowTLS / QUIC |
| --- | --- | --- | --- |
| Cloudflare Workers | Yes, KV + static assets | Yes | Not in the Worker runtime |
| Cloudflare Pages | Yes, KV + Pages assets | Yes | Not in Pages Functions |
| Fly.io | Yes, persistent volume | Yes | Separate native service and raw TCP/UDP configuration required; not in the panel image |
| Railway | Yes, volume or Redis REST | Yes | Not provided by the panel deployment; use the native Linux host stack |
| Render | Yes, paid disk blueprint | Yes | Not on the public HTTP web-service endpoint |
| Koyeb | Yes, Redis REST recommended | Yes | Not provided by the panel deployment; use the native Linux host stack |
| Vercel | Yes, Redis REST | Exported HTTP server supports upgrades with Fluid compute; provider duration limits apply | No native daemons in this adapter |
| Netlify | Yes, Node Functions + Redis REST | Disabled in this adapter | No native daemons in this adapter |
| Linux Docker / VPS | Yes | Yes, configure HTTPS | Native generator provides OpenVPN, ShadowTLS, Shadowsocks, Hysteria2, TUIC, AnyTLS |
| Glitch | Hosting discontinued | Unavailable | Unavailable |

These are deployment configurations and implementation capabilities, not proof that your cloud accounts have successfully deployed them. A public endpoint and a real client connection are required for live verification.

## Cloudflare Workers

```sh
node deploy.mjs cloudflare
```

The deploy helper creates/binds KV. For manual deployment, create a `BK_KV` namespace and replace `YOUR_KV_NAMESPACE_ID` in `wrangler.toml`, then run `npx wrangler deploy`. The `[assets]` section uploads `public/`; do not omit it. Use `nodejs_compat` and the supplied compatibility date. `npx wrangler deploy --dry-run` checks bundling but does not validate namespace existence or deploy a service.

## Update your panel

### Separate Workers test deployment

Test URL: https://your-worker.your-subdomain.workers.dev/panel

`wrangler.workers.toml` deploys the same code and assets as a separate Worker, using the Pages project's existing BK_KV binding. Both panels share login credentials and saved settings; changes saved in either panel affect both. Subscription hostnames follow the panel from which you copy the link.

```cmd
BlueKnight-Deploy.cmd --check
npx wrangler deploy --config wrangler.workers.toml
```

Deployed version 5.2.1 on 2026-09-09, Worker version `3bad6332-6e62-496b-9584-4f1d983ca640`. Live `/api/health` returned 200 with version 5.2.1, and `/panel` redirected to the working login page. Production tunnel traffic has not been verified by these HTTP checks.

### Pages update command

Version 5.2.1 restores the VLESS/Trojan compatibility settings from the working samples: HTTP/1.1 ALPN, Chrome fingerprint and no forced early data. Shadowsocks remains available. Refresh your client subscription after deployment. Public Worker WebSocket upgrades were verified on all six advertised ports; authenticated production relay requires a separate client test.

Live panel: https://your-project.pages.dev/panel

The Pages project is `your-project`, and its **production branch is also `your-project`**. Publishing to `main` creates a preview and does not update this live URL.

From Windows, run:

```bat
BlueKnight-Deploy.cmd --check
BlueKnight-Deploy.cmd cloudflare-pages --project=your-project --branch=your-branch --yes
```

Or use Node directly:

```sh
node deploy.mjs cloudflare-pages --project=your-project --branch=your-branch --yes
```

The helper downloads the project's existing configuration into an isolated staging directory, preserves its KV bindings, copies the current Worker/Functions/static assets, and publishes to the selected branch. It does not replace your panel password, subscription token, UUID, or existing KV namespace. The root Workers configuration is unchanged. Cloudflare authentication through Wrangler is required.

After publishing, check `https://your-project.pages.dev/api/health` for version `5.2.1`, then refresh the panel. Use Ctrl+F5 if an old page is still displayed. The updated Subscriptions section includes native connection downloads, and the Protocols section explains which connections require a native server. OpenVPN and ShadowTLS do not run inside Pages: those downloads need a separately provisioned native deployment.

Latest upload: 2026-09-09, deployment `f50ebbf4-d997-4cfa-ab31-d051a0d83a2f`, confirmed as production by Wrangler. All six predeployment suites passed. Live HTTP/UI verification was blocked by this workstation's DNS/network failures; see [the audit](CONNECTION-AUDIT.md) for the exact validation scope.

## Other Cloudflare Pages projects

```sh
node deploy.mjs cloudflare-pages --project=your-project --branch=your-production-branch
```

Create a Pages project and BK_KV binding in Cloudflare before the first deployment. Enable `nodejs_compat`, use compatibility date `2025-09-01` or later, and set the output directory to `public`. The helper preserves the downloaded project configuration rather than selecting an unrelated KV namespace by name. Static assets bypass the catch-all function. If the production branch can be discovered from existing deployments, `--branch` may be omitted.

## Fly.io

```sh
node deploy.mjs fly
```

`fly.toml` runs the Node panel on port 8080 behind HTTPS, mounts `blueknight_data` at `/app/data`, and uses `/api/health`. App names must be unique. The helper checks volume creation failures. This is the panel container; native protocol daemons need a separate configuration with appropriate raw ports.

## Railway

```sh
node deploy.mjs railway
```

Link the project first. The Dockerfile and `railway.json` specify the start command and health check. Add a volume at `/app/data` or configure Redis REST before relying on settings surviving a redeploy. Enable a public HTTPS domain for WebSocket clients.

## Render

Create a Blueprint from this repository. `render.yaml` uses the paid Starter plan because Render does not permit a persistent disk on a free web service. Enter PANEL_PASSWORD; JWT_SECRET is generated. The disk is mounted at `/var/data`. To use a free service, remove the disk and configure Redis REST instead; account for service sleeping and reconnections.

## Koyeb

Install/authenticate the Koyeb CLI. Set GIT_REPOSITORY_URL to your GitHub repository, optionally set GIT_BRANCH, then run:

```sh
node deploy.mjs koyeb
```

The helper builds that repository's Dockerfile instead of trying to pull a nonexistent `blueknight-panel` image. Set a Redis REST URL/token pair in Koyeb for durable settings. `koyeb.yaml` is a reference, not an automatically consumed Blueprint; the CLI or dashboard is the deployment path.

## Vercel

```sh
node deploy.mjs vercel
```

Enable Fluid compute. `api/index.js` exports a Node HTTP server with an upgrade handler, following Vercel's current server support. Use the supplied rewrites and deploy public assets. Configure Redis REST to preserve settings. WebSocket sessions remain subject to Vercel function execution limits; clients must reconnect. The local adapter test is not a live Vercel deployment test.

## Netlify

```sh
node deploy.mjs netlify
```

`netlify.toml` now uses `netlify/functions/blueknight.mjs`, a Node Function, and serves static assets from `public`. The old Deno Edge adapter is not used. Native Node imports in the bundled engine are not portable to every Edge runtime. This adapter explicitly refuses tunnel requests with HTTP 501; use a tunnel host for traffic.

## Persistent settings

All Node/serverless adapters support these credential pairs:

- KV_REST_API_URL / KV_REST_API_TOKEN
- UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
- REDIS_REST_URL / REDIS_REST_TOKEN

Node container deployments fall back to their data directory. Serverless adapters fall back to volatile memory and log a warning. Provide both URL and token. Invalid Redis credentials produce an error rather than silently creating a fresh identity.

## Native Linux deployment

Run `deploy-native.mjs` on the target Linux host, as documented in README.md. The Compose project runs independent panel, sing-box and OpenVPN services. OpenVPN requires `/dev/net/tun`, NET_ADMIN and IPv4 forwarding. The stack adds NAT in its own container network namespace. Persist `vpn-data` to preserve the CA and client identity. Do not delete that volume during upgrades.

The default generator enables ShadowTLS v3 (TCP 8443), Shadowsocks 2022 (TCP/UDP 8388), and OpenVPN (UDP 1194). Hysteria2 (UDP 8443), TUIC (UDP 9443), and AnyTLS (TCP 9443) require a hostname-matching TLS certificate and key. Open those ports on your host firewall. ShadowTLS needs a reachable TLS 1.3 handshake host; use `--handshake=your-host` to change it. Raw protocols must bypass HTTP/CDN TLS termination.

The panel loads `/clients/client.ovpn` after OpenVPN provisions it, and serves it only to an authorized subscription/session. For a separately managed OpenVPN server, set OPENVPN_CLIENT_PROFILE_FILE on Node or OPENVPN_CLIENT_PROFILE in another adapter to a real client profile. This exports a profile; it does not create the remote server.

For native clients, the generated Compose config supplies NATIVE_CLIENT_CONFIG. A separate Node panel can use NATIVE_CLIENT_CONFIG_FILE. Download `/sub/native` for all generated connections, or `/sub/shadowtls`, `/sub/shadowsocks`, `/sub/hysteria2`, `/sub/tuic`, `/sub/anytls` with subscription authorization. `/sub/all` and `/sub/singbox` combine panel protocols with the provisioned native outbounds, preserving transport dependencies and TLS settings. `/sub/ss` exports panel Shadowsocks-over-WebSocket links when enabled; the native-only Shadowsocks config is at `/sub/shadowsocks`.

The mixed URI subscription `/sub/xray` includes VLESS, Trojan and enabled Shadowsocks. `/sub/xray-json` and `/sub/clash` include all three as well. Shadowsocks uses a dedicated `<proxyPath>/ss` WebSocket endpoint and supports TCP with AES-128-GCM, AES-256-GCM and ChaCha20-Poly1305. SIP003 clients must disable v2ray-plugin multiplexing (`mux=0`); generated links already do this. SS fronting entries with differing TLS SNI and plugin Host are excluded because the plugin cannot represent that combination. VMess and Xray split-HTTP/gRPC/HTTP Upgrade require a different server implementation.

The initial OpenVPN setup produces one client identity. Create and revoke separate certificates before distributing to multiple users; the panel does not manage multi-user PKI or certificate renewal. For renewed sing-box certificates, replace server.crt/server.key, update embedded client trust as needed, and restart sing-box.

## Verification

1. Run `npm run test:all` and the native integration suite with a sing-box binary.
2. Validate the Worker with Wrangler's dry run or the Compose project with `docker compose config` and `sing-box check`.
3. Deploy to your authenticated target and check `/api/health`, login, settings persistence after restart, and static assets.
4. Import a real subscription on a client and test DNS and traffic from the network where it will be used.
5. For OpenVPN check `docker compose ps`, container logs, and an actual OpenVPN client handshake and internet route. A generated profile alone does not establish success.

## Provider references

- [Vercel WebSockets and Fluid compute](https://vercel.com/docs/functions/websockets)
- [Render persistent disk requirements](https://render.com/docs/disks)
- [Koyeb Git deployment](https://www.koyeb.com/docs/build-and-deploy/deploy-with-git)
- [Fly raw TCP and UDP services](https://fly.io/docs/networking/udp-and-tcp/)
- [Glitch hosting shutdown](https://blog.glitch.com/post/changes-are-coming-to-glitch)
- [sing-box configuration](https://sing-box.sagernet.org/configuration/)
- [OpenVPN setup](https://openvpn.net/community-docs/how-to.html)

Cloudflare subscriptions default to all six supported HTTPS ports: 443, 2053, 2083, 2087, 2096 and 8443. Combined feeds include 18 base nodes (six VLESS, six Trojan and six Shadowsocks when enabled). Configured static IPs and enabled fronting variants are included consistently in VLESS, Trojan, Xray, Clash and Sing-box exports, without truncating the IP pool. Other hosts default to 443; PROXY_PORTS overrides the defaults. Port availability still depends on the deployment and network.

## Windows launcher

`BlueKnight-Deploy.cmd` anchors the working directory to the project, forwards CLI arguments, runs the current deployment helper and preserves errors. The helper checks all six local regression suites before deployment. Use `BlueKnight-Deploy.cmd --check` for validation only. Native stack preparation and startup are available from option 11 or `BlueKnight-Deploy.cmd native`; append `--prepare-only` to generate files without starting containers. The generated stack uses sing-box 1.14.0 and Linux OpenVPN; Hysteria2, TUIC and AnyTLS need `--cert` and `--key`. Existing credentials are reused rather than regenerated.

Sing-box panel exports now target the 1.14 schema, including DNS servers, rule sets and WireGuard endpoints. Country bypass presets use country IP rule sets and country domain suffixes. They no longer require removed GeoIP/Geosite databases.
