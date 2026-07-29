import { createFileRoute } from "@tanstack/react-router";
import { Car, Clock, MapPin, Route as RouteIcon, ShieldCheck, Sparkles, Users } from "lucide-react";
import { ModuleAccessBoundary } from "@/components/ModuleAccessControl";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/rides")({
  head: () => ({ meta: [{ title: "Nexora - Rides" }] }),
  component: Rides,
});

const features = [
  { icon: Car, label: "Offer a Ride", description: "Share your daily route and earn back fuel costs." },
  { icon: Users, label: "Find a Ride", description: "Join verified students heading your way." },
  { icon: RouteIcon, label: "Daily Routes", description: "Set recurring routes for your commute schedule." },
  { icon: ShieldCheck, label: "Student Verified", description: "Only verified campus IDs can join rides." },
];

const upcomingRides = [
  { from: "IIT Gate", to: "Sector 17 Market", time: "8:30 AM", seats: 2, type: "Daily", driver: "Arjun S." },
  { from: "Hostel 3", to: "City Centre Mall", time: "6:00 PM", seats: 3, type: "One-time", driver: "Megha R." },
  { from: "Campus Main Gate", to: "Airport", time: "10:00 AM", seats: 1, type: "One-time", driver: "Dev K." },
];

function Rides() {
  return (
    <ModuleAccessBoundary moduleId="rides">
      <main className="min-h-screen bg-background text-foreground">
        <SiteNav />
        <section className="mx-auto max-w-7xl px-4 py-6">
          {/* Header */}
          <div className="commons-wall mb-8 border border-border p-6 shadow-soft">
            <span className="inline-flex items-center gap-2 bg-electric/10 px-3 py-1 text-xs font-black uppercase text-electric">
              <Car className="h-4 w-4" />
              Rides
            </span>
            <h1 className="mt-3 font-display text-4xl font-black sm:text-6xl">
              Campus ride sharing, student-only.
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold text-muted-foreground sm:text-base">
              Offer rides, find rides, and pool cabs with verified campus students. Split costs, reduce commute stress.
            </p>
          </div>

          {/* Coming soon banner */}
          <div className="mb-8 flex flex-col items-center gap-6 rounded-3xl border border-electric/20 bg-electric/5 px-6 py-12 text-center shadow-soft">
            <span className="inline-flex items-center gap-2 rounded-full bg-electric/15 px-4 py-2 text-xs font-black uppercase text-electric">
              <Sparkles className="h-4 w-4" />
              Launching soon
            </span>
            <h2 className="font-display text-3xl font-black sm:text-5xl">
              Rides is on its way.
            </h2>
            <p className="max-w-lg text-sm font-semibold text-muted-foreground">
              We're building smart route matching, real-time seat availability, and student-only cab pooling.
              Be the first to ride when it launches.
            </p>
            <button
              id="rides-notify-btn"
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
                  <span className="grid h-11 w-11 place-items-center bg-electric/15 text-electric">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-black">{f.label}</h3>
                  <p className="mt-2 text-sm font-semibold text-muted-foreground">{f.description}</p>
                </div>
              );
            })}
          </div>

          {/* Preview / mock rides */}
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-wider text-muted-foreground">
              Sample ride listings — preview
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {upcomingRides.map((ride) => (
                <div
                  key={ride.from + ride.time}
                  className="paper-lift relative overflow-hidden border border-border bg-card p-4 opacity-60 blur-[0.4px]"
                >
                  <span className="mb-3 inline-block rounded-full bg-electric/10 px-2 py-0.5 text-[10px] font-black uppercase text-electric">
                    {ride.type}
                  </span>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-black">{ride.from}</p>
                      <p className="text-xs font-semibold text-muted-foreground">→ {ride.to}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs font-bold text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {ride.time}</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {ride.seats} seats</span>
                  </div>
                  <p className="mt-2 text-xs font-black text-foreground">{ride.driver}</p>
                  <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[1px]">
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
