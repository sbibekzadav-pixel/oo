import { uriToBlob } from './imageBlob';

/** Encode a local image URI as a data URL for Realtime Database (size-limited). */
export async function uriToDataUrl(uri, maxBytes = 700_000) {
  const blob = await uriToBlob(uri);
  if (blob.size > maxBytes) {
    const maxKb = Math.round(maxBytes / 1024);
    throw new Error(`Image is too large (max ${maxKb}KB). Choose a smaller photo.`);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string' && result.startsWith('data:')) {
        resolve(result);
        return;
      }
      reject(new Error('Could not encode image'));
    };
    reader.onerror = () => reject(new Error('Could not encode image'));
    reader.readAsDataURL(blob);
  });
}
