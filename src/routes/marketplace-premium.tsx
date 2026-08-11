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

export const Route = createFileRoute("/marketplace-premium")({
  head: () => ({ meta: [{ title: "Nexora Marketplace - Buy & Sell on Campus" }] }),
  component: MarketplacePremium,
});

const generateMockListings = (): MarketplaceListing[] => [];

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

  // Keep this alternate view empty unless it is wired to real marketplace data.
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
