/**
 * CampusConnectSafety.tsx
 * Situational Visual Storytelling Safety Guide for Nexora Campus Connect.
 */
import { useState, useEffect } from "react";
import {
  ShieldCheck, EyeOff, UserX, Flag, ChevronLeft, X, ArrowRight, AlertTriangle
} from "lucide-react";
import coupleCampus from "@/assets/couple-campus.jpg";
import student1 from "@/assets/student-1.jpg";
import student2 from "@/assets/student-2.jpg";
import student3 from "@/assets/student-3.jpg";
import campusScene from "@/assets/campus-scene.png";

interface SafetyProps {
  onBack?: () => void;
}

interface SafetySituation {
  id: string;
  title: string;
  situation: string;
  action: string;
  detailedSteps: string[];
  tip: string;
  image: string;
  icon: React.ElementType;
  color: string;
}

const SAFETY_SITUATIONS: SafetySituation[] = [
  {
    id: "uncomfortable",
    title: "Block a Connection",
    situation: "Someone makes you uncomfortable",
    action: "You are always in control of who you interact with. If a connection or conversation doesn't feel right, you can block the user.",
    detailedSteps: [
      "Open the person's profile or your chat with them.",
      "Tap the menu icon (⋮) in the top right corner.",
      "Select 'Block' and confirm your choice.",
    ],
    tip: "When you block someone, they are immediately removed from your matches and Discover feed. They are not notified that you blocked them.",
    image: student1,
    icon: ShieldCheck,
    color: "text-blue-500",
  },
  {
    id: "unmatch",
    title: "Unmatch Anytime",
    situation: "You no longer want to interact",
    action: "Not feeling the vibe anymore? You can remove a match at any time, for any reason.",
    detailedSteps: [
      "Open the chat with the specific match.",
      "Tap the menu icon (⋮).",
      "Select 'Unmatch'.",
    ],
    tip: "Unmatching permanently removes the conversation from both of your inboxes. The other person will not be notified; the chat will simply disappear.",
    image: student2,
    icon: UserX,
    color: "text-rose-500",
  },
  {
    id: "report",
    title: "Confidential Reporting",
    situation: "Something feels inappropriate",
    action: "If someone violates our community guidelines, is harassing you, or behaving inappropriately, please report them so our moderation team can take action.",
    detailedSteps: [
      "Tap the flag icon (🚩) on the user's profile or within your chat.",
      "Select the specific reason for your report.",
      "Submit the report. The user will be automatically unmatched and blocked from your view.",
    ],
    tip: "We take all reports seriously. The person you report will never be told that you were the one who reported them.",
    image: student3,
    icon: Flag,
    color: "text-red-500",
  },
  {
    id: "privacy",
    title: "Visibility Controls",
    situation: "Protecting your visibility",
    action: "You choose how much of your profile is visible to others, and when you want to be seen on the Discover feed.",
    detailedSteps: [
      "Navigate to 'My Profile'.",
      "Go to the 'Privacy' settings tab.",
      "Toggle your visibility for specific fields, or pause your Discovery feed entirely.",
    ],
    tip: "Taking a break? Pausing Discovery hides you from new people, but you can still chat with your existing matches.",
    image: campusScene,
    icon: EyeOff,
    color: "text-emerald-500",
  },
];

