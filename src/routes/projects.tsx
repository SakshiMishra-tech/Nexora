import { createFileRoute } from "@tanstack/react-router";
import { Code2, Plus, Users, Wrench } from "lucide-react";
import { ModuleOnboardingPrompt } from "@/components/ModuleOnboardingPrompt";
import { ModuleAccessBoundary } from "@/components/ModuleAccessControl";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Nexora - Projects" }] }),
  component: Projects,
});

const projects = [
  { title: "Hostel food review app", stack: "React + Node + MongoDB", need: "Backend dev", status: "Prototype" },
  { title: "Campus lost-item matcher", stack: "Next.js + PostgreSQL", need: "UI designer", status: "MVP" },
  { title: "Notes OCR search engine", stack: "Python + Express", need: "ML teammate", status: "Idea" },
];

const freelancerFields = [
  { name: "primaryRole", label: "Primary Role", type: "select", options: ["Frontend", "Backend", "Full-stack", "Designer", "ML / Data", "Product"] },
  { name: "skills", label: "Skills", placeholder: "React, Node, Python, Figma..." },
  { name: "availability", label: "Availability", type: "select", options: ["Weekends", "Evenings", "5-10 hrs/week", "10+ hrs/week"] },
  { name: "portfolio", label: "Portfolio / GitHub", placeholder: "https://github.com/..." },
  { name: "projectBio", label: "Project Bio", type: "textarea", placeholder: "What kind of student projects do you want to join?" },
] as const;

function Projects() {
  return (
    <ModuleAccessBoundary moduleId="projects">
      <CampusPageShell label="Projects" title="A full-stack friendly project board." subtitle="Post ideas, find teammates, show stack, track MVP status and make Nexora feel like a real product." icon={Wrench}>
      <ModuleOnboardingPrompt
        moduleId="student-projects"
        setupKeys={["freelancer", "projects"]}
        eyebrow="Freelancer setup"
        title="Set freelancer information"
        description="Student Projects only asks for your role, skills, and availability so teams know how to work with you."
        fields={freelancerFields}
      />
      <div className="mb-4 flex justify-end">
        <button className="inline-flex items-center gap-2 bg-foreground px-4 py-3 text-sm font-black text-background"><Plus className="h-4 w-4" /> Post project</button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {projects.map((project) => (
          <article key={project.title} className="paper-lift border border-border bg-card p-4">
            <span className="inline-flex items-center gap-2 bg-primary/10 px-2 py-1 text-[10px] font-black uppercase text-primary"><Code2 className="h-3.5 w-3.5" />{project.status}</span>
            <h2 className="mt-4 font-display text-2xl font-black">{project.title}</h2>
            <p className="mt-2 text-sm font-bold text-muted-foreground">{project.stack}</p>
            <div className="mt-4 flex items-center gap-2 border border-border bg-background p-3 text-sm font-black">
              <Users className="h-4 w-4 text-success" />
              Looking for: {project.need}
            </div>
          </article>
        ))}
      </div>
      </CampusPageShell>
    </ModuleAccessBoundary>
  );
}

function CampusPageShell({ label, title, subtitle, icon: Icon, children }: { label: string; title: string; subtitle: string; icon: typeof Wrench; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="commons-wall mb-5 border border-border p-5 shadow-soft">
          <span className="inline-flex items-center gap-2 bg-secondary px-3 py-1 text-xs font-black uppercase text-primary"><Icon className="h-4 w-4" />{label}</span>
          <h1 className="mt-3 font-display text-4xl font-black sm:text-6xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-muted-foreground sm:text-base">{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
