'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  type Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { compressDataUrlIfNeeded, idbGet } from './studio-storage';
import {
  auth,
  db,
  isAuthorizedStudioUser,
  handleFirestoreError,
  OperationType,
  clampStr,
  sanitizeDocId,
  serverTimestamp,
} from './firebase';
import {
  AboutContent,
  BlogPost,
  FaqItem,
  FeaturedWedding,
  FeaturedWeddingPhoto,
  GalleryPhoto,
  GuestVaultContent,
  INITIAL_ABOUT_CONTENT,
  INITIAL_PRICING_PACKAGES,
  INITIAL_VAULT_CONTENT,
  PricingPackage,
  Review,
  VaultPhoto,
} from './wedding-data';

const VALID_GALLERY_CATEGORIES = new Set<GalleryPhoto['category']>([
  'bridal-prep',
  'ceremony',
  'on-location',
  'reception',
  'dancing',
]);

const WRITE_TIMEOUT_MS = 12000;
const WRITE_CONCURRENCY = 5;

function canWriteCloud(): boolean {
  return isAuthorizedStudioUser(auth.currentUser);
}

function withTimeout<T>(promise: Promise<T>, label: string, ms = WRITE_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `Timed out while ${label}. Your Firebase Firestore daily free-tier quota may be exhausted, or the connection was interrupted.`
        )
      );
    }, ms);
    promise.then(
      val => {
        clearTimeout(timer);
        resolve(val);
      },
      err => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// Debounce timers for rapid typing updates
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleDebouncedWrite(key: string, fn: () => Promise<void>, delayMs = 700) {
  const existingTimer = debounceTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }
  const timer = setTimeout(() => {
    debounceTimers.delete(key);
    void fn().catch(err => {
      console.error(`Cloud sync error (${key}):`, err);
    });
  }, delayMs);
  debounceTimers.set(key, timer);
}

// --- Payload sanitizers (strictly synced with firebase-blueprint.json & firestore.rules) ---

function buildAboutPayload(about: AboutContent) {
  return {
    homepageHeroImage: clampStr(about.homepageHeroImage || INITIAL_ABOUT_CONTENT.homepageHeroImage, 450000),
    homepageTitle: clampStr(about.homepageTitle, 200),
    homepageText: clampStr(about.homepageText, 4000),
    homepageImage: clampStr(about.homepageImage || INITIAL_ABOUT_CONTENT.homepageImage, 450000),
    heroKicker: clampStr(about.heroKicker, 200),
    heroHeadline: clampStr(about.heroHeadline, 300),
    heroQuote: clampStr(about.heroQuote, 1500),
    storyImage: clampStr(about.storyImage || INITIAL_ABOUT_CONTENT.storyImage, 450000),
    storyTitle: clampStr(about.storyTitle, 200),
    storyParagraphs: (Array.isArray(about.storyParagraphs) ? about.storyParagraphs : [])
      .slice(0, 30)
      .map(p => clampStr(p, 2000)),
    coreValues: (Array.isArray(about.coreValues) ? about.coreValues : [])
      .slice(0, 12)
      .map(v => ({
        id: sanitizeDocId(v.id || 'val'),
        title: clampStr(v.title, 200),
        description: clampStr(v.description, 1000),
      })),
    updatedAt: serverTimestamp(),
  };
}

function buildVaultConfigPayload(vault: GuestVaultContent) {
  return {
    badgeLabel: clampStr(vault.badgeLabel, 200),
    pageTitle: clampStr(vault.pageTitle, 200),
    pageSubtitle: clampStr(vault.pageSubtitle, 2000),
    coupleName: clampStr(vault.coupleName, 200),
    weddingDate: clampStr(vault.weddingDate, 200),
    streamTitle: clampStr(vault.streamTitle, 200),
    streamSubtitle: clampStr(vault.streamSubtitle, 2000),
    privacyBadgeText: clampStr(vault.privacyBadgeText, 300),
    howItWorksSteps: (Array.isArray(vault.howItWorksSteps) ? vault.howItWorksSteps : [])
      .slice(0, 6)
      .map(s => ({
        id: sanitizeDocId(s.id || 'step'),
        title: clampStr(s.title, 200),
        description: clampStr(s.description, 1000),
      })),
    updatedAt: serverTimestamp(),
  };
}

function buildPricingPayload(packages: PricingPackage[]) {
  return {
    packages: (Array.isArray(packages) ? packages : []).slice(0, 10).map(pkg => ({
      id: sanitizeDocId(pkg.id || 'pkg'),
      name: clampStr(pkg.name, 200),
      tagline: clampStr(pkg.tagline, 400),
      price: clampStr(pkg.price, 80),
      hours: clampStr(pkg.hours, 120),
      popular: Boolean(pkg.popular),
      includesVault: Boolean(pkg.includesVault),
      features: (Array.isArray(pkg.features) ? pkg.features : [])
        .slice(0, 40)
        .map(f => clampStr(f, 400)),
    })),
    updatedAt: serverTimestamp(),
  };
}

function buildGalleryPhotoPayload(photo: GalleryPhoto, sortOrder: number) {
  const id = sanitizeDocId(photo.id);
  const category = VALID_GALLERY_CATEGORIES.has(photo.category)
    ? photo.category
    : 'bridal-prep';
  return {
    id,
    url: clampStr(photo.url, 750000),
    title: clampStr(photo.title, 200),
    caption: clampStr(photo.caption, 1000),
    category,
    sortOrder,
    updatedAt: serverTimestamp(),
  };
}

function buildFeaturedWeddingPayload(wedding: FeaturedWedding, sortOrder: number) {
  const id = sanitizeDocId(wedding.id);
  return {
    id,
    couple: clampStr(wedding.couple, 200),
    date: clampStr(wedding.date, 120),
    venue: clampStr(wedding.venue, 200),
    location: clampStr(wedding.location, 200),
    coverImage: clampStr(wedding.coverImage, 750000),
    story: clampStr(wedding.story, 5000),
    highlightQuote: clampStr(wedding.highlightQuote, 1000),
    sortOrder,
    updatedAt: serverTimestamp(),
  };
}

function buildFeaturedWeddingPhotoPayload(
  weddingId: string,
  photo: FeaturedWeddingPhoto,
  sortOrder: number
) {
  const id = sanitizeDocId(photo.id);
  const cleanWeddingId = sanitizeDocId(weddingId);
  return {
    id,
    weddingId: cleanWeddingId,
    url: clampStr(photo.url, 750000),
    caption: clampStr(photo.caption, 1000),
    sortOrder,
    updatedAt: serverTimestamp(),
  };
}

