import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  HelpCircle,
  ChevronLeft,
  ShieldCheck,
  AlertTriangle,
  Mail,
  FileText,
  MessageSquare,
  ChevronRight,
  Info,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { NexoraLogo } from "@/components/brand/NexoraLogo";

export const Route = createFileRoute("/marketplace_/help")({
  head: () => ({ meta: [{ title: "Nexora — Marketplace Help Center" }] }),
  component: HelpCenterPage,
});

type HelpSection = "faqs" | "safety" | "rules" | "support";

function HelpCenterPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HelpSection>("faqs");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Report Issue Form State
  const [reportForm, setReportForm] = useState({
    listingTitle: "",
    sellerName: "",
    issueType: "Misrepresentation",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.listingTitle || !reportForm.description) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      toast.success("Issue reported successfully! Our team will review it within 24 hours.");
      setReportForm({
        listingTitle: "",
        sellerName: "",
        issueType: "Misrepresentation",
        description: "",
      });
      setIsSubmitting(false);
    }, 1000);
  };

  const faqs = [
    {
      q: "How do I buy something?",
      a: "Browse listings, click on an item you like, and click the 'Message Seller' button. This opens a chat with the seller where you can ask questions, negotiate the price, and coordinate a pickup location on campus.",
    },
    {
      q: "Is it safe to meet sellers?",
      a: "Yes, as long as you follow standard safety protocols. Always meet in well-lit public campus locations (e.g., library lobby, canteen, academic block). Never meet off-campus or go to a private residence/hostel room alone.",
    },
    {
      q: "Can I negotiate the price?",
      a: "Yes, many sellers are open to offers. If the listing is marked as negotiable, you can use the 'Make Offer' button in the chat or negotiate directly through messages.",
    },
    {
      q: "How do I list an item for sale?",
      a: "Switch to 'Sell Mode' in the top bar, click the 'New Listing' button, fill in the details (title, description, price, condition, images), and publish. It will immediately be visible to other students.",
    },
    {
      q: "Are payments handled on Nexora?",
      a: "No, Nexora is a discovery and chat platform. Payments are handled directly between buyers and sellers in person. We recommend using UPI (GPay, PhonePe, Paytm) after verifying the item condition in person.",
    },
    {
      q: "What should I do if an item is misrepresented or fake?",
      a: "Do not buy the item. Go to the Support tab here in the Help Center and file a report with the listing title and seller name. We review all reports within 24 hours and take strict action against violators.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-foreground font-sans">
      {/* ── TOPBAR ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 sm:px-6 bg-[#030712] border-b border-border/50">
        <Link to="/marketplace" className="focus:outline-none rounded-xl">
          <NexoraLogo size="sm" />
        </Link>
        <span className="text-muted-foreground/30 mx-3">|</span>
        <span className="text-sm font-bold text-foreground">Help Center</span>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Back navigation */}
        <div className="mb-8">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center md:text-left mb-10 space-y-2">
          <h1 className="font-display text-3xl font-black text-foreground">How can we help?</h1>
          <p className="text-sm text-muted-foreground">
            Get support, review campus safety guidelines, or report an issue.
          </p>
        </div>

        {/* Tabbed Navigation */}
        <div className="flex border-b border-border/30 mb-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2">
            {[
              { id: "faqs", label: "FAQs", icon: HelpCircle },
              { id: "safety", label: "Safety Tips", icon: ShieldCheck },
              { id: "rules", label: "Marketplace Rules", icon: FileText },
              { id: "support", label: "Support & Report", icon: AlertTriangle },
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as HelpSection)}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all border-b-2 -mb-px whitespace-nowrap ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* FAQs TAB */}
          {activeTab === "faqs" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground mb-4">Frequently Asked Questions</h2>
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/50">
                {faqs.map((faq, i) => {
                  const isOpen = openFaq === i;
                  return (
                    <div key={i} className="bg-card/30">
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        className="flex items-center justify-between w-full px-5 py-4.5 text-left transition-colors hover:bg-secondary/10"
                      >
                        <span className="text-sm font-bold text-foreground pr-4">{faq.q}</span>
                        <ChevronRight
                          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                            isOpen ? "rotate-90 text-foreground" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed animate-in fade-in duration-200">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SAFETY TIPS TAB */}
          {activeTab === "safety" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-foreground">In-Person Safety Guidelines</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nexora is built exclusively for your college campus to keep transactions secure and localized, but it is always important to practice safe trading:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: "Meet in Public Campus Areas",
                    desc: "Arrange to meet in well-populated campus spots like the central canteen, library entrance, college plaza, or student union lobby."
                  },
                  {
                    title: "Bring a Friend",
                    desc: "Whenever possible, take a classmate or friend with you to the meetup. It ensures extra security and provides a second opinion on the item."
                  },
                  {
                    title: "Inspect the Item Thoroughly",
                    desc: "Do not rush. Take your time to test electronics, check pages of books, or examine the physical condition before paying."
                  },
                  {
                    title: "No Advance Payments",
                    desc: "Never send money via UPI before meeting the seller and seeing the item. Genuine campus sellers will never demand advance deposits."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="rounded-2xl border border-border/40 bg-card/25 p-5 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MARKETPLACE RULES TAB */}
          {activeTab === "rules" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-foreground">Campus Marketplace Rules</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To maintain a safe and friendly ecosystem, all Nexora users must strictly adhere to the following community guidelines:
              </p>
              <div className="space-y-4">
                {[
                  {
                    title: "1. Verified Campus Membership Only",
                    desc: "Only registered students, faculty, or staff members of this institution are permitted to trade. Transferring or sharing accounts is strictly prohibited."
                  },
                  {
                    title: "2. No Prohibited or Illegal Items",
                    desc: "You may only list academic items, daily use electronics, room essentials, bicycles, etc. No weapons, alcohol, drugs, prescription medication, or adult items are allowed."
                  },
                  {
                    title: "3. Transparent and Fair Pricing",
                    desc: "Prices must be clear and reasonable. Misleading prices (e.g. listing a premium laptop for ₹1 to gain attention) will result in item removal and account suspension."
                  },
                  {
                    title: "4. No Spam or Off-Topic Listings",
                    desc: "Do not create multiple duplicate listings for the same item. Any listing that is not a tangible good or an educational service will be flagged as spam."
                  }
                ].map((rule, idx) => (
                  <div key={idx} className="border-l-2 border-primary/50 pl-4 py-1 space-y-1">
                    <h3 className="text-sm font-bold text-foreground">{rule.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{rule.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUPPORT & REPORT TAB */}
          {activeTab === "support" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Report Form */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-lg font-bold text-foreground">Report an Issue</h2>
                <form onSubmit={handleReportSubmit} className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Listing Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cycle, DSA Textbook"
                      value={reportForm.listingTitle}
                      onChange={e => setReportForm(f => ({ ...f, listingTitle: e.target.value }))}
                      className="w-full rounded-xl border border-border/80 bg-background/50 px-4 py-2.5 text-sm font-semibold placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Seller Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sakshi Mishra"
                        value={reportForm.sellerName}
                        onChange={e => setReportForm(f => ({ ...f, sellerName: e.target.value }))}
                        className="w-full rounded-xl border border-border/80 bg-background/50 px-4 py-2.5 text-sm font-semibold placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Issue Type
                      </label>
                      <select
                        value={reportForm.issueType}
                        onChange={e => setReportForm(f => ({ ...f, issueType: e.target.value }))}
                        className="w-full rounded-xl border border-border/80 bg-background/50 px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        <option>Misrepresentation</option>
                        <option>Overpricing / Scam</option>
                        <option>Prohibited Item</option>
                        <option>Harassment / Abusive behavior</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Description of Issue *
                    </label>
                    <textarea
                      placeholder="Please explain the issue in detail..."
                      rows={4}
                      value={reportForm.description}
                      onChange={e => setReportForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full rounded-xl border border-border/80 bg-background/50 px-4 py-2.5 text-sm font-semibold placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-full bg-foreground text-background py-3 text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-55"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </button>
                </form>
              </div>

              {/* Direct Support */}
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-foreground">Direct Support</h2>
                
                <div className="rounded-2xl border border-border/40 bg-card/20 p-5 space-y-4">
                  <div className="flex gap-3">
                    <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Email Support</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Send detailed inquiries or proof documents to:
                      </p>
                      <a href="mailto:support@nexora.edu" className="text-xs text-primary font-bold hover:underline block mt-1">
                        support@nexora.edu
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-3 border-t border-border/30 pt-4">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Support Hours</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Our moderation team is active:
                      </p>
                      <p className="text-xs text-foreground font-semibold mt-1">
                        Mon – Fri: 9:00 AM – 6:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
