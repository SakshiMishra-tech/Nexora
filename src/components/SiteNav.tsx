import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Car,
  ChevronDown,
  GraduationCap,
  Heart,
  LogOut,
  MapPin,
  Menu,
  Settings,
  ShoppingBag,
  Users,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import { AUTH_ROUTES } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useModuleAccessNavigation } from "@/components/ModuleAccessControl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";

const navItems = [
  { label: "Marketplace", to: "/marketplace", icon: ShoppingBag },
  { label: "Lost & Found", to: "/lost-found", icon: MapPin },
  { label: "Roommates", to: "/roommates", icon: Users },
  { label: "Campus Connect", to: "/dating", icon: Heart },
  { label: "Notes", to: "/notes", icon: BookOpen },
  { label: "Projects", to: "/projects", icon: Wrench },
  { label: "Rides", to: "/rides", icon: Car },
  { label: "Tuition", to: "/tuition", icon: GraduationCap },
  { label: "Events", to: "/events", icon: Calendar },
] as const;

export function SiteNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  const { requestModuleAccess, accessModal } = useModuleAccessNavigation();
  const isLoggedIn = Boolean(user);
  const fullName = profile?.full_name?.trim() || "";
  const displayName =
    fullName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const collegeName = profile?.college_name || user?.user_metadata?.college_name || "College not set";
  const firstName = displayName.trim().split(/\s+/)[0] || "Student";
  const avatarUrl = user?.user_metadata?.avatar_url || "";
  const initials = displayName
    .split(/\s+/)
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    void navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-paper/95 backdrop-blur">
      {/* Main navbar row */}
      <nav className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2">
        {/* Left: back button + logo */}
        <div className="flex shrink-0 items-center gap-2">
          {pathname !== "/" && (
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  void navigate({ to: "/", replace: true });
                }
              }}
              className="grid h-9 w-9 place-items-center rounded-full border border-foreground/10 bg-paper text-foreground shadow-soft transition hover:-translate-y-0.5"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="grid h-9 w-9 place-items-center bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-black">Nexora</span>
          </Link>
        </div>

        {/* Center: nav links — hidden on mobile, visible on lg+ */}
        <div className="hidden flex-1 overflow-x-auto lg:flex lg:justify-center">
          <div className="flex gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={(event) => {
                    event.preventDefault();
                    requestModuleAccess(item.to);
                  }}
                  className={`inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-[0.7rem] font-black transition ${
                    isActive
                      ? "bg-foreground text-background shadow-soft"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: auth + hamburger */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {isLoggedIn ? (
            <ProfileDropdown />
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="signin-btn"
                type="button"
                onClick={() => void navigate({ to: AUTH_ROUTES.login })}
                className="inline-flex min-h-9 items-center justify-center rounded-full border border-foreground/15 bg-paper px-4 text-sm font-black text-foreground shadow-soft transition hover:-translate-y-0.5 hover:bg-secondary"
              >
                Sign In
              </button>
              <button
                id="join-campus-btn"
                type="button"
                onClick={() => void navigate({ to: AUTH_ROUTES.signup })}
                className="inline-flex min-h-9 items-center justify-center rounded-full bg-foreground px-4 text-sm font-black text-background shadow-soft transition hover:-translate-y-0.5"
              >
                Join Campus
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            id="mobile-menu-toggle"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full border border-foreground/10 bg-paper shadow-soft transition hover:bg-secondary lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-paper/98 px-4 pb-4 pt-2 lg:hidden">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={(event) => {
                    event.preventDefault();
                    setMobileMenuOpen(false);
                    requestModuleAccess(item.to);
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-[0.65rem] font-black transition ${
                    isActive
                      ? "border-foreground/20 bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/15 hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {accessModal}
    </header>
  );
}
