import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchDiscoverProfiles, recordSwipe } from "@/services/dating.service";
import type { DatingProfile, DatingMatch } from "@/types/dating";
import {
  ArrowLeft, Search, MapPin, Bell, User, Heart, X, CheckCircle, 
  MessageCircle, AlertTriangle, ChevronDown, SlidersHorizontal, 
  Loader2, Navigation, GraduationCap, Clock, Info, Shield, Compass, Phone
} from "lucide-react";
import { toast } from "sonner";

// --- Subcomponents ---

function TopNav() {
  const navItems = ["Discover", "Likes", "Matches", "Chat", "Calls"];
  
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="font-display font-black tracking-tight text-lg text-primary flex items-center gap-2">
            <Compass className="w-5 h-5" />
            NEXORA CONNECT
          </div>
        </div>

        {/* Center: Navigation (Desktop) */}
        <div className="hidden md:flex items-center gap-1 bg-muted/30 p-1 rounded-2xl border border-border/50">
          {navItems.map(item => (
            <button
              key={item}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                item === "Discover" 
                  ? "bg-background text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Right: User Actions */}
        <div className="flex items-center gap-3">
          <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border/50 transition-all text-sm font-bold text-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Campus Area</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors relative">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
          </button>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 cursor-pointer">
            <User className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationPanel() {
  return (
    <div className="bg-card rounded-3xl p-5 border border-border/50 shadow-sm mb-6">
      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Location Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">My location</label>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-muted/50 hover:bg-muted rounded-xl transition-colors text-left border border-transparent hover:border-border/50">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground flex-1">Use current location</span>
          </button>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Looking in</label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search area..." 
              className="w-full bg-muted/50 border border-border/50 rounded-xl py-2.5 pl-9 pr-3 text-sm font-medium focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground mb-2 block">Maximum distance</label>
          <div className="flex gap-2">
            {["5km", "10km", "25km", "50km"].map((dist, i) => (
              <button 
                key={dist}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  i === 1 ? 'border-primary bg-primary/5 text-primary' : 'border-border/50 bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                {dist}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { icon: Heart, label: "Likes", count: 12 },
    { icon: CheckCircle, label: "Matches", count: 4 },
    { icon: MessageCircle, label: "Chat", count: 3 },
    { icon: Phone, label: "Calls", count: 0 },
  ];

  return (
    <div className="bg-card rounded-3xl p-5 border border-border/50 shadow-sm mb-6">
      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Quick Actions</h3>
      <div className="space-y-1">
        {actions.map((action) => (
          <button key={action.label} className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted group-hover:bg-background flex items-center justify-center transition-colors">
                <action.icon className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground">{action.label}</span>
            </div>
            {action.count > 0 && (
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {action.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Main Discover Component ---

export function CampusConnectDiscover() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<DatingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Modals
  const [selectedProfile, setSelectedProfile] = useState<DatingProfile | null>(null);
  const [newMatch, setNewMatch] = useState<{ profile: DatingProfile, match: DatingMatch } | null>(null);

  const filterCategories = ["All", "Music", "Sports", "Coding", "Travel", "Art", "Books", "Gaming"];

  useEffect(() => {
    if (!user) return;
    const loadProfiles = async () => {
      try {
        setLoading(true);
        const data = await fetchDiscoverProfiles(user.id, 50);
        setProfiles(data);
      } catch (error) {
        console.error("Error fetching profiles:", error);
        toast.error("Failed to load profiles");
      } finally {
        setLoading(false);
      }
    };
    loadProfiles();
  }, [user]);

  const handleSwipe = async (targetId: string, action: 'like' | 'pass') => {
    if (!user) return;
    
    // Optimistic UI update
    const targetProfile = profiles.find(p => p.id === targetId);
    setProfiles(prev => prev.filter(p => p.id !== targetId));
    
    try {
      const { match } = await recordSwipe(user.id, targetId, action);
      if (match && targetProfile) {
        setNewMatch({ profile: targetProfile, match });
      } else {
        if (action === 'like') toast.success(`Liked ${targetProfile?.name}`);
      }
    } catch (error) {
      console.error("Failed to record swipe:", error);
      toast.error("Network error, swipe not saved.");
      // Rollback optimistic update
      if (targetProfile) setProfiles(prev => [targetProfile, ...prev]);
    }
  };

  // Client-side filtering based on supported data
  const filteredProfiles = profiles.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name?.toLowerCase().includes(q) && !p.college?.toLowerCase().includes(q) && !p.campus?.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (selectedCategory !== "All") {
      if (!p.interests?.includes(selectedCategory)) return false;
    }
    return true;
  });

  const isRecentlyActive = (updatedAt: string) => {
    // Basic realistic logic for online indicator
    const diff = new Date().getTime() - new Date(updatedAt).getTime();
    return diff < 1000 * 60 * 60 * 24; // active within 24h for demo
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopNav />
      
      <div className="flex-1 flex max-w-[1600px] mx-auto w-full">
        {/* Main Content Area */}
        <main className="flex-1 px-4 lg:px-8 py-8 min-w-0">
          
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="font-display font-black text-4xl text-foreground tracking-tight mb-2">Discover People</h1>
              <p className="text-muted-foreground text-lg">Meet students from your campus and nearby communities.</p>
            </div>
            <div className="w-full md:w-80 relative shrink-0">
              <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search by name, college..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border-2 border-border/50 rounded-2xl py-3 pl-12 pr-4 text-foreground font-medium focus:outline-none focus:border-primary transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <button className="shrink-0 flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-sm font-bold text-foreground hover:bg-muted/80 transition-colors border border-border/50">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
              <div className="w-px h-6 bg-border mx-1 shrink-0" />
              
              {filterCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-5 py-2 rounded-xl text-sm font-bold transition-all border ${
                    selectedCategory === cat 
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" 
                      : "bg-card text-muted-foreground hover:text-foreground border-border/50 hover:border-border"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Profile Grid */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-3xl bg-card/50">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Compass className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">You're all caught up!</h3>
              <p className="text-muted-foreground max-w-sm">New people will appear here as they join your discovery area. Check back later or expand your distance filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProfiles.map(profile => {
                const isOnline = isRecentlyActive(profile.updated_at);
                
                return (
                  <div key={profile.id} className="relative aspect-[3/4] rounded-[2rem] overflow-hidden group border border-border shadow-sm hover:shadow-xl transition-all cursor-pointer bg-card">
                    {/* Background Image */}
                    {profile.primary_photo ? (
                      <img src={profile.primary_photo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={profile.name} onClick={() => setSelectedProfile(profile)} />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center" onClick={() => setSelectedProfile(profile)}>
                        <User className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5 pointer-events-none" />
                    
                    {/* Top Status */}
                    {isOnline && (
                      <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-white text-[10px] font-bold uppercase tracking-wider">Recently Active</span>
                      </div>
                    )}
                    
                    {/* Bottom Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col justify-end">
                      <div onClick={() => setSelectedProfile(profile)}>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-black text-2xl drop-shadow-sm">{profile.name}, {profile.age}</h3>
                        </div>
                        
                        {(profile.college || profile.campus) && (
                          <p className="text-white/90 text-sm font-medium flex items-center gap-1.5 mb-3 drop-shadow-sm">
                            <GraduationCap className="w-4 h-4 opacity-80" />
                            <span className="truncate">{profile.course ? `${profile.course} • ` : ''}{profile.campus || profile.college}</span>
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {profile.interests?.slice(0, 3).map(i => (
                            <span key={i} className="px-2.5 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white text-[10px] font-bold uppercase tracking-wider">
                              {i}
                            </span>
                          ))}
                          {profile.interests && profile.interests.length > 3 && (
                            <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white/80 text-[10px] font-bold uppercase tracking-wider">
                              +{profile.interests.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 mt-auto">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSwipe(profile.id, 'pass'); }} 
                          className="flex-1 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center transition-colors text-white border border-white/10"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSwipe(profile.id, 'like'); }} 
                          className="flex-[2] h-12 bg-primary hover:bg-primary/90 rounded-2xl flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98] text-white shadow-lg shadow-primary/30 border border-primary/50"
                        >
                          <Heart className="w-5 h-5 fill-current" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Right Sidebar (Desktop) */}
        <aside className="hidden xl:block w-[340px] shrink-0 border-l border-border/50 p-6 bg-background/50">
          <LocationPanel />
          <QuickActions />
          
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl p-5 border border-indigo-500/20 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full" />
            <h3 className="text-base font-black text-foreground mb-2 relative z-10">Campus Events</h3>
            <p className="text-sm text-muted-foreground mb-4 relative z-10">Meet people IRL at verified campus events this week.</p>
            <button className="w-full py-2.5 bg-background border border-border rounded-xl text-sm font-bold shadow-sm hover:shadow transition-shadow relative z-10">
              Browse Events
            </button>
          </div>
        </aside>
      </div>

      {/* --- Profile Details Modal --- */}
      {selectedProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-card border border-border shadow-2xl rounded-[2.5rem] flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
            
            {/* Left: Big Photo */}
            <div className="w-full md:w-1/2 relative bg-muted h-[40vh] md:h-auto min-h-[400px]">
              {selectedProfile.primary_photo ? (
                <img src={selectedProfile.primary_photo} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-20 h-20 text-muted-foreground/30" />
                </div>
              )}
              <button 
                onClick={() => setSelectedProfile(null)}
                className="absolute top-4 left-4 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white md:hidden transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Right: Info */}
            <div className="w-full md:w-1/2 flex flex-col h-[50vh] md:h-auto max-h-full">
              <div className="flex-1 overflow-y-auto p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-4xl font-black text-foreground mb-1">{selectedProfile.name}, {selectedProfile.age}</h2>
                    <p className="text-lg text-muted-foreground font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> 
                      {selectedProfile.campus || selectedProfile.college}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedProfile(null)}
                    className="hidden md:flex w-10 h-10 bg-muted hover:bg-muted/80 rounded-full items-center justify-center text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {selectedProfile.bio && (
                  <div className="mb-8">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">About Me</h4>
                    <p className="text-foreground leading-relaxed font-medium">{selectedProfile.bio}</p>
                  </div>
                )}

                <div className="mb-8">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.interests?.map(i => (
                      <span key={i} className="px-3 py-1.5 bg-muted rounded-xl text-sm font-bold text-foreground border border-border/50">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>

                {(selectedProfile.department || selectedProfile.year || selectedProfile.languages) && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedProfile.department && (
                        <div className="bg-muted/50 p-3 rounded-2xl">
                          <span className="block text-xs text-muted-foreground font-bold mb-1">Department</span>
                          <span className="font-medium text-sm">{selectedProfile.department}</span>
                        </div>
                      )}
                      {selectedProfile.year && (
                        <div className="bg-muted/50 p-3 rounded-2xl">
                          <span className="block text-xs text-muted-foreground font-bold mb-1">Year</span>
                          <span className="font-medium text-sm">{selectedProfile.year}</span>
                        </div>
                      )}
                      {selectedProfile.languages && (
                        <div className="bg-muted/50 p-3 rounded-2xl col-span-2">
                          <span className="block text-xs text-muted-foreground font-bold mb-1">Languages</span>
                          <span className="font-medium text-sm">{selectedProfile.languages}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Safe Actions */}
                <div className="mt-10 flex items-center justify-center gap-6 border-t border-border/50 pt-8">
                  <button className="flex flex-col items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Report</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Shield className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Block</span>
                  </button>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-6 bg-card border-t border-border shrink-0 flex gap-4">
                <button 
                  onClick={() => { handleSwipe(selectedProfile.id, 'pass'); setSelectedProfile(null); }}
                  className="flex-1 py-4 bg-muted hover:bg-muted/80 rounded-2xl flex items-center justify-center transition-colors text-foreground font-bold text-lg"
                >
                  Pass
                </button>
                <button 
                  onClick={() => { handleSwipe(selectedProfile.id, 'like'); setSelectedProfile(null); }}
                  className="flex-[2] py-4 bg-primary hover:bg-primary/90 rounded-2xl flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98] text-white shadow-lg shadow-primary/30 font-bold text-lg gap-2"
                >
                  <Heart className="w-6 h-6 fill-current" />
                  Like
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Match Modal --- */}
      {newMatch && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/95 backdrop-blur-md">
          <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-[3rem] p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            
            <h2 className="font-display font-black text-5xl text-primary mb-2 relative z-10">It's a Match!</h2>
            <p className="text-muted-foreground text-lg mb-8 relative z-10">You and {newMatch.profile.name} liked each other.</p>
            
            <div className="flex justify-center mb-10 relative z-10">
              <div className="relative w-48 h-32 flex items-center justify-center">
                <div className="absolute left-0 w-28 h-28 rounded-full border-4 border-background overflow-hidden shadow-2xl z-20">
                   <div className="w-full h-full bg-muted flex items-center justify-center">
                     <User className="w-10 h-10 text-muted-foreground" />
                   </div>
                </div>
                <div className="absolute right-0 w-28 h-28 rounded-full border-4 border-background overflow-hidden shadow-2xl z-10 scale-95">
                  {newMatch.profile.primary_photo ? (
                    <img src={newMatch.profile.primary_photo} className="w-full h-full object-cover" alt="Match" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <User className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="absolute z-30 bg-primary w-12 h-12 rounded-full border-4 border-background flex items-center justify-center shadow-lg">
                  <Heart className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
            </div>
            
            <div className="space-y-3 relative z-10">
              <button 
                onClick={() => { setNewMatch(null); /* navigate to chat */ }}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Send a Message
              </button>
              <button 
                onClick={() => setNewMatch(null)}
                className="w-full py-4 bg-muted hover:bg-muted/80 text-foreground rounded-2xl font-bold text-lg transition-colors"
              >
                Keep Exploring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
