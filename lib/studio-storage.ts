'use client';

const DB_NAME = 'mmc_photography_studio_db';
const DB_VERSION = 1;
const STORE_NAME = 'studio_kv';

function openStudioDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise(resolve => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('IndexedDB unavailable, falling back cleanly:', request.error);
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

export async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openStudioDb();
  if (!db) return null;

  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        resolve((req.result as T | undefined) ?? null);
      };
      req.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

export async function idbSet<T>(key: string, value: T): Promise<boolean> {
  const db = await openStudioDb();
  if (!db) return false;

  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Reads a user-uploaded image file and optimizes/resizes large photographs
 * (e.g. 5MB+ phone/DSLR shots) to crisp JPEGs sized safely for fast page loads
 * and Cloud Firestore storage.
 */
export function optimizeUploadedImage(
  file: File,
  maxDimension = 1280,
  quality = 0.8,
  maxChars = 380000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Could not read the selected image file.'));
    };

    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        reject(new Error('Selected file returned empty image data.'));
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        try {
          const { naturalWidth: width, naturalHeight: height } = img;
          if (!width || !height) {
            resolve(dataUrl);
            return;
          }

          if (dataUrl.length <= maxChars && Math.max(width, height) <= maxDimension) {
            resolve(dataUrl);
            return;
          }

          const renderAt = (dim: number, q: number): string => {
            let targetWidth = width;
            let targetHeight = height;

            if (width > dim || height > dim) {
              if (width >= height) {
                targetWidth = dim;
                targetHeight = Math.round((height / width) * dim);
              } else {
                targetHeight = dim;
                targetWidth = Math.round((width / height) * dim);
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) return dataUrl;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            return canvas.toDataURL('image/jpeg', q) || dataUrl;
          };

          const attempts: Array<[number, number]> = [
            [maxDimension, quality],
            [Math.min(maxDimension, 1080), 0.72],
            [Math.min(maxDimension, 900), 0.65],
            [720, 0.58],
          ];

          let result = dataUrl;
          for (const [dim, q] of attempts) {
            result = renderAt(dim, q);
            if (result.length <= maxChars) {
              break;
            }
          }

          resolve(result);
        } catch {
          resolve(dataUrl);
        }
      };

      img.onerror = () => {
        resolve(dataUrl);
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Ensures an existing data:image/... URL (e.g. uploaded prior to size limits)
 * fits cleanly within Firestore document byte budgets without corrupting base64.
 */
export function compressDataUrlIfNeeded(
  url: string,
  maxChars = 350000
): Promise<string> {
  if (
    typeof window === 'undefined' ||
    !url ||
    !url.startsWith('data:image/') ||
    url.length <= maxChars
  ) {
    return Promise.resolve(url);
  }

  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      try {
        const { naturalWidth: width, naturalHeight: height } = img;
        if (!width || !height) {
          resolve(url);
          return;
        }

        const renderAt = (dim: number, q: number): string => {
          let targetWidth = width;
          let targetHeight = height;

          if (width > dim || height > dim) {
            if (width >= height) {
              targetWidth = dim;
              targetHeight = Math.round((height / width) * dim);
            } else {
              targetHeight = dim;
              targetWidth = Math.round((width / height) * dim);
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) return url;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          return canvas.toDataURL('image/jpeg', q) || url;
        };

        const attempts: Array<[number, number]> = [
          [1200, 0.75],
          [1000, 0.68],
          [850, 0.6],
          [680, 0.52],
          [520, 0.45],
        ];

        let result = url;
        for (const [dim, q] of attempts) {
          result = renderAt(dim, q);
          if (result.length <= maxChars) {
            break;
          }
        }
        resolve(result);
      } catch {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

