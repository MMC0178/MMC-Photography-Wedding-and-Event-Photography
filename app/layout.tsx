import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MMC Photography | Wedding & Event Photography',
  description: 'Relaxed, natural wedding photography capturing life\'s most precious moments from the first moments to the last dance. Explore galleries, pricing, and guest photo vault.',
  openGraph: {
    title: 'MMC Photography | Wedding & Event Photography',
    description: 'Capturing life\'s most precious moments with relaxed, natural wedding photography.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MMC Photography | Wedding & Event Photography',
    description: 'Capturing life\'s most precious moments with relaxed, natural wedding photography.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="scroll-smooth bg-white text-stone-800 antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen bg-white text-stone-800 selection:bg-[#c2a378]/20 selection:text-stone-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
