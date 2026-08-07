import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Settings,
  Moon,
  Sun,
  Laptop,
  LogOut,
  ChevronDown,
  Shield,
  Layers,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AUTH_ROUTES } from "@/lib/auth";

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
  const { theme, setTheme } = useTheme();

  // Profile data parsing
  const displayName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Student";
  const initials =
    displayName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST";
  const avatarUrl = (profile as any)?.avatar_url || user?.user_metadata?.avatar_url || "";
  const subtitle = profile?.college_name || user?.email || "Campus Student";

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

  const handleAction = (to: string, sectionId?: string) => {
    setIsOpen(false);
    if (onCloseParent) onCloseParent();
    if (sectionId) {
      window.sessionStorage.setItem("nexora-settings-section", sectionId);
    }
    void navigate({ to });
  };

  const handleLogout = async () => {
    try {
      setIsOpen(false);
      if (onCloseParent) onCloseParent();
      await signOut();
      void navigate({ to: AUTH_ROUTES.login });
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  return (
    <div className="relative inline-block text-left">
      {/* Avatar Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-3 shadow-soft transition-all hover:bg-secondary active:scale-95"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl} alt="" />
          <AvatarFallback className="bg-primary text-xs font-black text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-28 truncate text-xs font-bold text-foreground sm:inline">
          {displayName.split(" ")[0]}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-2 w-68 origin-top-right rounded-2xl border border-border bg-card p-2 shadow-mega backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 z-50`}
        >
          {/* User Header */}
          <button
            type="button"
            onClick={() => handleAction(AUTH_ROUTES.settings, "location")}
            className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-secondary group"
          >
            <Avatar className="h-10 w-10 shrink-0 border border-primary/20 group-hover:scale-105 transition-transform">
              <AvatarImage src={avatarUrl} alt="" />
              <AvatarFallback className="bg-primary text-xs font-black text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user.email}
              </p>
              {profile?.college_name && (
                <p className="truncate text-[10px] text-muted-foreground/80">
                  {profile.college_name}
                </p>
              )}
            </div>
          </button>

          <div className="my-1.5 h-px bg-border/60" />

          {/* 3-Theme Switcher Segmented Control */}
          <div className="px-2 py-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
              Theme Mode
            </p>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-background p-1 border border-border">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-bold transition-all ${
                  theme === "dark"
                    ? "bg-foreground text-background shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Dark Theme"
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-bold transition-all ${
                  theme === "light"
                    ? "bg-foreground text-background shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Light Theme"
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-bold transition-all ${
                  theme === "system"
                    ? "bg-foreground text-background shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="System Default"
              >
                <Laptop className="h-3.5 w-3.5" />
                <span>Auto</span>
              </button>
            </div>
          </div>

          <div className="my-1.5 h-px bg-border/60" />

          {/* Quick Nav Links */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => handleAction(AUTH_ROUTES.settings, "spaces")}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors text-left"
            >
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span>Campus Spaces Settings</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction(AUTH_ROUTES.settings, "location")}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors text-left"
            >
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Campus & Location</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction(AUTH_ROUTES.settings, "security")}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors text-left"
            >
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span>Security & Account</span>
            </button>
          </div>

          <div className="my-1.5 h-px bg-border/60" />

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors text-left"
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}
