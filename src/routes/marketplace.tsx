import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  BedDouble,
  Bike,
  BookOpen,
  ChevronRight,
  Eye,
  HelpCircle,
  Heart,
  Laptop,
  MessageSquare,
  Package,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  X,
  Settings,
  LogOut,
  FileText,
  BarChart2,
  Bell,
  Store,
  ArrowLeft,
  MapPin,
  ChevronDown,
  Check,
} from "lucide-react";
import { NexoraLogo } from "@/components/brand/NexoraLogo";
import { useState, useMemo, useCallback, useEffect } from "react";
import { ModuleAccessBoundary } from "@/components/ModuleAccessControl";
import { NexoraCard, NexoraCardSkeleton } from "@/components/marketplace/NexoraCard";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductDetail } from "@/components/marketplace/ProductDetail";
import { PremiumFilter } from "@/components/marketplace/PremiumFilter";
import { SellerProfile } from "@/components/marketplace/SellerProfile";
import { SellerDashboard } from "@/components/marketplace/SellerDashboard";
import { SellItemForm } from "@/components/marketplace/SellItemForm";
import { MarketplaceChat } from "@/components/marketplace/MarketplaceChat";
import { useMarketplace } from "@/hooks/useMarketplace";
import {
  initialFilters,
  listingToFormValues,
  seedListings,
  type MarketplaceFilters,
  type MarketplaceListing,
} from "@/lib/marketplace";
import { createChat } from "@/services/marketplace.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/marketplace")({
  validateSearch: (search: Record<string, unknown>): { id?: string; view?: string } => ({
    id: search.id as string | undefined,
    view: search.view as string | undefined,
  }),
  head: () => ({ meta: [{ title: "Nexora — Campus Marketplace" }] }),
  component: MarketplaceRoute,
});

// ── Types ─────────────────────────────────────────────────────────────────────
type AppMode = "buying" | "selling";
type BuyerView = "browse" | "saved" | "messages" | "orders" | "help";
type SellerDashView = "listings" | "messages" | "analytics";

