/**
 * CampusConnectSupport.tsx
 * Comprehensive Help Center for Nexora Campus Connect.
 */
import { useState, useEffect, useMemo } from "react";
import {
  HelpCircle, User, Heart, MessageCircle, Shield, Flag, ChevronLeft, Search, ChevronDown, BookOpen, AlertCircle
} from "lucide-react";
import student3 from "@/assets/student-3.jpg";
import campusScene from "@/assets/campus-scene.png";
import coupleCampus from "@/assets/couple-campus.jpg";
import { cn } from "@/lib/utils";

interface SupportProps {
  onBack?: () => void;
}

// ── Knowledge Base Data ──
interface Article {
  id: string;
  title: string;
  content: React.ReactNode;
  category: string;
  keywords: string[];
}

const ARTICLES: Article[] = [
  {
    id: "edit-profile",
    title: "How do I edit my profile?",
    category: "Account & Profile",
    keywords: ["edit", "profile", "change", "photo", "bio", "update"],
    content: (
      <div className="space-y-4 text-muted-foreground">
        <p>To edit your profile, go to the <strong>My Profile</strong> tab in the Campus Connect dashboard.</p>
        <p>From there, you can upload new photos, update your bio, and change your listed interests. Changes are saved automatically when you exit the editing mode.</p>
      </div>
    )
  },
  {
    id: "how-matching-works",
    title: "How does matching work?",
    category: "Discover & Connections",
    keywords: ["match", "matching", "like", "pass", "connect", "discover"],
    content: (
      <div className="space-y-4 text-muted-foreground">
        <p>Matching is based on mutual interest. When you are in the Discover feed, you can either Like (heart) or Pass (X) on a profile.</p>
        <p>If you Like someone, and they also Like you back, a Match is created! You will then be able to message each other in the <strong>Chats</strong> tab.</p>
      </div>
    )
  },
  {
    id: "start-conversation",
    title: "How do I start a conversation?",
    category: "Messages & Chat",
    keywords: ["message", "chat", "conversation", "talk", "start"],
    content: (
      <div className="space-y-4 text-muted-foreground">
        <p>You can only start a conversation with someone you have Matched with.</p>
        <p>Navigate to the <strong>Chats</strong> tab. You will see a list of your new matches at the top, and ongoing conversations below. Tap on a match to open the chat window and say hello!</p>
      </div>
    )
  },
  {
    id: "block-someone",
    title: "How do I block someone?",
    category: "Safety & Privacy",
    keywords: ["block", "hide", "remove", "safety", "stop"],
    content: (
      <div className="space-y-4 text-muted-foreground">
        <p>If you no longer want to interact with a user, you can block them.</p>
        <p>Open their profile or your chat conversation, tap the top-right menu (⋮), and select <strong>Block</strong>. They will immediately disappear from your feed and matches, and they will not be notified.</p>
      </div>
    )
  },
  {
    id: "visibility-privacy",
    title: "How do I change my visibility?",
    category: "Safety & Privacy",
    keywords: ["visibility", "privacy", "hide", "pause", "invisible"],
    content: (
      <div className="space-y-4 text-muted-foreground">
        <p>You control who sees your profile.</p>
        <p>Go to <strong>My Profile</strong> and select the Privacy settings. Here you can hide specific details (like your major or year) or toggle "Pause Discovery" to hide your profile from new people entirely.</p>
      </div>
    )
  },
  {
    id: "report-profile",
    title: "How do I report a profile?",
    category: "Reporting & Blocking",
    keywords: ["report", "flag", "inappropriate", "fake", "harassment"],
    content: (
      <div className="space-y-4 text-muted-foreground">
        <p>To report someone for violating community guidelines, tap the Flag icon (🚩) on their profile or in your chat.</p>
        <p>Select the reason for the report and submit it. Our moderation team will review it confidentially. Reporting someone also automatically blocks them from your view.</p>
      </div>
    )
  }
];

