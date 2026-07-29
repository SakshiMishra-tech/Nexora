import productBike from "@/assets/product-bike.jpg";
import productBooks from "@/assets/product-books.jpg";
import productLaptop from "@/assets/product-laptop.jpg";
import productLamp from "@/assets/product-lamp.jpg";
import student1 from "@/assets/student-1.jpg";
import student2 from "@/assets/student-2.jpg";
import student3 from "@/assets/student-3.jpg";
import { seedListingsGenerated } from "./marketplace-seed";

export const CURRENT_USER_ID = "current-student";

export const MARKETPLACE_CATEGORIES = [
  "Books",
  "Electronics",
  "Hostel Essentials",
  "Furniture",
  "Fashion",
  "Sports",
  "Cycles",
  "Gaming",
  "Lab Equipment",
  "Notes",
  "Stationery",
  "Free Items",
  "Others",
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
  {
    id: "item-cycle-blue",
    sellerId: "seller-jordan",
    sellerName: "Jordan",
    sellerAvatar: student2,
    sellerCourse: "3rd year CSE",
    sellerRating: 4.8,
    title: "Blue campus bicycle",
    description: "Single-speed cycle with a new lock, bell, and recently changed brake pads. Best for hostel to lab runs. Chain oiled last week, no rust.",
    category: "Cycles",
    condition: "Used",
    price: 4800,
    pickupArea: "Sports block gate",
    images: [productBike],
    status: "active",
    tags: ["lock included", "daily commute", "hostel pickup"],
    createdAt: "2026-07-14T08:20:00.000Z",
    views: 184,
    saves: 21,
    offerCount: 5,
  },
  {
    id: "item-thinkpad-coding",
    sellerId: "seller-maya",
    sellerName: "Maya",
    sellerAvatar: student1,
    sellerCourse: "Final year IT",
    sellerRating: 4.9,
    title: "ThinkPad for coding labs",
    description: "Reliable ThinkPad with 16 GB RAM, SSD, charger, and clean keyboard. Handles VS Code and lab work smoothly. Battery lasts 4–5 hours.",
    category: "Electronics",
    condition: "Good",
    price: 44000,
    pickupArea: "CSE department lobby",
    images: [productLaptop],
    status: "active",
    tags: ["16 GB RAM", "SSD", "charger included"],
    createdAt: "2026-07-14T07:48:00.000Z",
    views: 312,
    saves: 44,
    offerCount: 8,
  },
  {
    id: "item-books-first-year",
    sellerId: "seller-priya",
    sellerName: "Priya",
    sellerAvatar: student3,
    sellerCourse: "2nd year ECE",
    sellerRating: 4.7,
    title: "First-year book stack",
    description: "Core first-year books with useful notes, highlighted formulas, and assignment references marked inside. Covers physics, maths, and chemistry.",
    category: "Books",
    condition: "Good",
    price: 1200,
    pickupArea: "Library front desk",
    images: [productBooks],
    status: "active",
    tags: ["annotated", "semester one", "bundle"],
    createdAt: "2026-07-14T06:45:00.000Z",
    views: 96,
    saves: 19,
    offerCount: 3,
  },
  {
    id: "item-desk-lamp",
    sellerId: "seller-rohan",
    sellerName: "Rohan",
    sellerAvatar: student2,
    sellerCourse: "2nd year Mech",
    sellerRating: 4.6,
    title: "Warm desk lamp",
    description: "Compact study lamp with warm light, adjustable neck, and stable base. Good for late-night study tables. LED, very low power consumption.",
    category: "Hostel Essentials",
    condition: "Good",
    price: 650,
    pickupArea: "Hostel 5 common room",
    images: [productLamp],
    status: "active",
    tags: ["study table", "warm light", "compact"],
    createdAt: "2026-07-13T16:10:00.000Z",
    views: 74,
    saves: 11,
    offerCount: 2,
  },
  {
    id: "item-my-lab-kit",
    sellerId: CURRENT_USER_ID,
    sellerName: "You",
    sellerAvatar: student1,
    sellerCourse: "Nexora student",
    sellerRating: 4.8,
    title: "Electronics lab kit",
    description: "Breadboard, jumper wires, multimeter, sensors and small components from the first-year lab kit. Everything works and tested recently.",
    category: "Lab Equipment",
    condition: "Like new",
    price: 2200,
    pickupArea: "Main workshop",
    images: [productBooks],
    status: "active",
    tags: ["lab ready", "sensor kit", "multimeter"],
    createdAt: "2026-07-12T10:00:00.000Z",
    views: 128,
    saves: 17,
    offerCount: 4,
  },
  {
    id: "item-my-gaming-pad",
    sellerId: CURRENT_USER_ID,
    sellerName: "You",
    sellerAvatar: student1,
    sellerCourse: "Nexora student",
    sellerRating: 4.8,
    title: "Wireless gaming controller",
    description: "Low-latency controller in clean condition with USB receiver. Works with PC games and emulators. No stick drift.",
    category: "Gaming",
    condition: "Good",
    price: 1800,
    pickupArea: "Hostel 2 lobby",
    images: [productLaptop],
    status: "draft",
    tags: ["wireless", "usb receiver", "pc gaming"],
    createdAt: "2026-07-11T14:30:00.000Z",
    views: 0,
    saves: 0,
    offerCount: 0,
  },
  {
    id: "item-badminton-set",
    sellerId: "seller-arjun",
    sellerName: "Arjun",
    sellerAvatar: student2,
    sellerCourse: "3rd year EEE",
    sellerRating: 4.5,
    title: "Badminton racket set with shuttles",
    description: "Two Yonex rackets with carrying case and a tube of 6 feather shuttlecocks. Grip tape replaced last month. Great for evening matches.",
    category: "Sports",
    condition: "Good",
    price: 1400,
    pickupArea: "Sports complex entrance",
    images: [productBike],
    status: "active",
    tags: ["yonex", "pair", "shuttlecocks included"],
    createdAt: "2026-07-13T11:30:00.000Z",
    views: 62,
    saves: 9,
    offerCount: 1,
  },
  {
    id: "item-study-table",
    sellerId: "seller-nisha",
    sellerName: "Nisha",
    sellerAvatar: student3,
    sellerCourse: "Final year Civil",
    sellerRating: 4.7,
    title: "Foldable study table with drawer",
    description: "Lightweight foldable table that fits hostel rooms. Has a small drawer for stationery. No wobble, wood finish.",
    category: "Furniture",
    condition: "Like new",
    price: 1800,
    pickupArea: "Girls hostel gate",
    images: [productLamp],
    status: "active",
    tags: ["foldable", "wood finish", "hostel-friendly"],
    createdAt: "2026-07-12T14:20:00.000Z",
    views: 91,
    saves: 15,
    offerCount: 3,
  },
  {
    id: "item-sold-calculator",
    sellerId: "seller-maya",
    sellerName: "Maya",
    sellerAvatar: student1,
    sellerCourse: "Final year IT",
    sellerRating: 4.9,
    title: "Casio scientific calculator",
    description: "fx-991EX ClassWiz. Perfect condition, barely used. Comes with the original cover.",
    category: "Electronics",
    condition: "Like new",
    price: 900,
    pickupArea: "CSE department lobby",
    images: [productLaptop],
    status: "sold",
    tags: ["casio", "classwiz", "exam ready"],
    createdAt: "2026-07-10T09:00:00.000Z",
    views: 210,
    saves: 33,
    offerCount: 7,
  },
  {
    id: "item-hoodie-college",
    sellerId: "seller-jordan",
    sellerName: "Jordan",
    sellerAvatar: student2,
    sellerCourse: "3rd year CSE",
    sellerRating: 4.8,
    title: "College fest hoodie — size L",
    description: "Official fest merch hoodie from TechFest 2025. Size L, black with white print. Washed twice, no damage. Limited edition design.",
    category: "Fashion",
    condition: "Like new",
    price: 700,
    pickupArea: "Canteen area",
    images: [productBooks],
    status: "active",
    tags: ["fest merch", "limited edition", "black"],
    createdAt: "2026-07-11T18:00:00.000Z",
    views: 53,
    saves: 8,
    offerCount: 1,
  },
  ...seedListingsGenerated,
];

