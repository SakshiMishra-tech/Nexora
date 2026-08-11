import { ArrowLeft, Calendar, CheckCircle2, Package } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type MarketplaceListing } from "@/lib/marketplace";
import { NexoraCard, NexoraCardSkeleton } from "./NexoraCard";

interface SellerProfileProps {
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerCourse: string;
  sellerRating: number;
  listings: MarketplaceListing[];
  savedItems?: string[];
  isOwnProfile?: boolean;
  onBack: () => void;
  onCardClick: (id: string) => void;
  onSave: (id: string) => void;
}

type ProfileTab = "listings" | "sold" | "saved";

export function SellerProfile({
  sellerId,
  sellerName,
  sellerAvatar,
  sellerCourse,
  sellerRating,
  listings,
  savedItems = [],
  isOwnProfile = false,
  onBack,
  onCardClick,
  onSave,
}: SellerProfileProps) {
  const [tab, setTab] = useState<ProfileTab>("listings");

  const activeListings = listings.filter(l => l.status === "active");
  const soldListings = listings.filter(l => l.status === "sold");
  const savedListings = listings.filter(l => savedItems.includes(l.id));

  const displayListings =
    tab === "listings"
      ? activeListings
      : tab === "sold"
      ? soldListings
      : savedListings;

  const tabs: { id: ProfileTab; label: string; count: number }[] = [
    { id: "listings", label: "Listings", count: activeListings.length },
    { id: "sold", label: "Sold", count: soldListings.length },
    ...(isOwnProfile
      ? [{ id: "saved" as ProfileTab, label: "Saved", count: savedListings.length }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6">
        {/* Back button */}
        <div className="pt-6 pb-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
        {/* Profile header */}
        <div className="py-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 border-b border-border">
          {/* Avatar */}
          <Avatar className="h-20 w-20 shrink-0 ring-4 ring-background shadow-lg">
            <AvatarImage src={sellerAvatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-black text-2xl">
              {sellerName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-display text-2xl font-black text-foreground">{sellerName}</h1>
              {sellerRating >= 4.5 && (
                <CheckCircle2 className="h-5 w-5 text-electric shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3 truncate">{sellerCourse}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Member since Aug 2025
              </span>
              <span>⭐ {sellerRating.toFixed(1)} seller rating</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted-foreground pt-1">
            <span className="font-medium text-foreground">{activeListings.length} <span className="font-normal text-muted-foreground">Active</span></span>
            <span>·</span>
            <span className="font-medium text-foreground">{soldListings.length} <span className="font-normal text-muted-foreground">Sold</span></span>
            {isOwnProfile && (
              <>
                <span>·</span>
                <span className="font-medium text-foreground">{savedListings.length} <span className="font-normal text-muted-foreground">Saved</span></span>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 py-4 border-b border-border">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-150 ${
                tab === t.id
                  ? "bg-foreground text-background"
                  : "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {t.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab === t.id
                    ? "bg-background/20 text-background"
                    : "bg-secondary-foreground/10 text-muted-foreground"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Card grid */}
        <div className="py-8 pb-16">
          {displayListings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {displayListings.map(l => (
                <NexoraCard
                  key={l.id}
                  listing={l}
                  isSaved={savedItems.includes(l.id)}
                  onSave={onSave}
                  onClick={onCardClick}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Package className="h-10 w-10 text-muted-foreground/25 mb-4" />
              <p className="text-base font-semibold text-foreground">Nothing here yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                {tab === "listings"
                  ? "No active listings"
                  : tab === "sold"
                  ? "No sold items"
                  : "Nothing saved"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
