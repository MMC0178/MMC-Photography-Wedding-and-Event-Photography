'use client';

import { useState } from 'react';
import Image from 'next/image';
import { GALLERY_CATEGORIES, GalleryPhoto } from '@/lib/wedding-data';
import { X, ChevronRight, Sparkles } from 'lucide-react';

interface GalleryPageProps {
  photos: GalleryPhoto[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  onViewFeaturedWeddings: () => void;
}

export default function GalleryPage({
  photos,
  activeCategory,
  setActiveCategory,
  onViewFeaturedWeddings,
}: GalleryPageProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  // Filter gallery photos based on active category
  const filteredPhotos = activeCategory === 'all'
    ? photos
    : photos.filter(p => p.category === activeCategory);

  const activeCategoryMeta = GALLERY_CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="w-full bg-white min-h-screen py-10 sm:py-16 px-4 sm:px-8 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-stone-200 pb-8 gap-6">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-[0.25em] text-[#c2a378] font-sans font-semibold">
              The Curated Portfolio
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-stone-900 font-light tracking-tight">
              The Wedding Gallery
            </h1>
            <p className="font-serif italic text-base sm:text-lg text-stone-600 max-w-xl">
              Real moments, genuine emotions, and natural storytelling categorized from morning bridal prep to late night dancing.
            </p>
          </div>

          {/* Link to 3 Featured Weddings */}
          <div className="shrink-0">
            <button
              onClick={onViewFeaturedWeddings}
              className="inline-flex items-center gap-2 border border-stone-800 hover:bg-stone-900 hover:text-white text-stone-900 px-5 py-2.5 rounded-full text-xs uppercase tracking-widest font-sans font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#c2a378]" />
              <span>View 3 Featured Weddings</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-stone-100">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xs text-xs uppercase tracking-widest font-sans transition-colors shrink-0 ${
              activeCategory === 'all'
                ? 'bg-stone-900 text-white font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            All Photographs ({photos.length})
          </button>

          {GALLERY_CATEGORIES.map(cat => {
            const count = photos.filter(p => p.category === cat.id).length;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xs text-xs uppercase tracking-widest font-sans transition-colors shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-stone-900 text-white font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Spotlight Banner when a category is selected */}
        {activeCategory !== 'all' && activeCategoryMeta && (
          <div className="bg-[#fbf9f6] p-5 sm:p-7 rounded-xs border border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c2a378]">
                Category Spotlight
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-stone-900">
                {activeCategoryMeta.name}
              </h2>
              <p className="font-serif italic text-sm text-stone-600 mt-1 max-w-xl">
                {activeCategoryMeta.description}
              </p>
            </div>
            <button
              onClick={() => setActiveCategory('all')}
              className="text-xs uppercase tracking-wider text-stone-600 hover:text-stone-950 underline underline-offset-4 shrink-0"
            >
              Show all photographs
            </button>
          </div>
        )}

        {/* Photos Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-500 font-sans">
            <span>
              Showing {filteredPhotos.length} {filteredPhotos.length === 1 ? 'Photograph' : 'Photographs'}
            </span>
            <span>Click any photograph to view in high-resolution lightbox</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map((photo, i) => (
              <div
                key={photo.id + i}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative aspect-[3/4] overflow-hidden rounded-xs cursor-pointer bg-stone-100 shadow-2xs hover:shadow-md transition-all"
              >
                <Image
                  src={photo.url}
                  alt={photo.category.replace('-', ' ')}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  unoptimized={photo.url.startsWith('data:') || photo.url.startsWith('blob:')}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High-Resolution Single Photo Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-6 right-6 text-white/80 hover:text-white p-2 rounded-full bg-white/10 transition-colors"
            aria-label="Close photo"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-5xl max-h-[85vh] w-full h-full flex flex-col items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative w-full h-[80vh]">
              <Image
                src={selectedPhoto.url}
                alt={selectedPhoto.category.replace('-', ' ')}
                fill
                className="object-contain"
                referrerPolicy="no-referrer"
                unoptimized={selectedPhoto.url.startsWith('data:') || selectedPhoto.url.startsWith('blob:')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
