import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, GraduationCap, Search, Filter, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROUTES } from "@/lib/auth";
import { MarketplaceProfileMenu } from "./MarketplaceProfileMenu";
import { SearchSuggestions } from "./SearchSuggestions";

interface MarketplaceTopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterClick: () => void;
  filtersActive?: boolean;
}

export function MarketplaceTopBar({
  searchQuery,
  onSearchChange,
  onFilterClick,
  filtersActive = false,
}: MarketplaceTopBarProps) {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const fullName = profile?.full_name?.trim() || "";
  const displayName = fullName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const avatarUrl = user?.user_metadata?.avatar_url || "";
  const initials = displayName
    .split(/\s+/)
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchFocus = () => {
    setShowSuggestions(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
    setShowSuggestions(true);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-paper/95 backdrop-blur-md shadow-soft">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        {/* Back + Logo */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary hover:shadow-soft"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="hidden h-4 w-px bg-border sm:block" />

          <Link
            to="/marketplace"
            className="group flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-glow transition-transform duration-200 group-hover:scale-105">
              <GraduationCap className="h-4 w-4" />
            </span>
            <div className="hidden flex-col sm:flex">
              <span className="font-display text-sm font-black leading-none">Nexora</span>
              <span className="text-[10px] font-bold text-muted-foreground">Marketplace</span>
            </div>
          </Link>
        </div>

        {/* Compact Search Bar (35-45% width on desktop) */}
        <div ref={searchRef} className="relative flex-1 max-w-lg">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              placeholder="Search laptops, books, cycles..."
              className="h-9 w-full rounded-full border border-border bg-background pl-9 pr-3 text-sm font-semibold text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:shadow-soft"
            />
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && (
            <SearchSuggestions
              query={searchQuery}
              onSelect={(value) => {
                onSearchChange(value);
                setShowSuggestions(false);
              }}
              onClose={() => setShowSuggestions(false)}
            />
          )}
        </div>

        {/* Filter Button */}
        <button
          type="button"
          onClick={onFilterClick}
          className={`flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-black transition-all duration-200 hover:-translate-y-0.5 ${
            filtersActive
              ? "border-primary bg-primary text-primary-foreground shadow-glow"
              : "border-border bg-card text-foreground hover:bg-secondary hover:shadow-soft"
          }`}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
          {filtersActive && <span className="hidden h-1.5 w-1.5 rounded-full bg-warm sm:inline-block" />}
        </button>

        {/* Profile Avatar with Menu */}
        <div ref={profileRef} className="relative shrink-0">
          {user ? (
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-primary text-xs font-black text-primary-foreground">
                  {initials || "NS"}
                </AvatarFallback>
              </Avatar>
            </button>
          ) : (
            <button
              onClick={() => void navigate({ to: AUTH_ROUTES.login })}
              className="flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-black text-background shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Profile Menu Dropdown */}
          {showProfileMenu && user && (
            <MarketplaceProfileMenu
              onClose={() => setShowProfileMenu(false)}
              displayName={displayName}
              email={user.email || ""}
              avatarUrl={avatarUrl}
              initials={initials}
            />
          )}
        </div>
      </div>
    </header>
  );
}
