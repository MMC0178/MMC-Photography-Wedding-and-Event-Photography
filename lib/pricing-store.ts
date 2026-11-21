'use client';

import { useState, useEffect, useCallback } from 'react';
import { PricingPackage, PricingAddon, INITIAL_PRICING_PACKAGES, INITIAL_PRICING_ADDONS } from './wedding-data';

const PACKAGES_KEY = 'mmc_pricing_packages_v3';
const ADDONS_KEY = 'mmc_pricing_addons_v3';
const CHANGE_EVENT = 'mmc_pricing_updated';

export function getStoredPricing(): { packages: PricingPackage[]; addons: PricingAddon[] } {
  if (typeof window === 'undefined') {
    return { packages: INITIAL_PRICING_PACKAGES, addons: INITIAL_PRICING_ADDONS };
  }
  try {
    const rawPackages = localStorage.getItem(PACKAGES_KEY);
    const rawAddons = localStorage.getItem(ADDONS_KEY);
    const packages = rawPackages ? JSON.parse(rawPackages) : INITIAL_PRICING_PACKAGES;
    const addons = rawAddons ? JSON.parse(rawAddons) : INITIAL_PRICING_ADDONS;
    return {
      packages: Array.isArray(packages) && packages.length > 0 ? packages : INITIAL_PRICING_PACKAGES,
      addons: Array.isArray(addons) && addons.length > 0 ? addons : INITIAL_PRICING_ADDONS,
    };
  } catch (e) {
    console.error('Error reading pricing from localStorage', e);
    return { packages: INITIAL_PRICING_PACKAGES, addons: INITIAL_PRICING_ADDONS };
  }
}

export function savePricing(packages: PricingPackage[], addons: PricingAddon[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PACKAGES_KEY, JSON.stringify(packages));
    localStorage.setItem(ADDONS_KEY, JSON.stringify(addons));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch (e) {
    console.error('Error saving pricing to localStorage', e);
  }
}

export function updatePackage(id: string, updates: Partial<PricingPackage>): boolean {
  const { packages, addons } = getStoredPricing();
  const index = packages.findIndex(p => p.id === id);
  if (index === -1) return false;
  packages[index] = { ...packages[index], ...updates };
  savePricing([...packages], addons);
  return true;
}

export function updateAddon(id: string, updates: Partial<PricingAddon>): boolean {
  const { packages, addons } = getStoredPricing();
  const index = addons.findIndex(a => a.id === id);
  if (index === -1) return false;
  addons[index] = { ...addons[index], ...updates };
  savePricing(packages, [...addons]);
  return true;
}

export function resetPricingToDefaults(): void {
  savePricing(INITIAL_PRICING_PACKAGES, INITIAL_PRICING_ADDONS);
}

export function usePricing() {
  const [pricingData, setPricingData] = useState<{ packages: PricingPackage[]; addons: PricingAddon[] }>(getStoredPricing);

  const refresh = useCallback(() => {
    setPricingData(getStoredPricing());
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      refresh();
    };

    window.addEventListener(CHANGE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(CHANGE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refresh]);

  return {
    packages: pricingData.packages,
    addons: pricingData.addons,
    updatePackage,
    updateAddon,
    resetToDefaults: resetPricingToDefaults,
  };
}
