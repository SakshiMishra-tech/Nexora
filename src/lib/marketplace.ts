export const CURRENT_USER_ID = "current-student";
export const MARKETPLACE_EPOCH = "2026-08-09T15:40:00.000Z";

export const MARKETPLACE_CATEGORIES = [
  "Books",
  "Electronics",
  "Cycles",
  "Hostel Essentials",
  "Furniture",
  "Fashion",
  "Gaming",
  "Sports",
  "Notes",
  "Others"
] as const;

export const MARKETPLACE_CONDITIONS = ["New", "Like new", "Good", "Fair", "Used"] as const;
export const MARKETPLACE_SORTS = ["Newest", "Oldest", "Price low to high", "Price high to low", "Most viewed", "Most saved"] as const;

export const REPORT_REASONS = [
  "Misleading or inaccurate listing",
  "Prohibited item",
  "Suspected scam or fraud",
  "Duplicate listing",
  "Offensive content",
  "Seller not responding",
  "Other",
] as const;

export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORIES)[number];
export type MarketplaceCondition = (typeof MARKETPLACE_CONDITIONS)[number];
export type MarketplaceSort = (typeof MARKETPLACE_SORTS)[number];
export type ListingStatus = "draft" | "active" | "sold" | "archived";
export type OfferStatus = "pending" | "accepted" | "declined";
export type ReportReason = (typeof REPORT_REASONS)[number];

export type MarketplaceListing = {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerCourse: string;
  sellerRating: number;
  title: string;
  description: string;
  category: MarketplaceCategory;
  condition: MarketplaceCondition;
  price: number;
  pickupArea: string;
  images: string[];
  status: ListingStatus;
  tags: string[];
  createdAt: string;
  views: number;
  saves: number;
  offerCount: number;
  isNegotiable?: boolean;
  originalPrice?: number;
  campus?: string;
  specifications?: Record<string, string> | string;
  pickup?: string;
};

export type MarketplaceOffer = {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  amount: number;
  message: string;
  status: OfferStatus;
  createdAt: string;
};

export type MarketplaceMessage = {
  id: string;
  listingId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
};

export type MarketplaceReport = {
  id: string;
  listingId: string;
  reporterId: string;
  reason: ReportReason;
  details: string;
  createdAt: string;
};

export type MarketplaceFilters = {
  query: string;
  category: MarketplaceCategory[];
  condition: MarketplaceCondition[];
  campus: string[];
  hostel: string[];
  datePosted: "any" | "today" | "last7days";
  minPrice: number;
  maxPrice: number;
  status: "available" | "sold" | "all";
  sort: MarketplaceSort;
  isNegotiable?: boolean;
};

export type ListingFormValues = {
  title: string;
  description: string;
  category: MarketplaceCategory;
  condition: MarketplaceCondition;
  price: string;
  pickupArea: string;
  tags: string;
  /** Accepts real File objects (new uploads) or string URLs (existing images) */
  images: (File | string)[];
  isNegotiable: boolean;
  originalPrice?: string;
  campus?: string;
  specifications?: string;
  pickup?: string;
};

export const emptyListingForm: ListingFormValues = {
  title: "",
  description: "",
  category: "Books",
  condition: "Good",
  price: "",
  pickupArea: "",
  tags: "",
  images: [],
  isNegotiable: false,
  originalPrice: "",
  campus: "",
  specifications: "",
  pickup: "",
};

export const initialFilters: MarketplaceFilters = {
  query: "",
  category: [],
  condition: [],
  campus: [],
  hostel: [],
  datePosted: "any",
  minPrice: 0,
  maxPrice: 60000,
  status: "available",
  sort: "Newest",
  isNegotiable: false,
};

