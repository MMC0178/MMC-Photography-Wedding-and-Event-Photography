'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FeaturedWedding, FeaturedWeddingPhoto } from '@/lib/wedding-data';
import { Calendar, MapPin, Heart, ChevronRight, X } from 'lucide-react';

interface FeaturedWeddingsPageProps {
  featuredWeddings: FeaturedWedding[];
  onViewGallery: () => void;
  onCheckDate: () => void;
}

export default function FeaturedWeddingsPage({
  featuredWeddings,
  onViewGallery,
  onCheckDate,
}: FeaturedWeddingsPageProps) {
  const [selectedWedding, setSelectedWedding] = useState<FeaturedWedding | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<FeaturedWeddingPhoto | null>(null);

  // Strictly display 3 featured weddings
  const weddings = featuredWeddings.slice(0, 3);

  return (
    <div className="w-full bg-white min-h-screen py-10 sm:py-16 px-4 sm:px-8 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.25em] text-[#c2a378] font-sans font-semibold">
            Real Love Stories
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-stone-900 font-light tracking-tight">
            Featured Weddings
          </h1>
          <div className="flex items-center justify-center gap-3 py-1">
            <span className="w-10 h-px bg-stone-300"></span>
            <Heart className="w-4 h-4 text-stone-700 fill-stone-700" />
            <span className="w-10 h-px bg-stone-300"></span>
          </div>
          <p className="font-serif italic text-base sm:text-lg text-stone-600">
            A deeper look into three complete wedding celebrations—from quiet morning anticipation to late-night revelry.
          </p>
        </div>

        {/* 3 Featured Weddings Editorial Layout */}
        <div className="space-y-16">
          {weddings.map((wedding, idx) => (
            <div
              key={wedding.id}
              className="border border-stone-200/90 rounded-xs overflow-hidden bg-white shadow-2xs hover:shadow-md transition-shadow"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                {/* Cover Image */}
                <div
                  onClick={() => setSelectedWedding(wedding)}
                  className="lg:col-span-7 relative min-h-[320px] sm:min-h-[420px] cursor-pointer overflow-hidden group bg-stone-100"
                >
                  <Image
                    src={wedding.coverImage}
                    alt={wedding.couple}
                    fill
                    className="object-cover group-hover:scale-103 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                    unoptimized={wedding.coverImage.startsWith('data:') || wedding.coverImage.startsWith('blob:')}
                  />
                  <div className="absolute top-4 left-4 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] uppercase tracking-widest px-3 py-1 rounded-xs font-sans">
                    Featured Story 0{idx + 1}
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full font-sans">
                    {wedding.photos.length} Wedding Photos
                  </div>
                </div>

                {/* Narrative Details */}
                <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6 bg-[#fbf9f6]">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-xs text-stone-500 font-sans">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>{wedding.date}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        <span>{wedding.venue}</span>
                      </span>
                    </div>

                    <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 leading-tight">
                      {wedding.couple}
                    </h2>

                    <p className="font-serif text-stone-700 text-base leading-relaxed">
                      {wedding.story}
                    </p>

                    {wedding.highlightQuote && (
                      <blockquote className="border-l-2 border-[#c2a378] pl-4 py-1 italic font-serif text-stone-800 text-sm">
                        &ldquo;{wedding.highlightQuote}&rdquo;
                      </blockquote>
                    )}
                  </div>

                  {/* Wedding Photos Mini Grid & Action */}
                  <div className="space-y-4 pt-4 border-t border-stone-200">
                    <div className="text-[11px] font-sans font-semibold uppercase tracking-wider text-stone-500">
                      Wedding Day Moments
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {wedding.photos.slice(0, 4).map(photo => (
                        <div
                          key={photo.id}
                          onClick={() => setLightboxPhoto(photo)}
                          className="relative aspect-square rounded-xs overflow-hidden cursor-pointer group bg-stone-200"
                        >
                          <Image
                            src={photo.url}
                            alt={photo.caption || 'Wedding moment'}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                            unoptimized={photo.url.startsWith('data:') || photo.url.startsWith('blob:')}
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setSelectedWedding(wedding)}
                      className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-[#1e2321] hover:bg-[#2e3733] text-white py-2.5 rounded-xs text-xs uppercase tracking-widest font-sans font-semibold transition-colors"
                    >
                      <span>Explore {wedding.couple}&apos;s Full Story</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Link to Categorized Gallery */}
        <div className="bg-[#fbf9f6] p-8 rounded-xs border border-stone-200 text-center space-y-4">
          <h3 className="font-serif text-2xl text-stone-900">
            Looking for Specific Moments?
          </h3>
          <p className="font-serif italic text-stone-600 text-base max-w-md mx-auto">
            Browse our dedicated Wedding Gallery filtered by Bridal Prep, Ceremony, On Location, Reception, and Dancing.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <button
              onClick={onViewGallery}
              className="bg-[#c2a378] hover:bg-[#b39265] text-white px-7 py-3 rounded-full text-xs uppercase tracking-widest font-sans font-semibold transition-colors"
            >
              Browse Categorized Gallery
            </button>
            <button
              onClick={onCheckDate}
              className="border border-stone-800 text-stone-800 hover:bg-stone-900 hover:text-white px-7 py-3 rounded-full text-xs uppercase tracking-widest font-sans font-medium transition-colors"
            >
              Check Availability
            </button>
          </div>
        </div>
      </div>

      {/* Wedding Story Modal (Un-categorized photos of that wedding) */}
      {selectedWedding && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-md max-w-4xl w-full my-6 overflow-hidden shadow-2xl border border-stone-300">
            {/* Header banner */}
            <div className="relative aspect-[21/9] sm:aspect-[16/7] w-full bg-stone-900">
              <Image
                src={selectedWedding.coverImage}
                alt={selectedWedding.couple}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
                unoptimized={selectedWedding.coverImage.startsWith('data:') || selectedWedding.coverImage.startsWith('blob:')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
                <span className="text-xs uppercase tracking-widest text-[#e8d7be] font-sans">
                  {selectedWedding.venue} · {selectedWedding.location}
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl">
                  {selectedWedding.couple}
                </h3>
                <span className="text-xs text-stone-300 font-sans mt-1">
                  {selectedWedding.date}
                </span>
              </div>
              <button
                onClick={() => setSelectedWedding(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              <p className="font-serif text-base sm:text-lg text-stone-700 leading-relaxed">
                {selectedWedding.story}
              </p>

              {selectedWedding.highlightQuote && (
                <blockquote className="border-l-2 border-[#c2a378] pl-4 py-1 italic font-serif text-stone-800 text-lg">
                  &ldquo;{selectedWedding.highlightQuote}&rdquo;
                </blockquote>
              )}

              {/* All Photos for this wedding */}
              <div className="space-y-3 pt-4 border-t border-stone-200">
                <h4 className="font-serif text-xl text-stone-900">
                  Wedding Photographs ({selectedWedding.photos.length})
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedWedding.photos.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setLightboxPhoto(p)}
                      className="group relative aspect-[4/3] rounded overflow-hidden cursor-pointer bg-stone-100"
                    >
                      <Image
                        src={p.url}
                        alt={p.caption || 'Photo'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                        unoptimized={p.url.startsWith('data:') || p.url.startsWith('blob:')}
                      />
                      {p.caption && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 text-white text-[11px]">
                          {p.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Photo Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-6 right-6 text-white/80 hover:text-white p-2 rounded-full bg-white/10"
            aria-label="Close photo"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-5xl max-h-[85vh] w-full h-full flex flex-col items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative w-full h-[70vh]">
              <Image
                src={lightboxPhoto.url}
                alt={lightboxPhoto.caption || 'Wedding moment'}
                fill
                className="object-contain"
                referrerPolicy="no-referrer"
                unoptimized={lightboxPhoto.url.startsWith('data:') || lightboxPhoto.url.startsWith('blob:')}
              />
            </div>
            {lightboxPhoto.caption && (
              <p className="font-serif text-lg text-stone-200 mt-4 text-center">
                {lightboxPhoto.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
