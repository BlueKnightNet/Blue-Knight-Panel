import { queryDnsJson } from './lib/dns-wire.mjs';
import { mergeNativeSubscription } from './lib/subscription-native.mjs';
import { SS_METHODS, serveShadowsocks } from './lib/ss-websocket.mjs';
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../lib/sockets.mjs
var sockets_exports = {};
__export(sockets_exports, {
  connect: () => connect,
  default: () => sockets_default
});
import net from "node:net";
import tls from "node:tls";
import { Readable, Writable } from "node:stream";
function connect(address, options = {}) {
  let hostname, port, secure = false;
  if (typeof address === "string") {
    const parts = address.split(":");
    hostname = parts[0];
    port = parseInt(parts[1] || "80", 10);
  } else if (typeof address === "object" && address !== null) {
    hostname = address.hostname || address.host || "127.0.0.1";
    port = typeof address.port === "number" ? address.port : parseInt(address.port || "80", 10);
    secure = Boolean(address.secureTransport === "on" || address.secureTransport === "starttls");
  } else {
    throw new Error("Invalid address argument for connect()");
  }
  let sock;
  if (secure) {
    sock = tls.connect({ host: hostname, port, rejectUnauthorized: false });
  } else {
    sock = net.createConnection({ host: hostname, port });
  }
  sock.setNoDelay(true);
  const opened = new Promise((resolve, reject) => {
    sock.once("connect", () => resolve({ remoteAddress: sock.remoteAddress, remotePort: sock.remotePort }));
    sock.once("secureConnect", () => resolve({ remoteAddress: sock.remoteAddress, remotePort: sock.remotePort }));
    sock.once("error", (err) => reject(err));
  });
  const closed = new Promise((resolve) => {
    sock.once("close", (hadError) => resolve({ hadError }));
    sock.once("end", () => resolve({ hadError: false }));
  });
  const readable = Readable.toWeb(sock);
  const writable = Writable.toWeb(sock);
  return {
    opened,
    closed,
    readable,
    writable,
    close: /* @__PURE__ */ __name(() => {
      try {
        sock.destroy();
      } catch (_) {
      }
    }, "close"),
    startTls: /* @__PURE__ */ __name((tlsOptions = {}) => {
      const tlsSocket = tls.connect({
        socket: sock,
        host: hostname,
        rejectUnauthorized: false,
        ...tlsOptions
      });
      return {
        readable: Readable.toWeb(tlsSocket),
        writable: Writable.toWeb(tlsSocket)
      };
    }, "startTls")
  };
}
var sockets_default;
var init_sockets = __esm({
  "../lib/sockets.mjs"() {
    init_functionsRoutes_0_6698010974737841();
    __name(connect, "connect");
    sockets_default = { connect };
  }
});

// ../worker.js
import { Writable as Writable2 } from "node:stream";
import { EventEmitter } from "node:events";
import { Socket } from "node:net";
import { Socket as Socket2 } from "node:net";
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name2(() => {
    throw createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
function getKV(env2) {
  return env2.BK_KV ?? env2.WD_KV;
}
function generateRandomToken(length = 16) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}
function generateRandomPassword(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}
function invalidateSettingsCache() {
  cachedSettings = null;
  cachedSettingsTimestamp = 0;
}
async function getOrInitSettings(env2) {
  const now = Date.now();
  if (cachedSettings && now - cachedSettingsTimestamp < CACHE_TTL_MS) {
    return cachedSettings;
  }
  const kv = getKV(env2);
  let vlessUuid = null;
  let trojanPassword = null;
  let proxyPath = null;
  let proxyIp = null;
  let subToken = null;
  let dnsDoH = null;
  let allowLANConnectionStr = null;
  let fragmentEnabledStr = null;
  let fragmentPackets = null;
  let fragmentLength = null;
  let fragmentInterval = null;
  let routingPresetStr = null;
  let warpPrivateKey = null;
  let warpPeerPublicKey = null;
  let warpIPv6 = null;
  let warpReserved = null;
  let warpProEnabledStr = null;
  let warpAmneziaVersion = null;
  let warpNoiseCount = null;
  let warpNoiseMin = null;
  let warpNoiseMax = null;
  let warpNoiseDelay = null;
  let warpAmneziaS1 = null;
  let warpAmneziaS2 = null;
  let warpAmneziaH1 = null;
  let warpAmneziaH2 = null;
  let warpAmneziaH3 = null;
  let warpAmneziaH4 = null;
  let chainEnabledStr = null;
  let chainTypeStr = null;
  let chainAddress = null;
  let chainPortStr = null;
  let chainAuth = null;
  let chainPath = null;
  let chainSecurityStr = null;
  let chainTransportStr = null;
  let chainSni = null;
  let chainHost = null;
  let nodeShareToken = null;
  let domainFrontingEnabledStr = null;
  let frontingSni = null;
  let frontingHost = null;
  let frontingCleanIps = null;
  let staticIpList = null;
  let openvpnEnabledStr = null;
  let openvpnPort = null;
  let openvpnProto = null;
  let openvpnCipher = null;
  let anytlsFingerprint = null;
  let anytlsAlpn = null;
  let xhttpEnabledStr = null;
  let xhttpPath = null;
  let xhttpMode = null;
  let httpUpgradeEnabledStr = null;
  let ssEnabledStr = null;
  let ssPassword = null;
  let ssMethod = null;
  let dnsCustom = null;
  if (kv) {
    try {
      [
        vlessUuid,
        trojanPassword,
        proxyPath,
        proxyIp,
        subToken,
        dnsDoH,
        allowLANConnectionStr,
        fragmentEnabledStr,
        fragmentPackets,
        fragmentLength,
        fragmentInterval,
        routingPresetStr,
        warpPrivateKey,
        warpPeerPublicKey,
        warpIPv6,
        warpReserved,
        warpProEnabledStr,
        warpAmneziaVersion,
        warpNoiseCount,
        warpNoiseMin,
        warpNoiseMax,
        warpNoiseDelay,
        warpAmneziaS1,
        warpAmneziaS2,
        warpAmneziaH1,
        warpAmneziaH2,
        warpAmneziaH3,
        warpAmneziaH4,
        chainEnabledStr,
        chainTypeStr,
        chainAddress,
        chainPortStr,
        chainAuth,
        chainPath,
        chainSecurityStr,
        chainTransportStr,
        chainSni,
        chainHost,
        nodeShareToken,
        domainFrontingEnabledStr,
        frontingSni,
        frontingHost,
        frontingCleanIps,
        staticIpList,
        openvpnEnabledStr,
        openvpnPort,
        openvpnProto,
        openvpnCipher,
        anytlsFingerprint,
        anytlsAlpn,
        xhttpEnabledStr,
        xhttpPath,
        xhttpMode,
        httpUpgradeEnabledStr,
        ssEnabledStr,
        ssPassword,
        ssMethod,
        dnsCustom
      ] = await Promise.all([
        kv.get(KV_KEYS.vlessUuid),
        kv.get(KV_KEYS.trojanPassword),
        kv.get(KV_KEYS.proxyPath),
        kv.get(KV_KEYS.proxyIp),
        kv.get(KV_KEYS.subToken),
        kv.get(KV_KEYS.dnsDoH),
        kv.get(KV_KEYS.allowLANConnection),
        kv.get(KV_KEYS.fragmentEnabled),
        kv.get(KV_KEYS.fragmentPackets),
        kv.get(KV_KEYS.fragmentLength),
        kv.get(KV_KEYS.fragmentInterval),
        kv.get(KV_KEYS.routingPreset),
        kv.get(KV_KEYS.warpPrivateKey),
        kv.get(KV_KEYS.warpPeerPublicKey),
        kv.get(KV_KEYS.warpIPv6),
        kv.get(KV_KEYS.warpReserved),
        kv.get(KV_KEYS.warpProEnabled),
        kv.get(KV_KEYS.warpAmneziaVersion),
        kv.get(KV_KEYS.warpNoiseCount),
        kv.get(KV_KEYS.warpNoiseMin),
        kv.get(KV_KEYS.warpNoiseMax),
        kv.get(KV_KEYS.warpNoiseDelay),
        kv.get(KV_KEYS.warpAmneziaS1),
        kv.get(KV_KEYS.warpAmneziaS2),
        kv.get(KV_KEYS.warpAmneziaH1),
        kv.get(KV_KEYS.warpAmneziaH2),
        kv.get(KV_KEYS.warpAmneziaH3),
        kv.get(KV_KEYS.warpAmneziaH4),
        kv.get(KV_KEYS.chainEnabled),
        kv.get(KV_KEYS.chainType),
        kv.get(KV_KEYS.chainAddress),
        kv.get(KV_KEYS.chainPort),
        kv.get(KV_KEYS.chainAuth),
        kv.get(KV_KEYS.chainPath),
        kv.get(KV_KEYS.chainSecurity),
        kv.get(KV_KEYS.chainTransport),
        kv.get(KV_KEYS.chainSni),
        kv.get(KV_KEYS.chainHost),
        kv.get(KV_KEYS.nodeShareToken),
        kv.get(KV_KEYS.domainFrontingEnabled),
        kv.get(KV_KEYS.frontingSni),
        kv.get(KV_KEYS.frontingHost),
        kv.get(KV_KEYS.frontingCleanIps),
        kv.get(KV_KEYS.staticIpList),
        kv.get(KV_KEYS.openvpnEnabled),
        kv.get(KV_KEYS.openvpnPort),
        kv.get(KV_KEYS.openvpnProto),
        kv.get(KV_KEYS.openvpnCipher),
        kv.get(KV_KEYS.anytlsFingerprint),
        kv.get(KV_KEYS.anytlsAlpn),
        kv.get(KV_KEYS.xhttpEnabled),
        kv.get(KV_KEYS.xhttpPath),
        kv.get(KV_KEYS.xhttpMode),
        kv.get(KV_KEYS.httpUpgradeEnabled),
        kv.get(KV_KEYS.ssEnabled),
        kv.get(KV_KEYS.ssPassword),
        kv.get(KV_KEYS.ssMethod),
        kv.get(KV_KEYS.dnsCustom)
      ]);
    } catch (err) {
      console.warn("Could not read settings from KV:", err);
    }
  }
  const missingKeysToPersist = [];
  if (!vlessUuid || vlessUuid.trim().length === 0) {
    vlessUuid = crypto.randomUUID();
    missingKeysToPersist.push({ key: KV_KEYS.vlessUuid, value: vlessUuid });
  }
  if (!trojanPassword || trojanPassword.trim().length === 0) {
    trojanPassword = `wd_${generateRandomPassword(16)}`;
    missingKeysToPersist.push({ key: KV_KEYS.trojanPassword, value: trojanPassword });
  }
  if (!subToken || subToken.trim().length === 0) {
    subToken = generateRandomToken(16);
    missingKeysToPersist.push({ key: KV_KEYS.subToken, value: subToken });
  }
  if (!nodeShareToken || nodeShareToken.trim().length === 0) {
    nodeShareToken = generateRandomToken(24);
    missingKeysToPersist.push({ key: KV_KEYS.nodeShareToken, value: nodeShareToken });
  }
  if (missingKeysToPersist.length > 0 && kv) {
    for (const item of missingKeysToPersist) {
      try {
        await kv.put(item.key, item.value);
      } catch (saveErr) {
        console.warn(`Failed to persist initial key ${item.key} to KV:`, saveErr?.message || saveErr);
        if (saveErr?.message?.toLowerCase().includes("limit exceeded") || saveErr?.message?.toLowerCase().includes("quota")) {
          console.error("Cloudflare KV daily put limit exceeded during first-run initialization.");
          break;
        }
      }
    }
  }
  const effectiveProxyPath = proxyPath && proxyPath.trim().length > 0 ? proxyPath.trim().startsWith("/") ? proxyPath.trim() : `/${proxyPath.trim()}` : APP_CONFIG.defaultProxyPath;
  const effectiveDnsDoH = dnsDoH && dnsDoH.trim().length > 0 ? dnsDoH.trim() : APP_CONFIG.defaultDohUpstream;
  const effectiveFragmentPackets = fragmentPackets && fragmentPackets.trim().length > 0 ? fragmentPackets.trim() : "tlshello";
  const effectiveFragmentLength = fragmentLength && fragmentLength.trim().length > 0 ? fragmentLength.trim() : "100-200";
  const effectiveFragmentInterval = fragmentInterval && fragmentInterval.trim().length > 0 ? fragmentInterval.trim() : "10-20";
  const validRoutingPresets = ["off", "bypass-iran", "bypass-cn", "block-ads"];
  const routingPreset = routingPresetStr && validRoutingPresets.includes(routingPresetStr) ? routingPresetStr : "off";
  const effectiveWarpPeerKey = warpPeerPublicKey && warpPeerPublicKey.trim().length > 0 ? warpPeerPublicKey.trim() : APP_CONFIG.defaultWarpPeerPublicKey;
  const validChainTypes = ["vless", "trojan", "ss", "socks", "http"];
  const chainType = chainTypeStr && validChainTypes.includes(chainTypeStr) ? chainTypeStr : "socks";
  const chainPort = chainPortStr ? parseInt(chainPortStr, 10) || 1080 : 1080;
  const settings = {
    vlessUuid: vlessUuid.trim(),
    trojanPassword: trojanPassword.trim(),
    proxyPath: effectiveProxyPath,
    proxyIp: proxyIp ? proxyIp.trim() : "",
    subToken: subToken.trim(),
    dnsDoH: effectiveDnsDoH,
    allowLANConnection: allowLANConnectionStr === "true",
    fragmentEnabled: fragmentEnabledStr === "true",
    fragmentPackets: effectiveFragmentPackets,
    fragmentLength: effectiveFragmentLength,
    fragmentInterval: effectiveFragmentInterval,
    routingPreset,
    warpPrivateKey: warpPrivateKey ? warpPrivateKey.trim() : "",
    warpPeerPublicKey: effectiveWarpPeerKey,
    warpIPv6: warpIPv6 ? warpIPv6.trim() : "",
    warpReserved: warpReserved ? warpReserved.trim() : "",
    // Warp Pro
    warpProEnabled: warpProEnabledStr === "true",
    warpAmneziaVersion: warpAmneziaVersion ? warpAmneziaVersion.trim() : "2",
    warpNoiseCount: warpNoiseCount ? warpNoiseCount.trim() : "5",
    warpNoiseMin: warpNoiseMin ? warpNoiseMin.trim() : "10",
    warpNoiseMax: warpNoiseMax ? warpNoiseMax.trim() : "50",
    warpNoiseDelay: warpNoiseDelay ? warpNoiseDelay.trim() : "20",
    warpAmneziaS1: warpAmneziaS1 ? warpAmneziaS1.trim() : "15",
    warpAmneziaS2: warpAmneziaS2 ? warpAmneziaS2.trim() : "25",
    warpAmneziaH1: warpAmneziaH1 ? warpAmneziaH1.trim() : "1",
    warpAmneziaH2: warpAmneziaH2 ? warpAmneziaH2.trim() : "2",
    warpAmneziaH3: warpAmneziaH3 ? warpAmneziaH3.trim() : "3",
    warpAmneziaH4: warpAmneziaH4 ? warpAmneziaH4.trim() : "4",
    // Chain Proxy
    chainEnabled: chainEnabledStr === "true",
    chainType,
    chainAddress: chainAddress ? chainAddress.trim() : "",
    chainPort,
    chainAuth: chainAuth ? chainAuth.trim() : "",
    chainPath: chainPath ? chainPath.trim() : "",
    chainSecurity: chainSecurityStr === "tls" ? "tls" : "none",
    chainTransport: chainTransportStr === "ws" ? "ws" : "tcp",
    chainSni: chainSni ? chainSni.trim() : "",
    chainHost: chainHost ? chainHost.trim() : "",
    // Node Share
    nodeShareToken: nodeShareToken.trim(),
    // New Feature Defaults
    domainFrontingEnabled: domainFrontingEnabledStr === "true",
    frontingSni: frontingSni ? frontingSni.trim() : "cdnjs.cloudflare.com",
    frontingHost: frontingHost ? frontingHost.trim() : "",
    frontingCleanIps: frontingCleanIps ? frontingCleanIps.trim() : "104.16.1.1,104.19.241.93,172.67.180.1,162.159.138.6",
    staticIpList: staticIpList ? staticIpList.trim() : "",
    openvpnEnabled: openvpnEnabledStr !== "false",
    openvpnPort: openvpnPort ? openvpnPort.trim() : "443",
    openvpnProto: openvpnProto ? openvpnProto.trim() : "tcp",
    openvpnCipher: openvpnCipher ? openvpnCipher.trim() : "AES-256-GCM",
    anytlsFingerprint: anytlsFingerprint ? anytlsFingerprint.trim() : "chrome",
    anytlsAlpn: anytlsAlpn ? anytlsAlpn.trim() : "h2,http/1.1",
    xhttpEnabled: xhttpEnabledStr !== "false",
    xhttpPath: xhttpPath ? xhttpPath.trim() : "/bk-xhttp",
    xhttpMode: xhttpMode ? xhttpMode.trim() : "stream-one",
    httpUpgradeEnabled: httpUpgradeEnabledStr !== "false",
    ssEnabled: ssEnabledStr !== "false",
    ssPassword: ssPassword ? ssPassword.trim() : "BlueKnight-" + (vlessUuid ? vlessUuid.slice(0, 8) : "Pass2026"),
    ssMethod: ssMethod ? ssMethod.trim() : "chacha20-ietf-poly1305",
    dnsCustom: dnsCustom ? dnsCustom.trim() : ""
  };
  cachedSettings = settings;
  cachedSettingsTimestamp = now;
  return settings;
}
function handleHealth(request, env2) {
  const healthData = {
    ok: true,
    name: "BlueKnight",
    version: APP_CONFIG.version,
    tagline: APP_CONFIG.tagline,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    status: "healthy"
  };
  return new Response(JSON.stringify(healthData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}
async function handleProxyDebug(request, env2) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const settings = await getOrInitSettings(env2);
  if (!token || !constantTimeEquals(token, settings.subToken)) {
    return new Response(
      JSON.stringify(
        {
          error: "Unauthorized",
          message: "A valid ?token=<subToken> query parameter is required."
        },
        null,
        2
      ),
      {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      }
    );
  }
  const debugData = {
    ok: true,
    version: APP_CONFIG.version,
    proxyPath: settings.proxyPath,
    uuidPrefix8: settings.vlessUuid.slice(0, 8),
    earlyDataSupported: true,
    ports: [443, 2053, 2083, 2087, 2096, 8443]
  };
  return new Response(JSON.stringify(debugData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
function unusable(name, prop = "algorithm.name") {
  return new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
}
function isAlgorithm(algorithm, name) {
  return algorithm.name === name;
}
function getHashLength(hash) {
  return parseInt(hash.name.slice(4), 10);
}
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
function checkUsage(key, usages) {
  if (usages.length && !usages.some((expected) => key.usages.includes(expected))) {
    let msg = "CryptoKey does not support this operation, its usages must include ";
    if (usages.length > 2) {
      const last = usages.pop();
      msg += `one of ${usages.join(", ")}, or ${last}.`;
    } else if (usages.length === 2) {
      msg += `one of ${usages[0]} or ${usages[1]}.`;
    } else {
      msg += `${usages[0]}.`;
    }
    throw new TypeError(msg);
  }
}
function checkSigCryptoKey(key, alg, ...usages) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "EdDSA": {
      if (key.algorithm.name !== "Ed25519" && key.algorithm.name !== "Ed448") {
        throw unusable("Ed25519 or Ed448");
      }
      break;
    }
    case "Ed25519": {
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usages);
}
function message(msg, actual, ...types2) {
  types2 = types2.filter(Boolean);
  if (types2.length > 2) {
    const last = types2.pop();
    msg += `one of type ${types2.join(", ")}, or ${last}.`;
  } else if (types2.length === 2) {
    msg += `one of type ${types2[0]} or ${types2[1]}.`;
  } else {
    msg += `of type ${types2[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
function withAlg(alg, actual, ...types2) {
  return message(`Key for the ${alg} algorithm must be `, actual, ...types2);
}
function isObjectLike(value) {
  return typeof value === "object" && value !== null;
}
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}
function isJWK(key) {
  return isObject(key) && typeof key.kty === "string";
}
function isPrivateJWK(key) {
  return key.kty !== "oct" && typeof key.d === "string";
}
function isPublicJWK(key) {
  return key.kty !== "oct" && typeof key.d === "undefined";
}
function isSecretJWK(key) {
  return isJWK(key) && key.kty === "oct" && typeof key.k === "string";
}
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
          algorithm = { name: "ECDSA", namedCurve: "P-256" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES384":
          algorithm = { name: "ECDSA", namedCurve: "P-384" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES512":
          algorithm = { name: "ECDSA", namedCurve: "P-521" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "EdDSA":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
async function importJWK(jwk, alg) {
  if (!isObject(jwk)) {
    throw new TypeError("JWK must be an object");
  }
  alg || (alg = jwk.alg);
  switch (jwk.kty) {
    case "oct":
      if (typeof jwk.k !== "string" || !jwk.k) {
        throw new TypeError('missing "k" (Key Value) Parameter value');
      }
      return decode(jwk.k);
    case "RSA":
      if ("oth" in jwk && jwk.oth !== void 0) {
        throw new JOSENotSupported('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');
      }
    case "EC":
    case "OKP":
      return jwk_to_key_default({ ...jwk, alg });
    default:
      throw new JOSENotSupported('Unsupported "kty" (Key Type) Parameter value');
  }
}
function checkKeyType(allowJwk, alg, key, usage) {
  const symmetric = alg.startsWith("HS") || alg === "dir" || alg.startsWith("PBES2") || /^A\d{3}(?:GCM)?KW$/.test(alg);
  if (symmetric) {
    symmetricTypeCheck(alg, key, usage, allowJwk);
  } else {
    asymmetricTypeCheck(alg, key, usage, allowJwk);
  }
}
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}
function subtleDsa(alg, algorithm) {
  const hash = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return { hash, name: "HMAC" };
    case "PS256":
    case "PS384":
    case "PS512":
      return { hash, name: "RSA-PSS", saltLength: alg.slice(-3) >> 3 };
    case "RS256":
    case "RS384":
    case "RS512":
      return { hash, name: "RSASSA-PKCS1-v1_5" };
    case "ES256":
    case "ES384":
    case "ES512":
      return { hash, name: "ECDSA", namedCurve: algorithm.namedCurve };
    case "Ed25519":
      return { name: "Ed25519" };
    case "EdDSA":
      return { name: algorithm.name };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}
async function getCryptoKey(alg, key, usage) {
  if (usage === "sign") {
    key = await normalize_key_default.normalizePrivateKey(key, alg);
  }
  if (usage === "verify") {
    key = await normalize_key_default.normalizePublicKey(key, alg);
  }
  if (isCryptoKey(key)) {
    checkSigCryptoKey(key, alg, usage);
    return key;
  }
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalid_key_input_default(key, ...types));
    }
    return webcrypto_default.subtle.importKey("raw", key, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
  }
  throw new TypeError(invalid_key_input_default(key, ...types, "Uint8Array", "JSON Web Key"));
}
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== void 0 && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== void 0 && !isObject(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!is_disjoint_default(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validate_crit_default(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validate_algorithms_default("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
    checkKeyTypeWithJwk(alg, key, "verify");
    if (isJWK(key)) {
      key = await importJWK(key, alg);
    }
  } else {
    checkKeyTypeWithJwk(alg, key, "verify");
  }
  const data = concat(encoder.encode(jws.protected ?? ""), encoder.encode("."), typeof jws.payload === "string" ? encoder.encode(jws.payload) : jws.payload);
  let signature;
  try {
    signature = decode(jws.signature);
  } catch {
    throw new JWSInvalid("Failed to base64url decode the signature");
  }
  const verified = await verify_default(alg, key, signature, data);
  if (!verified) {
    throw new JWSSignatureVerificationFailed();
  }
  let payload;
  if (b64) {
    try {
      payload = decode(jws.payload);
    } catch {
      throw new JWSInvalid("Failed to base64url decode the payload");
    }
  } else if (typeof jws.payload === "string") {
    payload = encoder.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key };
  }
  return result;
}
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = jwt_claims_set_default(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
function validateInput(label, input) {
  if (!Number.isFinite(input)) {
    throw new TypeError(`Invalid ${label} input`);
  }
  return input;
}
async function getJwtSecret(env2) {
  if (cachedJwtSecret) {
    return cachedJwtSecret;
  }
  if (env2.JWT_SECRET && env2.JWT_SECRET.trim().length > 0) {
    cachedJwtSecret = env2.JWT_SECRET.trim();
    return cachedJwtSecret;
  }
  const kv = getKV(env2);
  if (kv) {
    try {
      const stored = await kv.get(KV_KEYS.jwtSecret);
      if (stored && stored.trim().length >= 32) {
        cachedJwtSecret = stored.trim();
        return cachedJwtSecret;
      }
      const randomBytes = new Uint8Array(36);
      crypto.getRandomValues(randomBytes);
      const generated = Array.from(randomBytes, (b) => b.toString(16).padStart(2, "0")).join("");
      try {
        await kv.put(KV_KEYS.jwtSecret, generated);
      } catch (putErr) {
        console.warn("Could not persist JWT secret to KV:", putErr?.message || putErr);
        if (putErr?.message?.toLowerCase().includes("limit exceeded") || putErr?.message?.toLowerCase().includes("quota")) {
          console.error("Cloudflare KV daily put limit exceeded when writing JWT secret.");
        }
      }
      cachedJwtSecret = generated;
      return cachedJwtSecret;
    } catch (err) {
      console.warn("Could not read or initialize JWT secret in KV:", err);
    }
  }
  // No KV and no JWT_SECRET. The old code signed sessions with a constant
  // baked into this file, so anyone reading the source could mint a valid
  // admin cookie for any such deployment. Derive one from PANEL_PASSWORD
  // instead: deterministic (so every isolate agrees and sessions survive a
  // cold start) but not knowable from the published source.
  if (env2.PANEL_PASSWORD && env2.PANEL_PASSWORD.trim().length > 0) {
    console.warn("\u26A0\uFE0F KV unavailable for JWT secret persistence. Deriving the signing key from PANEL_PASSWORD; set JWT_SECRET explicitly for a stable, independent key.");
    const material = new TextEncoder().encode(`blueknight-jwt-derivation-v1:${env2.PANEL_PASSWORD.trim()}`);
    const digest = await crypto.subtle.digest("SHA-256", material);
    cachedJwtSecret = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    return cachedJwtSecret;
  }
  // Nothing to derive from. Fail closed rather than fall back to a public
  // constant: a thrown error is a broken login, a shared secret is an open panel.
  throw new Error("No JWT signing key available: configure a KV namespace (BK_KV), or set JWT_SECRET, or set PANEL_PASSWORD.");
}
function getSecretKey(secret) {
  if (!secret) throw new Error("Refusing to sign or verify a session with an empty key.");
  return new TextEncoder().encode(secret);
}
async function createSessionToken(user = "admin", secretOrEnv) {
  const secret = typeof secretOrEnv === "string" ? secretOrEnv : await getJwtSecret(secretOrEnv);
  const key = getSecretKey(secret);
  return await new SignJWT({ user }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${APP_CONFIG.sessionMaxAgeSeconds}s`).sign(key);
}
async function verifySessionToken(token, secretOrEnv) {
  try {
    const secret = typeof secretOrEnv === "string" ? secretOrEnv : await getJwtSecret(secretOrEnv);
    const key = getSecretKey(secret);
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"]
    });
    return {
      user: String(payload.user || "admin"),
      iat: payload.iat,
      exp: payload.exp
    };
  } catch {
    return null;
  }
}
function parseCookies(request) {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader)
    return {};
  const cookies = {};
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [name, ...rest] = pair.trim().split("=");
    if (name) {
      cookies[name] = rest.join("=");
    }
  }
  return cookies;
}
function getSessionCookie(request) {
  const cookies = parseCookies(request);
  return cookies[APP_CONFIG.cookieName] || cookies[APP_CONFIG.legacyCookieName];
}
function createSessionCookie(token, isSecure = false) {
  const secureFlag = isSecure ? " Secure;" : "";
  return `${APP_CONFIG.cookieName}=${token}; Path=/; Max-Age=${APP_CONFIG.sessionMaxAgeSeconds}; HttpOnly; SameSite=Lax;${secureFlag}`;
}
function createClearCookie() {
  return `${APP_CONFIG.cookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax;`;
}
// Every value that reaches an HTML template from a request, a header or KV has
// to come through here. Without it, /panel/login?error=<img src=x onerror=...>
// ran attacker script on the panel's own origin: the session cookie is
// HttpOnly, but script on that page can rewrite the login form and read the
// admin password straight out of the input as it is typed.
// Applied to every response the worker returns. A WebSocket upgrade (101) has
// an immutable header list and carries no document, so it is passed straight
// through; so is anything already streaming proxy bytes.
function withSecurityHeaders(response) {
  if (!response || response.status === 101 || response.webSocket) {
    return response;
  }
  const headers = new Headers(response.headers);
  // Clickjacking: the panel has one-click destructive controls.
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  // Subscription and node-share URLs carry their token in the query string, so
  // a Referer on any outbound link would hand that token to a third party.
  headers.set("Referrer-Policy", "no-referrer");
  const isHtml = (headers.get("Content-Type") || "").includes("text/html");
  if (isHtml) {
    // 'unsafe-inline' is unavoidable while the markup uses inline onclick=
    // handlers and a <style> block. The value of this policy is in the other
    // directives: form-action stops an injected script from retargeting the
    // login form at an attacker's host, connect-src/script-src stop it loading
    // or phoning out to one, and base-uri stops <base> hijacking.
    headers.set("Content-Security-Policy", [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "form-action 'self'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "object-src 'none'"
    ].join("; "));
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"'`]/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "`": "&#96;"
  })[ch]);
}
// Comparison whose duration does not depend on how many leading characters
// match, so a remote caller cannot recover a secret byte by byte.
// Note the length check still leaks the length; that is accepted here because
// every secret compared with this is fixed-length or user-chosen.
function constantTimeEquals(a, b) {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
function invalidatePasswordCache() {
  cachedPasswordConfigured = null;
  cachedAdminPassword = null;
}
async function hasConfiguredPassword(env2) {
  if (env2.PANEL_PASSWORD && env2.PANEL_PASSWORD.trim().length > 0) {
    return true;
  }
  if (cachedPasswordConfigured !== null) {
    return cachedPasswordConfigured;
  }
  const kv = getKV(env2);
  if (kv) {
    try {
      const kvPassword = await kv.get(KV_KEYS.adminPassword);
      if (kvPassword && kvPassword.trim().length > 0) {
        cachedAdminPassword = kvPassword.trim();
        cachedPasswordConfigured = true;
        return true;
      }
    } catch (err) {
      console.warn("Could not check password from KV:", err);
    }
  }
  cachedPasswordConfigured = false;
  return false;
}
async function getExpectedPassword(env2) {
  if (cachedAdminPassword) {
    return { password: cachedAdminPassword, isConfigured: true };
  }
  const kv = getKV(env2);
  if (kv) {
    try {
      const kvPassword = await kv.get(KV_KEYS.adminPassword);
      if (kvPassword && kvPassword.trim().length > 0) {
        cachedAdminPassword = kvPassword.trim();
        cachedPasswordConfigured = true;
        return { password: cachedAdminPassword, isConfigured: true };
      }
    } catch (err) {
      console.warn("Could not read password from KV:", err);
    }
  }
  if (env2.PANEL_PASSWORD && env2.PANEL_PASSWORD.trim().length > 0) {
    cachedAdminPassword = env2.PANEL_PASSWORD.trim();
    cachedPasswordConfigured = true;
    return { password: cachedAdminPassword, isConfigured: true };
  }
  return { isConfigured: false };
}
// Stored-credential format: pbkdf2$<iterations>$<salt b64>$<hash b64>.
// The admin password used to sit in KV as cleartext, so anyone who could read
// the namespace -- a dashboard session, a KV dump, a leaked binding -- read the
// password itself, and people reuse passwords.
var PBKDF2_ITERATIONS = 21e4;
var PBKDF2_PREFIX = "pbkdf2$";
function bytesToB64(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function derivePasswordHash(password, salt, iterations = PBKDF2_ITERATIONS) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256
  );
  return new Uint8Array(bits);
}
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt);
  return `${PBKDF2_PREFIX}${PBKDF2_ITERATIONS}$${bytesToB64(salt)}$${bytesToB64(hash)}`;
}
function isHashedPassword(stored) {
  return typeof stored === "string" && stored.startsWith(PBKDF2_PREFIX);
}
async function verifyPasswordHash(submitted, stored) {
  try {
    const [, iterStr, saltB64, hashB64] = stored.split("$");
    const iterations = Number(iterStr);
    if (!Number.isFinite(iterations) || iterations < 1e4) return false;
    const derived = await derivePasswordHash(submitted, b64ToBytes(saltB64), iterations);
    return constantTimeEquals(bytesToB64(derived), hashB64);
  } catch {
    return false;
  }
}
async function verifyPassword(submitted, env2) {
  if (!submitted)
    return false;
  const { password, isConfigured } = await getExpectedPassword(env2);
  if (!isConfigured || !password) {
    return false;
  }
  const candidate = submitted.trim();
  if (isHashedPassword(password)) {
    return await verifyPasswordHash(candidate, password);
  }
  // Legacy cleartext record (or a cleartext PANEL_PASSWORD env var). Accept it,
  // then upgrade the KV copy in place so the cleartext does not survive the
  // next login.
  const ok = constantTimeEquals(candidate, password);
  if (ok) {
    const kv = getKV(env2);
    if (kv) {
      try {
        const stored = await kv.get(KV_KEYS.adminPassword);
        if (stored && !isHashedPassword(stored)) {
          const upgraded = await hashPassword(candidate);
          await kv.put(KV_KEYS.adminPassword, upgraded);
          cachedAdminPassword = upgraded;
        }
      } catch (err) {
        console.warn("Could not upgrade stored password to a hash:", err?.message || err);
      }
    }
  }
  return ok;
}
async function setPassword(newPassword, env2) {
  if (!newPassword || newPassword.trim().length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }
  const kv = getKV(env2);
  if (!kv) {
    throw new Error("KV binding (BK_KV or WD_KV) is not available");
  }
  try {
    // Never the cleartext: KV holds only the PBKDF2 record.
    const record = await hashPassword(newPassword.trim());
    await kv.put(KV_KEYS.adminPassword, record);
    cachedAdminPassword = record;
    cachedPasswordConfigured = true;
    return true;
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.toLowerCase().includes("limit exceeded") || msg.toLowerCase().includes("quota")) {
      throw new Error("KV write quota exceeded \u2014 try again after daily reset");
    }
    throw new Error(`Failed to save password to KV: ${msg}`);
  }
}
function renderPageLayout(options) {
  return `<!DOCTYPE html>
<html lang="en" id="htmlRoot">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>${options.title} - BlueKnight Panel</title>
  <script>
    (function() {
      try {
        var THEMES = ['theme-1', 'theme-2', 'theme-3', 'theme-4', 'theme-5', 'theme-6', 'theme-7', 'theme-8', 'theme-9', 'theme-10'];
        var params = new URLSearchParams(window.location.search);
        var isNewLogin = params.get('login') === 'success' || params.get('setup') === 'success';
        var currentTheme = sessionStorage.getItem('blueknight-current-session-theme');
        if (!currentTheme || isNewLogin) {
          var lastLoginTheme = localStorage.getItem('blueknight-last-login-theme');
          var candidates = THEMES.filter(function(t) { return t !== lastLoginTheme; });
          var picked = candidates[Math.floor(Math.random() * candidates.length)] || THEMES[0];
          currentTheme = picked;
          sessionStorage.setItem('blueknight-current-session-theme', currentTheme);
          localStorage.setItem('blueknight-last-login-theme', currentTheme);
          localStorage.setItem('blueknight-current-session-theme', currentTheme);
        }
        document.documentElement.setAttribute('data-theme', currentTheme);
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'theme-1');
      }
    })();
  <\/script>
  <style>
    ${BASE_STYLES}
  </style>
</head>
<body>
  ${options.content}

  <div id="toast" class="toast-msg">
    <span>\u2728 Copied to clipboard!</span>
  </div>

  <!-- Responsive QR Code Modal -->
  <div id="qrModal" class="modal-backdrop" onclick="closeQrModal(event)">
    <div class="modal-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 id="qrModalTitle" style="font-size: 15px; font-family: 'Quicksand', sans-serif;">Subscription QR Code</h3>
        <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('qrModal').classList.remove('show')">\u2715</button>
      </div>
      <div style="text-align: center; padding: 6px;">
        <img id="qrModalImg" src="" alt="QR Code" style="max-width: 200px; width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 0 auto; display: block;" />
        <p style="font-size: 11px; color: var(--theme-text-muted); margin-top: 10px; word-break: break-all; font-family: 'JetBrains Mono', monospace; max-height: 60px; overflow-y: auto;" id="qrModalUrl"></p>
      </div>
    </div>
  </div>

  <script>
    // Initialize RTL from localStorage
    (function initRtl() {
      const savedDir = localStorage.getItem('wd_direction') || 'ltr';
      document.getElementById('htmlRoot').setAttribute('dir', savedDir);
      updateRtlButtons(savedDir);
    })();

    function toggleRtl() {
      const html = document.getElementById('htmlRoot');
      const current = html.getAttribute('dir') || 'ltr';
      const next = current === 'rtl' ? 'ltr' : 'rtl';
      html.setAttribute('dir', next);
      localStorage.setItem('wd_direction', next);
      updateRtlButtons(next);
      showToast(next === 'rtl' ? 'RTL Layout Activated' : 'LTR Layout Activated');
    }

    function updateRtlButtons(dir) {
      const btns = document.querySelectorAll('.rtl-toggle-btn');
      btns.forEach(b => {
        b.textContent = dir === 'rtl' ? 'LTR \u21C4' : 'RTL \u21C4';
      });
    }

    function toggleSidebar() {
      const sidebar = document.getElementById('appSidebar');
      const backdrop = document.getElementById('drawerBackdrop');
      if (sidebar && backdrop) {
        const isOpen = sidebar.classList.toggle('open');
        backdrop.classList.toggle('show', isOpen);
      }
    }

    function closeSidebar() {
      const sidebar = document.getElementById('appSidebar');
      const backdrop = document.getElementById('drawerBackdrop');
      if (sidebar && backdrop) {
        sidebar.classList.remove('open');
        backdrop.classList.remove('show');
      }
    }

    function showQrModal(title, url) {
      const modal = document.getElementById('qrModal');
      const titleEl = document.getElementById('qrModalTitle');
      const imgEl = document.getElementById('qrModalImg');
      const urlEl = document.getElementById('qrModalUrl');
      if (titleEl) titleEl.textContent = title;
      if (urlEl) urlEl.textContent = url;
      if (imgEl) imgEl.src = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encodeURIComponent(url);
      if (modal) modal.classList.add('show');
    }

    function closeQrModal(e) {
      if (e.target.id === 'qrModal') {
        document.getElementById('qrModal').classList.remove('show');
      }
    }

    function showToast(text) {
      const toast = document.getElementById('toast');
      if (text) {
        toast.innerHTML = '<span>\u2728 ' + text + '</span>';
      }
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2400);
    }

    function copyToClipboard(text) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
          showToast('Copied to clipboard!');
        }).catch(() => fallbackCopy(text));
      } else {
        fallbackCopy(text);
      }
    }

    function fallbackCopy(text) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showToast('Copied to clipboard!');
      } catch (err) {
        alert('Failed to copy');
      }
      document.body.removeChild(textArea);
    }

    function setBlueKnightTheme(themeId) {
      if (!themeId) return;
      document.documentElement.setAttribute('data-theme', themeId);
      try {
        sessionStorage.setItem('blueknight-current-session-theme', themeId);
        localStorage.setItem('blueknight-last-login-theme', themeId);
        localStorage.setItem('blueknight-current-session-theme', themeId);
      } catch (e) {}
      const sels = document.querySelectorAll('.theme-selector-dropdown');
      sels.forEach(s => {
        if (s.value !== themeId) s.value = themeId;
      });
      showToast('Theme updated: ' + themeId);
    }

    function randomizeBlueKnightTheme() {
      const themes = ['theme-1', 'theme-2', 'theme-3', 'theme-4', 'theme-5', 'theme-6', 'theme-7', 'theme-8', 'theme-9', 'theme-10'];
      const current = document.documentElement.getAttribute('data-theme') || 'theme-1';
      const candidates = themes.filter(function(t) { return t !== current; });
      const next = candidates[Math.floor(Math.random() * candidates.length)] || 'theme-1';
      setBlueKnightTheme(next);
    }

    window.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeSidebar();
        const qrModal = document.getElementById('qrModal');
        if (qrModal) qrModal.classList.remove('show');
      }
    });

    (function syncThemeUI() {
      const current = document.documentElement.getAttribute('data-theme') || 'theme-1';
      const sels = document.querySelectorAll('.theme-selector-dropdown');
      sels.forEach(s => {
        s.value = current;
      });
    })();
  <\/script>
</body>
</html>`;
}
function renderLoginPage(options) {
  const errorAlert = options.error ? `
    <div style="background: rgba(254, 226, 226, 0.9); border: 1.5px solid #FDA4AF; color: #991B1B; padding: 10px 14px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px;">
      <span>\u{1F338}</span>
      <span>${escapeHtml(options.error)}</span>
    </div>` : "";
  const defaultHint = options.isDefaultPassword ? `
    <div style="background: var(--theme-primary-soft); border: 1px dashed var(--theme-border-hover); color: var(--theme-primary); padding: 10px 14px; border-radius: 10px; margin-top: 18px; font-size: 12px; text-align: center;">
      <span>\u{1F4A1} Default dev password is: <strong>${APP_CONFIG.defaultDevPassword}</strong></span>
    </div>` : "";
  const content = `
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px;">
    <div class="card" style="width: 100%; max-width: 400px; padding: 30px 24px; border-radius: 18px; position: relative; overflow: hidden; box-shadow: 0 20px 48px -10px var(--theme-shadow), 0 0 24px var(--theme-glow);">
      
      <!-- Top Pastel Arc -->
      <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary), var(--theme-accent));"></div>

      <!-- Mascot & Brand Title -->
      <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 22px;">
        <div style="margin-bottom: 10px; filter: drop-shadow(0 6px 14px var(--theme-glow));">
          ${MASCOT_SVG}
        </div>
        <h1 style="font-size: 22px; color: var(--theme-text-primary); margin-bottom: 4px;">BlueKnight Panel</h1>
        <p style="color: var(--theme-text-muted); font-size: 13px;">Welcome back, Master! Please enter your key \u{1F338}</p>
        
        <div style="display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap; justify-content: center;">
          <span class="badge badge-sky">\u2728 v${APP_CONFIG.version} Ethereal Cloud</span>
          <div class="theme-pill-control" style="padding: 2px 8px;">
            <select class="theme-selector-dropdown" onchange="setBlueKnightTheme(this.value)">
              <option value="theme-1">Theme 1</option>
              <option value="theme-2">Theme 2</option>
              <option value="theme-3">Theme 3</option>
              <option value="theme-4">Theme 4</option>
              <option value="theme-5">Theme 5</option>
              <option value="theme-6">Theme 6</option>
              <option value="theme-7">Theme 7</option>
              <option value="theme-8">Theme 8</option>
              <option value="theme-9">Theme 9</option>
              <option value="theme-10">Theme 10</option>
            </select>
            <button type="button" class="theme-dice-btn" onclick="randomizeBlueKnightTheme()" title="Randomize Theme" style="width: 20px; height: 20px; font-size: 10px;">\u{1F3B2}</button>
          </div>
        </div>
      </div>

      ${errorAlert}

      <form action="/panel/login" method="POST">
        <div class="form-group">
          <label class="form-label" for="password">Panel Password</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            class="form-control" 
            placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" 
            required 
            autofocus
            style="letter-spacing: 2px; height: 42px;"
          />
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; height: 42px; font-size: 14.5px; margin-top: 6px;">
          <span>Unlock BlueKnight</span>
          <span>\u{1F6E1}\uFE0F\u2728</span>
        </button>
      </form>

      ${defaultHint}

      <div style="margin-top: 22px; text-align: center; font-size: 11.5px; color: var(--theme-text-muted);">
        BlueKnight Panel &bull; Encrypted DNS &amp; Proxy Dashboard
        <div style="margin-top: 8px;">
          <a href="${APP_CONFIG.telegramChannel}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; color: var(--theme-primary);">
            <span>📢</span><span>@BlueKnight_Net on Telegram</span>
          </a>
        </div>
      </div>

    </div>
  </div>
  `;
  return renderPageLayout({
    title: "Login",
    content
  });
}
function renderSetupPage(options) {
  const errorAlert = options.error ? `
    <div style="background: rgba(254, 226, 226, 0.9); border: 1.5px solid #FDA4AF; color: #991B1B; padding: 10px 14px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px;">
      <span>\u{1F338}</span>
      <span>${escapeHtml(options.error)}</span>
    </div>` : "";
  const content = `
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px;">
    <div class="card" style="width: 100%; max-width: 420px; padding: 30px 24px; border-radius: 18px; position: relative; overflow: hidden; box-shadow: 0 20px 48px -10px var(--theme-shadow), 0 0 24px var(--theme-glow);">
      
      <!-- Top Pastel Arc -->
      <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary), var(--theme-accent));"></div>

      <!-- Mascot & Brand Title -->
      <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 20px;">
        <div style="margin-bottom: 10px; filter: drop-shadow(0 6px 14px var(--theme-glow));">
          ${MASCOT_SVG}
        </div>
        <h1 style="font-size: 22px; color: var(--theme-text-primary); margin-bottom: 4px;">BlueKnight Setup</h1>
        <p style="color: var(--theme-text-muted); font-size: 13px;">Create administrator password to secure instance \u{1F338}</p>
        <div style="margin-top: 8px;">
          <span class="badge badge-sky">\u2728 First-Run Setup &bull; v${APP_CONFIG.version}</span>
        </div>
      </div>

      ${errorAlert}

      <div style="background: var(--theme-primary-soft); border: 1px dashed var(--theme-border-hover); color: var(--theme-text-primary); padding: 10px 14px; border-radius: 10px; margin-bottom: 18px; font-size: 12px; line-height: 1.45;">
        <span>\u{1F4A1} <strong>Private KV Storage:</strong> Password is stored in your private KV (<code>WD_KV</code> or <code>BK_KV</code>).</span>
      </div>

      <form action="/panel/setup" method="POST">
        <div class="form-group">
          <label class="form-label" for="password">Create Password</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            class="form-control" 
            placeholder="At least 8 characters" 
            required 
            minlength="8"
            autofocus
            style="letter-spacing: 1px; height: 40px;"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="confirmPassword">Confirm Password</label>
          <input 
            type="password" 
            id="confirmPassword" 
            name="confirmPassword" 
            class="form-control" 
            placeholder="Repeat password exactly" 
            required 
            minlength="8"
            style="letter-spacing: 1px; height: 40px;"
          />
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; height: 42px; font-size: 14.5px; margin-top: 8px;">
          <span>Complete Setup &amp; Unlock</span>
          <span>\u{1F6E1}\uFE0F\u2728</span>
        </button>
      </form>

      <div style="margin-top: 22px; text-align: center; font-size: 11.5px; color: var(--theme-text-muted);">
        BlueKnight Panel &bull; Encrypted DNS &amp; Proxy Dashboard
        <div style="margin-top: 8px;">
          <a href="${APP_CONFIG.telegramChannel}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; color: var(--theme-primary);">
            <span>📢</span><span>@BlueKnight_Net on Telegram</span>
          </a>
        </div>
      </div>

    </div>
  </div>
  `;
  return renderPageLayout({
    title: "First-Run Setup",
    content
  });
}
async function handleSetup(request, env2) {
  const url = new URL(request.url);
  const isConfigured = await hasConfiguredPassword(env2);
  if (isConfigured) {
    const cookies = parseCookies(request);
    const existingToken = cookies[APP_CONFIG.cookieName];
    if (existingToken && await verifySessionToken(existingToken, env2)) {
      return Response.redirect(`${url.origin}/panel`, 302);
    }
    return Response.redirect(`${url.origin}/panel/login`, 302);
  }
  if (request.method === "POST") {
    let password = "";
    let confirmPassword = "";
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      password = String(formData.get("password") || "").trim();
      confirmPassword = String(formData.get("confirmPassword") || "").trim();
    } else if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      password = String(body.password || "").trim();
      confirmPassword = String(body.confirmPassword || "").trim();
    }
    if (!password || password.length < 8) {
      const html2 = renderSetupPage({ error: "Password must be at least 8 characters long." });
      return new Response(html2, { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (password !== confirmPassword) {
      const html2 = renderSetupPage({ error: "Passwords do not match. Please verify and re-enter." });
      return new Response(html2, { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    try {
      await setPassword(password, env2);
      const token = await createSessionToken("admin", env2);
      const isSecure = url.protocol === "https:";
      const cookieHeader = createSessionCookie(token, isSecure);
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/panel?setup=success",
          "Set-Cookie": cookieHeader
        }
      });
    } catch (err) {
      const html2 = renderSetupPage({ error: err.message || "Failed to save password to KV." });
      return new Response(html2, { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
  }
  const html = renderSetupPage({});
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
async function handleLogin(request, env2) {
  const url = new URL(request.url);
  const isConfigured = await hasConfiguredPassword(env2);
  if (!isConfigured) {
    if (request.method === "POST") {
      return await handleSetup(request, env2);
    }
    const html2 = renderSetupPage({});
    return new Response(html2, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
  const cookies = parseCookies(request);
  const existingToken = cookies[APP_CONFIG.cookieName];
  if (existingToken) {
    const session = await verifySessionToken(existingToken, env2);
    if (session) {
      return Response.redirect(`${url.origin}/panel`, 302);
    }
  }
  if (request.method === "POST") {
    let submittedPassword = "";
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      submittedPassword = String(formData.get("password") || "");
    } else if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      submittedPassword = String(body.password || "");
    }
    const isValid = await verifyPassword(submittedPassword, env2);
    if (isValid) {
      const token = await createSessionToken("admin", env2);
      const isSecure = url.protocol === "https:";
      const cookieHeader = createSessionCookie(token, isSecure);
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/panel?login=success",
          "Set-Cookie": cookieHeader
        }
      });
    } else {
      const html2 = renderLoginPage({
        error: "Incorrect password! Please try again with love \u{1F338}",
        isDefaultPassword: false
      });
      return new Response(html2, {
        status: 401,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
  }
  const errorParam = url.searchParams.get("error");
  const html = renderLoginPage({
    error: errorParam ? decodeURIComponent(errorParam) : void 0,
    isDefaultPassword: false
  });
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
function handleLogout(request) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/panel/login",
      "Set-Cookie": createClearCookie()
    }
  });
}
function renderDashboardPage(options) {
  const { settings } = options;
  const initialTab = options.initialTab || "overview";
  const defaultPasswordBanner = options.isDefaultPassword ? `
    <div style="background: rgba(254, 226, 226, 0.9); border: 1.5px solid #FDA4AF; border-radius: 14px; padding: 12px 18px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 14px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">\u26A0\uFE0F</span>
        <div>
          <strong style="color: #9F1239; font-family: 'Quicksand', sans-serif; font-size: 13.5px;">Default Dev Password Active</strong>
          <p style="color: #BE123C; font-size: 12px; margin-top: 1px;">Your panel is using the fallback password (<code>${APP_CONFIG.defaultDevPassword}</code>). Please set a secure password in Settings.</p>
        </div>
      </div>
      <button type="button" onclick="switchTab('settings')" class="btn btn-sm btn-secondary" style="background: #FFFFFF; border-color: #FECDD3; color: #E11D48; white-space: nowrap;">
        Go to Settings
      </button>
    </div>` : "";
  const flashAlert = options.flashMessage ? `
    <div style="background: ${options.flashMessage.type === "success" ? "rgba(236, 253, 245, 0.9)" : "rgba(254, 242, 242, 0.9)"}; border: 1.5px solid ${options.flashMessage.type === "success" ? "#A7F3D0" : "#FCA5A5"}; color: ${options.flashMessage.type === "success" ? "#065F46" : "#991B1B"}; padding: 10px 16px; border-radius: 12px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px;">
      <span>${options.flashMessage.type === "success" ? "\u{1F338}\u2728" : "\u26A0\uFE0F"}</span>
      <span>${options.flashMessage.text}</span>
    </div>` : "";
  const tokenParam = `?token=${encodeURIComponent(settings.subToken)}`;
  const shareTokenParam = `?token=${encodeURIComponent(settings.nodeShareToken)}`;
  const subUrls = {
    vless: `https://${options.host}/sub/vless${tokenParam}`,
    trojan: `https://${options.host}/sub/trojan${tokenParam}`,
    singbox: `https://${options.host}/sub/singbox${tokenParam}`,
    clash: `https://${options.host}/sub/clash${tokenParam}`,
    xray: `https://${options.host}/sub/xray${tokenParam}`,
    xrayJson: `https://${options.host}/sub/xray-json${tokenParam}`,
    warp: `https://${options.host}/sub/warp${tokenParam}`,
    amnezia: `https://${options.host}/sub/amnezia${tokenParam}`,
    openvpn: `https://${options.host}/sub/openvpn${tokenParam}`,
    ss: `https://${options.host}/sub/ss${tokenParam}`,
    doh: `https://${options.host}/dns-query`,
    nodeExport: `https://${options.host}/api/node/export${shareTokenParam}`
  };
  const wsProxyEndpoint = `wss://${options.host}${settings.proxyPath}`;
  const hasWarp = Boolean(settings.warpPrivateKey);
  const warpBadge = hasWarp ? settings.warpProEnabled ? '<span class="badge badge-sakura">Warp Pro Active</span>' : '<span class="badge badge-mint">Warp Basic Active</span>' : '<span class="badge badge-lavender">Warp Idle</span>';
  const chainBadge = settings.chainEnabled ? `<span class="badge badge-mint">Chain: ${settings.chainType.toUpperCase()}</span>` : '<span class="badge badge-lavender">Chain Off</span>';
  const content = `
  <div class="drawer-backdrop" id="drawerBackdrop" onclick="closeSidebar()"></div>

  <div class="app-layout">
    <!-- Slim Reference-Style Floating Glass Sidebar (258px desktop) -->
    <aside class="app-sidebar" id="appSidebar">
      <div>
        <div class="sidebar-brand">
          <div class="brand-mark">${MASCOT_SVG}</div>
          <div style="min-width: 0;">
            <div class="brand-title" style="font-size: 16px; line-height: 1.15;">BlueKnight</div>
            <div class="brand-tagline">Secure &bull; Fast &bull; Private</div>
          </div>
        </div>

        <!-- First-Level Navigation: Dashboard ALWAYS visible at the top! -->
        <nav class="sidebar-nav">
          <div class="nav-section">Panel</div>
          <button type="button" id="nav-overview" onclick="switchTab('overview')" class="nav-btn ${initialTab === "overview" ? "active" : ""}">
            <span class="nav-icon">\u{1F4CA}</span>
            <span>Dashboard</span>
          </button>
          <button type="button" id="nav-warp" onclick="switchTab('warp')" class="nav-btn ${initialTab === "warp" ? "active" : ""}">
            <span class="nav-icon">\u26A1</span>
            <span>WARP</span>
          </button>
          <button type="button" id="nav-subscriptions" onclick="switchTab('subscriptions')" class="nav-btn ${initialTab === "subscriptions" ? "active" : ""}">
            <span class="nav-icon">\u{1F517}</span>
            <span>Subscriptions</span>
          </button>
          <button type="button" id="nav-protocols" onclick="switchTab('protocols')" class="nav-btn ${initialTab === "protocols" ? "active" : ""}">
            <span class="nav-icon">\u{1F6E1}\uFE0F</span>
            <span>Protocols</span>
          </button>
          <button type="button" id="nav-dns" onclick="switchTab('dns')" class="nav-btn ${initialTab === "dns" ? "active" : ""}">
            <span class="nav-icon">\u{1F310}</span>
            <span>DNS Settings</span>
          </button>
          <button type="button" id="nav-routing" onclick="switchTab('routing')" class="nav-btn ${initialTab === "routing" ? "active" : ""}">
            <span class="nav-icon">\u{1F500}</span>
            <span>Routing &amp; Chain</span>
          </button>
          <button type="button" id="nav-settings" onclick="switchTab('settings')" class="nav-btn ${initialTab === "settings" ? "active" : ""}">
            <span class="nav-icon">\u2699\uFE0F</span>
            <span>Settings</span>
          </button>
          <div class="nav-section">Diagnostics</div>
          <a href="/dns-json?name=cloudflare.com&type=A" target="_blank" class="nav-btn">
            <span class="nav-icon">\u26A1</span>
            <span>Test DoH</span>
            <span class="nav-tag">DNS</span>
          </a>
          <a href="/api/health" target="_blank" class="nav-btn">
            <span class="nav-icon">\u{1FA7A}</span>
            <span>API Health</span>
            <span class="nav-tag">Live</span>
          </a>
          <div class="nav-section">Community</div>
          <a href="${APP_CONFIG.telegramChannel}" target="_blank" rel="noopener noreferrer" class="nav-btn">
            <span class="nav-icon">\u{1F4E2}</span>
            <span>Telegram Channel</span>
            <span class="nav-tag">News</span>
          </a>
        </nav>
      </div>

      <div class="sidebar-footer">
        <div class="sidebar-status-pill">
          <div class="sidebar-status-dot"></div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 12px; font-weight: 700; color: var(--theme-text-primary); line-height: 1.2;">System Online</div>
            <div style="font-size: 10.5px; color: var(--theme-text-muted); margin-top: 1px;">Tunnel engine running</div>
          </div>
          <span class="badge badge-mint" style="font-size: 10px; padding: 2px 6px;">Active</span>
        </div>

        <a href="/panel/logout" class="btn btn-secondary btn-sm" style="width: 100%; justify-content: space-between;">
          <span>Log out</span>
          <span>\u{1F6AA}</span>
        </a>
      </div>
    </aside>

    <!-- Transparent Main Canvas (NO giant enclosing frosted slab) -->
    <main class="app-main">
      <!-- Persistent Compact Header Bar -->
      <header class="app-header">
        <div class="header-left">
          <button type="button" class="mobile-nav-toggle" onclick="toggleSidebar()" aria-label="Toggle Navigation">\u2630</button>
          <div class="header-icon-box">
            <span id="page-icon">\u{1F4CA}</span>
          </div>
          <div>
            <h1 id="page-heading" style="font-size: 16.5px; margin-bottom: 2px;">System Dashboard</h1>
            <p id="page-subheading" style="color: var(--theme-text-muted); font-size: 12px; font-weight: 600;">Pastel proxy command center &amp; live tunnel stats</p>
          </div>
        </div>

        <div class="header-right">
          <div class="theme-pill-control">
            <span style="font-size: 13px;">\u{1F3A8}</span>
            <select class="theme-selector-dropdown" onchange="setBlueKnightTheme(this.value)">
              <option value="theme-1">Theme 1 \u2014 Sakura Emerald</option>
              <option value="theme-2">Theme 2 \u2014 Royal Wine</option>
              <option value="theme-3">Theme 3 \u2014 Twilight Slate</option>
              <option value="theme-4">Theme 4 \u2014 Arctic Glacier</option>
              <option value="theme-5">Theme 5 \u2014 Solar Flare</option>
              <option value="theme-6">Theme 6 \u2014 Copper Rust</option>
              <option value="theme-7">Theme 7 \u2014 Cyber Scarlet</option>
              <option value="theme-8">Theme 8 \u2014 Cobalt Breeze</option>
              <option value="theme-9">Theme 9 \u2014 Sapphire Coast</option>
              <option value="theme-10">Theme 10 \u2014 Obsidian Amethyst</option>
            </select>
            <button type="button" class="theme-dice-btn" onclick="randomizeBlueKnightTheme()" title="Randomize Theme">\u{1F3B2}</button>
          </div>

          <button type="button" class="btn btn-secondary btn-sm rtl-toggle-btn" onclick="toggleRtl()">RTL \u21C4</button>
          <span class="badge badge-mint">\u25CF Sockets Engine Online</span>
          <span class="badge badge-sky" style="max-width: 130px; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(options.host)}</span>
        </div>
      </header>

      ${defaultPasswordBanner}
      ${flashAlert}

      <!-- ====================================================================
           TAB 1: DASHBOARD (PRIMARY ACTION CARD + QUICK TILES + LIVE DOH)
           ==================================================================== -->
      <section id="tab-overview" class="tab-pane ${initialTab === "overview" ? "active" : ""}">
        
        <!-- Primary Feature Card (Level 1 Status Card) -->
        <div class="card card-primary" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-size: 22px;">\u{1F54A}\uFE0F</span>
                <h2 style="font-size: 18px;">Cloudflare Sockets Dual-Protocol Proxy</h2>
              </div>
              <p style="color: var(--theme-text-muted); font-size: 12.5px;">Multiplexed WebSocket inbound tunneling VLESS &amp; Trojan over Cloudflare Edge</p>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              ${warpBadge}
              ${chainBadge}
              <span class="badge ${settings.fragmentEnabled ? "badge-mint" : "badge-lavender"}">Fragment ${settings.fragmentEnabled ? "ON" : "OFF"}</span>
            </div>
          </div>

          <div style="background: var(--theme-surface-strong); border: 1px solid var(--theme-border); border-radius: 12px; padding: 12px 14px; margin-bottom: 14px;">
            <label class="form-label" style="font-size: 11.5px; margin-bottom: 4px;">Primary Tunnel Endpoint (WSS)</label>
            <div class="copy-wrapper">
              <input type="text" readonly class="form-control code-input" value="${wsProxyEndpoint}" />
              <div class="copy-actions">
                <button type="button" class="btn btn-primary btn-sm" onclick="copyToClipboard('${wsProxyEndpoint}')">\u{1F4CB} Copy Endpoint</button>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; font-size: 12px;">
            <div style="background: var(--theme-surface-soft); padding: 8px 12px; border-radius: 10px; border: 1px solid var(--theme-border);">
              <span style="color: var(--theme-text-muted);">VLESS UUID:</span>
              <div style="font-family: 'JetBrains Mono', monospace; font-weight: 700; overflow: hidden; text-overflow: ellipsis; color: var(--theme-primary);">${settings.vlessUuid}</div>
            </div>
            <div style="background: var(--theme-surface-soft); padding: 8px 12px; border-radius: 10px; border: 1px solid var(--theme-border);">
              <span style="color: var(--theme-text-muted);">Trojan Pass:</span>
              <div style="font-family: 'JetBrains Mono', monospace; font-weight: 700; overflow: hidden; text-overflow: ellipsis; color: var(--theme-secondary);">${settings.trojanPassword}</div>
            </div>
            <div style="background: var(--theme-surface-soft); padding: 8px 12px; border-radius: 10px; border: 1px solid var(--theme-border);">
              <span style="color: var(--theme-text-muted);">Clean IP:</span>
              <div style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--theme-accent);">${settings.proxyIp || "(Default Domain)"}</div>
            </div>
            <div style="background: var(--theme-surface-soft); padding: 8px 12px; border-radius: 10px; border: 1px solid var(--theme-border);">
              <span style="color: var(--theme-text-muted);">Routing Preset:</span>
              <div style="font-weight: 700; color: var(--theme-text-primary); text-transform: uppercase;">${settings.routingPreset}</div>
            </div>
          </div>
        </div>

        <!-- Quick Action Tiles Grid (Level 2) -->
        <div class="quick-action-grid">
          <div class="action-tile" onclick="switchTab('warp')">
            <div class="action-tile-icon">\u26A1</div>
            <div class="action-tile-text">
              <h4>WARP Engine</h4>
              <p>${hasWarp ? "Active &bull; Amnezia noise" : "Configure Keys"}</p>
            </div>
          </div>

          <div class="action-tile" onclick="copyToClipboard('${subUrls.vless}')">
            <div class="action-tile-icon">\u{1F4CB}</div>
            <div class="action-tile-text">
              <h4>Copy VLESS</h4>
              <p>v2rayN &amp; Nekobox</p>
            </div>
          </div>

          <div class="action-tile" onclick="copyToClipboard('${subUrls.clash}')">
            <div class="action-tile-icon">\u{1F517}</div>
            <div class="action-tile-text">
              <h4>Copy Clash</h4>
              <p>Clash.Meta / Mihomo</p>
            </div>
          </div>

          <div class="action-tile" onclick="copyToClipboard('${subUrls.singbox}')">
            <div class="action-tile-icon">\u{1F4E6}</div>
            <div class="action-tile-text">
              <h4>Copy Sing-box</h4>
              <p>Sing-box 1.9+ JSON</p>
            </div>
          </div>

          <div class="action-tile" onclick="switchTab('dns')">
            <div class="action-tile-icon">\u{1F310}</div>
            <div class="action-tile-text">
              <h4>DoH Resolver</h4>
              <p>Real-time DNS &amp; RTT</p>
            </div>
          </div>

          <div class="action-tile" onclick="switchTab('protocols')">
            <div class="action-tile-icon">\u{1F6E1}\uFE0F</div>
            <div class="action-tile-text">
              <h4>Protocols</h4>
              <p>UUID &amp; Clean IP</p>
            </div>
          </div>
        </div>

        <!-- 2-Column Grid: Live DoH Query Resolver + Notice -->
        <div class="grid-2col" style="margin-bottom: 16px;">
          <!-- Live DoH Query Resolver Widget -->
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div class="card-title">
                <span>\u26A1</span>
                <span>Live DoH Resolver</span>
              </div>
              <span class="badge badge-sky">RFC 8484 / JSON</span>
            </div>
            <p class="card-desc">Query upstream DNS latency &amp; resolve domains directly from Cloudflare edge.</p>

            <div style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
              <input type="text" id="dohTestDomain" class="form-control code-input" value="cloudflare.com" placeholder="e.g. google.com" style="flex: 2; min-width: 140px;" />
              <select id="dohTestType" class="form-control code-input" style="flex: 1; min-width: 80px;">
                <option value="A" selected>A</option>
                <option value="AAAA">AAAA</option>
                <option value="CNAME">CNAME</option>
                <option value="TXT">TXT</option>
                <option value="NS">NS</option>
                <option value="MX">MX</option>
              </select>
              <button type="button" class="btn btn-primary btn-sm" onclick="runDohTest()" style="height: 38px; padding: 0 14px;">
                <span>\u26A1 Resolve</span>
              </button>
            </div>

            <div id="dohTestResult" style="display: none; background: var(--theme-surface-strong); border: 1px solid var(--theme-border); border-radius: 10px; padding: 10px 12px; margin-top: 8px; font-size: 12px;"></div>
          </div>

          <!-- Client Connectivity Guidance Notice -->
          <div class="card" style="border-inline-start: 4px solid var(--theme-primary);">
            <div class="card-title">
              <span>\u{1F4A1}</span>
              <span>Client Testing Notice</span>
            </div>
            <p class="card-desc" style="margin-bottom: 10px;">
              <strong>v2rayN latency ping delay can show -1:</strong> GUI clients attempt synthetic ICMP/TCP probes that Cloudflare Workers terminate. Always verify real traffic by opening websites or streaming video through the proxy.
            </p>
            <div style="background: var(--theme-surface-strong); padding: 10px 12px; border-radius: 10px; border: 1px solid var(--theme-border); font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
              <span>Upstream DoH Gateway:</span>
              <code style="font-family: 'JetBrains Mono', monospace; color: var(--theme-primary); font-size: 11.5px;">${settings.dnsDoH}</code>
            </div>
          </div>
        </div>

        <!-- Live Client Subscriptions & Services Table -->
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <div class="card-title" style="margin-bottom: 0;">
              <span>\u{1F517}</span>
              <span>Live Client Subscription Profiles</span>
            </div>
            <span class="badge badge-mint">\u25CF All Feeds Active</span>
          </div>

          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
              <thead>
                <tr style="border-bottom: 1.5px solid var(--theme-border); color: var(--theme-text-muted); font-family: 'Quicksand', sans-serif;">
                  <th style="padding: 8px 10px;">Service</th>
                  <th style="padding: 8px 10px;">Recommended Client</th>
                  <th style="padding: 8px 10px;">Status / Features</th>
                  <th style="padding: 8px 10px; text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid var(--theme-border);">
                  <td style="padding: 10px; font-weight: 700;">VLESS Share Link</td>
                  <td style="padding: 10px;"><span class="badge badge-lavender">v2rayN, Nekobox</span></td>
                  <td style="padding: 10px;"><span class="badge badge-sky">${settings.fragmentEnabled ? "Fragment Ready" : "Standard WS"}</span></td>
                  <td style="padding: 10px; text-align: right;">
                    <button type="button" class="btn btn-sm btn-secondary" onclick="copyToClipboard('${subUrls.vless}')">\u{1F4CB} Copy</button>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid var(--theme-border);">
                  <td style="padding: 10px; font-weight: 700;">Trojan Share Link</td>
                  <td style="padding: 10px;"><span class="badge badge-sakura">Shadowrocket</span></td>
                  <td style="padding: 10px;"><span class="badge badge-mint">TLS + WS</span></td>
                  <td style="padding: 10px; text-align: right;">
                    <button type="button" class="btn btn-sm btn-secondary" onclick="copyToClipboard('${subUrls.trojan}')">\u{1F4CB} Copy</button>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid var(--theme-border);">
                  <td style="padding: 10px; font-weight: 700;">Clash.Meta / Mihomo</td>
                  <td style="padding: 10px;"><span class="badge badge-sky">Clash Verge, Flclash</span></td>
                  <td style="padding: 10px;"><span class="badge badge-lavender">${settings.routingPreset}${settings.chainEnabled ? " + Chain" : ""}</span></td>
                  <td style="padding: 10px; text-align: right;">
                    <button type="button" class="btn btn-sm btn-secondary" onclick="copyToClipboard('${subUrls.clash}')">\u{1F4CB} Copy</button>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid var(--theme-border);">
                  <td style="padding: 10px; font-weight: 700;">Sing-box 1.9+ JSON</td>
                  <td style="padding: 10px;"><span class="badge badge-mint">Sing-box (Win, iOS, Android)</span></td>
                  <td style="padding: 10px;"><span class="badge badge-lavender">Outbounds &amp; Detour</span></td>
                  <td style="padding: 10px; text-align: right;">
                    <button type="button" class="btn btn-sm btn-secondary" onclick="copyToClipboard('${subUrls.singbox}')">\u{1F4CB} Copy</button>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid var(--theme-border);">
                  <td style="padding: 10px; font-weight: 700;">WireGuard / AmneziaWG</td>
                  <td style="padding: 10px;"><span class="badge badge-sky">WireGuard / Amnezia</span></td>
                  <td style="padding: 10px;"><span class="badge ${hasWarp ? "badge-mint" : "badge-lavender"}">${hasWarp ? "Keys Active" : "Not Set"}</span></td>
                  <td style="padding: 10px; text-align: right;">
                    <button type="button" class="btn btn-sm btn-secondary" onclick="copyToClipboard('${subUrls.amnezia}')">\u{1F4CB} Copy</button>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: 700;">Private DoH Gateway</td>
                  <td style="padding: 10px;"><span class="badge badge-sky">Any Browser / Client</span></td>
                  <td style="padding: 10px;"><span class="badge badge-mint">RFC 8484 Wireformat</span></td>
                  <td style="padding: 10px; text-align: right;">
                    <button type="button" class="btn btn-sm btn-secondary" onclick="copyToClipboard('${subUrls.doh}')">\u{1F4CB} Copy</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </section>

      <!-- ====================================================================
           TAB 2: WARP (WARP PRO & AMNEZIA NOISE ENGINE)
           ==================================================================== -->
      <section id="tab-warp" class="tab-pane ${initialTab === "warp" ? "active" : ""}">
        
        <!-- Primary WARP Action Card -->
        <div class="card card-primary" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-size: 22px;">\u26A1</span>
                <h2 style="font-size: 18px;">Cloudflare WARP &amp; AmneziaWG Engine</h2>
              </div>
              <p style="color: var(--theme-text-muted); font-size: 12.5px;">Register a genuine Cloudflare WARP device account, retrieve WireGuard X25519 keypair, client IPv4, IPv6, and reserved bytes.</p>
            </div>
            ${warpBadge}
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; background: var(--theme-surface-strong); border: 1px solid var(--theme-border); border-radius: 12px; padding: 12px 16px;">
            <div style="font-size: 12.5px;">
              <strong>Status:</strong> ${hasWarp ? `Configured &bull; Reserved: <code>[${settings.warpReserved || "None"}]</code>` : "No keys configured yet"}
            </div>
            <form action="/panel/settings/warp/generate" method="POST" style="margin: 0;">
              <button type="submit" class="btn btn-primary" onclick="return confirm('Register a genuine Cloudflare Warp account and generate WireGuard credentials?')">
                <span>\u26A1 ${hasWarp ? "Regenerate WARP Account" : "Generate WARP Account"}</span>
              </button>
            </form>
          </div>
        </div>

        <form action="/panel/settings/protocols" method="POST">
          <div class="grid-2col" style="margin-bottom: 16px;">
            <!-- Left Card: WireGuard Base Config -->
            <div class="card">
              <div class="card-title">
                <span>\u{1F510}</span>
                <span>WireGuard Core Configuration</span>
              </div>
              <p class="card-desc">Standard WireGuard client configuration parameters for Warp.</p>

              <div class="form-group">
                <label class="form-label" for="warpPrivateKey">Warp Private Key</label>
                <input type="password" id="warpPrivateKey" name="warpPrivateKey" class="form-control code-input" value="${settings.warpPrivateKey}" placeholder="WireGuard private key" />
              </div>

              <div class="form-group">
                <label class="form-label" for="warpPeerPublicKey">Warp Peer Public Key</label>
                <input type="text" id="warpPeerPublicKey" name="warpPeerPublicKey" class="form-control code-input" value="${settings.warpPeerPublicKey}" placeholder="bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=" />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
                <div>
                  <label class="form-label" for="warpIPv6">Client IPv6 Address</label>
                  <input type="text" id="warpIPv6" name="warpIPv6" class="form-control code-input" value="${settings.warpIPv6}" placeholder="2606:4700:110:..." />
                </div>
                <div>
                  <label class="form-label" for="warpReserved">Reserved Bytes [a,b,c]</label>
                  <input type="text" id="warpReserved" name="warpReserved" class="form-control code-input" value="${settings.warpReserved}" placeholder="[12, 34, 56]" />
                </div>
              </div>

              <div style="display: flex; gap: 8px;">
                <a href="${subUrls.warp}" target="_blank" class="btn btn-secondary btn-sm" style="flex: 1;">\u{1F4BE} Download .conf</a>
                <button type="button" class="btn btn-secondary btn-sm" onclick="copyToClipboard('${subUrls.warp}')" style="flex: 1;">\u{1F4CB} Copy URL</button>
              </div>
            </div>

            <!-- Right Card: AmneziaWG Noise Engine -->
            <div class="card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <div class="card-title" style="margin-bottom: 0;">
                  <span>\u{1F338}</span>
                  <span>AmneziaWG Obfuscation &amp; Noise</span>
                </div>
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; font-weight: 700; color: var(--theme-primary);">
                  <input type="checkbox" name="warpProEnabled" ${settings.warpProEnabled ? "checked" : ""} style="accent-color: var(--theme-primary); width: 16px; height: 16px;" />
                  <span>Enable Pro</span>
                </label>
              </div>
              <p class="card-desc">Injects AmneziaWG junk packets and custom packet headers to bypass Deep Packet Inspection (DPI).</p>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                <div>
                  <label class="form-label" style="font-size: 11px;">Version</label>
                  <input type="text" name="warpAmneziaVersion" class="form-control code-input" value="${settings.warpAmneziaVersion || "2"}" />
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px;">S1 (Init)</label>
                  <input type="text" name="warpAmneziaS1" class="form-control code-input" value="${settings.warpAmneziaS1 || "15"}" />
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px;">S2 (Resp)</label>
                  <input type="text" name="warpAmneziaS2" class="form-control code-input" value="${settings.warpAmneziaS2 || "25"}" />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                <div>
                  <label class="form-label" style="font-size: 11px;">Jc (Count)</label>
                  <input type="text" name="warpNoiseCount" class="form-control code-input" value="${settings.warpNoiseCount}" placeholder="5" />
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px;">Jmin</label>
                  <input type="text" name="warpNoiseMin" class="form-control code-input" value="${settings.warpNoiseMin}" placeholder="10" />
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px;">Jmax</label>
                  <input type="text" name="warpNoiseMax" class="form-control code-input" value="${settings.warpNoiseMax}" placeholder="50" />
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px;">Delay ms</label>
                  <input type="text" name="warpNoiseDelay" class="form-control code-input" value="${settings.warpNoiseDelay}" placeholder="20" />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px;">
                <div>
                  <label class="form-label" style="font-size: 11px;">H1</label>
                  <input type="text" name="warpAmneziaH1" class="form-control code-input" value="${settings.warpAmneziaH1}" placeholder="1" />
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px;">H2</label>
                  <input type="text" name="warpAmneziaH2" class="form-control code-input" value="${settings.warpAmneziaH2}" placeholder="2" />
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px;">H3</label>
                  <input type="text" name="warpAmneziaH3" class="form-control code-input" value="${settings.warpAmneziaH3}" placeholder="3" />
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px;">H4</label>
                  <input type="text" name="warpAmneziaH4" class="form-control code-input" value="${settings.warpAmneziaH4}" placeholder="4" />
                </div>
              </div>

              <div style="display: flex; gap: 8px;">
                <a href="${subUrls.amnezia}" target="_blank" class="btn btn-secondary btn-sm" style="flex: 1;">\u{1F4BE} Download AWG</a>
                <button type="button" class="btn btn-secondary btn-sm" onclick="copyToClipboard('${subUrls.amnezia}')" style="flex: 1;">\u{1F4CB} Copy AWG</button>
              </div>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; height: 42px;">
            <span>Save WARP &amp; Noise Configuration to KV</span>
            <span>\u2728</span>
          </button>
        </form>

      </section>

      <!-- ====================================================================
           TAB 3: SUBSCRIPTIONS (GRID OF COMPACT CARDS + QR MODAL)
           ==================================================================== -->
      <section id="tab-subscriptions" class="tab-pane ${initialTab === "subscriptions" ? "active" : ""}">
        
        <div class="card" style="margin-bottom: 16px;">
          <div class="card-title">
            <span>\u{1F517}</span>
            <span>Live Subscription Links &amp; Client Feeds</span>
          </div>
          <p class="card-desc">Token-gated client configurations with active proxy routes and fragment parameters.</p>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            
            <div class="glass-card" style="padding:16px">
              <strong>All configured protocols — Sing-box 1.14+</strong>
              <p>VLESS, Trojan and configured WARP, plus provisioned ShadowTLS, Shadowsocks, Hysteria2, TUIC and AnyTLS in one profile. OpenVPN and AmneziaWG use their separate client downloads below.</p>
              <div class="copy-wrapper">
                <input type="text" readonly class="form-control code-input" value="https://${options.host}/sub/all?token=${encodeURIComponent(settings.subToken)}" />
                <button type="button" class="btn btn-primary btn-sm" onclick="copyToClipboard('https://${options.host}/sub/all?token=${encodeURIComponent(settings.subToken)}')">Copy all-protocol profile</button>
              </div>
            </div>
            <div class="glass-card" style="padding:16px">
              <strong>VLESS + Trojan + Shadowsocks — combined subscription</strong>
              <p>Use this link for all three panel protocols. Shadowsocks uses WebSocket/TLS with v2ray-plugin support.</p>
              <div class="copy-wrapper">
                <input type="text" readonly class="form-control code-input" value="${subUrls.xray}" />
                <button type="button" class="btn btn-primary btn-sm" onclick="copyToClipboard('${subUrls.xray}')">Copy combined subscription</button>
              </div>
            </div>
            <!-- VLESS Sub -->
            <div style="background: var(--theme-surface-strong); border: 1px solid var(--theme-border); border-radius: 12px; padding: 12px 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 13.5px;">VLESS Direct Feed</strong>
                <span class="badge badge-lavender">v2rayN / Nekobox</span>
              </div>
              <div class="copy-wrapper">
                <input type="text" readonly class="form-control code-input" value="${subUrls.vless}" />
                <div class="copy-actions">
                  <button type="button" class="btn btn-primary btn-sm" onclick="copyToClipboard('${subUrls.vless}')">\u{1F4CB} Copy</button>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="showQrModal('VLESS Subscription', '${subUrls.vless}')">\u{1F4F1} QR</button>
                  <a href="${subUrls.vless}" target="_blank" class="btn btn-secondary btn-sm">\u{1F441}\uFE0F Preview</a>
                </div>
              </div>
            </div>

            <!-- Trojan Sub -->
            <div style="background: var(--theme-surface-strong); border: 1px solid var(--theme-border); border-radius: 12px; padding: 12px 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 13.5px;">Trojan Direct Feed</strong>
                <span class="badge badge-sakura">Shadowrocket</span>
              </div>
              <div class="copy-wrapper">
                <input type="text" readonly class="form-control code-input" value="${subUrls.trojan}" />
                <div class="copy-actions">
                  <button type="button" class="btn btn-primary btn-sm" onclick="copyToClipboard('${subUrls.trojan}')">\u{1F4CB} Copy</button>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="showQrModal('Trojan Subscription', '${subUrls.trojan}')">\u{1F4F1} QR</button>
                  <a href="${subUrls.trojan}" target="_blank" class="btn btn-secondary btn-sm">\u{1F441}\uFE0F Preview</a>
                </div>
              </div>
            </div>

            <!-- Clash Sub -->
            <div style="background: var(--theme-surface-strong); border: 1px solid var(--theme-border); border-radius: 12px; padding: 12px 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 13.5px;">Clash.Meta / Mihomo (YAML)</strong>
                <span class="badge badge-sky">Clash Verge / Mihomo</span>
              </div>
              <div class="copy-wrapper">
                <input type="text" readonly class="form-control code-input" value="${subUrls.clash}" />
                <div class="copy-actions">
                  <button type="button" class="btn btn-primary btn-sm" onclick="copyToClipboard('${subUrls.clash}')">\u{1F4CB} Copy</button>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="showQrModal('Clash.Meta YAML Profile', '${subUrls.clash}')">\u{1F4F1} QR</button>
                  <a href="${subUrls.clash}" target="_blank" class="btn btn-secondary btn-sm">\u{1F441}\uFE0F Preview</a>
                </div>
              </div>
            </div>

            <!-- Sing-box Sub -->
            <div style="background: var(--theme-surface-strong); border: 1px solid var(--theme-border); border-radius: 12px; padding: 12px 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 13.5px;">Sing-box 1.14+ Config (JSON)</strong>
                <span class="badge badge-mint">Sing-box Client</span>
              </div>
              <div class="copy-wrapper">
                <input type="text" readonly class="form-control code-input" value="${subUrls.singbox}" />
                <div class="copy-actions">
                  <button type="button" class="btn btn-primary btn-sm" onclick="copyToClipboard('${subUrls.singbox}')">\u{1F4CB} Copy</button>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="showQrModal('Sing-box Remote Config', '${subUrls.singbox}')">\u{1F4F1} QR</button>
                  <a href="${subUrls.singbox}" target="_blank" class="btn btn-secondary btn-sm">\u{1F441}\uFE0F Preview</a>
                </div>
              </div>
            </div>

            <!-- Xray Sub -->
            <div style="background: var(--theme-surface-strong); border: 1px solid var(--theme-border); border-radius: 12px; padding: 12px 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 13.5px;">Xray Client Configuration (JSON)</strong>
                <span class="badge badge-sky">Xray / v2rayN Core</span>
              </div>
              <div class="copy-wrapper">
                <input type="text" readonly class="form-control code-input" value="${subUrls.xrayJson}" />
                <div class="copy-actions">
                  <button type="button" class="btn btn-primary btn-sm" onclick="copyToClipboard('${subUrls.xrayJson}')">\u{1F4CB} Copy</button>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="showQrModal('Xray Client JSON', '${subUrls.xrayJson}')">\u{1F4F1} QR</button>
                  <a href="${subUrls.xrayJson}" target="_blank" class="btn btn-secondary btn-sm">\u{1F441}\uFE0F Preview</a>
                </div>
              </div>
            </div>

            <!-- Native protocol subscriptions -->
            <div class="glass-card" style="padding:16px">
              <strong>Native connections</strong>
              <p>ShadowTLS, Shadowsocks, Hysteria2, TUIC and AnyTLS require the native server deployment. Downloads return a configuration error until provisioned.</p>
              <a class="btn btn-secondary btn-sm" href="/sub/native?token=${encodeURIComponent(settings.subToken)}">Download native Sing-box connections</a>
            </div>
            <!-- OpenVPN Sub -->
            <div style="background: var(--theme-surface-strong); border: 1px solid var(--theme-border); border-radius: 12px; padding: 12px 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 13.5px;">\u{1F6E1}\uFE0F OpenVPN Client Profile (.ovpn)</strong>
                <span class="badge badge-mint">Native OpenVPN server required</span>
              </div>
              <div class="copy-wrapper">
                <input type="text" readonly class="form-control code-input" value="${subUrls.openvpn}" />
                <div class="copy-actions">
                  <a href="${subUrls.openvpn}" download="blueknight.ovpn" class="btn btn-primary btn-sm">\u{1F4E5} Download .ovpn</a>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="copyToClipboard('${subUrls.openvpn}')">\u{1F4CB} Copy Link</button>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="showQrModal('OpenVPN Configuration', '${subUrls.openvpn}')">\u{1F4F1} QR</button>
                </div>
              </div>
            </div>

            <!-- Shadowsocks (SS) Sub -->
            <div style="background: var(--theme-surface-strong); border: 1px solid var(--theme-border); border-radius: 12px; padding: 12px 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 13.5px;">\u{1F510} Shadowsocks (SS) Feed</strong>
                <span class="badge badge-sakura">WebSocket/TLS · TCP</span>
              </div>
              <div class="copy-wrapper">
                <input type="text" readonly class="form-control code-input" value="${subUrls.ss}" />
                <div class="copy-actions">
                  <button type="button" class="btn btn-primary btn-sm" onclick="copyToClipboard('${subUrls.ss}')">\u{1F4CB} Copy</button>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="showQrModal('Shadowsocks Subscription', '${subUrls.ss}')">\u{1F4F1} QR</button>
                  <a href="${subUrls.ss}" target="_blank" class="btn btn-secondary btn-sm">\u{1F441}\uFE0F Preview</a>
                </div>
              </div>
            </div>

            <!-- DoH Sub -->
            <div style="background: var(--theme-surface-strong); border: 1px solid var(--theme-border); border-radius: 12px; padding: 12px 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 13.5px;">Private DNS-over-HTTPS Endpoint</strong>
                <span class="badge badge-sky">RFC 8484 + JSON</span>
              </div>
              <div class="copy-wrapper">
                <input type="text" readonly class="form-control code-input" value="${subUrls.doh}" />
                <div class="copy-actions">
                  <button type="button" class="btn btn-primary btn-sm" onclick="copyToClipboard('${subUrls.doh}')">\u{1F4CB} Copy</button>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="showQrModal('Private DoH Gateway', '${subUrls.doh}')">\u{1F4F1} QR</button>
                  <a href="/dns-json?name=cloudflare.com&type=A" target="_blank" class="btn btn-secondary btn-sm">\u26A1 Test</a>
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>

      <!-- ====================================================================
           TAB 4: PROTOCOLS (COMPACT 2-COLUMN DASHBOARD GRID)
           ==================================================================== -->
      <section id="tab-protocols" class="tab-pane ${initialTab === "protocols" ? "active" : ""}">
        
        <form action="/panel/settings/protocols" method="POST">
          <div class="grid-2col" style="margin-bottom: 16px;">
            
            <!-- Card 1: Inbound Transport & Client Credentials -->
            <div class="card">
              <div class="card-title">
                <span>\u{1F512}</span>
                <span>Inbound Transport &amp; Credentials</span>
              </div>
              <p class="card-desc">WebSocket proxy credentials for VLESS and Trojan client authentications.</p>

              <div class="form-group">
                <label class="form-label" for="vlessUuid">VLESS User UUID</label>
                <div class="copy-wrapper">
                  <input type="text" id="vlessUuid" name="vlessUuid" class="form-control code-input" value="${settings.vlessUuid}" required />
                  <div class="copy-actions">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="generateRandomUuid()">\u{1F3B2} Gen</button>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="trojanPassword">Trojan Client Password</label>
                <div class="copy-wrapper">
                  <input type="text" id="trojanPassword" name="trojanPassword" class="form-control code-input" value="${settings.trojanPassword}" required />
                  <div class="copy-actions">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="generateRandomPassword()">\u{1F3B2} Gen</button>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="proxyPath">WebSocket Proxy Path</label>
                <input type="text" id="proxyPath" name="proxyPath" class="form-control code-input" value="${settings.proxyPath}" required placeholder="/wd-ws" />
                <div style="font-size: 11px; color: var(--theme-text-muted); margin-top: 3px;">Accepts both /wd-ws and legacy /bk-ws paths.</div>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" for="subToken">Subscription Token</label>
                <div class="copy-wrapper">
                  <input type="text" id="subToken" name="subToken" class="form-control code-input" value="${settings.subToken}" required />
                  <div class="copy-actions">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="generateRandomToken()">\u{1F3B2} Gen</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 2: Network, Clean IP & Listening Mode -->
            <div class="card">
              <div class="card-title">
                <span>\u{1F310}</span>
                <span>Network &amp; Preferred Addresses</span>
              </div>
              <p class="card-desc">Clean CDN IPs for fronting and local area network sharing configurations.</p>

              <div class="form-group">
                <label class="form-label" for="proxyIp">Clean IP / Preferred Address (Optional)</label>
                <input type="text" id="proxyIp" name="proxyIp" class="form-control code-input" value="${settings.proxyIp}" placeholder="e.g. 104.16.1.1 (leave empty for worker default)" />
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
                  <button type="button" class="btn btn-sm btn-secondary" style="font-size: 11px; padding: 2px 8px; height: 26px;" onclick="setCleanIp('')">Default</button>
                  <button type="button" class="btn btn-sm btn-secondary" style="font-size: 11px; padding: 2px 8px; height: 26px;" onclick="setCleanIp('104.16.1.1')">104.16.1.1</button>
                  <button type="button" class="btn btn-sm btn-secondary" style="font-size: 11px; padding: 2px 8px; height: 26px;" onclick="setCleanIp('104.19.241.93')">104.19.241.93</button>
                  <button type="button" class="btn btn-sm btn-secondary" style="font-size: 11px; padding: 2px 8px; height: 26px;" onclick="setCleanIp('172.67.180.1')">172.67.180.1</button>
                  <button type="button" class="btn btn-sm btn-secondary" style="font-size: 11px; padding: 2px 8px; height: 26px;" onclick="setCleanIp('162.159.138.6')">162.159.138.6</button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="dnsDoH">Underlying DoH Upstream URL</label>
                <input type="text" id="dnsDoH" name="dnsDoH" class="form-control code-input" value="${settings.dnsDoH}" placeholder="https://cloudflare-dns.com/dns-query" />
              </div>

              <div class="setting-group" style="background: var(--theme-surface-strong); border: 1px solid var(--theme-border); border-radius: 12px; padding: 10px 14px;">
                <div class="setting-row" style="padding: 0;">
                  <div class="setting-label-col">
                    <div class="setting-title">Allow LAN Sharing</div>
                    <div class="setting-subtitle">Listen on 0.0.0.0 to allow devices on your local network to route through this client.</div>
                  </div>
                  <div class="setting-control-col">
                    <input type="checkbox" id="allowLANConnection" name="allowLANConnection" ${settings.allowLANConnection ? "checked" : ""} style="accent-color: var(--theme-primary); width: 18px; height: 18px; cursor: pointer;" />
                  </div>
                </div>
              </div>

            </div>

            <!-- Card 3: Domain Fronting & SNI Decoupling -->
            <div class="card">
              <div class="card-title">
                <span>\u{1F3AD}</span>
                <span>Domain Fronting &amp; SNI Camouflage</span>
              </div>
              <p class="card-desc">Decouple TLS SNI from HTTP Host header to bypass deep packet inspection filters.</p>

              <div class="setting-group" style="background: var(--theme-surface-strong); border: 1px solid var(--theme-border); border-radius: 10px; padding: 8px 12px; margin-bottom: 12px;">
                <div class="setting-row" style="padding: 0;">
                  <div class="setting-label-col">
                    <div class="setting-title" style="font-size: 13px;">Enable Domain Fronting</div>
                    <div class="setting-subtitle" style="font-size: 11px;">Generate fronted nodes in subscriptions with camouflage SNI.</div>
                  </div>
                  <div class="setting-control-col">
                    <input type="checkbox" id="domainFrontingEnabled" name="domainFrontingEnabled" ${settings.domainFrontingEnabled ? "checked" : ""} style="accent-color: var(--theme-primary); width: 18px; height: 18px; cursor: pointer;" />
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="frontingSni">Camouflage Fronting SNI</label>
                <input type="text" id="frontingSni" name="frontingSni" class="form-control code-input" value="${settings.frontingSni || "cdnjs.cloudflare.com"}" placeholder="e.g. cdnjs.cloudflare.com, speedtest.net" />
                <div style="display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
                  <button type="button" class="btn btn-sm btn-secondary" style="font-size: 10.5px; padding: 2px 6px;" onclick="document.getElementById('frontingSni').value='cdnjs.cloudflare.com'">cdnjs</button>
                  <button type="button" class="btn btn-sm btn-secondary" style="font-size: 10.5px; padding: 2px 6px;" onclick="document.getElementById('frontingSni').value='speedtest.net'">speedtest</button>
                  <button type="button" class="btn btn-sm btn-secondary" style="font-size: 10.5px; padding: 2px 6px;" onclick="document.getElementById('frontingSni').value='zoom.us'">zoom</button>
                  <button type="button" class="btn btn-sm btn-secondary" style="font-size: 10.5px; padding: 2px 6px;" onclick="document.getElementById('frontingSni').value='investors.cloudflare.com'">cloudflare</button>
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" for="frontingHost">Target Worker Host Header (Optional)</label>
                <input type="text" id="frontingHost" name="frontingHost" class="form-control code-input" value="${settings.frontingHost || ""}" placeholder="Leave empty for current host: ${escapeHtml(options.host)}" />
              </div>
            </div>

            <!-- Card 4: Static IP Pool Management -->
            <div class="card">
              <div class="card-title">
                <span>\u{1F4CD}</span>
                <span>Static Clean IP Pool</span>
              </div>
              <p class="card-desc">Configured static IPs will generate separate dedicated node entries in subscriptions.</p>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" for="staticIpList">Static / Anycast IP List (Comma or space separated)</label>
                <textarea id="staticIpList" name="staticIpList" class="form-control code-input" rows="4" placeholder="104.16.1.1, 104.19.241.93, 172.67.180.1, 162.159.138.6" style="resize: vertical; font-size: 12px;">${settings.staticIpList || ""}</textarea>
                <div style="font-size: 11px; color: var(--theme-text-muted); margin-top: 4px;">
                  \u{1F4A1} Each IP will be added as a distinct selectable node in Clash, Sing-box, and VLESS subscriptions.
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-title">Shadowsocks over WebSocket/TLS</div>
              <p class="card-desc">Included alongside VLESS and Trojan in combined feeds. Requires v2ray-plugin in URI clients; Xray JSON and Sing-box exports configure the transport.</p>
              <label><input type="checkbox" name="ssEnabled" ${settings.ssEnabled ? 'checked' : ''} /> Enable Shadowsocks</label>
              <label class="form-label">Cipher</label>
              <select class="form-control" name="ssMethod">${SS_METHODS.map(method => `<option value="${method}" ${settings.ssMethod === method ? 'selected' : ''}>${method}</option>`).join('')}</select>
              <label class="form-label">Password</label>
              <input type="password" class="form-control" name="ssPassword" value="${settings.ssPassword.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}" />
            </div>
            <div class="card">
              <div class="card-title"><span>Native protocol servers</span></div>
              <p class="card-desc">Shadowsocks, ShadowTLS, AnyTLS, Hysteria2, TUIC and OpenVPN use the native deployment. Manage their credentials in that deployment and download client profiles from Subscriptions.</p>
              <a class="btn btn-secondary" href="/panel/settings/subscriptions">Open native subscriptions</a>
            </div>
            <!-- Card 6: XHTTP, HTTP Upgrade & AnyTLS Engine -->
            <div class="card">
              <div class="card-title">
                <span>\u26A1</span>
                <span>Experimental HTTP streaming &amp; client TLS</span>
              </div>
              <p class="card-desc">Raw VLESS/Trojan HTTP streaming is experimental and is not Xray split-HTTP. Use WebSocket subscriptions for client compatibility.</p>

              <div class="setting-group" style="background: var(--theme-surface-strong); border: 1px solid var(--theme-border); border-radius: 10px; padding: 8px 12px; margin-bottom: 10px;">
                <div class="setting-row" style="padding: 0;">
                  <div class="setting-label-col">
                    <div class="setting-title" style="font-size: 13px;">Enable experimental HTTP streaming</div>
                    <div class="setting-subtitle" style="font-size: 11px;">HTTP/2 &amp; HTTP/3 streaming chunked body proxying.</div>
                  </div>
                  <div class="setting-control-col">
                    <input type="checkbox" id="xhttpEnabled" name="xhttpEnabled" ${settings.xhttpEnabled ? "checked" : ""} style="accent-color: var(--theme-primary); width: 18px; height: 18px; cursor: pointer;" />
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="xhttpPath">HTTP Streaming Endpoint Path</label>
                <input type="text" id="xhttpPath" name="xhttpPath" class="form-control code-input" value="${settings.xhttpPath || "/bk-xhttp"}" placeholder="/bk-xhttp" />
              </div>

              <div class="form-group">
                <label class="form-label" for="anytlsFingerprint">TLS Client Fingerprint</label>
                <select id="anytlsFingerprint" name="anytlsFingerprint" class="form-control code-input">
                  <option value="chrome" ${settings.anytlsFingerprint === "chrome" ? "selected" : ""}>Chrome (Default - Highest Compatibility)</option>
                  <option value="firefox" ${settings.anytlsFingerprint === "firefox" ? "selected" : ""}>Firefox</option>
                  <option value="safari" ${settings.anytlsFingerprint === "safari" ? "selected" : ""}>Safari / iOS</option>
                  <option value="edge" ${settings.anytlsFingerprint === "edge" ? "selected" : ""}>Edge</option>
                  <option value="randomized" ${settings.anytlsFingerprint === "randomized" ? "selected" : ""}>Randomized Chameleon</option>
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" for="anytlsAlpn">TLS ALPN Negotiation</label>
                <input type="text" id="anytlsAlpn" name="anytlsAlpn" class="form-control code-input" value="${settings.anytlsAlpn || "h2,http/1.1"}" placeholder="h2,http/1.1" />
              </div>
            </div>

          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; height: 42px;">
            <span>Save Protocol &amp; Inbound Settings to KV</span>
            <span>\u2728</span>
          </button>
        </form>

      </section>

      <!-- ====================================================================
           TAB 5: DNS SETTINGS (UPSTREAM DOH SELECTOR & TESTER)
           ==================================================================== -->
      <section id="tab-dns" class="tab-pane ${initialTab === "dns" ? "active" : ""}">
        
        <div class="grid-2col" style="margin-bottom: 16px;">
          <!-- Upstream Provider Selector -->
          <div class="card">
            <div class="card-title">
              <span>\u{1F310}</span>
              <span>Upstream DoH Provider &amp; Custom DNS Server</span>
            </div>
            <p class="card-desc">Select primary upstream DNS-over-HTTPS resolver or configure an arbitrary private DoH / DNS endpoint.</p>

            <form action="/panel/settings/protocols" method="POST">
            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label" for="dnsCustom">Custom DoH / DNS Upstream URL (Optional)</label>
              <input type="text" id="dnsCustom" name="dnsCustom" class="form-control code-input" value="${settings.dnsCustom || ""}" placeholder="e.g. https://dns.adguard-dns.com/dns-query or https://dns.alidns.com/dns-query" />
              <div style="font-size: 11px; color: var(--theme-text-muted); margin-top: 4px;">
                \u{1F4A1} When filled, this custom upstream overrides presets for /dns-query, /dns-json, and subscription DNS!
              </div>
            </div>

              <div class="form-group">
                <label class="form-label" for="dnsDoHMain">Primary Upstream DoH URL</label>
                <input type="text" id="dnsDoHMain" name="dnsDoH" class="form-control code-input" value="${settings.dnsDoH}" />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="setDohUpstream('https://cloudflare-dns.com/dns-query')">Cloudflare (Default)</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="setDohUpstream('https://dns.google/dns-query')">Google (8.8.8.8)</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="setDohUpstream('https://dns.adguard-dns.com/dns-query')">AdGuard (AdBlock)</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="setDohUpstream('https://dns.quad9.net/dns-query')">Quad9 (Security)</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="setDohUpstream('https://dns.mullvad.net/dns-query')">Mullvad (Privacy)</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="setDohUpstream('https://freedns.controld.com/p0')">ControlD</button>
              </div>

              <button type="submit" class="btn btn-primary btn-sm" style="width: 100%; height: 38px;">
                <span>Save DNS Provider to KV</span>
                <span>\u2728</span>
              </button>
            </form>
          </div>

          <!-- Live DNS Benchmark & Resolver -->
          <div class="card">
            <div class="card-title">
              <span>\u26A1</span>
              <span>Live DoH Query Tester</span>
            </div>
            <p class="card-desc">Direct RFC 8484 round-trip latency &amp; record verification tool.</p>

            <div style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
              <input type="text" id="dnsPageTestDomain" class="form-control code-input" value="cloudflare.com" placeholder="e.g. google.com" style="flex: 2; min-width: 140px;" />
              <select id="dnsPageTestType" class="form-control code-input" style="flex: 1; min-width: 80px;">
                <option value="A" selected>A</option>
                <option value="AAAA">AAAA</option>
                <option value="CNAME">CNAME</option>
                <option value="TXT">TXT</option>
                <option value="NS">NS</option>
                <option value="MX">MX</option>
              </select>
              <button type="button" class="btn btn-primary btn-sm" onclick="runCustomDohTest('dnsPageTestDomain', 'dnsPageTestType', 'dnsPageTestResult')" style="height: 38px; padding: 0 14px;">
                <span>\u26A1 Resolve</span>
              </button>
            </div>

            <div id="dnsPageTestResult" style="background: var(--theme-surface-strong); border: 1px solid var(--theme-border); border-radius: 10px; padding: 10px 12px; font-size: 12px; min-height: 80px;">
              <span style="color: var(--theme-text-muted);">Enter a domain and click Resolve to benchmark upstream DNS latency.</span>
            </div>
          </div>
        </div>

      </section>

      <!-- ====================================================================
           TAB 6: ROUTING & CHAIN (PRESETS, FRAGMENT, SOCKS/HTTP CHAIN)
           ==================================================================== -->
      <section id="tab-routing" class="tab-pane ${initialTab === "routing" ? "active" : ""}">
        
        <form action="/panel/settings/protocols" method="POST">
          <div class="grid-2col" style="margin-bottom: 16px;">
            
            <!-- Card 1: Subscription Routing Presets -->
            <div class="card">
              <div class="card-title">
                <span>\u{1F500}</span>
                <span>Subscription Routing Presets</span>
              </div>
              <p class="card-desc">Injected into Clash.Meta, Sing-box, and Xray subscription configs.</p>

              <div class="form-group">
                <label class="form-label" for="routingPreset">Active Preset</label>
                <select id="routingPreset" name="routingPreset" class="form-control">
                  <option value="off" ${settings.routingPreset === "off" ? "selected" : ""}>Off (Default &bull; Route all traffic via Proxy)</option>
                  <option value="bypass-iran" ${settings.routingPreset === "bypass-iran" ? "selected" : ""}>Bypass Iran (GEOIP/Geosite IR &amp; .ir direct)</option>
                  <option value="bypass-cn" ${settings.routingPreset === "bypass-cn" ? "selected" : ""}>Bypass China (GEOIP/Geosite CN &amp; .cn direct)</option>
                  <option value="block-ads" ${settings.routingPreset === "block-ads" ? "selected" : ""}>Block Ads &amp; Malicious Trackers</option>
                </select>
              </div>

              <!-- TLS Fragment Settings -->
              <div style="margin-top: 18px; padding-top: 14px; border-top: 1px dashed var(--theme-border);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <strong style="font-size: 13.5px;">Client-Side TLS Fragmentation</strong>
                  <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; font-weight: 700; color: var(--theme-primary);">
                    <input type="checkbox" name="fragmentEnabled" ${settings.fragmentEnabled ? "checked" : ""} style="accent-color: var(--theme-primary); width: 16px; height: 16px;" />
                    <span>Enable</span>
                  </label>
                </div>
                <p style="color: var(--theme-text-muted); font-size: 11.5px; margin-bottom: 10px;">Splits ClientHello TLS packets for DPI evasion in v2rayN and Nekobox.</p>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                  <div>
                    <label class="form-label" style="font-size: 11px;">Packets</label>
                    <input type="text" name="fragmentPackets" class="form-control code-input" value="${settings.fragmentPackets}" placeholder="tlshello" />
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 11px;">Length</label>
                    <input type="text" name="fragmentLength" class="form-control code-input" value="${settings.fragmentLength}" placeholder="100-200" />
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 11px;">Interval ms</label>
                    <input type="text" name="fragmentInterval" class="form-control code-input" value="${settings.fragmentInterval}" placeholder="10-20" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 2: Dual-Layer Chain Proxy -->
            <div class="card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <div class="card-title" style="margin-bottom: 0;">
                  <span>\u{1F517}</span>
                  <span>Dual-Layer Chain Proxy</span>
                </div>
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; font-weight: 700; color: var(--theme-secondary);">
                  <input type="checkbox" name="chainEnabled" ${settings.chainEnabled ? "checked" : ""} style="accent-color: var(--theme-secondary); width: 16px; height: 16px;" />
                  <span>Enable Chain</span>
                </label>
              </div>
              <p class="card-desc">Worker bridges traffic outbound via upstream HTTP/SOCKS5; Clash &amp; Sing-box inject dialer-proxy/detour.</p>

              <div style="display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 8px; margin-bottom: 10px;">
                <div>
                  <label class="form-label" style="font-size: 11px;">Type</label>
                  <select name="chainType" class="form-control code-input">
                    <option value="socks" ${settings.chainType === "socks" ? "selected" : ""}>SOCKS5</option>
                    <option value="http" ${settings.chainType === "http" ? "selected" : ""}>HTTP</option>
                  </select>
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px;">Upstream Address</label>
                  <input type="text" name="chainAddress" class="form-control code-input" value="${settings.chainAddress}" placeholder="proxy.example.com" />
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px;">Port</label>
                  <input type="number" name="chainPort" class="form-control code-input" value="${settings.chainPort}" placeholder="1080" />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                <div>
                  <label class="form-label" style="font-size: 11px;">Auth (Optional)</label>
                  <input type="text" name="chainAuth" class="form-control code-input" value="${settings.chainAuth}" placeholder="user:pass / UUID" />
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px;">Security</label>
                  <select name="chainSecurity" class="form-control code-input">
                    <option value="none" ${settings.chainSecurity === "none" ? "selected" : ""}>None</option>
                    <option value="tls" ${settings.chainSecurity === "tls" ? "selected" : ""}>TLS</option>
                  </select>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 11px;">Path</label>
                  <input type="text" name="chainPath" class="form-control code-input" value="${settings.chainPath}" placeholder="/path or empty" />
                </div>
                <div>
                  <label class="form-label" style="font-size: 11px;">SNI</label>
                  <input type="text" name="chainSni" class="form-control code-input" value="${settings.chainSni}" placeholder="sni.example.com" />
                </div>
              </div>
            </div>

          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; height: 42px;">
            <span>Save Routing &amp; Chain Rules to KV</span>
            <span>\u2728</span>
          </button>
        </form>

      </section>

      <!-- ====================================================================
           TAB 7: SETTINGS (PASSWORD, P2P SYNC, APPEARANCE)
           ==================================================================== -->
      <section id="tab-settings" class="tab-pane ${initialTab === "settings" ? "active" : ""}">
        
        <div class="grid-2col" style="margin-bottom: 16px;">
          <!-- Password Card -->
          <div class="card">
            <div class="card-title">
              <span>\u{1F511}</span>
              <span>Change Administrator Password</span>
            </div>
            <p class="card-desc">Updates your master dashboard password stored securely in Cloudflare KV.</p>

            <form action="/panel/settings/password" method="POST">
              <div class="form-group">
                <label class="form-label" for="currentPassword">Current Password</label>
                <input type="password" id="currentPassword" name="currentPassword" class="form-control" required placeholder="Current password" />
              </div>

              <div class="form-group">
                <label class="form-label" for="newPassword">New Password</label>
                <input type="password" id="newPassword" name="newPassword" class="form-control" required minlength="8" placeholder="Min 8 characters" />
              </div>

              <div class="form-group">
                <label class="form-label" for="confirmPassword">Confirm New Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" class="form-control" required minlength="8" placeholder="Repeat new password" />
              </div>

              <button type="submit" class="btn btn-primary" style="width: 100%; height: 40px; margin-top: 4px;">
                <span>Update Password in KV</span>
                <span>\u{1F512}</span>
              </button>
            </form>
          </div>

          <!-- Node Share P2P Peer Sync -->
          <div class="card">
            <div class="card-title">
              <span>\u{1F504}</span>
              <span>Node Share (Peer Sync)</span>
            </div>
            <p class="card-desc">Safely exchange routing, DoH, and chain settings with other BlueKnight instances.</p>

            <div class="form-group">
              <label class="form-label">Node Share Secret Token</label>
              <div class="copy-wrapper">
                <input type="text" readonly class="form-control code-input" value="${settings.nodeShareToken}" />
                <div class="copy-actions">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="copyToClipboard('${settings.nodeShareToken}')">\u{1F4CB} Copy</button>
                  <form action="/panel/settings/nodeshare/regen" method="POST" style="margin: 0;">
                    <button type="submit" class="btn btn-secondary btn-sm">\u{1F3B2} Regen</button>
                  </form>
                </div>
              </div>
            </div>

            <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--theme-border);">
              <label class="form-label">Import BlueKnight JSON Configuration</label>
              <textarea id="importJsonText" class="form-control code-input" rows="3" placeholder='Paste {"settings": {...}} exported from another BlueKnight node'></textarea>
              <button type="button" class="btn btn-secondary btn-sm" style="width: 100%; height: 36px; margin-top: 8px;" onclick="importNodeConfig()">
                <span>Merge Configuration into KV</span>
                <span>\u{1F4E5}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Appearance & Theme Selector Card -->
        <div class="card">
          <div class="card-title">
            <span>\u{1F3A8}</span>
            <span>Aesthetic Themes &amp; Wallpaper Engine</span>
          </div>
          <p class="card-desc">10 dynamically coordinated visual atmospheres with adaptive light and dark glass surfaces.</p>

          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <select class="form-control theme-selector-dropdown" onchange="setBlueKnightTheme(this.value)" style="flex: 2; min-width: 200px;">
              <option value="theme-1">Theme 1 \u2014 Sakura Emerald (Light Glass)</option>
              <option value="theme-2">Theme 2 \u2014 Royal Wine (Dark Glass)</option>
              <option value="theme-3">Theme 3 \u2014 Twilight Slate (Dark Glass)</option>
              <option value="theme-4">Theme 4 \u2014 Arctic Glacier (Light Glass)</option>
              <option value="theme-5">Theme 5 \u2014 Solar Flare (Dark Glass)</option>
              <option value="theme-6">Theme 6 \u2014 Copper Rust (Dark Glass)</option>
              <option value="theme-7">Theme 7 \u2014 Cyber Scarlet (Dark Glass)</option>
              <option value="theme-8">Theme 8 \u2014 Cobalt Breeze (Light Glass)</option>
              <option value="theme-9">Theme 9 \u2014 Sapphire Coast (Light Glass)</option>
              <option value="theme-10">Theme 10 \u2014 Obsidian Amethyst (Dark Glass)</option>
            </select>
            <button type="button" class="btn btn-primary" onclick="randomizeBlueKnightTheme()" style="flex: 1; min-width: 160px;">
              <span>\u{1F3B2} Randomize Theme</span>
            </button>
          </div>
        </div>

      </section>

    </main>
  </div>

  <script>
    function switchTab(tabName) {
      document.querySelectorAll('.tab-pane').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
      });
      document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

      const targetPane = document.getElementById('tab-' + tabName);
      const targetNav = document.getElementById('nav-' + tabName);
      
      if (targetPane) {
        targetPane.style.display = 'block';
        targetPane.classList.add('active');
      }
      if (targetNav) targetNav.classList.add('active');

      const headings = {
        overview: { icon: '\u{1F4CA}', title: 'System Dashboard', sub: 'Pastel proxy command center & live tunnel stats' },
        warp: { icon: '\u26A1', title: 'WARP & Amnezia Noise Engine', sub: 'WireGuard credentials, reserved bytes & junk packet obfuscation' },
        subscriptions: { icon: '\u{1F517}', title: 'Client Subscriptions & Feeds', sub: 'Live VLESS, Trojan, Clash.Meta, Sing-box & DoH feeds' },
        protocols: { icon: '\u{1F6E1}\uFE0F', title: 'Proxy Protocols & Inbound', sub: 'UUID credentials, clean IP fronting & local listening rules' },
        dns: { icon: '\u{1F310}', title: 'DNS Gateway & Upstream Resolver', sub: 'Manage upstream DoH endpoints & test real-time query latency' },
        routing: { icon: '\u{1F500}', title: 'Routing Presets & Chain Proxy', sub: 'Geo-bypass rules, TLS ClientHello fragmentation & upstream chaining' },
        settings: { icon: '\u2699\uFE0F', title: 'System & Security Settings', sub: 'Administrator KV password, Node Share P2P sync & themes' }
      };

      if (headings[tabName]) {
        const iconEl = document.getElementById('page-icon');
        if (iconEl) iconEl.innerText = headings[tabName].icon;
        document.getElementById('page-heading').innerText = headings[tabName].title;
        document.getElementById('page-subheading').innerText = headings[tabName].sub;
      }

      window.location.hash = tabName;
      closeSidebar();
    }

    function generateRandomUuid() {
      if (crypto && crypto.randomUUID) {
        const el = document.getElementById('vlessUuid');
        if (el) el.value = crypto.randomUUID();
        showToast('Generated new UUID!');
      }
    }

    function generateRandomPassword() {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let res = "wd_";
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      for (let i = 0; i < 16; i++) {
        res += chars[arr[i] % chars.length];
      }
      const el = document.getElementById('trojanPassword');
      if (el) el.value = res;
      showToast('Generated new Trojan password!');
    }

    function generateRandomToken() {
      const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
      let res = "";
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      for (let i = 0; i < 16; i++) {
        res += chars[arr[i] % chars.length];
      }
      const el = document.getElementById('subToken');
      if (el) el.value = res;
      showToast('Generated new Sub token!');
    }

    async function runCustomDohTest(domainInputId, typeInputId, resultBoxId) {
      const domain = document.getElementById(domainInputId).value.trim();
      const type = document.getElementById(typeInputId).value;
      const resBox = document.getElementById(resultBoxId);
      if (!domain) {
        showToast('Please enter a domain to resolve!');
        return;
      }
      resBox.style.display = 'block';
      resBox.innerHTML = '<div style="color: var(--theme-text-muted); font-size: 12px;">Resolving ' + domain + ' (' + type + ')...</div>';

      const startTime = performance.now();
      try {
        const response = await fetch('/dns-json?name=' + encodeURIComponent(domain) + '&type=' + encodeURIComponent(type));
        const duration = Math.round(performance.now() - startTime);
        if (!response.ok) {
          throw new Error('HTTP ' + response.status + ' ' + response.statusText);
        }
        const data = await response.json();

        let answersHtml = '';
        if (data.Answer && Array.isArray(data.Answer) && data.Answer.length > 0) {
          answersHtml = '<table style="width: 100%; border-collapse: collapse; font-size: 11.5px; margin-top: 6px;">' +
            '<thead><tr style="border-bottom: 1px solid var(--theme-border); color: var(--theme-text-muted);">' +
            '<th style="padding: 3px 6px; text-align: left;">Name</th>' +
            '<th style="padding: 3px 6px; text-align: left;">Type</th>' +
            '<th style="padding: 3px 6px; text-align: left;">TTL</th>' +
            '<th style="padding: 3px 6px; text-align: left;">Data</th>' +
            '</tr></thead><tbody>';
          data.Answer.forEach(ans => {
            answersHtml += '<tr style="border-bottom: 1px dashed var(--theme-border); font-family: var(--font-mono);">' +
              '<td style="padding: 4px 6px;">' + (ans.name || '') + '</td>' +
              '<td style="padding: 4px 6px;"><span class="badge badge-sky" style="font-size: 10px;">' + (ans.type || type) + '</span></td>' +
              '<td style="padding: 4px 6px;">' + (ans.TTL || '') + 's</td>' +
              '<td style="padding: 4px 6px; font-weight: 700; color: var(--theme-primary);">' + (ans.data || '') + '</td>' +
              '</tr>';
          });
          answersHtml += '</tbody></table>';
        } else {
          answersHtml = '<div style="margin-top: 6px; font-size: 11.5px; color: var(--theme-text-muted);">No Answer records returned (Status: ' + (data.Status === 0 ? 'NOERROR' : data.Status) + ')</div>';
        }

        resBox.innerHTML = 
          '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">' +
            '<div style="display: flex; align-items: center; gap: 6px;">' +
              '<span class="badge badge-mint" style="font-size: 10px;">Status: ' + (data.Status === 0 ? 'NOERROR' : data.Status) + '</span>' +
              '<span style="font-size: 11.5px; color: var(--theme-text-muted);">Query: <strong>' + domain + '</strong></span>' +
            '</div>' +
            '<span class="badge badge-lavender" style="font-size: 10px;">RTT: ' + duration + ' ms</span>' +
          '</div>' + answersHtml;
      } catch (err) {
        resBox.innerHTML = '<div style="color: var(--theme-primary); font-size: 12px;">\u26A0\uFE0F Resolution error: ' + err.message + '</div>';
      }
    }

    function runDohTest() {
      runCustomDohTest('dohTestDomain', 'dohTestType', 'dohTestResult');
    }

    function setDohUpstream(url) {
      const el1 = document.getElementById('dnsDoH');
      const el2 = document.getElementById('dnsDoHMain');
      if (el1) el1.value = url;
      if (el2) el2.value = url;
      showToast('Selected DoH: ' + url);
    }

    function setCleanIp(ip) {
      const el = document.getElementById('proxyIp');
      if (el) {
        el.value = ip;
        showToast(ip ? 'Selected Clean IP: ' + ip : 'Reset to default Worker host');
      }
    }

    async function importNodeConfig() {
      const jsonStr = document.getElementById('importJsonText').value.trim();
      if (!jsonStr) {
        showToast('Please paste JSON configuration first!');
        return;
      }
      try {
        const parsed = JSON.parse(jsonStr);
        const res = await fetch('/api/node/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });
        const result = await res.json();
        if (res.ok) {
          showToast('Imported ' + result.importedCount + ' settings! Reloading...');
          setTimeout(() => window.location.reload(), 1200);
        } else {
          alert('Import failed: ' + (result.message || result.error));
        }
      } catch (err) {
        alert('Invalid JSON syntax: ' + err.message);
      }
    }

    // Restore tab from URL hash on load
    window.addEventListener('DOMContentLoaded', () => {
      const validTabs = ['overview', 'warp', 'subscriptions', 'protocols', 'dns', 'routing', 'settings'];
      const hash = window.location.hash.replace('#', '');
      if (hash && validTabs.includes(hash)) {
        switchTab(hash);
      } else if ('${initialTab}' && validTabs.includes('${initialTab}')) {
        switchTab('${initialTab}');
      }
    });
  <\/script>
  `;
  return renderPageLayout({
    title: "Dashboard",
    content
  });
}
function x25519(scalarBytes, uBytes) {
  const k = new Uint8Array(scalarBytes);
  k[0] &= 248;
  k[31] &= 127;
  k[31] |= 64;
  let u = 0n;
  for (let i = 0; i < 32; i++) {
    u |= BigInt(uBytes[i]) << BigInt(8 * i);
  }
  const x1 = u % P;
  let x2 = 1n, z2 = 0n;
  let x3 = u % P, z3 = 1n;
  let swap = 0n;
  for (let t = 254; t >= 0; t--) {
    const byteIdx = t >> 3;
    const bitIdx = t & 7;
    const k_t = BigInt(k[byteIdx] >> bitIdx & 1);
    swap ^= k_t;
    if (swap === 1n) {
      let tmp = x2;
      x2 = x3;
      x3 = tmp;
      tmp = z2;
      z2 = z3;
      z3 = tmp;
    }
    swap = k_t;
    const A = (x2 + z2) % P;
    const AA = A * A % P;
    const B = (x2 - z2 + P) % P;
    const BB = B * B % P;
    const E = (AA - BB + P) % P;
    const C = (x3 + z3) % P;
    const D = (x3 - z3 + P) % P;
    const DA = D * A % P;
    const CB = C * B % P;
    const x3_new = (DA + CB) % P * ((DA + CB) % P) % P;
    const diff = (DA - CB + P) % P;
    const z3_new = x1 * (diff * diff % P) % P;
    const x2_new = AA * BB % P;
    const z2_new = E * ((AA + A24 * E % P) % P) % P;
    x2 = x2_new;
    z2 = z2_new;
    x3 = x3_new;
    z3 = z3_new;
  }
  if (swap === 1n) {
    let tmp = x2;
    x2 = x3;
    x3 = tmp;
    tmp = z2;
    z2 = z3;
    z3 = tmp;
  }
  function modPow(base, exp, mod) {
    let res = 1n;
    base = base % mod;
    while (exp > 0n) {
      if (exp & 1n)
        res = res * base % mod;
      base = base * base % mod;
      exp >>= 1n;
    }
    return res;
  }
  __name(modPow, "modPow");
  __name2(modPow, "modPow");
  const result = x2 * modPow(z2, P - 2n, P) % P;
  const out = new Uint8Array(32);
  let temp = result;
  for (let i = 0; i < 32; i++) {
    out[i] = Number(temp & 0xffn);
    temp >>= 8n;
  }
  return out;
}
function bytesToBase64(bytes) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function generateWireGuardKeyPair() {
  const priv = crypto.getRandomValues(new Uint8Array(32));
  priv[0] &= 248;
  priv[31] &= 127;
  priv[31] |= 64;
  const baseU = new Uint8Array(32);
  baseU[0] = 9;
  const pub = x25519(priv, baseU);
  return {
    privateKey: bytesToBase64(priv),
    publicKey: bytesToBase64(pub)
  };
}
function parseReservedBytes(clientIdB64) {
  if (!clientIdB64)
    return "";
  try {
    const binary = atob(clientIdB64);
    const bytes = [];
    for (let i = 0; i < binary.length; i++) {
      bytes.push(binary.charCodeAt(i));
    }
    return bytes.join(", ");
  } catch {
    return clientIdB64;
  }
}
async function registerWarpAccount(env2) {
  const kv = getKV(env2);
  if (!kv) {
    throw new Error("KV binding (BK_KV or WD_KV) is required to persist Warp credentials.");
  }
  const { privateKey, publicKey } = generateWireGuardKeyPair();
  const payload = {
    key: publicKey,
    install_id: "",
    fcm_token: "",
    tos: (/* @__PURE__ */ new Date()).toISOString(),
    model: "PC",
    serial_number: "",
    locale: "en_US"
  };
  const response = await fetch("https://api.cloudflareclient.com/v0a2158/reg", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "User-Agent": "okhttp/3.12.1",
      "CF-Client-Version": "a-6.3-2158"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Cloudflare Warp API registration failed (status ${response.status}): ${errText.slice(0, 150)}`);
  }
  const data = await response.json();
  if (!data || !data.config) {
    throw new Error("Invalid response received from Cloudflare Warp API: missing config.");
  }
  const ipv4 = data.config.interface?.addresses?.v4 || "172.16.0.2";
  const ipv6 = data.config.interface?.addresses?.v6 || "";
  const peerPublicKey = data.config.peers?.[0]?.public_key || "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=";
  const endpoint = "162.159.192.1:2408";
  const reserved = parseReservedBytes(data.config.client_id);
  try {
    await kv.put(KV_KEYS.warpPrivateKey, privateKey);
    await kv.put(KV_KEYS.warpPeerPublicKey, peerPublicKey);
    if (ipv6)
      await kv.put(KV_KEYS.warpIPv6, ipv6);
    if (reserved)
      await kv.put(KV_KEYS.warpReserved, reserved);
    invalidateSettingsCache();
  } catch (putErr) {
    const isQuota = putErr?.message?.toLowerCase().includes("quota") || putErr?.message?.toLowerCase().includes("limit exceeded");
    if (isQuota) {
      throw new Error("KV write quota exceeded \u2014 try again after daily reset");
    }
    throw putErr;
  }
  return {
    ok: true,
    privateKey,
    publicKey,
    peerPublicKey,
    ipv4,
    ipv6,
    reserved,
    endpoint,
    accountId: data.id
  };
}
function generateRandomToken2(length = 24) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}
async function handlePanel(request, env2) {
  const url = new URL(request.url);
  const isConfigured = await hasConfiguredPassword(env2);
  if (!isConfigured) {
    return Response.redirect(`${url.origin}/panel/setup`, 302);
  }
  const cookies = parseCookies(request);
  const token = cookies[APP_CONFIG.cookieName];
  if (!token) {
    return Response.redirect(`${url.origin}/panel/login`, 302);
  }
  const session = await verifySessionToken(token, env2);
  if (!session) {
    return Response.redirect(
      `${url.origin}/panel/login?error=${encodeURIComponent("Session expired. Please log in again.")}`,
      302
    );
  }
  let settings = await getOrInitSettings(env2);
  let flashMessage;
  if (url.searchParams.get("setup") === "success") {
    flashMessage = { type: "success", text: "Welcome to BlueKnight Panel! Administrator password configured successfully. \u2728" };
  }
  let initialTab = "overview";
  const pathname = url.pathname;
  // Every sidebar entry needs a working deep link, not just the four that
  // happened to be listed here: /panel/settings/dns, /routing, /subscriptions
  // and /settings all used to fall back to the overview tab.
  const TAB_ROUTES = {
    protocols: "protocols",
    warp: "warp",
    subscriptions: "subscriptions",
    dns: "dns",
    routing: "routing",
    settings: "settings",
    overview: "overview",
    password: "settings",
    nodeshare: "settings"
  };
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "";
  if (TAB_ROUTES[lastSegment]) {
    initialTab = TAB_ROUTES[lastSegment];
  }
  if (request.method === "POST") {
    if (pathname === "/panel/settings/password") {
      initialTab = "settings";
      try {
        const formData = await request.formData();
        const currentPass = String(formData.get("currentPassword") || "");
        const newPass = String(formData.get("newPassword") || "");
        const confirmPass = String(formData.get("confirmPassword") || "");
        const isCurrentValid = await verifyPassword(currentPass, env2);
        if (!isCurrentValid) {
          flashMessage = { type: "error", text: "Current password was incorrect." };
        } else if (newPass !== confirmPass) {
          flashMessage = { type: "error", text: "New passwords do not match." };
        } else if (newPass.length < 8) {
          flashMessage = { type: "error", text: "New password must be at least 8 characters." };
        } else {
          await setPassword(newPass, env2);
          invalidatePasswordCache();
          flashMessage = { type: "success", text: "Password updated successfully in KV storage! \u{1F338}" };
        }
      } catch (err) {
        const isQuota = err?.message?.toLowerCase().includes("quota") || err?.message?.toLowerCase().includes("limit exceeded");
        flashMessage = {
          type: "error",
          text: isQuota ? "KV write quota exceeded \u2014 try again after daily reset" : err.message || "Failed to update password."
        };
      }
    } else if (pathname === "/panel/settings/nodeshare/regen") {
      initialTab = "settings";
      try {
        const kv = getKV(env2);
        if (!kv) {
          throw new Error("KV binding (BK_KV or WD_KV) is not available");
        }
        const newToken = generateRandomToken2(24);
        await kv.put(KV_KEYS.nodeShareToken, newToken);
        invalidateSettingsCache();
        settings = await getOrInitSettings(env2);
        flashMessage = { type: "success", text: "New Node Share token generated! \u2728" };
      } catch (err) {
        const isQuota = err?.message?.toLowerCase().includes("quota") || err?.message?.toLowerCase().includes("limit exceeded");
        flashMessage = {
          type: "error",
          text: isQuota ? "KV write quota exceeded \u2014 try again after daily reset" : err.message || "Failed to regenerate share token."
        };
      }
    } else if (pathname === "/panel/settings/warp/generate") {
      initialTab = "warp";
      try {
        const res = await registerWarpAccount(env2);
        if (res.ok) {
          settings = await getOrInitSettings(env2);
          flashMessage = {
            type: "success",
            text: `Warp account registered successfully! WireGuard & AmneziaWG active with Reserved bytes [${res.reserved}]. \u26A1`
          };
        } else {
          flashMessage = {
            type: "error",
            text: res.error || "Failed to register Warp account."
          };
        }
      } catch (err) {
        flashMessage = {
          type: "error",
          text: err.message || "Failed to generate Warp account."
        };
      }
    } else if (pathname === "/panel/settings/protocols") {
      try {
        const kv = getKV(env2);
        if (!kv) {
          throw new Error("KV binding (BK_KV or WD_KV) is not available");
        }
        const formData = await request.formData();
        const currentSettings = await getOrInitSettings(env2);
        const updates = [];
        const check = /* @__PURE__ */ __name((key, fieldName, newVal, oldVal) => {
          if (formData.has(fieldName) && newVal !== oldVal) {
            updates.push({ key, value: newVal });
          }
        }, "check");
        const checkBool = /* @__PURE__ */ __name((key, newVal, oldVal) => {
          if (newVal !== oldVal) {
            updates.push({ key, value: newVal });
          }
        }, "checkBool");
        if (formData.has("vlessUuid")) {
          initialTab = "protocols";
          const newUuid = String(formData.get("vlessUuid") || "").trim();
          if (newUuid && newUuid !== currentSettings.vlessUuid) {
            updates.push({ key: KV_KEYS.vlessUuid, value: newUuid });
          }
        }
        if (formData.has("trojanPassword")) {
          initialTab = "protocols";
          const newTrojan = String(formData.get("trojanPassword") || "").trim();
          if (newTrojan && newTrojan !== currentSettings.trojanPassword) {
            updates.push({ key: KV_KEYS.trojanPassword, value: newTrojan });
          }
        }
        if (formData.has("proxyPath")) {
          initialTab = "protocols";
          const newPath = String(formData.get("proxyPath") || "").trim();
          if (newPath) {
            const formattedPath = newPath.startsWith("/") ? newPath : `/${newPath}`;
            if (formattedPath !== currentSettings.proxyPath) {
              updates.push({ key: KV_KEYS.proxyPath, value: formattedPath });
            }
          }
        }
        if (formData.has("subToken")) {
          initialTab = "protocols";
          const newSubToken = String(formData.get("subToken") || "").trim();
          if (newSubToken && newSubToken !== currentSettings.subToken) {
            updates.push({ key: KV_KEYS.subToken, value: newSubToken });
          }
        }
        if (formData.has("proxyIp")) {
          initialTab = "protocols";
          check(KV_KEYS.proxyIp, "proxyIp", String(formData.get("proxyIp") || "").trim(), currentSettings.proxyIp);
        }
        if (formData.has("dnsDoH")) {
          if (!formData.has("vlessUuid")) initialTab = "dns";
          check(KV_KEYS.dnsDoH, "dnsDoH", String(formData.get("dnsDoH") || "").trim(), currentSettings.dnsDoH);
        }
        if (formData.has("allowLANConnection") || formData.has("staticIpList")) {
          initialTab = "protocols";
          const allowLANVal = formData.get("allowLANConnection");
          const allowLANConnection = allowLANVal === "on" || allowLANVal === "true" ? "true" : "false";
          checkBool(KV_KEYS.allowLANConnection, allowLANConnection, String(currentSettings.allowLANConnection));
        }
        if (formData.has("domainFrontingEnabled") || formData.has("frontingSni")) {
          initialTab = "protocols";
          const frontingVal = formData.get("domainFrontingEnabled");
          const domainFrontingEnabled = frontingVal === "on" || frontingVal === "true" ? "true" : "false";
          checkBool(KV_KEYS.domainFrontingEnabled, domainFrontingEnabled, String(currentSettings.domainFrontingEnabled));
          check(KV_KEYS.frontingSni, "frontingSni", String(formData.get("frontingSni") || "cdnjs.cloudflare.com").trim(), currentSettings.frontingSni);
          check(KV_KEYS.frontingHost, "frontingHost", String(formData.get("frontingHost") || "").trim(), currentSettings.frontingHost);
          check(KV_KEYS.frontingCleanIps, "frontingCleanIps", String(formData.get("frontingCleanIps") || "").trim(), currentSettings.frontingCleanIps);
        }
        if (formData.has("staticIpList")) {
          initialTab = "protocols";
          check(KV_KEYS.staticIpList, "staticIpList", String(formData.get("staticIpList") || "").trim(), currentSettings.staticIpList);
        }
        if (formData.has("ssEnabled") || formData.has("ssPassword") || formData.has("ssMethod")) {
          initialTab = "protocols";
          const ssVal = formData.get("ssEnabled");
          const ssEnabled = ssVal === "on" || ssVal === "true" ? "true" : "false";
          checkBool(KV_KEYS.ssEnabled, ssEnabled, String(currentSettings.ssEnabled));
          check(KV_KEYS.ssPassword, "ssPassword", String(formData.get("ssPassword") || "").trim(), currentSettings.ssPassword);
          check(KV_KEYS.ssMethod, "ssMethod", String(formData.get("ssMethod") || "chacha20-ietf-poly1305").trim(), currentSettings.ssMethod);
        }
        if (formData.has("xhttpEnabled") || formData.has("xhttpPath") || formData.has("httpUpgradeEnabled")) {
          initialTab = "protocols";
          const xhttpVal = formData.get("xhttpEnabled");
          const xhttpEnabled = xhttpVal === "on" || xhttpVal === "true" ? "true" : "false";
          checkBool(KV_KEYS.xhttpEnabled, xhttpEnabled, String(currentSettings.xhttpEnabled));
          check(KV_KEYS.xhttpPath, "xhttpPath", String(formData.get("xhttpPath") || "/bk-xhttp").trim(), currentSettings.xhttpPath);
          check(KV_KEYS.xhttpMode, "xhttpMode", String(formData.get("xhttpMode") || "stream-one").trim(), currentSettings.xhttpMode);
          const httpUpVal = formData.get("httpUpgradeEnabled");
          const httpUpgradeEnabled = httpUpVal === "on" || httpUpVal === "true" ? "true" : "false";
          checkBool(KV_KEYS.httpUpgradeEnabled, httpUpgradeEnabled, String(currentSettings.httpUpgradeEnabled));
        }
        if (formData.has("anytlsFingerprint") || formData.has("anytlsAlpn")) {
          initialTab = "protocols";
          check(KV_KEYS.anytlsFingerprint, "anytlsFingerprint", String(formData.get("anytlsFingerprint") || "chrome").trim(), currentSettings.anytlsFingerprint);
          check(KV_KEYS.anytlsAlpn, "anytlsAlpn", String(formData.get("anytlsAlpn") || "h2,http/1.1").trim(), currentSettings.anytlsAlpn);
        }
        if (formData.has("dnsCustom")) {
          if (!formData.has("vlessUuid")) initialTab = "dns";
          check(KV_KEYS.dnsCustom, "dnsCustom", String(formData.get("dnsCustom") || "").trim(), currentSettings.dnsCustom);
        }
        if (formData.has("openvpnEnabled") || formData.has("openvpnPort") || formData.has("openvpnCipher")) {
          initialTab = "protocols";
          const ovpnVal = formData.get("openvpnEnabled");
          const openvpnEnabled = ovpnVal === "on" || ovpnVal === "true" ? "true" : "false";
          checkBool(KV_KEYS.openvpnEnabled, openvpnEnabled, String(currentSettings.openvpnEnabled));
          check(KV_KEYS.openvpnPort, "openvpnPort", String(formData.get("openvpnPort") || "443").trim(), currentSettings.openvpnPort);
          check(KV_KEYS.openvpnProto, "openvpnProto", String(formData.get("openvpnProto") || "tcp").trim(), currentSettings.openvpnProto);
          check(KV_KEYS.openvpnCipher, "openvpnCipher", String(formData.get("openvpnCipher") || "AES-256-GCM").trim(), currentSettings.openvpnCipher);
        }
        if (formData.has("fragmentEnabled") || formData.has("fragmentPackets")) {
          initialTab = "routing";
          const fragmentVal = formData.get("fragmentEnabled");
          const fragmentEnabled = fragmentVal === "on" || fragmentVal === "true" ? "true" : "false";
          checkBool(KV_KEYS.fragmentEnabled, fragmentEnabled, String(currentSettings.fragmentEnabled));
          check(KV_KEYS.fragmentPackets, "fragmentPackets", String(formData.get("fragmentPackets") || "tlshello").trim(), currentSettings.fragmentPackets);
          check(KV_KEYS.fragmentLength, "fragmentLength", String(formData.get("fragmentLength") || "100-200").trim(), currentSettings.fragmentLength);
          check(KV_KEYS.fragmentInterval, "fragmentInterval", String(formData.get("fragmentInterval") || "10-20").trim(), currentSettings.fragmentInterval);
        }
        if (formData.has("routingPreset")) {
          initialTab = "routing";
          check(KV_KEYS.routingPreset, "routingPreset", String(formData.get("routingPreset") || "off").trim(), currentSettings.routingPreset);
        }
        if (formData.has("warpPrivateKey") || formData.has("warpProEnabled") || formData.has("warpPeerPublicKey")) {
          initialTab = "warp";
          const warpProVal = formData.get("warpProEnabled");
          const warpProEnabled = warpProVal === "on" || warpProVal === "true" ? "true" : "false";
          check(KV_KEYS.warpPrivateKey, "warpPrivateKey", String(formData.get("warpPrivateKey") || "").trim(), currentSettings.warpPrivateKey);
          check(KV_KEYS.warpPeerPublicKey, "warpPeerPublicKey", String(formData.get("warpPeerPublicKey") || "").trim(), currentSettings.warpPeerPublicKey);
          check(KV_KEYS.warpIPv6, "warpIPv6", String(formData.get("warpIPv6") || "").trim(), currentSettings.warpIPv6);
          check(KV_KEYS.warpReserved, "warpReserved", String(formData.get("warpReserved") || "").trim(), currentSettings.warpReserved);
          checkBool(KV_KEYS.warpProEnabled, warpProEnabled, String(currentSettings.warpProEnabled));
          check(KV_KEYS.warpAmneziaVersion, "warpAmneziaVersion", String(formData.get("warpAmneziaVersion") || "2").trim(), currentSettings.warpAmneziaVersion);
          check(KV_KEYS.warpNoiseCount, "warpNoiseCount", String(formData.get("warpNoiseCount") || "5").trim(), currentSettings.warpNoiseCount);
          check(KV_KEYS.warpNoiseMin, "warpNoiseMin", String(formData.get("warpNoiseMin") || "10").trim(), currentSettings.warpNoiseMin);
          check(KV_KEYS.warpNoiseMax, "warpNoiseMax", String(formData.get("warpNoiseMax") || "50").trim(), currentSettings.warpNoiseMax);
          check(KV_KEYS.warpNoiseDelay, "warpNoiseDelay", String(formData.get("warpNoiseDelay") || "20").trim(), currentSettings.warpNoiseDelay);
          check(KV_KEYS.warpAmneziaS1, "warpAmneziaS1", String(formData.get("warpAmneziaS1") || "15").trim(), currentSettings.warpAmneziaS1);
          check(KV_KEYS.warpAmneziaS2, "warpAmneziaS2", String(formData.get("warpAmneziaS2") || "25").trim(), currentSettings.warpAmneziaS2);
          check(KV_KEYS.warpAmneziaH1, "warpAmneziaH1", String(formData.get("warpAmneziaH1") || "1").trim(), currentSettings.warpAmneziaH1);
          check(KV_KEYS.warpAmneziaH2, "warpAmneziaH2", String(formData.get("warpAmneziaH2") || "2").trim(), currentSettings.warpAmneziaH2);
          check(KV_KEYS.warpAmneziaH3, "warpAmneziaH3", String(formData.get("warpAmneziaH3") || "3").trim(), currentSettings.warpAmneziaH3);
          check(KV_KEYS.warpAmneziaH4, "warpAmneziaH4", String(formData.get("warpAmneziaH4") || "4").trim(), currentSettings.warpAmneziaH4);
        }
        if (formData.has("chainEnabled") || formData.has("chainType") || formData.has("chainAddress")) {
          initialTab = "routing";
          const chainVal = formData.get("chainEnabled");
          const chainEnabled = chainVal === "on" || chainVal === "true" ? "true" : "false";
          checkBool(KV_KEYS.chainEnabled, chainEnabled, String(currentSettings.chainEnabled));
          check(KV_KEYS.chainType, "chainType", String(formData.get("chainType") || "socks").trim(), currentSettings.chainType);
          check(KV_KEYS.chainAddress, "chainAddress", String(formData.get("chainAddress") || "").trim(), currentSettings.chainAddress);
          check(KV_KEYS.chainPort, "chainPort", String(formData.get("chainPort") || "1080").trim(), String(currentSettings.chainPort));
          check(KV_KEYS.chainAuth, "chainAuth", String(formData.get("chainAuth") || "").trim(), currentSettings.chainAuth);
          check(KV_KEYS.chainPath, "chainPath", String(formData.get("chainPath") || "").trim(), currentSettings.chainPath);
          check(KV_KEYS.chainSecurity, "chainSecurity", String(formData.get("chainSecurity") || "none").trim(), currentSettings.chainSecurity);
          check(KV_KEYS.chainTransport, "chainTransport", String(formData.get("chainTransport") || "tcp").trim(), currentSettings.chainTransport);
          check(KV_KEYS.chainSni, "chainSni", String(formData.get("chainSni") || "").trim(), currentSettings.chainSni);
          check(KV_KEYS.chainHost, "chainHost", String(formData.get("chainHost") || "").trim(), currentSettings.chainHost);
        }
        if (updates.length === 0) {
          flashMessage = { type: "success", text: "No settings were modified \u2014 0 KV writes consumed. \u2728" };
        } else {
          for (const item of updates) {
            try {
              await kv.put(item.key, item.value);
            } catch (putErr) {
              const isQuota = putErr?.message?.toLowerCase().includes("quota") || putErr?.message?.toLowerCase().includes("limit exceeded");
              throw new Error(isQuota ? "KV write quota exceeded \u2014 try again after daily reset" : putErr?.message || "Failed to write to KV");
            }
          }
          invalidateSettingsCache();
          settings = await getOrInitSettings(env2);
          flashMessage = { type: "success", text: `Saved ${updates.length} updated setting(s) to KV! \u2728` };
        }
      } catch (err) {
        flashMessage = { type: "error", text: err.message || "Failed to save protocol settings." };
      }
    }
  }
  const html = renderDashboardPage({
    host: url.host,
    isDefaultPassword: false,
    flashMessage,
    settings,
    initialTab
  });
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
async function authorizeSubscription(request, env2, expectedToken) {
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");
  if (queryToken && constantTimeEquals(queryToken, expectedToken)) {
    return true;
  }
  const cookies = parseCookies(request);
  const sessionToken = cookies[APP_CONFIG.cookieName];
  if (sessionToken) {
    const session = await verifySessionToken(sessionToken, env2);
    if (session)
      return true;
  }
  return false;
}
function buildClashChainProxy(settings) {
  if (!settings.chainEnabled || !settings.chainAddress)
    return "";
  const type = settings.chainType;
  const isTls = settings.chainSecurity === "tls";
  if (type === "socks" || type === "http") {
    let authYaml = "";
    if (settings.chainAuth && settings.chainAuth.includes(":")) {
      const [user, pass] = settings.chainAuth.split(":");
      authYaml = `
    username: "${user}"
    password: "${pass}"`;
    }
    return `
  - name: "Chain-Upstream"
    type: ${type}
    server: "${settings.chainAddress}"
    port: ${settings.chainPort}${isTls ? "\n    tls: true" : ""}${authYaml}`;
  }
  if (type === "trojan") {
    return `
  - name: "Chain-Upstream"
    type: trojan
    server: "${settings.chainAddress}"
    port: ${settings.chainPort}
    password: "${settings.chainAuth || "password"}"
    tls: ${isTls}
    sni: "${settings.chainSni || settings.chainAddress}"
    network: ${settings.chainTransport}
    ${settings.chainTransport === "ws" ? `ws-opts:
      path: "${settings.chainPath || "/"}"
      headers:
        Host: "${settings.chainHost || settings.chainAddress}"` : ""}`;
  }
  if (type === "vless") {
    return `
  - name: "Chain-Upstream"
    type: vless
    server: "${settings.chainAddress}"
    port: ${settings.chainPort}
    uuid: "${settings.chainAuth || "00000000-0000-0000-0000-000000000000"}"
    cipher: auto
    tls: ${isTls}
    servername: "${settings.chainSni || settings.chainAddress}"
    network: ${settings.chainTransport}
    ${settings.chainTransport === "ws" ? `ws-opts:
      path: "${settings.chainPath || "/"}"
      headers:
        Host: "${settings.chainHost || settings.chainAddress}"` : ""}`;
  }
  return `
  - name: "Chain-Upstream"
    type: ss
    server: "${settings.chainAddress}"
    port: ${settings.chainPort}
    cipher: "chacha20-ietf-poly1305"
    password: "${settings.chainAuth || "secret"}"`;
}
function buildSingboxChainOutbound(settings) {
  if (!settings.chainEnabled || !settings.chainAddress)
    return null;
  const type = settings.chainType;
  const isTls = settings.chainSecurity === "tls";
  if (type === "socks" || type === "http") {
    const outbound = {
      type,
      tag: "chain-upstream",
      server: settings.chainAddress,
      server_port: settings.chainPort
    };
    if (settings.chainAuth && settings.chainAuth.includes(":")) {
      const [username, password] = settings.chainAuth.split(":");
      outbound.username = username;
      outbound.password = password;
    }
    return outbound;
  }
  if (type === "trojan") {
    return {
      type: "trojan",
      tag: "chain-upstream",
      server: settings.chainAddress,
      server_port: settings.chainPort,
      password: settings.chainAuth || "password",
      tls: {
        enabled: isTls,
        server_name: settings.chainSni || settings.chainAddress
      },
      transport: {
        type: settings.chainTransport,
        path: settings.chainPath || "/",
        headers: { Host: settings.chainHost || settings.chainAddress }
      }
    };
  }
  if (type === "vless") {
    return {
      type: "vless",
      tag: "chain-upstream",
      server: settings.chainAddress,
      server_port: settings.chainPort,
      uuid: settings.chainAuth || "00000000-0000-0000-0000-000000000000",
      tls: {
        enabled: isTls,
        server_name: settings.chainSni || settings.chainAddress
      },
      transport: {
        type: settings.chainTransport,
        path: settings.chainPath || "/",
        headers: { Host: settings.chainHost || settings.chainAddress }
      }
    };
  }
  return {
    type: "shadowsocks",
    tag: "chain-upstream",
    server: settings.chainAddress,
    server_port: settings.chainPort,
    method: "chacha20-ietf-poly1305",
    password: settings.chainAuth || "secret"
  };
}
function generateOpenVpnProfile(profile) {
  if (typeof profile !== "string" || !/^remote\s+\S+\s+\d+/m.test(profile) ||
      !profile.includes("-----BEGIN CERTIFICATE-----") || !profile.includes("<key>")) return null;
  return profile;
}
async function handleXhttpProxy(request, env2, ctx) {
  const settings = await getOrInitSettings(env2);
  const reader = request.body ? request.body.getReader() : null;
  if (!reader) {
    return new Response("Missing XHTTP Request Body", { status: 400 });
  }
  const { value: firstChunk, done } = await reader.read();
  if (done || !firstChunk || firstChunk.length === 0) {
    return new Response("Empty XHTTP Stream", { status: 400 });
  }
  let targetHost = "";
  let targetPort = 0;
  let initialPayload = new Uint8Array(0);
  let responseHeader = null;
  if (isTrojanPacket(firstChunk)) {
    const trojan = parseTrojanHeader(firstChunk, settings.trojanPassword);
    if (!trojan || !trojan.isValidUser || trojan.command !== 1) {
      return new Response("Trojan Auth Failed", { status: 403 });
    }
    targetHost = trojan.targetAddress;
    targetPort = trojan.targetPort;
    initialPayload = trojan.payload;
  } else {
    const vless = parseVlessHeader(firstChunk, settings.vlessUuid);
    if (!vless || !vless.isValidUser || vless.command !== 1) {
      return new Response("VLESS Auth Failed", { status: 403 });
    }
    targetHost = vless.targetAddress;
    targetPort = vless.targetPort;
    initialPayload = vless.payload;
    responseHeader = createVlessResponseHeader(vless.version);
  }
  try {
    const socket = await establishOutboundSocket(targetHost, targetPort, settings);
    const writer = socket.writable.getWriter();
    if (initialPayload.length > 0) {
      await writer.write(initialPayload);
    }
    const forwardBodyPromise = (async () => {
      try {
        while (true) {
          const { value, done: isDone } = await reader.read();
          if (isDone) break;
          if (value && value.length > 0) {
            await writer.write(value);
          }
        }
        await writer.close();
      } catch (_) {
        socket.close();
      } finally {
        writer.releaseLock();
        reader.releaseLock();
      }
    })();
    if (ctx && typeof ctx.waitUntil === "function") {
      ctx.waitUntil(forwardBodyPromise);
    }
    const responseStream = new TransformStream({
      start(controller) {
        if (responseHeader) controller.enqueue(responseHeader);
      },
      transform(chunk, controller) { controller.enqueue(chunk); }
    });
    const relay = socket.readable.pipeTo(responseStream.writable).catch(() => socket.close());
    if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(relay);
    return new Response(responseStream.readable, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Connection": "keep-alive"
      }
    });
  } catch (err) {
    return new Response("XHTTP Upstream Connection Failed: " + err.message, { status: 502 });
  }
}
async function handleSubscription(pathname, request, env2) {
  const url = new URL(request.url);
  const incomingHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  const workerHost = new URL(`https://${incomingHost}`).hostname;
  const settings = await getOrInitSettings(env2);
  const isAuthorized = await authorizeSubscription(request, env2, settings.subToken);
  if (!isAuthorized) {
    return new Response(
      JSON.stringify(
        {
          error: "Unauthorized",
          message: "A valid subscription token (?token=...) or active panel session is required."
        },
        null,
        2
      ),
      {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      }
    );
  }
  const serverAddress = settings.proxyIp && settings.proxyIp.trim().length > 0 ? settings.proxyIp.trim() : workerHost;
  const requestedProtocol = pathname.replace(/^\/sub\//, "").toLowerCase();
  const protocol = requestedProtocol === "all" ? "singbox" : requestedProtocol;
  const defaultPorts = request.cf || /\.(pages|workers)\.dev$/.test(workerHost) ? "443,2053,2083,2087,2096,8443" : "443";
  const cfPorts = [...new Set(String(env2.PROXY_PORTS ?? defaultPorts).split(",").map(Number).filter(port => Number.isInteger(port) && port > 0 && port < 65536))];
  if (!cfPorts.length) return Response.json({ error: "Invalid PROXY_PORTS configuration" }, { status: 503 });
  const proxyPath = settings.proxyPath.startsWith("/") ? settings.proxyPath : `/${settings.proxyPath}`;
  const encodedPath = encodeURIComponent(proxyPath);
  const xhttpPath = (settings.xhttpPath || "/bk-xhttp").startsWith("/") ? settings.xhttpPath : `/${settings.xhttpPath}`;
  const encodedXhttpPath = encodeURIComponent(xhttpPath);
  const fragmentQuery = settings.fragmentEnabled ? `&fragment=${encodeURIComponent(`${settings.fragmentPackets},${settings.fragmentLength},${settings.fragmentInterval}`)}` : "";
  const fp = "chrome";
  const alpn = "http%2F1.1";
  const staticIps = (settings.staticIpList || "").split(/[,\n\s]+/).map((s) => s.trim()).filter((s) => s.length > 0);
  const isFronting = settings.domainFrontingEnabled && Boolean(settings.frontingSni);
  const frontSni = settings.frontingSni || "cdnjs.cloudflare.com";
  const frontHost = settings.frontingHost || workerHost;
  // Use the same configured endpoints in every client format. Never truncate IP pools.
  const nodes = cfPorts.map(port => ({ port, address: serverAddress, host: workerHost, sni: workerHost, suffix: String(port) }));
  if (isFronting) nodes.push(...cfPorts.slice(0, 2).map(port => ({ port, address: serverAddress, host: frontHost, sni: frontSni, suffix: `Fronting-${port}` })));
  nodes.push(...[...new Set(staticIps)].map((address, index) => ({ port: 443, address, host: workerHost, sni: workerHost, suffix: `StaticIP-${index + 1}` })));
  const uriAddress = address => address.includes(":") && !address.startsWith("[") ? `[${address}]` : address;
  const links = type => nodes.map(node => {
    const auth = type === "vless" ? settings.vlessUuid : encodeURIComponent(settings.trojanPassword);
    return `${type}://${auth}@${uriAddress(node.address)}:${node.port}?${type === "vless" ? "encryption=none&" : ""}security=tls&type=ws&path=${encodedPath}&host=${encodeURIComponent(node.host)}&sni=${encodeURIComponent(node.sni)}&fp=${fp}&alpn=${alpn}${type === "vless" ? fragmentQuery : ""}#${encodeURIComponent(`BlueKnight-${type === "vless" ? "VLESS" : "Trojan"}-${node.suffix}`)}`;
  });
  const ssNodes = settings.ssEnabled && SS_METHODS.includes(settings.ssMethod) ? nodes.filter(node => node.host === node.sni) : [];
  const ssPath = `${proxyPath}/ss`;
  const ssLinks = ssNodes.map(node => `ss://${btoa(`${settings.ssMethod}:${settings.ssPassword}`)}@${uriAddress(node.address)}:${node.port}/?plugin=${encodeURIComponent(`v2ray-plugin;tls;mux=0;host=${node.host};path=${ssPath}`)}#${encodeURIComponent(`BlueKnight-SS-${node.suffix}`)}`);
  if (protocol === 'ss' && ssLinks.length) return new Response(ssLinks.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  if (protocol === "openvpn") {
    const ovpnContent = generateOpenVpnProfile(env2.OPENVPN_CLIENT_PROFILE);
    if (!ovpnContent) return Response.json({ error: "OpenVPN is not provisioned", message: "Deploy native/openvpn on a Linux Docker host with TUN and NET_ADMIN, then configure OPENVPN_CLIENT_PROFILE_FILE. This panel does not emulate OpenVPN over WebSocket." }, { status: 503 });
    return new Response(ovpnContent, {
      status: 200,
      headers: {
        "Content-Type": "application/x-openvpn-profile; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="blueknight-${workerHost}.ovpn"`
      }
    });
  }
  if (["native", "shadowtls", "shadowsocks", "hysteria2", "tuic", "anytls", "ss"].includes(protocol)) {
    let native;
    try { native = JSON.parse(env2.NATIVE_CLIENT_CONFIG || "null"); } catch {}
    if (!native || !Array.isArray(native.outbounds)) return Response.json({ error: "Native protocols are not provisioned", message: "Generate and deploy the native Docker stack, then configure NATIVE_CLIENT_CONFIG_FILE." }, { status: 503 });
    const selected = protocol === "ss" ? "shadowsocks" : protocol;
    if (selected !== "native" && !native.outbounds.some(o => o.tag === selected)) return Response.json({ error: "Protocol is not configured" }, { status: 503 });
    if (protocol === "ss") {
      const outbound = native.outbounds.find(o => o.tag === "shadowsocks");
      return new Response(`ss://${btoa(outbound.method + ":" + outbound.password)}@${outbound.server}:${outbound.server_port}#BlueKnight-Shadowsocks`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
    }
    if (selected !== "native") native.route = { ...native.route, final: selected };
    return Response.json(native, { headers: { "Cache-Control": "no-store" } });
  }
  if (["vless", "trojan", "xray"].includes(protocol) && !(protocol === "xray" && url.searchParams.get("format") === "json")) {
    const content = protocol === "xray" ? btoa([...links("vless"), ...links("trojan"), ...ssLinks].join("\n")) : links(protocol).join("\n");
    return new Response(content, { headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "Profile-Update-Interval": "24",
      "Subscription-Userinfo": "upload=0; download=0; total=107374182400; expire=0"
    } });
  }
  function parseReserved(reserved) {
    if (!reserved)
      return void 0;
    const nums = reserved.replace(/[\[\]]/g, "").split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
    return nums.length > 0 ? nums : void 0;
  }
  __name(parseReserved, "parseReserved");
  __name2(parseReserved, "parseReserved");
  function validateAwgParams(settings2) {
    if (!settings2.warpProEnabled)
      return null;
    const version2 = parseInt(settings2.warpAmneziaVersion || "2", 10);
    const jc = parseInt(settings2.warpNoiseCount || "5", 10);
    const jmin = parseInt(settings2.warpNoiseMin || "10", 10);
    const jmax = parseInt(settings2.warpNoiseMax || "50", 10);
    const s1 = parseInt(settings2.warpAmneziaS1 || "15", 10);
    const s2 = parseInt(settings2.warpAmneziaS2 || "25", 10);
    const h1 = parseInt(settings2.warpAmneziaH1 || "1", 10);
    const h2 = parseInt(settings2.warpAmneziaH2 || "2", 10);
    const h3 = parseInt(settings2.warpAmneziaH3 || "3", 10);
    const h4 = parseInt(settings2.warpAmneziaH4 || "4", 10);
    if ([version2, jc, jmin, jmax, s1, s2, h1, h2, h3, h4].some((v) => isNaN(v) || v < 0)) {
      return null;
    }
    if (jmin > jmax)
      return null;
    return { version: version2, jc, jmin, jmax, s1, s2, h1, h2, h3, h4 };
  }
  __name(validateAwgParams, "validateAwgParams");
  __name2(validateAwgParams, "validateAwgParams");
  if (protocol === "warp") {
    if (!settings.warpPrivateKey) {
      return new Response(
        JSON.stringify(
          {
            error: "Warp Not Configured",
            message: "Warp (WireGuard) credentials are not yet configured in Panel Settings.",
            instructions: "Click '\u26A1 Generate Warp Account' in BlueKnight Panel or provide your WireGuard Private Key in Settings."
          },
          null,
          2
        ),
        {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        }
      );
    }
    const ipv6Address = settings.warpIPv6 ? `, ${settings.warpIPv6}` : "";
    const warpConf = `
[Interface]
PrivateKey = ${settings.warpPrivateKey}
Address = 172.16.0.2/32${ipv6Address}
DNS = 1.1.1.1, 2606:4700:4700::1111

[Peer]
PublicKey = ${settings.warpPeerPublicKey || "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo="}
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = 162.159.192.1:2408
PersistentKeepalive = 25
`.trim();
    return new Response(warpConf, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="blueknight-warp.conf"`
      }
    });
  }
  if (protocol === "amnezia") {
    if (!settings.warpPrivateKey) {
      return new Response(
        JSON.stringify(
          {
            error: "Warp Not Configured",
            message: "AmneziaWG credentials are not yet configured in Panel Settings.",
            instructions: "Click '\u26A1 Generate Warp Account' in BlueKnight Panel to automatically create WireGuard & Amnezia credentials."
          },
          null,
          2
        ),
        {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        }
      );
    }
    const reservedLine = settings.warpReserved ? `Reserved = ${settings.warpReserved}
` : "";
    const ipv6Address = settings.warpIPv6 ? `, ${settings.warpIPv6}` : "";
    const amneziaConf = `
[Interface]
PrivateKey = ${settings.warpPrivateKey}
Address = 172.16.0.2/32${ipv6Address}
DNS = 1.1.1.1, 2606:4700:4700::1111
Jc = ${settings.warpNoiseCount || "5"}
Jmin = ${settings.warpNoiseMin || "10"}
Jmax = ${settings.warpNoiseMax || "50"}
S1 = ${settings.warpAmneziaS1 || "15"}
S2 = ${settings.warpAmneziaS2 || "25"}
H1 = ${settings.warpAmneziaH1 || "1"}
H2 = ${settings.warpAmneziaH2 || "2"}
H3 = ${settings.warpAmneziaH3 || "3"}
H4 = ${settings.warpAmneziaH4 || "4"}

[Peer]
PublicKey = ${settings.warpPeerPublicKey || "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo="}
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = 162.159.192.1:2408
PersistentKeepalive = 25
${reservedLine}`.trim();
    return new Response(amneziaConf, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="blueknight-amnezia.conf"`
      }
    });
  }
  if (protocol === "clash") {
    const hasWarp = Boolean(settings.warpPrivateKey);
    const hasChain = Boolean(settings.chainEnabled && settings.chainAddress);
    const awg = validateAwgParams(settings);
    const chainProxyEntry = buildClashChainProxy(settings);
    const dialerProxyProp = hasChain ? '\n    dialer-proxy: "Chain-Upstream"' : "";
    const reservedArr = parseReserved(settings.warpReserved);
    const reservedYaml = reservedArr ? `
    reserved: [${reservedArr.join(", ")}]` : "";
    let awgYaml = "";
    if (awg) {
      awgYaml = `
    amnezia-wg-option:
      version: ${awg.version}
      jc: ${awg.jc}
      jmin: ${awg.jmin}
      jmax: ${awg.jmax}
      s1: ${awg.s1}
      s2: ${awg.s2}
      h1: ${awg.h1}
      h2: ${awg.h2}
      h3: ${awg.h3}
      h4: ${awg.h4}`;
    }
    const warpProxyEntry = hasWarp ? `
  - name: "BlueKnight-Warp"
    type: wireguard
    server: 162.159.192.1
    port: 2408
    ip: 172.16.0.2
    public-key: "${settings.warpPeerPublicKey}"
    private-key: "${settings.warpPrivateKey}"
    udp: true
    remote-dns-resolve: true${reservedYaml}${hasChain ? '\n    dialer-proxy: "Chain-Upstream"' : ""}${awgYaml}` : "";
    const warpProxyName = hasWarp ? '\n      - "BlueKnight-Warp"' : "";
    const chainProxyName = hasChain ? '\n      - "Chain-Upstream"' : "";
    let clashRules = "";
    if (settings.routingPreset === "bypass-iran") {
      clashRules = `
  - DOMAIN-SUFFIX,ir,DIRECT
  - GEOIP,IR,DIRECT
  - GEOSITE,category-ir,DIRECT
  - GEOIP,lan,DIRECT,no-resolve
  - MATCH,PROXY`;
    } else if (settings.routingPreset === "bypass-cn") {
      clashRules = `
  - DOMAIN-SUFFIX,cn,DIRECT
  - GEOIP,CN,DIRECT
  - GEOSITE,cn,DIRECT
  - GEOIP,lan,DIRECT,no-resolve
  - MATCH,PROXY`;
    } else if (settings.routingPreset === "block-ads") {
      clashRules = `
  - GEOSITE,category-ads-all,REJECT
  - MATCH,PROXY`;
    } else {
      clashRules = `
  - MATCH,PROXY`;
    }
    const vlessClashProxies = nodes.map(({ port, address, host, sni, suffix }) => `
  - name: "BlueKnight-VLESS-${suffix}"
    type: vless
    server: "${address}"
    port: ${port}
    uuid: "${settings.vlessUuid}"
    cipher: auto
    tls: true
    servername: "${sni}"
    network: ws
    ws-opts:
      path: "${proxyPath}"
      headers:
        Host: "${host}"${dialerProxyProp}`).join("");
    const trojanClashProxies = nodes.map(({ port, address, host, sni, suffix }) => `
  - name: "BlueKnight-Trojan-${suffix}"
    type: trojan
    server: "${address}"
    port: ${port}
    password: "${settings.trojanPassword}"
    tls: true
    sni: "${sni}"
    network: ws
    ws-opts:
      path: "${proxyPath}"
      headers:
        Host: "${host}"${dialerProxyProp}`).join("");
    const ssClashProxies = ssNodes.map(node => `
  - name: "BlueKnight-SS-${node.suffix}"
    type: ss
    server: "${node.address}"
    port: ${node.port}
    cipher: "${settings.ssMethod}"
    password: "${settings.ssPassword}"
    udp: false
    plugin: v2ray-plugin
    plugin-opts:
      mode: websocket
      mux: false
      tls: true
      host: "${node.host}"
      path: "${ssPath}"${dialerProxyProp}`).join('');
    const clashNodeNames = [
      ...nodes.map(({ suffix }) => `"BlueKnight-VLESS-${suffix}"`),
      ...nodes.map(({ suffix }) => `"BlueKnight-Trojan-${suffix}"`),
      ...ssNodes.map(node => `"BlueKnight-SS-${node.suffix}"`)
    ];
    const clashNodeListStr = clashNodeNames.map((n) => `
      - ${n}`).join("");
    const allowLanStr = settings.allowLANConnection ? "true" : "false";
    const bindAddressStr = settings.allowLANConnection ? "*" : "127.0.0.1";
    const proxiesYaml = `
port: 7890
socks-port: 7891
allow-lan: ${allowLanStr}
bind-address: "${bindAddressStr}"
mode: rule
log-level: info
ipv6: false

proxies:${vlessClashProxies}${trojanClashProxies}${ssClashProxies}${warpProxyEntry}${chainProxyEntry}

proxy-groups:
  - name: PROXY
    type: select
    proxies:${clashNodeListStr}${warpProxyName}${chainProxyName}
      - "AUTO-FALLBACK"
      - DIRECT

  - name: AUTO-FALLBACK
    type: url-test
    url: http://www.gstatic.com/generate_204
    interval: 300
    proxies:${clashNodeListStr}${warpProxyName}

rules:${clashRules}
`.trim();
    return new Response(proxiesYaml, {
      status: 200,
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Profile-Update-Interval": "24"
      }
    });
  }
  if (protocol === "singbox") {
    const hasWarp = Boolean(settings.warpPrivateKey);
    const hasChain = Boolean(settings.chainEnabled && settings.chainAddress);
    const detourVal = hasChain ? "chain-upstream" : void 0;
    const vlessSingboxOutbounds = nodes.map(({ port, address, host, sni, suffix }) => ({
      type: "vless",
      tag: `BlueKnight-VLESS-${suffix}`,
      server: address,
      server_port: port,
      uuid: settings.vlessUuid,
      tls: {
        enabled: true,
        server_name: sni,
        alpn: ["http/1.1"],
        utls: { enabled: true, fingerprint: "chrome" }
      },
      transport: {
        type: "ws",
        path: proxyPath,
        headers: {
          Host: host
        },
      },
      ...detourVal ? { detour: detourVal } : {}
    }));
    const trojanSingboxOutbounds = nodes.map(({ port, address, host, sni, suffix }) => ({
      type: "trojan",
      tag: `BlueKnight-Trojan-${suffix}`,
      server: address,
      server_port: port,
      password: settings.trojanPassword,
      tls: {
        enabled: true,
        server_name: sni,
        alpn: ["http/1.1"],
        utls: { enabled: true, fingerprint: "chrome" }
      },
      transport: {
        type: "ws",
        path: proxyPath,
        headers: {
          Host: host
        },
      },
      ...detourVal ? { detour: detourVal } : {}
    }));
    const ssSingboxOutbounds = ssNodes.map(node => ({
      type: 'shadowsocks', tag: `BlueKnight-SS-${node.suffix}`, server: node.address, server_port: node.port,
      method: settings.ssMethod, password: settings.ssPassword, network: 'tcp',
      plugin: 'v2ray-plugin', plugin_opts: `tls;mux=0;host=${node.host};path=${ssPath}`,
      ...(detourVal ? { detour: detourVal } : {})
    }));
    const endpoints = [];
    const outboundsList = [
      {
        type: "selector",
        tag: "select",
        outbounds: [
          ...nodes.map(({ suffix }) => `BlueKnight-VLESS-${suffix}`),
          ...nodes.map(({ suffix }) => `BlueKnight-Trojan-${suffix}`),
          ...ssSingboxOutbounds.map(outbound => outbound.tag),
          ...hasWarp ? ["BlueKnight-Warp"] : [],
          ...hasChain ? ["chain-upstream"] : [],
          "direct"
        ]
      },
      ...vlessSingboxOutbounds,
      ...trojanSingboxOutbounds,
      ...ssSingboxOutbounds
    ];
    if (hasWarp) {
      const reservedArr = parseReserved(settings.warpReserved);
      endpoints.push({
        type: "wireguard", tag: "BlueKnight-Warp", system: false,
        address: ["172.16.0.2/32", ...(settings.warpIPv6 ? [settings.warpIPv6] : [])],
        private_key: settings.warpPrivateKey,
        peers: [{ address: "162.159.192.1", port: 2408, public_key: settings.warpPeerPublicKey,
          allowed_ips: ["0.0.0.0/0", "::/0"], ...(reservedArr ? { reserved: reservedArr } : {}) }]
      });
    }

    if (hasChain) {
      const chainOut = buildSingboxChainOutbound(settings);
      if (chainOut) {
        outboundsList.push(chainOut);
      }
    }
    outboundsList.push({ type: "direct", tag: "direct" });
    const routeRules = [{ action: "sniff" }, { protocol: "dns", action: "hijack-dns" }];
    const ruleSets = [];
    const country = settings.routingPreset === "bypass-iran" ? "ir" : settings.routingPreset === "bypass-cn" ? "cn" : null;
    if (country) {
      const tag = "geoip-" + country;
      ruleSets.push({ type: "remote", tag, format: "binary", url: `https://raw.githubusercontent.com/SagerNet/sing-geoip/rule-set/${tag}.srs`, download_detour: "direct" });
      routeRules.push({ ip_is_private: true, outbound: "direct" }, { rule_set: [tag], outbound: "direct" }, { domain_suffix: [country], outbound: "direct" });
    } else if (settings.routingPreset === "block-ads") {
      ruleSets.push({ type: "remote", tag: "ads", format: "binary", url: "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-category-ads-all.srs", download_detour: "direct" });
      routeRules.push({ rule_set: ["ads"], action: "reject" });
    }
    const listenAddress = settings.allowLANConnection ? "0.0.0.0" : "127.0.0.1";
    const singboxConfig = {
      log: {
        level: "info",
        timestamp: true
      },
      dns: {
        servers: [
          { type: "https", tag: "cf-dns", server: workerHost, path: "/dns-query", domain_resolver: "local-dns" },
          { type: "local", tag: "local-dns" }
        ]
      },
      inbounds: [
        {
          type: "mixed",
          tag: "mixed-in",
          listen: listenAddress,
          listen_port: 2080
        }
      ],
      outbounds: outboundsList,
      endpoints,
      route: {
        auto_detect_interface: true,
        default_domain_resolver: "local-dns",
        rule_set: ruleSets,
        final: "select",
        rules: routeRules
      }
    };
    try {
      mergeNativeSubscription(singboxConfig, env2.NATIVE_CLIENT_CONFIG);
    } catch (error) {
      return Response.json({ error: "Native subscription configuration is invalid", message: error.message }, { status: 503 });
    }
    return new Response(JSON.stringify(singboxConfig, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Profile-Update-Interval": "24"
      }
    });
  }
  if (protocol === "xray-json" || protocol === "xray" && url.searchParams.get("format") === "json") {
    const listenAddress = settings.allowLANConnection ? "0.0.0.0" : "127.0.0.1";
    const vlessOutbounds = nodes.map(({ port, address, host, sni, suffix }) => ({
      tag: `BlueKnight-VLESS-${suffix}`,
      protocol: "vless",
      settings: {
        vnext: [
          {
            address,
            port,
            users: [
              {
                id: settings.vlessUuid,
                encryption: "none",
                level: 0
              }
            ]
          }
        ]
      },
      streamSettings: {
        network: "ws",
        security: "tls",
        tlsSettings: {
          serverName: sni,
          allowInsecure: false,
          fingerprint: "chrome",
          alpn: ["http/1.1"]
        },
        wsSettings: {
          path: proxyPath,
          headers: {
            Host: host
          }
        }
      }
    }));
    const trojanOutbounds = nodes.map(({ port, address, host, sni, suffix }) => ({
      tag: `BlueKnight-Trojan-${suffix}`,
      protocol: "trojan",
      settings: {
        servers: [
          {
            address,
            port,
            password: settings.trojanPassword,
            level: 0
          }
        ]
      },
      streamSettings: {
        network: "ws",
        security: "tls",
        tlsSettings: {
          serverName: sni,
          allowInsecure: false,
          fingerprint: "chrome",
          alpn: ["http/1.1"]
        },
        wsSettings: {
          path: proxyPath,
          headers: {
            Host: host
          }
        }
      }
    }));
    const xrayRules = [];
    if (settings.routingPreset === "bypass-iran") {
      xrayRules.push(
        {
          type: "field",
          outboundTag: "direct",
          ip: ["geoip:private", "geoip:ir"]
        },
        {
          type: "field",
          outboundTag: "direct",
          domain: ["geosite:category-ir", "domain:ir"]
        }
      );
    } else if (settings.routingPreset === "bypass-cn") {
      xrayRules.push(
        {
          type: "field",
          outboundTag: "direct",
          ip: ["geoip:private", "geoip:cn"]
        },
        {
          type: "field",
          outboundTag: "direct",
          domain: ["geosite:cn", "domain:cn"]
        }
      );
    } else if (settings.routingPreset === "block-ads") {
      xrayRules.push({
        type: "field",
        outboundTag: "block",
        domain: ["geosite:category-ads-all"]
      });
    }
    const xrayClientConfig = {
      log: {
        loglevel: "warning"
      },
      inbounds: [
        {
          tag: "socks-in",
          port: 10808,
          listen: listenAddress,
          protocol: "socks",
          settings: {
            auth: "noauth",
            udp: true
          }
        },
        {
          tag: "http-in",
          port: 10809,
          listen: listenAddress,
          protocol: "http",
          settings: {}
        }
      ],
      outbounds: [
        ...vlessOutbounds,
        ...trojanOutbounds,
        ...ssNodes.map(node => ({
          tag: `BlueKnight-SS-${node.suffix}`, protocol: 'shadowsocks',
          settings: { servers: [{ address: node.address, port: node.port, method: settings.ssMethod, password: settings.ssPassword }] },
          streamSettings: { network: 'ws', security: 'tls', tlsSettings: { serverName: node.sni, fingerprint: 'chrome' }, wsSettings: { path: ssPath, headers: { Host: node.host } } }
        })),
        {
          protocol: "freedom",
          tag: "direct",
          settings: {}
        },
        {
          protocol: "blackhole",
          tag: "block",
          settings: {
            response: {
              type: "http"
            }
          }
        }
      ],
      routing: {
        domainStrategy: "IPIfNonMatch",
        rules: xrayRules
      }
    };
    return new Response(JSON.stringify(xrayClientConfig, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Profile-Update-Interval": "24"
      }
    });
  }
  return new Response("Unknown subscription format", { status: 404 });
}
async function getConnect() {
  if (connectImpl) return connectImpl;
  try {
    ({ connect: connectImpl } = await import("cloudflare:sockets"));
  } catch {
    try {
      ({ connect: connectImpl } = await Promise.resolve().then(() => (init_sockets(), sockets_exports)));
    } catch {
    }
  }
  if (!connectImpl) {
    throw new Error("Raw TCP sockets are not available in this runtime.");
  }
  return connectImpl;
}
function bytesToUuid(bytes, offset = 0) {
  const hex = [];
  for (let i = 0; i < 16; i++) {
    hex.push((bytes[offset + i] < 16 ? "0" : "") + bytes[offset + i].toString(16));
  }
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join("")
  ].join("-").toLowerCase();
}
function parseVlessHeader(buffer, expectedUuid) {
  if (buffer.length < 23) {
    return null;
  }
  const version2 = buffer[0];
  const clientUuid = bytesToUuid(buffer, 1);
  const isValidUser = clientUuid.toLowerCase() === expectedUuid.toLowerCase();
  if (!isValidUser) {
    return null;
  }
  const addonLength = buffer[17];
  let cursor = 18 + addonLength;
  if (cursor + 4 > buffer.length) {
    return null;
  }
  const command = buffer[cursor];
  const targetPort = buffer[cursor + 1] << 8 | buffer[cursor + 2];
  const addressType = buffer[cursor + 3];
  cursor += 4;
  let targetAddress = "";
  if (addressType === 1) {
    if (cursor + 4 > buffer.length)
      return null;
    targetAddress = `${buffer[cursor]}.${buffer[cursor + 1]}.${buffer[cursor + 2]}.${buffer[cursor + 3]}`;
    cursor += 4;
  } else if (addressType === 2) {
    if (cursor + 1 > buffer.length)
      return null;
    const domainLength = buffer[cursor];
    cursor += 1;
    if (cursor + domainLength > buffer.length)
      return null;
    const domainBytes = buffer.subarray(cursor, cursor + domainLength);
    targetAddress = new TextDecoder().decode(domainBytes);
    cursor += domainLength;
  } else if (addressType === 3) {
    if (cursor + 16 > buffer.length)
      return null;
    const parts = [];
    for (let i = 0; i < 16; i += 2) {
      parts.push((buffer[cursor + i] << 8 | buffer[cursor + i + 1]).toString(16));
    }
    targetAddress = `[${parts.join(":")}]`;
    cursor += 16;
  } else {
    return null;
  }
  const payload = buffer.subarray(cursor);
  return {
    version: version2,
    isValidUser,
    command,
    targetAddress,
    targetPort,
    payload
  };
}
function createVlessResponseHeader(version2 = 0) {
  return new Uint8Array([version2, 0]);
}
function sha224Hex(message2) {
  const K = [
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ];
  let H0 = 3238371032;
  let H1 = 914150663;
  let H2 = 812702999;
  let H3 = 4144912697;
  let H4 = 4290775857;
  let H5 = 1750603025;
  let H6 = 1694076839;
  let H7 = 3204075428;
  const data = new TextEncoder().encode(message2);
  const bitLen = data.length * 8;
  const padLen = (data.length + 8 >> 6) + 1 << 6;
  const padded = new Uint8Array(padLen);
  padded.set(data);
  padded[data.length] = 128;
  const view = new DataView(padded.buffer);
  view.setUint32(padLen - 4, bitLen, false);
  const W = new Int32Array(64);
  for (let i = 0; i < padLen; i += 64) {
    for (let t = 0; t < 16; t++) {
      W[t] = view.getInt32(i + t * 4, false);
    }
    for (let t = 16; t < 64; t++) {
      const s0 = (W[t - 15] >>> 7 | W[t - 15] << 25) ^ (W[t - 15] >>> 18 | W[t - 15] << 14) ^ W[t - 15] >>> 3;
      const s1 = (W[t - 2] >>> 17 | W[t - 2] << 15) ^ (W[t - 2] >>> 19 | W[t - 2] << 13) ^ W[t - 2] >>> 10;
      W[t] = W[t - 16] + s0 + W[t - 7] + s1 | 0;
    }
    let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;
    for (let t = 0; t < 64; t++) {
      const S1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
      const ch = e & f ^ ~e & g;
      const temp1 = h + S1 + ch + K[t] + W[t] | 0;
      const S0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
      const maj = a & b ^ a & c ^ b & c;
      const temp2 = S0 + maj | 0;
      h = g;
      g = f;
      f = e;
      e = d + temp1 | 0;
      d = c;
      c = b;
      b = a;
      a = temp1 + temp2 | 0;
    }
    H0 = H0 + a | 0;
    H1 = H1 + b | 0;
    H2 = H2 + c | 0;
    H3 = H3 + d | 0;
    H4 = H4 + e | 0;
    H5 = H5 + f | 0;
    H6 = H6 + g | 0;
    H7 = H7 + h | 0;
  }
  const words = [H0, H1, H2, H3, H4, H5, H6];
  return words.map((w) => (w >>> 0).toString(16).padStart(8, "0")).join("");
}
function isTrojanPacket(buffer) {
  if (buffer.length < 58)
    return false;
  if (buffer[56] === 13 && buffer[57] === 10) {
    for (let i = 0; i < 56; i++) {
      const b = buffer[i];
      const isHex = b >= 48 && b <= 57 || b >= 97 && b <= 102 || b >= 65 && b <= 70;
      if (!isHex)
        return false;
    }
    return true;
  }
  return false;
}
function parseTrojanHeader(buffer, expectedPassword) {
  if (buffer.length < 60)
    return null;
  let cursor = 0;
  let isValidUser = false;
  const expectedSha224 = sha224Hex(expectedPassword).toLowerCase();
  if (buffer.length >= 58 && buffer[56] === 13 && buffer[57] === 10) {
    const clientHex = new TextDecoder().decode(buffer.subarray(0, 56)).toLowerCase();
    isValidUser = clientHex === expectedSha224;
    cursor = 58;
  } else {
    const passBytes = new TextEncoder().encode(expectedPassword);
    if (buffer.length > passBytes.length + 2) {
      let match2 = true;
      for (let i = 0; i < passBytes.length; i++) {
        if (buffer[i] !== passBytes[i]) {
          match2 = false;
          break;
        }
      }
      if (match2 && buffer[passBytes.length] === 13 && buffer[passBytes.length + 1] === 10) {
        isValidUser = true;
        cursor = passBytes.length + 2;
      }
    }
  }
  if (!isValidUser) {
    return null;
  }
  if (cursor + 4 > buffer.length) {
    return null;
  }
  const command = buffer[cursor];
  const addressType = buffer[cursor + 1];
  cursor += 2;
  let targetAddress = "";
  if (addressType === 1) {
    if (cursor + 4 > buffer.length)
      return null;
    targetAddress = `${buffer[cursor]}.${buffer[cursor + 1]}.${buffer[cursor + 2]}.${buffer[cursor + 3]}`;
    cursor += 4;
  } else if (addressType === 3) {
    if (cursor + 1 > buffer.length)
      return null;
    const domainLen = buffer[cursor];
    cursor += 1;
    if (cursor + domainLen > buffer.length)
      return null;
    targetAddress = new TextDecoder().decode(buffer.subarray(cursor, cursor + domainLen));
    cursor += domainLen;
  } else if (addressType === 4) {
    if (cursor + 16 > buffer.length)
      return null;
    const parts = [];
    for (let i = 0; i < 16; i += 2) {
      parts.push((buffer[cursor + i] << 8 | buffer[cursor + i + 1]).toString(16));
    }
    targetAddress = `[${parts.join(":")}]`;
    cursor += 16;
  } else {
    return null;
  }
  if (cursor + 4 > buffer.length) {
    return null;
  }
  const targetPort = buffer[cursor] << 8 | buffer[cursor + 1];
  cursor += 2;
  if (buffer[cursor] === 13 && buffer[cursor + 1] === 10) {
    cursor += 2;
  }
  const payload = buffer.subarray(cursor);
  return {
    isValidUser,
    command,
    targetAddress,
    targetPort,
    payload
  };
}
async function toUint8Array(data) {
  if (data instanceof Uint8Array) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    const buf = await data.arrayBuffer();
    return new Uint8Array(buf);
  }
  if (typeof data === "string") {
    return new TextEncoder().encode(data);
  }
  return null;
}
function decodeBase64Url(str) {
  try {
    let b64 = str.trim();
    if (!b64)
      return null;
    b64 = b64.replace(/-/g, "+").replace(/_/g, "/");
    const remainder = b64.length % 4;
    if (remainder === 2) {
      b64 += "==";
    } else if (remainder === 3) {
      b64 += "=";
    } else if (remainder === 1) {
      return null;
    }
    const binary = atob(b64);
    if (binary.length === 0)
      return null;
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}
function extractEarlyData(headerValue) {
  if (!headerValue)
    return null;
  const raw = headerValue.trim();
  if (!raw)
    return null;
  const candidates = raw.includes(",") ? raw.split(",").map((s) => s.trim()) : [raw];
  for (const candidate of candidates) {
    if (!candidate)
      continue;
    const decoded = decodeBase64Url(candidate);
    if (decoded && decoded.length > 0) {
      return decoded;
    }
  }
  return null;
}
async function handleWebSocketProxy(request, env2, ctx) {
  if (new URL(request.url).pathname.endsWith('/ss')) {
    const settings = await getOrInitSettings(env2);
    if (!settings.ssEnabled || !SS_METHODS.includes(settings.ssMethod)) return new Response('Shadowsocks disabled or unsupported cipher', { status: 503 });
  }
  const upgradeHeader = request.headers.get("Upgrade");
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket Upgrade", { status: 426 });
  }
  // Adapters must install an upgrade bridge before accepting tunnel requests.
  if (typeof WebSocketPair === "undefined") {
    return new Response(
      JSON.stringify(
        {
          error: "Unsupported Runtime",
          message: "This host cannot carry proxy traffic: it provides no WebSocket upgrade. The panel and subscription links work here, but run the tunnel on Cloudflare Workers/Pages or a Node host (Render, Fly, Railway, Koyeb, Docker)."
        },
        null,
        2
      ),
      { status: 501, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
  const secProtocol = request.headers.get("sec-websocket-protocol");
  const earlyData = extractEarlyData(secProtocol);
  const webSocketPair = new WebSocketPair();
  const [clientWs, serverWs] = Object.values(webSocketPair);
  serverWs.accept();
  const ssRequest = new URL(request.url).pathname.endsWith('/ss');
  const ssSettings = ssRequest ? await getOrInitSettings(env2) : null;
  const sessionPromise = (ssRequest
    ? serveShadowsocks(serverWs, ssSettings, (host, port) => establishOutboundSocket(host, port, ssSettings), earlyData)
    : handleProxySession(serverWs, env2, earlyData)).catch((err) => {
    console.warn("Proxy session error:", err?.message || err);
    try {
      serverWs.close(1011, "Internal Error");
    } catch {
    }
  });
  if (ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(sessionPromise);
  }
  const responseHeaders = new Headers();
  if (secProtocol) {
    responseHeaders.set("Sec-WebSocket-Protocol", secProtocol);
  }
  return new Response(null, {
    status: 101,
    webSocket: clientWs,
    headers: responseHeaders
  });
}
// TCP reads may split a handshake or include the first target payload.
function chainReader(socket) {
  const reader = socket.readable.getReader();
  let pending = new Uint8Array(0);
  async function read(size) {
    while (pending.length < size) {
      const { value, done } = await reader.read();
      if (done) throw new Error("Proxy closed during handshake");
      const next = new Uint8Array(pending.length + value.length);
      next.set(pending); next.set(value, pending.length); pending = next;
    }
    const result = pending.slice(0, size);
    pending = pending.slice(size);
    return result;
  }
  return {
    read,
    release() {
      reader.releaseLock();
      if (pending.length) {
        const prefix = pending;
        const original = socket.readable;
        let source;
        socket.readable = new ReadableStream({
          start(controller) { controller.enqueue(prefix); source = original.getReader(); },
          async pull(controller) {
            try {
              const { value, done } = await source.read();
              if (done) { source.releaseLock(); controller.close(); }
              else controller.enqueue(value);
            } catch (err) { controller.error(err); }
          },
          cancel(reason) { return source.cancel(reason); }
        });
      }
    }
  };
}
async function dialHttpChain(remoteSocket, targetHost, targetPort, chainAuth) {
  const writer = remoteSocket.writable.getWriter();
  const input = chainReader(remoteSocket);
  try {
    const authority = `${targetHost.includes(":") ? `[${targetHost}]` : targetHost}:${targetPort}`;
    const auth = chainAuth ? `Proxy-Authorization: Basic ${btoa(chainAuth)}\r\n` : "";
    await writer.write(new TextEncoder().encode(
      `CONNECT ${authority} HTTP/1.1\r\nHost: ${authority}\r\n${auth}\r\n`));
    let header = "";
    while (!header.endsWith("\r\n\r\n")) {
      if (header.length >= 16384) throw new Error("HTTP proxy response headers too large");
      header += String.fromCharCode((await input.read(1))[0]);
    }
    if (!/^HTTP\/1\.[01] 2\d\d(?: |\r)/.test(header)) {
      throw new Error(`HTTP proxy CONNECT failed: ${header.split("\r\n")[0]}`);
    }
  } finally {
    writer.releaseLock(); input.release();
  }
}
async function dialSocks5Chain(remoteSocket, targetHost, targetPort, chainAuth) {
  const writer = remoteSocket.writable.getWriter();
  const input = chainReader(remoteSocket);
  try {
    await writer.write(new Uint8Array(chainAuth ? [5, 1, 2] : [5, 1, 0]));
    const greeting = await input.read(2);
    if (greeting[0] !== 5 || greeting[1] !== (chainAuth ? 2 : 0)) {
      throw new Error("SOCKS5 authentication method rejected");
    }
    if (chainAuth) {
      const split = chainAuth.indexOf(":");
      if (split < 0) throw new Error("SOCKS5 credentials must be user:password");
      const user = new TextEncoder().encode(chainAuth.slice(0, split));
      const pass = new TextEncoder().encode(chainAuth.slice(split + 1));
      if (!user.length || !pass.length || user.length > 255 || pass.length > 255) {
        throw new Error("Invalid SOCKS5 credential length");
      }
      await writer.write(new Uint8Array([1, user.length, ...user, pass.length, ...pass]));
      const auth = await input.read(2);
      if (auth[0] !== 1 || auth[1] !== 0) throw new Error("SOCKS5 credentials rejected");
    }
    const domain = new TextEncoder().encode(targetHost);
    if (!domain.length || domain.length > 255) throw new Error("Invalid SOCKS5 target length");
    await writer.write(new Uint8Array([5, 1, 0, 3, domain.length, ...domain,
      targetPort >> 8 & 255, targetPort & 255]));
    const reply = await input.read(4);
    if (reply[0] !== 5 || reply[1] !== 0 || reply[2] !== 0) {
      throw new Error("SOCKS5 connection establishment rejected by upstream proxy");
    }
    const length = reply[3] === 1 ? 4 : reply[3] === 4 ? 16
      : reply[3] === 3 ? (await input.read(1))[0] : -1;
    if (length < 0) throw new Error("Invalid SOCKS5 reply address");
    await input.read(length + 2);
  } finally {
    writer.releaseLock(); input.release();
  }
}
async function establishOutboundSocket(targetHost, targetPort, settings) {
  const nativeConnect = await getConnect();
  const connect2 = (address) => {
    const socket = nativeConnect(address);
    return { readable: socket.readable, writable: socket.writable,
      opened: socket.opened, closed: socket.closed, close: () => socket.close() };
  };
  const cleanHost = targetHost.replace(/^\[|\]$/g, "");
  if (settings.chainEnabled && (!settings.chainAddress || !(settings.chainPort > 0) || !["http", "socks"].includes(settings.chainType))) {
    throw new Error("Configure a valid HTTP or SOCKS5 upstream; unsupported chains cannot fall back to a direct connection");
  }
  if (settings.chainEnabled && settings.chainAddress && settings.chainPort > 0) {
    const chainHost = settings.chainAddress.replace(/^\[|\]$/g, "");
    if (settings.chainType === "http") {
      const socket2 = connect2({
        hostname: chainHost,
        port: settings.chainPort
      });
      await socket2.opened;
      try { await dialHttpChain(socket2, cleanHost, targetPort, settings.chainAuth); }
      catch (err) { socket2.close(); throw err; }
      return socket2;
    }
    if (settings.chainType === "socks") {
      const socket2 = connect2({
        hostname: chainHost,
        port: settings.chainPort
      });
      await socket2.opened;
      try { await dialSocks5Chain(socket2, cleanHost, targetPort, settings.chainAuth); }
      catch (err) { socket2.close(); throw err; }
      return socket2;
    }
  }
  const socket = connect2({
    hostname: cleanHost,
    port: targetPort
  });
  await socket.opened;
  return socket;
}
async function handleProxySession(ws, env2, earlyData) {
  const settings = await getOrInitSettings(env2);
  let remoteSocket = null;
  let socketWriter = null;
  let hasHandshaked = false;
  let isClosed = false;
  const closeAll = /* @__PURE__ */ __name2((code = 1e3, reason = "Closed") => {
    if (isClosed)
      return;
    isClosed = true;
    if (socketWriter) {
      try {
        socketWriter.close().catch(() => {});
      } catch {
      }
      try {
        socketWriter.releaseLock();
      } catch {
      }
      socketWriter = null;
    }
    if (remoteSocket) {
      try {
        remoteSocket.close();
      } catch {
      }
      remoteSocket = null;
    }
    try {
      ws.close(code, reason);
    } catch {
    }
  }, "closeAll");
  async function processPacket(chunk) {
    if (isClosed)
      return;
    if (!hasHandshaked) {
      let targetHost = "";
      let targetPort = 0;
      let initialPayload = new Uint8Array(0);
      let isVless = false;
      let vlessVersion = 0;
      if (isTrojanPacket(chunk)) {
        const trojan = parseTrojanHeader(chunk, settings.trojanPassword);
        if (!trojan || !trojan.isValidUser) {
          console.warn("Trojan authentication failed or malformed header");
          closeAll(1008, "Auth Failed");
          return;
        }
        if (trojan.command !== 1) {
          console.warn(`Unsupported Trojan command: ${trojan.command} (TCP only)`);
          closeAll(1003, "TCP only");
          return;
        }
        targetHost = trojan.targetAddress;
        targetPort = trojan.targetPort;
        initialPayload = trojan.payload;
      } else {
        const vless = parseVlessHeader(chunk, settings.vlessUuid);
        if (!vless || !vless.isValidUser) {
          console.warn("VLESS authentication failed or invalid UUID");
          closeAll(1008, "Auth Failed");
          return;
        }
        if (vless.command !== 1) {
          console.warn(`Unsupported VLESS command: ${vless.command} (TCP only)`);
          closeAll(1003, "TCP only");
          return;
        }
        isVless = true;
        vlessVersion = vless.version;
        targetHost = vless.targetAddress;
        targetPort = vless.targetPort;
        initialPayload = vless.payload;
        const vlessResponse = createVlessResponseHeader(vlessVersion);
        try {
          ws.send(vlessResponse);
        } catch (sendErr) {
          console.warn("Failed to send VLESS response header:", sendErr?.message || sendErr);
          closeAll(1011, "WS Send Error");
          return;
        }
      }
      hasHandshaked = true;
      try {
        remoteSocket = await establishOutboundSocket(targetHost, targetPort, settings);
      } catch (sockErr) {
        console.warn(`Failed to connect to ${targetHost}:${targetPort}:`, sockErr?.message || sockErr);
        closeAll(1001, "Connection Refused");
        return;
      }
      const writer = remoteSocket.writable.getWriter();
      socketWriter = writer;
      if (initialPayload.length > 0) {
        try {
          await writer.write(initialPayload);
        } catch (writeErr) {
          console.warn("Failed to write initial payload:", writeErr?.message || writeErr);
          closeAll(1001, "Socket Write Error");
          return;
        }
      }
      pipeRemoteToWebSocket(remoteSocket.readable, ws, closeAll);
    } else {
      if (socketWriter) {
        try {
          await socketWriter.write(chunk);
        } catch (writeErr) {
          console.warn("Failed to write chunk to remote socket:", writeErr?.message || writeErr);
          closeAll(1001, "Socket Write Error");
        }
      }
    }
  }
  __name(processPacket, "processPacket");
  __name2(processPacket, "processPacket");
  let messageQueue = Promise.resolve();
  if (earlyData && earlyData.length > 0) {
    messageQueue = messageQueue.then(() => processPacket(earlyData)).catch((err) => {
      console.warn("Early-data packet processing error:", err?.message || err);
      closeAll(1011, "Early Data Error");
    });
  }
  ws.addEventListener("message", (event) => {
    messageQueue = messageQueue.then(async () => {
      if (isClosed)
        return;
      const chunk = await toUint8Array(event.data);
      if (!chunk || chunk.length === 0)
        return;
      await processPacket(chunk);
    }).catch((err) => {
      console.warn("WebSocket packet processing error:", err?.message || err);
      closeAll(1011, "Stream Error");
    });
  });
  ws.addEventListener("close", () => closeAll(1e3, "Client Disconnected"));
  ws.addEventListener("error", (e) => {
    console.warn("WebSocket client error:", e);
    closeAll(1006, "Abnormal Closure");
  });
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (isClosed) {
        clearInterval(interval);
        resolve();
      }
    }, 1e3);
    ws.addEventListener("close", () => {
      clearInterval(interval);
      resolve();
    });
  });
}
async function pipeRemoteToWebSocket(readable, ws, onClose) {
  const reader = readable.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      if (value && value.length > 0) {
        try {
          ws.send(value);
        } catch {
          break;
        }
      }
    }
  } catch (err) {
    console.warn("Pipe remote read error:", err?.message || err);
  } finally {
    try {
      reader.releaseLock();
    } catch {
    }
    onClose(1e3, "Remote stream finished");
  }
}
async function handleDnsQuery(request, env2) {
  const settings = await getOrInitSettings(env2);
  const upstreamUrl = settings.dnsCustom && settings.dnsCustom.trim().length > 0 ? settings.dnsCustom.trim() : settings.dnsDoH || "https://cloudflare-dns.com/dns-query";
  const url = new URL(request.url);
  try {
    if (request.method === "GET") {
      const dnsParam = url.searchParams.get("dns");
      if (!dnsParam) {
        return new Response("Missing 'dns' query parameter in GET /dns-query", {
          status: 400,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
      const targetUrl = new URL(upstreamUrl);
      targetUrl.searchParams.set("dns", dnsParam);
      const upstreamResponse = await (env2.DNS_FETCH || fetch)(targetUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/dns-message"
        }
      });
      const responseHeaders = new Headers(upstreamResponse.headers);
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      responseHeaders.set("Content-Type", "application/dns-message");
      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: responseHeaders
      });
    }
    if (request.method === "POST") {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.includes("application/dns-message")) {
        return new Response("Expected Content-Type: application/dns-message", {
          status: 415,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
      const body = await request.arrayBuffer();
      const upstreamResponse = await (env2.DNS_FETCH || fetch)(upstreamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/dns-message",
          Accept: "application/dns-message"
        },
        body
      });
      const responseHeaders = new Headers(upstreamResponse.headers);
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      responseHeaders.set("Content-Type", "application/dns-message");
      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: responseHeaders
      });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Accept"
        }
      });
    }
    return new Response("Method Not Allowed", { status: 405 });
  } catch (err) {
    console.warn("DoH upstream error:", err.message);
    return new Response(`DoH Upstream Gateway Error: ${err.message}`, {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
async function handleDnsJson(request, env2) {
  const settings = await getOrInitSettings(env2);
  const upstreamUrl = settings.dnsCustom && settings.dnsCustom.trim().length > 0 ? settings.dnsCustom.trim() : settings.dnsDoH || "https://cloudflare-dns.com/dns-query";
  const url = new URL(request.url);
  const name = url.searchParams.get("name");
  const type = url.searchParams.get("type") || "A";
  if (!name) {
    return new Response(JSON.stringify({ error: "Missing 'name' query parameter" }, null, 2), {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
  try {
    const data = await queryDnsJson(upstreamUrl, name, type, env2.DNS_FETCH || fetch);
    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    console.warn("DoH JSON upstream error:", err.message);
    return new Response(JSON.stringify({ error: "Bad Gateway", details: err.message }, null, 2), {
      status: err instanceof RangeError ? 400 : 502,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}
async function authorizeShareRequest(request, env2, expectedToken) {
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");
  const sessionToken = getSessionCookie(request);
  if (sessionToken) {
    const session = await verifySessionToken(sessionToken, env2);
    if (session) {
      return { authorized: true, isAdminSession: true };
    }
  }
  if (queryToken && constantTimeEquals(queryToken, expectedToken)) {
    return { authorized: true, isAdminSession: false };
  }
  return { authorized: false, isAdminSession: false };
}
async function handleNodeExport(request, env2) {
  const url = new URL(request.url);
  const settings = await getOrInitSettings(env2);
  const { authorized, isAdminSession } = await authorizeShareRequest(request, env2, settings.nodeShareToken);
  if (!authorized) {
    return new Response(
      JSON.stringify(
        {
          error: "Unauthorized",
          message: "A valid nodeShareToken is required to access the node export feed."
        },
        null,
        2
      ),
      {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      }
    );
  }
  const includeSecrets = isAdminSession && url.searchParams.get("includeSecrets") === "true";
  const exportPayload = {
    schema: "blueknight-node-export/v1",
    app: "BlueKnight Panel",
    version: APP_CONFIG.version,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    nodeShareToken: settings.nodeShareToken,
    settings: {
      proxyPath: settings.proxyPath,
      proxyIp: settings.proxyIp,
      dnsDoH: settings.dnsDoH,
      allowLANConnection: settings.allowLANConnection,
      fragmentEnabled: settings.fragmentEnabled,
      fragmentPackets: settings.fragmentPackets,
      fragmentLength: settings.fragmentLength,
      fragmentInterval: settings.fragmentInterval,
      routingPreset: settings.routingPreset,
      // Warp Pro & AmneziaWG
      warpProEnabled: settings.warpProEnabled,
      warpPeerPublicKey: settings.warpPeerPublicKey,
      warpAmneziaVersion: settings.warpAmneziaVersion,
      warpNoiseCount: settings.warpNoiseCount,
      warpNoiseMin: settings.warpNoiseMin,
      warpNoiseMax: settings.warpNoiseMax,
      warpNoiseDelay: settings.warpNoiseDelay,
      warpAmneziaS1: settings.warpAmneziaS1,
      warpAmneziaS2: settings.warpAmneziaS2,
      warpAmneziaH1: settings.warpAmneziaH1,
      warpAmneziaH2: settings.warpAmneziaH2,
      warpAmneziaH3: settings.warpAmneziaH3,
      warpAmneziaH4: settings.warpAmneziaH4,
      // Chain Proxy
      chainEnabled: settings.chainEnabled,
      chainType: settings.chainType,
      chainAddress: settings.chainAddress,
      chainPort: settings.chainPort,
      chainPath: settings.chainPath,
      chainSecurity: settings.chainSecurity,
      chainTransport: settings.chainTransport,
      chainSni: settings.chainSni,
      chainHost: settings.chainHost
    }
  };
  if (includeSecrets) {
    exportPayload.secrets = {
      vlessUuid: settings.vlessUuid,
      trojanPassword: settings.trojanPassword,
      subToken: settings.subToken,
      chainAuth: settings.chainAuth,
      warpPrivateKey: settings.warpPrivateKey,
      warpIPv6: settings.warpIPv6,
      warpReserved: settings.warpReserved
    };
  }
  return new Response(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}
async function handleNodeImport(request, env2) {
  const sessionToken = getSessionCookie(request);
  if (!sessionToken) {
    return new Response(JSON.stringify({ error: "Unauthorized", message: "Admin session required." }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
  const session = await verifySessionToken(sessionToken, env2);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized", message: "Session expired." }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const importData = body.settings || body;
    if (!importData || typeof importData !== "object") {
      return new Response(JSON.stringify({ error: "Bad Request", message: "Invalid configuration JSON." }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    const kv = getKV(env2);
    if (!kv) {
      return new Response(JSON.stringify({ error: "KV Missing", message: "KV binding WD_KV or BK_KV is required." }), {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    const currentSettings = await getOrInitSettings(env2);
    const importedKeys = [];
    const pendingWrites = [];
    const queueWrite = /* @__PURE__ */ __name2((key, newVal, currentVal, fieldName) => {
      if (newVal !== void 0 && String(newVal).trim() !== String(currentVal).trim()) {
        pendingWrites.push({ key, value: String(newVal).trim(), fieldName });
      }
    }, "queueWrite");
    if (typeof importData.proxyPath === "string") {
      queueWrite(KV_KEYS.proxyPath, importData.proxyPath, currentSettings.proxyPath, "proxyPath");
    }
    if (typeof importData.proxyIp === "string") {
      queueWrite(KV_KEYS.proxyIp, importData.proxyIp, currentSettings.proxyIp, "proxyIp");
    }
    if (typeof importData.dnsDoH === "string") {
      queueWrite(KV_KEYS.dnsDoH, importData.dnsDoH, currentSettings.dnsDoH, "dnsDoH");
    }
    if (importData.allowLANConnection !== void 0) {
      queueWrite(KV_KEYS.allowLANConnection, String(importData.allowLANConnection), currentSettings.allowLANConnection, "allowLANConnection");
    }
    if (importData.fragmentEnabled !== void 0) {
      queueWrite(KV_KEYS.fragmentEnabled, String(importData.fragmentEnabled), currentSettings.fragmentEnabled, "fragmentEnabled");
    }
    if (typeof importData.fragmentPackets === "string") {
      queueWrite(KV_KEYS.fragmentPackets, importData.fragmentPackets, currentSettings.fragmentPackets, "fragmentPackets");
    }
    if (typeof importData.fragmentLength === "string") {
      queueWrite(KV_KEYS.fragmentLength, importData.fragmentLength, currentSettings.fragmentLength, "fragmentLength");
    }
    if (typeof importData.fragmentInterval === "string") {
      queueWrite(KV_KEYS.fragmentInterval, importData.fragmentInterval, currentSettings.fragmentInterval, "fragmentInterval");
    }
    if (typeof importData.routingPreset === "string") {
      queueWrite(KV_KEYS.routingPreset, importData.routingPreset, currentSettings.routingPreset, "routingPreset");
    }
    if (importData.warpProEnabled !== void 0) {
      queueWrite(KV_KEYS.warpProEnabled, String(importData.warpProEnabled), currentSettings.warpProEnabled, "warpProEnabled");
    }
    if (typeof importData.warpAmneziaVersion === "string") {
      queueWrite(KV_KEYS.warpAmneziaVersion, importData.warpAmneziaVersion, currentSettings.warpAmneziaVersion, "warpAmneziaVersion");
    }
    if (typeof importData.warpNoiseCount === "string") {
      queueWrite(KV_KEYS.warpNoiseCount, importData.warpNoiseCount, currentSettings.warpNoiseCount, "warpNoiseCount");
    }
    if (typeof importData.warpNoiseMin === "string") {
      queueWrite(KV_KEYS.warpNoiseMin, importData.warpNoiseMin, currentSettings.warpNoiseMin, "warpNoiseMin");
    }
    if (typeof importData.warpNoiseMax === "string") {
      queueWrite(KV_KEYS.warpNoiseMax, importData.warpNoiseMax, currentSettings.warpNoiseMax, "warpNoiseMax");
    }
    if (typeof importData.warpNoiseDelay === "string") {
      queueWrite(KV_KEYS.warpNoiseDelay, importData.warpNoiseDelay, currentSettings.warpNoiseDelay, "warpNoiseDelay");
    }
    if (typeof importData.warpAmneziaS1 === "string") {
      queueWrite(KV_KEYS.warpAmneziaS1, importData.warpAmneziaS1, currentSettings.warpAmneziaS1, "warpAmneziaS1");
    }
    if (typeof importData.warpAmneziaS2 === "string") {
      queueWrite(KV_KEYS.warpAmneziaS2, importData.warpAmneziaS2, currentSettings.warpAmneziaS2, "warpAmneziaS2");
    }
    if (typeof importData.warpAmneziaH1 === "string") {
      queueWrite(KV_KEYS.warpAmneziaH1, importData.warpAmneziaH1, currentSettings.warpAmneziaH1, "warpAmneziaH1");
    }
    if (typeof importData.warpAmneziaH2 === "string") {
      queueWrite(KV_KEYS.warpAmneziaH2, importData.warpAmneziaH2, currentSettings.warpAmneziaH2, "warpAmneziaH2");
    }
    if (typeof importData.warpAmneziaH3 === "string") {
      queueWrite(KV_KEYS.warpAmneziaH3, importData.warpAmneziaH3, currentSettings.warpAmneziaH3, "warpAmneziaH3");
    }
    if (typeof importData.warpAmneziaH4 === "string") {
      queueWrite(KV_KEYS.warpAmneziaH4, importData.warpAmneziaH4, currentSettings.warpAmneziaH4, "warpAmneziaH4");
    }
    if (importData.chainEnabled !== void 0) {
      queueWrite(KV_KEYS.chainEnabled, String(importData.chainEnabled), currentSettings.chainEnabled, "chainEnabled");
    }
    if (typeof importData.chainType === "string") {
      queueWrite(KV_KEYS.chainType, importData.chainType, currentSettings.chainType, "chainType");
    }
    if (typeof importData.chainAddress === "string") {
      queueWrite(KV_KEYS.chainAddress, importData.chainAddress, currentSettings.chainAddress, "chainAddress");
    }
    if (importData.chainPort !== void 0) {
      queueWrite(KV_KEYS.chainPort, String(importData.chainPort), currentSettings.chainPort, "chainPort");
    }
    if (typeof importData.chainPath === "string") {
      queueWrite(KV_KEYS.chainPath, importData.chainPath, currentSettings.chainPath, "chainPath");
    }
    if (typeof importData.chainSecurity === "string") {
      queueWrite(KV_KEYS.chainSecurity, importData.chainSecurity, currentSettings.chainSecurity, "chainSecurity");
    }
    if (typeof importData.chainTransport === "string") {
      queueWrite(KV_KEYS.chainTransport, importData.chainTransport, currentSettings.chainTransport, "chainTransport");
    }
    if (typeof importData.chainSni === "string") {
      queueWrite(KV_KEYS.chainSni, importData.chainSni, currentSettings.chainSni, "chainSni");
    }
    if (typeof importData.chainHost === "string") {
      queueWrite(KV_KEYS.chainHost, importData.chainHost, currentSettings.chainHost, "chainHost");
    }
    const secrets = body.secrets;
    if (secrets && typeof secrets === "object") {
      if (typeof secrets.vlessUuid === "string" && secrets.vlessUuid && secrets.vlessUuid !== currentSettings.vlessUuid) {
        pendingWrites.push({ key: KV_KEYS.vlessUuid, value: secrets.vlessUuid, fieldName: "vlessUuid" });
      }
      if (typeof secrets.trojanPassword === "string" && secrets.trojanPassword && secrets.trojanPassword !== currentSettings.trojanPassword) {
        pendingWrites.push({ key: KV_KEYS.trojanPassword, value: secrets.trojanPassword, fieldName: "trojanPassword" });
      }
      if (typeof secrets.chainAuth === "string" && secrets.chainAuth && secrets.chainAuth !== currentSettings.chainAuth) {
        pendingWrites.push({ key: KV_KEYS.chainAuth, value: secrets.chainAuth, fieldName: "chainAuth" });
      }
      if (typeof secrets.warpPrivateKey === "string" && secrets.warpPrivateKey && secrets.warpPrivateKey !== currentSettings.warpPrivateKey) {
        pendingWrites.push({ key: KV_KEYS.warpPrivateKey, value: secrets.warpPrivateKey, fieldName: "warpPrivateKey" });
      }
    }
    for (const item of pendingWrites) {
      try {
        await kv.put(item.key, item.value);
        importedKeys.push(item.fieldName);
      } catch (putErr) {
        const isQuota = putErr?.message?.toLowerCase().includes("quota") || putErr?.message?.toLowerCase().includes("limit exceeded");
        throw new Error(isQuota ? "KV write quota exceeded \u2014 try again after daily reset" : putErr?.message || "Failed to write imported key to KV");
      }
    }
    if (importedKeys.length > 0) {
      invalidateSettingsCache();
    }
    return new Response(
      JSON.stringify(
        {
          ok: true,
          message: importedKeys.length > 0 ? `Successfully imported ${importedKeys.length} changed setting(s) into BlueKnight KV.` : "No changes detected in imported payload \u2014 0 KV writes consumed.",
          importedCount: importedKeys.length,
          importedKeys
        },
        null,
        2
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      }
    );
  } catch (err) {
    const isQuota = err?.message?.toLowerCase().includes("quota") || err?.message?.toLowerCase().includes("limit exceeded");
    return new Response(
      JSON.stringify({
        error: isQuota ? "KV Quota Exceeded" : "Import Error",
        message: isQuota ? "KV write quota exceeded \u2014 try again after daily reset" : err.message || "Failed to process import payload."
      }),
      {
        status: isQuota ? 429 : 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      }
    );
  }
}
var __defProp2, __defNormalProp, __name2, __publicField, _timeOrigin, _performanceNow, nodeTiming, PerformanceEntry, PerformanceMark, PerformanceMeasure, PerformanceResourceTiming, PerformanceObserverEntryList, Performance, PerformanceObserver, performance, noop_default, _console, _ignoreErrors, _stderr, _stdout, log, info, trace, debug, table, error, warn, createTask, clear, count, countReset, dir, dirxml, group, groupEnd, groupCollapsed, profile, profileEnd, time, timeEnd, timeLog, timeStamp, Console, _times, _stdoutErrorHandler, _stderrErrorHandler, workerdConsole, assert, clear2, context, count2, countReset2, createTask2, debug2, dir2, dirxml2, error2, group2, groupCollapsed2, groupEnd2, info2, log2, profile2, profileEnd2, table2, time2, timeEnd2, timeLog2, timeStamp2, trace2, warn2, console_default, hrtime, ReadStream, WriteStream, Process, globalProcess, getBuiltinModule, exit, platform, nextTick, unenvProcess, abort, addListener, allowedNodeEnvironmentFlags, hasUncaughtExceptionCaptureCallback, setUncaughtExceptionCaptureCallback, loadEnvFile, sourceMapsEnabled, arch, argv, argv0, chdir, config, connected, constrainedMemory, availableMemory, cpuUsage, cwd, debugPort, dlopen, disconnect, emit, emitWarning, env, eventNames, execArgv, execPath, finalization, features, getActiveResourcesInfo, getMaxListeners, hrtime3, kill, listeners, listenerCount, memoryUsage, on, off, once, pid, ppid, prependListener, prependOnceListener, rawListeners, release, removeAllListeners, removeListener, report, resourceUsage, setMaxListeners, setSourceMapsEnabled, stderr, stdin, stdout, title, throwDeprecation, traceDeprecation, umask, uptime, version, versions, domain, initgroups, moduleLoadList, reallyExit, openStdin, assert2, binding, send, exitCode, channel, getegid, geteuid, getgid, getgroups, getuid, setegid, seteuid, setgid, setgroups, setuid, permission, mainModule, _events, _eventsCount, _exiting, _maxListeners, _debugEnd, _debugProcess, _fatalException, _getActiveHandles, _getActiveRequests, _kill, _preload_modules, _rawDebug, _startProfilerIdleNotifier, _stopProfilerIdleNotifier, _tickCallback, _disconnect, _handleQueue, _pendingMessage, _channel, _send, _linkedBinding, _process, process_default, APP_CONFIG, KV_KEYS, cachedSettings, cachedSettingsTimestamp, CACHE_TTL_MS, webcrypto_default, isCryptoKey, encoder, decoder, MAX_INT32, encodeBase64, encode, decodeBase64, decode, JOSEError, JWTClaimValidationFailed, JWTExpired, JOSEAlgNotAllowed, JOSENotSupported, JWEDecryptionFailed, JWEInvalid, JWSInvalid, JWTInvalid, JWKInvalid, JWKSInvalid, JWKSNoMatchingKey, JWKSMultipleMatchingKeys, JWKSTimeout, JWSSignatureVerificationFailed, invalid_key_input_default, is_key_like_default, types, isDisjoint, is_disjoint_default, check_key_length_default, parse, jwk_to_key_default, exportKeyValue, privCache, pubCache, isKeyObject, importAndCache, normalizePublicKey, normalizePrivateKey, normalize_key_default, tag, jwkMatchesOp, symmetricTypeCheck, asymmetricTypeCheck, check_key_type_default, checkKeyTypeWithJwk, validate_crit_default, validateAlgorithms, validate_algorithms_default, verify, verify_default, epoch_default, minute, hour, day, week, year, REGEX, secs_default, normalizeTyp, checkAudiencePresence, jwt_claims_set_default, sign, sign_default, FlattenedSign, CompactSign, ProduceJWT, SignJWT, cachedJwtSecret, cachedPasswordConfigured, cachedAdminPassword, MASCOT_SVG, BASE_STYLES, P, A24, connectImpl, THEME_BG_DATA_URIS, THEME_BG_DATA_URI, src_default;
var init_worker = __esm({
  "../worker.js"() {
    init_functionsRoutes_0_6698010974737841();
    __defProp2 = Object.defineProperty;
    __defNormalProp = /* @__PURE__ */ __name((obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value, "__defNormalProp");
    __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
    __publicField = /* @__PURE__ */ __name((obj, key, value) => {
      __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
      return value;
    }, "__publicField");
    __name(createNotImplementedError, "createNotImplementedError");
    __name2(createNotImplementedError, "createNotImplementedError");
    __name(notImplemented, "notImplemented");
    __name2(notImplemented, "notImplemented");
    __name(notImplementedClass, "notImplementedClass");
    __name2(notImplementedClass, "notImplementedClass");
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
      name: "node",
      entryType: "node",
      startTime: 0,
      duration: 0,
      nodeStart: 0,
      v8Start: 0,
      bootstrapComplete: 0,
      environment: 0,
      loopStart: 0,
      loopExit: 0,
      idleTime: 0,
      uvMetricsInfo: {
        loopCount: 0,
        events: 0,
        eventsWaiting: 0
      },
      detail: void 0,
      toJSON() {
        return this;
      }
    };
    PerformanceEntry = class {
      static {
        __name(this, "PerformanceEntry");
      }
      __unenv__ = true;
      detail;
      entryType = "event";
      name;
      startTime;
      constructor(name, options) {
        this.name = name;
        this.startTime = options?.startTime || _performanceNow();
        this.detail = options?.detail;
      }
      get duration() {
        return _performanceNow() - this.startTime;
      }
      toJSON() {
        return {
          name: this.name,
          entryType: this.entryType,
          startTime: this.startTime,
          duration: this.duration,
          detail: this.detail
        };
      }
    };
    __name2(PerformanceEntry, "PerformanceEntry");
    PerformanceMark = /* @__PURE__ */ __name2(class PerformanceMark2 extends PerformanceEntry {
      static {
        __name(this, "PerformanceMark2");
      }
      entryType = "mark";
      constructor() {
        super(...arguments);
      }
      get duration() {
        return 0;
      }
    }, "PerformanceMark");
    PerformanceMeasure = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceMeasure");
      }
      entryType = "measure";
    };
    __name2(PerformanceMeasure, "PerformanceMeasure");
    PerformanceResourceTiming = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceResourceTiming");
      }
      entryType = "resource";
      serverTiming = [];
      connectEnd = 0;
      connectStart = 0;
      decodedBodySize = 0;
      domainLookupEnd = 0;
      domainLookupStart = 0;
      encodedBodySize = 0;
      fetchStart = 0;
      initiatorType = "";
      name = "";
      nextHopProtocol = "";
      redirectEnd = 0;
      redirectStart = 0;
      requestStart = 0;
      responseEnd = 0;
      responseStart = 0;
      secureConnectionStart = 0;
      startTime = 0;
      transferSize = 0;
      workerStart = 0;
      responseStatus = 0;
    };
    __name2(PerformanceResourceTiming, "PerformanceResourceTiming");
    PerformanceObserverEntryList = class {
      static {
        __name(this, "PerformanceObserverEntryList");
      }
      __unenv__ = true;
      getEntries() {
        return [];
      }
      getEntriesByName(_name, _type) {
        return [];
      }
      getEntriesByType(type) {
        return [];
      }
    };
    __name2(PerformanceObserverEntryList, "PerformanceObserverEntryList");
    Performance = class {
      static {
        __name(this, "Performance");
      }
      __unenv__ = true;
      timeOrigin = _timeOrigin;
      eventCounts = /* @__PURE__ */ new Map();
      _entries = [];
      _resourceTimingBufferSize = 0;
      navigation = void 0;
      timing = void 0;
      timerify(_fn, _options) {
        throw createNotImplementedError("Performance.timerify");
      }
      get nodeTiming() {
        return nodeTiming;
      }
      eventLoopUtilization() {
        return {};
      }
      markResourceTiming() {
        return new PerformanceResourceTiming("");
      }
      onresourcetimingbufferfull = null;
      now() {
        if (this.timeOrigin === _timeOrigin) {
          return _performanceNow();
        }
        return Date.now() - this.timeOrigin;
      }
      clearMarks(markName) {
        this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
      }
      clearMeasures(measureName) {
        this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
      }
      clearResourceTimings() {
        this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
      }
      getEntries() {
        return this._entries;
      }
      getEntriesByName(name, type) {
        return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
      }
      getEntriesByType(type) {
        return this._entries.filter((e) => e.entryType === type);
      }
      mark(name, options) {
        const entry = new PerformanceMark(name, options);
        this._entries.push(entry);
        return entry;
      }
      measure(measureName, startOrMeasureOptions, endMark) {
        let start;
        let end;
        if (typeof startOrMeasureOptions === "string") {
          start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
          end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
        } else {
          start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
          end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
        }
        const entry = new PerformanceMeasure(measureName, {
          startTime: start,
          detail: {
            start,
            end
          }
        });
        this._entries.push(entry);
        return entry;
      }
      setResourceTimingBufferSize(maxSize) {
        this._resourceTimingBufferSize = maxSize;
      }
      addEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.addEventListener");
      }
      removeEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.removeEventListener");
      }
      dispatchEvent(event) {
        throw createNotImplementedError("Performance.dispatchEvent");
      }
      toJSON() {
        return this;
      }
    };
    __name2(Performance, "Performance");
    PerformanceObserver = class {
      static {
        __name(this, "PerformanceObserver");
      }
      __unenv__ = true;
      _callback = null;
      constructor(callback) {
        this._callback = callback;
      }
      takeRecords() {
        return [];
      }
      disconnect() {
        throw createNotImplementedError("PerformanceObserver.disconnect");
      }
      observe(options) {
        throw createNotImplementedError("PerformanceObserver.observe");
      }
      bind(fn) {
        return fn;
      }
      runInAsyncScope(fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      asyncId() {
        return 0;
      }
      triggerAsyncId() {
        return 0;
      }
      emitDestroy() {
        return this;
      }
    };
    __name2(PerformanceObserver, "PerformanceObserver");
    __publicField(PerformanceObserver, "supportedEntryTypes", []);
    performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
    globalThis.performance = performance;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
    noop_default = Object.assign(() => {
    }, { __unenv__: true });
    _console = globalThis.console;
    _ignoreErrors = true;
    _stderr = new Writable2();
    _stdout = new Writable2();
    log = _console?.log ?? noop_default;
    info = _console?.info ?? log;
    trace = _console?.trace ?? info;
    debug = _console?.debug ?? log;
    table = _console?.table ?? log;
    error = _console?.error ?? log;
    warn = _console?.warn ?? error;
    createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
    clear = _console?.clear ?? noop_default;
    count = _console?.count ?? noop_default;
    countReset = _console?.countReset ?? noop_default;
    dir = _console?.dir ?? noop_default;
    dirxml = _console?.dirxml ?? noop_default;
    group = _console?.group ?? noop_default;
    groupEnd = _console?.groupEnd ?? noop_default;
    groupCollapsed = _console?.groupCollapsed ?? noop_default;
    profile = _console?.profile ?? noop_default;
    profileEnd = _console?.profileEnd ?? noop_default;
    time = _console?.time ?? noop_default;
    timeEnd = _console?.timeEnd ?? noop_default;
    timeLog = _console?.timeLog ?? noop_default;
    timeStamp = _console?.timeStamp ?? noop_default;
    Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
    _times = /* @__PURE__ */ new Map();
    _stdoutErrorHandler = noop_default;
    _stderrErrorHandler = noop_default;
    workerdConsole = globalThis["console"];
    ({
      assert,
      clear: clear2,
      context: (
        // @ts-expect-error undocumented public API
        context
      ),
      count: count2,
      countReset: countReset2,
      createTask: createTask2,
      debug: debug2,
      dir: dir2,
      dirxml: dirxml2,
      error: error2,
      group: group2,
      groupCollapsed: groupCollapsed2,
      groupEnd: groupEnd2,
      info: info2,
      log: log2,
      profile: profile2,
      profileEnd: profileEnd2,
      table: table2,
      time: time2,
      timeEnd: timeEnd2,
      timeLog: timeLog2,
      timeStamp: timeStamp2,
      trace: trace2,
      warn: warn2
    } = workerdConsole);
    Object.assign(workerdConsole, {
      Console,
      _ignoreErrors,
      _stderr,
      _stderrErrorHandler,
      _stdout,
      _stdoutErrorHandler,
      _times
    });
    console_default = workerdConsole;
    globalThis.console = console_default;
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name2(/* @__PURE__ */ __name(function hrtime2(startTime) {
      const now = Date.now();
      const seconds = Math.trunc(now / 1e3);
      const nanos = now % 1e3 * 1e6;
      if (startTime) {
        let diffSeconds = seconds - startTime[0];
        let diffNanos = nanos - startTime[0];
        if (diffNanos < 0) {
          diffSeconds = diffSeconds - 1;
          diffNanos = 1e9 + diffNanos;
        }
        return [diffSeconds, diffNanos];
      }
      return [seconds, nanos];
    }, "hrtime2"), "hrtime"), { bigint: /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function bigint() {
      return BigInt(Date.now() * 1e6);
    }, "bigint"), "bigint") });
    ReadStream = class extends Socket {
      static {
        __name(this, "ReadStream");
      }
      fd;
      constructor(fd) {
        super();
        this.fd = fd;
      }
      isRaw = false;
      setRawMode(mode) {
        this.isRaw = mode;
        return this;
      }
      isTTY = false;
    };
    __name2(ReadStream, "ReadStream");
    WriteStream = class extends Socket2 {
      static {
        __name(this, "WriteStream");
      }
      fd;
      constructor(fd) {
        super();
        this.fd = fd;
      }
      clearLine(dir3, callback) {
        callback && callback();
        return false;
      }
      clearScreenDown(callback) {
        callback && callback();
        return false;
      }
      cursorTo(x, y, callback) {
        callback && typeof callback === "function" && callback();
        return false;
      }
      moveCursor(dx, dy, callback) {
        callback && callback();
        return false;
      }
      getColorDepth(env2) {
        return 1;
      }
      hasColors(count3, env2) {
        return false;
      }
      getWindowSize() {
        return [this.columns, this.rows];
      }
      columns = 80;
      rows = 24;
      isTTY = false;
    };
    __name2(WriteStream, "WriteStream");
    Process = class extends EventEmitter {
      static {
        __name(this, "Process");
      }
      env;
      hrtime;
      nextTick;
      constructor(impl) {
        super();
        this.env = impl.env;
        this.hrtime = impl.hrtime;
        this.nextTick = impl.nextTick;
        for (const prop of [...Object.getOwnPropertyNames(Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
          const value = this[prop];
          if (typeof value === "function") {
            this[prop] = value.bind(this);
          }
        }
      }
      emitWarning(warning, type, code) {
        console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
      }
      emit(...args) {
        return super.emit(...args);
      }
      listeners(eventName) {
        return super.listeners(eventName);
      }
      #stdin;
      #stdout;
      #stderr;
      get stdin() {
        return this.#stdin ??= new ReadStream(0);
      }
      get stdout() {
        return this.#stdout ??= new WriteStream(1);
      }
      get stderr() {
        return this.#stderr ??= new WriteStream(2);
      }
      #cwd = "/";
      chdir(cwd2) {
        this.#cwd = cwd2;
      }
      cwd() {
        return this.#cwd;
      }
      arch = "";
      platform = "";
      argv = [];
      argv0 = "";
      execArgv = [];
      execPath = "";
      title = "";
      pid = 200;
      ppid = 100;
      get version() {
        return "";
      }
      get versions() {
        return {};
      }
      get allowedNodeEnvironmentFlags() {
        return /* @__PURE__ */ new Set();
      }
      get sourceMapsEnabled() {
        return false;
      }
      get debugPort() {
        return 0;
      }
      get throwDeprecation() {
        return false;
      }
      get traceDeprecation() {
        return false;
      }
      get features() {
        return {};
      }
      get release() {
        return {};
      }
      get connected() {
        return false;
      }
      get config() {
        return {};
      }
      get moduleLoadList() {
        return [];
      }
      constrainedMemory() {
        return 0;
      }
      availableMemory() {
        return 0;
      }
      uptime() {
        return 0;
      }
      resourceUsage() {
        return {};
      }
      ref() {
      }
      unref() {
      }
      umask() {
        throw createNotImplementedError("process.umask");
      }
      getBuiltinModule() {
        return void 0;
      }
      getActiveResourcesInfo() {
        throw createNotImplementedError("process.getActiveResourcesInfo");
      }
      exit() {
        throw createNotImplementedError("process.exit");
      }
      reallyExit() {
        throw createNotImplementedError("process.reallyExit");
      }
      kill() {
        throw createNotImplementedError("process.kill");
      }
      abort() {
        throw createNotImplementedError("process.abort");
      }
      dlopen() {
        throw createNotImplementedError("process.dlopen");
      }
      setSourceMapsEnabled() {
        throw createNotImplementedError("process.setSourceMapsEnabled");
      }
      loadEnvFile() {
        throw createNotImplementedError("process.loadEnvFile");
      }
      disconnect() {
        throw createNotImplementedError("process.disconnect");
      }
      cpuUsage() {
        throw createNotImplementedError("process.cpuUsage");
      }
      setUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
      }
      hasUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
      }
      initgroups() {
        throw createNotImplementedError("process.initgroups");
      }
      openStdin() {
        throw createNotImplementedError("process.openStdin");
      }
      assert() {
        throw createNotImplementedError("process.assert");
      }
      binding() {
        throw createNotImplementedError("process.binding");
      }
      permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
      report = {
        directory: "",
        filename: "",
        signal: "SIGUSR2",
        compact: false,
        reportOnFatalError: false,
        reportOnSignal: false,
        reportOnUncaughtException: false,
        getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
        writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
      };
      finalization = {
        register: /* @__PURE__ */ notImplemented("process.finalization.register"),
        unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
        registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
      };
      memoryUsage = Object.assign(() => ({
        arrayBuffers: 0,
        rss: 0,
        external: 0,
        heapTotal: 0,
        heapUsed: 0
      }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
      mainModule = void 0;
      domain = void 0;
      send = void 0;
      exitCode = void 0;
      channel = void 0;
      getegid = void 0;
      geteuid = void 0;
      getgid = void 0;
      getgroups = void 0;
      getuid = void 0;
      setegid = void 0;
      seteuid = void 0;
      setgid = void 0;
      setgroups = void 0;
      setuid = void 0;
      _events = void 0;
      _eventsCount = void 0;
      _exiting = void 0;
      _maxListeners = void 0;
      _debugEnd = void 0;
      _debugProcess = void 0;
      _fatalException = void 0;
      _getActiveHandles = void 0;
      _getActiveRequests = void 0;
      _kill = void 0;
      _preload_modules = void 0;
      _rawDebug = void 0;
      _startProfilerIdleNotifier = void 0;
      _stopProfilerIdleNotifier = void 0;
      _tickCallback = void 0;
      _disconnect = void 0;
      _handleQueue = void 0;
      _pendingMessage = void 0;
      _channel = void 0;
      _send = void 0;
      _linkedBinding = void 0;
    };
    __name2(Process, "Process");
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    ({ exit, platform, nextTick } = getBuiltinModule(
      "node:process"
    ));
    unenvProcess = new Process({
      env: globalProcess.env,
      hrtime,
      nextTick
    });
    ({
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      arch,
      argv,
      argv0,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      finalization,
      features,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      on,
      off,
      once,
      pid,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      throwDeprecation,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions,
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      openStdin,
      assert: assert2,
      binding,
      send,
      exitCode,
      channel,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      permission,
      mainModule,
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      _disconnect,
      _handleQueue,
      _pendingMessage,
      _channel,
      _send,
      _linkedBinding
    } = unenvProcess);
    _process = {
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      arch,
      argv,
      argv0,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exit,
      finalization,
      features,
      getBuiltinModule,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      nextTick,
      on,
      off,
      once,
      pid,
      platform,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      throwDeprecation,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions,
      // @ts-expect-error old API
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      openStdin,
      assert: assert2,
      binding,
      send,
      exitCode,
      channel,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      permission,
      mainModule,
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      _disconnect,
      _handleQueue,
      _pendingMessage,
      _channel,
      _send,
      _linkedBinding
    };
    process_default = _process;
    globalThis.process = process_default;
    __name(getKV, "getKV");
    __name2(getKV, "getKV");
    APP_CONFIG = {
      name: "BlueKnight Panel",
      tagline: "Ethereal Pastel Encrypted DNS & Multi-Protocol Proxy",
      version: "5.2.1",
      // bk_* is the BlueKnight cookie; wd_session is still accepted so sessions
      // issued before the rename keep working until they expire.
      cookieName: "bk_session",
      legacyCookieName: "wd_session",
      // No defaultJwtSecret here on purpose: a signing key committed to a
      // public repo is a master key to every deployment that uses it.
      defaultDevPassword: "blueknight123",
      // Development channel, surfaced in the sidebar and on the login page so
      // operators know where updates and support actually come from.
      telegramChannel: "https://t.me/BlueKnight_Net",
      sessionMaxAgeSeconds: 60 * 60 * 24 * 7,
      // 7 days
      defaultProxyPath: "/bk-ws",
      defaultDohUpstream: "https://cloudflare-dns.com/dns-query",
      defaultWarpPeerPublicKey: "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo="
    };
    KV_KEYS = {
      adminPassword: "config:admin_password",
      jwtSecret: "config:jwt_secret",
      settings: "config:settings",
      vlessUuid: "config:vless_uuid",
      trojanPassword: "config:trojan_password",
      proxyPath: "config:proxy_path",
      proxyIp: "config:proxy_ip",
      subToken: "config:sub_token",
      dnsDoH: "config:dns_doh",
      allowLANConnection: "config:allow_lan_connection",
      fragmentEnabled: "config:fragment_enabled",
      fragmentPackets: "config:fragment_packets",
      fragmentLength: "config:fragment_length",
      fragmentInterval: "config:fragment_interval",
      routingPreset: "config:routing_preset",
      warpPrivateKey: "config:warp_private_key",
      warpPeerPublicKey: "config:warp_peer_public_key",
      warpIPv6: "config:warp_ipv6",
      warpReserved: "config:warp_reserved",
      // Warp Pro & AmneziaWG
      warpProEnabled: "config:warp_pro_enabled",
      warpAmneziaVersion: "config:warp_amnezia_version",
      warpNoiseCount: "config:warp_noise_count",
      warpNoiseMin: "config:warp_noise_min",
      warpNoiseMax: "config:warp_noise_max",
      warpNoiseDelay: "config:warp_noise_delay",
      warpAmneziaS1: "config:warp_amnezia_s1",
      warpAmneziaS2: "config:warp_amnezia_s2",
      warpAmneziaH1: "config:warp_amnezia_h1",
      warpAmneziaH2: "config:warp_amnezia_h2",
      warpAmneziaH3: "config:warp_amnezia_h3",
      warpAmneziaH4: "config:warp_amnezia_h4",
      // Chain Proxy
      chainEnabled: "config:chain_enabled",
      chainType: "config:chain_type",
      chainAddress: "config:chain_address",
      chainPort: "config:chain_port",
      chainAuth: "config:chain_auth",
      chainPath: "config:chain_path",
      chainSecurity: "config:chain_security",
      chainTransport: "config:chain_transport",
      chainSni: "config:chain_sni",
      chainHost: "config:chain_host",
      // Node Share
      nodeShareToken: "config:node_share_token",
      // Domain Fronting
      domainFrontingEnabled: "config:domain_fronting_enabled",
      frontingSni: "config:fronting_sni",
      frontingHost: "config:fronting_host",
      frontingCleanIps: "config:fronting_clean_ips",
      // Static IP Pool
      staticIpList: "config:static_ip_list",
      // OpenVPN
      openvpnEnabled: "config:openvpn_enabled",
      openvpnPort: "config:openvpn_port",
      openvpnProto: "config:openvpn_proto",
      openvpnCipher: "config:openvpn_cipher",
      // AnyTLS
      anytlsFingerprint: "config:anytls_fingerprint",
      anytlsAlpn: "config:anytls_alpn",
      // XHTTP & HTTP Upgrade
      xhttpEnabled: "config:xhttp_enabled",
      xhttpPath: "config:xhttp_path",
      xhttpMode: "config:xhttp_mode",
      httpUpgradeEnabled: "config:http_upgrade_enabled",
      // Shadowsocks
      ssEnabled: "config:ss_enabled",
      ssPassword: "config:ss_password",
      ssMethod: "config:ss_method",
      // Custom DNS
      dnsCustom: "config:dns_custom"
    };
    __name(generateRandomToken, "generateRandomToken");
    __name2(generateRandomToken, "generateRandomToken");
    __name(generateRandomPassword, "generateRandomPassword");
    __name2(generateRandomPassword, "generateRandomPassword");
    cachedSettings = null;
    cachedSettingsTimestamp = 0;
    CACHE_TTL_MS = 3e4;
    __name(invalidateSettingsCache, "invalidateSettingsCache");
    __name2(invalidateSettingsCache, "invalidateSettingsCache");
    __name(getOrInitSettings, "getOrInitSettings");
    __name2(getOrInitSettings, "getOrInitSettings");
    __name(handleHealth, "handleHealth");
    __name2(handleHealth, "handleHealth");
    __name(handleProxyDebug, "handleProxyDebug");
    __name2(handleProxyDebug, "handleProxyDebug");
    webcrypto_default = crypto;
    isCryptoKey = /* @__PURE__ */ __name2((key) => key instanceof CryptoKey, "isCryptoKey");
    encoder = new TextEncoder();
    decoder = new TextDecoder();
    MAX_INT32 = 2 ** 32;
    __name(concat, "concat");
    __name2(concat, "concat");
    encodeBase64 = /* @__PURE__ */ __name2((input) => {
      let unencoded = input;
      if (typeof unencoded === "string") {
        unencoded = encoder.encode(unencoded);
      }
      const CHUNK_SIZE = 32768;
      const arr = [];
      for (let i = 0; i < unencoded.length; i += CHUNK_SIZE) {
        arr.push(String.fromCharCode.apply(null, unencoded.subarray(i, i + CHUNK_SIZE)));
      }
      return btoa(arr.join(""));
    }, "encodeBase64");
    encode = /* @__PURE__ */ __name2((input) => {
      return encodeBase64(input).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }, "encode");
    decodeBase64 = /* @__PURE__ */ __name2((encoded) => {
      const binary = atob(encoded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }, "decodeBase64");
    decode = /* @__PURE__ */ __name2((input) => {
      let encoded = input;
      if (encoded instanceof Uint8Array) {
        encoded = decoder.decode(encoded);
      }
      encoded = encoded.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
      try {
        return decodeBase64(encoded);
      } catch {
        throw new TypeError("The input to be decoded is not correctly encoded.");
      }
    }, "decode");
    JOSEError = class extends Error {
      static {
        __name(this, "JOSEError");
      }
      constructor(message2, options) {
        super(message2, options);
        this.code = "ERR_JOSE_GENERIC";
        this.name = this.constructor.name;
        Error.captureStackTrace?.(this, this.constructor);
      }
    };
    __name2(JOSEError, "JOSEError");
    JOSEError.code = "ERR_JOSE_GENERIC";
    JWTClaimValidationFailed = class extends JOSEError {
      static {
        __name(this, "JWTClaimValidationFailed");
      }
      constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
        super(message2, { cause: { claim, reason, payload } });
        this.code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
        this.claim = claim;
        this.reason = reason;
        this.payload = payload;
      }
    };
    __name2(JWTClaimValidationFailed, "JWTClaimValidationFailed");
    JWTClaimValidationFailed.code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
    JWTExpired = class extends JOSEError {
      static {
        __name(this, "JWTExpired");
      }
      constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
        super(message2, { cause: { claim, reason, payload } });
        this.code = "ERR_JWT_EXPIRED";
        this.claim = claim;
        this.reason = reason;
        this.payload = payload;
      }
    };
    __name2(JWTExpired, "JWTExpired");
    JWTExpired.code = "ERR_JWT_EXPIRED";
    JOSEAlgNotAllowed = class extends JOSEError {
      static {
        __name(this, "JOSEAlgNotAllowed");
      }
      constructor() {
        super(...arguments);
        this.code = "ERR_JOSE_ALG_NOT_ALLOWED";
      }
    };
    __name2(JOSEAlgNotAllowed, "JOSEAlgNotAllowed");
    JOSEAlgNotAllowed.code = "ERR_JOSE_ALG_NOT_ALLOWED";
    JOSENotSupported = class extends JOSEError {
      static {
        __name(this, "JOSENotSupported");
      }
      constructor() {
        super(...arguments);
        this.code = "ERR_JOSE_NOT_SUPPORTED";
      }
    };
    __name2(JOSENotSupported, "JOSENotSupported");
    JOSENotSupported.code = "ERR_JOSE_NOT_SUPPORTED";
    JWEDecryptionFailed = class extends JOSEError {
      static {
        __name(this, "JWEDecryptionFailed");
      }
      constructor(message2 = "decryption operation failed", options) {
        super(message2, options);
        this.code = "ERR_JWE_DECRYPTION_FAILED";
      }
    };
    __name2(JWEDecryptionFailed, "JWEDecryptionFailed");
    JWEDecryptionFailed.code = "ERR_JWE_DECRYPTION_FAILED";
    JWEInvalid = class extends JOSEError {
      static {
        __name(this, "JWEInvalid");
      }
      constructor() {
        super(...arguments);
        this.code = "ERR_JWE_INVALID";
      }
    };
    __name2(JWEInvalid, "JWEInvalid");
    JWEInvalid.code = "ERR_JWE_INVALID";
    JWSInvalid = class extends JOSEError {
      static {
        __name(this, "JWSInvalid");
      }
      constructor() {
        super(...arguments);
        this.code = "ERR_JWS_INVALID";
      }
    };
    __name2(JWSInvalid, "JWSInvalid");
    JWSInvalid.code = "ERR_JWS_INVALID";
    JWTInvalid = class extends JOSEError {
      static {
        __name(this, "JWTInvalid");
      }
      constructor() {
        super(...arguments);
        this.code = "ERR_JWT_INVALID";
      }
    };
    __name2(JWTInvalid, "JWTInvalid");
    JWTInvalid.code = "ERR_JWT_INVALID";
    JWKInvalid = class extends JOSEError {
      static {
        __name(this, "JWKInvalid");
      }
      constructor() {
        super(...arguments);
        this.code = "ERR_JWK_INVALID";
      }
    };
    __name2(JWKInvalid, "JWKInvalid");
    JWKInvalid.code = "ERR_JWK_INVALID";
    JWKSInvalid = class extends JOSEError {
      static {
        __name(this, "JWKSInvalid");
      }
      constructor() {
        super(...arguments);
        this.code = "ERR_JWKS_INVALID";
      }
    };
    __name2(JWKSInvalid, "JWKSInvalid");
    JWKSInvalid.code = "ERR_JWKS_INVALID";
    JWKSNoMatchingKey = class extends JOSEError {
      static {
        __name(this, "JWKSNoMatchingKey");
      }
      constructor(message2 = "no applicable key found in the JSON Web Key Set", options) {
        super(message2, options);
        this.code = "ERR_JWKS_NO_MATCHING_KEY";
      }
    };
    __name2(JWKSNoMatchingKey, "JWKSNoMatchingKey");
    JWKSNoMatchingKey.code = "ERR_JWKS_NO_MATCHING_KEY";
    JWKSMultipleMatchingKeys = class extends JOSEError {
      static {
        __name(this, "JWKSMultipleMatchingKeys");
      }
      constructor(message2 = "multiple matching keys found in the JSON Web Key Set", options) {
        super(message2, options);
        this.code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
      }
    };
    __name2(JWKSMultipleMatchingKeys, "JWKSMultipleMatchingKeys");
    JWKSMultipleMatchingKeys.code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
    JWKSTimeout = class extends JOSEError {
      static {
        __name(this, "JWKSTimeout");
      }
      constructor(message2 = "request timed out", options) {
        super(message2, options);
        this.code = "ERR_JWKS_TIMEOUT";
      }
    };
    __name2(JWKSTimeout, "JWKSTimeout");
    JWKSTimeout.code = "ERR_JWKS_TIMEOUT";
    JWSSignatureVerificationFailed = class extends JOSEError {
      static {
        __name(this, "JWSSignatureVerificationFailed");
      }
      constructor(message2 = "signature verification failed", options) {
        super(message2, options);
        this.code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
      }
    };
    __name2(JWSSignatureVerificationFailed, "JWSSignatureVerificationFailed");
    JWSSignatureVerificationFailed.code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
    __name(unusable, "unusable");
    __name2(unusable, "unusable");
    __name(isAlgorithm, "isAlgorithm");
    __name2(isAlgorithm, "isAlgorithm");
    __name(getHashLength, "getHashLength");
    __name2(getHashLength, "getHashLength");
    __name(getNamedCurve, "getNamedCurve");
    __name2(getNamedCurve, "getNamedCurve");
    __name(checkUsage, "checkUsage");
    __name2(checkUsage, "checkUsage");
    __name(checkSigCryptoKey, "checkSigCryptoKey");
    __name2(checkSigCryptoKey, "checkSigCryptoKey");
    __name(message, "message");
    __name2(message, "message");
    invalid_key_input_default = /* @__PURE__ */ __name2((actual, ...types2) => {
      return message("Key must be ", actual, ...types2);
    }, "default");
    __name(withAlg, "withAlg");
    __name2(withAlg, "withAlg");
    is_key_like_default = /* @__PURE__ */ __name2((key) => {
      if (isCryptoKey(key)) {
        return true;
      }
      return key?.[Symbol.toStringTag] === "KeyObject";
    }, "default");
    types = ["CryptoKey"];
    isDisjoint = /* @__PURE__ */ __name2((...headers) => {
      const sources = headers.filter(Boolean);
      if (sources.length === 0 || sources.length === 1) {
        return true;
      }
      let acc;
      for (const header of sources) {
        const parameters = Object.keys(header);
        if (!acc || acc.size === 0) {
          acc = new Set(parameters);
          continue;
        }
        for (const parameter of parameters) {
          if (acc.has(parameter)) {
            return false;
          }
          acc.add(parameter);
        }
      }
      return true;
    }, "isDisjoint");
    is_disjoint_default = isDisjoint;
    __name(isObjectLike, "isObjectLike");
    __name2(isObjectLike, "isObjectLike");
    __name(isObject, "isObject");
    __name2(isObject, "isObject");
    check_key_length_default = /* @__PURE__ */ __name2((alg, key) => {
      if (alg.startsWith("RS") || alg.startsWith("PS")) {
        const { modulusLength } = key.algorithm;
        if (typeof modulusLength !== "number" || modulusLength < 2048) {
          throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
        }
      }
    }, "default");
    __name(isJWK, "isJWK");
    __name2(isJWK, "isJWK");
    __name(isPrivateJWK, "isPrivateJWK");
    __name2(isPrivateJWK, "isPrivateJWK");
    __name(isPublicJWK, "isPublicJWK");
    __name2(isPublicJWK, "isPublicJWK");
    __name(isSecretJWK, "isSecretJWK");
    __name2(isSecretJWK, "isSecretJWK");
    __name(subtleMapping, "subtleMapping");
    __name2(subtleMapping, "subtleMapping");
    parse = /* @__PURE__ */ __name2(async (jwk) => {
      if (!jwk.alg) {
        throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
      }
      const { algorithm, keyUsages } = subtleMapping(jwk);
      const rest = [
        algorithm,
        jwk.ext ?? false,
        jwk.key_ops ?? keyUsages
      ];
      const keyData = { ...jwk };
      delete keyData.alg;
      delete keyData.use;
      return webcrypto_default.subtle.importKey("jwk", keyData, ...rest);
    }, "parse");
    jwk_to_key_default = parse;
    exportKeyValue = /* @__PURE__ */ __name2((k) => decode(k), "exportKeyValue");
    isKeyObject = /* @__PURE__ */ __name2((key) => {
      return key?.[Symbol.toStringTag] === "KeyObject";
    }, "isKeyObject");
    importAndCache = /* @__PURE__ */ __name2(async (cache, key, jwk, alg, freeze = false) => {
      let cached = cache.get(key);
      if (cached?.[alg]) {
        return cached[alg];
      }
      const cryptoKey = await jwk_to_key_default({ ...jwk, alg });
      if (freeze)
        Object.freeze(key);
      if (!cached) {
        cache.set(key, { [alg]: cryptoKey });
      } else {
        cached[alg] = cryptoKey;
      }
      return cryptoKey;
    }, "importAndCache");
    normalizePublicKey = /* @__PURE__ */ __name2((key, alg) => {
      if (isKeyObject(key)) {
        let jwk = key.export({ format: "jwk" });
        delete jwk.d;
        delete jwk.dp;
        delete jwk.dq;
        delete jwk.p;
        delete jwk.q;
        delete jwk.qi;
        if (jwk.k) {
          return exportKeyValue(jwk.k);
        }
        pubCache || (pubCache = /* @__PURE__ */ new WeakMap());
        return importAndCache(pubCache, key, jwk, alg);
      }
      if (isJWK(key)) {
        if (key.k)
          return decode(key.k);
        pubCache || (pubCache = /* @__PURE__ */ new WeakMap());
        const cryptoKey = importAndCache(pubCache, key, key, alg, true);
        return cryptoKey;
      }
      return key;
    }, "normalizePublicKey");
    normalizePrivateKey = /* @__PURE__ */ __name2((key, alg) => {
      if (isKeyObject(key)) {
        let jwk = key.export({ format: "jwk" });
        if (jwk.k) {
          return exportKeyValue(jwk.k);
        }
        privCache || (privCache = /* @__PURE__ */ new WeakMap());
        return importAndCache(privCache, key, jwk, alg);
      }
      if (isJWK(key)) {
        if (key.k)
          return decode(key.k);
        privCache || (privCache = /* @__PURE__ */ new WeakMap());
        const cryptoKey = importAndCache(privCache, key, key, alg, true);
        return cryptoKey;
      }
      return key;
    }, "normalizePrivateKey");
    normalize_key_default = { normalizePublicKey, normalizePrivateKey };
    __name(importJWK, "importJWK");
    __name2(importJWK, "importJWK");
    tag = /* @__PURE__ */ __name2((key) => key?.[Symbol.toStringTag], "tag");
    jwkMatchesOp = /* @__PURE__ */ __name2((alg, key, usage) => {
      if (key.use !== void 0 && key.use !== "sig") {
        throw new TypeError("Invalid key for this operation, when present its use must be sig");
      }
      if (key.key_ops !== void 0 && key.key_ops.includes?.(usage) !== true) {
        throw new TypeError(`Invalid key for this operation, when present its key_ops must include ${usage}`);
      }
      if (key.alg !== void 0 && key.alg !== alg) {
        throw new TypeError(`Invalid key for this operation, when present its alg must be ${alg}`);
      }
      return true;
    }, "jwkMatchesOp");
    symmetricTypeCheck = /* @__PURE__ */ __name2((alg, key, usage, allowJwk) => {
      if (key instanceof Uint8Array)
        return;
      if (allowJwk && isJWK(key)) {
        if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
      }
      if (!is_key_like_default(key)) {
        throw new TypeError(withAlg(alg, key, ...types, "Uint8Array", allowJwk ? "JSON Web Key" : null));
      }
      if (key.type !== "secret") {
        throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
      }
    }, "symmetricTypeCheck");
    asymmetricTypeCheck = /* @__PURE__ */ __name2((alg, key, usage, allowJwk) => {
      if (allowJwk && isJWK(key)) {
        switch (usage) {
          case "sign":
            if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
              return;
            throw new TypeError(`JSON Web Key for this operation be a private JWK`);
          case "verify":
            if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
              return;
            throw new TypeError(`JSON Web Key for this operation be a public JWK`);
        }
      }
      if (!is_key_like_default(key)) {
        throw new TypeError(withAlg(alg, key, ...types, allowJwk ? "JSON Web Key" : null));
      }
      if (key.type === "secret") {
        throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
      }
      if (usage === "sign" && key.type === "public") {
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
      }
      if (usage === "decrypt" && key.type === "public") {
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
      }
      if (key.algorithm && usage === "verify" && key.type === "private") {
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
      }
      if (key.algorithm && usage === "encrypt" && key.type === "private") {
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
      }
    }, "asymmetricTypeCheck");
    __name(checkKeyType, "checkKeyType");
    __name2(checkKeyType, "checkKeyType");
    check_key_type_default = checkKeyType.bind(void 0, false);
    checkKeyTypeWithJwk = checkKeyType.bind(void 0, true);
    __name(validateCrit, "validateCrit");
    __name2(validateCrit, "validateCrit");
    validate_crit_default = validateCrit;
    validateAlgorithms = /* @__PURE__ */ __name2((option, algorithms) => {
      if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
        throw new TypeError(`"${option}" option must be an array of strings`);
      }
      if (!algorithms) {
        return void 0;
      }
      return new Set(algorithms);
    }, "validateAlgorithms");
    validate_algorithms_default = validateAlgorithms;
    __name(subtleDsa, "subtleDsa");
    __name2(subtleDsa, "subtleDsa");
    __name(getCryptoKey, "getCryptoKey");
    __name2(getCryptoKey, "getCryptoKey");
    verify = /* @__PURE__ */ __name2(async (alg, key, signature, data) => {
      const cryptoKey = await getCryptoKey(alg, key, "verify");
      check_key_length_default(alg, cryptoKey);
      const algorithm = subtleDsa(alg, cryptoKey.algorithm);
      try {
        return await webcrypto_default.subtle.verify(algorithm, cryptoKey, signature, data);
      } catch {
        return false;
      }
    }, "verify");
    verify_default = verify;
    __name(flattenedVerify, "flattenedVerify");
    __name2(flattenedVerify, "flattenedVerify");
    __name(compactVerify, "compactVerify");
    __name2(compactVerify, "compactVerify");
    epoch_default = /* @__PURE__ */ __name2((date) => Math.floor(date.getTime() / 1e3), "default");
    minute = 60;
    hour = minute * 60;
    day = hour * 24;
    week = day * 7;
    year = day * 365.25;
    REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
    secs_default = /* @__PURE__ */ __name2((str) => {
      const matched = REGEX.exec(str);
      if (!matched || matched[4] && matched[1]) {
        throw new TypeError("Invalid time period format");
      }
      const value = parseFloat(matched[2]);
      const unit = matched[3].toLowerCase();
      let numericDate;
      switch (unit) {
        case "sec":
        case "secs":
        case "second":
        case "seconds":
        case "s":
          numericDate = Math.round(value);
          break;
        case "minute":
        case "minutes":
        case "min":
        case "mins":
        case "m":
          numericDate = Math.round(value * minute);
          break;
        case "hour":
        case "hours":
        case "hr":
        case "hrs":
        case "h":
          numericDate = Math.round(value * hour);
          break;
        case "day":
        case "days":
        case "d":
          numericDate = Math.round(value * day);
          break;
        case "week":
        case "weeks":
        case "w":
          numericDate = Math.round(value * week);
          break;
        default:
          numericDate = Math.round(value * year);
          break;
      }
      if (matched[1] === "-" || matched[4] === "ago") {
        return -numericDate;
      }
      return numericDate;
    }, "default");
    normalizeTyp = /* @__PURE__ */ __name2((value) => value.toLowerCase().replace(/^application\//, ""), "normalizeTyp");
    checkAudiencePresence = /* @__PURE__ */ __name2((audPayload, audOption) => {
      if (typeof audPayload === "string") {
        return audOption.includes(audPayload);
      }
      if (Array.isArray(audPayload)) {
        return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
      }
      return false;
    }, "checkAudiencePresence");
    jwt_claims_set_default = /* @__PURE__ */ __name2((protectedHeader, encodedPayload, options = {}) => {
      let payload;
      try {
        payload = JSON.parse(decoder.decode(encodedPayload));
      } catch {
      }
      if (!isObject(payload)) {
        throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
      }
      const { typ } = options;
      if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
        throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
      }
      const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
      const presenceCheck = [...requiredClaims];
      if (maxTokenAge !== void 0)
        presenceCheck.push("iat");
      if (audience !== void 0)
        presenceCheck.push("aud");
      if (subject !== void 0)
        presenceCheck.push("sub");
      if (issuer !== void 0)
        presenceCheck.push("iss");
      for (const claim of new Set(presenceCheck.reverse())) {
        if (!(claim in payload)) {
          throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
        }
      }
      if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
        throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
      }
      if (subject && payload.sub !== subject) {
        throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
      }
      if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
        throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
      }
      let tolerance;
      switch (typeof options.clockTolerance) {
        case "string":
          tolerance = secs_default(options.clockTolerance);
          break;
        case "number":
          tolerance = options.clockTolerance;
          break;
        case "undefined":
          tolerance = 0;
          break;
        default:
          throw new TypeError("Invalid clockTolerance option type");
      }
      const { currentDate } = options;
      const now = epoch_default(currentDate || /* @__PURE__ */ new Date());
      if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
        throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
      }
      if (payload.nbf !== void 0) {
        if (typeof payload.nbf !== "number") {
          throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
        }
        if (payload.nbf > now + tolerance) {
          throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
        }
      }
      if (payload.exp !== void 0) {
        if (typeof payload.exp !== "number") {
          throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
        }
        if (payload.exp <= now - tolerance) {
          throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
        }
      }
      if (maxTokenAge) {
        const age = now - payload.iat;
        const max = typeof maxTokenAge === "number" ? maxTokenAge : secs_default(maxTokenAge);
        if (age - tolerance > max) {
          throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
        }
        if (age < 0 - tolerance) {
          throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
        }
      }
      return payload;
    }, "default");
    __name(jwtVerify, "jwtVerify");
    __name2(jwtVerify, "jwtVerify");
    sign = /* @__PURE__ */ __name2(async (alg, key, data) => {
      const cryptoKey = await getCryptoKey(alg, key, "sign");
      check_key_length_default(alg, cryptoKey);
      const signature = await webcrypto_default.subtle.sign(subtleDsa(alg, cryptoKey.algorithm), cryptoKey, data);
      return new Uint8Array(signature);
    }, "sign");
    sign_default = sign;
    FlattenedSign = class {
      static {
        __name(this, "FlattenedSign");
      }
      constructor(payload) {
        if (!(payload instanceof Uint8Array)) {
          throw new TypeError("payload must be an instance of Uint8Array");
        }
        this._payload = payload;
      }
      setProtectedHeader(protectedHeader) {
        if (this._protectedHeader) {
          throw new TypeError("setProtectedHeader can only be called once");
        }
        this._protectedHeader = protectedHeader;
        return this;
      }
      setUnprotectedHeader(unprotectedHeader) {
        if (this._unprotectedHeader) {
          throw new TypeError("setUnprotectedHeader can only be called once");
        }
        this._unprotectedHeader = unprotectedHeader;
        return this;
      }
      async sign(key, options) {
        if (!this._protectedHeader && !this._unprotectedHeader) {
          throw new JWSInvalid("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");
        }
        if (!is_disjoint_default(this._protectedHeader, this._unprotectedHeader)) {
          throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
        }
        const joseHeader = {
          ...this._protectedHeader,
          ...this._unprotectedHeader
        };
        const extensions = validate_crit_default(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, this._protectedHeader, joseHeader);
        let b64 = true;
        if (extensions.has("b64")) {
          b64 = this._protectedHeader.b64;
          if (typeof b64 !== "boolean") {
            throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
          }
        }
        const { alg } = joseHeader;
        if (typeof alg !== "string" || !alg) {
          throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
        }
        checkKeyTypeWithJwk(alg, key, "sign");
        let payload = this._payload;
        if (b64) {
          payload = encoder.encode(encode(payload));
        }
        let protectedHeader;
        if (this._protectedHeader) {
          protectedHeader = encoder.encode(encode(JSON.stringify(this._protectedHeader)));
        } else {
          protectedHeader = encoder.encode("");
        }
        const data = concat(protectedHeader, encoder.encode("."), payload);
        const signature = await sign_default(alg, key, data);
        const jws = {
          signature: encode(signature),
          payload: ""
        };
        if (b64) {
          jws.payload = decoder.decode(payload);
        }
        if (this._unprotectedHeader) {
          jws.header = this._unprotectedHeader;
        }
        if (this._protectedHeader) {
          jws.protected = decoder.decode(protectedHeader);
        }
        return jws;
      }
    };
    __name2(FlattenedSign, "FlattenedSign");
    CompactSign = class {
      static {
        __name(this, "CompactSign");
      }
      constructor(payload) {
        this._flattened = new FlattenedSign(payload);
      }
      setProtectedHeader(protectedHeader) {
        this._flattened.setProtectedHeader(protectedHeader);
        return this;
      }
      async sign(key, options) {
        const jws = await this._flattened.sign(key, options);
        if (jws.payload === void 0) {
          throw new TypeError("use the flattened module for creating JWS with b64: false");
        }
        return `${jws.protected}.${jws.payload}.${jws.signature}`;
      }
    };
    __name2(CompactSign, "CompactSign");
    __name(validateInput, "validateInput");
    __name2(validateInput, "validateInput");
    ProduceJWT = class {
      static {
        __name(this, "ProduceJWT");
      }
      constructor(payload = {}) {
        if (!isObject(payload)) {
          throw new TypeError("JWT Claims Set MUST be an object");
        }
        this._payload = payload;
      }
      setIssuer(issuer) {
        this._payload = { ...this._payload, iss: issuer };
        return this;
      }
      setSubject(subject) {
        this._payload = { ...this._payload, sub: subject };
        return this;
      }
      setAudience(audience) {
        this._payload = { ...this._payload, aud: audience };
        return this;
      }
      setJti(jwtId) {
        this._payload = { ...this._payload, jti: jwtId };
        return this;
      }
      setNotBefore(input) {
        if (typeof input === "number") {
          this._payload = { ...this._payload, nbf: validateInput("setNotBefore", input) };
        } else if (input instanceof Date) {
          this._payload = { ...this._payload, nbf: validateInput("setNotBefore", epoch_default(input)) };
        } else {
          this._payload = { ...this._payload, nbf: epoch_default(/* @__PURE__ */ new Date()) + secs_default(input) };
        }
        return this;
      }
      setExpirationTime(input) {
        if (typeof input === "number") {
          this._payload = { ...this._payload, exp: validateInput("setExpirationTime", input) };
        } else if (input instanceof Date) {
          this._payload = { ...this._payload, exp: validateInput("setExpirationTime", epoch_default(input)) };
        } else {
          this._payload = { ...this._payload, exp: epoch_default(/* @__PURE__ */ new Date()) + secs_default(input) };
        }
        return this;
      }
      setIssuedAt(input) {
        if (typeof input === "undefined") {
          this._payload = { ...this._payload, iat: epoch_default(/* @__PURE__ */ new Date()) };
        } else if (input instanceof Date) {
          this._payload = { ...this._payload, iat: validateInput("setIssuedAt", epoch_default(input)) };
        } else if (typeof input === "string") {
          this._payload = {
            ...this._payload,
            iat: validateInput("setIssuedAt", epoch_default(/* @__PURE__ */ new Date()) + secs_default(input))
          };
        } else {
          this._payload = { ...this._payload, iat: validateInput("setIssuedAt", input) };
        }
        return this;
      }
    };
    __name2(ProduceJWT, "ProduceJWT");
    SignJWT = class extends ProduceJWT {
      static {
        __name(this, "SignJWT");
      }
      setProtectedHeader(protectedHeader) {
        this._protectedHeader = protectedHeader;
        return this;
      }
      async sign(key, options) {
        const sig = new CompactSign(encoder.encode(JSON.stringify(this._payload)));
        sig.setProtectedHeader(this._protectedHeader);
        if (Array.isArray(this._protectedHeader?.crit) && this._protectedHeader.crit.includes("b64") && this._protectedHeader.b64 === false) {
          throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
        }
        return sig.sign(key, options);
      }
    };
    __name2(SignJWT, "SignJWT");
    cachedJwtSecret = null;
    __name(getJwtSecret, "getJwtSecret");
    __name2(getJwtSecret, "getJwtSecret");
    __name(getSecretKey, "getSecretKey");
    __name2(getSecretKey, "getSecretKey");
    __name(createSessionToken, "createSessionToken");
    __name2(createSessionToken, "createSessionToken");
    __name(verifySessionToken, "verifySessionToken");
    __name2(verifySessionToken, "verifySessionToken");
    __name(parseCookies, "parseCookies");
    __name2(parseCookies, "parseCookies");
    __name(getSessionCookie, "getSessionCookie");
    __name2(getSessionCookie, "getSessionCookie");
    __name(createSessionCookie, "createSessionCookie");
    __name2(createSessionCookie, "createSessionCookie");
    __name(createClearCookie, "createClearCookie");
    __name2(createClearCookie, "createClearCookie");
    __name(constantTimeEquals, "constantTimeEquals");
    __name2(constantTimeEquals, "constantTimeEquals");
    cachedPasswordConfigured = null;
    cachedAdminPassword = null;
    __name(invalidatePasswordCache, "invalidatePasswordCache");
    __name2(invalidatePasswordCache, "invalidatePasswordCache");
    __name(hasConfiguredPassword, "hasConfiguredPassword");
    __name2(hasConfiguredPassword, "hasConfiguredPassword");
    __name(getExpectedPassword, "getExpectedPassword");
    __name2(getExpectedPassword, "getExpectedPassword");
    __name(verifyPassword, "verifyPassword");
    __name2(verifyPassword, "verifyPassword");
    __name(setPassword, "setPassword");
    __name2(setPassword, "setPassword");
    MASCOT_SVG = `
<svg class="mascot-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="44" height="44">
  <!-- Ethereal Angelic Aura -->
  <circle cx="50" cy="50" r="46" fill="url(#blueknight-aura)" opacity="0.9"/>
  <circle cx="50" cy="50" r="44" stroke="#BAE6FD" stroke-width="2"/>
  
  <!-- Angelic Halo -->
  <ellipse cx="50" cy="18" rx="20" ry="5.5" stroke="#FDE047" stroke-width="2.5" fill="none" opacity="0.9"/>
  <ellipse cx="50" cy="18" rx="18" ry="4.5" stroke="#FFFFFF" stroke-width="1.2" fill="none" opacity="0.95"/>

  <!-- Back Hair (Platinum White & Ethereal Lilac) -->
  <path d="M24 45C24 28 35 20 50 20C65 20 76 28 76 45C76 60 74 72 70 78C64 74 62 60 62 60C62 60 58 64 50 64C42 64 38 60 38 60C38 60 36 74 30 78C26 72 24 60 24 45Z" fill="#F8FAFC"/>
  <path d="M20 50C16 62 18 76 22 82C24 76 26 66 26 58Z" fill="#E2E8F0"/>
  <path d="M80 50C84 62 82 76 78 82C76 76 74 66 74 58Z" fill="#E2E8F0"/>

  <!-- Chibi Face Skin -->
  <path d="M30 46C30 36 38 32 50 32C62 32 70 36 70 46C70 58 62 68 50 68C38 68 30 58 30 46Z" fill="#FFFBF5"/>
  
  <!-- Soft Sakura Blush -->
  <ellipse cx="36" cy="52" rx="4.5" ry="2.5" fill="#F472B6" opacity="0.6"/>
  <ellipse cx="64" cy="52" rx="4.5" ry="2.5" fill="#F472B6" opacity="0.6"/>

  <!-- Chibi Anime Eyes (Ethereal Sky Blue & Sapphire) -->
  <g class="anime-eyes">
    <ellipse cx="40" cy="46" rx="4.5" ry="6" fill="#0284C7"/>
    <ellipse cx="40" cy="46" rx="3.5" ry="5" fill="#0369A1"/>
    <circle cx="38.5" cy="43.5" r="1.8" fill="#FFFFFF"/>
    <circle cx="41.5" cy="48" r="0.9" fill="#FFFFFF"/>
    <path d="M35 40C37 38 43 38 45 40" stroke="#075985" stroke-width="1.6" stroke-linecap="round"/>
    
    <ellipse cx="60" cy="46" rx="4.5" ry="6" fill="#0284C7"/>
    <ellipse cx="60" cy="46" rx="3.5" ry="5" fill="#0369A1"/>
    <circle cx="58.5" cy="43.5" r="1.8" fill="#FFFFFF"/>
    <circle cx="61.5" cy="48" r="0.9" fill="#FFFFFF"/>
    <path d="M55 40C57 38 63 38 65 40" stroke="#075985" stroke-width="1.6" stroke-linecap="round"/>
  </g>

  <!-- Sweet Smile -->
  <path d="M47 54C48.5 56 51.5 56 53 54" stroke="#FB7185" stroke-width="1.4" stroke-linecap="round"/>

  <!-- Front Hair Bangs (Pure White with Gentle Soft-Sky Tips) -->
  <path d="M30 38C34 44 42 46 44 42C46 48 54 48 56 42C58 46 66 44 70 38C70 34 65 26 50 26C35 26 30 34 30 38Z" fill="#FFFFFF"/>
  <path d="M42 42C44 47 48 48 50 43C52 48 56 47 58 42" stroke="#BAE6FD" stroke-width="1.2"/>

  <!-- Angelic Crystal Hairpin -->
  <g transform="translate(62, 24)">
    <path d="M4 0L12 8L4 16L6 8Z" fill="#38BDF8"/>
    <circle cx="5" cy="8" r="3.5" fill="#FFFFFF"/>
    <circle cx="5" cy="8" r="2" fill="#38BDF8"/>
  </g>

  <defs>
    <linearGradient id="blueknight-aura" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="45%" stop-color="#E0F2FE"/>
      <stop offset="100%" stop-color="#EDE9FE"/>
    </linearGradient>
  </defs>
</svg>
`;
    BASE_STYLES = `@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=Nunito:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

/* ==========================================================================
   BLUEKNIGHT 10 DYNAMIC ADAPTIVE THEMES (LIGHT & DARK GLASS PALETTES)
   ========================================================================== */

:root, html[data-theme="theme-1"] {
  --theme-id: "theme-1";
  --theme-name: "Sakura Emerald";
  --theme-primary: #10B981;
  --theme-primary-hover: #059669;
  --theme-primary-soft: rgba(16, 185, 129, 0.12);
  --theme-primary-rgb: 16, 185, 129;
  --theme-secondary: #8B5CF6;
  --theme-accent: #F472B6;

  --theme-bg-image: url('/assets/theme-bg-1.jpg?v=${APP_CONFIG.version}');
  --theme-bg-overlay: rgba(15, 23, 42, 0.14);
  --theme-bg-fallback: #F1F5F9;

  --theme-surface: rgba(255, 255, 255, 0.84);
  --theme-surface-soft: rgba(255, 255, 255, 0.60);
  --theme-surface-strong: rgba(255, 255, 255, 0.95);

  --theme-border: rgba(255, 255, 255, 0.70);
  --theme-border-hover: rgba(16, 185, 129, 0.50);

  --theme-shadow: rgba(16, 185, 129, 0.12);
  --theme-glow: rgba(16, 185, 129, 0.28);

  --theme-text-primary: #0F172A;
  --theme-text-secondary: #334155;
  --theme-text-muted: #64748B;

  --theme-input-bg: rgba(255, 255, 255, 0.92);
  --theme-input-border: rgba(203, 213, 225, 0.85);

  --theme-btn-primary-bg: linear-gradient(135deg, #10B981 0%, #059669 100%);
  --theme-btn-primary-hover: linear-gradient(135deg, #059669 0%, #047857 100%);
  --theme-btn-primary-text: #FFFFFF;

  --theme-btn-secondary-bg: rgba(255, 255, 255, 0.85);
  --theme-btn-secondary-hover: #FFFFFF;
  --theme-btn-secondary-text: #0F172A;
  --theme-btn-secondary-border: rgba(203, 213, 225, 0.80);

  --theme-badge-bg: rgba(241, 245, 249, 0.85);
  --theme-badge-text: #334155;
}

html[data-theme="theme-2"] {
  --theme-id: "theme-2";
  --theme-name: "Royal Wine";
  --theme-primary: #F43F5E;
  --theme-primary-hover: #E11D48;
  --theme-primary-soft: rgba(244, 63, 94, 0.18);
  --theme-primary-rgb: 244, 63, 94;
  --theme-secondary: #9F1239;
  --theme-accent: #FB7185;

  --theme-bg-image: url('/assets/theme-bg-2.jpg?v=${APP_CONFIG.version}');
  --theme-bg-overlay: rgba(15, 6, 12, 0.48);
  --theme-bg-fallback: #16070E;

  --theme-surface: rgba(28, 12, 20, 0.82);
  --theme-surface-soft: rgba(255, 255, 255, 0.05);
  --theme-surface-strong: rgba(36, 16, 26, 0.94);

  --theme-border: rgba(255, 255, 255, 0.12);
  --theme-border-hover: rgba(244, 63, 94, 0.50);

  --theme-shadow: rgba(225, 29, 72, 0.28);
  --theme-glow: rgba(244, 63, 94, 0.35);

  --theme-text-primary: #FFF1F2;
  --theme-text-secondary: #FFE4E6;
  --theme-text-muted: #FDA4AF;

  --theme-input-bg: rgba(20, 8, 14, 0.85);
  --theme-input-border: rgba(255, 255, 255, 0.16);

  --theme-btn-primary-bg: linear-gradient(135deg, #F43F5E 0%, #E11D48 100%);
  --theme-btn-primary-hover: linear-gradient(135deg, #E11D48 0%, #BE123C 100%);
  --theme-btn-primary-text: #FFFFFF;

  --theme-btn-secondary-bg: rgba(255, 255, 255, 0.09);
  --theme-btn-secondary-hover: rgba(255, 255, 255, 0.16);
  --theme-btn-secondary-text: #FFF1F2;
  --theme-btn-secondary-border: rgba(255, 255, 255, 0.15);

  --theme-badge-bg: rgba(244, 63, 94, 0.18);
  --theme-badge-text: #FECDD3;
}

html[data-theme="theme-3"] {
  --theme-id: "theme-3";
  --theme-name: "Twilight Slate";
  --theme-primary: #38BDF8;
  --theme-primary-hover: #0EA5E9;
  --theme-primary-soft: rgba(56, 189, 248, 0.16);
  --theme-primary-rgb: 56, 189, 248;
  --theme-secondary: #6366F1;
  --theme-accent: #818CF8;

  --theme-bg-image: url('/assets/theme-bg-3.jpg?v=${APP_CONFIG.version}');
  --theme-bg-overlay: rgba(10, 14, 26, 0.44);
  --theme-bg-fallback: #0F172A;

  --theme-surface: rgba(18, 22, 36, 0.82);
  --theme-surface-soft: rgba(255, 255, 255, 0.05);
  --theme-surface-strong: rgba(24, 30, 48, 0.94);

  --theme-border: rgba(255, 255, 255, 0.12);
  --theme-border-hover: rgba(56, 189, 248, 0.50);

  --theme-shadow: rgba(56, 189, 248, 0.22);
  --theme-glow: rgba(56, 189, 248, 0.35);

  --theme-text-primary: #F8FAFC;
  --theme-text-secondary: #E2E8F0;
  --theme-text-muted: #94A3B8;

  --theme-input-bg: rgba(12, 16, 28, 0.85);
  --theme-input-border: rgba(255, 255, 255, 0.16);

  --theme-btn-primary-bg: linear-gradient(135deg, #38BDF8 0%, #0284C7 100%);
  --theme-btn-primary-hover: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
  --theme-btn-primary-text: #0F172A;

  --theme-btn-secondary-bg: rgba(255, 255, 255, 0.09);
  --theme-btn-secondary-hover: rgba(255, 255, 255, 0.16);
  --theme-btn-secondary-text: #F8FAFC;
  --theme-btn-secondary-border: rgba(255, 255, 255, 0.15);

  --theme-badge-bg: rgba(56, 189, 248, 0.16);
  --theme-badge-text: #BAE6FD;
}

html[data-theme="theme-4"] {
  --theme-id: "theme-4";
  --theme-name: "Arctic Glacier";
  --theme-primary: #0284C7;
  --theme-primary-hover: #0369A1;
  --theme-primary-soft: rgba(2, 132, 199, 0.12);
  --theme-primary-rgb: 2, 132, 199;
  --theme-secondary: #0EA5E9;
  --theme-accent: #38BDF8;

  --theme-bg-image: url('/assets/theme-bg-4.jpg?v=${APP_CONFIG.version}');
  --theme-bg-overlay: rgba(15, 23, 42, 0.10);
  --theme-bg-fallback: #F0F9FF;

  --theme-surface: rgba(255, 255, 255, 0.86);
  --theme-surface-soft: rgba(255, 255, 255, 0.60);
  --theme-surface-strong: rgba(255, 255, 255, 0.96);

  --theme-border: rgba(255, 255, 255, 0.70);
  --theme-border-hover: rgba(2, 132, 199, 0.50);

  --theme-shadow: rgba(2, 132, 199, 0.14);
  --theme-glow: rgba(2, 132, 199, 0.25);

  --theme-text-primary: #0F172A;
  --theme-text-secondary: #334155;
  --theme-text-muted: #64748B;

  --theme-input-bg: rgba(255, 255, 255, 0.92);
  --theme-input-border: rgba(203, 213, 225, 0.85);

  --theme-btn-primary-bg: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
  --theme-btn-primary-hover: linear-gradient(135deg, #0369A1 0%, #075985 100%);
  --theme-btn-primary-text: #FFFFFF;

  --theme-btn-secondary-bg: rgba(255, 255, 255, 0.85);
  --theme-btn-secondary-hover: #FFFFFF;
  --theme-btn-secondary-text: #0F172A;
  --theme-btn-secondary-border: rgba(203, 213, 225, 0.80);

  --theme-badge-bg: rgba(240, 249, 255, 0.90);
  --theme-badge-text: #0369A1;
}

html[data-theme="theme-5"] {
  --theme-id: "theme-5";
  --theme-name: "Solar Flare";
  --theme-primary: #F59E0B;
  --theme-primary-hover: #D97706;
  --theme-primary-soft: rgba(245, 158, 11, 0.18);
  --theme-primary-rgb: 245, 158, 11;
  --theme-secondary: #EA580C;
  --theme-accent: #FBBF24;

  --theme-bg-image: url('/assets/theme-bg-5.jpg?v=${APP_CONFIG.version}');
  --theme-bg-overlay: rgba(20, 8, 10, 0.46);
  --theme-bg-fallback: #1C0A0C;

  --theme-surface: rgba(28, 14, 16, 0.84);
  --theme-surface-soft: rgba(255, 255, 255, 0.05);
  --theme-surface-strong: rgba(36, 18, 20, 0.94);

  --theme-border: rgba(255, 255, 255, 0.12);
  --theme-border-hover: rgba(245, 158, 11, 0.50);

  --theme-shadow: rgba(245, 158, 11, 0.25);
  --theme-glow: rgba(245, 158, 11, 0.35);

  --theme-text-primary: #FFFBEB;
  --theme-text-secondary: #FEF3C7;
  --theme-text-muted: #FDE68A;

  --theme-input-bg: rgba(20, 10, 12, 0.85);
  --theme-input-border: rgba(255, 255, 255, 0.16);

  --theme-btn-primary-bg: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  --theme-btn-primary-hover: linear-gradient(135deg, #D97706 0%, #B45309 100%);
  --theme-btn-primary-text: #1E1B4B;

  --theme-btn-secondary-bg: rgba(255, 255, 255, 0.09);
  --theme-btn-secondary-hover: rgba(255, 255, 255, 0.16);
  --theme-btn-secondary-text: #FFFBEB;
  --theme-btn-secondary-border: rgba(255, 255, 255, 0.15);

  --theme-badge-bg: rgba(245, 158, 11, 0.18);
  --theme-badge-text: #FDE68A;
}

html[data-theme="theme-6"] {
  --theme-id: "theme-6";
  --theme-name: "Copper Rust";
  --theme-primary: #FB923C;
  --theme-primary-hover: #F97316;
  --theme-primary-soft: rgba(251, 146, 60, 0.18);
  --theme-primary-rgb: 251, 146, 60;
  --theme-secondary: #D97706;
  --theme-accent: #FDBA74;

  --theme-bg-image: url('/assets/theme-bg-6.jpg?v=${APP_CONFIG.version}');
  --theme-bg-overlay: rgba(16, 12, 12, 0.48);
  --theme-bg-fallback: #16100E;

  --theme-surface: rgba(26, 18, 18, 0.84);
  --theme-surface-soft: rgba(255, 255, 255, 0.05);
  --theme-surface-strong: rgba(34, 22, 22, 0.94);

  --theme-border: rgba(255, 255, 255, 0.12);
  --theme-border-hover: rgba(251, 146, 60, 0.50);

  --theme-shadow: rgba(234, 88, 12, 0.22);
  --theme-glow: rgba(251, 146, 60, 0.35);

  --theme-text-primary: #FAFAF9;
  --theme-text-secondary: #F5F5F4;
  --theme-text-muted: #D6D3D1;

  --theme-input-bg: rgba(18, 12, 12, 0.85);
  --theme-input-border: rgba(255, 255, 255, 0.16);

  --theme-btn-primary-bg: linear-gradient(135deg, #FB923C 0%, #EA580C 100%);
  --theme-btn-primary-hover: linear-gradient(135deg, #EA580C 0%, #C2410C 100%);
  --theme-btn-primary-text: #1C1917;

  --theme-btn-secondary-bg: rgba(255, 255, 255, 0.09);
  --theme-btn-secondary-hover: rgba(255, 255, 255, 0.16);
  --theme-btn-secondary-text: #FAFAF9;
  --theme-btn-secondary-border: rgba(255, 255, 255, 0.15);

  --theme-badge-bg: rgba(251, 146, 60, 0.18);
  --theme-badge-text: #FED7AA;
}

html[data-theme="theme-7"] {
  --theme-id: "theme-7";
  --theme-name: "Cyber Scarlet";
  --theme-primary: #EF4444;
  --theme-primary-hover: #DC2626;
  --theme-primary-soft: rgba(239, 68, 68, 0.18);
  --theme-primary-rgb: 239, 68, 68;
  --theme-secondary: #B91C1C;
  --theme-accent: #F87171;

  --theme-bg-image: url('/assets/theme-bg-7.jpg?v=${APP_CONFIG.version}');
  --theme-bg-overlay: rgba(18, 8, 10, 0.46);
  --theme-bg-fallback: #16080A;

  --theme-surface: rgba(28, 12, 16, 0.84);
  --theme-surface-soft: rgba(255, 255, 255, 0.05);
  --theme-surface-strong: rgba(36, 16, 20, 0.94);

  --theme-border: rgba(255, 255, 255, 0.12);
  --theme-border-hover: rgba(239, 68, 68, 0.50);

  --theme-shadow: rgba(239, 68, 68, 0.25);
  --theme-glow: rgba(239, 68, 68, 0.35);

  --theme-text-primary: #FFFFFF;
  --theme-text-secondary: #FEE2E2;
  --theme-text-muted: #FCA5A5;

  --theme-input-bg: rgba(20, 8, 10, 0.85);
  --theme-input-border: rgba(255, 255, 255, 0.16);

  --theme-btn-primary-bg: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  --theme-btn-primary-hover: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
  --theme-btn-primary-text: #FFFFFF;

  --theme-btn-secondary-bg: rgba(255, 255, 255, 0.09);
  --theme-btn-secondary-hover: rgba(255, 255, 255, 0.16);
  --theme-btn-secondary-text: #FFFFFF;
  --theme-btn-secondary-border: rgba(255, 255, 255, 0.15);

  --theme-badge-bg: rgba(239, 68, 68, 0.18);
  --theme-badge-text: #FECACA;
}

html[data-theme="theme-8"] {
  --theme-id: "theme-8";
  --theme-name: "Cobalt Breeze";
  --theme-primary: #2563EB;
  --theme-primary-hover: #1D4ED8;
  --theme-primary-soft: rgba(37, 99, 235, 0.12);
  --theme-primary-rgb: 37, 99, 235;
  --theme-secondary: #3B82F6;
  --theme-accent: #60A5FA;

  --theme-bg-image: url('/assets/theme-bg-8.jpg?v=${APP_CONFIG.version}');
  --theme-bg-overlay: rgba(15, 23, 42, 0.12);
  --theme-bg-fallback: #EFF6FF;

  --theme-surface: rgba(255, 255, 255, 0.86);
  --theme-surface-soft: rgba(255, 255, 255, 0.60);
  --theme-surface-strong: rgba(255, 255, 255, 0.96);

  --theme-border: rgba(255, 255, 255, 0.70);
  --theme-border-hover: rgba(37, 99, 235, 0.50);

  --theme-shadow: rgba(37, 99, 235, 0.15);
  --theme-glow: rgba(37, 99, 235, 0.25);

  --theme-text-primary: #0F172A;
  --theme-text-secondary: #1E293B;
  --theme-text-muted: #475569;

  --theme-input-bg: rgba(255, 255, 255, 0.92);
  --theme-input-border: rgba(203, 213, 225, 0.85);

  --theme-btn-primary-bg: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
  --theme-btn-primary-hover: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
  --theme-btn-primary-text: #FFFFFF;

  --theme-btn-secondary-bg: rgba(255, 255, 255, 0.85);
  --theme-btn-secondary-hover: #FFFFFF;
  --theme-btn-secondary-text: #0F172A;
  --theme-btn-secondary-border: rgba(203, 213, 225, 0.80);

  --theme-badge-bg: rgba(239, 246, 255, 0.90);
  --theme-badge-text: #1D4ED8;
}

html[data-theme="theme-9"] {
  --theme-id: "theme-9";
  --theme-name: "Sapphire Coast";
  --theme-primary: #0891B2;
  --theme-primary-hover: #0E7490;
  --theme-primary-soft: rgba(8, 145, 178, 0.12);
  --theme-primary-rgb: 8, 145, 178;
  --theme-secondary: #0284C7;
  --theme-accent: #06B6D4;

  --theme-bg-image: url('/assets/theme-bg-9.jpg?v=${APP_CONFIG.version}');
  --theme-bg-overlay: rgba(15, 23, 42, 0.14);
  --theme-bg-fallback: #ECFEFF;

  --theme-surface: rgba(255, 255, 255, 0.86);
  --theme-surface-soft: rgba(255, 255, 255, 0.60);
  --theme-surface-strong: rgba(255, 255, 255, 0.96);

  --theme-border: rgba(255, 255, 255, 0.70);
  --theme-border-hover: rgba(8, 145, 178, 0.50);

  --theme-shadow: rgba(8, 145, 178, 0.16);
  --theme-glow: rgba(8, 145, 178, 0.25);

  --theme-text-primary: #0F172A;
  --theme-text-secondary: #1E293B;
  --theme-text-muted: #475569;

  --theme-input-bg: rgba(255, 255, 255, 0.92);
  --theme-input-border: rgba(203, 213, 225, 0.85);

  --theme-btn-primary-bg: linear-gradient(135deg, #0891B2 0%, #0E7490 100%);
  --theme-btn-primary-hover: linear-gradient(135deg, #0E7490 0%, #155E75 100%);
  --theme-btn-primary-text: #FFFFFF;

  --theme-btn-secondary-bg: rgba(255, 255, 255, 0.85);
  --theme-btn-secondary-hover: #FFFFFF;
  --theme-btn-secondary-text: #0F172A;
  --theme-btn-secondary-border: rgba(203, 213, 225, 0.80);

  --theme-badge-bg: rgba(236, 254, 255, 0.90);
  --theme-badge-text: #0E7490;
}

html[data-theme="theme-10"] {
  --theme-id: "theme-10";
  --theme-name: "Obsidian Amethyst";
  --theme-primary: #A855F7;
  --theme-primary-hover: #9333EA;
  --theme-primary-soft: rgba(168, 85, 247, 0.18);
  --theme-primary-rgb: 168, 85, 247;
  --theme-secondary: #7E22CE;
  --theme-accent: #C084FC;

  --theme-bg-image: url('/assets/theme-bg-10.jpg?v=${APP_CONFIG.version}');
  --theme-bg-overlay: rgba(12, 8, 18, 0.48);
  --theme-bg-fallback: #11071A;

  --theme-surface: rgba(20, 14, 28, 0.84);
  --theme-surface-soft: rgba(255, 255, 255, 0.05);
  --theme-surface-strong: rgba(28, 18, 38, 0.94);

  --theme-border: rgba(255, 255, 255, 0.12);
  --theme-border-hover: rgba(168, 85, 247, 0.50);

  --theme-shadow: rgba(168, 85, 247, 0.25);
  --theme-glow: rgba(168, 85, 247, 0.35);

  --theme-text-primary: #FAF5FF;
  --theme-text-secondary: #F3E8FF;
  --theme-text-muted: #D8B4FE;

  --theme-input-bg: rgba(16, 10, 22, 0.85);
  --theme-input-border: rgba(255, 255, 255, 0.16);

  --theme-btn-primary-bg: linear-gradient(135deg, #A855F7 0%, #7E22CE 100%);
  --theme-btn-primary-hover: linear-gradient(135deg, #7E22CE 0%, #6B21A8 100%);
  --theme-btn-primary-text: #FFFFFF;

  --theme-btn-secondary-bg: rgba(255, 255, 255, 0.09);
  --theme-btn-secondary-hover: rgba(255, 255, 255, 0.16);
  --theme-btn-secondary-text: #FAF5FF;
  --theme-btn-secondary-border: rgba(255, 255, 255, 0.15);

  --theme-badge-bg: rgba(168, 85, 247, 0.18);
  --theme-badge-text: #E9D5FF;
}

/* ==========================================================================
   GLOBAL RESET & TYPOGRAPHY
   ========================================================================== */

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--theme-bg-fallback);
  background-image: var(--theme-bg-image);
  background-size: cover;
  background-position: center center;
  background-attachment: fixed;
  background-repeat: no-repeat;
  color: var(--theme-text-primary);
  font-family: 'Nunito', system-ui, -apple-system, sans-serif;
  font-size: 14.5px;
  line-height: 1.55;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* Subtle atmosphere overlay: keeps wallpaper vibrant while maintaining AAA text contrast */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background: var(--theme-bg-overlay);
  z-index: 0;
  pointer-events: none;
}

body > * {
  position: relative;
  z-index: 1;
}

h1, h2, h3, h4, .brand-title {
  font-family: 'Quicksand', system-ui, sans-serif;
  font-weight: 700;
  color: var(--theme-text-primary);
  line-height: 1.25;
}

a {
  color: var(--theme-primary);
  text-decoration: none;
  transition: all 0.2s ease;
}

a:hover {
  color: var(--theme-primary-hover);
}

/* ==========================================================================
   PERSISTENT FLOATING APPLICATION SHELL
   ========================================================================== */

.app-layout {
  --sidebar-w: 320px;
  /* A circle has constant curvature, so the sweep reads the whole way down.
     The old ellipse was 112px wide and 110vh tall: through the middle 70% of
     the height its edge moved barely 13px, which is a straight line to the eye,
     with all the bend crammed into the top and bottom caps.
     R = 240vh puts the bulge at 5.27vh (depth = R - sqrt(R^2 - (H/2)^2)). */
  --arc-r: 170vh;
  --arc-depth: 7.52vh;
  --arc-inset: 20px;
  display: flex;
  min-height: 100vh;
  width: 100%;
  position: relative;
  z-index: 1;
  background: transparent;
}

@media (max-width: 1024px) {
  .app-layout { --sidebar-w: 264px; --arc-r: 170vh; --arc-depth: 7.52vh; --arc-inset: 16px; }
}
/* Below 860px the arc moves onto the drawer itself -- see the .app-sidebar::before
   rule in the mobile block further down, which re-anchors this panel with
   position:absolute so it travels with the drawer's transform. */

/* The sidebar is flush to the viewport and full height. Its visible surface is
   the frosted ::before panel below; the element itself stays transparent so the
   arc can be masked out of the surface without touching the nav. */
.app-sidebar {
  width: var(--sidebar-w, 288px);
  min-width: var(--sidebar-w, 288px);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  margin: 0;
  background: transparent;
  border: 0;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  /* The cut reaches its deepest at mid-height, so rows stop short of it.
     Logical, not physical: the arc mirrors in RTL (see the [dir="rtl"] mask
     below), so the clearance has to mirror with it or RTL rows run into the
     cut while 100px sits empty on the flush edge. */
  padding-block: 22px 18px;
  padding-inline: 16px calc(var(--arc-depth) + var(--arc-inset) + 18px);
  z-index: 100;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

/* The sidebar's frosted surface. It is a pseudo-element rather than the
   sidebar's own background so the arc can be masked out of it without also
   masking the nav sitting on top.
   The mask is one circle: everything inside it is cut away, so the panel's
   trailing edge follows that circle -- receding to (sidebar-w - depth) at the
   middle of the viewport and returning to sidebar-w at top and bottom. Same
   curve as before; the difference is that what shows through the cut is the
   page wallpaper, not a flat theme colour. */
.app-sidebar::before {
  content: "";
  position: fixed;
  top: 0;
  bottom: 0;
  inset-inline-start: 0;
  width: var(--sidebar-w);
  z-index: -1;
  pointer-events: none;
  /* --theme-surface (0.84) not -strong (0.95): the original sidebar was glass,
     and at 95% the wallpaper stops reading through it. */
  background: var(--theme-surface);
  backdrop-filter: blur(17px);
  -webkit-backdrop-filter: blur(17px);
  -webkit-mask-image: radial-gradient(circle var(--arc-r) at
    calc(var(--sidebar-w) - var(--arc-depth) - var(--arc-inset) + var(--arc-r)) 50vh,
    transparent 99.8%, #000 99.9%);
  mask-image: radial-gradient(circle var(--arc-r) at
    calc(var(--sidebar-w) - var(--arc-depth) - var(--arc-inset) + var(--arc-r)) 50vh,
    transparent 99.8%, #000 99.9%);
}

/* Sidebar sits on the trailing edge in RTL, so the cut mirrors. */
[dir="rtl"] .app-sidebar::before {
  -webkit-mask-image: radial-gradient(circle var(--arc-r) at
    calc(var(--arc-depth) + var(--arc-inset) - var(--arc-r)) 50vh,
    transparent 99.8%, #000 99.9%);
  mask-image: radial-gradient(circle var(--arc-r) at
    calc(var(--arc-depth) + var(--arc-inset) - var(--arc-r)) 50vh,
    transparent 99.8%, #000 99.9%);
}

/* Brand lockup: mark in a tinted tile, wordmark and tagline stacked beside it. */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 2px 6px 16px 6px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--theme-border);
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: linear-gradient(145deg,
    rgba(var(--theme-primary-rgb), 0.22),
    rgba(var(--theme-primary-rgb), 0.10));
  border: 1px solid rgba(var(--theme-primary-rgb), 0.28);
  box-shadow: 0 4px 12px var(--theme-glow);
}
.brand-mark svg { width: 24px; height: 24px; display: block; }

.brand-tagline {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--theme-text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-top: 1px;
}

/* Small caption above a group of nav rows. */
.nav-section {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: var(--theme-text-muted);
  padding: 0 12px;
  margin: 14px 0 6px;
}
.nav-section:first-child { margin-top: 2px; }

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  flex: 1;
  padding-right: 2px;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}
.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--theme-border);
  border-radius: 4px;
}

/* Slim, comfortable navigation buttons */
/* Nav row: an icon tile plus a label, not a bare glyph beside text. */
.nav-btn {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  height: 46px;
  padding: 0 10px;
  border-radius: 14px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--theme-text-secondary);
  font-family: 'Quicksand', system-ui, sans-serif;
  font-weight: 700;
  font-size: 13.5px;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease, border-color 0.16s ease;
  text-decoration: none;
  box-sizing: border-box;
  position: relative;
}

/* A nav label is a single row at every width -- wrapping it to two lines
   inside a fixed 46px button clips the descenders. Narrow enough and it
   ellipsizes instead, which stays legible. */
.nav-btn > span:not(.nav-icon):not(.nav-tag) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

/* Trailing status pill on the external links. */
.nav-tag {
  flex-shrink: 0;
  margin-inline-start: auto;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--theme-primary);
  background: rgba(var(--theme-primary-rgb), 0.12);
  border: 1px solid rgba(var(--theme-primary-rgb), 0.18);
  border-radius: 999px;
  padding: 2px 7px;
}

/* Tinted from the theme accent, not the white-on-glass surface tokens: those
   were tuned to read against a photo, and the sidebar now sits on the flat
   shell colour where white-on-white would disappear. */
.nav-btn .nav-icon,
.nav-icon {
  font-size: 15px;
  line-height: 1;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  flex-shrink: 0;
  background: rgba(var(--theme-primary-rgb), 0.10);
  border: 1px solid rgba(var(--theme-primary-rgb), 0.16);
  transition: background 0.16s ease, border-color 0.16s ease;
}

/* Same reason: hairlines inside the sidebar need a colour with contrast on a
   light flat surface. */
.sidebar-brand { border-bottom-color: rgba(var(--theme-primary-rgb), 0.18); }
.sidebar-footer { border-top-color: rgba(var(--theme-primary-rgb), 0.18); }
.nav-btn:hover { background: rgba(var(--theme-primary-rgb), 0.07); }

/* No translateX: nudging the row on hover made the whole list feel loose. */
.nav-btn:hover {
  background: var(--theme-surface-soft);
  color: var(--theme-text-primary);
}
.nav-btn:hover .nav-icon {
  border-color: rgba(var(--theme-primary-rgb), 0.28);
}

.nav-btn.active {
  background: var(--theme-primary-soft) !important;
  color: var(--theme-primary) !important;
  border-color: rgba(var(--theme-primary-rgb), 0.22) !important;
}
/* A filled tile marks the active row. The old 3.5px inline-start border shifted
   the label sideways every time the selection moved. */
.nav-btn.active .nav-icon {
  background: var(--theme-primary) !important;
  border-color: var(--theme-primary) !important;
  box-shadow: 0 4px 12px var(--theme-glow);
}
.nav-btn.active::before {
  content: "";
  position: absolute;
  inset-inline-start: -14px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 22px;
  border-radius: 0 3px 3px 0;
  background: var(--theme-primary);
}

/* Sidebar bottom status & logout */
.sidebar-footer {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--theme-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Footer status card: dot, two-line label, trailing badge. */
.sidebar-status-pill {
  background: rgba(var(--theme-primary-rgb), 0.09);
  border: 1px solid rgba(var(--theme-primary-rgb), 0.20);
  border-radius: 14px;
  padding: 11px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.sidebar-status-pill .badge {
  font-size: 9.5px;
  padding: 2px 7px;
  flex-shrink: 0;
}

.sidebar-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--theme-primary);
  box-shadow: 0 0 8px var(--theme-primary);
  flex-shrink: 0;
}

/* Transparent main canvas - NO giant frosted container! */
/* The slab. Its inline-start corners are the curve; the overlay tint is layered
   into background-image rather than a pseudo-element so the radius clips it for
   free. No auto margins: content belongs beside the nav, not adrift in the
   middle of the viewport. */
.app-main {
  flex: 1;
  min-width: 0;
  padding: 30px 34px 44px 42px;
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  position: relative;
  z-index: 3;
  background: transparent;
}

/* Inner column: wide enough to use the space, capped so text lines do not run
   the full width of an ultrawide monitor. */
.app-main > * {
  max-width: 1500px;
}



/* ==========================================================================
   HEADER & TOP ACTION BAR
   ========================================================================== */

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--theme-surface);
  border: 1px solid var(--theme-border);
  border-radius: 16px;
  backdrop-filter: blur(17px);
  -webkit-backdrop-filter: blur(17px);
  box-shadow: 0 8px 24px -4px var(--theme-shadow);
  padding: 10px 18px;
  margin-bottom: 18px;
  gap: 12px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--theme-primary-soft);
  border: 1px solid var(--theme-border-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Theme selector pill */
.theme-pill-control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--theme-input-bg);
  border: 1px solid var(--theme-border);
  padding: 4px 10px;
  border-radius: 9999px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  /* The select sizes to its longest option ("Theme 10 -- Obsidian Amethyst"),
     which is wider than a 320px phone. Cap the pill and let the select shrink
     below min-content (see min-width: 0 below) so it ellipsizes instead. */
  max-width: 100%;
}

.theme-pill-control select {
  min-width: 0;
  text-overflow: ellipsis;
  border: none;
  background: transparent;
  font-family: 'Quicksand', system-ui, sans-serif;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--theme-text-primary);
  cursor: pointer;
  outline: none;
}

.theme-pill-control select option {
  background: #FFFFFF;
  color: #0F172A;
}

.theme-dice-btn {
  border: none;
  background: var(--theme-primary-soft);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  transition: transform 0.2s ease;
}

.theme-dice-btn:hover {
  transform: rotate(45deg);
}

/* Mobile toggle button */
.mobile-nav-toggle {
  display: none;
  background: var(--theme-surface);
  border: 1px solid var(--theme-border);
  color: var(--theme-text-primary);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
}

/* ==========================================================================
   CARD SYSTEM & GRIDS (BALANCED, COMPACT, CONTENT-DRIVEN)
   ========================================================================== */

.card {
  background: var(--theme-surface);
  border: 1px solid var(--theme-border);
  border-radius: 16px;
  box-shadow: 0 10px 30px -4px var(--theme-shadow), 0 2px 6px rgba(0,0,0,0.04);
  padding: 16px 18px;
  backdrop-filter: blur(17px);
  -webkit-backdrop-filter: blur(17px);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  box-sizing: border-box;
}

.card:hover {
  border-color: var(--theme-border-hover);
  box-shadow: 0 14px 36px -4px var(--theme-shadow), 0 0 16px var(--theme-glow);
}

.card-primary {
  border-radius: 18px;
  padding: 20px 22px;
  border-top: 3.5px solid var(--theme-primary);
}

.card-title {
  font-size: 15.5px;
  font-weight: 700;
  color: var(--theme-text-primary);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-desc {
  font-size: 12px;
  color: var(--theme-text-muted);
  line-height: 1.45;
  margin-bottom: 14px;
}

/* Responsive Grid layouts */
.grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.grid-3col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.grid-main-right {
  display: grid;
  grid-template-columns: 2.3fr 1fr;
  gap: 16px;
}

/* Quick Action Tiles */
.quick-action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.action-tile {
  background: var(--theme-surface-strong);
  border: 1px solid var(--theme-border);
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  color: var(--theme-text-primary);
}

.action-tile:hover {
  border-color: var(--theme-primary);
  background: var(--theme-primary-soft);
  color: var(--theme-primary);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px var(--theme-glow);
}

.action-tile-icon {
  font-size: 20px;
  line-height: 1;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--theme-primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-tile-text h4 {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

.action-tile-text p {
  font-size: 11px;
  color: var(--theme-text-muted);
  margin-top: 2px;
}

/* ==========================================================================
   COMPACT SETTING ROWS & FORM CONTROLS
   ========================================================================== */

.setting-group {
  display: flex;
  flex-direction: column;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--theme-border);
  gap: 14px;
}

.setting-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-row:first-child {
  padding-top: 0;
}

.setting-label-col {
  flex: 1;
  min-width: 0;
}

.setting-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--theme-text-primary);
  margin-bottom: 2px;
  font-family: 'Quicksand', system-ui, sans-serif;
}

.setting-subtitle {
  font-size: 11.5px;
  color: var(--theme-text-muted);
  line-height: 1.35;
}

.setting-control-col {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Form Groups & Inputs */
.form-group {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  font-family: 'Quicksand', system-ui, sans-serif;
  font-weight: 700;
  font-size: 12.5px;
  color: var(--theme-text-primary);
  margin-bottom: 5px;
}

.form-control {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1.5px solid var(--theme-input-border);
  background: var(--theme-input-bg);
  color: var(--theme-text-primary);
  font-family: 'Nunito', system-ui, sans-serif;
  font-size: 13.5px;
  transition: all 0.18s ease;
  outline: none;
  box-sizing: border-box;
}

.form-control:focus {
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 3px var(--theme-glow);
}

.form-control.code-input {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

textarea.form-control {
  height: auto;
  min-height: 72px;
  padding: 8px 12px;
  resize: vertical;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: 'Quicksand', system-ui, sans-serif;
  font-weight: 700;
  font-size: 13.5px;
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.18s ease;
  text-decoration: none;
  box-sizing: border-box;
  white-space: nowrap;
}

.btn-primary {
  background: var(--theme-btn-primary-bg);
  color: var(--theme-btn-primary-text);
  box-shadow: 0 4px 14px var(--theme-glow);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px var(--theme-glow);
  color: var(--theme-btn-primary-text);
}

.btn-secondary {
  background: var(--theme-btn-secondary-bg);
  color: var(--theme-btn-secondary-text);
  border: 1px solid var(--theme-btn-secondary-border);
}

.btn-secondary:hover {
  background: var(--theme-btn-secondary-hover);
  border-color: var(--theme-primary);
  color: var(--theme-primary);
  transform: translateY(-1px);
}

.btn-sm {
  height: 30px;
  padding: 0 10px;
  font-size: 12px;
  border-radius: 8px;
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 700;
  font-family: 'Quicksand', system-ui, sans-serif;
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.badge-mint {
  background: rgba(16, 185, 129, 0.15);
  color: #10B981;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.badge-lavender {
  background: rgba(139, 92, 246, 0.15);
  color: #8B5CF6;
  border: 1px solid rgba(139, 92, 246, 0.35);
}

.badge-sky {
  background: rgba(2, 132, 199, 0.15);
  color: #0284C7;
  border: 1px solid rgba(2, 132, 199, 0.35);
}

.badge-sakura {
  background: rgba(244, 63, 94, 0.15);
  color: #F43F5E;
  border: 1px solid rgba(244, 63, 94, 0.35);
}

.badge-amber {
  background: rgba(245, 158, 11, 0.15);
  color: #F59E0B;
  border: 1px solid rgba(245, 158, 11, 0.35);
}

/* Copy wrapper */
.copy-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.copy-wrapper input {
  flex: 1;
  min-width: 0;
}

.copy-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* Tab pane animation */
.tab-pane {
  display: none;
}

.tab-pane.active {
  display: block;
  animation: fadeInTab 0.2s ease forwards;
}

@keyframes fadeInTab {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Toast */
.toast-msg {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 18px;
  background: var(--theme-surface-strong);
  color: var(--theme-text-primary);
  border-radius: 9999px;
  font-family: 'Quicksand', system-ui, sans-serif;
  font-weight: 700;
  font-size: 13px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.25);
  transform: translateY(80px);
  opacity: 0;
  transition: all 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--theme-border);
}

.toast-msg.show {
  transform: translateY(0);
  opacity: 1;
}

/* Modal */
.modal-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(10, 15, 26, 0.65);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 1500;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-backdrop.show {
  display: flex !important;
}

.modal-card {
  background: var(--theme-surface-strong);
  border: 1px solid var(--theme-border);
  border-radius: 18px;
  padding: 20px;
  max-width: 380px;
  width: 100%;
  box-shadow: 0 20px 48px var(--theme-shadow);
  box-sizing: border-box;
}

/* Mobile drawer backdrop */
.drawer-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(10, 15, 26, 0.50);
  z-index: 90;
  opacity: 0;
  transition: opacity 0.25s ease;
}

/* ==========================================================================
   RESPONSIVE BREAKPOINTS
   ========================================================================== */

@media (max-width: 1024px) {
  .app-sidebar {
    padding-inline-end: calc(var(--arc-depth) + var(--arc-inset) + 14px);
  }
  .grid-main-right {
    grid-template-columns: 1fr !important;
  }
  .grid-3col {
    grid-template-columns: 1fr 1fr !important;
  }
}

@media (max-width: 860px) {
  .app-layout {
    flex-direction: column !important;
    /* z-index:1 here (and from the "body > *" rule) made .app-layout a
       stacking context,
       which trapped the drawer's z-index:1000 inside it. The backdrop is a root
       sibling at z-index:90, so 90 beat the whole subtree and the backdrop
       painted over the open drawer -- every tap on a nav row hit the backdrop
       and closed the drawer instead of navigating.
       z-index:auto keeps the position:relative but creates no context, so the
       drawer (1000) sits above the backdrop (90) and .app-main (3) below it,
       which is what the dimming wanted in the first place. */
    z-index: auto !important;
  }
  .mobile-nav-toggle {
    display: flex !important;
  }
  .app-sidebar {
    position: fixed !important;
    top: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    margin: 0 !important;
    height: 100vh !important;
    width: min(80vw, 280px) !important;
    /* width alone loses to the desktop min-width, so reset that too. */
    min-width: 0 !important;
    transform: translateX(-100%) !important;
    z-index: 1000 !important;
    /* Surface and radius live on ::before so the arc can be masked out of them
       without also masking the nav. Keep the element itself transparent. */
    background: transparent !important;
    /* A shallower arc than desktop. Same circle, larger radius:
       depth = R - sqrt(R^2 - (H/2)^2), so R=280vh gives 4.5vh instead of the
       7.52vh a 170vh radius would. The desktop cut is 21% of a 320px sidebar;
       at 7.52vh it would take 22% of a 280px drawer but out of far less
       absolute room, which pushed "API Health" onto two lines. */
    --arc-r: 280vh;
    --arc-depth: 4.5vh;
    --arc-inset: 12px;
    padding-inline-end: calc(var(--arc-depth) + var(--arc-inset) + 12px) !important;
  }

  /* The arc, on the drawer. The desktop ::before is position:fixed to the
     viewport edge, so it cannot travel with a translateX drawer -- that is why
     it used to be display:none here. Anchored to the drawer with
     position:absolute instead, it moves with the transform and keeps the arc.
     The mask circle is measured from 100% (the panel's own trailing edge)
     rather than --sidebar-w, because the drawer is min(80vw,280px) wide.
     50vh, not 50%, centres it on the viewport -- same reason as desktop. */
  .app-sidebar::before {
    display: block;
    position: absolute;
    inset: 0;
    width: auto;
    border-radius: 0 18px 18px 0;
    /* -strong (0.95), not -surface (0.84): on desktop the glass sits over
       wallpaper, but a drawer sits over text, which reads through at 0.84. */
    background: var(--theme-surface-strong);
    -webkit-mask-image: radial-gradient(circle var(--arc-r) at
      calc(100% - var(--arc-depth) - var(--arc-inset) + var(--arc-r)) 50vh,
      transparent 99.8%, #000 99.9%);
    mask-image: radial-gradient(circle var(--arc-r) at
      calc(100% - var(--arc-depth) - var(--arc-inset) + var(--arc-r)) 50vh,
      transparent 99.8%, #000 99.9%);
  }

  /* Mirrored drawer: the arc cuts the left edge, so the circle sits on that side. */
  [dir="rtl"] .app-sidebar::before {
    border-radius: 18px 0 0 18px;
    -webkit-mask-image: radial-gradient(circle var(--arc-r) at
      calc(var(--arc-depth) + var(--arc-inset) - var(--arc-r)) 50vh,
      transparent 99.8%, #000 99.9%);
    mask-image: radial-gradient(circle var(--arc-r) at
      calc(var(--arc-depth) + var(--arc-inset) - var(--arc-r)) 50vh,
      transparent 99.8%, #000 99.9%);
  }
  .app-sidebar.open {
    transform: translateX(0) !important;
  }
  .drawer-backdrop.show {
    display: block !important;
    opacity: 1 !important;
  }
  .app-main {
    padding: 12px 14px 28px 14px !important;
  }
  .grid-2col {
    grid-template-columns: 1fr !important;
  }
  .grid-3col {
    grid-template-columns: 1fr !important;
  }
  .header-right {
    width: 100%;
    justify-content: flex-start;
  }
  /* Touch targets: the theme select was an 18px-tall strip and the dice a
     24px circle, both well under a finger. */
  .theme-pill-control { padding: 5px 12px; }
  .theme-pill-control select { min-height: 34px; font-size: 13.5px; }
  .theme-dice-btn { width: 34px; height: 34px; font-size: 15px; }
}

@media (max-width: 480px) {
  .setting-row {
    flex-direction: column !important;
    align-items: flex-start !important;
  }
  .setting-control-col {
    width: 100%;
    justify-content: flex-start;
    margin-top: 6px;
  }
  .copy-wrapper {
    flex-direction: column !important;
    align-items: stretch !important;
  }
  .copy-actions {
    width: 100%;
    margin-top: 6px;
  }
  .copy-actions button, .copy-actions a {
    flex: 1;
    justify-content: center;
  }
}

/* RTL Support */
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

/* No [dir="rtl"] .app-sidebar margin/radius rule here: it survived from the
   old floating-card sidebar and was never scoped to a breakpoint. On desktop
   it shifted the nav 16px off the flush ::before glass panel and pushed the
   sidebar 16px past the bottom of the viewport; on mobile it did the same to
   the drawer. The sidebar is flush in both directions now, and the drawer's
   inner radius is set in the mobile block below. */

@media (max-width: 860px) {
  [dir="rtl"] .app-sidebar {
    left: auto !important;
    right: 0 !important;
    border-radius: 18px 0 0 18px !important;
    transform: translateX(100%) !important;
  }
  [dir="rtl"] .app-sidebar.open {
    transform: translateX(0) !important;
  }
}

[dir="rtl"] .nav-btn:hover {
  transform: translateX(-2px) !important;
}

[dir="rtl"] .toast-msg {
  right: auto !important;
  left: 20px !important;
}

/* ===================================================================
   Polish pass — refinements to the existing layout. No structural
   changes; every value is a theme token so all ten themes still work.
   =================================================================== */

/* Card headings get a tinted icon tile, so every tab reads as one system. */
.card-title > span:first-child {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: inline-grid;
  place-items: center;
  background: rgba(var(--theme-primary-rgb), 0.12);
  border: 1px solid rgba(var(--theme-primary-rgb), 0.16);
  font-size: 15px;
  line-height: 1;
  flex-shrink: 0;
}

/* Softer corners and a lighter, better-layered shadow. */
.card {
  border-radius: 18px;
  box-shadow: 0 8px 26px -8px var(--theme-shadow), 0 1px 3px rgba(0,0,0,0.03);
}
.card:hover { transform: translateY(-1px); }
.card-primary { border-radius: 20px; }

/* The four read-only info boxes on the overview. */
.card-primary .form-label { letter-spacing: 0.01em; }

/* Action tiles: give the icon the same tile treatment and a calmer hover. */
.action-tile-icon {
  border: 1px solid rgba(var(--theme-primary-rgb), 0.16);
  border-radius: 10px;
}
.action-tile:hover { box-shadow: 0 8px 20px -6px var(--theme-glow); }

/* Tables: readable rows with a hover cue. */
table tbody tr { transition: background 0.15s ease; }
table tbody tr:hover { background: rgba(var(--theme-primary-rgb), 0.05); }
table thead th {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
}

/* Inputs: clearer focus ring. */
.form-control:focus {
  outline: none;
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 3px rgba(var(--theme-primary-rgb), 0.16);
}

/* Keyboard focus must stay visible for everything interactive. */
a:focus-visible,
button:focus-visible,
select:focus-visible,
input:focus-visible,
textarea:focus-visible,
.action-tile:focus-visible,
.nav-btn:focus-visible {
  outline: 2px solid var(--theme-primary);
  outline-offset: 2px;
  border-radius: 8px;
}

/* Badges: slightly tighter, more legible. */
.badge {
  letter-spacing: 0.01em;
  border-radius: 999px;
}

/* Scrollbars that match the theme instead of the OS default. */
* { scrollbar-width: thin; scrollbar-color: var(--theme-border-hover) transparent; }
*::-webkit-scrollbar { width: 9px; height: 9px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb {
  background: var(--theme-border-hover);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: content-box;
}
*::-webkit-scrollbar-thumb:hover { background-color: var(--theme-primary); }

/* Respect users who ask for less motion. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .card:hover, .action-tile:hover { transform: none; }
}

/* ===================================================================
   Content-area styling to match the sidebar: tiles instead of bare
   glyphs, quieter field labels, softer controls.
   =================================================================== */

/* Action tiles read as cards, with the same icon-tile treatment as the nav. */
.action-tile {
  border-radius: 16px;
  padding: 13px 14px;
  gap: 12px;
}
.action-tile-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  font-size: 19px;
  background: rgba(var(--theme-primary-rgb), 0.12);
  border: 1px solid rgba(var(--theme-primary-rgb), 0.18);
}
.action-tile:hover .action-tile-icon {
  background: rgba(var(--theme-primary-rgb), 0.20);
  border-color: rgba(var(--theme-primary-rgb), 0.34);
}

/* Field labels sit back so the values lead, as in the reference. */
.form-label {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--theme-text-secondary);
  margin-bottom: 6px;
}

/* Controls share the card corner radius rather than being noticeably squarer. */
.btn {
  border-radius: 12px;
  height: 40px;
}
.btn-sm { border-radius: 10px; }
.form-control { border-radius: 12px; }

/* Card heading: tile, title, and a badge pushed to the trailing edge. */
.card-title {
  font-size: 14.5px;
  gap: 10px;
  margin-bottom: 6px;
}
.card-desc { font-size: 12.5px; }

/* A card's own section divider, for the longer settings tabs. */
.card-divider {
  height: 1px;
  background: var(--theme-border);
  margin: 16px -20px;
}

/* Read-only value boxes on the overview. */
.card-primary code,
.code-input {
  letter-spacing: 0.01em;
}

@media (max-width: 1024px) {
  .quick-action-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
}`;
    __name(renderPageLayout, "renderPageLayout");
    __name2(renderPageLayout, "renderPageLayout");
    __name(renderLoginPage, "renderLoginPage");
    __name2(renderLoginPage, "renderLoginPage");
    __name(renderSetupPage, "renderSetupPage");
    __name2(renderSetupPage, "renderSetupPage");
    __name(handleSetup, "handleSetup");
    __name2(handleSetup, "handleSetup");
    __name(handleLogin, "handleLogin");
    __name2(handleLogin, "handleLogin");
    __name(handleLogout, "handleLogout");
    __name2(handleLogout, "handleLogout");
    __name(renderDashboardPage, "renderDashboardPage");
    __name2(renderDashboardPage, "renderDashboardPage");
    P = (1n << 255n) - 19n;
    A24 = 121665n;
    __name(x25519, "x25519");
    __name2(x25519, "x25519");
    __name(bytesToBase64, "bytesToBase64");
    __name2(bytesToBase64, "bytesToBase64");
    __name(generateWireGuardKeyPair, "generateWireGuardKeyPair");
    __name2(generateWireGuardKeyPair, "generateWireGuardKeyPair");
    __name(parseReservedBytes, "parseReservedBytes");
    __name2(parseReservedBytes, "parseReservedBytes");
    __name(registerWarpAccount, "registerWarpAccount");
    __name2(registerWarpAccount, "registerWarpAccount");
    __name(generateRandomToken2, "generateRandomToken2");
    __name2(generateRandomToken2, "generateRandomToken");
    __name(handlePanel, "handlePanel");
    __name2(handlePanel, "handlePanel");
    __name(authorizeSubscription, "authorizeSubscription");
    __name2(authorizeSubscription, "authorizeSubscription");
    __name(buildClashChainProxy, "buildClashChainProxy");
    __name2(buildClashChainProxy, "buildClashChainProxy");
    __name(buildSingboxChainOutbound, "buildSingboxChainOutbound");
    __name2(buildSingboxChainOutbound, "buildSingboxChainOutbound");
    __name(generateOpenVpnProfile, "generateOpenVpnProfile");
    __name2(generateOpenVpnProfile, "generateOpenVpnProfile");
    __name(handleXhttpProxy, "handleXhttpProxy");
    __name2(handleXhttpProxy, "handleXhttpProxy");
    __name(handleSubscription, "handleSubscription");
    __name2(handleSubscription, "handleSubscription");
    connectImpl = null;
    __name(getConnect, "getConnect");
    __name2(getConnect, "getConnect");
    __name(bytesToUuid, "bytesToUuid");
    __name2(bytesToUuid, "bytesToUuid");
    __name(parseVlessHeader, "parseVlessHeader");
    __name2(parseVlessHeader, "parseVlessHeader");
    __name(createVlessResponseHeader, "createVlessResponseHeader");
    __name2(createVlessResponseHeader, "createVlessResponseHeader");
    __name(sha224Hex, "sha224Hex");
    __name2(sha224Hex, "sha224Hex");
    __name(isTrojanPacket, "isTrojanPacket");
    __name2(isTrojanPacket, "isTrojanPacket");
    __name(parseTrojanHeader, "parseTrojanHeader");
    __name2(parseTrojanHeader, "parseTrojanHeader");
    __name(toUint8Array, "toUint8Array");
    __name2(toUint8Array, "toUint8Array");
    __name(decodeBase64Url, "decodeBase64Url");
    __name2(decodeBase64Url, "decodeBase64Url");
    __name(extractEarlyData, "extractEarlyData");
    __name2(extractEarlyData, "extractEarlyData");
    __name(handleWebSocketProxy, "handleWebSocketProxy");
    __name2(handleWebSocketProxy, "handleWebSocketProxy");
    __name(dialHttpChain, "dialHttpChain");
    __name2(dialHttpChain, "dialHttpChain");
    __name(dialSocks5Chain, "dialSocks5Chain");
    __name2(dialSocks5Chain, "dialSocks5Chain");
    __name(establishOutboundSocket, "establishOutboundSocket");
    __name2(establishOutboundSocket, "establishOutboundSocket");
    __name(handleProxySession, "handleProxySession");
    __name2(handleProxySession, "handleProxySession");
    __name(pipeRemoteToWebSocket, "pipeRemoteToWebSocket");
    __name2(pipeRemoteToWebSocket, "pipeRemoteToWebSocket");
    __name(handleDnsQuery, "handleDnsQuery");
    __name2(handleDnsQuery, "handleDnsQuery");
    __name(handleDnsJson, "handleDnsJson");
    __name2(handleDnsJson, "handleDnsJson");
    __name(authorizeShareRequest, "authorizeShareRequest");
    __name2(authorizeShareRequest, "authorizeShareRequest");
    __name(handleNodeExport, "handleNodeExport");
    __name2(handleNodeExport, "handleNodeExport");
    __name(handleNodeImport, "handleNodeImport");
    __name2(handleNodeImport, "handleNodeImport");
    THEME_BG_DATA_URIS = {};
    src_default = {
      async fetch(request, env2, ctx) {
        return withSecurityHeaders(await handleFetch(request, env2, ctx));
      }
    };
    async function handleFetch(request, env2, ctx) {
        const url = new URL(request.url);
        const pathname = url.pathname.replace(/\/+$/, "") || "/";
        const upgrade = request.headers.get("Upgrade");
        try {
          const settings = await getOrInitSettings(env2);
          const configuredPath = settings.proxyPath.replace(/\/+$/, "") || "/wd-ws";
          const xhttpConfiguredPath = (settings.xhttpPath || "/bk-xhttp").replace(/\/+$/, "") || "/bk-xhttp";
          if (env2.DISABLE_PROXY === "true" && (upgrade || pathname === configuredPath || pathname === xhttpConfiguredPath || ["/bk-ws", "/wd-ws", "/bk-xhttp", "/wd-xhttp"].includes(pathname))) return Response.json({ error: "This adapter supports the panel, DNS and subscriptions only; use a tunnel host for proxy traffic." }, { status: 501 });
          if (request.method === "POST" && (pathname === xhttpConfiguredPath || pathname === "/bk-xhttp" || pathname === "/wd-xhttp")) {
            if (!settings.xhttpEnabled) return new Response("HTTP streaming disabled", { status: 404 });
            return await handleXhttpProxy(request, env2, ctx);
          }
          if (upgrade && (upgrade.toLowerCase() === "websocket" || upgrade.toLowerCase() === "httpupgrade" || upgrade.toLowerCase() === "tcp")) {
            const isMatchedWs = pathname === configuredPath || pathname === `${configuredPath}/vless` || pathname === `${configuredPath}/trojan` || pathname === `${configuredPath}/ss` || pathname === "/bk-ws" || pathname === "/wd-ws" || pathname === "/wd-ws/vless" || pathname === "/wd-ws/trojan" || pathname === "/bk-ws" || pathname === "/bk-ws/vless" || pathname === "/bk-ws/trojan" || pathname === "/bk-upgrade" || pathname === "/wd-upgrade" || pathname === xhttpConfiguredPath;
            if (isMatchedWs) {
              return await handleWebSocketProxy(request, env2, ctx);
            } else {
              return new Response(
                JSON.stringify(
                  {
                    error: "Invalid WebSocket Path",
                    message: `WebSocket connection requested on path '${pathname}', but BlueKnight proxy is configured on '${configuredPath}'.`,
                    configuredPath
                  },
                  null,
                  2
                ),
                {
                  status: 404,
                  headers: { "Content-Type": "application/json; charset=utf-8" }
                }
              );
            }
          }
          if (pathname === "/dns-query") {
            return await handleDnsQuery(request, env2);
          }
          if (pathname === "/dns-json") {
            return await handleDnsJson(request, env2);
          }
          if (pathname === "/api/node/export") {
            return await handleNodeExport(request, env2);
          }
          if (pathname === "/api/node/import" && request.method === "POST") {
            return await handleNodeImport(request, env2);
          }
          const themeMatch = pathname.match(/^\/(?:assets\/)?theme-bg(?:-([1-9]|10))?\.jpg$/);
          if (pathname.startsWith("/assets/")) {
            if (env2.ASSETS) {
              return env2.ASSETS.fetch(request);
            }
            // No static-asset binding: this is a single-file Workers deploy
            // (dashboard paste, or `wrangler deploy` without [assets]). Serve
            // the wallpapers baked into this bundle so the themes still render
            // instead of falling back to a flat colour. Populated by
            // `npm run build:standalone`; empty in the repo copy so the source
            // file stays reviewable.
            const embedded = THEME_BG_DATA_URIS[pathname.slice("/assets/".length)];
            if (embedded) {
              const comma = embedded.indexOf(",");
              const meta = embedded.slice(5, comma);
              const bytes = decodeBase64(embedded.slice(comma + 1));
              return new Response(bytes, {
                headers: {
                  "Content-Type": meta.replace(";base64", "") || "image/jpeg",
                  "Cache-Control": "public, max-age=31536000, immutable"
                }
              });
            }
            return new Response("Asset not found", { status: 404 });
          }
          if (pathname === "/") {
            return Response.redirect(`${url.origin}/panel/login`, 302);
          }
          if (pathname === "/api/health") {
            return handleHealth(request, env2);
          }
          if (pathname === "/api/proxy-debug") {
            return await handleProxyDebug(request, env2);
          }
          if (pathname === "/panel/setup") {
            return await handleSetup(request, env2);
          }
          if (pathname === "/panel/login") {
            return await handleLogin(request, env2);
          }
          if (pathname === "/panel/logout") {
            return handleLogout(request);
          }
          if (pathname === "/panel" || pathname.startsWith("/panel/settings")) {
            return await handlePanel(request, env2);
          }
          if (pathname.startsWith("/sub/")) {
            return await handleSubscription(pathname, request, env2);
          }
          return new Response(
            JSON.stringify(
              {
                error: "Not Found",
                message: "The requested BlueKnight endpoint does not exist.",
                path: pathname
              },
              null,
              2
            ),
            {
              status: 404,
              headers: { "Content-Type": "application/json; charset=utf-8" }
            }
          );
        } catch (err) {
          console.error("BlueKnight Worker Exception:", err);
          return new Response(
            JSON.stringify(
              {
                error: "Internal Server Error",
                message: err.message || "An unexpected error occurred in BlueKnight Worker."
              },
              null,
              2
            ),
            {
              status: 500,
              headers: { "Content-Type": "application/json; charset=utf-8" }
            }
          );
        }
    }
  }
});

// [[path]].js
async function onRequest(context2) {
  const { request, env: env2, waitUntil } = context2;
  return await src_default.fetch(request, env2, { waitUntil: waitUntil.bind(context2) });
}
var init_path = __esm({
  "[[path]].js"() {
    init_functionsRoutes_0_6698010974737841();
    init_worker();
    __name(onRequest, "onRequest");
  }
});

// ../.wrangler/tmp/pages-3cFsSW/functionsRoutes-0.6698010974737841.mjs
var routes;
var init_functionsRoutes_0_6698010974737841 = __esm({
  "../.wrangler/tmp/pages-3cFsSW/functionsRoutes-0.6698010974737841.mjs"() {
    init_path();
    routes = [
      {
        routePath: "/:path*",
        mountPath: "/",
        method: "",
        middlewares: [],
        modules: [onRequest]
      }
    ];
  }
});

// Recovered module entry: run the lazy initialiser esbuild emitted, then
// re-export the worker exactly as the original worker.js did.
init_worker();
export {
  src_default as default,
  getOrInitSettings,
  invalidateSettingsCache
};