function buildFaqPayload(faq: FaqItem, sortOrder: number) {
  const id = sanitizeDocId(faq.id);
  return {
    id,
    q: clampStr(faq.q || 'Question', 500),
    a: clampStr(faq.a || 'Answer', 3000),
    sortOrder,
    updatedAt: serverTimestamp(),
  };
}

function buildReviewPayload(review: Review, sortOrder: number) {
  const id = sanitizeDocId(review.id);
  const rating = Math.min(5, Math.max(1, Number(review.rating) || 5));
  return {
    id,
    couple: clampStr(review.couple || 'Happy Couple', 200),
    date: clampStr(review.date, 120),
    venue: clampStr(review.venue, 200),
    rating,
    snippet: clampStr(review.snippet, 1000),
    fullReview: clampStr(review.fullReview || review.snippet || 'Wonderful experience.', 5000),
    highlight: clampStr(review.highlight, 400),
    sortOrder,
    updatedAt: serverTimestamp(),
  };
}

function buildBlogPostPayload(post: BlogPost, sortOrder: number) {
  const id = sanitizeDocId(post.id);
  return {
    id,
    slug: clampStr(post.slug || id, 200),
    title: clampStr(post.title || 'Wedding Journal', 300),
    date: clampStr(post.date, 120),
    category: clampStr(post.category, 120),
    readTime: clampStr(post.readTime, 60),
    coverImage: clampStr(post.coverImage, 750000),
    excerpt: clampStr(post.excerpt, 1000),
    content: (Array.isArray(post.content) ? post.content : [])
      .slice(0, 50)
      .map(p => clampStr(p, 4000)),
    sortOrder,
    updatedAt: serverTimestamp(),
  };
}

function buildVaultPhotoPayload(photo: VaultPhoto, sortOrder: number) {
  const id = sanitizeDocId(photo.id);
  return {
    id,
    guestName: clampStr(photo.guestName || 'Wedding Guest', 200),
    table: clampStr(photo.table, 120),
    note: clampStr(photo.note, 1000),
    time: clampStr(photo.time, 120),
    url: clampStr(photo.url, 750000),
    sortOrder,
    updatedAt: serverTimestamp(),
  };
}

// --- Version-Checked Cloud Hydration (Instant Live Updates + Minimal Read Units) ---

const SECTION_VERSIONS_KEY = 'mmc_cloud_section_versions_v2';

const inFlightHydrations = new Set<string>();
const completedHydrationsThisLoad = new Set<string>();
let quotaExceededThisLoad = false;

interface CloudManifestResult {
  versionMs: number;
  packages: PricingPackage[] | null;
  failed: boolean;
}

let manifestPromiseThisLoad: Promise<CloudManifestResult> | null = null;

function isQuotaExceededError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('resource-exhausted')
  );
}

function getStoredSectionVersion(section: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(SECTION_VERSIONS_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as Record<string, number>;
    return typeof parsed[section] === 'number' ? parsed[section] : 0;
  } catch {
    return 0;
  }
}

function setStoredSectionVersion(section: string, versionMs: number): void {
  completedHydrationsThisLoad.add(section);
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(SECTION_VERSIONS_KEY);
    const parsed: Record<string, number> = raw ? JSON.parse(raw) : {};
    parsed[section] = versionMs > 0 ? versionMs : Date.now();
    localStorage.setItem(SECTION_VERSIONS_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage errors
  }
}

export function clearLocalCloudVersionCache(): void {
  completedHydrationsThisLoad.clear();
  manifestPromiseThisLoad = null;
  quotaExceededThisLoad = false;
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SECTION_VERSIONS_KEY);
    localStorage.removeItem('mmc_cloud_sync_ts_v1');
  } catch {
    // Ignore storage errors
  }
}

/**
 * Reads the tiny (~5 KB / 2 read units) `studioConfig/pricing` doc once per page load.
 * Its `updatedAt` timestamp acts as the live publish version:
 * - If Michael published ANY new photo or edit, `versionMs` is newer -> every visitor immediately pulls fresh cloud data!
 * - If nothing changed since the visitor's last visit and IndexedDB already has the photos -> 0 heavy photo reads!
 */
function getCloudManifestOnce(): Promise<CloudManifestResult> {
  if (manifestPromiseThisLoad) {
    return manifestPromiseThisLoad;
  }

  manifestPromiseThisLoad = (async () => {
    try {
      const snap = await getDoc(doc(db, 'studioConfig', 'pricing'));
      if (!snap.exists()) {
        return { versionMs: 0, packages: null, failed: false };
      }
      const data = snap.data();
      const updatedAt = data.updatedAt as Timestamp | undefined;
      const versionMs =
        updatedAt && typeof updatedAt.toMillis === 'function' ? updatedAt.toMillis() : 0;
      const packages =
        Array.isArray(data.packages) && data.packages.length > 0
          ? (data.packages as PricingPackage[])
          : null;
      return { versionMs, packages, failed: false };
    } catch (error) {
      if (isQuotaExceededError(error)) {
        quotaExceededThisLoad = true;
      }
      try {
        handleFirestoreError(error, OperationType.GET, 'studioConfig/pricing');
      } catch {
        // Logged via handleFirestoreError
      }
      return { versionMs: 0, packages: null, failed: true };
    }
  })();

  return manifestPromiseThisLoad;
}

async function resolveHydrationDecision(
  section: string,
  hasLocalCachedValue: () => Promise<boolean>
): Promise<{ skip: boolean; cloudVersionMs: number }> {
  if (quotaExceededThisLoad) return { skip: true, cloudVersionMs: 0 };
  if (inFlightHydrations.has(section) || completedHydrationsThisLoad.has(section)) {
    return { skip: true, cloudVersionMs: 0 };
  }

  const manifest = await getCloudManifestOnce();
  if (manifest.failed || quotaExceededThisLoad) {
    return { skip: true, cloudVersionMs: 0 };
  }

  const storedVersion = getStoredSectionVersion(section);
  // Skip heavy collection download ONLY when cloud version matches our already-cached local version
  if (manifest.versionMs > 0 && storedVersion >= manifest.versionMs) {
    try {
      if (await hasLocalCachedValue()) {
        completedHydrationsThisLoad.add(section);
        return { skip: true, cloudVersionMs: manifest.versionMs };
      }
    } catch {
      // Proceed to fetch from cloud if local check fails
    }
  }

  return { skip: false, cloudVersionMs: manifest.versionMs };
}

