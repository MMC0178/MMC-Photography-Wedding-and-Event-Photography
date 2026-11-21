'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BlogPost } from '@/lib/wedding-data';
import { Clock, Calendar, ChevronRight, ArrowLeft } from 'lucide-react';

interface BlogPageProps {
  blogPosts: BlogPost[];
  onCheckDate: () => void;
  onViewVault: () => void;
}

export default function BlogPage({ blogPosts, onCheckDate }: BlogPageProps) {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  return (
    <div className="w-full bg-white min-h-screen py-10 sm:py-16 px-4 sm:px-8 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.25em] text-[#c2a378] font-sans font-semibold">
            MMC Journal & Guides
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-stone-900 font-light tracking-tight">
            Wedding Inspiration & Advice
          </h1>
          <p className="font-serif italic text-base sm:text-lg text-stone-600">
            Real advice, timeline ideas, and photography secrets to make your wedding day stress-free and unforgettable.
          </p>
        </div>

        {/* Selected Post Full View */}
        {selectedPost ? (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
            <button
              onClick={() => setSelectedPost(null)}
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-stone-600 hover:text-stone-950 font-sans font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to all articles</span>
            </button>

            <div className="relative aspect-[16/9] rounded-xs overflow-hidden shadow-sm">
              <Image
                src={selectedPost.coverImage}
                alt={selectedPost.title}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
                unoptimized={selectedPost.coverImage.startsWith('data:') || selectedPost.coverImage.startsWith('blob:')}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 text-xs font-sans text-stone-500">
                <span className="text-[#c2a378] uppercase tracking-wider font-semibold">
                  {selectedPost.category}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{selectedPost.date}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{selectedPost.readTime}</span>
                </span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl text-stone-900">
                {selectedPost.title}
              </h2>
            </div>

            <div className="space-y-5 text-stone-700 font-serif text-base sm:text-lg leading-relaxed pt-4 border-t border-stone-200">
              {selectedPost.content
                .filter(paragraph => paragraph.trim().length > 0)
                .map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
            </div>

            <div className="p-6 bg-[#fbf9f6] rounded border border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
              <div>
                <h4 className="font-serif text-lg text-stone-900">Planning your wedding?</h4>
                <p className="font-serif text-xs text-stone-600">We would love to hear about your venue and vision.</p>
              </div>
              <button
                onClick={onCheckDate}
                className="bg-[#1e2321] text-white px-5 py-2 rounded text-xs uppercase tracking-widest font-sans font-medium hover:bg-stone-800 transition-colors shrink-0"
              >
                Check Availability
              </button>
            </div>
          </div>
        ) : (
          /* Blog Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogPosts.map(post => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="group cursor-pointer rounded-xs overflow-hidden border border-stone-200/80 bg-white hover:border-stone-400 transition-all duration-300 shadow-2xs hover:shadow-md flex flex-col"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    unoptimized={post.coverImage.startsWith('data:') || post.coverImage.startsWith('blob:')}
                  />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-xs">
                    {post.category}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-xs text-stone-500 font-sans">
                      <span>{post.date}</span>
                      <span>·</span>
                      <span>{post.readTime}</span>
                    </div>

                    <h3 className="font-serif text-xl text-stone-900 group-hover:text-[#c2a378] transition-colors leading-snug">
                      {post.title}
                    </h3>

                    <p className="font-serif text-stone-600 text-sm line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-800 font-sans font-semibold uppercase tracking-wider group-hover:text-[#c2a378] transition-colors">
                    <span>Read Article</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
