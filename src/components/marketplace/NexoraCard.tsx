import { Heart } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { type MarketplaceListing, timeAgo, formatPrice } from "@/lib/marketplace";

interface NexoraCardProps {
  listing: MarketplaceListing;
  isSaved: boolean;
  onSave: (id: string) => void;
  onClick: (id: string) => void;
  hideSeller?: boolean;
}

// Category-aware gradient fallback palette
const CATEGORY_FALLBACK: Record<string, { bg: string; label: string }> = {
  Books: { bg: "from-amber-900/60 to-amber-700/40", label: "📚" },
  Electronics: { bg: "from-blue-900/60 to-cyan-800/40", label: "💻" },
  Cycles: { bg: "from-green-900/60 to-emerald-700/40", label: "🚲" },
  "Hostel Essentials": { bg: "from-purple-900/60 to-violet-700/40", label: "🏠" },
  Furniture: { bg: "from-orange-900/60 to-amber-800/40", label: "🪑" },
  Fashion: { bg: "from-pink-900/60 to-rose-700/40", label: "👕" },
  Gaming: { bg: "from-indigo-900/60 to-purple-800/40", label: "🎮" },
  Sports: { bg: "from-teal-900/60 to-green-800/40", label: "⚽" },
  Notes: { bg: "from-yellow-900/60 to-amber-700/40", label: "📝" },
  Others: { bg: "from-slate-800/60 to-zinc-700/40", label: "📦" },
};

function CategoryFallback({ category, title }: { category: string; title: string }) {
  const fallback = CATEGORY_FALLBACK[category] ?? CATEGORY_FALLBACK["Others"];
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br ${fallback.bg}`}>
      <span className="text-3xl leading-none select-none">{fallback.label}</span>
      <span className="text-[10px] font-semibold text-white/50 text-center px-2 line-clamp-1">{title}</span>
    </div>
  );
}

export function NexoraCard({ listing, isSaved, onSave, onClick, hideSeller }: NexoraCardProps) {
  const isSold = listing.status === "sold";
  const isFree = listing.price === 0;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const sellerFirstName = listing.sellerName.split(" ")[0];

  // Treat missing/empty image as an error up-front
  const hasImage = listing.images?.[0] && listing.images[0].trim() !== "";

  return (
    <Link
      to="/marketplace"
      search={(prev: any) => ({ ...prev, view: "detail", id: listing.id })}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick(listing.id);
        }
      }}
      className="group relative flex cursor-pointer flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-secondary/50 border border-border/40 mb-2.5">
        {hasImage && !imgErr ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 animate-pulse bg-muted" />
            )}
            <img
              src={listing.images[0]}
              alt={listing.title}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgErr(true)}
              loading="lazy"
              className={`h-full w-full object-cover transition-opacity duration-300 ${
                isSold ? "grayscale opacity-60" : ""
              } ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            />
          </>
        ) : (
          <CategoryFallback category={listing.category} title={listing.title} />
        )}

        {/* Sold banner */}
        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-background px-3 py-1 text-[10px] font-bold text-foreground tracking-widest uppercase shadow-sm">
              Sold
            </span>
          </div>
        )}

        {/* Save button — top right corner, always visible, subtle outline */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onSave(listing.id);
          }}
          aria-label={isSaved ? "Remove from saved" : "Save listing"}
          className={`absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm transition-all duration-150 border border-border/50 hover:bg-background ${
            isSaved
              ? "text-rose-500"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Info — tighter typography */}
      <div className="space-y-0.5">
        <p
          className={`text-sm font-semibold tabular-nums leading-tight ${
            isFree ? "text-success" : "text-foreground"
          }`}
        >
          {isFree ? "Free" : formatPrice(listing.price)}
        </p>
        <h3 className="line-clamp-2 text-sm text-foreground/80 leading-snug">
          {listing.title}
        </h3>
        <p className="text-xs text-muted-foreground/80">
          {timeAgo(listing.createdAt)}{!hideSeller && ` · ${sellerFirstName}`}
        </p>
      </div>
    </Link>
  );
}

export function NexoraCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-muted" />
      <div className="space-y-1.5">
        <div className="h-4 w-14 animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
