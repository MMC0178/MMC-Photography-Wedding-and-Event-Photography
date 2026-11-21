'use client';

import { Check, Camera } from 'lucide-react';
import { PricingPackage } from '@/lib/wedding-data';

interface PricingPageProps {
  packages: PricingPackage[];
  onSelectPackage: (packageName: string) => void;
  onViewVault: () => void;
}

export default function PricingPage({
  packages,
  onSelectPackage,
  onViewVault,
}: PricingPageProps) {
  return (
    <div className="w-full bg-white min-h-screen py-10 sm:py-16 px-4 sm:px-8 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.25em] text-[#c2a378] font-sans font-semibold">
            Clear, Transparent Pricing
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-stone-900 font-light tracking-tight">
            Investment & Pricing
          </h1>
          <p className="font-serif italic text-base sm:text-lg text-stone-600">
            Thoughtful coverage, beautifully presented. No hidden travel fees, no watermarks, full personal printing rights.
          </p>
        </div>

        {/* Guest Photo Vault Highlight Banner */}
        <div className="bg-[#f7f5ef] border border-[#dcd6c7] p-6 rounded-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#c2a378] flex items-center justify-center text-white shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest font-sans font-bold text-stone-900">
                Guest Photo Vault Included With Signature and Platinum packages
              </div>
              <div className="font-serif text-sm text-stone-600">
                Receive custom QR cards for your tables so guests can upload candid memories into your private vault.
              </div>
            </div>
          </div>

          <button
            onClick={onViewVault}
            className="text-xs uppercase tracking-widest font-sans font-semibold text-stone-900 hover:text-[#c2a378] border border-stone-400 hover:border-stone-900 px-4 py-2 rounded-xs transition-colors shrink-0"
          >
            Explore Guest Vault
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {packages.map(pkg => (
            <div
              key={pkg.id}
              className={`rounded-xs p-8 flex flex-col justify-between space-y-6 transition-all duration-300 relative ${
                pkg.popular
                  ? 'bg-[#1e2321] text-white shadow-xl ring-2 ring-[#c2a378]'
                  : 'bg-[#fbf9f6] text-stone-800 border border-stone-200/90 shadow-2xs hover:shadow-md'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#c2a378] text-white text-[10px] uppercase tracking-[0.2em] px-3.5 py-1 rounded-full font-sans font-semibold shadow-xs">
                  Most Popular Choice
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-serif text-2xl font-normal">
                    {pkg.name}
                  </h3>
                  <div className="text-xs uppercase tracking-wider opacity-75 font-sans">
                    {pkg.hours}
                  </div>
                </div>

                <div className="py-2 border-y border-current/10">
                  <div className="font-serif text-4xl font-light">
                    {pkg.price}
                  </div>
                  <p className="text-xs opacity-75 font-serif italic mt-1">
                    {pkg.tagline}
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-3 pt-2 text-xs leading-relaxed font-sans">
                  {pkg.features
                    .filter(feat => feat.trim().length > 0)
                    .map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${pkg.popular ? 'text-[#c2a378]' : 'text-[#768474]'}`} />
                        <span>{feat}</span>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-current/10">
                <button
                  onClick={() => onSelectPackage(pkg.name)}
                  className={`w-full py-3 rounded text-xs uppercase tracking-widest font-sans font-semibold transition-all ${
                    pkg.popular
                      ? 'bg-[#c2a378] hover:bg-[#b39265] text-white shadow-md'
                      : 'bg-stone-900 hover:bg-stone-800 text-white'
                  }`}
                >
                  Inquire About This Package
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
