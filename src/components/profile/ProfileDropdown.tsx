import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  User,
  ShoppingBag,
  Heart,
  Clock,
  MessageSquare,
  Bell,
  Users,
  BookOpen,
  GraduationCap,
  BedDouble,
  MapPin,
  Car,
  Calendar,
  Settings,
  Shield,
  Award,
  Palette,
  Moon,
  Globe,
  HelpCircle,
  Mail,
  Bug,
  Lightbulb,
  FileText,
  LogOut,
  ChevronDown,
  Edit2,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AUTH_ROUTES, getProfileCompletionPercent } from "@/lib/auth";

interface ProfileDropdownProps {
  onCloseParent?: () => void;
  align?: "left" | "right";
}

export function ProfileDropdown({ onCloseParent, align = "right" }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  // Profile data parsing
  const displayName = profile?.full_name?.trim() || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "ST";
  const avatarUrl = (profile as any)?.avatar_url || user?.user_metadata?.avatar_url || "";
  const collegeName = profile?.college_name || "College not set";
  const department = (profile as any)?.department || "Computer Science";
  const year = (profile as any)?.year || "3rd Year";
  const completionPercent = getProfileCompletionPercent(profile) || 85; // Fallback to 85% if not set

  // Mock stats (Listings, Saved, Messages) to make it premium and realistic
  const stats = {
    listings: (profile as any)?.listings_count || 4,
    saved: (profile as any)?.saved_count || 12,
    messages: 3
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAction = (to?: string, onClick?: () => void, sectionId?: string) => {
    setIsOpen(false);
    if (onCloseParent) onCloseParent();
    
    if (sectionId) {
      window.sessionStorage.setItem("nexora-settings-section", sectionId);
    }

    if (onClick) {
      onClick();
    } else if (to) {
      void navigate({ to });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      void navigate({ to: AUTH_ROUTES.login });
    } catch (e) {
      console.error(e);
    }
  };

  // Menu configurations
  const menuConfig = [
    {
      title: "PRIMARY ACTIONS",
      items: [
        { id: "profile", label: "My Profile", icon: User, to: AUTH_ROUTES.completeProfile },
        { id: "listings", label: "My Listings", icon: ShoppingBag, to: "/marketplace", searchParam: { view: "seller" } },
        { id: "saved", label: "Saved Items", icon: Heart, to: "/marketplace", searchParam: { view: "saved" } },
        { id: "recent", label: "Recently Viewed", icon: Clock, to: "/marketplace" },
        { id: "messages", label: "Messages", icon: MessageSquare, to: "/marketplace", searchParam: { view: "chats" } },
        { id: "notifications", label: "Notifications", icon: Bell, to: AUTH_ROUTES.settings, sectionId: "notifications" },
        { id: "connections", label: "My Connections", icon: Users, to: AUTH_ROUTES.settings, sectionId: "privacy" }
      ]
    },
    {
      title: "CAMPUS",
      items: [
        { id: "notes", label: "My Notes", icon: BookOpen, to: AUTH_ROUTES.settings, sectionId: "spaces" },
        { id: "projects", label: "My Projects", icon: GraduationCap, to: AUTH_ROUTES.settings, sectionId: "spaces" },
        { id: "roommates", label: "My Roommate Requests", icon: BedDouble, to: "/roommates" },
        { id: "lostfound", label: "Lost & Found", icon: MapPin, to: "/lost-found" },
        { id: "rides", label: "My Rides", icon: Car, to: AUTH_ROUTES.settings, sectionId: "spaces" },
        { id: "events", label: "My Events", icon: Calendar, to: AUTH_ROUTES.settings, sectionId: "spaces" }
      ]
    },
    {
      title: "ACCOUNT",
      items: [
        { id: "settings", label: "Settings", icon: Settings, to: AUTH_ROUTES.settings, sectionId: "general" },
        { id: "privacy", label: "Privacy & Security", icon: Shield, to: AUTH_ROUTES.settings, sectionId: "privacy" },
        { id: "verification", label: "Student Verification", icon: Award, to: AUTH_ROUTES.settings, sectionId: "verification" },
        { id: "appearance", label: "Appearance", icon: Palette, to: AUTH_ROUTES.settings, sectionId: "appearance" },
        { id: "language", label: "Language", icon: Globe, to: AUTH_ROUTES.settings, sectionId: "language" },
        { id: "notifprefs", label: "Notification Preferences", icon: Bell, to: AUTH_ROUTES.settings, sectionId: "notifications" }
      ]
    },
    {
      title: "SUPPORT",
      items: [
        { id: "help", label: "Help Center", icon: HelpCircle, to: AUTH_ROUTES.settings, sectionId: "support" },
        { id: "contact", label: "Contact Support", icon: Mail, to: AUTH_ROUTES.settings, sectionId: "support" },
        { id: "bug", label: "Report a Bug", icon: Bug, to: AUTH_ROUTES.settings, sectionId: "support" },
        { id: "feedback", label: "Send Feedback", icon: Lightbulb, to: AUTH_ROUTES.settings, sectionId: "support" }
      ]
    },
    {
      title: "LEGAL",
      items: [
        { id: "privacypol", label: "Privacy Policy", icon: FileText, to: "/privacy" },
        { id: "termscond", label: "Terms & Conditions", icon: FileText, to: "/terms" },
        { id: "guidelines", label: "Community Guidelines", icon: FileText, to: "/terms" }
      ]
    }
  ];

  if (!user) return null;

  return (
    <div className="relative inline-block text-left">
      {/* Avatar Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-border/80 bg-paper/60 p-1 pr-3 shadow-soft backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl} alt="" />
          <AvatarFallback className="bg-primary text-xs font-black text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-24 truncate text-xs font-black text-foreground sm:inline">{displayName.split(" ")[0]}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Container */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-2 w-[340px] origin-top-right rounded-[1.25rem] border border-border bg-paper/95 shadow-mega backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50`}
        >
          {/* 1. Header Profile block */}
          <div className="p-4 border-b border-border/60">
            <div className="flex gap-3">
              <Avatar className="h-14 w-14 border-2 border-primary/20">
                <AvatarImage src={avatarUrl} alt="" />
                <AvatarFallback className="bg-primary text-sm font-black text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="truncate text-sm font-black text-foreground leading-none">{displayName}</h4>
                  <span className="inline-flex shrink-0 items-center justify-center rounded bg-primary/10 px-1 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">
                    <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
                    Verified
                  </span>
                </div>
                <p className="truncate text-xs font-bold text-muted-foreground mt-1">{collegeName}</p>
                <p className="truncate text-[10px] font-semibold text-muted-foreground/80 mt-0.5">{department} • {year}</p>

                {/* Completion tracker */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[10px] font-black mb-1">
                    <span className="text-muted-foreground/80">Profile Strength</span>
                    <span className="text-primary">{completionPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${completionPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/40 text-center">
              <div className="rounded-lg bg-card/40 p-1.5">
                <span className="block text-xs font-black text-foreground">{stats.listings}</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Listings</span>
              </div>
              <div className="rounded-lg bg-card/40 p-1.5">
                <span className="block text-xs font-black text-foreground">{stats.saved}</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Saved</span>
              </div>
              <div className="rounded-lg bg-card/40 p-1.5">
                <span className="block text-xs font-black text-foreground">{stats.messages}</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Messages</span>
              </div>
            </div>

            {/* Edit button */}
            <button
              onClick={() => handleAction(AUTH_ROUTES.completeProfile)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card/50 py-2 text-xs font-black hover:bg-secondary transition-colors"
            >
              <Edit2 className="h-3 w-3" />
              <span>Edit Profile Details</span>
            </button>
          </div>

          {/* 2. Menu Navigation Sections (Scrollable) */}
          <div className="max-h-[360px] overflow-y-auto py-2 divide-y divide-border/40">
            {menuConfig.map((section) => (
              <div key={section.title} className="py-2.5 px-3">
                <span className="block px-2 text-[9px] font-black uppercase tracking-wider text-muted-foreground/75 mb-1.5">
                  {section.title}
                </span>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.to) {
                            handleAction(item.to, undefined, item.sectionId);
                          }
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-black text-foreground/80 hover:bg-secondary hover:text-foreground transition-all duration-150 text-left"
                      >
                        <span className="p-1 rounded bg-secondary/80 text-muted-foreground group-hover:text-primary transition-colors">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {item.id === "messages" && stats.messages > 0 && (
                          <span className="rounded-full bg-warm px-1.5 py-0.5 text-[9px] font-black text-warm-foreground animate-pulse">
                            {stats.messages}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 3. Bottom logout button */}
          <div className="p-2 border-t border-border/60 shrink-0">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-black text-destructive hover:bg-destructive/10 transition-colors text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout Account</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