export function subscribeGalleryPhotosCloud(
  onData: (photos: GalleryPhoto[]) => void
): () => void {
  let active = true;
  const colPath = 'galleryPhotos';
  const section = 'galleryPhotos';

  void (async () => {
    const { skip, cloudVersionMs } = await resolveHydrationDecision(section, async () => {
      const stored = await idbGet<GalleryPhoto[]>('mmc_gallery_photos_v3');
      return Array.isArray(stored) && stored.length > 0;
    });
    if (!active || skip) return;

    inFlightHydrations.add(section);
    try {
      const q = query(collection(db, colPath), orderBy('sortOrder', 'asc'));
      const snap = await getDocs(q);
      if (!active) return;
      if (!snap.empty) {
        const items: GalleryPhoto[] = snap.docs
          .map(d => {
            const data = d.data();
            return {
              id: String(data.id || d.id),
              url: String(data.url || ''),
              title: String(data.title || ''),
              caption: String(data.caption || ''),
              category: VALID_GALLERY_CATEGORIES.has(data.category)
                ? data.category
                : 'bridal-prep',
            };
          })
          .filter(item => item.url.trim().length > 0);
        if (items.length > 0) {
          onData(items);
        }
      }
      setStoredSectionVersion(section, cloudVersionMs);
    } catch (error) {
      if (isQuotaExceededError(error)) {
        quotaExceededThisLoad = true;
      }
      try {
        handleFirestoreError(error, OperationType.LIST, colPath);
      } catch {
        // Logged via handleFirestoreError; retain cached/initial UI
      }
    } finally {
      inFlightHydrations.delete(section);
    }
  })();

  return () => {
    active = false;
  };
}

export function subscribeFeaturedWeddingsCloud(
  onData: (weddings: FeaturedWedding[]) => void
): () => void {
  let active = true;
  const colPath = 'featuredWeddings';
  const section = 'featuredWeddings';

  void (async () => {
    const { skip, cloudVersionMs } = await resolveHydrationDecision(section, async () => {
      const stored = await idbGet<FeaturedWedding[]>('mmc_featured_weddings_v3');
      return Array.isArray(stored) && stored.length > 0;
    });
    if (!active || skip) return;

    inFlightHydrations.add(section);
    try {
      const q = query(collection(db, colPath), orderBy('sortOrder', 'asc'));
      const snap = await getDocs(q);
      if (!active) return;

      if (!snap.empty) {
        const results: FeaturedWedding[] = [];
        const docs = snap.docs.slice(0, 3);

        for (const d of docs) {
          const data = d.data();
          const id = String(data.id || d.id);
          let photos: FeaturedWeddingPhoto[] = [];

          const subPath = `featuredWeddings/${id}/photos`;
          try {
            const psnap = await getDocs(query(collection(db, subPath), orderBy('sortOrder', 'asc')));
            photos = psnap.docs
              .map(pd => {
                const pdata = pd.data();
                return {
                  id: String(pdata.id || pd.id),
                  url: String(pdata.url || ''),
                  caption: String(pdata.caption || ''),
                };
              })
              .filter(p => p.url.trim().length > 0);
          } catch (error) {
            if (isQuotaExceededError(error)) {
              quotaExceededThisLoad = true;
            }
            try {
              handleFirestoreError(error, OperationType.LIST, subPath);
            } catch {
              // Logged via handleFirestoreError
            }
            if (quotaExceededThisLoad) break;
          }

          results.push({
            id,
            couple: String(data.couple || ''),
            date: String(data.date || ''),
            venue: String(data.venue || ''),
            location: String(data.location || ''),
            coverImage: String(data.coverImage || ''),
            story: String(data.story || ''),
            highlightQuote: String(data.highlightQuote || ''),
            photos,
          });
        }

        if (active && results.length > 0) {
          onData(results);
        }
      }
      if (!quotaExceededThisLoad) {
        setStoredSectionVersion(section, cloudVersionMs);
      }
    } catch (error) {
      if (isQuotaExceededError(error)) {
        quotaExceededThisLoad = true;
      }
      try {
        handleFirestoreError(error, OperationType.LIST, colPath);
      } catch {
        // Logged via handleFirestoreError
      }
    } finally {
      inFlightHydrations.delete(section);
    }
  })();

  return () => {
    active = false;
  };
}

export function subscribePricingCloud(
  onData: (packages: PricingPackage[]) => void
): () => void {
  let active = true;
  const section = 'pricing';

  void (async () => {
    if (completedHydrationsThisLoad.has(section) || inFlightHydrations.has(section)) {
      return;
    }
    inFlightHydrations.add(section);
    try {
      const manifest = await getCloudManifestOnce();
      if (!active || manifest.failed) return;
      if (manifest.packages && manifest.packages.length > 0) {
        onData(manifest.packages);
      }
      setStoredSectionVersion(section, manifest.versionMs);
    } finally {
      inFlightHydrations.delete(section);
    }
  })();

  return () => {
    active = false;
  };
}

