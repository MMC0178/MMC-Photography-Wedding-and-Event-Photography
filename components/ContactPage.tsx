'use client';

import { useState } from 'react';
import { Phone, Mail, Check, Send, Sparkles, Clock, Facebook, Instagram } from 'lucide-react';

interface ContactPageProps {
  initialPackage?: string;
}

const STUDIO_EMAIL = 'michael@mmcphotography.co.uk';
const FORMSUBMIT_DIRECT_URL = `https://formsubmit.co/ajax/${STUDIO_EMAIL}`;

export default function ContactPage({ initialPackage }: ContactPageProps) {
  const [couple, setCouple] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState(() =>
    initialPackage ? `I am interested in the ${initialPackage} package. ` : ''
  );
  const [website, setWebsite] = useState(''); // invisible anti-spam honeypot
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [needsActivation, setNeedsActivation] = useState(false);
  const [submittedCouple, setSubmittedCouple] = useState('');
  const [submittedDate, setSubmittedDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setNeedsActivation(false);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couple, email, phone, date, message, website }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Could not send your inquiry right now. Please try again.');
        return;
      }

      if (data.delivered) {
        setSubmittedCouple(couple);
        setSubmittedDate(date);
        setSubmitted(true);
        return;
      }

      if (data.needsActivation) {
        setSubmittedCouple(couple);
        setSubmittedDate(date);
        setNeedsActivation(true);
        setSubmitted(true);
        return;
      }

      // Direct background HTTPS submission fallback (never opens the user's email client)
      if (data.useClientRelay && data.relayPayload) {
        const relayRes = await fetch(FORMSUBMIT_DIRECT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(data.relayPayload),
        });

        const relayData = (await relayRes.json().catch(() => ({}))) as {
          success?: boolean | string;
          message?: string;
        };

        const relaySuccess = relayData.success === true || relayData.success === 'true';
        const relayMessage = String(relayData.message || '');

        if (relayRes.ok && relaySuccess) {
          setSubmittedCouple(couple);
          setSubmittedDate(date);
          setSubmitted(true);
          return;
        }

        if (relayMessage.toLowerCase().includes('activation')) {
          setSubmittedCouple(couple);
          setSubmittedDate(date);
          setNeedsActivation(true);
          setSubmitted(true);
          return;
        }
      }

      setSubmitError(
        `We could not deliver your inquiry right now. Please try again in a moment or call 07511616354.`
      );
    } catch {
      setSubmitError(
        `We could not send your inquiry right now. Please check your connection and try again, or call 07511616354.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmitted(false);
    setNeedsActivation(false);
    setSubmitError('');
    setCouple('');
    setEmail('');
    setPhone('');
    setDate('');
    setMessage('');
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
                  href="https://wa.me/447511616354"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-[#c2a378] transition-colors p-2 rounded hover:bg-stone-100/50"
                  title="Message MMC Photography on WhatsApp"
                >
                  <div className="w-9 h-9 rounded-full bg-[#1e2321] text-white flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-[#c2a378]" />
                  </div>
                  <div>
                    <div className="text-[11px] text-stone-400 uppercase tracking-wider">WhatsApp Us</div>
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

              <div className="pt-4 border-t border-stone-200 space-y-3">
                <div className="text-[11px] text-stone-400 uppercase tracking-wider font-sans font-semibold">
                  Follow Us
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm font-sans text-stone-700">
                  <a
                    href="https://www.facebook.com/MMCPhotographyNI/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 hover:text-[#c2a378] transition-colors py-1.5 px-2.5 rounded hover:bg-stone-100/70"
                    aria-label="MMC Photography on Facebook"
                    title="Follow MMC Photography on Facebook"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1e2321] text-white flex items-center justify-center shrink-0">
                      <Facebook className="w-4 h-4 text-[#c2a378]" />
                    </div>
                    <span className="font-medium text-stone-900">Facebook</span>
                  </a>

                  <a
                    href="https://www.instagram.com/mmcphotoni/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 hover:text-[#c2a378] transition-colors py-1.5 px-2.5 rounded hover:bg-stone-100/70"
                    aria-label="MMC Photography on Instagram"
                    title="Follow MMC Photography on Instagram"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1e2321] text-white flex items-center justify-center shrink-0">
                      <Instagram className="w-4 h-4 text-[#c2a378]" />
                    </div>
                    <span className="font-medium text-stone-900">Instagram</span>
                  </a>
                </div>
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
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                    needsActivation
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {needsActivation ? <Clock className="w-7 h-7" /> : <Check className="w-7 h-7" />}
                </div>
                <h3 className="font-serif text-2xl text-stone-900">
                  {needsActivation
                    ? 'One-Time Inbox Activation Required'
                    : `Thank You, ${submittedCouple || 'there'}!`}
                </h3>
                <p className="font-serif text-stone-600 text-base max-w-md mx-auto">
                  {needsActivation ? (
                    <>
                      A one-time activation email has been sent to{' '}
                      <span className="font-semibold text-stone-900">{STUDIO_EMAIL}</span>. Once
                      that link is confirmed in the inbox, every website inquiry will deliver
                      straight to {STUDIO_EMAIL} automatically.
                    </>
                  ) : (
                    <>
                      Your availability inquiry for{' '}
                      <span className="font-semibold text-stone-900">
                        {submittedDate || 'your wedding day'}
                      </span>{' '}
                      has been sent directly to{' '}
                      <span className="font-semibold text-stone-900">{STUDIO_EMAIL}</span>. We will
                      check our diary and reply within 24 hours.
                    </>
                  )}
                </p>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleResetForm}
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

                {/* Invisible anti-spam honeypot field */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="contact-website">Website</label>
                  <input
                    id="contact-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                  />
                </div>

                {/* Names & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                      Your Names *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={150}
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
                      maxLength={254}
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
                      maxLength={40}
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
                    maxLength={5000}
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
