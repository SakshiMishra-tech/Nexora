/**
 * dating_.connect.$topic.tsx
 * Dynamic "More About" detail pages for Campus Connect mega-menu links.
 * Route: /connect/discover/*, /connect/matches/*, /connect/stories/*
 *
 * Opens in a new tab — self-contained, no auth required for reading.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Compass, Heart, PlayCircle, Users, Lock, Flag, MessageCircle, Eye, Camera, Video, Timer, Send, UserX } from "lucide-react";

export const Route = createFileRoute("/connect/$section/$topic")({
  head: ({ params }) => {
    const page = ALL_PAGES[`${params.section}/${params.topic}`];
    return { meta: [{ title: page ? `${page.title} — Nexora Connect` : "Nexora Connect" }] };
  },
  component: ConnectDetailPage,
});

// ── Page registry ─────────────────────────────────────────────────────────────

interface PageContent {
  section: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  howItWorks?: string[];
  details: { heading: string; body: string }[];
  note?: string;
}

const ALL_PAGES: Record<string, PageContent> = {
  // ── Discover ──────────────────────────────────────────────────────
  "discover/campus-discovery": {
    section: "Discover",
    icon: Compass,
    iconColor: "text-blue-500",
    title: "Campus Discovery",
    subtitle: "Discover beyond your campus. Explore students from participating colleges who share your interests, courses, hobbies, and campus experiences.",
    howItWorks: [
      "Complete your Campus Connect profile with your college, campus, and interests.",
      "Open the Discover tab — you will see profiles from active students across participating campuses.",
      "Review each profile and decide to Like or Pass.",
      "If interest is mutual, a Match is created and a conversation can begin.",
    ],
    details: [
      { heading: "Who you will see", body: "You will see verified Campus Connect users who have active profiles and have not paused their discovery. Discovery is not restricted to your own college — you can meet students from any participating institution." },
      { heading: "Profile information shown", body: "Name, age (when provided), college, campus, course, department, year, bio, height, languages, interests, and relationship goal are shown based on what each person has filled in." },
      { heading: "Privacy", body: "Users can choose to hide specific fields such as department, course, or year from their public profile. You will only see what each person has explicitly chosen to show." },
    ],
    note: "Campus Discovery shows real profiles from the Supabase database. No demo users are displayed.",
  },
  "discover/preferences": {
    section: "Discover",
    icon: Lock,
    iconColor: "text-purple-500",
    title: "Smart Preferences",
    subtitle: "Set the preferences that matter to you and personalise your discovery experience.",
    howItWorks: [
      "Go to My Profile and set your basic preferences: gender interested in, age range, and relationship goal.",
      "These preferences are used to shape your Discover feed.",
      "You can update your preferences at any time.",
    ],
    details: [
      { heading: "Supported preferences", body: "Currently supported: Gender preference (Interested In), Age preference range (min/max), Relationship goal, and Interests. These are stored directly on your dating profile." },
      { heading: "Campus filter", body: "A dedicated campus filter for the Discover feed is planned but requires additional backend work. Currently, all active profiles from participating campuses are shown." },
      { heading: "No AI scoring", body: "Nexora Connect does not use AI compatibility scoring or ranked algorithms. Profiles are fetched from the database without a ranking score." },
    ],
  },
  "discover/profile-discovery": {
    section: "Discover",
    icon: Users,
    iconColor: "text-emerald-500",
    title: "Profile Discovery",
    subtitle: "Explore complete, real profiles with photos, bio, interests, and academic details.",
    details: [
      { heading: "What a profile shows", body: "Main photo, additional photos (up to 6), name, age, verified status, college, campus, department, course, year, bio, height, languages, interests (up to many tags), relationship goal, looking for, and favorite campus spot." },
      { heading: "Photo gallery", body: "Each user can upload up to 6 photos. The first photo in their selected order appears as the main card photo. You can scroll the card to see additional details." },
      { heading: "Interests", body: "Interests are displayed as colored tags on the profile card and are selected by each user from a predefined list. They help you quickly spot shared passions." },
    ],
  },
  "discover/like-pass": {
    section: "Discover",
    icon: Heart,
    iconColor: "text-rose-500",
    title: "Like & Pass",
    subtitle: "Show interest with a Like or move on with Pass — at your own pace, with no pressure.",
    howItWorks: [
      "View a profile card in Discover.",
      "Tap the Heart button to Like the person.",
      "Tap the X button to Pass.",
      "The next profile in the feed is shown automatically.",
      "When two people both Like each other, a mutual Match is created.",
    ],
    details: [
      { heading: "Are swipes saved?", body: "The Like/Pass action currently moves you to the next profile. Persistent swipe storage (so you do not see the same person twice) requires the dating_swipes Supabase table, which is pending backend setup." },
      { heading: "Can I undo a pass?", body: "Not currently. Undo functionality requires the swipes table to be active." },
      { heading: "How matches work", body: "A mutual Match is created when both users have Liked each other. This requires the dating_swipes table with a query that checks for reciprocal likes." },
    ],
    note: "Swipe persistence and undo require the dating_swipes database table to be configured in Supabase.",
  },
  "discover/cross-campus": {
    section: "Discover",
    icon: Compass,
    iconColor: "text-indigo-500",
    title: "Cross-Campus Connections",
    subtitle: "Connect beyond your own college and discover students from other participating campuses.",
    details: [
      { heading: "How it works", body: "The Discover feed shows profiles from all active Campus Connect users regardless of which college they attend. There is no filter restricting you to your own institution." },
      { heading: "Participating campuses", body: "Any campus whose students have signed up for Nexora and created a Campus Connect profile is effectively participating. There is no formal campus registration process in the current implementation." },
      { heading: "Meeting across campuses", body: "If you match with someone from a different campus, you can chat and arrange to meet on either campus or a neutral location. Always follow the safety guidelines for meeting in person." },
    ],
  },
  "discover/privacy": {
    section: "Discover",
    icon: Lock,
    iconColor: "text-slate-500",
    title: "Privacy & Visibility",
    subtitle: "Control exactly what others can see and whether your profile appears in their Discover feed.",
    howItWorks: [
      "Go to My Profile.",
      "Scroll to the Privacy section.",
      "Toggle the fields you want to hide.",
      "Toggle 'Pause Discovery' to remove yourself from all Discover feeds.",
      "Save your profile.",
    ],
    details: [
      { heading: "Fields you can hide", body: "Department, Course, Academic Year, Online Status, Distance, and Instagram username can all be hidden individually from your public profile." },
      { heading: "Pause Discovery", body: "Enabling 'Pause Discovery' sets pause_discover = true on your profile. You will no longer appear in anyone's Discover feed until you disable it." },
      { heading: "Who can see your profile", body: "Only authenticated Campus Connect users with an active session can view profiles in the Discover feed. Your profile is not publicly accessible on the internet." },
    ],
  },

  // ── Matches ───────────────────────────────────────────────────────
  "matches/received-likes": {
    section: "Likes & Matches",
    icon: Heart,
    iconColor: "text-primary",
    title: "Received Likes",
    subtitle: "See which students have already liked your profile and are waiting for your response.",
    details: [
      { heading: "How it works", body: "When another user Likes your profile in Discover, their profile appears in your Received Likes list. You can then choose to Like them back (creating a Match) or not." },
      { heading: "Backend requirement", body: "This feature requires the dating_swipes table in Supabase with columns: swiper_id (uuid), swiped_id (uuid), direction ('left'|'right'), created_at. RLS must allow users to read rows where swiped_id = auth.uid()." },
      { heading: "Privacy", body: "The person who liked you does not know whether you have seen their like. They will only be notified of a Match if you like them back." },
    ],
    note: "This feature is pending the dating_swipes Supabase table setup.",
  },
  "matches/sent-likes": {
    section: "Likes & Matches",
    icon: Send,
    iconColor: "text-blue-500",
    title: "Sent Likes",
    subtitle: "Keep track of all the profiles you have already liked.",
    details: [
      { heading: "How it works", body: "Every profile you Like in Discover is stored in the dating_swipes table with direction = 'right'. Your Sent Likes list shows all rows where swiper_id = you." },
      { heading: "Backend requirement", body: "Requires the dating_swipes table. RLS policy: users can read rows where swiper_id = auth.uid()." },
      { heading: "Why this matters", body: "Seeing your sent likes helps you remember who you have already shown interest in. If they like you back, the status in this list will update to 'Matched'." },
    ],
    note: "This feature is pending the dating_swipes Supabase table setup.",
  },
  "matches/mutual-matches": {
    section: "Likes & Matches",
    icon: Users,
    iconColor: "text-emerald-500",
    title: "Mutual Matches",
    subtitle: "When two people Like each other, they become a Match — and a real conversation can begin.",
    howItWorks: [
      "User A likes User B in Discover.",
      "User B likes User A back.",
      "A mutual match row is detected (or created in a dating_matches table).",
      "Both users see the match appear in their Mutual Matches list.",
      "Either person can start a conversation.",
    ],
    details: [
      { heading: "Match detection", body: "A match is detected by querying dating_swipes for two rows: (A→B, right) AND (B→A, right). This can be implemented as a Supabase function or a database view." },
      { heading: "No fake matches", body: "Nexora Connect never creates matches programmatically or surfaces fake profiles as matches. Every match represents two real users who have both expressed genuine interest." },
      { heading: "Backend requirement", body: "Requires dating_swipes table and a query or view that joins the table to find reciprocal likes." },
    ],
  },
  "matches/conversations": {
    section: "Likes & Matches",
    icon: MessageCircle,
    iconColor: "text-indigo-500",
    title: "Start a Conversation",
    subtitle: "Open a conversation with any of your mutual matches.",
    details: [
      { heading: "Who can message whom", body: "Only mutual matches can initiate a conversation. You cannot message someone you have not matched with." },
      { heading: "Real-time messaging", body: "Conversations are powered by Supabase Realtime channels. Both users see messages appear instantly without refreshing the page." },
      { heading: "Backend requirement", body: "Requires: a messages table (id, match_id, sender_id, content, created_at) + a Supabase Realtime subscription on the messages channel, filtered by match_id." },
    ],
    note: "The Chats feature requires the dating_matches and messages Supabase tables plus Realtime subscription setup.",
  },
  "matches/unmatch": {
    section: "Likes & Matches",
    icon: UserX,
    iconColor: "text-rose-500",
    title: "Unmatch",
    subtitle: "Remove a match at any time when you no longer want the connection.",
    howItWorks: [
      "Open a conversation with the person.",
      "Tap the menu (⋮) at the top of the chat.",
      "Select 'Unmatch' and confirm.",
      "The match and all messages are permanently deleted for both people.",
    ],
    details: [
      { heading: "Is it mutual?", body: "Yes. When you unmatch, the connection is removed for both users. The other person is not notified — the conversation simply disappears from their list." },
      { heading: "Can I re-match?", body: "No. Once unmatched, the other person will not appear again in your Discover feed. This is intentional to protect both users." },
      { heading: "Is it reversible?", body: "No. Unmatching is permanent and cannot be undone." },
    ],
  },
  "matches/block-report": {
    section: "Likes & Matches",
    icon: Flag,
    iconColor: "text-red-500",
    title: "Block & Report",
    subtitle: "Take action when a connection makes you uncomfortable or violates community guidelines.",
    howItWorks: [
      "Tap the flag (🚩) icon on any profile or inside a conversation menu.",
      "Select a reason for the report.",
      "Submit — your report is confidential.",
      "Optionally block the user to prevent any further contact.",
    ],
    details: [
      { heading: "What happens when you report", body: "Reports are reviewed by the Nexora moderation team. The reported person is not told who filed the report. Severe violations result in account suspension or permanent removal." },
      { heading: "What happens when you block", body: "The blocked user immediately disappears from your Discover feed and cannot send you messages. You also disappear from their feed." },
      { heading: "Community guidelines", body: "Nexora Campus Connect prohibits harassment, hate speech, explicit unsolicited content, impersonation, and any behaviour that makes another person feel unsafe." },
    ],
  },

  // ── Stories ───────────────────────────────────────────────────────
  "stories/campus-stories": {
    section: "Stories",
    icon: Eye,
    iconColor: "text-blue-500",
    title: "Campus Stories",
    subtitle: "See recent stories shared by students across participating campuses.",
    details: [
      { heading: "What you will see", body: "A horizontally scrollable row of story bubbles at the top of the Stories tab, showing the profile photo and name of each student who has an active story." },
      { heading: "Story content", body: "Stories can contain a photo or short video clip, along with an optional caption." },
      { heading: "Backend requirement", body: "Requires a dating_stories table and a Supabase Storage bucket (campus_stories). Stories are fetched filtered by expires_at > now()." },
    ],
    note: "Campus Stories is pending backend configuration. No fake stories will be shown.",
  },
  "stories/create": {
    section: "Stories",
    icon: Camera,
    iconColor: "text-emerald-500",
    title: "Share a Story",
    subtitle: "Publish your own campus moment using the supported media upload functionality.",
    howItWorks: [
      "Tap 'Add Story' from the Stories tab.",
      "Select a photo or short video from your device.",
      "Add an optional caption.",
      "Tap Publish — the story is uploaded to Supabase Storage and a row is inserted into dating_stories.",
      "Your story appears at the top of the Stories feed for the duration of its lifetime.",
    ],
    details: [
      { heading: "Supported formats", body: "Photos: JPEG, PNG, WebP. Videos: MP4 (short clips). Maximum file size is determined by the Supabase storage bucket policy." },
      { heading: "Backend requirement", body: "Requires the campus_stories Supabase Storage bucket and the dating_stories table with RLS allowing users to insert their own rows." },
      { heading: "Upload errors", body: "If an upload fails, you will see a clear error message. No story will be shown if the upload did not complete successfully." },
    ],
    note: "Story creation is pending backend configuration.",
  },
  "stories/viewer": {
    section: "Stories",
    icon: PlayCircle,
    iconColor: "text-purple-500",
    title: "Story Viewer",
    subtitle: "View stories with proper progress indicators, navigation controls, and a close button.",
    details: [
      { heading: "Progress bar", body: "A thin animated progress bar at the top of the story viewer shows how much of the current story has been viewed. It advances automatically." },
      { heading: "Navigation", body: "Tap the left half of the screen to go to the previous story. Tap the right half to skip to the next. Tap and hold to pause." },
      { heading: "Close", body: "Tap the X button in the top right corner at any time to exit the story viewer and return to the Stories tab." },
    ],
    note: "The story viewer requires the backend dating_stories table to be configured.",
  },
  "stories/visibility": {
    section: "Stories",
    icon: Eye,
    iconColor: "text-slate-500",
    title: "Story Visibility",
    subtitle: "Understand who can see your story based on the implemented visibility rules.",
    details: [
      { heading: "Default visibility", body: "Stories are visible to all authenticated Campus Connect users who have an active profile. There is no friend-only or match-only restriction in the current planned implementation." },
      { heading: "Paused profiles", body: "If you have paused your discovery, your stories may still be visible. Visibility during pause will be clarified once the backend is fully configured." },
      { heading: "Expiration", body: "Stories expire after the duration set in the dating_stories table (expires_at column). Expired stories are not shown to any user." },
    ],
    note: "Exact visibility rules will be finalised when the dating_stories backend is configured.",
  },
  "stories/report": {
    section: "Stories",
    icon: Flag,
    iconColor: "text-red-500",
    title: "Report a Story",
    subtitle: "Report inappropriate or problematic story content to the Campus Connect moderation team.",
    howItWorks: [
      "While viewing a story, tap the flag icon (🚩) or the menu (⋮) button.",
      "Select a reason for the report (e.g., Inappropriate content, Harassment, Spam).",
      "Submit the report — it is sent to the moderation team confidentially.",
    ],
    details: [
      { heading: "Confidentiality", body: "The person whose story you reported will not be told who filed the report." },
      { heading: "What is reportable", body: "Explicit or sexual content, harassment directed at specific individuals, misinformation, spam, hate speech, or content that violates campus community standards." },
      { heading: "After reporting", body: "Our moderation team reviews every report. Stories found in violation are removed. Repeat violators may have their Campus Connect access suspended." },
    ],
  },
  "stories/expiration": {
    section: "Stories",
    icon: Timer,
    iconColor: "text-amber-500",
    title: "Story Expiration",
    subtitle: "How long stories last and how content is automatically removed.",
    details: [
      { heading: "Story lifetime", body: "Each story has an expires_at timestamp set at the time of creation. The default duration is 24 hours from upload. Once expires_at passes, the story is automatically excluded from all feeds." },
      { heading: "Automatic removal", body: "Expired stories can be removed via a Supabase scheduled function (pg_cron) that deletes rows where expires_at < now(), or they can simply be filtered out in queries without physical deletion." },
      { heading: "Storage cleanup", body: "When a story is deleted from the database, the associated media file in Supabase Storage should also be removed to avoid orphaned files. This requires a database trigger or Edge Function." },
    ],
    note: "Story expiration is dependent on the dating_stories backend configuration. Duration and behaviour may change during implementation.",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

function ConnectDetailPage() {
  const { section, topic } = Route.useParams();
  const pageKey = `${section}/${topic}`;
  const page = ALL_PAGES[pageKey];

  if (!page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-6xl font-black text-muted-foreground/20 mb-4">404</p>
          <h1 className="text-2xl font-bold mb-2">Page not found</h1>
          <p className="text-sm text-muted-foreground mb-6">This Campus Connect detail page does not exist.</p>
          <Link to="/dating" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity">
            <ArrowLeft className="w-4 h-4" /> Back to Campus Connect
          </Link>
        </div>
      </div>
    );
  }

  const Icon = page.icon;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to="/dating"
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Nexora Connect
          </Link>
          <span className="font-display font-black text-sm tracking-tight uppercase text-foreground select-none">
            NEXORA <span className="font-light text-muted-foreground">CONNECT</span>
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">{page.section}</p>
          <div className="flex items-start gap-5">
            <div className={`h-14 w-14 rounded-2xl bg-muted flex items-center justify-center shrink-0`}>
              <Icon className={`w-7 h-7 ${page.iconColor}`} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight mb-3">{page.title}</h1>
              <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">{page.subtitle}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">

        {/* How it works */}
        {page.howItWorks && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-primary mb-5">How it works</h2>
            <ol className="space-y-3">
              {page.howItWorks.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground leading-relaxed pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Details */}
        <section>
          <h2 className="text-xs font-black uppercase tracking-widest text-primary mb-5">Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {page.details.map((d, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-bold mb-2">{d.heading}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{d.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Developer / backend note */}
        {page.note && (
          <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Developer Note</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{page.note}</p>
          </section>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Link
            to="/dating"
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Nexora Connect
          </Link>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">NEXORA CONNECT</span>
        </div>
      </div>
    </div>
  );
}
