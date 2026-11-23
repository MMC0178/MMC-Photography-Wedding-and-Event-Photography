'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { User } from 'firebase/auth';
import {
  X,
  Lock,
  Upload,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Edit3,
  DollarSign,
  Layers,
  HeartHandshake,
  Star,
  BookOpen,
  HelpCircle,
  Image as ImageIcon,
  Camera,
  Cloud,
  LogIn,
  LogOut,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  FeaturedWedding,
  GalleryPhoto,
  GALLERY_CATEGORIES,
  PricingPackage,
  INITIAL_ABOUT_CONTENT,
  AboutContent,
  FaqItem,
  Review,
  BlogPost,
  GuestVaultContent,
  VaultPhoto,
} from '@/lib/wedding-data';
import { optimizeUploadedImage } from '@/lib/studio-storage';
import { addGalleryPhotosBatch } from '@/lib/gallery-store';
import {
  isAuthorizedStudioUser,
  signInStudioAdmin,
  signOutStudioAdmin,
  subscribeStudioAuth,
} from '@/lib/firebase';
import {
  publishAllStudioDataToCloud,
  publishAboutPageOnlyToCloud,
  publishAboutSectionToCloud,
  publishVaultSectionToCloud,
  publishPricingOnlyToCloud,
  clearLocalCloudVersionCache,
} from '@/lib/studio-cloud-sync';
import firebaseConfig from '../firebase-applet-config.json';

