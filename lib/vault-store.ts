'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  GuestVaultContent,
  VaultPhoto,
  INITIAL_VAULT_CONTENT,
  INITIAL_VAULT_PHOTOS,
} from './wedding-data';
import { idbGet, idbSet } from './studio-storage';

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

function saveAll(state: GuestVaultStoreState): void {
  hasMutated = true;
  cachedVaultState = state;
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new Event(CHANGE_EVENT));
  void idbSet(IDB_KEY, state);

  try {
    localStorage.setItem(VAULT_CONTENT_KEY, JSON.stringify(state.vaultContent));
    localStorage.setItem(VAULT_PHOTOS_KEY, JSON.stringify(state.vaultPhotos));
  } catch {
    // Ignore localStorage quota errors; IndexedDB holds full data
  }
}

export function updateVaultContent(updates: Partial<GuestVaultContent>): void {
  const current = getStoredVaultData();
  saveAll({
    ...current,
    vaultContent: { ...current.vaultContent, ...updates },
  });
}

export function addVaultPhoto(photo: Omit<VaultPhoto, 'id'>): VaultPhoto {
  const current = getStoredVaultData();
  const newPhoto: VaultPhoto = {
    ...photo,
    id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
  };
  saveAll({
    ...current,
    vaultPhotos: [newPhoto, ...current.vaultPhotos],
  });
  return newPhoto;
}

export function updateVaultPhoto(id: string, updates: Partial<VaultPhoto>): void {
  const current = getStoredVaultData();
  const updated = current.vaultPhotos.map(p => (p.id === id ? { ...p, ...updates } : p));
  saveAll({ ...current, vaultPhotos: updated });
}

export function deleteVaultPhoto(id: string): void {
  const current = getStoredVaultData();
  saveAll({
    ...current,
    vaultPhotos: current.vaultPhotos.filter(p => p.id !== id),
  });
}

export function resetVaultToDefaults(): void {
  saveAll(DEFAULT_VAULT_STATE);
}

export function useGuestVault() {
  const [data, setData] = useState<GuestVaultStoreState>(DEFAULT_VAULT_STATE);

  const refresh = useCallback(() => {
    setData(getStoredVaultData());
  }, []);

  useEffect(() => {
    let active = true;

    void idbGet<GuestVaultStoreState>(IDB_KEY).then(stored => {
      if (!active || hasMutated) return;
      if (stored && stored.vaultContent) {
        const normalized: GuestVaultStoreState = {
          vaultContent: { ...INITIAL_VAULT_CONTENT, ...stored.vaultContent },
          vaultPhotos: Array.isArray(stored.vaultPhotos)
            ? stored.vaultPhotos
            : INITIAL_VAULT_PHOTOS,
        };
        cachedVaultState = normalized;
        setData(normalized);
      } else {
        const local = readLocalVaultData();
        if (local !== DEFAULT_VAULT_STATE) {
          cachedVaultState = local;
          setData(local);
          void idbSet(IDB_KEY, local);
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
    vaultContent: data.vaultContent,
    vaultPhotos: data.vaultPhotos,
    updateVaultContent,
    addVaultPhoto,
    updateVaultPhoto,
    deleteVaultPhoto,
    resetToDefaults: resetVaultToDefaults,
  };
}
