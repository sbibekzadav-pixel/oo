/**
 * Live provider data scraped from orderme.com.np (see scripts/scrape-orderme.mjs).
 */
import raw from './websiteLiveData.json';
import { dedupeProviders } from '../utils/providerDedupe';

const LIVE = raw;

/** @returns {typeof LIVE.services[string] | null} */
export function getLiveServiceData(slug) {
  if (!slug) return null;
  return LIVE.services?.[slug] ?? null;
}

/** Destination points for transport services (from scrape). */
export function getLiveDestinations(slug) {
  return getLiveServiceData(slug)?.destinations ?? [];
}

export function getLiveLocations() {
  return LIVE.locations || [];
}

export function getLiveScrapedAt() {
  return LIVE.scrapedAt;
}

export function getWebsiteIdForSlug(slug) {
  return getLiveServiceData(slug)?.websiteId ?? null;
}

/** Providers for /service/search?title=&address=place */
export function getLiveProvidersAtAddress(slug, place) {
  if (!slug || !place) return null;
  const bucket = getLiveServiceData(slug)?.byAddress?.[place];
  return bucket?.providers ?? null;
}

/** Normalize tel: digits; keep landlines (03x, 04x) as on the website. */
export function formatDisplayPhone(phone) {
  if (!phone) return '';
  const t = String(phone).trim();
  if (t.startsWith('+')) return t;
  const d = t.replace(/\D/g, '');
  if (d.startsWith('977')) return `+${d}`;
  if (d.length === 10) return `+977${d}`;
  if (d.length <= 9 && /^0/.test(d)) return d;
  return t;
}

function sanitizeProvider(p) {
  const phones = (p.phones || [])
    .map(formatDisplayPhone)
    .filter(Boolean);
  const unique = [...new Set(phones)];
  const route = p.route || p.badge || null;
  return {
    ...p,
    phones: unique,
    phone: unique[0] || null,
    phoneSecondary: unique[1] || null,
    origin: p.origin || p.location || null,
    destinationCity: p.destinationCity || p.address || null,
    route,
    badge: p.badge || route,
    imageUrl: p.imageUrl || null,
  };
}

/**
 * Merge scraped listings into a catalog service entry.
 */
export function enrichServiceFromLive(entry) {
  const live = getLiveServiceData(entry.slug);
  if (!live) return entry;

  const providers = dedupeProviders((live.providers || []).map(sanitizeProvider));
  const rawByAddress = live.byAddress || entry.byAddress;
  const byAddress = rawByAddress
    ? Object.fromEntries(
      Object.entries(rawByAddress).map(([place, bucket]) => {
        const placeProviders = dedupeProviders((bucket.providers || []).map(sanitizeProvider));
        return [
          place,
          {
            ...bucket,
            providers: placeProviders,
            providerCount: placeProviders.length,
            phones: [...new Set(placeProviders.flatMap((p) => p.phones))],
          },
        ];
      }),
    )
    : undefined;

  const destinations = live.destinations?.length
    ? live.destinations.map((d) => ({
      ...d,
      providers: dedupeProviders((d.providers || []).map(sanitizeProvider)),
    }))
    : entry.destinations;
  const phones = [...new Set(providers.flatMap((p) => p.phones))];
  const primary = phones[0] || entry.phone;
  const secondary = phones[1] || providers.find((p) => p.phoneSecondary)?.phoneSecondary || null;

  let routes = entry.routes;
  if (live.destinations?.length) {
    const fromRoutes = live.destinations.flatMap((d) =>
      (d.providers || []).map((p) => {
        const badge = p.badge || '';
        const parts = badge.split(/[-–→]/).map((s) => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          return { from: parts[0], to: parts[1], label: badge };
        }
        return {
          from: 'Gaighat',
          to: d.destination,
          label: p.badge || `Gaighat → ${d.destination}`,
        };
      }),
    );
    if (fromRoutes.length) routes = fromRoutes;
  } else if (providers.length) {
    const routeLabels = providers
      .map((p) => p.badge)
      .filter((b) => b && /[-–→]/.test(b));
    if (routeLabels.length) {
      routes = routeLabels.map((label) => {
        const parts = label.split(/[-–→]/).map((s) => s.trim());
        return { from: parts[0], to: parts[1] || parts[0], label };
      });
    }
  }

  const locationSet = new Set(entry.locations || []);
  providers.forEach((p) => {
    if (p.location) locationSet.add(p.location.replace(/\s*,\s*/g, ' ').trim());
  });

  const count = live.providerCount ?? providers.length;
  const descSuffix = count
    ? `${count} verified provider${count === 1 ? '' : 's'} on OrderMe.`
    : 'Contact OrderMe for availability.';

  return {
    ...entry,
    providerCount: count,
    phones,
    phone: primary,
    phoneSecondary: secondary,
    contactPhone: primary,
    providers,
    destinations,
    byAddress,
    busNames: live.busNames?.length ? live.busNames : entry.busNames,
    hotelNames:
      entry.slug === 'hotel' && live.hotelNames?.length
        ? live.hotelNames
        : entry.hotelNames,
    locations: locationSet.size ? [...locationSet] : entry.locations,
    routes: routes?.length ? routes : entry.routes,
    reviewCount: count > 0 ? Math.max(entry.reviewCount, count * 4) : entry.reviewCount,
    description: entry.description?.includes('verified provider')
      ? entry.description
      : `${entry.title}: ${descSuffix}`,
  };
}

export function countEnrichedServices() {
  return Object.values(LIVE.services || {}).filter((s) => (s.providerCount || 0) > 0).length;
}
