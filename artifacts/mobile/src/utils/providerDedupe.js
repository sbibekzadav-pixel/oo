/** Stable key for provider list deduplication (matches scrape-orderme.mjs). */
export function dedupeProviders(providers) {
  if (!providers?.length) return [];
  const seen = new Set();
  const out = [];
  for (const p of providers) {
    const phone = String(p.phone || p.phones?.[0] || '').replace(/\D/g, '');
    const name = (p.name || '').trim().toLowerCase();
    const business = (p.business || '').trim().toLowerCase();
    const route = (p.route || p.badge || '').trim().toLowerCase();
    const key = `${name}|${phone}|${business}|${route}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

export function providerStableKey(provider, index = 0) {
  const phone = String(provider?.phone || provider?.phones?.[0] || '').replace(/\D/g, '');
  const name = (provider?.name || '').trim().toLowerCase();
  const business = (provider?.business || '').trim().toLowerCase();
  const route = (provider?.route || provider?.badge || '').trim().toLowerCase();
  const key = `${name}|${phone}|${business}|${route}`;
  return key.replace(/^\|+$/, '') ? key : `provider-${index}`;
}
