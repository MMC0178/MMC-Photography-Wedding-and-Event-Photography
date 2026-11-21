'use client';

import { useState } from 'react';
import { Camera, ChevronDown, Phone, Mail, Lock } from 'lucide-react';

interface FooterNavProps {
  setActivePage: (page: string) => void;
  setActiveCategory?: (category: string) => void;
  onOpenPhotographerAdmin: () => void;
}

export default function FooterNav({
  setActivePage,
  setActiveCategory,
  onOpenPhotographerAdmin,
}: FooterNavProps) {
  const [footerAboutOpen, setFooterAboutOpen] = useState(false);
  const [footerGalleryOpen, setFooterGalleryOpen] = useState(false);

  const handleNav = (page: string, category?: string, anchorId?: string) => {
    setActivePage(page);
    if (category && setActiveCategory) {
      setActiveCategory(category);
    }
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
    <footer className="w-full bg-[#1e2321] text-white pt-12 pb-8 px-4 sm:px-8 border-t border-stone-800">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Links Row matching mockup */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-7 text-xs font-sans tracking-wider uppercase text-stone-300">
          {/* About Us dropdown / toggle */}
          <div className="relative">
            <button
              onClick={() => setFooterAboutOpen(!footerAboutOpen)}
              className="flex items-center gap-1.5 hover:text-white transition-colors py-1"
            >
              <span>About Us</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${footerAboutOpen ? 'rotate-180' : ''}`} />
            </button>
            {footerAboutOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#282f2c] border border-stone-700 rounded-xs py-2 shadow-xl z-30 normal-case">
                <button
                  onClick={() => {
                    handleNav('about');
                    setFooterAboutOpen(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-stone-200 hover:text-white hover:bg-stone-700/50"
                >
                  About MMC Photography
                </button>
                <button
                  onClick={() => {
                    handleNav('reviews');
                    setFooterAboutOpen(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-stone-200 hover:text-white hover:bg-stone-700/50"
                >
                  Kind Words & Reviews
                </button>
                <button
                  onClick={() => {
                    handleNav('blog');
                    setFooterAboutOpen(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-stone-200 hover:text-white hover:bg-stone-700/50"
                >
                  Wedding Blog &amp; Tips
                </button>
                <button
                  onClick={() => {
                    handleNav('about', undefined, 'faq-section');
                    setFooterAboutOpen(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-stone-200 hover:text-white hover:bg-stone-700/50"
                >
                  Frequently Asked Questions
                </button>
              </div>
            )}
          </div>

          <span className="text-stone-600 hidden sm:inline">|</span>

          {/* Gallery dropdown / toggle */}
          <div className="relative">
            <button
              onClick={() => setFooterGalleryOpen(!footerGalleryOpen)}
              className="flex items-center gap-1.5 hover:text-white transition-colors py-1"
            >
              <span>Gallery</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${footerGalleryOpen ? 'rotate-180' : ''}`} />
            </button>
            {footerGalleryOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#282f2c] border border-stone-700 rounded-xs py-2 shadow-xl z-30 normal-case">
                <button
                  onClick={() => {
                    handleNav('gallery', 'all');
                    setFooterGalleryOpen(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-stone-200 hover:text-white hover:bg-stone-700/50"
                >
                  All Photographs
                </button>
                <button
                  onClick={() => {
                    handleNav('gallery', 'bridal-prep');
                    setFooterGalleryOpen(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-stone-200 hover:text-white hover:bg-stone-700/50"
                >
                  Bridal Prep
                </button>
                <button
                  onClick={() => {
                    handleNav('gallery', 'ceremony');
                    setFooterGalleryOpen(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-stone-200 hover:text-white hover:bg-stone-700/50"
                >
                  Ceremony
                </button>
                <button
                  onClick={() => {
                    handleNav('gallery', 'on-location');
                    setFooterGalleryOpen(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-stone-200 hover:text-white hover:bg-stone-700/50"
                >
                  On Location
                </button>
                <button
                  onClick={() => {
                    handleNav('gallery', 'reception');
                    setFooterGalleryOpen(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-stone-200 hover:text-white hover:bg-stone-700/50"
                >
                  Reception
                </button>
                <button
                  onClick={() => {
                    handleNav('gallery', 'dancing');
                    setFooterGalleryOpen(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-stone-200 hover:text-white hover:bg-stone-700/50"
                >
                  Dancing
                </button>
              </div>
            )}
          </div>

          <span className="text-stone-600 hidden sm:inline">|</span>

          {/* Featured Weddings link */}
          <button
            onClick={() => handleNav('featured-weddings')}
            className="hover:text-white transition-colors py-1"
          >
            Featured Weddings
          </button>

          <span className="text-stone-600 hidden sm:inline">|</span>

          {/* Investment/Pricing */}
          <button
            onClick={() => handleNav('pricing')}
            className="hover:text-white transition-colors py-1"
          >
            Investment/Pricing
          </button>

          <span className="text-stone-600 hidden sm:inline">|</span>

          {/* Contact Us */}
          <button
            onClick={() => handleNav('contact')}
            className="hover:text-white transition-colors py-1"
          >
            Contact Us
          </button>

          <span className="text-stone-600 hidden sm:inline">|</span>

          {/* Guest Photo Vault */}
          <button
            onClick={() => handleNav('vault')}
            className="text-[#e2c7a2] hover:text-white transition-colors py-1 font-semibold flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Guest Photo Vault</span>
          </button>
        </div>

        {/* Divider with Social Links */}
        <div className="relative flex items-center justify-center py-2">
          <div className="w-full border-t border-stone-700"></div>

          <div className="absolute bg-[#1e2321] px-6 flex items-center gap-4 text-stone-400">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-[#2a312e] hover:bg-[#c2a378] hover:text-white transition-colors flex items-center justify-center text-xs"
              aria-label="Facebook"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-[#2a312e] hover:bg-[#c2a378] hover:text-white transition-colors flex items-center justify-center text-xs"
              aria-label="Instagram"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* Pinterest */}
            <a
              href="https://pinterest.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-[#2a312e] hover:bg-[#c2a378] hover:text-white transition-colors flex items-center justify-center text-xs"
              aria-label="Pinterest"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.332 1.357-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-[#2a312e] hover:bg-[#c2a378] hover:text-white transition-colors flex items-center justify-center text-xs"
              aria-label="YouTube"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom Credits, Contact & Discreet Photographer Admin Access */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 font-sans pt-2 gap-4">
          <div className="flex items-center gap-3">
            <span>© 2025 MMC Photography. All rights reserved.</span>
            <span>·</span>
            {/* Discreet Photographer Admin button */}
            <button
              onClick={onOpenPhotographerAdmin}
              className="text-stone-400 hover:text-[#c2a378] transition-colors flex items-center gap-1 text-[11px]"
              title="Photographer Portal — Update Featured Weddings, Gallery Photos & Pricing"
            >
              <Lock className="w-3 h-3 text-stone-400" />
              <span>Studio Admin</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a href="tel:07511616354" className="hover:text-stone-200 flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#c2a378]" />
              <span>07511616354</span>
            </a>
            <span>•</span>
            <a href="mailto:michael@mmcphotography.co.uk" className="hover:text-stone-200 flex items-center gap-1">
              <Mail className="w-3 h-3 text-[#c2a378]" />
              <span>michael@mmcphotography.co.uk</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
