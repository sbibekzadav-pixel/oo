import { WEBSITE_SERVICE_TILES } from '../data/websiteCatalog';
import { formatLocationLabel } from '../data/websiteLocations';
import {
  applyDestinationFilterToService,
  applyLocationFilterToService,
  getServiceLocations,
  locationMatches,
} from './serviceFilters';

import { getServiceSearchTerms } from './serviceLabels';

/** Type-ahead filter for service picker (e.g. "hot" → Hotel, Photo Studio). */
export function filterWebsiteServiceTiles(query, { filterLocation = null, services = [], language = 'en' } = {}) {
  const q = (query || '').trim().toLowerCase();
  const serviceBySlug = {};
  (services || []).forEach((s) => {
    if (s.slug) serviceBySlug[s.slug] = s;
  });

  let tiles = WEBSITE_SERVICE_TILES;
  if (filterLocation) {
    tiles = tiles.filter((t) => {
      const svc = serviceBySlug[t.slug];
      if (!svc) return false;
      return locationMatches(getServiceLocations(svc), filterLocation);
    });
  }
  if (!q) return tiles;
  return tiles.filter((t) => {
    const terms = getServiceSearchTerms(t.slug, t.label, language);
    return terms.some((term) => term.includes(q));
  });
}

export function filterWebsiteLocations(query, locations) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return locations || [];
  return (locations || []).filter((loc) => {
    const label = formatLocationLabel(loc).toLowerCase();
    return label.includes(q)
      || loc.place?.toLowerCase().includes(q)
      || loc.area?.toLowerCase().includes(q);
  });
}

/**
 * After yellow search: open provider results for one service+place (like /service/search?title=&address=).
 */
export function runWebsiteSearch(navigation, {
  services, whatSlug, where, wherePlace, destinationPoint,
}) {
  const svc = (services || []).find((s) => s.slug === whatSlug);
  if (svc && where) {
    let filtered = applyLocationFilterToService(svc, where, wherePlace);
    if (destinationPoint) {
      filtered = applyDestinationFilterToService(filtered, destinationPoint);
    }
    navigation.navigate('ServiceDetail', { service: filtered });
    return;
  }
  navigation.navigate('Services');
}
