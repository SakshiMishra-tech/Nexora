import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BookOpen,
  Calendar,
  Car,
  Check,
  GraduationCap,
  Heart,
  Loader2,
  MapPin,
  ShoppingBag,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { useModuleAccessNavigation } from "@/components/ModuleAccessControl";
import { useAuth } from "@/hooks/useAuth";
import {
  ALL_CAMPUS_MODULE_IDS,
  CAMPUS_MODULES,
  type CampusModuleId,
} from "@/lib/modules";
import { getUserSettings, getEnabledModules, updateAllModules } from "@/services/user-settings.service";
import campusScene from "@/assets/campus-scene.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexora - Campus student network" },
      {
        name: "description",
        content:
          "Nexora brings student marketplace, lost and found, roommates, dating, notes and project discovery into focused campus pages.",
      },
      { property: "og:title", content: "Nexora - Campus student network" },
      {
        property: "og:description",
        content:
          "A campus-first student network with marketplace, lost and found, roommates, dating, notes and projects.",
      },
    ],
  }),
  component: Index,
});

const features = [
  {
    title: "Marketplace",
    href: "/marketplace",
    icon: ShoppingBag,
    color: "bg-warm/15 text-warm",
    description: "OLX-style campus buying and selling for cycles, laptops, books, lamps and daily student stuff.",
    signal: "23 posts today",
  },
  {
    title: "Lost & Found",
    href: "/lost-found",
    icon: MapPin,
    color: "bg-success/15 text-success",
    description: "Post something lost, report something found, and match items through location and clues.",
    signal: "9 reunited",
  },
  {
    title: "Roommates",
    href: "/roommates",
    icon: Users,
    color: "bg-electric/15 text-electric",
    description: "Find compatible roommates by budget, block, habits, food preference and study schedule.",
    signal: "47 matches",
  },
  {
    title: "Campus Connect",
    href: "/dating",
    icon: Heart,
    color: "bg-destructive/10 text-destructive",
    description: "A respectful campus dating space with verified students, interests and safety-first controls.",
    signal: "verified only",
  },
  {
    title: "Notes",
    href: "/notes",
    icon: BookOpen,
    color: "bg-primary/10 text-primary",
    description: "Subject notes, professor tags, PDFs, handwritten scans, ratings and quick downloads.",
    signal: "184 uploads",
  },
  {
    title: "Projects",
    href: "/projects",
    icon: Wrench,
    color: "bg-secondary text-primary",
    description: "Post student projects, find teammates, track MVP status and collaborate inside campus.",
    signal: "12 teams open",
  },
  {
    title: "Rides",
    href: "/rides",
    icon: Car,
    color: "bg-electric/15 text-electric",
    description: "Offer or find rides with verified campus students. Split fuel costs and commute together.",
    signal: "early access",
  },
  {
    title: "Tuition",
    href: "/tuition",
    icon: GraduationCap,
    color: "bg-warm/15 text-warm",
    description: "Seniors teach juniors. Book peer sessions, find tutors, and share skills across campus.",
    signal: "early access",
  },
  {
    title: "Events",
    href: "/events",
    icon: Calendar,
    color: "bg-success/15 text-success",
    description: "Browse campus events, RSVP, find event partners, and never miss a campus moment.",
    signal: "early access",
  },
];

