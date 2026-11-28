import type { Metadata } from 'next';
import {
  INITIAL_ABOUT_CONTENT,
  INITIAL_FAQS,
  INITIAL_PRICING_PACKAGES,
} from '@/lib/wedding-data';
import {
  DEFAULT_SEO_DESCRIPTION,
  DEFAULT_SEO_TITLE,
  SEO_KEYWORDS,
  SITE_NAME,
  SOCIAL_PROFILES,
  getSiteUrl,
} from '@/lib/seo';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import './globals.css';

const siteUrl = getSiteUrl();
const ogHeroImage = INITIAL_ABOUT_CONTENT.homepageHeroImage;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: DEFAULT_SEO_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_SEO_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  authors: [{ name: SITE_NAME, url: siteUrl }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'Wedding & Event Photography',
  alternates: {
    canonical: '/',
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: '/',
    siteName: SITE_NAME,
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    images: [
      {
        url: ogHeroImage,
        width: 1600,
        height: 1067,
        alt: 'MMC Photography — Relaxed, natural wedding and event photography',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    images: [ogHeroImage],
  },
  verification: {
    google: 'irwP8BULS6YWsIigHzgxqSNSQO5rint4Eoj2p7gdHUA',
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfessionalService',
      '@id': `${siteUrl}/#business`,
      name: SITE_NAME,
      url: siteUrl,
      image: ogHeroImage,
      description: DEFAULT_SEO_DESCRIPTION,
      telephone: '+447511616354',
      email: 'michael@mmcphotography.co.uk',
      priceRange: '££',
      areaServed: [
        { '@type': 'AdministrativeArea', name: 'Northern Ireland' },
        { '@type': 'Country', name: 'United Kingdom' },
        { '@type': 'Country', name: 'Ireland' },
      ],
      sameAs: SOCIAL_PROFILES,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+447511616354',
        email: 'michael@mmcphotography.co.uk',
        contactType: 'customer service',
        areaServed: ['GB', 'IE'],
        availableLanguage: ['English'],
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Wedding Photography Packages',
        itemListElement: INITIAL_PRICING_PACKAGES.map(pkg => ({
          '@type': 'Offer',
          name: pkg.name,
          description: pkg.tagline,
          priceCurrency: 'GBP',
          price: pkg.price.replace(/[^0-9.]/g, '') || undefined,
          url: `${siteUrl}/?page=pricing`,
        })),
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: SITE_NAME,
      description: DEFAULT_SEO_DESCRIPTION,
      inLanguage: 'en-GB',
      publisher: {
        '@id': `${siteUrl}/#business`,
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${siteUrl}/#faq`,
      mainEntity: INITIAL_FAQS.map(faq => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      })),
    },
  ],
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en-GB" className="scroll-smooth bg-white text-stone-800 antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen bg-white text-stone-800 selection:bg-[#c2a378]/20 selection:text-stone-900" suppressHydrationWarning>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
