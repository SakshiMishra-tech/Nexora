import { useState, useEffect, useRef, useMemo } from "react";
import { 
  MessageCircle, Send, ImageIcon, DollarSign, X, Check, CheckCheck, Eye, ChevronLeft, MapPin, Tag,
  Clock, AlertCircle, Smile, PhoneCall, Search, MoreVertical, Paperclip, MoreHorizontal, ShieldCheck, CheckCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { formatPrice, timeAgo } from "@/lib/marketplace";
import { 
  fetchChatsForUser, 
  sendChatMessage, 
  updateMessageStatus, 
  markChatMessagesSeen 
} from "@/services/marketplace.service";

interface Message {
  id: string;
  sender_id: string;
  body: string;
  message_type: "text" | "offer" | "call_request" | "system";
  offer_amount?: number;
  status?: "pending" | "accepted" | "rejected" | "scheduled";
  seen: boolean;
  image_url?: string;
  created_at: string;
}

interface ChatConversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  listingTitle: string;
  listingPrice?: number;
  listingImage?: string;
  listingStatus?: string;
  otherUserName: string;
  otherUserAvatar: string;
  messages: Message[];
}

interface MarketplaceChatProps {
  onBackToBrowse: () => void;
  listings: any[];
  currentUserId?: string;
  initialChatId?: string | null;
}

