export const PRODUCTION_SITE_URL = 'https://www.mmcphotography.co.uk';

export const SITE_NAME = 'MMC Photography';
export const DEFAULT_SEO_TITLE = 'MMC Photography | Wedding & Event Photography';
export const DEFAULT_SEO_DESCRIPTION =
  "Capturing life's most precious moments with relaxed, natural wedding photography. Browse our wedding galleries, investment pricing, and private guest photo vault.";

export const SOCIAL_PROFILES = [
  'https://www.facebook.com/MMCPhotographyNI/',
  'https://www.instagram.com/mmcphotoni/',
];

export const SEO_KEYWORDS = [
  'MMC Photography',
  'wedding photographer Northern Ireland',
  'Northern Ireland wedding photography',
  'NI wedding photographer',
  'Belfast wedding photographer',
  'UK wedding photographer',
  'documentary wedding photography',
  'natural wedding photography',
  'relaxed wedding photographer',
  'candid wedding photography',
  'event photography Northern Ireland',
  'wedding photography packages',
  'guest photo vault',
];

export function getSiteUrl(): string {
  const envUrl = process.env.APP_URL?.trim();
  if (envUrl && envUrl !== 'MY_APP_URL' && /^https?:\/\//i.test(envUrl)) {
    return envUrl.replace(/\/+$/, '');
  }
  return PRODUCTION_SITE_URL;
}

export interface PageSeoMeta {
  title: string;
  description: string;
}

export const PAGE_SEO_MAP: Record<string, PageSeoMeta> = {
  home: {
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
  },
  featured: {
    title: 'Featured Real Weddings | MMC Photography',
    description:
      'Explore featured real wedding stories photographed by MMC Photography. Natural, relaxed documentary coverage from bridal prep to the evening dance floor.',
  },
  gallery: {
    title: 'Wedding Photography Gallery | MMC Photography',
    description:
      'Browse our curated wedding gallery covering bridal prep, emotional ceremonies, golden-hour portraits, reception details, and evening dancing.',
  },
  pricing: {
    title: 'Wedding Photography Packages & Pricing | MMC Photography',
    description:
      'Transparent wedding photography packages with full-day documentary coverage, high-resolution galleries, 48-hour previews, and our complimentary Guest Photo Vault.',
  },
  about: {
    title: 'About MMC Photography | Documentary Wedding Photographer',
    description:
      'Meet MMC Photography — relaxed, natural wedding storytelling capturing genuine emotions and unscripted moments across Northern Ireland and the UK.',
  },
  reviews: {
    title: 'Couple Reviews & Kind Words | MMC Photography',
    description:
      'Read five-star reviews and kind words from real wedding couples who trusted MMC Photography to capture their special day.',
  },
  blog: {
    title: 'Wedding Planning Tips & Photography Blog | MMC Photography',
    description:
      'Practical wedding timeline advice, photography inspiration, and tips for natural, stress-free wedding portraits from MMC Photography.',
  },
  vault: {
    title: 'Guest Photo Vault — QR Wedding Photo Sharing | MMC Photography',
    description:
      'Collect every candid guest photo and video in one private QR-enabled wedding vault with zero app downloads required. Included with MMC Photography packages.',
  },
  contact: {
    title: 'Contact & Check Wedding Availability | MMC Photography',
    description:
      'Get in touch with MMC Photography to check your wedding date availability, request a brochure, or message us directly via email or WhatsApp.',
  },
};
