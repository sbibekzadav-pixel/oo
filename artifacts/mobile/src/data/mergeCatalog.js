import { buildWebsiteServiceEntries } from './websiteCatalog';

/** Catalog uses only orderme.com.np service tiles (no legacy mock services). */
export function buildFullServiceCatalog() {
  return buildWebsiteServiceEntries();
}
