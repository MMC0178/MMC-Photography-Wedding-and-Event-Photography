export interface GalleryPhoto {
  id: string;
  url: string;
  title: string;
  caption: string;
  category: 'bridal-prep' | 'ceremony' | 'on-location' | 'reception' | 'dancing';
}

export interface FeaturedWeddingPhoto {
  id: string;
  url: string;
  caption: string;
}

export interface FeaturedWedding {
  id: string;
  couple: string;
  date: string;
  venue: string;
  location: string;
  coverImage: string;
  story: string;
  highlightQuote: string;
  photos: FeaturedWeddingPhoto[];
}

export interface PricingPackage {
  id: string;
  name: string;
  tagline: string;
  price: string;
  hours: string;
  popular?: boolean;
  features: string[];
  includesVault: boolean;
}

export interface PricingAddon {
  id: string;
  name: string;
  price: string;
  desc: string;
}

export interface Review {
  id: string;
  couple: string;
  date: string;
  venue: string;
  avatar?: string;
  rating: number;
  snippet: string;
  fullReview: string;
  highlight: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  category: string;
  readTime: string;
  coverImage: string;
  excerpt: string;
  content: string[];
}

export interface CoreValue {
  id: string;
  title: string;
  description: string;
}

export interface AboutContent {
  homepageHeroImage: string;
  homepageTitle: string;
  homepageText: string;
  homepageImage: string;
  heroKicker: string;
  heroHeadline: string;
  heroQuote: string;
  storyImage: string;
  storyTitle: string;
  storyParagraphs: string[];
  coreValues: CoreValue[];
}

export interface FaqItem {
  id: string;
  q: string;
  a: string;
}

export interface VaultPhoto {
  id: string;
  guestName: string;
  table: string;
  note: string;
  time: string;
  url: string;
}

export interface VaultStep {
  id: string;
  title: string;
  description: string;
}

export interface GuestVaultContent {
  badgeLabel: string;
  pageTitle: string;
  pageSubtitle: string;
  coupleName: string;
  weddingDate: string;
  streamTitle: string;
  streamSubtitle: string;
  privacyBadgeText: string;
  howItWorksSteps: VaultStep[];
}

export const GALLERY_CATEGORIES = [
  {
    id: 'bridal-prep',
    name: 'BRIDAL PREP',
    slug: 'bridal-prep',
    description: 'Quiet moments of anticipation, delicate details, silk robes, and laughter with closest friends.',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'ceremony',
    name: 'CEREMONY',
    slug: 'ceremony',
    description: 'The heartfelt vows, exchanged rings, joyous tears, and walking down the aisle together.',
    coverImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'on-location',
    name: 'ON LOCATION',
    slug: 'on-location',
    description: 'Relaxed golden-hour portraits across sweeping countryside estates, secret gardens, and rolling hills.',
    coverImage: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'reception',
    name: 'RECEPTION',
    slug: 'reception',
    description: 'Artfully curated tablescapes, laughter during speeches, champagne toasts, and candlelit ambiance.',
    coverImage: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'dancing',
    name: 'DANCING',
    slug: 'dancing',
    description: 'The romantic first dance beneath historic chandeliers to high-energy late-night dance floor celebrations.',
    coverImage: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
  },
] as const;