export const seedListings: MarketplaceListing[] = [
  // Books
  {
    id: "seed-1",
    title: 'DSA Made Easy',
    description: 'Narasimha Karumanchi. Perfect for interview preparation. Barely used.',
    category: 'Books',
    condition: 'Like new',
    price: 450,
    pickupArea: 'Main Campus',
    campus: 'Main Campus',
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop'],
    status: 'active',
    sellerId: "demo-seller",
    sellerName: "Demo Seller",
    sellerAvatar: "",
    sellerCourse: "Computer Science",
    sellerRating: 4.8,
    tags: ["DSA", "Interview", "Book"],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    views: 45,
    saves: 12,
    offerCount: 2,
    isNegotiable: false
  },
  {
    id: "seed-2",
    title: 'Operating System Concepts',
    description: 'Dinosaur book (10th Edition) for OS. Has some highlights but overall good condition.',
    category: 'Books',
    condition: 'Good',
    price: 350,
    pickupArea: 'North Campus',
    campus: 'North Campus',
    images: ['https://images.unsplash.com/photo-1589998059171-989d887dda6e?q=80&w=600&auto=format&fit=crop'],
    status: 'active',
    sellerId: "demo-seller",
    sellerName: "Demo Seller",
    sellerAvatar: "",
    sellerCourse: "Computer Science",
    sellerRating: 4.5,
    tags: ["OS", "Book"],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    views: 32,
    saves: 5,
    offerCount: 0,
    isNegotiable: true
  },
  {
    id: "seed-3",
    title: 'DBMS Notes',
    description: 'Complete handwritten notes for Database Management Systems covering all normalization forms and transaction control.',
    category: 'Notes',
    condition: 'Good',
    price: 150,
    pickupArea: 'South Campus',
    campus: 'South Campus',
    images: ['https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=600&auto=format&fit=crop'],
    status: 'active',
    sellerId: "demo-seller",
    sellerName: "Demo Seller",
    sellerAvatar: "",
    sellerCourse: "Information Technology",
    sellerRating: 4.9,
    tags: ["DBMS", "Notes", "Handwritten"],
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    views: 120,
    saves: 45,
    offerCount: 0,
    isNegotiable: false
  },
  // Electronics
  {
    id: "seed-4",
    title: 'Dell Inspiron 15',
    description: 'i5 11th Gen, 16GB RAM, 512GB SSD. Used for 2 years. Battery lasts ~3 hours. Good for coding.',
    category: 'Electronics',
    condition: 'Good',
    price: 25000,
    pickupArea: 'Main Campus',
    campus: 'Main Campus',
    images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=600&auto=format&fit=crop'],
    status: 'active',
    sellerId: "demo-seller",
    sellerName: "Demo Seller",
    sellerAvatar: "",
    sellerCourse: "Computer Science",
    sellerRating: 4.2,
    tags: ["Laptop", "Dell", "i5"],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    views: 340,
    saves: 25,
    offerCount: 8,
    isNegotiable: true
  },
  {
    id: "seed-5",
    title: 'Logitech Mouse (M331)',
    description: 'Silent wireless mouse. Perfect for library use. Includes new battery.',
    category: 'Electronics',
    condition: 'Like new',
    price: 600,
    pickupArea: 'North Campus',
    campus: 'North Campus',
    images: ['https://images.unsplash.com/photo-1527814050087-379381547969?q=80&w=600&auto=format&fit=crop'],
    status: 'active',
    sellerId: "demo-seller",
    sellerName: "Demo Seller",
    sellerAvatar: "",
    sellerCourse: "Electronics",
    sellerRating: 4.7,
    tags: ["Mouse", "Logitech", "Wireless"],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    views: 89,
    saves: 14,
    offerCount: 1,
    isNegotiable: false
  },
  {
    id: "seed-6",
    title: 'Mechanical Keyboard (Red Switches)',
    description: 'Cosmic Byte CB-GK-16. TKL size. All keys working perfectly. Replaced with a new one.',
    category: 'Electronics',
    condition: 'Good',
    price: 1200,
    pickupArea: 'South Campus',
    campus: 'South Campus',
    images: ['https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=600&auto=format&fit=crop'],
    status: 'active',
    sellerId: "demo-seller",
    sellerName: "Demo Seller",
    sellerAvatar: "",
    sellerCourse: "Mechanical",
    sellerRating: 4.6,
    tags: ["Keyboard", "Mechanical", "Gaming"],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    views: 156,
    saves: 22,
    offerCount: 3,
    isNegotiable: true
  },
  // Cycles
  {
    id: "seed-7",
    title: 'Hero Sprint',
    description: '21 gears, good tires. Needs minor oiling. Used for 1 year to commute from hostel to classes.',
    category: 'Cycles',
    condition: 'Good',
    price: 3000,
    pickupArea: 'Main Campus',
    campus: 'Main Campus',
    images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=600&auto=format&fit=crop'],
    status: 'active',
    sellerId: "demo-seller",
    sellerName: "Demo Seller",
    sellerAvatar: "",
    sellerCourse: "Civil",
    sellerRating: 4.1,
    tags: ["Cycle", "Hero", "Geared"],
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    views: 210,
    saves: 30,
    offerCount: 5,
    isNegotiable: true
  },
  {
    id: "seed-8",
    title: 'Firefox Road Cycle',
    description: 'Lightweight aluminium frame. Excellent condition. Selling because I am graduating.',
    category: 'Cycles',
    condition: 'Like new',
    price: 5500,
    pickupArea: 'North Campus',
    campus: 'North Campus',
    images: ['https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=600&auto=format&fit=crop'],
    status: 'active',
    sellerId: "demo-seller",
    sellerName: "Demo Seller",
    sellerAvatar: "",
    sellerCourse: "Electrical",
    sellerRating: 4.8,
    tags: ["Cycle", "Firefox", "Road"],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    views: 180,
    saves: 28,
    offerCount: 4,
    isNegotiable: true
  },
  // Hostel Essentials
  {
    id: "seed-9",
    title: 'Study Lamp',
    description: 'Wipro Garnet 6W LED Table lamp. Adjustable brightness and flexible neck.',
    category: 'Hostel Essentials',
    condition: 'Like new',
    price: 450,
    pickupArea: 'South Campus',
    campus: 'South Campus',
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600&auto=format&fit=crop'],
    status: 'active',
    sellerId: "demo-seller",
    sellerName: "Demo Seller",
    sellerAvatar: "",
    sellerCourse: "Commerce",
    sellerRating: 5.0,
    tags: ["Lamp", "Study", "LED"],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    views: 45,
    saves: 8,
    offerCount: 0,
    isNegotiable: false
  },
  {
    id: "seed-10",
    title: 'Single Bed Mattress',
    description: 'Standard hostel bed size (72x36 inches). Clean and comfortable. Sleepwell brand.',
    category: 'Hostel Essentials',
    condition: 'Fair',
    price: 800,
    pickupArea: 'Main Campus',
    campus: 'Main Campus',
    images: ['https://images.unsplash.com/photo-1505693314120-0d443867891c?q=80&w=600&auto=format&fit=crop'],
    status: 'active',
    sellerId: "demo-seller",
    sellerName: "Demo Seller",
    sellerAvatar: "",
    sellerCourse: "Arts",
    sellerRating: 4.0,
    tags: ["Mattress", "Bed", "Sleepwell"],
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    views: 90,
    saves: 15,
    offerCount: 2,
    isNegotiable: true
  },
  {
    id: "seed-11",
    title: 'Table Fan',
    description: 'Usha table fan, 3 speeds. High air delivery. Useful for summers in hostel.',
    category: 'Hostel Essentials',
    condition: 'Good',
    price: 900,
    pickupArea: 'North Campus',
    campus: 'North Campus',
    images: ['https://images.unsplash.com/photo-1565151443833-28ea0283f514?q=80&w=600&auto=format&fit=crop'],
    status: 'active',
    sellerId: "demo-seller",
    sellerName: "Demo Seller",
    sellerAvatar: "",
    sellerCourse: "Science",
    sellerRating: 4.5,
    tags: ["Fan", "Usha", "Summer"],
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    views: 110,
    saves: 18,
    offerCount: 1,
    isNegotiable: true
  },
  // Fashion
  {
    id: "seed-12",
    title: 'H&M Black Hoodie (Size L)',
    description: 'Classic black hoodie, barely worn. Very warm for winters.',
    category: 'Fashion',
    condition: 'Like new',
    price: 700,
    pickupArea: 'Main Campus',
    campus: 'Main Campus',
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop'],
    status: 'active',
    sellerId: "demo-seller",
    sellerName: "Demo Seller",
    sellerAvatar: "",
    sellerCourse: "Design",
    sellerRating: 4.8,
    tags: ["Hoodie", "H&M", "Winter"],
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    views: 205,
    saves: 35,
    offerCount: 4,
    isNegotiable: false
  },
  {
    id: "seed-13",
    title: 'Puma Sneakers (UK 9)',
    description: 'White sneakers. Washed and clean. Good for everyday use.',
    category: 'Fashion',
    condition: 'Good',
    price: 1000,
    pickupArea: 'South Campus',
    campus: 'South Campus',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop'],
    status: 'active',
    sellerId: "demo-seller",
    sellerName: "Demo Seller",
    sellerAvatar: "",
    sellerCourse: "Architecture",
    sellerRating: 4.3,
    tags: ["Sneakers", "Puma", "Shoes"],
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    views: 167,
    saves: 20,
    offerCount: 2,
    isNegotiable: true
  },
  // Academic
  {
    id: "seed-14",
    title: 'Physics Lab Manuals',
    description: 'Complete set of readings and graphs for first-year physics lab. Verified by TA.',
    category: 'Others',
    condition: 'Fair',
    price: 150,
    pickupArea: 'Main Campus',
    campus: 'Main Campus',
    images: ['https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?q=80&w=600&auto=format&fit=crop'],
    status: 'active',
    sellerId: "demo-seller",
    sellerName: "Demo Seller",
    sellerAvatar: "",
    sellerCourse: "Physics",
    sellerRating: 4.9,
    tags: ["Lab", "Manual", "Physics"],
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    views: 78,
    saves: 10,
    offerCount: 0,
    isNegotiable: false
  }
];

