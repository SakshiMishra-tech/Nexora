import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Settings, 
  Bell, 
  MessageSquare, 
  Phone, 
  Globe2, 
  EyeOff, 
  ListFilter 
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
  const [activeTab, setActiveTab] = useState<"preferences" | "notifications">("preferences");
  const [hasChanges, setHasChanges] = useState(false);

  const [notifications, setNotifications] = useState<LostFoundNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  useEffect(() => {
    if (user && activeTab === "notifications") {
      loadNotifications();
    }
  }, [user, activeTab]);

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
        <div className="mx-auto flex h-14 max-w-screen-xl items-center px-4 sm:px-6">
          <Link
            to="/lost-found"
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mr-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
          <Link to="/" className="flex items-center gap-2 mr-6 shrink-0 transition-opacity hover:opacity-90">
            <NexoraLogo className="h-6 w-auto" />
            <span className="hidden font-display text-lg font-black tracking-tight text-foreground sm:inline-block">
              Nexora
            </span>
          </Link>
          <div className="h-4 w-px bg-border mx-2" />
          <span className="text-sm font-bold text-foreground">Lost & Found Settings</span>
          
          <div className="flex-1" />
          <button
            onClick={saveSettings}
            disabled={!hasChanges}
            className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl disabled:opacity-50 transition-opacity"
          >
            Save Changes
          </button>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto flex max-w-screen-xl flex-col md:flex-row gap-6 p-4 sm:p-6 lg:p-8">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0 space-y-1">
            <button
              onClick={() => setActiveTab("preferences")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                activeTab === "preferences"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Settings className="h-4 w-4" />
              Preferences
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                activeTab === "notifications"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Bell className="h-4 w-4" />
              Notifications
            </button>
          </aside>

          {/* Content */}
          <div className="flex-1 space-y-8">
            {activeTab === "preferences" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="mb-6">
                  <h2 className="text-2xl font-black tracking-tight text-foreground">Lost & Found Preferences</h2>
                  <p className="text-sm text-muted-foreground mt-1">Manage how you view and interact with the Lost & Found section.</p>
                </div>

                <div className="space-y-6 max-w-2xl">
                  {/* Feed Preferences */}
                  <section className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="border-b border-border bg-muted/40 px-5 py-3">
                      <div className="flex items-center gap-2">
                        <ListFilter className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-bold text-foreground">Feed Preferences</h3>
                      </div>
                    </div>
                    <div className="p-5 space-y-6">
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-foreground">Default View</label>
                        <div className="grid grid-cols-3 gap-3">
                          {(["all", "lost", "found"] as const).map((opt) => (
                            <button
                              key={opt}
                              onClick={() => updateSetting("feed_default_view", opt)}
                              className={`flex items-center justify-center rounded-xl border py-2.5 text-sm font-bold capitalize transition-colors ${
                                settings.feed_default_view === opt
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-bold text-foreground">Default Sorting</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => updateSetting("feed_default_sort", "recent")}
                            className={`flex items-center justify-center rounded-xl border py-2.5 text-sm font-bold transition-colors ${
                              settings.feed_default_sort === "recent"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            Most Recent
                          </button>
                          <button
                            onClick={() => updateSetting("feed_default_sort", "oldest")}
                            className={`flex items-center justify-center rounded-xl border py-2.5 text-sm font-bold transition-colors ${
                              settings.feed_default_sort === "oldest"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            Oldest
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Contact Preferences */}
                  <section className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="border-b border-border bg-muted/40 px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-bold text-foreground">Default Contact Methods</h3>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <p className="text-xs text-muted-foreground mb-4">These will be selected by default when you create a new post.</p>
                      
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <MessageSquare className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Message on Nexora</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          checked={settings.contact_message}
                          onChange={(e) => updateSetting("contact_message", e.target.checked)}
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
                            <Phone className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Call</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          checked={settings.contact_call}
                          onChange={(e) => updateSetting("contact_call", e.target.checked)}
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                            <Globe2 className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">WhatsApp</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          checked={settings.contact_whatsapp}
                          onChange={(e) => updateSetting("contact_whatsapp", e.target.checked)}
                        />
                      </label>
                    </div>
                  </section>

                  {/* Privacy Settings */}
                  <section className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="border-b border-border bg-muted/40 px-5 py-3">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-bold text-foreground">Privacy</h3>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors block">Keep Phone Number Hidden</span>
                            <span className="text-xs text-muted-foreground">Only reveal your number when you explicitly allow a user.</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          checked={settings.privacy_hide_phone}
                          onChange={(e) => updateSetting("privacy_hide_phone", e.target.checked)}
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors block">Keep WhatsApp Hidden</span>
                            <span className="text-xs text-muted-foreground">Only reveal your number when you explicitly allow a user.</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          checked={settings.privacy_hide_whatsapp}
                          onChange={(e) => updateSetting("privacy_hide_whatsapp", e.target.checked)}
                        />
                      </label>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="mb-6">
                  <h2 className="text-2xl font-black tracking-tight text-foreground">Notifications</h2>
                  <p className="text-sm text-muted-foreground mt-1">Control what alerts you receive from Lost & Found.</p>
                </div>

                <div className="space-y-6 max-w-2xl">
                  <section className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="p-5 space-y-4">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Someone messages me about my post</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          checked={settings.notify_messages}
                          onChange={(e) => updateSetting("notify_messages", e.target.checked)}
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Someone attempts to contact me</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          checked={settings.notify_contacts}
                          onChange={(e) => updateSetting("notify_contacts", e.target.checked)}
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">My post is resolved or recovered</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          checked={settings.notify_resolved}
                          onChange={(e) => updateSetting("notify_resolved", e.target.checked)}
                        />
                      </label>
                    </div>
                  </section>

                  {/* Notifications List */}
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-black text-foreground">Recent Activity</h3>
                      {notifications.some(n => !n.is_read) && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {notificationsLoading ? (
                        <p className="text-sm text-muted-foreground">Loading notifications...</p>
                      ) : notifications.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No recent notifications.</p>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`flex flex-col gap-1 p-4 rounded-xl border ${
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
                            {/* Navigation actions based on type could go here */}
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
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
