import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ModuleAccessBoundary } from "@/components/ModuleAccessControl";
import { CampusConnectDashboard } from "@/components/dating/CampusConnectDashboard";
import { CampusConnectSafety } from "@/components/dating/CampusConnectSafety";
import { CampusConnectSupport } from "@/components/dating/CampusConnectSupport";
import { ArrowRight, ShieldCheck, Lock, EyeOff, Play } from "lucide-react";
import student1 from "@/assets/student-1.jpg";
import student2 from "@/assets/student-2.jpg";
import student3 from "@/assets/student-3.jpg";
import campusScene from "@/assets/campus-scene.png";
import coupleDate from "@/assets/couple-date.jpg";
import coupleCampus from "@/assets/couple-campus.jpg";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  MegaMenu, 
  DISCOVER_FEATURES, 
  LIKES_FEATURES, 
  STORIES_FEATURES 
} from "@/components/dating/MegaMenu";

export const Route = createFileRoute("/dating")({
  head: () => ({ meta: [{ title: "Nexora - Campus Connect" }] }),
  component: DatingRoute,
});

function DatingRoute() {
  const [view, setView] = useState<"landing" | "dashboard" | "safety" | "support">("landing");
  const [previousView, setPreviousView] = useState<"landing" | "dashboard">("landing");
  const [initialTab, setInitialTab] = useState<string>("discover");

  const goBack = () => setView(previousView);

  const navigateToStandalone = (target: "safety" | "support") => {
    setPreviousView(view === "dashboard" ? "dashboard" : "landing");
    setView(target);
  };

  if (view === "dashboard") {
    return (
      <ModuleAccessBoundary moduleId="campus-connect">
        <CampusConnectDashboard 
          onExit={() => setView("landing")} 
          onNavigate={(tab) => navigateToStandalone(tab)}
          initialTab={initialTab} 
        />
      </ModuleAccessBoundary>
    );
  }

  if (view === "safety") {
    return (
      <ModuleAccessBoundary moduleId="campus-connect">
        <CampusConnectSafety onBack={goBack} />
      </ModuleAccessBoundary>
    );
  }

  if (view === "support") {
    return (
      <ModuleAccessBoundary moduleId="campus-connect">
        <CampusConnectSupport onBack={goBack} />
      </ModuleAccessBoundary>
    );
  }

  return (
    <ModuleAccessBoundary moduleId="campus-connect">
      <CampusConnectPremiumLanding onGetStarted={(tab) => {
        if (tab === "safety" || tab === "support") {
          navigateToStandalone(tab);
        } else {
          setInitialTab(tab || "discover");
          setView("dashboard");
        }
      }} />
    </ModuleAccessBoundary>
  );
}

