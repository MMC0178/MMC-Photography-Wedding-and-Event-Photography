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

type DrawableSource = {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
};

async function decodeBlobToDrawable(blob: Blob): Promise<DrawableSource> {
  // 1. Prefer createImageBitmap — decodes large DSLR files off-thread, respects EXIF orientation, and avoids huge data: URL limits
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob);
      if (bitmap.width > 0 && bitmap.height > 0) {
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          cleanup: () => {
            try {
              bitmap.close();
            } catch {
              // ignore
            }
          },
        };
      }
      bitmap.close();
    } catch {
      // Fall through to object URL Image element decoding
    }
  }

  // 2. Fallback: URL.createObjectURL + HTMLImageElement (handles formats without giant base64 strings)
  return new Promise<DrawableSource>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new window.Image();

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (!width || !height) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Image has invalid dimensions.'));
        return;
      }
      resolve({
        source: img,
        width,
        height,
        cleanup: () => URL.revokeObjectURL(objectUrl),
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          'Could not decode this image file. Please upload a standard JPG, PNG, or WebP photograph (HEIC/RAW files must be converted to JPG first).'
        )
      );
    };

    img.src = objectUrl;
  });
}

function encodeDrawableToJpegBudget(
  drawable: DrawableSource,
  maxDimension: number,
  quality: number,
  maxChars: number
): string {
  const { source, width, height } = drawable;

  const renderAt = (dim: number, q: number): string => {
    let targetWidth = width;
    let targetHeight = height;

    if (width > dim || height > dim) {
      if (width >= height) {
        targetWidth = dim;
        targetHeight = Math.max(1, Math.round((height / width) * dim));
      } else {
        targetHeight = dim;
        targetWidth = Math.max(1, Math.round((width / height) * dim));
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser image processor (canvas) is unavailable.');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
    const encoded = canvas.toDataURL('image/jpeg', q);
    if (!encoded || !encoded.startsWith('data:image/jpeg')) {
      throw new Error('Could not encode image as JPEG.');
    }
    return encoded;
  };

  const attempts: Array<[number, number]> = [
    [maxDimension, quality],
    [Math.min(maxDimension, 1100), Math.min(quality, 0.74)],
    [Math.min(maxDimension, 960), 0.68],
    [820, 0.6],
    [680, 0.54],
    [540, 0.48],
    [420, 0.42],
  ];

  let result = '';
  for (const [dim, q] of attempts) {
    result = renderAt(dim, q);
    if (result.length <= maxChars) {
      return result;
    }
  }

  return result;
}

/**
 * Reads a user-uploaded image file and optimizes/resizes large photographs
 * (e.g. 5MB–25MB DSLR/phone shots) to crisp JPEGs guaranteed to fit cleanly
 * inside Cloud Firestore document byte limits without ever truncating base64.
 */
export async function optimizeUploadedImage(
  file: File,
  maxDimension = 1280,
  quality = 0.8,
  maxChars = 240000
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Image upload is only supported in the browser.');
  }

  const lowerName = (file.name || '').toLowerCase();
  if (
    lowerName.endsWith('.heic') ||
    lowerName.endsWith('.heif') ||
    lowerName.endsWith('.cr2') ||
    lowerName.endsWith('.nef') ||
    lowerName.endsWith('.arw') ||
    lowerName.endsWith('.dng')
  ) {
    throw new Error(
      `Unsupported camera format (${file.name}). Please export or save the photo as a JPG or PNG first.`
    );
  }

  const drawable = await decodeBlobToDrawable(file);
  try {
    return encodeDrawableToJpegBudget(drawable, maxDimension, quality, maxChars);
  } finally {
    drawable.cleanup();
  }
}

/**
 * Ensures an existing data:image/... URL (e.g. uploaded prior to size limits)
 * fits cleanly within Firestore document byte budgets without corrupting base64.
 */
export async function compressDataUrlIfNeeded(
  url: string,
  maxChars = 240000
): Promise<string> {
  if (
    typeof window === 'undefined' ||
    !url ||
    !url.startsWith('data:image/') ||
    url.length <= maxChars
  ) {
    return url;
  }

  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const drawable = await decodeBlobToDrawable(blob);
    try {
      return encodeDrawableToJpegBudget(drawable, 1100, 0.72, maxChars);
    } finally {
      drawable.cleanup();
    }
  } catch {
    return url;
  }
}
