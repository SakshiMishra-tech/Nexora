/**
 * MegaMenu.tsx
 * Reusable mega-menu popup for Campus Connect navbar.
 * Opens an overlay popup with feature cards and "More about →" links.
 */
import { useEffect, useRef } from "react";
import { X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MegaMenuFeature {
  title: string;
  description: string;
  href: string;
}

export const DISCOVER_FEATURES: MegaMenuFeature[] = [
  { title: "Campus Discovery", description: "Discover students from participating colleges and campuses across the Nexora network.", href: "/connect/discover/campus-discovery" },
  { title: "Smart Preferences", description: "Choose the campuses, interests, age range, and other supported preferences that matter to you.", href: "/connect/discover/preferences" },
  { title: "Profile Discovery", description: "Explore complete profiles with photos, bio, interests, college, course, and other details.", href: "/connect/discover/profile-discovery" },
  { title: "Like & Pass", description: "Show interest with a Like or move on with Pass — at your own pace, with no pressure.", href: "/connect/discover/like-pass" },
  { title: "Cross-Campus Connections", description: "Connect beyond your own college and discover people from other participating campuses.", href: "/connect/discover/cross-campus" },
  { title: "Privacy & Visibility", description: "Control whether your profile appears in discovery using the privacy options supported by the app.", href: "/connect/discover/privacy" },
];

export const LIKES_FEATURES: MegaMenuFeature[] = [
  { title: "Received Likes", description: "See which students have already liked your profile and are waiting for a response.", href: "/connect/matches/received-likes" },
  { title: "Sent Likes", description: "Keep track of all the profiles you have already liked.", href: "/connect/matches/sent-likes" },
  { title: "Mutual Matches", description: "When two people like each other, they become a match — and a conversation can begin.", href: "/connect/matches/mutual-matches" },
  { title: "Start a Conversation", description: "Open a conversation with any of your mutual matches directly from the Matches tab.", href: "/connect/matches/conversations" },
  { title: "Unmatch", description: "Remove a match at any time when you no longer want the connection.", href: "/connect/matches/unmatch" },
  { title: "Block & Report", description: "Take action when a connection makes you uncomfortable or violates community guidelines.", href: "/connect/matches/block-report" },
];

export const STORIES_FEATURES: MegaMenuFeature[] = [
  { title: "Campus Stories", description: "See recent stories shared by students across participating campuses.", href: "/connect/stories/campus-stories" },
  { title: "Share a Story", description: "Create and publish your own campus moment using the supported media upload functionality.", href: "/connect/stories/create" },
  { title: "Story Viewer", description: "View stories with proper progress indicators, navigation controls, and a close button.", href: "/connect/stories/viewer" },
  { title: "Story Visibility", description: "Understand who can see your story based on the visibility rules implemented in the app.", href: "/connect/stories/visibility" },
  { title: "Report a Story", description: "Report inappropriate or problematic story content to the Campus Connect moderation team.", href: "/connect/stories/report" },
  { title: "Story Expiration", description: "Learn about story lifetime, expiration rules, and how content is removed automatically.", href: "/connect/stories/expiration" },
];

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  features: MegaMenuFeature[];
}

export function MegaMenu({ isOpen, onClose, title, subtitle, features }: MegaMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "fixed z-50 left-1/2 -translate-x-1/2",
          "top-[64px]",               // sits just below the 56px navbar (+ border)
          "w-[calc(100%-2rem)] max-w-3xl",
          "bg-background border border-border rounded-2xl shadow-2xl",
          "animate-in fade-in slide-in-from-top-2 duration-200",
          "overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-display font-black tracking-tight text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-xl">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-background p-5 flex flex-col gap-2 hover:bg-muted/40 transition-colors group"
            >
              <h3 className="text-sm font-bold text-foreground leading-snug">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">{feature.description}</p>
              <a
                href={feature.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:gap-2.5 transition-all mt-1 w-fit"
              >
                More about
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-muted/40 border-t border-border flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            NEXORA CONNECT
          </span>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
