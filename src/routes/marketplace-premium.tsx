import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { ModuleAccessBoundary } from "@/components/ModuleAccessControl";
import { MarketplaceTopBar } from "@/components/marketplace/MarketplaceTopBar";
import { QuickFilterChips, type QuickFilterOption } from "@/components/marketplace/QuickFilterChips";
import { PremiumFilterDrawer } from "@/components/marketplace/PremiumFilterDrawer";
import { PremiumProductCard } from "@/components/marketplace/PremiumProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import type { MarketplaceListing, MarketplaceFilters } from "@/types/marketplace";

// Sample images
import productBike from "@/assets/product-bike.jpg";
import productBooks from "@/assets/product-books.jpg";
import productLaptop from "@/assets/product-laptop.jpg";
import productLamp from "@/assets/product-lamp.jpg";
import student1 from "@/assets/student-1.jpg";
import student2 from "@/assets/student-2.jpg";
import student3 from "@/assets/student-3.jpg";

export const Route = createFileRoute("/marketplace-premium")({
  head: () => ({ meta: [{ title: "Nexora Marketplace - Buy & Sell on Campus" }] }),
  component: MarketplacePremium,
});

// Mock data generator
const generateMockListings = (): MarketplaceListing[] => [
  {
    id: "1",
    user_id: "user1",
    title: "Blue Campus Bicycle - Single Speed, Excellent Condition",
    description: "Well-maintained bicycle perfect for campus commute. Includes lock and basket.",
    price: 4800,
    category: "cycles",
    condition: "good",
    status: "active",
    images: [productBike],
    location: "Hostel Block C",
    is_negotiable: true,
    views: 145,
    saves: 23,
    created_at: new Date(Date.now() - 660000).toISOString(),
    updated_at: new Date(Date.now() - 660000).toISOString(),
    seller_name: "Jordan Kumar",
    seller_avatar: student2,
    seller_college: "IIT Delhi",
  },
  {
    id: "2",
    user_id: "user2",
    title: "ThinkPad T14 Gen 3 - i7, 16GB RAM, Perfect for Coding",
    description: "Barely used ThinkPad in mint condition. Comes with charger and original box.",
    price: 44000,
    category: "electronics",
    condition: "like-new",
    status: "active",
    images: [productLaptop],
    location: "Engineering Block",
    is_negotiable: false,
    views: 328,
    saves: 67,
    created_at: new Date(Date.now() - 1680000).toISOString(),
    updated_at: new Date(Date.now() - 1680000).toISOString(),
    seller_name: "Maya Sharma",
    seller_avatar: student1,
    seller_college: "IIT Delhi",
  },
  {
    id: "3",
    user_id: "user3",
    title: "First Year Engineering Books Bundle with Notes",
    description: "Complete set of books with handwritten notes and solved papers. Minimal highlighting.",
    price: 1200,
    category: "books",
    condition: "good",
    status: "active",
    images: [productBooks],
    location: "Library Area",
    is_negotiable: true,
    views: 89,
    saves: 34,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    seller_name: "Priya Reddy",
    seller_avatar: student3,
    seller_college: "IIT Delhi",
  },
  {
    id: "4",
    user_id: "user1",
    title: "Warm LED Desk Lamp - Adjustable, USB Powered",
    description: "Perfect for late night studies. Multiple brightness levels, USB powered.",
    price: 650,
    category: "furniture",
    condition: "good",
    status: "active",
    images: [productLamp],
    location: "Hostel 5",
    is_negotiable: true,
    views: 56,
    saves: 12,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    seller_name: "Rohan Mehta",
    seller_avatar: student2,
    seller_college: "IIT Delhi",
  },
  {
    id: "5",
    user_id: "user2",
    title: "Scientific Calculator Casio fx-991EX (Latest Model)",
    description: "Latest model, barely used. Comes with original packaging and manual.",
    price: 1800,
    category: "electronics",
    condition: "like-new",
    status: "active",
    images: [productLaptop],
    location: "Academic Block",
    is_negotiable: false,
    views: 234,
    saves: 45,
    created_at: new Date(Date.now() - 10800000).toISOString(),
    updated_at: new Date(Date.now() - 10800000).toISOString(),
    seller_name: "Maya Sharma",
    seller_avatar: student1,
    seller_college: "IIT Delhi",
  },
  {
    id: "6",
    user_id: "user3",
    title: "Free - Old Course Notes and Printouts Collection",
    description: "Taking up too much space. First come first serve! Perfect condition.",
    price: 0,
    category: "free",
    condition: "fair",
    status: "active",
    images: [productBooks],
    location: "Hostel 3",
    is_negotiable: false,
    views: 412,
    saves: 89,
    created_at: new Date(Date.now() - 14400000).toISOString(),
    updated_at: new Date(Date.now() - 14400000).toISOString(),
    seller_name: "Priya Reddy",
    seller_avatar: student3,
    seller_college: "IIT Delhi",
  },
];