export function subscribeAboutCloud(callbacks: {
  onAboutContent: (about: AboutContent) => void;
  onFaqs: (faqs: FaqItem[]) => void;
  onReviews: (reviews: Review[]) => void;
  onBlogPosts: (posts: BlogPost[]) => void;
}): () => void {
  let active = true;
  const section = 'aboutBundle';

  void (async () => {
    const { skip, cloudVersionMs } = await resolveHydrationDecision(section, async () => {
      const stored = await idbGet<{ aboutContent?: AboutContent }>('mmc_about_bundle_v1');
      return Boolean(stored && stored.aboutContent);
    });
    if (!active || skip) return;

    inFlightHydrations.add(section);
    try {
      let hadError = false;

      try {
        const snap = await getDoc(doc(db, 'studioConfig', 'about'));
        if (active && snap.exists()) {
          const data = snap.data();
          callbacks.onAboutContent({
            ...INITIAL_ABOUT_CONTENT,
            homepageHeroImage: String(data.homepageHeroImage || INITIAL_ABOUT_CONTENT.homepageHeroImage),
            homepageTitle: String(data.homepageTitle ?? INITIAL_ABOUT_CONTENT.homepageTitle),
            homepageText: String(data.homepageText ?? INITIAL_ABOUT_CONTENT.homepageText),
            homepageImage: String(data.homepageImage || INITIAL_ABOUT_CONTENT.homepageImage),
            heroKicker: String(data.heroKicker ?? INITIAL_ABOUT_CONTENT.heroKicker),
            heroHeadline: String(data.heroHeadline ?? INITIAL_ABOUT_CONTENT.heroHeadline),
            heroQuote: String(data.heroQuote ?? INITIAL_ABOUT_CONTENT.heroQuote),
            storyImage: String(data.storyImage || INITIAL_ABOUT_CONTENT.storyImage),
            storyTitle: String(data.storyTitle ?? INITIAL_ABOUT_CONTENT.storyTitle),
            storyParagraphs: Array.isArray(data.storyParagraphs)
              ? data.storyParagraphs.map(String)
              : INITIAL_ABOUT_CONTENT.storyParagraphs,
            coreValues: Array.isArray(data.coreValues)
              ? data.coreValues
              : INITIAL_ABOUT_CONTENT.coreValues,
          });
        }
      } catch (error) {
        hadError = true;
        if (isQuotaExceededError(error)) quotaExceededThisLoad = true;
        try {
          handleFirestoreError(error, OperationType.GET, 'studioConfig/about');
        } catch {
          // Logged via handleFirestoreError
        }
      }

      if (!active || quotaExceededThisLoad) return;

      try {
        const snap = await getDocs(query(collection(db, 'faqs'), orderBy('sortOrder', 'asc')));
        if (active && !snap.empty) {
          callbacks.onFaqs(
            snap.docs.map(d => {
              const data = d.data();
              return {
                id: String(data.id || d.id),
                q: String(data.q || ''),
                a: String(data.a || ''),
              };
            })
          );
        }
      } catch (error) {
        hadError = true;
        if (isQuotaExceededError(error)) quotaExceededThisLoad = true;
        try {
          handleFirestoreError(error, OperationType.LIST, 'faqs');
        } catch {
          // Logged via handleFirestoreError
        }
      }

      if (!active || quotaExceededThisLoad) return;

      try {
        const snap = await getDocs(query(collection(db, 'reviews'), orderBy('sortOrder', 'asc')));
        if (active && !snap.empty) {
          callbacks.onReviews(
            snap.docs.map(d => {
              const data = d.data();
              return {
                id: String(data.id || d.id),
                couple: String(data.couple || ''),
                date: String(data.date || ''),
                venue: String(data.venue || ''),
                rating: Number(data.rating || 5),
                snippet: String(data.snippet || ''),
                fullReview: String(data.fullReview || ''),
                highlight: String(data.highlight || ''),
              };
            })
          );
        }
      } catch (error) {
        hadError = true;
        if (isQuotaExceededError(error)) quotaExceededThisLoad = true;
        try {
          handleFirestoreError(error, OperationType.LIST, 'reviews');
        } catch {
          // Logged via handleFirestoreError
        }
      }

      if (!active || quotaExceededThisLoad) return;

      try {
        const snap = await getDocs(query(collection(db, 'blogPosts'), orderBy('sortOrder', 'asc')));
        if (active && !snap.empty) {
          callbacks.onBlogPosts(
            snap.docs.map(d => {
              const data = d.data();
              return {
                id: String(data.id || d.id),
                slug: String(data.slug || d.id),
                title: String(data.title || ''),
                date: String(data.date || ''),
                category: String(data.category || ''),
                readTime: String(data.readTime || ''),
                coverImage: String(data.coverImage || ''),
                excerpt: String(data.excerpt || ''),
                content: Array.isArray(data.content) ? data.content.map(String) : [],
              };
            })
          );
        }
      } catch (error) {
        hadError = true;
        if (isQuotaExceededError(error)) quotaExceededThisLoad = true;
        try {
          handleFirestoreError(error, OperationType.LIST, 'blogPosts');
        } catch {
          // Logged via handleFirestoreError
        }
      }

      if (!hadError && !quotaExceededThisLoad) {
        setStoredSectionVersion(section, cloudVersionMs);
      }
    } finally {
      inFlightHydrations.delete(section);
    }
  })();

  return () => {
    active = false;
  };
}

export function subscribeVaultCloud(callbacks: {
  onVaultContent: (vault: GuestVaultContent) => void;
  onVaultPhotos: (photos: VaultPhoto[]) => void;
}): () => void {
  let active = true;
  const section = 'vaultBundle';

  void (async () => {
    const { skip, cloudVersionMs } = await resolveHydrationDecision(section, async () => {
      const stored = await idbGet<{ vaultContent?: GuestVaultContent }>('mmc_vault_bundle_v1');
      return Boolean(stored && stored.vaultContent);
    });
    if (!active || skip) return;

    inFlightHydrations.add(section);
    try {
      let hadError = false;

      try {
        const snap = await getDoc(doc(db, 'studioConfig', 'vault'));
        if (active && snap.exists()) {
          const data = snap.data();
          callbacks.onVaultContent({
            ...INITIAL_VAULT_CONTENT,
            badgeLabel: String(data.badgeLabel ?? INITIAL_VAULT_CONTENT.badgeLabel),
            pageTitle: String(data.pageTitle ?? INITIAL_VAULT_CONTENT.pageTitle),
            pageSubtitle: String(data.pageSubtitle ?? INITIAL_VAULT_CONTENT.pageSubtitle),
            coupleName: String(data.coupleName ?? INITIAL_VAULT_CONTENT.coupleName),
            weddingDate: String(data.weddingDate ?? INITIAL_VAULT_CONTENT.weddingDate),
            streamTitle: String(data.streamTitle ?? INITIAL_VAULT_CONTENT.streamTitle),
            streamSubtitle: String(data.streamSubtitle ?? INITIAL_VAULT_CONTENT.streamSubtitle),
            privacyBadgeText: String(data.privacyBadgeText ?? INITIAL_VAULT_CONTENT.privacyBadgeText),
            howItWorksSteps: Array.isArray(data.howItWorksSteps)
              ? data.howItWorksSteps
              : INITIAL_VAULT_CONTENT.howItWorksSteps,
          });
        }
      } catch (error) {
        hadError = true;
        if (isQuotaExceededError(error)) quotaExceededThisLoad = true;
        try {
          handleFirestoreError(error, OperationType.GET, 'studioConfig/vault');
        } catch {
          // Logged via handleFirestoreError
        }
      }

      if (!active || quotaExceededThisLoad) return;

      try {
        const snap = await getDocs(query(collection(db, 'vaultPhotos'), orderBy('sortOrder', 'asc')));
        if (active && !snap.empty) {
          const items: VaultPhoto[] = snap.docs
            .map(d => {
              const data = d.data();
              return {
                id: String(data.id || d.id),
                guestName: String(data.guestName || ''),
                table: String(data.table || ''),
                note: String(data.note || ''),
                time: String(data.time || ''),
                url: String(data.url || ''),
              };
            })
            .filter(item => item.url.trim().length > 0);
          if (items.length > 0) {
            callbacks.onVaultPhotos(items);
          }
        }
      } catch (error) {
        hadError = true;
        if (isQuotaExceededError(error)) quotaExceededThisLoad = true;
        try {
          handleFirestoreError(error, OperationType.LIST, 'vaultPhotos');
        } catch {
          // Logged via handleFirestoreError
        }
      }

      if (!hadError && !quotaExceededThisLoad) {
        setStoredSectionVersion(section, cloudVersionMs);
      }
    } finally {
      inFlightHydrations.delete(section);
    }
  })();

  return () => {
    active = false;
  };
}

