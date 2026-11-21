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
 * (e.g. 5MB+ phone/DSLR shots) to high-quality JPEGs (max 1600px) so they
 * render smoothly and store reliably across browser sessions.
 */
export function optimizeUploadedImage(
  file: File,
  maxDimension = 1600,
  quality = 0.85
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

          // Keep already small images crisp without unnecessary re-encoding
          const isSmallFile = file.size <= 300 * 1024 && Math.max(width, height) <= maxDimension;
          if (isSmallFile) {
            resolve(dataUrl);
            return;
          }

          let targetWidth = width;
          let targetHeight = height;

          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              targetWidth = maxDimension;
              targetHeight = Math.round((height / width) * maxDimension);
            } else {
              targetHeight = maxDimension;
              targetWidth = Math.round((width / height) * maxDimension);
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          const optimizedUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(optimizedUrl || dataUrl);
        } catch {
          resolve(dataUrl);
        }
      };

      img.onerror = () => {
        // Fallback to original data URL if browser image decoder skips a format
        resolve(dataUrl);
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}
