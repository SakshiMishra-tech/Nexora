/**
 * CampusConnectLikes.tsx
 * Likes & Matches tab — shows what's available and what needs backend.
 */
import { useState } from "react";
import { Heart, UserCheck, Lock, Send, Users } from "lucide-react";

type SubTab = "received" | "sent" | "matches";

export function CampusConnectLikes() {
  const [activeTab, setActiveTab] = useState<SubTab>("matches");

  const tabs: { id: SubTab; label: string; icon: React.ElementType }[] = [
    { id: "matches", label: "Matches", icon: Users },
    { id: "received", label: "Likes You", icon: Heart },
    { id: "sent", label: "You Liked", icon: Send },
  ];

  return (
    <div className="min-h-full w-full max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight mb-1">Likes & Matches</h1>
        <p className="text-sm text-muted-foreground">See who you've connected with and who's interested in you.</p>
      </div>

      {/* Sub-tab switcher */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <BackendRequiredState tab={activeTab} />
    </div>
  );
}

function BackendRequiredState({ tab }: { tab: SubTab }) {
  const config = {
    matches: {
      icon: UserCheck,
      color: "text-green-500",
      bg: "bg-green-500/10",
      title: "Your Matches",
      body: "A match happens when you and another person both Like each other. Your matches will appear here — you'll then be able to start a conversation.",
      requirement: "Requires: dating_swipes table with RLS + a query that finds rows where both users liked each other.",
    },
    received: {
      icon: Heart,
      color: "text-primary",
      bg: "bg-primary/10",
      title: "People Who Liked You",
      body: "When someone Likes your profile, they appear here. Like them back to create a Match.",
      requirement: "Requires: dating_swipes table with columns (swiper_id, swiped_id, direction, created_at) and RLS policies.",
    },
    sent: {
      icon: Send,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      title: "Profiles You Liked",
      body: "All the profiles you have Liked will appear here. If they Like you back, it becomes a Match.",
      requirement: "Requires: dating_swipes table — reads rows where swiper_id = current user AND direction = 'right'.",
    },
  };

  const { icon: Icon, color, bg, title, body, requirement } = config[tab];

  return (
    <div className="flex flex-col items-center text-center py-12 px-6 rounded-2xl border border-dashed border-border bg-card/50 space-y-4 relative">
      <div className="absolute top-4 right-4">
        <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
          <Lock className="w-2.5 h-2.5" /> Backend Pending
        </span>
      </div>

      <div className={`h-16 w-16 rounded-full ${bg} flex items-center justify-center`}>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>

      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{body}</p>

      <div className="w-full mt-4 rounded-xl border border-border bg-muted/50 px-4 py-3 text-left">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Developer Note</p>
        <p className="text-xs text-muted-foreground font-mono leading-relaxed">{requirement}</p>
      </div>
    </div>
  );
}
