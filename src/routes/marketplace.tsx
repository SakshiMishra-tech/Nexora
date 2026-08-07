import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Plus, Search, MapPin, SlidersHorizontal, Heart, MessageSquare, ShoppingBag, UserRound,
  Laptop, BookOpen, Bike, BedDouble, Armchair, Gamepad2, Microscope, NotebookPen, Shirt, Trophy, PencilRuler, Gift, Package, X, ChevronDown, ArrowLeft
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { ModuleAccessBoundary } from "@/components/ModuleAccessControl";
import { FilterDrawer } from "@/components/marketplace/FilterDrawer";
import { ProductCard, ProductCardSkeleton } from "@/components/marketplace/ProductCard";
import { ListingDetail } from "@/components/marketplace/ListingDetail";
import { SellerDashboard } from "@/components/marketplace/SellerDashboard";
import { SellItemForm } from "@/components/marketplace/SellItemForm";
import { MarketplaceChat } from "@/components/marketplace/MarketplaceChat";
import { useMarketplace } from "@/hooks/useMarketplace";
import { initialFilters, listingToFormValues } from "@/lib/marketplace";
import type { MarketplaceFilters, MarketplaceListing } from "@/lib/marketplace";
import { createChat } from "@/services/marketplace.service";

export const Route = createFileRoute("/marketplace")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: search.id as string | undefined,
    view: search.view as string | undefined,
  }),
  head: () => ({ meta: [{ title: "Nexora — Campus Marketplace" }] }),
  component: MarketplaceRoute,
});