function Index() {
  const { requestModuleAccess, accessModal } = useModuleAccessNavigation();
  const { profile, user } = useAuth();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [selectedSpaces, setSelectedSpaces] = useState<CampusModuleId[]>([]);
  const [savingSpaces, setSavingSpaces] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const shouldOpen = window.sessionStorage.getItem("nexora-show-campus-onboarding");

    if (shouldOpen === "1") {
      window.sessionStorage.removeItem("nexora-show-campus-onboarding");
      setOnboardingOpen(true);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      getUserSettings(user.id).then((settings) => {
        setSelectedSpaces(getEnabledModules(settings));
      });
    } else {
      setSelectedSpaces([]);
    }
  }, [user?.id]);

  const isAllSelected = useMemo(() => selectedSpaces.length === ALL_CAMPUS_MODULE_IDS.length, [selectedSpaces]);

  const toggleSpace = (moduleId: CampusModuleId) => {
    setSelectedSpaces((current) =>
      current.includes(moduleId) ? current.filter((item) => item !== moduleId) : [...current, moduleId],
    );
  };

  const toggleAllSpaces = () => {
    setSelectedSpaces(isAllSelected ? [] : [...ALL_CAMPUS_MODULE_IDS]);
  };

  const handleSaveSpaces = async () => {
    setError("");
    setSavingSpaces(true);
    if (!user) return;
    const { error: saveError } = await updateAllModules(user.id, selectedSpaces);
    setSavingSpaces(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setOnboardingOpen(false);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-6 pt-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="commons-wall relative overflow-hidden border border-foreground/10 p-5 shadow-soft sm:p-7">
          <div className="absolute right-4 top-4 rotate-2 bg-warm px-3 py-1 text-[11px] font-black uppercase text-warm-foreground shadow-soft">
            student built
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-black tracking-wide text-primary shadow-xs">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
            <span>Next-Gen Campus Network</span>
          </span>
          <h1 className="mt-5 max-w-3xl font-display text-5xl font-black leading-[0.96] sm:text-7xl">
            Choose what you need on campus.
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold text-muted-foreground sm:text-lg">
            Simple entry, focused pages. Buy or sell, recover lost items, find roommates, meet verified students,
            share notes, and build projects with classmates.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["No events wall", "Clear pages", "Student verified", "Full-stack ready"].map((tag, index) => (
              <span
                key={tag}
                className={`border border-foreground/15 bg-paper px-3 py-2 text-xs font-black uppercase shadow-soft ${
                  index % 2 ? "rotate-1" : "-rotate-1"
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="relative min-h-[360px] overflow-hidden border border-foreground/10 bg-foreground shadow-glow">
          <img src={campusScene} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-background">
            <p className="font-mono text-xs font-black uppercase text-warm">Live campus snapshot</p>
            <h2 className="mt-2 font-display text-3xl font-black">One campus. Separate rooms.</h2>
            <p className="mt-2 max-w-md text-sm font-semibold text-background/72">
              Instead of one overloaded wall, Nexora now opens each student need as its own clear page.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <a
                key={feature.href}
                href={feature.href}
                onClick={(event) => {
                  event.preventDefault();
                  requestModuleAccess(feature.href, event);
                }}
                className={`group paper-lift border border-foreground/10 bg-card p-4 transition hover:-translate-y-1 hover:shadow-glow ${
                  index % 3 === 0 ? "-rotate-1" : index % 3 === 1 ? "rotate-1" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid h-11 w-11 place-items-center ${feature.color}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full border border-foreground/10 px-2 py-1 text-[10px] font-black uppercase text-muted-foreground">
                    {feature.signal}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-black">{feature.title}</h3>
                <p className="mt-2 min-h-[72px] text-sm font-semibold text-muted-foreground">{feature.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm font-black">
                  Open page
                  <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </a>
            );
          })}
        </div>
      </section>
      {accessModal}
      {onboardingOpen && (
        <div className="module-onboarding-overlay" role="dialog" aria-modal="true" aria-label="Choose your campus spaces">
          <section className="module-onboarding-card">
            <div className="module-onboarding-header">
              <span>Choose your campus spaces</span>
              <h2>Choose your campus spaces</h2>
              <p>Select the Nexora sections you want active for your account.</p>
            </div>

            {error && <div className="auth-status-message auth-status-error mt-3">{error}</div>}

            <div className="module-onboarding-form">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-black text-foreground">Pick the spaces you want to use</p>
                <button type="button" onClick={toggleAllSpaces} className="module-onboarding-skip px-3 py-2">
                  {isAllSelected ? "Clear all" : "Select all"}
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {CAMPUS_MODULES.map((module) => {
                  const checked = selectedSpaces.includes(module.id as CampusModuleId);

                  return (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() => toggleSpace(module.id as CampusModuleId)}
                      className={`rounded-2xl border px-3 py-3 text-left text-sm font-black transition ${
                        checked ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{module.label}</span>
                        <span className={`h-5 w-5 rounded-full border ${checked ? "border-primary bg-primary" : "border-border"}`} />
                      </div>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">{module.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="module-onboarding-actions">
              <button type="button" onClick={() => setOnboardingOpen(false)} className="module-onboarding-skip">
                Skip for now
              </button>
              <button type="button" onClick={() => void handleSaveSpaces()} disabled={savingSpaces} className="module-onboarding-save">
                {savingSpaces ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save spaces"
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
