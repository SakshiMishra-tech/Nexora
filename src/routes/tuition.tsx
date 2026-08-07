import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Clock, GraduationCap, Search, Sparkles, Star, Users } from "lucide-react";
import { ModuleAccessBoundary } from "@/components/ModuleAccessControl";

export const Route = createFileRoute("/tuition")({
  head: () => ({ meta: [{ title: "Nexora - Tuition" }] }),
  component: Tuition,
});

const features = [
  { icon: GraduationCap, label: "Seniors Teach Juniors", description: "Learn from students one or two years ahead of you — relatable, practical, affordable." },
  { icon: BookOpen, label: "Skill Sharing", description: "Teach what you know. Learn what you don't. Any subject, any skill." },
  { icon: Search, label: "Find Tutors", description: "Browse tutors by subject, semester, and rating." },
  { icon: Star, label: "Book Sessions", description: "Schedule 1-on-1 or group sessions at your campus or online." },
];

const mockTutors = [
  { name: "Ananya S.", subject: "Data Structures & Algo", year: "3rd Year CSE", rating: "4.9", sessions: 42, price: "₹150/hr" },
  { name: "Rishabh M.", subject: "Engineering Mathematics", year: "2nd Year ECE", rating: "4.7", sessions: 28, price: "₹120/hr" },
  { name: "Priya N.", subject: "DBMS & SQL", year: "4th Year CSE", rating: "5.0", sessions: 61, price: "₹180/hr" },
];

function Tuition() {
  return (
    <ModuleAccessBoundary moduleId="tuition">
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-7xl px-4 py-6">
          {/* Header */}
          <div className="commons-wall mb-8 border border-border p-6 shadow-soft">
            <span className="inline-flex items-center gap-2 bg-warm/10 px-3 py-1 text-xs font-black uppercase text-warm">
              <GraduationCap className="h-4 w-4" />
              Tuition
            </span>
            <h1 className="mt-3 font-display text-4xl font-black sm:text-6xl">
              Peer learning. Seniors teach juniors.
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold text-muted-foreground sm:text-base">
              Book sessions with verified senior students, share skills, and learn from someone who was in your exact seat last year.
            </p>
          </div>

          {/* Coming soon banner */}
          <div className="mb-8 flex flex-col items-center gap-6 rounded-3xl border border-warm/20 bg-warm/5 px-6 py-12 text-center shadow-soft">
            <span className="inline-flex items-center gap-2 rounded-full bg-warm/15 px-4 py-2 text-xs font-black uppercase text-warm">
              <Sparkles className="h-4 w-4" />
              Launching soon
            </span>
            <h2 className="font-display text-3xl font-black sm:text-5xl">
              Tuition is coming to Nexora.
            </h2>
            <p className="max-w-lg text-sm font-semibold text-muted-foreground">
              We're building verified tutor profiles, session booking, payment splits, and subject-based discovery
              — all inside your campus network.
            </p>
            <button
              id="tuition-notify-btn"
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
                  <span className="grid h-11 w-11 place-items-center bg-warm/15 text-warm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-black">{f.label}</h3>
                  <p className="mt-2 text-sm font-semibold text-muted-foreground">{f.description}</p>
                </div>
              );
            })}
          </div>

          {/* Preview tutors */}
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-wider text-muted-foreground">
              Sample tutor listings — preview
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {mockTutors.map((tutor) => (
                <div
                  key={tutor.name}
                  className="paper-lift relative border border-border bg-card p-5 opacity-60 blur-[0.4px]"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-warm/15 font-display text-xl font-black text-warm">
                      {tutor.name[0]}
                    </span>
                    <div>
                      <p className="font-black">{tutor.name}</p>
                      <p className="text-xs font-semibold text-muted-foreground">{tutor.year}</p>
                    </div>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-black">{tutor.subject}</h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs font-black text-warm">
                      <Star className="h-3.5 w-3.5 fill-current" /> {tutor.rating}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {tutor.sessions} sessions
                    </span>
                    <span className="text-xs font-black text-foreground">{tutor.price}</span>
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
