/**
 * CampusConnectStories.tsx
 * Stories tab — clearly identifies what backend work is needed.
 * No fake uploads or simulated stories are displayed.
 */
import { Camera, Video, AlertCircle, Database, Lock } from "lucide-react";

export function CampusConnectStories() {
  return (
    <div className="min-h-full w-full max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight mb-1">Campus Stories</h1>
        <p className="text-sm text-muted-foreground">Share campus moments with your connections.</p>
      </div>

      {/* Backend Required Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 flex gap-4">
        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">Backend configuration required</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The Stories feature requires additional Supabase setup before it can go live. No stories are displayed yet — this page will be populated once the backend is configured.
          </p>
        </div>
      </div>

      {/* What's Needed */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3">Required Backend Work</h2>
        <div className="space-y-3">
          {[
            {
              icon: Database,
              title: "dating_stories table",
              desc: "Columns: id, user_id, media_url, media_type, caption, expires_at, created_at. Enable RLS: users can insert their own stories; authenticated users can read non-expired stories.",
            },
            {
              icon: Lock,
              title: "Supabase Storage bucket: campus_stories",
              desc: "Public or signed-URL bucket for photo and video uploads. Set max file size and accepted MIME types (image/*, video/mp4). Configure CORS for the app domain.",
            },
            {
              icon: Camera,
              title: "Story expiration policy",
              desc: "Stories should auto-expire after 24 hours. This can be handled via a Supabase scheduled function (pg_cron) that deletes rows where expires_at < now(), or filtered in the query.",
            },
            {
              icon: Video,
              title: "Video processing (optional)",
              desc: "For video stories, consider Supabase Edge Functions or an external transcoding service to generate thumbnails and ensure playback compatibility.",
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex gap-4 rounded-xl border border-border bg-card p-5">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold mb-0.5 font-mono">{item.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* What users will see once live */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-bold mb-3">What Stories will include once live</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "A scrollable stories bar showing active stories from your connections",
            "Tap to view stories with progress indicators and close control",
            "Upload a photo or short video from your device",
            "Add a caption (optional)",
            "Stories expire automatically after 24 hours",
            "Report inappropriate stories directly from the viewer",
          ].map((point, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
