/**
 * Catalog aligned with https://www.orderme.com.np (service, about, vendor registration).
 */
import { PROVIDER_BY_SERVICE_SLUG } from './providers';
import { enrichServiceFromLive } from './websiteLiveData';
import { getServiceTileIconUrl } from './serviceTileIcons';

export const ORDERME_SUPPORT = {
  phone: '+9779842843848',
  email: 'orderme.np@gmail.com',
  address: 'Main Road TMP-12, Gaighat, Sagarmatha Highway',
  website: 'https://www.orderme.com.np',
};

export const ABOUT_CONTENT = {
  title: 'Orderme: Your All-in-One Home Care Solution',
  intro:
    'Orderme is a streamlined platform that connects homeowners with verified professionals for everything from cleaning and plumbing to full renovations.',
  whyChooseUs: [
    { title: 'Versatile', text: 'One stop for all repairs, maintenance, and improvements.' },
    { title: 'Vetted', text: 'Access to trusted, experienced, and reliable experts.' },
    { title: 'Simple', text: 'Fast booking via a user-friendly interface.' },
    { title: 'Honest', text: 'Transparent, upfront pricing with zero hidden fees.' },
  ],
  bottomLine:
    'We handle the hard work so you can enjoy your home with total peace of mind.',
  footerBlurb:
    'Orderme online shopping and home delivery, Nepal. Developed by Saffron Infosys Pvt. Ltd.',
};

/** Locations from orderme.com.np/service "Where do you want" (place → municipality). */
export const NEPAL_LOCATIONS = [
  { id: 'gaighat', place: 'Gaighat', area: 'Triyuga Municipality' },
  { id: 'pichara', place: 'Pichara', area: 'Biratnagar Metropolitan City' },
  { id: 'bargachi', place: 'bargachi', area: 'Biratnagar Metropolitan City' },
  { id: 'inderni-tole', place: 'Inderni tole', area: 'Triyuga Municipality' },
  { id: 'asari', place: 'Asari', area: 'Triyuga Municipality' },
  { id: 'gaighat-dm-gate', place: 'Gaighat, DM gate', area: 'Triyuga Municipality' },
  { id: 'hathkhola-phakphok', place: 'hathkhola', area: 'Phakphokthum Rural Municipality' },
  { id: 'hathkhola-kalaiya', place: 'hathkhola', area: 'Kalaiya Sub-Metropolitan City' },
  { id: 'biratnagar', place: 'Biratnagar', area: 'Biratnagar Metropolitan City' },
  { id: 'kathmandu', place: 'Kathmandu', area: 'Kageshwari-Manohara Municipality' },
  { id: 'dharan', place: 'Dharan', area: 'Dharan Sub-Metropolitan City' },
  { id: 'lahan', place: 'Lahan', area: 'Lahan Municipality' },
  { id: 'kakarvitta', place: 'Kakarvitta', area: 'Mechinagar Municipality' },
  { id: 'bardibas', place: 'Bardibas', area: 'Bardibas Municipality' },
];

export function formatLocationLabel(loc) {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  return `${loc.place} ${loc.area}`;
}

export const VENDOR_TYPES = [
  { id: 'business', label: 'Business Firm' },
  { id: 'personal', label: 'Personal' },
];

export const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

/** Province → sample districts (extend as needed). */
export const NEPAL_ADMIN = {
  Koshi: ['Udayapur', 'Sunsari', 'Morang', 'Jhapa'],
  Madhesh: ['Saptari', 'Siraha', 'Dhanusha', 'Parsa'],
  Bagmati: ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kavrepalanchok'],
  Gandaki: ['Kaski', 'Syangja', 'Tanahun', 'Lamjung'],
  Lumbini: ['Rupandehi', 'Kapilvastu', 'Nawalparasi', 'Palpa'],
  Karnali: ['Surkhet', 'Dailekh', 'Jumla', 'Kalikot'],
  Sudurpashchim: ['Kailali', 'Kanchanpur', 'Doti', 'Achham'],
};

