import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Nexora - Terms" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm font-black uppercase text-primary">Nexora</p>
        <h1 className="mt-2 font-display text-4xl font-black">Terms</h1>
        <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 text-sm font-semibold leading-7 text-muted-foreground shadow-soft">
          <p>
            Use Nexora respectfully and only for lawful campus activity. Keep your account details
            accurate, protect your login, and do not misuse marketplace, roommate, notes, projects,
            or community features.
          </p>
          <p>
            Nexora may limit access to accounts or content that harms students, violates campus
            rules, or creates security risk.
          </p>
        </div>
      </section>
    </main>
  );
}