export function MarketplaceChat({ onBackToBrowse, listings, currentUserId = "current-student", initialChatId }: MarketplaceChatProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialChatId || null);
  const [chatInput, setChatInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherOnline, setOtherOnline] = useState(true);
  
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync initialChatId if it arrives late
  useEffect(() => {
    if (initialChatId && initialChatId !== selectedConvId) {
      setSelectedConvId(initialChatId);
    }
  }, [initialChatId]);

  useEffect(() => {
    async function loadChats() {
      const data = await fetchChatsForUser(currentUserId);
      if (!data) return;
      
      const formattedChats = data.map((chat: any) => {
        const listing = listings.find(l => l.id === chat.listing_id);
        const isBuyer = chat.buyer_id === currentUserId;
        
        let otherUserName = "User";
        let otherUserAvatar = "";
        
        if (isBuyer) {
          otherUserName = listing?.sellerName || "Seller";
          otherUserAvatar = listing?.sellerAvatar || "";
        } else {
          otherUserName = "Buyer"; 
        }

        return {
          id: chat.id,
          listing_id: chat.listing_id,
          buyer_id: chat.buyer_id,
          seller_id: chat.seller_id,
          created_at: chat.created_at,
          listingTitle: listing?.title || "Product",
          listingPrice: listing?.price,
          listingImage: listing?.images?.[0] || "",
          listingStatus: listing?.status || "active",
          otherUserName,
          otherUserAvatar,
          messages: chat.marketplace_messages || []
        };
      });

      // Sort conversations by latest message or creation date
      formattedChats.sort((a, b) => {
        const lastMsgA = a.messages[a.messages.length - 1];
        const lastMsgB = b.messages[b.messages.length - 1];
        const timeA = lastMsgA ? new Date(lastMsgA.created_at).getTime() : new Date(a.created_at).getTime();
        const timeB = lastMsgB ? new Date(lastMsgB.created_at).getTime() : new Date(b.created_at).getTime();
        return timeB - timeA;
      });

      setConversations(formattedChats);
      
      // If we don't have a selected conv, select the first one.
      if (formattedChats.length > 0 && !selectedConvId && !initialChatId) {
        setSelectedConvId(formattedChats[0].id);
      }
    }
    loadChats();
  }, [currentUserId, listings]);

  const activeConv = useMemo(() => {
    return conversations.find(c => c.id === selectedConvId) || null;
  }, [conversations, selectedConvId]);

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      const q = searchQuery.toLowerCase();
      return c.otherUserName.toLowerCase().includes(q) || c.listingTitle.toLowerCase().includes(q);
    });
  }, [conversations, searchQuery]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, isTyping]);

  useEffect(() => {
    if (!selectedConvId) return;

    // Mark as seen immediately locally
    markChatMessagesSeen(selectedConvId);
    setConversations(prev => prev.map(c => {
      if (c.id === selectedConvId) {
        return {
          ...c,
          messages: c.messages.map(m => m.sender_id !== currentUserId ? { ...m, seen: true } : m)
        };
      }
      return c;
    }));

    const channel = supabase.channel(`marketplace-chat-${selectedConvId}`, {
      config: { broadcast: { self: true }, presence: { key: currentUserId } }
    });

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'marketplace_messages', filter: `chat_id=eq.${selectedConvId}` }, (payload) => {
        const newMsg = payload.new as Message;
        setConversations(prev => prev.map(c => {
          if (c.id === selectedConvId && !c.messages.some(m => m.id === newMsg.id)) {
            return { ...c, messages: [...c.messages, newMsg] };
          }
          return c;
        }));
        if (newMsg.sender_id !== currentUserId) {
          markChatMessagesSeen(selectedConvId);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'marketplace_messages', filter: `chat_id=eq.${selectedConvId}` }, (payload) => {
        const updatedMsg = payload.new as Message;
        setConversations(prev => prev.map(c => {
          if (c.id === selectedConvId) {
            return {
              ...c,
              messages: c.messages.map(m => m.id === updatedMsg.id ? updatedMsg : m)
            };
          }
          return c;
        }));
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.userId !== currentUserId) {
          setIsTyping(payload.typing);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString(), userId: currentUserId });
        }
      });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const userIds = Object.keys(state);
      setOtherOnline(userIds.some(uid => uid !== currentUserId));
    });

    return () => {
      void channel.unsubscribe();
      setIsTyping(false);
    };
  }, [selectedConvId, currentUserId]);

  const handleInputChange = (text: string) => {
    setChatInput(text);
    if (!selectedConvId) return;
    const channel = supabase.channel(`marketplace-chat-${selectedConvId}`);
    void channel.send({ type: "broadcast", event: "typing", payload: { userId: currentUserId, typing: text.length > 0 } });
  };

  const handleBlur = () => {
    if (!selectedConvId) return;
    const channel = supabase.channel(`marketplace-chat-${selectedConvId}`);
    void channel.send({ type: "broadcast", event: "typing", payload: { userId: currentUserId, typing: false } });
  };

  const sendMessageAction = async (payload: { body: string, message_type?: string, offer_amount?: number, image_url?: string }) => {
    if (!selectedConvId) return;
    try {
      const newMsg = await sendChatMessage({ chat_id: selectedConvId, ...payload });
      setConversations(prev => {
        // Move conversation to top
        const targetConv = prev.find(c => c.id === selectedConvId);
        if (!targetConv) return prev;
        
        const updatedConv = {
          ...targetConv,
          messages: targetConv.messages.some(m => m.id === newMsg.id) 
            ? targetConv.messages 
            : [...targetConv.messages, newMsg]
        };
        return [updatedConv, ...prev.filter(c => c.id !== selectedConvId)];
      });
      const channel = supabase.channel(`marketplace-chat-${selectedConvId}`);
      void channel.send({ type: "broadcast", event: "typing", payload: { userId: currentUserId, typing: false } });
      setChatInput("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (msgId: string, status: "accepted" | "rejected" | "scheduled", isCallRequest?: boolean) => {
    try {
      await updateMessageStatus(msgId, status as any); // status is actually stored as a string
      if (isCallRequest && status === "accepted") {
        await sendMessageAction({
          body: "Seller accepted your call request.",
          message_type: "system"
        });
      } else if (isCallRequest && status === "scheduled") {
        await sendMessageAction({
          body: "Seller wants to schedule the call for later.",
          message_type: "system"
        });
      }
    } catch(e) {
      console.error(e);
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach(msg => {
      const date = new Date(msg.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateString = date.toLocaleDateString();
      if (date.toDateString() === today.toDateString()) {
        dateString = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateString = "Yesterday";
      }

      if (!groups[dateString]) groups[dateString] = [];
      groups[dateString].push(msg);
    });
    return groups;
  };

  return (
    <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden rounded-[2rem] border border-border/60 bg-background shadow-sm xl:h-[calc(100vh-160px)]">
      
      {/* ── LEFT PANEL: Conversation List ── */}
      <div className={`flex w-full flex-col border-r border-border/50 bg-paper/50 md:w-[360px] md:min-w-[360px] ${selectedConvId ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-background/50">
          <div className="flex items-center gap-3">
            <button onClick={onBackToBrowse} className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-black font-display tracking-tight">Messages</h2>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <button className="rounded-full p-2 hover:bg-secondary hover:text-foreground">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border-none bg-secondary/70 py-2.5 pl-10 pr-4 text-sm font-semibold placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 scrollbar-thin">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground">
              <MessageCircle className="mb-2 h-8 w-8 opacity-20" />
              <p className="text-sm font-semibold">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isSelected = conv.id === selectedConvId;
              const lastMessage = conv.messages[conv.messages.length - 1];
              const unreadCount = conv.messages.filter(m => !m.seen && m.sender_id !== currentUserId).length;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full flex items-center gap-3 rounded-[1.25rem] p-3 text-left transition-all ${
                    isSelected ? "bg-secondary" : "hover:bg-secondary/50"
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 border border-border shadow-sm">
                      <AvatarImage src={conv.otherUserAvatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-black">
                        {conv.otherUserName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Tiny product indicator */}
                    <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-background bg-card p-0.5 shadow-sm overflow-hidden h-5 w-5">
                      {conv.listingImage ? (
                        <img src={conv.listingImage} alt="Product" className="h-full w-full object-cover" />
                      ) : (
                        <Tag className="h-2 w-2 m-0.5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-[15px] truncate pr-2">{conv.otherUserName}</span>
                      <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                        {lastMessage ? timeAgo(lastMessage.created_at) : ''}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] text-muted-foreground font-semibold truncate pr-2 flex items-center gap-1">
                        {lastMessage?.sender_id === currentUserId && (
                          lastMessage.seen ? <CheckCheck className="h-3.5 w-3.5 text-blue-500" /> : <Check className="h-3.5 w-3.5" />
                        )}
                        <span className="truncate">
                          {lastMessage ? 
                            (lastMessage.message_type === "offer" ? "Sent an offer" : 
                            lastMessage.message_type === "call_request" ? "Requested a call" : 
                            lastMessage.body) 
                          : conv.listingTitle}
                        </span>
                      </span>
                      {unreadCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground shadow-sm">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Active Chat ── */}
      <div className={`flex flex-1 flex-col bg-slate-50/50 dark:bg-zinc-950/20 ${!selectedConvId ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {!activeConv ? (
          <div className="flex flex-col items-center justify-center text-center p-8 opacity-60">
            <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-secondary text-primary">
              <MessageCircle className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-black font-display text-foreground">Nexora Marketplace Chat</h2>
            <p className="mt-2 text-sm font-semibold text-muted-foreground max-w-sm">
              Select a conversation from the left to start messaging, negotiate offers, or finalize campus deals safely.
            </p>
            <div className="mt-8 flex items-center gap-2 text-xs font-bold text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full">
              <ShieldCheck className="h-4 w-4" /> Keep all negotiations inside Nexora for safety.
            </div>
          </div>
        ) : (
          <>
            {/* Header / Product Info */}
            <div className="flex flex-col border-b border-border/50 bg-background/95 backdrop-blur z-10">
              <div className="flex items-center gap-4 px-4 py-3">
                <button onClick={() => setSelectedConvId(null)} className="rounded-full p-2 -ml-2 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={activeConv.otherUserAvatar} />
                  <AvatarFallback>{activeConv.otherUserName.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[15px] leading-tight truncate">{activeConv.otherUserName}</h3>
                  <p className="text-[12px] font-semibold text-muted-foreground flex items-center gap-1">
                    {otherOnline ? (
                      <><span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Online</>
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={() => {
                      sendMessageAction({ 
                        body: "I'd like to request a phone call.", 
                        message_type: "call_request" 
                      });
                    }}
                    title="Request Call"
                  >
                    <PhoneCall className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Product Snippet */}
              <div className="bg-secondary/40 px-4 py-2 border-t border-border/30 flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-card overflow-hidden border border-border/50 shadow-sm">
                  {activeConv.listingImage ? (
                    <img src={activeConv.listingImage} alt="Product" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-muted"><MapPin className="h-4 w-4"/></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{activeConv.listingTitle}</p>
                  <p className="text-xs font-black text-primary">{activeConv.listingPrice ? formatPrice(activeConv.listingPrice) : "Free"}</p>
                </div>
                {activeConv.listingStatus === "sold" && (
                  <span className="text-[10px] font-black uppercase px-2 py-1 bg-foreground text-background rounded-full shrink-0">SOLD</span>
                )}
                {activeConv.listingStatus !== "sold" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs font-bold rounded-lg border-primary/20 hover:bg-primary hover:text-primary-foreground shrink-0"
                    onClick={() => setOfferOpen(!offerOpen)}
                  >
                    Make Offer
                  </Button>
                )}
              </div>
            </div>

            {/* Offer Dropdown */}
            {offerOpen && (
              <div className="border-b border-border/50 bg-background p-4 shadow-sm animate-in slide-in-from-top-2">
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="number" 
                      placeholder="Offer amount..." 
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-4 text-sm font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <Button 
                    className="rounded-xl font-bold" 
                    onClick={() => {
                      if (!offerAmount) return;
                      sendMessageAction({ body: `I'd like to offer ${formatPrice(Number(offerAmount))}`, message_type: "offer", offer_amount: Number(offerAmount) });
                      setOfferAmount("");
                      setOfferOpen(false);
                    }}
                  >
                    Send Offer
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setOfferOpen(false)}><X className="h-4 w-4" /></Button>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin bg-[url('https://i.pinimg.com/1200x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-repeat opacity-95 dark:opacity-[0.03] bg-blend-overlay">
              
              <div className="text-center">
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 text-[11px] font-black rounded-lg shadow-sm backdrop-blur">
                  Chat secured by Nexora
                </span>
              </div>

              {Object.entries(groupMessagesByDate(activeConv.messages)).map(([dateLabel, msgs]) => (
                <div key={dateLabel} className="space-y-4">
                  <div className="flex justify-center my-4">
                    <span className="bg-background/80 text-foreground/70 px-3 py-1 rounded-xl text-[11px] font-bold shadow-sm backdrop-blur">
                      {dateLabel}
                    </span>
                  </div>

                  {msgs.map((msg, idx) => {
                    const isMe = msg.sender_id === currentUserId;
                    const showAvatar = !isMe && (idx === 0 || msgs[idx-1].sender_id !== msg.sender_id);
                    
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2 group`}>
                        {!isMe && (
                          <div className="w-8 shrink-0">
                            {showAvatar && (
                              <Avatar className="h-8 w-8 border border-border shadow-sm">
                                <AvatarImage src={activeConv.otherUserAvatar} />
                                <AvatarFallback className="text-[10px]">{activeConv.otherUserName.substring(0,2)}</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )}
                        
                        <div className={`relative flex flex-col max-w-[75%] sm:max-w-[65%] ${isMe ? "items-end" : "items-start"}`}>
                          
                          {/* Message Bubble */}
                          <div className={`relative rounded-2xl px-3.5 py-2 shadow-sm flex flex-col gap-1
                            ${msg.message_type === "offer" || msg.message_type === "call_request" ? "w-64" : ""}
                            ${isMe 
                              ? "bg-primary text-primary-foreground rounded-br-sm" 
                              : "bg-card border border-border/50 text-foreground rounded-bl-sm"
                            }
                          `}>
                            {/* Offers & Call Requests */}
                            {(msg.message_type === "offer" || msg.message_type === "call_request") && (
                              <div className="flex flex-col gap-2">
                                <div className={`flex items-center gap-2 ${isMe ? "text-primary-foreground/90" : "text-muted-foreground"} text-[10px] font-black uppercase tracking-wider`}>
                                  {msg.message_type === "offer" ? (
                                    <><DollarSign className="h-3.5 w-3.5" /> Special Offer</>
                                  ) : (
                                    <><PhoneCall className="h-3.5 w-3.5" /> Call Request</>
                                  )}
                                </div>
                                {msg.message_type === "offer" && (
                                  <div className="text-2xl font-black">{formatPrice(msg.offer_amount || 0)}</div>
                                )}
                                <p className="text-sm font-semibold opacity-90">{msg.body}</p>
                                
                                {msg.status === "pending" || !msg.status ? (
                                  !isMe ? (
                                    <div className={`mt-2 grid gap-2 ${msg.message_type === "call_request" ? "grid-cols-3" : "grid-cols-2"}`}>
                                      <Button size="sm" onClick={() => handleStatusChange(msg.id, "accepted", msg.message_type === "call_request")} className="h-8 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-none px-2 text-xs">Accept</Button>
                                      <Button size="sm" onClick={() => handleStatusChange(msg.id, "rejected", msg.message_type === "call_request")} variant="destructive" className="h-8 font-bold rounded-lg shadow-none px-2 text-xs">Decline</Button>
                                      {msg.message_type === "call_request" && (
                                        <Button size="sm" onClick={() => handleStatusChange(msg.id, "scheduled", true)} variant="secondary" className="h-8 font-bold rounded-lg shadow-none px-2 text-xs">Later</Button>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="mt-1 text-xs font-bold opacity-70">Waiting for response...</span>
                                  )
                                ) : (
                                  <div className={`mt-2 flex flex-col items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-black shadow-inner
                                    ${msg.status === "accepted" ? "bg-green-500/20 text-green-700 dark:text-green-300" 
                                    : msg.status === "scheduled" ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                                    : "bg-destructive/20 text-destructive"}
                                  `}>
                                    {msg.status === "accepted" ? (
                                      <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5"/> {msg.message_type === "offer" ? "Offer Accepted" : "Call Accepted"}</div>
                                    ) : msg.status === "scheduled" ? (
                                      <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5"/> Scheduled for Later</div>
                                    ) : (
                                      <div className="flex items-center gap-1.5"><X className="h-3.5 w-3.5"/> {msg.message_type === "offer" ? "Offer Declined" : "Call Declined"}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* System Messages */}
                            {msg.message_type === "system" && (
                              <div className="flex flex-col items-center justify-center p-2 text-center text-xs font-bold text-muted-foreground opacity-90">
                                {msg.body}
                                {msg.body.includes("accepted your call request") && (
                                  <Button size="sm" className="mt-2 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm font-black text-xs gap-1">
                                    <PhoneCall className="h-3.5 w-3.5" /> Call Available
                                  </Button>
                                )}
                              </div>
                            )}

                            {/* Standard Text */}
                            {msg.message_type === "text" && (
                              <p className="text-[14px] leading-relaxed font-medium whitespace-pre-wrap">{msg.body}</p>
                            )}

                            {/* Image */}
                            {msg.image_url && (
                              <div className="mt-1 overflow-hidden rounded-xl">
                                <img src={msg.image_url} alt="Attachment" className="max-h-64 w-auto object-cover hover:opacity-90 transition cursor-pointer" />
                              </div>
                            )}

                            {/* Timestamp & Status (inside bubble at bottom right) */}
                            <div className={`flex items-center justify-end gap-1 mt-0.5 text-[10px] font-semibold ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {isMe && (
                                msg.seen ? <CheckCheck className="h-3.5 w-3.5 text-blue-200" /> : <Check className="h-3.5 w-3.5 opacity-70" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-end gap-2">
                  <div className="w-8 shrink-0">
                    <Avatar className="h-8 w-8 border border-border shadow-sm">
                      <AvatarImage src={activeConv.otherUserAvatar} />
                      <AvatarFallback className="text-[10px]">{activeConv.otherUserName.substring(0,2)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="rounded-2xl rounded-bl-sm bg-card border border-border/50 px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "0.15s" }}></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "0.3s" }}></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Sticky Input Area */}
            <div className="border-t border-border/50 bg-background/95 backdrop-blur px-4 py-3 sm:px-6">
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary">
                  <Paperclip className="h-5 w-5" />
                </Button>
                
                <div className="relative flex-1">
                  <textarea
                    value={chatInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (chatInput.trim()) sendMessageAction({ body: chatInput.trim() });
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full resize-none rounded-3xl border-none bg-secondary/60 py-3 pl-4 pr-12 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/50 scrollbar-none"
                    rows={1}
                    style={{ minHeight: "44px", maxHeight: "120px" }}
                  />
                  <Button 
                    size="icon"
                    onClick={() => { if (chatInput.trim()) sendMessageAction({ body: chatInput.trim() }); }}
                    className={`absolute bottom-1.5 right-1.5 h-8 w-8 rounded-full shadow-md transition-transform ${chatInput.trim() ? "scale-100 bg-primary" : "scale-0"}`}
                  >
                    <Send className="h-4 w-4 ml-0.5" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
