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
  MoreHorizontal,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight
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

export function SellerDashboard({
  listings = [],
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

  // Filter listings
  const activeListings = listings.filter((l) => l.status === "active");
  const soldListings = listings.filter((l) => l.status === "sold");
  const draftListings = listings.filter((l) => l.status === "draft");
  const archivedListings = listings.filter((l) => l.status === "archived");

  const displayedListings = useMemo(() => {
    switch (activeTab) {
      case "published": return activeListings;
      case "drafts": return draftListings;
      case "sold": return soldListings;
      case "archived": return archivedListings;
      default: return activeListings;
    }
  }, [activeTab, activeListings, soldListings, draftListings, archivedListings]);

  const handleDeleteConfirm = (id: string) => {
    if (window.confirm("Are you sure you want to delete this listing permanently?")) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-6 w-full pb-16">
      
      {/* ── Minimalist Clean Header Row ── */}
      <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-black font-display text-foreground tracking-tight">My Marketplace</h1>
          <p className="text-xs text-muted-foreground font-semibold mt-1">Manage your campus listings, drafts, and sales.</p>
        </div>
        <button
          onClick={onPostItem}
          className="flex items-center gap-1.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 text-xs font-black shadow-soft hover:-translate-y-0.5 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Sell Item</span>
        </button>
      </div>

      {/* ── Premium Tabbed Table Area ── */}
      <div className="border border-border/70 rounded-2xl bg-card overflow-hidden shadow-soft">
        
        {/* Navigation Tabs Header */}
        <div className="border-b border-border/60 bg-muted/30 px-6 py-2 flex items-center justify-between overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-1.5">
            {[
              { id: "published", label: "Published", count: activeListings.length },
              { id: "drafts", label: "Drafts", count: draftListings.length },
              { id: "sold", label: "Sold", count: soldListings.length },
              { id: "archived", label: "Archived", count: archivedListings.length },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black transition-all border-b-2 -mb-2 ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                    active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Listing Inventory List / Table */}
        <div className="overflow-x-auto">
          {displayedListings.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-muted/10">
                  <th className="py-3 px-6">Item Info</th>
                  <th className="py-3 px-6">Condition</th>
                  <th className="py-3 px-6">Price</th>
                  <th className="py-3 px-6">Date Added</th>
                  {activeTab !== "drafts" && <th className="py-3 px-6">Stats (Views / Saves)</th>}
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {displayedListings.map((listing) => {
                  const img = listing.images && listing.images.length > 0 ? listing.images[0] : "";
                  const formattedDate = new Date(listing.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  });

                  return (
                    <tr key={listing.id} className="group hover:bg-secondary/20 transition-colors text-xs font-semibold">
                      {/* Product Info */}
                      <td className="py-4.5 px-6 flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl border border-border/80 bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                          {img ? (
                            <img src={img} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground/45" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            onClick={() => listing.status !== "draft" && onViewItem?.(listing.id)}
                            className="font-black text-foreground truncate cursor-pointer hover:underline"
                          >
                            {listing.title || "Untitled Draft"}
                          </p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Tag className="h-3 w-3" /> {listing.category || "Uncategorized"}
                          </p>
                        </div>
                      </td>

                      {/* Condition */}
                      <td className="py-4.5 px-6">
                        <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 text-[10px] font-black text-foreground uppercase tracking-wide">
                          {listing.condition || "Used"}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4.5 px-6 font-display font-black text-sm">
                        {listing.price === 0 ? "Free" : formatPrice(listing.price)}
                      </td>

                      {/* Date */}
                      <td className="py-4.5 px-6 text-muted-foreground">
                        {formattedDate}
                      </td>

                      {/* Stats */}
                      {activeTab !== "drafts" && (
                        <td className="py-4.5 px-6">
                          <div className="flex gap-3 text-muted-foreground">
                            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {listing.views || 0}</span>
                            <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {listing.saves || 0}</span>
                          </div>
                        </td>
                      )}

                      {/* Actions */}
                      <td className="py-4.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            onClick={() => onEditItem(listing.id)}
                            variant="secondary"
                            className="h-8.5 rounded-lg px-3 text-xs font-black border border-border/50 shadow-none"
                          >
                            Edit
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="secondary"
                                className="h-8.5 w-8.5 rounded-lg border border-border/50 p-0 shadow-none flex items-center justify-center"
                              >
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 border-border shadow-soft">
                              {listing.status === "active" && (
                                <DropdownMenuItem onClick={() => onMarkSold(listing.id)} className="rounded-lg font-black text-xs py-2 cursor-pointer">
                                  <CheckCircle className="mr-2 h-4 w-4 text-success" /> Mark as Sold
                                </DropdownMenuItem>
                              )}
                              {listing.status === "active" && (
                                <DropdownMenuItem onClick={() => onArchiveItem?.(listing.id)} className="rounded-lg font-semibold text-xs py-2 cursor-pointer">
                                  <Archive className="mr-2 h-4 w-4" /> Archive
                                </DropdownMenuItem>
                              )}
                              {(listing.status === "sold" || listing.status === "archived") && (
                                <DropdownMenuItem onClick={() => onUnarchiveItem?.(listing.id)} className="rounded-lg font-semibold text-xs py-2 cursor-pointer">
                                  <Activity className="mr-2 h-4 w-4 text-primary" /> Reactivate
                                </DropdownMenuItem>
                              )}
                              {onDuplicate && (
                                <DropdownMenuItem onClick={() => onDuplicate(listing.id)} className="rounded-lg font-semibold text-xs py-2 cursor-pointer">
                                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDeleteConfirm(listing.id)}
                                className="rounded-lg font-black text-xs py-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 border-t border-border/40 mt-1"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 px-4">
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-4">
                <Package className="h-7 w-7" />
              </div>
              <h4 className="font-display text-lg font-black text-foreground">
                No items here yet
              </h4>
              <p className="max-w-xs text-xs text-muted-foreground mt-1 leading-relaxed">
                Add a new campus listing to start tracking clicks, views, and offers!
              </p>
              {activeTab === "published" && (
                <button
                  onClick={onPostItem}
                  className="mt-4 flex items-center gap-1 text-xs font-black text-primary hover:underline"
                >
                  <span>Post Listing</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
