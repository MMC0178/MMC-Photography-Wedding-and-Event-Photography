'use client';

import { Phone, Mail } from 'lucide-react';

export default function TopUtilityBar() {
  return (
    <div className="bg-[#1e2321] text-[#eae7e1] text-xs font-sans tracking-wide py-2 px-4 sm:px-8 border-b border-[#2c3330]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-4 sm:gap-6 text-[11px] sm:text-xs">
          <a
            href="https://wa.me/447511616354"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-[#c2a378] transition-colors"
            title="Message MMC Photography on WhatsApp"
          >
            <Phone className="w-3 h-3 text-[#c2a378]" />
            <span>07511616354</span>
          </a>
          <span className="text-stone-600">|</span>
          <a
            href="mailto:michael@mmcphotography.co.uk"
            className="flex items-center gap-1.5 hover:text-[#c2a378] transition-colors"
            title="Email MMC Photography"
          >
            <Mail className="w-3 h-3 text-[#c2a378]" />
            <span>michael@mmcphotography.co.uk</span>
          </a>
        </div>

        <div className="text-stone-300 italic font-serif tracking-normal text-xs sm:text-sm">
          Capturing life&apos;s most precious moments...
        </div>
      </div>
    </div>
  );
}
