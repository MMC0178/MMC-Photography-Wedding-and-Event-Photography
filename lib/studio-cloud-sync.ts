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
} from 'firebase/firestore';
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

function canWriteCloud(): boolean {
  return isAuthorizedStudioUser(auth.currentUser);
}

// Debounce timers for rapid typing updates
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleDebouncedWrite(key: string, fn: () => Promise<void>, delayMs = 600) {
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

// --- Quota-Friendly One-Time Cloud Hydration with Deduplication & 30-Min Cache ---

const CLOUD_SYNC_CACHE_KEY = 'mmc_cloud_sync_ts_v1';
const CLOUD_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const inFlightHydrations = new Set<string>();
const completedHydrationsThisLoad = new Set<string>();
let quotaExceededThisLoad = false;

function isQuotaExceededError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('resource-exhausted')
  );
}

function getSectionSyncTimestamp(section: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(CLOUD_SYNC_CACHE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as Record<string, number>;
    return typeof parsed[section] === 'number' ? parsed[section] : 0;
  } catch {
    return 0;
  }
}

function markSectionSynced(section: string): void {
  completedHydrationsThisLoad.add(section);
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CLOUD_SYNC_CACHE_KEY);
    const parsed: Record<string, number> = raw ? JSON.parse(raw) : {};
    parsed[section] = Date.now();
    localStorage.setItem(CLOUD_SYNC_CACHE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage errors
  }
}

async function shouldSkipCloudHydration(
  section: string,
  hasLocalCachedValue: () => Promise<boolean>
): Promise<boolean> {
  if (quotaExceededThisLoad) return true;
  if (inFlightHydrations.has(section) || completedHydrationsThisLoad.has(section)) {
    return true;
  }
  const lastSyncedAt = getSectionSyncTimestamp(section);
  if (lastSyncedAt > 0 && Date.now() - lastSyncedAt < CLOUD_CACHE_TTL_MS) {
    try {
      if (await hasLocalCachedValue()) {
        completedHydrationsThisLoad.add(section);
        return true;
      }
    } catch {
      // Proceed with cloud read if cache check fails
    }
  }
  return false;
}

