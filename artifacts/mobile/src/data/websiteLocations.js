/**
 * Locations for "Where do you want" — prefer scraped orderme.com.np list.
 */
import { NEPAL_LOCATIONS, formatLocationLabel } from './websiteCatalog';
import { getLiveLocations } from './websiteLiveData';

function slugifyId(place, area) {
  return `${place}-${area}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

/** @returns {typeof NEPAL_LOCATIONS} */
export function getWebsiteLocations() {
  const live = getLiveLocations();
  if (!live?.length) return NEPAL_LOCATIONS;
  return live.map((l) => ({
    id: slugifyId(l.place, l.area),
    place: l.place,
    area: l.area,
  }));
}

export { formatLocationLabel };
