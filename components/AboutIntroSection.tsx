'use client';

import Image from 'next/image';
import { Pencil, Star, ChevronRight } from 'lucide-react';
import { AboutContent, INITIAL_ABOUT_CONTENT } from '@/lib/wedding-data';

interface AboutIntroSectionProps {
  aboutContent: AboutContent;
  onLearnMore: () => void;
  onOpenBlog: () => void;
  onOpenReviews: () => void;
}

export default function AboutIntroSection({
  aboutContent,
  onLearnMore,
  onOpenBlog,
  onOpenReviews,
}: AboutIntroSectionProps) {
  return (
    <section className="w-full bg-white py-12 sm:py-16 px-4 sm:px-8 border-t border-stone-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Column 1: Editorial Introduction */}
          <div className="md:col-span-4 flex flex-col justify-center space-y-5 pr-0 md:pr-4">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[34px] text-stone-900 font-normal leading-tight">
              {aboutContent.homepageTitle}
            </h2>

            <p className="font-serif text-stone-700 text-base leading-relaxed">
              {aboutContent.homepageText}
            </p>

            <div className="pt-2">
              <button
                onClick={onLearnMore}
                className="inline-flex items-center gap-2 border border-stone-800 hover:bg-stone-900 hover:text-white text-stone-800 px-6 py-2.5 rounded-full text-xs uppercase tracking-[0.2em] font-sans font-medium transition-all duration-200"
              >
                <span>LEARN MORE</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Column 2: Photographer in Action Photo */}
          <div className="md:col-span-4 relative min-h-[280px] sm:min-h-[340px] rounded-xs overflow-hidden group shadow-xs">
            <Image
              src={aboutContent.homepageImage || INITIAL_ABOUT_CONTENT.homepageImage}
              alt="MMC photographer capturing couple moments outdoors"
              fill
              className="object-cover object-center transition-transform duration-500 group-hover:scale-103"
              referrerPolicy="no-referrer"
              unoptimized={
                (aboutContent.homepageImage || '').startsWith('data:') ||
                (aboutContent.homepageImage || '').startsWith('blob:')
              }
            />
            <div className="absolute inset-0 bg-stone-900/10 pointer-events-none" />
          </div>

          {/* Column 3: Quick Action Cards (Blog & Reviews) */}
          <div className="md:col-span-4 flex flex-col justify-center gap-4">
            {/* BLOG Card */}
            <button
              onClick={onOpenBlog}
              className="w-full text-left p-6 sm:p-7 rounded-xs bg-[#f7f4ee] hover:bg-[#efebe1] border border-stone-200/70 transition-all duration-200 flex items-center justify-between group cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-stone-700 shadow-2xs group-hover:text-stone-950 transition-colors">
                  <Pencil className="w-5 h-5 stroke-[1.6]" />
                </div>
                <div>
                  <div className="font-sans font-semibold text-xs tracking-[0.2em] uppercase text-stone-900">
                    BLOG
                  </div>
                  <div className="font-serif text-sm text-stone-600 mt-0.5">
                    Tips, inspiration and behind the scenes
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 group-hover:translate-x-1 transition-all" />
            </button>

            {/* KIND WORDS & REVIEWS Card */}
            <button
              onClick={onOpenReviews}
              className="w-full text-left p-6 sm:p-7 rounded-xs bg-[#f7f4ee] hover:bg-[#efebe1] border border-stone-200/70 transition-all duration-200 flex items-center justify-between group cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-stone-700 shadow-2xs group-hover:text-stone-950 transition-colors">
                  <Star className="w-5 h-5 stroke-[1.6]" />
                </div>
                <div>
                  <div className="font-sans font-semibold text-xs tracking-[0.2em] uppercase text-stone-900">
                    KIND WORDS & REVIEWS
                  </div>
                  <div className="font-serif text-sm text-stone-600 mt-0.5">
                    See what our couples say
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
