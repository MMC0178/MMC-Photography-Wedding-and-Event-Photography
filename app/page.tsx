'use client';

import { useState, useEffect } from 'react';
import TopUtilityBar from '@/components/TopUtilityBar';
import HeaderNav from '@/components/HeaderNav';
import HeroSection from '@/components/HeroSection';
import AboutIntroSection from '@/components/AboutIntroSection';
import WeddingStoryCategories from '@/components/WeddingStoryCategories';
import PricingTeaser from '@/components/PricingTeaser';
import ContactTeaser from '@/components/ContactTeaser';
import GuestPhotoVaultBanner from '@/components/GuestPhotoVaultBanner';
import FooterNav from '@/components/FooterNav';

import GalleryPage from '@/components/GalleryPage';
import FeaturedWeddingsPage from '@/components/FeaturedWeddingsPage';
import AboutPage from '@/components/AboutPage';
import ReviewsPage from '@/components/ReviewsPage';
import BlogPage from '@/components/BlogPage';
import PricingPage from '@/components/PricingPage';
import ContactPage from '@/components/ContactPage';
import GuestVaultPage from '@/components/GuestVaultPage';
import PhotographerAdminModal from '@/components/PhotographerAdminModal';

import { useGalleryPhotos } from '@/lib/gallery-store';
import { useFeaturedWeddings } from '@/lib/featured-weddings-store';
import { usePricing } from '@/lib/pricing-store';
import { useAboutSection } from '@/lib/about-store';
import { useGuestVault } from '@/lib/vault-store';

