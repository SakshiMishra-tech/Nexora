import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Edit3,
  Filter,
  ImagePlus,
  Loader2,
  MapPin,
  MessageSquare,
  PackageSearch,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  X,
  Bookmark,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import { NexoraLogo } from "@/components/brand/NexoraLogo";
import { ModuleAccessBoundary } from "@/components/ModuleAccessControl";
import { useAuth } from "@/hooks/useAuth";
import {
  contactLostFoundPoster,
  createLostFoundItem,
  deleteLostFoundItem,
  formatLostFoundDate,
  getLostFoundItems,
  LOST_FOUND_CAMPUSES,
  LOST_FOUND_CATEGORIES,
  markLostFoundRecovered,
  updateLostFoundItem,
  getUserContactInfo,
  getPosterContactInfo,
  saveLostFoundDraft,
  getLostFoundDraft,
  getSavedLostFoundPosts,
  saveLostFoundPost,
  unsaveLostFoundPost,
  reopenLostFoundItem,
  getLostFoundNotifications,
  type LostFoundItem,
  type LostFoundSort,
  type LostFoundType,
} from "@/services/lost-found.service";

export const Route = createFileRoute("/lost-found")({
  head: () => ({ meta: [{ title: "Nexora - Lost & Found" }] }),
  component: LostFoundRoute,
});

type TypeFilter = "all" | LostFoundType | "drafts" | "resolved" | "saved";

type FormState = {
  type: LostFoundType;
  item_name: string;
  category: string;
  description: string;
  location: string;
  campus: string;
  occurred_at: string;
  contact_preference: string[];
  phone: string;
  whatsapp: string;
  image: File | null;
  otherCampus?: string;
  draftId?: string;
};

const emptyForm: FormState = {
  type: "lost",
  item_name: "",
  category: "",
  description: "",
  location: "",
  campus: "",
  occurred_at: "",
  contact_preference: ["message"],
  phone: "",
  whatsapp: "",
  image: null,
  otherCampus: "",
  draftId: undefined,
};

