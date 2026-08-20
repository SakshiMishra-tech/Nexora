import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ImagePlus,
  Loader2,
  MapPin,
  PackageSearch,
  Plus,
  Search,
  Trash2,
  User,
  X,
  MessageSquare,
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
  type LostFoundItem,
  type LostFoundSort,
  type LostFoundType,
} from "@/services/lost-found.service";

export const Route = createFileRoute("/lost-found")({
  head: () => ({ meta: [{ title: "Nexora - Lost & Found" }] }),
  component: LostFoundRoute,
});

type TypeFilter = "all" | LostFoundType;

type FormState = {
  type: LostFoundType;
  item_name: string;
  category: string;
  description: string;
  location: string;
  campus: string;
  occurred_at: string;
  contact_preference: string;
  image: File | null;
};

const emptyForm: FormState = {
  type: "lost",
  item_name: "",
  category: "",
  description: "",
  location: "",
  campus: "",
  occurred_at: "",
  contact_preference: "Message me on Nexora",
  image: null,
};

function LostFoundRoute() {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user, profile, loading: authLoading } = useAuth();

  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [campusFilter, setCampusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sort, setSort] = useState<LostFoundSort>("recent");
  
  const [showMine, setShowMine] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingItem, setEditingItem] = useState<LostFoundItem | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "submitting">("idle");
  const [actionId, setActionId] = useState<string | null>(null);

  const canPost = !!user && !authLoading;
  
  // Handlers
  async function loadItems() {
    setItemsLoading(true);
    setItemsError("");
    try {
      const data = await getLostFoundItems({
        query,
        type: typeFilter,
        category: categoryFilter,
        campus: campusFilter,
        date: dateFilter,
        sort,
        mineOnly: showMine,
        includeRecovered: showMine,
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
  }, [query, typeFilter, categoryFilter, campusFilter, dateFilter, sort, showMine]);

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

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openPost() {
    if (!canPost) {
      toast.error("Please sign in to create a Lost & Found post.");
      return;
    }
    setEditingItem(null);
    setForm(emptyForm);
    setPostOpen(true);
  }

  function closePost() {
    const hasDraft = Boolean(form.item_name || form.category || form.description || form.location || form.campus || form.image);
    if (hasDraft && !editingItem && !window.confirm("Discard this draft?")) return;
    setPostOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
  }

  function handleFilterTab(type: TypeFilter) {
    setTypeFilter(type);
    setShowMine(false);
  }

  function handleProfileMenu(action: "lost" | "found" | "settings") {
    setProfileOpen(false);
    if (action === "settings") {
      navigate({ to: "/settings" });
      return;
    }
    setShowMine(true);
    setTypeFilter(action);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canPost || submitState === "submitting") return;

    setSubmitState("submitting");
    try {
      const saved = editingItem
        ? await updateLostFoundItem(editingItem.id, form)
        : await createLostFoundItem(form);

      setItems((current) =>
        editingItem ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]
      );
      
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

  function startEdit(item: LostFoundItem) {
    setEditingItem(item);
    setForm({
      type: item.type,
      item_name: item.item_name,
      category: item.category,
      description: item.description,
      location: item.location,
      campus: item.campus,
      occurred_at: item.occurred_at.slice(0, 16),
      contact_preference: item.contact_preference,
      image: null,
    });
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

  return (
    <ModuleAccessBoundary moduleId="lost-found">
      <div className="min-h-screen bg-background text-foreground">
        
        {/* Navbar */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-14 w-full items-center justify-between px-4">
            
            {/* Left side */}
            <div className="flex items-center gap-2">
              <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted" aria-label="Back to dashboard">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <Link to="/" className="flex items-center gap-2" aria-label="Nexora dashboard">
                <NexoraLogo size="sm" />
                <span className="hidden font-display text-base font-black sm:block"><span className="font-semibold text-muted-foreground">Lost & Found</span></span>
              </Link>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => handleFilterTab("lost")} className={`px-3 py-1.5 text-xs font-black uppercase rounded-lg transition-colors ${typeFilter === "lost" && !showMine ? "bg-rose-500/15 text-rose-500" : "text-muted-foreground hover:bg-muted"}`}>LOST</button>
              <button onClick={() => handleFilterTab("found")} className={`px-3 py-1.5 text-xs font-black uppercase rounded-lg transition-colors ${typeFilter === "found" && !showMine ? "bg-emerald-500/15 text-emerald-500" : "text-muted-foreground hover:bg-muted"}`}>FOUND</button>
              
              <div className="h-4 w-px bg-border mx-1" />
              
              <button onClick={openPost} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90" aria-label="Post Item">
                <Plus className="h-5 w-5" />
              </button>
              
              <button onClick={() => searchInputRef.current?.focus()} className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Search">
                <Search className="h-4 w-4" />
              </button>

              <div className="relative">
                <button 
                  onClick={() => setProfileOpen(!profileOpen)} 
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${showMine ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted"}`} 
                  aria-label="Profile Menu"
                >
                  <User className="h-4 w-4" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                    <button onClick={() => handleProfileMenu("lost")} className="flex w-full items-center px-3 py-2 text-sm font-semibold hover:bg-muted rounded-md text-foreground">My Lost Posts</button>
                    <button onClick={() => handleProfileMenu("found")} className="flex w-full items-center px-3 py-2 text-sm font-semibold hover:bg-muted rounded-md text-foreground">My Found Posts</button>
                    <div className="my-1 h-px bg-border" />
                    <button onClick={() => handleProfileMenu("settings")} className="flex w-full items-center px-3 py-2 text-sm font-semibold hover:bg-muted rounded-md text-foreground">Account / Profile</button>
                    <button onClick={() => handleProfileMenu("settings")} className="flex w-full items-center px-3 py-2 text-sm font-semibold hover:bg-muted rounded-md text-foreground">Settings</button>
                    <button onClick={() => handleProfileMenu("settings")} className="flex w-full items-center px-3 py-2 text-sm font-semibold hover:bg-destructive/10 rounded-md text-destructive">Delete Account</button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto w-full px-4 py-6">
          
          {/* Search & Filters */}
          <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search lost & found posts..."
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus:border-primary">
              <option value="all">All Categories</option>
              {LOST_FOUND_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus:border-primary">
              <option value="all">All Campuses</option>
              {LOST_FOUND_CAMPUSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as LostFoundSort)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus:border-primary">
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>

          {/* Posts Grid */}
          {itemsLoading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading posts...</p>
            </div>
          ) : itemsError ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <PackageSearch className="mb-4 h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-bold text-foreground">Unable to load posts</h3>
              <p className="mt-1 text-sm text-muted-foreground">{itemsError}</p>
              <button onClick={loadItems} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Try Again</button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <PackageSearch className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-bold text-foreground">No lost or found items match your search.</h3>
              <p className="mt-1 text-sm text-muted-foreground">There are currently no active posts matching these filters.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                />
              ))}
            </div>
          )}
        </main>

        {/* Post Item Modal */}
        {postOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && closePost()}>
            <div className="w-full max-w-[600px] overflow-hidden rounded-2xl bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between border-b border-border p-4">
                <h2 className="text-lg font-black text-foreground">{editingItem ? "Edit Post" : "Post Item"}</h2>
                <button onClick={closePost} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 max-h-[80vh] overflow-y-auto">
                <div className="mb-5">
                  <label className="mb-2 block text-xs font-black uppercase tracking-wider text-muted-foreground">What happened?</label>
                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-background p-1">
                    <button type="button" onClick={() => updateForm("type", "lost")} className={`rounded-lg py-2 text-sm font-bold transition-colors ${form.type === "lost" ? "bg-rose-500 text-white" : "text-muted-foreground hover:bg-muted"}`}>LOST</button>
                    <button type="button" onClick={() => updateForm("type", "found")} className={`rounded-lg py-2 text-sm font-bold transition-colors ${form.type === "found" ? "bg-emerald-500 text-white" : "text-muted-foreground hover:bg-muted"}`}>FOUND</button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Item Name</label>
                  <input required value={form.item_name} onChange={(e) => updateForm("item_name", e.target.value)} placeholder="E.g. Black leather wallet" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>

                <div className="mb-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Category</label>
                    <select required value={form.category} onChange={(e) => updateForm("category", e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary">
                      <option value="">Select category</option>
                      {LOST_FOUND_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Date & Time</label>
                    <input required type="datetime-local" value={form.occurred_at} onChange={(e) => updateForm("occurred_at", e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary" />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Description</label>
                  <textarea required rows={3} value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="Add specific details, colors, brands..." className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>

                <div className="mb-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground">{form.type === "lost" ? "Where was it lost?" : "Where was it found?"}</label>
                    <input required value={form.location} onChange={(e) => updateForm("location", e.target.value)} placeholder="E.g. Main Library, 2nd Floor" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Campus</label>
                    <select required value={form.campus} onChange={(e) => updateForm("campus", e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary">
                      <option value="">Select campus</option>
                      {LOST_FOUND_CAMPUSES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Photo (Optional)</label>
                    <label className="flex h-[38px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background/50 px-3 hover:bg-muted">
                      <ImagePlus className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate text-xs font-semibold text-muted-foreground">{form.image?.name || (editingItem?.image_url ? "Replace photo" : "Upload photo")}</span>
                      <input type="file" accept="image/*" onChange={(e) => updateForm("image", e.target.files?.[0] ?? null)} className="sr-only" />
                    </label>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Contact Preference</label>
                    <input required disabled value={form.contact_preference} className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium text-muted-foreground outline-none opacity-80" />
                  </div>
                </div>

                {form.image && (
                  <div className="mb-6 flex justify-center">
                    <img src={URL.createObjectURL(form.image)} alt="Preview" className="max-h-40 rounded-xl object-contain border border-border" />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button type="button" onClick={closePost} className="rounded-xl px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted">Cancel</button>
                  <button type="submit" disabled={submitState === "submitting"} className="flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                    {submitState === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editingItem ? "Save Changes" : (form.type === "lost" ? "Post Lost Item" : "Post Found Item")}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </ModuleAccessBoundary>
  );
}

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
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/20 hover:shadow-lg">
      {item.image_url ? (
        <img src={item.image_url} alt={item.item_name} className="h-48 w-full object-cover" />
      ) : (
        <div className="flex h-48 items-center justify-center bg-muted/30">
          <PackageSearch className="h-10 w-10 text-muted-foreground/50" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${item.type === "lost" ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"}`}>
            {item.type}
          </span>
          <span className="text-[11px] font-bold text-muted-foreground">{item.category}</span>
          {item.status !== "active" && (
            <span className="ml-auto rounded-md bg-muted px-2 py-0.5 text-[10px] font-black uppercase text-foreground">
              {item.status}
            </span>
          )}
        </div>
        <h3 className="mb-1 truncate font-display text-lg font-bold text-foreground">{item.item_name}</h3>
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        
        <div className="mb-4 grid gap-1.5 mt-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{item.location}, {item.campus}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{formatLostFoundDate(item.occurred_at)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
              {item.poster_name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-foreground">{item.poster_name}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {ownPost && showMine ? (
              <>
                <button disabled={busy} onClick={() => onEdit(item)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Edit">
                  <Edit3 className="h-4 w-4" />
                </button>
                {item.status === "active" && (
                  <button disabled={busy} onClick={() => onRecovered(item)} className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-500/10" title={item.type === "lost" ? "Mark Recovered" : "Mark Resolved"}>
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                )}
                <button disabled={busy} onClick={() => onDelete(item)} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button disabled={busy || item.status !== "active"} onClick={() => onContact(item)} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                <MessageSquare className="h-3.5 w-3.5" />
                Message on Nexora
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
