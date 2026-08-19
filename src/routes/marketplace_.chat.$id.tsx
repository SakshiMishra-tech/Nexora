import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
} from "react";
import {
  ChevronLeft,
  Send,
  MoreVertical,
  ShieldAlert,
  CheckCheck,
  Check,
  Copy,
  Trash2,
  UserX,
  Flag,
  X,
  Smile,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markMessagesRead,
  deleteMessageForMe,
  deleteMessageForEveryone,
  blockUser,
  reportUser,
  subscribeToMessages,
  unsubscribeFromMessages,
  groupMessagesByDate,
  isMessageVisibleTo,
  formatChatTime,
  REPORT_REASONS,
  type ChatMessage,
  type ChatConversation,
  type ReportReason,
} from "@/services/chat.service";
import { getMarketplaceItem } from "@/services/marketplace.service";
import { type MarketplaceListing, seedListings } from "@/lib/marketplace";

export const Route = createFileRoute("/marketplace_/chat/$id")({
  head: () => ({ meta: [{ title: "Nexora — Chat" }] }),
  component: MarketplaceChatPage,
});

// ── Common emoji set ─────────────────────────────────────────
const EMOJI_SET = [
  "😊","😂","❤️","👍","🙏","😍","🤔","😅","🔥","✅",
  "😭","💯","🎉","😁","🤣","💪","😎","🥺","😢","👏",
  "🤝","😄","🙌","💰","📦","📸","✨","🚀","⭐","💬",
];