export const seedOffers: MarketplaceOffer[] = [
  {
    id: "offer-lab-kit-1",
    listingId: "item-my-lab-kit",
    buyerId: "buyer-arjun",
    buyerName: "Arjun",
    buyerAvatar: student2,
    amount: 2000,
    message: "Can pick it up today after workshop.",
    status: "pending",
    createdAt: "2026-07-14T09:10:00.000Z",
  },
  {
    id: "offer-lab-kit-2",
    listingId: "item-my-lab-kit",
    buyerId: "buyer-nisha",
    buyerName: "Nisha",
    buyerAvatar: student3,
    amount: 2100,
    message: "Need it for Monday lab. Is the multimeter working?",
    status: "pending",
    createdAt: "2026-07-14T08:32:00.000Z",
  },
  {
    id: "offer-lab-kit-3",
    listingId: "item-my-lab-kit",
    buyerId: "buyer-karan",
    buyerName: "Karan",
    buyerAvatar: student2,
    amount: 1900,
    message: "I'll take it if still available. Can come tomorrow.",
    status: "declined",
    createdAt: "2026-07-13T15:45:00.000Z",
  },
];

export const seedMessages: MarketplaceMessage[] = [
  {
    id: "message-lab-kit-1",
    listingId: "item-my-lab-kit",
    senderId: "buyer-arjun",
    senderName: "Arjun",
    body: "Hey, is the lab kit still available?",
    createdAt: "2026-07-14T09:11:00.000Z",
  },
  {
    id: "message-lab-kit-2",
    listingId: "item-my-lab-kit",
    senderId: CURRENT_USER_ID,
    senderName: "You",
    body: "Yes, it is available. You can check it near the workshop.",
    createdAt: "2026-07-14T09:14:00.000Z",
  },
  {
    id: "message-lab-kit-3",
    listingId: "item-my-lab-kit",
    senderId: "buyer-arjun",
    senderName: "Arjun",
    body: "Great! I'll come by around 4 PM. Does the multimeter have fresh batteries?",
    createdAt: "2026-07-14T09:16:00.000Z",
  },
  {
    id: "message-lab-kit-4",
    listingId: "item-my-lab-kit",
    senderId: CURRENT_USER_ID,
    senderName: "You",
    body: "Yes, replaced them last week. Everything's tested and working.",
    createdAt: "2026-07-14T09:18:00.000Z",
  },
];

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
    sellerAvatar: existing?.sellerAvatar ?? student1,
    sellerCourse: existing?.sellerCourse ?? "Nexora student",
    sellerRating: existing?.sellerRating ?? 4.8,
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    condition: values.condition,
    price: parsedPrice,
    pickupArea: values.pickupArea.trim(),
    images: previewImages.length ? previewImages : (existing?.images ?? [productLamp]),
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
