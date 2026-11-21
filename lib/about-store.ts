'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AboutContent,
  FaqItem,
  Review,
  BlogPost,
  INITIAL_ABOUT_CONTENT,
  INITIAL_FAQS,
  REVIEWS,
  BLOG_POSTS,
} from './wedding-data';
import { idbGet, idbSet } from './studio-storage';
import {
  subscribeAboutCloud,
  syncAboutContentToCloud,
  syncAboutContentToCloudDebounced,
  syncFaqsToCloud,
  syncFaqsToCloudDebounced,
  syncReviewsToCloud,
  syncReviewsToCloudDebounced,
  syncBlogPostsToCloud,
  syncBlogPostsToCloudDebounced,
} from './studio-cloud-sync';

const ABOUT_CONTENT_KEY = 'mmc_about_content_v1';
const FAQS_KEY = 'mmc_faqs_v1';
const REVIEWS_KEY = 'mmc_reviews_v1';
const BLOG_POSTS_KEY = 'mmc_blog_posts_v1';
const IDB_KEY = 'mmc_about_bundle_v1';
const CHANGE_EVENT = 'mmc_about_updated';

export interface AboutStoreState {
  aboutContent: AboutContent;
  faqs: FaqItem[];
  reviews: Review[];
  blogPosts: BlogPost[];
}

const DEFAULT_ABOUT_STATE: AboutStoreState = {
  aboutContent: INITIAL_ABOUT_CONTENT,
  faqs: INITIAL_FAQS,
  reviews: REVIEWS,
  blogPosts: BLOG_POSTS,
};

let cachedAboutState: AboutStoreState | null = null;
let hasMutated = false;

function readLocalAboutData(): AboutStoreState {
  if (typeof window === 'undefined') {
    return DEFAULT_ABOUT_STATE;
  }
  if (cachedAboutState !== null) {
    return cachedAboutState;
  }
  try {
    const rawContent = localStorage.getItem(ABOUT_CONTENT_KEY);
    const rawFaqs = localStorage.getItem(FAQS_KEY);
    const rawReviews = localStorage.getItem(REVIEWS_KEY);
    const rawBlogs = localStorage.getItem(BLOG_POSTS_KEY);

    if (!rawContent && !rawFaqs && !rawReviews && !rawBlogs) {
      return DEFAULT_ABOUT_STATE;
    }

    const aboutContent = rawContent
      ? { ...INITIAL_ABOUT_CONTENT, ...JSON.parse(rawContent) }
      : INITIAL_ABOUT_CONTENT;
    const faqs = rawFaqs ? JSON.parse(rawFaqs) : INITIAL_FAQS;
    const reviews = rawReviews ? JSON.parse(rawReviews) : REVIEWS;
    const blogPosts = rawBlogs ? JSON.parse(rawBlogs) : BLOG_POSTS;

    const loaded: AboutStoreState = {
      aboutContent,
      faqs: Array.isArray(faqs) ? faqs : INITIAL_FAQS,
      reviews: Array.isArray(reviews) ? reviews : REVIEWS,
      blogPosts: Array.isArray(blogPosts) ? blogPosts : BLOG_POSTS,
    };
    cachedAboutState = loaded;
    return loaded;
  } catch (e) {
    console.warn('Error reading about data from localStorage', e);
    return DEFAULT_ABOUT_STATE;
  }
}

export function getStoredAboutData(): AboutStoreState {
  return readLocalAboutData();
}

function saveAllLocally(state: AboutStoreState, markMutated = true): void {
  if (markMutated) {
    hasMutated = true;
  }
  cachedAboutState = state;
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new Event(CHANGE_EVENT));
  void idbSet(IDB_KEY, state);

  try {
    localStorage.setItem(ABOUT_CONTENT_KEY, JSON.stringify(state.aboutContent));
    localStorage.setItem(FAQS_KEY, JSON.stringify(state.faqs));
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(state.reviews));
    localStorage.setItem(BLOG_POSTS_KEY, JSON.stringify(state.blogPosts));
  } catch {
    // Ignore localStorage quota errors; IndexedDB & Firestore retain the full dataset
  }
}

