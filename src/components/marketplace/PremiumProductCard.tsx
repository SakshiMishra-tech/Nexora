import { Heart, MessageCircle, Eye, MapPin, ShieldCheck, Bookmark } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MarketplaceListing } from "@/types/marketplace";

interface PremiumProductCardProps {
  listing: MarketplaceListing;
  onSave?: (listingId: string) => void;
  onLike?: (listingId: string) => void;
  onClick?: (listingId: string) => void;
  isSaved?: boolean;
  isLiked?: boolean;
}

export function PremiumProductCard({
  listing,
  onSave,
  onLike,
  onClick,
  isSaved = false,
  isLiked = false,
}: PremiumProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const primaryImage = listing.images?.[0] || "";
  const isFree = listing.price === 0;
  const displayPrice = isFree ? "FREE" : `₹${listing.price.toLocaleString("en-IN")}`;
  const isVerified = Math.random() > 0.5; // TODO: Replace with actual verification status

  const getConditionStyle = (condition: string) => {
    switch (condition) {
      case "new":
      case "like-new":
        return "bg-success/15 text-success border-success/30";
      case "good":
        return "bg-electric/15 text-electric border-electric/30";
      case "fair":
      case "used":
        return "bg-warm/15 text-warm border-warm/30";
      default:
        return "bg-secondary text-muted-foreground border-border";
    }
  };

  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow cursor-pointer"
      onClick={() => onClick?.(listing.id)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {/* Loading Skeleton */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-secondary to-muted" />
        )}

        {/* Image */}
        {primaryImage && !imageError ? (
          <img
            src={primaryImage}
            alt={listing.title}
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted">
            <div className="text-center">
              <div className="mb-2 text-6xl font-black opacity-10">
                {listing.category.charAt(0).toUpperCase()}
              </div>
              <p className="text-xs font-bold text-muted-foreground">No Image</p>
            </div>
          </div>
        )}

        {/* Image Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/0 to-background/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Top Right Actions */}
        <div className="absolute right-2 top-2 flex gap-2">
          {/* Save Button */}
          {onSave && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSave(listing.id);
              }}
              className={`grid h-8 w-8 place-items-center rounded-full border backdrop-blur-md transition-all duration-300 ${
                isSaved
                  ? "border-warm bg-warm text-warm-foreground shadow-warm scale-110"
                  : "border-border/50 bg-paper/80 text-foreground hover:scale-110 hover:border-warm hover:bg-warm hover:text-warm-foreground"
              }`}
              aria-label={isSaved ? "Remove from saved" : "Save listing"}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
            </button>
          )}

          {/* Like Button */}
          {onLike && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLike(listing.id);
              }}
              className={`grid h-8 w-8 place-items-center rounded-full border backdrop-blur-md transition-all duration-300 ${
                isLiked
                  ? "border-warm bg-warm text-warm-foreground shadow-warm scale-110"
                  : "border-border/50 bg-paper/80 text-foreground hover:scale-110 hover:border-warm hover:bg-warm hover:text-warm-foreground"
              }`}
              aria-label={isLiked ? "Unlike" : "Like"}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            </button>
          )}
        </div>

        {/* Top Left Badge - Price */}
        <div className="absolute left-2 top-2">
          <div
            className={`rounded-full px-3 py-1.5 text-sm font-black shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-105 ${
              isFree
                ? "bg-success/90 text-success-foreground"
                : "bg-foreground/90 text-background"
            }`}
          >
            {displayPrice}
          </div>
        </div>

        {/* Bottom Left - Image Count Indicator */}
        {listing.images && listing.images.length > 1 && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {listing.images.slice(0, 4).map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full backdrop-blur-sm transition-all ${
                  idx === 0 ? "w-6 bg-paper" : "w-1.5 bg-paper/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="mb-2 font-display text-lg font-black leading-tight line-clamp-2 transition-colors duration-300 group-hover:text-primary">
          {listing.title}
        </h3>

        {/* Badges */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase ${getConditionStyle(listing.condition)}`}>
            {listing.condition.replace("-", " ")}
          </span>
          <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[10px] font-black uppercase text-muted-foreground">
            {listing.category}
          </span>
          {listing.is_negotiable && (
            <span className="rounded-md border border-accent bg-accent/10 px-2 py-0.5 text-[10px] font-black uppercase text-accent-foreground">
              Negotiable
            </span>
          )}
        </div>

        {/* Seller Info */}
        <div className="mb-3 flex items-center gap-2">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={listing.seller_avatar} alt={listing.seller_name} />
            <AvatarFallback className="bg-primary text-xs font-black text-primary-foreground">
              {listing.seller_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate text-sm font-black">{listing.seller_name || "Anonymous"}</p>
              {isVerified && (
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              {listing.location && (
                <>
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{listing.location}</span>
                  <span>•</span>
                </>
              )}
              <span>{formatTimeAgo(listing.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mb-3 flex items-center gap-4 text-xs font-bold text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            <span>{listing.views || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            <span>{listing.saves || 0}</span>
          </div>
          {listing.status === "sold" && (
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-black uppercase">
              Sold
            </span>
          )}
        </div>

        {/* Chat Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(listing.id);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-black transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-glow"
        >
          <MessageCircle className="h-4 w-4" />
          Chat with Seller
        </button>
      </div>
    </article>
  );
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}