function CampusConnectPremiumLanding({ onGetStarted }: { onGetStarted: (tab?: string) => void }) {
  const { user } = useAuth();
  const [openMega, setOpenMega] = useState<"discover" | "likes" | "stories" | null>(null);
  
  // Subtle scroll listener for parallax background effects
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans overflow-x-hidden">
      
      {/* ── Editorial Navbar ── */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between bg-background/70 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-xl tracking-tighter uppercase text-foreground">
            NEXORA <span className="font-light text-muted-foreground">CONNECT</span>
          </span>
        </div>

        {/* Bumble-style Center Links */}
        <div className="hidden md:flex items-center gap-1 bg-muted/40 rounded-full p-1 border border-border/50">
          {[
            { id: "discover", label: "Discover", isMega: true },
            { id: "likes", label: "Likes & Matches", isMega: true },
            { id: "stories", label: "Stories", isMega: true },
            { id: "safety", label: "Safety", isMega: false },
            { id: "support", label: "Support", isMega: false }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.isMega) {
                  setOpenMega(prev => prev === item.id ? null : item.id as any);
                } else {
                  onGetStarted(item.id);
                }
              }}
              className="px-4 py-1.5 rounded-full text-sm font-semibold text-foreground hover:bg-background hover:shadow-sm transition-all"
            >
              {item.label}
            </button>
          ))}
        </div>

        <button 
          onClick={() => onGetStarted("profile")}
          className="group relative overflow-hidden bg-foreground text-background px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-transform hover:scale-105 shadow-xl"
        >
          <span className="relative z-10 flex items-center gap-2">
            My Profile
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
          </span>
        </button>
      </nav>

      {/* ── Hero: Cinematic & Immersive ── */}
      <section className="relative w-full h-[100svh] flex items-end pb-24 px-6 md:px-12 overflow-hidden bg-background">
        
        {/* Video Fallback / Cinematic Background (Responds to light/dark) */}
        <div 
          className="absolute inset-0 w-full h-full transform will-change-transform overflow-hidden"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        >
          <style>{`
            @keyframes slowPan {
              0% { transform: scale(1.0); }
              50% { transform: scale(1.1) translate(-1%, -2%); }
              100% { transform: scale(1.0); }
            }
            .ken-burns {
              animation: slowPan 40s ease-in-out infinite;
            }
          `}</style>
          
          {/* Ongoing Cinematic Image Background */}
          <img 
            src={campusScene} 
            alt="Campus Background" 
            className="absolute inset-0 w-full h-full object-cover ken-burns opacity-70 dark:opacity-40 mix-blend-multiply dark:mix-blend-luminosity" 
          />

          {/* Subtle cinematic gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background/60 to-background z-10 opacity-90" />
          
        </div>

        {/* Hero Content */}
        <div className="relative z-20 w-full max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-12">
          <div className="max-w-4xl pt-32">
            <h1 className="font-display font-black text-[12vw] sm:text-[9vw] leading-[0.85] tracking-tighter uppercase drop-shadow-sm">
              Chemistry,<br />
              <span className="text-primary italic font-light tracking-normal lowercase text-[11vw] sm:text-[8vw] drop-shadow-md">refined.</span>
            </h1>
          </div>
          <div className="max-w-sm pb-4">
            <p className="text-muted-foreground text-sm md:text-base font-medium leading-relaxed mb-8">
              An exclusive, curated network for verified university students. Experience connections built on authenticity, shared ambition, and genuine campus culture.
            </p>
            <button 
              onClick={() => onGetStarted("discover")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-5 font-black text-sm uppercase tracking-widest transition-all hover:scale-105 flex items-center justify-center gap-3 shadow-2xl shadow-primary/25"
            >
              Discover People <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 1: Discover (Asymmetric Editorial) ── */}
      <section className="relative py-32 px-6 md:px-12 max-w-[100rem] mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 lg:col-start-2 relative z-10">
            <p className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-6">01 // The Network</p>
            <h2 className="font-display font-black text-5xl md:text-7xl leading-[0.9] tracking-tighter uppercase mb-8">
              Elevate your<br/>circle.
            </h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed mb-10 max-w-md">
              Step away from the noise of generic swiping. Connect with verified peers who share your academic rigor, lifestyle, and campus footprint.
            </p>
            <div className="space-y-6">
              {[
                { title: "Curated Matching", desc: "Algorithms designed for compatibility, not addiction." },
                { title: "Verified Prestige", desc: "Exclusive access granted only to verified student credentials." }
              ].map((item, i) => (
                <div key={i} className="border-l-2 border-border pl-6">
                  <h4 className="text-foreground font-bold text-sm tracking-wide uppercase mb-1">{item.title}</h4>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 relative h-[70vh] min-h-[600px] w-full mt-16 lg:mt-0">
            {/* 3D layered composition */}
            <div className="absolute inset-0 bg-muted rounded-sm overflow-hidden shadow-2xl border border-border">
              <img src={student1} alt="Editorial portrait" className="w-full h-full object-cover opacity-90 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700" />
            </div>
            
            <div className="absolute -bottom-12 -left-12 w-2/3 h-2/3 bg-background p-3 shadow-2xl border border-border z-20 hidden md:block transition-transform hover:-translate-y-4 duration-500">
              <div className="w-full h-full overflow-hidden bg-muted">
                <img src={student2} alt="Editorial detail" className="w-full h-full object-cover opacity-90 sepia-[0.2]" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Section 2: How It Works (Minimalist Process) ── */}
      <section className="py-20 px-6 md:px-12 border-y border-border bg-secondary/30">
        <div className="max-w-[100rem] mx-auto">
          <div className="mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
            <h2 className="font-display font-black text-5xl md:text-7xl leading-[0.9] tracking-tighter uppercase">
              The Art of<br/>Connection.
            </h2>
            <p className="text-muted-foreground font-medium max-w-xs text-sm uppercase tracking-widest">
              Four curated steps to meaningful interaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-16">
            {[
              { num: "01", title: "Discover", desc: "Immerse yourself in rich, high-fidelity profiles." },
              { num: "02", title: "Signal", desc: "Indicate interest with subtle, intentional gestures." },
              { num: "03", title: "Align", desc: "Experience the thrill of a mutual, verified match." },
              { num: "04", title: "Engage", desc: "Transition to secure, encrypted conversations." },
            ].map((step, i) => (
              <div key={i} className="group relative border-t border-border pt-8 transition-colors hover:border-primary">
                <span className="absolute -top-12 text-[8rem] font-display font-black text-foreground/5 -z-10 transition-colors group-hover:text-primary/10">
                  {step.num}
                </span>
                <h3 className="text-xl font-bold text-foreground uppercase tracking-widest mb-4">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Real Connections (Photo-led Gallery) ── */}
      <section className="py-20 px-6 md:px-12 max-w-[100rem] mx-auto overflow-hidden">
        <div className="text-center mb-12 relative z-10">
          <h2 className="font-display font-black text-5xl md:text-8xl leading-[0.85] tracking-tighter uppercase text-foreground">
            Life, <span className="italic font-light text-muted-foreground lowercase">Captured.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative">
          
          <div className="md:col-span-7 h-[60vh] bg-muted relative group overflow-hidden shadow-2xl border border-border">
            <img src={coupleDate} alt="Coffee Date" className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-8 left-8">
              <p className="text-white font-display font-black text-3xl uppercase tracking-tighter">Coffee Dates</p>
              <p className="text-white/80 text-sm mt-2 font-medium">Meet up, grab a coffee, and see where it goes.</p>
            </div>
          </div>

          <div className="md:col-span-5 h-[60vh] bg-muted relative group overflow-hidden shadow-2xl border border-border">
            <img src={coupleCampus} alt="Campus Meet" className="w-full h-full object-cover opacity-90 transition-all duration-1000 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-8 left-8">
              <p className="text-white font-display font-black text-3xl uppercase tracking-tighter">Campus Walks</p>
              <p className="text-white/80 text-sm mt-2 font-medium">Find someone who matches your energy.</p>
            </div>
          </div>
          
        </div>
      </section>

      {/* ── Section 4: Privacy & Safety (Authoritative) ── */}
      <section className="py-20 bg-secondary/50 border-t border-border">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-6 stroke-[1.5]" />
          <h2 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tighter mb-8">
            Uncompromising Privacy.
          </h2>
          <p className="text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto mb-16 text-sm md:text-base">
            Your data is an asset, not a commodity. We employ strict verification and granular visibility controls to ensure your campus experience remains entirely in your hands.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            {[
              { icon: Lock, title: "Mutual Consent", desc: "Communication channels remain locked until mutual alignment is confirmed." },
              { icon: EyeOff, title: "Granular Control", desc: "Toggle visibility of your course, distance, and online status at will." },
              { icon: ShieldCheck, title: "Active Moderation", desc: "Strict, zero-tolerance enforcement for a respectful ecosystem." }
            ].map((feature, i) => (
              <div key={i} className="border-t border-border pt-6">
                <feature.icon className="w-6 h-6 text-muted-foreground mb-6 stroke-[1.5]" />
                <h3 className="text-foreground font-bold text-sm uppercase tracking-widest mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Final CTA (Striking) ── */}
      <section className="relative py-40 overflow-hidden bg-primary flex items-center justify-center">
        {/* Abstract background elements */}
        <div className="absolute inset-0 bg-black/10 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-foreground/10 via-primary to-primary-foreground/5 z-0" />
        
        <div className="relative z-20 text-center px-6 max-w-4xl">
          <h2 className="font-display font-black text-5xl md:text-8xl leading-[0.85] tracking-tighter uppercase text-primary-foreground mb-8 drop-shadow-md">
            Begin the<br/>Experience.
          </h2>
          <p className="text-primary-foreground/80 text-lg md:text-xl font-light mb-12 max-w-xl mx-auto drop-shadow-sm">
            Join the vanguard of student connections. Your profile awaits.
          </p>
          <button 
            onClick={() => onGetStarted("discover")}
            className="group bg-background text-foreground hover:bg-muted px-12 py-5 font-black text-sm uppercase tracking-[0.2em] transition-transform hover:scale-105 mx-auto flex items-center justify-center gap-4 shadow-2xl"
          >
            Enter Network <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 bg-background text-center border-t border-border">
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
          © {new Date().getFullYear()} Nexora Connect. Verified students only.
        </p>
      </footer>
      {/* ── Mega Menus ── */}
      <MegaMenu
        isOpen={openMega === "discover"}
        onClose={() => setOpenMega(null)}
        title="Explore Discover"
        subtitle="Meet students from across campuses and discover people who share your interests, ambitions, and campus life."
        features={DISCOVER_FEATURES}
      />
      <MegaMenu
        isOpen={openMega === "likes"}
        onClose={() => setOpenMega(null)}
        title="Explore Likes & Matches"
        subtitle="See who is interested, discover mutual connections, and turn a shared interest into a conversation."
        features={LIKES_FEATURES}
      />
      <MegaMenu
        isOpen={openMega === "stories"}
        onClose={() => setOpenMega(null)}
        title="Explore Stories"
        subtitle="Share moments from campus life and discover what is happening across the Nexora community."
        features={STORIES_FEATURES}
      />
    </div>
  );
}
