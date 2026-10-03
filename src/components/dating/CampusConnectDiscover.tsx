import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchDiscoverProfiles } from "@/services/dating.service";
import type { DatingProfile } from "@/types/dating";
import { Loader2, X, Heart, MapPin, GraduationCap, Info, User, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import studentPlaceholder from "@/assets/student-1.jpg"; // Fallback image

export function CampusConnectDiscover() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<DatingProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const loadProfiles = async () => {
      try {
        setLoading(true);
        const data = await fetchDiscoverProfiles(user.id);
        setProfiles(data);
      } catch (error) {
        console.error("Error fetching discover profiles:", error);
        toast.error("Failed to load profiles");
      } finally {
        setLoading(false);
      }
    };
    
    loadProfiles();
  }, [user]);

  const handleSwipe = (direction: "left" | "right") => {
    if (currentIndex >= profiles.length) return;
    
    // Here we would typically save the swipe to Supabase (dating_swipes table)
    // For now, we simulate the action and advance the stack
    const action = direction === "right" ? "Liked" : "Passed";
    const currentProfile = profiles[currentIndex];
    
    toast.success(`${action} ${currentProfile.name}`);
    setCurrentIndex((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-background/50">
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-primary/10 animate-pulse" />
          <div className="rounded-full bg-muted p-6 relative">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h2 className="text-2xl font-display font-bold tracking-tight mb-2">You're all caught up!</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          You've seen everyone in your area. Check back later for new people on campus.
        </p>
      </div>
    );
  }

  const profile = profiles[currentIndex];
  // Determine primary photo or fallback
  const mainPhotoUrl = profile.photos && profile.photos.length > 0 
    ? profile.photos[0] 
    : studentPlaceholder;

  return (
    <div className="flex h-full w-full flex-col items-center p-4 sm:p-6 lg:p-8">
      {/* ── Main Profile Card ── */}
      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-card shadow-2xl border border-border transition-all h-[80vh] min-h-[600px]">
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          {/* Photo Section */}
          <div className="relative aspect-[3/4] w-full bg-muted">
            <img 
              src={mainPhotoUrl} 
              alt={profile.name} 
              className="h-full w-full object-cover"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="flex items-center gap-2">
                <h2 className="text-4xl font-display font-bold truncate">{profile.name}</h2>
                <span className="text-3xl font-light">{profile.age}</span>
                <CheckCircle className="h-6 w-6 text-blue-400 fill-blue-400/20" />
              </div>
              <div className="mt-2 flex items-center gap-2 text-white/90 font-medium">
                <GraduationCap className="h-4 w-4" />
                <span className="truncate">{profile.course || profile.college || "University Student"}</span>
              </div>
              {profile.campus && (
                <div className="mt-1 flex items-center gap-2 text-white/80 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.campus}</span>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 space-y-8 bg-card">
            
            {/* Bio */}
            {profile.bio && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" /> About Me
                </h3>
                <p className="text-foreground text-lg leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Basic Info Tags */}
            <div className="flex flex-wrap gap-2">
              {profile.height && (
                <div className="rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-medium">
                  {profile.height}
                </div>
              )}
              {profile.gender && (
                <div className="rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-medium">
                  {profile.gender}
                </div>
              )}
              {profile.relationship_goal && (
                <div className="rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-medium">
                  Looking for: {profile.relationship_goal}
                </div>
              )}
            </div>

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="space-y-4 border-t border-border pt-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span 
                      key={interest} 
                      className="rounded-full bg-primary/10 text-primary px-4 py-1.5 text-sm font-semibold"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Fixed Bottom Actions ── */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/95 to-transparent pt-12 flex justify-center gap-6">
          <button 
            onClick={() => handleSwipe("left")}
            className="group flex h-16 w-16 items-center justify-center rounded-full bg-card border-2 border-muted shadow-lg transition-all hover:scale-110 hover:border-red-500/50"
          >
            <X className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-red-500" />
          </button>
          
          <button 
            onClick={() => handleSwipe("right")}
            className="group flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-xl shadow-primary/30 transition-all hover:scale-110"
          >
            <Heart className="h-7 w-7 text-primary-foreground fill-primary-foreground/50 transition-transform group-hover:scale-110" />
          </button>
        </div>
      </div>
    </div>
  );
}
