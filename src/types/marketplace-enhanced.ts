// Enhanced marketplace types for complete OLX-inspired system

export interface CampusLocation {
  id: string;
  country: string;
  state: string;
  city: string;
  area: string;
  campus: string;
  hostel?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface LocationSearchResult {
  id: string;
  name: string;
  fullPath: string;
  type: "country" | "state" | "city" | "area" | "campus" | "hostel";
}

export type MarketplaceCategory =
  | "all"
  | "books"
  | "electronics"
  | "furniture"
  | "cycles"
  | "hostel-essentials"
  | "gaming"
  | "lab-equipment"
  | "fashion"
  | "notes"
  | "free-items"
  | "projects"
  | "internship-resources"
  | "sports"
  | "stationery"
  | "lost-found"
  | "roommates"
  | "more";

export type ListingCondition = "new" | "like-new" | "good" | "fair" | "used";
export type ListingStatus = "draft" | "active" | "pending" | "sold" | "rejected" | "archived";
export type SortOption = "newest" | "price-low" | "price-high" | "most-viewed" | "recent" | "nearest";

export interface EnhancedMarketplaceListing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  category: MarketplaceCategory;
  condition: ListingCondition;
  status: ListingStatus;
  images: string[];
  location: CampusLocation;
  is_negotiable: boolean;
  is_verified_seller: boolean;
  views: number;
  saves: number;
  likes: number;
  created_at: string;
  updated_at: string;
  boost_expires_at?: string;
  
  // Seller info
  seller_name?: string;
  seller_avatar?: string;
  seller_verified?: boolean;
  seller_rating?: number;
  seller_total_sales?: number;
  
  // Specifications
  specifications?: Record<string, string>;
  
  // Safety
  safety_tips?: string[];
}

export interface EnhancedMarketplaceFilters {
  category?: MarketplaceCategory;
  minPrice?: number;
  maxPrice?: number;
  condition?: ListingCondition[];
  location?: CampusLocation;
  verifiedOnly?: boolean;
  negotiableOnly?: boolean;
  freeOnly?: boolean;
  campus?: string;
  hostel?: string;
  department?: string;
  year?: string;
  sortBy?: SortOption;
  query?: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  message_type: "text" | "image" | "location" | "offer";
  offer_amount?: number;
  image_url?: string;
  location?: CampusLocation;
  is_read: boolean;
  created_at: string;
}

export interface Chat {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_pinned: boolean;
  is_archived: boolean;
  listing_title: string;
  listing_image: string;
  listing_price: number;
  other_user_name: string;
  other_user_avatar: string;
  other_user_online: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  campus: string;
  hostel?: string;
  department?: string;
  year?: string;
  bio?: string;
  is_verified: boolean;
  rating: number;
  total_sales: number;
  member_since: string;
  response_time?: string;
}

export interface ListingAnalytics {
  listing_id: string;
  views_today: number;
  views_week: number;
  views_total: number;
  saves_total: number;
  likes_total: number;
  chats_total: number;
  views_by_day: Array<{ date: string; count: number }>;
  traffic_sources: Record<string, number>;
}

export interface SellFormData {
  category: MarketplaceCategory;
  images: File[];
  title: string;
  description: string;
  price: number;
  condition: ListingCondition;
  is_negotiable: boolean;
  location: CampusLocation;
  specifications: Record<string, string>;
  draft_id?: string;
}

export interface NotificationItem {
  id: string;
  type: "message" | "listing_sold" | "price_drop" | "new_listing" | "offer" | "system";
  title: string;
  message: string;
  listing_id?: string;
  listing_image?: string;
  sender_avatar?: string;
  is_read: boolean;
  created_at: string;
}
