/** Maps home grid category ids to catalog slug or group filter. */
export const HOME_TO_SERVICE_SLUG = {
  plumber: 'plumber',
  electrician: 'electrician',
  grocery: 'grocery',
  doctor: 'doctor',
  taxi: 'taxi',
  'ac-expert': 'ac-expert',
  bakery: 'bakery',
  more: 'all',
};

export function resolveServiceCategory(homeCategoryId) {
  if (!homeCategoryId || homeCategoryId === 'more') return 'all';
  return HOME_TO_SERVICE_SLUG[homeCategoryId] || homeCategoryId;
}

/** Filter services by home tap — slug match or group id. */
export function filterServicesByHomeCategory(services, homeCategoryId) {
  if (!homeCategoryId || homeCategoryId === 'more') return services;
  const key = HOME_TO_SERVICE_SLUG[homeCategoryId] || homeCategoryId;
  return services.filter(
    (s) => s.slug === key || s.category === key || s.categoryLabel?.toLowerCase().includes(key.replace(/-/g, ' ')),
  );
}
