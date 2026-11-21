'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeaturedWedding, FeaturedWeddingPhoto, INITIAL_FEATURED_WEDDINGS } from './wedding-data';
import { idbGet, idbSet } from './studio-storage';

const STORAGE_KEY = 'mmc_featured_weddings_v3';
const CHANGE_EVENT = 'mmc_featured_weddings_updated';

let cachedWeddings: FeaturedWedding[] | null = null;
let hasMutated = false;

function readLocalFeaturedWeddings(): FeaturedWedding[] {
  if (typeof window === 'undefined') {
    return INITIAL_FEATURED_WEDDINGS;
  }
  if (cachedWeddings !== null) {
    return cachedWeddings;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sliced = parsed.slice(0, 3);
        cachedWeddings = sliced;
        return sliced;
      }
    }
  } catch (e) {
    console.warn('Error reading featured weddings from localStorage', e);
  }
  return INITIAL_FEATURED_WEDDINGS;
}

export function getStoredFeaturedWeddings(): FeaturedWedding[] {
  return readLocalFeaturedWeddings();
}

export function saveFeaturedWeddings(weddings: FeaturedWedding[]): void {
  hasMutated = true;
  const sliced = weddings.slice(0, 3);
  cachedWeddings = sliced;
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new Event(CHANGE_EVENT));
  void idbSet(STORAGE_KEY, sliced);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sliced));
  } catch {
    // Ignore localStorage quota errors; IndexedDB retains the full dataset
  }
}

export function updateFeaturedWedding(id: string, updates: Partial<FeaturedWedding>): boolean {
  const current = getStoredFeaturedWeddings();
  const index = current.findIndex(w => w.id === id);
  if (index === -1) return false;
  const next = current.map((w, i) => (i === index ? { ...w, ...updates } : w));
  saveFeaturedWeddings(next);
  return true;
}

export function addPhotoToFeaturedWedding(weddingId: string, photo: { url: string; caption: string }): boolean {
  const current = getStoredFeaturedWeddings();
  const index = current.findIndex(w => w.id === weddingId);
  if (index === -1) return false;
  const newPhoto: FeaturedWeddingPhoto = {
    id: `fwp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    url: photo.url,
    caption: photo.caption || '',
  };
  const next = current.map((w, i) =>
    i === index ? { ...w, photos: [newPhoto, ...w.photos] } : w
  );
  saveFeaturedWeddings(next);
  return true;
}

export function removePhotoFromFeaturedWedding(weddingId: string, photoId: string): boolean {
  const current = getStoredFeaturedWeddings();
  const index = current.findIndex(w => w.id === weddingId);
  if (index === -1) return false;
  const next = current.map((w, i) =>
    i === index ? { ...w, photos: w.photos.filter(p => p.id !== photoId) } : w
  );
  saveFeaturedWeddings(next);
  return true;
}

export function resetFeaturedWeddingsToDefaults(): void {
  saveFeaturedWeddings(INITIAL_FEATURED_WEDDINGS);
}

export function useFeaturedWeddings() {
  const [featuredWeddings, setFeaturedWeddings] = useState<FeaturedWedding[]>(INITIAL_FEATURED_WEDDINGS);

  const refresh = useCallback(() => {
    setFeaturedWeddings(getStoredFeaturedWeddings());
  }, []);

  useEffect(() => {
    let active = true;

    void idbGet<FeaturedWedding[]>(STORAGE_KEY).then(stored => {
      if (!active || hasMutated) return;
      if (Array.isArray(stored) && stored.length > 0) {
        const sliced = stored.slice(0, 3);
        cachedWeddings = sliced;
        setFeaturedWeddings(sliced);
      } else {
        const local = readLocalFeaturedWeddings();
        if (local !== INITIAL_FEATURED_WEDDINGS) {
          cachedWeddings = local;
          setFeaturedWeddings(local);
          void idbSet(STORAGE_KEY, local);
        }
      }
    });

    const handleUpdate = () => {
      refresh();
    };

    window.addEventListener(CHANGE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      active = false;
      window.removeEventListener(CHANGE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refresh]);

  return {
    featuredWeddings,
    updateWedding: updateFeaturedWedding,
    addPhotoToWedding: addPhotoToFeaturedWedding,
    removePhotoFromWedding: removePhotoFromFeaturedWedding,
    resetToDefaults: resetFeaturedWeddingsToDefaults,
  };
}
