import { uriToDataUrl } from '../utils/imageDataUrl';

const MAX_BY_KIND = {
  photo: 500 * 1024,
  register_doc: 1000 * 1024,
  training_cert: 1000 * 1024,
};

/** Encode vendor images as data URLs for Realtime Database (not Firebase Storage). */
export async function uploadVendorRegistrationImage(_registrationId, uri, kind) {
  if (!uri) throw new Error('Missing image');
  const maxBytes = MAX_BY_KIND[kind] ?? 700_000;
  return uriToDataUrl(uri, maxBytes);
}

/** Encode multiple vendor images in parallel. */
export async function uploadVendorRegistrationImages(registrationId, items) {
  if (!registrationId) throw new Error('Missing registration id');
  return Promise.all(
    items.map(({ uri, kind }) =>
      uri ? uploadVendorRegistrationImage(registrationId, uri, kind) : Promise.resolve(null),
    ),
  );
}
