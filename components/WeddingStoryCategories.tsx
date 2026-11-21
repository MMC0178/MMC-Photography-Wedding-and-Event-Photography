'use client';

import Image from 'next/image';
import { GALLERY_CATEGORIES, GalleryPhoto } from '@/lib/wedding-data';

interface WeddingStoryCategoriesProps {
  photos: GalleryPhoto[];
  onSelectCategory: (categoryId: string) => void;
}

export default function WeddingStoryCategories({
  photos,
  onSelectCategory,
}: WeddingStoryCategoriesProps) {
  return (
    <section className="w-full bg-white py-12 sm:py-16 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Title with flanking hairline rules */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="h-px bg-stone-300 flex-1 max-w-[120px] sm:max-w-[200px]" />
          <h2 className="font-serif text-xl sm:text-2xl lg:text-[28px] text-stone-900 font-light tracking-[0.2em] uppercase text-center">
            THE WEDDING STORY
          </h2>
          <div className="h-px bg-stone-300 flex-1 max-w-[120px] sm:max-w-[200px]" />
        </div>

        {/* 5-Column Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {GALLERY_CATEGORIES.map(category => {
            const latestPhoto = photos.find(p => p.category === category.id);
            const coverSrc = latestPhoto?.url || category.coverImage;

            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className="group relative aspect-[3/4] overflow-hidden rounded-xs cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#c2a378]"
                title={`View ${category.name} wedding gallery`}
              >
                {/* Photo Background */}
                <Image
                  src={coverSrc}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                  referrerPolicy="no-referrer"
                  unoptimized={coverSrc.startsWith('data:') || coverSrc.startsWith('blob:')}
                />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:from-black/90" />

              {/* Bottom Label Bar */}
              <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 text-center">
                <div className="inline-block w-full py-1.5 px-2 bg-stone-900/60 backdrop-blur-[2px] group-hover:bg-[#c2a378]/90 transition-colors rounded-xs">
                  <span className="font-sans font-medium text-[11px] sm:text-xs text-white uppercase tracking-[0.18em]">
                    {category.name}
                  </span>
                </div>
              </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
