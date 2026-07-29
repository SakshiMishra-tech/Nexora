import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Nexora - Privacy Policy" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <section className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm font-black uppercase text-primary">Nexora</p>
        <h1 className="mt-2 font-display text-4xl font-black">Privacy Policy</h1>
        <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 text-sm font-semibold leading-7 text-muted-foreground shadow-soft">
          <p>
            Nexora uses your authentication details and profile information to keep campus features
            personalized and account access secure.
          </p>
          <p>
            We only ask module-specific details when those modules need them. Your core profile,
            activity, and saved preferences should remain under your control.
          </p>
        </div>
      </section>
    </main>
  );
}
