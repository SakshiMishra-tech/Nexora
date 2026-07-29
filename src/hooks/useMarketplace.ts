import { useState, useCallback, useEffect } from "react";
import {
  type MarketplaceListing,
  type MarketplaceOffer,
  type MarketplaceMessage,
  type MarketplaceFilters,
  type ListingStatus,
  type ListingFormValues,
  initialFilters,
  formValuesToListing,
  listingToFormValues,
  CURRENT_USER_ID,
} from "@/lib/marketplace";
import {
  createMarketplaceItem,
  deleteMarketplaceItem,
  getMarketplaceItems,
  getSellerItems,
  getSavedItems,
  getSavedListings,
  incrementViewCount,
  saveMarketplaceItem,
  unsaveMarketplaceItem,
  updateMarketplaceItem,
  getMarketplaceItem,
} from "@/services/marketplace.service";
import { supabase } from "@/lib/supabase";

const STORAGE_KEYS = {
  RECENT: "nexora:marketplace:recent",
};

export type MarketplaceView =
  | "browse"
  | "seller"
  | "detail"
  | "saved"
  | "analytics"
  | "chats";

export type MarketplaceErrorType = "network" | "empty" | "server" | null;

export function useMarketplace(
  search?: { id?: string; view?: string },
  navigate?: (opts: any) => void
) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [sellerListings, setSellerListings] = useState<MarketplaceListing[]>([]);
  const [offers] = useState<MarketplaceOffer[]>([]);
  const [messages] = useState<MarketplaceMessage[]>([]);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<MarketplaceErrorType>(null);
  const [currentUserId, setCurrentUserId] = useState<string>(CURRENT_USER_ID);

  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.RECENT);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [filters, setFilters] = useState<MarketplaceFilters>(initialFilters);
  const [activeView, setActiveView] = useState<MarketplaceView>(() => {
    if (search?.id) return "detail";
    if (search?.view === "seller" || search?.view === "saved" || search?.view === "analytics" || search?.view === "browse" || search?.view === "chats") {
      return search.view as MarketplaceView;
    }
    return "browse";
  });
  const [selectedListingId, setSelectedListingId] = useState<string | null>(search?.id || null);
  const [detailListing, setDetailListing] = useState<MarketplaceListing | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id) setCurrentUserId(data.user.id);
    });
  }, []);

  // Sync state from search parameters
  useEffect(() => {
    if (search?.id) {
      setSelectedListingId(search.id);
      setActiveView("detail");
    } else {
      setSelectedListingId(null);
      if (search?.view === "seller" || search?.view === "saved" || search?.view === "analytics" || search?.view === "browse" || search?.view === "chats") {
        setActiveView(search.view as MarketplaceView);
      } else {
        setActiveView("browse");
      }
    }
  }, [search?.id, search?.view]);

  // Load detail listing if not in memory
  useEffect(() => {
    const id = selectedListingId;
    if (!id) {
      setDetailListing(null);
      return;
    }

    const existing = listings.find((l) => l.id === id) ?? sellerListings.find((l) => l.id === id);
    if (existing) {
      setDetailListing(existing);
      return;
    }

    let mounted = true;
    async function fetchDetail() {
      setIsDetailLoading(true);
      try {
        const item = await getMarketplaceItem(id!);
        if (mounted && item) {
          setDetailListing(item);
        }
      } catch (err) {
        console.error("[marketplace] Detail load error:", err);
      } finally {
        if (mounted) setIsDetailLoading(false);
      }
    }
    fetchDetail();
    return () => { mounted = false; };
  }, [selectedListingId, listings, sellerListings]);

  // Fetch initial base data (seller listings & saved item IDs) on mount
  useEffect(() => {
    let mounted = true;
    async function loadBase() {
      try {
        const [saved, sellerItems] = await Promise.all([
          getSavedItems(),
          getSellerItems(),
        ]);
        if (!mounted) return;
        setSavedItems(saved);
        setSellerListings(sellerItems);
      } catch (err) {
        console.error("[marketplace] Base load error:", err);
      }
    }
    loadBase();
    return () => { mounted = false; };
  }, []);

  // Fetch paginated listings when filters, activeView, or page changes
  useEffect(() => {
    let mounted = true;
    
    async function fetchListings() {
      try {
        if (page === 1) setIsLoading(true);
        setError(null);
        
        let result: { items: MarketplaceListing[], hasMore: boolean } = { items: [], hasMore: false };

        if (activeView === "saved") {
          // If viewing saved items, fetch them directly
          if (savedItems.length > 0) {
            result = await getSavedListings(savedItems, page, 12);
          } else {
            result = { items: [], hasMore: false };
          }
        } else if (activeView === "browse") {
          // Normal browse with filters
          result = await getMarketplaceItems(filters, page, 12);
        }

        if (!mounted) return;

        if (page === 1) {
          setListings(result.items);
          if (result.items.length === 0) {
            setError("empty");
          }
        } else {
          setListings(prev => [...prev, ...result.items]);
        }
        
        setHasMore(result.hasMore);
      } catch (err: any) {
        if (!mounted) return;
        setListings(page === 1 ? [] : listings);
        const errType = err?.message === "Failed to fetch" ? "network" : "server";
        setError(errType);
        console.error("[marketplace] Fetch error:", JSON.stringify({
          message: err?.message,
          code: err?.code,
          details: err?.details,
          hint: err?.hint,
          status: err?.status,
          statusText: err?.statusText,
        }, null, 2));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    // Only run if we're in a view that requires listings (not seller dashboard)
    if (activeView === "browse" || activeView === "saved") {
      fetchListings();
    }
    
    return () => { mounted = false; };
  }, [filters, activeView, page, savedItems.length]); // Re-run if savedItems count changes (for the saved tab)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  // Wrapper for changing filters to reset pagination
  const handleSetFilters = useCallback((newFilters: MarketplaceFilters | ((prev: MarketplaceFilters) => MarketplaceFilters)) => {
    setFilters(newFilters);
    setPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSetActiveView = useCallback((view: MarketplaceView) => {
    if (navigate) {
      navigate({
        search: (prev: any) => {
          const next = { ...prev, view };
          delete next.id;
          return next;
        },
      });
    } else {
      setActiveView(view);
      if (view === "browse" || view === "saved") {
        setPage(1);
      }
    }
  }, [navigate]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage(p => p + 1);
    }
  }, [isLoading, hasMore]);

  // Actions: Navigation
  const viewListing = useCallback((id: string) => {
    if (navigate) {
      navigate({
        search: (prev: any) => ({ ...prev, id, view: "detail" }),
      });
    } else {
      setSelectedListingId(id);
      setActiveView("detail");
    }

    setRecentlyViewed((prev) => {
      const newRecent = [id, ...prev.filter((i) => i !== id)].slice(0, 15);
      return newRecent;
    });

    // Handle view count logic safely
    setListings((prev) => {
      const listing = prev.find(l => l.id === id);
      if (listing && listing.sellerId === currentUserId) {
        // Seller viewing own product, do not increment
        return prev;
      }
      
      const sessionKey = `nx-viewed-${id}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, "1");
        incrementViewCount(id).catch(console.error);
        return prev.map((l) => (l.id === id ? { ...l, views: l.views + 1 } : l));
      }
      
      return prev;
    });
  }, [navigate, currentUserId]);

  const goBack = useCallback(() => {
    if (navigate) {
      navigate({
        search: (prev: any) => {
          const next = { ...prev };
          delete next.id;
          delete next.view;
          return next;
        },
      });
    } else {
      setSelectedListingId(null);
      setActiveView((prev) => (prev === "detail" ? "browse" : prev));
    }
  }, [navigate]);

  // Actions: Create / Update
  const saveListing = useCallback(
    async (values: ListingFormValues, status: ListingStatus, existingId?: string) => {
      const existing = existingId
        ? sellerListings.find((l) => l.id === existingId) ?? listings.find((l) => l.id === existingId)
        : undefined;

      const optimisticListing = formValuesToListing(values, status, existing);

      if (existingId) {
        setListings((prev) => prev.map((l) => (l.id === existingId ? optimisticListing : l)));
        setSellerListings((prev) => prev.map((l) => (l.id === existingId ? optimisticListing : l)));
      } else {
        setSellerListings((prev) => [optimisticListing, ...prev]);
      }

      try {
        const savedListing = existingId
          ? await updateMarketplaceItem(existingId, values, status)
          : await createMarketplaceItem(values, status);

        if (existingId) {
          setListings((prev) => prev.map((l) => (l.id === existingId ? savedListing : l)));
          setSellerListings((prev) => prev.map((l) => (l.id === existingId ? savedListing : l)));
        } else {
          setSellerListings((prev) => prev.map((l) => (l.id === optimisticListing.id ? savedListing : l)));
          if (savedListing.status === "active" && activeView === "browse" && page === 1) {
            setListings((prev) => [savedListing, ...prev]);
          }
        }
        return savedListing;
      } catch (err) {
        if (existingId) {
          setListings((prev) => prev.map((l) => (l.id === existingId ? (existing ?? l) : l)));
          setSellerListings((prev) => prev.map((l) => (l.id === existingId ? (existing ?? l) : l)));
        } else {
          setSellerListings((prev) => prev.filter((l) => l.id !== optimisticListing.id));
        }
        console.error("[marketplace] saveListing error:", err);
        throw err;
      }
    },
    [listings, sellerListings, activeView, page],
  );

  // Actions: Duplicate
  const duplicateListing = useCallback(
    async (id: string) => {
      const original = sellerListings.find((l) => l.id === id) ?? listings.find((l) => l.id === id);
      if (!original) return;

      const values = listingToFormValues(original);
      values.title = `${values.title} (Copy)`;

      try {
        return await saveListing(values, "draft");
      } catch (err) {
        console.error("[marketplace] duplicateListing error:", err);
        throw err;
      }
    },
    [sellerListings, listings, saveListing],
  );

  // Actions: Delete
  const deleteListing = useCallback(
    (id: string) => {
      setListings((prev) => prev.filter((l) => l.id !== id));
      setSellerListings((prev) => prev.filter((l) => l.id !== id));
      setSavedItems((prev) => prev.filter((savedId) => savedId !== id));
      setRecentlyViewed((prev) => prev.filter((recentId) => recentId !== id));

      if (selectedListingId === id) goBack();

      deleteMarketplaceItem(id).catch((err) => {
        console.error("[marketplace] deleteListing error:", err);
      });
    },
    [selectedListingId, goBack],
  );

  const markListingStatus = useCallback(
    (id: string, status: ListingStatus) => {
      const listing = sellerListings.find((item) => item.id === id) ?? listings.find((item) => item.id === id);

      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      setSellerListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));

      if (listing) {
        const values: ListingFormValues = {
          title: listing.title,
          description: listing.description,
          category: listing.category,
          condition: listing.condition,
          price: String(listing.price),
          pickupArea: listing.pickupArea,
          tags: listing.tags.join(", "),
          images: listing.images,
          isNegotiable: listing.isNegotiable || false,
        };
        updateMarketplaceItem(id, values, status).catch(console.error);
      }
    },
    [listings, sellerListings],
  );

  const toggleSaveItem = useCallback(
    (id: string) => {
      const wasSaved = savedItems.includes(id);

      setSavedItems((prev) => {
        const isSaved = prev.includes(id);
        
        const updateListing = (l: MarketplaceListing) => 
          l.id === id ? { ...l, saves: Math.max(0, l.saves + (isSaved ? -1 : 1)) } : l;

        setListings((listingsPrev) => {
          if (isSaved && activeView === "saved") {
            return listingsPrev.filter((l) => l.id !== id);
          }
          return listingsPrev.map(updateListing);
        });
        
        setSellerListings((prevSeller) => prevSeller.map(updateListing));
        
        setDetailListing((prevDetail) => 
          prevDetail?.id === id ? updateListing(prevDetail) : prevDetail
        );

        return isSaved ? prev.filter((i) => i !== id) : [...prev, id];
      });

      const action = wasSaved ? unsaveMarketplaceItem : saveMarketplaceItem;
      action(id).catch(console.error);
    },
    [savedItems, activeView],
  );

  return {
    listings,
    sellerListings,
    offers,
    messages,
    savedItems,
    recentlyViewed,
    isLoading,
    error,
    filters,
    activeView,
    selectedListingId,
    selectedListing: detailListing ?? listings.find((l) => l.id === selectedListingId) ?? sellerListings.find((l) => l.id === selectedListingId) ?? null,
    isDetailLoading,
    currentUserId,
    hasMore,
    
    setFilters: handleSetFilters,
    setActiveView: handleSetActiveView,
    loadMore,
    viewListing,
    goBack,
    saveListing,
    duplicateListing,
    deleteListing,
    markListingStatus,
    toggleSaveItem,
  };
}