export function updateAboutContent(updates: Partial<AboutContent>): void {
  const current = getStoredAboutData();
  const nextAbout = { ...current.aboutContent, ...updates };
  saveAllLocally({ ...current, aboutContent: nextAbout }, true);

  const isImageUpdate =
    typeof updates.homepageHeroImage === 'string' ||
    typeof updates.homepageImage === 'string' ||
    typeof updates.storyImage === 'string';

  if (isImageUpdate) {
    void syncAboutContentToCloud(nextAbout).catch(err => {
      console.error('Failed to sync about content to cloud:', err);
    });
  } else {
    syncAboutContentToCloudDebounced(nextAbout);
  }
}

// FAQ CRUD
export function addFaqItem(faq: Omit<FaqItem, 'id'>): void {
  const current = getStoredAboutData();
  const newFaq: FaqItem = {
    ...faq,
    id: `faq-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
  };
  const nextFaqs = [...current.faqs, newFaq];
  saveAllLocally({ ...current, faqs: nextFaqs }, true);
  void syncFaqsToCloud(nextFaqs).catch(err => console.error('Failed to sync FAQs:', err));
}

export function updateFaqItem(id: string, updates: Partial<FaqItem>): void {
  const current = getStoredAboutData();
  const nextFaqs = current.faqs.map(f => (f.id === id ? { ...f, ...updates } : f));
  saveAllLocally({ ...current, faqs: nextFaqs }, true);
  syncFaqsToCloudDebounced(nextFaqs);
}

export function deleteFaqItem(id: string): void {
  const current = getStoredAboutData();
  const nextFaqs = current.faqs.filter(f => f.id !== id);
  saveAllLocally({ ...current, faqs: nextFaqs }, true);
  void syncFaqsToCloud(nextFaqs).catch(err => console.error('Failed to sync FAQs:', err));
}

// Review CRUD
export function addReviewItem(review: Omit<Review, 'id'>): void {
  const current = getStoredAboutData();
  const newRev: Review = {
    ...review,
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
  };
  const nextReviews = [newRev, ...current.reviews];
  saveAllLocally({ ...current, reviews: nextReviews }, true);
  void syncReviewsToCloud(nextReviews).catch(err => console.error('Failed to sync reviews:', err));
}

export function updateReviewItem(id: string, updates: Partial<Review>): void {
  const current = getStoredAboutData();
  const nextReviews = current.reviews.map(r => (r.id === id ? { ...r, ...updates } : r));
  saveAllLocally({ ...current, reviews: nextReviews }, true);
  syncReviewsToCloudDebounced(nextReviews);
}

export function deleteReviewItem(id: string): void {
  const current = getStoredAboutData();
  const nextReviews = current.reviews.filter(r => r.id !== id);
  saveAllLocally({ ...current, reviews: nextReviews }, true);
  void syncReviewsToCloud(nextReviews).catch(err => console.error('Failed to sync reviews:', err));
}

// Blog Post CRUD
export function addBlogPost(post: Omit<BlogPost, 'id' | 'slug'>): void {
  const current = getStoredAboutData();
  const id = `post-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
  const slug =
    post.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || id;
  const newPost: BlogPost = {
    ...post,
    id,
    slug,
  };
  const nextPosts = [newPost, ...current.blogPosts];
  saveAllLocally({ ...current, blogPosts: nextPosts }, true);
  void syncBlogPostsToCloud(nextPosts).catch(err => console.error('Failed to sync blog posts:', err));
}

export function updateBlogPost(id: string, updates: Partial<BlogPost>): void {
  const current = getStoredAboutData();
  const nextPosts = current.blogPosts.map(p => (p.id === id ? { ...p, ...updates } : p));
  saveAllLocally({ ...current, blogPosts: nextPosts }, true);
  if (typeof updates.coverImage === 'string') {
    void syncBlogPostsToCloud(nextPosts).catch(err => console.error('Failed to sync blog posts:', err));
  } else {
    syncBlogPostsToCloudDebounced(nextPosts);
  }
}

export function deleteBlogPost(id: string): void {
  const current = getStoredAboutData();
  const nextPosts = current.blogPosts.filter(p => p.id !== id);
  saveAllLocally({ ...current, blogPosts: nextPosts }, true);
  void syncBlogPostsToCloud(nextPosts).catch(err => console.error('Failed to sync blog posts:', err));
}

export function resetAboutToDefaults(): void {
  saveAllLocally(DEFAULT_ABOUT_STATE, true);
  void Promise.all([
    syncAboutContentToCloud(DEFAULT_ABOUT_STATE.aboutContent),
    syncFaqsToCloud(DEFAULT_ABOUT_STATE.faqs),
    syncReviewsToCloud(DEFAULT_ABOUT_STATE.reviews),
    syncBlogPostsToCloud(DEFAULT_ABOUT_STATE.blogPosts),
  ]).catch(err => console.error('Failed to reset About data in cloud:', err));
}

export function useAboutSection() {
  const [data, setData] = useState<AboutStoreState>(DEFAULT_ABOUT_STATE);

  const refresh = useCallback(() => {
    setData(getStoredAboutData());
  }, []);

  useEffect(() => {
    let active = true;
    let receivedCloudAbout = false;
    let receivedCloudFaqs = false;
    let receivedCloudReviews = false;
    let receivedCloudBlogs = false;

    void idbGet<AboutStoreState>(IDB_KEY).then(stored => {
      if (!active || hasMutated) return;
      const base = cachedAboutState || DEFAULT_ABOUT_STATE;
      if (stored && stored.aboutContent) {
        const normalized: AboutStoreState = {
          aboutContent: receivedCloudAbout
            ? base.aboutContent
            : { ...INITIAL_ABOUT_CONTENT, ...stored.aboutContent },
          faqs: receivedCloudFaqs
            ? base.faqs
            : Array.isArray(stored.faqs)
              ? stored.faqs
              : INITIAL_FAQS,
          reviews: receivedCloudReviews
            ? base.reviews
            : Array.isArray(stored.reviews)
              ? stored.reviews
              : REVIEWS,
          blogPosts: receivedCloudBlogs
            ? base.blogPosts
            : Array.isArray(stored.blogPosts)
              ? stored.blogPosts
              : BLOG_POSTS,
        };
        cachedAboutState = normalized;
        setData(normalized);
      } else {
        const local = readLocalAboutData();
        if (local !== DEFAULT_ABOUT_STATE && !receivedCloudAbout) {
          cachedAboutState = local;
          setData(local);
          void idbSet(IDB_KEY, local);
        }
      }
    });

    const unsubCloud = subscribeAboutCloud({
      onAboutContent: cloudAbout => {
        if (!active) return;
        receivedCloudAbout = true;
        const next: AboutStoreState = {
          ...getStoredAboutData(),
          aboutContent: cloudAbout,
        };
        saveAllLocally(next, false);
        setData(next);
      },
      onFaqs: cloudFaqs => {
        if (!active) return;
        receivedCloudFaqs = true;
        const next: AboutStoreState = {
          ...getStoredAboutData(),
          faqs: cloudFaqs,
        };
        saveAllLocally(next, false);
        setData(next);
      },
      onReviews: cloudReviews => {
        if (!active) return;
        receivedCloudReviews = true;
        const next: AboutStoreState = {
          ...getStoredAboutData(),
          reviews: cloudReviews,
        };
        saveAllLocally(next, false);
        setData(next);
      },
      onBlogPosts: cloudPosts => {
        if (!active) return;
        receivedCloudBlogs = true;
        const next: AboutStoreState = {
          ...getStoredAboutData(),
          blogPosts: cloudPosts,
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
    aboutContent: data.aboutContent,
    faqs: data.faqs,
    reviews: data.reviews,
    blogPosts: data.blogPosts,
    updateAboutContent,
    addFaq: addFaqItem,
    updateFaq: updateFaqItem,
    deleteFaq: deleteFaqItem,
    addReview: addReviewItem,
    updateReview: updateReviewItem,
    deleteReview: deleteReviewItem,
    addBlogPost,
    updateBlogPost,
    deleteBlogPost,
    resetToDefaults: resetAboutToDefaults,
  };
}