function MarketplacePremium() {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilterOption>("all");
  const [filters, setFilters] = useState<MarketplaceFilters>({});
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const [likedListings, setLikedListings] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Load mock data
  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setListings(generateMockListings());
      setLoading(false);
    };

    loadListings();
  }, []);

  // Apply quick filter to filters
  useEffect(() => {
    const newFilters: MarketplaceFilters = { ...filters };

    switch (quickFilter) {
      case "all":
        delete newFilters.category;
        delete newFilters.freeOnly;
        delete newFilters.sortBy;
        break;
      case "latest":
        newFilters.sortBy = "newest";
        break;
      case "electronics":
        newFilters.category = "electronics";
        break;
      case "books":
        newFilters.category = "books";
        break;
      case "cycles":
        newFilters.category = "cycles";
        break;
      case "furniture":
        newFilters.category = "furniture";
        break;
      case "hostel":
        // TODO: Add hostel essentials category or filter
        break;
      case "free":
        newFilters.freeOnly = true;
        break;
      case "negotiable":
        // TODO: Add negotiable filter
        break;
      case "verified":
        newFilters.verifiedOnly = true;
        break;
      case "under1k":
        newFilters.maxPrice = 1000;
        break;
      case "new-today":
        // TODO: Filter by today's listings
        break;
    }

    setFilters(newFilters);
  }, [quickFilter]);

  // Filter and search listings
  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (listing) =>
          listing.title.toLowerCase().includes(query) ||
          listing.description.toLowerCase().includes(query) ||
          listing.category.toLowerCase().includes(query) ||
          listing.seller_name?.toLowerCase().includes(query)
      );
    }

    // Category
    if (filters.category) {
      result = result.filter((listing) => listing.category === filters.category);
    }

    // Price range
    if (filters.minPrice !== undefined) {
      result = result.filter((listing) => listing.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter((listing) => listing.price <= filters.maxPrice!);
    }

    // Free only
    if (filters.freeOnly) {
      result = result.filter((listing) => listing.price === 0);
    }

    // Condition
    if (filters.condition && filters.condition.length > 0) {
      result = result.filter((listing) => filters.condition!.includes(listing.condition));
    }

    // Location
    if (filters.location) {
      const locationQuery = filters.location.toLowerCase();
      result = result.filter((listing) =>
        listing.location.toLowerCase().includes(locationQuery)
      );
    }

    // Sort
    switch (filters.sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        result.sort((a, b) => b.views + b.saves * 2 - (a.views + a.saves * 2));
        break;
      default: // newest
        result.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    return result;
  }, [listings, searchQuery, filters]);

  const visibleListings = filteredListings.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = visibleListings.length < filteredListings.length;
  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.trim().length > 0;

  const handleSave = (listingId: string) => {
    setSavedListings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(listingId)) {
        newSet.delete(listingId);
      } else {
        newSet.add(listingId);
      }
      return newSet;
    });
  };

  const handleLike = (listingId: string) => {
    setLikedListings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(listingId)) {
        newSet.delete(listingId);
      } else {
        newSet.add(listingId);
      }
      return newSet;
    });
  };

  const handleListingClick = (listingId: string) => {
    console.log("Opening listing:", listingId);
    // TODO: Open listing detail modal/page
  };

  return (
    <ModuleAccessBoundary moduleId="marketplace">
      <div className="min-h-screen bg-background">
        {/* Top Bar */}
        <MarketplaceTopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterClick={() => setFilterDrawerOpen(true)}
          filtersActive={hasActiveFilters}
        />

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-6">
          {/* Quick Filter Chips */}
          <div className="mb-6">
            <QuickFilterChips selected={quickFilter} onSelect={setQuickFilter} />
          </div>

          {/* Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold text-muted-foreground">
              {loading ? (
                "Loading..."
              ) : (
                <>
                  {filteredListings.length}{" "}
                  {filteredListings.length === 1 ? "listing" : "listings"} found
                </>
              )}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredListings.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-muted">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-2xl font-black mb-2">No listings found</h3>
              <p className="text-sm font-semibold text-muted-foreground mb-6">
                Try adjusting your search or filters
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setFilters({});
                  setQuickFilter("all");
                }}
                variant="outline"
                className="gap-2 font-black"
              >
                Clear all filters
              </Button>
            </div>
          )}

          {/* Listings Grid */}
          {!loading && filteredListings.length > 0 && (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleListings.map((listing) => (
                  <PremiumProductCard
                    key={listing.id}
                    listing={listing}
                    onSave={handleSave}
                    onLike={handleLike}
                    onClick={handleListingClick}
                    isSaved={savedListings.has(listing.id)}
                    isLiked={likedListings.has(listing.id)}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="mt-8 text-center">
                  <Button
                    onClick={() => setPage((p) => p + 1)}
                    variant="outline"
                    size="lg"
                    className="gap-2 font-black shadow-soft"
                  >
                    <Loader2 className="h-4 w-4" />
                    Load More Listings
                  </Button>
                </div>
              )}
            </>
          )}
        </main>

        {/* Filter Drawer */}
        <PremiumFilterDrawer
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
    </ModuleAccessBoundary>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
}
