import { X, RotateCcw, Check, SlidersHorizontal, ArrowUpDown, Sparkles, MapPin, CalendarDays, BadgeIndianRupee } from "lucide-react";
import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CONDITIONS,
  MARKETPLACE_SORTS,
  initialFilters,
} from "@/lib/marketplace";
import type { MarketplaceFilters, MarketplaceCategory, MarketplaceCondition } from "@/lib/marketplace";

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  filters: MarketplaceFilters;
  onFilterChange: (f: MarketplaceFilters) => void;
}

const CAMPUSES = ["All", "Main Campus", "North Campus", "South Campus", "East Campus", "West Campus"];
const POSTED_WITHIN = [
  { value: "any", label: "All" },
  { value: "today", label: "Today" },
  { value: "last7days", label: "Last 7 Days" },
] as const;

export function FilterDrawer({ open, onOpenChange, filters, onFilterChange }: FilterDrawerProps) {
  const [local, setLocal] = useState<MarketplaceFilters>(filters);
  const [price, setPrice] = useState([filters.minPrice, filters.maxPrice]);

  useEffect(() => {
    setLocal(filters);
    setPrice([filters.minPrice, filters.maxPrice]);
  }, [filters]);

  const handleReset = () => {
    setLocal({ ...initialFilters, query: filters.query });
    setPrice([initialFilters.minPrice, initialFilters.maxPrice]);
  };

  const handleApply = () => {
    onFilterChange({ ...local, minPrice: price[0], maxPrice: price[1] });
    onOpenChange(false);
  };

  const toggleCategory = (item: "All" | MarketplaceCategory) => {
    setLocal((current) => {
      if (item === "All") return { ...current, category: [] };
      return {
        ...current,
        category: current.category.includes(item)
          ? current.category.filter((value) => value !== item)
          : [...current.category, item],
      };
    });
  };

  const toggleCondition = (item: "All" | MarketplaceCondition) => {
    setLocal((current) => {
      if (item === "All") return { ...current, condition: [] };
      return {
        ...current,
        condition: current.condition.includes(item)
          ? current.condition.filter((value) => value !== item)
          : [...current.condition, item],
      };
    });
  };

  const toggleCampus = (item: string) => {
    setLocal((current) => {
      if (item === "All") return { ...current, campus: [] };
      return {
        ...current,
        campus: current.campus.includes(item)
          ? current.campus.filter((value) => value !== item)
          : [...current.campus, item],
      };
    });
  };

  const activeCount = [
    local.category.length > 0,
    local.condition.length > 0,
    local.campus.length > 0,
    local.datePosted !== "any",
    price[0] > 0 || price[1] < 60000,
    local.sort !== "Newest",
    local.isNegotiable,
  ].filter(Boolean).length;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div className="absolute inset-0 bg-foreground/25 backdrop-blur-sm" />

      <aside className="relative flex h-full w-full flex-col overflow-hidden border-l border-border bg-paper shadow-glow animate-in slide-in-from-right duration-300 sm:max-w-[460px]">
        <header className="border-b border-border bg-card px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Marketplace Filters
              </div>
              <h2 className="mt-2 font-display text-2xl font-black">Refine listings</h2>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                Mix filters freely. All clears that section.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-soft transition hover:bg-secondary hover:text-foreground"
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <FilterSection icon={<ArrowUpDown className="h-4 w-4" />} title="Sort">
            <div className="grid gap-2">
              {MARKETPLACE_SORTS.map((sort) => (
                <OptionButton
                  key={sort}
                  active={local.sort === sort}
                  label={sort}
                  onClick={() => setLocal((current) => ({ ...current, sort }))}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection icon={<Sparkles className="h-4 w-4" />} title="Condition">
            <div className="flex flex-wrap gap-2">
              <Pill active={local.condition.length === 0} label="All" onClick={() => toggleCondition("All")} />
              {MARKETPLACE_CONDITIONS.map((condition) => (
                <Pill
                  key={condition}
                  active={local.condition.includes(condition)}
                  label={condition}
                  onClick={() => toggleCondition(condition)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection icon={<BadgeIndianRupee className="h-4 w-4" />} title="Price Range">
            <div className="rounded-2xl border border-border bg-background p-4 shadow-soft">
              <Slider min={0} max={60000} step={500} value={price} onValueChange={setPrice} />
              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <PriceBox label="Min" value={price[0]} />
                <span className="h-px w-5 bg-border" />
                <PriceBox label="Max" value={price[1]} />
              </div>
            </div>
          </FilterSection>

          <FilterSection icon={<SlidersHorizontal className="h-4 w-4" />} title="Categories">
            <div className="flex flex-wrap gap-2">
              <Pill active={local.category.length === 0} label="All" onClick={() => toggleCategory("All")} />
              {MARKETPLACE_CATEGORIES.map((category) => (
                <Pill
                  key={category}
                  active={local.category.includes(category)}
                  label={category}
                  onClick={() => toggleCategory(category)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection icon={<Check className="h-4 w-4" />} title="Negotiable">
            <button
              type="button"
              onClick={() => setLocal((current) => ({ ...current, isNegotiable: !current.isNegotiable }))}
              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 ${
                local.isNegotiable
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:border-primary/30"
              }`}
            >
              <span>
                <span className="block text-sm font-black">Negotiable listings only</span>
                <span className="text-xs font-semibold text-muted-foreground">Good when you want room to bargain.</span>
              </span>
              <span className={`grid h-6 w-6 place-items-center rounded-full border ${local.isNegotiable ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
                {local.isNegotiable && <Check className="h-3.5 w-3.5" />}
              </span>
            </button>
          </FilterSection>

          <FilterSection icon={<MapPin className="h-4 w-4" />} title="Campus">
            <div className="grid grid-cols-2 gap-2">
              {CAMPUSES.map((campus) => (
                <Pill
                  key={campus}
                  active={campus === "All" ? local.campus.length === 0 : local.campus.includes(campus)}
                  label={campus}
                  onClick={() => toggleCampus(campus)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection icon={<CalendarDays className="h-4 w-4" />} title="Posted Within">
            <div className="grid grid-cols-3 gap-2">
              {POSTED_WITHIN.map((option) => (
                <Pill
                  key={option.value}
                  active={local.datePosted === option.value}
                  label={option.label}
                  onClick={() => setLocal((current) => ({ ...current, datePosted: option.value }))}
                />
              ))}
            </div>
          </FilterSection>
        </div>

        <footer className="border-t border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between text-xs font-black text-muted-foreground">
            <span>{activeCount} active filter{activeCount === 1 ? "" : "s"}</span>
            <button type="button" onClick={handleReset} className="inline-flex items-center gap-1 text-foreground transition hover:text-primary">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
          <div className="grid grid-cols-[0.8fr_1.2fr] gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-background text-sm font-black transition hover:bg-secondary"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-black text-background shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow"
            >
              <Check className="h-4 w-4" />
              Apply Filters
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}

function FilterSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border py-4 last:border-b-0">
      <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-primary">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  );
}

function OptionButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center justify-between rounded-2xl border px-3 text-sm font-black shadow-soft transition-all hover:-translate-y-0.5 ${
        active ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground hover:border-primary/35"
      }`}
    >
      {label}
      {active && <Check className="h-4 w-4" />}
    </button>
  );
}

function Pill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-3 text-sm font-black shadow-soft transition-all hover:-translate-y-0.5 ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-muted-foreground hover:border-primary/35 hover:text-foreground"
      }`}
    >
      {active && <Check className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

function PriceBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-2 text-center">
      <p className="text-[10px] font-black uppercase text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-black">₹{value.toLocaleString("en-IN")}</p>
    </div>
  );
}
