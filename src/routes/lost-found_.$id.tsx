import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { 
  ChevronLeft,
  Share2,
  MapPin,
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Package,
  ThumbsUp,
  MoreHorizontal,
  Send,
  Flag,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { NexoraLogo } from "@/components/brand/NexoraLogo";

export const Route = createFileRoute("/lost-found_/$id")({
  head: () => ({ meta: [{ title: "Nexora — Report Details" }] }),
  component: LostFoundDetailRoute,
});

// Mock data fetcher
function getMockItem(id: string) {
  return {
    id,
    type: id === "lf-3" ? "Recovered" : (id === "lf-2" || id === "lf-4" ? "Found" : "Lost"),
    itemName: id === "lf-2" ? "Apple AirPods Pro Case" : "Black Leather Wallet with ID",
    category: id === "lf-2" ? "Earbuds / Headphones" : "Wallet",
    description: id === "lf-2" 
      ? "Found a white AirPods Pro case with both earbuds inside. Left it at the admin block reception with the security guard. It has a tiny blue scratch on the back. Claim it from the reception if it's yours!"
      : "Hey everyone, I lost my black leather wallet near the library cafe around 2:30 PM today. It contains my student ID card, driver's license, and some cash. If anyone has found it, please let me know ASAP! I really need the ID for my exams tomorrow.",
    location: "Library Cafe",
    campus: "Nexora Main Campus",
    date: "2026-08-10",
    time: "14:30",
    images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800"],
    postedBy: "Rahul Sharma",
    postedByAvatar: "https://ui-avatars.com/api/?name=Rahul+Sharma&background=4f46e5&color=fff",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    likes: 12,
  };
}

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function LostFoundDetailRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const item = getMockItem(id);
  
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<{sender: "me" | "other", text: string, time: string}[]>([
    { sender: "other", text: "Hi, I think I might have found your wallet! Does it have a blue stitch on the side?", time: "10 mins ago" }
  ]);

  const hasImages = item.images && item.images.length > 0;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setMessages([...messages, { sender: "me", text: chatMessage, time: "Just now" }]);
    setChatMessage("");
    toast.success("Message sent");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* ── TOPBAR ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-4 sm:px-6 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate({ to: "/lost-found" })}
            className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="hidden sm:flex items-center gap-4">
            <NexoraLogo size="sm" />
            <span className="text-muted-foreground text-sm font-medium border-l border-border/50 pl-4">Report Details</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="h-9 px-3 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-foreground text-sm font-bold gap-2"
          >
            <Flag className="h-4 w-4" /> <span className="hidden sm:inline">Report Post</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <main className="max-w-[1000px] mx-auto w-full px-4 sm:px-6 pt-8 pb-12 flex flex-col lg:flex-row gap-6 relative">
        
        {/* LEFT COLUMN: THE POST */}
        <div className="lg:w-[65%] flex flex-col gap-6">
          
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
            {/* Post Header */}
            <div className="p-5 flex items-start justify-between bg-secondary/5 border-b border-border/50">
              <div className="flex items-center gap-3">
                <img 
                  src={item.postedByAvatar} 
                  alt={item.postedBy}
                  className="h-12 w-12 rounded-full border border-border object-cover"
                />
                <div>
                  <h3 className="text-base font-bold text-foreground hover:underline cursor-pointer">{item.postedBy}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 font-medium">
                    <span>{timeAgo(item.createdAt)}</span>
                    <span className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
                    <span className="text-primary font-bold hover:underline cursor-pointer">{item.category}</span>
                  </div>
                </div>
              </div>
              <button className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-secondary text-muted-foreground transition-colors">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>

            {/* Post Content */}
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {item.type === "Lost" && <span className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">Lost Item</span>}
                {item.type === "Found" && <span className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Found Item</span>}
                {item.type === "Recovered" && <span className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Recovered</span>}
                
                <h1 className="text-2xl font-display font-bold leading-tight">
                  {item.itemName}
                </h1>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mb-6 pb-6 border-b border-border/50">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Location</div>
                    <div className="text-sm font-medium text-foreground">{item.location} <span className="text-muted-foreground">({item.campus})</span></div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Date & Time</div>
                    <div className="text-sm font-medium text-foreground">{item.date} at {item.time}</div>
                  </div>
                </div>
              </div>

              <div className="prose prose-sm sm:prose-base prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {item.description}
              </div>
            </div>

            {/* Post Image */}
            {hasImages && (
              <div className="border-t border-border/50 bg-secondary/10 cursor-pointer group relative">
                <img 
                  src={item.images[0]} 
                  alt={item.itemName} 
                  className="w-full max-h-[600px] object-contain group-hover:opacity-90 transition-opacity"
                />
              </div>
            )}

            {/* Post Actions */}
            <div className="p-3 px-5 flex items-center justify-between border-t border-border/50 bg-secondary/10">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-sm font-bold">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{item.likes}</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-sm font-bold">
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </div>
              
              {item.type !== "Recovered" && (
                <button className="px-5 py-2.5 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg font-bold text-sm transition-colors border border-border/50">
                  Mark as Recovered
                </button>
              )}
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: INTERACTION ZONE */}
        <div className="lg:w-[35%] flex flex-col gap-6 relative">
          
          {item.type !== "Recovered" && (
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm flex flex-col h-[500px] sticky top-24">
              
              {/* Chat Header */}
              <div className="p-4 border-b border-border/50 bg-secondary/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="font-display font-bold text-base">Message Reporter</h3>
                </div>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-background/30">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.sender === "me" ? "items-end" : "items-start"}`}>
                    <div 
                      className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                        msg.sender === "me" 
                          ? "bg-primary text-primary-foreground rounded-tr-sm" 
                          : "bg-secondary text-foreground rounded-tl-sm border border-border/50"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground mt-1 px-1">{msg.time}</span>
                  </div>
                ))}
              </div>
              
              {/* Chat Input */}
              <div className="p-3 border-t border-border/50 bg-card">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 h-10 px-4 bg-secondary/50 border border-border/50 rounded-full focus:outline-none focus:border-primary text-sm"
                  />
                  <button 
                    type="submit"
                    disabled={!chatMessage.trim()}
                    className="h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shrink-0"
                  >
                    <Send className="h-4 w-4 ml-0.5" />
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* Verification Questions Mock */}
          {item.type === "Found" && (
            <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="h-5 w-5 text-blue-500" />
                <h3 className="font-display font-bold text-base text-blue-500">Ownership Verification</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                The finder has set up verification questions. You must answer them correctly before claiming the item.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">What color is the inside lining?</label>
                  <input type="text" placeholder="Your answer..." className="w-full h-10 px-3 bg-secondary/30 border border-border/50 rounded-lg text-sm focus:border-primary focus:outline-none" />
                </div>
                <button className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors text-sm">
                  Submit Answers
                </button>
              </div>
            </div>
          )}

          {item.type === "Recovered" && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center shadow-sm">
              <div className="h-16 w-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="font-display font-bold text-xl text-emerald-500 mb-2">Item Recovered!</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                This item has been successfully returned to its owner. The Nexora community strikes again!
              </p>
            </div>
          )}
          
        </div>
        
      </main>
    </div>
  );
}