export const seedOffers: MarketplaceOffer[] = [];

export const seedMessages: MarketplaceMessage[] = [];

/* ── helpers ────────────────────────────────────────── */

export function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

export function createMarketplaceId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export function formatMessageTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function listingToFormValues(listing: MarketplaceListing): ListingFormValues {
  return {
    title: listing.title,
    description: listing.description,
    category: listing.category,
    condition: listing.condition,
    price: String(listing.price),
    pickupArea: listing.pickupArea,
    tags: listing.tags.join(", "),
    images: listing.images,
    isNegotiable: listing.isNegotiable ?? false,
    originalPrice: listing.originalPrice ? String(listing.originalPrice) : "",
    campus: listing.campus ?? "",
    specifications: typeof listing.specifications === "string" 
      ? listing.specifications 
      : (listing.specifications ? JSON.stringify(listing.specifications) : ""),
    pickup: listing.pickup ?? "",
  };
}

export function formValuesToListing(
  values: ListingFormValues,
  status: ListingStatus,
  existing?: MarketplaceListing,
): MarketplaceListing {
  const parsedPrice = Number(values.price) || 0;
  const tags = values.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 5);

  // For optimistic UI: use only string URLs (Files can't be used as img src)
  const previewImages = values.images.filter((img): img is string => typeof img === "string");

  return {
    id: existing?.id ?? createMarketplaceId("item"),
    sellerId: CURRENT_USER_ID,
    sellerName: "You",
    sellerAvatar: existing?.sellerAvatar ?? "",
    sellerCourse: existing?.sellerCourse ?? "Nexora student",
    sellerRating: existing?.sellerRating ?? 4.8,
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    condition: values.condition,
    price: parsedPrice,
    pickupArea: values.pickupArea.trim(),
    images: previewImages.length ? previewImages : (existing?.images ?? []),
    status,
    tags,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    views: existing?.views ?? 0,
    saves: existing?.saves ?? 0,
    offerCount: existing?.offerCount ?? 0,
    isNegotiable: values.isNegotiable,
    originalPrice: values.originalPrice ? Number(values.originalPrice) : undefined,
    campus: values.campus?.trim() || undefined,
    specifications: values.specifications?.trim() || undefined,
    pickup: values.pickup?.trim() || undefined,
  };
}

