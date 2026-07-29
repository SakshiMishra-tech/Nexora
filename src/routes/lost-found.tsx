import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Share2,
  ShieldQuestion,
  X,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { ModuleAccessBoundary } from "@/components/ModuleAccessControl";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/lost-found")({
  head: () => ({ meta: [{ title: "Nexora - Lost & Found" }] }),
  component: LostFound,
});

type PostType = "Lost" | "Found";
type PostStatus = "Searching" | "Matched" | "Claim Requested" | "Recovered" | "Closed";
type ContactPreference = "Chat only" | "Phone optional" | "Campus desk";
type FeedFilter = "All" | "Lost" | "Found" | "Recovered" | "Searching" | "Latest" | "Oldest";

type ClaimRequest = {
  id: string;
  claimant: string;
  answer: string;
  status: "Pending" | "Accepted" | "Rejected" | "More details";
  createdAt: string;
};

type LostFoundPost = {
  id: string;
  type: PostType;
  itemName: string;
  category: string;
  description: string;
  location: string;
  date: string;
  time: string;
  campus: string;
  building: string;
  floor: string;
  room: string;
  exactSpot: string;
  storageLocation: string;
  images: string[];
  reward: string;
  contactPreference: ContactPreference;
  phone: string;
  chatOnly: boolean;
  anonymous: boolean;
  verificationQuestion: string;
  verificationAnswer: string;
  postedBy: string;
  status: PostStatus;
  createdAt: string;
  likes: number;
  saved: boolean;
  reports: number;
  comments: string[];
  claims: ClaimRequest[];
};

type FormState = {
  type: PostType;
  itemName: string;
  category: string;
  description: string;
  location: string;
  date: string;
  time: string;
  campus: string;
  building: string;
  floor: string;
  room: string;
  exactSpot: string;
  storageLocation: string;
  reward: string;
  contactPreference: ContactPreference;
  phone: string;
  chatOnly: boolean;
  anonymous: boolean;
  verificationQuestion: string;
  verificationAnswer: string;
  images: string[];
};

const categories = ["Electronics", "ID & Cards", "Books", "Bottle", "Keys", "Bags", "Stationery", "Other"];
const buildings = ["Any building", "Library", "Hall 3", "Cafe Beans", "Sports ground", "CSE Block", "Hostel 5"];
const storageLocations = ["Library Desk", "Security Office", "Reception", "Hostel Warden", "Department Office", "Student Council", "With Finder"];
const filters: FeedFilter[] = ["All", "Lost", "Found", "Recovered", "Searching", "Latest", "Oldest"];

const today = new Date().toISOString().slice(0, 10);

