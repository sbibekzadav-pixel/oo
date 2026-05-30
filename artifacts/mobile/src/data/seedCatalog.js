/**
 * One-time seed payload for Firebase Realtime Database.
 * Source data — not imported by UI screens.
 */
import { buildFullServiceCatalog } from './mergeCatalog';
import { WEBSITE_MOST_BOOKED, WEBSITE_FEATURED } from './websiteCatalog';
import { PROVIDERS } from './providers';
import { HOME_CATEGORIES, SERVICE_CATEGORIES } from './categories';
import { arrayToMap } from '../services/rtdb';

export const DEFAULT_NOTIFICATIONS = [
  {
    id: '1', type: 'booking', icon: 'checkmark-circle', color: '#10b981', bg: '#ecfdf5',
    title: 'Booking Confirmed!',
    message: 'Your Home Deep Cleaning booking has been confirmed.',
    time: '2 hours ago', read: false,
  },
  {
    id: '2', type: 'promo', icon: 'pricetag', color: '#f59e0b', bg: '#fffbeb',
    title: 'Special Offer!',
    message: 'Get 30% off on your next cleaning service. Use code CLEAN30.',
    time: '5 hours ago', read: false,
  },
  {
    id: '3', type: 'tracking', icon: 'location', color: '#3b82f6', bg: '#eff6ff',
    title: 'Provider On the Way',
    message: 'Your provider is on the way. ETA: 15 minutes.',
    time: 'Yesterday', read: true,
  },
];

export const CATALOG_BANNERS = {
  '1': {
    id: '1', titleKey: 'save25Today', subtitleKey: 'exclusiveDiscounts', ctaKey: 'bookNow',
    gradient: ['#1a56db', '#3b82f6'], icon: 'construct',
  },
  '2': {
    id: '2', titleKey: 'newCustomerOff', subtitleKey: 'firstBookingOffer', ctaKey: 'claimNow',
    gradient: ['#059669', '#10b981'], icon: 'gift',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop&q=80',
  },
  '3': {
    id: '3', titleKey: 'freeInspection', subtitleKey: 'acServiceCheck', ctaKey: 'bookNow',
    gradient: ['#7c3aed', '#8b5cf6'], icon: 'snow',
  },
};

export function buildCatalogSeed() {
  const services = buildFullServiceCatalog();
  return {
    meta: { seeded: true, version: 4, seededAt: new Date().toISOString() },
    services: arrayToMap(services),
    providers: arrayToMap(PROVIDERS),
    homeCategories: arrayToMap(HOME_CATEGORIES),
    serviceCategories: arrayToMap(SERVICE_CATEGORIES),
    config: { mostBooked: WEBSITE_MOST_BOOKED, featuredServices: WEBSITE_FEATURED },
    defaultNotifications: arrayToMap(DEFAULT_NOTIFICATIONS),
    banners: CATALOG_BANNERS,
  };
}
