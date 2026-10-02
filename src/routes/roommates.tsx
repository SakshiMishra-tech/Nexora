import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Compass,
  Flag,
  Heart,
  Home,
  Loader2,
  Camera,
  Bookmark,
  Instagram,
  Lock,
  MapPin,
  MessageCircle,
  Moon,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  User,
  Users,
  Wallet,
  X,
  CheckCircle2,
  XCircle,
  Check,
  MoreHorizontal,
  Info,
  FileText,
  Pencil,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModuleAccessBoundary } from "@/components/ModuleAccessControl";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import type {
  RoommateProfile,
  RoommateFilters,
  RoommateRequestRow,
  CompatibilityResult,
  SortMode,
  RequestStatus,
} from "@/types/roommates";
import {
  defaultFilters,
  FOOD_OPTIONS,
  SMOKING_OPTIONS,
  ALCOHOL_OPTIONS,
  SLEEP_OPTIONS,
  STUDY_OPTIONS,
  CLEANLINESS_OPTIONS,
  VISITORS_OPTIONS,
  ROOM_TYPE_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  GENDER_OPTIONS,
  REPORT_REASONS,
  type ReportReason,
} from "@/types/roommates";
import {
  fetchListings,
  fetchMyListing,
  fetchSavedIds,
  fetchSavedProfiles,
  fetchRequestMap,
  fetchRequests,
  fetchNotificationCount,
  fetchCampuses,
  deleteListing,
  setListingPaused,
  saveProfile,
  unsaveProfile,
  sendRequest,
  respondToRequest,
  cancelRequest,
  markNotificationsSeen,
  blockUser,
  reportListing,
  computeCompatibility,
  sortProfiles,
  formatBudget,
  formatMoveIn,
  formatActiveAgo,
  getInitial,
  type RequestWithProfile,
} from "@/services/roommates.service";

// ── Route ─────────────────────────────────────────────────────

export const Route = createFileRoute("/roommates")({
  head: () => ({
    meta: [
      { title: "Nexora — Roommates" },
      {
        name: "description",
        content:
          "Find your perfect student roommate on Nexora. Browse posts, connect with potential roommates, and chat after matching.",
      },
    ],
  }),
  component: RoommatesPage,
});

// ── Tab Types ─────────────────────────────────────────────────

type ActiveTab = "discover" | "saved" | "requests" | "myposts" | "chat";

const TABS: Array<{
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
}> = [
  { id: "discover", label: "Discover", icon: Compass },
  { id: "saved", label: "Saved", icon: Heart },
  { id: "requests", label: "Requests", icon: Bell },
  { id: "myposts", label: "My Posts", icon: User },
  { id: "chat", label: "Chat", icon: MessageCircle },
];

// ── Main Page ─────────────────────────────────────────────────

function RoommatesPage() {
  return (
    <ModuleAccessBoundary moduleId="roommates">
      <RoommatesContent />
    </ModuleAccessBoundary>
  );
}