// Initial 3 Featured Weddings (Strictly limited to 3, un-categorized photos)
export const INITIAL_FEATURED_WEDDINGS: FeaturedWedding[] = [
  {
    id: 'featured-1',
    couple: 'Sophie & James',
    date: '14 September 2024',
    venue: 'Euridge Manor',
    location: 'Cotswolds, Wiltshire',
    coverImage: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1400&q=80',
    story: 'A sun-drenched late summer wedding surrounded by the historic stone arches and turquoise waters of Euridge Manor. Sophie wore a bespoke lace gown, and the couple celebrated with heartfelt vows under a cascading rose pergola followed by a starlit banquet.',
    highlightQuote: 'MMC captured the genuine warmth and laughter of our day without ever making us feel posed or rushed.',
    photos: [
      {
        id: 'sj-p1',
        url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Golden hour embrace overlooking the manor gardens',
      },
      {
        id: 'sj-p2',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
        caption: 'Sophie’s final veil adjustments before heading to the aisle',
      },
      {
        id: 'sj-p3',
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
        caption: 'Emotional exchange of vows beneath the floral pergola',
      },
      {
        id: 'sj-p4',
        url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
        caption: 'Candlelit dining tables adorned with white peonies and olive sprigs',
      },
      {
        id: 'sj-p5',
        url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
        caption: 'First dance under festoon lights in the glasshouse',
      },
    ],
  },
  {
    id: 'featured-2',
    couple: 'Charlotte & Oliver',
    date: '28 July 2024',
    venue: 'Hedsor House',
    location: 'Taplow, Buckinghamshire',
    coverImage: 'https://images.unsplash.com/photo-1519225424985-3b9e4a87c1be?auto=format&fit=crop&w=1400&q=80',
    story: 'An editorial Georgian country house celebration filled with timeless elegance. From champagne on the south lawn to emotional parent speeches under the domed Italianate hall, Charlotte & Oliver’s day was effortless and romantic.',
    highlightQuote: 'Every single photo looks like it belongs in a luxury wedding magazine, yet every emotion is 100% real.',
    photos: [
      {
        id: 'co-p1',
        url: 'https://images.unsplash.com/photo-1519225424985-3b9e4a87c1be?auto=format&fit=crop&w=1200&q=80',
        caption: 'Charlotte & Oliver sharing a quiet moment on the grand avenue',
      },
      {
        id: 'co-p2',
        url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
        caption: 'Intimate toast in the grand dining room',
      },
      {
        id: 'co-p3',
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
        caption: 'Confetti toss as newlyweds walk down the lawn',
      },
    ],
  },
  {
    id: 'featured-3',
    couple: 'Eleanor & Marcus',
    date: '10 June 2024',
    venue: 'Blenheim Country Estate',
    location: 'Woodstock, Oxfordshire',
    coverImage: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1400&q=80',
    story: 'Romantic and joyful summer celebration set against rolling parkland and ancient oak trees. Eleanor and Marcus wanted relaxed documentary coverage focusing on their guests having the best party of their lives.',
    highlightQuote: 'Our guests could not stop praising the Guest Photo Vault feature—we woke up to over 400 hilarious and candid guest snaps!',
    photos: [
      {
        id: 'em-p1',
        url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80',
        caption: 'Heirloom rings placed delicately on vintage silk stationery',
      },
      {
        id: 'em-p2',
        url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
        caption: 'Dancing under festoons until midnight with sparklers',
      },
      {
        id: 'em-p3',
        url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
        caption: 'Private couple walk by the lake at sunset',
      },
    ],
  },
];

