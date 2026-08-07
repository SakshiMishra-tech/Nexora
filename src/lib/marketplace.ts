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

export const seedListings: MarketplaceListing[] = [];

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

