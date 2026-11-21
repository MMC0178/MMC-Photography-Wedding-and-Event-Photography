'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronDown, Menu, X, Camera, BookOpen, Star, HelpCircle, HeartHandshake, Sparkles } from 'lucide-react';

interface HeaderNavProps {
  activePage: string;
  setActivePage: (page: string) => void;
  activeCategory?: string;
  setActiveCategory?: (category: string) => void;
}

export default function HeaderNav({
  activePage,
  setActivePage,
  setActiveCategory,
}: HeaderNavProps) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const aboutRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (aboutRef.current && !aboutRef.current.contains(event.target as Node)) {
        setAboutOpen(false);
      }
      if (galleryRef.current && !galleryRef.current.contains(event.target as Node)) {
        setGalleryOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (page: string, category?: string, anchorId?: string) => {
    setActivePage(page);
    if (category && setActiveCategory) {
      setActiveCategory(category);
    }
    setAboutOpen(false);
    setGalleryOpen(false);
    setMobileMenuOpen(false);
    if (anchorId) {
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 120);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="w-full bg-white border-b border-stone-200 sticky top-0 z-40 transition-all">
      {/* Brand Logo Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-5 pb-3 flex flex-col items-center justify-center relative">
        {/* Logo Center Display */}
        <button
          onClick={() => handleNavigate('home')}
          className="group flex flex-col items-center justify-center text-center cursor-pointer transition-transform duration-200 active:scale-98"
        >
          <div className="flex flex-col items-center">
            <div className="relative w-56 h-16 sm:w-72 sm:h-20 transition-transform group-hover:scale-[1.01]">
              <Image
                src="/assets/aistudio/MMC_Photography_Updated_version_8bb104f5.jpg"
                alt="MMC Photography"
                fill
                className="object-contain"
                priority
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </button>

        {/* Mobile menu hamburger toggle */}
        <div className="absolute right-4 top-5 sm:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-stone-700 hover:text-stone-950"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar - Desktop */}
      <nav className="hidden md:flex items-center justify-center border-t border-stone-200/80 py-2.5 px-4 text-xs tracking-wider uppercase font-sans font-medium text-stone-700">
        <div className="flex items-center gap-5 lg:gap-7">
          {/* ABOUT US Dropdown */}
          <div
            ref={aboutRef}
            className="relative"
            onMouseEnter={() => setAboutOpen(true)}
            onMouseLeave={() => setAboutOpen(false)}
          >
            <button
              onClick={() => handleNavigate('about')}
              className={`flex items-center gap-1.5 py-1 transition-colors hover:text-stone-950 ${
                activePage === 'about' || activePage === 'reviews' || activePage === 'blog'
                  ? 'text-stone-950 font-semibold'
                  : 'text-stone-600'
              }`}
            >
              <span>About Us</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${aboutOpen ? 'rotate-180' : ''}`} />
            </button>

            {aboutOpen && (
              <div className="absolute top-full left-0 w-64 bg-white border border-stone-200 shadow-xl rounded-b-md py-2 px-1 z-50 normal-case font-normal text-stone-700 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  onClick={() => handleNavigate('about')}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 rounded flex items-center gap-2.5 transition-colors group"
                >
                  <HeartHandshake className="w-4 h-4 text-stone-400 group-hover:text-[#c2a378]" />
                  <div>
                    <div className="font-medium text-stone-900 group-hover:text-stone-950">About MMC Photography</div>
                    <div className="text-[11px] text-stone-500">Our story, approach & philosophy</div>
                  </div>
                </button>

                <button
                  onClick={() => handleNavigate('reviews')}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 rounded flex items-center gap-2.5 transition-colors group"
                >
                  <Star className="w-4 h-4 text-stone-400 group-hover:text-[#c2a378]" />
                  <div>
                    <div className="font-medium text-stone-900 group-hover:text-stone-950">Kind Words & Reviews</div>
                    <div className="text-[11px] text-stone-500">See what our couples say</div>
                  </div>
                </button>

                <button
                  onClick={() => handleNavigate('blog')}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 rounded flex items-center gap-2.5 transition-colors group"
                >
                  <BookOpen className="w-4 h-4 text-stone-400 group-hover:text-[#c2a378]" />
                  <div>
                    <div className="font-medium text-stone-900 group-hover:text-stone-950">Wedding Blog & Tips</div>
                    <div className="text-[11px] text-stone-500">Inspiration & timeline planning</div>
                  </div>
                </button>

                <button
                  onClick={() => handleNavigate('about', undefined, 'faq-section')}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 rounded flex items-center gap-2.5 transition-colors group"
                >
                  <HelpCircle className="w-4 h-4 text-stone-400 group-hover:text-[#c2a378]" />
                  <div>
                    <div className="font-medium text-stone-900 group-hover:text-stone-950">Frequently Asked Questions</div>
                    <div className="text-[11px] text-stone-500">Pricing, delivery & booking FAQs</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <span className="text-stone-300">|</span>

          {/* GALLERY Dropdown */}
          <div
            ref={galleryRef}
            className="relative"
            onMouseEnter={() => setGalleryOpen(true)}
            onMouseLeave={() => setGalleryOpen(false)}
          >
            <button
              onClick={() => handleNavigate('gallery')}
              className={`flex items-center gap-1.5 py-1 transition-colors hover:text-stone-950 ${
                activePage === 'gallery' ? 'text-stone-950 font-semibold' : 'text-stone-600'
              }`}
            >
              <span>Gallery</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${galleryOpen ? 'rotate-180' : ''}`} />
            </button>

            {galleryOpen && (
              <div className="absolute top-full left-0 w-64 bg-white border border-stone-200 shadow-xl rounded-b-md py-2 px-1 z-50 normal-case font-normal text-stone-700 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  onClick={() => handleNavigate('gallery', 'all')}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 rounded flex items-center justify-between transition-colors font-medium text-stone-900"
                >
                  <span>All Wedding Photographs</span>
                  <span className="text-[10px] text-stone-400 uppercase tracking-widest font-sans">Full view</span>
                </button>

                <div className="my-1 border-t border-stone-100"></div>

                <button
                  onClick={() => handleNavigate('gallery', 'bridal-prep')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-stone-50 rounded flex items-center justify-between transition-colors text-stone-700 hover:text-stone-950"
                >
                  <span>Bridal Prep</span>
                  <span className="text-[10px] text-stone-400">Morning glow</span>
                </button>

                <button
                  onClick={() => handleNavigate('gallery', 'ceremony')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-stone-50 rounded flex items-center justify-between transition-colors text-stone-700 hover:text-stone-950"
                >
                  <span>Ceremony</span>
                  <span className="text-[10px] text-stone-400">Vows & rings</span>
                </button>

                <button
                  onClick={() => handleNavigate('gallery', 'on-location')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-stone-50 rounded flex items-center justify-between transition-colors text-stone-700 hover:text-stone-950"
                >
                  <span>On Location</span>
                  <span className="text-[10px] text-stone-400">Golden hour</span>
                </button>

                <button
                  onClick={() => handleNavigate('gallery', 'reception')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-stone-50 rounded flex items-center justify-between transition-colors text-stone-700 hover:text-stone-950"
                >
                  <span>Reception</span>
                  <span className="text-[10px] text-stone-400">Speeches & dinner</span>
                </button>

                <button
                  onClick={() => handleNavigate('gallery', 'dancing')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-stone-50 rounded flex items-center justify-between transition-colors text-stone-700 hover:text-stone-950"
                >
                  <span>Dancing</span>
                  <span className="text-[10px] text-stone-400">Evening party</span>
                </button>

                <div className="my-1 border-t border-stone-100"></div>

                <button
                  onClick={() => handleNavigate('featured-weddings')}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 rounded flex items-center justify-between transition-colors text-[#c2a378] font-semibold"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>3 Featured Weddings</span>
                  </span>
                  <span className="text-[10px] uppercase font-sans">Stories</span>
                </button>
              </div>
            )}
          </div>

          <span className="text-stone-300">|</span>

          {/* FEATURED WEDDINGS direct link */}
          <button
            onClick={() => handleNavigate('featured-weddings')}
            className={`py-1 transition-colors hover:text-stone-950 ${
              activePage === 'featured-weddings' ? 'text-stone-950 font-semibold' : 'text-stone-600'
            }`}
          >
            Featured Weddings
          </button>

          <span className="text-stone-300">|</span>

          {/* INVESTMENT / PRICING */}
          <button
            onClick={() => handleNavigate('pricing')}
            className={`py-1 transition-colors hover:text-stone-950 ${
              activePage === 'pricing' ? 'text-stone-950 font-semibold' : 'text-stone-600'
            }`}
          >
            Investment / Pricing
          </button>

          <span className="text-stone-300">|</span>

          {/* CONTACT US */}
          <button
            onClick={() => handleNavigate('contact')}
            className={`py-1 transition-colors hover:text-stone-950 ${
              activePage === 'contact' ? 'text-stone-950 font-semibold' : 'text-stone-600'
            }`}
          >
            Contact Us
          </button>

          <span className="text-stone-300">|</span>

          {/* GUEST PHOTO VAULT - STANDOUT BUTTON */}
          <button
            onClick={() => handleNavigate('vault')}
            className="group relative bg-[#c2a378] hover:bg-[#b39265] text-white px-4 py-1.5 rounded-sm shadow-xs hover:shadow-md transition-all duration-200 uppercase tracking-widest font-semibold text-[11px] flex items-center gap-1.5"
            title="Guest Photo Vault - Access or create your private wedding vault"
          >
            <Camera className="w-3.5 h-3.5 text-white/90" />
            <span>Guest Photo Vault</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white py-4 px-6 space-y-4 text-sm font-sans tracking-wide">
          <div className="space-y-2">
            <div className="font-semibold text-stone-900 uppercase text-xs tracking-wider">About Us</div>
            <div className="pl-3 space-y-1.5 text-xs text-stone-600">
              <button
                onClick={() => handleNavigate('about')}
                className="block w-full text-left py-1 hover:text-stone-950"
              >
                About MMC Photography
              </button>
              <button
                onClick={() => handleNavigate('reviews')}
                className="block w-full text-left py-1 hover:text-stone-950"
              >
                Kind Words & Reviews
              </button>
              <button
                onClick={() => handleNavigate('blog')}
                className="block w-full text-left py-1 hover:text-stone-950"
              >
                Wedding Blog & Tips
              </button>
              <button
                onClick={() => handleNavigate('about', undefined, 'faq-section')}
                className="block w-full text-left py-1 hover:text-stone-950"
              >
                Frequently Asked Questions
              </button>
            </div>
          </div>

          <div className="space-y-2 border-t border-stone-100 pt-3">
            <div className="font-semibold text-stone-900 uppercase text-xs tracking-wider">Gallery</div>
            <div className="pl-3 space-y-1.5 text-xs text-stone-600">
              <button
                onClick={() => handleNavigate('gallery', 'all')}
                className="block w-full text-left py-1 hover:text-stone-950 font-medium"
              >
                All Photographs
              </button>
              <button
                onClick={() => handleNavigate('gallery', 'bridal-prep')}
                className="block w-full text-left py-1 hover:text-stone-950"
              >
                Bridal Prep
              </button>
              <button
                onClick={() => handleNavigate('gallery', 'ceremony')}
                className="block w-full text-left py-1 hover:text-stone-950"
              >
                Ceremony
              </button>
              <button
                onClick={() => handleNavigate('gallery', 'on-location')}
                className="block w-full text-left py-1 hover:text-stone-950"
              >
                On Location
              </button>
              <button
                onClick={() => handleNavigate('gallery', 'reception')}
                className="block w-full text-left py-1 hover:text-stone-950"
              >
                Reception
              </button>
              <button
                onClick={() => handleNavigate('gallery', 'dancing')}
                className="block w-full text-left py-1 hover:text-stone-950"
              >
                Dancing
              </button>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-3 space-y-2">
            <button
              onClick={() => handleNavigate('featured-weddings')}
              className="block w-full text-left font-semibold text-[#c2a378] uppercase text-xs tracking-wider"
            >
              Featured Weddings (3 Stories)
            </button>
            <button
              onClick={() => handleNavigate('pricing')}
              className="block w-full text-left font-semibold text-stone-900 uppercase text-xs tracking-wider"
            >
              Investment / Pricing
            </button>
            <button
              onClick={() => handleNavigate('contact')}
              className="block w-full text-left font-semibold text-stone-900 uppercase text-xs tracking-wider"
            >
              Contact Us
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => handleNavigate('vault')}
              className="w-full bg-[#c2a378] hover:bg-[#b39265] text-white py-2.5 rounded font-medium text-xs uppercase tracking-widest text-center shadow-xs flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Guest Photo Vault</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
