import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  MapPin, 
  Star,
  User,
  Calendar,
  Package
} from "lucide-react";
import { useMarketplace } from "@/hooks/useMarketplace";
import { MarketplaceListing } from "@/lib/marketplace";
import { NexoraCard } from "@/components/marketplace/NexoraCard";

export const Route = createFileRoute("/marketplace_/seller/$id")({
  head: () => ({ meta: [{ title: "Nexora — Seller Profile" }] }),
  component: SellerProfilePage,
});

function SellerProfilePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { listings, savedItems } = useMarketplace();
  
  const [sellerListings, setSellerListings] = useState<MarketplaceListing[]>([]);
  const [sellerInfo, setSellerInfo] = useState<{name: string, avatar: string, course: string, rating: number, joined: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    
    // Simulate finding seller by matching sellerId in listings
    // In reality, this would be a user profile fetch
    const foundListings = listings.filter(l => l.sellerId === id);
    
    setTimeout(() => {
      setSellerListings(foundListings);
      
      if (foundListings.length > 0) {
        const ref = foundListings[0];
        setSellerInfo({
          name: ref.sellerName,
          avatar: ref.sellerAvatar,
          course: ref.sellerCourse,
          rating: ref.sellerRating,
          joined: "Aug 2024" // Simulated join date
        });
      }
      setIsLoading(false);
    }, 500);
  }, [id, listings]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030712] text-foreground p-6 pt-24 animate-pulse">
        <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 bg-[#030712] border-b border-border/50">
          <div className="h-8 w-24 bg-secondary/50 rounded-lg"></div>
        </header>
        <div className="max-w-4xl mx-auto flex flex-col items-center mt-12 gap-6">
          <div className="h-32 w-32 rounded-full bg-secondary/50"></div>
          <div className="h-8 w-48 bg-secondary/50 rounded-md"></div>
          <div className="flex gap-4">
            <div className="h-6 w-24 bg-secondary/50 rounded-full"></div>
            <div className="h-6 w-24 bg-secondary/50 rounded-full"></div>
          </div>
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
            <div className="aspect-[3/4] bg-secondary/50 rounded-2xl"></div>
            <div className="aspect-[3/4] bg-secondary/50 rounded-2xl"></div>
            <div className="aspect-[3/4] bg-secondary/50 rounded-2xl"></div>
            <div className="aspect-[3/4] bg-secondary/50 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!sellerInfo) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center text-center p-6 text-foreground">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Seller Not Found</h1>
        <p className="text-muted-foreground mb-6">This user may have deleted their account.</p>
        <button onClick={() => navigate({ to: "/marketplace" })} className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold">
          Back to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-foreground font-sans">
      {/* ── TOPBAR ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 sm:px-6 bg-[#030712]/95 backdrop-blur-md border-b border-border/50">
        <Link to="/marketplace" className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary/50 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="mx-auto font-bold text-sm absolute left-1/2 -translate-x-1/2">
          Seller Profile
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-24 pb-24">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mb-16 mt-8">
          <div className="relative">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden border-4 border-[#030712] shadow-2xl relative z-10">
              <img 
                src={sellerInfo.avatar || `https://ui-avatars.com/api/?name=${sellerInfo.name}&background=random`} 
                alt={sellerInfo.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative background circle */}
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl z-0 scale-150"></div>
          </div>
          
          <h1 className="text-3xl font-display font-black mt-6 tracking-tight">
            {sellerInfo.name}
          </h1>
          <p className="text-muted-foreground font-medium mt-1 mb-6">
            {sellerInfo.course}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/40 border border-border/50">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold">{sellerInfo.rating}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/40 border border-border/50 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">{sellerListings.length} Listings</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/40 border border-border/50 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Joined {sellerInfo.joined}</span>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            Active Listings
          </h2>
          
          {sellerListings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
              {sellerListings.map(listing => (
                <div key={listing.id}>
                  <NexoraCard
                    listing={listing}
                    isSaved={savedItems.includes(listing.id)}
                    onSave={(id) => {
                      // Prevent navigation when clicking save
                    }}
                    onClick={() => navigate({ to: "/marketplace/product/$id", params: { id: listing.id } })}
                    hideSeller={true} // Clean up cards on seller profile
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center border border-border/50 rounded-2xl bg-secondary/20">
              <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-1">No active listings</h3>
              <p className="text-sm text-muted-foreground">This seller hasn't posted anything yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
