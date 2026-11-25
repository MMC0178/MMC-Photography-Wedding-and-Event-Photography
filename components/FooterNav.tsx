'use client';

import { useState } from 'react';
import { Camera, ChevronDown, Phone, Mail, Lock, Facebook, Instagram } from 'lucide-react';

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
              href="https://www.facebook.com/MMCPhotographyNI/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-[#2a312e] hover:bg-[#c2a378] hover:text-white transition-colors flex items-center justify-center text-xs"
              aria-label="MMC Photography on Facebook"
              title="Follow MMC Photography on Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/mmcphotoni/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-[#2a312e] hover:bg-[#c2a378] hover:text-white transition-colors flex items-center justify-center text-xs"
              aria-label="MMC Photography on Instagram"
              title="Follow MMC Photography on Instagram"
            >
              <Instagram className="w-4 h-4" />
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
            <a
              href="https://wa.me/447511616354"
              target="_blank"
              rel="noopener noreferrer"
              title="Message MMC Photography on WhatsApp"
              className="hover:text-stone-200 flex items-center gap-1"
            >
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
