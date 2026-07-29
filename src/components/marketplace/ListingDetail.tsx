import {
  AlertOctagon,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Heart,
  Image as ImageIcon,
  Info,
  MapPin,
  Maximize2,
  MessageSquare,
  PackageCheck,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Star,
  Tag,
  Users,
  X,
  Share2,
  DollarSign,
  HeartCrack,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { type MarketplaceListing, timeAgo, formatPrice } from "@/lib/marketplace";
import { ProductCard } from "./ProductCard";

interface ListingDetailProps {
  listing: MarketplaceListing;
  isSaved: boolean;
  onSave: (id: string) => void;
  onBack: () => void;
  onChat: (id: string) => void;
  onReport: (id: string) => void;
  relatedListings?: MarketplaceListing[];
  onViewRelated?: (id: string) => void;
  savedItems?: string[];
  recentlyViewedListings?: MarketplaceListing[];
}

export function ListingDetail({
  listing,
  isSaved,
  onSave,
  onBack,
  onChat,
  onReport,
  relatedListings = [],
  onViewRelated,
  savedItems = [],
  recentlyViewedListings = [],
}: ListingDetailProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  // Modals state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; body: string; time: string }>>([]);
  const [chatInput, setChatInput] = useState("");

  const [callOpen, setCallOpen] = useState(false);
  const [phoneRequested, setPhoneRequested] = useState(false);
  const [phoneRequestMsg, setPhoneRequestMsg] = useState("Hi, I'm interested in your item. Can I have your phone number to coordinate?");

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState(String(listing.price));
  const [offerMsg, setOfferMsg] = useState("");

  const images = listing.images.length ? listing.images : [""];
  const activeImage = images[activeImageIndex] ?? images[0];
  const sellerVerified = listing.sellerRating >= 4.5;
  const status = listing.status === "active" ? "Available" : listing.status === "sold" ? "Sold" : "Reserved";
  const originalPrice = listing.originalPrice || (listing.price > 0 ? Math.ceil((listing.price * 1.18) / 50) * 50 : 0);
  const discount = listing.price > 0 && originalPrice > listing.price
    ? Math.round(((originalPrice - listing.price) / originalPrice) * 100)
    : 0;
  const responseRate = `${Math.min(99, Math.round(listing.sellerRating * 20))}%`;
  
  const joinedDate = useMemo(
    () =>
      new Date(listing.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      }),
    [listing.createdAt],
  );
  
  const updatedDate = useMemo(
    () =>
      new Date(listing.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [listing.createdAt],
  );

  const campus = listing.campus || listing.sellerCourse || "Nexora Main Campus";
  const hostel = listing.pickup || (/hostel|hall/i.test(listing.pickupArea) ? listing.pickupArea : "Campus pickup");

  const filteredRecentlyViewed = useMemo(() => {
    return recentlyViewedListings.filter((item) => item.id !== listing.id);
  }, [recentlyViewedListings, listing.id]);

  const showPrevImage = () => {
    setActiveImageIndex((index) => (index === 0 ? images.length - 1 : index - 1));
    setImageZoomed(false);
  };

  const showNextImage = () => {
    setActiveImageIndex((index) => (index === images.length - 1 ? 0 : index + 1));
    setImageZoomed(false);
  };

  const handleGalleryKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowLeft") showPrevImage();
    if (event.key === "ArrowRight") showNextImage();
    if (event.key === "Escape") {
      setImageZoomed(false);
      setFullscreenOpen(false);
    }
  };

  const handleShare = () => {
    void navigator.clipboard?.writeText(window.location.href);
    alert("Listing link copied to clipboard!");
  };

  // Chat Handler
  const handleOpenChat = () => {
    onChat(listing.id); // Trigger analytical/parent callback
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const newMessage = {
      sender: "buyer",
      body: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const updatedMessages = [...chatMessages, newMessage];
    setChatMessages(updatedMessages);
    setChatInput("");

    // Persist to localStorage
    const localChats = localStorage.getItem("nexora_marketplace_chats");
    const chats = localChats ? JSON.parse(localChats) : [];
    const conversation = chats.find((c: any) => c.listingId === listing.id);
    if (conversation) {
      conversation.messages = updatedMessages;
      localStorage.setItem("nexora_marketplace_chats", JSON.stringify(chats));
    }

    // Simulate seller auto-reply
    setTimeout(() => {
      const sellerReply = {
        sender: "seller",
        body: `Hi! Thanks for reaching out. Yes, the item is still available. Would you like to meet up?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => {
        const next = [...prev, sellerReply];
        const currentChats = JSON.parse(localStorage.getItem("nexora_marketplace_chats") || "[]");
        const currentConv = currentChats.find((c: any) => c.listingId === listing.id);
        if (currentConv) {
          currentConv.messages = next;
          localStorage.setItem("nexora_marketplace_chats", JSON.stringify(currentChats));
        }
        return next;
      });
    }, 1500);
  };

  // Call Handler
  const handleOpenCall = () => {
    const isOwner = listing.sellerId === "current-student" || listing.sellerId === "current-user";
    const localCallRequests = localStorage.getItem("nexora_call_requests");
    const requests = localCallRequests ? JSON.parse(localCallRequests) : [];
    const existing = requests.find((r: any) => r.listingId === listing.id);

    if (isOwner || (existing && existing.status === "approved")) {
      setPhoneRequested(true);
    } else {
      setPhoneRequested(false);
    }
    setCallOpen(true);
  };

  const handleRequestPhone = () => {
    const localCallRequests = localStorage.getItem("nexora_call_requests");
    const requests = localCallRequests ? JSON.parse(localCallRequests) : [];
    
    const existing = requests.find((r: any) => r.listingId === listing.id);
    if (!existing) {
      requests.push({
        listingId: listing.id,
        status: "approved", // instantly approve for mock demo purpose
        requestMessage: phoneRequestMsg
      });
      localStorage.setItem("nexora_call_requests", JSON.stringify(requests));
    }
    
    setPhoneRequested(true);
  };

  // Share Handler
  const handleShareButton = () => {
    handleShare();
  };

  // Report Handler
  const handleReportSubmit = async () => {
    if (!reportReason) {
      alert("Please select a reason for reporting.");
      return;
    }

    try {
      const { reportMarketplaceItem } = await import("@/services/marketplace.service");
      await reportMarketplaceItem(listing.id, reportReason, reportDetails);
      alert("Report submitted successfully! Thank you for keeping the campus marketplace safe.");
      setReportOpen(false);
      onReport(listing.id); // Trigger analytic/parent callback
    } catch (err) {
      alert("Failed to submit report. Please try again later.");
    }
  };

  // Make Offer Handler
  const handleMakeOffer = () => {
    setOfferOpen(true);
  };

  const handleSubmitOffer = () => {
    if (!offerAmount || Number(offerAmount) <= 0) {
      alert("Please enter a valid offer amount.");
      return;
    }

    const localOffers = localStorage.getItem("nexora_marketplace_offers");
    const offers = localOffers ? JSON.parse(localOffers) : [];

    offers.push({
      listingId: listing.id,
      amount: Number(offerAmount),
      message: offerMsg,
      status: "pending",
      timestamp: new Date().toISOString()
    });
    localStorage.setItem("nexora_marketplace_offers", JSON.stringify(offers));

    // Also notify seller in chat
    const localChats = localStorage.getItem("nexora_marketplace_chats");
    const chats = localChats ? JSON.parse(localChats) : [];
    let conversation = chats.find((c: any) => c.listingId === listing.id);
    const offerMessageText = `📢 I've made an offer of ₹${offerAmount}! ${offerMsg ? `Message: "${offerMsg}"` : ""}`;
    
    if (conversation) {
      conversation.messages.push({
        sender: "buyer",
        body: offerMessageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } else {
      conversation = {
        id: `chat-${Date.now()}`,
        listingId: listing.id,
        listingTitle: listing.title,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        sellerAvatar: listing.sellerAvatar,
        messages: [
          { sender: "system", body: `Conversation started regarding "${listing.title}"`, time: new Date().toLocaleTimeString() },
          { sender: "buyer", body: offerMessageText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]
      };
      chats.push(conversation);
    }
    localStorage.setItem("nexora_marketplace_chats", JSON.stringify(chats));

    alert(`Offer of ₹${offerAmount} sent to ${listing.sellerName}!`);
    setOfferOpen(false);
  };

  // Parsing custom specifications dynamically
  const specs = useMemo(() => {
    const defaultSpecs = [
      { label: "Category", value: listing.category, icon: <PackageCheck className="h-4 w-4 text-primary" /> },
      { label: "Condition", value: listing.condition, icon: <Tag className="h-4 w-4 text-primary" /> },
      { label: "Campus", value: campus, icon: <MapPin className="h-4 w-4 text-primary" /> },
      { label: "Negotiable", value: listing.isNegotiable ? "Yes" : "No", icon: <DollarSign className="h-4 w-4 text-primary" /> },
    ];
    
    if (listing.specifications) {
      try {
        if (typeof listing.specifications === "string") {
          if (listing.specifications.includes(":")) {
            const parsed = listing.specifications.split(",").map((s) => {
              const parts = s.split(":");
              return { 
                label: parts[0]?.trim() || "Detail", 
                value: parts[1]?.trim() || "", 
                icon: <Info className="h-4 w-4 text-primary" /> 
              };
            });
            return [...defaultSpecs, ...parsed];
          } else {
            return [...defaultSpecs, { label: "Attributes", value: listing.specifications, icon: <Info className="h-4 w-4 text-primary" /> }];
          }
        }
      } catch (e) {
        console.error("Error parsing specs:", e);
      }
    }
    return defaultSpecs;
  }, [listing, campus]);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-5 lg:px-6">
      {/* ── BREADCRUMBS & BACK BUTTON ── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-black shadow-soft transition hover:-translate-y-0.5 hover:bg-secondary active:scale-95 duration-150"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to marketplace
        </button>

        <nav className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-black text-muted-foreground">
          <span>Marketplace</span>
          <ChevronRight className="h-3 w-3" />
          <span>{listing.category}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="max-w-[180px] truncate text-foreground">{listing.title}</span>
        </nav>
      </div>

      {/* ── HERO SECTION: GALLERY (55%) & PRIMARY DETAILS (45%) ── */}
      <div className="grid gap-5 lg:grid-cols-[1.22fr_1fr] lg:items-stretch">
        
        {/* LEFT GALLERY CARD (55% width) */}
        <section className="rounded-3xl border border-border bg-paper p-5 shadow-soft flex flex-col justify-between h-full">
          <div className="grid gap-5 md:grid-cols-[80px_1fr] h-full items-stretch">
            
            {/* Side Thumbnails Column */}
            <div className="order-2 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] md:order-1 md:flex-col md:overflow-y-auto md:pb-0 md:max-h-[480px] [&::-webkit-scrollbar]:hidden">
              {images.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={() => {
                    setActiveImageIndex(index);
                    setImageZoomed(false);
                  }}
                  className={`aspect-square w-16 shrink-0 overflow-hidden rounded-2xl border transition-all duration-200 hover:scale-105 md:w-full ${
                    activeImageIndex === index
                      ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-paper shadow-md scale-[1.02]"
                      : "border-border/60 opacity-70 hover:opacity-100 hover:border-border"
                  }`}
                  aria-label={`Show image ${index + 1}`}
                >
                  {src ? (
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="m-auto h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>

            {/* Main Viewport */}
            <div className="order-1 relative overflow-hidden rounded-2xl border border-border bg-background shadow-inner md:order-2 flex flex-col h-full min-h-[320px] md:min-h-[480px] flex-1">
              <button
                type="button"
                onClick={() => setImageZoomed((value) => !value)}
                onKeyDown={handleGalleryKeyDown}
                className={`group/image relative aspect-[4/3] w-full bg-black/5 md:aspect-auto md:flex-1 flex items-center justify-center overflow-hidden ${
                  imageZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
                }`}
                aria-label={imageZoomed ? "Zoom out product image" : "Zoom product image"}
              >
                {/* Blurred background image overlay to eliminate solid grey zones */}
                {activeImage && (
                  <div className="absolute inset-0 select-none opacity-25 blur-2xl scale-110 pointer-events-none">
                    <img src={activeImage} alt="" className="h-full w-full object-cover" />
                  </div>
                )}

                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={listing.title}
                    className={`relative z-10 h-full w-full object-contain transition duration-500 ${
                      imageZoomed ? "scale-125" : "scale-100 group-hover/image:scale-[1.03]"
                    }`}
                  />
                ) : (
                  <div className="relative z-10 grid h-full w-full place-items-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 stroke-[1.5]" />
                  </div>
                )}
              </button>

              {/* Navigation overlays */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); showPrevImage(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 grid h-9 w-9 place-items-center rounded-full border border-border/80 bg-paper/95 text-foreground opacity-0 shadow-md backdrop-blur transition-all group-hover/image:opacity-100 hover:bg-secondary active:scale-95"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); showNextImage(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 grid h-9 w-9 place-items-center rounded-full border border-border/80 bg-paper/95 text-foreground opacity-0 shadow-md backdrop-blur transition-all group-hover/image:opacity-100 hover:bg-secondary active:scale-95"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Index counter badge */}
              <div className="absolute left-3 top-3 z-20 flex gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/80 px-2.5 py-1 text-[9px] font-black text-background shadow-soft backdrop-blur-md">
                  <ImageIcon className="h-2.5 w-2.5" />
                  {activeImageIndex + 1} / {images.length}
                </span>
              </div>

              {/* Action icon overlays */}
              <div className="absolute bottom-3 right-3 z-20 flex gap-1.5">
                <IconButton label="Fullscreen" onClick={() => setFullscreenOpen(true)} icon={<Maximize2 className="h-3.5 w-3.5" />} />
                <IconButton label={isSaved ? "Saved" : "Save"} active={isSaved} onClick={() => onSave(listing.id)} icon={<Heart className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`} />} />
                <IconButton label="Share" onClick={handleShareButton} icon={<Share2 className="h-3.5 w-3.5" />} />
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT DETAILS CARD (45% width, fills height) */}
        <section className="rounded-3xl border border-border bg-paper p-5 shadow-soft flex flex-col justify-between h-full min-w-0">
          <div className="space-y-4">
            
            {/* Title & Listed Time */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={status} />
                <span className="text-[10px] font-bold text-muted-foreground/85 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Listed {timeAgo(listing.createdAt)}
                </span>
              </div>
              <h1 className="font-display text-2.5xl font-black leading-tight text-foreground tracking-tight pt-1">
                {listing.title}
              </h1>
            </div>

            {/* Premium Info Chips */}
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-black uppercase text-primary tracking-wider border border-primary/15 hover:bg-primary/15 transition-all">
                <PackageCheck className="h-2.5 w-2.5" />
                {listing.condition}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[9px] font-black uppercase text-muted-foreground tracking-wider border border-border/40 hover:bg-border/20 transition-all">
                <Tag className="h-2.5 w-2.5" />
                {listing.category}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[9px] font-black uppercase text-muted-foreground tracking-wider border border-border/40 hover:bg-border/20 transition-all">
                <MapPin className="h-2.5 w-2.5" />
                {campus.split(" ")[0]} campus
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border transition-all ${
                listing.isNegotiable 
                  ? "bg-success/10 text-success border-success/10 hover:bg-success/15" 
                  : "bg-muted text-muted-foreground border-border/60"
              }`}>
                <Info className="h-2.5 w-2.5" />
                {listing.isNegotiable ? "Negotiable" : "Fixed Price"}
              </span>
            </div>

            {/* Price */}
            <div className="flex flex-wrap items-baseline gap-2 border-t border-border/40 pt-3">
              <span className="font-display text-3xl font-black tracking-tight text-foreground">
                {listing.price === 0 ? "Free" : formatPrice(listing.price)}
              </span>
              {originalPrice > listing.price && (
                <>
                  <span className="text-xs font-black text-muted-foreground line-through">
                    {formatPrice(originalPrice)}
                  </span>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-bold text-success border border-success/10">
                    {discount}% off
                  </span>
                </>
              )}
            </div>

            {/* Description (Read More / Less) */}
            <div className="space-y-1 border-t border-border/40 pt-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">About this item</h4>
              <DescriptionText text={listing.description} />
            </div>

            {/* Compact Premium Seller Card (Always Visible) */}
            <div className="rounded-2xl border border-border/70 bg-secondary/15 p-3.5 space-y-3 hover:border-border transition-all duration-200">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <Avatar className="h-11 w-11 border-2 border-border shadow-soft">
                      <AvatarImage src={listing.sellerAvatar} />
                      <AvatarFallback className="bg-primary/10 font-black text-primary text-sm">
                        {listing.sellerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {sellerVerified && (
                      <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-white border-2 border-paper">
                        <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-xs font-black text-foreground flex items-center gap-1">
                      {listing.sellerName}
                    </h3>
                    <p className="truncate text-[10px] font-semibold text-muted-foreground leading-tight">
                      {listing.sellerCourse}
                    </p>
                    <p className="text-[9px] font-bold text-success flex items-center gap-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                      Active recently
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={handleOpenCall} 
                  className="shrink-0 inline-flex items-center gap-1 rounded-full bg-success/15 hover:bg-success/20 px-2.5 py-1 text-[9px] font-black text-success border border-success/10 transition-all active:scale-95"
                >
                  <Phone className="h-3 w-3" />
                  Call
                </button>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/40 text-center">
                <div className="bg-paper py-2 px-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Rating</span>
                  <span className="mt-0.5 font-display text-xs font-black text-foreground inline-flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {listing.sellerRating}
                  </span>
                </div>
                <div className="bg-paper py-2 px-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Replies</span>
                  <span className="mt-0.5 font-display text-xs font-black text-foreground">{responseRate}</span>
                </div>
                <div className="bg-paper py-2 px-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Joined</span>
                  <span className="mt-0.5 font-display text-[9px] font-black text-foreground">{joinedDate}</span>
                </div>
              </div>

              {/* Listings & Activity Summary */}
              <div className="flex items-center justify-between text-[9px] font-semibold text-muted-foreground border-t border-border/40 pt-2 px-1">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3 text-primary" />
                  1+ active listing
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3 text-primary" />
                  Met at {hostel.split(" ")[0]}
                </span>
              </div>
            </div>

          </div>

          {/* CTAs */}
          <div className="mt-5 space-y-2.5">
            {/* Primary Action Button */}
            <Button
              className="h-11 w-full rounded-2xl font-black shadow-glow text-xs gap-2 transition-all hover:scale-[1.01] active:scale-95"
              onClick={handleOpenChat}
            >
              <MessageSquare className="h-4 w-4" />
              Chat with Seller
            </Button>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                className="h-10 rounded-2xl border-border bg-card font-bold text-xs gap-1.5 hover:bg-secondary transition-all active:scale-[0.97]"
                onClick={handleMakeOffer}
              >
                <DollarSign className="h-3.5 w-3.5" />
                Make Offer
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-2xl border-border bg-card font-bold text-xs gap-1.5 hover:bg-secondary transition-all active:scale-[0.97]"
                onClick={() => onSave(listing.id)}
              >
                <Heart className={`h-3.5 w-3.5 ${isSaved ? "fill-warm text-warm" : ""}`} />
                {isSaved ? "Saved" : "Save Item"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                className="h-10 rounded-2xl border-border bg-card font-bold text-xs gap-1.5 hover:bg-secondary transition-all active:scale-[0.97]"
                onClick={handleShareButton}
              >
                <Share2 className="h-3.5 w-3.5" />
                Share Link
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/5 font-bold text-xs gap-1.5 transition-all active:scale-[0.97]"
                onClick={() => setReportOpen(true)}
              >
                <AlertOctagon className="h-3.5 w-3.5" />
                Report Listing
              </Button>
            </div>
          </div>
        </section>

      </div>

      {/* ── SECONDARY EXPANDABLE SECTIONS ── */}
      <div className="mt-6 space-y-3">
        {/* Accordion 1: Specifications */}
        <AccordionSection 
          title="Specifications" 
          preview={`${listing.category} • ${listing.condition} • ${listing.isNegotiable ? "Negotiable" : "Fixed Price"}`}
        >
          <div className="divide-y divide-border/60">
            {specs.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-3 text-sm">
                <span className="font-semibold text-muted-foreground flex items-center gap-2">
                  <span className="text-primary">{s.icon}</span>
                  {s.label}
                </span>
                <span className="font-bold text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* Accordion 2: Product Information */}
        <AccordionSection 
          title="Product Information" 
          preview={`${hostel.split(" ")[0]} pickup • Listed ${updatedDate.split(" ").slice(0, 2).join(" ")}`}
        >
          <div className="divide-y divide-border/60">
            <InfoRow label="Campus Location" value={campus} />
            <InfoRow label="Specific Pickup Point" value={hostel} />
            <InfoRow label="Views Tracked" value={`${listing.views} views`} />
            <InfoRow label="Saved count" value={`${listing.saves} times`} />
            <InfoRow label="Interested inquiries" value={`${listing.offerCount} students`} />
            <InfoRow label="Original list date" value={updatedDate} />
            <InfoRow label="Listing ID" value={listing.id} copyable />
          </div>
        </AccordionSection>

        {/* Accordion 3: Seller Reviews */}
        <AccordionSection 
          title="Seller Reviews & Detailed Info" 
          preview={`Verified • Rating ${listing.sellerRating} • 1 Listing`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border border-border shadow-soft">
                <AvatarImage src={listing.sellerAvatar} />
                <AvatarFallback className="bg-primary/10 font-black text-primary">
                  {listing.sellerName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-foreground">{listing.sellerName}</h3>
                  {sellerVerified && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground leading-tight">{listing.sellerCourse}</p>
              </div>
            </div>

            {/* Detailed reviews feedback block */}
            <div className="border-t border-border/60 pt-3">
              <div className="flex items-center gap-1 text-xs font-black text-foreground">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>Student Feedback</span>
              </div>
              <div className="mt-2 rounded-xl bg-background p-3.5 text-[11px] font-semibold text-muted-foreground leading-normal border border-border/60">
                <p>"Very quick response, honest about the condition, met right at the hostel lobby."</p>
                <p className="mt-1 text-right text-[9px] font-black text-foreground">— CSE 2nd Yr</p>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Accordion 4: Safety Guidelines */}
        <AccordionSection 
          title="Safety Guidelines" 
          preview="4 important tips"
        >
          <div className="flex gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Follow these precautions for a secure campus transaction.</p>
              <ul className="mt-3 space-y-2.5 text-xs font-semibold text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>Meet inside safe campus areas (Hostels, department lobbies, library plaza).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>Always inspect and test the item thoroughly before making any transfer.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>Never pay advances or deposit money through online apps before meeting.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>Report suspicious listings immediately to help maintain community safety.</span>
                </li>
              </ul>
            </div>
          </div>
        </AccordionSection>

        {/* Accordion 5: Flag / Report Listing */}
        <AccordionSection 
          title="Report / Flag Listing" 
          preview="Help us keep Marketplace safe"
        >
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground max-w-md leading-relaxed">
              Is this listing misleading, a scam, duplicates another post, or violates our marketplace policies? Report it for immediate moderation.
            </p>
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="min-h-9 rounded-full border-destructive/25 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-black shadow-sm"
                onClick={() => setReportOpen(true)}
              >
                Open Report Form
              </Button>
            </div>
          </div>
        </AccordionSection>
      </div>

      {/* ── SIMILAR PRODUCTS ── */}
      <div className="mt-9">
        <RelatedProducts
          listings={relatedListings.filter(r => r.id !== listing.id)}
          savedItems={savedItems}
          onSave={onSave}
          onChat={onChat}
          onViewRelated={onViewRelated}
          onBrowseMarketplace={onBack}
        />
      </div>

      {/* ── RECENTLY VIEWED LISTINGS ── */}
      {filteredRecentlyViewed.length > 0 && (
        <div className="mt-9 space-y-3">
          <div>
            <h2 className="font-display text-lg font-black text-foreground">Recently Viewed</h2>
            <p className="text-xs text-muted-foreground">Your recently browsed items</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRecentlyViewed.map((recent) => (
              <MiniProductCard
                key={recent.id}
                listing={recent}
                onClick={onViewRelated ?? (() => undefined)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── MOBILE FIXED BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-2 gap-3 border-t border-border bg-paper/95 px-4 py-3 pb-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] backdrop-blur-md md:hidden">
        <Button className="min-h-12 rounded-2xl font-black shadow-glow" onClick={handleOpenChat}>
          <MessageSquare className="h-4 w-4" />
          Chat
        </Button>
        <Button variant="outline" className="min-h-12 rounded-2xl border-2 bg-background font-black" onClick={handleOpenCall}>
          <Phone className="h-4 w-4" />
          Inquire
        </Button>
      </div>

      {/* ── FULLSCREEN GALLERY OVERLAY ── */}
      {fullscreenOpen && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-foreground/90 p-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setFullscreenOpen(false)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-background/20 text-white hover:bg-background/40 transition"
            aria-label="Close fullscreen gallery"
          >
            <X className="h-5 w-5" />
          </button>
          
          {images.length > 1 && (
            <button
              type="button"
              onClick={showPrevImage}
              className="absolute left-4 grid h-12 w-12 place-items-center rounded-full bg-background/20 text-white hover:bg-background/40 transition"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <img src={activeImage} alt={listing.title} className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg shadow-glow" />

          {images.length > 1 && (
            <button
              type="button"
              onClick={showNextImage}
              className="absolute right-4 grid h-12 w-12 place-items-center rounded-full bg-background/20 text-white hover:bg-background/40 transition"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}

      {/* ── REPORT MODAL ── */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-paper p-6 shadow-glow">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="font-display text-lg font-black text-foreground">Report Listing</h3>
              <button onClick={() => setReportOpen(false)} className="rounded-full p-1 hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Reason</label>
                <select 
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold outline-none"
                >
                  <option value="">Select a reason</option>
                  <option value="scam">Suspected scam / fraud</option>
                  <option value="misleading">Misleading information / wrong price</option>
                  <option value="inappropriate">Inappropriate content or language</option>
                  <option value="duplicate">Duplicate listing</option>
                  <option value="sold">Item already sold / unavailable</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">Details</label>
                <textarea 
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide additional details..."
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold outline-none resize-none"
                />
              </div>
              <Button onClick={handleReportSubmit} className="w-full rounded-xl font-black">Submit Report</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAKE OFFER MODAL ── */}
      {offerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-paper p-6 shadow-glow">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="font-display text-lg font-black text-foreground">Make an Offer</h3>
              <button onClick={() => setOfferOpen(false)} className="rounded-full p-1 hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Offer Amount (₹)</label>
                <input 
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">Message (Optional)</label>
                <textarea 
                  value={offerMsg}
                  onChange={(e) => setOfferMsg(e.target.value)}
                  placeholder="e.g. Can I pick it up today at the library plaza?"
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold outline-none resize-none"
                />
              </div>
              <Button onClick={handleSubmitOffer} className="w-full rounded-xl font-black">Send Offer</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── CALL MODAL ── */}
      {callOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-paper p-6 shadow-glow">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="font-display text-lg font-black text-foreground">Call Seller</h3>
              <button onClick={() => setCallOpen(false)} className="rounded-full p-1 hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {phoneRequested ? (
                <div className="text-center py-6 space-y-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                    <Phone className="h-6 w-6" />
                  </div>
                  <h4 className="font-display text-xl font-black text-foreground">+91 98765 43210</h4>
                  <p className="text-xs font-semibold text-muted-foreground">Coordinates: {hostel}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground">
                    For student safety, phone numbers are shared only upon request. Send a request to get the seller's contact details.
                  </p>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">Request Message</label>
                    <textarea 
                      value={phoneRequestMsg}
                      onChange={(e) => setPhoneRequestMsg(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold outline-none resize-none"
                    />
                  </div>
                  <Button onClick={handleRequestPhone} className="w-full rounded-xl font-black">Request Number</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CHAT SLIDE-OVER DRAWER ── */}
      {chatOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-paper shadow-2xl transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/80 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={listing.sellerAvatar} />
                <AvatarFallback>{listing.sellerName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-display text-sm font-black text-foreground">{listing.sellerName}</h3>
                <p className="text-[10px] font-semibold text-muted-foreground truncate max-w-[200px]">{listing.title}</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="rounded-full p-1 hover:bg-secondary">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex flex-col max-w-[80%] ${
                  msg.sender === "buyer" 
                    ? "ml-auto items-end" 
                    : msg.sender === "system"
                      ? "mx-auto items-center"
                      : "mr-auto items-start"
                }`}
              >
                {msg.sender !== "system" && (
                  <span className="text-[9px] font-bold text-muted-foreground mb-0.5">{msg.sender === "buyer" ? "You" : listing.sellerName}</span>
                )}
                <div 
                  className={`rounded-2xl px-4 py-2.5 text-xs font-semibold leading-relaxed ${
                    msg.sender === "buyer"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : msg.sender === "system"
                        ? "bg-secondary text-muted-foreground text-[10px] py-1"
                        : "bg-paper border border-border text-foreground rounded-tl-none"
                  }`}
                >
                  {msg.body}
                </div>
                {msg.sender !== "system" && (
                  <span className="text-[8px] font-semibold text-muted-foreground mt-0.5">{msg.time}</span>
                )}
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="border-t border-border/80 p-3 bg-background flex items-center gap-2">
            <input 
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border border-border bg-paper px-3 py-2 text-xs font-semibold outline-none"
            />
            <Button onClick={handleSendMessage} size="sm" className="rounded-xl font-black text-xs">Send</Button>
          </div>
        </div>
      )}
    </section>
  );
}

function AccordionSection({
  title,
  preview,
  defaultOpen = false,
  children,
}: {
  title: string;
  preview?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-3xl border border-border bg-paper shadow-soft overflow-hidden transition-all duration-300 hover:border-border/80">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between p-5 text-left font-display text-base font-black text-foreground hover:bg-secondary/15 transition-colors"
      >
        <div className="flex flex-1 flex-wrap items-center justify-between gap-2 pr-4">
          <span className="text-foreground">{title}</span>
          {!isOpen && preview && (
            <span className="text-xs font-bold text-muted-foreground/80 tracking-wide font-sans">
              {preview}
            </span>
          )}
        </div>
        <ChevronRight
          className={`h-4.5 w-4.5 text-muted-foreground transition-transform duration-300 shrink-0 ${
            isOpen ? "rotate-90 text-foreground" : ""
          }`}
        />
      </button>
      
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[1000px] opacity-100 border-t border-border/60" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function DescriptionText({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLong = text.length > 250 || text.split("\n").length > 4;

  return (
    <div className="space-y-1.5">
      <p
        className={`text-sm font-medium leading-relaxed text-muted-foreground/85 tracking-wide whitespace-pre-wrap transition-all duration-300 ${
          !isExpanded && isLong ? "line-clamp-4" : ""
        }`}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-xs font-bold text-primary hover:underline hover:text-primary-hover focus:outline-none transition-colors"
        >
          {isExpanded ? "Read Less" : "Read More"}
        </button>
      )}
    </div>
  );
}

function RelatedProducts({
  listings,
  savedItems,
  onSave,
  onChat,
  onViewRelated,
  onBrowseMarketplace,
}: {
  listings: MarketplaceListing[];
  savedItems: string[];
  onSave: (id: string) => void;
  onChat: (id: string) => void;
  onViewRelated?: (id: string) => void;
  onBrowseMarketplace?: () => void;
}) {
  return (
    <section className="rounded-3xl border border-border bg-paper p-5 shadow-soft transition-all duration-300 hover:shadow-md">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-black text-foreground">Similar Products</h2>
          <p className="text-xs text-muted-foreground">Handpicked student items from the same category</p>
        </div>
      </div>
      {listings.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {listings.slice(0, 4).map((related) => (
            <HorizontalProductCard
              key={related.id}
              listing={related}
              onClick={onViewRelated ?? (() => undefined)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/80 bg-paper py-10 px-6 text-center shadow-inner">
          <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50 text-muted-foreground/75">
            <svg
              className="h-10 w-10 text-muted-foreground/45"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-background shadow-soft">
              <Users className="h-3.5 w-3.5 text-white" />
            </span>
          </div>
          <h3 className="font-display text-base font-black text-foreground">No similar listings found</h3>
          <p className="mt-1.5 text-xs font-semibold text-muted-foreground max-w-sm leading-relaxed">
            There are currently no other student listings in this category. Be the first to list or browse other sections!
          </p>
          <Button
            onClick={onBrowseMarketplace}
            className="mt-5 h-9 rounded-full bg-primary font-black px-6 text-xs gap-1.5 shadow-soft hover:bg-primary-hover active:scale-95 transition-all duration-150"
          >
            Browse Marketplace
          </Button>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "Sold"
      ? "bg-muted text-muted-foreground"
      : status === "Reserved"
        ? "bg-amber-500/10 text-amber-500"
        : "bg-success/15 text-success";
  return <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${className}`}>{status}</span>;
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-background p-3.5 text-xs">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary/70 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate font-black text-foreground">{value}</p>
      </div>
    </div>
  );
}

function IconButton({ label, icon, active = false, onClick }: { label: string; icon: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid h-8.5 w-8.5 place-items-center rounded-full border shadow-soft backdrop-blur transition-all duration-150 hover:-translate-y-0.5 active:scale-90 ${
        active ? "border-amber-500 bg-amber-500 text-white" : "border-background/70 bg-paper/90 text-foreground hover:bg-secondary"
      }`}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

function InfoRow({ label, value, copyable = false }: { label: string; value: string; copyable?: boolean }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    alert("Copied Listing ID to clipboard!");
  };

  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <span className="font-semibold text-muted-foreground">{label}</span>
      <span className="font-bold text-foreground">
        {copyable ? (
          <button
            onClick={handleCopy}
            className="hover:underline flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
            title="Click to copy ID"
          >
            {value.slice(0, 8)}...{value.slice(-8)}
            <span className="text-[10px] rounded bg-secondary px-1.5 py-0.5 font-sans font-bold">Copy</span>
          </button>
        ) : (
          value
        )}
      </span>
    </div>
  );
}

function MiniProductCard({
  listing,
  onClick,
}: {
  listing: MarketplaceListing;
  onClick: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(listing.id)}
      className="group flex gap-3.5 rounded-2xl border border-border/50 bg-paper p-3.5 text-left transition-all hover:bg-secondary/40 hover:-translate-y-0.5 w-full min-w-0 hover:shadow-soft active:scale-[0.98] duration-200"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted relative">
        <img
          src={listing.images[0]}
          alt=""
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
        <div className="space-y-1">
          <h4 className="truncate text-xs font-black text-foreground group-hover:text-primary transition-colors leading-snug">
            {listing.title}
          </h4>
          <p className="text-[10px] font-bold text-muted-foreground">{listing.category}</p>
        </div>
        
        <div className="flex items-baseline justify-between gap-1 mt-1 border-t border-border/40 pt-1.5">
          <span className="font-display text-sm font-black text-foreground">
            {listing.price === 0 ? "Free" : formatPrice(listing.price)}
          </span>
          <span className="text-[9px] font-bold text-muted-foreground">{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </button>
  );
}

function HorizontalProductCard({
  listing,
  onClick,
}: {
  listing: MarketplaceListing;
  onClick: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(listing.id)}
      className="group flex gap-4 rounded-2xl border border-border bg-paper p-4 text-left transition-all hover:bg-secondary/35 hover:-translate-y-0.5 w-full hover:shadow-soft active:scale-[0.99] duration-200"
    >
      <div className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-muted relative">
        <img
          src={listing.images[0]}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 rounded-full bg-foreground/75 px-2 py-0.5 text-[9px] font-black uppercase text-background tracking-wider">
          {listing.condition}
        </span>
      </div>
      
      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{listing.category}</p>
          <h4 className="truncate text-sm font-black text-foreground group-hover:text-primary transition-colors">
            {listing.title}
          </h4>
          <p className="text-[11px] font-semibold text-muted-foreground truncate">
            {listing.pickup || "Campus pickup"}
          </p>
        </div>
        
        <div className="flex items-baseline justify-between gap-2 border-t border-border/40 pt-2 mt-1">
          <span className="font-display text-base font-black text-foreground">
            {listing.price === 0 ? "Free" : formatPrice(listing.price)}
          </span>
          <span className="text-[9px] font-bold text-muted-foreground">{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </button>
  );
}
