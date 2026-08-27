import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight,
  Settings, 
  Bell, 
  MessageSquare, 
  Phone, 
  Globe2, 
  EyeOff, 
  ListFilter,
  PackageSearch,
  CheckCircle2,
  Bookmark,
  FileEdit,
  FolderOpen
} from "lucide-react";
import { toast } from "sonner";
import { NexoraLogo } from "@/components/brand/NexoraLogo";
import { useAuth } from "@/hooks/useAuth";
import {
  getLostFoundNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  formatLostFoundDate,
  type LostFoundNotification,
} from "@/services/lost-found.service";

export const Route = createFileRoute("/lost-found_/settings")({
  head: () => ({ meta: [{ title: "Nexora - Lost & Found Settings" }] }),
  component: LostFoundSettingsPage,
});

type LostFoundSettings = {
  feed_default_view: "all" | "lost" | "found";
  feed_default_sort: "recent" | "oldest";
  contact_message: boolean;
  contact_call: boolean;
  contact_whatsapp: boolean;
  privacy_hide_phone: boolean;
  privacy_hide_whatsapp: boolean;
  notify_messages: boolean;
  notify_contacts: boolean;
  notify_resolved: boolean;
};

const defaultSettings: LostFoundSettings = {
  feed_default_view: "all",
  feed_default_sort: "recent",
  contact_message: true,
  contact_call: false,
  contact_whatsapp: false,
  privacy_hide_phone: true,
  privacy_hide_whatsapp: true,
  notify_messages: true,
  notify_contacts: true,
  notify_resolved: true,
};

function LostFoundSettingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<LostFoundSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // Tab State: "main" (the menu list) or "notifications" (detailed view)
  const [activeView, setActiveView] = useState<"main" | "notifications">("main");

  const [notifications, setNotifications] = useState<LostFoundNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      try {
        const saved = localStorage.getItem(`nexora:lostfound:settings:${user.id}`);
        if (saved) {
          setSettings({ ...defaultSettings, ...JSON.parse(saved) });
        }
      } catch (e) {
        // ignore
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && activeView === "notifications") {
      loadNotifications();
    }
  }, [user, activeView]);

  async function loadNotifications() {
    try {
      setNotificationsLoading(true);
      const data = await getLostFoundNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      toast.error("Failed to mark as read");
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (e) {
      toast.error("Failed to mark all as read");
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold">Please sign in to access settings</h2>
        <Link to="/auth" className="px-4 py-2 bg-primary text-white rounded-xl font-bold">Sign in</Link>
      </div>
    );
  }

  function updateSetting<K extends keyof LostFoundSettings>(key: K, value: LostFoundSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }

  function saveSettings() {
    try {
      localStorage.setItem(`nexora:lostfound:settings:${user!.id}`, JSON.stringify(settings));
      setHasChanges(false);
      toast.success("Settings saved successfully.");
    } catch (e) {
      toast.error("Failed to save settings.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full items-center px-4 sm:px-6 lg:px-8">
          <Link
            to="/lost-found"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mr-3"
            aria-label="Back to Lost & Found"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="text-sm font-black uppercase tracking-wider text-foreground">Lost & Found Settings</span>
          
          <div className="flex-1" />
          <button
            onClick={saveSettings}
            disabled={!hasChanges}
            className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl disabled:opacity-50 transition-opacity"
          >
            Save Changes
          </button>
        </div>
      </header>

      <main className="flex-1 pb-12">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 space-y-8">

          {activeView === "notifications" ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setActiveView("main")}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="text-2xl font-black tracking-tight text-foreground">Notifications</h2>
                <div className="flex-1" />
                {notifications.some(n => !n.is_read) && (
                  <button onClick={handleMarkAllRead} className="text-xs font-bold text-primary hover:underline">
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {notificationsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Loading notifications...</p>
                ) : notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No recent notifications.</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex flex-col gap-1 p-4 rounded-2xl border ${
                        notif.is_read ? "bg-card border-border" : "bg-primary/5 border-primary/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {notif.type === "message" && "You received a new message regarding your post."}
                            {notif.type === "contact" && "Someone has tried to contact you."}
                            {notif.type === "resolved" && "Your post was marked as resolved."}
                            {notif.type === "reopened" && "Your post was reopened."}
                          </p>
                          {notif.post && (
                            <p className="text-xs font-bold text-muted-foreground mt-0.5">
                              Item: {notif.post.item_name}
                            </p>
                          )}
                          <span className="text-[10px] text-muted-foreground block mt-1.5">
                            {formatLostFoundDate(notif.created_at)}
                          </span>
                        </div>
                        {!notif.is_read && (
                          <button
                            onClick={() => handleMarkRead(notif.id)}
                            className="shrink-0 rounded-lg bg-background border border-border px-2 py-1 text-[10px] font-bold text-muted-foreground hover:bg-muted"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                      {notif.post && (
                        <div className="mt-2">
                          <Link 
                            to="/lost-found"
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            View in Lost & Found
                          </Link>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300 space-y-8">
              
              {/* MY ACTIVITY SECTION */}
              <section>
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 px-1">My Activity</h3>
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="flex flex-col divide-y divide-border">
                    <button onClick={() => navigate({ to: "/lost-found", search: { view: "mine", type: "lost" } })} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500"><PackageSearch className="h-4 w-4" /></div>
                        <span className="text-sm font-bold text-foreground">My Lost Posts</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                    <button onClick={() => navigate({ to: "/lost-found", search: { view: "mine", type: "found" } })} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600"><PackageSearch className="h-4 w-4" /></div>
                        <span className="text-sm font-bold text-foreground">My Found Posts</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                    <button onClick={() => navigate({ to: "/lost-found", search: { view: "drafts" } })} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500"><FileEdit className="h-4 w-4" /></div>
                        <span className="text-sm font-bold text-foreground">Drafts</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                    <button onClick={() => navigate({ to: "/lost-found", search: { view: "saved" } })} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Bookmark className="h-4 w-4" /></div>
                        <span className="text-sm font-bold text-foreground">Saved Posts</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                    <button onClick={() => navigate({ to: "/lost-found", search: { view: "resolved" } })} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"><CheckCircle2 className="h-4 w-4" /></div>
                        <span className="text-sm font-bold text-foreground">Resolved</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                  </div>
                </div>
              </section>

              {/* NOTIFICATIONS SECTION */}
              <section>
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 px-1">Notifications</h3>
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="flex flex-col divide-y divide-border">
                    <button onClick={() => setActiveView("notifications")} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Bell className="h-4 w-4" /></div>
                        <span className="text-sm font-bold text-foreground">Lost & Found Notifications</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                    
                    {/* Notification Toggles */}
                    <div className="p-4 space-y-4 bg-muted/20">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Alert on new messages</span>
                        <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary" checked={settings.notify_messages} onChange={(e) => updateSetting("notify_messages", e.target.checked)} />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Alert on contact attempts</span>
                        <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary" checked={settings.notify_contacts} onChange={(e) => updateSetting("notify_contacts", e.target.checked)} />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Alert on resolved posts</span>
                        <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary" checked={settings.notify_resolved} onChange={(e) => updateSetting("notify_resolved", e.target.checked)} />
                      </label>
                    </div>
                  </div>
                </div>
              </section>

              {/* POSTING PREFERENCES SECTION */}
              <section>
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 px-1">Posting Preferences</h3>
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="flex flex-col divide-y divide-border">
                    {/* Default Contact Methods */}
                    <div className="p-4 space-y-4">
                      <h4 className="text-sm font-bold text-foreground mb-1">Default Contact Methods</h4>
                      <p className="text-xs text-muted-foreground mb-4">Automatically selected when creating a post.</p>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-foreground">Message on Nexora</span>
                        </div>
                        <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary" checked={settings.contact_message} onChange={(e) => updateSetting("contact_message", e.target.checked)} />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold text-foreground">Call</span>
                        </div>
                        <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary" checked={settings.contact_call} onChange={(e) => updateSetting("contact_call", e.target.checked)} />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <Globe2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-semibold text-foreground">WhatsApp</span>
                        </div>
                        <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary" checked={settings.contact_whatsapp} onChange={(e) => updateSetting("contact_whatsapp", e.target.checked)} />
                      </label>
                    </div>
                    
                    {/* Feed Preferences */}
                    <div className="p-4 space-y-4 bg-muted/10">
                      <h4 className="text-sm font-bold text-foreground mb-1">Feed View Preferences</h4>
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-muted-foreground">Default View</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["all", "lost", "found"] as const).map((opt) => (
                            <button
                              key={opt}
                              onClick={() => updateSetting("feed_default_view", opt)}
                              className={`flex items-center justify-center rounded-xl border py-2 text-xs font-bold capitalize transition-colors ${
                                settings.feed_default_view === opt ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