// CATEGORIES maps each display tab to the actual MarketplaceCategory values in the data.
// This is the root cause of the empty-grid bug: the tabs used display labels
// ("Vehicles", "Books & Study Material") but products are stored under different
// values ("Cycles", "Books", "Notes"). The mapping below bridges that gap.
const CATEGORIES: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  categories: string[];
}[] = [
  { label: "Vehicles",                      icon: Bike,       categories: ["Cycles"] },
  { label: "Electronics & Appliances",       icon: Laptop,     categories: ["Electronics", "Gaming"] },
  { label: "Books & Study Material",         icon: BookOpen,   categories: ["Books", "Notes"] },
  { label: "Hostel Essentials & Lifestyle",  icon: BedDouble,  categories: ["Hostel Essentials", "Furniture", "Fashion", "Sports"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Root route component
// ─────────────────────────────────────────────────────────────────────────────
function MarketplaceRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    listings,
    sellerListings,
    savedItems,
    filters,
    setFilters,
    activeView,
    setActiveView,
    toggleSaveItem,
    viewListing,
    goBack,
    selectedListingId,
    selectedListing,
    isDetailLoading,
    saveListing,
    duplicateListing,
    deleteListing,
    markListingStatus,
    isLoading: marketplaceLoading,
    error: marketplaceError,
    currentUserId,
    hasMore,
    loadMore,
    retryFetch,
  } = useMarketplace(search, navigate);

  const handleProductClick = useCallback((id: string) => {
    navigate({ to: "/marketplace/product/$id", params: { id } });
  }, [navigate]);

  const handleSellerClick = useCallback((sellerId: string) => {
    navigate({ to: "/marketplace/seller/$id", params: { id: sellerId } });
  }, [navigate]);

  // ── App state ──────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<AppMode>("buying");
  const [buyerView, setBuyerView] = useState<BuyerView>("browse");
  const [sellerDashView, setSellerDashView] = useState<SellerDashView>("listings");
  const [profileSellerId, setProfileSellerId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSellerSearch, setShowSellerSearch] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; avatar: string } | null>(null);
  const [campusOpen, setCampusOpen] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<string>(filters.campus[0] ?? "All Campuses");

  useEffect(() => {
    setSelectedCampus(filters.campus[0] ?? "All Campuses");
  }, [filters.campus]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", data.session.user.id)
          .single()
          .then(({ data: p }) => {
            if (p) setUserProfile({ name: p.full_name ?? "Student", avatar: p.avatar_url ?? "" });
          });
      }
    });
  }, []);

  // ── Derived data ───────────────────────────────────────────────────────────
  // Use seed data as fallback when DB returns nothing
  const allListings: MarketplaceListing[] =
    listings.length > 0 ? listings : seedListings;

  const visibleListings = allListings.filter(l => {
    if (
      filters.category.length > 0 &&
      !filters.category.includes(l.category as any)
    )
      return false;
    if (
      filters.query &&
      !l.title.toLowerCase().includes(filters.query.toLowerCase())
    )
      return false;
    return true;
  });

  const savedListings = allListings.filter(l => savedItems.includes(l.id));

  const editInitialValues = useMemo(() => {
    if (!editingId) return undefined;
    const l =
      sellerListings.find(x => x.id === editingId) ??
      listings.find(x => x.id === editingId);
    return l ? listingToFormValues(l) : undefined;
  }, [editingId, sellerListings, listings]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSearchChange = useCallback(
    (q: string) => {
      setSearchQuery(q);
      setFilters(f => ({ ...f, query: q }));
    },
    [setFilters]
  );

  const handleCategorySelect = useCallback(
    (tabLabel: string) => {
      // Find the tab entry to get its mapped actual category values
      const tab = CATEGORIES.find(c => c.label === tabLabel);
      if (!tab) return;

      // Toggle: if all of this tab's categories are already active, clear the filter
      const allActive = tab.categories.every(c => filters.category.includes(c as any));
      setFilters(f => ({
        ...f,
        // Store the ACTUAL category values (e.g. ["Cycles"]) not the display label
        category: allActive ? [] : (tab.categories as any[]),
      }));
      setBuyerView("browse");
      setActiveView("browse");
    },
    [filters.category, setFilters, setActiveView]
  );

  const handleModeSwitch = useCallback(
    (newMode: AppMode) => {
      setMode(newMode);
      setProfileSellerId(null);
      if (newMode === "buying") {
        setBuyerView("browse");
        setActiveView("browse");
      } else {
        setSellerDashView("listings");
        setActiveView("seller");
      }
    },
    [setActiveView]
  );

  const handleViewSeller = useCallback((sellerId: string) => {
    handleSellerClick(sellerId);
  }, [handleSellerClick]);

  // ── Render flags ───────────────────────────────────────────────────────────
  // showDetail is true whenever activeView=="detail" and no profile overlay is
  // open. selectedListing may still be null while fetching — the detail render
  // block below owns its own loading and error states.
  const showDetail = activeView === "detail" && !profileSellerId;
  const showProfile = !!profileSellerId;
  const showChats =
    !showDetail &&
    !showProfile &&
    (activeView === "chats" || buyerView === "messages" || sellerDashView === "messages");

  // ─────────────────────────────────────────────────────────────────────────
  // Content renderer
  // ─────────────────────────────────────────────────────────────────────────
  const renderContent = () => {
    // Profile overlay (any mode)
    if (showProfile && profileSellerId) {
      const profileListings = allListings.filter(
        l => l.sellerId === profileSellerId
      );
      const ref =
        allListings.find(l => l.sellerId === profileSellerId) ??
        sellerListings.find(l => l.sellerId === profileSellerId);
      return (
        <SellerProfile
          sellerId={profileSellerId}
          sellerName={ref?.sellerName ?? "Student"}
          sellerAvatar={ref?.sellerAvatar ?? ""}
          sellerCourse={ref?.sellerCourse ?? ""}
          sellerRating={ref?.sellerRating ?? 4.8}
          listings={profileListings}
          savedItems={savedItems}
          isOwnProfile={profileSellerId === currentUserId}
          onBack={() => setProfileSellerId(null)}
          onCardClick={handleProductClick}
          onSave={toggleSaveItem}
        />
      );
    }

    // Product detail — owns loading + error states for all URL access patterns
    // (refresh, deep-link, new tab, history navigation).
    if (showDetail) {
      // Still resolving the listing (DB fetch or seed lookup in progress)
      if (isDetailLoading) {
        return <DetailLoadingView onBack={goBack} />;
      }
      // Fetching is done but listing came back null (invalid / deleted ID)
      if (!selectedListing) {
        return (
          <DetailErrorView
            id={selectedListingId ?? ""}
            onBack={goBack}
            onRetry={() => {
              // Force re-fetch by clearing then re-setting selectedListingId
              if (selectedListingId) viewListing(selectedListingId);
            }}
          />
        );
      }
      return (
        <ProductDetail
          listing={selectedListing}
          isSaved={savedItems.includes(selectedListing.id)}
          onSave={toggleSaveItem}
          onBack={goBack}
          onChat={async id => {
            if (selectedListing.sellerId) {
              try {
                const newChat = await createChat(id, selectedListing.sellerId);
                if (newChat?.id) setActiveChatId(newChat.id);
              } catch {}
              setActiveView("chats");
              setBuyerView("messages");
            }
          }}
          onViewSeller={handleViewSeller}
        />
      );
    }

    // Chat view
    if (showChats) {
      const isSellerChat = mode === "selling";
      return (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-5 pb-16">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => {
                if (isSellerChat) {
                  setSellerDashView("listings");
                  setActiveView("seller");
                } else {
                  setActiveView("browse");
                  setBuyerView("browse");
                  setActiveChatId(null);
                }
              }}
              className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Back to Marketplace
            </button>
            <span className="text-sm font-black text-foreground">
              {isSellerChat ? "Selling Chats" : "Buying Chats"}
            </span>
          </div>
          <MarketplaceChat
            onBackToBrowse={() => {
              if (isSellerChat) {
                // Seller chats: back goes to Seller Dashboard
                setSellerDashView("listings");
                setActiveView("seller");
              } else {
                // Buyer chats: back goes to browse
                setActiveView("browse");
                setBuyerView("browse");
                setActiveChatId(null);
              }
            }}
            listings={allListings}
            initialChatId={activeChatId}
            currentUserId={currentUserId}
            filterMode={mode}
          />
        </div>
      );
    }

    // Help Center view
    if (activeView === "help") {
      return <HelpView onBack={goBack} />;
    }

    // Selling mode
    if (mode === "selling") {
      // Analytics sub-view
      if (sellerDashView === "analytics") {
        return (
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-5 pb-16">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => { setSellerDashView("listings"); setActiveView("seller"); }}
                className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back
              </button>
              <span className="text-sm font-black text-foreground">Analytics</span>
            </div>
            <SellerAnalyticsView listings={sellerListings} />
          </div>
        );
      }

      return (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-5 pb-16">
          <SellerDashboard
            listings={sellerListings}
            onBack={() => {
              setMode("buying");
              setActiveView("browse");
              setBuyerView("browse");
              setFilters(initialFilters);
            }}
            onPostItem={() => {
              setEditingId(undefined);
              setSellOpen(true);
            }}
            onEditItem={id => {
              setEditingId(id);
              setSellOpen(true);
            }}
            onDelete={deleteListing}
            onMarkSold={id => markListingStatus(id, "sold")}
            onViewItem={handleProductClick}
            onPublishDraft={() => {}}
            onDuplicate={duplicateListing}
            onArchiveItem={id => markListingStatus(id, "archived")}
            onUnarchiveItem={id => markListingStatus(id, "active")}
          />
        </div>
      );
    }

    // Buying mode
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-5 pb-16">
        {buyerView === "browse" && (
          <BrowseView
            listings={visibleListings}
            savedItems={savedItems}
            isLoading={marketplaceLoading}
            error={marketplaceError}
            filters={filters}
            onSetFilters={setFilters}
            onFilterOpen={() => setFilterOpen(true)}
            onCardClick={handleProductClick}
            onSave={toggleSaveItem}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onRetry={retryFetch}
          />
        )}
        {buyerView === "saved" && (
          <SavedView
            listings={savedListings}
            savedItems={savedItems}
            onCardClick={handleProductClick}
            onSave={toggleSaveItem}
            onBack={goBack}
          />
        )}
        {buyerView === "orders" && <OrdersView onBack={goBack} />}
      </div>
    );
  };

  // isProfileMode: hide sub-nav for detail, profile overlay, buyer orders, help, and buyer-side chats.
  // In seller mode, the secondary nav (My Listings | Selling Chats | Analytics) stays visible
  // at all times — it IS the back-navigation mechanism for seller sub-pages.
  const isProfileMode =
    showDetail ||
    showProfile ||
    (showChats && mode === "buying") ||
    (buyerView === "orders" && mode === "buying") ||
    activeView === "help";

  // ─────────────────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ModuleAccessBoundary moduleId="marketplace">
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        {/* ── TOPBAR ─────────────────────────────────────────────────── */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center gap-3 sm:gap-4 px-4 sm:px-6 bg-background border-b border-border/50">
          <div className="flex shrink-0 items-center gap-3">
            {/* Back arrow */}
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border/50 bg-secondary/30 text-foreground transition-all hover:bg-secondary"
              aria-label="Back to Main Site"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            
            <div className="hidden h-5 w-px bg-border/50 sm:block" />

            {/* Logo — goes to main site as requested */}
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
              aria-label="Back to Main Site"
            >
              <NexoraLogo size="sm" />
            </button>
          </div>

          {/* Search & Campus / Seller Navigation */}
          {mode === "buying" ? (
            <div className="flex-1 max-w-xl mx-auto flex items-center gap-2">
              {(!isProfileMode && mode === "buying") && (
                <Popover open={campusOpen} onOpenChange={setCampusOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1.5 px-3 h-10 rounded-full text-xs font-semibold bg-secondary/50 hover:bg-secondary text-foreground transition-colors border border-border/50 shrink-0">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline-block">{filters.campus[0] ?? "All Campuses"}</span>
                      <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="start">
                    <div className="space-y-1">
                      {["All Campuses", "Main Campus", "North Campus", "South Campus", "East Campus", "West Campus"].map((campus) => (
                        <button
                          key={campus}
                          onClick={() => setSelectedCampus(campus)}
                          className="w-full flex items-center justify-between px-2.5 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
                        >
                          <span className={selectedCampus === campus ? "font-semibold text-foreground" : "text-foreground/80"}>{campus}</span>
                          {selectedCampus === campus && <Check className="h-4 w-4 text-foreground" />}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex justify-end">
                      <button
                        onClick={() => {
                          setFilters({ ...filters, campus: selectedCampus === "All Campuses" ? [] : [selectedCampus] });
                          setCampusOpen(false);
                        }}
                        className="px-4 py-1.5 bg-foreground text-background text-xs font-bold rounded-full hover:opacity-90 transition-opacity"
                      >
                        Apply
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              <div className="flex-1 flex items-center h-10 gap-2.5 px-4 rounded-full bg-secondary/50 border border-border/50 focus-within:border-border focus-within:bg-background transition-all">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search items..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button onClick={() => handleSearchChange("")}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* SELL MODE Center Navigation */
            <div className="flex-1 max-w-xl mx-auto flex items-center justify-center">
              {/* Desktop/Tablet Nav */}
              <div className="hidden md:flex items-center gap-6">
                {([
                  { id: "listings" as SellerDashView, label: "My Listings", view: "seller" },
                  { id: "messages" as SellerDashView, label: "Selling Chats", view: "chats" },
                  { id: "analytics" as SellerDashView, label: "Analytics", view: "analytics" },
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setSellerDashView(tab.id); setActiveView(tab.view as any); setProfileSellerId(null); }}
                    className={`text-[13px] font-black whitespace-nowrap transition-colors py-1.5 border-b-2 transition-all duration-150 ${
                      sellerDashView === tab.id && !showProfile
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Mobile / Tablet dropdown/collapsed menu */}
              <div className="md:hidden flex items-center gap-2">
                <select
                  value={sellerDashView}
                  onChange={e => {
                    const val = e.target.value as SellerDashView;
                    setSellerDashView(val);
                    const view = val === "listings" ? "seller" : (val === "messages" ? "chats" : "analytics");
                    setActiveView(view as any);
                    setProfileSellerId(null);
                  }}
                  className="bg-secondary/50 border border-border/50 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground"
                >
                  <option value="listings" className="bg-[#030712]">My Listings</option>
                  <option value="messages" className="bg-[#030712]">Selling Chats</option>
                  <option value="analytics" className="bg-[#030712]">Analytics</option>
                </select>
              </div>
            </div>
          )}

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            {/* Mode toggle */}
            <div className="flex items-center gap-2 hidden sm:flex">
              <span className={`text-xs font-semibold ${mode === "buying" ? "text-foreground" : "text-muted-foreground"}`}>Buy</span>
              <Switch
                checked={mode === "selling"}
                onCheckedChange={(checked) => handleModeSwitch(checked ? "selling" : "buying")}
              />
              <span className={`text-xs font-semibold ${mode === "selling" ? "text-foreground" : "text-muted-foreground"}`}>Sell</span>
            </div>

            <div className="w-px h-4 bg-border hidden sm:block" />

            {/* Buy mode: Filter + Wishlist icons */}
            {mode === "buying" && (
              <>
                <button
                  onClick={() => { setFilterOpen(true); setProfileSellerId(null); }}
                  className="relative text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
                  title="Filters"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </button>
                <button
                  onClick={() => { setBuyerView("saved"); setActiveView("saved"); setProfileSellerId(null); }}
                  className="relative text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
                  title="Wishlist"
                >
                  <Heart className="h-5 w-5" />
                  {savedItems.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-foreground border-2 border-background" />
                  )}
                </button>
              </>
            )}

            {/* Sell mode: Expandable Search + Notifications */}
            {mode === "selling" && (
              <>
                {showSellerSearch ? (
                  <div className="flex items-center h-8.5 gap-2 px-3 rounded-full bg-secondary/50 border border-border/50 focus-within:border-border transition-all animate-in slide-in-from-right duration-200">
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <input
                      value={searchQuery}
                      onChange={e => handleSearchChange(e.target.value)}
                      placeholder="Search listings..."
                      className="bg-transparent text-xs outline-none placeholder:text-muted-foreground w-28 sm:w-40"
                      autoFocus
                    />
                    <button onClick={() => { handleSearchChange(""); setShowSellerSearch(false); }}>
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSellerSearch(true)}
                    className="relative text-muted-foreground hover:text-foreground transition-colors"
                    title="Search Listings"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                )}
                <button
                  className="relative text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Profile Dropdown — content changes based on mode */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 rounded-full overflow-hidden ring-1 ring-border/50 hover:ring-border transition-all focus:outline-none">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={userProfile?.avatar ?? ""} />
                    <AvatarFallback className="bg-secondary text-foreground font-bold text-xs">
                      {userProfile?.name?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-semibold">
                  {userProfile?.name ?? "sakshi mishra"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => { setBuyerView("orders"); setProfileSellerId(null); setActiveView("browse"); }}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <ShoppingBag className="h-4 w-4" /> My Orders
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={() => { setBuyerView("messages"); setActiveView("chats"); setProfileSellerId(null); }}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" /> Buying Chats
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={() => { navigate({ to: "/marketplace/help" }); }}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <HelpCircle className="h-4 w-4" /> Help Center
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={() => { navigate({ to: "/marketplace/settings" }); }}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" /> Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── SECONDARY NAV ───────────────────────────────────────────── */}
        {!isProfileMode && mode === "buying" && (
          <div className="fixed top-16 left-0 right-0 z-40 h-12 bg-background/95 backdrop-blur-sm border-b border-border/30 flex items-center px-4 sm:px-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-6 after:content-[''] after:pr-4 sm:after:pr-6">

              {/* BUY MODE: categories only */}
              <button
                onClick={() => { setBuyerView("browse"); setFilters(initialFilters); setActiveView("browse"); setProfileSellerId(null); }}
                className={`text-[13px] font-semibold whitespace-nowrap transition-colors ${
                  buyerView === "browse" && filters.category.length === 0 && !showDetail
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <div className="w-px h-3 bg-border" />
              {CATEGORIES.map(({ label, icon: Icon, categories: tabCats }) => (
                <button
                  key={label}
                  onClick={() => { handleCategorySelect(label); setProfileSellerId(null); }}
                  className={`flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
                    // Active when ANY of this tab's actual categories are in the current filter
                    tabCats.some(c => filters.category.includes(c as any))
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  {label}
                </button>
              ))}

            </div>
          </div>
        )}

        {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
        <main className={`flex-1 w-full ${(isProfileMode || mode === "selling") ? "mt-16 min-h-[calc(100vh-64px)]" : "mt-[116px] min-h-[calc(100vh-116px)]"}`}>
          {renderContent()}
        </main>

        {/* ── OVERLAYS ───────────────────────────────────────────────── */}
        <PremiumFilter
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          filters={filters}
          onApply={setFilters}
        />
        <SellItemForm
          open={sellOpen}
          onOpenChange={setSellOpen}
          initialValues={editInitialValues}
          onSubmit={async (v, d) => {
            await saveListing(v, d ? "draft" : "active", editingId);
          }}
        />
      </div>
    </ModuleAccessBoundary>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-views
// ─────────────────────────────────────────────────────────────────────────────

// DetailLoadingView: shown while the listing is being fetched (after refresh /
// deep-link). Mirrors the ProductDetail layout so there is no layout shift.
function DetailLoadingView({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-16">
      {/* Back row */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back
        </button>
        <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image skeleton */}
        <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-muted" />

        {/* Info skeletons */}
        <div className="space-y-4 pt-2">
          <div className="h-7 w-2/3 animate-pulse rounded-lg bg-muted" />
          <div className="h-5 w-1/3 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
          <div className="mt-6 h-12 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}

// DetailErrorView: shown when the listing fetch completes but returns null
// (invalid ID, deleted listing, or network error).
function DetailErrorView({
  id,
  onBack,
  onRetry,
}: {
  id: string;
  onBack: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-16">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-10"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        Back to Marketplace
      </button>

      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-6">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
          <Package className="h-9 w-9 text-muted-foreground/40" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold text-foreground">
            Product not found
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {id
              ? "This listing may have been removed or the link is invalid."
              : "No product ID was provided in the URL."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-5 py-2 rounded-full border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            Browse listings
          </button>
          {id && (
            <button
              onClick={onRetry}
              className="px-5 py-2 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
// SellerAnalyticsView: shown when seller navigates to Analytics from the secondary nav.
// Uses real listing data to show meaningful metrics.
function SellerAnalyticsView({ listings }: { listings: MarketplaceListing[] }) {
  const activeListings = listings.filter(l => l.status === "active");
  const soldListings   = listings.filter(l => l.status === "sold");
  const draftListings  = listings.filter(l => l.status === "draft");

  const totalViews  = listings.reduce((s, l) => s + (l.views || 0), 0);
  const totalSaves  = listings.reduce((s, l) => s + (l.saves || 0), 0);
  const totalEarned = soldListings.reduce((s, l) => s + l.price, 0);
  const avgPrice    = listings.length > 0
    ? Math.round(listings.reduce((s, l) => s + l.price, 0) / listings.length)
    : 0;

  const stats = [
    { label: "Active Listings",  value: activeListings.length, sub: "currently live",    color: "text-emerald-400" },
    { label: "Sold Items",       value: soldListings.length,   sub: "completed sales",   color: "text-blue-400" },
    { label: "Drafts",           value: draftListings.length,  sub: "pending publish",   color: "text-amber-400" },
    { label: "Total Views",      value: totalViews,            sub: "across all items",  color: "text-violet-400" },
    { label: "Total Saves",      value: totalSaves,            sub: "by other students", color: "text-pink-400" },
    { label: "Total Earned",     value: `₹${totalEarned.toLocaleString("en-IN")}`, sub: "from sold items", color: "text-foreground" },
    { label: "Avg Listing Price",value: `₹${avgPrice.toLocaleString("en-IN")}`,    sub: "across all items", color: "text-foreground" },
    { label: "Total Listings",   value: listings.length,       sub: "ever posted",       color: "text-foreground" },
  ];

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="font-display text-2xl font-black text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your selling performance at a glance.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-5 space-y-1.5 animate-in fade-in duration-150">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
            <p className={`font-display text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      {listings.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[30vh] text-center gap-3">
          <BarChart3 className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Post your first listing to see analytics here.</p>
        </div>
      )}

      {listings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Listings (Left) */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-muted/5">
              <h2 className="text-sm font-black text-foreground">Top Listings by Views</h2>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Listing Performance</span>
            </div>
            <div className="divide-y divide-border/40">
              {[...listings]
                .sort((a, b) => (b.views || 0) - (a.views || 0))
                .slice(0, 5)
                .map((l, i) => (
                  <div key={l.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-secondary/10 transition-colors">
                    <span className="text-xs font-black text-muted-foreground w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{l.title}</p>
                      <p className="text-xs text-muted-foreground">{l.category}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{l.views || 0}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{l.saves || 0}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Recent Activity (Right) */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-muted/5">
              <h2 className="text-sm font-black text-foreground">Recent Activity</h2>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Activity Log</span>
            </div>
            <div className="divide-y divide-border/40">
              {[...listings]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((l) => {
                  const formattedDate = new Date(l.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  });
                  return (
                    <div key={l.id} className="flex items-start gap-3.5 px-6 py-3.5 hover:bg-secondary/10 transition-colors">
                      <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black ${
                        l.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        l.status === "sold" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        l.status === "draft" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-secondary text-muted-foreground"
                      }`}>
                        {l.status === "active" ? "A" : l.status === "sold" ? "S" : "D"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {l.status === "active" ? "Listed item for sale" :
                           l.status === "sold" ? "Marked item as sold" :
                           "Created a new draft"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{l.title}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground shrink-0 mt-0.5">
                        {formattedDate}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BrowseView({
  listings,
  savedItems,
  isLoading,
  error,
  filters,
  onSetFilters,
  onFilterOpen,
  onCardClick,
  onSave,
  hasMore,
  onLoadMore,
  onRetry,
}: {
  listings: MarketplaceListing[];
  savedItems: string[];
  isLoading: boolean;
  error: string | null;
  filters: MarketplaceFilters;
  onSetFilters: (f: any) => void;
  onFilterOpen: () => void;
  onCardClick: (id: string) => void;
  onSave: (id: string) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
}) {
  // Safety timeout: if loading persists for more than 8 seconds, force-clear it
  const [forceShow, setForceShow] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      setForceShow(false);
      return;
    }
    const timer = setTimeout(() => setForceShow(true), 8000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const effectiveLoading = isLoading && !forceShow;

  const hasActiveFilters =
    filters.category.length > 0 ||
    filters.condition.length > 0 ||
    filters.minPrice > 0 ||
    filters.maxPrice < 60000 ||
    filters.campus.length > 0 ||
    !!filters.isNegotiable;

  const activeFilterCount = [
    filters.category.length > 0,
    filters.condition.length > 0,
    filters.minPrice > 0 || filters.maxPrice < 60000,
    filters.campus.length > 0,
    !!filters.isNegotiable,
  ].filter(Boolean).length;

  // Resolve the human-readable tab label from active category filters
  // (filters.category holds actual values like ["Cycles"] — map back to "Vehicles")
  const activeCategoryTab = CATEGORIES.find(tab =>
    tab.categories.some(c => filters.category.includes(c as any))
  );
  const categoryLabel = activeCategoryTab?.label ?? null;
  const queryLabel = filters.query ? `"${filters.query}"` : null;
  const sectionLabel = categoryLabel ?? queryLabel;

  return (
    <div className="pb-8">
      {/* Active filter context row — only visible when filters are applied */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mb-4">
          {sectionLabel && (
            <span className="text-sm font-semibold text-foreground">{sectionLabel}</span>
          )}
          <button
            onClick={() => onSetFilters(initialFilters)}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-full border border-border/50 hover:border-border"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        </div>
      )}

      {/* Error fallback — API failed */}
      {!effectiveLoading && error && error !== "empty" ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-4">
          <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <Package className="h-7 w-7 text-destructive/60" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Unable to load marketplace</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error === "network"
                ? "Please check your internet connection and try again."
                : "Something went wrong on our end. Please try again."}
            </p>
          </div>
          <button
            onClick={onRetry}
            className="px-5 py-2.5 text-sm font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : /* Grid */
      effectiveLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <NexoraCardSkeleton key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={
            activeCategoryTab
              ? <Package className="h-10 w-10 text-muted-foreground/25" />
              : <Search className="h-10 w-10 text-muted-foreground/25" />
          }
          title={
            activeCategoryTab
              ? `No listings in ${activeCategoryTab.label} yet`
              : "No results found"
          }
          description={
            activeCategoryTab
              ? "Be the first to list something in this category, or check back later."
              : "Try different keywords or adjust your filters"
          }
          action={
            hasActiveFilters
              ? {
                  label: "View all listings",
                  onClick: () => onSetFilters(initialFilters),
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-12">
          <FeedSection
            title={hasActiveFilters ? "Results" : "Trending Near You"}
            listings={listings.slice(0, 8)}
            savedItems={savedItems}
            onCardClick={onCardClick}
            onSave={onSave}
          />
          {listings.length > 8 && !hasActiveFilters && (
            <FeedSection
              title="Recently Added"
              listings={listings.slice(8, 16)}
              savedItems={savedItems}
              onCardClick={onCardClick}
              onSave={onSave}
            />
          )}
          {listings.length > 16 && !hasActiveFilters && (
            <FeedSection
              title="More Near You"
              listings={listings.slice(16)}
              savedItems={savedItems}
              onCardClick={onCardClick}
              onSave={onSave}
            />
          )}
          {hasActiveFilters && listings.length > 8 && (
            <FeedSection
              title=""
              listings={listings.slice(8)}
              savedItems={savedItems}
              onCardClick={onCardClick}
              onSave={onSave}
            />
          )}

          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={onLoadMore}
                className="px-8 py-2.5 rounded-full border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FeedSection({
  title,
  listings,
  savedItems,
  onCardClick,
  onSave,
}: {
  title: string;
  listings: MarketplaceListing[];
  savedItems: string[];
  onCardClick: (id: string) => void;
  onSave: (id: string) => void;
}) {
  if (listings.length === 0) return null;
  return (
    <section>
      {title && (
        <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {listings.map(l => (
          <NexoraCard
            key={l.id}
            listing={l}
            isSaved={savedItems.includes(l.id)}
            onSave={onSave}
            onClick={onCardClick}
          />
        ))}
      </div>
    </section>
  );
}

function SavedView({
  listings,
  savedItems,
  onCardClick,
  onSave,
  onBack,
}: {
  listings: MarketplaceListing[];
  savedItems: string[];
  onCardClick: (id: string) => void;
  onSave: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="pb-16">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Marketplace
        </button>
      </div>
      <h1 className="font-display text-2xl font-black text-foreground mb-8">Saved</h1>
      {listings.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map(l => (
            <NexoraCard
              key={l.id}
              listing={l}
              isSaved
              onSave={onSave}
              onClick={onCardClick}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Heart className="h-8 w-8 text-muted-foreground/60" />}
          title="Nothing saved yet"
          description="Tap the heart on any listing to save it here for later"
        />
      )}
    </div>
  );
}

function OrdersView({ onBack }: { onBack: () => void }) {
  return (
    <div className="pb-16">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Marketplace
        </button>
      </div>
      <h1 className="font-display text-2xl font-black text-foreground mb-2">Orders</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Track your purchases from campus sellers.
      </p>
      <EmptyState
        icon={<ShoppingCart className="h-8 w-8 text-muted-foreground/60" />}
        title="No orders yet"
        description="Items you purchase from sellers will appear here"
      />
    </div>
  );
}

function HelpView({ onBack }: { onBack: () => void }) {
  const faqs = [
    {
      q: "How do I buy something?",
      a: "Browse listings, click one you like, and tap 'Message Seller' to connect with them.",
    },
    {
      q: "Is it safe to meet sellers?",
      a: "Always meet in well-lit public campus areas — library lobby, main canteen, admin block. Never go alone to a hostel room.",
    },
    {
      q: "Can I negotiate the price?",
      a: "If a listing shows the offer option, you can make a custom offer directly from the listing page.",
    },
    {
      q: "What if an item is misrepresented?",
      a: "Use the 'Report' button on the listing. Our moderation team reviews all reports within 24 hours and can suspend sellers.",
    },
    {
      q: "How do I list an item?",
      a: "Switch to 'Sell' mode using the Buy/Sell toggle in the top bar, then click 'New Listing'.",
    },
    {
      q: "Are payments handled on Nexora?",
      a: "Nexora is a discovery platform — payments happen directly between buyers and sellers in person on campus.",
    },
  ];

  return (
    <div className="pb-16 max-w-2xl">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Marketplace
        </button>
      </div>
      <h1 className="font-display text-2xl font-black text-foreground mb-1.5">Help Center</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Common questions about Nexora Marketplace.
      </p>
      <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border">
        {faqs.map((faq, i) => (
          <FAQItem key={i} question={faq.q} answer={faq.a} />
        ))}
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-foreground">{question}</span>
        <ChevronRight
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}



// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

function NavItem({
  icon: Icon,
  label,
  active,
  expanded,
  onClick,
  count,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  expanded: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      title={!expanded ? label : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-colors duration-150 ${
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {expanded && (
        <span className="flex-1 text-sm font-medium text-left truncate">{label}</span>
      )}
      {expanded && count !== undefined && count > 0 && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
            active ? "bg-background text-foreground" : "bg-secondary text-muted-foreground"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ModeButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
        active
          ? "bg-foreground text-background shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

