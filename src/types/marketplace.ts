// Marketplace types for production-ready implementation

export type ListingCondition = "new" | "like-new" | "good" | "fair" | "used";
export type ListingCategory = "books" | "electronics" | "cycles" | "furniture" | "clothing" | "accessories" | "free" | "other";
export type ListingStatus = "draft" | "active" | "sold" | "archived";
export type SortOption = "newest" | "price-low" | "price-high" | "nearest" | "popular";

export interface MarketplaceListing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  status: ListingStatus;
  images: string[];
  location: string;
  is_negotiable: boolean;
  views: number;
  saves: number;
  created_at: string;
  updated_at: string;
  
  // Seller info (joined from profiles)
  seller_name?: string;
  seller_avatar?: string;
  seller_college?: string;
}

export interface MarketplaceOffer {
  id: string;
  listing_id: string;
  buyer_id: string;
  amount: number;
  message: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  
  // Buyer info
  buyer_name?: string;
  buyer_avatar?: string;
}

export interface MarketplaceFilters {
  category?: ListingCategory;
  minPrice?: number;
  maxPrice?: number;
  condition?: ListingCondition[];
  location?: string;
  freeOnly?: boolean;
  verifiedOnly?: boolean;
  sortBy?: SortOption;
  query?: string;
}

export interface SavedListing {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface ListingView {
  id: string;
  listing_id: string;
  user_id?: string;
  viewed_at: string;
}