const seedPosts: LostFoundPost[] = [
  {
    id: "lf-calculator",
    type: "Lost",
    itemName: "Scientific calculator",
    category: "Electronics",
    description: "Casio calculator with a dark grey cover. Last used before the physics lab practical.",
    location: "Hall 3",
    date: today,
    time: "10:15",
    campus: "Nexora Main Campus",
    building: "Hall 3",
    floor: "2",
    room: "Lab wing",
    exactSpot: "",
    storageLocation: "",
    images: [],
    reward: "100",
    contactPreference: "Chat only",
    phone: "",
    chatOnly: true,
    anonymous: false,
    verificationQuestion: "Which calculator cover color?",
    verificationAnswer: "dark grey",
    postedBy: "abc123 Student",
    status: "Searching",
    createdAt: minutesAgo(18),
    likes: 4,
    saved: false,
    reports: 0,
    comments: ["I saw one near the back bench."],
    claims: [],
  },
  {
    id: "lf-earbuds",
    type: "Found",
    itemName: "Black earbuds case",
    category: "Electronics",
    description: "Found near the billing counter. No earbuds inside, only the charging case.",
    location: "Cafe Beans",
    date: today,
    time: "09:42",
    campus: "Nexora Main Campus",
    building: "Cafe Beans",
    floor: "Ground",
    room: "",
    exactSpot: "Billing counter",
    storageLocation: "Reception",
    images: [],
    reward: "",
    contactPreference: "Campus desk",
    phone: "",
    chatOnly: true,
    anonymous: false,
    verificationQuestion: "Which sticker is on the case?",
    verificationAnswer: "blue star",
    postedBy: "Cafe Desk",
    status: "Matched",
    createdAt: minutesAgo(32),
    likes: 8,
    saved: true,
    reports: 0,
    comments: [],
    claims: [
      {
        id: "claim-earbuds-1",
        claimant: "Maya",
        answer: "It has a blue star sticker",
        status: "Pending",
        createdAt: minutesAgo(8),
      },
    ],
  },
  {
    id: "lf-id-card",
    type: "Found",
    itemName: "Student ID card",
    category: "ID & Cards",
    description: "ID card returned after verifying the student name and department.",
    location: "Library desk",
    date: today,
    time: "08:55",
    campus: "Nexora Main Campus",
    building: "Library",
    floor: "Ground",
    room: "Front desk",
    exactSpot: "Reading table 4",
    storageLocation: "Library Desk",
    images: [],
    reward: "",
    contactPreference: "Campus desk",
    phone: "",
    chatOnly: true,
    anonymous: false,
    verificationQuestion: "",
    verificationAnswer: "",
    postedBy: "Library Desk",
    status: "Recovered",
    createdAt: minutesAgo(60),
    likes: 11,
    saved: false,
    reports: 0,
    comments: ["Returned to owner."],
    claims: [],
  },
  {
    id: "lf-bottle",
    type: "Lost",
    itemName: "Blue water bottle",
    category: "Bottle",
    description: "Matte blue bottle with a small dent near the cap.",
    location: "Sports ground",
    date: today,
    time: "08:10",
    campus: "Nexora Main Campus",
    building: "Sports ground",
    floor: "",
    room: "",
    exactSpot: "",
    storageLocation: "",
    images: [],
    reward: "",
    contactPreference: "Phone optional",
    phone: "",
    chatOnly: false,
    anonymous: true,
    verificationQuestion: "Which sticker is on the bottle?",
    verificationAnswer: "basketball",
    postedBy: "Anonymous",
    status: "Searching",
    createdAt: minutesAgo(120),
    likes: 2,
    saved: false,
    reports: 0,
    comments: [],
    claims: [],
  },
];

