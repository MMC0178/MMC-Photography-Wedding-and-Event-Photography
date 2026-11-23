'use client';

import { useState, useEffect, useCallback } from 'react';
import { GalleryPhoto, INITIAL_GALLERY_PHOTOS } from './wedding-data';
import { idbGet, idbSet } from './studio-storage';
import {
  subscribeGalleryPhotosCloud,
  syncGalleryPhotosToCloud,
  upsertSingleGalleryPhotoCloud,
  upsertGalleryPhotosBatchCloud,
  deleteGalleryPhotoCloud,
} from './studio-cloud-sync';

const STORAGE_KEY = 'mmc_gallery_photos_v3';
const CHANGE_EVENT = 'mmc_gallery_photos_updated';

let cachedPhotos: GalleryPhoto[] | null = null;
let hasMutated = false;

function readLocalGalleryPhotos(): GalleryPhoto[] {
  if (typeof window === 'undefined') {
    return INITIAL_GALLERY_PHOTOS;
  }
  if (cachedPhotos !== null) {
    return cachedPhotos;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedPhotos = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading gallery photos from localStorage', e);
  }
  return INITIAL_GALLERY_PHOTOS;
}

export function getStoredGalleryPhotos(): GalleryPhoto[] {
  return readLocalGalleryPhotos();
}

function persistLocally(photos: GalleryPhoto[], markMutated = true): void {
  if (markMutated) {
    hasMutated = true;
  }
  cachedPhotos = photos;
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new Event(CHANGE_EVENT));
  void idbSet(STORAGE_KEY, photos);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  } catch {
    // Ignore localStorage quota errors; IndexedDB & Firestore retain the full collection
  }
}

export function saveGalleryPhotos(photos: GalleryPhoto[]): void {
  persistLocally(photos, true);
  void syncGalleryPhotosToCloud(photos).catch(err => {
    console.error('Failed to sync gallery photos to cloud:', err);
  });
}

export function addGalleryPhoto(photoData: Omit<GalleryPhoto, 'id'>): GalleryPhoto {
  const current = getStoredGalleryPhotos();
  const newPhoto: GalleryPhoto = {
    ...photoData,
    id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
  const updated = [newPhoto, ...current];
  persistLocally(updated, true);
  void upsertSingleGalleryPhotoCloud(newPhoto).catch(err => {
    console.error('Failed to sync new gallery photo to cloud:', err);
  });
  return newPhoto;
}

export function addGalleryPhotosBatch(photosData: Array<Omit<GalleryPhoto, 'id'>>): GalleryPhoto[] {
  if (photosData.length === 0) return [];
  const current = getStoredGalleryPhotos();
  const now = Date.now();
  const created: GalleryPhoto[] = photosData.map((photoData, idx) => ({
    ...photoData,
    id: `photo-${now + idx}-${Math.random().toString(36).substring(2, 6)}`,
  }));
  const updated = [...created, ...current];
  persistLocally(updated, true);
  void upsertGalleryPhotosBatchCloud(created).catch(err => {
    console.error('Failed to sync uploaded gallery photos to cloud:', err);
  });
  return created;
}

export function deleteGalleryPhoto(id: string): boolean {
  const current = getStoredGalleryPhotos();
  const filtered = current.filter(p => p.id !== id);
  persistLocally(filtered, true);
  void deleteGalleryPhotoCloud(id).catch(err => {
    console.error('Failed to delete gallery photo from cloud:', err);
  });
  return true;
}

export function resetGalleryPhotosToDefaults(): void {
  saveGalleryPhotos(INITIAL_GALLERY_PHOTOS);
}

export function useGalleryPhotos() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(INITIAL_GALLERY_PHOTOS);

  const refresh = useCallback(() => {
    setPhotos(getStoredGalleryPhotos());
  }, []);

  useEffect(() => {
    let active = true;
    let receivedCloudData = false;

    void idbGet<GalleryPhoto[]>(STORAGE_KEY).then(stored => {
      if (!active || hasMutated || receivedCloudData) return;
      if (Array.isArray(stored) && stored.length > 0) {
        cachedPhotos = stored;
        setPhotos(stored);
      } else {
        const local = readLocalGalleryPhotos();
        if (local !== INITIAL_GALLERY_PHOTOS) {
          cachedPhotos = local;
          setPhotos(local);
          void idbSet(STORAGE_KEY, local);
        }
      }
    });

    const unsubCloud = subscribeGalleryPhotosCloud(cloudPhotos => {
      if (!active) return;
      receivedCloudData = true;
      persistLocally(cloudPhotos, false);
      setPhotos(cloudPhotos);
    });

    const handleUpdate = () => {
      refresh();
    };

    window.addEventListener(CHANGE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      active = false;
      unsubCloud();
      window.removeEventListener(CHANGE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refresh]);

  return {
    photos,
    addPhoto: addGalleryPhoto,
    deletePhoto: deleteGalleryPhoto,
    resetToDefaults: resetGalleryPhotosToDefaults,
  };
}
