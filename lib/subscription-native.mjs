// Preserve native transports, credentials and TLS options when combining feeds.
export function mergeNativeSubscription(config, raw) {
  if (!raw) return config;
  const native = JSON.parse(raw);
  if (!native || !Array.isArray(native.outbounds)) throw new Error('Invalid NATIVE_CLIENT_CONFIG: expected outbounds');
  const entries = [...native.outbounds, ...(native.endpoints || [])];
  const tags = new Set(entries.map(entry => entry.tag));
  if (tags.size !== entries.length || entries.some(entry => !entry.tag || !entry.type)) throw new Error('Native entries need unique tags and types');
  const rename = tag => {
    if (!tags.has(tag)) throw new Error('Native configuration has an unresolved outbound reference');
    return `native-${tag}`;
  };
  const copy = entry => ({
    ...entry, tag: rename(entry.tag),
    ...(entry.detour ? { detour: rename(entry.detour) } : {}),
    ...(entry.outbounds ? { outbounds: entry.outbounds.map(rename) } : {}),
    ...(entry.default ? { default: rename(entry.default) } : {})
  });
  const selector = native.outbounds.find(entry => entry.tag === native.route?.final && entry.type === 'selector')
    || native.outbounds.find(entry => entry.type === 'selector');
  const selected = selector?.outbounds || entries.filter(entry => !['direct', 'block', 'dns', 'shadowtls', 'selector', 'urltest'].includes(entry.type)).map(entry => entry.tag);
  config.outbounds.push(...native.outbounds.map(copy));
  config.endpoints.push(...(native.endpoints || []).map(copy));
  config.outbounds.find(entry => entry.tag === 'select').outbounds.push(...selected.map(rename));
  return config;
}
