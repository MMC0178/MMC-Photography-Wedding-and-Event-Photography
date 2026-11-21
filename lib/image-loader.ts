'use client';

import type { ImageLoaderProps } from 'next/image';

/**
 * Custom Next.js Image loader that serves Unsplash images directly via Unsplash's
 * global CDN (with dynamic width/quality optimization) and serves uploaded data/blob
 * URLs or custom remote URLs directly without depending on Hostinger's /_next/image proxy.
 */
export default function mmcImageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src) return '';

  if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/')) {
    return src;
  }

  try {
    const parsed = new URL(src);
    if (parsed.hostname === 'images.unsplash.com') {
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('w', String(Math.min(width || 1200, 1920)));
      parsed.searchParams.set('q', String(quality || 80));
      return parsed.toString();
    }
  } catch {
    // Return original src if URL parsing fails
  }

  return src;
}