const FIREBASE_QUOTA_UPGRADE_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`;

interface PhotographerAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  featuredWeddings: FeaturedWedding[];
  onUpdateFeaturedWedding: (id: string, updates: Partial<FeaturedWedding>) => void;
  onAddPhotoToFeaturedWedding: (weddingId: string, photo: { url: string; caption: string }) => void;
  onRemovePhotoFromFeaturedWedding: (weddingId: string, photoId: string) => void;
  onResetFeaturedWeddings: () => void;
  galleryPhotos: GalleryPhoto[];
  onAddGalleryPhoto: (photo: Omit<GalleryPhoto, 'id'>) => void;
  onDeleteGalleryPhoto: (id: string) => void;
  onResetGalleryPhotos: () => void;
  pricingPackages: PricingPackage[];
  onUpdatePricingPackage: (id: string, updates: Partial<PricingPackage>) => void;
  onResetPricing: () => void;
  aboutContent: AboutContent;
  onUpdateAboutContent: (updates: Partial<AboutContent>) => void;
  faqs: FaqItem[];
  onAddFaq: (faq: Omit<FaqItem, 'id'>) => void;
  onUpdateFaq: (id: string, updates: Partial<FaqItem>) => void;
  onDeleteFaq: (id: string) => void;
  reviews: Review[];
  onAddReview: (review: Omit<Review, 'id'>) => void;
  onUpdateReview: (id: string, updates: Partial<Review>) => void;
  onDeleteReview: (id: string) => void;
  blogPosts: BlogPost[];
  onAddBlogPost: (post: Omit<BlogPost, 'id' | 'slug'>) => void;
  onUpdateBlogPost: (id: string, updates: Partial<BlogPost>) => void;
  onDeleteBlogPost: (id: string) => void;
  onResetAbout: () => void;
  vaultContent: GuestVaultContent;
  vaultPhotos: VaultPhoto[];
  onUpdateVaultContent: (updates: Partial<GuestVaultContent>) => void;
  onAddVaultPhoto: (photo: Omit<VaultPhoto, 'id'>) => void;
  onUpdateVaultPhoto: (id: string, updates: Partial<VaultPhoto>) => void;
  onDeleteVaultPhoto: (id: string) => void;
  onResetVault: () => void;
}

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519225424985-3b9e4a87c1be?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80',
];

export default function PhotographerAdminModal({
  isOpen,
  onClose,
  featuredWeddings,
  onUpdateFeaturedWedding,
  onAddPhotoToFeaturedWedding,
  onRemovePhotoFromFeaturedWedding,
  onResetFeaturedWeddings,
  galleryPhotos,
  onAddGalleryPhoto,
  onDeleteGalleryPhoto,
  onResetGalleryPhotos,
  pricingPackages,
  onUpdatePricingPackage,
  onResetPricing,
  aboutContent,
  onUpdateAboutContent,
  faqs,
  onAddFaq,
  onUpdateFaq,
  onDeleteFaq,
  reviews,
  onAddReview,
  onUpdateReview,
  onDeleteReview,
  blogPosts,
  onAddBlogPost,
  onUpdateBlogPost,
  onDeleteBlogPost,
  onResetAbout,
  vaultContent,
  vaultPhotos,
  onUpdateVaultContent,
  onAddVaultPhoto,
  onUpdateVaultPhoto,
  onDeleteVaultPhoto,
  onResetVault,
}: PhotographerAdminModalProps) {
  const [activeTab, setActiveTab] = useState<'homepage' | 'featured' | 'gallery' | 'pricing' | 'about' | 'vault'>('featured');
  const [aboutSubTab, setAboutSubTab] = useState<'page' | 'reviews' | 'blog' | 'faqs'>('page');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Editing state for a single featured wedding
  const [editingWeddingIndex, setEditingWeddingIndex] = useState<number | null>(null);
  const [newFeaturedPhotoUrl, setNewFeaturedPhotoUrl] = useState('');
  const [newFeaturedPhotoCaption, setNewFeaturedPhotoCaption] = useState('');

  // New gallery photo state
  const [newGalleryPhotoUrl, setNewGalleryPhotoUrl] = useState('');
  const [uploadedGalleryFileName, setUploadedGalleryFileName] = useState('');
  const [isUploadingGalleryImage, setIsUploadingGalleryImage] = useState(false);
  const [newGalleryPhotoTitle, setNewGalleryPhotoTitle] = useState('');
  const [newGalleryPhotoCaption, setNewGalleryPhotoCaption] = useState('');
  const [newGalleryCategory, setNewGalleryCategory] = useState<GalleryPhoto['category']>('bridal-prep');
  const [adminGalleryFilter, setAdminGalleryFilter] = useState<'all' | GalleryPhoto['category']>('all');

  // New Review state
  const [newReviewCouple, setNewReviewCouple] = useState('');
  const [newReviewVenue, setNewReviewVenue] = useState('');
  const [newReviewDate, setNewReviewDate] = useState('');
  const [newReviewHighlight, setNewReviewHighlight] = useState('');
  const [newReviewFull, setNewReviewFull] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  // New Blog Post state
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogCategory, setNewBlogCategory] = useState('Wedding Planning Tips');
  const [newBlogDate, setNewBlogDate] = useState('');
  const [newBlogReadTime, setNewBlogReadTime] = useState('4 min read');
  const [newBlogCover, setNewBlogCover] = useState(PRESET_IMAGES[2]);
  const [newBlogExcerpt, setNewBlogExcerpt] = useState('');
  const [newBlogContent, setNewBlogContent] = useState('');

  // New FAQ state
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');

  // New Guest Photo Vault snap state
  const [newVaultPhotoUrl, setNewVaultPhotoUrl] = useState('');
  const [newVaultUploadedFileName, setNewVaultUploadedFileName] = useState('');
  const [isUploadingVaultImage, setIsUploadingVaultImage] = useState(false);
  const [newVaultGuestName, setNewVaultGuestName] = useState('');
  const [newVaultTable, setNewVaultTable] = useState('');
  const [newVaultTime, setNewVaultTime] = useState('');
  const [newVaultNote, setNewVaultNote] = useState('');

  // Studio Owner Firebase Auth & Cloud Sync state
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isPublishingLive, setIsPublishingLive] = useState(false);
  const [isUploadingSingleImage, setIsUploadingSingleImage] = useState(false);
  const [publishProgressMsg, setPublishProgressMsg] = useState('');
  const [publishPercent, setPublishPercent] = useState(0);
  const [cloudErrorMsg, setCloudErrorMsg] = useState('');
  const [cloudErrorIsQuota, setCloudErrorIsQuota] = useState(false);

  useEffect(() => {
    const unsub = subscribeStudioAuth(user => {
      setAuthUser(user);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const isStudioAdmin = isAuthorizedStudioUser(authUser);

  const getProgressWidthClass = (pct: number): string => {
    if (pct >= 95) return 'w-full';
    if (pct >= 85) return 'w-11/12';
    if (pct >= 75) return 'w-5/6';
    if (pct >= 65) return 'w-3/4';
    if (pct >= 55) return 'w-2/3';
    if (pct >= 45) return 'w-1/2';
    if (pct >= 35) return 'w-2/5';
    if (pct >= 25) return 'w-1/3';
    if (pct >= 15) return 'w-1/4';
    if (pct >= 8) return 'w-1/6';
    return 'w-1/12';
  };

  const showSuccess = (msg: string, durationMs = 5000) => {
    setCloudErrorMsg('');
    setCloudErrorIsQuota(false);
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), durationMs);
  };

  const handleForcePullFromCloud = () => {
    clearLocalCloudVersionCache();
    window.location.reload();
  };

  const handleAdminSignIn = async () => {
    setIsSigningIn(true);
    setCloudErrorMsg('');
    try {
      const user = await signInStudioAdmin();
      if (!isAuthorizedStudioUser(user)) {
        setCloudErrorMsg(
          `Signed in as ${user.email || 'unknown account'}, which is not listed as the Studio Owner account. Please sign in with your Studio Owner Google account.`
        );
      } else {
        showSuccess(`Signed in as ${user.email}. Click "Publish All Changes Live" to push any local edits to the live website.`, 6000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in was cancelled or blocked.';
      setCloudErrorMsg(
        message.includes('unauthorized-domain')
          ? 'This domain needs to be added under Firebase Console → Authentication → Settings → Authorized domains before Google sign-in works here.'
          : 'Could not complete Google sign-in. Please allow popups and try again.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleAdminSignOut = async () => {
    await signOutStudioAdmin();
    showSuccess('Signed out of Studio Cloud Sync.');
  };

  const runCloudPublish = async (
    task: (onProgress: (status: string, pct?: number) => void) => Promise<void>,
    successMsg: string
  ) => {
    if (!isStudioAdmin) {
      setCloudErrorIsQuota(false);
      setCloudErrorMsg('Please sign in with your Studio Owner Google account above so changes publish live to all visitors.');
      return;
    }
    setIsPublishingLive(true);
    setPublishProgressMsg('Starting live sync...');
    setPublishPercent(8);
    setCloudErrorMsg('');
    setCloudErrorIsQuota(false);
    setSaveSuccessMsg('');
    try {
      await task((status, pct) => {
        setPublishProgressMsg(status);
        if (typeof pct === 'number') {
          setPublishPercent(pct);
        }
      });
      showSuccess(successMsg, 8000);
    } catch (err) {
      console.error('Failed to publish live changes:', err);
      let detail = '';
      if (err instanceof Error && err.message) {
        try {
          const parsed = JSON.parse(err.message) as { error?: string; path?: string };
          detail = [parsed.path ? `(${parsed.path})` : '', parsed.error || ''].filter(Boolean).join(' ');
        } catch {
          detail = err.message;
        }
      } else if (err) {
        detail = String(err);
      }
      const lower = detail.toLowerCase();
      const looksLikeQuota =
        lower.includes('quota') ||
        lower.includes('resource_exhausted') ||
        lower.includes('429') ||
        lower.includes('timed out');
      setCloudErrorIsQuota(looksLikeQuota);
      setCloudErrorMsg(
        looksLikeQuota
          ? 'Publishing could not complete because your Firebase Firestore free daily quota limit has been reached (or the database timed out while throttled). Quota resets tomorrow, or you can upgrade the database immediately in Firebase Console.'
          : detail
            ? `Could not publish to the live cloud database: ${detail}`
            : 'Could not publish to the live cloud database. Please refresh the page, verify you are signed in with your Studio Owner account, and try again.'
      );
    } finally {
      setIsPublishingLive(false);
      setPublishProgressMsg('');
      setPublishPercent(0);
    }
  };

  const handlePublishAllLive = async (customSuccessMsg?: string) => {
    await runCloudPublish(
      onProgress =>
        publishAllStudioDataToCloud(
          {
            galleryPhotos,
            featuredWeddings,
            pricingPackages,
            aboutContent,
            faqs,
            reviews,
            blogPosts,
            vaultContent,
            vaultPhotos,
          },
          onProgress
        ),
      customSuccessMsg ||
        `All changes published live! (${galleryPhotos.length} gallery photos, ${featuredWeddings.length} featured weddings, pricing & text synced)`
    );
  };

  const handlePublishAboutTab = async () => {
    if (aboutSubTab === 'page') {
      await runCloudPublish(
        onProgress =>
          publishAboutPageOnlyToCloud(
            { aboutContent, pricingPackages },
            onProgress
          ),
        'About Us text & photo published live!'
      );
    } else {
      await runCloudPublish(
        onProgress =>
          publishAboutSectionToCloud(
            { aboutContent, faqs, reviews, blogPosts, pricingPackages },
            onProgress
          ),
        'About Us, Reviews, Blog & FAQs published live!'
      );
    }
  };

  const handlePublishHomepageTab = async () => {
    await runCloudPublish(
      onProgress =>
        publishAboutPageOnlyToCloud(
          { aboutContent, pricingPackages },
          onProgress
        ),
      'Homepage photos published live!'
    );
  };

  const handlePublishPricingTab = async () => {
    await runCloudPublish(
      onProgress => publishPricingOnlyToCloud(pricingPackages, onProgress),
      'Investment & Pricing packages published live!'
    );
  };

  const handlePublishVaultTab = async () => {
    await runCloudPublish(
      onProgress =>
        publishVaultSectionToCloud(
          { vaultContent, vaultPhotos, pricingPackages },
          onProgress
        ),
      'Guest Photo Vault changes published live!'
    );
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (url: string) => void,
    options?: { maxChars?: number; successMessage?: string }
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingSingleImage(true);
    setCloudErrorMsg('');
    try {
      const targetMaxChars = options?.maxChars ?? 220000;
      const optimizedUrl = await optimizeUploadedImage(file, 1280, 0.78, targetMaxChars);
      callback(optimizedUrl);
      if (options?.successMessage) {
        showSuccess(options.successMessage);
      }
    } catch (err) {
      console.error('Failed to process uploaded image:', err);
      const errMsg =
        err instanceof Error && err.message
          ? err.message
          : 'Could not read the selected image file. Please try uploading a JPG, PNG, or WebP photo.';
      setCloudErrorMsg(errMsg);
    } finally {
      setIsUploadingSingleImage(false);
    }
  };

  const handleGalleryFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    setIsUploadingGalleryImage(true);
    try {
      if (files.length === 1) {
        const optimizedUrl = await optimizeUploadedImage(files[0]);
        setNewGalleryPhotoUrl(optimizedUrl);
        setUploadedGalleryFileName(files[0].name);
      } else {
        const batchToAdd: Array<Omit<GalleryPhoto, 'id'>> = [];
        for (const file of files) {
          const optimizedUrl = await optimizeUploadedImage(file, 1280, 0.78, 240000);
          batchToAdd.push({
            url: optimizedUrl,
            title: file.name.replace(/\.[^/.]+$/, '') || 'Wedding Photograph',
            caption: '',
            category: newGalleryCategory,
          });
        }
        addGalleryPhotosBatch(batchToAdd);
        setAdminGalleryFilter(newGalleryCategory);
        showSuccess(
          `${batchToAdd.length} photos added to ${newGalleryCategory.replace('-', ' ')} gallery${isStudioAdmin ? ' and syncing live!' : ' (sign in above to publish live)!'}`
        );
      }
    } catch (err) {
      console.error('Error optimizing uploaded gallery photo(s):', err);
      showSuccess('Could not process one of the selected image files.');
    } finally {
      setIsUploadingGalleryImage(false);
    }
  };

  const handleAddGalleryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingGalleryImage || !newGalleryPhotoUrl.trim()) return;

    onAddGalleryPhoto({
      url: newGalleryPhotoUrl.trim(),
      title: newGalleryPhotoTitle.trim() || 'Wedding Photograph',
      caption: newGalleryPhotoCaption.trim() || '',
      category: newGalleryCategory,
    });

    setAdminGalleryFilter(newGalleryCategory);
    setNewGalleryPhotoUrl('');
    setUploadedGalleryFileName('');
    setNewGalleryPhotoTitle('');
    setNewGalleryPhotoCaption('');
    showSuccess(`Photo added to ${newGalleryCategory.replace('-', ' ')} gallery!`);
  };

  const handleAddReviewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewCouple.trim() || !newReviewFull.trim()) return;

    onAddReview({
      couple: newReviewCouple.trim(),
      venue: newReviewVenue.trim() || 'United Kingdom',
      date: newReviewDate.trim() || 'Married recently',
      rating: newReviewRating,
      highlight: newReviewHighlight.trim() || newReviewFull.trim().slice(0, 70),
      snippet: newReviewFull.trim().slice(0, 110) + (newReviewFull.trim().length > 110 ? '...' : ''),
      fullReview: newReviewFull.trim(),
    });

    setNewReviewCouple('');
    setNewReviewVenue('');
    setNewReviewDate('');
    setNewReviewHighlight('');
    setNewReviewFull('');
    setNewReviewRating(5);
    showSuccess('New couple review added!');
  };

  const handleAddBlogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlogTitle.trim() || !newBlogContent.trim()) return;

    const paragraphs = newBlogContent
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);

    onAddBlogPost({
      title: newBlogTitle.trim(),
      category: newBlogCategory.trim() || 'Wedding Planning Tips',
      date:
        newBlogDate.trim() ||
        new Date().toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' }),
      readTime: newBlogReadTime.trim() || '4 min read',
      coverImage: newBlogCover.trim() || PRESET_IMAGES[2],
      excerpt: newBlogExcerpt.trim() || paragraphs[0] || '',
      content: paragraphs.length > 0 ? paragraphs : [newBlogContent.trim()],
    });

    setNewBlogTitle('');
    setNewBlogDate('');
    setNewBlogExcerpt('');
    setNewBlogContent('');
    showSuccess('New blog article published!');
  };

  const handleAddFaqItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;

    onAddFaq({
      q: newFaqQuestion.trim(),
      a: newFaqAnswer.trim(),
    });

    setNewFaqQuestion('');
    setNewFaqAnswer('');
    showSuccess('New FAQ added!');
  };

  const handleVaultFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onDone?: (url: string, fileName: string) => void
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingVaultImage(true);
    try {
      const optimizedUrl = await optimizeUploadedImage(file);
      if (onDone) {
        onDone(optimizedUrl, file.name);
      } else {
        setNewVaultPhotoUrl(optimizedUrl);
        setNewVaultUploadedFileName(file.name);
        showSuccess('Photo ready! Click "Add Guest Snap" to publish it to Guest Photo Vault.');
      }
    } catch (err) {
      console.error('Failed to process vault photo upload:', err);
      showSuccess('Could not read that image file. Please try another photo.');
    } finally {
      setIsUploadingVaultImage(false);
    }
  };

  const handleAddVaultPhotoItem = (e: React.FormEvent) => {
    e.preventDefault();
    const photoUrl = newVaultPhotoUrl.trim();
    if (!photoUrl) {
      showSuccess('Please upload a photo from your computer or paste an image URL first.');
      return;
    }

    onAddVaultPhoto({
      url: photoUrl,
      guestName: newVaultGuestName.trim() || 'Wedding Guest',
      table: newVaultTable.trim() || 'Reception Guest',
      time: newVaultTime.trim() || 'Evening Celebration',
      note: newVaultNote.trim(),
    });

    setNewVaultPhotoUrl('');
    setNewVaultUploadedFileName('');
    setNewVaultGuestName('');
    setNewVaultTable('');
    setNewVaultTime('');
    setNewVaultNote('');
    showSuccess('Guest snap added to Guest Photo Vault!');
  };

  const currentEditingWedding = editingWeddingIndex !== null ? featuredWeddings[editingWeddingIndex] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-md shadow-2xl border border-stone-200 w-full max-w-4xl my-6 overflow-hidden text-stone-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1e2321] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#c2a378] flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg tracking-wide">
                MMC Studio Management
              </h3>
              <p className="text-[11px] font-sans text-stone-300">
                Private Owner Portal — Update Homepage Photo, Featured Weddings, Gallery, Pricing, About Us &amp; Guest Photo Vault
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 transition-colors"
            aria-label="Close admin modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Sync / Studio Owner Auth Bar */}
        <div
          className={`px-6 py-2.5 border-b text-xs flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            isStudioAdmin
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Cloud
              className={`w-4 h-4 shrink-0 ${
                isStudioAdmin ? 'text-emerald-600' : 'text-amber-600'
              }`}
            />
            {isStudioAdmin ? (
              <span className="truncate">
                <strong>Live Cloud Sync Active</strong> ({authUser?.email}) — Changes publish automatically for all visitors.
              </span>
            ) : (
              <span>
                <strong>Sign in required for live website updates:</strong> Sign in with your Studio Owner Google account so edits publish live to all visitors.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isStudioAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => void handlePublishAllLive()}
                  disabled={isPublishingLive}
                  className="inline-flex items-center gap-1.5 bg-[#1e2321] hover:bg-stone-800 text-white px-3.5 py-1.5 rounded text-[11px] uppercase tracking-wider font-sans font-semibold transition-colors disabled:opacity-60"
                >
                  {isPublishingLive && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c2a378]" />}
                  <span>{isPublishingLive ? `Publishing (${publishPercent}%)` : 'Publish All Changes Live'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleForcePullFromCloud}
                  disabled={isPublishingLive}
                  title="Pull latest published photos and text from the live cloud database"
                  className="inline-flex items-center gap-1 border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 px-2.5 py-1.5 rounded text-[11px] font-semibold transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync Latest</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleAdminSignOut()}
                  className="inline-flex items-center gap-1 border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 px-2.5 py-1.5 rounded text-[11px] font-semibold transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void handleAdminSignIn()}
                disabled={isSigningIn}
                className="inline-flex items-center gap-1.5 bg-[#1e2321] hover:bg-stone-800 text-white px-3.5 py-1.5 rounded text-[11px] uppercase tracking-wider font-sans font-semibold transition-colors disabled:opacity-50"
              >
                <LogIn className="w-3.5 h-3.5 text-[#c2a378]" />
                <span>{isSigningIn ? 'Signing In...' : authUser ? 'Switch Google Account' : 'Sign In with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Publishing Progress Banner (always visible above tabs) */}
        {isPublishingLive && (
          <div className="bg-[#1e2321] text-white px-6 py-3 border-b border-[#c2a378]/40 space-y-2 shrink-0">
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-[#c2a378] shrink-0" />
                <span>{publishProgressMsg || 'Publishing changes to live website...'}</span>
              </div>
              <span className="font-mono text-[#c2a378] font-semibold shrink-0">{publishPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className={`h-full bg-[#c2a378] rounded-full transition-all duration-300 ${getProgressWidthClass(publishPercent)}`}
              />
            </div>
          </div>
        )}

        {/* Cloud Error Notice Banner */}
        {cloudErrorMsg && (
          <div className="bg-red-50 border-b border-red-200 text-red-800 text-xs py-2.5 px-6 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{cloudErrorMsg}</span>
            </div>
            {cloudErrorIsQuota && (
              <a
                href={FIREBASE_QUOTA_UPGRADE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider shrink-0 transition-colors"
              >
                <span>Upgrade Firestore</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Global Save Notice Banner */}
        {saveSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs py-2.5 px-6 flex items-center gap-2 shrink-0">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-6 pt-2 shrink-0 overflow-x-auto text-xs font-sans font-semibold uppercase tracking-wider">
          <div className="flex gap-4 whitespace-nowrap">
            <button
              onClick={() => setActiveTab('homepage')}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'homepage'
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#c2a378]" />
              <span>Homepage Photo</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('featured');
                setEditingWeddingIndex(null);
              }}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'featured'
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#c2a378]" />
              <span>3 Featured Weddings</span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'gallery'
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#c2a378]" />
              <span>Wedding Gallery Photos</span>
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'pricing'
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-[#c2a378]" />
              <span>Investment / Pricing</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'about'
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5 text-[#c2a378]" />
              <span>About Us</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'vault'
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-[#c2a378]" />
              <span>Guest Photo Vault</span>
            </button>
          </div>

          <div className="text-[11px] text-stone-400 normal-case pb-2 hidden lg:block">
            {isStudioAdmin ? 'Auto-syncing live to website' : 'Local preview until signed in'}
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 0: HOMEPAGE PHOTO */}
          {activeTab === 'homepage' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="font-serif text-2xl text-stone-900">
                  Homepage Photographs
                </h3>
                <p className="font-serif italic text-stone-600 text-sm">
                  Change the main photograph at the top of your homepage, or update the homepage &ldquo;About MMC Photography&rdquo; portrait.
                </p>
              </div>

              {/* Main Hero Photo Card */}
              <div className="p-5 border border-stone-200 rounded-xs bg-[#fbf9f6] space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <h4 className="font-serif text-lg text-stone-900">
                    Main Homepage Hero Photo (Top Banner)
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateAboutContent({ homepageHeroImage: INITIAL_ABOUT_CONTENT.homepageHeroImage });
                      showSuccess('Homepage hero photo reset to default.');
                    }}
                    className="text-xs text-stone-500 hover:text-stone-900 underline"
                  >
                    Reset to Default
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                  <div className="relative w-full sm:w-56 aspect-[16/10] rounded overflow-hidden border border-stone-300 shrink-0 bg-stone-100">
                    <Image
                      src={aboutContent.homepageHeroImage || INITIAL_ABOUT_CONTENT.homepageHeroImage}
                      alt="Main homepage hero preview"
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                      unoptimized={
                        (aboutContent.homepageHeroImage || '').startsWith('data:') ||
                        (aboutContent.homepageHeroImage || '').startsWith('blob:')
                      }
                    />
                  </div>

                  <div className="flex-1 w-full space-y-3">
                      <label className="inline-flex items-center gap-1.5 text-xs text-stone-800 hover:text-stone-950 border border-stone-300 px-3.5 py-2 rounded cursor-pointer hover:bg-stone-100 bg-white font-medium shadow-2xs">
                        {isUploadingSingleImage ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c2a378]" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-[#c2a378]" />
                        )}
                        <span>{isUploadingSingleImage ? 'Processing photo...' : 'Upload new hero photo from computer'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingSingleImage}
                          className="hidden"
                          onChange={e =>
                            handleFileUpload(
                              e,
                              url => onUpdateAboutContent({ homepageHeroImage: url }),
                              {
                                maxChars: 140000,
                                successMessage: 'Homepage main photo updated! Click "Publish Homepage Live" below to save live.',
                              }
                            )
                          }
                        />
                      </label>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1">
                        Or paste image URL
                      </label>
                      <input
                        type="text"
                        value={
                          (aboutContent.homepageHeroImage || '').startsWith('data:')
                            ? ''
                            : aboutContent.homepageHeroImage || ''
                        }
                        onChange={e => onUpdateAboutContent({ homepageHeroImage: e.target.value })}
                        placeholder={
                          (aboutContent.homepageHeroImage || '').startsWith('data:')
                            ? 'Uploaded photo active (paste new URL to replace)'
                            : 'Paste image URL...'
                        }
                        className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Homepage About Portrait Card */}
              <div className="p-5 border border-stone-200 rounded-xs bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <h4 className="font-serif text-lg text-stone-900">
                    Homepage &ldquo;About MMC Photography&rdquo; Portrait
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateAboutContent({ homepageImage: INITIAL_ABOUT_CONTENT.homepageImage });
                      showSuccess('Homepage About portrait reset to default.');
                    }}
                    className="text-xs text-stone-500 hover:text-stone-900 underline"
                  >
                    Reset to Default
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                  <div className="relative w-full sm:w-44 aspect-[4/3] rounded overflow-hidden border border-stone-300 shrink-0 bg-stone-100">
                    <Image
                      src={aboutContent.homepageImage || INITIAL_ABOUT_CONTENT.homepageImage}
                      alt="Homepage About portrait preview"
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                      unoptimized={
                        (aboutContent.homepageImage || '').startsWith('data:') ||
                        (aboutContent.homepageImage || '').startsWith('blob:')
                      }
                    />
                  </div>

                  <div className="flex-1 w-full space-y-3">
                    <label className="inline-flex items-center gap-1.5 text-xs text-stone-800 hover:text-stone-950 border border-stone-300 px-3.5 py-2 rounded cursor-pointer hover:bg-stone-100 bg-white font-medium shadow-2xs">
                      {isUploadingSingleImage ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c2a378]" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-[#c2a378]" />
                      )}
                      <span>{isUploadingSingleImage ? 'Processing photo...' : 'Upload new portrait from computer'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingSingleImage}
                        className="hidden"
                        onChange={e =>
                          handleFileUpload(
                            e,
                            url => onUpdateAboutContent({ homepageImage: url }),
                            {
                              maxChars: 140000,
                              successMessage: 'Homepage About portrait updated! Click "Publish Homepage Live" below to save live.',
                            }
                          )
                        }
                      />
                    </label>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1">
                        Or paste image URL
                      </label>
                      <input
                        type="text"
                        value={
                          (aboutContent.homepageImage || '').startsWith('data:')
                            ? ''
                            : aboutContent.homepageImage || ''
                        }
                        onChange={e => onUpdateAboutContent({ homepageImage: e.target.value })}
                        placeholder={
                          (aboutContent.homepageImage || '').startsWith('data:')
                            ? 'Uploaded photo active (paste new URL to replace)'
                            : 'Paste image URL...'
                        }
                        className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded text-xs text-stone-600">
                <strong className="text-stone-800">Tip — &ldquo;The Wedding Story&rdquo; Category Tiles:</strong> Each of the 5 category tiles on your homepage automatically displays the newest photo uploaded into that category inside <span className="font-semibold text-stone-800">Wedding Gallery Photos</span>.
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end items-center text-xs">
                <button
                  type="button"
                  onClick={() => void handlePublishHomepageTab()}
                  disabled={isPublishingLive || isUploadingSingleImage}
                  className="inline-flex items-center gap-1.5 bg-[#1e2321] text-white px-6 py-2.5 rounded text-xs uppercase tracking-widest font-sans font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {isPublishingLive && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c2a378]" />}
                  <span>{isPublishingLive ? `Publishing (${publishPercent}%)` : 'Publish Homepage Live'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: FEATURED WEDDINGS (EXACTLY 3) */}
          {activeTab === 'featured' && (
            <div className="space-y-6">
              {currentEditingWedding ? (
                /* Editing a Specific Featured Wedding */
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <button
                      onClick={() => setEditingWeddingIndex(null)}
                      className="text-xs font-sans text-stone-600 hover:text-stone-900 underline underline-offset-4"
                    >
                      ← Back to all 3 featured weddings
                    </button>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#c2a378]">
                      Editing Wedding #{editingWeddingIndex! + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Couple Names *
                      </label>
                      <input
                        type="text"
                        value={currentEditingWedding.couple}
                        onChange={e => onUpdateFeaturedWedding(currentEditingWedding.id, { couple: e.target.value })}
                        className="w-full text-sm border border-stone-300 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#c2a378]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Wedding Date
                      </label>
                      <input
                        type="text"
                        value={currentEditingWedding.date}
                        onChange={e => onUpdateFeaturedWedding(currentEditingWedding.id, { date: e.target.value })}
                        className="w-full text-sm border border-stone-300 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#c2a378]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Venue Name
                      </label>
                      <input
                        type="text"
                        value={currentEditingWedding.venue}
                        onChange={e => onUpdateFeaturedWedding(currentEditingWedding.id, { venue: e.target.value })}
                        className="w-full text-sm border border-stone-300 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#c2a378]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Location / County
                      </label>
                      <input
                        type="text"
                        value={currentEditingWedding.location}
                        onChange={e => onUpdateFeaturedWedding(currentEditingWedding.id, { location: e.target.value })}
                        className="w-full text-sm border border-stone-300 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#c2a378]"
                      />
                    </div>
                  </div>

                  {/* Cover Photo */}
                  <div className="space-y-2 border-t border-stone-200 pt-4">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                      Cover Photograph
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="relative w-28 h-20 rounded overflow-hidden border border-stone-300 shrink-0 bg-stone-100">
                        <Image
                          src={currentEditingWedding.coverImage}
                          alt="Cover"
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                          unoptimized={
                            currentEditingWedding.coverImage.startsWith('data:') ||
                            currentEditingWedding.coverImage.startsWith('blob:')
                          }
                        />
                      </div>
                      <div className="flex-1 w-full space-y-2">
                        <input
                          type="text"
                          value={
                            currentEditingWedding.coverImage.startsWith('data:')
                              ? ''
                              : currentEditingWedding.coverImage
                          }
                          onChange={e => onUpdateFeaturedWedding(currentEditingWedding.id, { coverImage: e.target.value })}
                          placeholder={
                            currentEditingWedding.coverImage.startsWith('data:')
                              ? 'Uploaded photo active (paste new URL to replace)'
                              : 'Paste image URL...'
                          }
                          className="w-full text-xs border border-stone-300 rounded px-3 py-2"
                        />
                        <label className="inline-flex items-center gap-1.5 text-xs text-stone-700 hover:text-stone-900 border border-dashed border-stone-300 px-3 py-1.5 rounded cursor-pointer hover:bg-stone-50">
                          <Upload className="w-3.5 h-3.5 text-stone-500" />
                          <span>Upload new cover from computer</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => handleFileUpload(e, url => onUpdateFeaturedWedding(currentEditingWedding.id, { coverImage: url }))}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Narrative Story & Quote */}
                  <div className="space-y-3 border-t border-stone-200 pt-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Wedding Story Description
                      </label>
                      <textarea
                        rows={3}
                        value={currentEditingWedding.story}
                        onChange={e => onUpdateFeaturedWedding(currentEditingWedding.id, { story: e.target.value })}
                        className="w-full text-sm border border-stone-300 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#c2a378]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Couple Testimonial Quote
                      </label>
                      <input
                        type="text"
                        value={currentEditingWedding.highlightQuote}
                        onChange={e => onUpdateFeaturedWedding(currentEditingWedding.id, { highlightQuote: e.target.value })}
                        className="w-full text-sm border border-stone-300 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#c2a378]"
                      />
                    </div>
                  </div>

                  {/* Photos for this Wedding (No categories!) */}
                  <div className="space-y-3 border-t border-stone-200 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-serif text-lg text-stone-900">
                          Wedding Photos ({currentEditingWedding.photos.length})
                        </h4>
                        <p className="text-[11px] text-stone-500 font-sans">
                          These photos belong exclusively to this featured wedding and are NOT categorized into the main gallery.
                        </p>
                      </div>
                    </div>

                    {/* Add Photo to this Wedding */}
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center text-xs">
                      <input
                        type="text"
                        placeholder="Paste image URL..."
                        value={newFeaturedPhotoUrl.startsWith('data:') ? '' : newFeaturedPhotoUrl}
                        onChange={e => setNewFeaturedPhotoUrl(e.target.value)}
                        className="flex-1 bg-white border border-stone-300 rounded px-2.5 py-1.5"
                      />
                      <label className="inline-flex items-center justify-center gap-1.5 text-xs text-stone-700 hover:text-stone-900 border border-dashed border-stone-300 px-3 py-1.5 rounded cursor-pointer hover:bg-stone-100 bg-white shrink-0">
                        <Upload className="w-3.5 h-3.5 text-stone-500" />
                        <span>Upload photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e =>
                            handleFileUpload(e, url => {
                              onAddPhotoToFeaturedWedding(currentEditingWedding.id, {
                                url,
                                caption: newFeaturedPhotoCaption.trim(),
                              });
                              setNewFeaturedPhotoCaption('');
                              showSuccess('Photo uploaded to this featured wedding!');
                            })
                          }
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="Caption (optional)..."
                        value={newFeaturedPhotoCaption}
                        onChange={e => setNewFeaturedPhotoCaption(e.target.value)}
                        className="w-full sm:w-44 bg-white border border-stone-300 rounded px-2.5 py-1.5"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newFeaturedPhotoUrl.trim()) return;
                          onAddPhotoToFeaturedWedding(currentEditingWedding.id, {
                            url: newFeaturedPhotoUrl.trim(),
                            caption: newFeaturedPhotoCaption.trim(),
                          });
                          setNewFeaturedPhotoUrl('');
                          setNewFeaturedPhotoCaption('');
                          showSuccess('Photo added to this wedding!');
                        }}
                        className="bg-[#1e2321] text-white px-3 py-1.5 rounded hover:bg-stone-800 shrink-0 font-medium"
                      >
                        Add Photo
                      </button>
                    </div>

                    {/* Existing Photos Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1">
                      {currentEditingWedding.photos.map(photo => (
                        <div key={photo.id} className="relative aspect-[4/3] rounded overflow-hidden border border-stone-200 group bg-stone-100">
                          <Image
                            src={photo.url}
                            alt={photo.caption || 'Wedding moment'}
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                            unoptimized={photo.url.startsWith('data:') || photo.url.startsWith('blob:')}
                          />
                          <button
                            type="button"
                            onClick={() => onRemovePhotoFromFeaturedWedding(currentEditingWedding.id, photo.id)}
                            className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-600 text-white rounded p-1 transition-colors"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {photo.caption && (
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] p-1 truncate">
                              {photo.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingWeddingIndex(null);
                        showSuccess('Featured wedding changes saved!');
                      }}
                      className="bg-[#1e2321] text-white px-6 py-2.5 rounded text-xs uppercase tracking-widest font-sans font-semibold hover:bg-stone-800 transition-colors"
                    >
                      Done Editing Wedding #{editingWeddingIndex! + 1}
                    </button>
                  </div>
                </div>
              ) : (
                /* List of 3 Featured Weddings */
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-serif text-2xl text-stone-900">
                      Featured Weddings (Limit 3)
                    </h3>
                    <p className="font-serif italic text-stone-600 text-sm">
                      These 3 weddings are showcased on the website. You can edit couple names, story text, cover photos, and add/remove photos for each wedding anytime.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {featuredWeddings.slice(0, 3).map((w, idx) => (
                      <div
                        key={w.id}
                        className="bg-white border border-stone-300 rounded-xs overflow-hidden shadow-xs flex flex-col justify-between"
                      >
                        <div className="relative aspect-[16/10] bg-stone-100">
                          <Image
                            src={w.coverImage}
                            alt={w.couple}
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                            unoptimized={w.coverImage.startsWith('data:') || w.coverImage.startsWith('blob:')}
                          />
                          <div className="absolute top-2 left-2 bg-stone-900/80 text-white text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-sans font-semibold">
                            Slot #{idx + 1}
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-sans">
                            {w.photos.length} Photos
                          </div>
                        </div>

                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="text-xs text-stone-500 font-sans">
                              {w.date} · {w.venue}
                            </div>
                            <h4 className="font-serif text-xl text-stone-900 font-medium">
                              {w.couple}
                            </h4>
                            <p className="font-serif text-xs text-stone-600 line-clamp-2 mt-1">
                              {w.story}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setEditingWeddingIndex(idx)}
                            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-900 py-2 rounded text-xs uppercase tracking-wider font-sans font-semibold flex items-center justify-center gap-1.5 transition-colors border border-stone-300"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#c2a378]" />
                            <span>Edit Wedding #{idx + 1}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-stone-200 flex justify-between items-center text-xs text-stone-500">
                    <span>Exactly 3 featured wedding slots are maintained.</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Reset the 3 featured weddings to initial defaults?')) {
                          onResetFeaturedWeddings();
                          showSuccess('Featured weddings reset to defaults.');
                        }
                      }}
                      className="text-stone-500 hover:text-stone-900 underline"
                    >
                      Reset Featured Weddings to Defaults
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WEDDING GALLERY PHOTOS (CATEGORIZED) */}
          {activeTab === 'gallery' && (() => {
            const visibleGalleryPhotos =
              adminGalleryFilter === 'all'
                ? galleryPhotos
                : galleryPhotos.filter(p => p.category === adminGalleryFilter);

            return (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="font-serif text-2xl text-stone-900">
                    Wedding Gallery Photos ({galleryPhotos.length})
                  </h3>
                  <p className="font-serif italic text-stone-600 text-sm">
                    Upload photos directly to the wedding gallery and choose their category (<span className="text-stone-900 font-sans font-semibold">Bridal Prep, Ceremony, On Location, Reception, Dancing</span>).
                  </p>
                </div>

                {/* Upload Form */}
                <form onSubmit={handleAddGalleryItem} className="p-5 bg-stone-50 border border-stone-200 rounded-xs space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-900">
                    <Upload className="w-4 h-4 text-[#c2a378]" />
                    <span>Upload New Photo to Wedding Gallery</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Photo Source & Live Preview */}
                    <div className="space-y-2.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                        Upload Photo from Computer or Paste URL *
                      </label>

                      <div className="flex items-start gap-3">
                        {/* Live Thumbnail Preview */}
                        <div className="relative w-16 h-20 rounded border border-stone-300 bg-white overflow-hidden shrink-0 flex items-center justify-center text-[10px] text-stone-400 text-center px-1">
                          {isUploadingGalleryImage ? (
                            <span>Loading...</span>
                          ) : newGalleryPhotoUrl ? (
                            <Image
                              src={newGalleryPhotoUrl}
                              alt="Selected photo preview"
                              fill
                              className="object-cover"
                              referrerPolicy="no-referrer"
                              unoptimized={
                                newGalleryPhotoUrl.startsWith('data:') ||
                                newGalleryPhotoUrl.startsWith('blob:')
                              }
                            />
                          ) : (
                            <span>No photo selected</span>
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 text-xs text-stone-800 hover:text-stone-950 border border-stone-300 px-3 py-1.5 rounded cursor-pointer hover:bg-stone-100 bg-white font-medium shadow-2xs">
                              <Upload className="w-3.5 h-3.5 text-[#c2a378]" />
                              <span>
                                {isUploadingGalleryImage
                                  ? 'Preparing photo...'
                                  : 'Choose photo(s) from computer'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleGalleryFilesSelected}
                              />
                            </label>

                            {newGalleryPhotoUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setNewGalleryPhotoUrl('');
                                  setUploadedGalleryFileName('');
                                }}
                                className="text-[11px] text-stone-500 hover:text-red-600 underline"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          {uploadedGalleryFileName && newGalleryPhotoUrl.startsWith('data:') ? (
                            <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1 flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                Ready: {uploadedGalleryFileName} (click Add Photo to Gallery below)
                              </span>
                            </div>
                          ) : (
                            <input
                              type="text"
                              placeholder="Or paste an image URL..."
                              value={newGalleryPhotoUrl.startsWith('data:') ? '' : newGalleryPhotoUrl}
                              onChange={e => {
                                setNewGalleryPhotoUrl(e.target.value);
                                setUploadedGalleryFileName('');
                              }}
                              className="w-full text-xs border border-stone-300 rounded px-3 py-1.5 bg-white"
                            />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Select 1 photo to preview &amp; add, or select multiple files at once to upload them straight into the chosen category.
                      </p>
                    </div>

                    {/* Category Selection */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Gallery Category *
                      </label>
                      <select
                        value={newGalleryCategory}
                        onChange={e => setNewGalleryCategory(e.target.value as GalleryPhoto['category'])}
                        className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white font-medium text-stone-900"
                      >
                        <option value="bridal-prep">Bridal Prep</option>
                        <option value="ceremony">Ceremony</option>
                        <option value="on-location">On Location</option>
                        <option value="reception">Reception</option>
                        <option value="dancing">Dancing</option>
                      </select>
                      <p className="text-[11px] text-stone-500 mt-1">
                        This photo will appear in the main Wedding Gallery under this category.
                      </p>
                    </div>
                  </div>

                  {/* Caption / Title */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Photo Title (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Evening Confetti Moment"
                        value={newGalleryPhotoTitle}
                        onChange={e => setNewGalleryPhotoTitle(e.target.value)}
                        className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Caption / Short Note (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Romantic twilight stroll by the lake"
                        value={newGalleryPhotoCaption}
                        onChange={e => setNewGalleryPhotoCaption(e.target.value)}
                        className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isUploadingGalleryImage || !newGalleryPhotoUrl.trim()}
                      className="bg-[#1e2321] disabled:bg-stone-400 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded text-xs uppercase tracking-widest font-sans font-semibold hover:bg-stone-800 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#c2a378]" />
                      <span>
                        {isUploadingGalleryImage ? 'Preparing Photo...' : 'Add Photo to Gallery'}
                      </span>
                    </button>
                  </div>
                </form>

                {/* Gallery Photos List by Category */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-serif text-lg text-stone-900">
                      Current Gallery Photos ({visibleGalleryPhotos.length})
                    </h4>

                    <div className="flex flex-wrap gap-1.5 text-[11px] font-sans">
                      <button
                        type="button"
                        onClick={() => setAdminGalleryFilter('all')}
                        className={`px-2.5 py-1 rounded border transition-colors ${
                          adminGalleryFilter === 'all'
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        All ({galleryPhotos.length})
                      </button>
                      {GALLERY_CATEGORIES.map(cat => {
                        const count = galleryPhotos.filter(p => p.category === cat.id).length;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setAdminGalleryFilter(cat.id)}
                            className={`px-2.5 py-1 rounded border transition-colors ${
                              adminGalleryFilter === cat.id
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            {cat.name} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1">
                    {visibleGalleryPhotos.map(photo => (
                      <div
                        key={photo.id}
                        className="relative aspect-[3/4] rounded overflow-hidden border border-stone-200 group bg-stone-100"
                      >
                        <Image
                          src={photo.url}
                          alt={photo.caption || photo.title}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                          unoptimized={photo.url.startsWith('data:') || photo.url.startsWith('blob:')}
                        />
                        <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-sans">
                          {photo.category.replace('-', ' ')}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Delete this photo from the gallery?')) {
                              onDeleteGalleryPhoto(photo.id);
                              showSuccess('Photo removed from gallery.');
                            }
                          }}
                          className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-600 text-white rounded p-1 transition-colors"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Reset gallery photos to default collection?')) {
                          onResetGalleryPhotos();
                          showSuccess('Gallery photos reset to defaults.');
                        }
                      }}
                      className="text-xs text-stone-500 hover:text-stone-900 underline"
                    >
                      Reset Gallery to Defaults
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 3: INVESTMENT / PRICING */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-serif text-2xl text-stone-900">
                  Edit Investment & Pricing
                </h3>
                <p className="font-serif italic text-stone-600 text-sm">
                  Update package prices, titles, coverage hours, and descriptions. Any changes here will reflect immediately on the live Investment / Pricing page!
                </p>
              </div>

              {/* Packages List */}
              <div className="space-y-6">
                <h4 className="font-serif text-xl text-stone-900 border-b border-stone-200 pb-2">
                  Wedding Packages
                </h4>

                <div className="space-y-6">
                  {pricingPackages.map(pkg => (
                    <div
                      key={pkg.id}
                      className="p-5 border border-stone-300 rounded-xs bg-[#fbf9f6] space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                            Package Title
                          </label>
                          <input
                            type="text"
                            value={pkg.name}
                            onChange={e => onUpdatePricingPackage(pkg.id, { name: e.target.value })}
                            className="w-full text-sm border border-stone-300 rounded px-3 py-1.5 bg-white font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                            Price Display *
                          </label>
                          <input
                            type="text"
                            value={pkg.price}
                            onChange={e => onUpdatePricingPackage(pkg.id, { price: e.target.value })}
                            placeholder="e.g. £1,750"
                            className="w-full text-sm border border-stone-300 rounded px-3 py-1.5 bg-white font-bold text-[#c2a378]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                            Hours of Coverage
                          </label>
                          <input
                            type="text"
                            value={pkg.hours}
                            onChange={e => onUpdatePricingPackage(pkg.id, { hours: e.target.value })}
                            className="w-full text-sm border border-stone-300 rounded px-3 py-1.5 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          Subtitle / Tagline
                        </label>
                        <input
                          type="text"
                          value={pkg.tagline}
                          onChange={e => onUpdatePricingPackage(pkg.id, { tagline: e.target.value })}
                          className="w-full text-sm border border-stone-300 rounded px-3 py-1.5 bg-white font-serif italic text-stone-700"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          Included Features (One per line)
                        </label>
                        <textarea
                          rows={5}
                          value={pkg.features.join('\n')}
                          onChange={e => {
                            onUpdatePricingPackage(pkg.id, { features: e.target.value.split('\n') });
                          }}
                          onBlur={e => {
                            const cleaned = e.target.value
                              .split('\n')
                              .map(line => line.trim())
                              .filter(line => line.length > 0);
                            onUpdatePricingPackage(pkg.id, { features: cleaned });
                          }}
                          className="w-full text-xs font-sans border border-stone-300 rounded px-3 py-2 bg-white leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset pricing packages to defaults?')) {
                      onResetPricing();
                      showSuccess('Pricing reset to defaults.');
                    }
                  }}
                  className="text-stone-500 hover:text-stone-900 underline"
                >
                  Reset Pricing to Defaults
                </button>

                <button
                  type="button"
                  onClick={() => void handlePublishPricingTab()}
                  disabled={isPublishingLive}
                  className="inline-flex items-center gap-1.5 bg-[#1e2321] text-white px-6 py-2.5 rounded text-xs uppercase tracking-widest font-sans font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {isPublishingLive && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c2a378]" />}
                  <span>{isPublishingLive ? `Publishing (${publishPercent}%)` : 'Save Pricing Live'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: ABOUT US & SUBCATEGORIES */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-serif text-2xl text-stone-900">
                  About Us &amp; Subcategories
                </h3>
                <p className="font-serif italic text-stone-600 text-sm">
                  Edit your Homepage Introduction, About MMC Photography story, Kind Words &amp; Reviews, Wedding Blog &amp; Tips, and FAQs.
                </p>
              </div>

              {/* Subcategory Pills/Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
                <button
                  type="button"
                  onClick={() => setAboutSubTab('page')}
                  className={`px-3.5 py-2 rounded text-xs font-sans font-semibold flex items-center gap-1.5 transition-colors border ${
                    aboutSubTab === 'page'
                      ? 'bg-[#1e2321] text-white border-[#1e2321]'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <HeartHandshake className="w-3.5 h-3.5 text-[#c2a378]" />
                  <span>About MMC Photography</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAboutSubTab('reviews')}
                  className={`px-3.5 py-2 rounded text-xs font-sans font-semibold flex items-center gap-1.5 transition-colors border ${
                    aboutSubTab === 'reviews'
                      ? 'bg-[#1e2321] text-white border-[#1e2321]'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 text-[#c2a378]" />
                  <span>Kind Words &amp; Reviews ({reviews.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAboutSubTab('blog')}
                  className={`px-3.5 py-2 rounded text-xs font-sans font-semibold flex items-center gap-1.5 transition-colors border ${
                    aboutSubTab === 'blog'
                      ? 'bg-[#1e2321] text-white border-[#1e2321]'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#c2a378]" />
                  <span>Wedding Blog &amp; Tips ({blogPosts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAboutSubTab('faqs')}
                  className={`px-3.5 py-2 rounded text-xs font-sans font-semibold flex items-center gap-1.5 transition-colors border ${
                    aboutSubTab === 'faqs'
                      ? 'bg-[#1e2321] text-white border-[#1e2321]'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#c2a378]" />
                  <span>FAQs ({faqs.length})</span>
                </button>
              </div>

              {/* SUB-TAB A: ABOUT MMC PHOTOGRAPHY (HOMEPAGE INTRO + ABOUT PAGE) */}
              {aboutSubTab === 'page' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Homepage Intro Card */}
                  <div className="p-5 border border-stone-200 rounded-xs bg-[#fbf9f6] space-y-4">
                    <h4 className="font-serif text-lg text-stone-900 border-b border-stone-200 pb-2">
                      Homepage &ldquo;About MMC Photography&rdquo; Section
                    </h4>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Section Heading
                      </label>
                      <input
                        type="text"
                        value={aboutContent.homepageTitle}
                        onChange={e => onUpdateAboutContent({ homepageTitle: e.target.value })}
                        className="w-full text-sm border border-stone-300 rounded px-3 py-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Introduction Text
                      </label>
                      <textarea
                        rows={3}
                        value={aboutContent.homepageText}
                        onChange={e => onUpdateAboutContent({ homepageText: e.target.value })}
                        className="w-full text-sm border border-stone-300 rounded px-3 py-2 bg-white"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                          Homepage Photographer Portrait
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateAboutContent({ homepageImage: INITIAL_ABOUT_CONTENT.homepageImage });
                            showSuccess('Homepage Photographer Portrait reset to default.');
                          }}
                          className="text-[11px] text-stone-500 hover:text-stone-900 underline"
                        >
                          Reset to Default
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative w-28 h-20 rounded overflow-hidden border border-stone-300 shrink-0 bg-stone-100">
                          <Image
                            src={aboutContent.homepageImage || INITIAL_ABOUT_CONTENT.homepageImage}
                            alt="Homepage About preview"
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                            unoptimized={
                              (aboutContent.homepageImage || '').startsWith('data:') ||
                              (aboutContent.homepageImage || '').startsWith('blob:')
                            }
                          />
                        </div>
                        <div className="flex-1 w-full space-y-2">
                          <input
                            type="text"
                            value={
                              (aboutContent.homepageImage || '').startsWith('data:')
                                ? ''
                                : aboutContent.homepageImage || ''
                            }
                            onChange={e => onUpdateAboutContent({ homepageImage: e.target.value })}
                            placeholder={
                              (aboutContent.homepageImage || '').startsWith('data:')
                                ? 'Uploaded photo active (paste new URL to replace)'
                                : 'Paste image URL...'
                            }
                            className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                          />
                          <label className="inline-flex items-center gap-1.5 text-xs text-stone-700 hover:text-stone-900 border border-dashed border-stone-300 px-3 py-1.5 rounded cursor-pointer hover:bg-stone-100 bg-white">
                            {isUploadingSingleImage ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c2a378]" />
                            ) : (
                              <Upload className="w-3.5 h-3.5 text-stone-500" />
                            )}
                            <span>{isUploadingSingleImage ? 'Processing photo...' : 'Upload new photo from computer'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingSingleImage}
                              className="hidden"
                              onChange={e =>
                                handleFileUpload(
                                  e,
                                  url => onUpdateAboutContent({ homepageImage: url }),
                                  {
                                    maxChars: 140000,
                                    successMessage: isStudioAdmin
                                      ? 'Homepage Photographer Portrait updated! Click "Save Changes" below to publish live.'
                                      : 'Homepage Photographer Portrait updated! Sign in above to publish live.',
                                  }
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Full About Page Details */}
                  <div className="p-5 border border-stone-200 rounded-xs bg-white space-y-4">
                    <h4 className="font-serif text-lg text-stone-900 border-b border-stone-200 pb-2">
                      Full &ldquo;About Us&rdquo; Page Story &amp; Header
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          Top Kicker Label
                        </label>
                        <input
                          type="text"
                          value={aboutContent.heroKicker}
                          onChange={e => onUpdateAboutContent({ heroKicker: e.target.value })}
                          className="w-full text-sm border border-stone-300 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          Story Section Heading
                        </label>
                        <input
                          type="text"
                          value={aboutContent.storyTitle}
                          onChange={e => onUpdateAboutContent({ storyTitle: e.target.value })}
                          className="w-full text-sm border border-stone-300 rounded px-3 py-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Main Headline
                      </label>
                      <input
                        type="text"
                        value={aboutContent.heroHeadline}
                        onChange={e => onUpdateAboutContent({ heroHeadline: e.target.value })}
                        className="w-full text-sm border border-stone-300 rounded px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Hero Quote
                      </label>
                      <input
                        type="text"
                        value={aboutContent.heroQuote}
                        onChange={e => onUpdateAboutContent({ heroQuote: e.target.value })}
                        className="w-full text-sm border border-stone-300 rounded px-3 py-2 font-serif italic"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                          About Page Feature Image
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateAboutContent({ storyImage: INITIAL_ABOUT_CONTENT.storyImage });
                            showSuccess('About Page Feature Image reset to default.');
                          }}
                          className="text-[11px] text-stone-500 hover:text-stone-900 underline"
                        >
                          Reset to Default
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative w-24 h-28 rounded overflow-hidden border border-stone-300 shrink-0 bg-stone-100">
                          <Image
                            src={aboutContent.storyImage || INITIAL_ABOUT_CONTENT.storyImage}
                            alt="Story feature preview"
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                            unoptimized={
                              (aboutContent.storyImage || '').startsWith('data:') ||
                              (aboutContent.storyImage || '').startsWith('blob:')
                            }
                          />
                        </div>
                        <div className="flex-1 w-full space-y-2">
                          <input
                            type="text"
                            value={
                              (aboutContent.storyImage || '').startsWith('data:')
                                ? ''
                                : aboutContent.storyImage || ''
                            }
                            onChange={e => onUpdateAboutContent({ storyImage: e.target.value })}
                            placeholder={
                              (aboutContent.storyImage || '').startsWith('data:')
                                ? 'Uploaded photo active (paste new URL to replace)'
                                : 'Paste image URL...'
                            }
                            className="w-full text-xs border border-stone-300 rounded px-3 py-2"
                          />
                          <label className="inline-flex items-center gap-1.5 text-xs text-stone-700 hover:text-stone-900 border border-dashed border-stone-300 px-3 py-1.5 rounded cursor-pointer hover:bg-stone-50">
                            {isUploadingSingleImage ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c2a378]" />
                            ) : (
                              <Upload className="w-3.5 h-3.5 text-stone-500" />
                            )}
                            <span>{isUploadingSingleImage ? 'Processing photo...' : 'Upload new story photo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingSingleImage}
                              className="hidden"
                              onChange={e =>
                                handleFileUpload(
                                  e,
                                  url => onUpdateAboutContent({ storyImage: url }),
                                  {
                                    maxChars: 140000,
                                    successMessage: isStudioAdmin
                                      ? 'About Page Feature Image updated! Click "Save Changes" below to publish live.'
                                      : 'About Page Feature Image updated! Sign in above to publish live.',
                                  }
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Full Story Paragraphs (Separate paragraphs with a blank line)
                      </label>
                      <textarea
                        rows={6}
                        value={aboutContent.storyParagraphs.join('\n\n')}
                        onChange={e => {
                          onUpdateAboutContent({ storyParagraphs: e.target.value.split('\n\n') });
                        }}
                        onBlur={e => {
                          const paragraphs = e.target.value
                            .split(/\n\s*\n/)
                            .map(p => p.trim())
                            .filter(Boolean);
                          onUpdateAboutContent({ storyParagraphs: paragraphs.length > 0 ? paragraphs : [''] });
                        }}
                        className="w-full text-sm border border-stone-300 rounded px-3 py-2 leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* 3 Core Values */}
                  <div className="p-5 border border-stone-200 rounded-xs bg-[#fbf9f6] space-y-4">
                    <h4 className="font-serif text-lg text-stone-900 border-b border-stone-200 pb-2">
                      3 Core Values Cards
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {aboutContent.coreValues.map((val, idx) => (
                        <div key={val.id} className="p-3 bg-white border border-stone-200 rounded space-y-2">
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                            Card #{idx + 1} Title
                          </label>
                          <input
                            type="text"
                            value={val.title}
                            onChange={e => {
                              const updated = aboutContent.coreValues.map(item =>
                                item.id === val.id ? { ...item, title: e.target.value } : item
                              );
                              onUpdateAboutContent({ coreValues: updated });
                            }}
                            className="w-full text-xs font-semibold border border-stone-300 rounded px-2.5 py-1.5"
                          />
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 pt-1">
                            Description
                          </label>
                          <textarea
                            rows={3}
                            value={val.description}
                            onChange={e => {
                              const updated = aboutContent.coreValues.map(item =>
                                item.id === val.id ? { ...item, description: e.target.value } : item
                              );
                              onUpdateAboutContent({ coreValues: updated });
                            }}
                            className="w-full text-xs border border-stone-300 rounded px-2.5 py-1.5 text-stone-700"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB B: KIND WORDS & REVIEWS */}
              {aboutSubTab === 'reviews' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <form onSubmit={handleAddReviewItem} className="p-5 bg-stone-50 border border-stone-200 rounded-xs space-y-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-900">
                      <Plus className="w-4 h-4 text-[#c2a378]" />
                      <span>Add New Couple Review</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          Couple Names *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Hannah & Jack"
                          value={newReviewCouple}
                          onChange={e => setNewReviewCouple(e.target.value)}
                          className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          Venue &amp; County
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Caswell House, Oxfordshire"
                          value={newReviewVenue}
                          onChange={e => setNewReviewVenue(e.target.value)}
                          className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          Wedding Date
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Married August 2024"
                          value={newReviewDate}
                          onChange={e => setNewReviewDate(e.target.value)}
                          className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          Headline Quote
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Captured every emotion effortlessly"
                          value={newReviewHighlight}
                          onChange={e => setNewReviewHighlight(e.target.value)}
                          className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          Rating
                        </label>
                        <select
                          value={newReviewRating}
                          onChange={e => setNewReviewRating(Number(e.target.value))}
                          className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                        >
                          <option value={5}>5 Stars</option>
                          <option value={4}>4 Stars</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Full Testimonial *
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Paste the couple's full review..."
                        value={newReviewFull}
                        onChange={e => setNewReviewFull(e.target.value)}
                        className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-[#1e2321] text-white px-5 py-2 rounded text-xs uppercase tracking-widest font-sans font-semibold hover:bg-stone-800 transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#c2a378]" />
                        <span>Add Review</span>
                      </button>
                    </div>
                  </form>

                  {/* Existing Reviews */}
                  <div className="space-y-4">
                    <h4 className="font-serif text-lg text-stone-900">
                      Published Reviews ({reviews.length})
                    </h4>

                    {reviews.map(review => (
                      <div key={review.id} className="p-4 border border-stone-300 rounded-xs bg-white space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#c2a378]">
                            {review.couple}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete review from ${review.couple}?`)) {
                                onDeleteReview(review.id);
                                showSuccess('Review removed.');
                              }
                            }}
                            className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={review.couple}
                            onChange={e => onUpdateReview(review.id, { couple: e.target.value })}
                            placeholder="Couple Names"
                            className="text-xs font-medium border border-stone-200 rounded px-2.5 py-1.5"
                          />
                          <input
                            type="text"
                            value={review.venue}
                            onChange={e => onUpdateReview(review.id, { venue: e.target.value })}
                            placeholder="Venue"
                            className="text-xs border border-stone-200 rounded px-2.5 py-1.5"
                          />
                          <input
                            type="text"
                            value={review.date}
                            onChange={e => onUpdateReview(review.id, { date: e.target.value })}
                            placeholder="Date"
                            className="text-xs border border-stone-200 rounded px-2.5 py-1.5"
                          />
                        </div>

                        <input
                          type="text"
                          value={review.highlight}
                          onChange={e => onUpdateReview(review.id, { highlight: e.target.value })}
                          placeholder="Headline quote"
                          className="w-full text-xs font-serif italic border border-stone-200 rounded px-2.5 py-1.5"
                        />

                        <textarea
                          rows={3}
                          value={review.fullReview}
                          onChange={e =>
                            onUpdateReview(review.id, {
                              fullReview: e.target.value,
                              snippet:
                                e.target.value.slice(0, 110) +
                                (e.target.value.length > 110 ? '...' : ''),
                            })
                          }
                          className="w-full text-xs border border-stone-200 rounded px-2.5 py-1.5 text-stone-700"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-TAB C: WEDDING BLOG & TIPS */}
              {aboutSubTab === 'blog' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <form onSubmit={handleAddBlogItem} className="p-5 bg-stone-50 border border-stone-200 rounded-xs space-y-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-900">
                      <Plus className="w-4 h-4 text-[#c2a378]" />
                      <span>Publish New Blog Article</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          Article Title *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Golden Hour Portrait Tips for Summer Weddings"
                          value={newBlogTitle}
                          onChange={e => setNewBlogTitle(e.target.value)}
                          className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          value={newBlogCategory}
                          onChange={e => setNewBlogCategory(e.target.value)}
                          className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                            Publish Date
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. May 14, 2025"
                            value={newBlogDate}
                            onChange={e => setNewBlogDate(e.target.value)}
                            className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                            Read Time
                          </label>
                          <input
                            type="text"
                            value={newBlogReadTime}
                            onChange={e => setNewBlogReadTime(e.target.value)}
                            className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Cover Image URL or Upload
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <input
                          type="text"
                          value={newBlogCover}
                          onChange={e => setNewBlogCover(e.target.value)}
                          className="flex-1 w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                        />
                        <label className="inline-flex items-center gap-1.5 text-xs text-stone-700 hover:text-stone-900 border border-dashed border-stone-300 px-3 py-2 rounded cursor-pointer hover:bg-stone-100 bg-white shrink-0">
                          <Upload className="w-3.5 h-3.5 text-stone-500" />
                          <span>Upload Cover</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => handleFileUpload(e, url => setNewBlogCover(url))}
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Short Summary / Excerpt
                      </label>
                      <input
                        type="text"
                        placeholder="One-sentence preview shown on the blog card..."
                        value={newBlogExcerpt}
                        onChange={e => setNewBlogExcerpt(e.target.value)}
                        className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Article Content * (Separate paragraphs with a blank line)
                      </label>
                      <textarea
                        rows={4}
                        required
                        placeholder="Write your wedding photography advice or story here..."
                        value={newBlogContent}
                        onChange={e => setNewBlogContent(e.target.value)}
                        className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-[#1e2321] text-white px-5 py-2 rounded text-xs uppercase tracking-widest font-sans font-semibold hover:bg-stone-800 transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#c2a378]" />
                        <span>Publish Article</span>
                      </button>
                    </div>
                  </form>

                  {/* Existing Blog Posts */}
                  <div className="space-y-4">
                    <h4 className="font-serif text-lg text-stone-900">
                      Published Articles ({blogPosts.length})
                    </h4>

                    {blogPosts.map(post => (
                      <div key={post.id} className="p-4 border border-stone-300 rounded-xs bg-white space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#c2a378]">
                            {post.category} · {post.date}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete blog post "${post.title}"?`)) {
                                onDeleteBlogPost(post.id);
                                showSuccess('Blog post deleted.');
                              }
                            }}
                            className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>

                        <input
                          type="text"
                          value={post.title}
                          onChange={e => onUpdateBlogPost(post.id, { title: e.target.value })}
                          className="w-full text-sm font-serif font-medium border border-stone-200 rounded px-2.5 py-1.5"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={post.category}
                            onChange={e => onUpdateBlogPost(post.id, { category: e.target.value })}
                            placeholder="Category"
                            className="text-xs border border-stone-200 rounded px-2.5 py-1.5"
                          />
                          <input
                            type="text"
                            value={post.date}
                            onChange={e => onUpdateBlogPost(post.id, { date: e.target.value })}
                            placeholder="Date"
                            className="text-xs border border-stone-200 rounded px-2.5 py-1.5"
                          />
                          <input
                            type="text"
                            value={post.readTime}
                            onChange={e => onUpdateBlogPost(post.id, { readTime: e.target.value })}
                            placeholder="Read time"
                            className="text-xs border border-stone-200 rounded px-2.5 py-1.5"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 items-center">
                          <div className="relative w-20 h-14 rounded overflow-hidden border border-stone-200 shrink-0 bg-stone-100">
                            <Image
                              src={post.coverImage}
                              alt={post.title}
                              fill
                              className="object-cover"
                              referrerPolicy="no-referrer"
                              unoptimized={post.coverImage.startsWith('data:') || post.coverImage.startsWith('blob:')}
                            />
                          </div>
                          <input
                            type="text"
                            value={post.coverImage.startsWith('data:') ? '' : post.coverImage}
                            onChange={e => onUpdateBlogPost(post.id, { coverImage: e.target.value })}
                            placeholder={post.coverImage.startsWith('data:') ? 'Uploaded cover active' : 'Cover image URL'}
                            className="flex-1 w-full text-xs border border-stone-200 rounded px-2.5 py-1.5"
                          />
                          <label className="inline-flex items-center gap-1 text-xs text-stone-700 border border-dashed border-stone-300 px-2.5 py-1.5 rounded cursor-pointer hover:bg-stone-50 shrink-0">
                            <Upload className="w-3 h-3" />
                            <span>Replace</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => handleFileUpload(e, url => onUpdateBlogPost(post.id, { coverImage: url }))}
                            />
                          </label>
                        </div>

                        <input
                          type="text"
                          value={post.excerpt}
                          onChange={e => onUpdateBlogPost(post.id, { excerpt: e.target.value })}
                          placeholder="Card excerpt"
                          className="w-full text-xs border border-stone-200 rounded px-2.5 py-1.5 text-stone-600"
                        />

                        <textarea
                          rows={4}
                          value={post.content.join('\n\n')}
                          onChange={e => {
                            onUpdateBlogPost(post.id, { content: e.target.value.split('\n\n') });
                          }}
                          onBlur={e => {
                            const paragraphs = e.target.value
                              .split(/\n\s*\n/)
                              .map(p => p.trim())
                              .filter(Boolean);
                            onUpdateBlogPost(post.id, { content: paragraphs.length > 0 ? paragraphs : [''] });
                          }}
                          className="w-full text-xs border border-stone-200 rounded px-2.5 py-1.5 text-stone-700 leading-relaxed"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-TAB D: FREQUENTLY ASKED QUESTIONS */}
              {aboutSubTab === 'faqs' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <form onSubmit={handleAddFaqItem} className="p-5 bg-stone-50 border border-stone-200 rounded-xs space-y-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-900">
                      <Plus className="w-4 h-4 text-[#c2a378]" />
                      <span>Add New Frequently Asked Question</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Question *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. How far in advance should we book our wedding date?"
                        value={newFaqQuestion}
                        onChange={e => setNewFaqQuestion(e.target.value)}
                        className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        Answer *
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Write a clear, reassuring answer for couples..."
                        value={newFaqAnswer}
                        onChange={e => setNewFaqAnswer(e.target.value)}
                        className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-[#1e2321] text-white px-5 py-2 rounded text-xs uppercase tracking-widest font-sans font-semibold hover:bg-stone-800 transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#c2a378]" />
                        <span>Add FAQ</span>
                      </button>
                    </div>
                  </form>

                  {/* Existing FAQs */}
                  <div className="space-y-3">
                    <h4 className="font-serif text-lg text-stone-900">
                      Current FAQs ({faqs.length})
                    </h4>

                    {faqs.map((faq, idx) => (
                      <div key={faq.id} className="p-4 border border-stone-300 rounded-xs bg-white space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#c2a378]">
                            FAQ #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Delete this FAQ?')) {
                                onDeleteFaq(faq.id);
                                showSuccess('FAQ deleted.');
                              }
                            }}
                            className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={faq.q}
                          onChange={e => onUpdateFaq(faq.id, { q: e.target.value })}
                          className="w-full text-sm font-serif font-medium border border-stone-200 rounded px-2.5 py-1.5"
                        />
                        <textarea
                          rows={3}
                          value={faq.a}
                          onChange={e => onUpdateFaq(faq.id, { a: e.target.value })}
                          className="w-full text-xs border border-stone-200 rounded px-2.5 py-1.5 text-stone-700 leading-relaxed"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset & Save Footer Bar */}
              <div className="pt-4 border-t border-stone-200 flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset About Us, Reviews, Blog & FAQs to initial defaults?')) {
                      onResetAbout();
                      showSuccess('About Us & subcategories reset to defaults.');
                    }
                  }}
                  className="text-stone-500 hover:text-stone-900 underline"
                >
                  Reset About Us &amp; Subcategories to Defaults
                </button>

                <button
                  type="button"
                  onClick={() => void handlePublishAboutTab()}
                  disabled={isPublishingLive || isUploadingSingleImage}
                  className="inline-flex items-center gap-1.5 bg-[#1e2321] text-white px-6 py-2.5 rounded text-xs uppercase tracking-widest font-sans font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {isPublishingLive && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c2a378]" />}
                  <span>{isPublishingLive ? `Publishing (${publishPercent}%)` : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: GUEST PHOTO VAULT */}
          {activeTab === 'vault' && (
            <div className="space-y-8 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="font-serif text-2xl text-stone-900">
                  Manage Guest Photo Vault
                </h3>
                <p className="font-serif italic text-stone-600 text-sm">
                  Edit the text on the Guest Photo Vault page, update the 3 How It Works steps, and upload or replace &ldquo;Guest Snaps &amp; Memories&rdquo; photographs.
                </p>
              </div>

              {/* 1. Page Headings & Copy */}
              <div className="p-5 border border-stone-200 rounded-xs bg-[#fbf9f6] space-y-4">
                <h4 className="font-serif text-lg text-stone-900 border-b border-stone-200 pb-2">
                  Guest Photo Vault Page Text &amp; Headings
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Top Eyebrow Label
                    </label>
                    <input
                      type="text"
                      value={vaultContent.badgeLabel}
                      onChange={e => onUpdateVaultContent({ badgeLabel: e.target.value })}
                      className="w-full border border-stone-300 rounded px-3 py-2 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Page Title
                    </label>
                    <input
                      type="text"
                      value={vaultContent.pageTitle}
                      onChange={e => onUpdateVaultContent({ pageTitle: e.target.value })}
                      className="w-full border border-stone-300 rounded px-3 py-2 bg-white font-serif text-base"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Page Subtitle / Intro Copy
                  </label>
                  <textarea
                    rows={3}
                    value={vaultContent.pageSubtitle}
                    onChange={e => onUpdateVaultContent({ pageSubtitle: e.target.value })}
                    className="w-full border border-stone-300 rounded px-3 py-2 bg-white leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Featured Vault Couple Name
                    </label>
                    <input
                      type="text"
                      value={vaultContent.coupleName}
                      onChange={e => onUpdateVaultContent({ coupleName: e.target.value })}
                      className="w-full border border-stone-300 rounded px-3 py-2 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Wedding Date &amp; Venue Line
                    </label>
                    <input
                      type="text"
                      value={vaultContent.weddingDate}
                      onChange={e => onUpdateVaultContent({ weddingDate: e.target.value })}
                      className="w-full border border-stone-300 rounded px-3 py-2 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Gallery Section Heading (e.g. Guest Snaps &amp; Memories)
                    </label>
                    <input
                      type="text"
                      value={vaultContent.streamTitle}
                      onChange={e => onUpdateVaultContent({ streamTitle: e.target.value })}
                      className="w-full border border-stone-300 rounded px-3 py-2 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Privacy Note Label
                    </label>
                    <input
                      type="text"
                      value={vaultContent.privacyBadgeText}
                      onChange={e => onUpdateVaultContent({ privacyBadgeText: e.target.value })}
                      className="w-full border border-stone-300 rounded px-3 py-2 bg-white"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Gallery Section Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={vaultContent.streamSubtitle}
                    onChange={e => onUpdateVaultContent({ streamSubtitle: e.target.value })}
                    className="w-full border border-stone-300 rounded px-3 py-2 bg-white leading-relaxed"
                  />
                </div>
              </div>

              {/* 2. How It Works Steps */}
              <div className="p-5 border border-stone-200 rounded-xs bg-[#fbf9f6] space-y-4">
                <h4 className="font-serif text-lg text-stone-900 border-b border-stone-200 pb-2">
                  3 Steps — How Guest Photo Vault Works
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vaultContent.howItWorksSteps.map((step, idx) => (
                    <div key={step.id} className="p-3 bg-white border border-stone-200 rounded space-y-2 text-xs">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#c2a378]">
                        Step 0{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={step.title}
                        onChange={e => {
                          const updated = vaultContent.howItWorksSteps.map((s, sIdx) =>
                            sIdx === idx ? { ...s, title: e.target.value } : s
                          );
                          onUpdateVaultContent({ howItWorksSteps: updated });
                        }}
                        className="w-full border border-stone-300 rounded px-2.5 py-1.5 font-serif text-sm"
                        placeholder="Step title"
                      />
                      <textarea
                        rows={3}
                        value={step.description}
                        onChange={e => {
                          const updated = vaultContent.howItWorksSteps.map((s, sIdx) =>
                            sIdx === idx ? { ...s, description: e.target.value } : s
                          );
                          onUpdateVaultContent({ howItWorksSteps: updated });
                        }}
                        className="w-full border border-stone-300 rounded px-2.5 py-1.5 text-stone-600 leading-relaxed"
                        placeholder="Step description"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Add New Guest Snaps & Memories Photo */}
              <form
                onSubmit={handleAddVaultPhotoItem}
                className="p-5 border border-stone-200 rounded-xs bg-[#fbf9f6] space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
                  <h4 className="font-serif text-lg text-stone-900">
                    Add New &ldquo;{vaultContent.streamTitle}&rdquo; Photo
                  </h4>
                  <label className="inline-flex items-center gap-1.5 bg-[#1e2321] hover:bg-stone-800 text-white px-4 py-2 rounded text-xs font-sans font-semibold uppercase tracking-wider cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#c2a378]" />
                    <span>{isUploadingVaultImage ? 'Processing Photo...' : 'Upload Photo from Computer'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleVaultFileUpload(e)}
                      disabled={isUploadingVaultImage}
                      className="hidden"
                    />
                  </label>
                </div>

                {newVaultPhotoUrl && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 bg-white border border-stone-200 rounded">
                    <div className="relative w-24 h-20 rounded overflow-hidden shrink-0 border border-stone-200">
                      <Image
                        src={newVaultPhotoUrl}
                        alt="New guest snap preview"
                        fill
                        unoptimized={newVaultPhotoUrl.startsWith('data:') || newVaultPhotoUrl.startsWith('blob:')}
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 text-xs space-y-1">
                      <p className="font-semibold text-emerald-700 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {newVaultUploadedFileName
                            ? `Selected: ${newVaultUploadedFileName}`
                            : 'Photo URL ready'}
                        </span>
                      </p>
                      <p className="text-stone-500">
                        Add the guest name, table, time, or caption below and click &ldquo;Add Guest Snap&rdquo;.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewVaultPhotoUrl('');
                        setNewVaultUploadedFileName('');
                      }}
                      className="text-xs text-stone-500 hover:text-red-600 underline self-start sm:self-center"
                    >
                      Clear
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      value={newVaultGuestName}
                      onChange={e => setNewVaultGuestName(e.target.value)}
                      placeholder="e.g. Auntie Sarah & Dave"
                      className="w-full border border-stone-300 rounded px-3 py-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Table / Group
                    </label>
                    <input
                      type="text"
                      value={newVaultTable}
                      onChange={e => setNewVaultTable(e.target.value)}
                      placeholder="e.g. Table 4 or Bridal Party"
                      className="w-full border border-stone-300 rounded px-3 py-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Time / Moment
                    </label>
                    <input
                      type="text"
                      value={newVaultTime}
                      onChange={e => setNewVaultTime(e.target.value)}
                      placeholder="e.g. 8:45 PM"
                      className="w-full border border-stone-300 rounded px-3 py-2 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Or Paste Image URL
                    </label>
                    <input
                      type="text"
                      value={newVaultPhotoUrl.startsWith('data:') ? '' : newVaultPhotoUrl}
                      onChange={e => {
                        setNewVaultUploadedFileName('');
                        setNewVaultPhotoUrl(e.target.value);
                      }}
                      placeholder={
                        newVaultPhotoUrl.startsWith('data:')
                          ? 'Photo uploaded from computer (click Clear to switch)'
                          : 'https://images.unsplash.com/...'
                      }
                      className="w-full border border-stone-300 rounded px-3 py-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Guest Note / Caption
                    </label>
                    <input
                      type="text"
                      value={newVaultNote}
                      onChange={e => setNewVaultNote(e.target.value)}
                      placeholder="e.g. What a magical first dance!"
                      className="w-full border border-stone-300 rounded px-3 py-2 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUploadingVaultImage}
                    className="bg-[#1e2321] text-white px-5 py-2.5 rounded text-xs uppercase tracking-widest font-sans font-semibold hover:bg-stone-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Guest Snap</span>
                  </button>
                </div>
              </form>

              {/* 4. Existing Guest Snaps & Memories Photos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <h4 className="font-serif text-lg text-stone-900">
                    Current &ldquo;{vaultContent.streamTitle}&rdquo; Photos ({vaultPhotos.length})
                  </h4>
                  <span className="text-[11px] text-stone-500">
                    Replace any photo or edit names &amp; notes directly below
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vaultPhotos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="p-4 border border-stone-200 rounded-xs bg-white space-y-3 flex flex-col"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative w-28 h-24 rounded overflow-hidden shrink-0 border border-stone-200 bg-stone-100">
                          <Image
                            src={photo.url}
                            alt={photo.guestName || `Guest snap ${index + 1}`}
                            fill
                            unoptimized={photo.url.startsWith('data:') || photo.url.startsWith('blob:')}
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#c2a378]">
                              Snap #{index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Remove this photo from Guest Photo Vault?')) {
                                  onDeleteVaultPhoto(photo.id);
                                  showSuccess('Guest snap removed.');
                                }
                              }}
                              className="text-red-600 hover:text-red-800 flex items-center gap-1 text-[11px]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>

                          <label className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider cursor-pointer transition-colors">
                            <Upload className="w-3 h-3 text-[#c2a378]" />
                            <span>Replace Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e =>
                                handleVaultFileUpload(e, url => {
                                  onUpdateVaultPhoto(photo.id, { url });
                                  showSuccess('Guest snap photo updated!');
                                })
                              }
                              className="hidden"
                            />
                          </label>

                          <input
                            type="text"
                            value={photo.url.startsWith('data:') ? '' : photo.url}
                            onChange={e => onUpdateVaultPhoto(photo.id, { url: e.target.value })}
                            placeholder={
                              photo.url.startsWith('data:')
                                ? 'Uploaded from computer (replace above or paste URL)'
                                : 'Paste photo URL'
                            }
                            className="w-full border border-stone-200 rounded px-2 py-1 text-[11px] text-stone-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-0.5">
                            Guest Name
                          </label>
                          <input
                            type="text"
                            value={photo.guestName}
                            onChange={e => onUpdateVaultPhoto(photo.id, { guestName: e.target.value })}
                            className="w-full border border-stone-200 rounded px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-0.5">
                            Table
                          </label>
                          <input
                            type="text"
                            value={photo.table}
                            onChange={e => onUpdateVaultPhoto(photo.id, { table: e.target.value })}
                            className="w-full border border-stone-200 rounded px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-0.5">
                            Time
                          </label>
                          <input
                            type="text"
                            value={photo.time}
                            onChange={e => onUpdateVaultPhoto(photo.id, { time: e.target.value })}
                            className="w-full border border-stone-200 rounded px-2 py-1 text-xs"
                          />
                        </div>
                      </div>

                      <div className="text-xs">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-0.5">
                          Guest Note / Caption
                        </label>
                        <textarea
                          rows={2}
                          value={photo.note}
                          onChange={e => onUpdateVaultPhoto(photo.id, { note: e.target.value })}
                          className="w-full border border-stone-200 rounded px-2 py-1 text-xs leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset & Save Footer Bar */}
              <div className="pt-4 border-t border-stone-200 flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset Guest Photo Vault text and photos to initial defaults?')) {
                      onResetVault();
                      showSuccess('Guest Photo Vault reset to defaults.');
                    }
                  }}
                  className="text-stone-500 hover:text-stone-900 underline"
                >
                  Reset Guest Photo Vault to Defaults
                </button>

                <button
                  type="button"
                  onClick={() => void handlePublishVaultTab()}
                  disabled={isPublishingLive}
                  className="inline-flex items-center gap-1.5 bg-[#1e2321] text-white px-6 py-2.5 rounded text-xs uppercase tracking-widest font-sans font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {isPublishingLive && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c2a378]" />}
                  <span>{isPublishingLive ? `Publishing (${publishPercent}%)` : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-100 px-6 py-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 shrink-0">
          <span>
            {isStudioAdmin
              ? `Cloud Connected: ${authUser?.email}`
              : 'MMC Studio Owner Portal (Sign in above to publish live)'}
          </span>
          <div className="flex items-center gap-2.5">
            {isStudioAdmin && (
              <button
                type="button"
                onClick={() => void handlePublishAllLive()}
                disabled={isPublishingLive}
                className="inline-flex items-center gap-1.5 border border-stone-400 bg-white text-stone-900 hover:bg-stone-200 px-4 py-2 rounded text-xs uppercase tracking-wider font-sans font-semibold transition-colors disabled:opacity-60"
              >
                {isPublishingLive && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c2a378]" />}
                <span>{isPublishingLive ? `Publishing (${publishPercent}%)` : 'Publish Live Now'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-[#1e2321] text-white px-5 py-2 rounded text-xs uppercase tracking-wider font-sans font-semibold hover:bg-stone-800 transition-colors"
            >
              Close Studio Manager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
