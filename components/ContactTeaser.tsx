'use client';

import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

interface ContactTeaserProps {
  onCheckDate: () => void;
}

export default function ContactTeaser({ onCheckDate }: ContactTeaserProps) {
  return (
    <section className="w-full bg-white py-8 sm:py-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="relative min-h-[220px] sm:min-h-[260px] rounded-xs overflow-hidden border border-stone-200/80 shadow-xs flex items-center">
          {/* Background Image: Wedding Welcome signage & florals */}
          <Image
            src="https://images.unsplash.com/photo-1519225424985-3b9e4a87c1be?auto=format&fit=crop&w=1600&q=80"
            alt="Rustic wooden Welcome wedding sign with meadow florals"
            fill
            className="object-cover object-[right_center]"
            referrerPolicy="no-referrer"
          />

          {/* Light scrim gradient on the left */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent sm:w-2/3" />

          {/* Content */}
          <div className="relative z-10 p-6 sm:p-12 max-w-lg space-y-3">
            <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal uppercase tracking-wider">
              LET&apos;S TALK ABOUT YOUR DAY
            </h2>

            <p className="font-serif text-base sm:text-lg text-stone-700 leading-relaxed">
              We&apos;d love to hear from you. Get in touch to check availability, ask a question or simply say hello.
            </p>

            <div className="pt-2">
              <button
                onClick={onCheckDate}
                className="inline-flex items-center gap-2 border border-stone-800 hover:bg-stone-900 hover:text-white text-stone-800 px-6 py-2.5 rounded-full text-xs uppercase tracking-[0.2em] font-sans font-medium transition-all duration-200 bg-white/60 backdrop-blur-xs"
              >
                <span>CHECK YOUR DATE</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
