import {
  NEPAL_LOCATIONS,
  SERVICE_SECTIONS,
  WEBSITE_SERVICE_TILES,
} from './websiteCatalog';

const POPULAR_HOME_SLUGS = [
  'plumber',
  'electrician',
  'grocery',
  'doctor',
  'taxi',
  'ac-expert',
  'bakery',
  'biryani',
];

function tileBySlug(slug) {
  return WEBSITE_SERVICE_TILES.find((t) => t.slug === slug);
}

export const HOME_CATEGORIES = [
  ...POPULAR_HOME_SLUGS.map((slug) => {
    const t = tileBySlug(slug);
    if (!t) return null;
    return {
      id: t.slug,
      label: t.label,
      icon: t.icon,
      color: t.color,
      bg: `${t.color}20`,
    };
  }).filter(Boolean),
  {
    id: 'more',
    label: 'More',
    icon: 'grid-outline',
    color: '#1a56db',
    bg: '#eff6ff',
  },
];

/** Section filters for Services tab (not per-tile). */
export const SERVICE_CATEGORIES = SERVICE_SECTIONS.filter((s) => s.id !== 'all');

export const NEPAL_CITIES = NEPAL_LOCATIONS;
