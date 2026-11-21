'use client';

import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

interface PricingTeaserProps {
  onViewPackages: () => void;
}

export default function PricingTeaser({ onViewPackages }: PricingTeaserProps) {
  return (
    <section className="w-full bg-white py-8 sm:py-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="relative min-h-[220px] sm:min-h-[260px] rounded-xs overflow-hidden border border-stone-200/80 shadow-xs flex items-center">
          {/* Background Image: Wedding rings on fine silk */}
          <Image
            src="https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1600&q=80"
            alt="Wedding rings on delicate white silk and floral details"
            fill
            className="object-cover object-[right_center]"
            referrerPolicy="no-referrer"
          />

          {/* Soft light scrim gradient on the left for contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent sm:w-2/3" />

          {/* Content */}
          <div className="relative z-10 p-6 sm:p-12 max-w-lg space-y-3">
            <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal">
              Investment / Pricing
            </h2>

            <p className="font-serif italic text-base sm:text-lg text-stone-700">
              Thoughtful coverage, beautifully presented
            </p>

            <div className="pt-2">
              <button
                onClick={onViewPackages}
                className="inline-flex items-center gap-2 border border-stone-800 hover:bg-stone-900 hover:text-white text-stone-800 px-6 py-2.5 rounded-full text-xs uppercase tracking-[0.2em] font-sans font-medium transition-all duration-200 bg-white/60 backdrop-blur-xs"
              >
                <span>VIEW PACKAGES</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
