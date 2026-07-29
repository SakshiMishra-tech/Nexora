import {
  Plus,
  LayoutGrid,
  Archive,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  FileEdit,
  TrendingUp,
  BarChart3,
  MessageCircle,
  Bookmark,
  Sparkles,
  Tag,
  Package,
  Activity,
  Calendar,
  AlertCircle,
  Upload,
  MapPin,
  MoreHorizontal
} from "lucide-react";
import { useState, useMemo } from "react";
import { type MarketplaceListing, formatPrice, timeAgo } from "@/lib/marketplace";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SellerDashboardProps {
  listings: MarketplaceListing[];
  onPostItem: () => void;
  onEditItem: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkSold: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onViewItem?: (id: string) => void;
  onPublishDraft?: (id: string) => void;
  onArchiveItem?: (id: string) => void;
  onUnarchiveItem?: (id: string) => void;
}

function StatBox({ icon: Icon, value, label }: { icon: any, value: number, label: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-secondary/50 border border-border/50 text-center">
      <Icon className="h-4 w-4 text-muted-foreground mb-1" />
      <span className="font-black text-sm text-foreground">{value}</span>
      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}

function EmptyState({ tab, onPostItem }: { tab: string, onPostItem: () => void }) {
  const contentMap: Record<string, any> = {
    published: {
      icon: Package,
      title: "No published listings",
      desc: "Start selling to students around your campus.",
      action: true,
      color: "text-primary",
      bg: "bg-primary/10",
      ring: "ring-primary/20"
    },
    drafts: {
      icon: FileEdit,
      title: "No saved drafts",
      desc: "You don't have any incomplete listings.",
      action: false,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      ring: "ring-orange-500/20"
    },
    sold: {
      icon: CheckCircle,
      title: "No items sold yet",
      desc: "Items you mark as sold will appear here.",
      action: false,
      color: "text-success",
      bg: "bg-success/10",
      ring: "ring-success/20"
    },
    archived: {
      icon: Archive,
      title: "No archived items",
      desc: "Archived listings are hidden from buyers.",
      action: false,
      color: "text-muted-foreground",
      bg: "bg-secondary",
      ring: "ring-secondary/50"
    }
  };

  const content = contentMap[tab] || contentMap.published;

  const Icon = content.icon;

  return (
    <div className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-border/60 bg-card/30 py-24 px-4 text-center">
      <div className={`relative mb-6 grid h-24 w-24 place-items-center rounded-full ${content.bg} ${content.color} ring-8 ${content.ring}`}>
        <Icon className="h-10 w-10 opacity-80" />
      </div>
      <h3 className="font-display text-2xl font-black text-foreground mb-2">
        {content.title}
      </h3>
      <p className="max-w-xs text-sm font-semibold text-muted-foreground mb-8 leading-relaxed">
        {content.desc}
      </p>
      {content.action && (
        <Button onClick={onPostItem} className="h-12 rounded-full px-8 font-black shadow-glow transition-all hover:scale-105 active:scale-95">
          <Plus className="mr-2 h-5 w-5" />
          Create Listing
        </Button>
      )}
    </div>
  );
}

export function SellerDashboard({
  listings,
  onPostItem,
  onEditItem,
  onDelete,
  onMarkSold,
  onDuplicate,
  onViewItem,
  onPublishDraft,
  onArchiveItem,
  onUnarchiveItem,
}: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"published" | "drafts" | "sold" | "archived">("published");

  const chatMessagesCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    if (typeof window === "undefined") return counts;
    try {
      const localChats = localStorage.getItem("nexora_marketplace_chats");
      if (localChats) {
        const chats = JSON.parse(localChats);
        for (const chat of chats) {
          if (chat.listingId) {
            const realMsgs = chat.messages ? chat.messages.filter((m: any) => m.sender !== "system") : [];
            counts[chat.listingId] = realMsgs.length;
          }
        }
      }
    } catch (e) {
      console.error("Error parsing chats:", e);
    }
    return counts;
  }, [listings]);

  const activeListings = listings.filter((l) => l.status === "active");
  const soldListings = listings.filter((l) => l.status === "sold");
  const draftListings = listings.filter((l) => l.status === "draft");
  const archivedListings = listings.filter((l) => l.status === "archived");

  const getFilteredListings = () => {
    switch (activeTab) {
      case "published": return activeListings;
      case "drafts": return draftListings;
      case "sold": return soldListings;
      case "archived": return archivedListings;
      default: return activeListings;
    }
  };
  
  const displayedListings = getFilteredListings();

  const totalViews = useMemo(() => activeListings.reduce((sum, l) => sum + (l.views || 0), 0), [activeListings]);
  const totalSaves = useMemo(() => activeListings.reduce((sum, l) => sum + (l.saves || 0), 0), [activeListings]);
  const totalMessages = useMemo(() => Object.values(chatMessagesCountMap).reduce((sum, val) => sum + val, 0), [chatMessagesCountMap]);
  const totalOffers = useMemo(() => activeListings.reduce((sum, l) => sum + (l.offerCount || 0), 0), [activeListings]);

  const handleDeleteListingWithConfirm = (id: string) => {
    if (window.confirm("Are you sure you want to delete this listing? This will remove the listing and its uploaded images.")) {
      onDelete(id);
    }
  };

  const renderListingCard = (listing: MarketplaceListing) => {
    const isDraft = listing.status === "draft";
    const msgCount = chatMessagesCountMap[listing.id] || 0;

    const formattedCreated = new Date(listing.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    
    const imageUrl = listing.images && listing.images.length > 0 ? listing.images[0] : "";

    return (
      <div
        key={listing.id}
        className="group flex flex-col bg-card rounded-[1.5rem] border border-border/60 shadow-sm hover:shadow-soft transition-all duration-300 hover:-translate-y-1"
      >
        {/* Image Header with Badges */}
        <div className="relative aspect-[4/3] rounded-t-[1.5rem] overflow-hidden bg-muted cursor-pointer" onClick={() => !isDraft && onViewItem?.(listing.id)}>
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={listing.title} 
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <Package className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
          
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm backdrop-blur-md ${
              listing.status === "active" ? "bg-success/90 text-white" :
              listing.status === "draft" ? "bg-orange-500/90 text-white" :
              listing.status === "sold" ? "bg-primary/90 text-white" :
              "bg-secondary/90 text-muted-foreground"
            }`}>
              {listing.status}
            </span>
            {listing.condition && (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-background/85 text-foreground shadow-sm backdrop-blur-md">
                {listing.condition}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start gap-4 mb-2">
            <h3 className="font-bold text-foreground line-clamp-1 flex-1 text-sm sm:text-base cursor-pointer" onClick={() => !isDraft && onViewItem?.(listing.id)}>
              {listing.title || "Untitled Draft"}
            </h3>
            <span className="font-display font-black text-lg text-foreground whitespace-nowrap">
              {listing.price === 0 ? "Free" : formatPrice(listing.price)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-muted-foreground font-semibold mb-4">
            {listing.category && (
              <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5"/> {listing.category}</span>
            )}
            {listing.campus && (
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {listing.campus}</span>
            )}
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {formattedCreated}</span>
          </div>

          {/* Statistics row */}
          {!isDraft && (
            <div className="grid grid-cols-4 gap-2 py-3 border-y border-border/50 mb-4 mt-auto">
              <StatBox icon={Eye} value={listing.views || 0} label="Views" />
              <StatBox icon={Heart} value={listing.saves || 0} label="Saves" />
              <StatBox icon={MessageSquare} value={msgCount} label="Chats" />
              <StatBox icon={TrendingUp} value={listing.offerCount || 0} label="Offers" />
            </div>
          )}

          {isDraft && (
            <div className="mt-auto mb-4 border-t border-border/50 pt-4 pb-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Incomplete Draft</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-auto">
            {!isDraft && (
              <Button onClick={() => onViewItem?.(listing.id)} variant="secondary" className="flex-1 rounded-xl text-xs font-bold h-10 shadow-none border border-border/50">
                Preview
              </Button>
            )}
            <Button onClick={() => onEditItem(listing.id)} variant={isDraft ? "default" : "secondary"} className={`flex-1 rounded-xl text-xs font-bold h-10 shadow-none ${isDraft ? 'shadow-glow' : 'border border-border/50'}`}>
              {isDraft ? "Continue Editing" : "Edit"}
            </Button>
            
            {!isDraft && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="w-10 rounded-xl h-10 shadow-none border border-border/50 p-0 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 border-border/60 shadow-soft">
                  {listing.status === "active" && (
                    <DropdownMenuItem onClick={() => onMarkSold(listing.id)} className="rounded-xl font-semibold text-xs py-2.5 cursor-pointer">
                      <CheckCircle className="mr-2 h-4 w-4 text-success" /> Mark as Sold
                    </DropdownMenuItem>
                  )}
                  {listing.status === "active" && (
                    <DropdownMenuItem onClick={() => onArchiveItem?.(listing.id)} className="rounded-xl font-semibold text-xs py-2.5 cursor-pointer">
                      <Archive className="mr-2 h-4 w-4" /> Archive
                    </DropdownMenuItem>
                  )}
                  {(listing.status === "sold" || listing.status === "archived") && (
                    <DropdownMenuItem onClick={() => onUnarchiveItem?.(listing.id)} className="rounded-xl font-semibold text-xs py-2.5 cursor-pointer">
                      <Activity className="mr-2 h-4 w-4 text-primary" /> Reactivate Listing
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onDuplicate?.(listing.id)} className="rounded-xl font-semibold text-xs py-2.5 cursor-pointer">
                    <Copy className="mr-2 h-4 w-4" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteListingWithConfirm(listing.id)} className="rounded-xl font-semibold text-xs py-2.5 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 mt-1">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {isDraft && (
              <Button variant="outline" onClick={() => handleDeleteListingWithConfirm(listing.id)} className="w-10 rounded-xl h-10 border border-border/50 p-0 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const navItems = [
    { id: "published", label: "Published", count: activeListings.length },
    { id: "drafts", label: "Drafts", count: draftListings.length },
    { id: "sold", label: "Sold", count: soldListings.length },
    { id: "archived", label: "Archived", count: archivedListings.length },
  ] as const;

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6 pt-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-foreground tracking-tight">My Marketplace</h1>
          <p className="text-muted-foreground font-semibold mt-1.5 text-sm sm:text-base">Manage your campus listings, drafts and sales.</p>
        </div>
        <Button onClick={onPostItem} className="h-11 sm:h-12 rounded-full px-6 font-black shadow-glow shrink-0 transition-all hover:scale-105 active:scale-95">
          <Plus className="mr-2 h-5 w-5" /> Sell Item
        </Button>
      </div>

      {/* ── Analytics Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm relative overflow-hidden group hover:shadow-soft transition-all">
          <div className="absolute -right-2 -bottom-2 text-primary/5 transition-transform group-hover:scale-110 duration-500">
            <Eye className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Eye className="h-4 w-4" />
              </span>
              <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Total Views</p>
            </div>
            <p className="font-display text-4xl font-black text-foreground">{totalViews}</p>
          </div>
        </div>
        
        <div className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm relative overflow-hidden group hover:shadow-soft transition-all">
          <div className="absolute -right-2 -bottom-2 text-warm/5 transition-transform group-hover:scale-110 duration-500">
            <Heart className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-warm/10 text-warm-foreground">
                <Heart className="h-4 w-4" />
              </span>
              <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Saves</p>
            </div>
            <p className="font-display text-4xl font-black text-foreground">{totalSaves}</p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm relative overflow-hidden group hover:shadow-soft transition-all">
          <div className="absolute -right-2 -bottom-2 text-blue-500/5 transition-transform group-hover:scale-110 duration-500">
            <MessageSquare className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                <MessageSquare className="h-4 w-4" />
              </span>
              <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Messages</p>
            </div>
            <p className="font-display text-4xl font-black text-foreground">{totalMessages}</p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm relative overflow-hidden group hover:shadow-soft transition-all">
          <div className="absolute -right-2 -bottom-2 text-success/5 transition-transform group-hover:scale-110 duration-500">
            <Activity className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-success/10 text-success">
                <Activity className="h-4 w-4" />
              </span>
              <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Offers</p>
            </div>
            <p className="font-display text-4xl font-black text-foreground">{totalOffers}</p>
          </div>
        </div>
      </div>

      {/* ── Premium Tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 mt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-border/40">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex shrink-0 items-center gap-2.5 px-4 py-3 text-sm font-black transition-all border-b-2 ${
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <span>{item.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black transition-colors ${
                isActive ? "bg-foreground text-background shadow-sm" : "bg-secondary text-muted-foreground"
              }`}>
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Center Content Area ── */}
      <div className="w-full flex flex-col gap-6 pt-4">
        {displayedListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayedListings.map((listing) => renderListingCard(listing))}
          </div>
        ) : (
          <EmptyState tab={activeTab} onPostItem={onPostItem} />
        )}
      </div>
    </div>
  );
}