export default function Home() {
  const [activePage, setActivePage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('page') || 'home';
    }
    return 'home';
  });

  const [activeCategory, setActiveCategory] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('category') || 'all';
    }
    return 'all';
  });

  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('admin') === 'true';
    }
    return false;
  });

  // Decoupled Stores
  const {
    photos: galleryPhotos,
    addPhoto: addGalleryPhoto,
    deletePhoto: deleteGalleryPhoto,
    resetToDefaults: resetGalleryPhotos,
  } = useGalleryPhotos();

  const {
    featuredWeddings,
    updateWedding: updateFeaturedWedding,
    addPhotoToWedding: addPhotoToFeaturedWedding,
    removePhotoFromWedding: removePhotoFromFeaturedWedding,
    resetToDefaults: resetFeaturedWeddings,
  } = useFeaturedWeddings();

  const {
    packages: pricingPackages,
    updatePackage: updatePricingPackage,
    resetToDefaults: resetPricing,
  } = usePricing();

  const {
    aboutContent,
    faqs,
    reviews,
    blogPosts,
    updateAboutContent,
    addFaq,
    updateFaq,
    deleteFaq,
    addReview,
    updateReview,
    deleteReview,
    addBlogPost,
    updateBlogPost,
    deleteBlogPost,
    resetToDefaults: resetAbout,
  } = useAboutSection();

  const {
    vaultContent,
    vaultPhotos,
    updateVaultContent,
    addVaultPhoto,
    updateVaultPhoto,
    deleteVaultPhoto,
    resetToDefaults: resetVault,
  } = useGuestVault();

  // Listen to popstate for browser history navigation & ?admin=true
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setActivePage(params.get('page') || 'home');
      setActiveCategory(params.get('category') || 'all');
      setIsAdminOpen(params.get('admin') === 'true');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (page: string, category?: string) => {
    setActivePage(page);
    if (category) {
      setActiveCategory(category);
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (page === 'home') {
        url.searchParams.delete('page');
      } else {
        url.searchParams.set('page', page);
      }
      if (category && category !== 'all') {
        url.searchParams.set('category', category);
      } else {
        url.searchParams.delete('category');
      }
      window.history.pushState({}, '', url.toString());
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectStoryCategory = (categoryId: string) => {
    handleNavigate('gallery', categoryId);
  };

  const handleSelectPackage = (pkgName: string) => {
    setSelectedPackage(pkgName);
    handleNavigate('contact');
  };

  return (
    <div className="min-h-screen bg-white text-stone-800 flex flex-col font-sans selection:bg-[#c2a378]/20 selection:text-stone-900">
      {/* Top Utility Bar (Phone, Email, Tagline) */}
      <TopUtilityBar />

      {/* Main Header & Navigation (Clean of any public admin/add buttons) */}
      <HeaderNav
        activePage={activePage}
        setActivePage={handleNavigate}
        activeCategory={activeCategory}
        setActiveCategory={cat => handleNavigate('gallery', cat)}
      />

      {/* Page Routing */}
      <main className="flex-1 bg-white">
        {activePage === 'home' && (
          <div className="space-y-4">
            {/* 1. Hero Section matching mockup with couple & "Your story, beautifully told" */}
            <HeroSection
              heroImage={aboutContent.homepageHeroImage}
              onViewGallery={() => handleNavigate('gallery')}
            />

            {/* 2. About MMC Photography 3-column intro (Bio, Photographer Photo, Blog & Reviews) */}
            <AboutIntroSection
              aboutContent={aboutContent}
              onLearnMore={() => handleNavigate('about')}
              onOpenBlog={() => handleNavigate('blog')}
              onOpenReviews={() => handleNavigate('reviews')}
            />

            {/* 3. THE WEDDING STORY: 5 Category Tiles (Bridal Prep, Ceremony, On Location, Reception, Dancing) */}
            <WeddingStoryCategories
              photos={galleryPhotos}
              onSelectCategory={handleSelectStoryCategory}
            />

            {/* 4. Investment / Pricing Teaser */}
            <PricingTeaser onViewPackages={() => handleNavigate('pricing')} />

            {/* 5. Contact / Availability Teaser ("LET'S TALK ABOUT YOUR DAY") */}
            <ContactTeaser onCheckDate={() => handleNavigate('contact')} />

            {/* 6. Guest Photo Vault Olive/Sage Banner */}
            <GuestPhotoVaultBanner onDiscoverVault={() => handleNavigate('vault')} />
          </div>
        )}

        {/* Dedicated Categorized Wedding Gallery (Completely independent of featured weddings) */}
        {activePage === 'gallery' && (
          <GalleryPage
            photos={galleryPhotos}
            activeCategory={activeCategory}
            setActiveCategory={cat => handleNavigate('gallery', cat)}
            onViewFeaturedWeddings={() => handleNavigate('featured-weddings')}
          />
        )}

        {/* Dedicated 3 Featured Weddings Page (Un-categorized photos of the 3 real weddings) */}
        {activePage === 'featured-weddings' && (
          <FeaturedWeddingsPage
            featuredWeddings={featuredWeddings}
            onViewGallery={() => handleNavigate('gallery')}
            onCheckDate={() => handleNavigate('contact')}
          />
        )}

        {activePage === 'about' && (
          <AboutPage
            aboutContent={aboutContent}
            faqs={faqs}
            onCheckDate={() => handleNavigate('contact')}
            onViewGallery={() => handleNavigate('gallery')}
          />
        )}

        {activePage === 'reviews' && (
          <ReviewsPage
            reviews={reviews}
            onAddReview={addReview}
            onCheckDate={() => handleNavigate('contact')}
            onViewGallery={() => handleNavigate('gallery')}
          />
        )}

        {activePage === 'blog' && (
          <BlogPage
            blogPosts={blogPosts}
            onCheckDate={() => handleNavigate('contact')}
            onViewVault={() => handleNavigate('vault')}
          />
        )}

        {activePage === 'pricing' && (
          <PricingPage
            packages={pricingPackages}
            onSelectPackage={handleSelectPackage}
            onViewVault={() => handleNavigate('vault')}
          />
        )}

        {activePage === 'contact' && (
          <ContactPage initialPackage={selectedPackage} />
        )}

        {activePage === 'vault' && (
          <GuestVaultPage
            vaultContent={vaultContent}
            vaultPhotos={vaultPhotos}
            onAddVaultPhoto={addVaultPhoto}
            onUpdateVaultContent={updateVaultContent}
          />
        )}
      </main>

      {/* Repeated Navigation in Footer with discreet Studio Admin link */}
      <FooterNav
        setActivePage={handleNavigate}
        setActiveCategory={cat => handleNavigate('gallery', cat)}
        onOpenPhotographerAdmin={() => setIsAdminOpen(true)}
      />

      {/* Photographer Studio Management Portal (Hidden from public visitors) */}
      <PhotographerAdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        featuredWeddings={featuredWeddings}
        onUpdateFeaturedWedding={updateFeaturedWedding}
        onAddPhotoToFeaturedWedding={addPhotoToFeaturedWedding}
        onRemovePhotoFromFeaturedWedding={removePhotoFromFeaturedWedding}
        onResetFeaturedWeddings={resetFeaturedWeddings}
        galleryPhotos={galleryPhotos}
        onAddGalleryPhoto={addGalleryPhoto}
        onDeleteGalleryPhoto={deleteGalleryPhoto}
        onResetGalleryPhotos={resetGalleryPhotos}
        pricingPackages={pricingPackages}
        onUpdatePricingPackage={updatePricingPackage}
        onResetPricing={resetPricing}
        aboutContent={aboutContent}
        onUpdateAboutContent={updateAboutContent}
        faqs={faqs}
        onAddFaq={addFaq}
        onUpdateFaq={updateFaq}
        onDeleteFaq={deleteFaq}
        reviews={reviews}
        onAddReview={addReview}
        onUpdateReview={updateReview}
        onDeleteReview={deleteReview}
        blogPosts={blogPosts}
        onAddBlogPost={addBlogPost}
        onUpdateBlogPost={updateBlogPost}
        onDeleteBlogPost={deleteBlogPost}
        onResetAbout={resetAbout}
        vaultContent={vaultContent}
        vaultPhotos={vaultPhotos}
        onUpdateVaultContent={updateVaultContent}
        onAddVaultPhoto={addVaultPhoto}
        onUpdateVaultPhoto={updateVaultPhoto}
        onDeleteVaultPhoto={deleteVaultPhoto}
        onResetVault={resetVault}
      />
    </div>
  );
}
