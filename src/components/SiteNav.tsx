import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  ShoppingBag,
  MapPin,
  Users,
  Heart,
  BookOpen,
  FolderGit2,
  Car,
  GraduationCap,
  CalendarDays,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { NexoraLogo } from "./brand/NexoraLogo";
import { ProfileDropdown } from "./profile/ProfileDropdown";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROUTES } from "@/lib/auth";

interface NavItem {
  label: string;
  to: string;
  icon: typeof ShoppingBag;
}

const navItems: NavItem[] = [
  { label: "Marketplace", to: "/marketplace", icon: ShoppingBag },
  { label: "Lost & Found", to: "/lost-found", icon: MapPin },
  { label: "Roommates", to: "/roommates", icon: Users },
  { label: "Campus Connect", to: "/dating", icon: Heart },
  { label: "Notes", to: "/notes", icon: BookOpen },
  { label: "Projects", to: "/projects", icon: FolderGit2 },
  { label: "Rides", to: "/rides", icon: Car },
  { label: "Tuition", to: "/tuition", icon: GraduationCap },
  { label: "Events", to: "/events", icon: CalendarDays },
];

export function SiteNav() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-paper/95 backdrop-blur-md transition-colors">
      {/* Main navbar row */}
      <nav className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2">
        {/* Left: back button + logo */}
        <div className="flex shrink-0 items-center gap-2">
          {pathname !== "/" && (
            <button
              type="button"
              onClick={() => window.history.back()}
              className="grid h-8 w-8 place-items-center rounded-full border border-border bg-background text-foreground shadow-soft transition hover:bg-secondary"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <Link to="/" className="group flex shrink-0 items-center transition-transform hover:scale-102">
            <NexoraLogo size="sm" />
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
                  className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[0.72rem] font-bold transition ${
                    isActive
                      ? "bg-foreground text-background shadow-soft"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
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
                className="inline-flex min-h-9 items-center justify-center rounded-full bg-foreground px-4 py-1.5 text-xs font-bold text-background transition hover:opacity-90 active:scale-95 sm:text-sm"
              >
                Join
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            id="mobile-menu-toggle"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-paper shadow-soft transition hover:bg-secondary lg:hidden text-foreground"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4 text-foreground" />}
          </button>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-paper/98 px-4 pb-4 pt-2 lg:hidden animate-in fade-in duration-150">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-[0.68rem] font-bold transition ${
                    isActive
                      ? "border-foreground bg-foreground text-background shadow-soft"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate max-w-full">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
