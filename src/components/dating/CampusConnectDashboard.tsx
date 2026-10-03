/**
 * CampusConnectDashboard.tsx
 * Top-navbar layout with mega-menu popups for Discover, Likes & Matches, and Stories.
 * Safety and Support navigate directly. My Profile is a right-aligned CTA.
 */
import { useState, useCallback } from "react";
import { CampusConnectProfile } from "@/components/CampusConnectProfile";
import { CampusConnectDiscover } from "@/components/dating/CampusConnectDiscover";
import { CampusConnectLikes } from "@/components/dating/CampusConnectLikes";
import { CampusConnectSafety } from "@/components/dating/CampusConnectSafety";
import { CampusConnectSupport } from "@/components/dating/CampusConnectSupport";
import { CampusConnectStories } from "@/components/dating/CampusConnectStories";
import {
  MegaMenu,
  DISCOVER_FEATURES,
  LIKES_FEATURES,
  STORIES_FEATURES,
  type MegaMenuFeature,
} from "@/components/dating/MegaMenu";
import {
  Compass, Heart, PlayCircle, ShieldAlert, HelpCircle, User,
  ArrowLeft, Menu, X, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "discover" | "likes" | "stories" | "profile";
type MegaMenuId = "discover" | "likes" | "stories" | null;

interface DashboardProps {
  onExit: () => void;
  onNavigate?: (view: "safety" | "support") => void;
  initialTab?: string;
}

// ── Mega menu data ─────────────────────────────────────────────────────────────

// ── Mega menu data ─────────────────────────────────────────────────────────────

// ── Component ─────────────────────────────────────────────────────────────────

export function CampusConnectDashboard({ onExit, onNavigate, initialTab = "discover" }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab as Tab);
  const [openMega, setOpenMega] = useState<MegaMenuId>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMega = useCallback(() => setOpenMega(null), []);

  const handleMegaToggle = (id: MegaMenuId) => {
    setOpenMega((prev) => (prev === id ? null : id));
    setMobileMenuOpen(false);
  };

  const navigateTo = (tab: Tab) => {
    setActiveTab(tab);
    setOpenMega(null);
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "discover": return <CampusConnectDiscover />;
      case "likes":    return <CampusConnectLikes />;
      case "stories":  return <CampusConnectStories />;
      case "profile":  return <CampusConnectProfile onBack={() => setActiveTab("discover")} />;
      default:         return null;
    }
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-background overflow-hidden">

      {/* ── Top Navbar ─────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-border bg-card/95 backdrop-blur-md z-40 sticky top-0">
        <div className="flex items-center justify-between h-14 px-4 md:px-6 max-w-screen-2xl mx-auto">

          {/* Left: Back + Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors"
              aria-label="Back to Nexora"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="font-display font-black text-base tracking-tight uppercase text-foreground select-none">
              NEXORA <span className="font-light text-muted-foreground">CONNECT</span>
            </span>
          </div>

          {/* Center: Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Campus Connect navigation">

            {/* Discover — direct navigate */}
            <button
              onClick={() => navigateTo("discover")}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-semibold transition-all",
                activeTab === "discover" && openMega === null
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              Discover
            </button>

            {/* Likes & Matches, Stories — mega menu triggers */}
            {(["likes", "stories"] as const).map((id) => {
              const labels = { likes: "Likes & Matches", stories: "Stories" };
              const isOpen = openMega === id;
              return (
                <button
                  key={id}
                  onClick={() => handleMegaToggle(id)}
                  aria-expanded={isOpen}
                  className={cn(
                    "flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-semibold transition-all",
                    isOpen
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {labels[id]}
                  <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
                </button>
              );
            })}

            {/* Safety & Support — standalone navigate */}
            {(["safety", "support"] as const).map((id) => {
              const labels = { safety: "Safety", support: "Support" };
              return (
                <button
                  key={id}
                  onClick={() => onNavigate?.(id)}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  {labels[id]}
                </button>
              );
            })}
          </nav>

          {/* Right: My Profile + Mobile hamburger */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTo("profile")}
              className={cn(
                "hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all border",
                activeTab === "profile" && openMega === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-foreground text-background border-foreground hover:opacity-90"
              )}
            >
              <User className="w-3.5 h-3.5" />
              My Profile
            </button>

            <button
              onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setOpenMega(null); }}
              className="md:hidden flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <div className="flex flex-col py-2 px-2">
              {(
                [
                  { id: "discover" as Tab, label: "Discover",        icon: Compass,     hasMega: false, isStandalone: false },
                  { id: "likes" as Tab,    label: "Likes & Matches", icon: Heart,       hasMega: true,  isStandalone: false },
                  { id: "stories" as Tab,  label: "Stories",         icon: PlayCircle,  hasMega: true,  isStandalone: false },
                  { id: "safety",          label: "Safety",          icon: ShieldAlert, hasMega: false, isStandalone: true },
                  { id: "support",         label: "Support",         icon: HelpCircle,  hasMega: false, isStandalone: true },
                  { id: "profile" as Tab,  label: "My Profile",      icon: User,        hasMega: false, isStandalone: false },
                ]
              ).map(({ id, label, icon: Icon, hasMega, isStandalone }) => (
                <button
                  key={id}
                  onClick={() => {
                    if (isStandalone) {
                      onNavigate?.(id as "safety" | "support");
                    } else if (hasMega) {
                      handleMegaToggle(id as MegaMenuId);
                    } else {
                      navigateTo(id as Tab);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors",
                    activeTab === id && !hasMega && !isStandalone
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{label}</span>
                  {hasMega && <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ── Mega Menus ─────────────────────────────────────────── */}

      <MegaMenu
        isOpen={openMega === "likes"}
        onClose={closeMega}
        title="Explore Likes & Matches"
        subtitle="See who is interested, discover mutual connections, and turn a shared interest into a conversation."
        features={LIKES_FEATURES}
      />
      <MegaMenu
        isOpen={openMega === "stories"}
        onClose={closeMega}
        title="Explore Stories"
        subtitle="Share moments from campus life and discover what is happening across the Nexora community."
        features={STORIES_FEATURES}
      />

      {/* ── Page Content ──────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}