// --- Lightweight ID-Only Query Helper (avoids downloading 10+ MB of base64 photos just to diff IDs) ---

async function fetchExistingDocIdsLightweight(
  collectionId: string,
  parentPath = ''
): Promise<string[] | null> {
  try {
    const base = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents`;
    const runQueryUrl = parentPath ? `${base}/${parentPath}:runQuery` : `${base}:runQuery`;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Public read rules allow listing without token
    }

    const res = await withTimeout(
      fetch(runQueryUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId }],
            select: { fields: [{ fieldPath: 'id' }] },
          },
        }),
      }),
      `checking existing ${collectionId}`,
      12000
    );

    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ document?: { name?: string } }>;
    if (!Array.isArray(rows)) return null;

    const ids: string[] = [];
    for (const row of rows) {
      const name = row?.document?.name;
      if (typeof name === 'string') {
        const docId = name.split('/').pop();
        if (docId) ids.push(docId);
      }
    }
    return ids;
  } catch {
    return null;
  }
}

async function runInBatches<T>(
  items: T[],
  batchSize: number,
  worker: (item: T, index: number) => Promise<void>,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  let completed = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    await Promise.all(
      chunk.map(async (item, offset) => {
        await worker(item, i + offset);
        completed += 1;
        onProgress?.(completed, items.length);
      })
    );
  }
}

function getLocalPricingPackagesFallback(): PricingPackage[] {
  if (typeof window === 'undefined') return INITIAL_PRICING_PACKAGES;
  try {
    const raw = localStorage.getItem('mmc_pricing_packages_v3');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as PricingPackage[];
      }
    }
  } catch {
    // Use defaults
  }
  return INITIAL_PRICING_PACKAGES;
}

/**
 * Bumps `studioConfig/pricing.updatedAt` so all visitors' browsers immediately detect
 * newly added/deleted photos on their very next page load (0-second cache invalidation).
 */
export function bumpCloudPublishVersionDebounced(): void {
  if (!canWriteCloud()) return;
  scheduleDebouncedWrite(
    '__cloudVersionBump__',
    async () => {
      if (!canWriteCloud()) return;
      const packages = getLocalPricingPackagesFallback();
      await withTimeout(
        setDoc(doc(db, 'studioConfig', 'pricing'), buildPricingPayload(packages)),
        'updating live publish version'
      );
      const now = Date.now();
      for (const sec of ['pricing', 'galleryPhotos', 'featuredWeddings', 'aboutBundle', 'vaultBundle']) {
        setStoredSectionVersion(sec, now);
      }
    },
    1000
  );
}

// --- Fast Single-Item Cloud Mutations (0 collection reads, 1 doc write/delete) ---

export async function upsertSingleGalleryPhotoCloud(
  photo: GalleryPhoto,
  sortOrder = -Date.now()
): Promise<void> {
  if (!canWriteCloud() || !photo.url?.trim()) return;
  const cleanId = sanitizeDocId(photo.id);
  try {
    const safeUrl = await compressDataUrlIfNeeded(photo.url, 260000);
    await withTimeout(
      setDoc(doc(db, 'galleryPhotos', cleanId), buildGalleryPhotoPayload({ ...photo, url: safeUrl }, sortOrder)),
      `saving gallery photo ${cleanId}`
    );
    bumpCloudPublishVersionDebounced();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `galleryPhotos/${cleanId}`);
  }
}

export async function upsertGalleryPhotosBatchCloud(photos: GalleryPhoto[]): Promise<void> {
  if (!canWriteCloud() || photos.length === 0) return;
  const baseOrder = -Date.now();
  const validPhotos = photos.filter(p => typeof p.url === 'string' && p.url.trim().length > 0);
  try {
    await runInBatches(validPhotos, WRITE_CONCURRENCY, async (photo, idx) => {
      const cleanId = sanitizeDocId(photo.id);
      const safeUrl = await compressDataUrlIfNeeded(photo.url, 260000);
      await withTimeout(
        setDoc(
          doc(db, 'galleryPhotos', cleanId),
          buildGalleryPhotoPayload({ ...photo, url: safeUrl }, baseOrder + idx)
        ),
        `saving gallery photo ${idx + 1}/${validPhotos.length}`
      );
    });
    bumpCloudPublishVersionDebounced();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'galleryPhotos');
  }
}

export async function deleteGalleryPhotoCloud(photoId: string): Promise<void> {
  if (!canWriteCloud()) return;
  const cleanId = sanitizeDocId(photoId);
  try {
    await withTimeout(
      deleteDoc(doc(db, 'galleryPhotos', cleanId)),
      `deleting gallery photo ${cleanId}`
    );
    bumpCloudPublishVersionDebounced();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `galleryPhotos/${cleanId}`);
  }
}

export async function upsertFeaturedWeddingPhotoCloud(
  weddingId: string,
  photo: FeaturedWeddingPhoto,
  sortOrder = -Date.now()
): Promise<void> {
  if (!canWriteCloud() || !photo.url?.trim()) return;
  const cleanWeddingId = sanitizeDocId(weddingId);
  const cleanPhotoId = sanitizeDocId(photo.id);
  try {
    const safeUrl = await compressDataUrlIfNeeded(photo.url, 260000);
    await withTimeout(
      setDoc(
        doc(db, 'featuredWeddings', cleanWeddingId, 'photos', cleanPhotoId),
        buildFeaturedWeddingPhotoPayload(cleanWeddingId, { ...photo, url: safeUrl }, sortOrder)
      ),
      `saving featured wedding photo`
    );
    bumpCloudPublishVersionDebounced();
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `featuredWeddings/${cleanWeddingId}/photos/${cleanPhotoId}`
    );
  }
}

export async function deleteFeaturedWeddingPhotoCloud(
  weddingId: string,
  photoId: string
): Promise<void> {
  if (!canWriteCloud()) return;
  const cleanWeddingId = sanitizeDocId(weddingId);
  const cleanPhotoId = sanitizeDocId(photoId);
  try {
    await withTimeout(
      deleteDoc(doc(db, 'featuredWeddings', cleanWeddingId, 'photos', cleanPhotoId)),
      `deleting featured wedding photo`
    );
    bumpCloudPublishVersionDebounced();
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.DELETE,
      `featuredWeddings/${cleanWeddingId}/photos/${cleanPhotoId}`
    );
  }
}

export async function upsertVaultPhotoCloud(
  photo: VaultPhoto,
  sortOrder = -Date.now()
): Promise<void> {
  if (!canWriteCloud() || !photo.url?.trim()) return;
  const cleanId = sanitizeDocId(photo.id);
  try {
    const safeUrl = await compressDataUrlIfNeeded(photo.url, 260000);
    await withTimeout(
      setDoc(doc(db, 'vaultPhotos', cleanId), buildVaultPhotoPayload({ ...photo, url: safeUrl }, sortOrder)),
      `saving vault photo`
    );
    bumpCloudPublishVersionDebounced();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `vaultPhotos/${cleanId}`);
  }
}

export async function deleteVaultPhotoCloud(photoId: string): Promise<void> {
  if (!canWriteCloud()) return;
  const cleanId = sanitizeDocId(photoId);
  try {
    await withTimeout(
      deleteDoc(doc(db, 'vaultPhotos', cleanId)),
      `deleting vault photo`
    );
    bumpCloudPublishVersionDebounced();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `vaultPhotos/${cleanId}`);
  }
}

// --- Full Collection Sync Helpers (Batched & ID-Projected) ---

async function replaceCollectionDocs<T extends { id: string }>(
  colName: string,
  items: T[],
  buildPayload: (item: T, sortOrder: number) => Promise<Record<string, unknown>> | Record<string, unknown>,
  onItemProgress?: (current: number, total: number) => void
): Promise<void> {
  if (!canWriteCloud()) return;
  try {
    const nextIds = new Set(items.map(item => sanitizeDocId(item.id)));

    // Use lightweight ID-only projection so we NEVER download megabytes of base64 images just to diff deletions
    const existingIds = await fetchExistingDocIdsLightweight(colName);
    if (existingIds) {
      const staleIds = existingIds.filter(id => !nextIds.has(id));
      if (staleIds.length > 0) {
        await runInBatches(staleIds, WRITE_CONCURRENCY, async staleId => {
          await withTimeout(deleteDoc(doc(db, colName, staleId)), `removing old ${colName}/${staleId}`);
        });
      }
    }

    await runInBatches(
      items,
      WRITE_CONCURRENCY,
      async (item, index) => {
        const cleanId = sanitizeDocId(item.id);
        const payload = await buildPayload(item, index);
        await withTimeout(
          setDoc(doc(db, colName, cleanId), payload),
          `saving ${colName} (${index + 1}/${items.length})`
        );
      },
      onItemProgress
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, colName);
  }
}

export async function syncGalleryPhotosToCloud(
  photos: GalleryPhoto[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const validPhotos = photos.filter(p => typeof p.url === 'string' && p.url.trim().length > 0);
  await replaceCollectionDocs(
    'galleryPhotos',
    validPhotos,
    async (photo, idx) => {
      const safeUrl = await compressDataUrlIfNeeded(photo.url, 260000);
      return buildGalleryPhotoPayload({ ...photo, url: safeUrl }, idx);
    },
    onProgress
  );
  bumpCloudPublishVersionDebounced();
}

export async function syncFeaturedWeddingsToCloud(
  weddings: FeaturedWedding[],
  onProgress?: (label: string) => void
): Promise<void> {
  if (!canWriteCloud()) return;
  const sliced = weddings.slice(0, 3);
  try {
    const nextWeddingIds = new Set(sliced.map(w => sanitizeDocId(w.id)));
    const existingWeddingIds = await fetchExistingDocIdsLightweight('featuredWeddings');
    if (existingWeddingIds) {
      const staleWeddingIds = existingWeddingIds.filter(id => !nextWeddingIds.has(id));
      for (const staleId of staleWeddingIds) {
        await withTimeout(
          deleteDoc(doc(db, 'featuredWeddings', staleId)),
          `removing old featured wedding ${staleId}`
        );
      }
    }

    for (let wIdx = 0; wIdx < sliced.length; wIdx++) {
      const wedding = sliced[wIdx];
      const cleanWeddingId = sanitizeDocId(wedding.id);
      const safeCover = await compressDataUrlIfNeeded(
        wedding.coverImage || INITIAL_ABOUT_CONTENT.homepageHeroImage,
        260000
      );

      onProgress?.(`Featured Wedding ${wIdx + 1}/${sliced.length}`);
      await withTimeout(
        setDoc(
          doc(db, 'featuredWeddings', cleanWeddingId),
          buildFeaturedWeddingPayload({ ...wedding, coverImage: safeCover }, wIdx)
        ),
        `saving featured wedding ${wIdx + 1}`
      );

      const validPhotos = (wedding.photos || []).filter(
        p => typeof p.url === 'string' && p.url.trim().length > 0
      );
      const nextPhotoIds = new Set(validPhotos.map(p => sanitizeDocId(p.id)));
      const existingPhotoIds = await fetchExistingDocIdsLightweight(
        'photos',
        `featuredWeddings/${cleanWeddingId}`
      );
      if (existingPhotoIds) {
        const stalePhotoIds = existingPhotoIds.filter(id => !nextPhotoIds.has(id));
        if (stalePhotoIds.length > 0) {
          await runInBatches(stalePhotoIds, WRITE_CONCURRENCY, async staleId => {
            await withTimeout(
              deleteDoc(doc(db, 'featuredWeddings', cleanWeddingId, 'photos', staleId)),
              `removing old featured wedding photo`
            );
          });
        }
      }

      await runInBatches(validPhotos, WRITE_CONCURRENCY, async (photo, pIdx) => {
        const cleanPhotoId = sanitizeDocId(photo.id);
        const safePhotoUrl = await compressDataUrlIfNeeded(photo.url, 260000);
        await withTimeout(
          setDoc(
            doc(db, 'featuredWeddings', cleanWeddingId, 'photos', cleanPhotoId),
            buildFeaturedWeddingPhotoPayload(cleanWeddingId, { ...photo, url: safePhotoUrl }, pIdx)
          ),
          `saving featured wedding ${wIdx + 1} photo ${pIdx + 1}/${validPhotos.length}`
        );
      });
    }
    bumpCloudPublishVersionDebounced();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'featuredWeddings');
  }
}

export function syncFeaturedWeddingsToCloudDebounced(weddings: FeaturedWedding[]): void {
  if (!canWriteCloud()) return;
  scheduleDebouncedWrite('featuredWeddings', () => syncFeaturedWeddingsToCloud(weddings));
}

export async function syncPricingToCloud(packages: PricingPackage[]): Promise<void> {
  if (!canWriteCloud()) return;
  try {
    await withTimeout(
      setDoc(doc(db, 'studioConfig', 'pricing'), buildPricingPayload(packages)),
      'saving pricing packages'
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'studioConfig/pricing');
  }
}

export function syncPricingToCloudDebounced(packages: PricingPackage[]): void {
  if (!canWriteCloud()) return;
  scheduleDebouncedWrite('studioConfig/pricing', () => syncPricingToCloud(packages));
}

export async function syncAboutContentToCloud(about: AboutContent): Promise<void> {
  if (!canWriteCloud()) return;
  try {
    const sanitizeAboutImage = async (candidate: string | undefined, fallback: string): Promise<string> => {
      const trimmed = (candidate || '').trim();
      if (!trimmed) return fallback;
      if (!trimmed.startsWith('data:image/')) return trimmed;
      const compressed = await compressDataUrlIfNeeded(trimmed, 140000);
      // Guard against previously truncated/corrupted 450,000-char base64 strings that cannot be decoded
      if (compressed.length >= 440000) {
        return fallback;
      }
      return compressed;
    };

    const [safeHero, safeHome, safeStory] = await Promise.all([
      sanitizeAboutImage(about.homepageHeroImage, INITIAL_ABOUT_CONTENT.homepageHeroImage),
      sanitizeAboutImage(about.homepageImage, INITIAL_ABOUT_CONTENT.homepageImage),
      sanitizeAboutImage(about.storyImage, INITIAL_ABOUT_CONTENT.storyImage),
    ]);
    await withTimeout(
      setDoc(
        doc(db, 'studioConfig', 'about'),
        buildAboutPayload({
          ...about,
          homepageHeroImage: safeHero,
          homepageImage: safeHome,
          storyImage: safeStory,
        })
      ),
      'saving homepage & about content'
    );
    bumpCloudPublishVersionDebounced();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'studioConfig/about');
  }
}

export function syncAboutContentToCloudDebounced(about: AboutContent): void {
  if (!canWriteCloud()) return;
  scheduleDebouncedWrite('studioConfig/about', () => syncAboutContentToCloud(about));
}

export async function syncFaqsToCloud(faqs: FaqItem[]): Promise<void> {
  await replaceCollectionDocs('faqs', faqs, buildFaqPayload);
  bumpCloudPublishVersionDebounced();
}

export function syncFaqsToCloudDebounced(faqs: FaqItem[]): void {
  if (!canWriteCloud()) return;
  scheduleDebouncedWrite('faqs', () => syncFaqsToCloud(faqs));
}

export async function syncReviewsToCloud(reviews: Review[]): Promise<void> {
  await replaceCollectionDocs('reviews', reviews, buildReviewPayload);
  bumpCloudPublishVersionDebounced();
}

export function syncReviewsToCloudDebounced(reviews: Review[]): void {
  if (!canWriteCloud()) return;
  scheduleDebouncedWrite('reviews', () => syncReviewsToCloud(reviews));
}

export async function syncBlogPostsToCloud(posts: BlogPost[]): Promise<void> {
  await replaceCollectionDocs('blogPosts', posts, async (post, idx) => {
    const safeCover = await compressDataUrlIfNeeded(
      post.coverImage || INITIAL_ABOUT_CONTENT.homepageHeroImage,
      260000
    );
    return buildBlogPostPayload({ ...post, coverImage: safeCover }, idx);
  });
  bumpCloudPublishVersionDebounced();
}

export function syncBlogPostsToCloudDebounced(posts: BlogPost[]): void {
  if (!canWriteCloud()) return;
  scheduleDebouncedWrite('blogPosts', () => syncBlogPostsToCloud(posts));
}

export async function syncVaultContentToCloud(vault: GuestVaultContent): Promise<void> {
  if (!canWriteCloud()) return;
  try {
    await withTimeout(
      setDoc(doc(db, 'studioConfig', 'vault'), buildVaultConfigPayload(vault)),
      'saving guest photo vault settings'
    );
    bumpCloudPublishVersionDebounced();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'studioConfig/vault');
  }
}

export function syncVaultContentToCloudDebounced(vault: GuestVaultContent): void {
  if (!canWriteCloud()) return;
  scheduleDebouncedWrite('studioConfig/vault', () => syncVaultContentToCloud(vault));
}

export async function syncVaultPhotosToCloud(photos: VaultPhoto[]): Promise<void> {
  const validPhotos = photos.filter(p => typeof p.url === 'string' && p.url.trim().length > 0);
  await replaceCollectionDocs('vaultPhotos', validPhotos, async (photo, idx) => {
    const safeUrl = await compressDataUrlIfNeeded(photo.url, 260000);
    return buildVaultPhotoPayload({ ...photo, url: safeUrl }, idx);
  });
  bumpCloudPublishVersionDebounced();
}

export function syncVaultPhotosToCloudDebounced(photos: VaultPhoto[]): void {
  if (!canWriteCloud()) return;
  scheduleDebouncedWrite('vaultPhotos', () => syncVaultPhotosToCloud(photos));
}

export async function deleteSingleDocCloud(colPath: string, docId: string): Promise<void> {
  if (!canWriteCloud()) return;
  const cleanId = sanitizeDocId(docId);
  try {
    await withTimeout(deleteDoc(doc(db, colPath, cleanId)), `deleting ${colPath}/${cleanId}`);
    bumpCloudPublishVersionDebounced();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${colPath}/${cleanId}`);
  }
}

