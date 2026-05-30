import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { PATHS, mapToArray, dbListen } from '../services/rtdb';
import { seedCatalogIfNeeded } from '../data/seedCatalogRunner';
import { getLocalCatalogArrays } from '../data/localCatalog';

const DataContext = createContext(null);
const CLOUD_TIMEOUT_MS = 8000;
const MIN_CLOUD_CATALOG_VERSION = 4;

export function DataProvider({ children }) {
  const local = useMemo(() => getLocalCatalogArrays(), []);

  const [catalogLoading, setCatalogLoading] = useState(true);
  const [syncingCloud, setSyncingCloud] = useState(true);
  const [catalogError, setCatalogError] = useState(null);
  const [services, setServices] = useState(local.services);
  const [providers, setProviders] = useState(local.providers);
  const [homeCategories, setHomeCategories] = useState(local.homeCategories);
  const [serviceCategories, setServiceCategories] = useState(local.serviceCategories);
  const [mostBooked, setMostBooked] = useState(local.mostBooked);
  const [featuredServices, setFeaturedServices] = useState(local.featuredServices);
  const [banners, setBanners] = useState(local.banners);

  useEffect(() => {
    let cancelled = false;
    let unsubCatalog = () => {};
    let gotCloud = false;

    const finishLoading = () => {
      if (!cancelled) {
        setCatalogLoading(false);
        setSyncingCloud(false);
      }
    };

    const timer = setTimeout(finishLoading, CLOUD_TIMEOUT_MS);

    const applyCloudCatalog = (catalog) => {
      if (cancelled) return;
      if (!catalog) return;
      const version = catalog.meta?.version || 0;
      if (version < MIN_CLOUD_CATALOG_VERSION) return;

      gotCloud = true;
      const cloudServices = mapToArray(catalog.services);
      if (cloudServices.length) setServices(cloudServices);

      const cloudProviders = mapToArray(catalog.providers);
      if (cloudProviders.length) setProviders(cloudProviders);

      const cloudHome = mapToArray(catalog.homeCategories);
      if (cloudHome.length) setHomeCategories(cloudHome);

      const cloudServiceCats = mapToArray(catalog.serviceCategories);
      if (cloudServiceCats.length) setServiceCategories(cloudServiceCats);

      if (catalog.config?.mostBooked?.length) setMostBooked(catalog.config.mostBooked);
      if (catalog.config?.featuredServices?.length) {
        setFeaturedServices(catalog.config.featuredServices);
      }

      const cloudBanners = mapToArray(catalog.banners);
      if (cloudBanners.length) setBanners(cloudBanners);

      finishLoading();
    };

    (async () => {
      try {
        await Promise.race([
          seedCatalogIfNeeded(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Seed timeout')), CLOUD_TIMEOUT_MS),
          ),
        ]);
      } catch (e) {
        console.warn('Cloud catalog seed:', e?.message);
      }

      if (cancelled) return;

      unsubCatalog = dbListen(PATHS.catalog, (val) => {
        applyCloudCatalog(val);
        if (!gotCloud && val) applyCloudCatalog(val);
      });
    })().catch((e) => {
      if (!cancelled) setCatalogError(e.message);
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubCatalog();
    };
  }, [local]);

  const getService = useCallback((id) => services.find((s) => s.id === id), [services]);
  const getProvider = useCallback((id) => providers.find((p) => p.id === id), [providers]);
  const getServicesByProvider = useCallback(
    (providerId) => services.filter((s) => s.providerId === providerId),
    [services],
  );

  const value = useMemo(
    () => ({
      catalogLoading,
      syncingCloud,
      catalogError,
      services,
      providers,
      homeCategories,
      serviceCategories,
      mostBooked,
      featuredServices,
      banners,
      getService,
      getProvider,
      getServicesByProvider,
    }),
    [
      catalogLoading,
      syncingCloud,
      catalogError,
      services,
      providers,
      homeCategories,
      serviceCategories,
      mostBooked,
      featuredServices,
      banners,
      getService,
      getProvider,
      getServicesByProvider,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
