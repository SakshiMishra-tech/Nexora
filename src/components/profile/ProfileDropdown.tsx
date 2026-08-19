import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Settings, LogOut, ChevronDown, Sun, Moon, Monitor } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AUTH_ROUTES } from "@/lib/auth";

// ── Theme helpers ─────────────────────────────────────────────────────────────
type ThemeMode = "dark" | "light" | "system";

function getStoredTheme(): ThemeMode {
  try { return (localStorage.getItem("nexora-theme") as ThemeMode) || "system"; } catch { return "system"; }
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else if (mode === "light") {
    root.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  }
}

function setStoredTheme(mode: ThemeMode) {
  try { localStorage.setItem("nexora-theme", mode); } catch { /* ok */ }
  applyTheme(mode);
}

// Apply on module load (browser only)
if (typeof document !== "undefined") applyTheme(getStoredTheme());
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileDropdownProps {
  onCloseParent?: () => void;
  align?: "left" | "right";
}

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ElementType }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
];

export function ProfileDropdown({ onCloseParent, align = "right" }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const displayName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Student";
  const initials =
    displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "ST";
  const avatarUrl = (profile as any)?.avatar_url || user?.user_metadata?.avatar_url || "";

  // System color scheme listener
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNavigate = (to: string) => {
    setIsOpen(false);
    if (onCloseParent) onCloseParent();
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

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode);
    setStoredTheme(mode);
  };

  if (!user) return null;

  return (
    <div className="relative inline-block text-left">
      {/* Trigger */}
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
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute ${align === "right" ? "right-0" : "left-0"} mt-2 w-64 origin-top-right rounded-2xl border border-border bg-card p-2 shadow-mega backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 z-50`}
        >
          {/* User Header */}
          <div className="flex items-center gap-3 rounded-xl p-2.5">
            <Avatar className="h-10 w-10 shrink-0 border border-primary/20">
              <AvatarImage src={avatarUrl} alt="" />
              <AvatarFallback className="bg-primary text-xs font-black text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-foreground">{displayName}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
              {profile?.college_name && (
                <p className="truncate text-[10px] text-muted-foreground/70">{profile.college_name}</p>
              )}
            </div>
          </div>

          {/* Theme Switcher */}
          <div className="px-1 pb-2 pt-1">
            <p className="mb-1.5 px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Theme
            </p>
            <div className="flex gap-1 rounded-xl bg-secondary p-1">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleThemeChange(value)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-bold transition-all duration-150 ${
                    theme === value
                      ? "bg-card text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="my-1 h-px bg-border/60" />

          {/* Settings */}
          <button
            type="button"
            id="profile-dropdown-settings"
            onClick={() => handleNavigate(AUTH_ROUTES.settings)}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors text-left"
          >
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-secondary text-muted-foreground">
              <Settings className="h-3.5 w-3.5" />
            </div>
            <span>Settings</span>
          </button>

          <div className="my-1 h-px bg-border/60" />

          {/* Logout */}
          <button
            type="button"
            id="profile-dropdown-logout"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors text-left"
          >
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-destructive/10 text-destructive">
              <LogOut className="h-3.5 w-3.5" />
            </div>
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}
