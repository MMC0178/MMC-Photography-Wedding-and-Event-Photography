'use client';

import Image from 'next/image';
import { ChevronRight, Sparkles } from 'lucide-react';

interface GuestPhotoVaultBannerProps {
  onDiscoverVault: () => void;
}

export default function GuestPhotoVaultBanner({
  onDiscoverVault,
}: GuestPhotoVaultBannerProps) {
  return (
    <section className="w-full bg-white py-10 sm:py-14 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-xs overflow-hidden bg-[#6f7a6a] text-white p-8 sm:p-12 shadow-sm border border-[#5d6858]">
          {/* Subtle botanical leaves watermark effect in the top-right / background */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Stylized Camera & Frames Iconography */}
            <div className="lg:col-span-3 flex justify-center lg:justify-start">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
                {/* Custom SVG line camera with floating picture frames matching the illustration */}
                <svg
                  className="w-full h-full text-white/80"
                  viewBox="0 0 140 140"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Dynamic swoosh */}
                  <path
                    d="M 15 110 C 20 50, 75 15, 125 45"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  {/* Camera Body */}
                  <rect x="25" y="45" width="80" height="55" rx="10" />
                  <path d="M 45 45 L 53 32 L 77 32 L 85 45 Z" />
                  <circle cx="65" cy="72" r="18" />
                  <circle cx="65" cy="72" r="7" />
                  <circle cx="92" cy="56" r="3" fill="currentColor" />
                  {/* Floating Photo Prints */}
                  <g transform="rotate(14 100 85)">
                    <rect x="80" y="65" width="38" height="46" rx="3" fill="#6f7a6a" stroke="currentColor" strokeWidth="2" />
                    <rect x="84" y="69" width="30" height="28" fill="rgba(255,255,255,0.2)" stroke="none" />
                  </g>
                  <g transform="rotate(-18 40 90)">
                    <rect x="20" y="70" width="34" height="42" rx="3" fill="#6f7a6a" stroke="currentColor" strokeWidth="2" />
                    <rect x="24" y="74" width="26" height="24" fill="rgba(255,255,255,0.2)" stroke="none" />
                  </g>
                </svg>
              </div>
            </div>

            {/* Center: Copy & CTA */}
            <div className="lg:col-span-5 text-center lg:text-left space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs tracking-[0.25em] uppercase text-stone-200 font-sans">
                <Sparkles className="w-3.5 h-3.5 text-[#e8d7be]" />
                <span>Exclusive Feature For Couples</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl text-white font-normal uppercase tracking-wider leading-tight">
                GUEST PHOTO VAULT
              </h2>

              <p className="font-serif italic text-base sm:text-lg text-stone-100">
                Collect every guest&apos;s photos and memories in one private place
              </p>

              <div className="pt-2">
                <button
                  onClick={onDiscoverVault}
                  className="inline-flex items-center gap-2 bg-[#f8f6f0] hover:bg-white text-stone-900 px-6 sm:px-8 py-3 rounded-full text-xs uppercase tracking-[0.2em] font-sans font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <span>DISCOVER GUEST PHOTO VAULT</span>
                  <ChevronRight className="w-4 h-4 text-stone-900" />
                </button>
              </div>
            </div>

            {/* Right: Overlapping Polaroids */}
            <div className="lg:col-span-4 flex items-center justify-center lg:justify-end">
              <div className="relative w-64 h-52 sm:w-72 sm:h-56">
                {/* Polaroid 1 (Left tilt) */}
                <div className="absolute left-0 bottom-2 w-32 sm:w-36 bg-white p-2 sm:p-2.5 pb-6 sm:pb-8 shadow-xl rounded-xs transform -rotate-10 transition-transform hover:rotate-0 hover:z-20 duration-300">
                  <div className="relative aspect-square w-full bg-stone-200 overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=500&q=80"
                      alt="Guest celebration toast"
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-[9px] text-center font-serif text-stone-700 italic pt-1.5">
                    Drinks reception ♡
                  </div>
                </div>

                {/* Polaroid 2 (Center portrait) */}
                <div className="absolute left-16 sm:left-20 top-0 w-32 sm:w-36 bg-white p-2 sm:p-2.5 pb-6 sm:pb-8 shadow-2xl rounded-xs transform rotate-2 z-10 transition-transform hover:scale-105 duration-300">
                  <div className="relative aspect-square w-full bg-stone-200 overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=500&q=80"
                      alt="Bride and groom sunset portrait"
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-[9px] text-center font-serif text-stone-700 italic pt-1.5">
                    Sophie & James
                  </div>
                </div>

                {/* Polaroid 3 (Right tilt) */}
                <div className="absolute right-0 bottom-4 w-32 sm:w-36 bg-white p-2 sm:p-2.5 pb-6 sm:pb-8 shadow-xl rounded-xs transform rotate-12 transition-transform hover:rotate-0 hover:z-20 duration-300">
                  <div className="relative aspect-square w-full bg-stone-200 overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=500&q=80"
                      alt="Friends on the wedding dance floor"
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-[9px] text-center font-serif text-stone-700 italic pt-1.5">
                    Table 4 partying!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
