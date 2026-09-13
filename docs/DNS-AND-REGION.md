# DNS and regional-access tools

Open **DNS → Client DNS & site routing**. Save, refresh the full **Mihomo/Clash**, **Sing-box** or **Xray JSON** subscription, and reconnect. These controls do not apply to individual VLESS/Trojan/SS links, the base64 mixed feed, native-only exports or WireGuard `.conf` files. Configure DNS in those clients separately. Validation here uses Xray 26.3.27, sing-box 1.14.0 and Mihomo 1.19.30.

| Control | Effect |
| --- | --- |
| Real IP / Fake IP | Fake IP keeps domain identity for client routing. Enable TUN or the client's DNS interception so applications actually use it. |
| Resolver | `panel` uses the panel's DoH gateway. External URLs support HTTPS DoH, TLS DoT, TCP, UDP, QUIC DoQ and HTTP/3 DoH. The chosen server must support that protocol. |
| DNS route | Direct queries originate on the device. Proxy queries use the currently selected proxy. Worker tunnels support TCP, so proxy DNS allows HTTPS/TLS/TCP only. `panel` is rejected in proxy mode to avoid a Worker connecting back to itself. |
| Bootstrap DNS | An IP address used directly to resolve proxy/resolver hostnames without recursive proxy or Fake IP dependencies. This bootstrap traffic is not tunneled. |
| IPv6 | Controls DNS address-family preference; it is not a guarantee against all IPv6 traffic bypassing a client's VPN. |
| TUN | Generates device routing and DNS interception settings for Mihomo/Sing-box. Enable VPN/TUN in the Xray client app separately. The client needs VPN/admin permission. Applications with their own encrypted DNS may ignore DNS policies. |
| Reject UDP 443 | Encourages applications to fall back from QUIC to TCP HTTPS on TCP-only tunnels. Applications without TCP fallback can fail. |
| Fake IP exclusions | Domain suffixes that must receive real addresses. Defaults include localhost, lan and local. |
| Separate resolver | Uses a different resolver for specified domain suffixes, overriding Fake IP. A trusted Smart DNS service can be configured here; availability depends on that service. |
| Always proxy domains | Adds domain rules before country bypass rules. Uses the selected client proxy, including DIRECT if you explicitly select it. |
| Gateway fallbacks | Up to three optional HTTPS DoH upstreams. `/dns-query` GET/POST and `/dns-json` retry them in order after network failures, five-second upstream timeouts or HTTP errors. No automatic provider change unless configured. DNS NXDOMAIN/SERVFAIL and malformed successful responses are not retried. |

The gateway's existing primary/custom upstream fields accept HTTPS DoH only. Alternate DNS transports run in the client, not in the Cloudflare Worker. Settings persist in KV and travel with node export/import. Invalid saves preserve the previous settings.

## Xray JSON compatibility

Use `/sub/xray-json?token=...` or `/sub/xray?format=json&token=...`. The ordinary `/sub/xray` feed contains links and cannot carry DNS rules. Xray JSON includes a loopback DNS listener on TCP/UDP `127.0.0.1:1053`, DNS interception from its SOCKS/HTTP listeners, FakeDNS pools and destination recovery, exclusions, per-domain DNS, bootstrap rules and optional UDP-443 blocking. Synthetic addresses are kept ahead of private/country bypass rules. Non-A/AAAA queries are rejected by the DNS outbound instead of escaping to an unintended resolver.

The first proxy is the default. To use another exported proxy, add `&node=BlueKnight-Trojan-443` (or another actual outbound tag) to the JSON URL. Both ordinary traffic and proxy-routed DNS use that node. Unknown node tags return a clear 400 error.

UDP and TCP use Xray's native DNS clients. DoH uses HTTPS. DoT uses TCP DNS wrapped in a certificate-verified TLS outbound, including when routed through the proxy. QUIC uses Xray's direct `quic+local` resolver. For `h3://` URLs, Xray uses ordinary HTTPS DoH at the same host/port/path; that endpoint must support DoH over TCP. No unimplemented HTTP/3 DNS transport is emitted. TUN configuration remains in the client app to preserve compatibility with the validated Xray version.

Xray bootstrap rules take priority over overlapping domain policies and never return fake addresses for proxy/resolver hostnames. Real-IP mode preserves the destination address during HTTP/TLS sniffing, so Smart DNS answers are not replaced by their original hostnames.

## Starting configuration for troubleshooting

Use Fake IP, `https://1.1.1.1/dns-query`, DNS through the selected proxy, and TUN if the client supports it. Keep an accessible bootstrap DNS IP. On a Worker tunnel, enable rejection of UDP 443 if QUIC attempts cause failures. For Google services, optional always-proxy suffixes include `google.com`, `googleapis.com` and `gstatic.com`; add any additional failing service domains you observe.

This can address DNS poisoning and accidental routing bypass. It does **not** change the exit IP or guarantee access to Gemini. Test the site using the actual exit before selecting it. A successful DNS lookup or a generic proxy latency test does not establish site eligibility.

For an external exit, use **Routing → Dual-Layer Chain Proxy** with an HTTP/SOCKS5 server reachable from the Worker. The route is device → Worker → external exit → website. The generated Mihomo/Sing-box profiles no longer dial through that upstream from the device or expose its address and credentials. WARP remains a separate selectable client connection; it is not automatically an exit behind the Worker. The existing server-side chain implementation uses plain TCP to its upstream; the legacy Security selector does not currently add TLS.

## Validation and limits

Run `npm run test:all`, or the focused `test:client-dns` and `test:xray-dns` scripts. Set `SING_BOX_BIN`, `XRAY_BIN` and `MIHOMO_BIN` to local executables for core checks. Xray TLS runtime tests also use `TEST_TLS_CERT`/`TEST_TLS_KEY` or the local `.validation/test.crt` and `.validation/test.key` fixture. Without a binary, the relevant checks are reported as skipped.

Local validation passed 17 Xray, 12 sing-box and 12 Mihomo configuration checks. All three cores returned real FakeDNS/exclusion/domain-policy answers. Xray additionally recovered a fake IP to its original domain through a recording proxy, and sent certificate-pinned TLS DNS through that proxy. The native suite passed VLESS, Trojan and all three Shadowsocks ciphers in all three clients through the panel. Mihomo's local TLS terminator uses a self-signed test certificate with verification bypassed only in the test fixture; production exports retain normal certificate verification. Native ShadowTLS, Shadowsocks 2022, Hysteria2, TUIC and AnyTLS also passed local sing-box TCP echo tests.

Public resolver reachability, privileged TUN routing, OpenVPN on Linux and Gemini access must still be verified in the deployment/client network. These tests do not establish universal site access or a production deployment.

Schema references: [Xray DNS](https://xtls.github.io/en/config/dns.html), [Xray FakeDNS](https://xtls.github.io/en/config/fakedns.html), [sing-box DNS servers](https://sing-box.sagernet.org/configuration/dns/server/), [sing-box Fake IP](https://sing-box.sagernet.org/configuration/dns/server/fakeip/), [Mihomo DNS](https://wiki.metacubex.one/en/config/dns/).
