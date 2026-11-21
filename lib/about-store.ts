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

    const aboutContent = rawContent ? { ...INITIAL_ABOUT_CONTENT, ...JSON.parse(rawContent) } : INITIAL_ABOUT_CONTENT;
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

function saveAll(state: AboutStoreState): void {
  hasMutated = true;
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
    // Ignore localStorage quota errors; IndexedDB retains the full dataset
  }
}

export function updateAboutContent(updates: Partial<AboutContent>): void {
  const current = getStoredAboutData();
  saveAll({
    ...current,
    aboutContent: { ...current.aboutContent, ...updates },
  });
}

// FAQ CRUD
export function addFaqItem(faq: Omit<FaqItem, 'id'>): void {
  const current = getStoredAboutData();
  const newFaq: FaqItem = {
    ...faq,
    id: `faq-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
  };
  saveAll({
    ...current,
    faqs: [...current.faqs, newFaq],
  });
}

export function updateFaqItem(id: string, updates: Partial<FaqItem>): void {
  const current = getStoredAboutData();
  const updated = current.faqs.map(f => (f.id === id ? { ...f, ...updates } : f));
  saveAll({ ...current, faqs: updated });
}

export function deleteFaqItem(id: string): void {
  const current = getStoredAboutData();
  saveAll({
    ...current,
    faqs: current.faqs.filter(f => f.id !== id),
  });
}

// Review CRUD
export function addReviewItem(review: Omit<Review, 'id'>): void {
  const current = getStoredAboutData();
  const newRev: Review = {
    ...review,
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
  };
  saveAll({
    ...current,
    reviews: [newRev, ...current.reviews],
  });
}

export function updateReviewItem(id: string, updates: Partial<Review>): void {
  const current = getStoredAboutData();
  const updated = current.reviews.map(r => (r.id === id ? { ...r, ...updates } : r));
  saveAll({ ...current, reviews: updated });
}

export function deleteReviewItem(id: string): void {
  const current = getStoredAboutData();
  saveAll({
    ...current,
    reviews: current.reviews.filter(r => r.id !== id),
  });
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
  saveAll({
    ...current,
    blogPosts: [newPost, ...current.blogPosts],
  });
}

export function updateBlogPost(id: string, updates: Partial<BlogPost>): void {
  const current = getStoredAboutData();
  const updated = current.blogPosts.map(p => (p.id === id ? { ...p, ...updates } : p));
  saveAll({ ...current, blogPosts: updated });
}

export function deleteBlogPost(id: string): void {
  const current = getStoredAboutData();
  saveAll({
    ...current,
    blogPosts: current.blogPosts.filter(p => p.id !== id),
  });
}

export function resetAboutToDefaults(): void {
  saveAll(DEFAULT_ABOUT_STATE);
}

export function useAboutSection() {
  const [data, setData] = useState<AboutStoreState>(DEFAULT_ABOUT_STATE);

  const refresh = useCallback(() => {
    setData(getStoredAboutData());
  }, []);

  useEffect(() => {
    let active = true;

    void idbGet<AboutStoreState>(IDB_KEY).then(stored => {
      if (!active || hasMutated) return;
      if (stored && stored.aboutContent) {
        const normalized: AboutStoreState = {
          aboutContent: { ...INITIAL_ABOUT_CONTENT, ...stored.aboutContent },
          faqs: Array.isArray(stored.faqs) ? stored.faqs : INITIAL_FAQS,
          reviews: Array.isArray(stored.reviews) ? stored.reviews : REVIEWS,
          blogPosts: Array.isArray(stored.blogPosts) ? stored.blogPosts : BLOG_POSTS,
        };
        cachedAboutState = normalized;
        setData(normalized);
      } else {
        const local = readLocalAboutData();
        if (local !== DEFAULT_ABOUT_STATE) {
          cachedAboutState = local;
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