/** All service tiles from orderme.com.np/service */
export const WEBSITE_SERVICE_TILES = [
  { slug: 'home-decor', label: 'Home Decor', icon: 'home-outline', color: '#8b5cf6' },
  { slug: 'biryani', label: 'Biryani', icon: 'restaurant-outline', color: '#f97316' },
  { slug: 'sekuwa', label: 'Sekuwa', icon: 'flame-outline', color: '#ef4444' },
  { slug: 'grocery', label: 'Grocery', icon: 'cart-outline', color: '#10b981' },
  { slug: 'civil-engineer', label: 'Civil Engineer', icon: 'business-outline', color: '#64748b' },
  { slug: 'coffee-shop', label: 'Coffee Shop', icon: 'cafe-outline', color: '#92400e' },
  { slug: 'tuition-teacher', label: 'Tuition Teacher', icon: 'school-outline', color: '#3b82f6' },
  { slug: 'room-rent', label: 'Room Rent', icon: 'bed-outline', color: '#06b6d4' },
  { slug: 'ghar-jagga', label: 'Ghar Jagga', icon: 'map-outline', color: '#059669' },
  { slug: 'hiace', label: 'Hiace', icon: 'bus-outline', color: '#0ea5e9' },
  { slug: 'custom-agent', label: 'Custom Agent', icon: 'document-text-outline', color: '#6366f1' },
  { slug: 'hospital', label: 'Hospital', icon: 'medical-outline', color: '#ef4444' },
  { slug: 'sweets-store', label: 'Sweets Store', icon: 'ice-cream-outline', color: '#ec4899' },
  { slug: 'gas-store', label: 'Gas Store', icon: 'flame-outline', color: '#f59e0b' },
  { slug: 'home-appliance', label: 'Home Appliance', icon: 'tv-outline', color: '#1a56db' },
  { slug: 'bike-ride', label: 'Bike Ride', icon: 'bicycle-outline', color: '#06b6d4' },
  { slug: 'local-bus', label: 'Local Bus', icon: 'bus-outline', color: '#3b82f6' },
  { slug: 'day-night-bus', label: 'Day/Night Bus', icon: 'moon-outline', color: '#4f46e5' },
  { slug: 'eye-care', label: 'Eye Care', icon: 'eye-outline', color: '#14b8a6' },
  { slug: 'cinema-theater', label: 'Cinema/Theater', icon: 'film-outline', color: '#a855f7' },
  { slug: 'garmemt', label: 'Garmemt', icon: 'shirt-outline', color: '#f472b6' },
  { slug: 'cloth-store', label: 'Cloth Store', icon: 'shirt-outline', color: '#db2777' },
  { slug: 'tv-repair', label: 'TV Repair', icon: 'tv-outline', color: '#1e40af' },
  { slug: 'it-solution', label: 'It Solution', icon: 'laptop-outline', color: '#2563eb' },
  { slug: 'hardware-store', label: 'hardware Store', icon: 'construct-outline', color: '#78716c' },
  { slug: 'car-decoratoir', label: 'Car Decoratoir', icon: 'car-sport-outline', color: '#7c3aed' },
  { slug: 'photo-studio', label: 'Photo Studio', icon: 'camera-outline', color: '#0891b2' },
  { slug: 'tiles-marble', label: 'Tiles and Marble', icon: 'grid-outline', color: '#57534e' },
  { slug: 'fitness-center', label: 'Fitness Center', icon: 'barbell-outline', color: '#dc2626' },
  { slug: 'car-rent', label: 'Car Rent', icon: 'car-outline', color: '#0284c7' },
  { slug: 'cement-mixture-truck', label: 'Cement Mixture Truck', icon: 'cube-outline', color: '#a3a3a3' },
  { slug: 'transport', label: 'Transport', icon: 'train-outline', color: '#0369a1' },
  { slug: 'courier', label: 'Courier', icon: 'mail-outline', color: '#ea580c' },
  { slug: 'flight-ticket', label: 'Flight Ticket', icon: 'airplane-outline', color: '#0ea5e9' },
  { slug: 'ev', label: 'EV', icon: 'battery-charging-outline', color: '#22c55e' },
  { slug: 'tax-conslultant', label: 'Tax Conslultant', icon: 'calculator-outline', color: '#4b5563' },
  { slug: 'meat', label: 'Meat', icon: 'nutrition-outline', color: '#b91c1c' },
  { slug: 'auto-city', label: 'Auto/City', icon: 'car-outline', color: '#1d4ed8' },
  { slug: 'taxi', label: 'Taxi', icon: 'car-outline', color: '#facc15' },
  { slug: 'painter', label: 'Painter', icon: 'color-palette-outline', color: '#ec4899' },
  { slug: 'plumber', label: 'Plumber', icon: 'water-outline', color: '#3b82f6' },
  { slug: 'electrician', label: 'Electrician', icon: 'flash-outline', color: '#f59e0b' },
  { slug: 'mobile-care', label: 'Mobile Care', icon: 'phone-portrait-outline', color: '#6366f1' },
  { slug: 'jeweler', label: 'Jeweler', icon: 'diamond-outline', color: '#eab308' },
  { slug: 'saloon', label: 'Saloon', icon: 'cut-outline', color: '#f472b6' },
  { slug: 'beautician', label: 'Beautician', icon: 'flower-outline', color: '#db2777' },
  { slug: 'bakery', label: 'Bakery', icon: 'pizza-outline', color: '#d97706' },
  { slug: 'blood-bank', label: 'Blood Bank', icon: 'water-outline', color: '#dc2626' },
  { slug: 'ambulance', label: 'Ambulance', icon: 'medkit-outline', color: '#ef4444' },
  { slug: 'resturant', label: 'Resturant', icon: 'restaurant-outline', color: '#f97316' },
  { slug: 'hotel', label: 'Hotel', icon: 'bed-outline', color: '#0d9488' },
  { slug: 'radiologist', label: 'Radiologist', icon: 'scan-outline', color: '#7c3aed' },
  { slug: 'carpenter', label: 'Carpenter', icon: 'hammer-outline', color: '#8b5cf6' },
  { slug: 'car-workshop', label: 'Car Workshop', icon: 'build-outline', color: '#475569' },
  { slug: 'false-ceiling-mistri', label: 'False Ceiling Mistri', icon: 'layers-outline', color: '#94a3b8' },
  { slug: 'grill-mistri', label: 'Grill Mistri', icon: 'grid-outline', color: '#64748b' },
  { slug: 'pharmacy', label: 'Pharmacy', icon: 'medkit-outline', color: '#10b981' },
  { slug: 'raj-mistri', label: 'Raj Mistri', icon: 'construct-outline', color: '#78716c' },
  { slug: 'ac-expert', label: 'AC Expert', icon: 'snow-outline', color: '#06b6d4' },
  { slug: 'tent-and-sound', label: 'Tent and Sound', icon: 'musical-notes-outline', color: '#a855f7' },
  { slug: 'kabadiwala', label: 'Kabadiwala', icon: 'trash-outline', color: '#65a30d' },
  { slug: 'doctor', label: 'Doctor', icon: 'medical-outline', color: '#ef4444' },
  { slug: 'dentist', label: 'Dentist', icon: 'happy-outline', color: '#0ea5e9' },
  { slug: 'boutique', label: 'Boutique', icon: 'shirt-outline', color: '#e11d48' },
  { slug: 'tailor', label: 'Tailor', icon: 'cut-outline', color: '#be185d' },
  { slug: 'bike-mistri', label: 'Bike Mistri', icon: 'bicycle-outline', color: '#2563eb' },
  { slug: 'dance-center', label: 'Dance Center', icon: 'musical-note-outline', color: '#c026d3' },
  { slug: 'photo-grapher', label: 'Photo Grapher', icon: 'camera-outline', color: '#0891b2' },
  { slug: 'event-manager', label: 'Event Manager', icon: 'calendar-outline', color: '#7c3aed' },
  { slug: 'scorpio', label: 'Scorpio', icon: 'car-outline', color: '#334155' },
];

