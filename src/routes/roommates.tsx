import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Compass,
  Eye,
  EyeOff,
  Filter,
  Flag,
  Heart,
  Home,
  Instagram,
  Loader2,
  Lock,
  LogIn,
  MapPin,
  MessageCircle,
  Moon,
  Phone,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  Trash2,
  User,
  Users,
  Wallet,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  BriefcaseBusiness,
  ChevronDown,
  RotateCcw,
  PauseCircle,
  PlayCircle,
  Check,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
import { Progress } from "@/components/ui/progress";

import type {
  RoommateProfile,
  RoommateProfileForm,
  RoommateFilters,
  RoommateRequestRow,
  CompatibilityResult,
  SortMode,
  RequestStatus,
} from "@/types/roommates";
import {
  defaultFilters,
  defaultProfileForm,
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
  GENDER_PREF_OPTIONS,
  PETS_OPTIONS,
  LANGUAGE_CHIPS,
  INTEREST_CHIPS,
  AMENITY_CHIPS,
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
  upsertListing,
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
      { title: "Nexora — Find Your Roommate" },
      {
        name: "description",
        content:
          "Find your perfect student roommate on Nexora. Smart compatibility matching, campus-verified profiles, and privacy-first connections.",
      },
    ],
  }),
  component: RoommatesPage,
});

// ── Tab Types ─────────────────────────────────────────────────

