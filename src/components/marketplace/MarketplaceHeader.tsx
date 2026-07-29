import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import {
  MapPin, Search, Heart, Bell, ChevronDown,
  GraduationCap, SlidersHorizontal, X,
  User, ShoppingBag, Clock, MessageCircle,
  Settings, LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LocationSelector } from "./LocationSelector";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROUTES } from "@/lib/auth";
import type { CampusLocation } from "@/types/marketplace-enhanced";

const TRENDING = ["ThinkPad laptop", "Bicycle", "First year books", "Study lamp", "Gaming controller"];
const RECENT_KEY = "nx-market-recent";

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function saveRecentSearch(q: string) {
  if (typeof window === "undefined" || !q.trim()) return;
  const current = getRecentSearches().filter(s => s !== q).slice(0, 4);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...current]));
}

interface MarketplaceHeaderProps {
  location?: CampusLocation;
  onLocationChange: (loc: CampusLocation) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  onFilterClick: () => void;
  hasActiveFilters: boolean;
  savedCount?: number;
  notifCount?: number;
}

export function MarketplaceHeader({
  location,
  onLocationChange,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onFilterClick,
  hasActiveFilters,
  savedCount = 0,
  notifCount = 0,
}: MarketplaceHeaderProps) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLocation, setShowLocation] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const fullName = profile?.full_name?.trim() || "";
  const displayName = fullName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const avatarUrl = user?.user_metadata?.avatar_url || "";
  const initials = displayName.split(/\s+/).map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();

  const recentSearches = getRecentSearches();

  const [dbSuggestions, setDbSuggestions] = useState<string[]>([]);
  const [dbTrending, setDbTrending] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from("marketplace_items")
      .select("title")
      .eq("is_active", true)
      .order("view_count", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDbTrending(data.map((r: any) => r.title));
        } else {
          setDbTrending(["ThinkPad laptop", "Bicycle", "First year books", "Study lamp", "Gaming controller"]);
        }
      });
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setDbSuggestions([]);
      return;
    }
    const delay = setTimeout(() => {
      supabase
        .from("marketplace_items")
        .select("title")
        .eq("is_active", true)
        .ilike("title", `%${searchQuery}%`)
        .limit(5)
        .then(({ data }) => {
          if (data) {
            setDbSuggestions(data.map((r: any) => r.title));
          }
        });
    }, 200);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const displaySuggestions = searchQuery ? dbSuggestions : dbTrending;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchSubmit = (q: string) => {
    saveRecentSearch(q);
    setSearchFocused(false);
    onSearchSubmit(q);
  };

  const handleLogout = async () => {
    setShowProfile(false);
    await signOut();
    navigate({ to: "/" });
  };

  const locationLabel = location
    ? location.hostel ? `${location.campus} · ${location.hostel}` : location.campus
    : "Select campus";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-paper/98 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-3 md:gap-3 md:px-4">

          {/* Logo */}
          <Link to="/" className="group mr-1 flex shrink-0 items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-glow transition-transform duration-200 group-hover:scale-105">
              <GraduationCap className="h-4 w-4" />
            </span>
            <span className="hidden font-display text-base font-black md:inline">Nexora</span>
          </Link>

          {/* Location */}
          <button
            type="button"
            onClick={() => setShowLocation(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5 text-xs font-bold transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="hidden max-w-[110px] truncate sm:inline">{locationLabel}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {/* Search */}
          <div ref={searchRef} className="relative flex-1">
            <div className={`flex h-9 items-center gap-2 rounded-full border bg-background pl-3 pr-1 transition-all ${searchFocused ? "border-primary shadow-soft" : "border-border"}`}>
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                placeholder="Search laptops, books, cycles..."
                onFocus={() => setSearchFocused(true)}
                onChange={e => { onSearchChange(e.target.value); setSearchFocused(true); }}
                onKeyDown={e => e.key === "Enter" && handleSearchSubmit(searchQuery)}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button type="button" onClick={() => { onSearchChange(""); onSearchSubmit(""); }} className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Search dropdown */}
            {searchFocused && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-border bg-card shadow-glow">
                {!searchQuery && recentSearches.length > 0 && (
                  <div className="border-b border-border p-3">
                    <p className="mb-1.5 px-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Recent</p>
                    {recentSearches.map(s => (
                      <button key={s} type="button" onClick={() => handleSearchSubmit(s)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors hover:bg-secondary">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {displaySuggestions.length > 0 && (
                  <div className="p-3">
                    <p className="mb-1.5 px-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      {searchQuery ? "Suggestions" : "Trending on campus"}
                    </p>
                    {displaySuggestions.slice(0, 5).map(s => (
                      <button key={s} type="button" onClick={() => handleSearchSubmit(s)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors hover:bg-secondary">
                        <Search className="h-3.5 w-3.5 shrink-0 text-warm" />
                        <span dangerouslySetInnerHTML={{ __html: searchQuery ? s.replace(new RegExp(`(${searchQuery})`, "gi"), "<mark class='bg-primary/20 text-primary font-bold rounded'>$1</mark>") : s }} />
                      </button>
                    ))}
                    {searchQuery && (
                      <button type="button" onClick={() => handleSearchSubmit(searchQuery)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-bold text-primary transition-colors hover:bg-primary/10">
                        <Search className="h-3.5 w-3.5 shrink-0" />
                        Search "{searchQuery}"
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Filter */}
          <button
            type="button"
            onClick={onFilterClick}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-bold transition-all hover:-translate-y-0.5 ${hasActiveFilters ? "border-primary bg-primary text-primary-foreground shadow-glow" : "border-border bg-card hover:border-primary/40 hover:shadow-soft"}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filter</span>
            {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-warm" />}
          </button>

          {/* Saved */}
          <button
            type="button"
            className="group relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-warm/50 hover:shadow-soft"
          >
            <Heart className="h-4 w-4 transition-colors group-hover:text-warm" />
            {savedCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-warm px-1 text-[10px] font-black text-warm-foreground">
                {savedCount > 99 ? "99+" : savedCount}
              </span>
            )}
          </button>

          {/* Profile */}
          <div ref={profileRef} className="relative shrink-0">
            {user ? (
              <button
                type="button"
                onClick={() => setShowProfile(v => !v)}
                className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-card pl-0.5 pr-2 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-primary text-xs font-black text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[72px] truncate text-sm font-bold sm:inline">{displayName.split(" ")[0]}</span>
                <ChevronDown className="hidden h-3 w-3 text-muted-foreground sm:block" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate({ to: AUTH_ROUTES.login })}
                className="flex h-9 items-center gap-1.5 rounded-full bg-foreground px-3 text-sm font-black text-background shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow"
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}

            {/* Dropdown */}
            {showProfile && user && (
              <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-card shadow-glow">
                {/* User info */}
                <div className="border-b border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-primary text-sm font-black text-primary-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  <DropItem icon={<User className="h-4 w-4" />} label="My Profile"    onClick={() => { navigate({ to: AUTH_ROUTES.completeProfile }); setShowProfile(false); }} />
                  <DropItem icon={<ShoppingBag className="h-4 w-4" />} label="My Listings"  onClick={() => setShowProfile(false)} />
                  <DropItem icon={<Heart className="h-4 w-4" />}       label="Saved Items"   onClick={() => setShowProfile(false)} />
                  <DropItem icon={<MessageCircle className="h-4 w-4" />} label="Chats" badge={notifCount > 0 ? String(notifCount) : undefined} onClick={() => setShowProfile(false)} />
                  <DropItem icon={<Bell className="h-4 w-4" />}        label="Orders"        onClick={() => setShowProfile(false)} />

                  <div className="my-1 border-t border-border" />

                  <DropItem icon={<Settings className="h-4 w-4" />} label="Settings" onClick={() => { navigate({ to: AUTH_ROUTES.settings }); setShowProfile(false); }} />
                  <DropItem icon={<LogOut className="h-4 w-4" />}   label="Logout"   onClick={handleLogout} danger />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showLocation && (
        <LocationSelector
          currentLocation={location}
          onLocationSelect={loc => { onLocationChange(loc); setShowLocation(false); }}
          onClose={() => setShowLocation(false)}
        />
      )}
    </>
  );
}

function DropItem({ icon, label, badge, danger, onClick }: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-secondary ${danger ? "text-destructive hover:bg-destructive/10" : "text-foreground"}`}
    >
      <span className={`shrink-0 ${danger ? "text-destructive" : "text-muted-foreground"}`}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-warm px-1.5 text-[10px] font-black text-warm-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}