/** Total service tiles on orderme.com.np/service (70 as of May 2026). */
export const WEBSITE_SERVICE_COUNT = WEBSITE_SERVICE_TILES.length;

const UNSPLASH = (id) => `https://images.unsplash.com/photo-${id}?w=600`;

const TILE_IMAGES = {
  'home-decor': UNSPLASH('1586023492125-27b2c045efd7'),
  plumber: UNSPLASH('1621905251918-48416bd8575a'),
  electrician: UNSPLASH('1621905252507-b35492cc74b4'),
  grocery: UNSPLASH('1542838132-92c53300491e'),
  doctor: UNSPLASH('1631815588090-d4bfec5b1ccb'),
  taxi: UNSPLASH('1449965408869-eaa3f722cde1'),
  'ac-expert': UNSPLASH('1581093806997-124204d9fa9d'),
  bakery: UNSPLASH('1509440159626-024908877f7d'),
  biryani: UNSPLASH('1585937421612-6a4f65d8cc1e'),
  carpenter: UNSPLASH('1504307651254-35680f356dfd'),
  painter: UNSPLASH('1562259929-b4e1fd3aef09'),
  beautician: UNSPLASH('1522337360788-8b13dee7a37e'),
  hospital: UNSPLASH('1519494026892-80bbd88d406b'),
  ambulance: UNSPLASH('1576091160550-2173dba999ef'),
  hotel: UNSPLASH('1566073771259-6a8506099945'),
};