// Initial Standalone Categorized Gallery Photos
export const INITIAL_GALLERY_PHOTOS: GalleryPhoto[] = [
  // Bridal Prep
  {
    id: 'gp-1',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    title: 'Morning Light & Veil',
    caption: 'Quiet moments of anticipation and delicate veil adjustments before the ceremony.',
    category: 'bridal-prep',
  },
  {
    id: 'gp-2',
    url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80',
    title: 'Heirloom Details & Stationery',
    caption: 'Gold bands on silk ribbons and handcrafted letterpress wedding invitation suite.',
    category: 'bridal-prep',
  },
  {
    id: 'gp-3',
    url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
    title: 'Bridesmaids Laughter',
    caption: 'Popping champagne and laughter during hair and makeup preparations.',
    category: 'bridal-prep',
  },

  // Ceremony
  {
    id: 'gp-4',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    title: 'The Floral Pergola Vows',
    caption: 'Exchanging heartfelt personal vows overlooking the rolling Cotswolds hills.',
    category: 'ceremony',
  },
  {
    id: 'gp-5',
    url: 'https://images.unsplash.com/photo-1519225424985-3b9e4a87c1be?auto=format&fit=crop&w=1200&q=80',
    title: 'Aisle Walking & Petal Toss',
    caption: 'Just married joy walking down the aisle shower in natural dried flower petals.',
    category: 'ceremony',
  },

  // On Location
  {
    id: 'gp-6',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
    title: 'Golden Hour Embrace',
    caption: 'Romantic couple portrait in the meadow gardens bathed in warm sunset glow.',
    category: 'on-location',
  },
  {
    id: 'gp-7',
    url: 'https://images.unsplash.com/photo-1519225424985-3b9e4a87c1be?auto=format&fit=crop&w=1200&q=80',
    title: 'Estate Avenue Stroll',
    caption: 'Walking hand in hand through the historic Georgian country estate grounds.',
    category: 'on-location',
  },

  // Reception
  {
    id: 'gp-8',
    url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
    title: 'Candlelit Orangery Tablescape',
    caption: 'Bespoke floral centerpieces with tall tapered candles and crystal glassware.',
    category: 'reception',
  },
  {
    id: 'gp-9',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    title: 'Emotional Father-of-the-Bride Speech',
    caption: 'Heartfelt tears and shared laughter during the dinner toasts.',
    category: 'reception',
  },

  // Dancing
  {
    id: 'gp-10',
    url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
    title: 'First Dance Under Festoons',
    caption: 'The couple’s first dance in the grand hall surrounded by cheering family and friends.',
    category: 'dancing',
  },
  {
    id: 'gp-11',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
    title: 'Late Night Sparkler Exit',
    caption: 'Golden sparkler farewell arch glowing through the midnight mist.',
    category: 'dancing',
  },
];

// Initial Pricing Packages (Editable by photographer)
export const INITIAL_PRICING_PACKAGES: PricingPackage[] = [
  {
    id: 'package-essential',
    name: 'Half Day / Micro-Wedding',
    tagline: 'Ideal for intimate ceremonies, registry celebrations, and shorter gatherings',
    price: '£950',
    hours: 'Up to 5 Hours Coverage',
    features: [
      'Pre-wedding consultation & planning call',
      'Ceremony, drinks reception & couple portraits',
      '250+ fully edited high-resolution images',
      'Private online gallery with full print rights',
      'Guest Photo Vault included for 3 months',
      'Sneak peek preview within 48 hours',
    ],
    includesVault: true,
  },
  {
    id: 'package-signature',
    name: 'The Signature Full Day',
    tagline: 'Our most loved package: complete storytelling from morning preparation to late-night party',
    price: '£1,750',
    hours: 'Up to 10 Hours Coverage',
    popular: true,
    features: [
      'Comprehensive coverage from bridal prep to first dance + 30 mins party',
      'Pre-wedding consultation and venue scout',
      '500+ curated and artfully edited photographs',
      'Private cloud gallery for download and print ordering',
      'Complete Guest Photo Vault with custom table QR cards',
      'Full personal printing rights and lifetime backup',
      'Sneak peek gallery within 48 hours of your wedding',
      'Complimentary travel within 100 miles of London/Oxford',
    ],
    includesVault: true,
  },
  {
    id: 'package-luxury',
    name: 'The Heirloom Collection',
    tagline: 'Full day coverage with second shooter, engagement session, and bespoke fine art album',
    price: '£2,650',
    hours: 'Full Day & Unlimited Coverage',
    features: [
      'Primary photographer + experienced second shooter all day',
      'Engagement portrait session included',
      '700+ meticulously edited fine-art photographs',
      'Bespoke 30-page leather or linen fine-art wedding album',
      'Two duplicate miniature parent gift albums',
      'Guest Photo Vault with custom printed acrylic table signs',
      'Express gallery delivery within 3 weeks',
      'All UK travel and accommodation included',
    ],
    includesVault: true,
  },
];