function RoommatesContent() {
  const { user, profile } = useAuth();

  // ── Tab State ───────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>("discover");
  const [showOthers, setShowOthers] = useState(false);

  // ── Discover State ──────────────────────────────────────────
  const [listings, setListings] = useState<RoommateProfile[]>([]);
  const [totalListings, setTotalListings] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RoommateFilters>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [campuses, setCampuses] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState(false);

  // ── Create Post State ───────────────────────────────────────
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // ── Profile Panel State ─────────────────────────────────────
  const [selectedProfile, setSelectedProfile] =
    useState<RoommateProfile | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("Fake Profile");
  const [reportNotes, setReportNotes] = useState("");
  const [sendRequestOpen, setSendRequestOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSending, setRequestSending] = useState(false);

  // ── My Listing & Social State ───────────────────────────────
  const [myListing, setMyListing] = useState<RoommateProfile | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [requestMap, setRequestMap] = useState<Map<string, RoommateRequestRow>>(
    new Map(),
  );
  const [notifCount, setNotifCount] = useState(0);

  // ── Requests Tab State ──────────────────────────────────────
  const [receivedRequests, setReceivedRequests] = useState<RequestWithProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<RequestWithProfile[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // ── Saved Tab State ─────────────────────────────────────────
  const [savedProfiles, setSavedProfiles] = useState<RoommateProfile[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  // ── Initial Load ────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    void loadInitialData();
  }, [user]);

  async function loadInitialData() {
    if (!user) return;
    try {
      const [myL, savedIdSet, reqMap, notifCnt, camps] = await Promise.all([
        fetchMyListing(user.id),
        fetchSavedIds(user.id),
        fetchRequestMap(user.id),
        fetchNotificationCount(user.id),
        fetchCampuses(),
      ]);
      setMyListing(myL);
      setSavedIds(savedIdSet);
      setRequestMap(reqMap);
      setNotifCount(notifCnt);
      setCampuses(["Any", ...camps]);
    } catch (e) {
      console.error("Error loading roommate data:", e);
    }
  }

  // ── Discover Fetching ───────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    void loadListings();
  }, [user, filters, page, sortMode]);

  async function loadListings() {
    if (!user) return;
    setLoading(true);
    setFetchError(false);
    try {
      const result = await fetchListings({ filters, page, viewerId: user.id });
      let profiles = result.profiles;

      // Compute compatibility client-side
      if (myListing) {
        profiles = profiles.map((p) => ({
          ...p,
          compatibility: computeCompatibility(myListing, p),
        }));
      }

      // Sort
      profiles = sortProfiles(profiles, sortMode);

      setListings(profiles);
      setTotalListings(result.total);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Database connection error";
      console.error("Detailed fetch error:", e);
      setFetchError(true);
      toast.error(`Failed to load listings: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  // Reload listings when myListing changes (compatibility may change)
  useEffect(() => {
    if (myListing && listings.length > 0) {
      setListings((prev) =>
        sortProfiles(
          prev.map((p) => ({
            ...p,
            compatibility: computeCompatibility(myListing, p),
          })),
          sortMode,
        ),
      );
    }
  }, [myListing]);

  // ── Search Filter (client-side on loaded page) ──────────────
  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings;
    const q = searchQuery.toLowerCase();
    return listings.filter(
      (p) =>
        p.displayName.toLowerCase().includes(q) ||
        p.college?.toLowerCase().includes(q) ||
        p.campus?.toLowerCase().includes(q) ||
        p.branch?.toLowerCase().includes(q) ||
        p.areaPreference?.toLowerCase().includes(q) ||
        p.about?.toLowerCase().includes(q),
    );
  }, [listings, searchQuery]);

  // ── Active Filter Count ─────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([k, v]) => {
      const def = (defaultFilters as Record<string, unknown>)[k];
      if (Array.isArray(v)) {
        return v.length > 0;
      }
      return v !== def;
    }).length;
  }, [filters]);

  // ── Tab Switch Handlers ─────────────────────────────────────
  async function handleTabChange(tab: ActiveTab) {
    setActiveTab(tab);
    if (tab === "requests" && user) {
      setRequestsLoading(true);
      try {
        const { received, sent } = await fetchRequests(user.id);
        setReceivedRequests(received);
        setSentRequests(sent);
        setNotifCount(0);
        await markNotificationsSeen(user.id);
      } catch {
        toast.error("Failed to load requests");
      } finally {
        setRequestsLoading(false);
      }
    }
    if (tab === "saved" && user) {
      setSavedLoading(true);
      try {
        const profiles = await fetchSavedProfiles(user.id);
        const withCompat = myListing
          ? profiles.map((p) => ({ ...p, compatibility: computeCompatibility(myListing, p) }))
          : profiles;
        setSavedProfiles(withCompat);
      } catch {
        toast.error("Failed to load saved profiles");
      } finally {
        setSavedLoading(false);
      }
    }
  }

  // ── Save / Unsave ───────────────────────────────────────────
  async function handleToggleSave(listingId: string) {
    if (!user) return;
    const isSaved = savedIds.has(listingId);
    // Optimistic
    setSavedIds((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(listingId) : next.add(listingId);
      return next;
    });
    try {
      if (isSaved) {
        await unsaveProfile(listingId, user.id);
        toast.success("Removed from saved");
      } else {
        await saveProfile(listingId, user.id);
        toast.success("Profile saved");
      }
    } catch {
      // Revert
      setSavedIds((prev) => {
        const next = new Set(prev);
        isSaved ? next.add(listingId) : next.delete(listingId);
        return next;
      });
      toast.error("Could not update saved profiles");
    }
  }

  // ── Send Request ────────────────────────────────────────────
  async function handleSendRequest() {
    if (!user || !selectedProfile) return;
    setRequestSending(true);
    try {
      const newReq = await sendRequest(
        selectedProfile.id,
        user.id,
        selectedProfile.ownerId,
        requestMessage.trim() || undefined,
      );
      setRequestMap((prev) => new Map(prev).set(selectedProfile.id, newReq));
      setSendRequestOpen(false);
      setRequestMessage("");
      toast.success("Connection request sent!");
    } catch {
      toast.error("Failed to send request. Please try again.");
    } finally {
      setRequestSending(false);
    }
  }

  // ── Accept / Decline / Cancel ───────────────────────────────
  async function handleRespondToRequest(
    requestId: string,
    status: "accepted" | "declined",
  ) {
    if (!user) return;
    try {
      await respondToRequest(requestId, user.id, status);
      const { received, sent } = await fetchRequests(user.id);
      setReceivedRequests(received);
      setSentRequests(sent);
      const newMap = await fetchRequestMap(user.id);
      setRequestMap(newMap);
      toast.success(status === "accepted" ? "Request accepted!" : "Request declined");
    } catch {
      toast.error("Failed to update request");
    }
  }

  async function handleCancelRequest(requestId: string) {
    if (!user) return;
    try {
      await cancelRequest(requestId, user.id);
      const newMap = await fetchRequestMap(user.id);
      setRequestMap(newMap);
      const { received, sent } = await fetchRequests(user.id);
      setReceivedRequests(received);
      setSentRequests(sent);
      toast.success("Request cancelled");
    } catch {
      toast.error("Failed to cancel request");
    }
  }

  // ── Report ──────────────────────────────────────────────────
  async function handleReport() {
    if (!user || !selectedProfile) return;
    try {
      await reportListing(user.id, selectedProfile.id, reportReason, reportNotes.trim() || undefined);
      setReportOpen(false);
      setReportNotes("");
      toast.success("Report submitted. Thank you.");
    } catch {
      toast.error("Failed to submit report");
    }
  }

  // ── Block ────────────────────────────────────────────────────
  async function handleBlock(profile: RoommateProfile) {
    if (!user) return;
    try {
      await blockUser(user.id, profile.ownerId);
      setPanelOpen(false);
      setListings((prev) => prev.filter((p) => p.id !== profile.id));
      toast.success("User blocked. They won't appear in your results.");
    } catch {
      toast.error("Failed to block user");
    }
  }

  // ── Delete Listing ───────────────────────────────────────────
  async function handleDeleteListing() {
    if (!user || !myListing) return;
    try {
      await deleteListing(myListing.id, user.id);
      setMyListing(null);
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  }

  // ── Pause / Unpause ──────────────────────────────────────────
  async function handleTogglePause() {
    if (!user || !myListing) return;
    try {
      await setListingPaused(myListing.id, user.id, !myListing.paused);
      const updated = await fetchMyListing(user.id);
      setMyListing(updated);
      toast.success(myListing.paused ? "Post reactivated" : "Post paused");
    } catch {
      toast.error("Failed to update post status");
    }
  }

  // ── Request Status for a listing ─────────────────────────────
  function getRequestStatus(listingId: string, ownerId: string): RequestStatus {
    if (!user) return "none";
    if (ownerId === user.id) return "none";
    const req = requestMap.get(listingId);
    if (!req) return "none";
    if (req.status === "pending") {
      return req.requester_id === user.id ? "sent" : "received";
    }
    return req.status as RequestStatus;
  }

  const totalPages = Math.ceil(totalListings / 20);

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* ── Page Header ─────────────────────────────── */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="w-full px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3 md:gap-4">
            
            {/* Left Section: Back + Title */}
            <div className="flex items-center justify-between md:justify-start w-full md:w-auto">
              <div className="flex items-center gap-4">
                <Link to="/" className="w-10 h-10 bg-secondary/50 flex items-center justify-center rounded-full text-foreground hover:bg-secondary transition-colors shrink-0">
                  <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="font-display text-xl font-black text-foreground tracking-tight">
                      Roommates
                    </h1>
                    <p className="text-xs text-muted-foreground font-medium hidden sm:block">
                      Find your next campus roommate
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Mobile Right Section (Toggle + Menu) */}
              <div className="flex md:hidden items-center gap-2 shrink-0">
                <Switch checked={showOthers} onCheckedChange={setShowOthers} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-10 h-10 flex items-center justify-center rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-lg">
                    <DropdownMenuItem onClick={() => handleTabChange("myposts")} className="gap-2 cursor-pointer rounded-xl py-2.5 font-bold text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      My Posts
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 cursor-pointer rounded-xl py-2.5 font-bold text-sm">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                      Drafts
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 cursor-pointer rounded-xl py-2.5 font-bold text-sm text-destructive focus:text-destructive focus:bg-destructive/10 mt-1">
                      <Trash2 className="w-4 h-4" />
                      Deleted Posts
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Middle Section: Search, Filters, Sort (Only when showOthers = true) */}
            {activeTab === "discover" && showOthers && (
              <div className="flex items-center gap-2 flex-1 max-w-2xl w-full">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, area, college, or keywords..."
                    className="w-full pl-9 md:pl-11 pr-4 py-2 md:py-2.5 rounded-full md:rounded-2xl border border-border bg-card text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setFilterDrawerOpen(true)}
                    className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-full md:rounded-2xl border text-sm font-bold transition-all shadow-sm ${
                      activeFilterCount > 0
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                      <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round" />
                    </svg>
                    <span className="hidden lg:inline">Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="w-4 h-4 md:w-5 md:h-5 bg-white/20 rounded-full text-[10px] md:text-xs flex items-center justify-center font-black">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-2 md:py-2.5 rounded-full md:rounded-2xl border border-border bg-card text-sm font-bold hover:border-primary/30 transition-all shadow-sm">
                        <svg className="w-4 h-4 text-muted-foreground hidden sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 16l4 4 4-4"/><path d="M7 20V4"/><path d="M21 8l-4-4-4 4"/><path d="M17 4v16"/></svg>
                        <span className="hidden sm:inline">{sortMode === "newest" ? "Newest" : "Budget"}</span>
                        <ChevronRight className="w-3.5 h-3.5 rotate-90 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl">
                      <DropdownMenuItem onClick={() => setSortMode("newest")} className="font-semibold text-sm py-2 cursor-pointer">Newest first</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortMode("budget")} className="font-semibold text-sm py-2 cursor-pointer">Budget</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}

            {/* Desktop Right Section: Toggle & Menu */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 mr-2">
                <span className="text-xs font-bold text-foreground">Show posts from others</span>
                <Switch checked={showOthers} onCheckedChange={setShowOthers} />
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-10 h-10 flex items-center justify-center rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-lg">
                  <DropdownMenuItem onClick={() => handleTabChange("myposts")} className="gap-2 cursor-pointer rounded-xl py-2.5 font-bold text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    My Posts
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer rounded-xl py-2.5 font-bold text-sm">
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                    Drafts
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer rounded-xl py-2.5 font-bold text-sm text-destructive focus:text-destructive focus:bg-destructive/10 mt-1">
                    <Trash2 className="w-4 h-4" />
                    Deleted Posts
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
          </div>

          {/* ── Back Navigation ─────────────────────────────── */}
          {activeTab !== "discover" && (
            <div className="flex px-4 pb-3">
              <button
                onClick={() => handleTabChange("discover")}
                className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Discover
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────── */}
      <div className="w-full px-4 md:px-6 py-6">
        {activeTab === "discover" && (
          showOthers ? (
            <DiscoverTab
              listings={filteredListings}
              totalListings={totalListings}
              loading={loading}
              fetchError={fetchError}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filters={filters}
              activeFilterCount={activeFilterCount}
              onOpenFilterDrawer={() => setFilterDrawerOpen(true)}
              sortMode={sortMode}
              onSortChange={setSortMode}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              myListing={myListing}
              savedIds={savedIds}
              requestMap={requestMap}
              userId={user?.id}
              onViewProfile={(p) => {
                setSelectedProfile(p);
                setPanelOpen(true);
              }}
              onToggleSave={handleToggleSave}
              onCreatePost={() => {
                handleTabChange("myposts");
                setIsCreatingPost(true);
              }}
              getRequestStatus={getRequestStatus}
            />
          ) : (
            <div className="flex flex-col items-center justify-between min-h-[calc(100vh-160px)] text-center w-full pb-4 md:pb-6">
              {/* Spacer above illustration */}
              <div className="flex-none min-h-[1rem] md:min-h-[3rem]"></div>
              
              <div className="flex flex-col items-center justify-center">
                <div className="relative mb-2 md:mb-4">
                  <img 
                    src="/roommates_empty_state.jpg" 
                    alt="Create your first post" 
                    className="w-full max-w-[200px] md:max-w-[260px] h-auto object-contain mix-blend-multiply dark:mix-blend-normal rounded-3xl" 
                  />
                </div>
                <h2 className="font-display font-black text-2xl md:text-3xl text-foreground mb-1 tracking-tight">
                  Create your first post
                </h2>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                  Share your roommate requirements and connect with students who match your preferences.
                </p>

                <div className="flex flex-col md:flex-row items-stretch justify-center gap-3 w-full">
                <div className="flex-1 flex items-center text-left gap-3 p-3 md:p-4 bg-primary/5 rounded-[16px] border border-primary/10">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm mb-0.5">Find Compatible Roommates</h3>
                    <p className="text-[12px] text-muted-foreground leading-snug">Connect with students like you</p>
                  </div>
                </div>
                
                <div className="flex-1 flex items-center text-left gap-3 p-3 md:p-4 bg-green-500/5 rounded-[16px] border border-green-500/10">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <Home className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm mb-0.5">Share Your Preferences</h3>
                    <p className="text-[12px] text-muted-foreground leading-snug">Tell others what you're looking for</p>
                  </div>
                </div>
                
                <div className="flex-1 flex items-center text-left gap-3 p-3 md:p-4 bg-orange-500/5 rounded-[16px] border border-orange-500/10">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm mb-0.5">Build a Safer Community</h3>
                    <p className="text-[12px] text-muted-foreground leading-snug">Verify and connect with real students</p>
                  </div>
                </div>
              </div>
              </div>
              
              {/* Spacer below cards to push button to bottom */}
              <div className="flex-1 min-h-[1.5rem] md:min-h-[2.5rem]"></div>

              <button 
                onClick={() => {
                  handleTabChange("myposts");
                  setIsCreatingPost(true);
                }}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 active:scale-95 mt-4"
              >
                <Plus className="w-5 h-5" />
                Post
              </button>
            </div>
          )
        )}

        {activeTab === "saved" && (
          <SavedTab
            profiles={savedProfiles}
            loading={savedLoading}
            savedIds={savedIds}
            myListing={myListing}
            userId={user?.id}
            requestMap={requestMap}
            onViewProfile={(p) => {
              setSelectedProfile(p);
              setPanelOpen(true);
            }}
            onToggleSave={handleToggleSave}
            getRequestStatus={getRequestStatus}
          />
        )}

        {activeTab === "requests" && (
          <RequestsTab
            received={receivedRequests}
            sent={sentRequests}
            loading={requestsLoading}
            userId={user?.id}
            onAccept={(id) => handleRespondToRequest(id, "accepted")}
            onDecline={(id) => handleRespondToRequest(id, "declined")}
            onCancel={handleCancelRequest}
            onViewProfile={(p) => {
              setSelectedProfile(p);
              setPanelOpen(true);
            }}
          />
        )}

        {activeTab === "myposts" && (
          <MyPostsTab
            myListing={myListing}
            onTogglePause={handleTogglePause}
            onDelete={handleDeleteListing}
            isCreating={isCreatingPost}
            setIsCreating={setIsCreatingPost}
          />
        )}

        {activeTab === "chat" && <ChatTab />}
      </div>

      {/* ── Profile Panel ─────────────────────────────── */}
      <RoommateProfilePanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        profile={selectedProfile}
        myListing={myListing}
        savedIds={savedIds}
        userId={user?.id}
        requestMap={requestMap}
        onToggleSave={handleToggleSave}
        onSendRequest={() => setSendRequestOpen(true)}
        onCancelRequest={handleCancelRequest}
        onBlock={() => selectedProfile && handleBlock(selectedProfile)}
        onReport={() => setReportOpen(true)}
        getRequestStatus={getRequestStatus}
      />

      {/* ── Filter Drawer ─────────────────────────────── */}
      <FilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        filters={filters}
        onApply={(f) => {
          setFilters(f);
          setPage(0);
        }}
        campuses={campuses}
      />

      {/* ── Send Request Sheet ────────────────────────── */}
      <Sheet open={sendRequestOpen} onOpenChange={setSendRequestOpen}>
        <SheetContent side="bottom" className="max-h-[60vh] rounded-t-2xl">
          <SheetHeader className="mb-4">
            <SheetTitle className="font-display text-lg font-black">
              Send Connection Request
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-2 block">
                Add a note (optional)
              </label>
              <Textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="Hi! I'm looking for a quiet roommate near the library..."
                className="resize-none"
              />
              <p className="text-right text-xs text-muted-foreground mt-1">
                {requestMessage.length}/200
              </p>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl text-sm text-muted-foreground">
              <Shield className="w-4 h-4 shrink-0 text-primary" />
              <span>
                Your contact info is only revealed after they accept your request.
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSendRequestOpen(false)}
                className="flex-1 py-3 rounded-xl border border-border font-bold text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                disabled={requestSending}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {requestSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Send Request
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Report Sheet ─────────────────────────────── */}
      <Sheet open={reportOpen} onOpenChange={setReportOpen}>
        <SheetContent side="bottom" className="max-h-[70vh] rounded-t-2xl">
          <SheetHeader className="mb-4">
            <SheetTitle className="font-display text-lg font-black">
              Report Profile
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReportReason(r)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all ${
                    reportReason === r
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      reportReason === r ? "border-destructive" : "border-muted-foreground"
                    }`}
                  >
                    {reportReason === r && (
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                    )}
                  </div>
                  {r}
                </button>
              ))}
            </div>
            <Textarea
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Additional details (optional)"
              className="resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setReportOpen(false)}
                className="flex-1 py-3 rounded-xl border border-border font-bold text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                className="flex-1 py-3 rounded-xl bg-destructive text-white font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Submit Report
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DISCOVER TAB
// ═══════════════════════════════════════════════════════════════