const DEFAULT_IMAGE = UNSPLASH('1558618666-fcd25c85cd64');

/** Map website slug → service group for filters */
export const SLUG_TO_GROUP = {
  plumber: 'home-repair',
  electrician: 'home-repair',
  painter: 'home-repair',
  carpenter: 'home-repair',
  'ac-expert': 'home-repair',
  'false-ceiling-mistri': 'home-repair',
  'grill-mistri': 'home-repair',
  'raj-mistri': 'home-repair',
  'bike-mistri': 'home-repair',
  'car-workshop': 'home-repair',
  'tv-repair': 'home-repair',
  'home-appliance': 'home-repair',
  'home-decor': 'home-repair',
  'tiles-marble': 'home-repair',
  'hardware-store': 'home-repair',
  'bike-ride': 'transport',
  taxi: 'transport',
  'auto-city': 'transport',
  hiace: 'transport',
  scorpio: 'transport',
  'local-bus': 'transport',
  'day-night-bus': 'transport',
  'car-rent': 'transport',
  transport: 'transport',
  courier: 'transport',
  'cement-mixture-truck': 'transport',
  'flight-ticket': 'transport',
  ev: 'transport',
  doctor: 'health',
  dentist: 'health',
  hospital: 'health',
  pharmacy: 'health',
  'blood-bank': 'health',
  ambulance: 'health',
  radiologist: 'health',
  'eye-care': 'health',
  grocery: 'food',
  biryani: 'food',
  sekuwa: 'food',
  bakery: 'food',
  resturant: 'food',
  'coffee-shop': 'food',
  'sweets-store': 'food',
  meat: 'food',
  'gas-store': 'food',
};

/** Browse sections shown on the Services tab. */
export const SERVICE_SECTIONS = [
  { id: 'all', label: 'All', icon: 'grid-outline', color: '#1a56db', bg: '#eff6ff' },
  { id: 'home-repair', label: 'Home, Cleaning & Repair', icon: 'sparkles-outline', color: '#8b5cf6', bg: '#f5f3ff' },
  { id: 'transport', label: 'Vehicles & Transport', icon: 'car-outline', color: '#06b6d4', bg: '#ecfeff' },
  { id: 'health', label: 'Health & Medical', icon: 'medkit-outline', color: '#ef4444', bg: '#fef2f2' },
  { id: 'food', label: 'Food & Grocery', icon: 'restaurant-outline', color: '#f97316', bg: '#fff7ed' },
  { id: 'retail', label: 'Shopping & Fashion', icon: 'bag-outline', color: '#ec4899', bg: '#fdf2f8' },
  { id: 'professional', label: 'Professional Services', icon: 'briefcase-outline', color: '#64748b', bg: '#f8fafc' },
  { id: 'property', label: 'Property & Rent', icon: 'home-outline', color: '#059669', bg: '#ecfdf5' },
  { id: 'events', label: 'Events & Entertainment', icon: 'calendar-outline', color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'other', label: 'More Services', icon: 'ellipsis-horizontal-outline', color: '#475569', bg: '#f1f5f9' },
];

/** @deprecated use SERVICE_SECTIONS */
export const SERVICE_GROUPS = SERVICE_SECTIONS;

function inferGroup(slug) {
  if (SLUG_TO_GROUP[slug]) return SLUG_TO_GROUP[slug];
  if (['garmemt', 'cloth-store', 'boutique', 'jeweler', 'mobile-care'].includes(slug)) return 'retail';
  if (['civil-engineer', 'tuition-teacher', 'it-solution', 'tax-conslultant', 'custom-agent'].includes(slug)) return 'professional';
  if (['room-rent', 'ghar-jagga'].includes(slug)) return 'property';
  if (['event-manager', 'tent-and-sound', 'dance-center', 'photo-grapher', 'photo-studio'].includes(slug)) return 'events';
  return 'other';
}