// ── Main Component ────────────────────────────────────────────
function MarketplaceChatPage() {
  const { id: listingId } = Route.useParams();
  const navigate = useNavigate();

  // Auth
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Listing / conversation data
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherUserProfile, setOtherUserProfile] = useState<{
    id: string;
    name: string;
    avatar: string;
    online: boolean;
  } | null>(null);

  // UI state
  const [loadingState, setLoadingState] = useState<"loading" | "ready" | "error">("loading");
  const [isBlocked, setIsBlocked] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSafetyBanner, setShowSafetyBanner] = useState(true);
  const [showMenuId, setShowMenuId] = useState<string | null>(null); // message context menu
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("Spam");
  const [reportDesc, setReportDesc] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isConfirmingBlock, setIsConfirmingBlock] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof subscribeToMessages> | null>(null);

  // ── Init: get current user ──────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.id) {
        setCurrentUserId(data.session.user.id);
      }
    });
  }, []);

  // ── Load listing ───────────────────────────────────────────
  useEffect(() => {
    if (!listingId) return;
    getMarketplaceItem(listingId)
      .then((item) => {
        if (item) setListing(item);
        else {
          const seedMatch = seedListings.find((l) => l.id === listingId);
          if (seedMatch) setListing(seedMatch);
          else setLoadingState("error");
        }
      })
      .catch(() => {
        const seedMatch = seedListings.find((l) => l.id === listingId);
        if (seedMatch) setListing(seedMatch);
        else setLoadingState("error");
      });
  }, [listingId]);

  // ── Init conversation + messages once we have listing + user ─
  useEffect(() => {
    if (!listing || !currentUserId) return;

    async function init() {
      try {
        setLoadingState("loading");

        // Determine the other user
        const sellerId = listing!.sellerId;
        const isSeller = currentUserId === sellerId;

        // Get or create conversation
        const conv = await getOrCreateConversation(listing!.id, sellerId);
        setConversation(conv);

        // Determine other user id
        const otherUserId = isSeller ? conv.buyer_id : conv.seller_id;

        // Fetch other user's profile from Supabase profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", otherUserId)
          .maybeSingle();

        const otherName = isSeller
          ? (profile?.full_name || "Buyer")
          : listing!.sellerName || "Seller";
        const otherAvatar =
          profile?.avatar_url ||
          (isSeller ? "" : listing!.sellerAvatar) ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(otherName)}&background=6366f1&color=fff`;

        setOtherUserProfile({
          id: otherUserId,
          name: otherName,
          avatar: otherAvatar,
          online: false, // Supabase Presence would be needed for true online status
        });

        // Fetch messages
        const msgs = await getMessages(conv.id);
        setMessages(msgs);

        // Mark received messages as read
        await markMessagesRead(conv.id);

        setLoadingState("ready");

        // Subscribe realtime
        channelRef.current = subscribeToMessages(
          conv.id,
          (newMsg) => {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            // Mark as read if we're the receiver
            if (newMsg.receiver_id === currentUserId) {
              markMessagesRead(conv.id).catch(() => {});
            }
          },
          (updatedMsg) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
            );
          }
        );
      } catch (err: any) {
        console.error("[chat] init error:", err);
        setLoadingState("error");
      }
    }

    init();

    return () => {
      if (channelRef.current) {
        unsubscribeFromMessages(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [listing, currentUserId]);

  // ── Auto-scroll to latest message ─────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Close header menu on outside click ────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        headerMenuRef.current &&
        !headerMenuRef.current.contains(e.target as Node)
      ) {
        setShowHeaderMenu(false);
      }
    }
    if (showHeaderMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showHeaderMenu]);

  // ── Close message context menu on outside click ────────────
  useEffect(() => {
    if (!showMenuId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-msg-menu]")) setShowMenuId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenuId]);

  // ── Send message ─────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !conversation || !otherUserProfile || isSending || isBlocked) return;

    setIsSending(true);
    setInputText("");
    setShowEmojiPicker(false);

    try {
      const msg = await sendMessage(conversation.id, otherUserProfile.id, text);
      // Optimistically add (realtime will dedupe)
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to send message");
      setInputText(text); // restore
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [inputText, conversation, otherUserProfile, isSending, isBlocked]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Delete for me ─────────────────────────────────────────
  const handleDeleteForMe = async (msgId: string) => {
    if (!currentUserId) return;
    setShowMenuId(null);
    try {
      await deleteMessageForMe(msgId, currentUserId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, deleted_for_users: [...m.deleted_for_users, currentUserId] }
            : m
        )
      );
    } catch {
      toast.error("Could not delete message");
    }
  };

  // ── Delete for everyone ───────────────────────────────────
  const handleDeleteForEveryone = async (msgId: string) => {
    setShowMenuId(null);
    try {
      await deleteMessageForEveryone(msgId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, deleted_for_everyone: true, content: "This message was deleted" }
            : m
        )
      );
    } catch {
      toast.error("Could not delete message");
    }
  };

  // ── Copy message ─────────────────────────────────────────
  const handleCopy = (content: string) => {
    setShowMenuId(null);
    navigator.clipboard.writeText(content).then(() => toast.success("Copied!"));
  };

  // ── Block user ────────────────────────────────────────────
  const handleBlock = async () => {
    if (!otherUserProfile) return;
    setIsConfirmingBlock(true);
    try {
      await blockUser(otherUserProfile.id);
      setIsBlocked(true);
      setShowBlockConfirm(false);
      setShowHeaderMenu(false);
      toast.success(`${otherUserProfile.name} has been blocked.`);
    } catch {
      toast.error("Failed to block user");
    } finally {
      setIsConfirmingBlock(false);
    }
  };

  // ── Report user ───────────────────────────────────────────
  const handleReport = async () => {
    if (!otherUserProfile) return;
    setIsSubmittingReport(true);
    try {
      await reportUser(otherUserProfile.id, reportReason, reportDesc);
      setShowReportModal(false);
      setShowHeaderMenu(false);
      setReportDesc("");
      toast.success("Report submitted. Thank you for keeping Nexora safe.");
    } catch {
      toast.error("Failed to submit report");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // ── View profile ─────────────────────────────────────────
  const handleViewProfile = () => {
    setShowHeaderMenu(false);
    if (otherUserProfile) {
      window.location.href = `/marketplace/seller/${otherUserProfile.id}`;
    }
  };

  // ── Message groups ────────────────────────────────────────
  const messageGroups = groupMessagesByDate(messages);

  // ── Loading / Error screens ───────────────────────────────
  if (loadingState === "loading") {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading chat…</p>
        </div>
      </div>
    );
  }

  if (loadingState === "error") {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <p className="text-foreground font-bold">Could not load chat</p>
          <p className="text-sm text-muted-foreground">
            Make sure you're logged in and try again.
          </p>
          <button
            onClick={() => {
              if (window.history.length > 2) window.history.back();
              else navigate({ to: "/marketplace" });
            }}
            className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col bg-[#0a0a0f] text-foreground"
      style={{ fontFamily: "var(--font-sans, system-ui)" }}
    >
      {/* ══════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════ */}
      <header className="shrink-0 h-14 flex items-center justify-between px-3 sm:px-4 bg-[#111118] border-b border-white/[0.06] z-20">
        {/* Left: back + avatar + name */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 2) window.history.back();
              else navigate({ to: "/marketplace" });
            }}
            className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-muted-foreground hover:bg-white/10 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {otherUserProfile && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={otherUserProfile.avatar}
                  alt={otherUserProfile.name}
                  className="h-9 w-9 rounded-full object-cover border border-white/10"
                />
                {/* Online dot — static for now; true presence needs Supabase Presence API */}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#111118]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate leading-tight">
                  {otherUserProfile.name}
                </p>
                <p className="text-[11px] text-emerald-400 font-medium">Online</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: listing info + menu */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Compact product pill */}
          {listing && (
            <Link
              to="/marketplace/product/$id"
              params={{ id: listing.id }}
              className="hidden sm:flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 hover:bg-white/[0.08] transition-colors"
            >
              <img
                src={listing.images[0] || ""}
                alt={listing.title}
                className="h-7 w-7 rounded-lg object-cover bg-white/10"
              />
              <div className="min-w-0 max-w-[140px]">
                <p className="text-xs font-semibold truncate text-foreground/90">{listing.title}</p>
                <p className="text-[11px] font-bold text-emerald-400">
                  ₹{listing.price.toLocaleString("en-IN")}
                </p>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground/60 shrink-0" />
            </Link>
          )}

          {/* ⋮ Menu */}
          <div className="relative" ref={headerMenuRef}>
            <button
              type="button"
              id="chat-header-menu-btn"
              onClick={() => setShowHeaderMenu((v) => !v)}
              className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-white/10 transition-colors"
              aria-label="Options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showHeaderMenu && (
              <div className="absolute right-0 top-10 w-48 rounded-2xl border border-white/[0.08] bg-[#1a1a26] shadow-2xl shadow-black/50 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <MenuButton
                  icon={<ExternalLink className="h-4 w-4" />}
                  label="View Profile"
                  onClick={handleViewProfile}
                />
                <div className="my-1 h-px bg-white/[0.06]" />
                <MenuButton
                  icon={<UserX className="h-4 w-4" />}
                  label="Block User"
                  onClick={() => { setShowHeaderMenu(false); setShowBlockConfirm(true); }}
                  danger
                />
                <MenuButton
                  icon={<Flag className="h-4 w-4" />}
                  label="Report User"
                  onClick={() => { setShowHeaderMenu(false); setShowReportModal(true); }}
                  danger
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          PRODUCT CONTEXT BANNER (mobile — below header)
      ══════════════════════════════════════════════════════ */}
      {listing && (
        <Link
          to="/marketplace/product/$id"
          params={{ id: listing.id }}
          className="sm:hidden shrink-0 flex items-center gap-3 px-3 py-2.5 bg-[#111118] border-b border-white/[0.06] hover:bg-white/[0.04] transition-colors"
        >
          <img
            src={listing.images[0] || ""}
            alt={listing.title}
            className="h-10 w-10 rounded-xl object-cover bg-white/10 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-foreground/90">{listing.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {listing.condition}
            </p>
          </div>
          <p className="text-sm font-bold text-emerald-400 shrink-0">
            ₹{listing.price.toLocaleString("en-IN")}
          </p>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        </Link>
      )}

      {/* ══════════════════════════════════════════════════════
          MESSAGES AREA — scrollable
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto overscroll-contain" id="messages-scroll-area">
        <div className="flex flex-col gap-0 px-3 sm:px-4 py-3 max-w-3xl mx-auto w-full">

          {/* Safety Banner */}
          {showSafetyBanner && (
            <div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-200/80 leading-relaxed flex-1">
                Stay safe: Never share passwords or pay outside the app before inspecting the item in person.
              </p>
              <button
                type="button"
                onClick={() => setShowSafetyBanner(false)}
                className="text-amber-400/60 hover:text-amber-400 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 grid place-items-center">
                <Send className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-bold text-foreground">Start the conversation</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Send a message to ask about this listing. Be polite and specific!
              </p>
            </div>
          )}

          {/* Message groups */}
          {messageGroups.map((group) => (
            <div key={group.label}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[11px] font-semibold text-muted-foreground/70 px-2 whitespace-nowrap">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Messages in group */}
              <div className="space-y-1">
                {group.messages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId;
                  const isVisible = currentUserId
                    ? isMessageVisibleTo(msg, currentUserId)
                    : true;
                  const isDeleted = msg.deleted_for_everyone;

                  if (!isVisible) return null;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} group`}
                    >
                      <div className="relative max-w-[80%] sm:max-w-[65%]">
                        {/* Bubble */}
                        <div
                          className={`relative px-3.5 py-2 rounded-2xl ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-[#1e1e2e] text-foreground rounded-bl-sm border border-white/[0.06]"
                          } ${isDeleted ? "opacity-60" : ""}`}
                        >
                          {isDeleted ? (
                            <p className="text-sm italic opacity-70">
                              🚫 This message was deleted
                            </p>
                          ) : (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                          )}

                          {/* Time + read receipt */}
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 ${
                              isMe
                                ? "text-primary-foreground/60"
                                : "text-muted-foreground/60"
                            }`}
                          >
                            <span className="text-[10px]">
                              {formatChatTime(msg.created_at)}
                            </span>
                            {isMe && !isDeleted && (
                              msg.is_read ? (
                                <CheckCheck className="h-3 w-3 text-blue-300" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )
                            )}
                          </div>
                        </div>

                        {/* Context menu button — own messages only, non-deleted */}
                        {isMe && !isDeleted && (
                          <button
                            type="button"
                            data-msg-menu="true"
                            onClick={() =>
                              setShowMenuId((prev) =>
                                prev === msg.id ? null : msg.id
                              )
                            }
                            className="absolute -left-7 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/10 text-muted-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
                            aria-label="Message options"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Context menu popup */}
                        {showMenuId === msg.id && (
                          <div
                            data-msg-menu="true"
                            className="absolute right-0 bottom-full mb-1 w-48 rounded-2xl border border-white/[0.08] bg-[#1a1a26] shadow-2xl shadow-black/50 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
                          >
                            <MenuButton
                              icon={<Copy className="h-3.5 w-3.5" />}
                              label="Copy Message"
                              onClick={() => handleCopy(msg.content)}
                              small
                            />
                            <MenuButton
                              icon={<Trash2 className="h-3.5 w-3.5" />}
                              label="Delete For Me"
                              onClick={() => handleDeleteForMe(msg.id)}
                              small
                              danger
                            />
                            <MenuButton
                              icon={<Trash2 className="h-3.5 w-3.5" />}
                              label="Delete For Everyone"
                              onClick={() => handleDeleteForEveryone(msg.id)}
                              small
                              danger
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          INPUT AREA — fixed bottom
      ══════════════════════════════════════════════════════ */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#111118] px-3 sm:px-4 py-3 z-20">
        {isBlocked ? (
          <div className="flex items-center justify-center h-12 rounded-2xl bg-destructive/10 border border-destructive/20">
            <p className="text-xs font-semibold text-destructive">
              You blocked this user. Unblock to send messages.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full">
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="mb-2 p-2 rounded-2xl border border-white/[0.08] bg-[#1a1a26] shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="grid grid-cols-10 gap-1">
                  {EMOJI_SET.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setInputText((t) => t + emoji);
                        inputRef.current?.focus();
                      }}
                      className="h-8 w-8 text-lg rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input row */}
            <div className="flex items-end gap-2">
              {/* Emoji button */}
              <button
                type="button"
                id="chat-emoji-btn"
                onClick={() => setShowEmojiPicker((v) => !v)}
                className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                  showEmojiPicker
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
                aria-label="Emoji"
              >
                <Smile className="h-5 w-5" />
              </button>

              {/* Text input */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  id="chat-message-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  rows={1}
                  className="w-full resize-none rounded-2xl border border-white/[0.08] bg-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all leading-relaxed"
                  style={{
                    maxHeight: "100px",
                    overflowY: "auto",
                    height: "auto",
                  }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = Math.min(el.scrollHeight, 100) + "px";
                  }}
                />
              </div>

              {/* Send button */}
              <button
                type="button"
                id="chat-send-btn"
                disabled={!inputText.trim() || isSending}
                onClick={handleSend}
                className="h-10 w-10 shrink-0 rounded-full bg-primary flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-95 transition-all"
                aria-label="Send"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                ) : (
                  <Send className="h-4 w-4 text-primary-foreground ml-0.5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          BLOCK CONFIRM MODAL
      ══════════════════════════════════════════════════════ */}
      {showBlockConfirm && (
        <ModalOverlay onClose={() => setShowBlockConfirm(false)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/15 grid place-items-center shrink-0">
                <UserX className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  Block {otherUserProfile?.name}?
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  They won't be able to message you. You can unblock anytime.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowBlockConfirm(false)}
                className="flex-1 rounded-xl border border-white/[0.1] py-2.5 text-sm font-semibold text-foreground hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isConfirmingBlock}
                onClick={handleBlock}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {isConfirmingBlock ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  "Block User"
                )}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ══════════════════════════════════════════════════════
          REPORT MODAL
      ══════════════════════════════════════════════════════ */}
      {showReportModal && (
        <ModalOverlay onClose={() => setShowReportModal(false)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/15 grid place-items-center shrink-0 mt-0.5">
                <Flag className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  Report {otherUserProfile?.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Help us keep Nexora safe. Your report is confidential.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Reason</label>
              <div className="grid grid-cols-2 gap-2">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReportReason(r)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold text-left transition-all ${
                      reportReason === r
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-white/[0.08] bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">
                Additional details (optional)
              </label>
              <textarea
                rows={3}
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Describe what happened…"
                className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="flex-1 rounded-xl border border-white/[0.1] py-2.5 text-sm font-semibold text-foreground hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReport}
                onClick={handleReport}
                className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-black hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {isSubmittingReport ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  "Submit Report"
                )}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── Small reusable components ─────────────────────────────────

function MenuButton({
  icon,
  label,
  onClick,
  danger,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 ${
        small ? "py-1.5" : "py-2"
      } text-left text-xs font-semibold transition-colors hover:bg-white/[0.06] ${
        danger ? "text-destructive hover:text-destructive" : "text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#1a1a26] p-5 shadow-2xl shadow-black/60 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 h-7 w-7 rounded-lg grid place-items-center text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