interface DiscoverTabProps {
  listings: RoommateProfile[];
  totalListings: number;
  loading: boolean;
  fetchError: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filters: RoommateFilters;
  activeFilterCount: number;
  onOpenFilterDrawer: () => void;
  sortMode: SortMode;
  onSortChange: (m: SortMode) => void;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  myListing: RoommateProfile | null;
  savedIds: Set<string>;
  requestMap: Map<string, RoommateRequestRow>;
  userId?: string;
  onViewProfile: (p: RoommateProfile) => void;
  onToggleSave: (id: string) => void;
  onCreatePost: () => void;
  getRequestStatus: (listingId: string, ownerId: string) => RequestStatus;
}

function DiscoverTab({
  listings,
  totalListings,
  loading,
  fetchError,
  searchQuery,
  onSearchChange,
  activeFilterCount,
  onOpenFilterDrawer,
  sortMode,
  onSortChange,
  page,
  totalPages,
  onPageChange,
  myListing,
  savedIds,
  userId,
  onViewProfile,
  onToggleSave,
  onCreatePost,
  getRequestStatus,
}: DiscoverTabProps) {
  return (
    <div className="space-y-4">



      {/* Card Grid */}
      {loading ? (
        <SkeletonGrid />
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="font-display font-black text-xl text-foreground mb-2">
            Unable to load posts. Please try again.
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs mb-6">
            There was a problem connecting to the database.
          </p>
        </div>
      ) : listings.length === 0 ? (
        <EmptyDiscoverState onClearSearch={() => onSearchChange("")} hasSearch={!!searchQuery} onCreatePost={onCreatePost} />
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4 font-medium"><strong className="text-foreground">{totalListings}</strong> posts found</p>
          <div className="flex flex-col gap-4">
          {listings.map((p) => (
            <RoommateCard
              key={p.id}
              profile={p}
              isSaved={savedIds.has(p.id)}
              requestStatus={getRequestStatus(p.id, p.ownerId)}
              myListing={myListing}
              onView={() => onViewProfile(p)}
              onToggleSave={() => onToggleSave(p.id)}
            />
          ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => onPageChange(Math.max(0, page - 1))}
            disabled={page === 0}
            className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold px-4">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROOMMATE CARD
// ═══════════════════════════════════════════════════════════════

interface RoommateCardProps {
  profile: RoommateProfile;
  isSaved: boolean;
  requestStatus: RequestStatus;
  myListing: RoommateProfile | null;
  onView: () => void;
  onToggleSave: () => void;
}

function RoommateCard({
  profile,
  isSaved,
  requestStatus,
  myListing,
  onView,
  onToggleSave,
}: RoommateCardProps) {
  return (
    <div 
       onClick={onView}
       className="bg-card border border-border rounded-3xl p-4 flex flex-col md:flex-row gap-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
    >
      <div className="relative shrink-0 w-full md:w-64 h-48 md:h-[200px] rounded-2xl overflow-hidden bg-muted">
        {profile.photoUrls && profile.photoUrls.length > 0 ? (
          <img src={profile.photoUrls[0]} alt="Room" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Home className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        {profile.photoUrls && profile.photoUrls.length > 0 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-sm">
            <Camera className="w-3.5 h-3.5" />
            {profile.photoUrls.length}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 ring-2 ring-border">
                <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.displayName} />
                <AvatarFallback className="bg-primary/10 text-primary font-black text-sm">
                  {getInitial(profile.displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-foreground text-sm">{profile.displayName}</h3>
                  {profile.verified && <BadgeCheck className="w-4 h-4 text-success" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[profile.college || profile.campus, formatActiveAgo(profile.createdAt || profile.recentlyActiveAt)].filter(Boolean).join(" • ")}
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="text-muted-foreground hover:text-foreground p-1">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg py-2 font-semibold text-sm">
                  <Flag className="w-4 h-4 text-muted-foreground" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mb-4 pr-0 md:pr-32">
            <h4 className="font-black text-lg text-foreground mb-1 leading-snug">
              {profile.housingType === 'Hostel' 
                ? `Need a roommate for a ${profile.occupancy || '2-seater'} hostel room`
                : `Looking for a ${profile.occupancy || '2-seater'} flatmate near ${profile.areaPreference || profile.campus || 'campus'}`}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {profile.about || 'No description provided.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            {profile.housingType && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 text-primary rounded-full text-[11px] font-bold border border-primary/10">
                <Home className="w-3 h-3" /> {profile.housingType}
              </div>
            )}
            {profile.occupancy && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 text-primary rounded-full text-[11px] font-bold border border-primary/10">
                <Users className="w-3 h-3" /> {profile.occupancy}
              </div>
            )}
            {profile.areaPreference && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 text-primary rounded-full text-[11px] font-bold border border-primary/10">
                <MapPin className="w-3 h-3" /> {profile.areaPreference}
              </div>
            )}
            {profile.food && profile.food !== 'No Preference' && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[11px] font-bold border border-green-500/10">
                <BadgeCheck className="w-3 h-3" /> {profile.food}
              </div>
            )}
            {profile.religionPreference && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 text-primary rounded-full text-[11px] font-bold border border-primary/10">
                <Sparkles className="w-3 h-3" /> {profile.religionPreference}
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 text-primary rounded-full text-[11px] font-bold border border-primary/10">
              <Wallet className="w-3 h-3" /> {formatBudget(profile.budgetMin, profile.budgetMax)}
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 md:-mt-16 md:absolute md:right-4 md:bottom-20">
            <button 
              onClick={(e) => { e.stopPropagation(); onView(); }}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-full font-bold text-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Request
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${isSaved ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'}`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FILTER DRAWER
// ═══════════════════════════════════════════════════════════════

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  filters: RoommateFilters;
  onApply: (f: RoommateFilters) => void;
  campuses: string[];
}

function FilterDrawer({ open, onOpenChange, filters, onApply, campuses }: FilterDrawerProps) {
  const [local, setLocal] = useState<RoommateFilters>(filters);
  const [budget, setBudget] = useState([filters.budgetMin, filters.budgetMax]);

  useEffect(() => {
    setLocal(filters);
    setBudget([filters.budgetMin, filters.budgetMax]);
  }, [filters, open]);

  function handleApply() {
    onApply({ ...local, budgetMin: budget[0], budgetMax: budget[1] });
    onOpenChange(false);
  }

  function handleReset() {
    setLocal(defaultFilters);
    setBudget([defaultFilters.budgetMin, defaultFilters.budgetMax]);
  }

  const setSingle = <K extends keyof RoommateFilters>(key: K, value: RoommateFilters[K]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  const toggleArray = (key: keyof RoommateFilters, value: string) => {
    setLocal((prev) => {
      const arr = (prev[key] as string[]) || [];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
          <SheetTitle className="font-display font-black text-lg">Filters</SheetTitle>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        <div className="px-6 py-6 space-y-8 pb-32">
          {/* MUST MATCH */}
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
              Basic Requirements
            </p>
            <div className="space-y-5">
              {/* Campus */}
              <div>
                <label className="text-sm font-bold mb-2 block">Campus / Area</label>
                <div className="flex flex-wrap gap-2">
                  {campuses.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSingle("campus", c)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        local.campus === c
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="text-sm font-bold mb-3 block">
                  Budget: {formatBudget(budget[0], budget[1])}
                </label>
                <Slider
                  min={3000}
                  max={30000}
                  step={500}
                  value={budget}
                  onValueChange={setBudget}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>₹3k</span>
                  <span>₹30k</span>
                </div>
              </div>
            </div>
          </div>

          {/* ROOM DETAILS */}
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
              Accommodation
            </p>
            <div className="space-y-5">
              <FilterMultiChipGroup 
                label="Accommodation Type" 
                options={["Flat", "Hostel", "PG"]} 
                selected={local.housingType || []} 
                onToggle={(v) => toggleArray("housingType", v)} 
              />
              <FilterMultiChipGroup 
                label="Room Sharing" 
                options={["1-seater", "2-seater", "3-seater", "4-seater"]} 
                selected={local.roomType || []} 
                onToggle={(v) => toggleArray("roomType", v)} 
              />
            </div>
          </div>
          
          {/* PREFERENCES */}
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
              Preferences
            </p>
            <div className="space-y-5">
              <FilterMultiChipGroup 
                label="Food Preference" 
                options={["Veg", "Non-veg", "Eggetarian", "Jain", "No Preference"]} 
                selected={local.food || []} 
                onToggle={(v) => toggleArray("food", v)} 
              />
              <FilterMultiChipGroup 
                label="Religion Preference" 
                options={["Hindu", "Muslim", "Christian", "Sikh", "Other", "No Preference"]} 
                selected={local.religionPreference || []} 
                onToggle={(v) => toggleArray("religionPreference", v)} 
              />
            </div>
          </div>
        </div>

        {/* Sticky Apply Button */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4">
          <button
            onClick={handleApply}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Apply Filters
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ═══════════════════════════════════════════════════════════════
// SAVED TAB
// ═══════════════════════════════════════════════════════════════

interface SavedTabProps {
  profiles: RoommateProfile[];
  loading: boolean;
  savedIds: Set<string>;
  myListing: RoommateProfile | null;
  userId?: string;
  requestMap: Map<string, RoommateRequestRow>;
  onViewProfile: (p: RoommateProfile) => void;
  onToggleSave: (id: string) => void;
  getRequestStatus: (listingId: string, ownerId: string) => RequestStatus;
}

function SavedTab({
  profiles,
  loading,
  savedIds,
  myListing,
  userId,
  onViewProfile,
  onToggleSave,
  getRequestStatus,
}: SavedTabProps) {
  if (loading) return <SkeletonGrid />;

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-warm/10 flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-warm" />
        </div>
        <h3 className="font-display font-black text-xl text-foreground mb-2">
          No saved profiles
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Browse Discover and tap the heart icon to save profiles you're
          interested in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground">
        <span className="text-foreground font-bold">{profiles.length}</span>{" "}
        saved {profiles.length === 1 ? "profile" : "profiles"}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => (
          <RoommateCard
            key={p.id}
            profile={p}
            isSaved={savedIds.has(p.id)}
            requestStatus={getRequestStatus(p.id, p.ownerId)}
            myListing={myListing}
            onView={() => onViewProfile(p)}
            onToggleSave={() => onToggleSave(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REQUESTS TAB
// ═══════════════════════════════════════════════════════════════

interface RequestsTabProps {
  received: RequestWithProfile[];
  sent: RequestWithProfile[];
  loading: boolean;
  userId?: string;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel: (id: string) => void;
  onViewProfile: (p: RoommateProfile) => void;
}

function RequestsTab({
  received,
  sent,
  loading,
  onAccept,
  onDecline,
  onCancel,
  onViewProfile,
}: RequestsTabProps) {
  const [tab, setTab] = useState<"received" | "sent">("received");

  if (loading) return <SkeletonGrid count={4} />;

  const total = received.length + sent.length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display font-black text-xl text-foreground mb-2">
          No requests yet
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Browse Discover and send connection requests to find your roommate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Inner tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          onClick={() => setTab("received")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === "received" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
        >
          Received ({received.length})
        </button>
        <button
          onClick={() => setTab("sent")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === "sent" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
        >
          Sent ({sent.length})
        </button>
      </div>

      {tab === "received" && (
        <div className="space-y-3">
          {received.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No received requests
            </p>
          ) : (
            received.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                type="received"
                onAccept={() => onAccept(req.id)}
                onDecline={() => onDecline(req.id)}
                onViewProfile={() =>
                  req.otherProfile && onViewProfile(req.otherProfile)
                }
              />
            ))
          )}
        </div>
      )}

      {tab === "sent" && (
        <div className="space-y-3">
          {sent.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No sent requests
            </p>
          ) : (
            sent.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                type="sent"
                onCancel={() => onCancel(req.id)}
                onViewProfile={() =>
                  req.otherProfile && onViewProfile(req.otherProfile)
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function RequestCard({
  req,
  type,
  onAccept,
  onDecline,
  onCancel,
  onViewProfile,
}: {
  req: RequestWithProfile;
  type: "received" | "sent";
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onViewProfile: () => void;
}) {
  const profile = req.otherProfile;
  const statusColors: Record<string, string> = {
    pending: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700",
    accepted: "bg-success/10 text-success border-success/30",
    declined: "bg-muted text-muted-foreground border-border",
    cancelled: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <Avatar className="w-12 h-12 shrink-0">
          <AvatarImage src={profile?.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-black">
            {profile ? getInitial(profile.displayName) : "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm">
              {profile?.displayName ?? "Unknown User"}
            </p>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wide ${statusColors[req.status] ?? ""}`}
            >
              {req.status}
            </span>
          </div>
          {profile && (
            <p className="text-xs text-muted-foreground">
              {[profile.college, profile.campus].filter(Boolean).join(" · ")}
            </p>
          )}
          {req.message && (
            <p className="mt-2 text-sm text-foreground/80 bg-muted/50 rounded-xl px-3 py-2 italic">
              &ldquo;{req.message}&rdquo;
            </p>
          )}
          {req.status === "accepted" && (
            <p className="mt-1 text-xs text-success font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Connected! You can now chat.
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        {profile && (
          <button
            onClick={onViewProfile}
            className="flex-1 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors"
          >
            View Profile
          </button>
        )}
        {type === "received" && req.status === "pending" && (
          <>
            <button
              onClick={onDecline}
              className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              className="px-4 py-2 rounded-xl bg-success text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Accept
            </button>
          </>
        )}
        {type === "sent" && req.status === "pending" && (
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors text-muted-foreground"
          >
            Cancel
          </button>
        )}
        {req.status === "accepted" && (
          <button className="px-4 py-2 rounded-xl bg-success text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" />
            Chat
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MY POSTS TAB — stub for Step 2
// ═══════════════════════════════════════════════════════════════

function MyPostsTab({
  myListing,
  onTogglePause,
  onDelete,
  isCreating,
  setIsCreating,
}: {
  myListing: RoommateProfile | null;
  onTogglePause: () => void;
  onDelete: () => void;
  isCreating: boolean;
  setIsCreating: (v: boolean) => void;
}) {
  if (isCreating) {
    return <CreateRoommatePostForm onCancel={() => setIsCreating(false)} />;
  }

  return (
    <div className="max-w-xl mx-auto">
      {myListing ? (
        /* Existing post summary */
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display font-black text-lg">Your Post</h2>
                <p className="text-sm text-muted-foreground">
                  {myListing.paused ? "Paused — not visible to others" : "Active — visible to other users"}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-black border uppercase shrink-0 ${
                  myListing.paused
                    ? "border-amber-300 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
                    : "border-success/30 text-success bg-success/10"
                }`}
              >
                {myListing.paused ? "Paused" : "Active"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <InfoBadge icon={Wallet} label={formatBudget(myListing.budgetMin, myListing.budgetMax)} />
              {myListing.moveInDate && (
                <InfoBadge icon={CalendarDays} label={formatMoveIn(myListing.moveInDate)} />
              )}
              {myListing.housingType && (
                <InfoBadge icon={Home} label={myListing.housingType} />
              )}
              {myListing.areaPreference && (
                <InfoBadge icon={MapPin} label={myListing.areaPreference} />
              )}
            </div>

            {myListing.about && (
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                {myListing.about}
              </p>
            )}

            <div className="space-y-2">
              <button
                onClick={onTogglePause}
                className="w-full py-2.5 border border-border rounded-xl font-bold text-sm hover:bg-muted transition-colors"
              >
                {myListing.paused ? "Reactivate Post" : "Pause Post"}
              </button>
              <button
                onClick={onDelete}
                className="w-full py-2.5 border border-destructive/30 rounded-xl font-bold text-sm text-destructive hover:bg-destructive/5 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Post
              </button>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
            <p className="text-sm font-semibold text-foreground mb-1">
              Full post editing coming in the next update
            </p>
            <p className="text-xs text-muted-foreground">
              You'll be able to edit accommodation type, room sharing, location, food and religion preferences, budget, and description.
            </p>
          </div>
        </div>
      ) : (
        /* No post yet */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
            <Plus className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-display font-black text-2xl text-foreground mb-2">
            No posts yet
          </h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-6">
            Create a roommate post to let others find and connect with you. Share your accommodation type, location, budget, and preferences.
          </p>
          <div className="bg-muted/50 border border-border rounded-2xl p-4 text-left w-full max-w-sm mb-6">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-3">
              Your post will include
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {[
                "Accommodation type (Flat / Hostel / PG)",
                "Room sharing (2 / 3 / 4 seater)",
                "Location & area",
                "Food & religion preferences",
                "Budget & move-in date",
                "Description",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="w-full max-w-sm py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            Create Post
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATE POST FORM
// ═══════════════════════════════════════════════════════════════

function FormLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="text-sm font-bold text-foreground mb-2 block">
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  );
}

function CreateRoommatePostForm({ onCancel }: { onCancel: () => void }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    accommodationType: "",
    roomSharing: "",
    preferredArea: "",
    exactAddress: "",
    foodPreferences: [] as string[],
    religionPreferences: [] as string[],
    budgetMin: 3000,
    budgetMax: 15000,
    moveInDate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = "Post title is required";
    if (!form.description.trim()) newErrors.description = "Description is required";
    if (!form.accommodationType) newErrors.accommodationType = "Accommodation type is required";
    if (!form.roomSharing) newErrors.roomSharing = "Room sharing is required";
    if (!form.preferredArea.trim()) newErrors.preferredArea = "Preferred area is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all required fields.");
    }
    return Object.keys(newErrors).length === 0;
  };

  const handlePublish = () => {
    if (!validate()) return;
    toast.info("Backend integration pending for these new fields (Step 3).", { duration: 4000 });
  };

  const handleSaveDraft = () => {
    toast.info("Draft saving pending backend integration (Step 3).", { duration: 4000 });
  };

  const set = (key: keyof typeof form, val: unknown) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="max-w-2xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="mb-8">
        <h2 className="font-display font-black text-2xl text-foreground">Create Roommate Post</h2>
        <p className="text-muted-foreground text-sm mt-1">Describe the roommate and accommodation you're looking for.</p>
      </div>

      <div className="space-y-8">
        {/* 1. Basic details */}
        <div className="bg-card border border-border p-5 sm:p-6 rounded-2xl shadow-sm">
          <h3 className="font-display font-black text-lg text-foreground border-b border-border/50 pb-3 mb-5">
            1. Basic details
          </h3>
          <div className="space-y-5">
            <div>
              <FormLabel label="Post title" required />
              <Input
                value={form.title}
                onChange={(e) => {
                  set("title", e.target.value);
                  if (e.target.value.trim()) setErrors(p => ({ ...p, title: "" }));
                }}
                placeholder="e.g. Need a roommate for 2BHK in Knowledge Park"
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && <p className="text-xs text-destructive mt-1.5">{errors.title}</p>}
            </div>
            <div>
              <FormLabel label="Description" required />
              <Textarea
                value={form.description}
                onChange={(e) => {
                  set("description", e.target.value);
                  if (e.target.value.trim()) setErrors(p => ({ ...p, description: "" }));
                }}
                placeholder="Tell students what you are looking for in a roommate..."
                rows={4}
                className={`resize-none ${errors.description ? "border-destructive" : ""}`}
              />
              {errors.description && <p className="text-xs text-destructive mt-1.5">{errors.description}</p>}
            </div>
          </div>
        </div>

        {/* 2. Accommodation */}
        <div className="bg-card border border-border p-5 sm:p-6 rounded-2xl shadow-sm">
          <h3 className="font-display font-black text-lg text-foreground border-b border-border/50 pb-3 mb-5">
            2. Accommodation
          </h3>
          <div className="space-y-5">
            <div>
              <FormLabel label="Accommodation type" required />
              <ChipSelector
                options={["Flat", "Hostel", "PG"]}
                value={form.accommodationType}
                onChange={(v) => {
                  set("accommodationType", v);
                  setErrors((p) => ({ ...p, accommodationType: "" }));
                }}
              />
              {errors.accommodationType && <p className="text-xs text-destructive mt-1.5">{errors.accommodationType}</p>}
            </div>
            <div>
              <FormLabel label="Room sharing" required />
              <ChipSelector
                options={["2-seater", "3-seater", "4-seater"]}
                value={form.roomSharing}
                onChange={(v) => {
                  set("roomSharing", v);
                  setErrors((p) => ({ ...p, roomSharing: "" }));
                }}
              />
              {errors.roomSharing && <p className="text-xs text-destructive mt-1.5">{errors.roomSharing}</p>}
            </div>
            <div>
              <FormLabel label="Preferred area" required />
              <Input
                value={form.preferredArea}
                onChange={(e) => {
                  set("preferredArea", e.target.value);
                  if (e.target.value.trim()) setErrors(p => ({ ...p, preferredArea: "" }));
                }}
                placeholder="e.g. Knowledge Park, Pari Chowk"
                className={errors.preferredArea ? "border-destructive" : ""}
              />
              {errors.preferredArea && <p className="text-xs text-destructive mt-1.5">{errors.preferredArea}</p>}
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                 <label className="text-sm font-bold text-foreground">Exact address</label>
                 <span className="text-xs text-muted-foreground font-semibold">Optional</span>
              </div>
              <Input
                value={form.exactAddress}
                onChange={(e) => set("exactAddress", e.target.value)}
                placeholder="Flat / hostel / PG address"
              />
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-lg border border-border/50">
                 <Shield className="w-4 h-4 shrink-0 text-primary" />
                 <span>Your exact address remains private and is only shown to connected roommates.</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Roommate preferences */}
        <div className="bg-card border border-border p-5 sm:p-6 rounded-2xl shadow-sm">
          <h3 className="font-display font-black text-lg text-foreground border-b border-border/50 pb-3 mb-5">
            3. Roommate preferences
          </h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-end mb-2">
                 <label className="text-sm font-bold text-foreground">Food preference</label>
                 <span className="text-xs text-muted-foreground font-semibold">Optional</span>
              </div>
              <ChipMultiSelect
                options={["Veg", "Non-veg"]}
                selected={form.foodPreferences}
                onToggle={(v) => {
                  setForm(prev => {
                     const arr = prev.foodPreferences;
                     return { ...prev, foodPreferences: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] };
                  });
                }}
              />
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                 <label className="text-sm font-bold text-foreground">Religion preference</label>
                 <span className="text-xs text-muted-foreground font-semibold">Optional</span>
              </div>
              <ChipMultiSelect
                options={["Hindu", "Muslim", "Christian", "Sikh", "Other", "No preference"]}
                selected={form.religionPreferences}
                onToggle={(v) => {
                  setForm(prev => {
                    const arr = prev.religionPreferences;
                    if (v === "No preference") {
                      return { ...prev, religionPreferences: arr.includes(v) ? [] : [v] };
                    }
                    const next = arr.includes(v) ? arr.filter(x => x !== v) : [...arr.filter(x => x !== "No preference"), v];
                    return { ...prev, religionPreferences: next };
                  });
                }}
              />
            </div>
          </div>
        </div>

        {/* 4. Additional details */}
        <div className="bg-card border border-border p-5 sm:p-6 rounded-2xl shadow-sm">
          <h3 className="font-display font-black text-lg text-foreground border-b border-border/50 pb-3 mb-5">
            4. Additional details
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-4">
                 <label className="text-sm font-bold text-foreground">
                   Monthly budget
                   <span className="ml-2 text-primary">{formatBudget(form.budgetMin, form.budgetMax)}</span>
                 </label>
                 <span className="text-xs text-muted-foreground font-semibold">Optional</span>
              </div>
              <Slider
                min={1000}
                max={30000}
                step={500}
                value={[form.budgetMin, form.budgetMax]}
                onValueChange={([min, max]) => {
                   setForm(p => ({ ...p, budgetMin: min, budgetMax: max }));
                }}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                 <label className="text-sm font-bold text-foreground">Move-in date</label>
                 <span className="text-xs text-muted-foreground font-semibold">Optional</span>
              </div>
              <Input
                type="date"
                value={form.moveInDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => set("moveInDate", e.target.value)}
                className="w-full sm:w-1/2"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-4">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <div className="flex w-full sm:w-auto gap-3 sm:ml-auto">
            <button
              onClick={handleSaveDraft}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-primary/30 text-primary bg-primary/5 text-sm font-bold hover:bg-primary/10 transition-colors"
            >
              Save Draft
            </button>
            <button
              onClick={handlePublish}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Publish Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CHAT TAB — stub
// ═══════════════════════════════════════════════════════════════

function ChatTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <MessageCircle className="w-8 h-8 text-primary" />
      </div>
      <h3 className="font-display font-black text-xl text-foreground mb-2">
        Chat
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        Chat becomes available after a roommate request is accepted. It will be implemented in a future step.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SMALL UI ATOMS
// ═══════════════════════════════════════════════════════════════

function CompatibilityBadgeSmall({ percentage }: { percentage: number }) {
  const color =
    percentage >= 80
      ? "text-success bg-success/15 border-success/30"
      : percentage >= 60
        ? "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400"
        : "text-muted-foreground bg-muted border-border";

  return (
    <div
      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-[10px] font-black ${color}`}
    >
      {percentage}
    </div>
  );
}

function InfoBadge({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-muted/70 rounded-lg border border-border/50">
      <Icon className="w-3 h-3 text-muted-foreground" />
      <span className="text-[11px] font-bold text-muted-foreground">{label}</span>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`bg-muted/50 rounded-xl p-3 ${className ?? ""}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function PanelSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
        {label}
      </p>
      {children}
    </div>
  );
}

function ChipSelector({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            value === opt
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:border-primary/40 hover:bg-accent"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function ChipMultiSelect({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center ${
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-primary/40 hover:bg-accent text-foreground"
            }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5 shrink-0 mr-1.5" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function FilterMultiChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-bold mb-2 block">{label}</label>
      <ChipMultiSelect options={options} selected={selected} onToggle={onToggle} />
    </div>
  );
}

function FilterChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-bold mb-2 block">{label}</label>
      <ChipSelector options={options} value={value} onChange={onChange} />
    </div>
  );
}

function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const limit = 200;
  const shouldTruncate = text.length > limit;

  return (
    <div>
      <p className="text-sm text-foreground/80 leading-relaxed">
        {shouldTruncate && !expanded ? text.slice(0, limit) + "…" : text}
      </p>
      {shouldTruncate && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-bold text-primary mt-1 hover:opacity-80 transition-opacity"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Skeleton className="w-14 h-14 rounded-full shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-6 w-16 rounded-lg" />
            <Skeleton className="h-6 w-14 rounded-lg" />
          </div>
          <Skeleton className="h-3 w-36" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-9 flex-1 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyDiscoverState({
  onClearSearch,
  hasSearch,
  onCreatePost,
}: {
  onClearSearch: () => void;
  hasSearch: boolean;
  onCreatePost: () => void;
}) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-display font-black text-xl text-foreground mb-2">
          No matches found
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs mb-6">
          Try adjusting your search or filters to find what you're looking for.
        </p>
        <button
          onClick={onClearSearch}
          className="px-6 py-2.5 bg-secondary text-secondary-foreground font-bold rounded-xl hover:bg-secondary/80 transition-colors text-sm"
        >
          Clear all filters
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center w-full pb-4 md:pb-6 pt-8 md:pt-12">
      <div className="relative mb-2 md:mb-4">
        <img 
          src="/roommates_empty_state.jpg" 
          alt="No roommate posts yet" 
          className="w-full max-w-[200px] md:max-w-[260px] h-auto object-contain mix-blend-multiply dark:mix-blend-normal rounded-3xl" 
        />
      </div>
      <h2 className="font-display font-black text-2xl md:text-3xl text-foreground mb-1 tracking-tight">
        No roommate posts yet
      </h2>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-10">
        Be the first to create a roommate post and help others find their perfect match.
      </p>

      <div className="flex flex-col md:flex-row items-stretch justify-center gap-3 w-full">
        <div className="flex-1 flex items-center text-left gap-3 p-3 md:p-4 bg-primary/5 rounded-[16px] border border-primary/10">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm mb-0.5">Find Compatible Roommates</h3>
            <p className="text-[12px] text-muted-foreground leading-snug">Connect with students like you</p>
          </div>
        </div>
        
        <div className="flex-1 flex items-center text-left gap-3 p-3 md:p-4 bg-green-500/5 rounded-[16px] border border-green-500/10">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
            <Home className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm mb-0.5">Share Your Preferences</h3>
            <p className="text-[12px] text-muted-foreground leading-snug">Tell others what you're looking for</p>
          </div>
        </div>
        
        <div className="flex-1 flex items-center text-left gap-3 p-3 md:p-4 bg-orange-500/5 rounded-[16px] border border-orange-500/10">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm mb-0.5">Build a Safer Community</h3>
            <p className="text-[12px] text-muted-foreground leading-snug">Verify and connect with real students</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RoommateProfilePanelProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: RoommateProfile | null;
  myListing: RoommateProfile | null;
  savedIds: Set<string>;
  userId?: string;
  requestMap: Map<string, RoommateRequestRow>;
  onToggleSave: (id: string) => void;
  onSendRequest: () => void;
  onCancelRequest: (id: string) => void;
  onBlock: () => void;
  onReport: () => void;
  getRequestStatus: (listingId: string, ownerId: string) => RequestStatus;
}

function RoommateProfilePanel({
  open,
  onOpenChange,
  profile,
  myListing,
  savedIds,
  userId,
  requestMap,
  onToggleSave,
  onSendRequest,
  onCancelRequest,
  onBlock,
  onReport,
  getRequestStatus,
}: RoommateProfilePanelProps) {
  if (!profile) return null;

  const isSaved = savedIds.has(profile.id);
  const requestStatus = getRequestStatus(profile.id, profile.ownerId);
  const req = requestMap.get(profile.id);
  const compat = myListing ? computeCompatibility(myListing, profile) : null;
  const isOwnProfile = userId === profile.ownerId;
  const isConnected = requestStatus === "accepted";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="font-display font-black text-base text-foreground flex-1 truncate">
            {profile.displayName}
          </span>
          {!isOwnProfile && (
            <button
              onClick={() => onToggleSave(profile.id)}
              className={`p-2 rounded-full border transition-all ${
                isSaved
                  ? "border-warm/40 bg-warm/10 text-warm"
                  : "border-border text-muted-foreground hover:text-warm"
              }`}
            >
              <Heart
                className="w-4 h-4"
                fill={isSaved ? "currentColor" : "none"}
              />
            </button>
          )}
        </div>

        <div className="px-6 pb-32 space-y-6 pt-6">
          {/* SECTION A — Identity */}
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 ring-2 ring-border shrink-0">
              <AvatarImage src={profile.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-black text-3xl">
                {getInitial(profile.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-black text-xl text-foreground">
                  {profile.displayName}
                  {profile.age ? (
                    <span className="text-muted-foreground font-semibold text-base ml-1">
                      , {profile.age}
                    </span>
                  ) : null}
                </h2>
                {profile.verified && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-success/10 border border-success/30 rounded-full">
                    <BadgeCheck className="w-3 h-3 text-success" />
                    <span className="text-[10px] font-black text-success">
                      Verified
                    </span>
                  </div>
                )}
              </div>
              {(profile.course || profile.branch) && (
                <p className="text-sm text-muted-foreground font-medium">
                  {[profile.course, profile.branch, profile.semester]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {profile.college && (
                <p className="text-sm font-semibold text-foreground/80">
                  {profile.college}
                </p>
              )}
              {profile.campus && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">
                    {profile.campus}
                  </span>
                </div>
              )}
              {profile.recentlyActiveAt && (
                <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                  {formatActiveAgo(profile.recentlyActiveAt)}
                </p>
              )}
            </div>
          </div>

          {/* SECTION B — Compatibility */}
          {compat && !isOwnProfile && (
            <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4">
              <div className="flex items-center gap-4 mb-3">
                <CompatibilityArc percentage={compat.percentage} />
                <div>
                  <p className="font-display font-black text-2xl text-foreground">
                    {compat.percentage}%{" "}
                    <span className="text-base font-semibold text-muted-foreground">
                      compatible
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Based on{" "}
                    {compat.factors.filter((f) => f.matched !== null).length}{" "}
                    shared factors
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {compat.factors
                  .filter((f) => f.matched !== null)
                  .sort((a, b) => b.weight - a.weight)
                  .slice(0, 6)
                  .map((f) => (
                    <span
                      key={f.key}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        f.matched === true
                          ? "bg-success/10 text-success border-success/20"
                          : f.matched === false
                            ? "bg-muted text-muted-foreground border-border"
                            : "bg-muted/50 text-muted-foreground border-border/50"
                      }`}
                    >
                      {f.matched === true ? "✓ " : f.matched === false ? "✗ " : "— "}
                      {f.label}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {!myListing && !isOwnProfile && (
            <div className="bg-muted/50 rounded-2xl p-4 text-center text-sm text-muted-foreground">
              <Sparkles className="w-5 h-5 mx-auto mb-1 text-primary" />
              Create your profile to see compatibility scores
            </div>
          )}

          {/* SECTION C — Room & Budget */}
          <PanelSection label="Room & Budget">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard icon={Wallet} label="Budget" value={formatBudget(profile.budgetMin, profile.budgetMax)} />
              {profile.moveInDate && (
                <InfoCard icon={CalendarDays} label="Move-in" value={formatMoveIn(profile.moveInDate)} />
              )}
              {profile.roomType && (
                <InfoCard icon={Home} label="Room Type" value={profile.roomType} />
              )}
              {profile.housingType && (
                <InfoCard icon={Home} label="Housing" value={profile.housingType} />
              )}
              {profile.areaPreference && (
                <InfoCard icon={MapPin} label="Preferred Area" value={profile.areaPreference} className="col-span-2" />
              )}
            </div>
          </PanelSection>

          {/* SECTION D — Lifestyle */}
          <PanelSection label="Lifestyle">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Food", value: profile.food },
                { label: "Sleep", value: profile.sleepSchedule },
                { label: "Study", value: profile.studyStyle },
                { label: "Cleanliness", value: profile.cleanliness },
                { label: "Smoking", value: profile.smoking },
                { label: "Alcohol", value: profile.alcohol },
                { label: "Visitors", value: profile.visitors },
                { label: "Pets", value: profile.pets },
              ]
                .filter((i) => i.value && i.value !== "No Preference")
                .map((item) => (
                  <div
                    key={item.label}
                    className="bg-muted/50 rounded-xl p-2.5"
                  >
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-0.5">
                      {item.label}
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {item.value}
                    </p>
                  </div>
                ))}
            </div>
          </PanelSection>

          {/* SECTION E — About */}
          {profile.about && (
            <PanelSection label="About">
              <ExpandableText text={profile.about} />
            </PanelSection>
          )}

          {/* SECTION F — Interests */}
          {profile.interests.length > 0 && (
            <PanelSection label="Interests">
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-semibold border border-border"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </PanelSection>
          )}

          {/* SECTION G — Languages */}
          {profile.languages.length > 0 && (
            <PanelSection label="Languages">
              <div className="flex flex-wrap gap-1.5">
                {profile.languages.map((l) => (
                  <span
                    key={l}
                    className="px-3 py-1 bg-muted rounded-full text-xs font-semibold border border-border"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </PanelSection>
          )}

          {/* SECTION H — Amenities */}
          {profile.amenities.length > 0 && (
            <PanelSection label="Amenities Needed">
              <div className="flex flex-wrap gap-1.5">
                {profile.amenities.map((a) => (
                  <span
                    key={a}
                    className="px-3 py-1 bg-electric/10 border border-electric/20 text-electric-foreground rounded-full text-xs font-semibold"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </PanelSection>
          )}

          {/* SECTION I — Private (connected only) */}
          {isConnected && (profile.phoneNumber || profile.instagramHandle) && (
            <PanelSection label="Contact Details">
              <div className="space-y-2">
                {profile.phoneNumber && (
                  <div className="flex items-center gap-3 p-3 bg-success/5 border border-success/20 rounded-xl">
                    <Phone className="w-4 h-4 text-success shrink-0" />
                    <span className="text-sm font-bold">{profile.phoneNumber}</span>
                  </div>
                )}
                {profile.instagramHandle && (
                  <div className="flex items-center gap-3 p-3 bg-success/5 border border-success/20 rounded-xl">
                    <Instagram className="w-4 h-4 text-success shrink-0" />
                    <span className="text-sm font-bold">
                      @{profile.instagramHandle}
                    </span>
                  </div>
                )}
              </div>
            </PanelSection>
          )}

          {!isConnected && !isOwnProfile && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl text-xs text-muted-foreground border border-border">
              <Lock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              <span>
                Phone and Instagram are revealed after connecting.
              </span>
            </div>
          )}
        </div>

        {/* ── Sticky Footer Actions ─────────────────────── */}
        {!isOwnProfile && (
          <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border px-6 py-4 space-y-2">
            {requestStatus === "none" && profile.receiveRequests && (
              <button
                onClick={onSendRequest}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Send Connection Request
              </button>
            )}
            {requestStatus === "sent" && req && (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-bold">
                  <Clock className="w-4 h-4" />
                  Request Pending
                </div>
                <button
                  onClick={() => onCancelRequest(req.id)}
                  className="py-3 px-4 rounded-xl border border-border hover:bg-muted text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            {requestStatus === "received" && req && (
              <div className="flex gap-2">
                <button
                  onClick={() => onCancelRequest(req.id)}
                  className="flex-1 py-3 rounded-xl border border-border font-bold text-sm hover:bg-muted transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={onSendRequest}
                  className="flex-1 py-3 bg-success text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Accept
                </button>
              </div>
            )}
            {requestStatus === "accepted" && (
              <button className="w-full py-3 bg-success text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Open Chat
              </button>
            )}
            {requestStatus === "declined" && (
              <div className="flex items-center justify-center py-3 text-muted-foreground text-sm font-medium">
                Request was declined
              </div>
            )}
            {!profile.receiveRequests && requestStatus === "none" && (
              <div className="flex items-center justify-center py-3 text-muted-foreground text-sm font-medium">
                Not accepting requests at this time
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={onReport}
                className="flex-1 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors flex items-center justify-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" />
                Report
              </button>
              <button
                onClick={onBlock}
                className="flex-1 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                Block
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}


function CompatibilityArc({ percentage }: { percentage: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = (percentage / 100) * circ;
  const color =
    percentage >= 80 ? "#16a34a" : percentage >= 60 ? "#d97706" : "#94a3b8";

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
      <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-border" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="37" textAnchor="middle" className="font-black" style={{ fontSize: 14, fill: color, fontFamily: "inherit" }}>
        {percentage}
      </text>
    </svg>
  );
}

