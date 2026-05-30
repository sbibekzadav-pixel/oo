/** Build compact catalog text for the AI system context. */
export function buildAppKnowledge({ services, providers, serviceCategories, getProvider }) {
  const lines = [
    '=== ORDERME OFFICIAL CATALOG (Nepal home services) ===',
    'App: OrderMe — book/call cleaning, plumbing, electrical, carpentry, painting, transport, healthcare, beauty, food.',
    'Company support phone: +977 9842843848 | email: orderme.np@gmail.com',
    'Currency: Nepalese Rupees (Rs.). Users contact providers by phone (Call Now).',
    'RULE: Answer ONLY using this catalog. Never invent services, prices, or phone numbers.',
    '',
    '--- PROVIDERS ---',
  ];

  (providers || []).forEach((p) => {
    lines.push(
      `[provider:${p.id}] ${p.name} | ${p.title || 'Professional'} | phone: ${p.phone || 'N/A'} | `
      + `rating ${p.rating}/5 (${p.reviewCount || 0} reviews) | ${p.location || 'Nepal'} | badge: ${p.badge || 'Verified'}`,
    );
  });

  lines.push('', '--- SERVICES ---');
  (services || []).forEach((s) => {
    const p = getProvider(s.providerId);
    const packages = (s.packages || [])
      .map((pk) => `${pk.name}: Rs.${Number(pk.price).toLocaleString()}`)
      .join('; ');
    const priceFrom = s.packages?.[0]?.price ?? s.price;
    lines.push(
      `[service:${s.id}] ${s.title} | category: ${s.categoryLabel} (${s.category}) | `
      + `from Rs.${Number(priceFrom).toLocaleString()} | discount ${s.discount || 0}% | `
      + `rating ${s.rating}/5 (${s.reviewCount} reviews) | duration: ${s.duration || 'varies'} | `
      + `location: ${s.location || 'Nepal'} | provider: ${p?.name || 'N/A'} (${p?.phone || 'N/A'})`,
    );
    if (packages) lines.push(`  packages: ${packages}`);
    if (s.description) lines.push(`  about: ${s.description.replace(/\s+/g, ' ').slice(0, 280)}`);
  });

  if (serviceCategories?.length) {
    lines.push('', '--- CATEGORIES ---');
    serviceCategories.forEach((c) => {
      lines.push(`${c.id}: ${c.label}`);
    });
  }

  return lines.join('\n');
}

export function matchServicesInText(text, services, getProvider, limit = 4) {
  if (!text || !services?.length) return [];
  const lower = text.toLowerCase();
  const matched = services.filter((s) => {
    const title = s.title.toLowerCase();
    return lower.includes(title) || title.split(' ').some((w) => w.length > 4 && lower.includes(w));
  });
  const unique = [...new Map(matched.map((s) => [s.id, s])).values()];
  return unique.slice(0, limit).map((service) => ({
    service,
    provider: getProvider(service.providerId),
  }));
}

export const ORDERME_SCOPE_REPLY =
  'I\'m **OrderMe Assistant** and I only help with home services on OrderMe in Nepal — prices, providers, categories, and phone numbers. Ask about cleaning, plumbing, electrical, or say **call** + a service name.';
