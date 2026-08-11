import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  AlertCircle,
  Bell,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Search,
  Share2,
  ShieldCheck,
  X,
  User,
  Check,
  Flame,
  ChevronRight,
  ThumbsUp,
  Flag,
  Sparkles
} from "lucide-react";
import { NexoraLogo } from "@/components/brand/NexoraLogo";
import { ModuleAccessBoundary } from "@/components/ModuleAccessControl";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/lost-found")({
  head: () => ({ meta: [{ title: "Nexora — Lost & Found Feed" }] }),
  component: LostFoundRoute,
});

// ── Types ───────────────────────────────────────────────────────────────────
type PostType = "Lost" | "Found" | "Recovered" | "Searching";

type LostFoundPost = {
  id: string;
  type: PostType;
  itemName: string;
  category: string;
  description: string;
  location: string;
  campus: string;
  date: string;
  time: string;
  images: string[];
  postedBy: string;
  postedByAvatar?: string;
  createdAt: string;
  likes: number;
  comments: number;
};

const CATEGORIES = [
  "ID Card", "Wallet", "Keys", "Mobile Phone", "Laptop", 
  "Earbuds / Headphones", "Charger", "Documents", "Books", 
  "Bags", "Clothing", "Others",
];

// ── Mock Data ───────────────────────────────────────────────────────────────
const seedPosts: LostFoundPost[] = [
  {
    id: "lf-1",
    type: "Lost",
    itemName: "Black Leather Wallet with ID",
    category: "Wallet",
    description: "Hey everyone, I lost my black leather wallet near the library cafe around 2:30 PM today. It contains my student ID card, driver's license, and some cash. If anyone has found it, please let me know ASAP! I really need the ID for my exams tomorrow.",
    location: "Library Cafe",
    campus: "Nexora Main Campus",
    date: "2026-08-10",
    time: "14:30",
    images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800"],
    postedBy: "Rahul Sharma",
    postedByAvatar: "https://ui-avatars.com/api/?name=Rahul+Sharma&background=4f46e5&color=fff",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    likes: 12,
    comments: 4
  },
  {
    id: "lf-2",
    type: "Found",
    itemName: "Apple AirPods Pro Case",
    category: "Earbuds / Headphones",
    description: "Found a white AirPods Pro case with both earbuds inside. Left it at the admin block reception with the security guard. It has a tiny blue scratch on the back. Claim it from the reception if it's yours!",
    location: "Admin Block",
    campus: "South Campus",
    date: "2026-08-09",
    time: "09:15",
    images: ["https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&q=80&w=800"],
    postedBy: "Priya Patel",
    postedByAvatar: "https://ui-avatars.com/api/?name=Priya+Patel&background=ec4899&color=fff",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    likes: 45,
    comments: 2
  },
  {
    id: "lf-3",
    type: "Recovered",
    itemName: "MacBook Pro Charger",
    category: "Charger",
    description: "Update: The charger has been found! Huge thanks to Neha for returning it to the department office. Nexora community is the best!",
    location: "Mechanical Dept.",
    campus: "Nexora Main Campus",
    date: "2026-08-08",
    time: "16:00",
    images: [],
    postedBy: "Amit Singh",
    postedByAvatar: "https://ui-avatars.com/api/?name=Amit+Singh&background=10b981&color=fff",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    likes: 89,
    comments: 12
  }
];

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function LostFoundRoute() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<LostFoundPost[]>(seedPosts);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCampus, setActiveCampus] = useState("All");
  const [activeType, setActiveType] = useState<"All" | PostType>("All");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Recent");
  
  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<"Lost" | "Found">("Lost");

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (activeType !== "All" && post.type !== activeType) return false;
      if (activeCategory !== "All" && post.category !== activeCategory) return false;
      if (activeCampus !== "All" && post.campus !== activeCampus) return false;
      if (searchQuery && !post.itemName.toLowerCase().includes(searchQuery.toLowerCase()) && !post.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [posts, activeType, activeCategory, activeCampus, searchQuery]);

  const handleOpenReport = (type: "Lost" | "Found") => {
    setReportType(type);
    setIsReportModalOpen(true);
  };

  return (
    <ModuleAccessBoundary moduleId="lost-found">
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col pb-12">
        
        {/* ── TOP NAV BAR ─────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-4 sm:px-6 bg-background/95 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center gap-6">
            <NexoraLogo size="sm" />
            <div className="h-5 w-px bg-border/50" />
            <Link 
              to="/" 
              className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              ← Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors text-foreground relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-background" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="h-10 w-10 rounded-full overflow-hidden border border-border/50 hover:border-border transition-colors focus:outline-none">
                <img src="https://ui-avatars.com/api/?name=User&background=333&color=fff" alt="Profile" className="h-full w-full object-cover" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border/50 text-foreground">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem className="cursor-pointer hover:bg-secondary focus:bg-secondary">My Reports</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-secondary focus:bg-secondary">Settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── HERO SECTION ────────────────────────────────────────────────── */}
        <div className="bg-card border-b border-border/50">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-display font-black tracking-tight text-foreground mb-1">Lost something? Found something?</h1>
              <p className="text-muted-foreground text-xs max-w-lg leading-relaxed">
                Post it here to notify the community. This feed helps Nexora students recover their belongings securely.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
              <button 
                onClick={() => handleOpenReport("Lost")}
                className="w-full sm:w-auto px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Report Lost Item
              </button>
              <button 
                onClick={() => handleOpenReport("Found")}
                className="w-full sm:w-auto px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Report Found Item
              </button>
            </div>
          </div>
        </div>

        {/* ── STICKY FILTER BAR ───────────────────────────────────────────── */}
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm py-3">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex bg-secondary/30 p-1 rounded-lg border border-border/50 shrink-0 w-max overflow-x-auto [scrollbar-width:none]">
              {["All", "Lost", "Found", "Recovered", "Searching"].map(type => (
                <button 
                  key={type}
                  onClick={() => setActiveType(type as any)}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                    activeType === type 
                      ? type === "Lost" ? "bg-rose-500 text-white shadow-sm" 
                        : type === "Found" ? "bg-emerald-500 text-white shadow-sm" 
                        : type === "Recovered" ? "bg-blue-500 text-white shadow-sm"
                        : "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 overflow-x-auto [scrollbar-width:none]">
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search feed..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-48 h-9 pl-9 pr-3 bg-secondary/30 border border-border/50 rounded-lg focus:outline-none focus:border-primary focus:bg-background transition-colors text-sm font-medium"
                />
              </div>

              <select
                value={activeCampus}
                onChange={e => setActiveCampus(e.target.value)}
                className="h-9 px-3 pr-8 bg-secondary/30 border border-border/50 rounded-lg text-sm font-medium focus:outline-none focus:border-primary shrink-0 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_8px_center] bg-no-repeat"
              >
                <option value="All">All Campuses</option>
                <option value="Nexora Main Campus">Main Campus</option>
                <option value="South Campus">South Campus</option>
                <option value="North Campus">North Campus</option>
              </select>

              <select
                value={activeCategory}
                onChange={e => setActiveCategory(e.target.value)}
                className="h-9 px-3 pr-8 bg-secondary/30 border border-border/50 rounded-lg text-sm font-medium focus:outline-none focus:border-primary shrink-0 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_8px_center] bg-no-repeat"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="h-9 px-3 pr-8 bg-secondary/30 border border-border/50 rounded-lg text-sm font-medium focus:outline-none focus:border-primary shrink-0 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_8px_center] bg-no-repeat"
              >
                <option value="Recent">Most Recent</option>
                <option value="Top">Top Activity</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 70/30 SPLIT CONTENT ─────────────────────────────────────────── */}
        <main className="max-w-[1100px] mx-auto w-full px-4 sm:px-6 pt-8 pb-16 flex gap-8 relative">
          
          {/* LEFT 70% - FEED */}
          <div className="flex-1 w-full lg:max-w-[70%] flex flex-col gap-6">
            
            {/* Create Post Input Trigger (Reddit style) */}
            <div className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-border transition-colors cursor-text" onClick={() => handleOpenReport("Lost")}>
              <img src="https://ui-avatars.com/api/?name=User&background=333&color=fff" alt="Profile" className="h-10 w-10 rounded-full object-cover border border-border" />
              <div className="flex-1 h-11 bg-secondary/30 hover:bg-secondary/50 transition-colors rounded-full border border-border/50 px-4 flex items-center text-muted-foreground text-sm font-medium">
                Create a new lost or found report...
              </div>
              <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground transition-colors">
                <Camera className="h-5 w-5" />
              </button>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
                <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-bold mb-2">No reports found</h3>
                <p className="text-muted-foreground text-sm">We couldn't find any items matching your filters.</p>
              </div>
            ) : (
              filteredPosts.map(post => (
                <div key={post.id} className="bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden flex flex-col">
                  
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={post.postedByAvatar} 
                        alt={post.postedBy} 
                        className="h-12 w-12 rounded-full object-cover border border-border"
                      />
                      <div>
                        <h3 className="font-bold text-foreground text-sm sm:text-base leading-tight hover:underline cursor-pointer">
                          {post.postedBy}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 font-medium">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(post.createdAt)}</span>
                          <span className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
                          <span className="text-primary font-bold hover:underline cursor-pointer">{post.category}</span>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground transition-colors focus:outline-none">
                        <MoreHorizontal className="h-5 w-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-card border-border/50">
                        <DropdownMenuItem className="gap-2 cursor-pointer text-foreground hover:bg-secondary"><Share2 className="h-4 w-4" /> Share Post</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer text-foreground hover:bg-secondary"><Flag className="h-4 w-4" /> Report Post</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Card Body */}
                  <div className="px-4 sm:px-5 pb-3">
                    <div className="flex items-center gap-2 mb-3">
                      {post.type === "Lost" && <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">Lost Item</span>}
                      {post.type === "Found" && <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Found Item</span>}
                      {post.type === "Recovered" && <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">Recovered</span>}
                      
                      <h2 className="text-lg font-bold font-display leading-tight">
                        <Link to="/lost-found/$id" params={{ id: post.id }} className="hover:text-primary transition-colors">
                          {post.itemName}
                        </Link>
                      </h2>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 text-sm font-medium text-muted-foreground bg-secondary/20 p-3 rounded-lg border border-border/30">
                      <div className="flex items-center gap-2 text-foreground/80">
                        <MapPin className="h-4 w-4 text-primary" />
                        {post.location}, {post.campus}
                      </div>
                      <div className="hidden sm:block h-4 w-px bg-border/50" />
                      <div className="flex items-center gap-2 text-foreground/80">
                        <Calendar className="h-4 w-4 text-primary" />
                        {post.date} at {post.time}
                      </div>
                    </div>

                    <p className="text-foreground/90 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                      {post.description}
                    </p>
                  </div>

                  {/* Images */}
                  {post.images && post.images.length > 0 && (
                    <div className="px-4 sm:px-5 pb-3">
                      <Link to="/lost-found/$id" params={{ id: post.id }} className="block rounded-xl overflow-hidden border border-border/50 cursor-pointer group">
                        <img 
                          src={post.images[0]} 
                          alt="Post attachment" 
                          className="w-full max-h-[350px] object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="p-2 sm:p-3 px-4 sm:px-5 flex flex-wrap items-center justify-between border-t border-border/50">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-xs font-bold">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>{post.likes}</span>
                      </button>
                      <Link to="/lost-found/$id" params={{ id: post.id }} className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-xs font-bold">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{post.comments}</span>
                      </Link>
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-xs font-bold hidden sm:flex">
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Share</span>
                      </button>
                    </div>

                    <div className="flex items-center">
                      {post.type === "Lost" ? (
                        <button className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5">
                          I Found This
                        </button>
                      ) : post.type === "Found" ? (
                        <button className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5">
                          Claim Item
                        </button>
                      ) : (
                        <button className="px-4 py-1.5 bg-secondary/50 text-foreground cursor-default rounded-md font-bold text-xs flex items-center gap-1.5 border border-border/50">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          Recovered
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

          {/* RIGHT 30% - SIDEBAR */}
          <aside className="hidden lg:flex w-[30%] flex-col gap-6 sticky top-36 h-max">
            
            {/* Action Card */}
            <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm">
              <h3 className="font-display font-bold text-lg mb-4 text-foreground">Need help finding something?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                Post it on the community feed. Over 5,000 students view the Nexora Notice Board daily.
              </p>
              <button 
                onClick={() => handleOpenReport("Lost")}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg shadow-sm transition-colors mb-2"
              >
                Create a Report
              </button>
            </div>

            {/* Smart Matches (Mock) */}
            <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <h3 className="font-display font-bold text-base text-foreground">Smart Matches</h3>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-2">New Potential Match!</p>
                <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                  Someone just found a <strong>Wallet</strong> in the <strong>Library</strong>. It matches your recent lost report.
                </p>
                <Link to="/lost-found/$id" params={{ id: "lf-2" }} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                  View Item <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <h3 className="font-display font-bold text-base text-foreground">Community Guidelines</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium text-muted-foreground leading-relaxed">Always meet in public, well-lit campus areas for item handovers.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium text-muted-foreground leading-relaxed">Ask verification questions to ensure the item belongs to the claimant.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium text-muted-foreground leading-relaxed">Do not pay "finder's fees" digitally beforehand.</span>
                </li>
              </ul>
            </div>

          </aside>

        </main>
      </div>

      {/* ── REPORT MODAL ────────────────────────────────────────────────── */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsReportModalOpen(false)} />
          <div className="relative w-full max-w-xl bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-secondary/10 shrink-0">
              <h2 className="text-lg font-bold font-display flex items-center gap-2">
                {reportType === "Lost" ? (
                  <><AlertCircle className="h-4 w-4 text-rose-500" /> Post a Lost Report</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Post a Found Report</>
                )}
              </h2>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar">
              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); toast.success("Report submitted to feed!"); setIsReportModalOpen(false); }}>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">Item Name *</label>
                  <input type="text" required placeholder="e.g. Black Leather Wallet" className="w-full h-10 px-3 bg-background border border-border/50 rounded-lg focus:border-primary focus:outline-none transition-colors text-sm" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold">Category *</label>
                    <select required className="w-full h-10 px-3 bg-background border border-border/50 rounded-lg focus:border-primary focus:outline-none transition-colors appearance-none text-sm bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_8px_center] bg-no-repeat">
                      <option value="">Select category...</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold">Date {reportType === "Lost" ? "Lost" : "Found"} *</label>
                    <input type="date" required className="w-full h-10 px-3 bg-background border border-border/50 rounded-lg focus:border-primary focus:outline-none transition-colors text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold">Campus *</label>
                    <select required className="w-full h-10 px-3 bg-background border border-border/50 rounded-lg focus:border-primary focus:outline-none transition-colors appearance-none text-sm bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_8px_center] bg-no-repeat">
                      <option value="">Select campus...</option>
                      <option>Nexora Main Campus</option>
                      <option>South Campus</option>
                      <option>North Campus</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold">Exact Location *</label>
                    <input type="text" required placeholder="e.g. Library Cafe table 4" className="w-full h-10 px-3 bg-background border border-border/50 rounded-lg focus:border-primary focus:outline-none transition-colors text-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold">Description *</label>
                  <textarea required rows={4} placeholder="Write your post... Be sure to include identifying details!" className="w-full p-3 bg-background border border-border/50 rounded-lg focus:border-primary focus:outline-none transition-colors resize-none text-sm" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold">Attach Image</label>
                  <div className="w-full h-24 border border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center hover:bg-secondary/30 transition-colors cursor-pointer group">
                    <Camera className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors mb-1.5" />
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Add photos to your post</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 rounded-lg font-bold text-sm hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    Post to Feed
                  </button>
                </div>
              </form>
            </div>
            
          </div>
        </div>
      )}
    </ModuleAccessBoundary>
  );
}
