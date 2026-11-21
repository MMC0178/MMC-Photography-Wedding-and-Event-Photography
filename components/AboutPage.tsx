'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, Camera, Clock, ShieldCheck, ChevronDown } from 'lucide-react';
import { AboutContent, FaqItem } from '@/lib/wedding-data';

interface AboutPageProps {
  aboutContent: AboutContent;
  faqs: FaqItem[];
  onCheckDate: () => void;
  onViewGallery: () => void;
}

const VALUE_ICONS = [Camera, Clock, ShieldCheck];

export default function AboutPage({
  aboutContent,
  faqs,
  onCheckDate,
  onViewGallery,
}: AboutPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="w-full bg-white min-h-screen py-10 sm:py-16 px-4 sm:px-8 animate-in fade-in duration-300">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Editorial Hero Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs uppercase tracking-[0.25em] text-[#c2a378] font-sans font-semibold">
            {aboutContent.heroKicker}
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-stone-900 font-light tracking-tight leading-tight">
            {aboutContent.heroHeadline}
          </h1>
          <div className="flex items-center justify-center gap-3 py-1">
            <span className="w-10 h-px bg-stone-300"></span>
            <Heart className="w-4 h-4 text-stone-700 fill-stone-700" />
            <span className="w-10 h-px bg-stone-300"></span>
          </div>
          <p className="font-serif italic text-lg text-stone-700">
            &ldquo;{aboutContent.heroQuote}&rdquo;
          </p>
        </div>

        {/* 2-Column Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="md:col-span-6 relative aspect-[4/5] rounded-xs overflow-hidden shadow-sm">
            <Image
              src={aboutContent.storyImage}
              alt="MMC Photographer capturing wedding moments"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
              unoptimized={aboutContent.storyImage.startsWith('data:') || aboutContent.storyImage.startsWith('blob:')}
            />
          </div>

          <div className="md:col-span-6 space-y-5 text-stone-700">
            <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal">
              {aboutContent.storyTitle}
            </h2>

            {aboutContent.storyParagraphs
              .filter(paragraph => paragraph.trim().length > 0)
              .map((paragraph, idx) => (
                <p key={idx} className="font-serif text-base leading-relaxed">
                  {paragraph}
                </p>
              ))}

            <div className="pt-2 flex flex-wrap gap-4">
              <button
                onClick={onViewGallery}
                className="bg-[#1e2321] text-white px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-sans font-semibold hover:bg-stone-800 transition-colors"
              >
                View Our Galleries
              </button>
              <button
                onClick={onCheckDate}
                className="border border-stone-800 text-stone-800 px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-sans font-medium hover:bg-stone-50 transition-colors"
              >
                Check Your Date
              </button>
            </div>
          </div>
        </div>

        {/* 3 Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-stone-200">
          {aboutContent.coreValues.map((val, idx) => {
            const IconComponent = VALUE_ICONS[idx % VALUE_ICONS.length];
            return (
              <div key={val.id} className="p-6 bg-[#fbf9f6] rounded-xs border border-stone-200/80 space-y-3">
                <IconComponent className="w-6 h-6 text-[#c2a378]" />
                <h3 className="font-serif text-xl text-stone-900">{val.title}</h3>
                <p className="font-serif text-sm text-stone-600 leading-relaxed">
                  {val.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Frequently Asked Questions */}
        <div id="faq-section" className="space-y-6 pt-6 border-t border-stone-200 scroll-mt-28">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#c2a378] font-sans font-semibold">
              Everything You Need to Know
            </span>
            <h2 className="font-serif text-3xl text-stone-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <div
                key={faq.id}
                className="border border-stone-200 rounded-xs overflow-hidden bg-white"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between text-stone-900 hover:bg-stone-50 transition-colors"
                >
                  <span className="font-serif text-base sm:text-lg font-medium pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="p-4 sm:p-5 pt-0 text-stone-600 font-serif text-sm leading-relaxed border-t border-stone-100 bg-[#fbf9f6]/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