const ICON_MAP: Record<string, any> = {
  All: ShoppingBag,
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

const CATEGORIES = [
  "Books", "Electronics", "Cycles", "Hostel Essentials", "Fashion", "Notes", "Academic", "Gaming"
];

const DEMO_LISTINGS = [
  {
    id: "demo-cycle",
    title: "Hero Sprint 26T Cycle",
    price: 3200,
    condition: "USED" as const,
    category: "Cycles",
    image: "/product_cycle.png",
    seller: "Rahul K.",
    campus: "Delhi Technological University",
    desc: "6-month-old Hero Sprint cycle. Slightly used, good condition. Disc brakes, 21 gears. Selling as I got a hostel nearby.",
  },
  {
    id: "demo-laptop",
    title: "Dell Inspiron 15 (i5, 8GB RAM)",
    price: 28000,
    condition: "USED" as const,
    category: "Electronics",
    image: "/product_laptop.png",
    seller: "Priya M.",
    campus: "NSUT West Campus",
    desc: "2021 Dell Inspiron. 256GB SSD + 1TB HDD. Perfect for coding and assignments. Charger included. Minor cosmetic scratch.",
  },
  {
    id: "demo-mouse",
    title: "Logitech G304 Wireless Mouse",
    price: 1100,
    condition: "LIKE NEW" as const,
    category: "Electronics",
    image: "/product_mouse.png",
    seller: "Arjun S.",
    campus: "Amity Noida",
    desc: "Barely used for 2 months. Comes with USB receiver and original box. Battery life is great — lasts weeks.",
  },
] as const;

function MarketplaceRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    listings, sellerListings, savedItems, recentlyViewed, filters, setFilters,
    activeView, setActiveView, toggleSaveItem, viewListing, goBack, selectedListing,
    isDetailLoading, saveListing, duplicateListing, deleteListing, markListingStatus,
    isLoading: marketplaceLoading, error: marketplaceError, currentUserId,
  } = useMarketplace(search, navigate);

  const [bootLoading, setBootLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setBootLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const loading = bootLoading || marketplaceLoading || isDetailLoading;

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    setFilters((f) => ({ ...f, query: q }));
  }, [setFilters]);

  const handleCategorySelect = useCallback((cat: string) => {
    setFilters((f) => ({ ...f, category: [cat as any] }));
  }, [setFilters]);

  const hasActiveFilters = filters.category.length > 0 || filters.condition.length > 0 || filters.campus.length > 0 || filters.minPrice > 0 || filters.maxPrice < 60000;

  // Filter listings based on category selection
  const visibleListings = listings.filter(l => {
     if (filters.category.length > 0 && !filters.category.includes(l.category as any)) return false;
     if (filters.query && !l.title.toLowerCase().includes(filters.query.toLowerCase())) return false;
     return true;
  });

  const savedListings = listings.filter(l => savedItems.includes(l.id));

  // Edit form initial values
  const editInitialValues = useMemo(() => {
    if (!editingId) return undefined;
    const l = sellerListings.find((x) => x.id === editingId) ?? listings.find((x) => x.id === editingId);
    if (!l) return undefined;
    return listingToFormValues(l);
  }, [editingId, sellerListings, listings]);

  return (
    <ModuleAccessBoundary moduleId="marketplace">
      <div className="flex min-h-screen bg-background text-foreground relative">
        
        {/* ── LEFT SIDEBAR ── */}
        <aside className="fixed left-0 top-0 z-50 flex h-screen w-[72px] flex-col overflow-hidden border-r border-border bg-paper transition-all duration-300 hover:w-[260px] group shadow-sm">
          <Link to="/" className="flex h-16 shrink-0 items-center px-4 pt-4 mb-2 group/logo hover:opacity-80 transition-opacity cursor-pointer">
             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft transition-transform group-hover/logo:-translate-x-1">
               <ArrowLeft className="h-5 w-5" />
             </div>
             <span className="ml-4 whitespace-nowrap font-display text-lg font-black opacity-0 transition-opacity duration-300 group-hover:opacity-100">
               Dashboard
             </span>
          </Link>

          <nav className="mt-4 flex flex-col gap-2 px-3">
            <SidebarItem icon={ShoppingBag} label="Browse" active={activeView === "browse"} onClick={() => setActiveView("browse")} />
            <SidebarItem icon={Heart} label="Saved" active={activeView === "saved"} onClick={() => setActiveView("saved")} count={savedItems.length} />
            <SidebarItem icon={UserRound} label="My Listings" active={activeView === "seller"} onClick={() => setActiveView("seller")} count={sellerListings.length} />
            <SidebarItem icon={MessageSquare} label="Chats" active={activeView === "chats"} onClick={() => setActiveView("chats")} />
          </nav>

          <div className="mt-8 flex-1 overflow-y-auto px-3 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <h4 className="mb-3 ml-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Categories
            </h4>
            <div className="flex flex-col gap-1">
              {CATEGORIES.map(c => {
                const Icon = ICON_MAP[c] || Package;
                const isActive = filters.category.includes(c as any);
                return (
                  <button
                    key={c}
                    onClick={() => {
                      handleCategorySelect(c);
                      setActiveView("browse");
                    }}
                    className={`flex h-10 w-full items-center rounded-xl px-3 text-left transition-colors ${isActive ? 'bg-secondary text-foreground font-bold shadow-soft' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground font-medium'}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="ml-4 whitespace-nowrap text-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {c}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto p-4 bg-paper/90 backdrop-blur border-t border-border/50">
            <button
              onClick={() => { setEditingId(undefined); setSellOpen(true); }}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground text-background shadow-soft transition-transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5 shrink-0" />
              <span className="ml-3 whitespace-nowrap font-black opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Sell Item
              </span>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 ml-[72px] min-h-screen relative max-w-full">
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
                     if (newChat?.id) setActiveChatId(newChat.id);
                     setActiveView("chats");
                   } catch(e) {
                     setActiveView("chats");
                   }
                 }
               }}
               onReport={() => {}}
               relatedListings={[]}
               onViewRelated={viewListing}
               savedItems={savedItems}
               recentlyViewedListings={[]}
             />
          ) : activeView === "chats" ? (
             <div className="p-4 h-screen w-full">
               <MarketplaceChat
                 onBackToBrowse={() => { setActiveView("browse"); setActiveChatId(null); }}
                 listings={listings}
                 initialChatId={activeChatId}
                 currentUserId={currentUserId}
               />
             </div>
          ) : activeView === "seller" ? (
             <div className="p-6 max-w-7xl mx-auto">
               <SellerDashboard
                 listings={sellerListings}
                 onPostItem={() => { setEditingId(undefined); setSellOpen(true); }}
                 onEditItem={(id) => { setEditingId(id); setSellOpen(true); }}
                 onDelete={handleDeleteListing}
                 onMarkSold={(id) => markListingStatus(id, "sold")}
                 onViewItem={viewListing}
                 onPublishDraft={() => {}}
                 onDuplicate={duplicateListing}
                 onArchiveItem={(id) => markListingStatus(id, "archived")}
                 onUnarchiveItem={(id) => markListingStatus(id, "active")}
               />
               {sellerListings.length === 0 && (
                 <div className="mt-8 flex flex-col items-center text-center p-12 bg-card rounded-[2rem] border border-border/60 shadow-sm">
                   <div className="h-20 w-20 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center mb-6">
                     <Package className="h-10 w-10" />
                   </div>
                   <h3 className="font-display text-2xl font-black">No listings yet.</h3>
                   <p className="text-muted-foreground mt-2 max-w-md font-medium">Your inventory is empty. Be the first verified student to post something to your campus marketplace.</p>
                   <button onClick={() => { setEditingId(undefined); setSellOpen(true); }} className="mt-8 px-8 py-3.5 bg-foreground text-background font-black rounded-full shadow-soft hover:-translate-y-1 transition-all duration-300">
                     Sell Your First Item
                   </button>
                 </div>
               )}
             </div>
          ) : (
             <div className="mx-auto max-w-6xl px-6 py-8">
                {/* Top Search Bar */}
                {(activeView === "browse" || activeView === "saved") && (
                  <div className="sticky top-0 z-30 -mx-6 mb-8 flex flex-col gap-3 sm:flex-row sm:items-center bg-background/95 px-6 pt-6 pb-4 backdrop-blur border-b border-border shadow-sm">
                    <div className="flex flex-1 items-center gap-3 rounded-2xl bg-secondary/50 px-4 py-3 border border-border focus-within:border-primary/50 focus-within:bg-background focus-within:shadow-soft transition-all">
                      <Search className="h-5 w-5 shrink-0 text-primary" />
                      <input
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground"
                        placeholder="Search laptops, books, cycles..."
                      />
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <label className="flex items-center rounded-2xl bg-background px-4 border border-border shadow-sm">
                        <MapPin className="mr-2 h-4 w-4 shrink-0 text-primary" />
                        <select
                          value={filters.campus[0] ?? "All campuses"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFilters(f => ({ ...f, campus: val === "All campuses" ? [] : [val] }));
                          }}
                          className="appearance-none bg-transparent py-3 pr-4 text-sm font-black outline-none"
                        >
                          <option>All campuses</option>
                          <option>Main Campus</option>
                          <option>North Campus</option>
                          <option>South Campus</option>
                        </select>
                        <ChevronDown className="pointer-events-none h-4 w-4 text-muted-foreground" />
                      </label>
                      <button onClick={() => setFilterOpen(true)} className="flex items-center gap-2 rounded-2xl bg-background px-5 py-3 border border-border shadow-sm font-black hover:bg-secondary transition-colors">
                        <SlidersHorizontal className="h-4 w-4" /> Filter
                      </button>
                    </div>
                  </div>
                )}

                {/* Active Filter Chips */}
                {hasActiveFilters && (
                  <div className="mb-8 flex flex-wrap gap-2">
                     {filters.category.map(c => (
                        <span key={c} className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold border border-border/50">
                           {c} <button onClick={() => setFilters(f => ({...f, category: f.category.filter(x => x !== c)}))}><X className="h-3 w-3"/></button>
                        </span>
                     ))}
                     <button onClick={() => setFilters(initialFilters)} className="text-xs font-bold text-muted-foreground hover:text-foreground px-2">Clear filters</button>
                  </div>
                )}

                {/* Browse View */}
                {activeView === "browse" && (
                  <div className="space-y-10">
                    {/* Featured */}
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="font-display text-2xl font-black text-foreground">Featured Listings ✨</h2>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {DEMO_LISTINGS.map(item => (
                          <div key={item.id} className="group overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-soft hover:-translate-y-1 hover:shadow-mega transition-all duration-300 flex flex-col">
                            <div className="relative h-56 bg-secondary overflow-hidden shrink-0">
                              <img src={item.image} alt={item.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <span className="absolute left-4 top-4 rounded-full bg-foreground px-3 py-1 text-[10px] font-black text-background uppercase tracking-widest shadow-sm">
                                {item.condition}
                              </span>
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                              <h3 className="font-bold text-foreground text-lg leading-tight">{item.title}</h3>
                              <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{item.desc}</p>
                              <div className="mt-auto pt-4 flex items-center justify-between">
                                <span className="font-black text-xl">₹{item.price.toLocaleString("en-IN")}</span>
                                <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary uppercase">{item.category}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DB Listings or Empty State */}
                    {loading ? (
                       <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"><ProductCardSkeleton /><ProductCardSkeleton /><ProductCardSkeleton /></div>
                    ) : visibleListings.length > 0 ? (
                       <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                         {visibleListings.map(l => (
                            <ProductCard key={l.id} listing={l} isSaved={savedItems.includes(l.id)} onSave={toggleSaveItem} onClick={viewListing} onChat={()=>{}} />
                         ))}
                       </div>
                    ) : (
                       <div className="mt-12 flex flex-col items-center justify-center py-20 px-6 text-center rounded-[2.5rem] border border-border bg-card/50">
                         <div className="mb-6 h-20 w-20 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center">
                           <ShoppingBag className="h-10 w-10" />
                         </div>
                         <h3 className="font-display text-2xl font-black text-foreground">No listings yet</h3>
                         <p className="mt-3 text-muted-foreground font-medium max-w-sm leading-relaxed">
                           You've reached the end! Be the first verified student to post something to your campus marketplace.
                         </p>
                         <button onClick={() => { setEditingId(undefined); setSellOpen(true); }} className="mt-8 px-8 py-3.5 bg-foreground text-background font-black rounded-full shadow-soft hover:-translate-y-1 transition-all duration-300">
                           Sell an Item
                         </button>
                       </div>
                    )}
                  </div>
                )}

                {/* Saved View */}
                {activeView === "saved" && (
                  <div>
                    <h2 className="font-display text-3xl font-black mb-8 text-foreground">Saved Items</h2>
                    {savedListings.length > 0 ? (
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {savedListings.map(l => (
                           <ProductCard key={l.id} listing={l} isSaved={true} onSave={toggleSaveItem} onClick={viewListing} onChat={()=>{}} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-24 px-6 text-center rounded-[2.5rem] border border-border bg-card/50">
                        <div className="h-24 w-24 rounded-full bg-warm/10 flex items-center justify-center mb-6">
                           <Heart className="h-10 w-10 text-warm" />
                        </div>
                        <h3 className="font-display text-2xl font-black">Nothing saved yet</h3>
                        <p className="text-muted-foreground mt-3 font-medium max-w-sm leading-relaxed">
                           Click the heart icon on any listing you love to save it here for later.
                        </p>
                      </div>
                    )}
                  </div>
                )}
             </div>
          )}
        </main>

        <FilterDrawer open={filterOpen} onOpenChange={setFilterOpen} filters={filters} onFilterChange={setFilters} />
        <SellItemForm open={sellOpen} onOpenChange={setSellOpen} initialValues={editInitialValues} onSubmit={async (v, d) => { await saveListing(v, d?"draft":"active", editingId); }} />
      </div>
    </ModuleAccessBoundary>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick, count }: { icon: any, label: string, active: boolean, onClick: () => void, count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`group/item relative flex h-[44px] w-full items-center rounded-xl px-3 transition-colors ${active ? 'bg-foreground text-background shadow-soft' : 'text-muted-foreground hover:bg-secondary hover:text-foreground font-semibold'}`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="ml-4 whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex-1 text-left text-sm font-bold">
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-black opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${active ? 'bg-background text-foreground' : 'bg-primary text-primary-foreground'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

