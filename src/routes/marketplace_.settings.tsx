import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  UserCircle,
  Bell,
  Shield,
  Sliders,
  Settings,
  LogOut,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Power,
  RefreshCw,
  Eye,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { NexoraLogo } from "@/components/brand/NexoraLogo";
import { getUserSettings, updateModuleEnabled } from "@/services/user-settings.service";

export const Route = createFileRoute("/marketplace_/settings")({
  head: () => ({ meta: [{ title: "Nexora — Marketplace Settings" }] }),
  component: MarketplaceSettingsPage,
});

type SettingsTab = "preferences" | "controls" | "session" | "danger";

function MarketplaceSettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("preferences");
  
  // Settings States
  const [prefs, setPrefs] = useState({
    receiveCrossCampusOffers: true,
    defaultListingCondition: "Good",
    autoNegotiable: false,
    emailOnMessages: true,
    pushOnOffers: true,
    priceDropAlerts: true,
    showPublicProfile: true,
    displayCampus: true,
  });

  const [marketplaceEnabled, setMarketplaceEnabled] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);

  // Load current marketplace enablement status
  useEffect(() => {
    if (!user) return;
    getUserSettings(user.id).then((settings) => {
      if (settings) {
        setMarketplaceEnabled(settings.marketplace_enabled !== false);
      }
      setLoadingStatus(false);
    });
  }, [user]);

  // Load preferences from local storage if they exist
  useEffect(() => {
    const saved = localStorage.getItem("nexora:marketplace:settings");
    if (saved) {
      try {
        setPrefs(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const savePrefs = (updatedPrefs: typeof prefs) => {
    setPrefs(updatedPrefs);
    localStorage.setItem("nexora:marketplace:settings", JSON.stringify(updatedPrefs));
    toast.success("Preferences updated successfully.");
  };

  const handleToggle = (key: keyof typeof prefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    savePrefs(updated);
  };

  const handleSelectChange = (key: keyof typeof prefs, value: string) => {
    const updated = { ...prefs, [key]: value };
    savePrefs(updated);
  };

  // Toggle Marketplace Access (Deactivate / Reactivate)
  const handleToggleMarketplaceAccess = async (enable: boolean) => {
    if (!user) return;
    setIsUpdatingStatus(true);
    try {
      const { data, error } = await updateModuleEnabled(user.id, "marketplace", enable);
      if (error) throw error;
      setMarketplaceEnabled(enable);
      if (enable) {
        toast.success("Marketplace account reactivated! You can now browse and post listings.");
      } else {
        toast.success("Marketplace account deactivated successfully.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update marketplace status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Logout from Marketplace (logout from app)
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully.");
      void navigate({ to: "/auth/login", replace: true });
    } catch (e) {
      toast.error("Logout failed.");
    }
  };

  // Delete all Marketplace Listings & Data
  const handleDeleteMarketplaceData = async () => {
    if (!user) return;
    const confirmDelete = window.confirm(
      "Are you absolutely sure you want to delete all your marketplace data? This will permanently delete all your listings and chats. This action is irreversible."
    );
    if (!confirmDelete) return;

    setIsDeletingData(true);
    try {
      const { error } = await supabase
        .from("marketplace_items")
        .delete()
        .eq("seller_id", user.id);

      if (error) throw error;
      toast.success("All your listings have been permanently deleted.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete marketplace data.");
    } finally {
      setIsDeletingData(false);
    }
  };

  const menuItems = [
    { id: "preferences" as SettingsTab, label: "Marketplace Preferences", icon: Sliders },
    { id: "controls" as SettingsTab, label: "Marketplace Controls", icon: Power },
    { id: "session" as SettingsTab, label: "Session Settings", icon: LogOut },
    { id: "danger" as SettingsTab, label: "Danger Zone", icon: Trash2 },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-foreground font-sans">
      {/* ── TOPBAR ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 sm:px-6 bg-[#030712] border-b border-border/50">
        <Link to="/marketplace" className="focus:outline-none rounded-xl">
          <NexoraLogo size="sm" />
        </Link>
        <span className="text-muted-foreground/30 mx-3">|</span>
        <span className="text-sm font-bold text-foreground">Marketplace Settings</span>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Back Link */}
        <div className="mb-8">
          <button
            onClick={() => {
              if (window.history.length > 2) window.history.back();
              else navigate({ to: "/marketplace" });
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Marketplace
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                    active
                      ? "bg-secondary text-primary"
                      : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Settings Panel Body */}
          <div className="md:col-span-3 min-h-[50vh] rounded-2xl border border-border/50 bg-card p-5 sm:p-6">
            {/* Tab: PREFERENCES */}
            {activeTab === "preferences" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Marketplace Preferences</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Customize your buying and selling experience.</p>
                </div>

                <div className="space-y-6">
                  {/* Category: Account / Prefs */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-primary">Preferences</h3>
                    
                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-background/30 border border-border/40">
                      <div>
                        <p className="text-sm font-bold text-foreground">Receive Cross-Campus Offers</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Show listings and receive offers from nearby campuses.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefs.receiveCrossCampusOffers}
                        onChange={() => handleToggle("receiveCrossCampusOffers")}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-background/30 border border-border/40">
                      <div>
                        <p className="text-sm font-bold text-foreground">Default Listing Condition</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Pre-select condition when creating new listings.</p>
                      </div>
                      <select
                        value={prefs.defaultListingCondition}
                        onChange={e => handleSelectChange("defaultListingCondition", e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        <option value="New">New</option>
                        <option value="Like New">Like New</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-background/30 border border-border/40">
                      <div>
                        <p className="text-sm font-bold text-foreground">Auto-negotiable by Default</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Turn on negotiations by default for new listings.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefs.autoNegotiable}
                        onChange={() => handleToggle("autoNegotiable")}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Category: Notifications */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-primary">Notification Settings</h3>
                    
                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-background/30 border border-border/40">
                      <div>
                        <p className="text-sm font-bold text-foreground">Email Notifications</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Receive email digests for new messages when offline.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefs.emailOnMessages}
                        onChange={() => handleToggle("emailOnMessages")}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-background/30 border border-border/40">
                      <div>
                        <p className="text-sm font-bold text-foreground">Push Notifications for Offers</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Instant alerts when a buyer makes an offer on your items.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefs.pushOnOffers}
                        onChange={() => handleToggle("pushOnOffers")}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-background/30 border border-border/40">
                      <div>
                        <p className="text-sm font-bold text-foreground">Price Drop Alerts</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Get notified if items in your wishlist drop in price.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefs.priceDropAlerts}
                        onChange={() => handleToggle("priceDropAlerts")}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Category: Privacy */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-primary">Privacy Settings</h3>

                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-background/30 border border-border/40">
                      <div>
                        <p className="text-sm font-bold text-foreground">Public Listings visibility</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Show your active listings on your profile card to anyone.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefs.showPublicProfile}
                        onChange={() => handleToggle("showPublicProfile")}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-background/30 border border-border/40">
                      <div>
                        <p className="text-sm font-bold text-foreground">Display Campus Location</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Show your campus name next to your name on item pages.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefs.displayCampus}
                        onChange={() => handleToggle("displayCampus")}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: CONTROLS */}
            {activeTab === "controls" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Marketplace Controls</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage your marketplace activation status.</p>
                </div>

                {loadingStatus ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-background/30">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground">Marketplace Status</p>
                        <p className="text-xs text-muted-foreground">
                          {marketplaceEnabled
                            ? "Your account is currently Active. You can trade and list items."
                            : "Your account is currently Deactivated. Your profile and items are hidden."}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {marketplaceEnabled ? (
                          <button
                            type="button"
                            disabled={isUpdatingStatus}
                            onClick={() => handleToggleMarketplaceAccess(false)}
                            className="rounded-xl bg-secondary text-foreground border border-border/60 hover:bg-secondary/70 transition-colors px-4 py-2 text-xs font-bold shrink-0"
                          >
                            Deactivate Account
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isUpdatingStatus}
                            onClick={() => handleToggleMarketplaceAccess(true)}
                            className="rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity px-4 py-2 text-xs font-bold shrink-0"
                          >
                            Reactivate Account
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: SESSION */}
            {activeTab === "session" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Session Settings</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Log out of your Nexora Marketplace session.</p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-background/30">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">Logout from Marketplace</p>
                      <p className="text-xs text-muted-foreground">End your active trading session on this device.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2 rounded-xl bg-secondary text-destructive border border-destructive/20 hover:bg-destructive/10 transition-colors px-4 py-2.5 text-xs font-bold shrink-0"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: DANGER ZONE */}
            {activeTab === "danger" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-lg font-bold text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    Danger Zone
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Irreversible actions regarding your marketplace account.</p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-4 p-5 rounded-2xl border border-destructive/30 bg-destructive/5">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-destructive">Delete Marketplace Data</p>
                      <p className="text-xs text-muted-foreground">Permanently delete all listings you have published.</p>
                    </div>
                    <button
                      type="button"
                      disabled={isDeletingData}
                      onClick={handleDeleteMarketplaceData}
                      className="flex items-center gap-2 rounded-xl bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity px-4 py-2.5 text-xs font-bold shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeletingData ? "Deleting..." : "Delete All Listings"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