async function prepareCloudPublishSession(): Promise<void> {
  if (!canWriteCloud()) {
    throw new Error('Please sign in with your Studio Owner Google account to publish live changes.');
  }

  // Refresh auth token before starting so a long-open admin tab never stalls on an expired token
  try {
    await withTimeout(
      auth.currentUser?.getIdToken(true) ?? Promise.resolve(''),
      'verifying Studio Owner session',
      6000
    );
  } catch {
    // Proceed with current token if refresh is temporarily slow
  }

  debounceTimers.forEach(timer => clearTimeout(timer));
  debounceTimers.clear();
}

function clearPendingDebouncedWrites(): void {
  debounceTimers.forEach(timer => clearTimeout(timer));
  debounceTimers.clear();
}

/**
 * Fast targeted publish for ONLY the About Us page text/photos & Homepage photos.
 * Performs 0 collection reads and only 2 tiny document writes (`studioConfig/about`
 * + `studioConfig/pricing` version bump), finishing in ~1 second instead of
 * re-uploading the entire wedding gallery.
 */
export async function publishAboutPageOnlyToCloud(
  payload: {
    aboutContent: AboutContent;
    pricingPackages: PricingPackage[];
  },
  onProgress?: (message: string, percent?: number) => void
): Promise<void> {
  await prepareCloudPublishSession();

  onProgress?.('Optimizing & publishing Homepage & About Us...', 35);
  await syncAboutContentToCloud(payload.aboutContent);

  clearPendingDebouncedWrites();
  onProgress?.('Finalizing live website version...', 80);
  await syncPricingToCloud(payload.pricingPackages);

  const publishedAt = Date.now();
  setStoredSectionVersion('aboutBundle', publishedAt);
  setStoredSectionVersion('pricing', publishedAt);
  onProgress?.('About Us & Homepage changes published live!', 100);
}