export function CampusConnectSafety({ onBack }: SafetyProps) {
  const [activeModal, setActiveModal] = useState<SafetySituation | null>(null);

  // Close modal on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveModal(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div className="min-h-full w-full bg-background flex flex-col relative overflow-x-hidden">
      
      {/* ── Standalone Header ── */}
      {onBack && (
        <div className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex items-center pointer-events-none">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-bold tracking-wide uppercase group bg-black/20 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/10 pointer-events-auto"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Safety
          </button>
        </div>
      )}

      {/* ── Cinematic Hero Section ── */}
      <section className="relative w-full h-[70svh] min-h-[500px] flex flex-col justify-end px-6 pb-24 overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 w-full h-full bg-zinc-950">
          <img 
            src={coupleCampus} 
            alt="Students talking safely on campus" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto w-full space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-white/90 text-sm font-bold tracking-wide border border-white/20">
            <ShieldCheck className="w-4 h-4" /> Nexora Trust & Safety
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-8xl font-display font-black tracking-tight text-white leading-[1.05]">
            Your safety comes<br />first, always.
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 font-medium max-w-2xl leading-relaxed">
            Connect with confidence. Know your controls, protect your privacy, and make choices that feel right for you.
          </p>
        </div>
      </section>

      {/* ── Visual Storytelling Guide ── */}
      <section className="w-full py-16 md:py-24 bg-background">
        <div className="max-w-5xl mx-auto px-6 space-y-32">
          
          {/* Situation 1: Block */}
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
            <div className="w-full md:w-1/2 order-2 md:order-1 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Situation</h3>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{SAFETY_SITUATIONS[0].situation}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {SAFETY_SITUATIONS[0].action}
              </p>
              <button 
                onClick={() => setActiveModal(SAFETY_SITUATIONS[0])}
                className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all"
              >
                Learn how to block <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full md:w-1/2 order-1 md:order-2">
              <div className="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-2xl bg-muted">
                <img src={SAFETY_SITUATIONS[0].image} alt="Student using phone" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Situation 2: Unmatch */}
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
            <div className="w-full md:w-1/2">
              <div className="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-2xl bg-muted">
                <img src={SAFETY_SITUATIONS[1].image} alt="Students socializing" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="w-full md:w-1/2 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Situation</h3>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{SAFETY_SITUATIONS[1].situation}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {SAFETY_SITUATIONS[1].action}
              </p>
              <button 
                onClick={() => setActiveModal(SAFETY_SITUATIONS[1])}
                className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all"
              >
                Learn how to unmatch <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Situation 3: Report */}
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
            <div className="w-full md:w-1/2 order-2 md:order-1 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Situation</h3>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{SAFETY_SITUATIONS[2].situation}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {SAFETY_SITUATIONS[2].action}
              </p>
              <button 
                onClick={() => setActiveModal(SAFETY_SITUATIONS[2])}
                className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all"
              >
                Learn how to report <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full md:w-1/2 order-1 md:order-2">
              <div className="relative rounded-[2.5rem] overflow-hidden aspect-video shadow-2xl bg-muted">
                <img src={SAFETY_SITUATIONS[2].image} alt="Student seeking help" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Situation 4: Privacy */}
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
            <div className="w-full md:w-1/2">
              <div className="relative rounded-[2.5rem] overflow-hidden aspect-video shadow-2xl bg-muted">
                <img src={SAFETY_SITUATIONS[3].image} alt="Campus scene" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="w-full md:w-1/2 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Situation</h3>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{SAFETY_SITUATIONS[3].situation}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {SAFETY_SITUATIONS[3].action}
              </p>
              <button 
                onClick={() => setActiveModal(SAFETY_SITUATIONS[3])}
                className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all"
              >
                Learn about privacy controls <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ── Full-Width Guidance Section ── */}
      <section className="w-full py-24 bg-zinc-950 text-white px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight">Meeting someone for the first time?</h2>
          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-3xl mx-auto">
            While Campus Connect requires a verified institutional email, this does not guarantee a person's real-life identity. Always take precautions when taking a connection offline.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-12">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
              <h4 className="font-bold text-lg mb-2 text-white">Meet in Public</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">Always arrange your first meeting in a busy, public place like a campus cafe or library. Never meet at someone's dorm or private residence right away.</p>
            </div>
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
              <h4 className="font-bold text-lg mb-2 text-white">Tell a Friend</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">Before you meet, text a trusted friend your location, who you are meeting, and when you expect to be back.</p>
            </div>
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
              <h4 className="font-bold text-lg mb-2 text-white">Trust Your Gut</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">If something feels off, or the person makes you uncomfortable, leave immediately. You do not owe anyone your time or an explanation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Detailed Same-Page Modal Popup ── */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-background/90 backdrop-blur-md"
            onClick={() => setActiveModal(null)}
          />
          
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border shadow-2xl rounded-3xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full h-56 relative overflow-hidden bg-muted">
              <img src={activeModal.image} alt={activeModal.title} className="w-full h-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
            </div>

            <div className="p-8 md:p-10 -mt-12 relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-background flex items-center justify-center shadow-md border border-border`}>
                  <activeModal.icon className={`w-7 h-7 ${activeModal.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{activeModal.situation}</h3>
                  <h2 className="text-3xl font-black font-display text-foreground">{activeModal.title}</h2>
                </div>
              </div>
              
              <p className="text-lg text-foreground font-medium mb-8 leading-relaxed">
                {activeModal.action}
              </p>

              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">What you can do</h3>
                  <div className="space-y-4">
                    {activeModal.detailedSteps.map((step, index) => (
                      <div key={index} className="flex gap-4 p-4 rounded-xl bg-muted/40 border border-border/50">
                        <div className="w-6 h-6 shrink-0 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <p className="text-foreground font-medium">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Safety Tip
                  </h3>
                  <p className="text-foreground font-medium leading-relaxed">{activeModal.tip}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setActiveModal(null)}
                className="w-full mt-10 py-4 rounded-xl bg-foreground text-background font-bold hover:opacity-90 transition-opacity"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
