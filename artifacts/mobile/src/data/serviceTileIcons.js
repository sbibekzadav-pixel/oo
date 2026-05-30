/**
 * Service tile images from orderme.com.np/service (see scripts/scrape-service-icons.mjs).
 */
import raw from './serviceTileIcons.json';

export const ORDERME_WEB_BASE = 'https://www.orderme.com.np';

/** @returns {string | null} */
export function getServiceTileIconUrl(slug) {
  if (!slug) return null;
  return raw.icons?.[slug] ?? null;
}

export function getServiceTileIconsScrapedAt() {
  return raw.scrapedAt;
}