/**
 * Targeted publish for the About Us tab including Reviews, Blog Posts, and FAQs
 * (skips all Wedding Gallery and Featured Wedding photos).
 */
export async function publishAboutSectionToCloud(
  payload: {
    aboutContent: AboutContent;
    faqs: FaqItem[];
    reviews: Review[];
    blogPosts: BlogPost[];
    pricingPackages: PricingPackage[];
  },
  onProgress?: (message: string, percent?: number) => void
): Promise<void> {
  await prepareCloudPublishSession();

  onProgress?.('Publishing About Us & Homepage...', 22);
  await syncAboutContentToCloud(payload.aboutContent);

  onProgress?.('Publishing FAQs, Reviews & Blog...', 55);
  await Promise.all([
    syncFaqsToCloud(payload.faqs),
    syncReviewsToCloud(payload.reviews),
    syncBlogPostsToCloud(payload.blogPosts),
  ]);

  clearPendingDebouncedWrites();
  onProgress?.('Finalizing live website version...', 88);
  await syncPricingToCloud(payload.pricingPackages);

  const publishedAt = Date.now();
  setStoredSectionVersion('aboutBundle', publishedAt);
  setStoredSectionVersion('pricing', publishedAt);
  onProgress?.('About Us section published live!', 100);
}

/**
 * Targeted publish for ONLY the Guest Photo Vault settings & snaps.
 */
