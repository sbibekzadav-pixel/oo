import { buildCatalogSeed } from './seedCatalog';

/** Offline-first catalog — app works even if Firebase is slow or unavailable */
export function getLocalCatalog() {
  return buildCatalogSeed();
}

export function getLocalCatalogArrays() {
  const seed = getLocalCatalog();
  const mapToArray = (obj) =>
    !obj || typeof obj !== 'object'
      ? []
      : Object.entries(obj).map(([key, value]) => ({ ...value, id: value?.id ?? key }));

  return {
    services: mapToArray(seed.services),
    providers: mapToArray(seed.providers),
    homeCategories: mapToArray(seed.homeCategories),
    serviceCategories: mapToArray(seed.serviceCategories),
    mostBooked: seed.config?.mostBooked || [],
    featuredServices: seed.config?.featuredServices || [],
    banners: mapToArray(seed.banners),
  };
}
