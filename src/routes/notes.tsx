import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Download, Search, Star, Upload } from "lucide-react";
import { ModuleOnboardingPrompt } from "@/components/ModuleOnboardingPrompt";
import { ModuleAccessBoundary } from "@/components/ModuleAccessControl";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/notes")({
  head: () => ({ meta: [{ title: "Nexora - Notes" }] }),
  component: Notes,
});

const notes = [
  { subject: "DBMS", title: "Normalization cheatsheet", professor: "Prof. Mehra", saves: "412", rating: "4.8", color: "bg-[#fff1a8]" },
  { subject: "CS 201", title: "Hash tables explained", professor: "Dr. Banerjee", saves: "1.2k", rating: "4.9", color: "bg-[#d9f2ff]" },
  { subject: "Math 152", title: "Integration by parts", professor: "Prof. Rao", saves: "631", rating: "4.7", color: "bg-[#e8ddff]" },
  { subject: "Economics", title: "Demand curves quick guide", professor: "Prof. Lin", saves: "254", rating: "4.6", color: "bg-[#ffe1c7]" },
];

const academicFields = [
  { name: "program", label: "Program / Course", placeholder: "B.Tech CSE" },
  { name: "semester", label: "Semester", type: "select", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] },
  { name: "subjects", label: "Current Subjects", placeholder: "DBMS, DSA, Mathematics..." },
  { name: "professorTags", label: "Professor Tags", placeholder: "Prof. Mehra, Dr. Banerjee..." },
] as const;

function Notes() {
  return (
    <ModuleAccessBoundary moduleId="notes">
      <CampusPageShell label="Notes" title="Study notes that feel student-made." subtitle="Upload, discover and save notes by subject, professor, semester and rating." icon={BookOpen}>
      <ModuleOnboardingPrompt
        moduleId="academic-profile"
        setupKeys={["academic", "notes"]}
        eyebrow="Academic setup"
        title="Set academic information"
        description="Notes only needs academic details that improve subject, semester, and professor recommendations."
        fields={academicFields}
      />
      <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-border bg-card p-3 shadow-soft sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2">
          <Search className="h-4 w-4 text-primary" />
          <input className="flex-1 bg-transparent text-sm outline-none" placeholder="Search DBMS, CSE, Prof. Mehra..." />
        </div>
        <button className="inline-flex items-center justify-center gap-2 bg-foreground px-4 py-3 text-sm font-black text-background">
          <Upload className="h-4 w-4" />
          Upload notes
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {notes.map((note, index) => (
          <article key={note.title} className={`paper-lift border border-border p-4 ${note.color} ${index % 2 ? "rotate-1" : "-rotate-1"}`}>
            <span className="bg-foreground px-2 py-1 text-[10px] font-black uppercase text-background">{note.subject}</span>
            <h2 className="mt-4 min-h-[70px] font-display text-2xl font-black leading-tight">{note.title}</h2>
            <p className="text-sm font-bold text-muted-foreground">{note.professor}</p>
            <div className="mt-4 space-y-1">
              {[82, 65, 91, 54].map((line) => <span key={line} className="block h-1.5 bg-foreground/15" style={{ width: `${line}%` }} />)}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" />{note.saves}</span>
              <span className="flex items-center gap-1 text-warm"><Star className="h-3.5 w-3.5 fill-current" />{note.rating}</span>
            </div>
          </article>
        ))}
      </div>
      </CampusPageShell>
    </ModuleAccessBoundary>
  );
}

function CampusPageShell({ label, title, subtitle, icon: Icon, children }: { label: string; title: string; subtitle: string; icon: typeof BookOpen; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="commons-wall mb-5 border border-border p-5 shadow-soft">
          <span className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary"><Icon className="h-4 w-4" />{label}</span>
          <h1 className="mt-3 font-display text-4xl font-black sm:text-6xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-muted-foreground sm:text-base">{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