export function validateListingForm(values: ListingFormValues) {
  const errors: Partial<Record<keyof ListingFormValues, string>> = {};

  if (values.title.trim().length < 4) errors.title = "Use a clear item name.";
  if (values.description.trim().length < 18) errors.description = "Add enough detail for buyers.";
  if (!values.pickupArea.trim()) errors.pickupArea = "Add a pickup area.";
  if (!Number(values.price) || Number(values.price) < 0) errors.price = "Add a valid price.";
  if (!values.images.length) errors.images = "Add at least one image.";

  return errors;
}

export function filterMarketplaceListings(listings: MarketplaceListing[], filters: MarketplaceFilters) {
  const query = filters.query.trim().toLowerCase();

  const filtered = listings.filter((listing) => {
    const searchable = [
      listing.title,
      listing.description,
      listing.category,
      listing.condition,
      listing.pickupArea,
      listing.sellerName,
      listing.tags.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = !query || searchable.includes(query);
    const matchesCategory = filters.category.length === 0 || filters.category.includes(listing.category);
    const matchesCondition = filters.condition.length === 0 || filters.condition.includes(listing.condition);
    const matchesCampus = filters.campus.length === 0 || filters.campus.some(c => listing.pickupArea.toLowerCase().includes(c.toLowerCase()));
    const matchesHostel = filters.hostel.length === 0 || filters.hostel.some(h => listing.pickupArea.toLowerCase().includes(h.toLowerCase()));
    const matchesPrice = listing.price >= filters.minPrice && listing.price <= filters.maxPrice;
    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "available" && listing.status === "active") ||
      (filters.status === "sold" && listing.status === "sold");

    let matchesDate = true;
    if (filters.datePosted === "today") {
      const today = new Date();
      const listingDate = new Date(listing.createdAt);
      matchesDate = today.toDateString() === listingDate.toDateString();
    } else if (filters.datePosted === "last7days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      matchesDate = new Date(listing.createdAt) >= sevenDaysAgo;
    }
    
    const matchesNegotiable = !filters.isNegotiable || listing.isNegotiable;

    return matchesQuery && matchesCategory && matchesCondition && matchesCampus && matchesHostel && matchesPrice && matchesStatus && matchesDate && matchesNegotiable;
  });

  return filtered.sort((a, b) => {
    if (filters.sort === "Price low to high") return a.price - b.price;
    if (filters.sort === "Price high to low") return b.price - a.price;
    if (filters.sort === "Most viewed") return b.views - a.views;
    if (filters.sort === "Most saved") return b.saves - a.saves;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