export const INITIAL_PRICING_ADDONS: PricingAddon[] = [
  {
    id: 'addon-album',
    name: 'Fine Art Linen Wedding Album (30 pages)',
    price: '£450',
    desc: 'Handcrafted in Yorkshire with lay-flat archival cotton paper and customized debossing',
  },
  {
    id: 'addon-engagement',
    name: 'Pre-Wedding / Engagement Portrait Shoot',
    price: '£350',
    desc: '90-minute relaxed shoot at a location of your choice with 50+ high-res images',
  },
  {
    id: 'addon-shooter',
    name: 'Experienced Second Photographer',
    price: '£400',
    desc: 'Extra angle coverage during prep, ceremony, and drinks reception for 8 hours',
  },
  {
    id: 'addon-express',
    name: 'Express 7-Day Gallery Delivery',
    price: '£250',
    desc: 'Jump the editing queue to receive your complete gallery in one week',
  },
];

export const REVIEWS: Review[] = [
  {
    id: 'rev-1',
    couple: 'Sophie & James',
    date: 'Married September 2024',
    venue: 'Euridge Manor, Cotswolds',
    rating: 5,
    snippet: 'Looking through our gallery brought tears to our eyes. MMC captured every emotional glance and burst of laughter.',
    fullReview: 'We cannot thank MMC Photography enough for capturing our wedding day so effortlessly. We are both quite camera-shy, but their calm, warm demeanor put us at ease within minutes. Looking through our gallery brought tears to our eyes—they managed to capture not just the big moments, but the subtle, quiet glances and genuine laughter between our friends and family. The Guest Photo Vault was also a complete game changer; our guests uploaded over 300 photos we would otherwise have never seen!',
    highlight: 'Put us completely at ease & delivered a magazine-worthy gallery',
  },
  {
    id: 'rev-2',
    couple: 'Charlotte & Oliver',
    date: 'Married July 2024',
    venue: 'Hedsor House, Buckinghamshire',
    rating: 5,
    snippet: 'Flawless communication, artistic eye, and the photos are utterly breathtaking.',
    fullReview: 'From our initial consultation right through to receiving our gallery preview just 48 hours after our wedding, the experience with MMC was nothing short of perfection. The light, natural tones and documentary style was exactly what we envisioned. If you want a photographer who feels like an old friend and produces world-class work, book them immediately!',
    highlight: 'Flawless communication and world-class wedding photos',
  },
  {
    id: 'rev-3',
    couple: 'Eleanor & Marcus',
    date: 'Married June 2024',
    venue: 'Blenheim Country Estate',
    rating: 5,
    snippet: 'The Guest Photo Vault QR codes on each table were an absolute hit with everyone!',
    fullReview: 'MMC Photography is exceptionally talented. What stood out most was how unobtrusive they were—our guests constantly commented on how relaxed and friendly they were throughout the whole day. Plus, having the Guest Photo Vault integrated with QR codes on our tables meant we got to see all our friends partying late into the night from their perspective. Priceless memories!',
    highlight: 'Unobtrusive style & the guest vault was brilliant',
  },
  {
    id: 'rev-4',
    couple: 'Chloe & Liam',
    date: 'Married April 2024',
    venue: 'Cornwell Manor, Oxfordshire',
    rating: 5,
    snippet: 'Worth every single penny. Our wedding album is our most prized possession.',
    fullReview: 'The attention to detail and natural storytelling is second to none. MMC captured the golden hour light in the walled garden so magically. The delivery was fast, the gallery is easy to share with relatives abroad, and the quality is outstanding.',
    highlight: 'Magical golden hour light and timeless portraits',
  },
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    slug: 'timeline-tips-for-relaxed-wedding-photos',
    title: 'How to Build a Stress-Free Wedding Day Timeline for Natural Photos',
    date: 'October 12, 2024',
    category: 'Wedding Planning Tips',
    readTime: '5 min read',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
    excerpt: 'Simple pacing adjustments that ensure you spend more time with your guests while still getting breathtaking portraits.',
    content: [
      'One of the most common worries couples share with us is feeling rushed on their wedding day. Nobody wants their wedding to feel like an endless checklist of photoshoot positions.',
      'The secret lies in generous buffers: allow 20 minutes extra for bridal prep, schedule couple portraits in two short 15-minute windows (one during drinks reception, one during golden hour), and let the rest unfold organically.',
      'When you are relaxed and present with your favourite people, the photographs naturally capture that authentic radiance.',
    ],
  },
  {
    id: 'post-2',
    slug: 'why-every-couple-loves-guest-photo-vault',
    title: 'Why Couples Are Ditching Hashtags for the Private Guest Photo Vault',
    date: 'August 30, 2024',
    category: 'Guest Vault',
    readTime: '4 min read',
    coverImage: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1000&q=80',
    excerpt: 'How our private QR-enabled Guest Photo Vault gathers every candid memory from your tables with zero apps required.',
    content: [
      'Remember when couples asked guests to use an Instagram hashtag, only to find three photos because algorithms hid the rest? Those days are over.',
      'Our dedicated Guest Photo Vault gives couples an instant, elegant table QR code. Guests simply tap their camera, snap photos, and upload them straight into your private cloud gallery—no app download required.',
      'Couples love waking up the next morning and reliving the dance floor, table selfies, and heartfelt guest messages before the professional gallery is even processed.',
    ],
  },
  {
    id: 'post-3',
    slug: 'rainy-day-wedding-photography-guide',
    title: 'What Happens If It Rains? The Magic of Moody British Skies',
    date: 'July 15, 2024',
    category: 'Style & Advice',
    readTime: '6 min read',
    coverImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80',
    excerpt: 'Why soft overcast lighting creates the most flattering portraits and how we embrace wet-weather romanticism.',
    content: [
      'In the UK, weather is part of the story! An overcast sky is actually a photographer’s dream: soft, diffused light with zero harsh shadows and saturated greens in the landscape.',
      'We always carry stylish clear umbrellas, scout stunning indoor architectural spaces (grand staircases, bay windows, orangeries), and capture the romantic, cozy atmosphere that rain creates.',
    ],
  },
];

