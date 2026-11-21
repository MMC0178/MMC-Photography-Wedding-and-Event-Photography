'use client';

import Image from 'next/image';
import { Heart, ChevronRight } from 'lucide-react';

interface HeroSectionProps {
  heroImage?: string;
  onViewGallery: () => void;
}

const DEFAULT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1600&q=85';

export default function HeroSection({ heroImage, onViewGallery }: HeroSectionProps) {
  const imageSrc = heroImage?.trim() || DEFAULT_HERO_IMAGE;

  return (
    <section className="w-full bg-white py-6 sm:py-10 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-xs overflow-hidden border border-stone-200/80 shadow-xs bg-[#fbf9f6]">
          {/* Left Media Column - Bride & Groom */}
          <div className="lg:col-span-7 relative min-h-[380px] sm:min-h-[480px] lg:min-h-[580px] overflow-hidden group">
            <Image
              src={imageSrc}
              alt="Relaxed and joyful wedding couple embracing in the countryside"
              fill
              priority
              className="object-cover object-[center_28%] transition-transform duration-700 group-hover:scale-102"
              referrerPolicy="no-referrer"
              unoptimized={imageSrc.startsWith('data:') || imageSrc.startsWith('blob:')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent lg:hidden" />
          </div>

          {/* Right Text Column - Editorial Story Card */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center text-center p-8 sm:p-12 lg:p-14 bg-[#fbf9f6] relative">
            {/* Subtle decorative framing */}
            <div className="w-full max-w-md flex flex-col items-center space-y-5">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-stone-900 font-light leading-[1.18] tracking-tight">
                Your story,
                <br />
                <span className="italic font-normal">beautifully told</span>
              </h1>

              {/* Heart Divider Icon */}
              <div className="flex items-center justify-center gap-3 py-1">
                <span className="w-10 h-px bg-stone-300"></span>
                <Heart className="w-4 h-4 text-stone-700 fill-stone-700" />
                <span className="w-10 h-px bg-stone-300"></span>
              </div>

              {/* Lead Paragraph */}
              <p className="font-serif text-base sm:text-lg text-stone-700 leading-relaxed max-w-sm">
                Relaxed, natural wedding photography from the first moments to the last dance
              </p>

              {/* CTA Button */}
              <div className="pt-2">
                <button
                  onClick={onViewGallery}
                  className="inline-flex items-center gap-2 bg-[#768474] hover:bg-[#687666] text-white px-7 py-3 rounded-full text-xs uppercase tracking-[0.2em] font-sans font-medium transition-all duration-200 shadow-xs hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <span>VIEW THE GALLERY</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
