import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Clock, MapPin, Sparkles, Star, Tag, Users } from "lucide-react";
import { ModuleAccessBoundary } from "@/components/ModuleAccessControl";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [{ title: "Nexora - Events" }] }),
  component: Events,
});

const features = [
  { icon: Calendar, label: "View Events", description: "Browse all upcoming campus events — fests, hackathons, seminars, cultural nights." },
  { icon: Users, label: "Find Event Partners", description: "Heading to a hackathon or fest solo? Find a partner to join you." },
  { icon: Tag, label: "Join Events", description: "RSVP, get campus-verified event passes, and never miss what's happening." },
  { icon: Star, label: "Discover More", description: "Personalized event recommendations based on your interests and campus." },
];

const mockEvents = [
  { title: "TechFest 2025 Hackathon", type: "Hackathon", date: "Aug 14–15", venue: "Main Auditorium", spots: "200 teams", color: "bg-electric/10 text-electric" },
  { title: "Campus Cultural Night", type: "Cultural", date: "Aug 20", venue: "Open Air Stage", spots: "500 seats", color: "bg-destructive/10 text-destructive" },
  { title: "Startup Pitch Competition", type: "Competition", date: "Sep 3", venue: "Seminar Hall B", spots: "50 teams", color: "bg-warm/10 text-warm" },
  { title: "Alumni Meet & Greet", type: "Networking", date: "Sep 10", venue: "Block A Cafeteria", spots: "Open entry", color: "bg-success/10 text-success" },
];

function Events() {
  return (
    <ModuleAccessBoundary moduleId="events">
      <main className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <section className="mx-auto max-w-7xl px-4 py-6">
          {/* Header */}
          <div className="commons-wall mb-8 border border-border p-6 shadow-soft">
            <span className="inline-flex items-center gap-2 bg-success/10 px-3 py-1 text-xs font-black uppercase text-success">
              <Calendar className="h-4 w-4" />
              Events
            </span>
            <h1 className="mt-3 font-display text-4xl font-black sm:text-6xl">
              Never miss a campus moment.
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold text-muted-foreground sm:text-base">
              View, join, and find partners for every campus event — from hackathons to cultural fests to networking nights.
            </p>
          </div>

          {/* Coming soon banner */}
          <div className="mb-8 flex flex-col items-center gap-6 rounded-3xl border border-success/20 bg-success/5 px-6 py-12 text-center shadow-soft">
            <span className="inline-flex items-center gap-2 rounded-full bg-success/15 px-4 py-2 text-xs font-black uppercase text-success">
              <Sparkles className="h-4 w-4" />
              Launching soon
            </span>
            <h2 className="font-display text-3xl font-black sm:text-5xl">
              Events is coming to Nexora.
            </h2>
            <p className="max-w-lg text-sm font-semibold text-muted-foreground">
              We're building a campus-first events board with RSVP, event partner matching, reminders, and
              live updates — so you're always in the loop.
            </p>
            <button
              id="events-notify-btn"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-black text-background shadow-soft transition hover:-translate-y-0.5"
            >
              <Clock className="h-4 w-4" />
              Notify me on launch
            </button>
          </div>

          {/* Feature grid */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="paper-lift border border-border bg-card p-5 opacity-80">
                  <span className="grid h-11 w-11 place-items-center bg-success/15 text-success">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-black">{f.label}</h3>
                  <p className="mt-2 text-sm font-semibold text-muted-foreground">{f.description}</p>
                </div>
              );
            })}
          </div>

          {/* Preview events */}
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-wider text-muted-foreground">
              Sample event listings — preview
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {mockEvents.map((event) => (
                <div
                  key={event.title}
                  className="paper-lift relative border border-border bg-card p-5 opacity-60 blur-[0.4px]"
                >
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${event.color}`}>
                    {event.type}
                  </span>
                  <h3 className="mt-3 font-display text-xl font-black leading-tight">{event.title}</h3>
                  <div className="mt-3 space-y-1">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" /> {event.date}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {event.venue}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {event.spots}
                    </p>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-background/30 backdrop-blur-[1px]">
                    <span className="rounded-full bg-foreground px-3 py-1 text-[10px] font-black text-background">
                      Coming soon
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </ModuleAccessBoundary>
  );
}