export const INITIAL_ABOUT_CONTENT: AboutContent = {
  homepageHeroImage: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1600&q=85',
  homepageTitle: 'About MMC Photography',
  homepageText:
    "We're passionate about capturing real moments, genuine emotions and the little details that make your wedding day unique. With a relaxed approach and an eye for natural beauty, we'll tell your story exactly as it unfolds.",
  homepageImage: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&w=1000&q=80',
  heroKicker: 'The Story Behind the Lens',
  heroHeadline: 'Capturing the Real, Unscripted Magic of Your Wedding Day',
  heroQuote: "We don't just take pictures of what your wedding looked like—we capture what it felt like.",
  storyImage: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&w=1200&q=80',
  storyTitle: 'Meet MMC Photography',
  storyParagraphs: [
    'Hello! We are passionate visual storytellers based in the heart of England. Over the past decade, we have had the great honor of documenting hundreds of couples celebrating their love in historic country estates, intimate barn venues, and sun-drenched gardens.',
    "Our philosophy is rooted in observation rather than orchestration. The most cherished images in your heirloom album won't be the stiff posed family lineups—they will be the tear rolling down your father's cheek during the ceremony, your partner whispering an inside joke during the first dance, and your friends erupting in laughter over champagne.",
  ],
  coreValues: [
    {
      id: 'val-1',
      title: 'Documentary First',
      description: 'We blend seamlessly into your wedding day so you and your guests can stay in the moment without feeling self-conscious.',
    },
    {
      id: 'val-2',
      title: 'Fast 48-Hour Preview',
      description: "You won't wait months for your first glimpse. We deliver a hand-finished sneak peek within 48 hours while the excitement is fresh.",
    },
    {
      id: 'val-3',
      title: 'Guest Photo Vault',
      description: 'Every package comes with our private QR Guest Photo Vault, collecting all the unscripted guest snaps into one secure hub.',
    },
  ],
};

