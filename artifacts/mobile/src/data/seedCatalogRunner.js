import { get, ref, set } from 'firebase/database';
import { rtdb } from '../config/firebase';
import { buildCatalogSeed } from './seedCatalog';

const CATALOG_VERSION = 4;

export async function seedCatalogIfNeeded() {
  const metaRef = ref(rtdb, 'catalog/meta');
  const snap = await get(metaRef);
  const meta = snap.val();
  if (meta?.seeded && (meta?.version || 0) >= CATALOG_VERSION) {
    return false;
  }
  const seed = buildCatalogSeed();
  seed.meta = { ...seed.meta, version: CATALOG_VERSION };
  await set(ref(rtdb, 'catalog'), seed);
  return true;
}
