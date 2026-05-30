import React, {
  createContext, useContext, useState, useCallback, useMemo,
} from 'react';
import { getWebsiteLocations, formatLocationLabel } from '../data/websiteLocations';
import { serviceNeedsDestinationPicker } from '../utils/serviceFilters';

const SearchFilterContext = createContext(null);

export function SearchFilterProvider({ children }) {
  const [whatSlug, setWhatSlug] = useState(null);
  const [whatLabel, setWhatLabel] = useState(null);
  const [where, setWhere] = useState(null);
  const [wherePlace, setWherePlace] = useState(null);
  const [destinationPoint, setDestinationPoint] = useState(null);
  const [destinationLabel, setDestinationLabel] = useState(null);

  const setWhat = useCallback((slug, label) => {
    setWhatSlug(slug || null);
    setWhatLabel(label || null);
    if (!serviceNeedsDestinationPicker(slug)) {
      setDestinationPoint(null);
      setDestinationLabel(null);
    }
  }, []);

  const setDestination = useCallback((value, label) => {
    setDestinationPoint(value || null);
    setDestinationLabel(label || value || null);
  }, []);

  const clearDestination = useCallback(() => {
    setDestinationPoint(null);
    setDestinationLabel(null);
  }, []);

  const setWhereLocation = useCallback((location, place = null) => {
    setWhere(location || null);
    setWherePlace(place || null);
  }, []);

  const setWhereFromLoc = useCallback((loc) => {
    if (!loc) {
      setWhere(null);
      setWherePlace(null);
      return;
    }
    setWhere(formatLocationLabel(loc));
    setWherePlace(loc.place || null);
  }, []);

  const clearWhat = useCallback(() => {
    setWhatSlug(null);
    setWhatLabel(null);
  }, []);

  const clearWhere = useCallback(() => {
    setWhere(null);
    setWherePlace(null);
  }, []);

  const clearAll = useCallback(() => {
    setWhatSlug(null);
    setWhatLabel(null);
    setWhere(null);
    setWherePlace(null);
    setDestinationPoint(null);
    setDestinationLabel(null);
  }, []);

  const needsDestination = Boolean(whatSlug && serviceNeedsDestinationPicker(whatSlug));
  const isReady = Boolean(whatSlug && where);

  const value = useMemo(
    () => ({
      whatSlug,
      whatLabel,
      where,
      wherePlace,
      destinationPoint,
      destinationLabel,
      needsDestination,
      locations: getWebsiteLocations().map(formatLocationLabel),
      setWhat,
      setWhere: setWhereLocation,
      setWhereFromLoc,
      setDestination,
      clearDestination,
      clearWhat,
      clearWhere,
      clearAll,
      isReady,
    }),
    [
      whatSlug, whatLabel, where, wherePlace, destinationPoint, destinationLabel, needsDestination,
      setWhat, setWhereLocation, setWhereFromLoc, setDestination, clearDestination,
      clearWhat, clearWhere, clearAll, isReady,
    ],
  );

  return (
    <SearchFilterContext.Provider value={value}>
      {children}
    </SearchFilterContext.Provider>
  );
}

export function useSearchFilter() {
  const ctx = useContext(SearchFilterContext);
  if (!ctx) throw new Error('useSearchFilter must be used within SearchFilterProvider');
  return ctx;
}