function LostFound() {
  const [posts, setPosts] = useState(seedPosts);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FeedFilter>("Latest");
  const [category, setCategory] = useState("All categories");
  const [building, setBuilding] = useState("Any building");
  const [postOpen, setPostOpen] = useState(false);
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const [claimPostId, setClaimPostId] = useState<string | null>(null);
  const [claimAnswer, setClaimAnswer] = useState("");
  const [commentText, setCommentText] = useState("");
  const [notifications, setNotifications] = useState<string[]>([
    "Earbuds case has a new possible owner.",
    "Student ID card was marked recovered.",
  ]);

  const visiblePosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const next = posts.filter((post) => {
      const haystack = [
        post.itemName,
        post.category,
        post.description,
        post.location,
        post.campus,
        post.building,
        post.floor,
        post.room,
        post.exactSpot,
        post.storageLocation,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !normalized || haystack.includes(normalized);
      const matchesType = filter === "Lost" || filter === "Found" ? post.type === filter : true;
      const matchesStatus =
        filter === "Recovered" || filter === "Searching" ? post.status === filter : true;
      const matchesCategory = category === "All categories" || post.category === category;
      const matchesBuilding = building === "Any building" || post.building === building;

      return matchesSearch && matchesType && matchesStatus && matchesCategory && matchesBuilding;
    });

    return [...next].sort((a, b) => {
      const delta = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return filter === "Oldest" ? -delta : delta;
    });
  }, [building, category, filter, posts, query]);

  const detailPost = posts.find((post) => post.id === detailPostId);
  const claimPost = posts.find((post) => post.id === claimPostId);
  const recoveredCount = posts.filter((post) => post.status === "Recovered").length;
  const pendingClaims = posts.reduce((total, post) => total + post.claims.filter((claim) => claim.status === "Pending").length, 0);

  const notify = (message: string) => {
    setNotifications((current) => [message, ...current].slice(0, 5));
  };

  const handleCreatePost = (values: FormState) => {
    const post: LostFoundPost = {
      id: `lf-${Date.now()}`,
      type: values.type,
      itemName: values.itemName.trim(),
      category: values.category,
      description: values.description.trim(),
      location: values.location.trim(),
      date: values.date,
      time: values.time,
      campus: values.campus.trim(),
      building: values.building.trim(),
      floor: values.floor.trim(),
      room: values.room.trim(),
      exactSpot: values.exactSpot.trim(),
      storageLocation: values.storageLocation.trim(),
      images: values.images,
      reward: values.reward.trim(),
      contactPreference: values.contactPreference,
      phone: values.phone.trim(),
      chatOnly: values.chatOnly,
      anonymous: values.anonymous,
      verificationQuestion: values.verificationQuestion.trim(),
      verificationAnswer: values.verificationAnswer.trim(),
      postedBy: values.anonymous ? "Anonymous" : "abc123 Student",
      status: values.type === "Lost" ? "Searching" : "Searching",
      createdAt: new Date().toISOString(),
      likes: 0,
      saved: false,
      reports: 0,
      comments: [],
      claims: [],
    };

    setPosts((current) => [post, ...current]);
    setPostOpen(false);
    notify(`${post.type} post published: ${post.itemName}`);
  };

  const updatePost = (id: string, updater: (post: LostFoundPost) => LostFoundPost) => {
    setPosts((current) => current.map((post) => (post.id === id ? updater(post) : post)));
  };

  const handleClaimSubmit = () => {
    if (!claimPost || !claimAnswer.trim()) return;

    const claim: ClaimRequest = {
      id: `claim-${Date.now()}`,
      claimant: "abc123 Student",
      answer: claimAnswer.trim(),
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    updatePost(claimPost.id, (post) => ({
      ...post,
      status: "Claim Requested",
      claims: [claim, ...post.claims],
    }));
    notify(`Possible owner found for ${claimPost.itemName}.`);
    setClaimAnswer("");
    setClaimPostId(null);
  };

  const handleClaimDecision = (postId: string, claimId: string, status: ClaimRequest["status"]) => {
    updatePost(postId, (post) => ({
      ...post,
      status: status === "Accepted" ? "Recovered" : post.status,
      claims: post.claims.map((claim) => (claim.id === claimId ? { ...claim, status } : claim)),
    }));
    notify(status === "Accepted" ? "Finder accepted the claim. Item marked recovered." : `Claim marked: ${status}.`);
  };

  const handleShare = async (post: LostFoundPost) => {
    const text = `${post.type}: ${post.itemName} at ${post.location}`;
    try {
      await navigator.clipboard?.writeText(text);
      notify("Post details copied for sharing.");
    } catch {
      notify("Share summary ready.");
    }
  };

  return (
    <ModuleAccessBoundary moduleId="lost-found">
      <CampusPageShell
        label="Lost & Found"
        title="Lost something? Found something?"
        subtitle="Post lost items, report found items, and let Nexora match clues across campus."
        icon={MapPin}
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <section className="grid gap-3">
            <div className="paper-lift border border-border bg-card p-3">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2">
                  <Search className="h-4 w-4 shrink-0 text-primary" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground"
                    placeholder="Search item, category, color, brand, hostel, building..."
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFilter(item)}
                      className={`px-3 py-2 text-xs font-black transition ${
                        filter === item ? "bg-foreground text-background" : "border border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="border border-border bg-background px-3 py-2 text-sm font-black outline-none">
                  <option>All categories</option>
                  {categories.map((item) => <option key={item}>{item}</option>)}
                </select>
                <select value={building} onChange={(event) => setBuilding(event.target.value)} className="border border-border bg-background px-3 py-2 text-sm font-black outline-none">
                  {buildings.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
            </div>

            {visiblePosts.map((item) => (
              <PostCard
                key={item.id}
                item={item}
                onOpen={() => setDetailPostId(item.id)}
                onClaim={() => setClaimPostId(item.id)}
                onLike={() => updatePost(item.id, (post) => ({ ...post, likes: post.likes + 1 }))}
                onSave={() => updatePost(item.id, (post) => ({ ...post, saved: !post.saved }))}
                onShare={() => void handleShare(item)}
                onReport={() => {
                  updatePost(item.id, (post) => ({ ...post, reports: post.reports + 1 }));
                  notify(`Report sent for admin review: ${item.itemName}`);
                }}
              />
            ))}

            {visiblePosts.length === 0 && (
              <div className="paper-lift border border-border bg-card p-8 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                <h2 className="mt-3 font-display text-2xl font-black">No matching posts</h2>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">Try a different clue, building, or filter.</p>
              </div>
            )}
          </section>

          <aside className="h-fit border border-border bg-card p-4 shadow-soft">
            <button
              type="button"
              onClick={() => setPostOpen(true)}
              className="flex w-full items-center justify-center gap-2 bg-foreground px-4 py-3 text-sm font-black text-background"
            >
              <Plus className="h-4 w-4" />
              Post lost/found item
            </button>

            <div className="mt-4 rounded-2xl border border-border bg-background p-3">
              <div className="flex items-center gap-2 text-sm font-black">
                <Search className="h-4 w-4 text-primary" />
                Match by clue
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="mt-2 w-full bg-transparent text-sm outline-none"
                placeholder="calculator, ID, wallet..."
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="bg-success/10 p-3">
                <p className="font-display text-2xl font-black">{recoveredCount}</p>
                <p className="text-xs font-bold text-success">recovered</p>
              </div>
              <div className="bg-warm/10 p-3">
                <p className="font-display text-2xl font-black">{pendingClaims}</p>
                <p className="text-xs font-bold text-warm">pending claims</p>
              </div>
            </div>

            <div className="mt-4 border border-border bg-background p-3">
              <div className="flex items-center gap-2 text-sm font-black">
                <Bell className="h-4 w-4 text-primary" />
                Notifications
              </div>
              <div className="mt-3 grid gap-2">
                {notifications.map((note, index) => (
                  <p key={`${note}-${index}`} className="border-l-2 border-primary bg-secondary/50 px-3 py-2 text-xs font-bold text-muted-foreground">
                    {note}
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-4 border border-border bg-background p-3">
              <p className="text-sm font-black">Admin queue</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                {posts.reduce((total, post) => total + post.reports, 0)} reports waiting for spam or fake-post review.
              </p>
            </div>
          </aside>
        </div>

        {postOpen && (
          <PostFormModal
            onClose={() => setPostOpen(false)}
            onSubmit={handleCreatePost}
          />
        )}

        {detailPost && (
          <DetailModal
            post={detailPost}
            commentText={commentText}
            onCommentTextChange={setCommentText}
            onClose={() => {
              setDetailPostId(null);
              setCommentText("");
            }}
            onClaim={() => setClaimPostId(detailPost.id)}
            onShare={() => void handleShare(detailPost)}
            onReport={() => {
              updatePost(detailPost.id, (post) => ({ ...post, reports: post.reports + 1 }));
              notify(`Report sent for admin review: ${detailPost.itemName}`);
            }}
            onAddComment={() => {
              if (!commentText.trim()) return;
              updatePost(detailPost.id, (post) => ({ ...post, comments: [...post.comments, commentText.trim()] }));
              notify(`New comment on ${detailPost.itemName}.`);
              setCommentText("");
            }}
            onClaimDecision={handleClaimDecision}
          />
        )}

        {claimPost && (
          <ClaimModal
            post={claimPost}
            answer={claimAnswer}
            onAnswerChange={setClaimAnswer}
            onClose={() => {
              setClaimPostId(null);
              setClaimAnswer("");
            }}
            onSubmit={handleClaimSubmit}
          />
        )}
      </CampusPageShell>
    </ModuleAccessBoundary>
  );
}

function PostCard({
  item,
  onOpen,
  onClaim,
  onLike,
  onSave,
  onShare,
  onReport,
}: {
  item: LostFoundPost;
  onOpen: () => void;
  onClaim: () => void;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onReport: () => void;
}) {
  const recovered = item.status === "Recovered";

  return (
    <article className="paper-lift border border-border bg-card p-4">
      <div className="flex flex-wrap items-start gap-3">
        <button type="button" onClick={onOpen} className="h-16 w-16 shrink-0 overflow-hidden bg-secondary text-left">
          {item.images[0] ? (
            <img src={item.images[0]} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className={`grid h-full w-full place-items-center ${toneFor(item).soft}`}>
              {recovered ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </span>
          )}
        </button>

        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <p className="text-xs font-black uppercase text-muted-foreground">
            {item.type} · {timeAgo(item.createdAt)} · {item.category}
          </p>
          <h2 className="font-display text-2xl font-black">{item.itemName}</h2>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.location}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{item.date} · {item.time}</span>
            <span>{item.campus}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-semibold text-muted-foreground">{item.description}</p>
        </button>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="bg-secondary px-3 py-1 text-xs font-black text-primary">{statusLabel(item)}</span>
          {!recovered && (
            <button type="button" onClick={onClaim} className="bg-foreground px-3 py-2 text-xs font-black text-background">
              {item.type === "Found" ? "Claim Item" : "I found this"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex flex-wrap gap-3 text-xs font-bold text-muted-foreground">
          <span>Posted by {item.postedBy}</span>
          <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{item.claims.length} claims</span>
          {item.verificationQuestion && <span className="inline-flex items-center gap-1"><ShieldQuestion className="h-3.5 w-3.5" />verification enabled</span>}
        </div>
        <div className="flex items-center gap-1">
          <ActionButton onClick={onLike} icon={<Heart className="h-4 w-4" />} label={String(item.likes)} active={item.likes > 0} />
          <ActionButton onClick={onSave} icon={<Check className="h-4 w-4" />} label={item.saved ? "Saved" : "Save"} active={item.saved} />
          <ActionButton onClick={onShare} icon={<Share2 className="h-4 w-4" />} label="Share" />
          <ActionButton onClick={onReport} icon={<Flag className="h-4 w-4" />} label="Report" />
        </div>
      </div>
    </article>
  );
}

function PostFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (values: FormState) => void }) {
  const [values, setValues] = useState<FormState>(() => emptyForm());
  const [error, setError] = useState("");
  const isLost = values.type === "Lost";

  const setValue = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const required = [
      values.itemName,
      values.category,
      values.description,
      values.location,
      values.date,
      values.time,
      values.campus,
      values.building,
      isLost ? values.floor : values.exactSpot,
      isLost ? "ok" : values.storageLocation,
    ];

    if (required.some((field) => !field.trim())) {
      setError("Please fill all required fields for this post.");
      return;
    }

    onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-foreground/25 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto border border-border bg-card p-4 shadow-glow">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <div>
            <p className="text-xs font-black uppercase text-success">Lost & Found post</p>
            <h2 className="font-display text-3xl font-black">Post lost/found item</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center border border-border bg-background">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <div className="mt-3 bg-destructive/10 px-3 py-2 text-sm font-black text-destructive">{error}</div>}

        <div className="mt-4 flex gap-2">
          {(["Lost", "Found"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setValue("type", type)}
              className={`px-4 py-2 text-sm font-black ${values.type === type ? "bg-foreground text-background" : "border border-border bg-background"}`}
            >
              {type} item
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Item Name"><input value={values.itemName} onChange={(event) => setValue("itemName", event.target.value)} /></Field>
          <Field label="Category">
            <select value={values.category} onChange={(event) => setValue("category", event.target.value)}>
              <option value="">Select category</option>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label={isLost ? "Last Seen Location" : "Found Location"}><input value={values.location} onChange={(event) => setValue("location", event.target.value)} placeholder={isLost ? "Hall 3" : "Library Desk"} /></Field>
          <Field label="Campus"><input value={values.campus} onChange={(event) => setValue("campus", event.target.value)} /></Field>
          <Field label="Date"><input type="date" value={values.date} onChange={(event) => setValue("date", event.target.value)} /></Field>
          <Field label="Time"><input type="time" value={values.time} onChange={(event) => setValue("time", event.target.value)} /></Field>
          <Field label="Building"><input value={values.building} onChange={(event) => setValue("building", event.target.value)} /></Field>
          <Field label={isLost ? "Floor" : "Exact Spot"}><input value={isLost ? values.floor : values.exactSpot} onChange={(event) => setValue(isLost ? "floor" : "exactSpot", event.target.value)} /></Field>
          {isLost ? (
            <>
              <Field label="Room / Hall (optional)"><input value={values.room} onChange={(event) => setValue("room", event.target.value)} /></Field>
              <Field label="Reward (optional)"><input value={values.reward} onChange={(event) => setValue("reward", event.target.value)} placeholder="100" /></Field>
            </>
          ) : (
            <Field label="Current Storage Location">
              <select value={values.storageLocation} onChange={(event) => setValue("storageLocation", event.target.value)}>
                <option value="">Select storage</option>
                {storageLocations.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
          )}
          <Field label="Contact Preference">
            <select value={values.contactPreference} onChange={(event) => setValue("contactPreference", event.target.value as ContactPreference)}>
              <option>Chat only</option>
              <option>Phone optional</option>
              <option>Campus desk</option>
            </select>
          </Field>
          <Field label="Phone (optional)"><input value={values.phone} onChange={(event) => setValue("phone", event.target.value)} /></Field>
        </div>

        <Field label="Description" className="mt-3">
          <textarea value={values.description} onChange={(event) => setValue("description", event.target.value)} rows={4} />
        </Field>

        <div className="mt-4 border border-border bg-background p-3">
          <div className="flex items-start gap-2">
            <ShieldQuestion className="mt-1 h-4 w-4 text-primary" />
            <div>
              <h3 className="font-display text-xl font-black">Verification Question</h3>
              <p className="text-sm font-semibold text-muted-foreground">Add one identifying detail that only the real owner would know. The answer is never shown publicly.</p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Question (optional)"><input value={values.verificationQuestion} onChange={(event) => setValue("verificationQuestion", event.target.value)} placeholder="Which sticker is on the bottle?" /></Field>
            <Field label="Private Answer (optional)"><input value={values.verificationAnswer} onChange={(event) => setValue("verificationAnswer", event.target.value)} placeholder="Only finder compares this" /></Field>
          </div>
        </div>

        <div className="mt-4 border border-border bg-background p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-black">
            <Camera className="h-4 w-4 text-primary" />
            Upload multiple images
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                setValue("images", files.map((file) => URL.createObjectURL(file)));
              }}
            />
          </label>
          {values.images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {values.images.map((src) => (
                <img key={src} src={src} alt="" className="h-16 w-16 object-cover" />
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-black">
          <label className="flex items-center gap-2"><input type="checkbox" checked={values.chatOnly} onChange={(event) => setValue("chatOnly", event.target.checked)} /> Chat only</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={values.anonymous} onChange={(event) => setValue("anonymous", event.target.checked)} /> Anonymous mode</label>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="border border-border bg-background px-4 py-2 text-sm font-black">Cancel</button>
          <button type="submit" className="bg-foreground px-5 py-2 text-sm font-black text-background">Publish post</button>
        </div>
      </form>
    </div>
  );
}

function DetailModal({
  post,
  commentText,
  onCommentTextChange,
  onClose,
  onClaim,
  onShare,
  onReport,
  onAddComment,
  onClaimDecision,
}: {
  post: LostFoundPost;
  commentText: string;
  onCommentTextChange: (value: string) => void;
  onClose: () => void;
  onClaim: () => void;
  onShare: () => void;
  onReport: () => void;
  onAddComment: () => void;
  onClaimDecision: (postId: string, claimId: string, status: ClaimRequest["status"]) => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-foreground/25 p-4 backdrop-blur-sm">
      <section className="max-h-[90vh] w-full max-w-5xl overflow-y-auto border border-border bg-card p-4 shadow-glow">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <div>
            <p className="text-xs font-black uppercase text-muted-foreground">{post.type} · {post.category} · {post.status}</p>
            <h2 className="font-display text-3xl font-black">{post.itemName}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center border border-border bg-background"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="grid min-h-56 place-items-center border border-border bg-background">
              {post.images.length ? (
                <div className="grid w-full gap-2 p-2 sm:grid-cols-2">
                  {post.images.map((src) => <img key={src} src={src} alt="" className="h-56 w-full object-cover" />)}
                </div>
              ) : (
                <Camera className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="mt-4 border border-border bg-background p-4">
              <h3 className="font-display text-xl font-black">Description</h3>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">{post.description}</p>
            </div>
            <div className="mt-4 border border-border bg-background p-4">
              <h3 className="font-display text-xl font-black">Timeline</h3>
              <div className="mt-3 grid gap-2 text-sm font-bold text-muted-foreground">
                <p>Posted {timeAgo(post.createdAt)}</p>
                <p>{post.type === "Lost" ? "Last seen" : "Found"} on {post.date} at {post.time}</p>
                {post.claims.map((claim) => (
                  <p key={claim.id}>Claim from {claim.claimant}: {claim.status}</p>
                ))}
              </div>
            </div>
            <div className="mt-4 border border-border bg-background p-4">
              <h3 className="font-display text-xl font-black">Comments</h3>
              <div className="mt-3 grid gap-2">
                {post.comments.length ? post.comments.map((comment, index) => (
                  <p key={`${comment}-${index}`} className="bg-card px-3 py-2 text-sm font-semibold text-muted-foreground">{comment}</p>
                )) : <p className="text-sm font-semibold text-muted-foreground">No comments yet.</p>}
              </div>
              <div className="mt-3 flex gap-2">
                <input value={commentText} onChange={(event) => onCommentTextChange(event.target.value)} className="flex-1 border border-border bg-card px-3 py-2 text-sm font-semibold outline-none" placeholder="Add a useful clue..." />
                <button type="button" onClick={onAddComment} className="bg-foreground px-4 py-2 text-sm font-black text-background">Comment</button>
              </div>
            </div>
          </div>

          <aside className="h-fit border border-border bg-background p-4">
            <h3 className="font-display text-xl font-black">Location</h3>
            <div className="mt-3 grid gap-2 text-sm font-bold text-muted-foreground">
              <p>{post.location}</p>
              <p>{post.campus}</p>
              <p>{post.building}{post.floor && ` · Floor ${post.floor}`}{post.room && ` · ${post.room}`}</p>
              {post.exactSpot && <p>Exact spot: {post.exactSpot}</p>}
              {post.storageLocation && <p>Stored at: {post.storageLocation}</p>}
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <h3 className="font-display text-xl font-black">Contact</h3>
              <p className="mt-2 text-sm font-bold text-muted-foreground">Posted by {post.postedBy}</p>
              <p className="text-sm font-bold text-muted-foreground">{post.contactPreference}</p>
              {post.phone && <p className="text-sm font-bold text-muted-foreground">{post.phone}</p>}
            </div>

            {post.verificationQuestion && (
              <div className="mt-4 bg-primary/10 p-3">
                <p className="text-xs font-black uppercase text-primary">Verification enabled</p>
                <p className="mt-1 text-sm font-bold text-foreground">{post.verificationQuestion}</p>
              </div>
            )}

            <div className="mt-4 grid gap-2">
              {post.status !== "Recovered" && <button type="button" onClick={onClaim} className="bg-foreground px-4 py-3 text-sm font-black text-background">Claim Item</button>}
              <button type="button" className="border border-border bg-card px-4 py-3 text-sm font-black"><MessageCircle className="mr-2 inline h-4 w-4" />Chat</button>
              <button type="button" onClick={onShare} className="border border-border bg-card px-4 py-3 text-sm font-black"><Share2 className="mr-2 inline h-4 w-4" />Share</button>
              <button type="button" onClick={onReport} className="border border-border bg-card px-4 py-3 text-sm font-black text-destructive"><Flag className="mr-2 inline h-4 w-4" />Report</button>
            </div>

            {post.claims.length > 0 && (
              <div className="mt-4 border-t border-border pt-4">
                <h3 className="font-display text-xl font-black">Claims</h3>
                <div className="mt-3 grid gap-2">
                  {post.claims.map((claim) => (
                    <div key={claim.id} className="border border-border bg-card p-3">
                      <p className="text-sm font-black">{claim.claimant}</p>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">Answer: {claim.answer}</p>
                      <p className="mt-1 text-xs font-black text-primary">{claim.status}</p>
                      {claim.status === "Pending" && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          <button type="button" onClick={() => onClaimDecision(post.id, claim.id, "Accepted")} className="bg-success/15 px-2 py-1 text-xs font-black text-success">Accept</button>
                          <button type="button" onClick={() => onClaimDecision(post.id, claim.id, "Rejected")} className="bg-destructive/10 px-2 py-1 text-xs font-black text-destructive">Reject</button>
                          <button type="button" onClick={() => onClaimDecision(post.id, claim.id, "More details")} className="bg-secondary px-2 py-1 text-xs font-black text-primary">More Details</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}

function ClaimModal({ post, answer, onAnswerChange, onClose, onSubmit }: {
  post: LostFoundPost;
  answer: string;
  onAnswerChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-foreground/25 p-4 backdrop-blur-sm">
      <section className="w-full max-w-lg border border-border bg-card p-4 shadow-glow">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <div>
            <p className="text-xs font-black uppercase text-primary">Claim item</p>
            <h2 className="font-display text-2xl font-black">{post.itemName}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center border border-border bg-background"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4">
          <p className="text-sm font-semibold text-muted-foreground">
            {post.verificationQuestion || "Add a detail that helps the finder verify ownership."}
          </p>
          <textarea value={answer} onChange={(event) => onAnswerChange(event.target.value)} rows={4} className="mt-3 w-full border border-border bg-background px-3 py-2 text-sm font-semibold outline-none" placeholder="Your verification answer..." />
          <p className="mt-2 text-xs font-semibold text-muted-foreground">Your answer is sent only to the finder/post owner.</p>
        </div>
        <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="border border-border bg-background px-4 py-2 text-sm font-black">Cancel</button>
          <button type="button" onClick={onSubmit} className="bg-foreground px-4 py-2 text-sm font-black text-background">Submit Claim</button>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`grid gap-1 text-sm font-black ${className}`}>
      <span>{label}</span>
      <div className="[&_input]:w-full [&_input]:border [&_input]:border-border [&_input]:bg-background [&_input]:px-3 [&_input]:py-2 [&_input]:font-semibold [&_input]:outline-none [&_select]:w-full [&_select]:border [&_select]:border-border [&_select]:bg-background [&_select]:px-3 [&_select]:py-2 [&_select]:font-semibold [&_select]:outline-none [&_textarea]:w-full [&_textarea]:border [&_textarea]:border-border [&_textarea]:bg-background [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:font-semibold [&_textarea]:outline-none">
        {children}
      </div>
    </label>
  );
}

function ActionButton({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 border px-2.5 py-1.5 text-xs font-black transition ${
        active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function CampusPageShell({ label, title, subtitle, icon: Icon, children }: { label: string; title: string; subtitle: string; icon: typeof MapPin; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="commons-wall mb-5 border border-border p-5 shadow-soft">
          <span className="inline-flex items-center gap-2 bg-success/10 px-3 py-1 text-xs font-black uppercase text-success"><Icon className="h-4 w-4" />{label}</span>
          <h1 className="mt-3 font-display text-4xl font-black sm:text-6xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-muted-foreground sm:text-base">{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  );
}

function emptyForm(): FormState {
  return {
    type: "Lost",
    itemName: "",
    category: "",
    description: "",
    location: "",
    date: today,
    time: "10:00",
    campus: "Nexora Main Campus",
    building: "",
    floor: "",
    room: "",
    exactSpot: "",
    storageLocation: "",
    reward: "",
    contactPreference: "Chat only",
    phone: "",
    chatOnly: true,
    anonymous: false,
    verificationQuestion: "",
    verificationAnswer: "",
    images: [],
  };
}

function toneFor(post: LostFoundPost) {
  if (post.status === "Recovered") return { soft: "bg-success/15 text-success" };
  if (post.type === "Found") return { soft: "bg-electric/15 text-electric" };
  return { soft: "bg-warm/15 text-warm" };
}

function statusLabel(post: LostFoundPost) {
  if (post.status === "Matched" && post.claims.length) return `${post.claims.length} possible match${post.claims.length > 1 ? "es" : ""}`;
  if (post.status === "Claim Requested") return "Possible owner found";
  if (post.status === "Recovered") return "Returned";
  return post.status;
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function timeAgo(dateString: string) {
  const diff = Math.max(0, Date.now() - new Date(dateString).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