export async function publishVaultSectionToCloud(
  payload: {
    vaultContent: GuestVaultContent;
    vaultPhotos: VaultPhoto[];
    pricingPackages: PricingPackage[];
  },
  onProgress?: (message: string, percent?: number) => void
): Promise<void> {
  await prepareCloudPublishSession();

  onProgress?.('Publishing Guest Photo Vault settings...', 25);
  await syncVaultContentToCloud(payload.vaultContent);

  onProgress?.('Publishing Guest Photo Vault photos...', 60);
  await syncVaultPhotosToCloud(payload.vaultPhotos);

  clearPendingDebouncedWrites();
  onProgress?.('Finalizing live website version...', 88);
  await syncPricingToCloud(payload.pricingPackages);

  const publishedAt = Date.now();
  setStoredSectionVersion('vaultBundle', publishedAt);
  setStoredSectionVersion('pricing', publishedAt);
  onProgress?.('Guest Photo Vault changes published live!', 100);
}

/**
 * Fast targeted publish for ONLY the Investment / Pricing packages (1 tiny write).
 */
export async function publishPricingOnlyToCloud(
  pricingPackages: PricingPackage[],
  onProgress?: (message: string, percent?: number) => void
): Promise<void> {
  await prepareCloudPublishSession();

  onProgress?.('Publishing Investment & Pricing packages...', 50);
  await syncPricingToCloud(pricingPackages);

  setStoredSectionVersion('pricing', Date.now());
  onProgress?.('Pricing packages published live!', 100);
}

/**
 * Publishes the entire current studio state (homepage, featured weddings, gallery,
 * pricing, about/reviews/blog/faqs, and guest vault) to Cloud Firestore in fast
 * parallel batches with live progress percentage and instant visitor cache invalidation.
 */
export async function publishAllStudioDataToCloud(
  payload: {
    galleryPhotos: GalleryPhoto[];
    featuredWeddings: FeaturedWedding[];
    pricingPackages: PricingPackage[];
    aboutContent: AboutContent;
    faqs: FaqItem[];
    reviews: Review[];
    blogPosts: BlogPost[];
    vaultContent: GuestVaultContent;
    vaultPhotos: VaultPhoto[];
  },
  onProgress?: (message: string, percent?: number) => void
): Promise<void> {
  await prepareCloudPublishSession();

  onProgress?.('Publishing Homepage & About Us...', 8);
  await syncAboutContentToCloud(payload.aboutContent);

  onProgress?.('Publishing Guest Photo Vault settings...', 16);
  await syncVaultContentToCloud(payload.vaultContent);

  const totalGallery = payload.galleryPhotos.filter(p => p.url?.trim()).length;
  onProgress?.(`Publishing Wedding Gallery (0/${totalGallery})...`, 20);
  await syncGalleryPhotosToCloud(payload.galleryPhotos, (curr, total) => {
    const pct = total > 0 ? Math.round(20 + (curr / total) * 42) : 62;
    onProgress?.(`Publishing Wedding Gallery (${curr}/${total})...`, pct);
  });

  onProgress?.('Publishing 3 Featured Weddings...', 66);
  await syncFeaturedWeddingsToCloud(payload.featuredWeddings, label => {
    onProgress?.(`Publishing ${label}...`, 74);
  });

  onProgress?.('Publishing FAQs, Reviews & Blog...', 82);
  await Promise.all([
    syncFaqsToCloud(payload.faqs),
    syncReviewsToCloud(payload.reviews),
    syncBlogPostsToCloud(payload.blogPosts),
  ]);

  onProgress?.('Publishing Guest Vault Photos...', 90);
  await syncVaultPhotosToCloud(payload.vaultPhotos);

  // Cancel any queued debounced bump and write `studioConfig/pricing` LAST so its
  // serverTimestamp is guaranteed to be newer than every photo written above!
  clearPendingDebouncedWrites();

  onProgress?.('Finalizing live website version...', 96);
  await syncPricingToCloud(payload.pricingPackages);

  const publishedAt = Date.now();
  for (const sec of ['pricing', 'galleryPhotos', 'featuredWeddings', 'aboutBundle', 'vaultBundle']) {
    setStoredSectionVersion(sec, publishedAt);
  }
  onProgress?.('All changes published live!', 100);
}
