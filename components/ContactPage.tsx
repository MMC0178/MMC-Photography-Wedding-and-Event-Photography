'use client';

import { useState } from 'react';
import { Phone, Mail, Check, Send, Sparkles, Copy, ExternalLink } from 'lucide-react';

interface ContactPageProps {
  initialPackage?: string;
}

const STUDIO_EMAIL = 'michael@mmcphotography.co.uk';

export default function ContactPage({ initialPackage }: ContactPageProps) {
  const [couple, setCouple] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState(() =>
    initialPackage ? `I am interested in the ${initialPackage} package. ` : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [deliveredByServer, setDeliveredByServer] = useState(false);
  const [mailtoUrl, setMailtoUrl] = useState('');
  const [formattedSummary, setFormattedSummary] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couple, email, phone, date, message }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Could not prepare your inquiry. Please try again.');
        return;
      }

      setDeliveredByServer(Boolean(data.delivered));
      setMailtoUrl(data.mailtoUrl || '');
      setFormattedSummary(data.formattedMessage || '');
      setSubmitted(true);

      // If server-side email delivery isn't configured, open a pre-filled email draft to michael@mmcphotography.co.uk
      if (!data.delivered && data.mailtoUrl) {
        const anchor = document.createElement('a');
        anchor.href = data.mailtoUrl;
        anchor.rel = 'noopener noreferrer';
        anchor.click();
      }
    } catch {
      setSubmitError(`Could not submit right now. Please email ${STUDIO_EMAIL} directly.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySummary = async () => {
    if (!formattedSummary) return;
    try {
      await navigator.clipboard.writeText(`To: ${STUDIO_EMAIL}\n\n${formattedSummary}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="w-full bg-white min-h-screen py-10 sm:py-16 px-4 sm:px-8 animate-in fade-in duration-300">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.25em] text-[#c2a378] font-sans font-semibold">
            Get In Touch
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-stone-900 font-light tracking-tight uppercase">
            Let&apos;s Talk About Your Day
          </h1>
          <p className="font-serif italic text-base sm:text-lg text-stone-600">
            We&apos;d love to hear from you. Get in touch to check availability, ask a question or simply say hello.
          </p>
        </div>

        {/* 2-Column: Form + Contact Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Direct Contact Info & Highlights */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#fbf9f6] p-8 rounded-xs border border-stone-200/80 space-y-6">
              <h3 className="font-serif text-2xl text-stone-900">
                Direct Contact
              </h3>

              <div className="space-y-4 text-sm font-sans text-stone-700">
                <a
                  href="tel:07511616354"
                  className="flex items-center gap-3 hover:text-[#c2a378] transition-colors p-2 rounded hover:bg-stone-100/50"
                >
                  <div className="w-9 h-9 rounded-full bg-[#1e2321] text-white flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-[#c2a378]" />
                  </div>
                  <div>
                    <div className="text-[11px] text-stone-400 uppercase tracking-wider">Call or WhatsApp</div>
                    <div className="font-semibold text-stone-900">07511616354</div>
                  </div>
                </a>

                <a
                  href={`mailto:${STUDIO_EMAIL}`}
                  className="flex items-center gap-3 hover:text-[#c2a378] transition-colors p-2 rounded hover:bg-stone-100/50"
                >
                  <div className="w-9 h-9 rounded-full bg-[#1e2321] text-white flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-[#c2a378]" />
                  </div>
                  <div>
                    <div className="text-[11px] text-stone-400 uppercase tracking-wider">Email Inquiry</div>
                    <div className="font-semibold text-stone-900">{STUDIO_EMAIL}</div>
                  </div>
                </a>
              </div>

              <div className="pt-4 border-t border-stone-200 space-y-2 text-xs font-serif text-stone-600">
                <div className="flex items-center gap-2 text-stone-900 font-sans font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-[#c2a378]" />
                  <span>Response Time Commitment</span>
                </div>
                <p>
                  We reply to all wedding inquiries within 24 hours. If you haven&apos;t heard back, please check your spam folder or give us a quick ring.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Inquiry Form */}
          <div className="lg:col-span-7 bg-white border border-stone-200/90 rounded-xs p-8 shadow-xs">
            {submitted ? (
              <div className="p-8 text-center space-y-4 bg-[#fbf9f6] rounded border border-[#e5dfd5] animate-in fade-in duration-300">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-2xl text-stone-900">
                  {deliveredByServer
                    ? `Thank You, ${couple || 'there'}!`
                    : `Your Inquiry Is Ready to Send, ${couple || 'there'}`}
                </h3>
                <p className="font-serif text-stone-600 text-base max-w-md mx-auto">
                  {deliveredByServer ? (
                    <>
                      Your availability inquiry for <span className="font-semibold text-stone-900">{date || 'your wedding day'}</span> has been sent to <span className="font-semibold text-stone-900">{STUDIO_EMAIL}</span>. We will check our diary and reply within 24 hours.
                    </>
                  ) : (
                    <>
                      Your email app should open with your pre-filled inquiry addressed to <span className="font-semibold text-stone-900">{STUDIO_EMAIL}</span>. If it didn&apos;t open automatically, click below to send or copy your details.
                    </>
                  )}
                </p>

                {!deliveredByServer && mailtoUrl && (
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <a
                      href={mailtoUrl}
                      className="inline-flex items-center gap-2 bg-[#1e2321] hover:bg-[#2c3330] text-white px-5 py-2.5 rounded text-xs uppercase tracking-widest font-sans font-semibold transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#c2a378]" />
                      <span>Open Email to {STUDIO_EMAIL}</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleCopySummary}
                      className="inline-flex items-center gap-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 px-4 py-2.5 rounded text-xs uppercase tracking-widest font-sans font-semibold transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#c2a378]" />
                      <span>{copied ? 'Copied!' : 'Copy Inquiry Details'}</span>
                    </button>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs font-sans uppercase tracking-widest text-[#c2a378] hover:text-stone-900 underline underline-offset-4"
                  >
                    Submit another inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="font-serif text-2xl text-stone-900 pb-2 border-b border-stone-100">
                  Check Your Date &amp; Availability
                </h3>

                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded font-sans">
                    {submitError}
                  </div>
                )}

                {/* Names & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                      Your Names *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Charlotte & James"
                      value={couple}
                      onChange={e => setCouple(e.target.value)}
                      className="w-full text-sm border border-stone-300 rounded px-3 py-2.5 focus:ring-1 focus:ring-[#c2a378] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full text-sm border border-stone-300 rounded px-3 py-2.5 focus:ring-1 focus:ring-[#c2a378] outline-none"
                    />
                  </div>
                </div>

                {/* Phone & Wedding Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 07511616354"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full text-sm border border-stone-300 rounded px-3 py-2.5 focus:ring-1 focus:ring-[#c2a378] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                      Wedding Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full text-sm border border-stone-300 rounded px-3 py-2.5 focus:ring-1 focus:ring-[#c2a378] outline-none text-stone-700"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Tell Us About Your Plans &amp; Vision
                  </label>
                  <textarea
                    rows={4}
                    placeholder="We would love to know about your plans, what vibe you are going for, and any questions you have..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full text-sm border border-stone-300 rounded px-3 py-2.5 focus:ring-1 focus:ring-[#c2a378] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1e2321] hover:bg-[#2c3330] disabled:bg-stone-400 text-white py-3.5 rounded text-xs uppercase tracking-widest font-sans font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Send className="w-4 h-4 text-[#c2a378]" />
                  <span>{isSubmitting ? 'Sending Availability Inquiry...' : 'Send Availability Inquiry'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
