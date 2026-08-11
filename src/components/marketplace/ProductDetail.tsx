import {
  AlertOctagon,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  MapPin,
  MessageSquare,
  Package,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type MarketplaceListing, timeAgo, formatPrice } from "@/lib/marketplace";

interface ProductDetailProps {
  listing: MarketplaceListing;
  isSaved: boolean;
  onSave: (id: string) => void;
  onBack: () => void;
  onChat: (id: string) => void;
  onViewSeller?: (sellerId: string) => void;
}

export function ProductDetail({
  listing,
  isSaved,
  onSave,
  onBack,
  onChat,
  onViewSeller,
}: ProductDetailProps) {
  const [activeImg, setActiveImg] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const isSold = listing.status === "sold";
  const isFree = listing.price === 0;
  const images = listing.images.length > 0 ? listing.images : [];
  const hasImages = images.length > 0 && !imgErrors[activeImg];

  const goNext = () => setActiveImg(i => Math.min(i + 1, images.length - 1));
  const goPrev = () => setActiveImg(i => Math.max(i - 1, 0));

  return (
    <div className="min-h-screen bg-background">
      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Back + Save row */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            onClick={() => onSave(listing.id)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-150 ${
              isSaved
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-foreground border-border hover:border-foreground/30"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {isSaved ? "Saved" : "Save"}
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12 items-start">

          {/* LEFT — Gallery */}
          <div className="space-y-3 lg:sticky lg:top-[72px]">
            {/* Main image */}
            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-muted">
              {hasImages ? (
                <img
                  src={images[activeImg]}
                  alt={listing.title}
                  onError={() => setImgErrors(prev => ({ ...prev, [activeImg]: true }))}
                  className={`h-full w-full object-cover transition-opacity duration-300 ${
                    isSold ? "opacity-60 grayscale" : "opacity-100"
                  }`}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                  <Package className="h-12 w-12 text-muted-foreground/25" />
                  <span className="text-sm text-muted-foreground">No image</span>
                </div>
              )}

              {isSold && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full bg-foreground/90 px-6 py-2 text-sm font-bold text-background tracking-widest uppercase">
                    Sold
                  </span>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    disabled={activeImg === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-background border border-border shadow-sm disabled:opacity-25 hover:bg-secondary transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={goNext}
                    disabled={activeImg === images.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-background border border-border shadow-sm disabled:opacity-25 hover:bg-secondary transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <span className="absolute bottom-3 right-3 rounded-full bg-foreground/70 px-2.5 py-1 text-[11px] font-semibold text-background">
                    {activeImg + 1} / {images.length}
                  </span>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150 ${
                      activeImg === i
                        ? "border-foreground opacity-100"
                        : "border-transparent opacity-50 hover:opacity-75"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description — desktop only, shown under gallery */}
            <div className="hidden lg:block pt-2">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Description
              </h2>
              <p className="text-[15px] text-foreground/80 leading-relaxed whitespace-pre-line">
                {listing.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* RIGHT — Info + Actions */}
          <div className="space-y-6">
            {/* Price + title */}
            <div>
              <div className="flex items-start gap-3 mb-1.5">
                <p
                  className={`font-display text-3xl font-black tabular-nums leading-none ${
                    isFree ? "text-success" : "text-foreground"
                  }`}
                >
                  {isFree ? "Free" : formatPrice(listing.price)}
                </p>
                {listing.originalPrice && listing.originalPrice > listing.price && (
                  <p className="text-base text-muted-foreground line-through mt-1.5">
                    {formatPrice(listing.originalPrice)}
                  </p>
                )}
              </div>
              <h1 className="font-display text-xl font-bold text-foreground leading-snug mb-3">
                {listing.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {timeAgo(listing.createdAt)}
                </span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="px-2.5 py-1 rounded-full bg-secondary text-foreground text-xs font-medium">
                  {listing.condition}
                </span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="px-2.5 py-1 rounded-full bg-secondary text-foreground text-xs font-medium">
                  {listing.category}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            {!isSold ? (
              <div className="space-y-2.5">
                <button
                  onClick={() => onChat(listing.id)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground text-background py-3.5 text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  <MessageSquare className="h-4 w-4" />
                  Message Seller
                </button>
                {listing.isNegotiable && (
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-background text-foreground py-3.5 text-sm font-semibold hover:bg-secondary transition-colors">
                    <DollarSign className="h-4 w-4" />
                    Make an Offer
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full flex items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground py-3.5 text-sm font-semibold">
                This item has been sold
              </div>
            )}

            {/* Seller Card */}
            <div className="rounded-2xl border border-border/40 bg-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={listing.sellerAvatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    {listing.sellerName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {listing.sellerName}
                    </span>
                    {listing.sellerRating >= 4.5 && (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                    )}
                    <span className="text-xs text-muted-foreground ml-1">· Verified</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{listing.sellerCourse}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>⭐ {listing.sellerRating.toFixed(1)} rating</span>
                <span>{listing.offerCount} offers</span>
                {onViewSeller && (
                  <button
                    onClick={() => onViewSeller(listing.sellerId)}
                    className="font-semibold text-foreground hover:underline underline-offset-2"
                  >
                    Profile →
                  </button>
                )}
              </div>
            </div>

            {/* Pickup location */}
            {listing.pickupArea && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-secondary flex items-center justify-center">
                  <MapPin className="h-3.5 w-3.5 text-foreground/60" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">
                    Pickup Location
                  </p>
                  <p className="text-sm text-foreground">{listing.pickupArea}</p>
                </div>
              </div>
            )}

            {/* Trust signals */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Meet on campus only — stay safe</span>
              </div>
              <button className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors w-full text-left">
                <AlertOctagon className="h-4 w-4 shrink-0" />
                <span>Report this listing</span>
              </button>
            </div>

            {/* Description — mobile only */}
            <div className="lg:hidden pt-2">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Description
              </h2>
              <p className="text-[15px] text-foreground/80 leading-relaxed whitespace-pre-line">
                {listing.description || "No description provided."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