const CATEGORIES = [
  { id: "getting-started", name: "Getting Started", icon: HelpCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "account-profile", name: "Account & Profile", icon: User, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "discover-matches", name: "Discover & Matches", icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
  { id: "messages-chat", name: "Messages & Chat", icon: MessageCircle, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "safety-privacy", name: "Safety & Privacy", icon: Shield, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "reporting", name: "Reporting & Blocking", icon: Flag, color: "text-red-500", bg: "bg-red-500/10" },
];

export function CampusConnectSupport({ onBack }: SupportProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState<string | null>(null);
  const [expandedFaqs, setExpandedFaqs] = useState<Record<string, boolean>>({});

  const toggleFaq = (id: string) => {
    setExpandedFaqs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setActiveSearch(searchQuery.trim());
    } else {
      setActiveSearch(null);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveSearch(null);
  };

  const searchResults = useMemo(() => {
    if (!activeSearch) return [];
    const query = activeSearch.toLowerCase();
    return ARTICLES.filter(a => 
      a.title.toLowerCase().includes(query) || 
      a.keywords.some(k => k.toLowerCase().includes(query)) ||
      a.category.toLowerCase().includes(query)
    );
  }, [activeSearch]);

  return (
    <div className="min-h-full w-full bg-background flex flex-col relative overflow-x-hidden pb-24">
      
      {/* ── Dynamic Header ── */}
      {onBack && (
        <div className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex items-center bg-gradient-to-b from-background/80 to-transparent pointer-events-none">
          {activeSearch ? (
            <button 
              onClick={clearSearch}
              className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors text-sm font-bold tracking-wide group px-4 py-2 pointer-events-auto bg-card/80 backdrop-blur-md rounded-full shadow-sm border border-border"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Support
            </button>
          ) : (
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors text-sm font-bold tracking-wide uppercase group bg-muted/90 backdrop-blur-md px-4 py-2 rounded-full pointer-events-auto shadow-sm border border-border"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Support
            </button>
          )}
        </div>
      )}

      {!activeSearch ? (
        <>
          {/* ── Main Help Center Landing ── */}
          <section className="w-full pt-32 pb-16 px-6 bg-muted/30">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-2">
                <HelpCircle className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight text-foreground">
                How can we help?
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
                Find quick answers, explore guides, and learn how Nexora Campus Connect works.
              </p>
              
              <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto mt-8 shadow-xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a question or topic..."
                  className="w-full h-20 pl-16 pr-6 rounded-[2rem] bg-background border border-border text-foreground placeholder:text-muted-foreground text-lg focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all shadow-sm"
                />
                <button type="submit" className="hidden">Search</button>
              </form>
            </div>
          </section>

          <div className="max-w-4xl mx-auto px-6 w-full space-y-24 mt-12">
            
            {/* Popular Questions (Expandable FAQ) */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> Popular questions
              </h2>
              <div className="space-y-4">
                {ARTICLES.slice(0, 4).map((article) => {
                  const isExpanded = expandedFaqs[article.id];
                  return (
                    <div key={article.id} className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
                      <button 
                        onClick={() => toggleFaq(article.id)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                      >
                        <span className="font-bold text-foreground text-lg">{article.title}</span>
                        <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-300", isExpanded && "rotate-180")} />
                      </button>
                      <div 
                        className={cn("px-6 overflow-hidden transition-all duration-300 ease-in-out", isExpanded ? "max-h-96 pb-6 opacity-100" : "max-h-0 opacity-0")}
                      >
                        <div className="pt-2 border-t border-border/50">
                          {article.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Browse by Topic */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6">Browse by topic</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button 
                      key={cat.id}
                      onClick={() => {
                        setSearchQuery(cat.name);
                        setActiveSearch(cat.name);
                      }}
                      className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all text-left group"
                    >
                      <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                        <Icon className={`w-6 h-6 ${cat.color}`} />
                      </div>
                      <span className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Featured Guides */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6">Featured guides</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group relative overflow-hidden rounded-[2rem] aspect-video border border-border shadow-sm cursor-pointer" onClick={() => {
                  setSearchQuery("profile");
                  setActiveSearch("profile");
                }}>
                  <img src={student3} alt="Setting up profile" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-full mb-3 inline-block">Guide</span>
                    <h3 className="text-2xl font-bold text-white">The perfect profile</h3>
                  </div>
                </div>
                <div className="group relative overflow-hidden rounded-[2rem] aspect-video border border-border shadow-sm cursor-pointer" onClick={() => {
                  setSearchQuery("match");
                  setActiveSearch("match");
                }}>
                  <img src={coupleCampus} alt="Making connections" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-full mb-3 inline-block">Tips</span>
                    <h3 className="text-2xl font-bold text-white">Making connections</h3>
                  </div>
                </div>
              </div>
            </section>

            {/* Still need help */}
            <section className="bg-primary/5 rounded-[2.5rem] p-10 md:p-14 text-center border border-primary/10 flex flex-col items-center shadow-sm">
              <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center shadow-sm mb-6">
                <AlertCircle className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight">Need to return?</h2>
              <p className="text-muted-foreground mb-8 max-w-md text-lg leading-relaxed">
                Head back to Campus Connect to explore matches, update your profile, or chat with your connections.
              </p>
              <button 
                onClick={onBack}
                className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg hover:-translate-y-1"
              >
                Back to Campus Connect
              </button>
            </section>

          </div>
        </>
      ) : (
        /* ── Search Results View ── */
        <div className="max-w-4xl mx-auto px-6 w-full pt-32 space-y-12 animate-in fade-in duration-300">
          
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground">
              Search results
            </h1>
            <form onSubmit={handleSearchSubmit} className="relative w-full shadow-sm">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-14 pr-6 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </form>
          </div>

          <div className="space-y-8">
            {searchResults.length > 0 ? (
              <div className="space-y-6">
                <p className="text-muted-foreground font-medium">Found {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} for "{activeSearch}"</p>
                <div className="space-y-4">
                  {searchResults.map(article => {
                    const isExpanded = expandedFaqs[article.id];
                    return (
                      <div key={article.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <button 
                          onClick={() => toggleFaq(article.id)}
                          className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none group"
                        >
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">{article.category}</p>
                            <span className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{article.title}</span>
                          </div>
                          <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-300 shrink-0", isExpanded && "rotate-180")} />
                        </button>
                        <div 
                          className={cn("px-6 overflow-hidden transition-all duration-300 ease-in-out", isExpanded ? "max-h-96 pb-6 opacity-100" : "max-h-0 opacity-0")}
                        >
                          <div className="pt-4 border-t border-border/50">
                            {article.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-muted/30 rounded-[2rem] border border-border">
                <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">No results found</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">We couldn't find any articles matching "{activeSearch}". Try a different search term or browse our popular categories below.</p>
                
                <div className="flex flex-wrap justify-center gap-3 max-w-lg mx-auto">
                  {["Profile", "Matches", "Messages", "Safety", "Privacy", "Reporting"].map(term => (
                    <button
                      key={term}
                      onClick={() => {
                        setSearchQuery(term);
                        setActiveSearch(term);
                      }}
                      className="px-4 py-2 rounded-full bg-card border border-border text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