export function subscribeGalleryPhotosCloud(
  onData: (photos: GalleryPhoto[]) => void
): () => void {
  let active = true;
  const colPath = 'galleryPhotos';
  const section = 'galleryPhotos';

  void (async () => {
    const skip = await shouldSkipCloudHydration(section, async () => {
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
      markSectionSynced(section);
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
    const skip = await shouldSkipCloudHydration(section, async () => {
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
        markSectionSynced(section);
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
  const docPath = 'studioConfig/pricing';
  const section = 'pricing';

  void (async () => {
    const skip = await shouldSkipCloudHydration(section, async () => {
      try {
        const raw = localStorage.getItem('mmc_pricing_packages_v3');
        return Boolean(raw && JSON.parse(raw).length > 0);
      } catch {
        return false;
      }
    });
    if (!active || skip) return;

    inFlightHydrations.add(section);
    try {
      const snap = await getDoc(doc(db, 'studioConfig', 'pricing'));
      if (!active) return;
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.packages) && data.packages.length > 0) {
          onData(data.packages as PricingPackage[]);
        }
      }
      markSectionSynced(section);
    } catch (error) {
      if (isQuotaExceededError(error)) {
        quotaExceededThisLoad = true;
      }
      try {
        handleFirestoreError(error, OperationType.GET, docPath);
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

export function subscribeAboutCloud(callbacks: {
  onAboutContent: (about: AboutContent) => void;
  onFaqs: (faqs: FaqItem[]) => void;
  onReviews: (reviews: Review[]) => void;
  onBlogPosts: (posts: BlogPost[]) => void;
}): () => void {
  let active = true;
  const section = 'aboutBundle';

  void (async () => {
    const skip = await shouldSkipCloudHydration(section, async () => {
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
        markSectionSynced(section);
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
    const skip = await shouldSkipCloudHydration(section, async () => {
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
        markSectionSynced(section);
      }
    } finally {
      inFlightHydrations.delete(section);
    }
  })();

  return () => {
    active = false;
  };
}

// --- Admin Cloud Write Helpers ---

async function replaceCollectionDocs<T extends { id: string }>(
  colName: string,
  items: T[],
  buildPayload: (item: T, sortOrder: number) => Promise<Record<string, unknown>> | Record<string, unknown>,
  onItemProgress?: (current: number, total: number) => void
): Promise<void> {
  if (!canWriteCloud()) return;
  try {
    const existingSnap = await getDocs(collection(db, colName));
    const nextIds = new Set(items.map(item => sanitizeDocId(item.id)));

    for (const d of existingSnap.docs) {
      if (!nextIds.has(d.id)) {
        await deleteDoc(d.ref);
      }
    }

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const cleanId = sanitizeDocId(item.id);
      const payload = await buildPayload(item, index);
      await setDoc(doc(db, colName, cleanId), payload);
      onItemProgress?.(index + 1, items.length);
    }
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
}

export async function syncFeaturedWeddingsToCloud(
  weddings: FeaturedWedding[],
  onProgress?: (label: string) => void
): Promise<void> {
  if (!canWriteCloud()) return;
  const sliced = weddings.slice(0, 3);
  try {
    const existingWeddingsSnap = await getDocs(collection(db, 'featuredWeddings'));
    const nextWeddingIds = new Set(sliced.map(w => sanitizeDocId(w.id)));

    for (const d of existingWeddingsSnap.docs) {
      if (!nextWeddingIds.has(d.id)) {
        await deleteDoc(d.ref);
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
      await setDoc(
        doc(db, 'featuredWeddings', cleanWeddingId),
        buildFeaturedWeddingPayload({ ...wedding, coverImage: safeCover }, wIdx)
      );

      const subCol = collection(db, 'featuredWeddings', cleanWeddingId, 'photos');
      const existingPhotosSnap = await getDocs(subCol);
      const validPhotos = (wedding.photos || []).filter(
        p => typeof p.url === 'string' && p.url.trim().length > 0
      );
      const nextPhotoIds = new Set(validPhotos.map(p => sanitizeDocId(p.id)));

      for (const pd of existingPhotosSnap.docs) {
        if (!nextPhotoIds.has(pd.id)) {
          await deleteDoc(pd.ref);
        }
      }

      for (let pIdx = 0; pIdx < validPhotos.length; pIdx++) {
        const photo = validPhotos[pIdx];
        const cleanPhotoId = sanitizeDocId(photo.id);
        const safePhotoUrl = await compressDataUrlIfNeeded(photo.url, 260000);
        await setDoc(
          doc(db, 'featuredWeddings', cleanWeddingId, 'photos', cleanPhotoId),
          buildFeaturedWeddingPhotoPayload(cleanWeddingId, { ...photo, url: safePhotoUrl }, pIdx)
        );
      }
    }
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
    await setDoc(doc(db, 'studioConfig', 'pricing'), buildPricingPayload(packages));
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
    const [safeHero, safeHome, safeStory] = await Promise.all([
      compressDataUrlIfNeeded(about.homepageHeroImage || INITIAL_ABOUT_CONTENT.homepageHeroImage, 180000),
      compressDataUrlIfNeeded(about.homepageImage || INITIAL_ABOUT_CONTENT.homepageImage, 180000),
      compressDataUrlIfNeeded(about.storyImage || INITIAL_ABOUT_CONTENT.storyImage, 180000),
    ]);
    await setDoc(
      doc(db, 'studioConfig', 'about'),
      buildAboutPayload({
        ...about,
        homepageHeroImage: safeHero,
        homepageImage: safeHome,
        storyImage: safeStory,
      })
    );
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
}

export function syncFaqsToCloudDebounced(faqs: FaqItem[]): void {
  if (!canWriteCloud()) return;
  scheduleDebouncedWrite('faqs', () => syncFaqsToCloud(faqs));
}

export async function syncReviewsToCloud(reviews: Review[]): Promise<void> {
  await replaceCollectionDocs('reviews', reviews, buildReviewPayload);
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
}

export function syncBlogPostsToCloudDebounced(posts: BlogPost[]): void {
  if (!canWriteCloud()) return;
  scheduleDebouncedWrite('blogPosts', () => syncBlogPostsToCloud(posts));
}

export async function syncVaultContentToCloud(vault: GuestVaultContent): Promise<void> {
  if (!canWriteCloud()) return;
  try {
    await setDoc(doc(db, 'studioConfig', 'vault'), buildVaultConfigPayload(vault));
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
}

export function syncVaultPhotosToCloudDebounced(photos: VaultPhoto[]): void {
  if (!canWriteCloud()) return;
  scheduleDebouncedWrite('vaultPhotos', () => syncVaultPhotosToCloud(photos));
}

export async function deleteSingleDocCloud(colPath: string, docId: string): Promise<void> {
  if (!canWriteCloud()) return;
  const cleanId = sanitizeDocId(docId);
  try {
    await deleteDoc(doc(db, colPath, cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${colPath}/${cleanId}`);
  }
}

/**
 * Publishes the entire current studio state (homepage, featured weddings, gallery,
 * pricing, about/reviews/blog/faqs, and guest vault) to Cloud Firestore with progress feedback.
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
  onProgress?: (message: string) => void
): Promise<void> {
  if (!canWriteCloud()) {
    throw new Error('Please sign in with your Studio Owner Google account to publish live changes.');
  }

  debounceTimers.forEach(timer => clearTimeout(timer));
  debounceTimers.clear();

  onProgress?.('Publishing Homepage & About Us...');
  await syncAboutContentToCloud(payload.aboutContent);

  onProgress?.('Publishing Pricing Packages...');
  await syncPricingToCloud(payload.pricingPackages);

  onProgress?.('Publishing Guest Photo Vault text...');
  await syncVaultContentToCloud(payload.vaultContent);

  onProgress?.(`Publishing Wedding Gallery (${payload.galleryPhotos.length} photos)...`);
  await syncGalleryPhotosToCloud(payload.galleryPhotos, (curr, total) => {
    onProgress?.(`Publishing Wedding Gallery (${curr}/${total})...`);
  });

  onProgress?.('Publishing Featured Weddings...');
  await syncFeaturedWeddingsToCloud(payload.featuredWeddings, label => {
    onProgress?.(`Publishing ${label}...`);
  });

  onProgress?.('Publishing FAQs, Reviews & Blog...');
  await syncFaqsToCloud(payload.faqs);
  await syncReviewsToCloud(payload.reviews);
  await syncBlogPostsToCloud(payload.blogPosts);

  onProgress?.('Publishing Guest Vault Photos...');
  await syncVaultPhotosToCloud(payload.vaultPhotos);

  // Mark all sections freshly synced so immediate reloads use local IndexedDB cache
  markSectionSynced('aboutBundle');
  markSectionSynced('pricing');
  markSectionSynced('vaultBundle');
  markSectionSynced('galleryPhotos');
  markSectionSynced('featuredWeddings');
}
