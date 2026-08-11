import { Heart, MessageSquare, MapPin, Clock, CheckCircle2, Eye, Tag, Package, Bookmark } from "lucide-react";
import { useState } from "react";
import { type MarketplaceListing, timeAgo, formatPrice } from "@/lib/marketplace";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProductCardProps {
  listing: MarketplaceListing;
  isSaved: boolean;
  onSave: (id: string) => void;
  onClick: (id: string) => void;
  onChat?: (id: string) => void;
}

export function ProductCard({ listing, isSaved, onSave, onClick, onChat }: ProductCardProps) {
  const isSold = listing.status === "sold";
  const isFree = listing.price === 0;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const conditionColor = {
    "New": "bg-success/15 text-success",
    "Like new": "bg-electric/15 text-electric",
    "Good": "bg-primary/10 text-primary",
    "Fair": "bg-warm/15 text-warm",
    "Used": "bg-muted text-muted-foreground",
  }[listing.condition] ?? "bg-muted text-muted-foreground";

  return (
    <article
      onClick={() => onClick(listing.id)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[1.15rem] border border-border/80 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {/* Skeleton */}
        {!imgLoaded && !imgErr && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-secondary to-muted" />
        )}

        {!imgErr ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgErr(true)}
            loading="lazy"
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${isSold ? "grayscale" : ""} ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-secondary">
            <Package className="h-9 w-9 text-muted-foreground/45" />
            <p className="mt-1 text-xs font-bold text-muted-foreground">No image</p>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-foreground/45 to-transparent opacity-80" />

        {/* Sold overlay */}
        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/50">
            <span className="rounded-full bg-foreground px-4 py-1.5 text-sm font-black text-background">SOLD</span>
          </div>
        )}

        {/* Top left badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {isFree && !isSold && (
            <span className="rounded-full bg-success px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-success-foreground shadow-soft">
              FREE
            </span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-soft ring-1 ring-background/60 ${conditionColor}`}>
            {listing.condition}
          </span>
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onSave(listing.id); }}
          aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border shadow-soft transition-all duration-200 hover:scale-105 ${isSaved ? "border-warm bg-warm text-warm-foreground" : "border-border bg-background text-foreground hover:border-warm hover:bg-warm hover:text-warm-foreground"}`}
        >
          <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
        </button>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-background px-2.5 py-1 text-[10px] font-black text-foreground shadow-soft border border-border">
            <MapPin className="h-3 w-3 shrink-0 text-primary" />
            <span className="truncate">{listing.pickupArea}</span>
          </span>
          {listing.images.length > 1 && (
            <span className="rounded-full bg-foreground px-2 py-1 text-[10px] font-black text-background">
              {listing.images.length} photos
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5">
        {/* Price + title */}
        <div className="mb-2">
          <div className="mb-1 flex items-start justify-between gap-2">
            <span className={`font-display text-xl font-black leading-none ${isFree ? "text-success" : "text-foreground"}`}>
              {isFree ? "Free" : formatPrice(listing.price)}
            </span>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black text-muted-foreground">
              <Eye className="h-3 w-3" />
              {listing.views}
            </span>
          </div>
          <h3 className="line-clamp-2 font-display text-base font-black leading-snug text-foreground transition-colors duration-200 group-hover:text-primary">
            {listing.title}
          </h3>
        </div>

        {/* Tags */}
        {listing.tags.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-1">
            {listing.tags.slice(0, 2).map(tag => (
              <span key={tag} className="flex min-w-0 items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                <Tag className="h-2.5 w-2.5" />
                <span className="truncate">{tag}</span>
              </span>
            ))}
          </div>
        )}

        {/* Time + listing signals */}
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {timeAgo(listing.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 shrink-0" />
            {listing.saves} saves
          </span>
        </div>

        {/* Bottom row */}
        <div className="mt-auto border-t border-border/60 pt-3">
          {/* Seller */}
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="h-8 w-8 shrink-0 border border-border shadow-sm">
                <AvatarImage src={listing.sellerAvatar} />
                <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                  {listing.sellerName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="max-w-[92px] truncate text-xs font-black text-foreground">{listing.sellerName}</span>
                  {listing.sellerRating >= 4.5 && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-electric" />}
                </div>
                <p className="truncate text-[10px] font-bold text-muted-foreground">Verified student</p>
              </div>
            </div>
            {listing.isNegotiable && (
              <span className="shrink-0 rounded-full bg-warm/15 px-2 py-1 text-[10px] font-black text-warm">
                Negotiable
              </span>
            )}
          </div>

          <div className="mt-3.5 flex items-center gap-2">
            {!isSold && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onChat?.(listing.id); }}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-primary/15 px-3 text-xs font-black text-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground hover:shadow-soft"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </button>
            )}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onSave(listing.id); }}
              className={`flex h-10 ${isSold ? "flex-1" : "px-4"} shrink-0 items-center justify-center gap-1.5 rounded-full border text-xs font-black transition-all duration-300 hover:-translate-y-0.5 ${
                isSaved
                  ? "border-warm bg-warm/15 text-warm"
                  : "border-border bg-card text-muted-foreground hover:border-warm/45 hover:bg-paper hover:text-foreground"
              }`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`} />
              {isSold ? "Save Listing" : ""}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
      <div className="flex flex-1 flex-col p-3.5">
        <div className="mb-2 space-y-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-full animate-pulse rounded bg-muted" />
          <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        </div>
        <div className="mb-3 flex gap-3">
          <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
            <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-7 w-16 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
