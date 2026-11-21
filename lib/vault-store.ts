'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  GuestVaultContent,
  VaultPhoto,
  INITIAL_VAULT_CONTENT,
  INITIAL_VAULT_PHOTOS,
} from './wedding-data';
import { idbGet, idbSet } from './studio-storage';
import {
  subscribeVaultCloud,
  syncVaultContentToCloud,
  syncVaultContentToCloudDebounced,
  syncVaultPhotosToCloud,
  syncVaultPhotosToCloudDebounced,
} from './studio-cloud-sync';

const VAULT_CONTENT_KEY = 'mmc_vault_content_v1';
const VAULT_PHOTOS_KEY = 'mmc_vault_photos_v1';
const IDB_KEY = 'mmc_vault_bundle_v1';
const CHANGE_EVENT = 'mmc_vault_updated';

export interface GuestVaultStoreState {
  vaultContent: GuestVaultContent;
  vaultPhotos: VaultPhoto[];
}

const DEFAULT_VAULT_STATE: GuestVaultStoreState = {
  vaultContent: INITIAL_VAULT_CONTENT,
  vaultPhotos: INITIAL_VAULT_PHOTOS,
};

let cachedVaultState: GuestVaultStoreState | null = null;
let hasMutated = false;

function readLocalVaultData(): GuestVaultStoreState {
  if (typeof window === 'undefined') {
    return DEFAULT_VAULT_STATE;
  }
  if (cachedVaultState !== null) {
    return cachedVaultState;
  }
  try {
    const rawContent = localStorage.getItem(VAULT_CONTENT_KEY);
    const rawPhotos = localStorage.getItem(VAULT_PHOTOS_KEY);

    if (!rawContent && !rawPhotos) {
      return DEFAULT_VAULT_STATE;
    }

    const vaultContent = rawContent
      ? { ...INITIAL_VAULT_CONTENT, ...JSON.parse(rawContent) }
      : INITIAL_VAULT_CONTENT;
    const vaultPhotos = rawPhotos ? JSON.parse(rawPhotos) : INITIAL_VAULT_PHOTOS;

    const loaded: GuestVaultStoreState = {
      vaultContent,
      vaultPhotos: Array.isArray(vaultPhotos) ? vaultPhotos : INITIAL_VAULT_PHOTOS,
    };
    cachedVaultState = loaded;
    return loaded;
  } catch (e) {
    console.warn('Error reading guest vault data from localStorage', e);
    return DEFAULT_VAULT_STATE;
  }
}

export function getStoredVaultData(): GuestVaultStoreState {
  return readLocalVaultData();
}

function saveAllLocally(state: GuestVaultStoreState, markMutated = true): void {
  if (markMutated) {
    hasMutated = true;
  }
  cachedVaultState = state;
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new Event(CHANGE_EVENT));
  void idbSet(IDB_KEY, state);

  try {
    localStorage.setItem(VAULT_CONTENT_KEY, JSON.stringify(state.vaultContent));
    localStorage.setItem(VAULT_PHOTOS_KEY, JSON.stringify(state.vaultPhotos));
  } catch {
    // Ignore localStorage quota errors; IndexedDB & Firestore hold full data
  }
}

export function updateVaultContent(updates: Partial<GuestVaultContent>): void {
  const current = getStoredVaultData();
  const nextVault = { ...current.vaultContent, ...updates };
  saveAllLocally({ ...current, vaultContent: nextVault }, true);
  syncVaultContentToCloudDebounced(nextVault);
}

export function addVaultPhoto(photo: Omit<VaultPhoto, 'id'>): VaultPhoto {
  const current = getStoredVaultData();
  const newPhoto: VaultPhoto = {
    ...photo,
    id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
  };
  const nextPhotos = [newPhoto, ...current.vaultPhotos];
  saveAllLocally({ ...current, vaultPhotos: nextPhotos }, true);
  void syncVaultPhotosToCloud(nextPhotos).catch(err =>
    console.error('Failed to sync vault photos to cloud:', err)
  );
  return newPhoto;
}

export function updateVaultPhoto(id: string, updates: Partial<VaultPhoto>): void {
  const current = getStoredVaultData();
  const updated = current.vaultPhotos.map(p => (p.id === id ? { ...p, ...updates } : p));
  saveAllLocally({ ...current, vaultPhotos: updated }, true);
  if (typeof updates.url === 'string') {
    void syncVaultPhotosToCloud(updated).catch(err =>
      console.error('Failed to sync vault photo update to cloud:', err)
    );
  } else {
    syncVaultPhotosToCloudDebounced(updated);
  }
}

export function deleteVaultPhoto(id: string): void {
  const current = getStoredVaultData();
  const filtered = current.vaultPhotos.filter(p => p.id !== id);
  saveAllLocally({ ...current, vaultPhotos: filtered }, true);
  void syncVaultPhotosToCloud(filtered).catch(err =>
    console.error('Failed to sync vault photo deletion to cloud:', err)
  );
}

export function resetVaultToDefaults(): void {
  saveAllLocally(DEFAULT_VAULT_STATE, true);
  void Promise.all([
    syncVaultContentToCloud(DEFAULT_VAULT_STATE.vaultContent),
    syncVaultPhotosToCloud(DEFAULT_VAULT_STATE.vaultPhotos),
  ]).catch(err => console.error('Failed to reset vault in cloud:', err));
}

export function useGuestVault() {
  const [data, setData] = useState<GuestVaultStoreState>(DEFAULT_VAULT_STATE);

  const refresh = useCallback(() => {
    setData(getStoredVaultData());
  }, []);

  useEffect(() => {
    let active = true;
    let receivedCloudContent = false;
    let receivedCloudPhotos = false;

    void idbGet<GuestVaultStoreState>(IDB_KEY).then(stored => {
      if (!active || hasMutated) return;
      const base = cachedVaultState || DEFAULT_VAULT_STATE;
      if (stored && stored.vaultContent) {
        const normalized: GuestVaultStoreState = {
          vaultContent: receivedCloudContent
            ? base.vaultContent
            : { ...INITIAL_VAULT_CONTENT, ...stored.vaultContent },
          vaultPhotos: receivedCloudPhotos
            ? base.vaultPhotos
            : Array.isArray(stored.vaultPhotos)
              ? stored.vaultPhotos
              : INITIAL_VAULT_PHOTOS,
        };
        cachedVaultState = normalized;
        setData(normalized);
      } else {
        const local = readLocalVaultData();
        if (local !== DEFAULT_VAULT_STATE && !receivedCloudContent) {
          cachedVaultState = local;
          setData(local);
          void idbSet(IDB_KEY, local);
        }
      }
    });

    const unsubCloud = subscribeVaultCloud({
      onVaultContent: cloudContent => {
        if (!active) return;
        receivedCloudContent = true;
        const next: GuestVaultStoreState = {
          ...getStoredVaultData(),
          vaultContent: cloudContent,
        };
        saveAllLocally(next, false);
        setData(next);
      },
      onVaultPhotos: cloudPhotos => {
        if (!active) return;
        receivedCloudPhotos = true;
        const next: GuestVaultStoreState = {
          ...getStoredVaultData(),
          vaultPhotos: cloudPhotos,
        };
        saveAllLocally(next, false);
        setData(next);
      },
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
    vaultContent: data.vaultContent,
    vaultPhotos: data.vaultPhotos,
    updateVaultContent,
    addVaultPhoto,
    updateVaultPhoto,
    deleteVaultPhoto,
    resetToDefaults: resetVaultToDefaults,
  };
}
