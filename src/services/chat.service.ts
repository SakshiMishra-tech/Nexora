/**
 * chat.service.ts
 * All Supabase operations for the Marketplace Chat system.
 */
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────

export type ChatConversation = {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  deleted_for_everyone: boolean;
  deleted_for_users: string[];
};

export type ReportReason = "Spam" | "Scam" | "Abuse" | "Fake Listing" | "Other";

export const REPORT_REASONS: ReportReason[] = [
  "Spam",
  "Scam",
  "Abuse",
  "Fake Listing",
  "Other",
];

// ── Conversations ─────────────────────────────────────────────

/**
 * Get an existing conversation or create one if it doesn't exist.
 * Uses upsert on the unique(buyer_id, seller_id, product_id) constraint.
 */
export async function getOrCreateConversation(
  productId: string,
  sellerId: string
): Promise<ChatConversation> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // If the current user IS the seller, we can't initiate — return an error
  // The UI should handle this case gracefully

  const buyerId = user.id;

  // Try to find existing
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("buyer_id", buyerId)
    .eq("seller_id", sellerId)
    .eq("product_id", productId)
    .maybeSingle<ChatConversation>();

  if (existing) return existing;

  // Also check if the current user is seller (viewing as seller)
  const { data: sellerSide } = await supabase
    .from("conversations")
    .select("*")
    .eq("buyer_id", sellerId)
    .eq("seller_id", buyerId)
    .eq("product_id", productId)
    .maybeSingle<ChatConversation>();

  if (sellerSide) return sellerSide;

  // Create new conversation
  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ buyer_id: buyerId, seller_id: sellerId, product_id: productId })
    .select()
    .single<ChatConversation>();

  if (error) throw error;
  return created;
}

/**
 * Get conversation by id, validating the current user is a participant.
 */
export async function getConversationById(
  conversationId: string
): Promise<ChatConversation | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle<ChatConversation>();

  if (error) throw error;
  return data;
}

// ── Messages ─────────────────────────────────────────────────

/**
 * Fetch all messages for a conversation, ordered by creation time.
 */
export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as ChatMessage[]) ?? [];
}

/**
 * Send a new message.
 */
export async function sendMessage(
  conversationId: string,
  receiverId: string,
  content: string
): Promise<ChatMessage> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
    })
    .select()
    .single<ChatMessage>();

  if (error) throw error;
  return data;
}

/**
 * Mark all unread messages in a conversation as read (for the current user as receiver).
 */
export async function markMessagesRead(conversationId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .eq("receiver_id", user.id)
    .eq("is_read", false);
}

/**
 * Delete a message only for the current user (hide it).
 */
export async function deleteMessageForMe(
  messageId: string,
  userId: string
): Promise<void> {
  // Fetch current array first
  const { data: msg } = await supabase
    .from("messages")
    .select("deleted_for_users")
    .eq("id", messageId)
    .single<Pick<ChatMessage, "deleted_for_users">>();

  if (!msg) return;
  const updated = Array.from(new Set([...msg.deleted_for_users, userId]));

  const { error } = await supabase
    .from("messages")
    .update({ deleted_for_users: updated })
    .eq("id", messageId);

  if (error) throw error;
}

/**
 * Delete a message for everyone — only the sender can do this.
 */
export async function deleteMessageForEveryone(messageId: string): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .update({ deleted_for_everyone: true, content: "This message was deleted" })
    .eq("id", messageId);

  if (error) throw error;
}

// ── Block / Unblock ───────────────────────────────────────────

export async function blockUser(blockedUserId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("blocked_users")
    .insert({ blocker_id: user.id, blocked_user_id: blockedUserId });

  // Ignore duplicate error (already blocked)
  if (error && !error.message.includes("duplicate")) throw error;
}

export async function unblockUser(blockedUserId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_user_id", blockedUserId);
}

export async function isUserBlocked(userId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("blocked_users")
    .select("blocker_id")
    .eq("blocker_id", user.id)
    .eq("blocked_user_id", userId)
    .maybeSingle();

  return !!data;
}

// ── Reports ───────────────────────────────────────────────────

export async function reportUser(
  reportedUserId: string,
  reason: ReportReason,
  description?: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId,
    reason,
    description: description?.trim() || null,
  });

  if (error) throw error;
}

// ── Realtime ─────────────────────────────────────────────────

/**
 * Subscribe to new messages for a conversation via Supabase Realtime.
 * Returns the channel so callers can unsubscribe.
 */
export function subscribeToMessages(
  conversationId: string,
  onInsert: (msg: ChatMessage) => void,
  onUpdate: (msg: ChatMessage) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`chat:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onInsert(payload.new as ChatMessage);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onUpdate(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a Realtime channel.
 */
export function unsubscribeFromMessages(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}

// ── Utility ───────────────────────────────────────────────────

export function formatChatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatChatDate(dateString: string): string {
  const d = new Date(dateString);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  if (d.toDateString() === today) return "Today";
  if (d.toDateString() === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Group messages by date label.
 */
export function groupMessagesByDate(
  messages: ChatMessage[]
): { label: string; messages: ChatMessage[] }[] {
  const groups: { label: string; messages: ChatMessage[] }[] = [];
  let currentLabel = "";

  for (const msg of messages) {
    const label = formatChatDate(msg.created_at);
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }

  return groups;
}

/**
 * Check if a message is visible to the given user.
 */
export function isMessageVisibleTo(msg: ChatMessage, userId: string): boolean {
  return !msg.deleted_for_users.includes(userId);
}