/** Transport services with destination-point filtering on orderme.com.np */
export const TRANSPORT_SLUGS = new Set([
  'local-bus', 'day-night-bus', 'hiace', 'scorpio', 'transport', 'taxi', 'bike-ride',
  'auto-city', 'car-rent', 'courier', 'cement-mixture-truck', 'flight-ticket', 'ev',
]);

export function isTransportServiceSlug(slug) {
  return TRANSPORT_SLUGS.has(slug);
}

/** Website services that support in-app booking (most tiles are call-only). */
export const WEBSITE_BOOKING_SLUGS = new Set([
  'hotel', 'room-rent', 'ghar-jagga', 'bakery', 'cinema-theater',
]);

/** Professional / inquiry-only website services — call, no Book Now. */
export const CALL_ONLY_SERVICE_SLUGS = new Set([
  'custom-agent', 'courier', 'flight-ticket', 'civil-engineer', 'tuition-teacher',
  'tax-conslultant', 'it-solution', 'eye-care', 'hospital',
]);

export function serviceSupportsBooking(serviceOrSlug) {
  const service = typeof serviceOrSlug === 'object' && serviceOrSlug ? serviceOrSlug : null;
  const slug = service?.slug ?? (typeof serviceOrSlug === 'string' ? serviceOrSlug : null);
  if (!slug) return false;
  if (isTransportServiceSlug(slug) || CALL_ONLY_SERVICE_SLUGS.has(slug)) return false;
  if (service?.websiteService) return WEBSITE_BOOKING_SLUGS.has(slug);
  return true;
}

const LOCATION_HUB_IDS = new Set([
  'kathmandu', 'biratnagar', 'dharan', 'gaighat', 'lahan', 'bardibas', 'kakarvitta',
]);

const LOCATION_LOCAL_IDS = new Set([
  'pichara', 'bargachi', 'inderni-tole', 'asari', 'gaighat-dm-gate',
  'hathkhola-phakphok', 'hathkhola-kalaiya',
]);

function labelsForIds(ids) {
  return ids.map((id) => formatLocationLabel(NEPAL_LOCATIONS.find((l) => l.id === id))).filter(Boolean);
}

/** Sample routes for transport-style services (from → to). */
export const TRANSPORT_SERVICE_ROUTES = {
  'local-bus': [
    { from: 'Gaighat', to: 'Biratnagar', label: 'Gaighat → Biratnagar' },
    { from: 'Biratnagar', to: 'Dharan', label: 'Biratnagar → Dharan' },
    { from: 'Dharan', to: 'Kathmandu', label: 'Dharan → Kathmandu' },
  ],
  'day-night-bus': [
    { from: 'Gaighat', to: 'Kathmandu', label: 'Gaighat → Kathmandu' },
    { from: 'Biratnagar', to: 'Kathmandu', label: 'Biratnagar → Kathmandu' },
  ],
  hiace: [
    { from: 'Gaighat', to: 'Biratnagar', label: 'Gaighat → Biratnagar' },
    { from: 'Kakarvitta', to: 'Biratnagar', label: 'Kakarvitta → Biratnagar' },
  ],
  scorpio: [
    { from: 'Gaighat', to: 'Dharan', label: 'Gaighat → Dharan' },
    { from: 'Biratnagar', to: 'Lahan', label: 'Biratnagar → Lahan' },
  ],
  taxi: [
    { from: 'Gaighat', to: 'Biratnagar', label: 'Gaighat → Biratnagar' },
    { from: 'Biratnagar', to: 'Dharan', label: 'Biratnagar → Dharan' },
  ],
  transport: [
    { from: 'Gaighat', to: 'Kathmandu', label: 'Gaighat → Kathmandu' },
    { from: 'Biratnagar', to: 'Kakarvitta', label: 'Biratnagar → Kakarvitta' },
  ],
  courier: [
    { from: 'Gaighat', to: 'Biratnagar', label: 'Gaighat → Biratnagar' },
    { from: 'Biratnagar', to: 'Kathmandu', label: 'Biratnagar → Kathmandu' },
  ],
  'flight-ticket': [
    { from: 'Biratnagar', to: 'Kathmandu', label: 'Biratnagar → Kathmandu' },
    { from: 'Kathmandu', to: 'Dubai', label: 'Kathmandu → Dubai' },
  ],
};

