import {
  WEBSITE_SERVICE_TILES,
  getLocationsForServiceSlug,
  NEPAL_LOCATIONS,
  formatLocationLabel,
  isTransportServiceSlug,
} from '../data/websiteCatalog';
import { getLiveDestinations, getLiveServiceData } from '../data/websiteLiveData';
import { dedupeProviders, providerStableKey } from './providerDedupe';

export { dedupeProviders, providerStableKey };

function normalizeDestKey(value, area = '') {
  return `${(value || '').trim().toLowerCase()}|${(area || '').trim().toLowerCase()}`;
}

function mapDestinationEntries(destinations) {
  const seen = new Set();
  const out = [];
  for (const d of destinations || []) {
    const value = d.destination || d.value;
    if (!value) continue;
    const key = normalizeDestKey(value, d.area);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      value,
      area: d.area,
      label: d.area ? `${value} — ${d.area}` : value,
    });
  }
  return out;
}

export function normalizeLocationName(name) {
  return (name || '').trim().toLowerCase();
}

function placeFromSelection(selectedLocation) {
  const sel = normalizeLocationName(selectedLocation);
  const entry = NEPAL_LOCATIONS.find(
    (l) => normalizeLocationName(formatLocationLabel(l)) === sel
      || normalizeLocationName(l.place) === sel,
  );
  return entry?.place ? normalizeLocationName(entry.place) : sel;
}

export function locationMatches(serviceLocation, selectedLocation) {
  const sel = normalizeLocationName(selectedLocation);
  if (!sel) return true;
  const selPlace = placeFromSelection(selectedLocation);
  const candidates = [];
  if (Array.isArray(serviceLocation)) candidates.push(...serviceLocation);
  else if (serviceLocation) candidates.push(serviceLocation);
  return candidates.some((loc) => {
    const l = normalizeLocationName(loc);
    const lPlace = placeFromSelection(loc);
    return l.includes(sel) || sel.includes(l)
      || lPlace.includes(selPlace) || selPlace.includes(lPlace)
      || l === 'nepal';
  });
}
export function getServiceLocations(service) {
  if (!service) return [];
  if (Array.isArray(service.locations) && service.locations.length) return service.locations;
  if (service.slug) return getLocationsForServiceSlug(service.slug);
  if (service.location) return [service.location];
  return [];
}

export function matchesWhatSlug(service, whatSlug) {
  if (!whatSlug) return true;
  return service.slug === whatSlug;
}

export function filterServicesByWhatAndWhere(services, { whatSlug, location } = {}) {
  return (services || []).filter(
    (s) => matchesWhatSlug(s, whatSlug) && locationMatches(getServiceLocations(s), location),
  );
}

export function filterProvidersByLocation(providers, location) {
  if (!location) return providers || [];
  return (providers || []).filter((p) => locationMatches(p.location, location));
}

/** Match orderme.com.np ?address= place value (e.g. Gaighat). */
export function getAddressPlaceFromSelection(selectedLocation, wherePlace = null) {
  if (wherePlace) return wherePlace.trim();
  return placeFromSelection(selectedLocation);
}

/**
 * Narrow service to providers for title+address search (website /service/search).
 */
export function applyLocationFilterToService(service, selectedLocation, wherePlace = null) {
  if (!service || !selectedLocation) return service;
  const place = getAddressPlaceFromSelection(selectedLocation, wherePlace);
  const live = getLiveServiceData(service.slug);
  const bucket = live?.byAddress?.[place];
  let providers = bucket?.providers?.length
    ? bucket.providers
    : filterProvidersByLocation(service.providers, selectedLocation);
  providers = dedupeProviders(providers);

  const phones = [...new Set(providers.flatMap((p) => p.phones || (p.phone ? [p.phone] : [])))];
  const count = providers.length;
  return {
    ...service,
    providers,
    providerCount: count,
    phones,
    phone: phones[0] || service.phone,
    phoneSecondary: phones[1] || service.phoneSecondary,
    busNames: service.busNames?.filter(() => count > 0) ?? service.busNames,
  };
}

export function getWhatTile(slug) {
  return WEBSITE_SERVICE_TILES.find((t) => t.slug === slug) || null;
}

