// Only retry explicit operator-configured upstreams. Never silently switch providers.
export async function fetchDnsWithFallback(primary, fallbacks, init, fetchImpl = fetch, dnsParam) {
  const urls = [...new Set([primary, ...fallbacks.split(/\s+/).filter(Boolean)])];
  let lastError;
  for (const endpoint of urls) {
    try {
      const url = new URL(endpoint);
      if (dnsParam !== undefined) url.searchParams.set('dns', dnsParam);
      const response = await fetchImpl(url.toString(), { ...init, signal: AbortSignal.timeout(5000) });
      if (response.ok) return response;
      await response.body?.cancel();
      lastError = new Error(`DNS upstream HTTP ${response.status}`);
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error('No DNS upstream available');
}