function LostFoundRoute() {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { user, profile, loading: authLoading, signOut } = useAuth();

  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState("");
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Check auth & load saved posts
  useEffect(() => {
    async function init() {
      if (user) {
        try {
          const saved = await getSavedLostFoundPosts();
          setSavedPostIds(new Set(saved.map(s => s.post_id)));
          
          const notifs = await getLostFoundNotifications();
          setUnreadCount(notifs.filter(n => !n.is_read).length);
        } catch (e) {
          console.error(e);
        }
      }
    }
    init();
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const searchTab = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null;
  const validTabs = ["lost", "found", "drafts", "resolved", "saved"];
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(
    validTabs.includes(searchTab || "") ? (searchTab as TypeFilter) : "all"
  );
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [campusFilter, setCampusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sort, setSort] = useState<LostFoundSort>("recent");

  const [showMine, setShowMine] = useState(validTabs.includes(searchTab || ""));
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Temporary filter states for the popover
  const [tempCategory, setTempCategory] = useState(categoryFilter);
  const [tempCampus, setTempCampus] = useState(campusFilter);
  const [tempDate, setTempDate] = useState(dateFilter);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [editingItem, setEditingItem] = useState<LostFoundItem | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "submitting">("idle");
  const [actionId, setActionId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);

  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);

  const canPost = !!user && !authLoading;

  // Load user preferences for Lost & Found
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  useEffect(() => {
    if (user && !prefsLoaded) {
      try {
        const saved = localStorage.getItem(`nexora:lostfound:settings:${user.id}`);
        if (saved) {
          const prefs = JSON.parse(saved);
          if (!searchTab) { // don't override URL param
             if (prefs.feed_default_view && prefs.feed_default_view !== "all") {
               setTypeFilter(prefs.feed_default_view);
             }
          }
          if (prefs.feed_default_sort) {
             setSort(prefs.feed_default_sort);
          }
        }
      } catch (e) {
        // ignore
      }
      setPrefsLoaded(true);
    }
  }, [user, prefsLoaded, searchTab]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    if (!profileOpen) return;
    function handleOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [profileOpen]);

  const filterMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!filterOpen) return;
    function handleOutside(e: MouseEvent) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [filterOpen]);

  useEffect(() => {
    if (filterOpen) {
      setTempCategory(categoryFilter);
      setTempCampus(campusFilter);
      setTempDate(dateFilter);
    }
  }, [filterOpen, categoryFilter, campusFilter, dateFilter]);

  function applyFilters() {
    setCategoryFilter(tempCategory);
    setCampusFilter(tempCampus);
    setDateFilter(tempDate);
    setFilterOpen(false);
  }

  function clearFilters() {
    setTempCategory("all");
    setTempCampus("all");
    setTempDate("");
    setCategoryFilter("all");
    setCampusFilter("all");
    setDateFilter("");
    setFilterOpen(false);
  }

  const activeFilterCount = (categoryFilter !== "all" ? 1 : 0) + (campusFilter !== "all" ? 1 : 0) + (dateFilter !== "" ? 1 : 0);

  // Auto-focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [searchOpen]);

  // ── Load Items ────────────────────────────────────────────────────
  async function loadItems() {
    setItemsLoading(true);
    setItemsError("");
    try {
      const isLostOrFound = typeFilter === "lost" || typeFilter === "found";
      const isMineView = showMine || typeFilter === "drafts" || typeFilter === "resolved";

      let statusFilter: any = "all";
      if (typeFilter === "drafts") {
        statusFilter = "DRAFT";
      } else if (typeFilter === "resolved") {
        statusFilter = ["RESOLVED", "RECOVERED"];
      } else if (typeFilter === "saved") {
        statusFilter = "all";
      } else if (showMine) {
        statusFilter = "ACTIVE"; // My Lost / My Found posts should only show active posts
      }

      if (typeFilter === "saved") {
        const savedPosts = await getSavedLostFoundPosts();
        // filter out nulls if a post was deleted
        const validPosts = savedPosts.map(s => s.post).filter(Boolean) as LostFoundItem[];
        setItems(validPosts);
        setItemsLoading(false);
        return;
      }

      const data = await getLostFoundItems({
        query,
        type: isLostOrFound ? typeFilter : "all",
        category: categoryFilter,
        campus: campusFilter,
        date: dateFilter,
        sort,
        mineOnly: isMineView,
        includeRecovered: isMineView,
        status: statusFilter,
        // Exclude own posts from the PUBLIC feed so users don't see their own items
        excludeUserId: !isMineView && user ? user.id : undefined,
      });
      setItems(data);
    } catch (error: any) {
      setItemsError(error?.message || "Unable to load posts. Please try again.");
    } finally {
      setItemsLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, typeFilter, categoryFilter, campusFilter, dateFilter, sort, showMine, user?.id]);

  // Warn before leaving with unsaved form
  useEffect(() => {
    const hasDraft = Boolean(form.item_name || form.category || form.description || form.location || form.campus || form.image);
    const handler = (event: BeforeUnloadEvent) => {
      if (!postOpen || !hasDraft || submitState === "submitting") return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [form, postOpen, submitState]);

  // Debounced autosave for drafts
  useEffect(() => {
    if (!postOpen || editingItem || submitState === "submitting") return;
    if (!form.item_name && !form.description && !form.category) return;

    setIsAutosaving(true);
    const timeout = setTimeout(async () => {
      try {
        const payload = {
          ...form,
          campus: form.campus === "Other" ? (form.otherCampus || "") : form.campus,
        };
        const draft = await saveLostFoundDraft(payload, form.draftId);
        if (draft) {
          if (!form.draftId) updateForm("draftId", draft.id);
          setLastSaved(new Date());
        }
      } catch (err) {
        console.error("Autosave failed", err);
      } finally {
        setIsAutosaving(false);
      }
    }, 1500);

    return () => {
      clearTimeout(timeout);
    };
  }, [form, postOpen, editingItem, submitState]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function openPost() {
    if (!canPost) {
      toast.error("Please sign in to create a Lost & Found post.");
      return;
    }
    const info = await getUserContactInfo();
    
    // Load default contact preferences
    let defaultContacts = ["message"];
    if (user) {
      try {
        const saved = localStorage.getItem(`nexora:lostfound:settings:${user.id}`);
        if (saved) {
          const prefs = JSON.parse(saved);
          const contacts = [];
          if (prefs.contact_message) contacts.push("message");
          if (prefs.contact_call) contacts.push("call");
          if (prefs.contact_whatsapp) contacts.push("whatsapp");
          if (contacts.length > 0) defaultContacts = contacts;
        }
      } catch (e) {}
    }

    setEditingItem(null);
    setForm({ ...emptyForm, phone: info.phone, whatsapp: info.whatsapp, contact_preference: defaultContacts as any });
    setLastSaved(null);
    setFormErrors({});
    setPostOpen(true);
  }

  async function handleToggleSave(item: LostFoundItem) {
    const isSaved = savedPostIds.has(item.id);
    const newSet = new Set(savedPostIds);
    try {
      if (isSaved) {
        newSet.delete(item.id);
        setSavedPostIds(newSet);
        await unsaveLostFoundPost(item.id);
        if (typeFilter === "saved") {
          setItems(items.filter(i => i.id !== item.id));
        }
      } else {
        newSet.add(item.id);
        setSavedPostIds(newSet);
        await saveLostFoundPost(item.id);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to update saved posts");
      // Revert optimism if failed (optional)
      loadItems(); 
    }
  }

  async function handleReopen(item: LostFoundItem) {
    if (!confirm("Are you sure you want to reopen this post?")) return;
    setActionId(item.id);
    try {
      await reopenLostFoundItem(item.id);
      toast.success("Post reopened successfully!");
      loadItems();
    } catch (error: any) {
      toast.error(error.message || "Failed to reopen item");
    } finally {
      setActionId(null);
    }
  }

  function closePost() {
    const currentForm = formRef.current;
    // Flush save immediately if there's unsubmitted draft data
    if (!editingItem && (currentForm.item_name || currentForm.description || currentForm.category)) {
      const payload = {
        ...currentForm,
        campus: currentForm.campus === "Other" ? (currentForm.otherCampus || "") : currentForm.campus,
      };
      saveLostFoundDraft(payload, currentForm.draftId).catch(console.error);
    }
    setPostOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
    setFormErrors({});
    setLastSaved(null);
  }

  function handleFilterTab(type: TypeFilter) {
    setTypeFilter(type);
    setShowMine(false);
  }

  function handleProfileMenu(action: "lost" | "found" | "drafts" | "resolved" | "saved" | "account" | "settings" | "logout" | "settings-lf" | "notifications-lf") {
    setProfileOpen(false);
    if (action === "account" || action === "settings") {
      navigate({ to: "/settings" });
      return;
    }
    if (action === "logout") {
      signOut().then(() => navigate({ to: "/auth" }));
      return;
    }
    if (action === "settings-lf") {
      navigate({ to: "/lost-found/settings" });
      return;
    }
    if (action === "notifications-lf") {
      navigate({ to: "/lost-found/settings" });
      return;
    }
    setShowMine(true);
    setTypeFilter(action as TypeFilter);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canPost || submitState === "submitting") return;

    // Inline Validation
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (form.item_name.trim().length < 2) errors.item_name = "Item name must be at least 2 characters.";
    if (form.description.trim().length < 5) errors.description = "Description must be at least 5 characters.";
    if (form.location.trim().length < 2) errors.location = "Location must be at least 2 characters.";
    if (form.contact_preference.length === 0) errors.contact_preference = "Please select at least one contact method.";
    if (form.contact_preference.includes("call") && !form.phone.trim()) errors.phone = "Phone number is required for calls.";
    if (form.contact_preference.includes("whatsapp") && !form.whatsapp.trim()) errors.whatsapp = "WhatsApp number is required.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const payload = {
      ...form,
      campus: form.campus === "Other" ? (form.otherCampus?.trim() || "Other") : form.campus,
    };

    setSubmitState("submitting");
    try {
      let saved;
      if (editingItem) {
        saved = await updateLostFoundItem(editingItem.id, payload);
      } else if (form.draftId) {
        saved = await updateLostFoundItem(form.draftId, { ...payload, status: "ACTIVE" });
      } else {
        saved = await createLostFoundItem(payload);
      }

      setItems((current) => {
        if (current.find((i) => i.id === saved.id)) {
          return current.map((item) => (item.id === saved.id ? saved : item));
        }
        return [saved, ...current];
      });

      toast.success(editingItem ? "Post updated successfully." : `${saved.type === "lost" ? "Lost" : "Found"} item posted successfully.`);
      setPostOpen(false);
      setEditingItem(null);
      setForm(emptyForm);
      if (!editingItem) {
        setQuery("");
        setTypeFilter(saved.type);
        setCategoryFilter("all");
        setCampusFilter("all");
        setShowMine(false);
      }
    } catch (error: any) {
      toast.error(error?.message || "Could not save this post.");
    } finally {
      setSubmitState("idle");
    }
  }

  async function startEdit(item: LostFoundItem) {
    const info = await getUserContactInfo();
    const isDraft = item.status.toUpperCase() === "DRAFT";
    setEditingItem(isDraft ? null : item);
    const isOtherCampus = !LOST_FOUND_CAMPUSES.includes(item.campus) && item.campus !== "";
    setForm({
      type: item.type,
      item_name: item.item_name,
      category: item.category,
      description: item.description,
      location: item.location,
      campus: isOtherCampus ? "Other" : item.campus,
      otherCampus: isOtherCampus ? item.campus : "",
      occurred_at: item.occurred_at ? item.occurred_at.slice(0, 16) : "",
      contact_preference: item.contact_preference,
      phone: info.phone,
      whatsapp: info.whatsapp,
      image: null,
      draftId: isDraft ? item.id : undefined,
    });
    setLastSaved(null);
    setFormErrors({});
    setPostOpen(true);
  }

  async function handleContact(item: LostFoundItem) {
    if (!user) {
      toast.error("Please sign in to message.");
      return;
    }
    if (user.id === item.user_id) {
      toast.info("This is your own post.");
      return;
    }
    setActionId(item.id);
    try {
      const { productId } = await contactLostFoundPoster(item);
      navigate({ to: "/marketplace/chat/$id", params: { id: productId } });
    } catch (error: any) {
      toast.error(error?.message || "Could not open conversation.");
    } finally {
      setActionId(null);
    }
  }

  async function handleRecovered(item: LostFoundItem) {
    setActionId(item.id);
    try {
      const updated = await markLostFoundRecovered(item.id);
      setItems((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
      toast.success(item.type === "lost" ? "Marked as recovered" : "Marked as resolved");
    } catch (error: any) {
      toast.error(error?.message || "Could not update status.");
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(item: LostFoundItem) {
    if (!window.confirm("Delete this post?")) return;
    setActionId(item.id);
    try {
      await deleteLostFoundItem(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      toast.success("Post deleted.");
    } catch (error: any) {
      toast.error(error?.message || "Could not delete post.");
    } finally {
      setActionId(null);
    }
  }

  // ── Section title for "my posts" view ───────────────────────────
  const myViewLabel: Record<string, string> = {
    lost: "My Lost Posts",
    found: "My Found Posts",
    drafts: "My Drafts",
    resolved: "Resolved Posts",
  };
  const currentMineLabel = showMine && typeFilter !== "all" ? myViewLabel[typeFilter] : null;

  return (
    <ModuleAccessBoundary moduleId="lost-found">
      <div className="min-h-screen bg-background text-foreground">

        {/* ── NAVBAR ──────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-screen-2xl h-14 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">

            {/* ← Back */}
            <Link
              to="/"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Back to dashboard"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>

            {/* Logo + Nexora | Lost & Found */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="Nexora dashboard">
              <NexoraLogo size="sm" showWordmark={false} />
              <span className="hidden sm:flex items-center gap-2 select-none">
                <span className="font-display text-base font-black text-foreground">Nexora</span>
                <span className="h-4 w-px bg-border" aria-hidden="true" />
                <span className="font-display text-base font-semibold text-muted-foreground">Lost &amp; Found</span>
              </span>
            </Link>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Inline search input (expands when searchOpen) */}
            {searchOpen && (
              <div className="flex items-center gap-2 flex-1 max-w-xs animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search items..."
                    className="h-9 w-full rounded-lg border border-border bg-muted/50 pl-8 pr-3 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-background transition-colors"
                  />
                  {searchInput && (
                    <button
                      onClick={() => setSearchInput("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Right controls */}
            <div className="flex items-center gap-1">
              {/* LOST / FOUND tabs */}
              <button
                onClick={() => handleFilterTab("lost")}
                className={`px-3 py-1.5 text-xs font-black uppercase rounded-lg transition-colors ${
                  typeFilter === "lost" && !showMine
                    ? "bg-rose-500/15 text-rose-500"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Lost
              </button>
              <button
                onClick={() => handleFilterTab("found")}
                className={`px-3 py-1.5 text-xs font-black uppercase rounded-lg transition-colors ${
                  typeFilter === "found" && !showMine
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Found
              </button>

              <div className="h-4 w-px bg-border mx-1" aria-hidden="true" />

              {/* + Post */}
              <button
                onClick={openPost}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                aria-label="Post item"
              >
                <Plus className="h-5 w-5" />
              </button>

              {/* Search toggle */}
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  searchOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
                aria-label={searchOpen ? "Close search" : "Open search"}
                aria-expanded={searchOpen}
              >
                {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </button>

              {/* Profile menu */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                    showMine || profileOpen
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  aria-label="Profile menu"
                  aria-expanded={profileOpen}
                >
                  {profile?.full_name ? (
                    <span className="text-xs font-black">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-rose-500"></span>
                  )}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                    {user ? (
                      <>
                        {/* User info header */}
                        <div className="px-3 py-2 mb-1">
                          <p className="text-xs font-black text-foreground truncate">
                            {profile?.full_name || user.email?.split("@")[0] || "Student"}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="my-1 h-px bg-border" />

                        {/* MY ACTIVITY */}
                        <div className="px-3 pt-2 pb-1">
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">My Activity</p>
                        </div>
                        <button
                          onClick={() => handleProfileMenu("lost")}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-muted rounded-xl transition-colors ${typeFilter === "lost" && showMine ? "text-rose-500 bg-rose-500/10" : "text-foreground"}`}
                        >
                          My Lost Posts
                        </button>
                        <button
                          onClick={() => handleProfileMenu("found")}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-muted rounded-xl transition-colors ${typeFilter === "found" && showMine ? "text-emerald-600 bg-emerald-500/10" : "text-foreground"}`}
                        >
                          My Found Posts
                        </button>
                        <button
                          onClick={() => handleProfileMenu("drafts")}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-muted rounded-xl transition-colors ${typeFilter === "drafts" && showMine ? "text-amber-500 bg-amber-500/10" : "text-foreground"}`}
                        >
                          Drafts
                        </button>
                        <button
                          onClick={() => handleProfileMenu("resolved")}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-muted rounded-xl transition-colors ${typeFilter === "resolved" && showMine ? "text-muted-foreground bg-muted" : "text-foreground"}`}
                        >
                          Resolved
                        </button>
                        <button
                          onClick={() => handleProfileMenu("saved")}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-muted rounded-xl transition-colors ${typeFilter === "saved" && showMine ? "text-primary bg-primary/10" : "text-foreground"}`}
                        >
                          Saved Posts
                        </button>

                        <div className="my-1 h-px bg-border" />

                        {/* LOST & FOUND */}
                        <div className="px-3 pt-1 pb-1">
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Lost & Found</p>
                        </div>
                        <button
                          onClick={() => handleProfileMenu("settings-lf")}
                          className="flex w-full items-center px-3 py-2 text-sm font-semibold hover:bg-muted rounded-xl transition-colors text-foreground"
                        >
                          Lost & Found Settings
                        </button>
                        <button
                          onClick={() => handleProfileMenu("notifications-lf")}
                          className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold hover:bg-muted rounded-xl transition-colors text-foreground"
                        >
                          <span>Notifications</span>
                          {unreadCount > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                              {unreadCount}
                            </span>
                          )}
                        </button>

                        <div className="my-1 h-px bg-border" />

                        {/* ACCOUNT */}
                        <div className="px-3 pt-1 pb-1">
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Account</p>
                        </div>
                        <button
                          onClick={() => handleProfileMenu("account")}
                          className="flex w-full items-center px-3 py-2 text-sm font-semibold hover:bg-muted rounded-xl transition-colors text-foreground"
                        >
                          Account / Profile
                        </button>
                        <button
                          onClick={() => handleProfileMenu("settings")}
                          className="flex w-full items-center px-3 py-2 text-sm font-semibold hover:bg-muted rounded-xl transition-colors text-foreground"
                        >
                          Main Settings
                        </button>
                        <button
                          onClick={() => handleProfileMenu("logout")}
                          className="flex w-full items-center px-3 py-2 text-sm font-semibold hover:bg-destructive/10 rounded-xl transition-colors text-destructive"
                        >
                          Log out
                        </button>
                      </>
                    ) : (
                      <Link
                        to="/auth"
                        className="flex w-full items-center justify-center px-3 py-2 text-sm font-bold text-primary hover:bg-muted rounded-xl"
                        onClick={() => setProfileOpen(false)}
                      >
                        Sign in
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── FILTER ROW ──────────────────────────────────────────── */}
        <div className="sticky top-14 z-30 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-screen-2xl items-center gap-2 px-4 py-2 sm:px-6 lg:px-8 overflow-x-auto">
            {/* My posts back button */}
            {showMine && (
              <button
                onClick={() => { setShowMine(false); setTypeFilter("all"); }}
                className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mr-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Public Feed
              </button>
            )}

            {/* Section label when in my-posts mode */}
            {currentMineLabel && (
              <span className="shrink-0 text-xs font-black uppercase tracking-wider text-foreground">
                {currentMineLabel}
              </span>
            )}

            <div className="flex items-center gap-2 ml-auto shrink-0 relative">
              {/* Filter Popover Button */}
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${
                  activeFilterCount > 0 || filterOpen
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Filter {activeFilterCount > 0 && `• ${activeFilterCount}`}
              </button>

              {/* Filter Popover Menu */}
              {filterOpen && (
                <div
                  ref={filterMenuRef}
                  className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-border bg-card p-3 shadow-xl animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Category</label>
                      <select
                        value={tempCategory}
                        onChange={(e) => setTempCategory(e.target.value)}
                        className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 cursor-pointer"
                      >
                        <option value="all">All Categories</option>
                        {LOST_FOUND_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Campus</label>
                      <select
                        value={tempCampus}
                        onChange={(e) => setTempCampus(e.target.value)}
                        className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 cursor-pointer"
                      >
                        <option value="all">All Campuses</option>
                        {LOST_FOUND_CAMPUSES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Date</label>
                      <input
                        type="date"
                        value={tempDate}
                        onChange={(e) => setTempDate(e.target.value)}
                        className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1"
                      />
                    </div>
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={clearFilters}
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={applyFilters}
                        className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sort Dropdown */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as LostFoundSort)}
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                aria-label="Sort order"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ────────────────────────────────────────── */}
        <main className="mx-auto w-full max-w-screen-2xl px-4 py-5 sm:px-6 lg:px-8">

          {/* Active search query indicator */}
          {query && (
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
              <span>Results for <strong className="text-foreground">"{query}"</strong></span>
              <button
                onClick={() => { setQuery(""); setSearchOpen(false); }}
                className="ml-1 text-xs font-semibold text-primary hover:underline"
              >
                Clear
              </button>
            </div>
          )}

          {/* Posts Grid */}
          {itemsLoading ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading posts…</p>
            </div>
          ) : itemsError ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center gap-3">
              <PackageSearch className="h-10 w-10 text-muted-foreground" />
              <h3 className="text-base font-bold text-foreground">Unable to load posts</h3>
              <p className="text-sm text-muted-foreground">{itemsError}</p>
              <button
                onClick={loadItems}
                className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                Try Again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <PackageSearch className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {showMine 
                  ? (typeFilter === "saved" ? "No saved posts" : "No posts yet")
                  : (typeFilter === "lost" || typeFilter === "found") 
                  ? "No matching items found" 
                  : "No items found"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {showMine
                  ? typeFilter === "drafts"
                    ? "You have no saved drafts."
                    : typeFilter === "resolved"
                    ? "No resolved posts yet."
                    : typeFilter === "saved"
                    ? "You haven't saved any posts yet."
                    : "You haven't posted any items yet."
                  : query
                  ? "Try adjusting your search or filters."
                  : (typeFilter === "lost" || typeFilter === "found")
                  ? "Try switching between Lost and Found."
                  : "Be the first to report a lost or found item."}
              </p>
              {!showMine && (
                <button
                  onClick={openPost}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Post an Item
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  ownPost={user?.id === item.user_id}
                  showMine={showMine}
                  busy={actionId === item.id}
                  onContact={handleContact}
                  onDelete={handleDelete}
                  onEdit={startEdit}
                  onRecovered={handleRecovered}
                  isSaved={savedPostIds.has(item.id)}
                  onToggleSave={handleToggleSave}
                  onReopen={handleReopen}
                />
              ))}
            </div>
          )}
        </main>

        {/* ── POST ITEM MODAL ──────────────────────────────────────── */}
        {postOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onMouseDown={(e) => e.target === e.currentTarget && closePost()}
          >
            <div className="w-full max-w-[600px] overflow-hidden rounded-2xl bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">

              <div className="flex items-center justify-between border-b border-border p-4">
                <h2 className="text-lg font-black text-foreground">
                  {editingItem ? "Edit Post" : "Post Item"}
                </h2>
                <button
                  onClick={closePost}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 max-h-[80vh] overflow-y-auto space-y-4">

                {/* 1. Post Type */}
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Post Type <span className="text-destructive">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-background p-1">
                    <button
                      type="button"
                      onClick={() => updateForm("type", "lost")}
                      className={`rounded-lg py-2 text-sm font-bold transition-colors ${
                        form.type === "lost"
                          ? "bg-rose-500 text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      LOST
                    </button>
                    <button
                      type="button"
                      onClick={() => updateForm("type", "found")}
                      className={`rounded-lg py-2 text-sm font-bold transition-colors ${
                        form.type === "found"
                          ? "bg-emerald-500 text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      FOUND
                    </button>
                  </div>
                </div>

                {/* 2. Item Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    Item Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.item_name}
                    onChange={(e) => {
                      updateForm("item_name", e.target.value);
                      if (formErrors.item_name) setFormErrors({ ...formErrors, item_name: undefined });
                    }}
                    placeholder="E.g. Black leather wallet"
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-1 ${formErrors.item_name ? 'border-destructive focus:border-destructive focus:ring-destructive' : 'border-border focus:border-primary focus:ring-primary'}`}
                  />
                  <div className="mt-1 flex justify-between items-start">
                    {formErrors.item_name ? <span className="text-[10px] text-destructive">{formErrors.item_name}</span> : <span />}
                    <span className="text-[10px] text-muted-foreground">{form.item_name.length} / 100</span>
                  </div>
                </div>

                {/* 3. Category & 4. Date */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                      Category <span className="text-destructive">*</span>
                    </label>
                    <select
                      required
                      value={form.category}
                      onChange={(e) => updateForm("category", e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                    >
                      <option value="" disabled>Select category</option>
                      {LOST_FOUND_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                      Date &amp; Time <span className="text-destructive">*</span>
                    </label>
                    <input
                      required
                      type="datetime-local"
                      value={form.occurred_at}
                      onChange={(e) => updateForm("occurred_at", e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* 5. Description */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    Description <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    required
                    minLength={5}
                    maxLength={500}
                    rows={3}
                    value={form.description}
                    onChange={(e) => {
                      updateForm("description", e.target.value);
                      if (formErrors.description) setFormErrors({ ...formErrors, description: undefined });
                    }}
                    placeholder="Add specific details, colors, brands…"
                    className={`w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-1 ${formErrors.description ? 'border-destructive focus:border-destructive focus:ring-destructive' : 'border-border focus:border-primary focus:ring-primary'}`}
                  />
                  <div className="mt-1 flex justify-between items-start">
                    {formErrors.description ? <span className="text-[10px] text-destructive">{formErrors.description}</span> : <span />}
                    <span className="text-[10px] text-muted-foreground">{form.description.length} / 500</span>
                  </div>
                </div>

                {/* 6. Location & 7. Campus */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                      {form.type === "lost" ? "Where was it lost?" : "Where was it found?"}{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <input
                      required
                      minLength={2}
                      maxLength={150}
                      value={form.location}
                      onChange={(e) => {
                        updateForm("location", e.target.value);
                        if (formErrors.location) setFormErrors({ ...formErrors, location: undefined });
                      }}
                      placeholder="E.g. Main Library, 2nd Floor"
                      className={`w-full rounded-lg border bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-1 ${formErrors.location ? 'border-destructive focus:border-destructive focus:ring-destructive' : 'border-border focus:border-primary focus:ring-primary'}`}
                    />
                    {formErrors.location && <p className="mt-1 text-[10px] text-destructive">{formErrors.location}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                      Campus <span className="text-destructive">*</span>
                    </label>
                    <select
                      required
                      value={form.campus}
                      onChange={(e) => updateForm("campus", e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                    >
                      <option value="" disabled>Select campus</option>
                      {LOST_FOUND_CAMPUSES.map((c) => (
                         <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    {form.campus === "Other" && (
                      <input
                        autoFocus
                        value={form.otherCampus || ""}
                        onChange={(e) => updateForm("otherCampus", e.target.value)}
                        placeholder="Enter campus name"
                        className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                      />
                    )}
                  </div>
                </div>

                {/* 8. Photo & 9. Contact Preferences */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Photo</label>
                    <label className="flex h-[38px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background/50 px-3 hover:bg-muted transition-colors">
                      <ImagePlus className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate text-xs font-semibold text-muted-foreground">
                        {form.image?.name || (editingItem?.image_url ? "Replace photo" : "Upload photo")}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => updateForm("image", e.target.files?.[0] ?? null)}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                      Contact Preferences <span className="text-destructive">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(["message", "call", "whatsapp"] as const).map((pref) => (
                        <label
                          key={pref}
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold cursor-pointer hover:bg-muted transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={form.contact_preference.includes(pref)}
                            onChange={(e) => {
                              const prefs = form.contact_preference.filter((p) => p !== pref);
                              if (e.target.checked) prefs.push(pref);
                              updateForm("contact_preference", prefs);
                              if (formErrors.contact_preference) setFormErrors({ ...formErrors, contact_preference: undefined });
                            }}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                          {pref === "message" ? "Message" : pref === "call" ? "Call" : "WhatsApp"}
                        </label>
                      ))}
                    </div>
                    {formErrors.contact_preference && <p className="mt-1 text-[10px] text-destructive">{formErrors.contact_preference}</p>}
                  </div>
                </div>

                {/* Phone / WhatsApp numbers */}
                {(form.contact_preference.includes("call") || form.contact_preference.includes("whatsapp")) && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {form.contact_preference.includes("call") && (
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                          Phone Number <span className="text-destructive">*</span>
                        </label>
                        <input
                          required
                          type="tel"
                          pattern="[+0-9\s-]+"
                          value={form.phone}
                          onChange={(e) => {
                            updateForm("phone", e.target.value);
                            if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined });
                          }}
                          placeholder="+91 9876543210"
                          className={`w-full rounded-lg border bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-1 ${formErrors.phone ? 'border-destructive focus:border-destructive focus:ring-destructive' : 'border-border focus:border-primary focus:ring-primary'}`}
                        />
                        {formErrors.phone && <p className="mt-1 text-[10px] text-destructive">{formErrors.phone}</p>}
                      </div>
                    )}
                    {form.contact_preference.includes("whatsapp") && (
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                          WhatsApp Number <span className="text-destructive">*</span>
                        </label>
                        <input
                          required
                          type="tel"
                          pattern="[+0-9\s-]+"
                          value={form.whatsapp}
                          onChange={(e) => {
                            updateForm("whatsapp", e.target.value);
                            if (formErrors.whatsapp) setFormErrors({ ...formErrors, whatsapp: undefined });
                          }}
                          placeholder="+91 9876543210"
                          className={`w-full rounded-lg border bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-1 ${formErrors.whatsapp ? 'border-destructive focus:border-destructive focus:ring-destructive' : 'border-border focus:border-primary focus:ring-primary'}`}
                        />
                        {formErrors.whatsapp && <p className="mt-1 text-[10px] text-destructive">{formErrors.whatsapp}</p>}
                      </div>
                    )}
                  </div>
                )}

                {/* Image preview */}
                {form.image && (
                  <div className="flex justify-center">
                    <img
                      src={URL.createObjectURL(form.image)}
                      alt="Preview"
                      className="max-h-36 rounded-xl object-contain border border-border"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  {/* Autosave status indicator */}
                  <div className="text-xs font-medium text-muted-foreground">
                    {!editingItem && (
                      isAutosaving ? (
                        <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Saving draft...</span>
                      ) : lastSaved ? (
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Draft saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      ) : (
                        <span></span>
                      )
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={closePost}
                      className="rounded-xl px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitState === "submitting"}
                      className="flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {submitState === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
                      {editingItem
                        ? "Save Changes"
                        : form.type === "lost"
                        ? "Post Lost Item"
                        : "Post Found Item"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </ModuleAccessBoundary>
  );
}

// ── ITEM CARD ─────────────────────────────────────────────────────────
function ItemCard({
  item,
  ownPost,
  showMine,
  busy,
  onContact,
  onDelete,
  onEdit,
  onRecovered,
}: {
  item: LostFoundItem;
  ownPost: boolean;
  showMine: boolean;
  busy: boolean;
  onContact: (item: LostFoundItem) => void;
  onDelete: (item: LostFoundItem) => void;
  onEdit: (item: LostFoundItem) => void;
  onRecovered: (item: LostFoundItem) => void;
  isSaved?: boolean;
  onToggleSave?: (item: LostFoundItem) => void;
  onReopen?: (item: LostFoundItem) => void;
}) {
  const isLost = item.type === "lost";
  const isActive = item.status.toUpperCase() === "ACTIVE";
  const isDraft = item.status.toUpperCase() === "DRAFT";
  const isResolved = item.status.toUpperCase() === "RESOLVED" || item.status.toUpperCase() === "RECOVERED";

  // Management controls are shown only when viewing your own posts (showMine view)
  const showManagement = ownPost && showMine;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:border-primary/25 hover:shadow-lg hover:-translate-y-0.5">

      {/* Image area — fixed aspect ratio */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted/40">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.item_name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
              <PackageSearch className="h-9 w-9" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">No Photo</span>
            </div>
          </div>
        )}

        {/* Save Bookmark (only for public feed, not drafts) */}
        {!showManagement && !isDraft && onToggleSave && (
          <button
            onClick={(e) => { e.preventDefault(); onToggleSave(item); }}
            className={`absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
              isSaved
                ? "bg-primary text-primary-foreground"
                : "bg-black/20 text-white hover:bg-black/40"
            }`}
            title={isSaved ? "Unsave Post" : "Save Post"}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
          </button>
        )}

        {/* Status badge overlay */}
        {!isActive && (
          <div className="absolute top-2 right-2">
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
              isDraft
                ? "bg-amber-500/90 text-white"
                : isResolved
                ? "bg-muted/90 text-muted-foreground"
                : "bg-muted/90 text-muted-foreground"
            }`}>
              {isResolved && <CheckCircle2 className="h-3 w-3" />}
              {item.status}
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-4">

        {/* Type badge + category */}
        <div className="mb-2.5 flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
            isLost
              ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
              : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
          }`}>
            {isLost ? "Lost" : "Found"}
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground">{item.category}</span>
        </div>

        {/* Item name */}
        <h3 className="mb-1 truncate font-display text-base font-bold text-foreground leading-snug">
          {item.item_name}
        </h3>

        {/* Description */}
        <p className="mb-3 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {item.description}
        </p>

        {/* Meta info */}
        <div className="mt-auto space-y-1.5 mb-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.location}, {item.campus}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate">{formatLostFoundDate(item.occurred_at)}</span>
          </div>
        </div>

        {/* Footer: poster + actions */}
        <div className="flex items-center justify-between border-t border-border pt-3 gap-2">

          {/* Poster */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">
              {item.poster_name.charAt(0).toUpperCase()}
            </div>
            <span className="truncate text-[11px] font-semibold text-muted-foreground">
              {item.poster_name}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {showManagement ? (
              isDraft ? (
                // ── Draft controls ──
                <>
                  <button
                    disabled={busy}
                    onClick={() => onEdit(item)}
                    className="flex h-8 items-center gap-1.5 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Continue Editing
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => onDelete(item)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                    title="Delete Draft"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                // ── Own post management controls (only in My Posts view) ──
                <>
                  <button
                    disabled={busy}
                    onClick={() => onEdit(item)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                    title="Edit"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  {isActive && (
                    <button
                      disabled={busy}
                      onClick={() => onRecovered(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-emerald-500 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                      title={isLost ? "Mark as Recovered" : "Mark as Resolved"}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {isResolved && onReopen && (
                    <button
                      disabled={busy}
                      onClick={() => onReopen(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                      title="Reopen Post"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    disabled={busy}
                    onClick={() => onDelete(item)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )
            ) : (
              // ── Public contact buttons (only what the owner enabled) ──
              <>
                {item.contact_preference.includes("message") && (
                  <button
                    disabled={busy || !isActive}
                    onClick={() => onContact(item)}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Message
                  </button>
                )}
                {item.contact_preference.includes("call") && (
                  <button
                    disabled={busy || !isActive}
                    onClick={async () => {
                      const info = await getPosterContactInfo(item.user_id);
                      if (info.phone) window.location.href = `tel:${info.phone}`;
                      else toast.error("Phone number not available.");
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    title="Call"
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </button>
                )}
                {item.contact_preference.includes("whatsapp") && (
                  <button
                    disabled={busy || !isActive}
                    onClick={async () => {
                      const info = await getPosterContactInfo(item.user_id);
                      if (info.whatsapp) window.open(`https://wa.me/${info.whatsapp.replace(/[^0-9]/g, "")}`, "_blank");
                      else toast.error("WhatsApp number not available.");
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    title="WhatsApp"
                  >
                    {/* WhatsApp icon inline SVG */}
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