type ActiveTab = "discover" | "saved" | "requests" | "myprofile";

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

  // ── Discover State ──────────────────────────────────────────
  const [listings, setListings] = useState<RoommateProfile[]>([]);
  const [totalListings, setTotalListings] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RoommateFilters>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("compatibility");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [campuses, setCampuses] = useState<string[]>([]);

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

  // ── Profile Form State ──────────────────────────────────────
  const [profileFormOpen, setProfileFormOpen] = useState(false);
  const [profileForm, setProfileForm] =
    useState<RoommateProfileForm>(defaultProfileForm);
  const [formStep, setFormStep] = useState(1);
  const [formSaving, setFormSaving] = useState(false);

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

      // Pre-fill profile form from profile + listing
      if (myL) {
        setProfileForm(listingToForm(myL));
      } else if (profile) {
        setProfileForm((f) => ({
          ...f,
          displayName: profile.full_name ?? "",
          college: profile.college_name ?? "",
        }));
      }
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
    } catch (e: any) {
      console.error("Detailed fetch error:", e);
      toast.error(`Failed to load listings: ${e.message || "Database connection error"}`);
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
    return Object.entries(filters).filter(
      ([k, v]) => v !== (defaultFilters as Record<string, unknown>)[k],
    ).length;
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

  // ── Profile Form Save ────────────────────────────────────────
  async function handleSaveProfile() {
    if (!user) return;
    setFormSaving(true);
    try {
      await upsertListing(profileForm, user.id, myListing?.id);
      const updated = await fetchMyListing(user.id);
      setMyListing(updated);
      toast.success(myListing ? "Profile updated!" : "Profile created! You're now visible to others.");
      setProfileFormOpen(false);
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setFormSaving(false);
    }
  }

  // ── Delete Profile ───────────────────────────────────────────
  async function handleDeleteListing() {
    if (!user || !myListing) return;
    try {
      await deleteListing(myListing.id, user.id);
      setMyListing(null);
      setProfileForm(defaultProfileForm);
      toast.success("Roommate profile deleted");
    } catch {
      toast.error("Failed to delete profile");
    }
  }

  // ── Pause / Unpause ──────────────────────────────────────────
  async function handleTogglePause() {
    if (!user || !myListing) return;
    try {
      await setListingPaused(myListing.id, user.id, !myListing.paused);
      const updated = await fetchMyListing(user.id);
      setMyListing(updated);
      toast.success(myListing.paused ? "Profile reactivated" : "Profile paused");
    } catch {
      toast.error("Failed to update profile status");
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
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="font-display text-2xl font-black text-foreground tracking-tight">
                Roommates
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                Find your perfect campus match
              </p>
            </div>
            {/* Quick profile status pill */}
            {myListing && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                  myListing.paused
                    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                    : "bg-success/10 border-success/30 text-success"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${myListing.paused ? "bg-amber-500" : "bg-success animate-pulse"}`}
                />
                {myListing.paused ? "Paused" : "Active"}
              </div>
            )}
          </div>

          {/* ── Tab Bar ─────────────────────────────────── */}
          <div className="flex gap-0 -mb-px">
            {(
              [
                { id: "discover", label: "Discover", icon: Compass, badge: undefined },
                { id: "saved", label: "Saved", icon: Heart, badge: undefined },
                {
                  id: "requests",
                  label: "Requests",
                  icon: Bell,
                  badge: notifCount,
                },
                { id: "myprofile", label: "My Profile", icon: User, badge: undefined },
              ] as const
            ).map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id as ActiveTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all relative ${
                  activeTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {badge && badge > 0 ? (
                  <span className="absolute -top-0.5 right-1 w-4 h-4 bg-destructive text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === "discover" && (
          <DiscoverTab
            listings={filteredListings}
            totalListings={totalListings}
            loading={loading}
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
            onCreateProfile={() => {
              setFormStep(1);
              setProfileFormOpen(true);
              setActiveTab("myprofile");
            }}
            getRequestStatus={getRequestStatus}
          />
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

        {activeTab === "myprofile" && (
          <MyProfileTab
            myListing={myListing}
            form={profileForm}
            onFormChange={setProfileForm}
            formStep={formStep}
            onFormStepChange={setFormStep}
            formOpen={profileFormOpen}
            onFormOpenChange={setProfileFormOpen}
            formSaving={formSaving}
            onSave={handleSaveProfile}
            onDelete={handleDeleteListing}
            onTogglePause={handleTogglePause}
            campuses={campuses}
            profile={profile}
          />
        )}
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
                placeholder="Hi! I'm a CSE student looking for a quiet roommate near the library..."
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
  onCreateProfile: () => void;
  getRequestStatus: (listingId: string, ownerId: string) => RequestStatus;
}

function DiscoverTab({
  listings,
  totalListings,
  loading,
  searchQuery,
  onSearchChange,
  filters,
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
  onCreateProfile,
  getRequestStatus,
}: DiscoverTabProps) {
  return (
    <div className="space-y-4">
      {/* Profile completion prompt */}
      {!myListing && (
        <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">
              See personalized compatibility scores
            </p>
            <p className="text-xs text-muted-foreground">
              Create your roommate profile to see how well you match with others.
            </p>
          </div>
          <button
            onClick={onCreateProfile}
            className="shrink-0 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Add Profile
          </button>
        </div>
      )}

      {/* Search + Filter Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name, college, area..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={onOpenFilterDrawer}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
            activeFilterCount > 0
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 bg-white/20 rounded-full text-xs flex items-center justify-center font-black">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Sort + Result Count Row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          {loading ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
            </span>
          ) : (
            <>
              <span className="text-foreground font-bold">{totalListings}</span>{" "}
              {totalListings === 1 ? "match" : "matches"}
            </>
          )}
        </p>
        <div className="flex items-center gap-1">
          {(
            [
              { value: "compatibility", label: "Best Match" },
              { value: "newest", label: "Newest" },
              { value: "budget", label: "Budget" },
              { value: "verified", label: "Verified" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value as SortMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortMode === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Card Grid */}
      {loading ? (
        <SkeletonGrid />
      ) : listings.length === 0 ? (
        <EmptyDiscoverState onClearSearch={() => onSearchChange("")} hasSearch={!!searchQuery} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
  const compat = profile.compatibility;

  return (
    <div className="group relative bg-card border border-border rounded-2xl p-4 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)] hover:border-primary/20 transition-all duration-200 cursor-pointer">
      {/* Verified badge */}
      {profile.verified && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-success/10 border border-success/30 rounded-full">
            <BadgeCheck className="w-3 h-3 text-success" />
            <span className="text-[10px] font-black text-success uppercase tracking-wide">
              Verified
            </span>
          </div>
        </div>
      )}

      {/* Identity Row */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative shrink-0">
          <Avatar className="w-16 h-16 ring-2 ring-border">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.displayName} />
            <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
              {getInitial(profile.displayName)}
            </AvatarFallback>
          </Avatar>
          {/* Compatibility arc overlay */}
          {compat && (
            <div className="absolute -bottom-1.5 -right-1.5">
              <CompatibilityBadgeSmall percentage={compat.percentage} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-black text-base text-foreground truncate">
              {profile.displayName}
              {profile.age ? (
                <span className="text-muted-foreground font-semibold text-sm ml-1">
                  , {profile.age}
                </span>
              ) : null}
            </h3>
          </div>
          {(profile.course || profile.branch) && (
            <p className="text-xs text-muted-foreground font-medium truncate">
              {[profile.course, profile.branch, profile.semester]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          {profile.campus && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium truncate">
                {profile.campus}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Compatibility factors (if available) */}
      {compat && compat.topMatches.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {compat.topMatches.slice(0, 3).map((m) => (
            <span
              key={m}
              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success border border-success/20"
            >
              ✓ {m}
            </span>
          ))}
          {!myListing && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
              Add profile for score
            </span>
          )}
        </div>
      )}

      {/* Key info badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <InfoBadge icon={Wallet} label={formatBudget(profile.budgetMin, profile.budgetMax)} />
        {profile.moveInDate && (
          <InfoBadge icon={CalendarDays} label={formatMoveIn(profile.moveInDate)} />
        )}
        {profile.sleepSchedule && (
          <InfoBadge
            icon={profile.sleepSchedule === "Early Bird" ? Sun : profile.sleepSchedule === "Night Owl" ? Moon : Coffee}
            label={profile.sleepSchedule}
          />
        )}
        {profile.food && profile.food !== "No Preference" && (
          <InfoBadge icon={Home} label={profile.food} />
        )}
      </div>

      {/* Area */}
      {profile.areaPreference && (
        <p className="text-xs text-muted-foreground font-medium mb-3 flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{profile.areaPreference}</span>
        </p>
      )}

      {/* Actions Row */}
      <div className="flex items-center gap-2">
        <button
          onClick={onView}
          className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
        >
          View Profile
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          className={`p-2 rounded-xl border transition-all ${
            isSaved
              ? "border-warm/40 bg-warm/10 text-warm"
              : "border-border hover:border-warm/40 text-muted-foreground hover:text-warm"
          }`}
          aria-label={isSaved ? "Unsave profile" : "Save profile"}
        >
          <Heart
            className="w-4 h-4 transition-all"
            fill={isSaved ? "currentColor" : "none"}
          />
        </button>
      </div>

      {/* Request status indicator */}
      {requestStatus !== "none" && (
        <div
          className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg ${
            requestStatus === "accepted"
              ? "bg-success/10 text-success"
              : requestStatus === "sent"
                ? "bg-primary/10 text-primary"
                : requestStatus === "received"
                  ? "bg-warm/10 text-warm"
                  : requestStatus === "declined"
                    ? "bg-muted text-muted-foreground"
                    : ""
          }`}
        >
          {requestStatus === "accepted" && <CheckCircle2 className="w-3 h-3" />}
          {requestStatus === "sent" && <Clock className="w-3 h-3" />}
          {requestStatus === "received" && <Bell className="w-3 h-3" />}
          {requestStatus === "declined" && <XCircle className="w-3 h-3" />}
          {requestStatus === "accepted" && "Connected"}
          {requestStatus === "sent" && "Request Pending"}
          {requestStatus === "received" && "Request Received"}
          {requestStatus === "declined" && "Declined"}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROFILE PANEL (right-side sheet)
// ═══════════════════════════════════════════════════════════════

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

  const set = <K extends keyof RoommateFilters>(key: K, value: RoommateFilters[K]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

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
              Must Match
            </p>
            <div className="space-y-5">
              {/* Campus */}
              <div>
                <label className="text-sm font-bold mb-2 block">Campus</label>
                <div className="flex flex-wrap gap-2">
                  {campuses.map((c) => (
                    <button
                      key={c}
                      onClick={() => set("campus", c)}
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

              {/* Gender */}
              <div>
                <label className="text-sm font-bold mb-2 block">Roommate Gender</label>
                <ChipSelector
                  options={["Any", ...GENDER_OPTIONS]}
                  value={local.gender}
                  onChange={(v) => set("gender", v)}
                />
              </div>

              {/* Move-in by */}
              <div>
                <label className="text-sm font-bold mb-2 block">Move-in By</label>
                <input
                  type="date"
                  value={local.moveInBy}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => set("moveInBy", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Verified only */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold">Verified profiles only</label>
                <Switch
                  checked={local.verifiedOnly}
                  onCheckedChange={(v) => set("verifiedOnly", v)}
                />
              </div>
            </div>
          </div>

          {/* LIFESTYLE PREFERENCES */}
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
              Lifestyle Preferences
            </p>
            <div className="space-y-5">
              <FilterChipGroup label="Food" options={["Any", ...FOOD_OPTIONS]} value={local.food} onChange={(v) => set("food", v)} />
              <FilterChipGroup label="Smoking" options={["Any", ...SMOKING_OPTIONS]} value={local.smoking} onChange={(v) => set("smoking", v)} />
              <FilterChipGroup label="Alcohol" options={["Any", ...ALCOHOL_OPTIONS]} value={local.alcohol} onChange={(v) => set("alcohol", v)} />
              <FilterChipGroup label="Sleep Schedule" options={["Any", ...SLEEP_OPTIONS]} value={local.sleepSchedule} onChange={(v) => set("sleepSchedule", v)} />
              <FilterChipGroup label="Cleanliness" options={["Any", ...CLEANLINESS_OPTIONS]} value={local.cleanliness} onChange={(v) => set("cleanliness", v)} />
              <FilterChipGroup label="Visitors" options={["Any", ...VISITORS_OPTIONS]} value={local.visitors} onChange={(v) => set("visitors", v)} />
              <FilterChipGroup label="Study Style" options={["Any", ...STUDY_OPTIONS]} value={local.studyStyle} onChange={(v) => set("studyStyle", v)} />
            </div>
          </div>

          {/* ROOM DETAILS */}
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
              Room Details
            </p>
            <div className="space-y-5">
              <FilterChipGroup label="Room Type" options={["Any", ...ROOM_TYPE_OPTIONS]} value={local.roomType} onChange={(v) => set("roomType", v)} />
              <FilterChipGroup label="Housing Type" options={["Any", ...HOUSING_TYPE_OPTIONS]} value={local.housingType} onChange={(v) => set("housingType", v)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4">
          <button
            onClick={handleApply}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity"
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
              "{req.message}"
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
// MY PROFILE TAB
// ═══════════════════════════════════════════════════════════════

interface MyProfileTabProps {
  myListing: RoommateProfile | null;
  form: RoommateProfileForm;
  onFormChange: (f: RoommateProfileForm) => void;
  formStep: number;
  onFormStepChange: (s: number) => void;
  formOpen: boolean;
  onFormOpenChange: (v: boolean) => void;
  formSaving: boolean;
  onSave: () => void;
  onDelete: () => void;
  onTogglePause: () => void;
  campuses: string[];
  profile: { full_name?: string | null; college_name?: string | null } | null;
}

function MyProfileTab({
  myListing,
  form,
  onFormChange,
  formStep,
  onFormStepChange,
  formOpen,
  onFormOpenChange,
  formSaving,
  onSave,
  onDelete,
  onTogglePause,
  campuses,
  profile,
}: MyProfileTabProps) {
  const set = <K extends keyof RoommateProfileForm>(
    key: K,
    value: RoommateProfileForm[K],
  ) => onFormChange({ ...form, [key]: value });

  const toggleChip = (
    key: "languages" | "interests" | "amenities",
    value: string,
  ) => {
    const arr = form[key] as string[];
    onFormChange({
      ...form,
      [key]: arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value],
    });
  };

  if (!myListing && !formOpen) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
          <User className="w-10 h-10 text-primary" />
        </div>
        <h2 className="font-display font-black text-2xl text-foreground mb-2">
          Create Your Profile
        </h2>
        <p className="text-muted-foreground text-sm max-w-xs mb-8">
          Let others find you. Share your preferences and lifestyle to discover your perfect campus roommate.
        </p>
        <button
          onClick={() => {
            onFormStepChange(1);
            onFormOpenChange(true);
          }}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity"
        >
          Get Started
        </button>
      </div>
    );
  }

  if (formOpen) {
    return (
      <div className="max-w-xl mx-auto">
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  s <= formStep ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
            <span>About You</span>
            <span>Room & Budget</span>
            <span>Lifestyle</span>
            <span>Privacy</span>
          </div>
        </div>

        {/* Step 1 — About You */}
        {formStep === 1 && (
          <div className="space-y-5">
            <h3 className="font-display font-black text-xl">About You</h3>

            <FormField label="Display Name">
              <Input
                value={form.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                placeholder="How should others call you?"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Age">
                <Input
                  type="number"
                  value={form.age}
                  min={16}
                  max={35}
                  onChange={(e) => set("age", Number(e.target.value))}
                />
              </FormField>
              <FormField label="Gender">
                <ChipSelector
                  options={[...GENDER_OPTIONS]}
                  value={form.gender}
                  onChange={(v) => set("gender", v)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Course">
                <Input
                  value={form.course}
                  onChange={(e) => set("course", e.target.value)}
                  placeholder="e.g. B.Tech"
                />
              </FormField>
              <FormField label="Branch / Department">
                <Input
                  value={form.branch}
                  onChange={(e) => set("branch", e.target.value)}
                  placeholder="e.g. CSE"
                />
              </FormField>
            </div>

            <FormField label="Year / Semester">
              <Input
                value={form.semester}
                onChange={(e) => set("semester", e.target.value)}
                placeholder="e.g. Sem 5 or 3rd Year"
              />
            </FormField>

            <FormField label="College">
              <Input
                value={form.college}
                onChange={(e) => set("college", e.target.value)}
                placeholder={profile?.college_name ?? "Your college name"}
              />
            </FormField>

            <FormField label="Campus">
              <ChipSelector
                options={campuses.filter((c) => c !== "Any")}
                value={form.campus}
                onChange={(v) => set("campus", v)}
                allowCustom
                customPlaceholder="Enter campus name"
              />
            </FormField>

            <FormField label="Languages Spoken">
              <ChipMultiSelect
                options={[...LANGUAGE_CHIPS]}
                selected={form.languages}
                onToggle={(v) => toggleChip("languages", v)}
              />
            </FormField>

            <FormField label="Avatar URL (optional)">
              <Input
                value={form.avatarUrl}
                onChange={(e) => set("avatarUrl", e.target.value)}
                placeholder="https://..."
                type="url"
              />
            </FormField>

            <FormField label="About Me">
              <Textarea
                value={form.about}
                onChange={(e) => set("about", e.target.value)}
                placeholder="Tell potential roommates about yourself, your routine, and what you're looking for..."
                maxLength={400}
                rows={4}
                className="resize-none"
              />
              <p className="text-right text-xs text-muted-foreground mt-1">
                {form.about.length}/400
              </p>
            </FormField>

            <div className="flex items-center justify-between py-2">
              <label className="text-sm font-bold">Working Professional</label>
              <Switch
                checked={form.workingProfessional}
                onCheckedChange={(v) => set("workingProfessional", v)}
              />
            </div>
          </div>
        )}

        {/* Step 2 — Room & Budget */}
        {formStep === 2 && (
          <div className="space-y-5">
            <h3 className="font-display font-black text-xl">Room & Budget</h3>

            <FormField label={`Budget Range: ${formatBudget(form.budgetMin, form.budgetMax)}`}>
              <Slider
                min={3000}
                max={30000}
                step={500}
                value={[form.budgetMin, form.budgetMax]}
                onValueChange={([min, max]) => {
                  set("budgetMin", min);
                  set("budgetMax", max);
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>₹3,000</span>
                <span>₹30,000</span>
              </div>
            </FormField>

            <FormField label="Move-in Date">
              <input
                type="date"
                value={form.moveInDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => set("moveInDate", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </FormField>

            <FormField label="Room Type Preference">
              <ChipSelector
                options={[...ROOM_TYPE_OPTIONS]}
                value={form.roomType}
                onChange={(v) => set("roomType", v)}
              />
            </FormField>

            <FormField label="Housing Type">
              <ChipSelector
                options={[...HOUSING_TYPE_OPTIONS]}
                value={form.housingType}
                onChange={(v) => set("housingType", v)}
              />
            </FormField>

            <FormField label="Preferred Area / Location">
              <Input
                value={form.areaPreference}
                onChange={(e) => set("areaPreference", e.target.value)}
                placeholder="e.g. North Campus, near Library lane..."
              />
            </FormField>
          </div>
        )}

        {/* Step 3 — Lifestyle */}
        {formStep === 3 && (
          <div className="space-y-5">
            <h3 className="font-display font-black text-xl">Lifestyle</h3>
            <p className="text-sm text-muted-foreground">
              These preferences power your compatibility scores. Be honest — it helps you find better matches.
            </p>

            <FormField label="Food Preference">
              <ChipSelector options={[...FOOD_OPTIONS]} value={form.food} onChange={(v) => set("food", v)} />
            </FormField>
            <FormField label="Smoking">
              <ChipSelector options={[...SMOKING_OPTIONS]} value={form.smoking} onChange={(v) => set("smoking", v)} />
            </FormField>
            <FormField label="Alcohol">
              <ChipSelector options={[...ALCOHOL_OPTIONS]} value={form.alcohol} onChange={(v) => set("alcohol", v)} />
            </FormField>
            <FormField label="Sleep Schedule">
              <ChipSelector options={[...SLEEP_OPTIONS]} value={form.sleepSchedule} onChange={(v) => set("sleepSchedule", v)} />
            </FormField>
            <FormField label="Study Style">
              <ChipSelector options={[...STUDY_OPTIONS]} value={form.studyStyle} onChange={(v) => set("studyStyle", v)} />
            </FormField>
            <FormField label="Cleanliness">
              <ChipSelector options={[...CLEANLINESS_OPTIONS]} value={form.cleanliness} onChange={(v) => set("cleanliness", v)} />
            </FormField>
            <FormField label="Visitors">
              <ChipSelector options={[...VISITORS_OPTIONS]} value={form.visitors} onChange={(v) => set("visitors", v)} />
            </FormField>
          </div>
        )}

        {/* Step 4 — Privacy & Preferences */}
        {formStep === 4 && (
          <div className="space-y-5">
            <h3 className="font-display font-black text-xl">Preferences & Privacy</h3>

            <FormField label="Preferred Roommate Gender">
              <ChipSelector options={[...GENDER_PREF_OPTIONS]} value={form.genderPreference} onChange={(v) => set("genderPreference", v)} />
            </FormField>

            <FormField label="Pets">
              <ChipSelector options={[...PETS_OPTIONS]} value={form.pets} onChange={(v) => set("pets", v)} />
            </FormField>

            <FormField label="Interests">
              <ChipMultiSelect options={[...INTEREST_CHIPS]} selected={form.interests} onToggle={(v) => toggleChip("interests", v)} />
            </FormField>

            <FormField label="Amenities Needed">
              <ChipMultiSelect options={[...AMENITY_CHIPS]} selected={form.amenities} onToggle={(v) => toggleChip("amenities", v)} />
            </FormField>

            <FormField label="Daily Routine (optional)">
              <Textarea
                value={form.dailyRoutine}
                onChange={(e) => set("dailyRoutine", e.target.value)}
                placeholder="Describe a typical day — wake time, study hours, gym, social habits..."
                rows={3}
                maxLength={300}
                className="resize-none"
              />
            </FormField>

            <div className="p-4 bg-muted/50 rounded-2xl space-y-4">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                Visibility & Privacy
              </p>
              <FormField label="Profile Visibility">
                <ChipSelector
                  options={["campus_only", "public", "hidden"]}
                  value={form.visibility}
                  onChange={(v) => set("visibility", v as "campus_only" | "public" | "hidden")}
                  labelMap={{ campus_only: "Campus Only", public: "Public", hidden: "Hidden (Draft)" }}
                />
              </FormField>
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold">Accept connection requests</label>
                <Switch checked={form.receiveRequests} onCheckedChange={(v) => set("receiveRequests", v)} />
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-2xl space-y-4">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                Contact Details (visible only after connecting)
              </p>
              <FormField label="Phone Number">
                <div className="space-y-2">
                  <Input
                    value={form.phoneNumber}
                    onChange={(e) => set("phoneNumber", e.target.value)}
                    placeholder="+91 98765 43210"
                    type="tel"
                  />
                  <div className="flex items-center gap-2">
                    <Switch checked={form.sharePhone} onCheckedChange={(v) => set("sharePhone", v)} />
                    <span className="text-xs text-muted-foreground">Share with connected roommates</span>
                  </div>
                </div>
              </FormField>
              <FormField label="Instagram Handle">
                <div className="space-y-2">
                  <Input
                    value={form.instagramHandle}
                    onChange={(e) => set("instagramHandle", e.target.value)}
                    placeholder="@yourhandle"
                  />
                  <div className="flex items-center gap-2">
                    <Switch checked={form.shareInstagram} onCheckedChange={(v) => set("shareInstagram", v)} />
                    <span className="text-xs text-muted-foreground">Share with connected roommates</span>
                  </div>
                </div>
              </FormField>
            </div>
          </div>
        )}

        {/* Step Navigation */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-border">
          {formStep > 1 && (
            <button
              onClick={() => onFormStepChange(formStep - 1)}
              className="flex-1 py-3 rounded-xl border border-border font-bold text-sm hover:bg-muted transition-colors"
            >
              Back
            </button>
          )}
          {formStep < 4 ? (
            <button
              onClick={() => onFormStepChange(formStep + 1)}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={onSave}
              disabled={formSaving}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {formSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {myListing ? "Save Changes" : "Publish Profile"}
            </button>
          )}
        </div>
        <button
          onClick={() => onFormOpenChange(false)}
          className="w-full mt-2 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (!myListing) return null;

  // Published profile view
  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Profile card */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16 ring-2 ring-border">
            <AvatarImage src={myListing.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
              {getInitial(myListing.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-display font-black text-lg">{myListing.displayName}</h2>
              {myListing.verified && (
                <BadgeCheck className="w-4 h-4 text-success" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {[myListing.course, myListing.branch, myListing.semester].filter(Boolean).join(" · ")}
            </p>
            <p className="text-sm text-muted-foreground">{myListing.college}</p>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${
                  myListing.paused
                    ? "border-amber-300 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
                    : "border-success/30 text-success bg-success/10"
                }`}
              >
                {myListing.paused ? "Paused" : "Active"}
              </span>
              <span className="text-xs text-muted-foreground font-medium capitalize">
                {myListing.visibility.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <InfoBadge icon={Wallet} label={formatBudget(myListing.budgetMin, myListing.budgetMax)} />
          {myListing.moveInDate && (
            <InfoBadge icon={CalendarDays} label={formatMoveIn(myListing.moveInDate)} />
          )}
          {myListing.sleepSchedule && (
            <InfoBadge icon={Moon} label={myListing.sleepSchedule} />
          )}
        </div>
      </div>

      {/* Profile Completeness */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-3">
          Profile Completeness
        </p>
        {(() => {
          const fields = [
            myListing.about, myListing.food, myListing.sleepSchedule,
            myListing.studyStyle, myListing.cleanliness, myListing.smoking,
            myListing.areaPreference, myListing.moveInDate,
            myListing.languages.length > 0 ? "yes" : null,
            myListing.interests.length > 0 ? "yes" : null,
          ];
          const filled = fields.filter(Boolean).length;
          const pct = Math.round((filled / fields.length) * 100);
          return (
            <>
              <div className="flex items-center gap-3">
                <Progress value={pct} className="flex-1 h-2" />
                <span className="text-sm font-bold text-foreground w-10 text-right">
                  {pct}%
                </span>
              </div>
              {pct < 80 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Complete more fields to improve your compatibility scores.
                </p>
              )}
            </>
          );
        })()}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={() => {
            onFormStepChange(1);
            onFormOpenChange(true);
          }}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity"
        >
          Edit Profile
        </button>
        <button
          onClick={onTogglePause}
          className="w-full py-3 border border-border rounded-xl font-bold text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2"
        >
          {myListing.paused ? (
            <>
              <PlayCircle className="w-4 h-4 text-success" />
              Reactivate Profile
            </>
          ) : (
            <>
              <PauseCircle className="w-4 h-4 text-amber-500" />
              Pause Profile
            </>
          )}
        </button>
        <button
          onClick={onDelete}
          className="w-full py-3 border border-destructive/30 rounded-xl font-bold text-sm text-destructive hover:bg-destructive/5 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete Profile
        </button>
      </div>
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

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-foreground mb-2 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function ChipSelector({
  options,
  value,
  onChange,
  allowCustom,
  customPlaceholder,
  labelMap,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  allowCustom?: boolean;
  customPlaceholder?: string;
  labelMap?: Record<string, string>;
}) {
  const [customVal, setCustomVal] = useState("");

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
          {labelMap?.[opt] ?? opt}
        </button>
      ))}
      {allowCustom && (
        <input
          type="text"
          value={customVal}
          onChange={(e) => setCustomVal(e.target.value)}
          onBlur={() => {
            if (customVal.trim()) onChange(customVal.trim());
          }}
          placeholder={customPlaceholder}
          className="px-3 py-1.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary transition-colors bg-card"
        />
      )}
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
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-primary/40 hover:bg-accent"
            }`}
          >
            {isSelected && <Check className="w-3 h-3 inline mr-1" />}
            {opt}
          </button>
        );
      })}
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
            <Skeleton className="w-16 h-16 rounded-full shrink-0" />
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
}: {
  onClearSearch: () => void;
  hasSearch: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Compass className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-display font-black text-xl text-foreground mb-2">
        No matches found
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs mb-6">
        {hasSearch
          ? "No profiles match your search query."
          : "No profiles match your current filters. Try widening your budget or clearing a filter."}
      </p>
      <button
        onClick={onClearSearch}
        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
      >
        {hasSearch ? "Clear Search" : "Clear Filters"}
      </button>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function listingToForm(listing: RoommateProfile): RoommateProfileForm {
  return {
    displayName: listing.displayName,
    age: listing.age ?? defaultProfileForm.age,
    gender: listing.gender ?? defaultProfileForm.gender,
    course: listing.course ?? "",
    branch: listing.branch ?? "",
    semester: listing.semester ?? "",
    college: listing.college ?? "",
    campus: listing.campus ?? "",
    languages: listing.languages,
    about: listing.about ?? "",
    avatarUrl: listing.avatarUrl ?? "",
    workingProfessional: listing.workingProfessional,

    budgetMin: listing.budgetMin,
    budgetMax: listing.budgetMax,
    moveInDate: listing.moveInDate ?? "",
    roomType: listing.roomType ?? "Any",
    housingType: listing.housingType ?? "Any",
    areaPreference: listing.areaPreference ?? "",

    food: listing.food ?? "No Preference",
    smoking: listing.smoking ?? "No Preference",
    alcohol: listing.alcohol ?? "No Preference",
    sleepSchedule: listing.sleepSchedule ?? "Balanced",
    studyStyle: listing.studyStyle ?? "Flexible",
    cleanliness: listing.cleanliness ?? "Average",
    visitors: listing.visitors ?? "Sometimes",

    genderPreference: listing.genderPreference ?? "Any",
    preferredAgeMin: defaultProfileForm.preferredAgeMin,
    preferredAgeMax: defaultProfileForm.preferredAgeMax,
    interests: listing.interests,
    amenities: listing.amenities,
    pets: listing.pets ?? "No Preference",
    dailyRoutine: listing.dailyRoutine ?? "",
    visibility: listing.visibility,
    receiveRequests: listing.receiveRequests,
    receiveChats: listing.receiveChats,
    phoneNumber: listing.phoneNumber ?? "",
    instagramHandle: listing.instagramHandle ?? "",
    sharePhone: !!listing.phoneNumber,
    shareInstagram: !!listing.instagramHandle,
    paused: listing.paused,
  };
}
