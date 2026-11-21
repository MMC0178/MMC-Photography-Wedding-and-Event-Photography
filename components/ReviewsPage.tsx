'use client';

import { useState } from 'react';
import { Star, Heart, MapPin, Calendar, Check, Send } from 'lucide-react';
import { Review } from '@/lib/wedding-data';

interface ReviewsPageProps {
  reviews: Review[];
  onAddReview: (review: Omit<Review, 'id'>) => void;
  onCheckDate: () => void;
  onViewGallery: () => void;
}

export default function ReviewsPage({
  reviews,
  onAddReview,
  onCheckDate,
  onViewGallery,
}: ReviewsPageProps) {
  const [showAddReview, setShowAddReview] = useState(false);
  const [coupleName, setCoupleName] = useState('');
  const [venue, setVenue] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleName.trim() || !feedback.trim()) return;

    onAddReview({
      couple: coupleName.trim(),
      date: 'Married recently',
      venue: venue.trim() || 'United Kingdom',
      rating: 5,
      snippet: feedback.slice(0, 100) + '...',
      fullReview: feedback.trim(),
      highlight: 'Heartfelt thank you from our wedding day',
    });

    setSubmitted(true);
    setTimeout(() => {
      setShowAddReview(false);
      setSubmitted(false);
      setCoupleName('');
      setVenue('');
      setFeedback('');
    }, 2000);
  };

  return (
    <div className="w-full bg-white min-h-screen py-10 sm:py-16 px-4 sm:px-8 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.25em] text-[#c2a378] font-sans font-semibold">
            Couple Testimonials
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-stone-900 font-light tracking-tight">
            Kind Words & Love Stories
          </h1>
          <div className="flex items-center justify-center gap-3 py-1">
            <span className="w-10 h-px bg-stone-300"></span>
            <Heart className="w-4 h-4 text-stone-700 fill-stone-700" />
            <span className="w-10 h-px bg-stone-300"></span>
          </div>
          <p className="font-serif italic text-base sm:text-lg text-stone-600">
            Read what our wonderful couples have to say about their experience with MMC Photography.
          </p>
        </div>

        {/* Stars & Add Review button */}
        <div className="bg-[#fbf9f6] p-6 rounded-xs border border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowAddReview(!showAddReview)}
            className="text-xs uppercase tracking-widest font-sans font-medium text-stone-800 hover:text-stone-950 border border-stone-400 hover:border-stone-800 px-4 py-2 rounded-xs transition-colors"
          >
            {showAddReview ? 'Close Review Form' : 'Leave A Review'}
          </button>
        </div>

        {/* Add Review Inline Form */}
        {showAddReview && (
          <div className="bg-white border border-stone-300 p-6 rounded-xs shadow-md space-y-4 max-w-2xl mx-auto animate-in fade-in duration-200">
            <h3 className="font-serif text-xl text-stone-900">
              Share Your Wedding Experience
            </h3>
            {submitted ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded flex items-center gap-2 text-sm">
                <Check className="w-4 h-4" />
                <span>Thank you so much! Your kind review has been added to the page.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Your Names *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jessica & Daniel"
                      value={coupleName}
                      onChange={e => setCoupleName(e.target.value)}
                      className="w-full text-sm border border-stone-300 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#c2a378]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Venue / Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cripps Barn, Cotswolds"
                      value={venue}
                      onChange={e => setVenue(e.target.value)}
                      className="w-full text-sm border border-stone-300 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#c2a378]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Your Words & Experience *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us what you loved about working with MMC, your gallery, or the guest photo vault..."
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    className="w-full text-sm border border-stone-300 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#c2a378]"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#1e2321] text-white px-6 py-2.5 rounded text-xs uppercase tracking-widest font-sans font-semibold hover:bg-stone-800 transition-colors flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-[#c2a378]" />
                  <span>Submit Review</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reviews.map(review => (
            <div
              key={review.id}
              className="p-8 rounded-xs bg-[#fbf9f6] border border-stone-200/80 flex flex-col justify-between space-y-6 shadow-2xs hover:shadow-xs transition-shadow"
            >
              <div className="space-y-4">
                {/* 5 Stars */}
                <div className="flex text-amber-500 gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>

                {/* Highlight */}
                <h3 className="font-serif text-xl text-stone-900 font-medium">
                  &ldquo;{review.highlight}&rdquo;
                </h3>

                {/* Review Text */}
                <p className="font-serif text-stone-700 text-base leading-relaxed">
                  {review.fullReview}
                </p>
              </div>

              {/* Author & Venue Footer */}
              <div className="pt-4 border-t border-stone-200/60 flex items-center justify-between text-xs font-sans text-stone-600">
                <div>
                  <div className="font-semibold text-stone-900 text-sm">
                    {review.couple}
                  </div>
                  <div className="text-stone-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>{review.venue}</span>
                  </div>
                </div>

                <div className="text-stone-400 text-[11px] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{review.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="bg-[#1e2321] text-white p-8 sm:p-12 rounded-xs text-center space-y-4">
          <h2 className="font-serif text-2xl sm:text-3xl font-light">
            Ready to Create Beautiful Memories Together?
          </h2>
          <p className="font-serif text-stone-300 max-w-xl mx-auto text-base">
            Dates for the upcoming wedding season fill quickly. Check our availability for your wedding day today.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <button
              onClick={onCheckDate}
              className="bg-[#c2a378] hover:bg-[#b39265] text-white px-7 py-3 rounded-full text-xs uppercase tracking-widest font-sans font-semibold transition-colors"
            >
              Check Your Date
            </button>
            <button
              onClick={onViewGallery}
              className="border border-white/50 hover:bg-white/10 text-white px-7 py-3 rounded-full text-xs uppercase tracking-widest font-sans font-medium transition-colors"
            >
              View Gallery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
