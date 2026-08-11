import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, 
  Send,
  MoreVertical,
  Phone,
  ShieldAlert,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { useMarketplace } from "@/hooks/useMarketplace";
import { MarketplaceListing, MarketplaceMessage } from "@/lib/marketplace";

export const Route = createFileRoute("/marketplace_/chat/$id")({
  head: () => ({ meta: [{ title: "Nexora — Marketplace Chat" }] }),
  component: MarketplaceChatPage,
});

function MarketplaceChatPage() {
  const { id } = Route.useParams(); // this is the listing ID
  const { selectedListing: listing, currentUserId } = useMarketplace({ id });
  
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<MarketplaceMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listing) {
      // Simulate existing conversation
      setChatHistory([
        {
          id: "msg1",
          listingId: listing.id,
          senderId: currentUserId,
          senderName: "Me",
          body: `Hi, is "${listing.title}" still available?`,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        }
      ]);
    }
  }, [listing, currentUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !listing) return;

    const newMsg: MarketplaceMessage = {
      id: Math.random().toString(36).substr(2, 9),
      listingId: listing.id,
      senderId: currentUserId,
      senderName: "Me",
      body: message.trim(),
      createdAt: new Date().toISOString(),
    };

    setChatHistory([...chatHistory, newMsg]);
    setMessage("");

    // Simulate auto-reply after 1 second
    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          listingId: listing.id,
          senderId: listing.sellerId,
          senderName: listing.sellerName,
          body: "Yes, it is! Let me know if you have any questions or want to meet up.",
          createdAt: new Date().toISOString(),
        }
      ]);
    }, 1500);
  };

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center text-center p-6 text-foreground">
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-foreground font-sans flex flex-col">
      {/* ── TOPBAR ─────────────────────────────────────────────────── */}
      <header className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 bg-[#030712] border-b border-border/50">
        <div className="flex items-center gap-4">
          <Link to="/marketplace" className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary/50 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <img 
              src={listing.sellerAvatar || `https://ui-avatars.com/api/?name=${listing.sellerName}&background=random`} 
              alt={listing.sellerName}
              className="h-10 w-10 rounded-full border border-border/50 object-cover"
            />
            <div>
              <h2 className="text-sm font-bold leading-tight">{listing.sellerName}</h2>
              <p className="text-[11px] text-emerald-500 font-medium">Online</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <Phone className="h-4 w-4" />
          </button>
          <button className="h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── MAIN CHAT AREA ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto relative overflow-hidden">
        
        {/* Product Context Card (Pinned at top) */}
        <Link 
          to="/marketplace/product/$id"
          params={{ id: listing.id }}
          className="m-4 p-3 rounded-2xl bg-secondary/30 border border-border/50 flex items-center gap-4 hover:bg-secondary/50 transition-colors shrink-0"
        >
          <img 
            src={listing.images[0] || ""}
            alt={listing.title}
            className="h-16 w-16 rounded-xl object-cover bg-secondary"
          />
          <div className="flex-1 overflow-hidden">
            <h3 className="text-sm font-bold truncate">{listing.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{listing.condition} • {listing.campus || "Main Campus"}</p>
            <p className="text-sm font-bold text-emerald-400 mt-1">₹{listing.price.toLocaleString("en-IN")}</p>
          </div>
          <ChevronRightIcon className="h-5 w-5 text-muted-foreground hidden sm:block" />
        </Link>

        {/* Safety Warning */}
        <div className="mx-4 mb-4 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 shrink-0">
          <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            Stay safe: Never share passwords or pay outside the app before inspecting the item in person.
          </p>
        </div>

        {/* Message History */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 pb-4 space-y-4"
        >
          <div className="flex justify-center my-4">
            <span className="text-[11px] font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
              Today
            </span>
          </div>

          {chatHistory.map((msg, i) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div 
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                    isMe 
                      ? "bg-primary text-primary-foreground rounded-br-sm" 
                      : "bg-secondary text-foreground rounded-bl-sm border border-border/50"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.body}</p>
                  <div className={`text-[10px] mt-1 text-right ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background/95 backdrop-blur-md border-t border-border/50 shrink-0">
          <form 
            onSubmit={handleSend}
            className="flex items-center gap-2 max-w-4xl mx-auto"
          >
            <input 
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-12 bg-secondary/50 border border-border/50 rounded-full px-5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/70"
            />
            <button 
              type="submit"
              disabled={!message.trim()}
              className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shrink-0"
            >
              <Send className="h-5 w-5 ml-1" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

function ChevronRightIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
