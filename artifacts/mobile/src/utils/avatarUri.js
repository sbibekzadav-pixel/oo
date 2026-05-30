/** Append cache-buster so Image reloads after profile photo update. */
export function withAvatarCache(uri, version) {
  if (!uri) return uri;
  if (uri.startsWith('data:') || uri.startsWith('blob:')) return uri;
  const v = version || Date.now();
  const sep = uri.includes('?') ? '&' : '?';
  return `${uri}${sep}v=${v}`;
}