/** Cities where each website service is available (aligned with orderme.com.np areas). */
export function getLocationsForServiceSlug(slug) {
  const group = inferGroup(slug);
  const hubLabels = labelsForIds([...LOCATION_HUB_IDS]);
  const localLabels = labelsForIds([...LOCATION_LOCAL_IDS]);
  const allLabels = NEPAL_LOCATIONS.map(formatLocationLabel);

  if (TRANSPORT_SLUGS.has(slug)) {
    return [...hubLabels, ...localLabels];
  }
  if (group === 'food' || group === 'health' || group === 'home-repair') {
    return [...hubLabels, ...localLabels];
  }
  if (group === 'transport') {
    return [...hubLabels, ...labelsForIds(['pichara', 'hathkhola-phakphok', 'hathkhola-kalaiya'])];
  }
  return allLabels;
}

/**
 * Build catalog service entries for every website tile (offline-first).
 */

export const WEBSITE_MOST_BOOKED = [
  'web-plumber',
  'web-electrician',
  'web-grocery',
  'web-doctor',
  'web-ac-expert',
  'web-taxi',
  'web-biryani',
  'web-hospital',
];

export const WEBSITE_FEATURED = [
  'web-plumber',
  'web-grocery',
  'web-ac-expert',
  'web-doctor',
];

/** Group catalog items into sections for the Services screen. */
export function buildServiceSectionList(services, { activeSection = 'all' } = {}) {
  const sections = SERVICE_SECTIONS.filter((s) => s.id !== 'all');

  return sections
    .filter((sec) => activeSection === 'all' || activeSection === sec.id)
    .map((sec) => {
      const items = (services || []).filter((s) => s.category === sec.id);
      return { ...sec, items };
    })
    .filter((sec) => sec.items.length > 0);
}

export function resolveSectionForSlug(slug) {
  if (!slug || slug === 'all' || slug === 'more') return 'all';
  return inferGroup(slug);
}

export function buildWebsiteServiceEntries(existingBySlug = {}) {
  return WEBSITE_SERVICE_TILES.map((tile, index) => {
    if (existingBySlug[tile.slug]) {
      return enrichServiceFromLive(existingBySlug[tile.slug]);
    }
    const group = inferGroup(tile.slug);
    const groupMeta = SERVICE_GROUPS.find((g) => g.id === group) || SERVICE_GROUPS[8];
    const locations = getLocationsForServiceSlug(tile.slug);
    const primaryLabel = locations[0] || 'Nepal';
    const routes = TRANSPORT_SERVICE_ROUTES[tile.slug] || null;
    const routeSummary = routes?.length
      ? routes.map((r) => r.label).join(' · ')
      : null;
    const base = {
      id: `web-${tile.slug}`,
      slug: tile.slug,
      title: tile.label,
      category: group,
      categoryLabel: tile.label,
      categoryColor: tile.color,
      description: routeSummary
        ? `${tile.label}: ${routeSummary}. Book via OrderMe Nepal.`
        : `Book ${tile.label} in Nepal. Verified providers near you — quick call or easy registration.`,
      longDescription: routeSummary
        ? `Available routes: ${routeSummary}. OrderMe connects you with trusted ${tile.label} providers across Nepal.`
        : `OrderMe connects you with trusted ${tile.label} professionals across Nepal. Transparent pricing and reliable local service.`,
      price: 0,
      originalPrice: 0,
      discount: 0,
      rating: 4.5 + (index % 5) * 0.1,
      reviewCount: 20 + (index % 40) * 3,
      duration: 'On request',
      image: getServiceTileIconUrl(tile.slug) || TILE_IMAGES[tile.slug] || DEFAULT_IMAGE,
      gallery: [],
      packages: [
        {
          id: 'inquiry',
          name: 'Get Quote',
          price: 0,
          originalPrice: 0,
          features: ['Call provider', 'Local experts', 'Nepal-wide'],
        },
      ],
      providerId: PROVIDER_BY_SERVICE_SLUG[tile.slug] || 'orderme',
      phone: ORDERME_SUPPORT.phone,
      location: primaryLabel,
      locations,
      routes,
      available: true,
      featured: index < 12,
      booked: 50 + index * 7,
      websiteService: true,
      icon: tile.icon,
      groupLabel: groupMeta.label,
    };
    return enrichServiceFromLive(base);
  });
}
