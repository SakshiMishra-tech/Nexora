import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Search,
  SlidersHorizontal,
  Sparkles,
  MapPin,
  ChevronDown,
  Heart,
  UserRound,
  Bookmark,
  Laptop,
  BookOpen,
  Bike,
  BedDouble,
  Armchair,
  Gamepad2,
  Microscope,
  NotebookPen,
  Shirt,
  Trophy,
  PencilRuler,
  Gift,
  Package,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import { ModuleAccessBoundary } from "@/components/ModuleAccessControl";
import { SiteNav } from "@/components/SiteNav";
import { FilterDrawer } from "@/components/marketplace/FilterDrawer";
import { ProductCard, ProductCardSkeleton } from "@/components/marketplace/ProductCard";
import { ListingDetail } from "@/components/marketplace/ListingDetail";
import { SellerDashboard } from "@/components/marketplace/SellerDashboard";
import { SellItemForm } from "@/components/marketplace/SellItemForm";
import { MarketplaceChat } from "@/components/marketplace/MarketplaceChat";
import { CategoryNavigation } from "@/components/marketplace/CategoryNavigation";
import { useMarketplace } from "@/hooks/useMarketplace";
import { initialFilters, listingToFormValues, type MarketplaceListing } from "@/lib/marketplace";
import type { MarketplaceFilters } from "@/lib/marketplace";
import { getCategories, createChat } from "@/services/marketplace.service";

type MarketplaceSearch = {
  id?: string;
  view?: string;
};

export const Route = createFileRoute("/marketplace")({
  validateSearch: (search: Record<string, unknown>): MarketplaceSearch => {
    return {
      id: search.id as string | undefined,
      view: search.view as string | undefined,
    };
  },
  head: () => ({ meta: [{ title: "Nexora — Campus Marketplace" }] }),
  component: MarketplaceRoute,
});

/* ── Category icon map ─────────────────────────────────── */
const ICON_MAP: Record<string, LucideIcon> = {
  All: Sparkles,
  Electronics: Laptop,
  Books: BookOpen,
  Cycles: Bike,
  "Hostel Essentials": BedDouble,
  Furniture: Armchair,
  Gaming: Gamepad2,
  "Lab Equipment": Microscope,
  Notes: NotebookPen,
  Fashion: Shirt,
  Sports: Trophy,
  Stationery: PencilRuler,
  "Free Items": Gift,
  Others: Package,
};

const FALLBACK_CATEGORIES = [
  "Electronics", "Books", "Cycles", "Hostel Essentials", "Furniture",
  "Gaming", "Lab Equipment", "Notes", "Fashion", "Sports", "Stationery",
  "Free Items", "Others",
];

function MarketplaceRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    listings,
    sellerListings,
    savedItems,
    recentlyViewed,
    filters,
    setFilters,
    activeView,
    setActiveView,
    toggleSaveItem,
    viewListing,
    goBack,
    selectedListing,
    isDetailLoading,
    saveListing,
    duplicateListing,
    deleteListing,
    markListingStatus,
    isLoading: marketplaceLoading,
    error: marketplaceError,
    loadMore,
    hasMore,
    currentUserId,
  } = useMarketplace(search, navigate);

  const [bootLoading, setBootLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  // DB categories state
  const [dbCategories, setDbCategories] = useState<string[] | undefined>(undefined);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBootLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  // Load categories from Supabase
  useEffect(() => {
    let mounted = true;
    setCategoriesLoading(true);
    getCategories()
      .then((cats) => {
        if (mounted) setDbCategories(cats);
      })
      .catch(() => {
        if (mounted) setDbCategories([]);
      })
      .finally(() => {
        if (mounted) setCategoriesLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const loading = bootLoading || marketplaceLoading || isDetailLoading;

  const handleSearchChange = useCallback(
    (q: string) => {
      setSearchQuery(q);
      setFilters((f) => ({ ...f, query: q }));
    },
    [setFilters],
  );

  const handleCategorySelect = useCallback(
    (id: string) => {
      setFilters((f) => {
        if (id === "All") {
          return { ...f, category: [] };
        }
        const isActive = f.category.includes(id as any);
        return {
          ...f,
          category: isActive
            ? f.category.filter(c => c !== id)
            : [...f.category, id as any]
        };
      });
    },
    [setFilters],
  );

  const handleCategoryNavigationSelect = useCallback(
    (dbCats: string[], query?: string) => {
      setFilters((f) => ({
        ...f,
        category: dbCats as any[],
        query: query ?? ""
      }));
      setSearchQuery(query ?? "");
    },
    [setFilters],
  );

  const handleFilterChange = useCallback(
    (f: MarketplaceFilters) => {
      setFilters(f);
    },
    [setFilters],
  );

  const hasActiveFilters =
    filters.category.length > 0 ||
    filters.condition.length > 0 ||
    filters.campus.length > 0 ||
    filters.hostel.length > 0 ||
    filters.datePosted !== "any" ||
    filters.status !== "available" ||
    filters.minPrice > 0 ||
    filters.maxPrice < 60000 ||
    !!filters.isNegotiable;

  const visibleListings = listings;

  // ─── Counts ──────────────────────────────────────────────
  const savedCount = savedItems.length;

  const unreadTotalCount = useMemo(() => {
    if (typeof window === "undefined") return 0;
    try {
      const localChats = localStorage.getItem("nexora_marketplace_chats");
      if (localChats) {
        const chats = JSON.parse(localChats);
        let unread = 0;
        for (const chat of chats) {
          const unreadMsgs = chat.messages ? chat.messages.filter((m: any) => m.sender === "seller" && !m.seen) : [];
          unread += unreadMsgs.length;
        }
        return unread;
      }
    } catch (e) {
      console.error(e);
    }
    return 0;
  }, [listings]);
  const myListingsCount = sellerListings.filter(
    (l) => l.status === "active",
  ).length;

  // Build initialValues for editing
  const editInitialValues = useMemo(() => {
    if (!editingId) return undefined;
    const l =
      sellerListings.find((x) => x.id === editingId) ??
      listings.find((x) => x.id === editingId);
    if (!l) return undefined;
    return listingToFormValues(l);
  }, [editingId, sellerListings, listings]);

  const handleDeleteListing = useCallback(
    async (id: string) => {
      try {
        await deleteListing(id);
      } catch (err) {
        console.error("Error deleting listing:", err);
      }
    },
    [deleteListing],
  );

  const publishDraft = useCallback(
    async (id: string) => {
      const listing = sellerListings.find((l) => l.id === id);
      if (!listing) return;

      const formValues = listingToFormValues(listing);
      const isTitleValid = formValues.title.trim().length >= 4;
      const isDescValid = formValues.description.trim().length >= 18;
      const isPriceValid = formValues.price !== "" && Number(formValues.price) >= 0;
      const isPickupValid = formValues.pickupArea.trim().length > 0;

      if (!isTitleValid || !isDescValid || !isPriceValid || !isPickupValid) {
        setEditingId(id);
        setSellOpen(true);
        alert("Please complete all required fields to publish this draft.");
        return;
      }

      try {
        await saveListing(formValues, "active", id);
      } catch (err) {
        console.error("Error publishing draft:", err);
      }
    },
    [sellerListings, saveListing],
  );

  // Build category list from DB or fallback
  const categoryList = useMemo(() => {
    const names = dbCategories && dbCategories.length > 0 ? dbCategories : FALLBACK_CATEGORIES;
    return ["All", ...names];
  }, [dbCategories]);

  const recentlyViewedListings = useMemo(() => {
    return recentlyViewed
      .map(id => listings.find(l => l.id === id) || sellerListings.find(l => l.id === id))
      .filter((l): l is MarketplaceListing => !!l && l.id !== selectedListing?.id)
      .slice(0, 4);
  }, [recentlyViewed, listings, sellerListings, selectedListing?.id]);

  const trendingListings = useMemo(() => {
    return [...listings]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 4);
  }, [listings]);

  const recommendedListings = useMemo(() => {
    return [...listings]
      .sort((a, b) => (b.saves || 0) - (a.saves || 0))
      .filter((l) => !trendingListings.map((t) => t.id).includes(l.id))
      .slice(0, 4);
  }, [listings, trendingListings]);

  return (
    <ModuleAccessBoundary moduleId="marketplace">
      <main className="min-h-screen bg-background text-foreground">

        {/* ── Standard SiteNav (matches Lost & Found) ── */}
        <SiteNav />

        {activeView === "detail" && selectedListing ? (
          <ListingDetail
            listing={selectedListing}
            isSaved={savedItems.includes(selectedListing.id)}
            onSave={toggleSaveItem}
            onBack={goBack}
            onChat={async (id) => {
              if (selectedListing?.sellerId) {
                try {
                  const newChat = await createChat(id, selectedListing.sellerId);
                  if (newChat?.id) {
                    setActiveChatId(newChat.id);
                  }
                  setActiveView("chats");
                } catch(e) {
                  console.error("Error creating chat:", e);
                  setActiveView("chats");
                }
              }
            }}
            onReport={(id) => console.log("Report:", id)}
            relatedListings={listings.filter(l => l.category === selectedListing.category && l.id !== selectedListing.id).slice(0, 4)}
            onViewRelated={viewListing}
            savedItems={savedItems}
            recentlyViewedListings={recentlyViewedListings}
          />
        ) : (
        <section className="mx-auto max-w-7xl px-4 py-6">

          {/* ── Hero Banner (matches Lost & Found commons-wall style) ── */}
          {activeView === "browse" && (
            <div className="commons-wall mb-5 border border-border p-5 shadow-soft">
              <span className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
                <ShoppingBag className="h-4 w-4" />
                Campus Marketplace
              </span>
              <h1 className="mt-3 font-display text-4xl font-black sm:text-6xl">
                Buy. Sell. Reuse.
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold text-muted-foreground sm:text-base">
                Everything students need inside their campus. Buy safely from verified students, sell unused items, and save money.
              </p>
            </div>
          )}

          {/* ── Search & Quick Actions ── */}
          {(activeView === "browse" || activeView === "saved") && (
            <div className="sticky top-[57px] z-30 mb-6 border border-border/80 bg-paper/95 p-3 shadow-soft backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search bar */}
                <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-border bg-background px-4 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.72)] transition focus-within:border-primary/55 focus-within:shadow-soft">
                  <Search className="h-4 w-4 shrink-0 text-primary" />
                  <input
                    value={searchQuery}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground"
                    placeholder="Search laptops, books, cycles, hostel essentials..."
                  />
                </div>

                <div className="grid gap-2 sm:flex sm:shrink-0">
                  <label className="relative flex min-h-12 items-center rounded-2xl border border-border bg-background px-3 text-sm font-black text-foreground shadow-soft">
                    <MapPin className="mr-2 h-4 w-4 shrink-0 text-primary" />
                    <select
                      value={filters.campus[0] ?? "All campuses"}
                      onChange={(event) => {
                        const value = event.target.value;
                        setFilters((f) => ({ ...f, campus: value === "All campuses" ? [] : [value] }));
                      }}
                      className="min-w-0 appearance-none bg-transparent pr-7 text-sm font-black outline-none"
                      aria-label="Campus selector"
                    >
                      <option>All campuses</option>
                      <option>Main Campus</option>
                      <option>North Campus</option>
                      <option>South Campus</option>
                      <option>East Campus</option>
                      <option>West Campus</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" />
                  </label>

                  <button
                    type="button"
                    onClick={() => setFilterOpen(true)}
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black shadow-soft transition hover:-translate-y-0.5 ${
                      hasActiveFilters
                        ? "bg-foreground text-background"
                        : "border border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter
                    {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-warm" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation Tabs ── */}
          <div className="mb-4 flex flex-wrap items-center gap-2 px-1">
            <button
              type="button"
              onClick={() => setActiveView("browse")}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition hover:-translate-y-0.5 ${
                activeView === "browse" ? "border-foreground bg-foreground text-background shadow-soft" : "border-transparent bg-paper text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Browse
            </button>
            <button
              type="button"
              onClick={() => setActiveView("saved")}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition hover:-translate-y-0.5 ${
                activeView === "saved" ? "border-foreground bg-foreground text-background shadow-soft" : "border-transparent bg-paper text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Heart className="h-4 w-4" />
              Saved {savedCount > 0 && <span className="rounded-full bg-warm px-1.5 py-0.5 text-[10px] text-warm-foreground">{savedCount}</span>}
            </button>
            <button
              type="button"
              onClick={() => setActiveView("seller")}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition hover:-translate-y-0.5 ${
                activeView === "seller" ? "border-foreground bg-foreground text-background shadow-soft" : "border-transparent bg-paper text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <UserRound className="h-4 w-4" />
              My Listings {myListingsCount > 0 && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{myListingsCount}</span>}
            </button>
            <button
              type="button"
              onClick={() => setActiveView("chats")}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition hover:-translate-y-0.5 ${
                activeView === "chats" ? "border-foreground bg-foreground text-background shadow-soft" : "border-transparent bg-paper text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Chats {unreadTotalCount > 0 && <span className="rounded-full bg-warm px-1.5 py-0.5 text-[10px] text-warm-foreground">{unreadTotalCount}</span>}
            </button>
          </div>

          {/* ── Categories ── */}
          {(activeView === "browse" || activeView === "saved") && (
            <CategoryNavigation
              activeCategories={filters.category}
              activeQuery={searchQuery}
              onSelectCategory={handleCategoryNavigationSelect}
            />
          )}

          {/* Active Filter Chips */}
          {(activeView === "browse" || activeView === "saved") && hasActiveFilters && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {filters.category.map(c => (
                <span key={c} className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black shadow-soft">
                  {c}
                  <button type="button" onClick={() => handleCategorySelect(c)} className="ml-1 text-muted-foreground transition hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                </span>
              ))}
              {filters.condition.map(c => (
                <span key={c} className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black shadow-soft">
                  Condition: {c}
                  <button type="button" onClick={() => setFilters(f => ({...f, condition: f.condition.filter(x => x !== c)}))} className="ml-1 text-muted-foreground transition hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                </span>
              ))}
              {filters.campus.map(c => (
                <span key={c} className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black shadow-soft">
                  {c}
                  <button type="button" onClick={() => setFilters(f => ({...f, campus: f.campus.filter(x => x !== c)}))} className="ml-1 text-muted-foreground transition hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                </span>
              ))}
              {filters.hostel.map(h => (
                <span key={h} className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black shadow-soft">
                  {h}
                  <button type="button" onClick={() => setFilters(f => ({...f, hostel: f.hostel.filter(x => x !== h)}))} className="ml-1 text-muted-foreground transition hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                </span>
              ))}
              {filters.minPrice > 0 && (
                <span className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black shadow-soft">
                  Min ₹{filters.minPrice}
                  <button type="button" onClick={() => setFilters(f => ({...f, minPrice: 0}))} className="ml-1 text-muted-foreground transition hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                </span>
              )}
              {filters.maxPrice < 60000 && (
                <span className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black shadow-soft">
                  Max ₹{filters.maxPrice}
                  <button type="button" onClick={() => setFilters(f => ({...f, maxPrice: 60000}))} className="ml-1 text-muted-foreground transition hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                </span>
              )}
              {filters.datePosted !== "any" && (
                <span className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black shadow-soft">
                  {filters.datePosted === "today" ? "Today" : "Last 7 Days"}
                  <button type="button" onClick={() => setFilters(f => ({...f, datePosted: "any"}))} className="ml-1 text-muted-foreground transition hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                </span>
              )}
              {filters.isNegotiable && (
                <span className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black shadow-soft">
                  Negotiable
                  <button type="button" onClick={() => setFilters(f => ({...f, isNegotiable: false}))} className="ml-1 text-muted-foreground transition hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                </span>
              )}
              <button
                type="button"
                onClick={() => setFilters(initialFilters)}
                className="ml-2 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground underline decoration-muted-foreground/30 underline-offset-4"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* ── Error banners ── */}
          {marketplaceError === "network" && (
            <div className="mb-5 flex items-center gap-2 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Network error. Please check your connection and refresh the page.
            </div>
          )}

          {marketplaceError === "server" && (
            <div className="mb-5 flex items-center gap-2 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Server error. Please try again later.
            </div>
          )}

          {/* ── Title row ── */}
          {activeView !== "chats" && activeView !== "seller" && (
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-black">
                  {activeView === "saved"
                    ? "Saved Items"
                    : filters.category.length === 0
                      ? "All Listings"
                      : filters.category.length === 1 
                        ? filters.category[0] 
                        : `${filters.category.length} Categories`}
                </h2>
                <p className="text-sm font-semibold text-muted-foreground">
                  {loading
                    ? "Loading..."
                    : marketplaceError === "empty"
                      ? "0 listings"
                      : `${visibleListings.length} ${visibleListings.length === 1 ? "listing" : "listings"} loaded`}
                </p>
              </div>
            </div>
          )}

          {/* ── Chat inbox ── */}
          {activeView === "chats" ? (
            <MarketplaceChat
              onBackToBrowse={() => { setActiveView("browse"); setActiveChatId(null); }}
              listings={listings}
              initialChatId={activeChatId}
              currentUserId={currentUserId}
            />
          ) : activeView === "seller" ? (
            <SellerDashboard
              listings={sellerListings}
              onPostItem={() => {
                setEditingId(undefined);
                setSellOpen(true);
              }}
              onEditItem={(id) => {
                setEditingId(id);
                setSellOpen(true);
              }}
              onDelete={handleDeleteListing}
              onMarkSold={(id) => markListingStatus(id, "sold")}
              onViewItem={viewListing}
              onPublishDraft={publishDraft}
              onDuplicate={duplicateListing}
              onArchiveItem={(id) => markListingStatus(id, "archived")}
              onUnarchiveItem={(id) => markListingStatus(id, "active")}
            />
          ) : (
            <>
              {/* ─ Loading ─ */}
              {loading && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:gap-5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* ─ Empty ─ */}
              {!loading && (visibleListings.length === 0 || marketplaceError === "empty") && (
                activeView === "saved" ? (
                  <div className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-border/60 bg-card/30 py-24 text-center">
                    <div className="relative mb-5 grid h-24 w-24 place-items-center rounded-full bg-warm/10 text-warm ring-8 ring-warm/5">
                      <Heart className="h-10 w-10 fill-warm/20" />
                      <Sparkles className="absolute -right-1 -top-1 h-6 w-6 animate-pulse text-warm" />
                    </div>
                    <h3 className="font-display text-2xl font-black tracking-tight text-foreground">No saved listings yet.</h3>
                    <p className="mt-2 max-w-sm text-sm font-semibold text-muted-foreground">
                      Keep track of items you love by tapping the heart icon on any listing.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveView("browse")}
                      className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-black text-background shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
                    >
                      Browse Marketplace
                    </button>
                  </div>
                ) : (
                  <div className="paper-lift overflow-hidden rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
                    <div className="mx-auto grid h-24 w-24 place-items-center rounded-[2rem] border border-border bg-background shadow-soft">
                      <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <ShoppingBag className="h-7 w-7" />
                        <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-foreground text-background shadow-soft">
                          <Search className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                    <h3 className="mt-6 font-display text-2xl font-black">
                      No listings found
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-muted-foreground">
                      Try adjusting your filters or be the first to post an item in this category.
                    </p>
                    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(undefined);
                          setSellOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-black text-background shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
                      >
                        <Plus className="h-4 w-4" />
                        Sell Item
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFilters(initialFilters);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-black transition-all duration-300 hover:-translate-y-1 hover:bg-secondary"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* ── Trending & Recommended Sections ── */}
              {!loading && visibleListings.length > 0 && activeView === "browse" && !filters.query && (
                <div className="space-y-8 mb-8">
                  {trendingListings.length > 0 && (
                    <div className="rounded-3xl border border-border bg-paper p-5 shadow-soft">
                      <h3 className="font-display text-lg font-black text-foreground mb-3 flex items-center gap-1.5">
                        Trending on Campus 🔥
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {trendingListings.map((l) => (
                          <ProductCard
                            key={l.id}
                            listing={l}
                            isSaved={savedItems.includes(l.id)}
                            onSave={toggleSaveItem}
                            onClick={viewListing}
                            onChat={(id) => console.log("Chat:", id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendedListings.length > 0 && (
                    <div className="rounded-3xl border border-border bg-paper p-5 shadow-soft">
                      <h3 className="font-display text-lg font-black text-foreground mb-3 flex items-center gap-1.5">
                        Recommended for You ✨
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {recommendedListings.map((l) => (
                          <ProductCard
                            key={l.id}
                            listing={l}
                            isSaved={savedItems.includes(l.id)}
                            onSave={toggleSaveItem}
                            onClick={viewListing}
                            onChat={(id) => console.log("Chat:", id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─ Grid ─ */}
              {!loading && visibleListings.length > 0 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:gap-5">
                    {visibleListings.map((listing) => (
                      <ProductCard
                        key={listing.id}
                        listing={listing}
                        isSaved={savedItems.includes(listing.id)}
                        onSave={toggleSaveItem}
                        onClick={viewListing}
                        onChat={(id) => console.log("Chat:", id)}
                      />
                    ))}
                  </div>

                  {hasMore && (
                    <div className="mt-8 flex justify-center">
                      <button
                        type="button"
                        onClick={() => loadMore()}
                        className="flex h-12 min-w-[200px] items-center justify-center gap-2 border border-border bg-card font-black transition hover:bg-foreground hover:text-background"
                      >
                        <Loader2 className="h-4 w-4" />
                        Load more
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
        )}

        {/* ── Floating Action Button — Sell ── */}
        {activeView !== "seller" && (
          <button
            type="button"
            onClick={() => {
              setEditingId(undefined);
              setSellOpen(true);
            }}
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center bg-foreground text-background shadow-glow transition-all hover:-translate-y-1 hover:shadow-soft md:h-auto md:w-auto md:gap-2 md:px-5 md:py-3"
            aria-label="Sell an item"
          >
            <Plus className="h-6 w-6 md:h-4 md:w-4" />
            <span className="hidden text-sm font-black md:inline">Sell Item</span>
          </button>
        )}

        {/* ── Filter drawer ── */}
        <FilterDrawer
          open={filterOpen}
          onOpenChange={setFilterOpen}
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* ── Sell form ── */}
        <SellItemForm
          open={sellOpen}
          onOpenChange={setSellOpen}
          initialValues={editInitialValues}
          onSubmit={async (values, isDraft) => {
            const saved = await saveListing(
              values,
              isDraft ? "draft" : "active",
              editingId,
            );
            if (isDraft && !editingId && saved?.id) {
              setEditingId(saved.id);
            }
          }}
        />
      </main>
    </ModuleAccessBoundary>
  );
}
