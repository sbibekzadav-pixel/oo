/** Prefer the profile with the latest updatedAt timestamp. */
export function mergeProfiles(local, remote) {
  const a = local && typeof local === 'object' ? local : {};
  const b = remote && typeof remote === 'object' ? remote : {};
  const localTs = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
  const remoteTs = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
  if (localTs >= remoteTs) return { ...b, ...a };
  return { ...a, ...b };
}
