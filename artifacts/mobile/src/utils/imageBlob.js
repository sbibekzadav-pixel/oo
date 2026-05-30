import { Platform } from 'react-native';

/** Read a local or remote image URI as a Blob (works on native + web). */
export async function uriToBlob(uri) {
  if (!uri) throw new Error('Missing image URI');

  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    if (!res.ok) throw new Error('Could not read image file');
    return res.blob();
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.response) resolve(xhr.response);
      else reject(new Error('Could not read image file'));
    };
    xhr.onerror = () => reject(new Error('Could not read image file'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}
