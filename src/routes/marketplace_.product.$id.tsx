import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Heart, 
  MapPin, 
  MessageSquare, 
  Share2, 
  ShieldCheck, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  Star,
  Tag,
  CheckCircle2,
  CalendarDays,
  ShoppingBag,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { useMarketplace } from "@/hooks/useMarketplace";
import { NexoraLogo } from "@/components/brand/NexoraLogo";
import { MarketplaceListing } from "@/lib/marketplace";

export const Route = createFileRoute("/marketplace_/product/$id")({
  head: () => ({ meta: [{ title: "Nexora — Product Details" }] }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { selectedListing: listing, isDetailLoading: isLoading, savedItems, toggleSaveItem, listings } = useMarketplace({ id });
  
  const [activeImage, setActiveImage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isSaved = listing ? savedItems.includes(listing.id) : false;

  const toggleSave = () => {
    if (!listing) return;
    toggleSaveItem(listing.id);
    toast.success(!isSaved ? "Saved to Wishlist" : "Removed from Wishlist");
  };

  const handleChat = () => {
    if (!listing) return;
    navigate({ to: "/marketplace/chat/$id", params: { id: listing.id } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 pt-24 animate-pulse">
        <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 bg-background border-b border-border/50">
          <div className="h-8 w-24 bg-secondary/50 rounded-lg"></div>
        </header>
        <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row gap-6">
          <div className="lg:w-[65%] space-y-4">
            <div className="w-full h-[400px] bg-secondary/50 rounded-2xl"></div>
            <div className="flex gap-2">
              <div className="h-20 w-28 bg-secondary/50 rounded-lg"></div>
              <div className="h-20 w-28 bg-secondary/50 rounded-lg"></div>
            </div>
          </div>
          <div className="lg:w-[35%] space-y-6">
            <div className="h-8 bg-secondary/50 rounded w-3/4"></div>
            <div className="h-10 bg-secondary/50 rounded w-1/4"></div>
            <div className="h-32 bg-secondary/50 rounded-xl"></div>
            <div className="h-14 bg-secondary/50 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-foreground">Product Not Found</h1>
        <p className="text-muted-foreground mb-6">This listing may have been removed or sold.</p>
        <Link to="/marketplace" className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const hasImages = listing.images && listing.images.length > 0;
  const currentImage = hasImages ? listing.images[activeImage] : null;

  // Find similar products
  const similarProducts = listings
    .filter(l => l.category === listing.category && l.id !== listing.id)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* ── TOPBAR ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 sm:px-6 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-4">
          <Link to="/marketplace" className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary/50 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="hidden sm:block">
            <NexoraLogo size="sm" />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied to clipboard");
            }}
            className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary/50 hover:bg-secondary transition-colors text-foreground"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 relative">
          
          {/* LEFT COLUMN (65%) */}
          <div className="lg:w-[65%] flex flex-col gap-6">
            
            {/* Gallery */}
            <div className="flex flex-col gap-3">
              {/* Main Image */}
              <div 
                className="relative w-full h-[350px] sm:h-[450px] bg-card rounded-2xl overflow-hidden border border-border/50 group cursor-pointer shadow-sm"
                onClick={() => setIsFullscreen(true)}
              >
                {hasImages ? (
                  <img 
                    src={currentImage!} 
                    alt={listing.title} 
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-card">
                    <Tag className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <span className="text-muted-foreground font-semibold">No Image Provided</span>
                  </div>
                )}
                
                {/* Fullscreen Hint */}
                {hasImages && (
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to enlarge
                  </div>
                )}

                {/* Nav Buttons */}
                {hasImages && listing.images.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveImage(p => Math.max(0, p - 1)) }}
                      disabled={activeImage === 0}
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 border border-border/50 backdrop-blur-md flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 hover:bg-background shadow-lg"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveImage(p => Math.min(listing.images.length - 1, p + 1)) }}
                      disabled={activeImage === listing.images.length - 1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 border border-border/50 backdrop-blur-md flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 hover:bg-background shadow-lg"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {hasImages && listing.images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
                  {listing.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative h-16 sm:h-20 aspect-[4/3] rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                        activeImage === idx 
                          ? "border-primary" 
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* About this Item */}
            <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
              <h2 className="text-xl font-bold mb-5 font-display">About this Item</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-6 mb-6 pb-6 border-b border-border/50">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Category</span>
                  <span className="font-bold text-sm">{listing.category}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Condition</span>
                  <span className="font-bold text-sm">{listing.condition}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Listed</span>
                  <span className="font-bold text-sm">{new Date(listing.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Views</span>
                  <span className="font-bold text-sm">{listing.views}</span>
                </div>
              </div>

              <div className="prose prose-sm prose-invert max-w-none text-muted-foreground leading-relaxed">
                {listing.description.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-3">{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Seller Reviews Empty State */}
            <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/50 shadow-sm text-center">
              <h2 className="text-xl font-bold mb-4 font-display text-left">Seller Reviews</h2>
              <div className="py-8 flex flex-col items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                  <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-bold mb-1">No reviews yet</h3>
                <p className="text-sm text-muted-foreground">This seller hasn't received any reviews on Nexora yet.</p>
              </div>
            </div>

            {/* Similar Products */}
            {similarProducts.length > 0 && (
              <div className="pt-2 pb-8">
                <h2 className="text-xl font-bold mb-4 font-display">You May Also Like</h2>
                <div className="flex overflow-x-auto gap-4 pb-4 [scrollbar-width:none]">
                  {similarProducts.map((prod) => (
                    <Link 
                      key={prod.id}
                      to="/marketplace/product/$id"
                      params={{ id: prod.id }}
                      className="w-56 shrink-0 flex flex-col rounded-xl overflow-hidden border border-border/50 bg-card group hover:border-primary/50 transition-colors shadow-sm"
                    >
                      <div className="aspect-[4/3] bg-secondary/30 overflow-hidden relative">
                        {prod.images && prod.images.length > 0 ? (
                          <img src={prod.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tag className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold">
                          {prod.condition}
                        </div>
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <h4 className="font-bold text-sm line-clamp-1 mb-1 group-hover:text-primary transition-colors">{prod.title}</h4>
                        <div className="font-black text-base text-emerald-400 mb-2">₹{prod.price.toLocaleString("en-IN")}</div>
                        <div className="mt-auto flex items-center text-[11px] text-muted-foreground gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{prod.campus || "Nexora Main"}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (35%) - Dynamic Info Panel */}
          <div className="lg:w-[35%] flex flex-col gap-6 relative">
            
            {/* Price & Actions Card */}
            <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded bg-primary/10 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                  {listing.category}
                </span>
                <span className="px-2.5 py-1 rounded bg-secondary text-[10px] font-bold uppercase tracking-wider text-foreground border border-border/50">
                  {listing.condition}
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight mb-3 text-foreground leading-[1.2]">
                {listing.title}
              </h1>
              
              <div className="flex items-center gap-3 mb-5">
                <span className="text-3xl font-black text-emerald-400">
                  ₹{listing.price.toLocaleString("en-IN")}
                </span>
                {listing.isNegotiable && (
                  <span className="text-[11px] font-bold text-muted-foreground bg-secondary/50 px-2 py-1 rounded border border-border/50">
                    Negotiable
                  </span>
                )}
              </div>

              {/* Action CTA */}
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleChat}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-base transition-all hover:-translate-y-0.5"
                >
                  <MessageSquare className="h-5 w-5" />
                  Chat Seller
                </button>

                <button 
                  onClick={toggleSave}
                  className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm transition-all border ${
                    isSaved 
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20" 
                      : "bg-secondary/30 border-border/50 text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isSaved ? "fill-rose-500" : ""}`} />
                  {isSaved ? "Saved to Wishlist" : "Save Item"}
                </button>
              </div>

              {/* Info Snippets */}
              <div className="mt-6 space-y-3 pt-6 border-t border-border/50">
                <div className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Verified Nexora Student
                </div>
                <div className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Listed {new Date(listing.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
                  <Eye className="h-4 w-4 text-purple-500" />
                  {listing.views} people viewed this
                </div>
              </div>
            </div>

            {/* Seller Card (Moved to Right) */}
            <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4 font-display">Seller Information</h2>
              
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={listing.sellerAvatar || `https://ui-avatars.com/api/?name=${listing.sellerName}&background=4f46e5&color=fff`} 
                  alt={listing.sellerName}
                  className="h-14 w-14 rounded-full border border-border/50 shadow-sm object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="text-base font-bold text-foreground">{listing.sellerName}</h3>
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex items-center text-[11px] font-medium text-muted-foreground">
                    <Star className="h-3 w-3 mr-1 text-amber-500 fill-amber-500" />
                    {listing.sellerRating} Rating
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4 pt-4 border-t border-border/50">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 mr-2" />
                  Joined 2024
                </div>
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  <ShoppingBag className="h-3.5 w-3.5 mr-2" />
                  12 Active Listings
                </div>
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 mr-2 text-yellow-500" />
                  Usually responds inside an hour
                </div>
              </div>

              <Link 
                to="/marketplace/seller/$id"
                params={{ id: listing.sellerId }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary/30 hover:bg-secondary/50 border border-border/50 text-foreground rounded-xl font-bold text-sm transition-colors"
              >
                View Profile
              </Link>
            </div>

            {/* Safety Tips (Moved to Right) */}
            <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-bold font-display text-emerald-500">Safety Tips</h2>
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium text-foreground/80 leading-relaxed">Meet in well-lit, public locations (e.g. Library).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium text-foreground/80 leading-relaxed">Verify the item's condition in person.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium text-foreground/80 leading-relaxed">Avoid making advance payments via UPI.</span>
                </li>
              </ul>
            </div>
            
          </div>
          
        </div>
      </main>

      {/* Fullscreen Image Overlay */}
      {isFullscreen && hasImages && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="absolute top-6 right-6 z-[101]">
            <button className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold backdrop-blur-md transition-colors border border-white/10">
              Close (Esc)
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 sm:p-12">
            <img 
              src={currentImage!} 
              alt="Fullscreen view" 
              className="max-w-full max-h-full object-contain select-none shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