export const INITIAL_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    q: 'What is your photography style and approach on the day?',
    a: 'We specialize in relaxed, documentary wedding photography with gentle editorial direction during portrait sessions. We believe the best photographs happen when you are completely immersed in your day, laughing with your family, rather than staging stiff poses. 90% of the day is documented candidly as it naturally unfolds.',
  },
  {
    id: 'faq-2',
    q: 'How many photos do we receive and when will they be ready?',
    a: 'For a full day wedding, you can expect between 500 to 700+ fully edited, high-resolution photographs with no watermarks and full printing rights. We deliver an online sneak peek gallery within 48 hours, followed by the complete finished collection within 4 to 6 weeks.',
  },
  {
    id: 'faq-3',
    q: 'How does the Guest Photo Vault work?',
    a: 'The Guest Photo Vault is our signature complimentary service. We provide personalized QR code table cards for your wedding breakfast. Your guests simply scan the QR code with their smartphone camera—no app download needed—and upload their candid phone photos and videos straight into your private cloud vault.',
  },
  {
    id: 'faq-4',
    q: 'Are you insured and what backup equipment do you bring?',
    a: 'Yes, absolutely. We hold full Public Liability and Professional Indemnity insurance (often required by UK wedding venues). We shoot on dual memory cards simultaneously in professional full-frame cameras, and always bring backup camera bodies, lenses, and flash units.',
  },
  {
    id: 'faq-5',
    q: 'Do you travel throughout the UK and destination weddings?',
    a: 'Yes! While we are based between the Cotswolds and London, we regularly photograph weddings across Oxfordshire, Buckinghamshire, Somerset, Surrey, and throughout the UK and Europe. Travel within 100 miles is included in our Signature and Heirloom packages.',
  },
];

export const INITIAL_VAULT_CONTENT: GuestVaultContent = {
  badgeLabel: 'MMC Signature Feature',
  pageTitle: 'Guest Photo Vault',
  pageSubtitle: "Collect every guest's photos and memories in one private place—no apps needed.",
  coupleName: 'Sophie & James',
  weddingDate: '14 September 2024',
  streamTitle: 'Guest Snaps & Memories',
  streamSubtitle: 'Real-time photo feed straight from guest smartphones',
  privacyBadgeText: 'Private PIN Protected',
  howItWorksSteps: [
    {
      id: 'step-1',
      title: 'We Generate Your Private Vault',
      description:
        'Before your wedding, MMC configures a private, password-protected digital vault and provides stylish QR codes matched to your stationery.',
    },
    {
      id: 'step-2',
      title: 'Guests Scan & Upload Instantly',
      description:
        'Guests tap their smartphone camera on the table card. They can drop unlimited photos, videos, and heartfelt messages with zero app installations.',
    },
    {
      id: 'step-3',
      title: 'Relive Everything the Next Morning',
      description:
        'While having breakfast as newlyweds, you can scroll through hundreds of candid moments, download full-resolution archives in one click, and share with family.',
    },
  ],
};

export const INITIAL_VAULT_PHOTOS: VaultPhoto[] = [
  {
    id: 'v-1',
    guestName: 'Bridesmaid Chloe',
    table: 'Head Table',
    note: 'The most stunning bride in the world! Look at this glow ♡',
    time: '3:15 PM',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'v-2',
    guestName: 'Liam & Sarah',
    table: 'Table 4 (University Friends)',
    note: 'Best speeches ever! Cried through James’ entire speech.',
    time: '6:42 PM',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'v-3',
    guestName: 'Uncle David',
    table: 'Table 8',
    note: 'Tearing up the dance floor! What a band!',
    time: '9:30 PM',
    url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'v-4',
    guestName: 'Marcus & Ella',
    table: 'Table 2',
    note: 'Sunset in the courtyard with espresso martinis 🍸',
    time: '8:10 PM',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
  },
];