export function getDestinationPointsForService(service) {
  const slug = service?.slug;
  const fromService = mapDestinationEntries(service?.destinations);
  if (fromService.length) return fromService;

  const fromLive = mapDestinationEntries(getLiveDestinations(slug));
  if (fromLive.length) return fromLive;

  if (!slug || !isTransportServiceSlug(slug)) return [];

  const liveData = getLiveServiceData(slug);
  const providers = service?.providers?.length
    ? service.providers
    : (liveData?.providers || []);
  const seen = new Set();
  const derived = [];
  for (const p of providers) {
    const value = (p.destinationCity || p.address || '').trim();
    if (!value) continue;
    const key = normalizeDestKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    derived.push({ value, area: '', label: value });
  }
  return derived;
}

export function serviceNeedsDestinationPicker(serviceOrSlug) {
  const slug = typeof serviceOrSlug === 'string' ? serviceOrSlug : serviceOrSlug?.slug;
  const service = typeof serviceOrSlug === 'object' && serviceOrSlug
    ? serviceOrSlug
    : { slug };
  return getDestinationPointsForService({ ...service, slug }).length > 0;
}

function normalizeDest(value) {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Strict destination label match (exact or whole-token overlap). */
export function destinationMatches(selectedDestination, pointDestination) {
  const sel = normalizeDest(selectedDestination);
  const dest = normalizeDest(pointDestination);
  if (!sel || !dest) return false;
  if (sel === dest) return true;
  const wordMatch = (haystack, needle) => {
    const re = new RegExp(`(^|\\s|-)${escapeRegExp(needle)}(\\s|-|$)`, 'i');
    return re.test(haystack);
  };
  if (sel.length >= 4 && dest.length >= 4) {
    return wordMatch(sel, dest) || wordMatch(dest, sel);
  }
  return false;
}

function extractRouteEndpoints(routeText) {
  if (!routeText) return [];
  return routeText
    .split(/[-–→|]/)
    .map((part) => part.replace(/\[.*?\]/g, '').trim())
    .filter(Boolean);
}

const GENERIC_DESTINATION_PATTERNS = [
  'all over nepal',
  'nepal wide',
  'nepal-wide',
  'anywhere in nepal',
];

function providerDestinationCandidates(provider) {
  const routeText = provider.route || provider.badge || '';
  const routeParts = extractRouteEndpoints(routeText);
  const candidates = [
    provider.destinationCity,
    provider.destination,
    ...routeParts,
  ].filter(Boolean);

  if (provider.address) {
    const addr = normalizeDest(provider.address);
    const dest = normalizeDest(provider.destinationCity);
    if (!dest || addr === dest || routeParts.some((part) => normalizeDest(part) === addr)) {
      candidates.push(provider.address);
    }
  }

  return candidates;
}

function providerMatchesDestination(provider, selectedDestination) {
  const sel = normalizeDest(selectedDestination);
  if (!sel) return true;

  const candidates = providerDestinationCandidates(provider);
  const normalizedCandidates = candidates.map(normalizeDest).filter(Boolean);
  const isGeneric = normalizedCandidates.some((c) =>
    GENERIC_DESTINATION_PATTERNS.some((pattern) => c.includes(pattern)));

  if (isGeneric) {
    return normalizedCandidates.some((c) => destinationMatches(sel, c));
  }

  return candidates.some((c) => destinationMatches(sel, c));
}

function findDestinationBucket(destinations, selectedDestination) {
  if (!destinations?.length) return null;
  const sel = normalizeDest(selectedDestination);
  return destinations.find((d) => normalizeDest(d.destination) === sel) || null;
}

/** Filter providers / bus operators for a selected destination point. */
export function filterProvidersByDestination(service, selectedDestination) {
  if (!selectedDestination || !service) return service?.providers || [];

  const dests = service.destinations || getLiveDestinations(service.slug) || [];
  const bucket = findDestinationBucket(dests, selectedDestination);
  const source = bucket?.providers?.length ? bucket.providers : (service.providers || []);

  return dedupeProviders(
    source.filter((p) => providerMatchesDestination(p, selectedDestination)),
  );
}

export function getBusNamesForDestination(service, selectedDestination) {
  const providers = filterProvidersByDestination(service, selectedDestination);
  const names = providers
    .map((p) => p.business || p.name)
    .filter(Boolean);
  return [...new Set(names)];
}

export function applyDestinationFilterToService(service, selectedDestination) {
  if (!service || !selectedDestination) return service;
  const providers = dedupeProviders(filterProvidersByDestination(service, selectedDestination));
  const busNames = getBusNamesForDestination(service, selectedDestination);
  return {
    ...service,
    providers,
    providerCount: providers.length,
    busNames: busNames.length ? busNames : service.busNames,
    phones: [...new Set(providers.flatMap((p) => p.phones || []))],
  };
}
